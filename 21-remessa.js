/* =====================================================================
   REMESSA MENSAL — a empresa envia pelo portal, todo mês, os números de
   execução de cada contrato e os documentos; tudo entra numa fila
   "em análise" e só alimenta os dados gerais quando o escritório aprova.
   ===================================================================== */
const Remessa = {
  ST: { aberta: ['Em preenchimento', 'muted'], revisao: ['Com o gerente para revisão', 'info'], enviada: ['Enviada · aguardando análise', 'warn'], analise: ['Em análise', 'info'], pendencia: ['Devolvida com pendência', 'bad'], aprovada: ['Aprovada e lançada', 'ok'] },
  CATS: [['folha', 'Folha de pagamento'], ['beneficios', 'Comprovantes de benefícios (VA/VT…)'], ['fgts', 'Guias e comprovantes FGTS/INSS'], ['nf', 'Notas fiscais / medições'], ['receb', 'Comprovantes de recebimento'], ['ponto', 'Frequência / ponto'], ['aditivo', 'Termo aditivo / apólice de garantia'], ['outros', 'Outros']],
  OBRIG: ['folha', 'fgts', 'nf'],
  id: (eid, comp) => 'rm_' + eid + '_' + comp.replace('-', ''),
  /** competência padrão: o mês anterior (o que acabou de fechar) */
  compPadrao() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); },
  comps(n = 6) { const out = [], d = new Date(); d.setDate(1); for (let i = 1; i <= n; i++) { const x = new Date(d); x.setMonth(d.getMonth() - i); out.push(x.toISOString().slice(0, 7)); } return out; },
  prazo(e, comp) { const [y, m] = comp.split('-').map(Number), d = new Date(y, m, Math.min(28, +e.diaRemessa || 15)); return d.toISOString().slice(0, 10); },
  get: (eid, comp) => DB.get('remessas', Remessa.id(eid, comp)),
  /** contratos que estavam vigentes na competência */
  contratos(e, comp) {
    const ini = comp + '-01', fim = comp + '-31';
    return empRecs('contratos', e.id).filter(c => !/encerrad|rescindid|em licita/i.test(c.status || '') && (!isISO(c.fim) || c.fim >= ini) && (!isISO(c.inicio) || c.inicio <= fim))
      .sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
  },
  postos: c => empRecs('maoDeObra', c.empresaId).filter(m => m.contrato === c.codigo && !m.competencia).reduce((s, m) => s + (num(m.qtdContratada) || 0), 0),
  pill(r) { const [t, k] = Remessa.ST[r?.status || 'aberta']; return `<span class="pill ${k}">${esc(t)}</span>`; },
  /** divergências automáticas de uma remessa */
  divergencias(r) {
    const e = DB.get('empresas', r.empresaId), out = [], semNum = [];
    Remessa.contratos(e, r.competencia).forEach(c => {
      const x = r.contratos?.[c.id] || {}, vm = num(c.valorMensal), fat = num(x.faturado), rec = num(x.recebido), pc = Remessa.postos(c), po = num(x.ocupados);
      const add = (risco, txt, valor) => out.push({ c, risco, txt, valor });
      if (fat === null) { semNum.push(c.codigo); }
      else if (vm && Math.abs(fat - vm) / vm > 0.05) add('Médio', `Faturado (${fmtMoney(fat)}) difere ${fmtPct((fat - vm) / vm)} do valor mensal do contrato (${fmtMoney(vm)}).`, fat - vm);
      if (fat !== null && rec !== null && rec < fat - 0.01) add(rec === 0 ? 'Alto' : 'Médio', `Recebido (${fmtMoney(rec)}) menor que o faturado (${fmtMoney(fat)}): falta receber ${fmtMoney(fat - rec)}.`, fat - rec);
      if (pc && po !== null && po < pc) add('Alto', `Postos ocupados (${po}) abaixo dos contratados (${pc}): risco de glosa.`);
      if (num(x.faltas) > 0) add('Baixo', `${num(x.faltas)} falta(s)/substituição(ões) no mês${x.ocorrencias ? ': ' + x.ocorrencias : '.'}`);
      if (x.aditivo) add('Baixo', 'A empresa informou que recebeu termo aditivo neste mês: cadastrar o aditivo e atualizar vigência/valor.');
      if (x.apolice) add('Baixo', 'A empresa informou nova apólice/endosso de garantia: conferir valor e vigência.');
    });
    if (semNum.length) out.unshift({ c: null, risco: 'Médio', txt: `Faturamento do mês não informado em ${semNum.length} contrato(s): ${semNum.join(', ')}.` });
    Remessa.OBRIG.forEach(k => { if (!(r.arquivos || []).some(a => a.cat === k)) out.push({ c: null, risco: 'Médio', txt: `Documento obrigatório não enviado: ${Remessa.CATS.find(x => x[0] === k)[1]}.` }); });
    return out;
  },
  /** grava a remessa: equipe grava direto; o cliente grava pelo servidor (só a parte dele) */
  async gravar(r) {
    if (Session.isStaff || !Session.remote) { await DB.save('remessas', r); return r; }
    const out = await api('remessaSalvar', { remessa: r });
    DB._applyLocal({ op: 'save', c: 'remessas', records: [out] }); await DB.persist(); return out;
  },
  async subir(e, comp, file, cat, contratoId) {
    const base64 = await Docs.b64(file), nome = `${comp} · ${Remessa.CATS.find(x => x[0] === cat)?.[1] || cat} · ${file.name}`;
    let up = { id: '', url: '' };
    if (Session.remote) up = await api(Session.isStaff ? 'juntar' : 'remessaArquivo', Session.isStaff ? { empresaKey: e.id, empresa: e.fantasia || e.razao, nome, mime: file.type || 'application/pdf', base64 } : { empresaId: e.id, competencia: comp, nome, mime: file.type || 'application/pdf', base64 });
    return { id: uid('ra'), cat, contratoId: contratoId || '', nome: file.name, driveId: up.id || '', url: up.url || '', em: new Date().toISOString(), por: Session.user?.nome || Session.user?.email || '' };
  },

  /* ------------------------- PORTAL (empresa) ------------------------- */
  portal(host, emps, redraw) {
    const st = Remessa.pst = Remessa.pst || {};
    if (!emps.length) { host.innerHTML = '<div class="empty"><p>Nenhuma empresa vinculada.</p></div>'; return; }
    const e = emps.find(x => x.id === st.emp) || emps[0], comp = st.comp || Remessa.compPadrao();
    const r = Remessa.get(e.id, comp) || { id: Remessa.id(e.id, comp), empresaId: e.id, competencia: comp, status: 'aberta', contratos: {}, arquivos: [] };
    const pfR = Perfis.de(e, Session.isStaff), edit = ['aberta', 'pendencia'].includes(r.status || 'aberta') || (r.status === 'revisao' && pfR === 'ger'), cs = Remessa.contratos(e, comp), pz = Remessa.prazo(e, comp), dz = daysUntil(pz);
    const inp = (c, k, ph, money) => `<input class="input" data-rc="${c.id}" data-k="${k}" inputmode="decimal" placeholder="${ph}" value="${esc(r.contratos?.[c.id]?.[k] != null ? (money ? (num(r.contratos[c.id][k]) ?? '').toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : r.contratos[c.id][k]) : '')}" ${edit ? '' : 'disabled'}>`;
    host.innerHTML = `
      <section class="card rm-top">
        <div class="rm-sel">${emps.length > 1 ? `<label>Empresa <select id="rmEmp">${emps.map(x => `<option value="${x.id}" ${x.id === e.id ? 'selected' : ''}>${esc(x.fantasia || x.razao)}</option>`).join('')}</select></label>` : ''}
          <label>Competência <select id="rmComp">${Remessa.comps().map(c => `<option value="${c}" ${c === comp ? 'selected' : ''}>${fmtComp(c)}</option>`).join('')}</select></label></div>
        <div class="rm-st">${Remessa.pill(r)} <span class="muted small">${r.status === 'aberta' || !r.status ? `Enviar até <b>${fmtDate(pz)}</b>${dz < 0 ? ' · <b class="t-bad">atrasada</b>' : dz <= 5 ? ` · faltam ${dz} dia(s)` : ''}` : r.enviadoEm ? 'Enviada em ' + fmtDateTime(r.enviadoEm) : ''}</span></div>
        ${r.status === 'pendencia' && r.analise?.obs ? `<div class="notice warn">${icon('alert')}<div><b>O escritório pediu ajustes:</b><br>${esc(r.analise.obs)}</div></div>` : ''}
        <p class="muted small">Informe os números de cada contrato no mês e anexe os documentos. Ao enviar, tudo vai para a análise do escritório antes de entrar no acompanhamento.</p>
      </section>
      ${cs.length ? cs.map(c => `<section class="card rm-ct"><header><h3><b>${esc(c.codigo || '')}</b> ${esc(c.tomador || '')}</h3><small class="muted">${esc([c.unidade, c.numero && 'nº ' + c.numero, c.valorMensal && 'valor mensal ' + fmtMoney(c.valorMensal)].filter(Boolean).join(' · '))}</small></header>
        <div class="rm-grid">
          <label>Valor faturado no mês (R$)${inp(c, 'faturado', '0,00', 1)}</label>
          <label>Valor recebido do órgão (R$)${inp(c, 'recebido', '0,00', 1)}</label>
          <label>Postos ocupados${Remessa.postos(c) ? ` <small>(contratados: ${Remessa.postos(c)})</small>` : ''}${inp(c, 'ocupados', 'nº')}</label>
          <label>Faltas / substituições${inp(c, 'faltas', 'nº')}</label>
          <label class="full">Ocorrências do mês<input class="input" data-rc="${c.id}" data-k="ocorrencias" placeholder="Ex.: afastamento, atraso de pagamento, notificação do fiscal…" value="${esc(r.contratos?.[c.id]?.ocorrencias || '')}" ${edit ? '' : 'disabled'}></label>
          <label class="chk"><input type="checkbox" data-rc="${c.id}" data-k="aditivo" ${r.contratos?.[c.id]?.aditivo ? 'checked' : ''} ${edit ? '' : 'disabled'}> Recebemos termo aditivo neste mês</label>
          <label class="chk"><input type="checkbox" data-rc="${c.id}" data-k="apolice" ${r.contratos?.[c.id]?.apolice ? 'checked' : ''} ${edit ? '' : 'disabled'}> Recebemos apólice/endosso de garantia</label>
        </div></section>`).join('') : '<div class="empty"><p>Nenhum contrato vigente nesta competência.</p></div>'}
      <section class="card"><header><h3>${icon('upload')} Documentos do mês</h3></header>
        <div class="rm-docs">${Remessa.CATS.map(([k, l]) => { const fs = (r.arquivos || []).filter(a => a.cat === k); return `<div class="rm-doc ${fs.length ? 'ok' : ''}"><div><b>${fs.length ? icon('check') : ''} ${esc(l)}${Remessa.OBRIG.includes(k) ? ' <em>obrigatório</em>' : ''}</b>
          ${fs.map(a => `<small>${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.nome)}</a>` : esc(a.nome)}${edit ? ` <button class="link small" data-rmdel="${a.id}">remover</button>` : ''}</small>`).join('')}</div>
          ${edit ? `<label class="btn ghost sm">${icon('upload')} Anexar<input type="file" multiple hidden data-rmcat="${k}"></label>` : ''}</div>`; }).join('')}</div></section>
      ${edit ? `<section class="card"><label class="full">Observações para o escritório<textarea class="input" id="rmObs" rows="3">${esc(r.obsCliente || '')}</textarea></label>
        <div class="btn-row right"><button class="btn ghost" id="rmSalvar">${icon('check')} Salvar rascunho</button><button class="btn primary" id="rmEnviar">${icon('upload')} ${pfR === 'ger' ? 'Enviar ao escritório' : 'Enviar'}</button></div></section>` : ''}`;
    const coleta = () => {
      $$('[data-rc]', host).forEach(i => { const o = r.contratos[i.dataset.rc] = r.contratos[i.dataset.rc] || {}; o[i.dataset.k] = i.type === 'checkbox' ? i.checked : (/faturado|recebido|ocupados|faltas/.test(i.dataset.k) ? num(i.value) : i.value.trim()); });
      r.obsCliente = $('#rmObs', host)?.value.trim() || '';
    };
    $('#rmEmp', host)?.addEventListener('change', ev => { st.emp = ev.target.value; redraw(); });
    $('#rmComp', host).onchange = ev => { st.comp = ev.target.value; redraw(); };
    $$('[data-rmcat]', host).forEach(inp => inp.onchange = async () => {
      coleta(); const fs = [...inp.files]; if (!fs.length) return;
      UI.toast(`Enviando ${fs.length} arquivo(s)…`);
      try { for (const f of fs) r.arquivos = [...(r.arquivos || []), await Remessa.subir(e, comp, f, inp.dataset.rmcat)]; await Remessa.gravar(r); UI.toast('Arquivo(s) anexado(s).', 'ok'); redraw(); }
      catch (err) { UI.toast('Não foi possível anexar: ' + err.message, 'bad'); }
    });
    $$('[data-rmdel]', host).forEach(b => b.onclick = async () => { coleta(); r.arquivos = r.arquivos.filter(a => a.id !== b.dataset.rmdel); await Remessa.gravar(r); redraw(); });
    $('#rmSalvar', host)?.addEventListener('click', async () => { coleta(); try { await Remessa.gravar(r); UI.toast('Rascunho salvo.', 'ok'); } catch (err) { UI.toast(err.message, 'bad'); } });
    $('#rmEnviar', host)?.addEventListener('click', async () => {
      coleta();
      const falta = Remessa.OBRIG.filter(k => !(r.arquivos || []).some(a => a.cat === k)).map(k => Remessa.CATS.find(x => x[0] === k)[1]);
      if (falta.length && !confirm('Ainda faltam documentos obrigatórios:\n• ' + falta.join('\n• ') + '\n\nEnviar mesmo assim?')) return;
      const ant = r.status;
      r.status = 'enviada'; r.enviadoEm = new Date().toISOString(); r.enviadoPor = Session.user?.nome || Session.user?.email || '';
      try { const out = await Remessa.gravar(r); UI.toast(out?.status === 'revisao' ? 'Remessa enviada ao gerente da empresa para revisão.' : 'Remessa enviada para análise do escritório.', 'ok'); redraw(); } catch (err) { r.status = ant || 'aberta'; UI.toast(err.message, 'bad'); }
    });
  },

  /* ------------------------- ESCRITÓRIO ------------------------- */
  fila: () => DB.where('remessas', r => ['enviada', 'analise'].includes(r.status)),
  /** página geral: todas as empresas × competência */
  view(v) {
    App.crumbs([{ t: 'Consultoria' }, { t: 'Remessas mensais' }]);
    const st = Remessa.vst = Remessa.vst || { comp: Remessa.compPadrao() }, comp = st.comp, emps = DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
    const fila = Remessa.fila().sort((a, b) => String(a.enviadoEm).localeCompare(String(b.enviadoEm)));
    const linha = r => { const e = DB.get('empresas', r.empresaId); return `<button type="button" class="venc-i" data-rmopen="${r.id}"><span><b>${esc(e ? e.fantasia || e.razao : '—')}</b> · ${fmtComp(r.competencia)}<small class="muted">${(r.arquivos || []).length} arquivo(s) · ${Object.values(r.contratos || {}).filter(x => x.faturado != null).length} contrato(s) com números${r.enviadoEm ? ' · enviada em ' + fmtDateTime(r.enviadoEm) : ''}</small></span><span class="r">${Remessa.pill(r)}</span></button>`; };
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>Remessas mensais</h1><p class="muted">O que as empresas enviam pelo portal entra aqui e só alimenta os dados gerais depois de aprovado.</p></div></div>
      <section class="card"><header><h2>${icon('alert')} Fila de análise <small class="muted">${fila.length}</small></h2></header>${fila.length ? `<div class="venc-l">${fila.map(linha).join('')}</div>` : '<p class="muted">Nenhuma remessa aguardando análise.</p>'}</section>
      <section class="card"><header><h2>${icon('calendar')} Situação por empresa</h2><select id="rvComp" class="input sm" style="width:auto">${Remessa.comps(12).map(c => `<option value="${c}" ${c === comp ? 'selected' : ''}>${fmtComp(c)}</option>`).join('')}</select></header>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Empresa</th><th>Prazo</th><th>Situação</th><th>Arquivos</th><th></th></tr></thead><tbody>${emps.map(e => { const r = Remessa.get(e.id, comp), pz = Remessa.prazo(e, comp); return `<tr><td>${esc(e.fantasia || e.razao)}</td><td>${fmtDate(pz)}${!r || ['aberta'].includes(r.status) ? (daysUntil(pz) < 0 ? ' <b class="t-bad">atrasada</b>' : '') : ''}</td><td>${r ? Remessa.pill(r) : '<span class="pill muted">Não iniciada</span>'}</td><td>${r ? (r.arquivos || []).length : 0}</td><td>${r ? `<button class="link small" data-rmopen="${r.id}">abrir</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div></section>`;
    $('#rvComp').onchange = ev => { st.comp = ev.target.value; App.render(true); };
    $$('[data-rmopen]', v).forEach(b => b.onclick = () => Remessa.revisar(DB.get('remessas', b.dataset.rmopen)));
  },
  /** aba "Remessas mensais" da empresa */
  tab(host, e) {
    const rs = empRecs('remessas', e.id).sort((a, b) => b.competencia.localeCompare(a.competencia));
    host.innerHTML = `<section class="card"><header><h2>${icon('upload')} Remessas mensais</h2><span class="muted small">Prazo: dia ${esc(String(e.diaRemessa || 15))} do mês seguinte · ajuste em “Empresa”</span></header>
      ${rs.length ? `<div class="venc-l">${rs.map(r => `<button type="button" class="venc-i" data-rmopen="${r.id}"><span><b>${fmtComp(r.competencia)}</b><small class="muted">${(r.arquivos || []).length} arquivo(s)${r.enviadoEm ? ' · enviada em ' + fmtDateTime(r.enviadoEm) : ''}${r.analise?.em ? ' · analisada em ' + fmtDateTime(r.analise.em) : ''}</small></span><span class="r">${Remessa.pill(r)}</span></button>`).join('')}</div>` : '<p class="muted">A empresa ainda não enviou remessas pelo portal.</p>'}
      <p class="muted small">Para ver como a empresa preenche, use “Pré-visualizar portal” no cadastro do cliente.</p></section>`;
    $$('[data-rmopen]', host).forEach(b => b.onclick = () => Remessa.revisar(DB.get('remessas', b.dataset.rmopen)));
  },
  /** análise de uma remessa: números × contrato, divergências, documentos; aprovar, devolver */
  revisar(r) {
    if (!r) return;
    const e = DB.get('empresas', r.empresaId), cs = Remessa.contratos(e, r.competencia), dv = Remessa.divergencias(r), fecha = r.status === 'aprovada';
    const m = UI.modal({ title: `Remessa ${fmtComp(r.competencia)}`, sub0: '', cls: 'rm-rev', sub: `${esc(e.fantasia || e.razao)} · ${Remessa.ST[r.status || 'aberta'][0]}${r.enviadoEm ? ' · enviada em ' + fmtDateTime(r.enviadoEm) + (r.enviadoPor ? ' por ' + r.enviadoPor : '') : ''}`, wide: true,
      body: `${r.obsCliente ? `<div class="notice">${icon('mail')}<div><b>Observação da empresa:</b> ${esc(r.obsCliente)}</div></div>` : ''}
        <h4 class="sec">Números informados</h4>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Contrato</th><th>Valor mensal</th><th>Faturado</th><th>Recebido</th><th>Postos (contr. / ocup.)</th><th>Faltas</th><th>Ocorrências</th></tr></thead><tbody>
          ${cs.map(c => { const x = r.contratos?.[c.id] || {}; return `<tr><td><b>${esc(c.codigo || '')}</b><small class="muted"> ${esc(c.tomador || '')}</small></td><td>${fmtMoney(c.valorMensal)}</td><td>${x.faturado != null ? fmtMoney(x.faturado) : '—'}</td><td>${x.recebido != null ? fmtMoney(x.recebido) : '—'}</td><td>${Remessa.postos(c) || '—'} / ${x.ocupados ?? '—'}</td><td>${x.faltas ?? '—'}</td><td><small>${esc(x.ocorrencias || '')}${x.aditivo ? ' · <b>aditivo recebido</b>' : ''}${x.apolice ? ' · <b>apólice nova</b>' : ''}</small></td></tr>`; }).join('')}
        </tbody></table></div>
        <h4 class="sec">Divergências encontradas (${dv.length})</h4>
        ${dv.length ? `<div class="rm-dv">${dv.map((d, i) => `<label class="chk"><input type="checkbox" data-dv="${i}" ${d.risco !== 'Baixo' && !fecha ? 'checked' : ''} ${fecha ? 'disabled' : ''}><span class="pill ${d.risco === 'Alto' ? 'bad' : d.risco === 'Médio' ? 'warn' : 'muted'}">${d.risco}</span><span>${d.c ? `<b>${esc(d.c.codigo)}</b> ` : ''}${esc(d.txt)}</span></label>`).join('')}</div><p class="muted small">As marcadas viram achados no plano de ação quando a remessa for aprovada.</p>` : '<p class="muted">Nenhuma divergência automática.</p>'}
        <h4 class="sec">Documentos enviados (${(r.arquivos || []).length})</h4>
        ${(r.arquivos || []).length ? `<ul class="plain">${r.arquivos.map(a => `<li>${icon('file')} <b>${esc(Remessa.CATS.find(x => x[0] === a.cat)?.[1] || a.cat)}</b> — ${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.nome)}</a>` : esc(a.nome)}</li>`).join('')}</ul>` : '<p class="muted">Nenhum documento.</p>'}
        ${fecha ? `<div class="notice ok">${icon('check')}<div>Aprovada em ${fmtDateTime(r.analise?.em)} por ${esc(r.analise?.por || '')}: ${r.analise?.lancados || 0} lançamento(s) e ${r.analise?.achados || 0} achado(s) gerados.</div></div>` : `<div class="rm-rev"><label class="full">Observação ao cliente (obrigatória para devolver)<textarea class="input" id="rvObs" rows="3">${esc(r.analise?.obs || '')}</textarea></label></div>`}`,
      foot: fecha ? '<span class="sp"></span><button class="btn ghost" data-close>Fechar</button>' : `${r.status === 'enviada' ? `<button class="btn ghost" id="rvAna">${icon('eye')} Marcar “em análise”</button>` : ''}<span class="sp"></span><button class="btn ghost danger-text" id="rvDev">${icon('x')} Devolver com pendência</button><button class="btn primary" id="rvOk">${icon('check')} Aprovar e lançar</button>` });
    const fim = async (status, extra) => { await DB.save('remessas', { ...r, status, analise: { ...(r.analise || {}), por: Session.user?.nome || Session.user?.email, em: new Date().toISOString(), ...extra } }); UI.closeModal(); App.render(true); };
    $('#rvAna', m)?.addEventListener('click', () => fim('analise', {}).then(() => UI.toast('Remessa marcada como em análise.', 'ok')));
    $('#rvDev', m)?.addEventListener('click', () => { const obs = $('#rvObs', m).value.trim(); if (!obs) return UI.toast('Escreva o que a empresa precisa ajustar.', 'warn'); fim('pendencia', { obs }).then(() => UI.toast('Remessa devolvida à empresa.', 'ok')); });
    $('#rvOk', m)?.addEventListener('click', async () => {
      const marc = $$('[data-dv]', m).filter(x => x.checked).map(x => dv[+x.dataset.dv]), base = { empresaId: e.id };
      const fin = [], mo = [], doc = [], ach = [];
      cs.forEach(c => { const x = r.contratos?.[c.id] || {};
        if (x.faturado != null || x.recebido != null) fin.push({ ...base, contrato: c.codigo, competencia: r.competencia, tipo: 'Receita', grupo: 'Faturamento (remessa)', descricao: `Faturado × recebido em ${fmtComp(r.competencia)} (informado pela empresa)`, previsto: num(x.faturado), realizado: num(x.recebido), pago: num(x.recebido) >= num(x.faturado) ? 'Sim' : num(x.recebido) ? 'Parcial' : 'Não', obs: 'Remessa mensal aprovada', origem: r.id });
        if (x.ocupados != null) mo.push({ ...base, contrato: c.codigo, competencia: r.competencia, posto: 'Total do contrato (remessa)', qtdContratada: Remessa.postos(c) || null, qtdAlocada: num(x.ocupados), divergencia: x.faltas ? `${x.faltas} falta(s)/substituição(ões)${x.ocorrencias ? ': ' + x.ocorrencias : ''}` : (x.ocorrencias || ''), evidencia: 'Remessa mensal ' + fmtComp(r.competencia), origem: r.id });
      });
      (r.arquivos || []).forEach(a => { const c = cs.find(x => x.id === a.contratoId); doc.push({ ...base, contrato: c?.codigo || '', tomador: c?.tomador || '', tipo: Remessa.CATS.find(x => x[0] === a.cat)?.[1] || 'Outro', arquivo: a.nome, link: a.url, origem: 'Portal da empresa – remessa ' + fmtComp(r.competencia), caminho: 'Remessas/' + r.competencia, origemId: r.id }); });
      const n0 = empRecs('achados', e.id).length;
      marc.forEach((d, i) => ach.push({ ...base, codigo: `${e.sigla || 'AC'}-R${r.competencia.replace('-', '')}-${String(i + 1).padStart(2, '0')}`, contrato: d.c?.codigo || '', periodo: fmtComp(r.competencia), area: /Recebido|Faturado|Faturamento/.test(d.txt) ? 'Financeiro' : /Postos|falta/i.test(d.txt) ? 'Trabalhista' : 'Documental', achado: d.txt, criterio: 'Remessa mensal da empresa', risco: d.risco, valor: d.valor ?? null, recomendacao: 'Verificar com a empresa e regularizar', responsavel: 'Gestão contratual da empresa', status: 'Pendente', visivelEmpresa: 'Sim', origem: r.id }));
      for (const [col, recs] of [['financeiro', fin], ['maoDeObra', mo], ['documentos', doc], ['achados', ach]]) if (recs.length) await DB.save(col, recs);
      await fim('aprovada', { lancados: fin.length + mo.length + doc.length, achados: ach.length });
      UI.toast(`Remessa aprovada: ${fin.length + mo.length} lançamento(s), ${doc.length} documento(s) e ${ach.length} achado(s).`, 'ok');
    });
  }
};

/* ------------------------- SPLASH DE CONEXÃO (portal) ------------------------- */
const ConnSplash = {
  logo: e => e?.logo ? `<img src="${esc(e.logo)}" alt="">` : `<span>${esc(e?.sigla || ((e?.fantasia || e?.razao || Session.user?.nome || 'Cliente').split(/\s+/).filter(w => w.length > 2).map(w => w[0]).slice(0, 2).join('') || 'C').toUpperCase())}</span>`,
  show(e, nomeCli) {
    if (document.querySelector('.conn-splash')) return;
    document.getElementById('splash')?.remove(); // a abertura do cliente substitui a abertura padrão
    const esc0 = escritorio(), ov = document.createElement('div'); ov.className = 'conn-splash';
    ov.innerHTML = `<div class="cs-card"><div class="cs-pair"><img src="${BRAND.logoDark}" alt="" class="cs-af"><span class="cs-x">×</span><div class="cs-cli">${ConnSplash.logo(e)}</div></div>
      <div class="cs-t">${esc((esc0.nome || 'Amorim Firmo').split(/ Advocacia| e Consultoria/)[0])} × ${esc(e ? e.fantasia || e.razao : nomeCli || '')}</div><div class="cs-s">Área exclusiva ${e ? 'da empresa' : 'do cliente'}</div>
      <div class="cs-bar"><i></i></div><div class="cs-st">Estabelecendo conexão segura…</div></div><small class="cs-skip">toque para pular</small>`;
    document.body.appendChild(ov);
    const st = $('.cs-st', ov), fora = () => { ov.classList.add('out'); setTimeout(() => ov.remove(), 500); };
    setTimeout(() => st.textContent = 'Sincronizando ' + (e ? 'contratos' : 'processos') + '…', 1400);
    setTimeout(() => st.textContent = 'Tudo pronto ✓', 2700);
    const t = setTimeout(fora, 3500); ov.onclick = () => { clearTimeout(t); fora(); };
  }
};
/** abertura para quem tem várias empresas: o cartão percorre os logos e termina na escolha */
ConnSplash.multi = (emps) => {
  if (document.querySelector('.conn-splash')) return;
  document.getElementById('splash')?.remove();
  const esc0 = escritorio(), mostra = emps.slice(0, 5), n = emps.length, passo = Math.min(900, Math.round(2700 / mostra.length));
  const ov = document.createElement('div'); ov.className = 'conn-splash';
  ov.innerHTML = `<div class="cs-card"><div class="cs-pair"><img src="${BRAND.logoDark}" alt="" class="cs-af"><span class="cs-x">×</span><div class="cs-cli cs-slot">${mostra.map((e, i) => `<div class="cs-it" data-i="${i}">${ConnSplash.logo(e)}</div>`).join('')}${n > 5 ? '<div class="cs-it" data-i="5"><span>+' + (n - 5) + '</span></div>' : ''}</div></div>
    <div class="cs-t">${esc((esc0.nome || 'Amorim Firmo').split(/ Advocacia| e Consultoria/)[0])} × suas empresas</div><div class="cs-s">Área exclusiva do cliente</div>
    <div class="cs-dots">${mostra.map(() => '<i></i>').join('')}${n > 5 ? '<i></i>' : ''}</div><div class="cs-st">Estabelecendo conexão segura…</div></div><small class="cs-skip">toque para pular</small>`;
  document.body.appendChild(ov);
  const its = $$('.cs-it', ov), dots = $$('.cs-dots i', ov), st = $('.cs-st', ov), tm = [];
  its.forEach((el, i) => tm.push(setTimeout(() => {
    its.forEach(x => x.classList.remove('on')); el.classList.add('on'); if (i) dots[i - 1].classList.add('ok');
    st.textContent = i < mostra.length ? `Conectando ${mostra[i].fantasia || mostra[i].razao}…` : `Conectando mais ${n - 5} empresa(s)…`;
  }, 500 + i * passo)));
  const fimT = 500 + its.length * passo;
  tm.push(setTimeout(() => { dots.forEach(d => d.classList.add('ok')); st.textContent = `${n} empresas conectadas ✓`; }, fimT));
  const fora = () => { tm.forEach(clearTimeout); ov.classList.add('out'); setTimeout(() => ov.remove(), 500); };
  tm.push(setTimeout(fora, fimT + 900)); ov.onclick = fora;
};
/** logo da empresa (para o splash do portal): reduz a imagem e guarda no cadastro */
ConnSplash.escolherLogo = e => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const img = new Image(), url = URL.createObjectURL(f);
    img.onload = async () => { const s = Math.min(1, 240 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      await DB.save('empresas', { ...e, logo: cv.toDataURL('image/png') }); URL.revokeObjectURL(url); UI.toast('Logo da empresa salvo.', 'ok'); App.render(true); };
    img.src = url; };
  inp.click();
};
