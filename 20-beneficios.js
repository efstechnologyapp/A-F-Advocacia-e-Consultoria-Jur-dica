/* =====================================================================
   RELATÓRIOS DO DP — vale-alimentação, cesta básica, vale-transporte e
   férias. Preenchem os campos já existentes: Mão de obra (benefícios,
   encargos/provisões, benefícios comprovados, divergência, evidência)
   e Obrigações (benefícios e férias).
   ===================================================================== */
const BenefDP = {
  POSTO: 'Total do contrato — Departamento Pessoal (folha e benefícios)',
  NOME: { va: 'Vale-alimentação', cesta: 'Cesta básica', vt: 'Vale-transporte', ferias: 'Férias' },
  MESES: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],

  temBenef: r => ['va', 'vt', 'cesta', 'ferias'].some(k => num(r[k]) !== null && r[k] !== undefined),

  /** monta os campos visíveis da linha de mão de obra a partir das partes (folha + benefícios) */
  compor(r) {
    const v = k => num(r[k]);
    const bs = ['va', 'cesta', 'vt'].filter(k => v(k) !== null);
    r.beneficios = bs.length ? +bs.reduce((s, k) => s + v(k), 0).toFixed(2) : null;
    r.encargos = v('ferias') !== null ? v('ferias') : null;
    const div = [r.divFolha], ev = [r.evFolha];
    const qa = v('qtdAlocada');
    if (v('vaQtd') !== null && qa) { if (v('vaQtd') < qa * 0.95) div.push(`${fmtNum(qa - v('vaQtd'))} empregado(s) da folha sem vale-alimentação (${fmtNum(v('vaQtd'))} de ${fmtNum(qa)})`); }
    if (r.va !== undefined && r.va !== null) ev.push(`Vale-alimentação: ${fmtMoney(r.va)}${v('vaQtd') !== null ? ` para ${fmtNum(v('vaQtd'))} empregado(s)` : ''}${r.vaDia ? ` (valor por dia: ${typeof r.vaDia === 'number' ? fmtMoney(r.vaDia) : r.vaDia})` : ''}`);
    if (r.cesta !== undefined && r.cesta !== null) ev.push(`Cesta básica: ${fmtMoney(r.cesta)}${v('cestaQtd') !== null ? ` para ${fmtNum(v('cestaQtd'))} empregado(s)` : ''}${r.cestaUnit ? ` (cesta ${fmtMoney(r.cestaUnit)})` : ''}`);
    if (r.vt !== undefined && r.vt !== null) ev.push(`Vale-transporte: recarga ${fmtMoney(r.vt)}${v('vtDevido') !== null ? `, devido ${fmtMoney(r.vtDevido)}` : ''}`);
    if (r.ferias !== undefined && r.ferias !== null) ev.push(!num(r.ferias) ? 'Férias: nenhuma paga no mês' : `Férias pagas: ${fmtMoney(r.ferias)}${v('feriasQtd') ? ` para ${fmtNum(v('feriasQtd'))} empregado(s)` : ''}`);
    r.divergencia = div.filter(Boolean).join('; ');
    r.evidencia = ev.filter(Boolean).join(' | ');
    if (bs.length) r.benefComprovados = r.divergencia.includes('sem vale-alimentação') ? 'Parcial' : 'Sim';
    // "Custo total apurado" = folha bruta do relatório da folha (derive() somaria benefícios e férias quando o bruto falta)
    const bruto = r.bruto !== undefined ? num(r.bruto) : (!r.evFolha || /não traz o valor bruto/.test(r.evFolha) ? null : num(r.custoApurado));
    r.bruto = bruto; r.custoApurado = null;
    derive('maoDeObra', r);
    r.custoApurado = bruto;
    r.diferenca = bruto !== null && num(r.custoPrevisto) !== null ? +(bruto - num(r.custoPrevisto)).toFixed(2) : null;
    return r;
  },

  /** que relatório é este? */
  tipo(book) {
    for (const [nome, rows] of Object.entries(book)) {
      if (/^planilha\s*\d/.test(norm(nome))) continue;
      const topo = rows.slice(0, 12).map(r => Array.from(r || [], norm));
      const tit = topo.flat().join(' ');
      for (const h of topo) {
        if (!h.some(c => c.startsWith('departamento'))) continue;
        if (h.some(c => c.includes('recarga')) && h.some(c => c.includes('valor devido'))) return 'vt';
        if (h.some(c => c.includes('qtd ativos')) || /ticket alimenta|vale.alimenta/.test(tit)) return 'va';
        if (h.some(c => c.includes('valores da cesta') || c.includes('qtde ativos'))) return 'cesta';
        if (h.some(c => c === 'totais') || /ferias/.test(tit)) return 'ferias';
      }
      if (/relatorio.{0,4}ferias|ferias - /.test(tit) && !/consolidado/.test(norm(nome))) return 'ferias';
    }
    return null;
  },

  anoDe(book) {
    for (const rows of Object.values(book)) for (const r of rows.slice(0, 10)) for (const c of Array.from(r || [])) { const m = String(c ?? '').match(/\b(20\d\d)\b/); if (m) return m[1]; const n = String(c ?? '').match(/\b\d{2}\.(\d{2})\b/); if (n) return '20' + n[1]; }
    return String(new Date().getFullYear());
  },
  /** competência pelo nome da aba ou título: "VALORES |09.26", "1ª QUINZENA AGOSTO", "MARÇO" + "FÉRIAS 03.26" */
  comp(nome, rows, ano) {
    const n = norm(nome); let m = n.match(/(\d{1,2})\.(\d{2})\b/);
    if (m) return `20${m[2]}-${String(+m[1]).padStart(2, '0')}`;
    const mi = BenefDP.MESES.findIndex(x => n.includes(x));
    if (mi >= 0) { const t = rows.slice(0, 4).flat().map(x => String(x ?? '')).join(' ').match(/(\d{2})\.(\d{2})\b/); const a = t && +t[1] === mi + 1 ? '20' + t[2] : ano; return `${a}-${String(mi + 1).padStart(2, '0')}`; }
    return null;
  },

  ler(book, tipo) {
    const ano = BenefDP.anoDe(book), out = [];
    for (const [nome, rows] of Object.entries(book)) {
      if (/consolidado|^planilha/.test(norm(nome))) continue;
      const comp = BenefDP.comp(nome, rows, ano); if (!comp) continue;
      if (tipo === 'ferias') {
        for (const r of rows) {
          const a = Array.from(r || []); const j = a.findIndex(c => typeof c === 'string' && /^\s*0*\d+(\.\d+)?\s*-/.test(c)); if (j < 0 || j > 2) continue;
          const valor = num(a[j + 2]), qtd = num(a[j + 4]);
          out.push({ aba: nome, comp, dep: a[j].trim(), cod: FolhaDP.codDep(a[j]), valor: valor || 0, qtd: qtd || 0 });
        }
        continue;
      }
      let hi = -1; for (let i = 0; i < Math.min(14, rows.length); i++) if (Array.from(rows[i] || [], norm).some(c => c.startsWith('departamento'))) { hi = i; break; }
      if (hi < 0) continue;
      const hr = Array.from(rows[hi] || []), h = hr.map(norm), col = f => h.findIndex(f);
      const C = { dep: col(c => c.startsWith('departamento')), esf: col(c => c === 'esfera') };
      if (tipo === 'va') { C.unit = col(c => c.includes('valor por dia')); C.qtd = col(c => c.includes('qtd ativos')); C.valor = hr.findIndex(c => typeof c === 'number' && c > 20000); if (C.valor < 0) C.valor = C.qtd + 1; }
      if (tipo === 'cesta') { C.unit = col(c => c.includes('valores da cesta')); C.qtd = col(c => c.includes('qtde ativos')); C.valor = col(c => c === 'valor'); }
      if (tipo === 'vt') { C.valor = col(c => c.includes('recarga')); C.devido = col(c => c.includes('valor devido')); C.econ = col(c => c.includes('economia')); }
      for (const r0 of rows.slice(hi + 1)) {
        const r = Array.from(r0 || []), dep = String(r[C.dep] ?? '').trim();
        if (!/^\s*0*\d+(\.\d+)?\s*-/.test(dep)) continue;
        const g = k => C[k] >= 0 ? r[C[k]] : undefined;
        const valor = num(g('valor')), qtd = num(g('qtd'));
        if (!valor && !qtd && !num(g('devido'))) continue;
        out.push({ aba: nome, comp, dep, cod: FolhaDP.codDep(dep), esfera: String(g('esf') ?? '').trim(), valor: valor || 0, qtd, unit: g('unit') ?? '', devido: num(g('devido')) });
      }
    }
    return out;
  },

  /** nº do contrato de cada departamento, lido das tabelas da própria planilha que trazem "Nº CONTRATO" (ex.: consolidado do VT) */
  numeros(book) {
    const out = {};
    for (const rows of Object.values(book)) {
      let C = null;
      for (const r0 of rows) {
        const r = Array.from(r0 || []), h = r.map(norm);
        const ic = h.findIndex(c => /^n.{0,2}\s*contrato/.test(c)), id = h.findIndex(c => c.startsWith('departamento'));
        if (ic >= 0 && id >= 0) { C = { ic, id }; continue; }
        if (!C) continue;
        const cod = FolhaDP.codDep(r[C.id]), k = FolhaDP.chave(r[C.ic]);
        if (cod && k && !out[cod]) out[cod] = String(r[C.ic]).trim();
      }
    }
    return out;
  },

  /** departamento → contrato: vínculos já usados (folha), nº do contrato no nome, linhas do DP já gravadas */
  mapa(e) {
    const M = { ...(e.dpDeps || {}) };
    DB.where('maoDeObra', r => r.empresaId === e.id && r.origem === 'folhaDP').forEach(r => {
      (r.deps || []).forEach(d => { if (!M[d]) M[d] = r.contrato; });
      const t = String(r.evFolha || r.evidencia || '').match(/—\s(.+?):\s*líquido/); if (t) t[1].split(', ').forEach(d => { const k = FolhaDP.codDep(d); if (k && !M[k]) M[k] = r.contrato; });
    });
    return M;
  },

  async importar(e, book, file, tipo) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    const linhas = BenefDP.ler(book, tipo), nomeT = BenefDP.NOME[tipo];
    if (!linhas.length) { UI.toast(`Reconheci o relatório de ${nomeT.toLowerCase()}, mas não encontrei linhas com valores.`, 'bad', 6000); return; }
    const contratos = empRecs('contratos', e.id), byCod = BenefDP.mapa(e), chaves = {}, nums = { ...(e.dpNums || {}), ...BenefDP.numeros(book) };
    contratos.forEach(c => FolhaDP.chavesContrato(c).forEach(k => (chaves[k] = chaves[k] || []).push(c)));
    const grupos = {};
    linhas.forEach(l => { const k = l.cod || l.dep; const g = grupos[k] = grupos[k] || { k, dep: l.dep, esfera: l.esfera, linhas: [] }; g.linhas.push(l); if (!g.esfera && l.esfera) g.esfera = l.esfera; });
    const G = Object.values(grupos).sort((a, b) => (+a.k || 0) - (+b.k || 0));
    G.forEach(g => {
      const cod = byCod[g.k] && contratos.find(c => c.codigo === byCod[g.k]);
      if (cod) { g.auto = cod.id; return; }
      const nm = g.linhas.map(l => l.dep).join(' ').match(/\d[\d.]*\s*\/\s*\d{2,4}/);
      g.numero = nums[g.k] || (nm ? nm[0] : '');
      const cs = g.numero ? chaves[FolhaDP.chave(g.numero)] || [] : [];
      g.auto = cs.length === 1 ? cs[0].id : '';
    });
    const comps = [...new Set(linhas.map(l => l.comp))].sort();
    const ok = G.filter(g => g.auto), sem = G.filter(g => !g.auto);
    const opts = sel => `<option value="">— não lançar —</option>${contratos.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt', { numeric: true })).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.codigo)}${c.numero ? ' · nº ' + esc(c.numero) : ''} — ${esc(c.unidade || c.tomador || '')}</option>`).join('')}`;
    const ult = g => g.linhas.slice().sort((a, b) => b.comp.localeCompare(a.comp))[0];
    const linha = g => { const u = ult(g); return `<tr><td><b>${esc(g.dep)}</b>${g.esfera || g.numero ? `<small class="muted" style="display:block">${esc(g.esfera || '')}${g.numero ? `${g.esfera ? ' · ' : ''}contrato ${esc(g.numero)}${g.auto ? '' : ' — não cadastrado no app (ou sem nº no cadastro)'}` : ''}</small>` : ''}</td><td class="r">${u.qtd ? fmtNum(u.qtd) : '—'}</td><td class="r">${fmtMoney(u.valor)}<small class="muted" style="display:block">${fmtComp(u.comp)}</small></td><td><select data-bdp="${esc(g.k)}">${opts(g.auto)}</select></td></tr>`; };
    const tab = list => `<div class="table-wrap"><table class="dt"><thead><tr><th>Departamento (planilha)</th><th class="r">${tipo === 'vt' ? '' : 'Empregados'}</th><th class="r">Valor (últ.)</th><th>Contrato no app</th></tr></thead><tbody>${list.map(linha).join('')}</tbody></table></div>`;
    const destino = tipo === 'ferias' ? '<b>Encargos/provisões</b> (férias pagas no mês) e a obrigação de férias, se houver' : `<b>Benefícios</b> (soma de vale-alimentação, cesta básica e vale-transporte), <b>Benefícios comprovados?</b>${tipo === 'va' ? ', divergência quando há empregados da folha sem vale-alimentação' : ''} e as obrigações de benefícios já cadastradas no contrato`;
    const m = UI.modal({
      title: `${nomeT} (DP)`, sub: esc(file.name), wide: true,
      body: `<p class="muted">Competências: <b>${comps.map(fmtComp).join(', ')}</b>. Os departamentos foram ligados aos contratos pelos vínculos já usados na folha de pagamento e pelo nº do contrato informado na própria planilha. Em cada contrato e competência, a linha do DP em <b>Mão de obra</b> recebe ${destino}. Importar de novo atualiza sem duplicar.</p>
        <h4 class="sec">Ligados a contratos do app <span class="count">${ok.length}</span></h4>${ok.length ? tab(ok) : '<p class="muted small">Nenhum departamento ligado. Importe antes a folha de pagamento (ela cria os vínculos) ou escolha os contratos abaixo.</p>'}
        <details ${ok.length ? '' : 'open'}><summary class="sec">Sem contrato correspondente <span class="count">${sem.length}</span></summary>${sem.length ? tab(sem) : ''}</details>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="bdpOk">${icon('upload')} Preencher</button>`
    });
    const conta = () => { const n = new Set($$('[data-bdp]', m).map(s => s.value).filter(Boolean)).size; $('#bdpOk', m).innerHTML = `${icon('upload')} Preencher ${n} contrato(s)`; $('#bdpOk', m).disabled = !n; };
    $$('[data-bdp]', m).forEach(s => s.onchange = conta); conta();
    $('#bdpOk', m).onclick = async () => {
      const b = $('#bdpOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Preenchendo…';
      const porC = {}, deps = { ...(e.dpDeps || {}) };
      $$('[data-bdp]', m).forEach(s => { const g = grupos[s.dataset.bdp]; if (!s.value || !g) return; (porC[s.value] = porC[s.value] || []).push(...g.linhas); const c = DB.get('contratos', s.value); if (c && /^\d/.test(g.k)) deps[g.k] = c.codigo; });
      const MO = [], OB = [];
      for (const [cid, ls] of Object.entries(porC)) {
        const c = DB.get('contratos', cid); if (!c) continue;
        const porComp = {}; ls.forEach(l => (porComp[l.comp] = porComp[l.comp] || []).push(l));
        for (const [comp, L] of Object.entries(porComp)) {
          const id = FolhaDP.idDe(e.id, 'mo', c.codigo, comp), r = { ...(DB.get('maoDeObra', id) || { id, empresaId: e.id, contrato: c.codigo, competencia: comp, origem: 'folhaDP', posto: BenefDP.POSTO }) };
          const soma = k => L.some(l => num(l[k]) !== null) ? +L.reduce((s, l) => s + (num(l[k]) || 0), 0).toFixed(2) : null;
          const un = [...new Set(L.map(l => l.unit).filter(x => x !== '' && x !== null && x !== undefined))].join(' / ');
          if (tipo === 'va') Object.assign(r, { va: soma('valor'), vaQtd: soma('qtd'), vaDia: un });
          if (tipo === 'cesta') Object.assign(r, { cesta: soma('valor'), cestaQtd: soma('qtd'), cestaUnit: num(un) ?? un });
          if (tipo === 'vt') Object.assign(r, { vt: soma('valor'), vtDevido: soma('devido') });
          if (tipo === 'ferias') Object.assign(r, { ferias: soma('valor'), feriasQtd: soma('qtd') });
          r.posto = BenefDP.POSTO;
          MO.push(BenefDP.compor(r));
        }
      }
      if (MO.length) await DB.save('maoDeObra', MO);
      for (const cid of Object.keys(porC)) { const c = DB.get('contratos', cid); if (c) OB.push(...BenefDP.obrigacoes(e, c)); }
      if (OB.length) await DB.save('obrigacoes', OB);
      await DB.save('empresas', { ...DB.get('empresas', e.id), dpDeps: deps, dpNums: { ...(DB.get('empresas', e.id).dpNums || {}), ...BenefDP.numeros(book) } });
      UI.closeModal(); UI.toast(`Relatório de ${nomeT.toLowerCase()} aplicado em ${Object.keys(porC).length} contrato(s): ${MO.length} linhas de mão de obra e ${OB.length} obrigações.`, 'ok', 6000); App.render();
    };
    return UI.aguardar(m);
  },

  /** obrigações de benefícios e de férias, recalculadas a partir das linhas do DP do contrato */
  obrigacoes(e, c) {
    const L = DB.where('maoDeObra', r => r.empresaId === e.id && r.contrato === c.codigo && r.origem === 'folhaDP').sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)));
    const obs = DB.where('obrigacoes', r => r.empresaId === e.id && r.contrato === c.codigo), out = [], marca = '[Benefícios DP]';
    const juntar = (antigo, novo, mk) => { const a = String(antigo || '').split('\n').filter(t => !t.startsWith(mk)).join('\n').trim(); return (/n[aã]o verificad|n[aã]o apresentad/i.test(a) || !a ? '' : a + '\n') + mk + ' ' + novo; };
    const com = k => L.filter(r => num(r[k]) !== null && r[k] !== undefined);
    const serie = (k, q) => com(k).map(r => `${fmtComp(r.competencia)} ${fmtMoney(r[k])}${q && num(r[q]) !== null ? ` (${fmtNum(r[q])})` : ''}`).join(' · ');
    const B = ['va', 'cesta', 'vt'].filter(k => com(k).length);
    if (B.length) {
      const partes = B.map(k => `${BenefDP.NOME[k]}: ${serie(k, { va: 'vaQtd', cesta: 'cestaQtd' }[k])}`);
      const falta = com('va').filter(r => num(r.qtdAlocada) && num(r.vaQtd) !== null && num(r.vaQtd) < num(r.qtdAlocada) * 0.95);
      const total = +L.reduce((s, r) => s + (num(r.beneficios) || 0), 0).toFixed(2);
      const ver = `${partes.join('. ')}. Total no período: ${fmtMoney(total)}.`;
      const base = { qtdRealizada: `${com(B[0]).length} competência(s)`, valorRealizado: total, ...(com('va').some(r => num(r.qtdAlocada)) ? { status: falta.length ? 'Parcialmente cumprido' : 'Cumprido', desvio: falta.map(r => `${fmtComp(r.competencia)}: ${fmtNum(num(r.qtdAlocada) - num(r.vaQtd))} empregado(s) da folha sem vale-alimentação`).join('; '), impacto: falta.length ? 'Médio' : 'Baixo' } : {}) };
      const alvo = obs.filter(r => r.grupo === 'Benefícios' || /vale|alimenta[cç]|refei[cç]|transporte|cesta|benef[ií]cio/i.test(r.obrigacao || ''));
      if (alvo.length) alvo.forEach(r => out.push(derive('obrigacoes', { ...r, ...base, verificado: juntar(r.verificado, ver, marca) })));
    }
    const F = com('ferias').filter(r => num(r.ferias));
    const fer = obs.filter(r => /f[eé]rias/i.test(r.obrigacao || ''));
    if (fer.length && com('ferias').length) {
      const ver = F.length ? `Férias pagas: ${serie('ferias', 'feriasQtd')}.` : `Nenhuma férias paga nas competências do relatório (${com('ferias').map(r => fmtComp(r.competencia)).join(', ')}).`;
      fer.forEach(r => out.push(derive('obrigacoes', { ...r, verificado: juntar(r.verificado, ver, '[Férias DP]'), valorRealizado: +F.reduce((s, x) => s + num(x.ferias), 0).toFixed(2) })));
    }
    return out;
  }
};
