/* =====================================================================
   CUSTOS SUPERVENIENTES — notas fiscais de gastos extraordinários
   (reembolso, reequilíbrio econômico-financeiro, repactuação) por contrato,
   e o RELATÓRIO DE AUDITORIA DO CONTRATO, com cópia das notas.
   ===================================================================== */
const Superv = {
  ABERTOS: /an[aá]lise|apresentado/i,
  lista: (e, c) => DB.where('supervenientes', r => r.empresaId === e.id && r.contrato === c.codigo).sort((a, b) => String(a.dataEmissao || '').localeCompare(String(b.dataEmissao || ''))),
  tom: s => /pago|^deferido$/i.test(s || '') ? 'good' : /parcial/i.test(s || '') ? 'info' : /indefer/i.test(s || '') ? 'critical' : /apresent/i.test(s || '') ? 'info' : 'warn',

  /** conferências automáticas de cada comprovante */
  alertas(r, c, e) {
    const a = [], d = isISO(r.dataEmissao) ? r.dataEmissao : null;
    if (!num(r.valor)) a.push('sem valor');
    if (!d) a.push('sem data de emissão');
    else { if (isISO(c.inicio) && d < c.inicio) a.push('emitida antes do início do contrato'); if (isISO(c.fim) && d > c.fim) a.push('emitida após o fim da vigência'); }
    const cnpjC = onlyDigits(e.cnpj);
    if (cnpjC && onlyDigits(r.cnpjDestinatario) && onlyDigits(r.cnpjDestinatario).slice(0, 8) !== cnpjC.slice(0, 8)) a.push('destinatário com CNPJ diferente da contratada');
    if (onlyDigits(r.cnpjEmitente) && cnpjC && onlyDigits(r.cnpjEmitente).slice(0, 8) === cnpjC.slice(0, 8)) a.push('emitida pela própria contratada');
    if (num(r.valor) && DB.where('supervenientes', x => x.id !== r.id && x.empresaId === r.empresaId && x.dataEmissao === r.dataEmissao && num(x.valor) === num(r.valor) && onlyDigits(x.cnpjEmitente) === onlyDigits(r.cnpjEmitente) && norm(x.numero) !== norm(r.numero)).length) a.push('outra nota do mesmo emitente, data e valor — conferir se não é compra em dobro');
    if (r.numero && DB.where('supervenientes', x => x.id !== r.id && x.empresaId === r.empresaId && norm(x.numero) === norm(r.numero) && onlyDigits(x.cnpjEmitente) === onlyDigits(r.cnpjEmitente)).length) a.push('possível duplicidade (mesmo número e emitente)');
    if (!r.justificativa) a.push('sem justificativa');
    if (r.iaObs) a.push(r.iaObs);
    return a;
  },
  totais(l) {
    const soma = f => l.reduce((s, r) => s + (num(f(r)) || 0), 0);
    return { pedido: soma(r => r.valor), deferido: soma(r => /deferido|pago/i.test(r.status || '') && !/indefer/i.test(r.status || '') ? (num(r.valorDeferido) ?? num(r.valor)) : 0), pago: soma(r => /pago/i.test(r.status || '') ? (num(r.valorDeferido) ?? num(r.valor)) : 0), analise: soma(r => Superv.ABERTOS.test(r.status || 'Em análise') ? r.valor : 0) };
  },

  /** seção na ficha do contrato */
  html(e, c) {
    const l = Superv.lista(e, c), T = Superv.totais(l);
    return `<h4 class="sec">Custos supervenientes <span class="count">${l.length}</span><span class="sp"></span><button type="button" class="btn primary xs" id="svAdd">${icon('upload')} Juntar notas fiscais</button></h4>
      <p class="muted small">Notas fiscais e comprovantes de gastos extraordinários ou imprevisíveis, não cobertos pelo contrato, para pedir reembolso, reequilíbrio ou repactuação à Administração.</p>
      ${l.length ? `<div class="sv-tot"><span>Documentos <b>${l.length}</b></span><span>Valor total <b>${esc(fmtMoney(T.pedido))}</b></span><span class="x">Pedido <b>${esc(fmtMoney(T.pedido))}</b></span><span>Em análise <b>${esc(fmtMoney(T.analise))}</b></span><span>Deferido <b>${esc(fmtMoney(T.deferido))}</b></span><span>Pago <b>${esc(fmtMoney(T.pago))}</b></span></div>
      <div class="table-wrap"><table class="mini sv-t"><thead><tr><th>Data</th><th>Documento</th><th>Emitente</th><th>Anotação / conferência</th><th class="r">Valor</th><th>Natureza</th><th>Situação</th><th></th></tr></thead><tbody>
      ${l.map(r => { const al = Superv.alertas(r, c, e); return `<tr data-sv="${r.id}"><td>${esc(fmtDate(r.dataEmissao) || '—')}</td><td>${esc(r.tipoDoc || '')} ${esc(r.numero || '')}${r.link ? ` <a href="${esc(r.link)}" target="_blank" rel="noopener" class="link small" onclick="event.stopPropagation()">abrir</a>` : ''}</td><td>${esc(r.emitente || '—')}</td><td class="wrap">${esc([r.anotacao && '✍ ' + r.anotacao, r.descricao].filter(Boolean).join(' · ') || '—')}${al.length ? `<br>${al.map(x => `<span class="sv-al">${icon('alert')} ${esc(x)}</span>`).join(' ')}` : ''}</td><td class="r mono">${esc(fmtMoney(r.valor) || '—')}</td><td><small>${esc((r.natureza || '').split(' (')[0])}</small></td><td><span class="pill ${Superv.tom(r.status)}">${esc(r.status || 'Em análise')}</span></td><td>${icon('edit')}</td></tr>`; }).join('')}
      </tbody></table></div>` : ''}`;
  },
  bind(m, e, c) {
    $('#svAdd', m)?.addEventListener('click', () => Superv.dialog(e, c));
    $('#svRel', m)?.addEventListener('click', () => Superv.relatorioDialog(e, c));
    $$('[data-sv]', m).forEach(tr => tr.onclick = () => UI.editRecord('supervenientes', DB.get('supervenientes', tr.dataset.sv), { ctx: { empresaId: e.id }, voltar: () => Consult.contrato360(e, DB.get('contratos', c.id) || c) }));
  },

  /* ---------- juntar notas ---------- */
  dialog(e, c) {
    const nat = SCHEMAS.supervenientes.fields.find(f => f.k === 'natureza').opts;
    const m = UI.modal({ title: 'Juntar notas fiscais e comprovantes', sub: `${esc(c.codigo)} · ${esc(c.unidade || c.tomador || '')}`, wide: true, body: `
      <div class="drop" id="svDrop">${icon('upload')}<b>Arraste aqui as notas fiscais</b><span>PDF (pode ter várias notas, escaneadas), fotos ou o XML da NF-e. O arquivo vai para o Drive do escritório e a IA separa as notas e lê de cada uma só o essencial: número, data, emitente, valor total e a anotação à mão (local/contrato). Depois você confere e indica o contrato de cada uma.</span><div class="btn-row center"><label class="btn ghost sm">Escolher arquivos<input type="file" id="svF" multiple hidden accept=".pdf,.xml,image/*"></label></div></div>
      <ul class="dfiles" id="svList"></ul>
      <form class="grid-form" id="svf"><div class="fld"><label>Natureza do pedido</label><select name="nat">${nat.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="fld"><label>Situação</label><select name="st">${SCHEMAS.supervenientes.fields.find(f => f.k === 'status').opts.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="fld full"><label>Justificativa (vale para as notas deste envio; dá para ajustar uma a uma depois)</label><textarea name="jus" rows="3" placeholder="Ex.: compras de EPIs e gêneros para cestas básicas exigidas pela CCT 2026, não previstas na planilha de custos…"></textarea></div></form>`,
      foot: `<span class="muted small" id="svN"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="svGo" disabled>${icon('sparkle')} Juntar e ler</button>` });
    let files = [];
    const draw = () => { $('#svList', m).innerHTML = files.map(x => `<li><span>${icon('file')} ${esc(x.f.name)}</span><small class="${x.cls || ''}">${esc(x.st || '')}</small></li>`).join(''); $('#svN', m).textContent = files.length ? files.length + ' arquivo(s)' : ''; $('#svGo', m).disabled = !files.length; };
    const add = fl => { files.push(...[...fl].filter(f => f.size).map(f => ({ f }))); draw(); };
    $('#svF', m).onchange = ev => add(ev.target.files);
    const dz = $('#svDrop', m); dz.ondragover = ev => { ev.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = ev => { ev.preventDefault(); dz.classList.remove('over'); add(ev.dataTransfer.files); };
    $('#svGo', m).onclick = async () => {
      if (!Session.remote) return UI.toast('Juntar notas exige o servidor conectado.', 'warn');
      const f = $('#svf', m), base = { natureza: f.nat.value, status: f.st.value, justificativa: f.jus.value.trim() };
      $('#svGo', m).disabled = true; const notas = [];
      const contratos = empRecs('contratos', e.id).map(x => ({ codigo: x.codigo, local: [x.tomador, x.unidade].filter(y => y && !isGap(y)).join(' / ') }));
      for (const x of files) {
        const set = (st, cls) => { x.st = st; x.cls = cls; draw(); };
        try {
          if (x.f.size > 30 * 1048576) throw new Error('acima de 30 MB');
          const xml = /\.xml$/i.test(x.f.name) ? await x.f.text() : null, nfe = xml ? Superv.lerXML(xml) : null;
          set('guardando no Drive do escritório…', 'busy');
          const up = await apiT('juntar', { modo: 'nf', empresaKey: e.id, empresa: e.fantasia || e.razao, nome: x.f.name, mime: x.f.type || (xml ? 'text/xml' : 'application/pdf'), base64: await Docs.b64(x.f), ler: false }, 240000);
          const doArq = { fileId: up.id, link: up.url, arquivo: x.f.name, mime: x.f.type || (xml ? 'text/xml' : 'application/pdf') };
          if (nfe) { notas.push({ ...nfe, ...doArq }); set('XML lido', 'ok'); continue; }
          if (xml) throw new Error('XML não reconhecido como NF-e — junte o PDF da nota');
          // páginas como imagem, em lotes, para a IA separar e ler cada nota
          let pags = [];
          if (/pdf/i.test(x.f.type || x.f.name)) {
            const pdfjs = await PdfLeve.carregar(), pdf = await pdfjs.getDocument({ data: new Uint8Array(await x.f.arrayBuffer()) }).promise;
            const N = Math.min(pdf.numPages, 80); if (pdf.numPages > 80) set(`lendo as primeiras 80 de ${pdf.numPages} páginas…`, 'busy');
            for (let p = 1; p <= N; p++) pags.push({ p, get: () => PdfLeve.render(pdf, p) });
          } else pags.push({ p: 1, get: () => Superv.imgJPEG(x.f) });
          let lidas = 0, falhas = 0;
          for (let i = 0; i < pags.length; i += 4) {
            const lote = pags.slice(i, i + 4);
            set(`lendo páginas ${lote[0].p}–${lote[lote.length - 1].p} de ${pags.length} com a IA…`, 'busy');
            try {
              const imagens = []; for (const pg of lote) imagens.push(await pg.get());
              const r = await apiT('lerNotas', { imagens, paginas: lote.map(pg => pg.p), contratos }, 300000);
              (r.notas || []).filter(n => n && (n.numero || n.valorTotal || n.emitente)).forEach(n => { notas.push({ ...n, ...doArq }); lidas++; });
            } catch (err) { falhas++; notas.push({ ...doArq, paginaInicial: lote[0].p, paginaFinal: lote[lote.length - 1].p, observacoes: 'A IA não leu estas páginas (' + err.message + '): preencha à mão.', falhou: true }); }
          }
          set(`${lidas} nota(s) lida(s)${falhas ? ` · ${falhas} lote(s) sem leitura` : ''}`, falhas ? 'err' : 'ok');
        } catch (err) { set('erro: ' + err.message, 'err'); }
      }
      if (!notas.length) return UI.toast('Nenhuma nota para registrar.', 'warn');
      Superv.revisar(e, c, Superv.juntarContinuacoes(notas), base);
    };
  },
  /** nota que continua na página seguinte ("folha 2/2") vem às vezes em duas entradas: junta */
  juntarContinuacoes(l) {
    const out = [];
    for (const n of l) {
      const ant = out[out.length - 1];
      if (ant && n.fileId === ant.fileId && n.numero && norm(n.numero) === norm(ant.numero) && onlyDigits(n.cnpjEmitente) === onlyDigits(ant.cnpjEmitente)) { ant.paginaFinal = Math.max(ant.paginaFinal || 0, n.paginaFinal || n.paginaInicial || 0); ant.valorTotal = ant.valorTotal || n.valorTotal; continue; }
      out.push(n);
    }
    return out;
  },
  imgJPEG(file) {
    return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 1500 / im.width), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res(cv.toDataURL('image/jpeg', 0.75).split(',')[1]); }; im.onerror = () => rej(new Error('imagem ilegível')); im.src = u; });
  },
  /** contrato sugerido para a nota: o que a IA indicou ou o que casa com o local/anotação */
  sugerir(n, cs, padrao) {
    if (n.contratoSugerido && cs.some(x => x.codigo === n.contratoSugerido)) return n.contratoSugerido;
    const txt = norm([n.anotacao, n.localEntrega, n.municipioDestinatario].filter(Boolean).join(' ')), tk = txt.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    let best = null, bs = 0;
    for (const x of cs) { const alvo = norm([x.tomador, x.unidade].filter(y => y && !isGap(y)).join(' ')); const sc = tk.filter(w => alvo.includes(w)).length; if (sc > bs) { bs = sc; best = x.codigo; } }
    return best || padrao;
  },
  revisar(e, c, notas, base) {
    const cs = empRecs('contratos', e.id).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }));
    notas.forEach(n => n._ct = Superv.sugerir(n, cs, c.codigo));
    const raiz = onlyDigits(e.cnpj).slice(0, 8);
    const tot = notas.reduce((s, n) => s + (num(n.valorTotal) || 0), 0);
    const m = UI.modal({ title: 'Conferir as notas lidas', sub: `${notas.length} nota(s) · ${esc(fmtMoney(tot))} — indique o contrato de cada uma`, wide: true, body: `
      <p class="muted small">Marque as notas que entram no pedido. O contrato vem sugerido pela anotação à mão ou pelo local de entrega; ajuste se precisar. Depois de salvar, cada nota pode ser corrigida na ficha do contrato.</p>
      <div class="table-wrap"><table class="mini sv-rev"><thead><tr><th><input type="checkbox" id="srT" checked></th><th>Pág.</th><th>Nota</th><th>Emitente</th><th>Destinatário</th><th>Anotação / local</th><th class="r">Valor</th><th>Contrato</th></tr></thead><tbody>
      ${notas.map((n, i) => { const rd = onlyDigits(n.cnpjDestinatario).slice(0, 8); return `<tr class="${n.falhou ? 'falhou' : ''}"><td><input type="checkbox" data-sr="${i}" ${n.falhou ? '' : 'checked'}></td><td>${esc(n.paginaInicial || '')}${n.paginaFinal && n.paginaFinal !== n.paginaInicial ? '–' + esc(n.paginaFinal) : ''}</td>
        <td>${esc(n.tipoDoc || '')} ${esc(n.numero || '—')}<br><small>${esc(fmtDate(n.dataEmissao) || '')}</small></td><td>${esc(n.emitente || '—')}</td>
        <td>${esc(n.destinatario || '—')}${rd && raiz && rd !== raiz ? `<br><span class="sv-al">${icon('alert')} CNPJ diferente da contratada</span>` : ''}</td>
        <td>${esc([n.anotacao && '✍ ' + n.anotacao, n.localEntrega || n.municipioDestinatario].filter(Boolean).join(' · ') || '—')}${n.observacoes ? `<br><small class="t-warn">${esc(n.observacoes)}</small>` : ''}</td>
        <td class="r mono">${esc(fmtMoney(n.valorTotal) || '—')}</td>
        <td><select class="input sm" data-sc="${i}">${cs.map(x => `<option value="${esc(x.codigo)}" ${x.codigo === n._ct ? 'selected' : ''}>${esc(x.codigo)} · ${esc(String(x.unidade && !isGap(x.unidade) ? x.unidade : x.tomador || '').slice(0, 34))}</option>`).join('')}</select></td></tr>`; }).join('')}
      </tbody></table></div>`,
      foot: `<span class="muted small" id="srN"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="srOk">${icon('check')} Registrar notas marcadas</button>` });
    const conta = () => { const k = $$('[data-sr]:checked', m).length; $('#srN', m).textContent = `${k} de ${notas.length} marcada(s)`; $('#srOk', m).disabled = !k; };
    $('#srT', m).onchange = ev => { $$('[data-sr]', m).forEach(x => x.checked = ev.target.checked); conta(); }; $$('[data-sr]', m).forEach(x => x.onchange = conta); conta();
    $('#srOk', m).onclick = async () => {
      const recs = $$('[data-sr]:checked', m).map(x => { const i = +x.dataset.sr, n = notas[i]; return { ...base, empresaId: e.id, contrato: $(`[data-sc="${i}"]`, m).value, tipoDoc: n.tipoDoc || 'NF-e', numero: n.numero || '', serie: n.serie || '', dataEmissao: parseDate(n.dataEmissao) || '', emitente: n.emitente || '', cnpjEmitente: onlyDigits(n.cnpjEmitente), destinatario: n.destinatario || '', cnpjDestinatario: onlyDigits(n.cnpjDestinatario), localEntrega: '', anotacao: n.anotacao || '', valor: num(n.valorTotal) || '', descricao: '', chave: onlyDigits(n.chaveAcesso), iaObs: n.observacoes || '', link: n.link, fileId: n.fileId, arquivo: n.arquivo, mime: n.mime, paginaInicial: n.paginaInicial || null, paginaFinal: n.paginaFinal || n.paginaInicial || null }; });
      await DB.save('supervenientes', recs);
      const porCt = {}; recs.forEach(r => porCt[r.contrato] = (porCt[r.contrato] || 0) + 1);
      UI.toast(`${recs.length} nota(s) registrada(s): ${Object.entries(porCt).map(([k, v]) => `${k} (${v})`).join(', ')}.`, 'ok', 8000);
      Consult.contrato360(e, DB.get('contratos', c.id) || c);
    };
  },
  /** NF-e (XML) lida no próprio navegador */
  lerXML(txt) {
    try {
      const d = new DOMParser().parseFromString(txt, 'text/xml'), g = (sel, el = d) => el.getElementsByTagName(sel)[0]?.textContent?.trim() || '';
      const inf = d.getElementsByTagName('infNFe')[0]; if (!inf) return null;
      const emit = d.getElementsByTagName('emit')[0], dest = d.getElementsByTagName('dest')[0];
      return { tipoDoc: 'NF-e', numero: g('nNF'), serie: g('serie'), dataEmissao: (g('dhEmi') || g('dEmi')).slice(0, 10), emitente: emit ? g('xNome', emit) : '', cnpjEmitente: emit ? g('CNPJ', emit) || g('CPF', emit) : '', destinatario: dest ? g('xNome', dest) : '', cnpjDestinatario: dest ? g('CNPJ', dest) || g('CPF', dest) : '', valorTotal: num(g('vNF')), chaveAcesso: (inf.getAttribute('Id') || '').replace(/^NFe/, ''), observacoes: null };
    } catch { return null; }
  },

  /* ---------- relatório de auditoria do contrato ---------- */
  relatorioDialog(e, c) {
    const E = escritorio();
    const m = UI.modal({ title: 'Relatório de auditoria do contrato', sub: `${esc(c.codigo)} · ${esc(c.unidade || c.tomador || '')}`, body: `<form class="grid-form" id="rcf">
      <div class="fld full"><label>Parecer / conclusão do auditor</label><textarea name="par" rows="5" placeholder="Conclusões, riscos e recomendações para este contrato…"></textarea></div>
      <div class="fld"><label>Responsável técnico</label><input name="resp" value="${esc(E.advogado || '')}"></div><div class="fld"><label>OAB</label><input name="oab" value="${esc(oabFmt(E.oab))}"></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="anexo" checked><span></span>Anexar cópia das notas fiscais e comprovantes (busca os arquivos no Drive)</label></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="obr" checked><span></span>Incluir a lista de obrigações contratuais</label></div></form>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rcOk">${icon('printer')} Gerar relatório</button>` });
    $('#rcOk', m).onclick = async () => {
      const f = $('#rcf', m), o = { parecer: f.par.value.trim(), resp: f.resp.value.trim(), oab: f.oab.value.trim(), anexo: f.anexo.checked, obr: f.obr.checked };
      const b = $('#rcOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Montando…';
      try { await Superv.relatorio(e, c, o, t => b.innerHTML = icon('sync', 'spin') + ' ' + esc(t)); UI.closeModal(); }
      catch (err) { UI.toast(err.message, 'bad', 7000); b.disabled = false; b.innerHTML = icon('printer') + ' Gerar relatório'; }
    };
  },
  async copias(l, prog) {
    const out = [], cache = {};
    for (const [i, r] of l.entries()) {
      prog && prog(`Preparando cópia ${i + 1} de ${l.length}…`);
      const it = { r, imgs: [], erro: '' };
      try {
        if (!r.fileId) throw new Error('sem arquivo no Drive');
        const f = cache[r.fileId] = cache[r.fileId] || await apiT('baixar', { fileId: r.fileId }, 120000), mime = f.mime || r.mime || '';
        if (/image\//.test(mime)) it.imgs.push(`data:${mime};base64,${f.base64}`);
        else if (/pdf/.test(mime) || /\.pdf$/i.test(r.arquivo || '')) {
          if (!f.pdf) { const pdfjs = await PdfLeve.carregar(); f.pdf = await pdfjs.getDocument({ data: Uint8Array.from(atob(f.base64), ch => ch.charCodeAt(0)) }).promise; }
          const ini = Math.max(1, r.paginaInicial || 1), fim = Math.min(f.pdf.numPages, r.paginaFinal || (r.paginaInicial ? r.paginaInicial : Math.min(3, f.pdf.numPages)));
          for (let p = ini; p <= Math.min(fim, ini + 3); p++) it.imgs.push('data:image/jpeg;base64,' + await PdfLeve.render(f.pdf, p));
          if (r.paginaInicial) it.pags = `pág. ${ini}${fim > ini ? '–' + fim : ''} de ${r.arquivo || 'arquivo'}`;
        } else if (/xml/.test(mime) || /\.xml$/i.test(r.arquivo || '')) it.xml = Superv.lerXML(decodeURIComponent(escape(atob(f.base64))));
      } catch (err) { it.erro = err.message; }
      out.push(it);
    }
    return out;
  },
  async relatorio(e, c, o, prog) {
    const E = escritorio(), rel = coll => DB.where(coll, r => r.empresaId === e.id && r.contrato === c.codigo);
    const ac = rel('achados'), ob = rel('obrigacoes'), mo = rel('maoDeObra'), dc = rel('documentos'), sv = Superv.lista(e, c), T = Superv.totais(sv);
    const v = x => x === null || x === undefined || x === '' ? '—' : isGap(x) ? '<i class="gap">não identificado</i>' : esc(x);
    const dt = (l, k) => `<div><dt>${l}</dt><dd>${k}</dd></div>`;
    const d = isISO(c.fim) ? daysUntil(c.fim) : null;
    const copias = o.anexo && sv.length ? await Superv.copias(sv, prog) : [];
    prog && prog('Montando o relatório…');
    let n = 0; const H = t => `<h2><span>${++n}.</span> ${esc(t)}</h2>`;
    const tbl = (h, rows, cls = '') => `<table class="t ${cls}"><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const diag = Consult.diagArquivos(e, c, dc).replace(/<button[^>]*>.*?<\/button>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
    const porNat = {}; sv.forEach(r => { const k = (r.natureza || 'Outro'); porNat[k] = (porNat[k] || 0) + (num(r.valor) || 0); });
    const corpo = `
      <div class="capa"><div class="tipo">Relatório de auditoria contratual</div><h1>Contrato ${esc(c.numero && !isGap(c.numero) ? c.numero : c.codigo)}</h1>
        <p class="sub">${esc(c.tomador || '')}${c.unidade && !isGap(c.unidade) && !norm(c.tomador).includes(norm(c.unidade)) ? ' — ' + esc(c.unidade) : ''}</p>
        <p class="meta">Contratada: <b>${esc(e.razao || '')}</b>${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}<br>Identificação interna: ${esc(c.codigo)} · Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
      <div class="kp"><div><b>${c.fim ? esc(fmtDate(c.fim)) : '—'}</b><span>fim da vigência${d !== null ? (d < 0 ? ` · expirada há ${-d} dias` : ` · ${d} dias restantes`) : ''}</span></div><div><b>${num(c.valorMensal) ? esc(fmtMoneyShort(c.valorMensal)) : '—'}</b><span>valor mensal</span></div><div><b>${ac.filter(achadoAberto).length}</b><span>achados em aberto</span></div><div><b>${esc(fmtMoneyShort(T.pedido) || 'R$ 0')}</b><span>custos supervenientes pedidos</span></div></div>
      ${H('Identificação do contrato')}<dl class="dl">${dt('Nº do contrato / processo', v(c.numero))}${dt('Tomador', v(c.tomador))}${dt('CNPJ do tomador', v(c.cnpjTomador && fmtDoc(c.cnpjTomador)))}${dt('Unidade / local', v(c.unidade))}${dt('Início', v(fmtDate(c.inicio)))}${dt('Fim da vigência', v(fmtDate(c.fim)))}${dt('Prazo / prorrogação', v(c.prazo))}${dt('Valor mensal', v(fmtMoney(c.valorMensal)))}${dt('Valor anual estimado', v(fmtMoney(c.valorAnual)))}${dt('Reajuste', v(c.reajuste))}${dt('Convenção coletiva', v(c.cct))}${dt('Fiscal / gestor', v(c.fiscal))}</dl>
      ${c.objeto && !isGap(c.objeto) ? `<p><b>Objeto.</b> ${esc(c.objeto)}</p>` : ''}${c.aditivos && !isGap(c.aditivos) ? `<p><b>Aditivos e alterações.</b> ${esc(c.aditivos)}</p>` : ''}
      ${H('Documentação analisada')}${dc.length ? tbl(['Documento', 'Conteúdo', 'Arquivo'], dc.map(x => [esc(x.tipo || 'Documento') + (x.numero ? ' ' + esc(x.numero) : ''), esc((x.pecas || []).map(p => p.tipo + (p.paginaInicial ? ` (p. ${p.paginaInicial}${p.paginaFinal ? '–' + p.paginaFinal : ''})` : '')).join(' · ') || '—'), (x.link ? `<a href="${esc(x.link)}">${esc(x.arquivo || 'Drive')}</a>` : esc(x.arquivo || '—') + ' <i class="gap">(sem arquivo no Drive)</i>')])) : '<p class="muted">Nenhum documento registrado.</p>'}
      <p class="nota">${esc(diag)}</p>
      ${mo.length ? H('Mão de obra contratada') + tbl(['Posto', 'Qtd.', 'Salário', 'Custo previsto'], mo.map(x => [esc(x.posto || ''), esc(x.qtdContratada ?? ''), esc(fmtMoney(x.salario) || '—'), esc(fmtMoney(x.custoPrevisto) || '—')]), 'num') : ''}
      ${H('Achados e plano de ação')}${ac.length ? tbl(['Código', 'Achado', 'Risco', 'Recomendação', 'Situação'], ac.sort((a, b) => Achados.peso(b) - Achados.peso(a)).map(x => [esc(x.codigo || ''), esc(x.achado || ''), `<b class="rk ${norm(x.risco)}">${esc(x.risco || '')}</b>`, esc(x.recomendacao || '—'), esc(x.status || '') + (x.evidenciaConclusao ? `<br><small>${esc(x.evidenciaConclusao)}</small>` : '')])) : '<p class="muted">Nenhum achado registrado.</p>'}
      ${o.obr && ob.length ? H('Obrigações contratuais') + tbl(['Cláusula', 'Obrigação', 'Situação'], ob.map(x => [esc(x.clausula || ''), esc(x.obrigacao || ''), esc(x.status || '—')])) : ''}
      ${H('Custos supervenientes (reembolso, reequilíbrio e repactuação)')}
      ${sv.length ? `<p>Foram apresentados <b>${sv.length}</b> documento(s) de comprovação de gastos, totalizando <b>${esc(fmtMoney(T.pedido))}</b>: em análise ${esc(fmtMoney(T.analise))}, deferido ${esc(fmtMoney(T.deferido))}, pago ${esc(fmtMoney(T.pago))}.</p>
        ${tbl(['Natureza', 'Documentos', 'Valor'], Object.entries(porNat).map(([k, x]) => [esc(k), String(sv.filter(r => (r.natureza || 'Outro') === k).length), esc(fmtMoney(x))]), 'num')}
        ${tbl(['#', 'Data', 'Documento', 'Emitente', 'Anotação / justificativa', 'Valor', 'Situação', 'Conferência'], sv.map((r, i) => { const al = Superv.alertas(r, c, e); return [`${i + 1}`, esc(fmtDate(r.dataEmissao) || '—'), `${esc(r.tipoDoc || '')} ${esc(r.numero || '')}`, `${esc(r.emitente || '—')}${r.cnpjEmitente ? `<br><small>${esc(fmtDoc(r.cnpjEmitente))}</small>` : ''}`, `${esc([r.anotacao, r.descricao].filter(Boolean).join(' · ') || '—')}${r.justificativa ? `<br><small><i>${esc(r.justificativa)}</i></small>` : ''}`, `<span class="nw">${esc(fmtMoney(r.valor) || '—')}</span>${num(r.valorDeferido) ? `<br><small>deferido ${esc(fmtMoney(r.valorDeferido))}</small>` : ''}`, esc(r.status || 'Em análise') + (r.protocolo ? `<br><small>${esc(r.protocolo)}</small>` : ''), al.length ? `<span class="al">${al.map(esc).join('; ')}</span>` : '<span class="ok">sem apontamentos</span>']; }))}` : '<p class="muted">Nenhum custo superveniente registrado para este contrato.</p>'}
      ${o.parecer ? H('Parecer') + `<div class="parecer">${esc(o.parecer).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="assin1"><span></span><b>${esc(o.resp || '')}</b>${esc(o.oab || '')}<br>${esc(nomeMarca())} — ${esc(BRAND.caption)}</div>
      ${copias.length ? `<section class="anexos"><h2 class="ax">Anexo — cópia dos comprovantes</h2>${copias.map((x, i) => `<figure class="cp"><figcaption>Comprovante ${i + 1} — ${esc(x.r.tipoDoc || '')} ${esc(x.r.numero || '')} · ${esc(x.r.emitente || '')} · ${esc(fmtMoney(x.r.valor) || '')} · ${esc(fmtDate(x.r.dataEmissao) || '')}${x.pags ? ` <i>(${esc(x.pags)})</i>` : ''}${x.erro ? ` <i>(${esc(x.erro)})</i>` : ''}</figcaption>${x.imgs.map(s => `<img src="${s}" alt="">`).join('')}${x.xml ? Superv.danfe(x.xml) : ''}${!x.imgs.length && !x.xml ? `<p class="muted">Cópia indisponível${x.r.link ? ` — <a href="${esc(x.r.link)}">abrir no Drive</a>` : ''}.</p>` : ''}</figure>`).join('')}</section>` : ''}`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Auditoria — ${esc(c.codigo)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${Superv.CSS}@page{@bottom-left{content:"${nomeMarca().replace(/["\\]/g, '')} — ${BRAND.caption} · Relatório de auditoria do contrato ${String(c.codigo).replace(/["\\]/g, '')}";font:7pt Manrope,Arial,sans-serif;color:#8a8e98}}</style></head><body>
      <table class="pg"><thead><tr><td><div class="tb"><img src="${new URL(BRAND.logoDark, location.href)}" alt=""><div><div class="n">${esc(nomeMarca().toUpperCase())}</div><div class="l">${esc(BRAND.caption)}</div></div></div></td></tr></thead><tbody><tr><td>${corpo}</td></tr></tbody></table></body></html>`;
    Report.mostrar(html, 'Relatório de auditoria — ' + c.codigo, `Auditoria_${String(c.codigo).replace(/[^\w-]+/g, '_')}_${todayISO()}.html`);
  },
  danfe(x) {
    return `<div class="danfe"><div class="dh"><b>NF-e nº ${esc(x.numero)}${x.serie ? ' · série ' + esc(x.serie) : ''}</b><span>Emissão ${esc(fmtDate(x.dataEmissao) || '')}</span></div>
      <p><b>Emitente:</b> ${esc(x.emitente)} — ${esc(fmtDoc(x.cnpjEmitente))}<br><b>Destinatário:</b> ${esc(x.destinatario)} — ${esc(fmtDoc(x.cnpjDestinatario))}${x.chaveAcesso ? `<br><b>Chave de acesso:</b> <span class="mono">${esc(x.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim())}</span>` : ''}</p>

      <p class="r"><b>Valor total da nota: ${esc(fmtMoney(x.valorTotal))}</b></p><p class="muted small">Representação simplificada do XML da NF-e, para conferência — não substitui o DANFE.</p></div>`;
  },
  CSS: `@page{size:A4;margin:12mm 14mm 16mm;@bottom-right{content:"Página " counter(page) " de " counter(pages);font:7.5pt Manrope,Arial,sans-serif;color:#8a8e98}}
  *{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:9pt/1.5 Manrope,'Helvetica Neue',Arial,sans-serif;color:#1d2433}
  table.pg{width:100%;border-collapse:collapse}table.pg>thead td{padding:0 0 5mm}
  .tb{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1.5mm;border-bottom:1.2pt solid #b08a4e;padding-bottom:3mm}.tb img{width:13mm}.tb .n{font:600 14pt/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.2em;color:#121c33}.tb .l{font:600 6pt Manrope,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#a07c43;margin-top:1.2mm}
  .capa{margin:5mm 0 5mm;text-align:center}.capa .tipo{font:700 7pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43}.capa h1{font:600 22pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33;margin:1.5mm 0}.capa .sub{font-size:11pt;margin:0 0 2mm;color:#121c33}.capa .meta{font-size:8.5pt;color:#5d6270;margin:0}
  .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:4mm}.kp div{border:1px solid #e7e0d2;border-left:2.5pt solid #b08a4e;border-radius:1.6mm;padding:2.4mm 3mm;background:#fcfaf5}.kp b{display:block;font:600 14pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33}.kp span{font-size:7.4pt;color:#6b6f7b}
  h2{font:600 13pt 'Cormorant Garamond',Georgia,serif;color:#121c33;border-bottom:.6pt solid #d9c49a;padding-bottom:1.2mm;margin:6mm 0 2.5mm;page-break-after:avoid}h2 span{color:#b08a4e;margin-right:1.5mm}
  .dl{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm 5mm;margin:0 0 3mm}.dl dt{font-size:7pt;letter-spacing:.06em;text-transform:uppercase;color:#8a8e98}.dl dd{margin:0;font-weight:500}
  .t{width:100%;border-collapse:collapse;margin:1.5mm 0 3mm;font-size:8pt}.t th{background:#121c33;color:#fff;text-align:left;font-weight:600;padding:1.6mm 2mm;font-size:7pt;letter-spacing:.04em;text-transform:uppercase}.t td{border-bottom:.5pt solid #ece6da;padding:1.5mm 2mm;vertical-align:top}.t tr{page-break-inside:avoid}.t small{color:#6b6f7b}.t.num td:not(:first-child){text-align:right}.nw{white-space:nowrap}
  .gap{color:#9a6b1e}.muted{color:#6b6f7b}.nota{font-size:8pt;color:#5d6270;background:#faf7f0;border-left:2pt solid #b08a4e;padding:2mm 3mm}.al{color:#a8461e;font-size:7.5pt}.ok{color:#1d7a63;font-size:7.5pt}.rk.alto,.rk.critico{color:#b4233c}.rk.medio{color:#a86a12}
  .parecer{border-left:2.5pt solid #b08a4e;background:#faf7f0;padding:3mm 4mm}.assin1{width:85mm;margin:14mm auto 0;text-align:center;font-size:8.5pt;page-break-inside:avoid}.assin1 span{display:block;border-top:.8pt solid #1d2433;margin-bottom:1.5mm}.assin1 b{display:block}
  .anexos{page-break-before:always}h2.ax{margin-top:0}.cp{margin:0 0 6mm;page-break-inside:avoid}.cp figcaption{font-weight:600;color:#121c33;margin-bottom:2mm;font-size:8.5pt}.cp img{display:block;max-width:100%;max-height:235mm;margin:0 auto 3mm;border:.5pt solid #ddd}
  .danfe{border:.8pt solid #121c33;padding:3mm;border-radius:1mm}.danfe .dh{display:flex;justify-content:space-between;border-bottom:.6pt solid #ccc;padding-bottom:1.5mm;margin-bottom:2mm}.danfe .r{text-align:right}.mono{font-family:monospace}
  @media screen{body{background:#e9e6df;padding:8mm 0}table.pg{background:#fff;max-width:210mm;margin:0 auto;box-shadow:0 2px 16px rgba(0,0,0,.09)}table.pg td{padding-left:14mm;padding-right:14mm}table.pg>thead td{padding-top:12mm}table.pg>tbody td{padding-bottom:16mm}}`
};
