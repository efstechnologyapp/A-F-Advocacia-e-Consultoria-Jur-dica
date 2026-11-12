/* =====================================================================
   PORTAL DO CLIENTE — acesso próprio e restrito
   ===================================================================== */
const Portal = {
  st: { tab: 'processos', proc: null },
  shell() {
    const u = Session.user;
    document.getElementById('root').innerHTML = `<div class="portal" id="portal"></div>`;
    window.onhashchange = null;
    Portal.acesso();
    Portal.render();
    const k = Portal.ctx(), cs = Portal.ctxs(); if (k) ConnSplash.show(k.e || null, k.c?.nome || Session.user.nome); else if (cs.length > 1) ConnSplash.multi(cs.map(x => x.e || { razao: x.c?.nome || '' }));
  },
  /* ---- usuário com acesso a mais de uma empresa: escolhe em qual vai trabalhar ---- */
  cids: () => String(Session.user?.clienteId || '').split(/[,;\s]+/).filter(String).map(x => x.split(':')[0]),
  ctxs() {
    const out = [];
    Portal.cids().forEach(id => {
      const emps = DB.where('empresas', e => e.clienteId === id).sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
      emps.forEach(e => out.push({ key: 'e:' + e.id, cid: id, e }));
      if (!emps.length) { const c = DB.get('clientes', id); if (c) out.push({ key: 'c:' + id, cid: id, c }); }
    });
    return out;
  },
  ctx() {
    const cs = Portal.ctxs(); if (cs.length === 1) return cs[0];
    let k = ''; try { k = sessionStorage.getItem('af-ctx') || ''; } catch (_) {}
    return cs.find(x => x.key === k) || null;
  },
  escolher(key) {
    try { sessionStorage.setItem('af-ctx', key); } catch (_) {}
    const k = Portal.ctx(); Portal.st = { tab: k?.e ? Perfis.abas(Perfis.de(k.e))[0][0] : 'processos', proc: null }; Remessa.pst = {};
    scrollTo(0, 0); Portal.render(); if (k) ConnSplash.show(k.e || null, k.c?.nome || Session.user.nome);
  },
  trocar() { try { sessionStorage.removeItem('af-ctx'); } catch (_) {} Portal.st = { tab: 'processos', proc: null }; Portal.render(); scrollTo(0, 0); },
  picker(root) {
    const cs = Portal.ctxs(), u = Session.user, pe = u.pessoa || {}, esc0 = escritorio();
    root.innerHTML = `<header class="p-top"><img src="${BRAND.logoDark}" alt="Amorim Firmo" class="p-logo"><div class="p-brand"><b>${esc(esc0.nome || 'Amorim Firmo')}</b><span class="caption dark">${BRAND.caption}</span></div><span class="sp"></span><button class="btn ghost sm" id="pkOut">${icon('logout')} Sair</button></header>
      <div class="p-hero"><span class="eyebrow">Área do cliente</span><h1>Olá${pe.nome ? ', ' + esc(pe.nome.split(' ')[0]) : ''}!</h1><p>Seu acesso está liberado para ${cs.length} empresas. Escolha em qual você vai trabalhar agora — dá para trocar depois pelo menu.</p></div>
      <main class="p-main"><div class="emp-cards pk-cards">${cs.map(k => { const e = k.e;
        if (!e) return `<button class="emp-card pk" data-ctx="${k.key}"><div class="pk-logo"><span>${esc((k.c.nome || '?').slice(0, 2).toUpperCase())}</span></div><b>${esc(k.c.nome)}</b><small class="muted">Meus processos</small></button>`;
        const comp = Remessa.compPadrao(), r = Remessa.get(e.id, comp), ab = empRecs('achados', e.id).filter(achadoAberto).length, nc = empRecs('contratos', e.id).length;
        return `<button class="emp-card pk" data-ctx="${k.key}"><div class="pk-logo">${e.logo ? `<img src="${esc(e.logo)}" alt="">` : `<span>${esc(e.sigla || (e.fantasia || e.razao).slice(0, 2).toUpperCase())}</span>`}</div><b>${esc(e.fantasia || e.razao)}</b><em class="pf-tag ${Perfis.real(e)}">${esc(Perfis.CURTO[Perfis.real(e)])}</em><small class="muted">${e.cnpj ? 'CNPJ ' + esc(fmtDoc(e.cnpj)) : esc(e.razao || '')}</small>
          <div class="pk-meta"><span>${nc} contrato(s)</span><span>${ab} ação(ões) em aberto</span></div>${Perfis.de(e) === 'dir' ? '' : `<div class="pk-rm">Remessa ${fmtComp(comp)}: ${Remessa.pill(r || { status: 'aberta' })}</div>`}</button>`; }).join('')}</div></main>
      <footer class="p-foot">Acesso exclusivo e confidencial · ${esc(esc0.nome || 'Amorim Firmo')}<br><span class="dev-cred">Tecnologia ${DEV.nome} ©</span></footer>`;
    $$('[data-ctx]', root).forEach(b => b.onclick = () => Portal.escolher(b.dataset.ctx));
    $('#pkOut', root).onclick = () => App.logout();
  },
  render() {
    const root = $('#portal'), cs = Portal.ctxs(), k = Portal.ctx();
    if (!k && cs.length > 1) return Portal.picker(root);
    const x = k || cs[0];
    if (x?.e) Remessa.pst = { ...(Remessa.pst || {}), emp: x.e.id };
    Portal.draw(root, x ? x.cid : Portal.cids()[0], false);
  },
  preview(clienteId, procId) {
    const ov = document.createElement('div'); ov.className = 'portal-preview';
    ov.innerHTML = `<div class="pv-bar">${icon('eye')} <span>Pré-visualização do portal</span><span class="sp"></span><label class="pv-pf">Ver como <select id="pvPf"><option value="func">Funcionário</option><option value="ger" selected>Gerente</option><option value="dir">Diretoria</option></select></label><button class="btn ghost light sm" id="pvClose">${icon('x')} Fechar</button></div><div class="portal" id="pvBody"></div>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    $('#pvClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
    Portal.prevPerfil = 'ger'; Portal.st = { tab: 'processos', proc: procId || null };
    Portal.draw($('#pvBody'), clienteId, true);
    $('#pvPf').onchange = ev => { Portal.prevPerfil = ev.target.value; Portal.st = { tab: Perfis.abas(ev.target.value)[0][0], proc: null }; Portal.draw($('#pvBody'), clienteId, true); };
  },
  ini: n => `<span class="p-ava">${esc(((n || '?').split(/\s+/).filter(w => w.length > 2).map(w => w[0]).slice(0, 2).join('') || (n || '?')[0]).toUpperCase())}</span>`,
  /** painel lateral do usuário do portal */
  menu(root, o) {
    const u = o.preview ? { email: o.cli.email || '' } : Session.user, st = Portal.st, pe = Portal.pessoa(o.preview, o.cli), ac = (!o.preview && Session.user.acesso) || { em: new Date().toISOString(), local: Portal.localFuso() };
    const e0 = o.emps[0];
    const rm = o.emps.map(e => { const comp = Remessa.compPadrao(), r = Remessa.get(e.id, comp); return { e, comp, r, pz: Remessa.prazo(e, comp) }; });
    const ov = document.createElement('div'); ov.className = 'p-drawer-ov';
    ov.innerHTML = `<aside class="p-drawer" role="dialog" aria-label="Meu menu">
      <div class="pd-h"><div class="pd-emp">${e0?.logo ? `<img src="${esc(e0.logo)}" alt="">` : `<span class="pd-emp-i">${esc(e0?.sigla || (e0?.fantasia || e0?.razao || o.cli.nome || '?').slice(0, 2))}</span>`}<div><b>${esc(e0 ? e0.fantasia || e0.razao : o.cli.nome || '')}</b><small>${e0?.cnpj ? 'CNPJ ' + esc(fmtDoc(e0.cnpj)) : ''}</small>${e0 ? `<em class="pf-tag ${Perfis.de(e0, o.preview)}">${esc(Perfis.CURTO[Perfis.de(e0, o.preview)])}</em>` : ''}</div></div><button class="icon-btn" data-x aria-label="Fechar">${icon('x')}</button></div>
      <div class="pd-user">${Portal.ini(pe.nome || u.email)}<div><b>${pe.nome ? esc(pe.nome) : '<button class="link small" data-perfil2>Complete seu perfil</button>'}</b>${pe.cargo ? `<small>${esc(pe.cargo)}</small>` : ''}<small>${esc(u.email || '')}</small><small class="pd-acc">${icon('clock')} ${esc(ac.local ? ac.local + ' · ' : '')}${fmtDate(ac.em)} às ${new Date(ac.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></div></div>
      <nav class="pd-nav">${o.tabs.map(([k, l]) => `<button data-go="${k}" class="${st.tab === k ? 'on' : ''}">${icon(Perfis.ICON[k] || 'file')}<span>${l}</span>${k === 'remessa' && rm[0] ? `<em class="pill ${Remessa.ST[rm[0].r?.status || 'aberta'][1]}">${rm[0].r?.status && rm[0].r.status !== 'aberta' ? Remessa.ST[rm[0].r.status][0].split(' ·')[0] : 'até ' + fmtDate(rm[0].pz).slice(0, 5)}</em>` : ''}</button>`).join('')}
</nav>
      ${!o.preview && Portal.ctxs().length > 1 ? `<nav class="pd-nav"><button data-trocar>${icon('building')}<span>Trocar de empresa</span><em class="pill muted">${Portal.ctxs().length}</em></button></nav>` : ''}
      ${!o.preview && e0 && Perfis.possiveis(e0).length > 1 ? `<div class="pd-sec">Atuar como</div><div class="pd-pf">${Perfis.possiveis(e0).map(k => `<button data-atuar="${k}" class="${Perfis.de(e0) === k ? 'on' : ''}">${esc(Perfis.CURTO[k])}${k === Perfis.real(e0) ? ' <small>(seu perfil)</small>' : ''}</button>`).join('')}</div>` : ''}
      <div class="pd-sec">Minha conta</div>
      <nav class="pd-nav"><button data-perfil>${icon('user')}<span>Meus dados</span></button><button data-senha>${icon('key')}<span>${o.preview || Session.user?.temSenha !== false ? 'Alterar senha' : 'Criar senha'}</span></button>
        ${window.__afInstall ? `<button data-inst>${icon('download')}<span>Instalar o app no celular</span></button>` : /iphone|ipad/i.test(navigator.userAgent) ? `<div class="pd-hint">${icon('download')} Para instalar: toque em <b>Compartilhar</b> › <b>Adicionar à Tela de Início</b>.</div>` : ''}</nav>
      <div class="pd-sec">Escritório</div>
      <div class="pd-fale">${o.wa ? `<a class="btn ghost sm" href="https://wa.me/55${o.wa}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a>` : ''}${o.esc0.email ? `<a class="btn ghost sm" href="mailto:${esc(o.esc0.email)}">${icon('mail')} E-mail</a>` : ''}</div>
      <div class="pd-foot">${o.preview ? '<small class="muted">Pré-visualização: perfil, senha e sair ficam disponíveis só para o cliente.</small>' : `<button class="btn ghost block" data-sair>${icon('logout')} Sair</button>`}<small class="muted">Versão ${esc(APP_VERSAO)}</small></div>
    </aside>`;
    (o.preview ? root.closest('.portal-preview') || document.body : document.body).appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('on'));
    const fechar = () => { ov.classList.remove('on'); setTimeout(() => ov.remove(), 250); };
    ov.onclick = ev => { if (ev.target === ov || ev.target.closest('[data-x]')) fechar(); };
    $$('[data-go]', ov).forEach(b => b.onclick = () => { st.tab = b.dataset.go; st.proc = null; fechar(); o.redraw(); scrollTo(0, 0); });
    $('[data-relat]', ov)?.addEventListener('click', () => { fechar(); Report.open(o.emps[0], { titulo: 'Relatório de Auditoria Contratual', secs: new Set(Report.SECOES.map(s => s[0])), resp: o.esc0.advogado, oab: o.esc0.oab, conf: true }); });
    $('[data-sair]', ov)?.addEventListener('click', () => { ov.remove(); App.logout(); });
    $('[data-trocar]', ov)?.addEventListener('click', () => { ov.remove(); Portal.trocar(); });
    $$('[data-atuar]', ov).forEach(b => b.onclick = () => { ov.remove(); Perfis.atuarComo(e0, b.dataset.atuar); });
    $('[data-inst]', ov)?.addEventListener('click', async () => { const p = window.__afInstall; window.__afInstall = null; fechar(); try { p.prompt(); await p.userChoice; } catch (_) {} });
    const soCliente = () => { UI.toast('Disponível só para o cliente (fora da pré-visualização).', 'warn'); return o.preview; };
    $$('[data-perfil],[data-perfil2]', ov).forEach(b => b.onclick = () => { if (soCliente()) return; fechar(); Portal.perfil(o.redraw); });
    $('[data-senha]', ov).onclick = () => { if (soCliente()) return; fechar(); Portal.senha(); };
  },
  /** dados pessoais do usuário (funcionário da empresa) — não confundir com o cadastro da empresa */
  pessoa: (preview, cli) => preview ? {} : (Session.user?.pessoa || {}),
  localFuso: () => '', // a cidade vem da consulta por IP; o fuso horário não diz a cidade com segurança
  /** registra o acesso (data/hora e cidade aproximada) ao abrir o portal */
  async acesso() {
    try { if (sessionStorage.getItem('af-acc')) return; sessionStorage.setItem('af-acc', '1'); } catch (_) {}
    Session.user = { ...Session.user, acesso: { em: new Date().toISOString(), local: Portal.localFuso() } }; Session.save();
    try { const ct = new AbortController(), t = setTimeout(() => ct.abort(), 4000), j = await (await fetch('https://ipapi.co/json/', { signal: ct.signal })).json(); clearTimeout(t);
      if (j.city) { Session.user.acesso.local = j.city + (j.region_code ? '/' + j.region_code : ''); Session.save(); } } catch (_) {}
  },
  perfil(redraw) {
    const u = Session.user, pe = u.pessoa || {};
    const m = UI.modal({ title: 'Meus dados', sub: 'Seus dados pessoais — o cadastro da empresa é mantido pelo escritório.', body: `<form class="grid-form" id="pfF">
      <div class="fld full"><label>Nome completo</label><input name="nome" value="${esc(pe.nome || '')}" required autocomplete="name"></div>
      <div class="fld"><label>Cargo / função na empresa</label><input name="cargo" value="${esc(pe.cargo || '')}" placeholder="Ex.: Gerente financeiro"></div>
      <div class="fld"><label>Telefone / WhatsApp</label><input name="tel" inputmode="tel" autocomplete="tel" value="${esc(pe.telefone || u.telefone || '')}" placeholder="(81) 99999-9999"></div>
      <div class="fld full"><label>Endereço</label><input name="end" autocomplete="street-address" value="${esc(pe.endereco || '')}" placeholder="Rua, número, bairro, cidade/UF"></div>
      <div class="fld full"><label>E-mail de acesso</label><input value="${esc(u.email)}" disabled><small class="muted">Para trocar o e-mail, fale com o escritório.</small></div></form>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="pfOk">${icon('check')} Salvar</button>` });
    $('#pfOk', m).onclick = async () => { const f = $('#pfF', m), b = $('#pfOk', m); if (!f.nome.value.trim()) return UI.toast('Informe seu nome completo.', 'warn'); b.disabled = true;
      try { const r = await api('perfilSalvar', { nome: f.nome.value, cargo: f.cargo.value, telefone: f.tel.value, endereco: f.end.value }); Session.user = { ...Session.user, nome: r.nome || Session.user.nome, telefone: r.telefone, pessoa: r }; Session.save(); UI.closeModal(); UI.toast('Dados salvos.', 'ok'); redraw(); } catch (e) { b.disabled = false; UI.toast(e.message, 'bad'); } };
  },
  senha() {
    const tem = Session.user?.temSenha !== false;
    const m = UI.modal({ title: tem ? 'Alterar senha' : 'Criar senha', body: `<form class="stack" id="psF">${tem ? '<div class="fld"><label>Senha atual</label><input name="a" type="password" autocomplete="current-password" required></div>' : ''}<div class="fld"><label>Nova senha</label><input name="n1" type="password" autocomplete="new-password" required></div><div class="fld"><label>Repita a nova senha</label><input name="n2" type="password" autocomplete="new-password" required></div><ul class="pw-rules"><li data-r="len">Pelo menos 8 caracteres</li><li data-r="let">Letras</li><li data-r="num">Números</li><li data-r="eq">As duas senhas iguais</li></ul><p class="note" id="psSt"></p></form>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="psOk">${icon('key')} Salvar senha</button>` });
    const f = $('#psF', m), chk = () => { const a = f.n1.value, b = f.n2.value, o = { len: a.length >= 8, let: /[A-Za-zÀ-ú]/.test(a), num: /\d/.test(a), eq: !!a && a === b }; $$('.pw-rules li', m).forEach(li => li.classList.toggle('ok', o[li.dataset.r])); return Object.values(o).every(Boolean); };
    f.n1.oninput = f.n2.oninput = chk;
    $('#psOk', m).onclick = async () => { const st = $('#psSt', m); if (!chk()) return st.textContent = 'A nova senha ainda não atende a todos os itens.';
      $('#psOk', m).disabled = true; st.textContent = 'Salvando…';
      try { await api('senhaDefinir', { atual: f.a?.value || '', senha: f.n1.value }); Session.user = { ...Session.user, temSenha: true }; Session.save(); UI.closeModal(); UI.toast('Senha alterada.', 'ok'); } catch (e) { st.textContent = e.message; $('#psOk', m).disabled = false; } };
  },
  draw(root, clienteId, preview) {
    const st = Portal.st, cli = DB.get('clientes', clienteId) || { nome: Session.user?.nome || '' };
    const esc0 = escritorio();
    const procs = DB.where('processos', p => (p.clienteIds || []).includes(clienteId));
    const kx = !preview && Portal.ctx(), emps = DB.where('empresas', e => e.clienteId === clienteId && (!kx?.e || e.id === kx.e.id));
    const vis = id => DB.where('movimentos', m => m.processoId === id && m.visivelCliente).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const ag = DB.where('prazos', x => procs.some(p => p.id === x.processoId) && x.visivelCliente && !x.concluido && isISO(x.data) && daysUntil(x.data) >= 0).sort((a, b) => a.data.localeCompare(b.data));
    const e0 = emps[0], pf = e0 ? Perfis.de(e0, preview) : null;
    const tabs = [...(procs.length || !emps.length ? [['processos', 'Meus processos'], ['agenda', 'Agenda']] : []), ...(e0 ? Perfis.abas(pf) : []), ['contato', 'Fale com o escritório']];
    if (!tabs.some(t => t[0] === st.tab)) { st.tab = tabs[0][0]; st.proc = null; }
    const wa = onlyDigits(esc0.whatsapp);
    let body = '';
    if (st.tab === 'processos' && st.proc) {
      const p = DB.get('processos', st.proc); const ms = vis(p.id);
      body = `<button class="link" data-back>${icon('chevL')} Meus processos</button>
      <section class="card p-proc"><div class="proc-tags">${pill(AREAS[p.area]?.nome || '')} ${pill(p.status || 'Ativo')} ${p.transito ? `<span class="pill tj">Transitado em julgado em ${esc(fmtDate(p.transito))}</span>` : ''}</div><h2 class="mono">${esc(fmtCNJ(p.numero))}</h2><p class="muted">${esc(p.classe || '')}${p.orgao ? ' · ' + esc(p.orgao) : ''}${p.comarca ? ' · ' + esc(p.comarca) : ''}</p>
        <dl class="dl cols"><dt>Parte contrária</dt><dd>${esc(p.parteContraria || '—')}</dd><dt>Fase</dt><dd>${esc(p.fase || '—')}</dd><dt>Advogado</dt><dd>${esc(p.responsavel || esc0.advogado || '—')}</dd><dt>Tribunal</dt><dd>${esc(p.tribunal || '—')}</dd></dl></section>
      <section class="card"><header><h2>Andamento do processo</h2></header>${ms.length ? `<ol class="timeline client">${ms.map(m => `<li><span class="tl-dot"></span><time>${esc(fmtDate(m.data))}</time><b class="tl-t">${esc(m.titulo)}</b>${m.explicacao ? `<p class="explain">${esc(m.explicacao)}</p>` : m.descricao ? `<p>${esc(DJEN.ehDecisao(m.titulo) ? DJEN.dispositivo(m.descricao).texto : m.descricao)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Ainda não há movimentações disponíveis.</p>'}</section>`;
    } else if (st.tab === 'processos') {
      body = procs.length ? `<div class="p-cards">${procs.map(p => { const m = vis(p.id)[0]; return `<button class="p-card" data-proc="${p.id}"><div class="p-card-h">${icon(AREAS[p.area]?.icon || 'scale')}<span>${esc(AREAS[p.area]?.nome || '')}</span>${pill(p.status || 'Ativo')}</div><b class="mono">${esc(fmtCNJ(p.numero))}</b><small>${esc(p.classe || '')}</small><div class="p-last">${m ? `<time>${esc(fmtDate(m.data))}</time> ${esc(m.titulo)}` : 'Sem movimentações ainda'}</div><span class="p-more">Ver andamento ${icon('chevR')}</span></button>`; }).join('')}</div>` : `<div class="empty">${icon('scale')}<p>Nenhum processo vinculado ao seu cadastro.</p></div>`;
    } else if (st.tab === 'agenda') {
      body = ag.length ? `<section class="card"><ul class="agenda-list">${ag.map(x => { const p = DB.get('processos', x.processoId); return `<li><div class="ag-date"><b>${fmtDate(x.data).slice(0, 5)}</b><small>${esc(x.hora || '')}</small></div><div class="ag-body"><span class="pill info">${esc(x.tipo)}</span> <b>${esc(x.descricao)}</b><small>${esc(x.local || '')} · ${esc(fmtCNJ(p?.numero))}</small></div></li>`; }).join('')}</ul></section>` : `<div class="empty">${icon('calendar')}<p>Nenhum compromisso agendado.</p></div>`;
    } else if (st.tab === 'remessa') {
      body = '<div id="pRem"></div>';
    } else if (['contratos', 'plano', 'equipe', 'diretoria'].includes(st.tab)) {
      body = '<div id="pPf"></div>';
    } else if (st.tab === 'consultoria') {
      body = emps.map(e => { const S = Consult.stats(e), ins = Consult.insights(S); return `<section class="card"><header><h2>${icon('building')} ${esc(e.fantasia || e.razao)}</h2></header>
        <div class="kpis sm">${kpi('Contratos vigentes', `${S.at.length}/${S.cs.length}`)}${kpi('Completude documental', fmtPct(S.compl))}${kpi('Conformidade', fmtPct(S.conf))}${kpi('Ações em aberto', S.achAbertos.length)}</div>
        ${ins.length ? `<ul class="ins">${ins.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <h4 class="sec">Plano de ação em aberto</h4>${S.achAbertos.length ? `<div class="table-wrap"><table class="mini"><thead><tr><th>Contrato</th><th>Achado</th><th>Risco</th><th>Recomendação</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${S.achAbertos.slice(0, 60).map(a => `<tr><td>${esc(a.contrato || '')}</td><td>${esc(a.achado || '')}</td><td>${pill(a.risco || '—')}</td><td>${esc(a.recomendacao || '')}</td><td>${esc(fmtDate(a.prazo))}</td><td>${pill(a.status || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Nenhuma ação pendente.</p>'}
        <div class="right"><button class="btn primary" data-rep="${e.id}">${icon('printer')} Relatório completo</button></div></section>`; }).join('');
    } else {
      body = `<section class="card contact"><img src="${BRAND.logoDark}" alt="" class="about-logo"><div class="caption dark">${BRAND.caption}</div>
        <p>${esc(esc0.nome || 'Amorim Firmo')}</p>
        <div class="btn-row center">${wa ? `<a class="btn primary" href="https://wa.me/55${wa}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a>` : ''}${esc0.email ? `<a class="btn ghost" href="mailto:${esc(esc0.email)}">${icon('mail')} ${esc(esc0.email)}</a>` : ''}</div>
        ${esc0.endereco ? `<p class="muted small">${esc(esc0.endereco)}</p>` : ''}</section>`;
    }
    root.innerHTML = `<header class="p-top"><button class="p-me" id="pMe" title="Meu menu"><span>${icon('menu')}</span>${Portal.ini(Portal.pessoa(preview, cli).nome || cli.nome)}</button><img src="${BRAND.logoDark}" alt="Amorim Firmo" class="p-logo"><div class="p-brand"><b>${esc(esc0.nome || 'Amorim Firmo')}</b><span class="caption dark">${BRAND.caption}</span></div><span class="sp"></span></header>
      <div class="p-hero"><span class="eyebrow">Área do cliente</span><h1>Olá${(n => n ? ', ' + esc(n.split(' ')[0]) : '')(Portal.pessoa(preview, cli).nome || (e0 ? '' : cli.nome))}!</h1><p>${e0 ? `${esc(e0.fantasia || e0.razao)} · <b>${esc(Perfis.NOMES[pf])}</b>. ${pf === 'dir' ? 'Visão estratégica da carteira de contratos.' : pf === 'ger' ? 'Contratos, plano de ação, remessa mensal e equipe.' : 'Seus contratos, pendências e a remessa mensal.'}` : 'Acompanhe aqui o andamento dos seus processos. As informações são atualizadas pelo escritório.'}</p></div>
      ${!preview && e0 && pf !== Perfis.real(e0) ? `<div class="pf-band">${icon('users')} Você está atuando como <b>${esc(Perfis.NOMES[pf])}</b> (seu perfil: ${esc(Perfis.NOMES[Perfis.real(e0)])}). <button class="link small" id="pfVolta">Voltar ao meu perfil</button></div>` : ''}
      <nav class="p-tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav>
      <main class="p-main">${body}</main>
      <footer class="p-foot">Acesso exclusivo e confidencial · ${esc(esc0.nome || 'Amorim Firmo')}<br><span class="dev-cred">Tecnologia ${DEV.nome} ©</span></footer>`;
    const redraw = () => Portal.draw(root, clienteId, preview);
    $$('[data-tab]', root).forEach(b => b.onclick = () => { st.tab = b.dataset.tab; st.proc = null; redraw(); });
    $$('[data-proc]', root).forEach(b => b.onclick = () => { st.proc = b.dataset.proc; redraw(); root.scrollTop = 0; scrollTo(0, 0); });
    $$('[data-back]', root).forEach(b => b.onclick = () => { st.proc = null; redraw(); });
    $$('[data-rep]', root).forEach(b => b.onclick = () => Report.open(DB.get('empresas', b.dataset.rep), { titulo: 'Relatório de Auditoria Contratual', secs: new Set(Report.SECOES.map(s => s[0])), resp: esc0.advogado, oab: esc0.oab, conf: true }));
    $('#pMe', root).onclick = () => Portal.menu(root, { cli, emps, procs, tabs, preview, redraw, wa, esc0 });
    $('#pfVolta', root)?.addEventListener('click', () => Perfis.atuarComo(e0, Perfis.real(e0)));
    if ($('#pRem', root)) Remessa.portal($('#pRem', root), emps, redraw);
    const pp = $('#pPf', root);
    if (pp) { if (st.tab === 'contratos') Perfis.contratos(pp, e0); else if (st.tab === 'plano') Perfis.plano(pp, e0, pf, preview, redraw); else if (st.tab === 'equipe') Perfis.equipe(pp, e0, preview); else if (st.tab === 'diretoria') Diretoria.render(pp, e0); }
  }
};

/* ---------------- INÍCIO (após a splash) ---------------- */
window.addEventListener('DOMContentLoaded', async () => {
  if (window.__afPopup) return; // janela de retorno do login do Google
  const splash = document.getElementById('splash'); const t0 = performance.now();
  if (!dominioOk()) { // cópia publicada fora dos endereços autorizados
    splash?.remove(); document.body.className = 'blocked';
    document.getElementById('root').innerHTML = `<div class="dom-lock"><div class="dl-card"><img src="brasao.png" alt="" class="dl-logo"><h1>Aplicativo protegido</h1><p>Este endereço (<b>${esc(location.hostname)}</b>) não está autorizado a executar o aplicativo do escritório Amorim Firmo.</p><p class="muted">Cópia, reprodução ou distribuição não autorizada é proibida (Lei 9.609/1998 e Lei 9.610/1998).</p><p class="dl-dev">© ${new Date().getFullYear()} ${DEV.nome} · <a href="mailto:${DEV.email}">${DEV.email}</a> · <a href="https://wa.me/${DEV.wa}" target="_blank" rel="noopener">${DEV.tel}</a></p></div></div>`;
    return;
  }
  try { await App.start(); } catch (e) { console.error(e); App.loginScreen(); }
  const wait = Math.max(0, 2300 - (performance.now() - t0));
  setTimeout(() => { splash?.classList.add('out'); setTimeout(() => splash?.remove(), 900); }, wait);
});
