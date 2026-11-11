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
    <div class="sign"><div class="line"></div><b>${esc(o.resp || '')}</b><span>${esc(o.oab || '')}</span><span>${esc(nomeMarca())} — ${BRAND.caption}</span></div></main>
    <footer>${esc(nomeMarca())} · ${BRAND.caption}${o.conf ? ' · Documento confidencial — uso restrito ao cliente' : ''}</footer></body></html>`;
  },
  open(e, o) { Report.mostrar(Report.build(e, o), o.titulo, `Relatorio_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.html`); },
  mostrar(html, titulo, arquivo) {
    const ov = document.createElement('div'); ov.className = 'report-ov';
    ov.innerHTML = `<div class="report-bar"><b>${icon('printer')} ${esc(titulo)}</b><span class="sp"></span><button class="btn primary" id="rPrint">${icon('printer')} Imprimir / salvar PDF</button><button class="btn ghost light" id="rHtml">${icon('download')} Baixar HTML</button><button class="icon-btn light" id="rClose">${icon('x')}</button></div><iframe title="Relatório"></iframe>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    const fr = $('iframe', ov); fr.srcdoc = html;
    $('#rPrint').onclick = () => fr.contentWindow.print();
    $('#rHtml').onclick = () => download(new Blob([html], { type: 'text/html' }), arquivo);
    $('#rClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
  },
  /* ---------- Relação de processos do escritório ---------- */
  processos(lista, { area, situacao, busca }) {
    const E = escritorio(), A = area ? AREAS[area] : null, agora = new Date();
    const titulo = A ? 'Direito ' + (A.nome === 'Cível' ? 'Civil' : A.nome) : 'Todos os processos';
    const ultMov = p => DB.where('movimentos', m => m.processoId === p.id).sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];
    const proxComp = p => DB.where('prazos', z => z.processoId === p.id && !z.concluido && String(z.data) >= todayISO()).sort((a, b) => String(a.data).localeCompare(String(b.data)))[0];
    const ordem = Object.keys(AREAS);
    const ps = lista.slice().sort((a, b) => ordem.indexOf(a.area) - ordem.indexOf(b.area) || String(a.numero).localeCompare(String(b.numero)));
    const valor = ps.reduce((s, p) => s + (num(p.valorCausa) || 0), 0), comValor = ps.filter(p => num(p.valorCausa) > 0).length;
    const ativos = ps.filter(p => (p.status || 'Ativo') === 'Ativo').length, tj = ps.filter(p => p.transito).length;
    const clientesN = new Set(ps.flatMap(p => p.clienteIds || [])).size;
    const porArea = ordem.map(k => [k, ps.filter(p => p.area === k).length]).filter(([, n]) => n);
    const filtros = [situacao && 'Situação: ' + situacao, busca && `Busca: “${busca}”`].filter(Boolean).join(' · ');
    const contato = [E.endereco, E.email, E.whatsapp && 'WhatsApp ' + E.whatsapp].filter(Boolean).map(esc).join('<span class="dot">·</span>');
    const linha = (p, i) => {
      const u = ultMov(p), z = proxComp(p), cli = (p.clienteIds || []).map(id => DB.get('clientes', id)?.nome).filter(Boolean).join(', ');
      return `<tr><td class="n">${i + 1}</td>
        <td><b class="cnj">${esc(fmtCNJ(p.numero))}</b><small>${esc([p.tribunal, p.orgao].filter(Boolean).join(' · '))}</small>${p.distribuicao ? `<small>Distribuído em ${esc(fmtDate(p.distribuicao))}</small>` : ''}</td>
        <td><b class="cli">${cli ? esc(cli) : '<i class="gap">cliente a definir</i>'}</b>${p.polo ? ` <small class="polo">${esc(p.polo)}</small>` : ''}${p.parteContraria ? `<small class="vs">× ${esc(p.parteContraria)}</small>` : ''}</td>
        <td>${esc(p.classe || '—')}${p.assunto ? `<small>${esc(p.assunto)}</small>` : ''}</td>
        <td class="r">${num(p.valorCausa) > 0 ? esc(fmtMoney(p.valorCausa)) : '—'}</td>
        <td><span class="st st-${norm(p.status || 'Ativo').replace(/\s+/g, '-')}">${esc(p.status || 'Ativo')}</span>${p.fase ? `<small>${esc(p.fase)}</small>` : ''}${p.transito ? `<small class="tj">Trânsito em ${esc(fmtDate(p.transito))}</small>` : ''}</td>
        <td>${u ? `<b class="d">${esc(fmtDate(u.data))}</b><small>${esc(String(u.titulo || '').replace(/ \((DJEN|DataJud)\)$/, '').slice(0, 70))}</small>` : '—'}${z ? `<small class="prox">Próximo: ${esc(z.tipo || '')} em ${esc(fmtDate(z.data))}</small>` : ''}</td></tr>`;
    };
    let i = 0;
    const grupos = A ? `<tbody>${ps.map(p => linha(p, i++)).join('')}</tbody>` : porArea.map(([k, n]) => `<tbody><tr class="grp"><td colspan="7">${esc(AREAS[k].nome)} <span>${n} processo(s)</span></td></tr>${ps.filter(p => p.area === k).map(p => linha(p, i++)).join('')}</tbody>`).join('');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relação de processos — ${esc(E.nome || 'Amorim Firmo')}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${Report.CSS_REL}@page{@bottom-left{content:"${String(nomeMarca()).replace(/["\\]/g, '')} — ${BRAND.caption} · Documento interno, protegido pelo sigilo profissional (Lei 8.906/94, art. 7º, II)";font:7pt Manrope,Arial,sans-serif;color:#8a8e98}}</style></head><body><div class="folha">
      <header class="cab">
        <div class="marca"><img src="${new URL(BRAND.logoDark, location.href)}" alt="">
          <div><div class="nome">${esc(nomeMarca().toUpperCase())}</div><div class="leg">${esc(BRAND.caption)}</div>
          ${E.advogado ? `<div class="resp">${esc(E.advogado)}${E.oab ? ` <span class="dot">·</span> ${esc(oabFmt(E.oab))}` : ''}</div>` : ''}${contato ? `<div class="cont">${contato}</div>` : ''}</div></div>
        <div class="doc"><div class="tipo">Relação de processos</div><h1>${esc(titulo)}</h1>${filtros ? `<div class="filt">${filtros}</div>` : ''}
          <div class="emit">Emitido em ${agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}, às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br>por ${esc(Session.user?.nome || Session.user?.email || '')}</div></div>
      </header>
      <div class="filete"></div>
      <section class="kpis">
        <div><b>${ps.length}</b><span>processo(s) relacionados</span></div>
        <div><b>${ativos}</b><span>em andamento</span></div>
        <div><b>${clientesN}</b><span>cliente(s)</span></div>
        <div><b>${valor ? esc(fmtMoneyShort(valor)) : '—'}</b><span>valor das causas${comValor < ps.length ? ` · informado em ${comValor} de ${ps.length}` : ''}</span></div>
        <div><b>${tj}</b><span>com trânsito em julgado</span></div>
      </section>
      ${!A && porArea.length > 1 ? `<div class="areas">${porArea.map(([k, n]) => `<span><i style="width:${Math.max(4, Math.round(n / ps.length * 100))}%"></i>${esc(AREAS[k].nome)} <b>${n}</b></span>`).join('')}</div>` : ''}
      <table class="rel"><thead><tr><th class="n">#</th><th style="width:25%">Processo / juízo</th><th style="width:22%">Cliente × parte contrária</th><th style="width:15%">Classe / assunto</th><th class="r">Valor da causa</th><th>Situação</th><th style="width:15%">Última movimentação</th></tr></thead>${grupos}</table>
      ${ps.length ? '' : '<p class="vazio">Nenhum processo com os filtros aplicados.</p>'}
      <p class="nota">Fontes: cadastro do escritório, DataJud (CNJ) e Diário de Justiça Eletrônico Nacional (DJEN). Valores da causa conforme informados no cadastro.</p>
      <footer><span>${esc(nomeMarca())} — ${esc(BRAND.caption)}</span><span>Documento interno · informação sigilosa protegida pelo sigilo profissional (Lei 8.906/94, art. 7º, II)</span></footer>
      </div></body></html>`;
    Report.mostrar(html, 'Relação de processos — ' + titulo, `Relacao_processos_${A ? area + '_' : ''}${todayISO()}.html`);
  },
  CSS_REL: `@page{size:A4 portrait;margin:13mm 12mm 16mm;@bottom-right{content:"Página " counter(page) " de " counter(pages);font:7.5pt Manrope,Arial,sans-serif;color:#8a8e98}}
  *{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font:8pt/1.4 Manrope,'Helvetica Neue',Arial,sans-serif;color:#1d2433}
  .cab{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;padding-bottom:4mm}
  .marca{display:flex;align-items:center;gap:4mm}.marca img{width:20mm;height:auto}
  .nome{font:600 18pt/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.16em;color:#121c33}
  .leg{font:600 6.4pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43;margin:1.6mm 0 2.6mm}
  .resp{font-weight:600;font-size:8pt;color:#121c33}.cont{font-size:7.2pt;max-width:95mm;color:#5d6270;margin-top:.6mm}.dot{color:#b08a4e;margin:0 1.6mm}
  .doc{text-align:right;max-width:70mm}.tipo{font:700 7pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43}
  .doc h1{font:600 17pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33;margin:1mm 0 1.2mm}.filt{font-size:8pt;color:#121c33;margin-bottom:1mm}.emit{font-size:7.6pt;color:#6b6f7b}
  .filete{height:3px;border-top:1.2pt solid #b08a4e;border-bottom:.5pt solid #b08a4e;margin-bottom:4.5mm}
  .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin-bottom:3.5mm}
  .kpis div{border:1px solid #e7e0d2;border-left:2.5pt solid #b08a4e;border-radius:1.6mm;padding:2.2mm 2.6mm;background:#fcfaf5}
  .kpis b{display:block;font:600 13.5pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33}.kpis span{font-size:6.8pt;line-height:1.3;display:block;color:#6b6f7b}
  .areas{display:flex;flex-wrap:wrap;gap:2mm 6mm;margin:0 0 4mm;font-size:7.8pt;color:#4a4f5c}.areas span{display:inline-flex;align-items:center;gap:1.6mm}.areas i{display:inline-block;height:2mm;min-width:3mm;max-width:22mm;background:#121c33;border-radius:1mm}.areas b{color:#121c33}
  table.rel{width:100%;border-collapse:collapse}
  .rel thead th{background:#121c33;color:#fff;font:700 6.3pt Manrope,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-align:left;padding:2.2mm 2mm;border-bottom:1.5pt solid #b08a4e}
  .rel td{padding:1.8mm 1.6mm;border-bottom:.5pt solid #e7e0d2;vertical-align:top}.rel tr{page-break-inside:avoid}
  .rel tbody tr:nth-child(even):not(.grp) td{background:#fbf9f4}
  .rel small{display:block;color:#6b6f7b;font-size:6.9pt;margin-top:.5mm}.rel .cnj{font-variant-numeric:tabular-nums;letter-spacing:.01em;white-space:nowrap}
  .rel .n{width:7mm;color:#a07c43;font-weight:700;text-align:center}.rel .r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.rel .c{text-align:center;white-space:nowrap}
  .rel .d{font-weight:600}.rel .cli{font-weight:600;color:#121c33}.rel small.polo{display:inline;margin:0}.rel .vs{color:#4a4f5c}.rel .gap{color:#a86a12}.rel .tj{color:#6a4fb3}.rel .prox{color:#1d7a63}
  .grp td{background:#f3ede0!important;font:600 11pt 'Cormorant Garamond',Georgia,serif;color:#121c33;letter-spacing:.04em;padding:2.2mm 2.4mm;border-bottom:.8pt solid #b08a4e}.grp span{font:600 7.2pt Manrope,Arial,sans-serif;color:#a07c43;letter-spacing:.12em;text-transform:uppercase;margin-left:3mm}
  .st{display:inline-block;padding:.3mm 2mm;border-radius:5mm;font-weight:700;font-size:7.2pt;background:#e5f2ec;color:#1d7a63}.st-encerrado,.st-arquivado-provisoriamente{background:#ecebe8;color:#5d6270}.st-suspenso,.st-sobrestado{background:#fbf0dc;color:#9a6b1e}
  .vazio{text-align:center;color:#6b6f7b;padding:10mm}.nota{font-size:7pt;color:#8a8e98;margin-top:3mm}
  @media print{footer{display:none!important}}
  footer{display:flex;justify-content:space-between;font-size:7pt;color:#8a8e98;border-top:.5pt solid #e7e0d2;padding-top:1.4mm}
  @media screen{body{background:#e9e6df;padding:8mm 0}.folha{background:#fff;max-width:210mm;margin:0 auto;padding:13mm 12mm 6mm;box-shadow:0 2px 16px rgba(0,0,0,.09)}footer{position:static;margin-top:5mm}}`,
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
