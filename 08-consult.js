/* =====================================================================
   CONSULTORIA JURÍDICA — empresas, auditoria de contratos, painel,
   importação/exportação Excel
   ===================================================================== */
const TABS = [
  ['painel', 'Painel', 'chart'], ['contratos', 'Contratos', 'file'], ['obrigacoes', 'Obrigações', 'check'], ['maoDeObra', 'Mão de obra', 'users'],
  ['materiais', 'Materiais', 'layers'], ['financeiro', 'Financeiro', 'briefcase'], ['medicoes', 'Medições', 'list'], ['indicadores', 'Indicadores', 'chart'],
  ['achados', 'Achados e plano de ação', 'alert'], ['supervenientes', 'Custos supervenientes', 'briefcase'], ['documentos', 'Documentos', 'file'], ['aditivos', 'Aditivos', 'edit'], ['remessas', 'Remessas mensais', 'upload'], ['portal', 'Portal da empresa', 'key'], ['relatorios', 'Relatórios', 'printer']
];
const empRecs = (c, eid) => DB.where(c, r => r.empresaId === eid);
const tomadorBase = c => String(c.tomador || '').split(/ [–-] /)[0].replace(/\(ver unidade\)/i, '').trim() || 'Não informado';

const Consult = {
  list(v) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Empresas' }]);
    const emps = DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>Empresas</h1><p class="muted">Empresas atendidas na gestão e auditoria de contratos.</p></div><div class="actions"><button class="btn ghost" id="nEmp">${icon('plus')} Nova empresa</button><button class="btn primary" id="nEmpDocs">${icon('upload')} Cadastrar pelos documentos</button></div></div>
    ${emps.length ? `<div class="emp-grid">${emps.map(e => {
      const cs = empRecs('contratos', e.id), at = cs.filter(contratoAtivo), ach = empRecs('achados', e.id).filter(achadoAberto);
      const cart = at.reduce((s, c) => s + (num(c.valorMensal) || 0), 0);
      return `<a class="emp-card" href="#/empresa/${e.id}"><div class="emp-ini">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div class="emp-body"><b>${esc(e.fantasia || e.razao)}</b><small>${esc(e.razao)}${e.cnpj ? ' · ' + esc(fmtDoc(e.cnpj)) : ''}</small>
        <div class="emp-stats"><span><b>${cs.length}</b> contratos</span><span><b>${at.length}</b> vigentes</span><span><b>${ach.length}</b> achados abertos</span>${cart ? `<span><b>${fmtMoneyShort(cart)}</b>/mês</span>` : ''}</div></div>${icon('chevR')}</a>`;
    }).join('')}</div>` : `<div class="empty big">${icon('building')}<h3>Nenhuma empresa cadastrada</h3><p>Digite o CNPJ (os dados vêm da Receita Federal) ou simplesmente arraste a pasta com os contratos e a planilha — o app identifica a empresa e cadastra tudo.</p><div class="btn-row center"><button class="btn ghost" id="nEmp2">${icon('plus')} Cadastrar pelo CNPJ</button><button class="btn primary" id="nEmpDocs2">${icon('upload')} Cadastrar pelos documentos</button></div></div>`}`;
    $('#nEmp').onclick = () => Consult.editEmpresa(null);
    $('#nEmp2') && ($('#nEmp2').onclick = () => Consult.editEmpresa(null));
    $('#nEmpDocs').onclick = () => Docs.open(null);
    $('#nEmpDocs2') && ($('#nEmpDocs2').onclick = () => Docs.open(null));
  },
  editEmpresa(e) { UI.editRecord('empresas', e, { onSaved: async s => { if (s.emailPortal) await Consult.clientePortal(s); location.hash = '#/empresa/' + s.id; App.render(); } }); },
  emailsPortal: e => [...new Set(String(e.emailPortal || '').toLowerCase().split(/[\s,;]+/).filter(x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)))],
  /** a própria empresa é o cliente do portal: cria/atualiza o cliente pessoa jurídica e liga à empresa */
  async clientePortal(e) {
    const cnpj = onlyDigits(e.cnpj), atual = DB.get('clientes', e.clienteId);
    let c = atual && atual.tipo === 'Pessoa jurídica' && (!cnpj || onlyDigits(atual.doc) === cnpj) ? atual : (cnpj && DB.where('clientes', x => onlyDigits(x.doc) === cnpj)[0]) || null;
    const dados = { nome: e.razao || e.fantasia, tipo: 'Pessoa jurídica', doc: e.cnpj || '', email: Consult.emailsPortal(e)[0] || '', telefone: e.telefone || '', endereco: e.endereco || '', origem: 'consultoria' };
    [c] = await DB.save('clientes', c ? { ...c, ...dados, nome: c.nome || dados.nome } : dados);
    if (e.clienteId !== c.id) await DB.save('empresas', { ...DB.get('empresas', e.id), clienteId: c.id });
    return c;
  },
  /* ---------------- ACESSOS AO PORTAL (perfis por empresa) ---------------- */
  PERFIS: [['func', 'Funcionário'], ['ger', 'Gerente / Administrador'], ['dir', 'Diretoria']],
  async portalTab(host, e) {
    const pubN = empRecs('achados', e.id).filter(a => a.visivelEmpresa === 'Sim').length, totN = empRecs('achados', e.id).length;
    const achBox = `<section class="card"><header><h2>${icon('alert')} Plano de ação no portal</h2><button class="btn ghost sm" id="ppPub">${icon('eye')} Escolher o que publicar</button></header><p class="muted small"><b>${pubN}</b> de ${totN} achados visíveis à empresa. O gerente vê todos os publicados; o funcionário, só os atribuídos a ele; a diretoria, só os números.</p></section>`;
    if (!Session.remote) { host.innerHTML = `<section class="card"><p class="muted">Os acessos ao portal ficam no servidor. No modo local, use “Ver como a empresa”.</p></section>` + achBox; $('#ppPub', host).onclick = () => Consult.publicar(e); return; }
    host.innerHTML = `<section class="card"><p class="muted">Carregando acessos…</p></section>`;
    let us = [], ped = [];
    try { [us, ped] = await Promise.all([api('users'), api('pedidosEquipe', { empresaId: e.id })]); } catch (err) { host.innerHTML = `<section class="card"><p class="muted">${esc(err.message)}</p></section>`; return; }
    const cid = e.clienteId, entr = u => String(u.clienteId || '').split(/[,;\s]+/).find(x => x.split(':')[0] === cid);
    const ms = cid ? us.filter(u => u.papel === 'cliente' && entr(u)).map(u => ({ ...u, perfil: (entr(u).split(':')[1] || 'func') })) : [];
    const opt = sel => Consult.PERFIS.map(([k, l]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${l}</option>`).join('');
    host.innerHTML = `<section class="card"><header><h2>${icon('key')} Acessos ao portal <small class="muted">${ms.length}</small></h2><button class="btn ghost sm" id="ppVer">${icon('eye')} Ver como a empresa</button></header>
        <p class="muted small"><b>Funcionário</b>: contratos (lista), pendências atribuídas e remessa. <b>Gerente</b>: contratos (lista), plano de ação, revisa e envia a remessa, pede acessos de funcionários. <b>Diretoria</b>: painel com carteira, receita, custos e margem (só consulta).</p>
        ${ms.length ? `<div class="table-wrap"><table class="dt"><thead><tr><th>Pessoa</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>${ms.map(u => `<tr><td><b>${esc(u.nome || '—')}</b><small class="muted" style="display:block">${esc(u.email)}</small></td><td><select class="input sm" data-pf="${esc(u.email)}">${opt(u.perfil)}</select></td><td><small>${u.status !== 'autorizado' ? esc(u.status) : u.ultimoAcesso ? 'último acesso ' + fmtDateTime(u.ultimoAcesso) : 'convidado, ainda não entrou'}${u.temSenha ? ' · senha criada' : ''}</small></td><td class="right nowrap"><button class="link small" data-conv="${esc(u.email)}">reenviar convite</button>${u.temSenha ? ` · <button class="link small" data-zs="${esc(u.email)}">zerar senha</button>` : ''} · <button class="link small danger-text" data-rmv="${esc(u.email)}">remover</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Ninguém tem acesso ainda.</p>'}</section>
      ${ped.length ? `<section class="card"><header><h2>⏳ Pedidos do gerente <small class="muted">${ped.length}</small></h2></header>${ped.map(p => `<div class="u-row"><div class="u-who"><b>${p.tipo === 'remover' ? 'Remover' : 'Incluir como funcionário'}: ${esc(p.nome || p.email)}</b><small>${esc(p.email)} · pedido por ${esc(p.por)} em ${fmtDateTime(p.em)}</small></div><div class="u-act"><button class="btn primary sm" data-apr="${p.id}">Aprovar</button><button class="btn ghost sm" data-rec="${p.id}">Recusar</button></div></div>`).join('')}</section>` : ''}
      <section class="card"><header><h2>${icon('plus')} Adicionar acesso</h2></header><form class="grid-form" id="ppF"><div class="fld"><label>E-mail</label><input name="email" type="email" required></div><div class="fld"><label>Nome (opcional)</label><input name="nome"></div><div class="fld"><label>Perfil</label><select name="pf">${opt('func')}</select></div><div class="fld right" style="align-self:end"><button class="btn primary" id="ppAdd">${icon('mail')} Liberar e enviar convite</button></div></form></section>
      ${achBox}`;
    const salvar = async (user, invite, btn, msg) => {
      const h0 = btn?.innerHTML; if (btn) { btn.disabled = true; btn.innerHTML = `${icon('sync', 'spin')} Enviando…`; }
      try { await api('userSave', { user, invite, appUrl: location.origin + location.pathname }); UI.toast(msg, 'ok', 6000); Consult.portalTab(host, e); }
      catch (err) { if (btn) { btn.disabled = false; btn.innerHTML = h0; } UI.toast(err.message, 'bad', 7000); }
    };
    const garanteCli = async () => (await Consult.clientePortal(DB.get('empresas', e.id))).id;
    $('#ppVer', host).onclick = async () => Portal.preview(await garanteCli());
    $('#ppF', host).onsubmit = async ev => { ev.preventDefault(); const f = ev.target, c = await garanteCli(); salvar({ email: f.email.value.trim().toLowerCase(), nome: f.nome.value.trim() || undefined, papel: 'cliente', clienteId: c + ':' + f.pf.value, status: 'autorizado' }, true, $('#ppAdd', host), `Acesso liberado e convite enviado para ${f.email.value.trim()}.`); };
    $$('[data-pf]', host).forEach(s => s.onchange = () => salvar({ email: s.dataset.pf, papel: 'cliente', clienteId: cid + ':' + s.value, status: 'autorizado' }, false, null, 'Perfil alterado. Vale a partir do próximo acesso da pessoa.'));
    $$('[data-conv]', host).forEach(b => b.onclick = () => salvar({ email: b.dataset.conv, papel: 'cliente', clienteId: cid + ':' + ms.find(u => u.email === b.dataset.conv).perfil, status: 'autorizado' }, true, b, 'Convite reenviado.'));
    $$('[data-zs]', host).forEach(b => b.onclick = async () => { if (!confirm(`Zerar a senha de ${b.dataset.zs}?`)) return; try { await api('senhaZerar', { email: b.dataset.zs }); UI.toast('Senha zerada.', 'ok'); Consult.portalTab(host, e); } catch (err) { UI.toast(err.message, 'bad'); } });
    $$('[data-rmv]', host).forEach(b => b.onclick = () => confirm(`Remover o acesso de ${b.dataset.rmv} a esta empresa? As outras empresas dele não mudam.`) && salvar({ email: b.dataset.rmv, papel: 'cliente', clienteId: '', removerCliente: cid, status: 'autorizado' }, false, b, 'Acesso removido.'));
    $$('[data-apr]', host).forEach(b => b.onclick = async () => { const p = ped.find(x => x.id === b.dataset.apr), c = await garanteCli(); b.disabled = true;
      try { await api('userSave', p.tipo === 'remover' ? { user: { email: p.email, papel: 'cliente', clienteId: '', removerCliente: c, status: 'autorizado' } } : { user: { email: p.email, nome: p.nome || undefined, papel: 'cliente', clienteId: c + ':func', status: 'autorizado' }, invite: true, appUrl: location.origin + location.pathname });
        await api('pedidoResolver', { id: p.id, aprovado: true }); UI.toast(p.tipo === 'remover' ? 'Acesso removido.' : 'Aprovado e convite enviado.', 'ok'); Consult.portalTab(host, e); } catch (err) { b.disabled = false; UI.toast(err.message, 'bad'); } });
    $$('[data-rec]', host).forEach(b => b.onclick = async () => { try { await api('pedidoResolver', { id: b.dataset.rec, aprovado: false }); UI.toast('Pedido recusado.'); Consult.portalTab(host, e); } catch (err) { UI.toast(err.message, 'bad'); } });
    $('#ppPub', host).onclick = () => Consult.publicar(e);
  },
  /** escolher quais achados aparecem no portal da empresa */
  publicar(e) {
    const as = empRecs('achados', e.id).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }));
    if (!as.length) return UI.toast('Esta empresa não tem achados.');
    const m = UI.modal({ title: 'Publicar achados no portal', sub: esc(e.fantasia || e.razao) + ' · marque o que a empresa pode ver', wide: true,
      body: `<div class="btn-row"><button class="link small" id="pbTodos">marcar todos</button><button class="link small" id="pbAb">só os em aberto</button><button class="link small" id="pbNen">desmarcar todos</button></div>
        <div class="rm-dv">${as.map(a => `<label class="chk"><input type="checkbox" data-pb="${a.id}" ${a.visivelEmpresa === 'Sim' ? 'checked' : ''}><span class="pill ${/alto|crít/i.test(a.risco || '') ? 'bad' : /médio/i.test(a.risco || '') ? 'warn' : 'muted'}">${esc(a.risco || '—')}</span><span><b>${esc(a.codigo || '')}</b> ${esc(a.contrato || '')} — ${esc(String(a.achado || '').slice(0, 160))} <small class="muted">(${esc(a.status || 'Pendente')})</small></span></label>`).join('')}</div>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="pbOk">${icon('check')} Salvar</button>` });
    const cx = () => $$('[data-pb]', m);
    $('#pbTodos', m).onclick = () => cx().forEach(c => c.checked = true);
    $('#pbNen', m).onclick = () => cx().forEach(c => c.checked = false);
    $('#pbAb', m).onclick = () => cx().forEach(c => c.checked = achadoAberto(DB.get('achados', c.dataset.pb)));
    $('#pbOk', m).onclick = async () => { const mud = cx().map(c => ({ a: DB.get('achados', c.dataset.pb), v: c.checked ? 'Sim' : 'Não' })).filter(x => (x.a.visivelEmpresa || 'Não') !== x.v).map(x => ({ ...x.a, visivelEmpresa: x.v }));
      if (mud.length) await DB.save('achados', mud); UI.closeModal(); UI.toast(`${mud.length} achado(s) atualizado(s).`, 'ok'); App.render(true); };
  },
  async habilitarPortal(e, btn) {
    const mails = Consult.emailsPortal(e);
    if (!mails.length) { UI.toast('Informe ao menos um e-mail de acesso ao portal no cadastro da empresa.', 'warn'); return Consult.editEmpresa(e); }
    const c = await Consult.clientePortal(e);
    if (!Session.remote) { UI.toast('Empresa ligada ao portal. No modo local, use “Ver como o cliente” para testar.', 'ok', 6000); return App.render(true); }
    const ja = DB.get('empresas', e.id).portalEmails || [], novos = mails.filter(x => !ja.includes(x));
    const enviar = novos.length ? novos : (confirm('Todos os e-mails já foram convidados. Reenviar o convite para todos?\n\n' + mails.join('\n')) ? mails : []);
    if (!enviar.length) return;
    const html0 = btn?.innerHTML; if (btn) { btn.disabled = true; btn.classList.add('busy'); }
    const prog = (i) => { if (btn) btn.innerHTML = `${icon('sync', 'spin')} Enviando convite${enviar.length > 1 ? ` ${i}/${enviar.length}` : ''}…`; };
    try { let i = 0; for (const m of enviar) { prog(++i); await api('userSave', { user: { email: m, nome: c.nome, papel: 'cliente', clienteId: c.id, status: 'autorizado' }, invite: true, appUrl: location.origin + location.pathname }); }
      await DB.save('empresas', { ...DB.get('empresas', e.id), portalConvite: new Date().toISOString(), portalEmails: [...new Set([...ja, ...enviar])] });
      App.render(true);
      UI.modal({ title: 'Portal habilitado', sub: esc(e.fantasia || e.razao), body: `<div class="notice ok">${icon('check')}<div>Convite enviado para:<br><b>${enviar.map(esc).join('<br>')}</b></div></div><p class="muted">Cada pessoa abre o link do app, toca em <b>“Sou cliente — consultar meus processos”</b>, informa o próprio e-mail e digita o código que chega por e-mail.</p>`, foot: '<span class="sp"></span><button class="btn primary" data-close>Entendi</button>' });
    } catch (err) { if (btn) { btn.disabled = false; btn.classList.remove('busy'); btn.innerHTML = html0; } UI.toast('Não foi possível enviar o convite: ' + err.message, 'bad', 7000); }
  },


  workspace(v, eid, tab) {
    const e = DB.get('empresas', eid);
    if (!e) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Empresa não encontrada.</p></div>`; return; }
    const T = TABS.find(t => t[0] === tab) || TABS[0];
    App.crumbs([{ t: 'Consultoria', href: '/empresas' }, { t: e.fantasia || e.razao, href: '/empresa/' + eid }, { t: T[1] }]);
    const count = c => empRecs(c, eid).length;
    const portalBtn = `<button class="btn ghost" id="wPortal" title="Quem acessa o portal desta empresa e com qual perfil">${icon('key')} Acessos ao portal</button>`;
    v.innerHTML = `<div class="ws-h"><div class="emp-ini lg">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div><span class="eyebrow">Consultoria jurídica</span><h1>${esc(e.fantasia || e.razao)}</h1><p class="muted">${esc(e.razao)}${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}${e.segmento ? ' · ' + esc(e.segmento) : ''}</p></div>
      <div class="actions wrap"><button class="btn ghost" id="wEdit">${icon('edit')} Empresa</button>${portalBtn}<button class="btn ghost" id="wVer" title="Ver o portal como a empresa vê">${icon('eye')} Ver como a empresa</button><button class="btn ghost" id="wLogo" title="Logo da empresa (aparece na abertura do portal)">${e.logo ? `<img src="${esc(e.logo)}" alt="" class="logo-mini">` : icon('image')} Logo</button><button class="btn ghost" id="wExp">${icon('download')} Exportar Excel</button><button class="btn ghost" id="wRep">${icon('printer')} Relatório</button><button class="btn primary" id="wDocs">${icon('upload')} Juntar documentos</button></div></div>
      <div class="tabs scroll">${TABS.map(([k, l, i]) => `<a href="#/empresa/${eid}/${k}" class="${k === T[0] ? 'on' : ''}">${l}${SCHEMAS[k] ? `<em>${count(k)}</em>` : ''}</a>`).join('')}</div>
      <div id="wsBody"></div>`;
    $('#wEdit').onclick = () => Consult.editEmpresa(e);
    $('#wPortal').onclick = () => location.hash = '#/empresa/' + e.id + '/portal';
    $('#wVer').onclick = async () => { const c = e.clienteId && DB.get('clientes', e.clienteId)?.tipo === 'Pessoa jurídica' ? DB.get('clientes', e.clienteId) : await Consult.clientePortal(e); Portal.preview(c.id); };
    $('#wLogo').onclick = () => ConnSplash.escolherLogo(e);
    $('#wDocs').onclick = () => Docs.open(e);
    $('#wExp').onclick = () => Consult.exportar(e);
    $('#wRep').onclick = () => Report.dialog(e);
    const body = $('#wsBody');
    if (T[0] === 'painel') Consult.painel(body, e);
    else if (T[0] === 'relatorios') Report.tab(body, e);
    else if (T[0] === 'remessas') Remessa.tab(body, e);
    else if (T[0] === 'portal') Consult.portalTab(body, e);
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
    dataTable($('#dt'), { id: coll + e.id, rows, schema: sc, filters, sortDefault: sc.key || (sc.fields.some(f => f.k === 'contrato') ? 'contrato' : null), onOpen: open, actions: `<button class="btn primary sm" id="dtNew">${icon('plus')} Novo</button>`, emptyMsg: `Nenhum registro em ${sc.titulo}. Use “Novo” ou importe a planilha.` });
    $('#dtNew').onclick = () => {
      const base = {}; if (coll === 'contratos' && e.sigla) { const n = rows.map(r => +(String(r.codigo).match(/(\d+)$/) || [0, 0])[1]).reduce((a, b) => Math.max(a, b), 0) + 1; base.codigo = `${e.sigla}-${String(n).padStart(3, '0')}`; }
      if (coll === 'achados') base.status = 'Pendente';
      UI.editRecord(coll, base, { ctx, extraBase: { empresaId: e.id } });
    };
    const k = new URLSearchParams(location.hash.split('?')[1] || '').get('k');
    if (k && coll === 'contratos') { const r = DB.get('contratos', k); r && Consult.contrato360(e, r); }
  },

  /* visão 360º do contrato: tudo que se relaciona a ele */
  /** tipo "canônico" de um documento, para casar inventário × peças do compilado */
  tipoDoc: t => /aditivo|apostil/i.test(t || '') ? 'aditivo' : /refer[eê]ncia|\bTR\b/i.test(t || '') ? 'tr' : /edital/i.test(t || '') ? 'edital' : /planilha/i.test(t || '') ? 'planilha' : /anexo/i.test(t || '') ? 'anexo' : /contrato/i.test(t || '') ? 'contrato' : 'outro',
  /** compilado (com link) que já contém a peça deste documento do inventário */
  cobertoPor(d, l) { if (d.link) return null; const k = Consult.tipoDoc(d.tipo || d.arquivo); return l.find(x => x.link && (x.pecas || []).some(p => Consult.tipoDoc(p.tipo) === k)) || null; },
  /** o que um PDF contém: várias peças num arquivo só (aditivo + contrato + TR + anexos) */
  conteudoDoc(e, c, d) {
    const T = ['Termo aditivo', 'Contrato', 'Termo de referência', 'Edital', 'Planilha de custos', 'Anexo', 'Outro'];
    const at = d.pecas || [], pega = t => at.find(x => x.tipo === t);
    const m = UI.modal({ title: 'O que este PDF contém?', sub: esc(d.arquivo || ''), body: `<p class="muted small">Marque as peças que estão neste arquivo e, se souber, a página em que cada uma começa. Assim o app sabe, por exemplo, que o contrato principal está aqui mesmo que o PDF comece pelo aditivo.</p>
      <table class="mini pecas-t"><thead><tr><th></th><th>Peça</th><th>Página inicial</th><th>Página final</th></tr></thead><tbody>${T.map((t, i) => { const x = pega(t) || {}; return `<tr><td><input type="checkbox" data-pc="${i}" ${pega(t) ? 'checked' : ''}></td><td>${t}</td><td><input class="input sm" type="number" min="1" data-pi="${i}" value="${esc(x.paginaInicial || '')}"></td><td><input class="input sm" type="number" min="1" data-pf="${i}" value="${esc(x.paginaFinal || '')}"></td></tr>`; }).join('')}</tbody></table>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="pcOk">${icon('check')} Salvar</button>` });
    $$('[data-pi],[data-pf]', m).forEach(x => x.oninput = () => { const i = x.dataset.pi ?? x.dataset.pf; if (x.value) $(`[data-pc="${i}"]`, m).checked = true; });
    $('#pcOk', m).onclick = async () => {
      const pecas = T.map((t, i) => $(`[data-pc="${i}"]`, m).checked ? { tipo: t, paginaInicial: +$(`[data-pi="${i}"]`, m).value || null, paginaFinal: +$(`[data-pf="${i}"]`, m).value || null } : null).filter(Boolean)
        .sort((a, b) => (a.paginaInicial || 999) - (b.paginaInicial || 999));
      await DB.save('documentos', { ...d, pecas, tipo: pecas.length > 1 ? 'PDF compilado' : (pecas[0]?.tipo || d.tipo) });
      UI.toast('Conteúdo do PDF registrado.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
    };
  },
  /** legenda discreta: o que falta na documentação deste contrato */
  diagArquivos(e, c, l) {
    const eAd = d => (d.pecas || []).length ? (d.pecas || []).some(x => /aditivo|apostil/i.test(x.tipo || '')) : /aditivo|apostil/i.test((d.tipo || '') + ' ' + (d.arquivo || ''));
    const temPeca = (d, re) => (d.pecas || []).some(x => re.test(x.tipo || ''));
    const eCt = d => temPeca(d, /^contrato/i) || (!eAd(d) && /contrato/i.test(d.tipo || ''));
    const lk = l.filter(d => d.link), ctOk = lk.some(eCt), adOk = lk.some(eAd), semLink = l.filter(d => !d.link && !Consult.cobertoPor(d, l)), cobertos = l.filter(d => Consult.cobertoPor(d, l));
    const temAditivo = adOk || l.some(eAd) || (c.aditivos && !isGap(c.aditivos) && /aditivo/i.test(c.aditivos));
    const msgs = [];
    if (!l.length) msgs.push('Nenhum documento deste contrato no app: junte o contrato principal e, se houver, os aditivos.');
    else if (!ctOk) msgs.push(lk.length ? `<b>Falta o contrato principal</b> no Drive — ${adOk ? 'só há termo(s) aditivo(s)' : 'os arquivos juntados não foram reconhecidos como contrato'}. Sem ele não dá para conferir objeto, cláusulas e valores originais: obtenha o PDF com o tomador e junte aqui.` : '<b>Falta o contrato principal</b> no Drive: junte o PDF do contrato original.');
    if (ctOk && temAditivo && !adOk) msgs.push('O cadastro registra aditivo, mas o PDF do aditivo não está no Drive.');
    if (semLink.length) msgs.push(`${semLink.length} documento(s) do inventário da auditoria ainda sem arquivo no Drive — clique no botão tracejado para escolher o PDF (do RAR descompactado) e anexá-lo.`);
    const ach = DB.where('achados', a => a.empresaId === e.id && a.contrato === c.codigo && achadoAberto(a) && /contrato[- ]base|contrato (principal|original)|n[aã]o (foi )?identificad[oa] (o )?contrato|pdf leg[ií]vel/i.test(a.achado || ''));
    if (cobertos.length) msgs.push(`${cobertos.length} documento(s) do inventário (${esc(cobertos.map(d => d.arquivo || d.tipo).join('; ').slice(0, 120))}) estão dentro do PDF compilado.`);
    if (ach.length && !ctOk && msgs.length) msgs.push(`Relacionado ao(s) achado(s) em aberto ${esc(ach.map(a => a.codigo).join(', '))}.`);
    const pgCt = lk.flatMap(d => (d.pecas || []).filter(x => /^contrato/i.test(x.tipo || '')).map(x => x.paginaInicial)).filter(Boolean)[0];
    if (ctOk && ach.length) msgs.push(`O contrato principal está no Drive${pgCt ? ` (a partir da pág. ${pgCt})` : ''}, então o achado ${esc(ach.map(a => a.codigo).join(', '))} pode ser concluído: <button type="button" class="link small" data-achok="${ach.map(a => a.id).join(',')}">concluir com esta evidência</button>.`);
    if (ctOk && !semLink.length) msgs.unshift('Documentação no Drive: contrato principal' + (adOk ? ' e aditivo(s)' : '') + ' presentes.');
    if (!msgs.length) msgs.push('Sem pendências de documentação.');
    return `<p class="arq-leg">${icon(ctOk && !semLink.length ? 'check' : 'alert')}<span>${msgs.join(' ')}</span></p>`;
  },
  /** arquivos do contrato no Drive do escritório (contrato, aditivos, termos…) */
  arquivosHtml(e, c, dc) {
    const ord = d => /aditivo/i.test(d.tipo || d.arquivo || '') ? 1 : /contrato/i.test(d.tipo || '') ? 0 : 2;
    const l = dc.slice().sort((a, b) => ord(a) - ord(b) || String(a.arquivo || '').localeCompare(String(b.arquivo || ''), 'pt-BR', { numeric: true }));
    const comLink = l.filter(d => d.link), sem = l.filter(d => !d.link && !Consult.cobertoPor(d, l));
    return `<div class="arq-bar"><span class="lbl">${icon('file')} Arquivos no Drive</span>
      ${comLink.map(d => `<span class="arq-w"><a class="arq" href="${esc(d.link)}" target="_blank" rel="noopener" title="${esc(d.arquivo || '')}">${icon('link')}<span><b>${(d.pecas || []).length > 1 ? 'PDF compilado' : esc((d.pecas || [])[0]?.tipo || d.tipo || 'Documento')}${d.numero ? ' ' + esc(d.numero) : ''}</b><small>${(d.pecas || []).length > 1 ? esc(d.pecas.map(x => x.tipo + (x.paginaInicial ? ' (p. ' + x.paginaInicial + (x.paginaFinal && x.paginaFinal !== x.paginaInicial ? '–' + x.paginaFinal : '') + ')' : '')).join(' · ')) : esc(d.arquivo || 'abrir no Drive')}</small></span></a><button type="button" class="arq-ed" data-dcont="${d.id}" title="Dizer o que este PDF contém (contrato, aditivo, termo de referência, anexos…)">${icon('edit')}</button></span>`).join('')}
      ${!comLink.length ? `<span class="muted small">${sem.length ? `${sem.length} documento(s) no inventário, ainda sem arquivo no Drive.` : 'Nenhum arquivo juntado a este contrato.'}</span> <button class="btn ghost xs" id="cJunt">${icon('upload')} Juntar o contrato</button>` : ''}
      ${sem.map(d => `<button type="button" class="arq falta" data-djunt="${d.id}" title="Este documento está no inventário da auditoria, mas o arquivo não está no Drive. Clique para escolher o PDF e anexá-lo.">${icon('upload')}<span><b>${esc(d.tipo || 'Documento')} — sem arquivo</b><small>${esc(d.arquivo || 'escolher o PDF')}</small></span></button>`).join('')}<input type="file" id="cDocF" hidden accept=".pdf,image/*"></div>${Consult.diagArquivos(e, c, l)}`;
  },
  /** postos contratados, com o total mensal (salário-base × quantidade e custo previsto) */
  moPostos(L) {
    const m = v => num(v) !== null ? fmtMoney(v) : '—', n = v => num(v) !== null ? fmtNum(v) : '—';
    const q = L.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), sal = L.reduce((s, r) => s + (num(r.salario) || 0) * (num(r.qtdContratada) || 0), 0), prev = L.reduce((s, r) => s + (num(r.custoPrevisto) || 0), 0);
    return `<h4 class="sec">Mão de obra — postos contratados <span class="count">${L.length}</span></h4>${L.length ? `<div class="table-wrap"><table class="mini"><thead><tr><th>Posto/função</th><th class="r">Qtd. contratada</th><th class="r">Salário-base (unitário)</th><th class="r">Salário-base × qtd.</th><th class="r">Custo previsto</th><th>Divergência/risco</th></tr></thead><tbody>
      ${L.map(r => `<tr data-rel="maoDeObra:${r.id}"><td>${esc(r.posto || '')}</td><td class="r">${n(r.qtdContratada)}</td><td class="r">${m(r.salario)}</td><td class="r">${num(r.salario) !== null && num(r.qtdContratada) !== null ? fmtMoney(num(r.salario) * num(r.qtdContratada)) : '—'}</td><td class="r">${m(r.custoPrevisto)}</td><td>${r.divergencia && !isGap(r.divergencia) ? esc(r.divergencia) : '—'}</td></tr>`).join('')}
      </tbody><tfoot><tr style="font-weight:700;border-top:2px solid var(--line-strong)"><td>Total mensal</td><td class="r">${fmtNum(q)}</td><td class="r"></td><td class="r">${sal ? fmtMoney(sal) : '—'}</td><td class="r">${prev ? fmtMoney(prev) : '—'}</td><td></td></tr></tfoot></table></div>` : '<p class="muted small">Nenhum posto cadastrado.</p>'}`;
  },
  /** linhas mensais vindas dos relatórios do DP (folha e benefícios), em ordem de competência */
  moMensal(L) {
    if (!L.length) return '';
    L = L.slice().sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)));
    const m = v => num(v) !== null ? fmtMoney(v) : '—', n = v => num(v) !== null ? fmtNum(v) : '—';
    return `<h4 class="sec">Mão de obra — custo mês a mês (Departamento Pessoal) <span class="count">${L.length}</span></h4>
      <p class="muted small" style="margin:-4px 0 8px">Uma linha por competência, com os dados dos relatórios do DP (folha de pagamento, vale-alimentação, cesta básica, vale-transporte e férias). A folha bruta só aparece nos meses em que o relatório da folha a informa. Clique na linha para ver a evidência completa.</p>
      <div class="table-wrap"><table class="mini"><thead><tr><th>Competência</th><th class="r">Postos contratados</th><th class="r">Empregados na folha</th><th class="r">Folha bruta</th><th class="r">Folha líquida</th><th class="r">Benefícios</th><th class="r">Férias</th><th class="r">Salários previstos</th><th>Divergência</th></tr></thead><tbody>
      ${L.map(r => `<tr data-rel="maoDeObra:${r.id}"><td><b>${esc(fmtComp(r.competencia))}</b></td><td class="r">${n(r.qtdContratada)}</td><td class="r">${n(r.qtdAlocada)}</td><td class="r">${m(r.custoApurado)}</td><td class="r">${m(r.liquido)}</td><td class="r">${m(r.beneficios)}</td><td class="r">${m(r.encargos)}</td><td class="r">${m(r.custoPrevisto)}</td><td>${r.divergencia ? esc(r.divergencia) : '—'}</td></tr>`).join('')}
      </tbody></table></div>`;
  },
  contrato360(e, c) {
    const volta = () => Consult.contrato360(e, DB.get('contratos', c.id) || c);
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
      ${Consult.arquivosHtml(e, c, dc)}
      <div class="detail-grid">${SCHEMAS.contratos.fields.filter(f => !['codigo'].includes(f.k)).map(f => `<div class="${f.type === 'long' ? 'full' : ''}"><span class="lbl">${esc(f.label)}</span>${f.type === 'long' && c[f.k] && !isGap(c[f.k]) ? esc(c[f.k]) : UI.cell(f, c[f.k])}</div>`).join('')}</div>
      ${mini('Achados e plano de ação', 'achados', ac, ['codigo', 'area', 'achado', 'risco', 'status'])}
      ${Superv.html(e, c)}
      ${mini('Obrigações', 'obrigacoes', ob, ['clausula', 'grupo', 'obrigacao', 'status'])}
      ${Consult.moPostos(mo.filter(r => r.origem !== 'folhaDP'))}
      ${Consult.moMensal(mo.filter(r => r.origem === 'folhaDP'))}
      ${mini('Financeiro', 'financeiro', fi, ['tipo', 'grupo', 'descricao', 'previsto', 'realizado'])}
      ${me.length ? mini('Medições', 'medicoes', me, ['competencia', 'numero', 'valorMedido', 'valorFaturado', 'glosa']) : ''}
      ${ma.length ? mini('Materiais', 'materiais', ma, ['item', 'qtdPrevista', 'qtdEntregue', 'valorTotal']) : ''}
      ${mini('Documentos', 'documentos', dc, ['tipo', 'arquivo', 'paginas', 'legibilidade'])}
      ${ad.length ? mini('Aditivos', 'aditivos', ad, ['nome', 'datas', 'valor']) : ''}`,
      foot: `<button class="btn ghost danger-text" id="cDel">${icon('trash')} Excluir</button><span class="sp"></span><button class="btn ghost" id="svRel">${icon('printer')} Relatório do contrato</button><button class="btn ghost" id="cAch">${icon('alert')} Registrar achado</button><button class="btn primary" id="cEd">${icon('edit')} Editar contrato</button>`
    });
    $('#cEd', m).onclick = () => UI.editRecord('contratos', c, { ctx: { empresaId: e.id }, voltar: volta });
    $('#cJunt', m)?.addEventListener('click', () => { UI.closeModal(); Docs.open(e); });
    $$('[data-dcont]', m).forEach(b => b.onclick = () => Consult.conteudoDoc(e, c, DB.get('documentos', b.dataset.dcont)));
    Superv.bind(m, e, c);
    $$('[data-achok]', m).forEach(b => b.onclick = async () => {
      const dcs = DB.where('documentos', d => d.empresaId === e.id && d.contrato === c.codigo && d.link);
      const ct = dcs.find(d => (d.pecas || []).some(p => Consult.tipoDoc(p.tipo) === 'contrato')) || dcs.find(d => Consult.tipoDoc(d.tipo) === 'contrato');
      const pc = (ct?.pecas || []).find(p => Consult.tipoDoc(p.tipo) === 'contrato');
      const ev = `Contrato-base localizado no Drive do escritório: ${ct?.arquivo || 'arquivo do contrato'}${pc?.paginaInicial ? `, págs. ${pc.paginaInicial}${pc.paginaFinal ? '–' + pc.paginaFinal : ''}` : ''}.`;
      if (!await UI.confirm(`Concluir ${b.dataset.achok.split(',').length} achado(s) com a evidência:<br><i>${esc(ev)}</i>`, 'Concluir', false)) return;
      await DB.save('achados', b.dataset.achok.split(',').map(id => ({ ...DB.get('achados', id), status: 'Concluído', evidenciaConclusao: ev, dataValidacao: todayISO() })));
      UI.toast('Achado concluído.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
    });
    // anexar o arquivo a um documento do inventário que ainda não está no Drive
    let alvo = null; const fArq = $('#cDocF', m);
    $$('[data-djunt]', m).forEach(b => b.onclick = () => { alvo = DB.get('documentos', b.dataset.djunt); fArq.value = ''; fArq.click(); });
    fArq && (fArq.onchange = async () => {
      const f = fArq.files[0]; if (!f || !alvo) return;
      if (!Session.remote) return UI.toast('Anexar arquivos exige o servidor conectado.', 'warn');
      const b = $(`[data-djunt="${alvo.id}"]`, m); b.disabled = true; b.querySelector('b').textContent = 'Enviando ao Drive…';
      try {
        const up = await juntarELer({ empresaKey: e.id, empresa: e.fantasia || e.razao, nome: f.name, mime: f.type || 'application/pdf', base64: await Docs.b64(f), ler: false });
        await DB.save('documentos', { ...alvo, link: up.url, arquivo: alvo.arquivo || f.name, arquivoDrive: f.name });
        UI.toast('Arquivo anexado. Já pode abrir pelo botão.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
      } catch (err) { UI.toast('Não consegui anexar: ' + err.message, 'bad', 7000); b.disabled = false; b.querySelector('b').textContent = (alvo.tipo || 'Documento') + ' — sem arquivo'; }
    });
    $('#cAch', m).onclick = () => UI.editRecord('achados', { contrato: c.codigo, status: 'Pendente' }, { ctx: { empresaId: e.id }, extraBase: { empresaId: e.id }, voltar: volta });
    $('#cDel', m).onclick = async () => { if (!await UI.confirm(`Excluir o contrato ${c.codigo}? Os registros das outras abas são mantidos.`, 'Excluir')) return; await DB.remove('contratos', c.id); UI.closeModal(); App.render(); };
    $$('[data-rel]', m).forEach(tr => tr.onclick = () => { const [coll, id] = tr.dataset.rel.split(':'); UI.editRecord(coll, DB.get(coll, id), { ctx: { empresaId: e.id }, voltar: volta }); });
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
    const achRisco = RISCOS.map((r, i) => ({ label: r, attr: `data-ach-r="${esc(r)}"`, value: S.achAbertos.filter(a => norm(a.risco) === norm(r)).length, color: ['var(--info)', 'var(--warning)', 'var(--serious)', 'var(--critical)'][i] }));
    const achArea = {}; S.achAbertos.forEach(a => achArea[a.area || 'Sem área'] = (achArea[a.area || 'Sem área'] || 0) + 1);
    const ins = Consult.insights(S);
    const vazia = !S.cs.length && !empRecs('documentos', e.id).length;
    host.innerHTML = `${vazia ? `<div class="drop-hero">${icon('upload')}<div><b>Comece juntando os documentos da empresa</b><span>Arraste a pasta com os contratos, aditivos e a planilha de auditoria: o app guarda no Drive, lê com IA, liga cada arquivo ao contrato e monta o painel.</span></div><button class="btn primary" id="heroDocs">${icon('upload')} Juntar documentos</button></div>` : ''}
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
      <section class="card"><header><h2>Vencimentos nos próximos 12 meses</h2><button class="link small" type="button" id="vcTodos">Ver todos</button></header><div data-chart="vc"></div></section>
      <section class="card"><header><h2>Achados em aberto por risco</h2><a class="link small" href="#/achados" id="achTodos">Resolver</a></header><p class="muted small">Toque num risco ou numa área para ver a lista.</p>${segBar(achRisco)}<h4 class="sec">Por área</h4>${hbarHtml(Object.entries(achArea).map(([label, value]) => ({ label, value, color: 'var(--s2)', attr: `data-ach-a="${esc(label)}"` })).sort((a, b) => b.value - a.value), v => String(v), 6)}</section>
      <section class="card"><header><h2>Situação das obrigações</h2></header>${segBar(S.obDist)}<h4 class="sec">Alertas</h4>${Views.alertasConsultoria(e.id)}</section>
    </div>`;
    $('#heroDocs', host)?.addEventListener('click', () => Docs.open(e));
    const verAch = f => { Achados.st = { risco: 'todos', status: 'abertos', emp: e.id, area: '', busca: '', ...f }; Achados._rolar = 1; location.hash = '#/achados'; };
    $$('[data-ach-r]', host).forEach(x => x.onclick = () => verAch({ risco: x.dataset.achR }));
    $$('[data-ach-a]', host).forEach(x => x.onclick = () => verAch({ area: x.dataset.achA }));
    $('#achTodos', host).onclick = ev => { ev.preventDefault(); verAch({}); };
    $('#vcTodos', host).onclick = () => Consult.vencLista(e, S.cs, null);
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
    mountChart(C('vc'), { labels: venc12.map(x => fmtCompShort(x.k)), fullLabels: venc12.map(x => fmtComp(x.k)), kind: 'bar', series: [{ name: 'Contratos vencendo', values: venc12.some(x => x.n) ? venc12.map(x => x.n) : venc12.map(() => null) }], fmt: v => fmtNum(v) + ' contrato(s)', axisFmt: v => fmtNum(v), empty: 'Nenhum contrato com data de término cadastrada nos próximos 12 meses.', onPick: i => Consult.vencLista(e, S.cs, venc12[i].k) });
  },

  /** lista dos contratos que vencem num mês (k = 'AAAA-MM') ou nos próximos 12 meses (k = null) */
  vencLista(e, cs, k, nDias) {
    const ini = todayISO().slice(0, 7), d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 11); const fimP = d.toISOString().slice(0, 7);
    const l = nDias ? cs.slice().sort((a, b) => a.fim.localeCompare(b.fim)) : cs.filter(c => isISO(c.fim) && (k ? c.fim.slice(0, 7) === k : c.fim.slice(0, 7) >= ini && c.fim.slice(0, 7) <= fimP)).sort((a, b) => a.fim.localeCompare(b.fim));
    const dias = c => { const n = daysUntil(c.fim); return n < 0 ? `<span class="bad">venceu há ${-n} dia(s)</span>` : n === 0 ? '<b>vence hoje</b>' : `faltam ${n} dia(s)`; };
    const m = UI.modal({ title: nDias ? `Contratos vencendo nos próximos ${nDias} dias` : k ? 'Contratos que vencem em ' + fmtComp(k) : 'Vencimentos nos próximos 12 meses', sub: `${l.length} contrato(s) · toque para abrir a ficha`, wide: true,
      body: l.length ? `<div class="venc-l">${l.map(c => `<button type="button" class="venc-i" data-vc="${c.id}"><span><b>${esc(c.codigo || '')}</b> ${esc(c.tomador || '')}${e ? '' : `<small class="muted">${esc((x => x?.fantasia || x?.razao || '')(DB.get('empresas', c.empresaId)))}</small>`}<small class="muted">${esc([c.unidade, c.numero && 'nº ' + c.numero].filter(Boolean).join(' · '))}</small></span><span class="r">${fmtDate(c.fim)}<small>${dias(c)}</small></span></button>`).join('')}</div>` : '<div class="empty"><p>Nenhum contrato.</p></div>' });
    $$('[data-vc]', m).forEach(b => b.onclick = () => { UI.closeModal(); const c = DB.get('contratos', b.dataset.vc); Consult.contrato360(e || DB.get('empresas', c.empresaId), c); });
  },

  /* ---------------- IMPORTAÇÃO DA PLANILHA ---------------- */
  async importar(e, file, quieto) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    let book; try { book = await XLSX.read(await file.arrayBuffer()); } catch (err) { UI.toast('Não consegui ler a planilha: ' + err.message, 'bad'); return; }
    const tdp = BenefDP.tipo(book); if (tdp) return BenefDP.importar(e, book, file, tdp);
    if (FolhaDP.reconhece(book)) return FolhaDP.importar(e, book, file);
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
    if (!found.length) { if (quieto) return 'nao'; UI.toast('Nenhuma aba reconhecida. Os nomes das colunas devem seguir o modelo da planilha de auditoria.', 'bad', 6000); return; }
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
    return UI.aguardar(m);
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

/* =====================================================================
   PAINEL DE ACHADOS — o que cada achado significa e como resolver
   ===================================================================== */
const Achados = {
  view(v, q = {}) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Achados de auditoria' }]);
    const st = Achados.st = Achados.st || { risco: 'alto', status: 'abertos', emp: '', area: '', busca: '' };
    if (q.risco) st.risco = q.risco;
    const emps = DB.all('empresas'), nomeE = id => { const e = DB.get('empresas', id); return e ? (e.fantasia || e.razao) : '—'; };
    const todos = DB.all('achados');
    const filtra = a => (st.risco === 'todos' || (st.risco === 'alto' ? /alto|cr[ií]tico/i.test(a.risco || '') : norm(a.risco) === norm(st.risco)))
      && (st.status === 'todos' || (st.status === 'abertos' ? achadoAberto(a) : !achadoAberto(a)))
      && (!st.emp || a.empresaId === st.emp) && (!st.area || (a.area || 'Sem área') === st.area)
      && (!st.busca || norm([a.codigo, a.contrato, a.achado, a.criterio, a.causa, a.recomendacao, a.responsavel].join(' ')).includes(norm(st.busca)));
    const l = todos.filter(filtra).sort((a, b) => Achados.peso(b) - Achados.peso(a) || String(a.prazo || '9').localeCompare(String(b.prazo || '9')));
    const abertosAlto = todos.filter(a => achadoAberto(a) && /alto|cr[ií]tico/i.test(a.risco || ''));
    const venc = abertosAlto.filter(a => a.prazo && daysUntil(a.prazo) < 0).length, semResp = abertosAlto.filter(a => !a.responsavel).length;
    const valor = abertosAlto.reduce((s, a) => s + (num(a.valor) || 0), 0);
    const areas = [...new Set(todos.map(a => a.area || 'Sem área'))].sort();
    const porArea = {}; l.forEach(a => { const k = a.area || 'Sem área'; porArea[k] = (porArea[k] || 0) + 1; });
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>${icon('alert', 'h-ic')} Achados de auditoria</h1>
        <p class="muted">Achado é uma irregularidade ou risco encontrado na auditoria dos contratos — por exemplo, obrigação trabalhista ou fiscal sem comprovação, contrato vencido, valor divergente. Cada um traz o critério violado, a causa, o risco e a ação corretiva recomendada. Resolver é: executar a recomendação, guardar a evidência e marcar como concluído.</p></div></div>
      <div class="kpis sm">${kpi('Alto/crítico em aberto', abertosAlto.length, 'exigem ação', abertosAlto.length ? 'bad' : '')}${kpi('Com prazo vencido', venc, 'entre os de risco alto', venc ? 'warn' : '')}${kpi('Sem responsável', semResp, 'defina quem resolve', semResp ? 'warn' : '')}${kpi('Valor envolvido', valor ? fmtMoneyShort(valor) : '—', 'nos de risco alto em aberto')}</div>
      <section class="card ach-guia"><header><h2>${icon('list')} Como resolver, em 4 passos</h2></header><ol>
        <li><b>Entenda</b> — leia a constatação e o critério (cláusula, lei ou norma que não foi cumprida).</li>
        <li><b>Atribua</b> — defina o responsável na empresa e um prazo realista; marque “Em andamento”.</li>
        <li><b>Corrija</b> — execute a recomendação (cobrar documento, regularizar recolhimento, aditar contrato, notificar o tomador…).</li>
        <li><b>Comprove e conclua</b> — registre a evidência (guia paga, certidão, aditivo assinado) e conclua. O achado sai do painel e entra no relatório como resolvido.</li></ol></section>
      <div class="dt-tools ach-f"><div class="search">${icon('search')}<input id="acB" type="search" placeholder="Buscar no achado, contrato, recomendação…" value="${esc(st.busca)}"></div>
        <select id="acR"><option value="alto" ${st.risco === 'alto' ? 'selected' : ''}>Risco alto e crítico</option>${RISCOS.map(r => `<option value="${r}" ${st.risco === r ? 'selected' : ''}>Risco ${r.toLowerCase()}</option>`).join('')}<option value="todos" ${st.risco === 'todos' ? 'selected' : ''}>Todos os riscos</option></select>
        <select id="acS"><option value="abertos" ${st.status === 'abertos' ? 'selected' : ''}>Em aberto</option><option value="fechados" ${st.status === 'fechados' ? 'selected' : ''}>Resolvidos</option><option value="todos" ${st.status === 'todos' ? 'selected' : ''}>Todos</option></select>
        ${emps.length > 1 ? `<select id="acE"><option value="">Todas as empresas</option>${emps.map(e => `<option value="${e.id}" ${st.emp === e.id ? 'selected' : ''}>${esc(e.fantasia || e.razao)}</option>`).join('')}</select>` : ''}
        <select id="acA"><option value="">Todas as áreas</option>${areas.map(x => `<option ${st.area === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      ${Object.keys(porArea).length > 1 ? `<div class="ach-areas">${Object.entries(porArea).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<button class="chip ${st.area === k ? 'on' : ''}" data-ar="${esc(k)}">${esc(k)} <b>${n}</b></button>`).join('')}</div>` : ''}
      <p class="muted small">${l.length} achado(s)</p>
      <div class="ach-list">${l.map(a => Achados.card(a, nomeE(a.empresaId), emps.length > 1)).join('') || `<div class="empty">${icon('check')}<p>Nenhum achado com estes filtros.</p></div>`}</div>`;
    if (Achados._rolar) { Achados._rolar = 0; setTimeout(() => $('.ach-f', v)?.scrollIntoView({ block: 'start' }), 60); }
    const re = () => Achados.view(v);
    $('#acB').oninput = e => { st.busca = e.target.value; clearTimeout(Achados._t); Achados._t = setTimeout(() => { re(); const i = $('#acB'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); };
    $('#acR').onchange = e => { st.risco = e.target.value; re(); }; $('#acS').onchange = e => { st.status = e.target.value; re(); };
    $('#acE')?.addEventListener('change', e => { st.emp = e.target.value; re(); }); $('#acA').onchange = e => { st.area = e.target.value; re(); };
    $$('[data-ar]').forEach(b => b.onclick = () => { st.area = st.area === b.dataset.ar ? '' : b.dataset.ar; re(); });
    $$('[data-ac]').forEach(b => b.onclick = () => Achados.acao(b.dataset.ac, b.dataset.id, re));
  },
  peso: a => ({ 'crítico': 4, critico: 4, alto: 3, 'médio': 2, medio: 2, baixo: 1 }[norm(a.risco)] || 0),
  card(a, emp, mostraEmp) {
    const d = a.prazo ? daysUntil(a.prazo) : null, aberto = achadoAberto(a);
    const c = a.contrato && DB.where('contratos', x => x.empresaId === a.empresaId && x.codigo === a.contrato)[0];
    return `<article class="ach ${norm(a.risco)} ${aberto ? '' : 'fechado'}">
      <header><span class="pill ${/cr[ií]t/i.test(a.risco) ? 'critical' : /alto/i.test(a.risco) ? 'serious' : /m[eé]dio/i.test(a.risco) ? 'warn' : 'neutral'}">Risco ${esc((a.risco || '—').toLowerCase())}</span>
        <b class="mono">${esc(a.codigo || '')}</b>${a.area ? `<span class="tag">${esc(a.area)}</span>` : ''}${mostraEmp ? `<span class="muted small">${esc(emp)}</span>` : ''}
        <span class="sp"></span><span class="pill ${aberto ? (/andamento/i.test(a.status) ? 'info' : 'neutral') : 'good'}">${esc(a.status || 'Pendente')}</span></header>
      <p class="ach-t">${esc(a.achado || '')}</p>
      <dl class="dl cols ach-dl">
        ${a.criterio ? `<dt>Critério</dt><dd>${esc(a.criterio)}</dd>` : ''}${a.causa ? `<dt>Causa provável</dt><dd>${esc(a.causa)}</dd>` : ''}
        ${c || a.contrato ? `<dt>Contrato</dt><dd>${c ? `<button class="link" data-ac="contrato" data-id="${a.id}">${esc(a.contrato)} · ${esc(tomadorBase(c) || c.objeto || '')}</button>` : esc(a.contrato)}</dd>` : ''}${a.periodo ? `<dt>Período</dt><dd>${esc(a.periodo)}</dd>` : ''}
        ${num(a.valor) ? `<dt>Valor envolvido</dt><dd>${esc(fmtMoney(a.valor))}</dd>` : ''}
        <dt>Responsável</dt><dd>${a.responsavel ? esc(a.responsavel) : '<span class="t-warn">não definido</span>'}</dd>
        <dt>Prazo</dt><dd>${a.prazo ? `${esc(fmtDate(a.prazo))}${aberto && d !== null ? (d < 0 ? ` <b class="t-bad">vencido há ${-d} dia(s)</b>` : d <= 7 ? ` <b class="t-warn">em ${d} dia(s)</b>` : '') : ''}` : '<span class="t-warn">sem prazo</span>'}</dd>
        ${a.evidenciaConclusao ? `<dt>Evidência</dt><dd>${esc(a.evidenciaConclusao)}${a.dataValidacao ? ' · ' + esc(fmtDate(a.dataValidacao)) : ''}</dd>` : ''}</dl>
      ${a.recomendacao ? `<div class="ach-rec">${icon('check')}<div><span>O que fazer</span>${esc(a.recomendacao)}</div></div>` : ''}
      <footer>${aberto ? `${/andamento/i.test(a.status) ? '' : `<button class="btn ghost sm" data-ac="andamento" data-id="${a.id}">${icon('clock')} Em andamento</button>`}<button class="btn ghost sm" data-ac="atribuir" data-id="${a.id}">${icon('user')} Responsável e prazo</button><button class="btn primary sm" data-ac="concluir" data-id="${a.id}">${icon('check')} Concluir com evidência</button>` : `<button class="btn ghost sm" data-ac="reabrir" data-id="${a.id}">Reabrir</button>`}<span class="sp"></span><button class="btn ghost sm" data-ac="editar" data-id="${a.id}">${icon('edit')} Editar</button></footer></article>`;
  },
  acao(tipo, id, re) {
    const a = DB.get('achados', id); if (!a) return;
    const e = DB.get('empresas', a.empresaId);
    const salvar = async (campos, msg) => { await DB.save('achados', { ...a, ...campos }); UI.toast(msg); re(); };
    if (tipo === 'andamento') return salvar({ status: 'Em andamento' }, 'Achado em andamento.');
    if (tipo === 'reabrir') return salvar({ status: 'Pendente', dataValidacao: '' }, 'Achado reaberto.');
    if (tipo === 'editar') return UI.editRecord('achados', a, { ctx: { empresaId: a.empresaId }, onSaved: re });
    if (tipo === 'contrato') { const c = DB.where('contratos', x => x.empresaId === a.empresaId && x.codigo === a.contrato)[0]; return c && e && Consult.contrato360(e, c); }
    if (tipo === 'atribuir') {
      const m = UI.modal({ title: 'Responsável e prazo', sub: esc(a.codigo || ''), body: `<form class="grid-form" id="atf"><div class="fld full"><label>Responsável (na empresa ou no escritório)</label><input name="r" value="${esc(a.responsavel || '')}" placeholder="Ex.: Setor de RH da JSP — Maria"></div><div class="fld"><label>Prazo</label><input type="date" name="p" value="${esc(a.prazo || '')}"></div></form>`,
        foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="atOk">${icon('check')} Salvar</button>` });
      $('#atOk', m).onclick = () => { const f = $('#atf', m); UI.closeModal(); salvar({ responsavel: f.r.value.trim(), prazo: f.p.value, status: achadoAberto(a) && !/andamento/i.test(a.status) ? 'Em andamento' : a.status }, 'Responsável e prazo definidos.'); };
      return;
    }
    if (tipo === 'concluir') {
      const m = UI.modal({ title: 'Concluir achado', sub: esc(a.codigo || ''), body: `<p class="muted small">${esc(a.achado || '')}</p><form class="grid-form" id="cof"><div class="fld full"><label>Evidência de conclusão *</label><input name="ev" value="${esc(a.evidenciaConclusao || '')}" placeholder="Ex.: guia do FGTS de 03/2025 paga em 10/04 (anexada); aditivo nº 2 assinado"></div><div class="fld"><label>Data</label><input type="date" name="dt" value="${todayISO()}"></div></form>`,
        foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="coOk">${icon('check')} Concluir</button>` });
      $('#coOk', m).onclick = () => { const f = $('#cof', m); if (!f.ev.value.trim()) return UI.toast('Registre a evidência — é o que comprova a correção no relatório.', 'bad'); UI.closeModal(); salvar({ status: 'Concluído', evidenciaConclusao: f.ev.value.trim(), dataValidacao: f.dt.value }, 'Achado concluído.'); };
    }
  }
};
