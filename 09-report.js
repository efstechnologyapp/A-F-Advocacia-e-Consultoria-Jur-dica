/* =====================================================================
   RELATÓRIO DE AUDITORIA — pronto para imprimir ou salvar em PDF
   ===================================================================== */
const Report = {
  SECOES: [['sumario', 'Sumário executivo e leitura do período'], ['carteira', 'Carteira de contratos'], ['indicadores', 'Indicadores econômico-financeiros (gráficos)'], ['obrigacoes', 'Conformidade das obrigações'], ['maodeobra', 'Mão de obra'], ['achados', 'Achados e plano de ação'], ['documentos', 'Cobertura documental e limitações']],
  tab(host, e) {
    const hist = (DB.get('config', 'rel:' + e.id)?.itens || []).slice().reverse();
    host.innerHTML = `<section class="card"><header><h2>${icon('printer')} Relatório de auditoria contratual</h2></header>
      <p class="muted">Gera um relatório completo com o brasão do escritório — sumário executivo, carteira de contratos, gráficos de receitas, custos, tributos e pessoal, conformidade, achados e plano de ação — pronto para imprimir ou salvar em PDF e entregar ao cliente.</p>
      <button class="btn primary" id="rGen">${icon('printer')} Gerar relatório</button></section>
      <section class="card"><header><h2>${icon('history')} Relatórios emitidos</h2></header>${hist.length ? `<ul class="plain">${hist.map(h => `<li>${icon('file')} <b>${esc(h.titulo)}</b> <span class="muted small">— ${esc(fmtDateTime(h.em))} por ${esc(h.por)}${h.periodo ? ' · período ' + esc(h.periodo) : ''}</span></li>`).join('')}</ul>` : '<p class="muted small">Nenhum relatório emitido ainda.</p>'}</section>`;
    $('#rGen').onclick = () => Report.dialog(e);
  },
  dialog(e) {
    const comps = empRecs('indicadores', e.id).map(i => i.competencia).filter(c => /^\d{4}-\d{2}$/.test(c || '')).sort();
    const esc0 = escritorio();
    const m = UI.modal({
      title: 'Gerar relatório', sub: esc(e.razao), wide: true, body: `<form class="grid-form" id="rf">
      <div class="fld full"><label>Título</label><input name="titulo" value="Relatório de Auditoria Contratual"></div>
      <div class="fld"><label>Período dos indicadores — de</label><input name="de" placeholder="MM/AAAA" value="${esc(comps[0] ? fmtComp(comps[0]) : '')}"></div>
      <div class="fld"><label>até</label><input name="ate" placeholder="MM/AAAA" value="${esc(comps.length ? fmtComp(comps[comps.length - 1]) : '')}"></div>
      <div class="fld"><label>Responsável técnico</label><input name="resp" value="${esc(esc0.advogado || Session.user.nome || '')}"></div>
      <div class="fld"><label>OAB</label><input name="oab" value="${esc(esc0.oab || '')}"></div>
      <div class="fld full"><label>Seções</label><div class="chips-select">${Report.SECOES.map(([k, l]) => `<label class="chip-opt"><input type="checkbox" name="sec" value="${k}" checked><span>${l}</span></label>`).join('')}</div></div>
      <div class="fld full"><label>Parecer / considerações do consultor</label><textarea name="parecer" rows="5" placeholder="Conclusões, recomendações prioritárias e próximos passos…"></textarea></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="conf" checked><span></span>Marcar como confidencial (rodapé)</label></div></form>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rOk">${icon('printer')} Gerar</button>`
    });
    $('#rOk', m).onclick = async () => {
      const f = $('#rf'); const o = { titulo: f.titulo.value, de: parseComp(f.de.value), ate: parseComp(f.ate.value), resp: f.resp.value, oab: f.oab.value, parecer: f.parecer.value, conf: f.conf.checked, secs: new Set($$('input[name=sec]:checked', f).map(i => i.value)) };
      UI.closeModal(); Report.open(e, o);
      const key = 'rel:' + e.id, cur = DB.get('config', key) || { id: key, itens: [] };
      cur.itens = [...(cur.itens || []), { titulo: o.titulo, em: new Date().toISOString(), por: Session.user.nome || Session.user.email, periodo: o.de ? fmtComp(o.de) + ' a ' + fmtComp(o.ate) : '' }].slice(-50);
      await DB.save('config', cur);
    };
  },
  build(e, o) {
    const S = Consult.stats(e, o.de, o.ate), I = S.ind, esc0 = escritorio();
    const L = I.map(i => fmtCompShort(i.competencia)), g = k => I.map(i => num(i[k]));
    const chart = (title, spec) => `<figure class="r-fig"><figcaption>${esc(title)}</figcaption>${spec.series.some(s => s.values.some(v => num(v) !== null)) ? legendHtml(spec.series) + svgChart(spec, 680, 220).svg : '<p class="r-muted">Sem dados no período.</p>'}</figure>`;
    const tbl = (heads, rows, cls = '') => `<table class="r-t ${cls}"><thead><tr>${heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const v = x => x === null || x === undefined || x === '' ? '—' : isGap(x) ? '<i class="r-gap">não identificado</i>' : esc(x);
    const per = o.de ? `${fmtComp(o.de)} a ${fmtComp(o.ate || o.de)}` : 'todo o histórico';
    let n = 0; const H = t => `<h2><span>${++n}.</span> ${esc(t)}</h2>`;
    const sec = [];
    if (o.secs.has('sumario')) {
      const ins = Consult.insights(S);
      sec.push(`<section>${H('Sumário executivo')}
      <div class="r-kpis"><div><b>${S.at.length}/${S.cs.length}</b><span>contratos vigentes</span></div><div><b>${S.carteira ? fmtMoneyShort(S.carteira) : '—'}</b><span>carteira mensal conhecida</span></div><div><b>${fmtPct(S.compl)}</b><span>completude documental</span></div><div><b>${fmtPct(S.conf)}</b><span>conformidade das obrigações</span></div><div><b>${S.achAbertos.length}</b><span>achados em aberto</span></div><div><b>${S.venc.length}</b><span>contratos vencendo em 90 dias</span></div></div>
      ${ins.length ? `<h3>Leitura do período</h3><ul>${ins.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</section>`);
    }
    if (o.secs.has('carteira')) sec.push(`<section>${H('Carteira de contratos')}<p>${S.cs.length} contrato(s) cadastrados; ${S.at.length} vigentes; ${S.cs.filter(semVigencia).length} sem data de término identificada; ${S.expir.length} com vigência expirada sem registro de prorrogação.</p>
      ${tbl(['ID', 'Tomador / unidade', 'Nº', 'Início', 'Término', 'Valor mensal', 'Status'], S.cs.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true })).map(c => [esc(c.codigo), `${v(tomadorBase(c))}<br><small>${v(c.unidade || c.grupo)}</small>`, v(c.numero), v(fmtDate(c.inicio)), v(fmtDate(c.fim)), num(c.valorMensal) !== null ? esc(fmtMoney(c.valorMensal)) : v(c.valorMensal), v(c.status)]), 'small')}</section>`);
    if (o.secs.has('indicadores')) {
      const T = I.map(i => ['inss', 'fgts', 'iss', 'federais', 'outrosTributos'].reduce((s, k) => s + (num(i[k]) || 0), 0));
      sec.push(`<section>${H('Indicadores econômico-financeiros')}<p>Período analisado: ${esc(per)}.</p>
      ${chart('Receitas × custos (R$)', { labels: L, kind: 'line', series: [{ name: 'Receita', values: g('receita') }, { name: 'Custo total', values: g('custo') }, { name: 'Folha', values: g('folha') }] })}
      ${chart('Tributos e encargos, inclusive previdência (R$)', { labels: L, kind: 'stack', series: [{ name: 'INSS', values: g('inss') }, { name: 'FGTS', values: g('fgts') }, { name: 'ISS', values: g('iss') }, { name: 'PIS/COFINS/IRPJ/CSLL', values: g('federais') }, { name: 'Outros', values: g('outrosTributos') }] })}
      ${chart('Admissões × desligamentos', { labels: L, kind: 'bar', axisFmt: x => fmtNum(x), series: [{ name: 'Admissões', values: g('admissoes'), color: 'var(--s3)' }, { name: 'Desligamentos', values: g('desligamentos'), color: 'var(--s5)' }] })}
      ${I.length ? tbl(['Competência', 'Receita', 'Custo', 'Margem', 'Folha', 'Tributos/encargos', 'Carga s/ receita', 'Func.', 'Adm.', 'Desl.'], I.map((i, k) => [fmtComp(i.competencia), esc(fmtMoney(i.receita)), esc(fmtMoney(i.custo)), num(i.receita) ? fmtPct((num(i.receita) - (num(i.custo) || 0)) / num(i.receita)) : '—', esc(fmtMoney(i.folha)), esc(fmtMoney(T[k])), num(i.receita) ? fmtPct(T[k] / num(i.receita)) : '—', v(fmtNum(i.headcount)), v(fmtNum(i.admissoes)), v(fmtNum(i.desligamentos))]), 'small num') : ''}</section>`);
    }
    if (o.secs.has('obrigacoes')) sec.push(`<section>${H('Conformidade das obrigações contratuais')}<p>${S.ob.length} obrigações mapeadas. ${S.obDist.filter(x => x.value).map(x => `${x.label}: ${x.value}`).join(' · ')}.</p>
      ${S.ob.length ? tbl(['Contrato', 'Cláusula', 'Grupo', 'Obrigação', 'Status', 'Verificação'], S.ob.slice(0, 120).map(r => [esc(r.contrato), v(r.clausula), v(r.grupo), v(String(r.obrigacao || '').slice(0, 160)), v(r.status || 'sem status'), v(r.verificado)]), 'small') : ''}</section>`);
    if (o.secs.has('maodeobra')) {
      const byC = {}; S.mo.forEach(r => { const k = r.contrato; byC[k] = byC[k] || { p: 0, a: 0, prev: 0, ap: 0, div: new Set() }; byC[k].p += num(r.qtdContratada) || 0; byC[k].a += num(r.qtdAlocada) || 0; byC[k].prev += num(r.custoPrevisto) || 0; byC[k].ap += num(r.custoApurado) || 0; if (r.divergencia) byC[k].div.add(r.divergencia); });
      sec.push(`<section>${H('Mão de obra')}<p>${fmtNum(S.postos)} postos contratados; ${fmtNum(S.alocados)} com alocação comprovada. Custo previsto mensal: ${esc(fmtMoney(S.custoPrev))}${S.custoAp ? `; custo apurado: ${esc(fmtMoney(S.custoAp))}` : ''}.</p>
      ${Object.keys(byC).length ? tbl(['Contrato', 'Postos', 'Alocados', 'Custo previsto', 'Custo apurado', 'Divergências'], Object.entries(byC).sort().map(([k, x]) => [esc(k), fmtNum(x.p), fmtNum(x.a), esc(fmtMoney(x.prev)), x.ap ? esc(fmtMoney(x.ap)) : '—', esc([...x.div].join('; '))]), 'small') : ''}</section>`);
    }
    if (o.secs.has('achados')) {
      const ord = a => ({ 'critico': 0, 'alto': 1, 'medio': 2, 'baixo': 3 })[norm(a.risco)] ?? 4;
      const list = S.ach.slice().sort((a, b) => ord(a) - ord(b));
      sec.push(`<section>${H('Achados e plano de ação')}<p>${S.ach.length} achado(s) registrados, ${S.achAbertos.length} em aberto.</p>
      ${list.length ? tbl(['ID', 'Contrato', 'Área', 'Achado', 'Risco', 'Recomendação', 'Prazo', 'Status'], list.slice(0, 150).map(a => [v(a.codigo), v(a.contrato), v(a.area), v(a.achado), `<span class="r-risk ${norm(a.risco).replace(/\W/g, '')}">${v(a.risco)}</span>`, v(a.recomendacao), v(fmtDate(a.prazo)), v(a.status)]), 'small') : ''}</section>`);
    }
    if (o.secs.has('documentos')) {
      const docs = empRecs('documentos', e.id), ads = empRecs('aditivos', e.id);
      const leg = {}; docs.forEach(d => leg[d.legibilidade || 'Não informado'] = (leg[d.legibilidade || 'Não informado'] || 0) + 1);
      sec.push(`<section>${H('Cobertura documental e limitações')}<p>${docs.length} documento(s) inventariados e ${ads.length} aditivo(s) identificados. ${Object.entries(leg).map(([k, x]) => `${k}: ${x}`).join(' · ')}.</p>
      <p>Os campos marcados como <i class="r-gap">não identificado</i> correspondem a informações não localizadas nos documentos analisados e devem ser confirmadas junto ao tomador ou à área responsável. As conclusões deste relatório limitam-se aos documentos e dados disponibilizados até a data de emissão.</p></section>`);
    }
    if (o.parecer) sec.push(`<section>${H('Parecer do consultor')}<div class="r-parecer">${esc(o.parecer).replace(/\n/g, '<br>')}</div></section>`);
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(o.titulo)} — ${esc(e.razao)}</title><style>${Report.CSS}</style></head><body>
    <div class="cover"><img src="${new URL(BRAND.logoDark, location.href)}" alt=""><div class="cap">${BRAND.caption}</div><div class="rule"></div><h1>${esc(o.titulo)}</h1><p class="emp">${esc(e.razao)}${e.cnpj ? '<br>CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}</p><p class="meta">Período dos indicadores: ${esc(per)}<br>Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
    <main>${sec.join('')}
    <div class="sign"><div class="line"></div><b>${esc(o.resp || '')}</b><span>${esc(o.oab || '')}</span><span>${esc(esc0.nome || 'Amorim Firmo')} — ${BRAND.caption}</span></div></main>
    <footer>${esc(esc0.nome || 'Amorim Firmo')} · ${BRAND.caption}${o.conf ? ' · Documento confidencial — uso restrito ao cliente' : ''}</footer></body></html>`;
  },
  open(e, o) {
    const html = Report.build(e, o);
    const ov = document.createElement('div'); ov.className = 'report-ov';
    ov.innerHTML = `<div class="report-bar"><b>${icon('printer')} ${esc(o.titulo)}</b><span class="sp"></span><button class="btn primary" id="rPrint">${icon('printer')} Imprimir / salvar PDF</button><button class="btn ghost light" id="rHtml">${icon('download')} Baixar HTML</button><button class="icon-btn light" id="rClose">${icon('x')}</button></div><iframe title="Relatório"></iframe>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    const fr = $('iframe', ov); fr.srcdoc = html;
    $('#rPrint').onclick = () => fr.contentWindow.print();
    $('#rHtml').onclick = () => download(new Blob([html], { type: 'text/html' }), `Relatorio_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.html`);
    $('#rClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
  },
  CSS: `@page{size:A4;margin:18mm 16mm 20mm}*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#1d2433;font-size:10.5pt;line-height:1.5;margin:0;
  --s1:#2f6bb3;--s2:#c98a1e;--s3:#1d9a7c;--s4:#7056c9;--s5:#c4485e;--chart-bg:#fff}
  .cover{height:257mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always}
  .cover img{width:62mm}.cap{font:600 9pt 'Helvetica Neue',Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#9a7741;margin-top:4mm}
  .rule{width:40mm;height:1px;background:#b08a4e;margin:14mm 0 10mm}.cover h1{font-weight:400;font-size:24pt;margin:0 0 6mm;color:#14203a}.emp{font-size:13pt;margin:0 0 10mm}.meta{font:9.5pt Arial,sans-serif;color:#6b6f7b}
  main{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9.5pt}h2{font-family:Georgia,serif;font-weight:400;color:#14203a;font-size:15pt;border-bottom:1px solid #d9c49a;padding-bottom:2mm;margin:9mm 0 4mm;page-break-after:avoid}
  h2 span{color:#b08a4e;margin-right:2mm}h3{font-size:10.5pt;color:#14203a;margin:5mm 0 2mm}section{page-break-inside:auto}
  .r-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:3mm 0 5mm}.r-kpis div{border:1px solid #e7e0d2;border-left:3px solid #b08a4e;padding:3mm 4mm;border-radius:2mm}.r-kpis b{display:block;font:400 16pt Georgia,serif;color:#14203a}.r-kpis span{color:#6b6f7b;font-size:8.5pt}
  .r-t{width:100%;border-collapse:collapse;margin:2mm 0 4mm}.r-t th{background:#14203a;color:#fff;font-weight:600;text-align:left;padding:1.6mm 2mm;font-size:8pt}.r-t td{border-bottom:1px solid #ece6da;padding:1.5mm 2mm;vertical-align:top}.r-t.small{font-size:7.8pt}.r-t.num td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}.r-t tr{page-break-inside:avoid}
  .r-gap{color:#9a6b1e}.r-muted{color:#6b6f7b;font-style:italic}.r-risk.alto,.r-risk.critico{color:#b4233c;font-weight:700}.r-risk.medio{color:#a86a12;font-weight:600}
  figure{margin:3mm 0 6mm;page-break-inside:avoid}figcaption{font-weight:600;color:#14203a;margin-bottom:1mm}svg{width:100%;height:auto}.grid{stroke:#eee9df}.axis0{stroke:#b9b3a6}.tick{font:9px Arial,sans-serif;fill:#6b6f7b}.xhair,.hit{display:none}
  .legend{display:flex;gap:4mm;flex-wrap:wrap;font-size:8pt;color:#4a4f5c;margin-bottom:1mm}.legend i{display:inline-block;width:3mm;height:3mm;border-radius:1mm;margin-right:1.2mm;vertical-align:-.3mm}
  .r-parecer{border-left:3px solid #b08a4e;padding:2mm 5mm;background:#faf7f0}
  .sign{margin:18mm auto 0;width:80mm;text-align:center;display:flex;flex-direction:column;gap:.6mm;page-break-inside:avoid}.sign .line{border-top:1px solid #1d2433;margin-bottom:2mm}.sign span{color:#6b6f7b;font-size:8.5pt}
  footer{position:fixed;bottom:-12mm;left:0;right:0;text-align:center;font:7.5pt Arial,sans-serif;color:#8a8e98}
  @media screen{body{background:#e9e6df}.cover,main{background:#fff;max-width:210mm;margin:8mm auto;padding:16mm;box-shadow:0 2px 14px rgba(0,0,0,.08)}.cover{height:auto;min-height:250mm}footer{position:static;padding:4mm 0 10mm}}`
};
