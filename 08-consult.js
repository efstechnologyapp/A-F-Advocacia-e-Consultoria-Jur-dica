/* =====================================================================
   CONSULTORIA JURÍDICA — empresas, auditoria de contratos, painel,
   importação/exportação Excel
   ===================================================================== */
const TABS = [
  ['painel', 'Painel', 'chart'], ['contratos', 'Contratos', 'file'], ['obrigacoes', 'Obrigações', 'check'], ['maoDeObra', 'Mão de obra', 'users'],
  ['materiais', 'Materiais', 'layers'], ['financeiro', 'Financeiro', 'briefcase'], ['medicoes', 'Medições', 'list'], ['indicadores', 'Indicadores', 'chart'],
  ['achados', 'Achados e plano de ação', 'alert'], ['documentos', 'Documentos', 'file'], ['aditivos', 'Aditivos', 'edit'], ['relatorios', 'Relatórios', 'printer']
];
const empRecs = (c, eid) => DB.where(c, r => r.empresaId === eid);
const tomadorBase = c => String(c.tomador || '').split(/ [–-] /)[0].replace(/\(ver unidade\)/i, '').trim() || 'Não informado';

const Consult = {
  list(v) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Empresas' }]);
    const emps = DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>Empresas</h1><p class="muted">Empresas atendidas na gestão e auditoria de contratos.</p></div><div class="actions"><button class="btn primary" id="nEmp">${icon('plus')} Nova empresa</button></div></div>
    ${emps.length ? `<div class="emp-grid">${emps.map(e => {
      const cs = empRecs('contratos', e.id), at = cs.filter(contratoAtivo), ach = empRecs('achados', e.id).filter(achadoAberto);
      const cart = at.reduce((s, c) => s + (num(c.valorMensal) || 0), 0);
      return `<a class="emp-card" href="#/empresa/${e.id}"><div class="emp-ini">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div class="emp-body"><b>${esc(e.fantasia || e.razao)}</b><small>${esc(e.razao)}${e.cnpj ? ' · ' + esc(fmtDoc(e.cnpj)) : ''}</small>
        <div class="emp-stats"><span><b>${cs.length}</b> contratos</span><span><b>${at.length}</b> vigentes</span><span><b>${ach.length}</b> achados abertos</span>${cart ? `<span><b>${fmtMoneyShort(cart)}</b>/mês</span>` : ''}</div></div>${icon('chevR')}</a>`;
    }).join('')}</div>` : `<div class="empty big">${icon('building')}<h3>Nenhuma empresa cadastrada</h3><p>Cadastre a primeira empresa e importe a planilha de auditoria dos contratos.</p><button class="btn primary" id="nEmp2">${icon('plus')} Cadastrar empresa</button></div>`}`;
    $('#nEmp').onclick = () => Consult.editEmpresa(null);
    $('#nEmp2') && ($('#nEmp2').onclick = () => Consult.editEmpresa(null));
  },
  editEmpresa(e) { UI.editRecord('empresas', e, { onSaved: s => { location.hash = '#/empresa/' + s.id; App.render(); } }); },

  workspace(v, eid, tab) {
    const e = DB.get('empresas', eid);
    if (!e) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Empresa não encontrada.</p></div>`; return; }
    const T = TABS.find(t => t[0] === tab) || TABS[0];
    App.crumbs([{ t: 'Consultoria', href: '/empresas' }, { t: e.fantasia || e.razao, href: '/empresa/' + eid }, { t: T[1] }]);
    const count = c => empRecs(c, eid).length;
    v.innerHTML = `<div class="ws-h"><div class="emp-ini lg">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div><span class="eyebrow">Consultoria jurídica</span><h1>${esc(e.fantasia || e.razao)}</h1><p class="muted">${esc(e.razao)}${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}${e.segmento ? ' · ' + esc(e.segmento) : ''}</p></div>
      <div class="actions wrap"><button class="btn ghost" id="wEdit">${icon('edit')} Empresa</button><label class="btn ghost">${icon('upload')} Importar planilha<input type="file" id="wImp" accept=".xlsx" hidden></label><button class="btn ghost" id="wExp">${icon('download')} Exportar Excel</button><button class="btn primary" id="wRep">${icon('printer')} Relatório</button></div></div>
      <div class="tabs scroll">${TABS.map(([k, l, i]) => `<a href="#/empresa/${eid}/${k}" class="${k === T[0] ? 'on' : ''}">${l}${SCHEMAS[k] ? `<em>${count(k)}</em>` : ''}</a>`).join('')}</div>
      <div id="wsBody"></div>`;
    $('#wEdit').onclick = () => Consult.editEmpresa(e);
    $('#wImp').onchange = ev => ev.target.files[0] && Consult.importar(e, ev.target.files[0]);
    $('#wExp').onclick = () => Consult.exportar(e);
    $('#wRep').onclick = () => Report.dialog(e);
    const body = $('#wsBody');
    if (T[0] === 'painel') Consult.painel(body, e);
    else if (T[0] === 'relatorios') Report.tab(body, e);
    else Consult.tabela(body, e, T[0]);
  },

  tabela(host, e, coll) {
    const sc = SCHEMAS[coll], rows = empRecs(coll, e.id);
    const ctx = { empresaId: e.id };
    const filters = [];
    if (sc.fields.find(f => f.k === 'contrato')) filters.push({ k: 'contrato', label: 'Contrato', opts: [...new Set(rows.map(r => r.contrato).filter(Boolean))].sort() });
    const stF = sc.fields.find(f => (f.k === 'status' || f.k === 'risco') && f.type === 'select'); if (stF) filters.push({ k: stF.k, label: stF.label.split(' (')[0], opts: [...new Set(rows.map(r => r[stF.k]).filter(Boolean))] });
    const gaps = rows.reduce((s, r) => s + sc.fields.filter(f => isGap(r[f.k])).length, 0);
    host.innerHTML = `${coll === 'indicadores' ? `<div class="notice soft">${icon('chart')}<div>Lance mês a mês a receita, custos, folha, tributos (INSS, FGTS, ISS, federais) e a movimentação de pessoal. Esses dados alimentam os gráficos do <b>Painel</b> e do relatório.</div></div>` : ''}
      ${gaps ? `<div class="notice warn">${icon('alert')}<div><b>${gaps} campo(s) “não identificado no contrato”</b> nesta aba — lacunas documentais que reduzem o índice de completude. Clique no registro para completar quando o documento for obtido.</div></div>` : ''}
      <section class="card flush" id="dt"></section>`;
    const open = r => coll === 'contratos' ? Consult.contrato360(e, r) : UI.editRecord(coll, r, { ctx });
    dataTable($('#dt'), { id: coll + e.id, rows, schema: sc, filters, onOpen: open, actions: `<button class="btn primary sm" id="dtNew">${icon('plus')} Novo</button>`, emptyMsg: `Nenhum registro em ${sc.titulo}. Use “Novo” ou importe a planilha.` });
    $('#dtNew').onclick = () => {
      const base = {}; if (coll === 'contratos' && e.sigla) { const n = rows.map(r => +(String(r.codigo).match(/(\d+)$/) || [0, 0])[1]).reduce((a, b) => Math.max(a, b), 0) + 1; base.codigo = `${e.sigla}-${String(n).padStart(3, '0')}`; }
      if (coll === 'achados') base.status = 'Pendente';
      UI.editRecord(coll, base, { ctx, extraBase: { empresaId: e.id } });
    };
    const k = new URLSearchParams(location.hash.split('?')[1] || '').get('k');
    if (k && coll === 'contratos') { const r = DB.get('contratos', k); r && Consult.contrato360(e, r); }
  },

  /* visão 360º do contrato: tudo que se relaciona a ele */
  contrato360(e, c) {
    const rel = coll => DB.where(coll, r => r.empresaId === e.id && r.contrato === c.codigo);
    const ob = rel('obrigacoes'), mo = rel('maoDeObra'), fi = rel('financeiro'), ac = rel('achados'), dc = rel('documentos'), ad = rel('aditivos'), me = rel('medicoes'), ma = rel('materiais');
    const d = isISO(c.fim) ? daysUntil(c.fim) : null;
    const postos = mo.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), custoPrev = mo.reduce((s, r) => s + (num(r.custoPrevisto) || 0), 0);
    const filled = SCHEMAS.contratos.fields.filter(f => c[f.k] !== null && c[f.k] !== undefined && c[f.k] !== '' && !isGap(c[f.k])).length;
    const compl = filled / SCHEMAS.contratos.fields.length;
    const mini = (titulo, coll, list, cols) => `<h4 class="sec">${titulo} <span class="count">${list.length}</span></h4>${list.length ? `<div class="table-wrap"><table class="mini"><thead><tr>${cols.map(k => `<th>${esc(SCHEMAS[coll].fields.find(f => f.k === k).label.replace(/ \(R\$\)/, ''))}</th>`).join('')}</tr></thead><tbody>${list.slice(0, 30).map(r => `<tr data-rel="${coll}:${r.id}">${cols.map(k => `<td>${UI.cell(SCHEMAS[coll].fields.find(f => f.k === k), r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Nenhum registro.</p>'}`;
    const m = UI.modal({
      title: `${c.codigo} · ${c.unidade || c.grupo || ''}`, sub: esc(c.tomador || ''), wide: true,
      body: `<div class="kpis xs">${kpi('Vigência', c.fim ? fmtDate(c.fim) : '—', d === null ? '' : d < 0 ? `expirada há ${-d} dias` : `${d} dias restantes`, d !== null && d < 0 ? 'bad' : d !== null && d <= 90 ? 'warn' : '')}${kpi('Valor mensal', num(c.valorMensal) !== null ? fmtMoneyShort(c.valorMensal) : '—', num(c.valorMensal) === null ? 'não identificado' : '')}${kpi('Postos contratados', postos || '—', custoPrev ? 'custo previsto ' + fmtMoneyShort(custoPrev) : '')}${kpi('Completude do cadastro', fmtPct(compl), filled + ' de ' + SCHEMAS.contratos.fields.length + ' campos', compl < .6 ? 'warn' : '')}</div>
      <div class="detail-grid">${SCHEMAS.contratos.fields.filter(f => !['codigo'].includes(f.k)).map(f => `<div class="${f.type === 'long' ? 'full' : ''}"><span class="lbl">${esc(f.label)}</span>${f.type === 'long' && c[f.k] && !isGap(c[f.k]) ? esc(c[f.k]) : UI.cell(f, c[f.k])}</div>`).join('')}</div>
      ${mini('Achados e plano de ação', 'achados', ac, ['codigo', 'area', 'achado', 'risco', 'status'])}
      ${mini('Obrigações', 'obrigacoes', ob, ['clausula', 'grupo', 'obrigacao', 'status'])}
      ${mini('Mão de obra', 'maoDeObra', mo, ['posto', 'qtdContratada', 'salario', 'custoPrevisto', 'divergencia'])}
      ${mini('Financeiro', 'financeiro', fi, ['tipo', 'grupo', 'descricao', 'previsto', 'realizado'])}
      ${me.length ? mini('Medições', 'medicoes', me, ['competencia', 'numero', 'valorMedido', 'valorFaturado', 'glosa']) : ''}
      ${ma.length ? mini('Materiais', 'materiais', ma, ['item', 'qtdPrevista', 'qtdEntregue', 'valorTotal']) : ''}
      ${mini('Documentos', 'documentos', dc, ['tipo', 'arquivo', 'paginas', 'legibilidade'])}
      ${ad.length ? mini('Aditivos', 'aditivos', ad, ['nome', 'datas', 'valor']) : ''}`,
      foot: `<button class="btn ghost danger-text" id="cDel">${icon('trash')} Excluir</button><span class="sp"></span><button class="btn ghost" id="cAch">${icon('alert')} Registrar achado</button><button class="btn primary" id="cEd">${icon('edit')} Editar contrato</button>`
    });
    $('#cEd', m).onclick = () => UI.editRecord('contratos', c, { ctx: { empresaId: e.id } });
    $('#cAch', m).onclick = () => UI.editRecord('achados', { contrato: c.codigo, status: 'Pendente' }, { ctx: { empresaId: e.id }, extraBase: { empresaId: e.id } });
    $('#cDel', m).onclick = async () => { if (!await UI.confirm(`Excluir o contrato ${c.codigo}? Os registros das outras abas são mantidos.`, 'Excluir')) return; await DB.remove('contratos', c.id); UI.closeModal(); App.render(); };
    $$('[data-rel]', m).forEach(tr => tr.onclick = () => { const [coll, id] = tr.dataset.rel.split(':'); UI.editRecord(coll, DB.get(coll, id), { ctx: { empresaId: e.id } }); });
  },

  /* ---------------- PAINEL / DASHBOARD ---------------- */
  stats(e, de, ate) {
    const cs = empRecs('contratos', e.id), at = cs.filter(contratoAtivo);
    const comVal = at.filter(c => num(c.valorMensal) !== null);
    const venc = cs.filter(c => isISO(c.fim) && daysUntil(c.fim) >= 0 && daysUntil(c.fim) <= 90);
    const expir = cs.filter(c => isISO(c.fim) && daysUntil(c.fim) < 0 && !/encerrad/i.test((c.status || '') + (c.grupo || '')));
    const fields = SCHEMAS.contratos.fields;
    const compl = cs.length ? cs.reduce((s, c) => s + fields.filter(f => c[f.k] !== null && c[f.k] !== undefined && c[f.k] !== '' && !isGap(c[f.k])).length, 0) / (cs.length * fields.length) : null;
    const ob = empRecs('obrigacoes', e.id), ach = empRecs('achados', e.id), mo = empRecs('maoDeObra', e.id);
    const obSt = s => ob.filter(o => norm(o.status).startsWith(s)).length;
    const obVerif = ob.filter(o => o.status && !/n[aã]o verificad|n[aã]o aplic/i.test(o.status));
    const conf = obVerif.length ? ob.filter(o => /^cumprido/i.test(o.status || '')).length / obVerif.length : null;
    let ind = empRecs('indicadores', e.id).filter(i => /^\d{4}-\d{2}$/.test(i.competencia || '')).sort((a, b) => a.competencia.localeCompare(b.competencia));
    if (de) ind = ind.filter(i => i.competencia >= de); if (ate) ind = ind.filter(i => i.competencia <= ate);
    return {
      cs, at, comVal, carteira: comVal.reduce((s, c) => s + num(c.valorMensal), 0), venc, expir, compl, ob, ach, mo, conf,
      obDist: [['Cumprido', 'cumprido', 'var(--good)'], ['Parcialmente cumprido', 'parcial', 'var(--warning)'], ['Não cumprido', 'nao cumprido', 'var(--critical)'], ['Não verificado', 'nao verificado', 'var(--muted-mark)']].map(([l, k, c]) => ({ label: l, value: obSt(k), color: c })).concat([{ label: 'Sem status', value: ob.filter(o => !o.status).length, color: 'var(--line-strong)' }]),
      achAbertos: ach.filter(achadoAberto), ind,
      postos: mo.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), alocados: mo.reduce((s, r) => s + (num(r.qtdAlocada) || 0), 0),
      custoPrev: mo.reduce((s, r) => s + (num(r.custoPrevisto) || 0), 0), custoAp: mo.reduce((s, r) => s + (num(r.custoApurado) || 0), 0)
    };
  },
  insights(S) {
    const out = [], I = S.ind;
    if (I.length >= 2) {
      const a = I[I.length - 2], b = I[I.length - 1], var_ = (x, y) => num(x) && num(y) !== null ? (num(y) - num(x)) / Math.abs(num(x)) : null;
      const vr = var_(a.receita, b.receita), vc = var_(a.custo, b.custo);
      if (vr !== null) out.push(`A receita ${vr >= 0 ? 'subiu' : 'caiu'} ${fmtPct(Math.abs(vr))} em ${fmtComp(b.competencia)} frente a ${fmtComp(a.competencia)}.`);
      if (vc !== null) out.push(`Os custos ${vc >= 0 ? 'subiram' : 'caíram'} ${fmtPct(Math.abs(vc))} no mesmo período${vr !== null && vc > vr ? ' — acima da variação da receita, o que pressiona a margem' : ''}.`);
    }
    const rec = I.reduce((s, i) => s + (num(i.receita) || 0), 0), cus = I.reduce((s, i) => s + (num(i.custo) || 0), 0);
    const trib = I.reduce((s, i) => s + ['inss', 'fgts', 'iss', 'federais', 'outrosTributos'].reduce((t, k) => t + (num(i[k]) || 0), 0), 0);
    if (rec) { out.push(`Margem bruta acumulada no período: ${fmtPct((rec - cus) / rec)}; carga de tributos e encargos sobre a receita: ${fmtPct(trib / rec)}.`); }
    const adm = I.reduce((s, i) => s + (num(i.admissoes) || 0), 0), des = I.reduce((s, i) => s + (num(i.desligamentos) || 0), 0);
    const hc = I.filter(i => num(i.headcount) !== null); const hcm = hc.length ? hc.reduce((s, i) => s + num(i.headcount), 0) / hc.length : 0;
    if (adm || des) out.push(`Foram ${fmtNum(adm)} admissões e ${fmtNum(des)} desligamentos${hcm ? `; rotatividade média de ${fmtPct(((adm + des) / 2) / hcm / Math.max(1, I.length))} ao mês` : ''}.`);
    if (S.expir.length) out.push(`${S.expir.length} contrato(s) com vigência expirada sem registro de prorrogação ou encerramento.`);
    if (S.compl !== null && S.compl < .7) out.push(`O cadastro contratual tem completude de ${fmtPct(S.compl)}: há lacunas documentais (valores, CCT, fiscal, reajuste) que limitam a auditoria.`);
    const alto = S.achAbertos.filter(a => /alto|cr[ií]tico/i.test(a.risco || '')).length;
    if (alto) out.push(`${alto} achado(s) de risco alto/crítico aguardam providência.`);
    return out;
  },
  painel(host, e) {
    const st = Consult._per = Consult._per || { p: '12' };
    const allInd = empRecs('indicadores', e.id).map(i => i.competencia).filter(c => /^\d{4}-\d{2}$/.test(c || '')).sort();
    let de = null; if (st.p !== 'all' && allInd.length) { const last = allInd[allInd.length - 1]; const d = new Date(last + '-01T12:00:00'); d.setMonth(d.getMonth() - (+st.p - 1)); de = d.toISOString().slice(0, 7); }
    const S = Consult.stats(e, de);
    const porTom = {}; S.cs.forEach(c => { const t = tomadorBase(c); porTom[t] = (porTom[t] || 0) + 1; });
    const venc12 = []; for (let i = 0; i < 12; i++) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + i); const k = d.toISOString().slice(0, 7); venc12.push({ k, n: S.cs.filter(c => isISO(c.fim) && c.fim.slice(0, 7) === k).length }); }
    const achRisco = RISCOS.map((r, i) => ({ label: r, value: S.achAbertos.filter(a => norm(a.risco) === norm(r)).length, color: ['var(--info)', 'var(--warning)', 'var(--serious)', 'var(--critical)'][i] }));
    const achArea = {}; S.achAbertos.forEach(a => achArea[a.area || 'Outros'] = (achArea[a.area || 'Outros'] || 0) + 1);
    const ins = Consult.insights(S);
    host.innerHTML = `
    <div class="kpis">
      ${kpi('Contratos vigentes', `${S.at.length}<small>/${S.cs.length}</small>`, `${S.venc.length} vencem em 90 dias · ${S.cs.filter(semVigencia).length} sem data de término`, S.venc.length ? 'warn' : '', `#/empresa/${e.id}/contratos`)}
      ${kpi('Carteira mensal', S.carteira ? fmtMoneyShort(S.carteira) : '—', S.at.length ? `valor conhecido em ${S.comVal.length} de ${S.at.length} vigentes` : '')}
      ${kpi('Completude documental', fmtPct(S.compl), 'campos do cadastro preenchidos', S.compl !== null && S.compl < .7 ? 'warn' : '')}
      ${kpi('Conformidade das obrigações', fmtPct(S.conf), `${S.ob.length} obrigações mapeadas`, S.conf !== null && S.conf < .8 ? 'warn' : '', `#/empresa/${e.id}/obrigacoes`)}
      ${kpi('Achados em aberto', S.achAbertos.length, `${achRisco[2].value + achRisco[3].value} de risco alto/crítico`, achRisco[2].value + achRisco[3].value ? 'bad' : '', `#/empresa/${e.id}/achados`)}
      ${kpi('Postos contratados', fmtNum(S.postos), S.custoPrev ? 'custo previsto ' + fmtMoneyShort(S.custoPrev) + '/mês' : '', '', `#/empresa/${e.id}/maoDeObra`)}
    </div>
    ${ins.length ? `<section class="card insight"><header><h2>${icon('sparkle')} Leitura do período</h2><span class="muted small">gerada automaticamente a partir dos dados</span></header><ul>${ins.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>` : ''}
    <div class="seg-tabs"><span class="muted small">Indicadores econômico-financeiros:</span>${[['6', '6 meses'], ['12', '12 meses'], ['24', '24 meses'], ['all', 'Tudo']].map(([k, l]) => `<button class="${st.p === k ? 'on' : ''}" data-per="${k}">${l}</button>`).join('')}<span class="sp"></span><a class="link small" href="#/empresa/${e.id}/indicadores">${icon('edit')} Lançar indicadores</a></div>
    <div class="grid2">
      <section class="card"><header><h2>Receitas × custos</h2></header><div data-chart="rc"></div></section>
      <section class="card"><header><h2>Tributos e encargos (inclui previdência)</h2></header><div data-chart="tr"></div></section>
      <section class="card"><header><h2>Admissões × desligamentos</h2></header><div data-chart="ad"></div></section>
      <section class="card"><header><h2>Funcionários ativos</h2></header><div data-chart="hc"></div></section>
      <section class="card"><header><h2>Margem bruta (%)</h2></header><div data-chart="mg"></div></section>
      <section class="card"><header><h2>Carga tributária sobre a receita (%)</h2></header><div data-chart="ct"></div></section>
    </div>
    <div class="grid2">
      <section class="card"><header><h2>Contratos por tomador</h2></header>${hbarHtml(Object.entries(porTom).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value), v => v + (v > 1 ? ' contratos' : ' contrato'), 8)}</section>
      <section class="card"><header><h2>Vencimentos nos próximos 12 meses</h2></header><div data-chart="vc"></div></section>
      <section class="card"><header><h2>Achados em aberto por risco</h2></header>${segBar(achRisco)}<h4 class="sec">Por área</h4>${hbarHtml(Object.entries(achArea).map(([label, value]) => ({ label, value, color: 'var(--s2)' })).sort((a, b) => b.value - a.value), v => String(v), 6)}</section>
      <section class="card"><header><h2>Situação das obrigações</h2></header>${segBar(S.obDist)}<h4 class="sec">Alertas</h4>${Views.alertasConsultoria(e.id)}</section>
    </div>`;
    $$('[data-per]', host).forEach(b => b.onclick = () => { st.p = b.dataset.per; App.render(true); });
    const I = S.ind, L = I.map(i => fmtCompShort(i.competencia)), FL = I.map(i => fmtComp(i.competencia));
    const g = k => I.map(i => num(i[k]));
    const empty = `Sem indicadores mensais. <a href="#/empresa/${e.id}/indicadores">Lançar indicadores</a> ou importe a aba “Indicadores mensais”.`;
    const C = k => $(`[data-chart="${k}"]`, host);
    mountChart(C('rc'), { labels: L, fullLabels: FL, kind: 'line', series: [{ name: 'Receita', values: g('receita') }, { name: 'Custo total', values: g('custo') }, { name: 'Folha', values: g('folha') }], empty });
    mountChart(C('tr'), { labels: L, fullLabels: FL, kind: 'stack', series: [{ name: 'INSS', values: g('inss') }, { name: 'FGTS', values: g('fgts') }, { name: 'ISS', values: g('iss') }, { name: 'PIS/COFINS/IRPJ/CSLL', values: g('federais') }, { name: 'Outros', values: g('outrosTributos') }], empty });
    mountChart(C('ad'), { labels: L, fullLabels: FL, kind: 'bar', series: [{ name: 'Admissões', values: g('admissoes'), color: 'var(--s3)' }, { name: 'Desligamentos', values: g('desligamentos'), color: 'var(--s5)' }], fmt: fmtNum, axisFmt: v => fmtNum(v), empty });
    mountChart(C('hc'), { labels: L, fullLabels: FL, kind: 'line', series: [{ name: 'Funcionários', values: g('headcount') }], fmt: fmtNum, axisFmt: v => fmtNum(v), empty });
    const pct = v => fmtPct(v), ax = v => NUM.format(Math.round(v * 100)) + '%';
    mountChart(C('mg'), { labels: L, fullLabels: FL, kind: 'line', series: [{ name: 'Margem bruta', values: I.map(i => num(i.receita) ? (num(i.receita) - (num(i.custo) || 0)) / num(i.receita) : null), color: 'var(--s3)' }], fmt: pct, axisFmt: ax, empty });
    mountChart(C('ct'), { labels: L, fullLabels: FL, kind: 'line', series: [{ name: 'Carga tributária', values: I.map(i => num(i.receita) ? ['inss', 'fgts', 'iss', 'federais', 'outrosTributos'].reduce((s, k) => s + (num(i[k]) || 0), 0) / num(i.receita) : null), color: 'var(--s4)' }], fmt: pct, axisFmt: ax, empty });
    mountChart(C('vc'), { labels: venc12.map(x => fmtCompShort(x.k)), fullLabels: venc12.map(x => fmtComp(x.k)), kind: 'bar', series: [{ name: 'Contratos vencendo', values: venc12.some(x => x.n) ? venc12.map(x => x.n) : venc12.map(() => null) }], fmt: v => fmtNum(v) + ' contrato(s)', axisFmt: v => fmtNum(v), empty: 'Nenhum contrato com data de término cadastrada nos próximos 12 meses.' });
  },

  /* ---------------- IMPORTAÇÃO DA PLANILHA ---------------- */
  async importar(e, file) {
    let book; try { book = await XLSX.read(await file.arrayBuffer()); } catch (err) { UI.toast('Não consegui ler a planilha: ' + err.message, 'bad'); return; }
    const plan = [];
    for (const coll of AUDIT) {
      const sc = SCHEMAS[coll];
      const sheetName = Object.keys(book).find(n => norm(n) === norm(sc.sheet)) || Object.keys(book).find(n => norm(n).startsWith(norm(sc.sheet).slice(0, 8)));
      if (!sheetName) { plan.push({ coll, sheetName: null, rows: [] }); continue; }
      const rows = book[sheetName];
      let hi = -1, best = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) { const hits = (rows[i] || []).filter(c => sc.fields.some(f => norm(f.label) === norm(c))).length; if (hits > best) { best = hits; hi = i; } }
      if (hi < 0) { plan.push({ coll, sheetName, rows: [] }); continue; }
      const map = (rows[hi] || []).map(h => sc.fields.find(f => norm(f.label) === norm(h)) || null);
      const recs = rows.slice(hi + 1).filter(r => r && r.some(c => c !== null && c !== undefined && c !== '')).map(r => {
        const o = { empresaId: e.id };
        map.forEach((f, ci) => {
          if (!f) return; let v = r[ci]; if (v === undefined || v === null || v === '') return;
          if (typeof v === 'string') v = v.trim();
          if (f.type === 'money' || f.type === 'num') v = num(v) ?? v;
          else if (f.type === 'date') v = parseDate(v) || v;
          else if (f.type === 'comp') v = parseComp(v) || v;
          else if (f.type === 'doc') v = isGap(v) ? v : (onlyDigits(v) || v);
          else if (f.type === 'bool') v = /^s|^true|^1/i.test(String(v));
          o[f.k] = typeof v === 'string' ? v : v;
        });
        return derive(coll, o);
      });
      plan.push({ coll, sheetName, rows: recs, matched: map.filter(Boolean).length });
    }
    const found = plan.filter(p => p.rows.length);
    if (!found.length) { UI.toast('Nenhuma aba reconhecida. Os nomes das colunas devem seguir o modelo da planilha de auditoria.', 'bad', 6000); return; }
    const m = UI.modal({
      title: 'Importar planilha', sub: esc(file.name), wide: true,
      body: `<p class="muted">Abas reconhecidas e quantidade de linhas. Escolha, para cada aba, se os dados substituem os já cadastrados nesta empresa ou se são acrescentados.</p>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Aba do app</th><th>Aba da planilha</th><th class="r">Linhas</th><th class="r">Colunas reconhecidas</th><th class="r">Já cadastrados</th><th>Ação</th></tr></thead><tbody>
      ${plan.map(p => `<tr><td><b>${esc(SCHEMAS[p.coll].titulo)}</b></td><td>${esc(p.sheetName || '—')}</td><td class="r">${p.rows.length}</td><td class="r">${p.rows.length ? `${p.matched}/${SCHEMAS[p.coll].fields.length}` : ''}</td><td class="r">${empRecs(p.coll, e.id).length}</td><td>${p.rows.length ? `<select data-mode="${p.coll}"><option value="replace">Substituir</option><option value="append">Acrescentar</option><option value="skip">Ignorar</option></select>` : '<span class="muted small">vazia</span>'}</td></tr>`).join('')}
      </tbody></table></div>
      <label class="switch"><input type="checkbox" id="impPh" checked><span></span>Criar no cadastro os contratos citados nas demais abas (inventário, aditivos, financeiro…) que ainda não estão cadastrados</label>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="impOk">${icon('upload')} Importar</button>`
    });
    $('#impOk', m).onclick = async () => {
      const b = $('#impOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Importando…';
      let total = 0;
      for (const p of found) {
        const mode = $(`[data-mode="${p.coll}"]`, m).value; if (mode === 'skip') continue;
        if (mode === 'replace') { const ids = empRecs(p.coll, e.id).map(r => r.id); if (ids.length) await DB.remove(p.coll, ids); }
        await DB.save(p.coll, p.rows); total += p.rows.length;
      }
      if ($('#impPh', m).checked) {
        const have = new Set(empRecs('contratos', e.id).map(c => c.codigo)); const ph = {};
        ['documentos', 'aditivos', 'financeiro', 'obrigacoes', 'maoDeObra', 'achados', 'medicoes', 'materiais'].forEach(coll => empRecs(coll, e.id).forEach(r => {
          if (!r.contrato || have.has(r.contrato)) return;
          const x = ph[r.contrato] = ph[r.contrato] || { empresaId: e.id, codigo: r.contrato, status: 'Cadastro incompleto — gerado a partir das demais abas' };
          if (!x.tomador && r.tomador) x.tomador = r.tomador; if (!x.grupo && (r.grupo || r.centroCusto)) x.grupo = r.grupo || r.centroCusto;
          if (!x.unidade && x.grupo) x.unidade = x.grupo;
        }));
        const list = Object.values(ph); if (list.length) { await DB.save('contratos', list); total += list.length; }
      }
      UI.closeModal(); UI.toast(`Importação concluída: ${fmtNum(total)} registros.`); App.render();
    };
  },
  /* ---------------- EXPORTAÇÃO ---------------- */
  exportar(e) {
    const sheets = AUDIT.map(coll => {
      const sc = SCHEMAS[coll], rows = empRecs(coll, e.id).sort((a, b) => String(a.contrato || a.codigo || a.competencia || '').localeCompare(String(b.contrato || b.codigo || b.competencia || ''), 'pt-BR', { numeric: true }));
      return {
        name: sc.sheet, title: sc.sheet.toUpperCase(), subtitle: `${e.razao} — exportado em ${fmtDateTime(new Date())} · Amorim Firmo Advocacia e Consultoria Jurídica`,
        headers: sc.fields.map(f => f.label), types: sc.fields.map(f => f.type),
        rows: rows.map(r => sc.fields.map(f => { const v = r[f.k]; if (v === null || v === undefined) return ''; if (f.type === 'date') return fmtDate(v); if (f.type === 'comp') return fmtComp(v); if (f.type === 'doc') return isGap(v) ? v : fmtDoc(v); if (f.type === 'bool') return v ? 'Sim' : 'Não'; if (f.type === 'money' || f.type === 'num') return num(v) ?? v; return v; }))
      };
    });
    download(XLSX.write(sheets), `Auditoria_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.xlsx`);
    UI.toast('Planilha gerada.');
  }
};
