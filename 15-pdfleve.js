/* =====================================================================
   LEITURA LEVE DE PDF — mesma ideia do app Meus Concursos: o arquivo
   completo vai para o Drive, mas a IA recebe só o que importa, extraído
   aqui no navegador com o pdf.js.
   • Processos: identifica as PEÇAS PRINCIPAIS (pelo índice/marcadores do
     PDF do PJe/eproc ou pelo rodapé "Num. … - Pág. 1" e pelo título da
     peça) e manda só elas, rotuladas.
   • Contratos: primeiras e últimas páginas.
   • PDF digitalizado: imagens JPEG leves das páginas principais.
   ===================================================================== */
const PECAS = [ // ordem importa: as mais específicas primeiro
  ['Certidão de trânsito em julgado', /tr[âa]nsit[oa] em julgado/i, 'fim'],
  ['Impugnação ao cumprimento de sentença', /impugna[çc][ãa]o ao cumprimento/i],
  ['Cumprimento de sentença', /cumprimento (definitivo |provis[óo]rio )?de senten[çc]a/i],
  ['Contrarrazões', /contrarraz[õo]es|contra-raz[õo]es/i],
  ['Embargos de declaração', /embargos de declara[çc][ãa]o/i],
  ['Recurso especial / extraordinário', /recurso (especial|extraordin[áa]rio)/i],
  ['Agravo', /\bagravo\b/i],
  ['Apelação', /\bapela[çc][ãa]o\b|recurso ordin[áa]rio|recurso inominado/i],
  ['Acórdão', /\bac[óo]rd[ãa]o\b/i, 'fim'],
  ['Decisão monocrática', /decis[ãa]o monocr[áa]tica/i, 'fim'],
  ['Réplica', /r[ée]plica|impugna[çc][ãa]o [àa] contesta[çc][ãa]o/i],
  ['Petição inicial', /peti[çc][ãa]o inicial|exordial|reclama[çc][ãa]o trabalhista|den[úu]ncia|queixa-crime/i],
  ['Contestação', /contesta[çc][ãa]o|defesa pr[ée]via|resposta [àa] acusa[çc][ãa]o/i],
  ['Decisão saneadora', /saneador|saneamento|despacho saneador/i, 'fim'],
  ['Audiência de instrução', /termo de audi[êe]ncia|ata de audi[êe]ncia|audi[êe]ncia de instru[çc][ãa]o/i],
  ['Alegações finais', /alega[çc][õo]es finais|memoriais/i],
  ['Sentença', /\bsenten[çc]a\b/i, 'fim'],
  ['Alvará', /\balvar[áa]\b/i],
  ['Termo de compromisso / guarda', /termo de (compromisso|guarda)/i]
];
const PdfLeve = {
  VER: '3.11.174',
  carregar() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (PdfLeve._p) return PdfLeve._p;
    PdfLeve._p = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfLeve.VER}/pdf.min.js`;
      s.onload = () => { let n = 0; const iv = setInterval(() => { if (window.pdfjsLib) { clearInterval(iv); try { if (!/mjs$/.test(window.pdfjsLib.GlobalWorkerOptions.workerSrc || '')) window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfLeve.VER}/pdf.worker.min.js`; } catch { } ok(window.pdfjsLib); } else if (++n > 50) { clearInterval(iv); falha(new Error('pdf.js indisponível')); } }, 100); };
      s.onerror = () => { PdfLeve._p = null; falha(new Error('pdf.js indisponível')); };
      document.head.appendChild(s);
    });
    return PdfLeve._p;
  },
  faixa(N, ini, fim) { const out = []; for (let i = 1; i <= N; i++) if (i <= ini || i > N - fim) out.push(i); return out; },
  classificar(t) { const s = String(t || ''); for (const [nome, re, foco] of PECAS) if (re.test(s)) return { tipo: nome, foco: foco || 'inicio' }; return null; },
  async textoPagina(pdf, i) {
    const c = await (await pdf.getPage(i)).getTextContent();
    return c.items.map(it => (it.str || '') + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  },
  /** índice (marcadores) do PDF → [{pagina, titulo}] */
  async indice(pdf) {
    try {
      const out = [], ol = await pdf.getOutline(); if (!ol) return out;
      const visitar = async itens => { for (const it of itens || []) { try { let d = it.dest; if (typeof d === 'string') d = await pdf.getDestination(d); if (Array.isArray(d) && d[0]) { const pi = typeof d[0] === 'number' ? d[0] : await pdf.getPageIndex(d[0]); out.push({ pagina: pi + 1, titulo: it.title || '' }); } } catch { } await visitar(it.items); } };
      await visitar(ol);
      return out.sort((a, b) => a.pagina - b.pagina);
    } catch { return []; }
  },
  /** divide os autos em peças: [{tipo, foco, de, ate, titulo}] */
  pecas(N, inicios) {
    const lista = inicios.filter((x, i, a) => i === 0 || x.pagina !== a[i - 1].pagina);
    return lista.map((x, i) => ({ ...x, de: x.pagina, ate: (lista[i + 1]?.pagina || N + 1) - 1 }));
  },
  /** páginas a mandar de cada peça: começo e, nas decisões, o fim (dispositivo) */
  paginasDaPeca(p) {
    const n = p.ate - p.de + 1, out = new Set();
    for (let k = 0; k < Math.min(3, n); k++) out.add(p.de + k);
    const fim = p.foco === 'fim' ? 3 : 1; for (let k = 0; k < Math.min(fim, n); k++) out.add(p.ate - k);
    return [...out].sort((a, b) => a - b);
  },
  async render(pdf, i) {
    const pg = await pdf.getPage(i), v1 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: Math.min(1.6, 1300 / v1.width) });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    return cv.toDataURL('image/jpeg', 0.6).split(',')[1];
  },
  /**
   * Prepara o que a IA vai ler. Devolve {texto|imagens, paginas, usadas, pecas?} ou null
   * (aí o servidor manda o PDF original). o.modo: 'processo' | 'contrato'
   */
  async preparar(file, o = {}) {
    if (!/pdf/i.test(file.type || file.name)) return null;
    try {
      const pdfjs = await PdfLeve.carregar();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const N = pdf.numPages;
      if (o.modo === 'processo' && N > 12) { const r = await PdfLeve.porPecas(pdf, N); if (r) return r; }
      return await PdfLeve.porPaginas(pdf, N, o);
    } catch (e) { console.warn('Leitura leve indisponível:', e.message); return null; }
  },
  async porPaginas(pdf, N, o) {
    const ini = o.inicio ?? 25, fim = o.fim ?? 15, maxChars = o.maxChars ?? 90000;
    const pags = PdfLeve.faixa(N, ini, fim), partes = []; let comTexto = 0;
    for (const i of pags) { const t = await PdfLeve.textoPagina(pdf, i); if (t.replace(/\s/g, '').length > 150) comTexto++; partes.push(`[página ${i} de ${N}]\n${t}`); }
    if (comTexto >= Math.max(1, pags.length * 0.5)) {
      let texto = partes.join('\n\n');
      if (texto.length > maxChars) texto = texto.slice(0, Math.round(maxChars * 0.65)) + '\n\n[…trecho omitido…]\n\n' + texto.slice(-Math.round(maxChars * 0.35));
      return { texto, paginas: N, usadas: pags.length };
    }
    const ip = PdfLeve.faixa(N, o.imgInicio ?? 10, o.imgFim ?? 6), imagens = [];
    for (const i of ip) imagens.push(await PdfLeve.render(pdf, i));
    return { imagens, paginas: N, usadas: ip.length };
  },
  /** autos do processo: só as peças principais */
  async porPecas(pdf, N) {
    // 1) índice do PDF (PJe/eproc) — funciona até em PDF digitalizado
    let inicios = (await PdfLeve.indice(pdf)).map(x => ({ pagina: x.pagina, titulo: x.titulo, ...(PdfLeve.classificar(x.titulo) || {}) }));
    // 2) sem índice: texto de todas as páginas; começo de peça = rodapé "Pág. 1" ou título no topo
    const textos = {}; let comTexto = 0;
    if (!inicios.length || inicios.every(x => !x.tipo)) {
      inicios = []; const marca = {};
      for (let i = 1; i <= N; i++) {
        const t = await PdfLeve.textoPagina(pdf, i); textos[i] = t;
        if (t.replace(/\s/g, '').length > 150) comTexto++;
        marca[i] = /Num\.?\s*\d+\s*-\s*P[áa]g\.?\s*1(?!\d)/i.test(t); // rodapé do PJe: 1ª página de cada documento
      }
      const comMarca = Object.values(marca).filter(Boolean).length > 1;
      for (let i = 1; i <= N; i++) {
        const topo = textos[i].slice(0, 450), c = PdfLeve.classificar(topo);
        const linhas = topo.split('\n').map(l => l.trim()).filter(l => l.length > 4);
        if (i === 1 || (comMarca ? marca[i] : c)) inicios.push({ pagina: i, titulo: (linhas.find(l => PdfLeve.classificar(l)) || linhas[0] || '').slice(0, 90), ...(c || {}) });
      }
      if (comTexto < N * 0.3) return null; // digitalizado e sem índice: usa o modo por páginas (imagens)
    }
    const pecas = PdfLeve.pecas(N, inicios.length ? inicios : [{ pagina: 1, titulo: '' }]);
    const principais = pecas.filter(p => p.tipo);
    if (!principais.length) return null;
    const sumario = principais.map(p => `- ${p.tipo} (págs. ${p.de}–${p.ate})${p.titulo && norm(p.titulo) !== norm(p.tipo) ? ' — ' + p.titulo : ''}`).join('\n');
    const temTexto = Object.keys(textos).length ? comTexto >= N * 0.3 : (await PdfLeve.textoPagina(pdf, principais[0].de)).replace(/\s/g, '').length > 150;
    if (temTexto) {
      const orcamento = 100000, porPeca = Math.max(3500, Math.min(10000, Math.floor(orcamento / (principais.length + 1))));
      const blocos = [];
      const capa = (textos[1] ?? await PdfLeve.textoPagina(pdf, 1)).slice(0, 4000);
      blocos.push(`=== CAPA / PRIMEIRA PÁGINA ===\n${capa}`);
      for (const p of principais) {
        const pags = PdfLeve.paginasDaPeca(p); let t = '';
        for (const i of pags) t += `[pág. ${i}]\n${textos[i] ?? await PdfLeve.textoPagina(pdf, i)}\n`;
        if (t.length > porPeca) t = p.foco === 'fim' ? t.slice(0, Math.round(porPeca * 0.4)) + '\n[…]\n' + t.slice(-Math.round(porPeca * 0.6)) : t.slice(0, porPeca);
        blocos.push(`=== PEÇA: ${p.tipo.toUpperCase()} (págs. ${p.de}–${p.ate}) ===\n${t}`);
      }
      const usadas = new Set([1, ...principais.flatMap(PdfLeve.paginasDaPeca)]).size;
      return { texto: `SUMÁRIO DAS PEÇAS PRINCIPAIS IDENTIFICADAS (${principais.length} de ${pecas.length} documentos dos autos):\n${sumario}\n\n${blocos.join('\n\n')}`, paginas: N, usadas, pecas: principais.map(p => ({ tipo: p.tipo, de: p.de, ate: p.ate })) };
    }
    // digitalizado com índice: imagens da 1ª página de cada peça (e do fim das decisões)
    const pags = [...new Set([1, ...principais.flatMap(p => p.foco === 'fim' ? [p.de, p.ate] : [p.de])])].sort((a, b) => a - b).slice(0, 24);
    const imagens = []; for (const i of pags) imagens.push(await PdfLeve.render(pdf, i));
    return { imagens, sumario, paginas: N, usadas: pags.length, pecas: principais.map(p => ({ tipo: p.tipo, de: p.de, ate: p.ate })) };
  }
};
/** chamada ao servidor com tempo-limite (como no Meus Concursos): não deixa botão preso */
function apiT(action, payload, ms = 300000) {
  return Promise.race([api(action, payload), new Promise((_, falha) => setTimeout(() => falha(new Error('o servidor demorou demais para responder — tente de novo')), ms))]);
}

/**
 * Guarda o arquivo no Drive do escritório e, numa segunda chamada, pede a leitura à IA.
 * Assim o arquivo nunca se perde por demora da IA: se a leitura falhar, fica guardado e dá para “Ler de novo”.
 */
async function juntarELer(p, aviso) {
  const up = await apiT('juntar', { ...p, ler: false, leitura: null }, 240000);
  if (!p.ler) return up;
  aviso && aviso('guardado no Drive; lendo com a IA…');
  try { up.ia = await apiT('reler', { fileId: up.id, nome: p.nome, modo: p.modo, leitura: p.leitura || null, contexto: p.contexto }, 300000); }
  catch (e) { up.iaErro = /demorou/.test(e.message) ? 'a IA demorou demais (documento grande ou IA do Google ocupada) — use “Ler de novo” em alguns minutos' : e.message; }
  return up;
}
