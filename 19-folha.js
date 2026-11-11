/* =====================================================================
   FOLHA DE PAGAMENTO (DP) — lê o "Relatório da Folha de Pagamento" do
   Departamento Pessoal e preenche os campos que a auditoria já tem:
   Mão de obra (alocados × contratados, custo da folha) e Obrigações
   (execução com os postos e pagamento dos salários).
   ===================================================================== */
const FolhaDP = {
  MESES: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],

  /** a planilha é um relatório de folha? (cabeçalho com DEPARTAMENTO + VALOR LÍQUIDO) */
  reconhece(book) {
    return Object.values(book).some(rows => FolhaDP.cabecalho(rows) >= 0);
  },
  cabecalho(rows) {
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const h = Array.from(rows[i] || [], norm);
      if (h.some(c => c.startsWith('departamento')) && h.some(c => c.includes('liquido'))) return i;
    }
    return -1;
  },

  /** "006/2025", "013_2025", "04014001-24", "4801.4032.2025", 310140082025 → "6/2025" etc. */
  chave(s) {
    s = String(s ?? '').trim(); if (!s || s === '-') return null;
    let m = s.match(/^(.*\d)\s*[\/_.\-]\s*(\d{4}|\d{2})$/);
    if (m) { const b = onlyDigits(m[1]).replace(/^0+/, ''); if (b) return b + '/' + (m[2].length === 2 ? '20' + m[2] : m[2]); }
    const d = onlyDigits(s); m = d.match(/^(\d+?)(20\d\d)$/);
    if (m && d.length >= 6) return m[1].replace(/^0+/, '') + '/' + m[2];
    return null;
  },
  /** chaves de um contrato do app (campo nº contrato/processo pode trazer mais de um número) */
  chavesContrato(c) {
    const out = new Set();
    String(c.numero || '').split(/[,;|\s]+(?:e\s+)?|\s+[–-]\s+/).forEach(t => { const k = FolhaDP.chave(t.replace(/^n[ºo°.]*/i, '')); k && out.add(k); });
    (String(c.numero || '').match(/\d[\d.]*\s*[\/_\-]\s*\d{2,4}/g) || []).forEach(t => { const k = FolhaDP.chave(t); k && out.add(k); });
    return out;
  },
  codDep: d => (String(d || '').match(/^\s*0*(\d+(?:\.\d+)?)/) || [])[1] || null,

  /** competência pela aba: "SETEMBRO_2026", "13º SALÁRIO_1º PARCELA" (+ título "… - 09.2026") */
  competencia(nome, rows) {
    const n = norm(nome), topo = rows.slice(0, 8).flat().filter(x => typeof x === 'string').join(' ');
    const ano = (n.match(/20\d\d/) || topo.match(/20\d\d/) || [new Date().getFullYear()])[0];
    if (/13/.test(n) && /salario|parcela/.test(n)) { const p = /2\s*[ºoa°]?\s*parcela/.test(n) ? 2 : 1; return { comp: `${ano}-${p === 2 ? '12' : '11'}`, decimo: p }; }
    const mi = FolhaDP.MESES.findIndex(m => n.includes(m));
    if (mi >= 0) return { comp: `${ano}-${String(mi + 1).padStart(2, '0')}` };
    const t = topo.match(/(\d{2})[.\/](20\d\d)/); if (t) return { comp: `${t[2]}-${t[1]}` };
    return null;
  },

  /** lê todas as abas mensais → linhas { aba, comp, decimo, contrato, esfera, dep, cod, cct, colab, bruto, liquido, envio, aprovacao, previsao, pago, saldo } */
  ler(book) {
    const linhas = [];
    for (const [nome, rows] of Object.entries(book)) {
      if (/consolidado/.test(norm(nome))) continue;
      const hi = FolhaDP.cabecalho(rows); if (hi < 0) continue;
      const cp = FolhaDP.competencia(nome, rows); if (!cp) continue;
      const h = Array.from(rows[hi] || [], norm), col = f => h.findIndex(f);
      const C = {
        contrato: col(c => c.includes('contrato')), esfera: col(c => c.startsWith('esfera')), dep: col(c => c.startsWith('departamento')), cct: col(c => c === 'cct'),
        colab: col(c => c.includes('colaborador')), bruto: col(c => c.includes('bruto')), liquido: col(c => c.includes('liquido')),
        envio: col(c => c.includes('envio')), aprovacao: col(c => c.includes('aprovacao')), previsao: col(c => c.includes('previsao')),
        pago: col(c => c.includes('pgto realizado') || c.includes('pagamento realizado')), saldo: col(c => c.includes('saldo'))
      };
      const g = (r, k) => C[k] >= 0 ? r[C[k]] : undefined;
      for (const r of rows.slice(hi + 1)) {
        const dep = String(g(r, 'dep') ?? '').trim();
        if (!dep || /^total/i.test(dep) || /^total/i.test(String(g(r, 'contrato') ?? ''))) continue;
        const v = k => { const x = num(g(r, k)); return x === null ? null : x; };
        const dt = k => { const x = g(r, k); return x === undefined || x === null || x === '' ? '' : parseDate(x) || ''; };
        const l = { aba: nome, comp: cp.comp, decimo: cp.decimo || 0, contrato: g(r, 'contrato'), chave: FolhaDP.chave(g(r, 'contrato')), esfera: String(g(r, 'esfera') ?? '').trim(), dep, cod: FolhaDP.codDep(dep), cct: g(r, 'cct'), colab: v('colab'), bruto: v('bruto'), liquido: v('liquido'), envio: dt('envio'), aprovacao: dt('aprovacao'), previsao: dt('previsao'), pago: v('pago'), saldo: v('saldo') };
        if (!(l.liquido || l.bruto || l.colab || l.pago)) continue; // linha zerada
        if (l.decimo && (l.envio || l.aprovacao)) l.comp = (l.envio || l.aprovacao).slice(0, 7); // 13º: mês em que foi processado
        linhas.push(l);
      }
    }
    // abas antigas não trazem o nº do contrato: usa o código do departamento das abas que trazem
    const porCod = {};
    linhas.forEach(l => { if (l.chave && l.cod && !porCod[l.cod]) porCod[l.cod] = l.chave; });
    linhas.forEach(l => { if (!l.chave && l.cod && porCod[l.cod]) l.chave = porCod[l.cod]; });
    return linhas;
  },

  idDe(...p) { let h = 0; const s = p.join('|'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'fdp' + (h >>> 0).toString(36) + s.length.toString(36); },

  /** 5º dia útil (segunda a sábado, sem feriados) do mês seguinte à competência — CLT art. 459, § 1º */
  limitePgto(comp) {
    const [y, m] = comp.split('-').map(Number); const d = new Date(y, m, 1, 12); let n = 0;
    for (;;) { if (d.getDay() !== 0 && ++n === 5) break; d.setDate(d.getDate() + 1); }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /** linhas da folha de um contrato → { meses (folha mensal por competência), decimo } */
  resumir(ls) {
    const M = {}, D = [];
    ls.forEach(l => {
      if (l.decimo) { D.push(l); return; }
      const x = M[l.comp] = M[l.comp] || { comp: l.comp, colab: 0, temColab: false, bruto: 0, temBruto: true, liq: 0, pago: 0, saldo: 0, data: '', envio: '', aprovacao: '', cct: '', abas: new Set(), deps: new Set() };
      if (l.colab !== null) { x.colab += l.colab; x.temColab = true; }
      if (l.bruto === null) x.temBruto = false; else x.bruto += l.bruto;
      x.liq += l.liquido || 0; x.pago += l.pago || 0;
      x.saldo += l.saldo !== null ? l.saldo : Math.max(0, (l.liquido || 0) - (l.pago || 0));
      const d = l.previsao || l.aprovacao || ''; if (d > x.data) x.data = d;
      if (l.envio > x.envio) x.envio = l.envio; if (l.aprovacao > x.aprovacao) x.aprovacao = l.aprovacao;
      if (l.cct && l.cct !== '-' && !x.cct) x.cct = String(l.cct);
      x.abas.add(l.aba); x.deps.add(l.dep);
    });
    const meses = Object.values(M).sort((a, b) => a.comp.localeCompare(b.comp));
    meses.forEach(x => { if (!x.temBruto) x.bruto = null; x.limite = FolhaDP.limitePgto(x.comp); x.atraso = !!x.data && x.data > x.limite; });
    return { meses, decimo: D };
  },

  /** registros de Mão de obra (um por competência) e atualização das Obrigações do contrato */
  preencher(e, c, ls) {
    const { meses, decimo } = FolhaDP.resumir(ls);
    const postos = DB.where('maoDeObra', r => r.empresaId === e.id && r.contrato === c.codigo && r.origem !== 'folhaDP');
    const qtd = postos.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), prev = postos.reduce((s, r) => s + (num(r.salario) || 0) * (num(r.qtdContratada) || 0), 0); // salários-base previstos × postos
    const mo = meses.map(x => {
      const div = [];
      if (qtd && x.temColab && x.colab < qtd) div.push(`${fmtNum(qtd - x.colab)} posto(s) sem empregado na folha (${fmtNum(x.colab)} de ${fmtNum(qtd)})`);
      if (qtd && x.temColab && x.colab > qtd) div.push(`${fmtNum(x.colab - qtd)} empregado(s) além dos postos contratados`);
      if (x.saldo > 0) div.push('saldo de salários a pagar ' + fmtMoney(x.saldo));
      if (x.atraso) div.push(`pagamento após o 5º dia útil (${fmtDate(x.data)}; limite ${fmtDate(x.limite)})`);
      const id = FolhaDP.idDe(e.id, 'mo', c.codigo, x.comp);
      return BenefDP.compor({ ...(DB.get('maoDeObra', id) || {}),
        id, empresaId: e.id, contrato: c.codigo, competencia: x.comp, origem: 'folhaDP',
        posto: BenefDP.POSTO, deps: [...new Set(ls.filter(l => l.comp === x.comp && l.cod).map(l => l.cod))], cct: x.cct ? 'CCT ' + x.cct : '',
        qtdContratada: qtd || null, qtdAlocada: x.temColab ? x.colab : null, custoApurado: x.bruto, bruto: x.bruto, liquido: +x.liq.toFixed(2), custoPrevisto: prev || null,
        divFolha: div.join('; '),
        evFolha: `Relatório da Folha de Pagamento (DP), aba ${[...x.abas].join(', ')} — ${[...x.deps].join(', ')}: líquido ${fmtMoney(x.liq)}, pago ${fmtMoney(x.pago)}${x.envio ? ', enviada à controladoria em ' + fmtDate(x.envio) : ''}${x.aprovacao ? ', aprovada em ' + fmtDate(x.aprovacao) : ''}${x.bruto === null ? ' (o relatório deste mês não traz o valor bruto)' : ''}${prev ? `. Custo previsto = salários-base dos postos contratados (${fmtMoney(prev)})` : ''}`
      });
    });
    // ---------- Obrigações ----------
    const obs = DB.where('obrigacoes', r => r.empresaId === e.id && r.contrato === c.codigo);
    const periodo = meses.length ? `${fmtComp(meses[0].comp)} a ${fmtComp(meses[meses.length - 1].comp)}` : '';
    const ult = [...meses].reverse().find(x => x.temColab);
    const marca = '[Folha DP]';
    const juntar = (antigo, novo) => { const a = String(antigo || '').split('\n').filter(t => !t.startsWith(marca)).join('\n').trim(); return (/n[aã]o verificad|n[aã]o apresentad/i.test(a) || !a ? '' : a + '\n') + marca + ' ' + novo; };
    const upd = [];
    // execução com os postos contratados
    const exec = obs.filter(r => r.grupo === 'Mão de obra' || /dedica[cç][aã]o exclusiva|postos|aloca[cç]|efetivo/i.test(r.obrigacao || ''));
    if (ult && exec.length) {
      const oc = qtd ? ult.colab / qtd : null;
      const st = oc === null ? null : oc >= 0.95 ? 'Cumprido' : oc >= 0.5 ? 'Parcialmente cumprido' : 'Não cumprido';
      const serie = meses.filter(x => x.temColab).map(x => `${fmtComp(x.comp)}: ${fmtNum(x.colab)}`).join(' · ');
      exec.forEach(r => upd.push({ ...r,
        verificado: juntar(r.verificado, `Colaboradores na folha de pagamento por competência (${periodo}): ${serie}.${qtd ? ` Postos contratados: ${fmtNum(qtd)}.` : ' Postos contratados não cadastrados na aba Mão de obra.'}`),
        qtdPrevista: qtd ? String(qtd) : r.qtdPrevista, qtdRealizada: `${fmtNum(ult.colab)} (${fmtComp(ult.comp)})`,
        ...(st ? { status: st, desvio: ult.colab < qtd ? `${fmtNum(qtd - ult.colab)} posto(s) sem empregado na folha em ${fmtComp(ult.comp)}` : '', impacto: st === 'Cumprido' ? r.impacto : (oc < 0.8 ? 'Alto' : 'Médio') } : {}),
        evidencia: r.evidencia || 'Relatório da Folha de Pagamento (DP)'
      }));
    }
    // pagamento dos salários
    if (meses.length) {
      const liq = meses.reduce((s, x) => s + x.liq, 0), pago = meses.reduce((s, x) => s + x.pago, 0), sald = meses.filter(x => x.saldo > 0), atr = meses.filter(x => x.atraso);
      const st = sald.length ? 'Não cumprido' : atr.length ? 'Parcialmente cumprido' : 'Cumprido';
      const desvio = [sald.length && 'saldo a pagar: ' + sald.map(x => `${fmtComp(x.comp)} ${fmtMoney(x.saldo)}`).join(', '), atr.length && 'pago após o 5º dia útil: ' + atr.map(x => `${fmtComp(x.comp)} (${fmtDate(x.data)})`).join(', ')].filter(Boolean).join('; ');
      let ver = `Folha líquida ${periodo}: ${fmtMoney(liq)}; pago ${fmtMoney(pago)}.${decimo.length ? ` 13º salário: ${decimo.map(l => `${l.decimo}ª parcela ${fmtMoney(l.liquido || l.bruto || 0)}${l.saldo ? ' (saldo ' + fmtMoney(l.saldo) + ')' : ''}`).join(', ')}.` : ''} ${meses.some(x => x.data) ? ` Datas de pagamento/aprovação: ${meses.filter(x => x.data).map(x => `${fmtComp(x.comp)} ${fmtDate(x.data)}`).join(' · ')}.` : ''}`;
      ver = ver.replace(/\s+/g, ' ').trim();
      const sal = obs.filter(r => /sal[aá]ri|remunera[cç]|folha de pagamento/i.test(r.obrigacao || ''));
      const base = { verificado: ver, qtdRealizada: `${meses.length} competência(s)`, status: st, desvio, impacto: sald.length ? 'Alto' : atr.length ? 'Médio' : 'Baixo', valorPrevisto: +liq.toFixed(2), valorRealizado: +pago.toFixed(2) };
      if (sal.length) sal.forEach(r => upd.push({ ...r, ...base, verificado: juntar(r.verificado, ver) }));
      else upd.push({ id: FolhaDP.idDe(e.id, 'ob', c.codigo), empresaId: e.id, contrato: c.codigo, clausula: 'CLT, art. 459, § 1º', grupo: 'Trabalhista', obrigacao: 'Pagar os salários dos empregados alocados no contrato até o 5º dia útil do mês seguinte', frequencia: 'Mensal', qtdPrevista: `${meses.length} competência(s)`, unidade: 'folha', responsavel: 'Contratada', evidencia: 'Relatório da Folha de Pagamento (DP), comprovantes de crédito', origem: 'folhaDP', ...base, verificado: marca + ' ' + ver });
    }
    return { mo, ob: upd.map(r => derive('obrigacoes', r)), meses };
  },

  async importar(e, book, file) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    const linhas = FolhaDP.ler(book);
    if (!linhas.length) { UI.toast('Reconheci o relatório de folha, mas não encontrei linhas com valores.', 'bad', 6000); return; }
    const contratos = empRecs('contratos', e.id), mapa = {};
    contratos.forEach(c => FolhaDP.chavesContrato(c).forEach(k => { (mapa[k] = mapa[k] || []).push(c); }));
    const grupos = {};
    linhas.forEach(l => {
      const k = l.cod || l.dep; const g = grupos[k] = grupos[k] || { k, dep: l.dep, esfera: l.esfera, chave: l.chave, numero: l.contrato, linhas: [] };
      g.linhas.push(l); if (!g.chave && l.chave) g.chave = l.chave; if ((!g.numero || g.numero === '-') && l.contrato) g.numero = l.contrato; if (!g.esfera && l.esfera) g.esfera = l.esfera;
    });
    const G = Object.values(grupos).sort((a, b) => (+a.k || 0) - (+b.k || 0));
    G.forEach(g => { const cs = g.chave ? mapa[g.chave] || [] : []; g.auto = cs.length === 1 ? cs[0].id : ''; });
    const comps = [...new Set(linhas.filter(l => !l.decimo).map(l => l.comp))].sort();
    const ok = G.filter(g => g.auto), sem = G.filter(g => !g.auto);
    const opts = sel => `<option value="">— não lançar —</option>${contratos.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt', { numeric: true })).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.codigo)}${c.numero ? ' · nº ' + esc(c.numero) : ''} — ${esc(c.unidade || c.tomador || '')}</option>`).join('')}`;
    const ult = g => g.linhas.filter(l => !l.decimo).sort((a, b) => b.comp.localeCompare(a.comp))[0] || g.linhas[0];
    const linha = g => { const u = ult(g); return `<tr><td><b>${esc(g.dep)}</b><small class="muted" style="display:block">${esc(g.esfera || '')}${g.numero && g.numero !== '-' ? ' · contrato ' + esc(g.numero) : ''}</small></td><td class="r">${u.colab !== null ? fmtNum(u.colab) : '—'}</td><td class="r">${u.liquido !== null ? fmtMoney(u.liquido) : '—'}</td><td><select data-fdp="${esc(g.k)}">${opts(g.auto)}</select></td></tr>`; };
    const tab = list => `<div class="table-wrap"><table class="dt"><thead><tr><th>Departamento (planilha)</th><th class="r">Colab. (últ.)</th><th class="r">Líquido (últ.)</th><th>Contrato no app</th></tr></thead><tbody>${list.map(linha).join('')}</tbody></table></div>`;
    const m = UI.modal({
      title: 'Folha de pagamento (DP)', sub: esc(file.name), wide: true,
      body: `<p class="muted">Competências: <b>${comps.map(fmtComp).join(', ')}</b>. Cada departamento foi ligado ao contrato pelo <b>nº do contrato</b> (confira e ajuste se preciso). Em cada contrato serão preenchidos:</p>
        <ul class="muted small" style="margin:0 0 10px 18px"><li><b>Mão de obra</b> — uma linha por competência: qtd. alocada (colaboradores na folha) × qtd. contratada (soma dos postos), custo apurado (folha bruta) × custo previsto, CCT, divergências (postos vagos, saldo a pagar, pagamento após o 5º dia útil) e evidência.</li>
        <li><b>Obrigações</b> — a obrigação de execução com os postos recebe o que foi verificado, a quantidade realizada e o status; a de pagamento dos salários recebe valores previsto (líquido) e realizado (pago), desvios e status (é criada se não existir).</li></ul>
        <p class="muted small">Importar de novo atualiza as mesmas linhas, sem duplicar.</p>
        <h4 class="sec">Ligados a contratos do app <span class="count">${ok.length}</span></h4>${ok.length ? tab(ok) : '<p class="muted small">Nenhum departamento corresponde ao nº de um contrato cadastrado nesta empresa.</p>'}
        <details ${ok.length ? '' : 'open'}><summary class="sec">Sem contrato correspondente no app <span class="count">${sem.length}</span> <small class="muted">— contratos não cadastrados, feristas, administrativo…</small></summary>${sem.length ? tab(sem) : ''}</details>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="fdpOk">${icon('upload')} Preencher</button>`
    });
    const conta = () => { const n = new Set($$('[data-fdp]', m).map(s => s.value).filter(Boolean)).size; $('#fdpOk', m).innerHTML = `${icon('upload')} Preencher ${n} contrato(s)`; $('#fdpOk', m).disabled = !n; };
    $$('[data-fdp]', m).forEach(s => s.onchange = conta); conta();
    $('#fdpOk', m).onclick = async () => {
      const b = $('#fdpOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Preenchendo…';
      const porC = {};
      $$('[data-fdp]', m).forEach(s => { if (s.value && grupos[s.dataset.fdp]) (porC[s.value] = porC[s.value] || []).push(...grupos[s.dataset.fdp].linhas); });
      const MO = [], OB = [];
      for (const [cid, ls] of Object.entries(porC)) { const c = DB.get('contratos', cid); if (!c) continue; const r = FolhaDP.preencher(e, c, ls); MO.push(...r.mo); OB.push(...r.ob); }
      // lançamentos da versão anterior (financeiro e mão de obra por departamento) são substituídos
      const velhos = DB.where('financeiro', r => r.empresaId === e.id && r.origem === 'folhaDP').map(r => r.id); if (velhos.length) await DB.remove('financeiro', velhos);
      const novos = new Set(MO.map(r => r.id)), vm = DB.where('maoDeObra', r => r.empresaId === e.id && r.origem === 'folhaDP' && !novos.has(r.id) && !BenefDP.temBenef(r) && Object.keys(porC).some(id => DB.get('contratos', id)?.codigo === r.contrato)).map(r => r.id); if (vm.length) await DB.remove('maoDeObra', vm);
      const deps = { ...(e.dpDeps || {}) }; $$('[data-fdp]', m).forEach(s => { const g = grupos[s.dataset.fdp], c = s.value && DB.get('contratos', s.value); if (g && c && /^\d/.test(g.k)) deps[g.k] = c.codigo; });
      const nums = { ...(e.dpNums || {}) }; G.forEach(g => { if (/^\d/.test(g.k) && g.chave && g.numero && g.numero !== '-') nums[g.k] = String(g.numero); });
      await DB.save('empresas', { ...DB.get('empresas', e.id), dpDeps: deps, dpNums: nums });
      if (MO.length) await DB.save('maoDeObra', MO); if (OB.length) await DB.save('obrigacoes', OB);
      UI.closeModal(); UI.toast(`Folha aplicada em ${Object.keys(porC).length} contrato(s): ${MO.length} linhas de mão de obra e ${OB.length} obrigações preenchidas.`, 'ok', 6000); App.render();
    };
    return UI.aguardar(m);
  }
};
