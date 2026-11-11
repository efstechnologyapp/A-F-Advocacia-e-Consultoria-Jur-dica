/* =====================================================================
   JUDICIAL — processos por área, movimentações, agenda, DataJud
   ===================================================================== */
const Judicial = {
  list(v, area) {
    const all = area === 'todos';
    const A = AREAS[area];
    App.crumbs([{ t: 'Judicial', href: '/judicial/todos' }, { t: all ? 'Todos os processos' : A?.nome || area }]);
    const procs = DB.where('processos', p => all || p.area === area), procsT = procs;
    const lastMov = id => DB.where('movimentos', m => m.processoId === id).sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];
    const rowsT = procs.map(p => { const m = lastMov(p.id), pa = Parceria.de(p); return { ...p, _parc: pa ? Parceria.rotulo(pa) : '', _cli: clienteNomes(p) || '⚠ cliente a definir', _area: AREAS[p.area]?.nome, _ult: m?.data || null, _ultT: m?.titulo || '', _prox: DB.where('prazos', x => x.processoId === p.id && !x.concluido && isISO(x.data) && daysUntil(x.data) >= 0).sort((a, b) => a.data.localeCompare(b.data))[0]?.data || null }; });
    const sc = { fields: [F('numero', 'Número', 'cnj'), F('_cli', 'Cliente(s)'), F('_area', 'Área'), F('classe', 'Classe'), F('orgao', 'Órgão julgador'), F('status', 'Situação', 'select', { opts: [] }), F('_ult', 'Última movimentação', 'date'), F('_prox', 'Próximo compromisso', 'date'), F('parteContraria', 'Parte contrária'), F('assunto', 'Assunto'), F('_parc', 'Parceiro')] };
    const rows = rowsT.filter(r => !r._parc), rowsP = rowsT.filter(r => r._parc);
    const ativos = procs.filter(p => p.status !== 'Encerrado' && p.status !== 'Arquivado provisoriamente');
    const valor = procs.reduce((s, p) => s + (num(p.valorCausa) || 0), 0), comValor = procs.filter(p => num(p.valorCausa) > 0).length;
    const semMov30 = ativos.filter(p => { const m = lastMov(p.id); return !m || daysUntil(m.data) < -30; }).length;
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Judicial</span><h1>${icon(A?.icon || 'layers', 'h-ic')} ${all ? 'Todos os processos' : 'Direito ' + (A.nome === 'Cível' ? 'Civil' : A.nome)}</h1><p class="muted">Processos próprios do escritório, com movimentações e acesso do cliente pelo portal.</p></div>
      <div class="actions"><button class="btn ghost" id="nProc">${icon('plus')} Novo processo</button><button class="btn primary" id="nProcDocs">${icon('upload')} Cadastrar pelos arquivos</button></div></div>
      <div class="kpis sm">${kpi('Em andamento', ativos.length)}${kpi('Total cadastrados', procs.length)}${kpi('Valor das causas', fmtMoneyShort(valor), comValor < procs.length ? `em ${comValor} de ${procs.length} processos · <button class="link" id="kVal">informar os demais</button>` : '')}${kpi('Sem movimentação há 30+ dias', semMov30, 'merecem consulta', semMov30 ? 'warn' : '')}</div>
      ${DJEN.pendentes().length ? `<div class="notice">${icon('mail')}<div><b>${DJEN.pendentes().length} processo(s) com intimação no DJEN em nome dos advogados do escritório ainda não cadastrados.</b> <button class="link" id="djPendJ">Revisar e cadastrar</button></div></div>` : ''}
      ${DJEN.cadastrados().length ? `<p class="muted small right"><button class="link" id="djDesfJ">${icon('list')} Processos cadastrados pela OAB (${DJEN.cadastrados().length}) — devolver para a revisão</button></p>` : ''}
      <section class="card flush" id="tbl"></section>
      <div class="parc-h"><h2>${icon('users')} Processos em parceria <small class="muted">${rowsP.length}</small></h2><span class="btn-row"><button class="btn ghost sm" id="pRepP">${icon('edit')} Alterar representação</button><button class="btn ghost sm" id="pParc">${icon('users')} Parceiros</button></span></div>
      ${rowsP.length ? '<section class="card flush" id="tblP"></section>' : `<p class="muted small">${Parceria.lista().length ? 'Nenhum processo desta relação tem advogado parceiro intimado junto com os nossos.' : 'Toque em “Parceiros” e marque os advogados/escritórios parceiros (pela OAB intimada junto com os nossos): os processos deles passam a aparecer aqui.'}</p>`}`;
    $('#djPendJ')?.addEventListener('click', () => DJEN.revisarPendentes());
    $('#djDesfJ')?.addEventListener('click', () => DJEN.gerenciarCadastrados());
    $('#kVal')?.addEventListener('click', () => Judicial.completarValores(procs));
    dataTable($('#tbl'), {
      id: 'proc-' + area, rows, schema: sc, cols: all ? ['numero', '_cli', '_area', 'classe', 'status', '_ult', '_prox'] : ['numero', '_cli', 'classe', 'orgao', 'status', '_ult', '_prox'],
      filters: [{ k: 'status', label: 'Situação', opts: SCHEMAS.processos.fields.find(f => f.k === 'status').opts }],
      tools: `<button class="icon-btn tool-print" id="pRel" title="Imprimir a relação de processos (com os filtros e a busca aplicados)">${icon('printer')}</button><button class="btn ghost sm" id="pRep" title="Marcar processos desta relação como em parceria">${icon('users')} Alterar representação</button>`,
      onOpen: p => location.hash = '#/processo/' + p.id, emptyMsg: 'Nenhum processo cadastrado nesta área.'
    });
    if (rowsP.length) dataTable($('#tblP'), {
      id: 'procP-' + area, rows: rowsP, schema: sc, cols: all ? ['numero', '_cli', '_parc', '_area', 'status', '_ult', '_prox'] : ['numero', '_cli', '_parc', 'classe', 'status', '_ult', '_prox'],
      filters: [{ k: '_parc', label: 'Parceiro', opts: [...new Set(rowsP.map(r => r._parc))].sort() }], onOpen: p => location.hash = '#/processo/' + p.id, emptyMsg: 'Nenhum processo em parceria.'
    });
    $('#pParc').onclick = () => Parceria.gerenciar();
    const nomeRel = all ? 'Todos os processos' : (A?.nome || area);
    $('#pRep')?.addEventListener('click', () => Parceria.alterar(rows.map(r => DB.get('processos', r.id)).filter(Boolean), 'Processos do escritório — ' + nomeRel));
    $('#pRepP').onclick = () => Parceria.alterar(rowsP.map(r => DB.get('processos', r.id)).filter(Boolean), 'Processos em parceria — ' + nomeRel);
    $('#pRel').onclick = () => { const st = TableState['proc-' + area] || {}; Report.processos($('#tbl')._list || rows, { area: all ? null : area, situacao: st.f?.status || '', busca: st.q || '' }); };
    $('#nProc').onclick = () => Judicial.edit(null, all ? 'civil' : area);
    $('#nProcDocs').onclick = () => JudDocs.open();
  },
  edit(p, area) {
    p = p || { area, status: 'Ativo', clienteIds: [] };
    const m = UI.editRecord('processos', p, {
      title: p.id ? 'Editar processo' : 'Novo processo',
      onSaved: saved => {
        if (!saved.tribunal) { const t = tribunalAlias(saved.numero); if (t) { saved.tribunal = t.toUpperCase(); DB.save('processos', saved); } }
        location.hash = '#/processo/' + saved.id; App.render();
      }
    });
    const n = $('#f_numero', m), t = $('#f_tribunal', m);
    n.addEventListener('input', () => {
      const d = onlyDigits(n.value); if (d.length === 20) { n.value = fmtCNJ(d); const a = tribunalAlias(d); if (a && !t.value) t.value = a.toUpperCase(); n.classList.toggle('invalid', !validCNJ(d)); }
    });
  },
  detail(v, id) {
    const p = DB.get('processos', id);
    if (!p) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Processo não encontrado.</p></div>`; return; }
    const A = AREAS[p.area] || { nome: '', icon: 'scale' };
    App.crumbs([{ t: 'Judicial', href: '/judicial/todos' }, { t: A.nome, href: '/judicial/' + p.area }, { t: fmtCNJ(p.numero) }]);
    const movs = DB.where('movimentos', m => m.processoId === id).sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.createdAt).localeCompare(String(a.createdAt)));
    const prazos = DB.where('prazos', x => x.processoId === id).sort((a, b) => String(a.data).localeCompare(String(b.data)));
    const clientes = (p.clienteIds || []).map(c => DB.get('clientes', c)).filter(Boolean);
    const visiveis = movs.filter(m => m.visivelCliente).length;
    v.innerHTML = `
    <div class="proc-h">
      <div>
        <div class="proc-tags">${pill(A.nome)} ${pill(p.status || 'Ativo')} ${p.fase ? `<span class="tag">${esc(p.fase)}</span>` : ''} ${p.transito ? `<span class="pill tj">${icon('scale')} Transitado em julgado em ${esc(fmtDate(p.transito))}</span>` : ''} ${p.segredo ? '<span class="pill critical">Segredo de justiça</span>' : ''} ${p.tribunal ? `<span class="tag">${esc(p.tribunal)}</span>` : ''} ${Parceria.de(p) ? `<span class="pill info">${icon('users')} Em parceria com ${esc(Parceria.rotulo(Parceria.de(p)))}</span>` : ''} <label class="rep-sel">${icon('users')} Representação <select class="input sm" id="pRepSel">${Parceria.opcoes(p.partes, Parceria.valor(p))}</select></label></div>
        <h1 class="mono proc-num">${esc(fmtCNJ(p.numero))} ${validCNJ(p.numero) ? '' : `<span class="pill serious" title="Dígito verificador não confere">verificar número</span>`}</h1>
        <p class="proc-sub">${esc(p.classe || 'Classe não informada')}${p.assunto ? ' · ' + esc(p.assunto) : ''}</p>
        <p class="proc-parts"><b>${esc(clientes.map(c => c.nome).join(', ') || 'Cliente não vinculado')}</b> <span class="muted">(${esc(p.polo || 'polo não informado')})</span> <span class="vs">×</span> ${esc(p.parteContraria || '—')}</p>
      </div>
      <div class="actions wrap">
        <button class="btn ghost" id="pEdit">${icon('edit')} Editar</button>
        <button class="btn ghost" id="pPrev">${icon('eye')} Ver como o cliente</button>
        <button class="btn ghost" id="pDocs">${icon('upload')} Juntar arquivos</button>
        <button class="btn primary" id="pSync">${icon('sync')} Buscar movimentações (DataJud)</button>
      </div>
    </div>
    ${Judicial.partesHtml(p)}
<section class="card dados-card"><header><h2>${icon('file')} Dados do processo</h2></header>
          <dl class="dl cols">
            <dt>Cliente(s)</dt><dd>${clientes.map(c => `<a href="#/clientes?c=${c.id}">${esc(c.nome)}</a>`).join(', ') || '—'}</dd>
            <dt>Órgão julgador</dt><dd>${esc(p.orgao || '—')}</dd><dt>Comarca</dt><dd>${esc(p.comarca || '—')}</dd>
            <dt>Distribuição</dt><dd>${esc(fmtDate(p.distribuicao) || '—')}</dd><dt>Valor da causa</dt><dd>${esc(fmtMoney(p.valorCausa) || '—')}</dd>
            <dt>Fase</dt><dd>${esc(p.fase || '—')}</dd>${p.transito ? `<dt>Trânsito em julgado</dt><dd>${esc(fmtDate(p.transito))} (fase de conhecimento)</dd>` : ''}<dt>Responsável</dt><dd>${esc(p.responsavel || '—')}</dd><dt>Honorários</dt><dd>${esc(p.honorarios || '—')}</dd>
            <dt>E-mail do cliente</dt><dd>${clientes.length ? clientes.map(c => c.email ? esc(c.email) : '<span class="t-warn">não informado</span>').join(', ') : '—'} ${clientes.length ? `<button class="link small" id="pMail">${clientes.some(c => c.email) ? 'alterar' : 'informar'}</button>` : ''}</dd>
            <dt>Aviso ao cliente</dt><dd>${p.notificarCliente ? (clientes.some(c => c.email) ? 'por e-mail a cada movimentação' : '<span class="t-warn">ligado, mas sem e-mail do cliente</span>') : 'desativado'} ${clientes.length ? `<button class="link small" id="pMail2">${p.notificarCliente ? 'configurar' : 'ativar'}</button>` : ''}</dd>
          </dl>
          ${p.obs ? `<div class="note-box"><span class="lbl">Anotações internas</span>${esc(p.obs)}</div>` : ''}
        </section>
    <div class="grid-main">
      <section class="card">
        <header><h2>${icon('history')} Movimentações</h2><div class="hdr-actions"><span class="muted small">${visiveis} de ${movs.length} visíveis ao cliente</span><button class="btn ghost sm" id="mAdd">${icon('plus')} Lançar</button></div></header>
        ${p.ultimaSync ? `<p class="muted small">Última consulta ao DataJud: ${esc(fmtDateTime(p.ultimaSync))}</p>` : ''}
        ${movs.length ? `<ol class="timeline">${movs.map(m => `<li class="${m.visivelCliente ? '' : 'hidden-mov'}"><span class="tl-dot"></span><div class="tl-head"><time>${esc(fmtDate(m.data))}</time>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : m.origem === 'djen' ? '<span class="badge djen">DJEN</span>' : m.origem === 'documento' ? '<span class="badge soft">Documento</span>' : '<span class="badge soft">Escritório</span>'}<span class="sp"></span><button class="icon-btn sm" data-vis="${m.id}" title="${m.visivelCliente ? 'Visível ao cliente — clique para ocultar' : 'Oculto do cliente — clique para mostrar'}">${icon(m.visivelCliente ? 'eye' : 'eyeOff')}</button><button class="icon-btn sm" data-mov="${m.id}" title="Editar">${icon('edit')}</button></div><b class="tl-t">${esc(m.titulo)}</b>${Judicial.textoMov(m)}${m.link ? `<a class="link small" href="${esc(m.link)}" target="_blank" rel="noopener">${icon('link')} abrir publicação</a>` : ''}${m.explicacao ? `<p class="explain">${icon('user')} <span>${esc(m.explicacao)}</span></p>` : ''}</li>`).join('')}</ol>` : `<div class="empty sm">${icon('history')}<p>Nenhuma movimentação. Lance manualmente ou busque no DataJud.</p></div>`}
      </section>
      <div class="col">

        <section class="card"><header><h2>${icon('file')} Arquivos</h2>${p.pastaLink ? `<a class="link small" href="${esc(p.pastaLink)}" target="_blank" rel="noopener">${icon('link')} Pasta no Drive</a>` : ''}</header>
          ${(p.arquivos || []).length ? `<ul class="plain files">${p.arquivos.map(a => `<li>${icon('file')} ${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.nome)}</a>` : esc(a.nome)}${a.tipo ? ` <span class="muted small">· ${esc(a.tipo)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">Nenhum arquivo. Use “Juntar arquivos” para guardar petições, decisões e documentos na pasta do processo no Drive do escritório.</p>'}</section>
        <section class="card"><header><h2>${icon('calendar')} Agenda</h2><button class="btn ghost sm" id="aAdd">${icon('plus')} Novo</button></header>
          ${prazos.length ? `<ul class="agenda-list compact">${prazos.map(Views.agendaItem).join('')}</ul>` : '<p class="muted small">Nenhum prazo ou audiência.</p>'}</section>
      </div>
    </div>`;
    $('#pEdit').onclick = () => Judicial.edit(p);
    $('#pRepSel').onchange = async ev => { await Parceria.definir(p, ev.target.value); UI.toast('Representação alterada.', 'ok'); App.render(true); };
    ['#pMail', '#pMail2'].forEach(k => $(k)?.addEventListener('click', () => Judicial.emailCliente(p)));
    $$('[data-ptcli]', v).forEach(b => b.onclick = () => Judicial.tornarCliente(p, +b.dataset.ptcli));
    $('#pPrev').onclick = () => { if (!clientes.length) return UI.toast('Vincule um cliente ao processo.', 'warn'); Portal.preview(clientes[0].id, p.id); };
    $('#pSync').onclick = () => Judicial.datajud(p);
    $('#pDocs').onclick = () => JudDocs.open(p);
    $('#mAdd').onclick = () => Judicial.editMov(null, p);
    $('#aAdd').onclick = () => Judicial.editPrazo(null, p.id);
    $$('[data-mov]', v).forEach(b => b.onclick = () => Judicial.editMov(DB.get('movimentos', b.dataset.mov), p));
    $$('[data-vis]', v).forEach(b => b.onclick = async () => { const m = DB.get('movimentos', b.dataset.vis); m.visivelCliente = !m.visivelCliente; await DB.save('movimentos', m); App.render(true); });
    $$('[data-done]', v).forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); Views.toggleDone(b.dataset.done); });
  },
  editMov(m, p) { UI.editRecord('movimentos', m || { data: todayISO(), visivelCliente: true, origem: 'manual' }, { extraBase: { processoId: p.id }, title: m ? 'Editar movimentação' : 'Lançar movimentação' }); },
  editPrazo(x, processoId) {
    const sc = processoId ? SCHEMAS.prazos : { ...SCHEMAS.prazos, fields: [F('processoId', 'Processo', 'select', { opts: DB.all('processos').map(p => p.id), labels: DB.all('processos').map(p => fmtCNJ(p.numero) + ' · ' + clienteNomes(p)) }), ...SCHEMAS.prazos.fields] };
    const old = SCHEMAS.prazos; SCHEMAS.prazos = sc;
    UI.editRecord('prazos', x || { tipo: 'Prazo', data: todayISO(), visivelCliente: false }, { extraBase: processoId ? { processoId } : {} });
    SCHEMAS.prazos = old; // o formulário já guardou o esquema usado
  },
  async datajud(p) {
    if (!validCNJ(p.numero)) return UI.toast('Confira o número do processo: o dígito verificador não confere.', 'bad');
    if (!Session.remote) return UI.toast('A consulta ao DataJud é feita pelo servidor. Conecte o Apps Script (veja CONFIGURAR-LOGIN.md).', 'warn', 6000);
    const b = $('#pSync'); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Consultando…';
    try {
      const r = await api('datajud', { numero: onlyDigits(p.numero) });
      const novos = Judicial.mergeDatajud(p, r);
      await DB.save('processos', p);
      if (novos.length) await DB.save('movimentos', novos);
      UI.toast(novos.length ? `${novos.length} movimentação(ões) nova(s) importada(s).` : (r.encontrado ? 'Nenhuma movimentação nova.' : 'Processo ainda não disponível no DataJud (a base do CNJ pode levar alguns dias para atualizar).'), novos.length ? 'ok' : 'warn', 6000);
      App.render(true);
    } catch (e) { UI.toast(e.message, 'bad'); b.disabled = false; b.innerHTML = icon('sync') + ' Buscar movimentações (DataJud)'; }
  },
  /** texto da movimentação: nas decisões publicadas, só a parte dispositiva (a íntegra fica em "ler inteiro teor") */
  recolher: `<button type="button" class="link small tl-rec" onclick="const d=this.closest('details');d.open=false;d.scrollIntoView({block:'nearest',behavior:'smooth'})">▲ recolher</button>`,
  /** completar o valor da causa dos processos que não têm (o DJEN e o DataJud não informam esse dado) */
  completarValores(procs) {
    const l = procs.filter(p => !(num(p.valorCausa) > 0));
    const m = UI.modal({ title: 'Valor da causa', sub: `${l.length} processo(s) sem valor informado`, wide: true,
      body: `<p class="muted small">O DJEN e o DataJud não informam o valor da causa. Digite os valores que souber (os vazios ficam como estão) — ou use “Juntar arquivos” com a petição inicial no processo, que a IA preenche sozinha.</p>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Processo</th><th>Cliente</th><th>Classe</th><th style="width:170px">Valor da causa (R$)</th></tr></thead><tbody>
        ${l.map((p, i) => `<tr><td class="mono">${esc(fmtCNJ(p.numero))}</td><td>${esc(clienteNomes(p) || '—')}</td><td>${esc(p.classe || '')}</td><td><input class="input sm" data-vc="${i}" inputmode="decimal" placeholder="0,00"></td></tr>`).join('')}</tbody></table></div>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="vcOk">${icon('check')} Salvar valores</button>` });
    $('#vcOk', m).onclick = async () => {
      const mud = $$('[data-vc]', m).map(x => [l[+x.dataset.vc], num(x.value)]).filter(([, v]) => v > 0).map(([p, v]) => ({ ...p, valorCausa: v }));
      if (mud.length) await DB.save('processos', mud);
      UI.closeModal(); UI.toast(`${mud.length} valor(es) salvo(s).`); App.render(true);
    };
  },
  textoMov(m) {
    const t = m.descricao || ''; if (!t) return '';
    if (DJEN.ehDecisao(m.titulo)) {
      const d = DJEN.dispositivo(t);
      if (d.resumido) return `<p class="dispositivo"><span class="disp-tag">Dispositivo</span>${esc(d.texto)}</p><details class="tl-more full"><summary><span class="link small">ler inteiro teor</span></summary><p class="pre">${esc(t)}</p>${Judicial.recolher}</details>`;
    }
    return t.length > 420 ? `<details class="tl-more"><summary><span class="tl-prev">${esc(t.slice(0, 300))}… </span><span class="link small">ler tudo</span></summary><p class="pre">${esc(t)}</p>${Judicial.recolher}</details>` : `<p>${esc(t)}</p>`;
  },
  /** e-mail do(s) cliente(s) e aviso automático de andamento */
  emailCliente(p) {
    const cls = (p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean);
    const m = UI.modal({ title: 'E-mail do cliente', sub: fmtCNJ(p.numero),
      body: `<p class="muted small">É por este e-mail que o cliente recebe o aviso de cada nova movimentação visível para ele e, se você quiser, o acesso ao portal para acompanhar o processo.</p>
        ${cls.map((c, i) => `<div class="fld"><label>${esc(c.nome)}</label><input class="input" type="email" data-em="${i}" value="${esc(c.email || '')}" placeholder="nome@exemplo.com"></div>`).join('')}
        <label class="switch" style="margin-top:10px"><input type="checkbox" id="emAviso" ${p.notificarCliente || !cls.some(c => c.email) ? 'checked' : ''}><span></span>Avisar o cliente por e-mail a cada nova movimentação deste processo</label>
        <label class="switch"><input type="checkbox" id="emPortal"><span></span>Dar acesso ao portal do cliente (ele recebe um convite por e-mail)</label>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="emOk">${icon('check')} Salvar</button>` });
    $('#emOk', m).onclick = async () => {
      const mails = $$('[data-em]', m).map(x => x.value.trim().toLowerCase());
      const ruim = mails.find(e => e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)); if (ruim) return UI.toast('E-mail inválido: ' + ruim, 'bad');
      const aviso = $('#emAviso', m).checked, portal = $('#emPortal', m).checked;
      const mud = cls.map((c, i) => ({ ...c, email: mails[i] })).filter((c, i) => c.email !== (cls[i].email || ''));
      if (mud.length) await DB.save('clientes', mud);
      if (!!p.notificarCliente !== aviso) await DB.save('processos', { ...p, notificarCliente: aviso });
      UI.closeModal();
      if (portal) for (const c of cls.map((c, i) => ({ ...c, email: mails[i] })).filter(c => c.email)) await Views.grantAccess(c);
      else UI.toast('Salvo.' + (aviso && !mails.some(Boolean) ? ' Atenção: sem e-mail, o aviso não tem para onde ir.' : ''), aviso && !mails.some(Boolean) ? 'warn' : 'ok');
      App.render(true);
    };
  },
  partesHtml(p) {
    // quem é cliente vem dos clientes vinculados ao processo (o que for escolhido em Editar vale aqui também)
    const nomesCli = new Set((p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean).map(c => norm(c.nome)));
    const ps = (p.partes || []).map((x, i) => ({ ...x, i, papel: x.papel || DJEN.papelDe(x.nome), nome: DJEN.limparNome(x.nome) })).filter(x => !DJEN.ehAdvDoEscritorio(x.nome)); if (!ps.length) return '';
    ps.forEach(x => x.cliente = nomesCli.size ? nomesCli.has(norm(x.nome)) : false);
    const grupo = (pl, tit) => { const l = ps.filter(x => (x.polo || '') === pl); return l.length ? `<div class="pt-grupo"><h4>${tit}</h4>${l.map(x => `<div class="pt-item"><div class="pt-linha"><div><b>${esc(x.nome)}</b>${x.cliente ? ' <span class="pill good">cliente</span>' : ''}${x.papel ? ` <small class="muted">${esc(x.papel)}</small>` : ''}${x.doc ? ` <small class="muted mono">${esc(fmtDoc(x.doc))}</small>` : ''}</div>${x.cliente ? '' : `<button class="btn ghost xs" data-ptcli="${x.i}" title="Tornar esta parte o cliente do escritório neste processo">${icon('user')} é o cliente</button>`}</div>${(x.advogados || []).length ? `<small class="pt-adv">${icon('user')} ${x.advogados.map(a => esc(a.nome) + (a.oab ? ` <span class="muted">(OAB ${esc(a.oab)}${a.uf ? '/' + esc(a.uf) : ''})</span>` : '') + (a.escritorio ? ' <span class="badge soft">escritório</span>' : '')).join(' · ')}</small>` : ''}</div>`).join('')}</div>` : ''; };
    return `<section class="card partes-card"><header><h2>${icon('users')} Partes</h2></header><div class="pt-cols">${grupo('Ativo', 'Polo ativo')}${grupo('Passivo', 'Polo passivo')}${grupo('Terceiro', 'Terceiros interessados')}${grupo('', 'Polo não informado')}</div></section>`;
  },
  /** troca o cliente do processo pela parte escolhida: vincula (ou cria) o cliente, acerta o polo e a parte contrária */
  async tornarCliente(p, idx) {
    const pt = (p.partes || [])[idx]; if (!pt) return;
    const nome = DJEN.limparNome(pt.nome);
    const antigos = (p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean);
    const msg = antigos.length ? `Trocar o cliente deste processo de <b>${esc(antigos.map(c => c.nome).join(', '))}</b> para <b>${esc(nome)}</b>?` : `Definir <b>${esc(nome)}</b> como cliente deste processo?`;
    if (!await UI.confirm(msg, 'Confirmar', false)) return;
    let c = DB.all('clientes').find(x => norm(x.nome) === norm(nome));
    if (!c) { c = { id: uid('cl'), tipo: DJEN.PJ.test(nome) ? 'Pessoa jurídica' : 'Pessoa física', nome, obs: `Cadastrado pelo processo ${fmtCNJ(p.numero)}. Completar CPF/CNPJ e contato.` }; await DB.save('clientes', c); }
    p.partes = p.partes.map((x, i) => ({ ...x, cliente: i === idx }));
    p.clienteIds = [c.id];
    if (pt.polo === 'Ativo' || pt.polo === 'Passivo') {
      p.polo = DJEN.poloCliente(pt.polo, p.area);
      p.parteContraria = p.partes.filter(x => x.polo && x.polo !== pt.polo && x.polo !== 'Terceiro' && !DJEN.ehAdvDoEscritorio(DJEN.limparNome(x.nome))).map(x => DJEN.limparNome(x.nome)).join('; ');
    }
    await DB.save('processos', p);
    // o cliente trocado, se foi criado automaticamente e não tem outro processo nem acesso ao portal, sai do cadastro
    const sobra = antigos.filter(a => a.id !== c.id && /^Cadastrado (automaticamente )?pelo processo/.test(a.obs || '') && !a.email && !DB.all('processos').some(x => (x.clienteIds || []).includes(a.id)));
    if (sobra.length) await DB.remove('clientes', sobra.map(a => a.id));
    UI.toast(`Cliente do processo: ${nome}.${sobra.length ? ` O cadastro de ${sobra.map(a => a.nome).join(', ')}, criado por engano, foi removido.` : ''}`, 'ok', 7000);
    App.render(true);
  },
  mergeDatajud(p, r) {
    p.ultimaSync = new Date().toISOString();
    if (!r.encontrado) return [];
    ['classe', 'orgao', 'assunto'].forEach(k => { if (!p[k] && r[k]) p[k] = r[k]; });
    if (!p.distribuicao && r.ajuizamento) p.distribuicao = parseDate(r.ajuizamento);
    if (!p.tribunal && r.tribunal) p.tribunal = r.tribunal;
    const tj = !p.transito && (r.movimentos || []).filter(m => /tr[âa]nsit[oa] em julgado/i.test(m.titulo + ' ' + (m.descricao || ''))).sort((a, b) => a.data.localeCompare(b.data))[0];
    if (tj) { p.transito = tj.data; setTimeout(() => UI.toast(`A fase de conhecimento transitou em julgado em ${fmtDate(tj.data)}.`, 'ok', 7000), 400); }
    const vis = escritorio().djVisivel !== false;
    const have = new Set(DB.where('movimentos', m => m.processoId === p.id).map(m => m.chave || (m.data + '|' + norm(m.titulo))));
    const novos = [];
    (r.movimentos || []).forEach(m => {
      const k = m.chave; if (have.has(k)) return; have.add(k);
      novos.push({ id: uid('mo'), processoId: p.id, data: m.data, titulo: m.titulo, descricao: m.descricao || '', origem: 'datajud', chave: k, visivelCliente: vis });
    });
    return novos;
  }
};

/* =====================================================================
   PARCERIAS — processos em que um advogado parceiro é intimado junto com os nossos
   ===================================================================== */
const Parceria = {
  lista: () => escritorio().parceiros || [],
  uf: u => String(u || '').toUpperCase(),
  igual(x, a) { return (onlyDigits(x.oab) && onlyDigits(x.oab) === onlyDigits(a.oab) && (!x.uf || !a.uf || Parceria.uf(x.uf) === Parceria.uf(a.uf))) || (!onlyDigits(a.oab) && x.nome && a.nome && norm(x.nome) === norm(a.nome)); },
  /** advogados que representam a mesma parte que os nossos (não os nossos) */
  coAdvs(p) { return (p.partes || []).flatMap(pt => (pt.advogados || []).some(a => DJEN.meuAdv(a)) ? (pt.advogados || []).filter(a => !DJEN.meuAdv(a)) : []); },
  /** parceiro do processo (ou null); ignorarNao = mesmo se marcado "não é parceria" */
  de(p, ignorarNao) {
    if (!p || (!ignorarNao && p.parceria === 'nao')) return null;
    const L = Parceria.lista(); if (!L.length) return null;
    if (p.parceiroId) { const x = L.find(x => x.id === p.parceiroId); if (x) return x; }
    for (const a of Parceria.coAdvs(p)) { const x = L.find(x => Parceria.igual(x, a)); if (x) return x; }
    return null;
  },
  /** opções de representação: próprio, parceiros cadastrados e advogados de fora na mesma parte (viram parceiros se escolhidos) */
  opcoes(partes, atual) {
    const co = Parceria.coAdvs({ partes }), L = Parceria.lista();
    const novos = co.filter((a, k) => !L.some(x => Parceria.igual(x, a)) && co.findIndex(b => Parceria.igual(b, a)) === k);
    const opt = (v, t) => `<option value="${esc(v)}" ${atual === v ? 'selected' : ''}>${esc(t)}</option>`;
    return opt('proprio', 'Próprio (só o escritório)') + L.map(x => opt('p:' + x.id, 'Em parceria com ' + Parceria.rotulo(x))).join('')
      + novos.map(a => opt('c:' + JSON.stringify({ nome: a.nome || '', oab: onlyDigits(a.oab), uf: Parceria.uf(a.uf) }), `Em parceria com ${DJEN.titulo ? DJEN.titulo(a.nome || '') : a.nome} (OAB ${onlyDigits(a.oab) || '—'}/${Parceria.uf(a.uf) || '—'})`)).join('');
  },
  valor: p => { const x = Parceria.de(p); return x ? 'p:' + x.id : 'proprio'; },
  /** grava a representação escolhida num processo já cadastrado */
  async definir(p, v) {
    const q = { ...p }; await Parceria.aplicar(q, v);
    if (v === 'proprio') q.parceiroId = ''; else q.parceria = '';
    await DB.save('processos', q);
  },
  /** alterar a representação de vários processos de uma vez */
  alterar(procs, titulo) {
    const L = procs.slice().sort((a, b) => String(clienteNomes(a) || '').localeCompare(String(clienteNomes(b) || '')));
    if (!L.length) return UI.toast('Nenhum processo nesta relação.');
    const m = UI.modal({ title: 'Alterar representação', sub: titulo + ' · escolha “Próprio” ou o parceiro e salve', wide: true,
      body: `<div class="table-wrap tw-fixa"><table class="dt"><thead><tr><th>Processo</th><th>Cliente(s)</th><th>Classe</th><th>Representação</th></tr></thead><tbody>
        ${L.map((p, i) => `<tr><td class="mono">${esc(fmtCNJ(p.numero))}</td><td>${esc(clienteNomes(p) || '—')}</td><td><small>${esc(p.classe || '')}</small></td><td><select class="input sm" data-rep="${i}" data-ini="${esc(Parceria.valor(p))}">${Parceria.opcoes(p.partes, Parceria.valor(p))}</select></td></tr>`).join('')}
        </tbody></table></div>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="repOk">${icon('check')} Salvar alterações</button>` });
    $('#repOk', m).onclick = async () => {
      const mud = $$('[data-rep]', m).filter(s => s.value !== s.dataset.ini);
      for (const s of mud) await Parceria.definir(DB.get('processos', L[+s.dataset.rep].id), s.value);
      UI.closeModal(); UI.toast(mud.length ? `Representação alterada em ${mud.length} processo(s).` : 'Nada foi alterado.', 'ok'); App.render(true);
    };
  },
  /** seletor de representação na revisão do DJEN (q = processo pendente) */
  select(q, i) {
    const { partes } = DJEN.analisar(DJEN.intsDe(q)), det = Parceria.de({ partes }), co = Parceria.coAdvs({ partes });
    return `<select class="input sm" data-djrep="${i}"><option value="" ${det ? '' : 'selected'}>Selecionar representação…</option>${Parceria.opcoes(partes, det ? 'p:' + det.id : '')}</select>${det ? '<small class="muted">parceiro já cadastrado</small>' : co.length ? `<small class="muted">${co.length} advogado(s) de fora na mesma parte</small>` : ''}`;
  },
  /** aplica a escolha da revisão ao processo novo */
  async aplicar(proc, v) {
    if (!v) return;
    if (v === 'proprio') { proc.parceria = 'nao'; return; }
    if (v.startsWith('p:')) { proc.parceiroId = v.slice(2); return; }
    if (v.startsWith('c:')) {
      const a = JSON.parse(v.slice(2)), L = Parceria.lista();
      let x = L.find(x => Parceria.igual(x, a));
      if (!x) { x = { id: uid('pa'), nome: DJEN.titulo ? DJEN.titulo(a.nome) : a.nome, oab: a.oab, uf: a.uf, escritorio: '' }; await DB.save('config', { ...escritorio(), id: 'escritorio', parceiros: [...L, x] }); }
      proc.parceiroId = x.id;
    }
  },
  rotulo: x => x.escritorio || x.nome || `OAB ${x.oab}/${Parceria.uf(x.uf)}`,
  candidatos() {
    const m = {};
    DB.all('processos').forEach(p => Parceria.coAdvs(p).forEach(a => {
      const k = onlyDigits(a.oab) ? onlyDigits(a.oab) + '/' + Parceria.uf(a.uf) : 'n:' + norm(a.nome);
      const c = m[k] = m[k] || { nome: a.nome || '', oab: onlyDigits(a.oab), uf: Parceria.uf(a.uf), procs: new Set() };
      c.procs.add(p.id); if (!c.nome && a.nome) c.nome = a.nome;
    }));
    return Object.values(m).filter(c => !Parceria.lista().some(x => Parceria.igual(x, c))).sort((a, b) => b.procs.size - a.procs.size || a.nome.localeCompare(b.nome));
  },
  async salvar(lista) { await DB.save('config', { ...escritorio(), id: 'escritorio', parceiros: lista }); App.render(true); Parceria.gerenciar(); },
  gerenciar() {
    const L = Parceria.lista(), cand = Parceria.candidatos();
    const n = x => DB.all('processos').filter(p => Parceria.de(p) === x || (Parceria.de(p) && Parceria.igual(Parceria.de(p), x))).length;
    const ufs = UF_TR.slice(1).map(u => u === 'dft' ? 'DF' : u.toUpperCase()).sort();
    const m = UI.modal({ title: 'Advogados e escritórios parceiros', wide: true,
      sub: 'Processo em que um parceiro é intimado junto com os nossos advogados (na mesma parte) vai para a relação “Processos em parceria”.',
      body: `<h4 class="sec">Parceiros (${L.length})</h4>
        ${L.length ? `<div class="parc-l">${L.map((x, i) => `<div class="parc-i"><div><b>${esc(x.nome || 'Advogado(a)')}</b><small class="muted">OAB ${esc(x.oab || '—')}/${esc(Parceria.uf(x.uf) || '—')} · ${n(x)} processo(s)</small></div><input class="input sm" data-pe="${i}" placeholder="Nome do escritório (opcional)" value="${esc(x.escritorio || '')}"><button class="icon-btn" data-pr="${i}" title="Deixar de ser parceiro">${icon('x')}</button></div>`).join('')}</div>` : '<p class="muted small">Nenhum parceiro marcado ainda.</p>'}
        <h4 class="sec">Intimados junto com os nossos advogados</h4>
        ${cand.length ? `<div class="parc-l">${cand.map((c, i) => `<div class="parc-i"><div><b>${esc(c.nome || 'Sem nome')}</b><small class="muted">OAB ${esc(c.oab || '—')}/${esc(c.uf || '—')} · ${c.procs.size} processo(s) com vocês</small></div><span></span><button class="btn ghost sm" data-pc="${i}">${icon('check')} É parceiro</button></div>`).join('')}</div>` : '<p class="muted small">Nenhum outro advogado aparece na mesma parte que os nossos nas intimações já recebidas.</p>'}
        <h4 class="sec">Incluir pela OAB</h4>
        <form class="adv-form" id="parcF"><input name="oab" placeholder="Nº da OAB" inputmode="numeric"><select name="uf">${ufs.map(u => `<option ${u === 'PB' ? 'selected' : ''}>${u}</option>`).join('')}</select><input name="esc" placeholder="Escritório (opcional)"><button class="btn primary sm">${icon('plus')} Incluir</button></form>`
    });
    $$('[data-pc]', m).forEach(b => b.onclick = () => { const c = cand[+b.dataset.pc]; Parceria.salvar([...L, { id: uid('pa'), nome: DJEN.titulo ? DJEN.titulo(c.nome) : c.nome, oab: c.oab, uf: c.uf, escritorio: '' }]); });
    $$('[data-pr]', m).forEach(b => b.onclick = () => Parceria.salvar(L.filter((_, i) => i !== +b.dataset.pr)));
    $$('[data-pe]', m).forEach(inp => inp.onchange = () => Parceria.salvar(L.map((x, i) => i === +inp.dataset.pe ? { ...x, escritorio: inp.value.trim() } : x)));
    $('#parcF', m).onsubmit = ev => {
      ev.preventDefault(); const f = ev.target, oab = onlyDigits(f.oab.value);
      if (!oab) return UI.toast('Informe o número da OAB.', 'bad');
      if (L.some(x => Parceria.igual(x, { oab, uf: f.uf.value }))) return UI.toast('Essa OAB já é parceira.', 'warn');
      const c = Parceria.candidatos().find(c => c.oab === oab && c.uf === f.uf.value);
      Parceria.salvar([...L, { id: uid('pa'), nome: c ? c.nome : '', oab, uf: f.uf.value, escritorio: f.esc.value.trim() }]);
    };
  }
};
