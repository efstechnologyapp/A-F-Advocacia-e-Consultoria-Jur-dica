/* =====================================================================
   PAINEL DA DIRETORIA (portal da empresa, só consulta)
   Carteira, receita, custos, margem e riscos em dinheiro, calculados com
   o que o escritório apurou (contratos, folha do DP, custos lançados e
   remessas aprovadas).
   ===================================================================== */
const Diretoria = {
  f: { esfera: '', orgao: '' },
  esfera: c => String(c.grupo || '').split(/ [–-] /)[0].trim() || 'Não informada',
  orgao: c => tomadorBase(c),
  mi(v) { v = num(v) || 0; return Math.abs(v) >= 1e6 ? 'R$ ' + NUM.format(+(v / 1e6).toFixed(2)) + ' mi' : Math.abs(v) >= 1e4 ? 'R$ ' + NUM.format(+(v / 1e3).toFixed(1)) + ' mil' : fmtMoney(v); },
  vigente: c => !/^(encerrad|rescindid)|licita/i.test(c.status || '') && (!isISO(c.fim) || daysUntil(c.fim) >= 0),
  /** custo mensal apurado do contrato: a última competência com folha (DP) ou custos lançados */
  custos(e) {
    const mo = empRecs('maoDeObra', e.id).filter(m => /^\d{4}-\d{2}$/.test(m.competencia || '') && (num(m.custoApurado) || num(m.beneficios)));
    const fi = empRecs('financeiro', e.id).filter(f => /^\d{4}-\d{2}$/.test(f.competencia || '') && /^(Custo|Tributo)$/.test(f.tipo || ''));
    const por = {};
    const add = (cod, comp, v) => { const o = por[cod] = por[cod] || {}; o[comp] = (o[comp] || 0) + (v || 0); };
    mo.forEach(m => add(m.contrato, m.competencia, (num(m.custoApurado) || 0) + (num(m.beneficios) || 0)));
    fi.forEach(f => add(f.contrato, f.competencia, num(f.realizado) ?? num(f.previsto) ?? 0));
    const out = {}; let base = '';
    Object.entries(por).forEach(([cod, comps]) => { const k = Object.keys(comps).sort().pop(); out[cod] = { valor: comps[k], comp: k }; if (k > base) base = k; });
    return { por: out, base };
  },
  /** contratado × faturado × recebido por competência (remessas aprovadas) */
  fluxo(e, cs) {
    const fr = empRecs('financeiro', e.id).filter(f => /Faturamento \(remessa\)/.test(f.grupo || '') && /^\d{4}-\d{2}$/.test(f.competencia || ''));
    const comps = [...new Set(fr.map(f => f.competencia))].sort().slice(-6);
    return comps.map(k => ({ k, cont: cs.filter(c => (!isISO(c.inicio) || c.inicio.slice(0, 7) <= k) && (!isISO(c.fim) || c.fim.slice(0, 7) >= k)).reduce((s, c) => s + (num(c.valorMensal) || 0), 0),
      fat: fr.filter(f => f.competencia === k).reduce((s, f) => s + (num(f.previsto) || 0), 0), rec: fr.filter(f => f.competencia === k).reduce((s, f) => s + (num(f.realizado) || 0), 0) }));
  },
  dados(e) {
    const todos = empRecs('contratos', e.id).filter(c => !/licita/i.test(c.status || ''));
    const cs = todos.filter(c => (!Diretoria.f.esfera || Diretoria.esfera(c) === Diretoria.f.esfera) && (!Diretoria.f.orgao || Diretoria.orgao(c) === Diretoria.f.orgao));
    const vig = cs.filter(Diretoria.vigente), C = Diretoria.custos(e);
    const linhas = vig.map(c => { const m = num(c.valorMensal) || 0, k = C.por[c.codigo]; return { c, m, a: num(c.valorAnual) || m * 12, custo: k ? k.valor : null, mg: k && m ? (m - k.valor) / m : null }; }).sort((a, b) => b.m - a.m);
    const comCusto = linhas.filter(l => l.custo !== null), tm = linhas.reduce((s, l) => s + l.m, 0), tmc = comCusto.reduce((s, l) => s + l.m, 0), tc = comCusto.reduce((s, l) => s + l.custo, 0);
    const fl = Diretoria.fluxo(e, cs), aReceber = empRecs('financeiro', e.id).filter(f => /Faturamento \(remessa\)/.test(f.grupo || '')).reduce((s, f) => s + Math.max(0, (num(f.previsto) || 0) - (num(f.realizado) || 0)), 0);
    const base = [C.base, ...fl.map(x => x.k)].filter(Boolean).sort().pop() || '';
    return { todos, cs, vig, linhas, comCusto, tm, tmc, tc, fl, aReceber, base };
  },
  render(host, e) {
    const D = Diretoria.dados(e), F = Diretoria.f, mi = Diretoria.mi;
    const esferas = [...new Set(D.todos.map(Diretoria.esfera))].sort(), orgaos = [...new Set(D.todos.map(Diretoria.orgao))].sort();
    const dd = c => isISO(c.fim) ? daysUntil(c.fim) : 9999;
    const v90 = D.vig.filter(c => dd(c) <= 90), v180 = D.vig.filter(c => dd(c) <= 180), vencidos = D.cs.filter(c => !/^(encerrad|rescindid)/i.test(c.status || '') && isISO(c.fim) && daysUntil(c.fim) < 0);
    const neg = D.linhas.filter(l => l.mg !== null && l.mg < 0), achAlto = empRecs('achados', e.id).filter(a => achadoAberto(a) && /alto|crít/i.test(a.risco || '')).length;
    // receita contratada nos próximos 12 meses
    const d0 = new Date(); d0.setDate(1); const meses = Array.from({ length: 12 }, (_, i) => { const x = new Date(d0); x.setMonth(d0.getMonth() + i); const k = x.toISOString().slice(0, 7); return { k, v: D.vig.filter(c => (!isISO(c.fim) || c.fim.slice(0, 7) >= k) && (!isISO(c.inicio) || c.inicio.slice(0, 7) <= k)).reduce((s, c) => s + (num(c.valorMensal) || 0), 0) }; });
    const mx = Math.max(...meses.map(m => m.v), 1);
    // concentração e esfera
    const soma = key => { const o = {}; D.vig.forEach(c => { const k = key(c); o[k] = (o[k] || 0) + (num(c.valorMensal) || 0); }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
    const orgS = soma(Diretoria.orgao), top = orgS.slice(0, 5), topP = D.tm ? top.reduce((s, x) => s + x[1], 0) / D.tm : 0, esfS = soma(Diretoria.esfera);
    const hb = (l, v, w, txt) => `<div class="dr-hb"><span title="${esc(l)}">${esc(l)}</span><i style="width:${Math.max(2, w * 100).toFixed(0)}%"></i><b>${txt}</b></div>`;
    // linha contratado × faturado × recebido
    let fluxoSvg = '<p class="muted small">As remessas mensais aprovadas pelo escritório alimentam este gráfico.</p>';
    if (D.fl.length) {
      const W = 520, H = 170, vs = D.fl.flatMap(x => [x.cont, x.fat, x.rec]), hi = Math.max(...vs) * 1.05 || 1, lo = Math.min(...vs) * 0.9;
      const X = i => 40 + i * (W - 60) / Math.max(1, D.fl.length - 1), Y = v => H - 22 - (v - lo) / ((hi - lo) || 1) * (H - 40);
      const pl = k => D.fl.map((x, i) => `${X(i).toFixed(0)},${Y(x[k]).toFixed(0)}`).join(' ');
      fluxoSvg = `<svg viewBox="0 0 ${W} ${H}" class="dr-ln"><polyline points="${pl('cont')}" class="l1"/><polyline points="${pl('fat')}" class="l2"/><polyline points="${pl('rec')}" class="l3"/>${D.fl.map((x, i) => `<text x="${X(i).toFixed(0)}" y="${H - 4}">${fmtCompShort(x.k)}</text>`).join('')}</svg><div class="dr-lgd"><span><i style="background:#9aa3b5"></i>Contratado</span><span><i style="background:var(--s1)"></i>Faturado</span><span><i style="background:#b08a3e"></i>Recebido</span></div>`;
    }
    // linha do tempo
    const gs = D.cs.filter(c => isISO(c.inicio) || isISO(c.fim)).sort((a, b) => String(a.fim || '9999').localeCompare(String(b.fim || '9999')));
    const t0 = Math.min(...gs.map(c => +new Date(c.inicio || c.fim) - (c.inicio ? 0 : 365 * 864e5)), Date.now() - 365 * 864e5), t1 = Math.max(...gs.map(c => +new Date(c.fim || Date.now() + 730 * 864e5)), Date.now() + 365 * 864e5);
    const px = t => ((t - t0) / (t1 - t0) * 100).toFixed(2);
    const gantt = gs.map(c => { const a = c.inicio ? +new Date(c.inicio) : +new Date(c.fim) - 365 * 864e5, b = c.fim ? +new Date(c.fim) : t1, d = dd(c), cl = /^(encerrad|rescindid)/i.test(c.status || '') ? 'enc' : d < 0 ? 'ven' : d <= 30 ? 'r30' : d <= 90 ? 'r90' : 'ok';
      return `<div class="dr-gr"><span class="gl" title="${esc(c.tomador || '')}"><b>${esc(c.codigo || '')}</b> ${esc(Diretoria.orgao(c))}</span><span class="gt"><i class="${cl}" style="left:${px(a)}%;width:${Math.max(0.8, px(b) - px(a))}%"></i><em style="left:${px(Date.now())}%"></em></span><span class="gd">${c.fim ? fmtDate(c.fim).slice(0, 6) + fmtDate(c.fim).slice(8) : '—'}</span></div>`; }).join('');
    const pct = v => v === null ? '—' : fmtPct(v);
    host.innerHTML = `<div class="dr" id="drRoot">
      <div class="dr-top"><div><h2>Visão da carteira</h2><p class="muted small">${D.base ? `Dados apurados até a competência <b>${fmtComp(D.base)}</b>` : 'Ainda sem competências apuradas (folha, custos ou remessas)'} · atualizado em ${fmtDate(todayISO())}</p></div>
        <div class="dr-flt"><select id="drEsf"><option value="">Todas as esferas</option>${esferas.map(x => `<option ${x === F.esfera ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><select id="drOrg"><option value="">Todos os órgãos</option>${orgaos.map(x => `<option ${x === F.orgao ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select><button class="btn ghost sm" id="drPdf">${icon('printer')} PDF executivo</button><button class="btn ghost sm" id="drXls">${icon('download')} Excel</button></div></div>
      <div class="kpis">
        ${kpi('Contratos vigentes', D.vig.length, `de ${D.cs.length} no cadastro`)}
        ${kpi('Receita mensal contratada', mi(D.tm), `${mi(D.tm * 12)} por ano`, 'ok')}
        ${kpi('Custo mensal apurado', D.comCusto.length ? mi(D.tc) : '—', D.comCusto.length ? `${D.comCusto.length} de ${D.linhas.length} contratos com custo` : 'aguardando folha/custos do mês')}
        ${kpi('Margem bruta', D.comCusto.length && D.tmc ? fmtPct((D.tmc - D.tc) / D.tmc) : '—', D.comCusto.length ? `${mi((D.tmc - D.tc) * 12)} por ano` : 'sem custo apurado', D.tmc && D.tmc - D.tc < 0 ? 'bad' : 'ok')}
        ${kpi('Vencem em 90 dias', v90.length, `${mi(v90.reduce((s, c) => s + (num(c.valorMensal) || 0), 0) * 12)}/ano em jogo`, v90.length ? 'warn' : '')}
        ${kpi('Margem negativa', neg.length, 'contrato(s) dando prejuízo', neg.length ? 'bad' : '')}
      </div>
      <div class="grid2">
        <section class="card"><header><h2>Receita contratada — próximos 12 meses</h2></header><p class="muted small">Soma dos valores mensais dos contratos vigentes em cada mês, pela data de fim atual. A queda mostra receita que depende de prorrogação.</p>
          <div class="dr-bars">${meses.map(m => `<div class="b" title="${fmtCompShort(m.k)}: ${fmtMoney(m.v)}"><i style="height:${(m.v / mx * 100).toFixed(0)}%"></i><span>${fmtCompShort(m.k)}</span></div>`).join('')}</div></section>
        <section class="card"><header><h2>Contratado × faturado × recebido</h2></header>${fluxoSvg}</section>
      </div>
      <div class="grid2">
        <section class="card"><header><h2>Concentração da receita</h2></header><p class="muted small">Os ${top.length} maiores órgãos respondem por <b>${fmtPct(topP)}</b> da receita mensal.</p>${top.map(([l, v]) => hb(l, v, v / (top[0]?.[1] || 1), mi(v * 12) + '/ano')).join('') || '<p class="muted">Sem contratos vigentes.</p>'}</section>
        <section class="card"><header><h2>Receita por esfera</h2></header>${esfS.map(([l, v]) => hb(l, v, D.tm ? v / D.tm : 0, fmtPct(D.tm ? v / D.tm : 0))).join('') || '<p class="muted">—</p>'}</section>
      </div>
      <section class="card"><header><h2>Linha do tempo das vigências</h2></header><p class="muted small"><i class="dr-dot ven"></i>vencido sem prorrogação · <i class="dr-dot r30"></i>até 30 dias · <i class="dr-dot r90"></i>até 90 dias · <i class="dr-dot ok"></i>em dia · linha = hoje</p><div class="dr-gantt">${gantt || '<p class="muted">Sem datas de vigência.</p>'}</div></section>
      <section class="card"><header><h2>Contratos: receita, custo e margem</h2></header>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Contrato</th><th>Esfera</th><th>Fim</th><th class="n">Mensal</th><th class="n">Anual</th><th class="n">Custo mensal</th><th class="n">Margem</th></tr></thead><tbody>
        ${D.linhas.map(l => `<tr><td><b>${esc(l.c.codigo || '')}</b><small class="muted" style="display:block">${esc(l.c.tomador || '')}</small></td><td>${esc(Diretoria.esfera(l.c))}</td><td>${fmtDate(l.c.fim) || '—'}</td><td class="n">${fmtMoney(l.m)}</td><td class="n">${fmtMoney(l.a)}</td><td class="n">${l.custo === null ? '<span class="muted">—</span>' : fmtMoney(l.custo)}</td><td class="n ${l.mg !== null && l.mg < 0 ? 't-bad' : ''}">${pct(l.mg)}</td></tr>`).join('')}
        </tbody><tfoot><tr><td><b>Total</b></td><td></td><td></td><td class="n"><b>${fmtMoney(D.tm)}</b></td><td class="n"><b>${fmtMoney(D.linhas.reduce((s, l) => s + l.a, 0))}</b></td><td class="n"><b>${D.comCusto.length ? fmtMoney(D.tc) : '—'}</b></td><td class="n"><b>${D.comCusto.length && D.tmc ? fmtPct((D.tmc - D.tc) / D.tmc) : '—'}</b></td></tr></tfoot></table></div>
        ${D.linhas.length > D.comCusto.length ? `<p class="muted small">“—” no custo: contrato ainda sem folha ou custos apurados pelo escritório.</p>` : ''}</section>
      <section class="card"><header><h2>Riscos em dinheiro</h2></header><div class="dr-risk">
        <div><b>${mi(D.aReceber)}</b><span>faturado e ainda não recebido (remessas aprovadas)</span></div>
        <div><b>${v180.length}</b><span>contratos vencem em 180 dias · ${mi(v180.reduce((s, c) => s + (num(c.valorMensal) || 0), 0) * 12)}/ano</span></div>
        <div><b>${vencidos.length}</b><span>contratos com vigência vencida sem termo de prorrogação</span></div>
        <div><b>${achAlto}</b><span>pontos de risco alto em aberto no plano de ação</span></div>
      </div></section></div>`;
    $('#drEsf', host).onchange = ev => { F.esfera = ev.target.value; Diretoria.render(host, e); };
    $('#drOrg', host).onchange = ev => { F.orgao = ev.target.value; Diretoria.render(host, e); };
    $('#drPdf', host).onclick = () => Diretoria.pdf(host, e);
    $('#drXls', host).onclick = () => {
      const sub = `${e.razao || e.fantasia} — painel da diretoria em ${fmtDateTime(new Date())}`;
      download(XLSX.write([
        { name: 'Contratos', title: 'CONTRATOS — RECEITA, CUSTO E MARGEM', subtitle: sub, headers: ['Contrato', 'Órgão', 'Esfera', 'Início', 'Fim', 'Mensal (R$)', 'Anual (R$)', 'Custo mensal (R$)', 'Margem (%)'], types: ['text', 'text', 'text', 'text', 'text', 'money', 'money', 'money', 'num'],
          rows: D.linhas.map(l => [l.c.codigo, l.c.tomador, Diretoria.esfera(l.c), fmtDate(l.c.inicio), fmtDate(l.c.fim), l.m, l.a, l.custo ?? '', l.mg === null ? '' : +(l.mg * 100).toFixed(1)]) },
        { name: 'Receita mensal', title: 'CONTRATADO × FATURADO × RECEBIDO', subtitle: sub, headers: ['Competência', 'Contratado (R$)', 'Faturado (R$)', 'Recebido (R$)'], types: ['text', 'money', 'money', 'money'], rows: D.fl.map(x => [fmtComp(x.k), x.cont, x.fat, x.rec]) },
        { name: 'Próximos 12 meses', title: 'RECEITA CONTRATADA — PRÓXIMOS 12 MESES', subtitle: sub, headers: ['Mês', 'Receita contratada (R$)'], types: ['text', 'money'], rows: meses.map(m => [fmtComp(m.k), m.v]) }
      ]), `Diretoria_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.xlsx`);
    };
  },
  /** PDF executivo: abre o painel numa janela de impressão (salvar como PDF) */
  pdf(host, e) {
    const w = window.open('', '_blank'); if (!w) return UI.toast('Permita a abertura de janelas para gerar o PDF.', 'warn');
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Painel da Diretoria — ${esc(e.fantasia || e.razao)}</title><style>${css}
      body{background:#fff!important;padding:18px}.dr-flt,.no-print{display:none!important}.card{break-inside:avoid;box-shadow:none!important}@page{size:A4;margin:12mm}</style></head>
      <body class="client"><div class="pdf-h"><img src="${BRAND.logoDark}" alt="" style="height:54px"><div><b style="font:700 20px var(--serif)">${esc(e.fantasia || e.razao)}</b><div class="muted small">Painel executivo da diretoria · ${fmtDateTime(new Date())} · ${esc(escritorio().nome || 'Amorim Firmo')}</div></div></div>${$('#drRoot', host).outerHTML}</body></html>`);
    w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 600);
  }
};
