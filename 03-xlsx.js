/* =====================================================================
   Excel (.xlsx) — leitura e gravação sem bibliotecas externas
   ===================================================================== */
const XLSX = (() => {
  const td = new TextDecoder();
  async function inflate(u8) {
    const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  function unzipIndex(buf) {
    const dv = new DataView(buf); let e = buf.byteLength - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('Arquivo não é um .xlsx válido');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
      const name = td.decode(new Uint8Array(buf, p + 46, nl)); p += 46 + nl + xl + cl;
      const lnl = dv.getUint16(lho + 26, true), lxl = dv.getUint16(lho + 28, true);
      files[name] = { method, raw: new Uint8Array(buf, lho + 30 + lnl + lxl, csize) };
    }
    return files;
  }
  async function text(files, name) {
    name = name.replace(/^\//, '');
    const f = files[name]; if (!f) return null;
    return td.decode(f.method === 0 ? f.raw : await inflate(f.raw));
  }
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const tags = (el, t) => [...el.getElementsByTagNameNS('*', t)];
  const colIdx = ref => { const m = ref.match(/^[A-Z]+/)[0]; let n = 0; for (const ch of m) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

  /** lê um .xlsx → { nomeDaAba: [[...linha], ...] } */
  async function read(buf) {
    const files = unzipIndex(buf);
    const wb = xml(await text(files, 'xl/workbook.xml'));
    const rels = xml(await text(files, 'xl/_rels/workbook.xml.rels'));
    const relMap = {}; tags(rels, 'Relationship').forEach(r => relMap[r.getAttribute('Id')] = r.getAttribute('Target'));
    const ssTxt = await text(files, 'xl/sharedStrings.xml');
    const ss = ssTxt ? tags(xml(ssTxt), 'si').map(si => tags(si, 't').map(t => t.textContent).join('')) : [];
    const out = {};
    for (const sh of tags(wb, 'sheet')) {
      const rid = sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sh.getAttribute('r:id');
      let target = relMap[rid] || ''; target = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
      const sx = await text(files, target); if (!sx) continue;
      const rows = [];
      for (const row of tags(xml(sx), 'row')) {
        const ri = +row.getAttribute('r') - 1; const arr = [];
        for (const c of tags(row, 'c')) {
          const ref = c.getAttribute('r'), t = c.getAttribute('t');
          const vEl = tags(c, 'v')[0]; let v = vEl ? vEl.textContent : null;
          if (t === 's') v = ss[+v] ?? '';
          else if (t === 'inlineStr') v = tags(c, 't').map(x => x.textContent).join('');
          else if (t === 'b') v = v === '1';
          else if (t === 'str' || t === 'e') v = v ?? '';
          else if (v !== null && v !== '') v = +v;
          arr[ref ? colIdx(ref) : arr.length] = v;
        }
        rows[ri] = arr;
      }
      out[sh.getAttribute('name')] = Array.from(rows, r => r || []);
    }
    return out;
  }

  /* ---------- gravação ---------- */
  const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(entries) { // entries: [{name, data:Uint8Array}] — armazenado (sem compressão)
    const te = new TextEncoder(); const chunks = []; const central = []; let off = 0;
    for (const e of entries) {
      const nm = te.encode(e.name), crc = crc32(e.data), sz = e.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
      chunks.push(new Uint8Array(lh.buffer), nm, e.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + sz;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  /** sheets: [{name, title?, subtitle?, headers:[], types:[], rows:[[]]}] */
  function write(sheets) {
    const te = new TextEncoder(); const files = [];
    const safe = []; sheets.forEach(s => { let n = s.name.replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31); while (safe.includes(n)) n = n.slice(0, 29) + '_' + safe.length; safe.push(n); });
    files.push({ name: '[Content_Types].xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`) });
    files.push({ name: '_rels/.rels', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) });
    files.push({ name: 'xl/workbook.xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safe.map((n, i) => `<sheet name="${x(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><definedNames>${sheets.map((s, i) => s.rows.length ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(safe[i]).replace(/'/g, "''")}'!$A$${s.title ? 3 : 1}:$${colName(s.headers.length - 1)}$${(s.title ? 3 : 1) + s.rows.length}</definedName>` : '').join('')}</definedNames></workbook>`) });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) });
    // estilos: 0 normal, 1 cabeçalho, 2 moeda, 3 título, 4 subtítulo, 5 texto com quebra
    files.push({ name: 'xl/styles.xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/></numFmts><fonts count="4"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF14203A"/><name val="Calibri"/></font><font><i/><sz val="9"/><color rgb="FF6B6F7B"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF14203A"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="thin"><color rgb="FFE7E0D2"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="6"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="164" borderId="1" applyNumberFormat="1" applyBorder="1"/><xf fontId="2" applyFont="1"/><xf fontId="3" applyFont="1"/><xf borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`) });
    sheets.forEach((s, i) => {
      const start = s.title ? 3 : 1; let rowsXml = '';
      if (s.title) rowsXml += `<row r="1"><c r="A1" t="inlineStr" s="3"><is><t>${x(s.title)}</t></is></c></row><row r="2"><c r="A2" t="inlineStr" s="4"><is><t>${x(s.subtitle || '')}</t></is></c></row>`;
      rowsXml += `<row r="${start}" ht="30" customHeight="1">${s.headers.map((h, ci) => `<c r="${colName(ci)}${start}" t="inlineStr" s="1"><is><t>${x(h)}</t></is></c>`).join('')}</row>`;
      s.rows.forEach((r, ri) => {
        const rn = start + 1 + ri;
        rowsXml += `<row r="${rn}">${r.map((v, ci) => {
          if (v === null || v === undefined || v === '') return '';
          const ref = colName(ci) + rn, ty = s.types?.[ci];
          if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${ty === 'money' ? ' s="2"' : ' s="5"'}><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr" s="5"><is><t xml:space="preserve">${x(v)}</t></is></c>`;
        }).join('')}</row>`;
      });
      const widths = s.headers.map((h, ci) => { const L = Math.max(h.length, ...s.rows.slice(0, 200).map(r => String(r[ci] ?? '').length)); return Math.min(60, Math.max(10, L * 0.95)); });
      const last = colName(s.headers.length - 1) + (start + s.rows.length);
      files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${start}" topLeftCell="A${start + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, ci) => `<col min="${ci + 1}" max="${ci + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join('')}</cols><sheetData>${rowsXml}</sheetData>${s.rows.length ? `<autoFilter ref="A${start}:${last}"/>` : ''}</worksheet>`) });
    });
    return zip(files);
  }
  /** descompacta um .zip → [{name, data:Uint8Array}] */
  async function unzip(buf) {
    const files = unzipIndex(buf), out = [];
    for (const [name, f] of Object.entries(files)) { if (name.endsWith('/')) continue; out.push({ name, data: f.method === 0 ? f.raw : await inflate(f.raw) }); }
    return out;
  }
  return { read, write, unzip };
})();

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
