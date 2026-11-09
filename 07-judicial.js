/* =====================================================================
   JUDICIAL — processos por área, movimentações, agenda, DataJud
   ===================================================================== */
const Judicial = {
  list(v, area) {
    const all = area === 'todos';
    const A = AREAS[area];
    App.crumbs([{ t: 'Judicial', href: '/judicial/todos' }, { t: all ? 'Todos os processos' : A?.nome || area }]);
    const procs = DB.where('processos', p => all || p.area === area);
    const lastMov = id => DB.where('movimentos', m => m.processoId === id).sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];
    const rows = procs.map(p => { const m = lastMov(p.id); return { ...p, _cli: clienteNomes(p), _area: AREAS[p.area]?.nome, _ult: m?.data || null, _ultT: m?.titulo || '', _prox: DB.where('prazos', x => x.processoId === p.id && !x.concluido && isISO(x.data) && daysUntil(x.data) >= 0).sort((a, b) => a.data.localeCompare(b.data))[0]?.data || null }; });
    const sc = { fields: [F('numero', 'Número', 'cnj'), F('_cli', 'Cliente(s)'), F('_area', 'Área'), F('classe', 'Classe'), F('orgao', 'Órgão julgador'), F('status', 'Situação', 'select', { opts: [] }), F('_ult', 'Última movimentação', 'date'), F('_prox', 'Próximo compromisso', 'date'), F('parteContraria', 'Parte contrária'), F('assunto', 'Assunto')] };
    const ativos = procs.filter(p => p.status !== 'Encerrado' && p.status !== 'Arquivado provisoriamente');
    const valor = procs.reduce((s, p) => s + (num(p.valorCausa) || 0), 0);
    const semMov30 = ativos.filter(p => { const m = lastMov(p.id); return !m || daysUntil(m.data) < -30; }).length;
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Judicial</span><h1>${icon(A?.icon || 'layers', 'h-ic')} ${all ? 'Todos os processos' : 'Direito ' + (A.nome === 'Cível' ? 'Civil' : A.nome)}</h1><p class="muted">Processos próprios do escritório, com movimentações e acesso do cliente pelo portal.</p></div>
      <div class="actions"><button class="btn primary" id="nProc">${icon('plus')} Novo processo</button></div></div>
      <div class="kpis sm">${kpi('Em andamento', ativos.length)}${kpi('Total cadastrados', procs.length)}${kpi('Valor das causas', fmtMoneyShort(valor))}${kpi('Sem movimentação há 30+ dias', semMov30, 'merecem consulta', semMov30 ? 'warn' : '')}</div>
      <section class="card flush" id="tbl"></section>`;
    dataTable($('#tbl'), {
      id: 'proc-' + area, rows, schema: sc, cols: all ? ['numero', '_cli', '_area', 'classe', 'status', '_ult', '_prox'] : ['numero', '_cli', 'classe', 'orgao', 'status', '_ult', '_prox'],
      filters: [{ k: 'status', label: 'Situação', opts: SCHEMAS.processos.fields.find(f => f.k === 'status').opts }],
      onOpen: p => location.hash = '#/processo/' + p.id, emptyMsg: 'Nenhum processo cadastrado nesta área.'
    });
    $('#nProc').onclick = () => Judicial.edit(null, all ? 'civil' : area);
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
        <div class="proc-tags">${pill(A.nome)} ${pill(p.status || 'Ativo')} ${p.segredo ? '<span class="pill critical">Segredo de justiça</span>' : ''} ${p.tribunal ? `<span class="tag">${esc(p.tribunal)}</span>` : ''}</div>
        <h1 class="mono proc-num">${esc(fmtCNJ(p.numero))} ${validCNJ(p.numero) ? '' : `<span class="pill serious" title="Dígito verificador não confere">verificar número</span>`}</h1>
        <p class="proc-sub">${esc(p.classe || 'Classe não informada')}${p.assunto ? ' · ' + esc(p.assunto) : ''}</p>
        <p class="proc-parts"><b>${esc(clientes.map(c => c.nome).join(', ') || 'Cliente não vinculado')}</b> <span class="muted">(${esc(p.polo || 'polo não informado')})</span> <span class="vs">×</span> ${esc(p.parteContraria || '—')}</p>
      </div>
      <div class="actions wrap">
        <button class="btn ghost" id="pEdit">${icon('edit')} Editar</button>
        <button class="btn ghost" id="pPrev">${icon('eye')} Ver como o cliente</button>
        <button class="btn primary" id="pSync">${icon('sync')} Buscar movimentações (DataJud)</button>
      </div>
    </div>
    <div class="grid-main">
      <section class="card">
        <header><h2>${icon('history')} Movimentações</h2><div class="hdr-actions"><span class="muted small">${visiveis} de ${movs.length} visíveis ao cliente</span><button class="btn ghost sm" id="mAdd">${icon('plus')} Lançar</button></div></header>
        ${p.ultimaSync ? `<p class="muted small">Última consulta ao DataJud: ${esc(fmtDateTime(p.ultimaSync))}</p>` : ''}
        ${movs.length ? `<ol class="timeline">${movs.map(m => `<li class="${m.visivelCliente ? '' : 'hidden-mov'}"><span class="tl-dot"></span><div class="tl-head"><time>${esc(fmtDate(m.data))}</time>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : '<span class="badge soft">Escritório</span>'}<span class="sp"></span><button class="icon-btn sm" data-vis="${m.id}" title="${m.visivelCliente ? 'Visível ao cliente — clique para ocultar' : 'Oculto do cliente — clique para mostrar'}">${icon(m.visivelCliente ? 'eye' : 'eyeOff')}</button><button class="icon-btn sm" data-mov="${m.id}" title="Editar">${icon('edit')}</button></div><b class="tl-t">${esc(m.titulo)}</b>${m.descricao ? `<p>${esc(m.descricao)}</p>` : ''}${m.explicacao ? `<p class="explain">${icon('user')} <span>${esc(m.explicacao)}</span></p>` : ''}</li>`).join('')}</ol>` : `<div class="empty sm">${icon('history')}<p>Nenhuma movimentação. Lance manualmente ou busque no DataJud.</p></div>`}
      </section>
      <div class="col">
        <section class="card"><header><h2>${icon('file')} Dados do processo</h2></header>
          <dl class="dl">
            <dt>Cliente(s)</dt><dd>${clientes.map(c => `<a href="#/clientes?c=${c.id}">${esc(c.nome)}</a>`).join(', ') || '—'}</dd>
            <dt>Órgão julgador</dt><dd>${esc(p.orgao || '—')}</dd><dt>Comarca</dt><dd>${esc(p.comarca || '—')}</dd>
            <dt>Distribuição</dt><dd>${esc(fmtDate(p.distribuicao) || '—')}</dd><dt>Valor da causa</dt><dd>${esc(fmtMoney(p.valorCausa) || '—')}</dd>
            <dt>Fase</dt><dd>${esc(p.fase || '—')}</dd><dt>Responsável</dt><dd>${esc(p.responsavel || '—')}</dd><dt>Honorários</dt><dd>${esc(p.honorarios || '—')}</dd>
            <dt>Aviso ao cliente</dt><dd>${p.notificarCliente ? 'por e-mail a cada movimentação' : 'desativado'}</dd>
          </dl>
          ${p.obs ? `<div class="note-box"><span class="lbl">Anotações internas</span>${esc(p.obs)}</div>` : ''}
        </section>
        <section class="card"><header><h2>${icon('calendar')} Agenda</h2><button class="btn ghost sm" id="aAdd">${icon('plus')} Novo</button></header>
          ${prazos.length ? `<ul class="agenda-list compact">${prazos.map(Views.agendaItem).join('')}</ul>` : '<p class="muted small">Nenhum prazo ou audiência.</p>'}</section>
      </div>
    </div>`;
    $('#pEdit').onclick = () => Judicial.edit(p);
    $('#pPrev').onclick = () => { if (!clientes.length) return UI.toast('Vincule um cliente ao processo.', 'warn'); Portal.preview(clientes[0].id, p.id); };
    $('#pSync').onclick = () => Judicial.datajud(p);
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
  mergeDatajud(p, r) {
    p.ultimaSync = new Date().toISOString();
    if (!r.encontrado) return [];
    ['classe', 'orgao', 'assunto'].forEach(k => { if (!p[k] && r[k]) p[k] = r[k]; });
    if (!p.distribuicao && r.ajuizamento) p.distribuicao = parseDate(r.ajuizamento);
    if (!p.tribunal && r.tribunal) p.tribunal = r.tribunal;
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
