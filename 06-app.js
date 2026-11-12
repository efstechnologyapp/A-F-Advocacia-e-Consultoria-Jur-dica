/* =====================================================================
   Aplicação: login, estrutura, rotas, painel geral, clientes, agenda,
   acessos e configurações
   ===================================================================== */
const BRAND = {
  logoDark: 'brasao.png', logoLight: 'brasao-claro.png',
  caption: 'Advocacia e Consultoria Jurídica'
};
const escritorio = () => DB.get('config', 'escritorio') || { id: 'escritorio', nome: 'Amorim Firmo', subtitulo: BRAND.caption };
/** nome para cabeçalhos: sem "Advocacia e Consultoria Jurídica", que já vai na legenda */
const nomeMarca = () => String(escritorio().nome || 'Amorim Firmo').replace(/[\s,–—-]*(sociedade de advogados|advocacia)(\s*(e|&)\s*consultoria(\s+jur[ií]dica)?)?\s*$/i, '').trim() || 'Amorim Firmo';
/** OAB sempre no formato "OAB/PB 33.255" */
const oabFmt = (v = escritorio().oab) => { v = String(v || '').trim(); if (!v || /oab/i.test(v)) return v; const d = onlyDigits(v), uf = (v.match(/\b([A-Z]{2})\b/) || [])[1] || ((escritorio().advogados || [])[0]?.uf || 'PB').toUpperCase(); return d ? `OAB/${uf} ${d.length > 3 ? d.slice(0, -3) + '.' + d.slice(-3) : d}` : v; };

const App = {
  pendentes: 0,
  async start() {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
    if (!Session.load()) return App.loginScreen();
    await DB.init();
    App.boot();
    if (Session.remote) DB.pull().then(() => { App.render(true); DB.flush(); }).catch(e => { if (e.code === 'AUTH') App.logout(); else UI.toast('Trabalhando com os dados guardados neste aparelho (sem conexão).', 'warn'); });
  },
  boot() {
    document.body.className = Session.isStaff ? 'staff' : 'client';
    if (!Session.isStaff) { Portal.shell(); return; }
    App.shell(); App._nav = 0; window.onhashchange = () => { App._nav++; App.render(); }; App.render();
    App.checkPendentes();
    Escritorio.check().then(() => {
      const pend = ls.get('escPend'); if (pend && Session.isAdmin) { ls.del('escPend'); if (pend.error) UI.toast('Conexão cancelada.', 'warn'); else return Escritorio.receber(pend.code, pend.state); }
      App.render(true);
      DJEN.auto();
    });
    if (!Session.remote) DJEN.auto();
  },
  async checkPendentes() {
    if (!Session.isAdmin || !Session.remote) return;
    try { const us = await api('users'); App.pendentes = us.filter(u => u.status === 'pendente').length; App.badge(); } catch { }
  },
  badge() { $$('.pend-badge').forEach(b => { b.textContent = App.pendentes; b.hidden = !App.pendentes; }); },
  async logout() { try { google.accounts.id.disableAutoSelect(); } catch { } Session.clear(); location.hash = ''; App.loginScreen(); },

  /* ---------------- LOGIN (Google + código por e-mail + autorização) ---------------- */
  loginScreen() {
    document.body.className = 'login';
    const pronto = !!(apiUrl() && CONFIG.GOOGLE_CLIENT_ID);
    document.getElementById('root').innerHTML = `
    <div class="login-wrap">
      <section class="login-brand">
        <div class="lb-inner">
          <img src="${BRAND.logoLight}" alt="Brasão Amorim Firmo" class="lb-logo">
          <div class="caption">${BRAND.caption}</div>
          <p class="lb-tag">Gestão processual, acompanhamento do cliente e auditoria de contratos em um só lugar.</p>
        </div>
        <div class="lb-foot">versão ${APP_VERSAO} · © ${new Date().getFullYear()} Amorim Firmo</div>
      </section>
      <section class="login-form">
        <div class="lf-card" id="lgCard">
          <img src="${BRAND.logoDark}" alt="" class="lf-logo-m">
          <div class="caption dark lf-cap-m">${BRAND.caption}</div>
          <div id="lgStepGoogle">
            <h1>Acesso restrito</h1>
            <p class="muted">Entre com sua conta Google. No primeiro acesso em cada aparelho, enviamos um código ao seu e-mail para confirmar que ele é seu.</p>
            <div id="gbtn" class="gbtn"></div>
            <p class="note" id="lgStatus">${pronto ? 'Carregando o login do Google…' : 'O login ainda não foi configurado: preencha o ID do cliente Google e a URL do Apps Script no arquivo <b>config.js</b> (veja CONFIGURAR-LOGIN.md).'}</p>
            ${apiUrl() ? `<button class="btn ghost block lg-cli" id="lgSemGoogle">${icon('search')} Sou cliente — consultar meus processos</button>` : ''}
          </div>
          <form id="lgStepEmail" class="stack" hidden>
            <h1>Consulte seus processos</h1>
            <p class="muted">Informe o <b>CPF</b> (ou CNPJ), o <b>telefone com DDD</b> ou o <b>e-mail</b> que você informou ao escritório. Para proteger seus dados, enviamos um código de acesso ao e-mail do seu cadastro.</p>
            <div class="fld"><label for="lgMail">CPF, telefone ou e-mail</label><input id="lgMail" required autocomplete="username" placeholder="000.000.000-00 · (83) 99999-9999 · seu@email.com"></div>
            <button class="btn primary block">${icon('mail')} Receber código no e-mail</button>
            <p class="note" id="lgCliSt"></p>
            <button type="button" class="link small" data-lgback>Sou do escritório — entrar com Google</button>
          </form>
          <form id="lgStepCode" class="stack" hidden>
            <h1 id="lgCodTit">Confirme seu e-mail</h1>
            <p class="muted" id="lgCodTxt"></p>
            <input id="lgCod" inputmode="numeric" maxlength="6" class="code-input" autocomplete="one-time-code" placeholder="000000" aria-label="Código de 6 dígitos">
            <button class="btn primary block" id="lgCodOk">${icon('key')} Confirmar e entrar</button>
            <p class="note" id="lgCodSt">Confira também a caixa de spam.</p>
            <div class="row-btns"><button type="button" class="link small" id="lgReenv">Reenviar código</button><button type="button" class="link small" data-lgback>Usar outra conta</button></div>
          </form>
          ${apiUrl() ? '' : `<div class="notice">${icon('alert')}<div><b>Servidor ainda não conectado.</b> Enquanto isso, você pode conhecer e usar o app em <b>modo local</b> (dados apenas neste navegador).</div></div>
          <button class="btn ghost block" id="lgLocal">${icon('layers')} Entrar em modo local</button>`}
        </div>
      </section>
    </div>`;
    const L = { email: '', nome: '', foto: '', idToken: null, viaGoogle: true, ref: '', ident: '' };
    const step = s => ['Google', 'Email', 'Code'].forEach(k => $('#lgStep' + k).hidden = k !== s);
    const aparelho = () => ls.get('aparelho', {});
    const entrar = async r => {
      Session.mode = 'remote'; Session.token = r.token; Session.user = { ...r.user, foto: r.user.foto || L.foto }; Session.save();
      const a = aparelho(); a[Session.user.email] = r.token; ls.set('aparelho', a);
      await DB.init(); try { await DB.pull(); } catch (e) { UI.toast(e.message, 'bad'); } App.boot(); UI.toast('Bem-vindo(a)!');
    };
    const pedirConsulta = async () => {
      const st = $('#lgCliSt'); st.textContent = 'Procurando seu cadastro…';
      try {
        const r = await api('consultaPedir', { ident: L.ident });
        L.ref = r.ref; L.email = r.destino;
        $('#lgCodTit').textContent = r.nome ? `Olá, ${r.nome}!` : 'Confirme seu acesso';
        $('#lgCodTxt').innerHTML = `Enviamos um código de 6 dígitos para o e-mail do seu cadastro, <b>${esc(r.destino)}</b>. Digite-o abaixo para ver seus processos.`;
        $('#lgCod').disabled = false; $('#lgCodOk').disabled = false; $('#lgCodSt').textContent = `O código vale por ${r.validadeMin || 10} minutos; confira também a caixa de spam.`; step('Code'); $('#lgCod').focus(); st.textContent = '';
      } catch (e) { st.textContent = e.message; if (!$('#lgStepEmail').hidden) return; step('Email'); }
    };
    const pedirCodigo = async () => {
      if (L.ref) return pedirConsulta();
      const st = $('#lgCodSt'); st.textContent = 'Enviando o código para o seu e-mail…';
      $('#lgCodTxt').innerHTML = `Enviamos um código de 6 dígitos para <b>${esc(L.email)}</b>. Digite-o abaixo para liberar o acesso.`;
      $('#lgCodTit').textContent = 'Confirme seu e-mail'; $('#lgCod').disabled = false; $('#lgCodOk').disabled = false; step('Code');
      try {
        const r = await api(L.viaGoogle ? 'login' : 'requestCode', { email: L.email, idToken: L.idToken, nome: L.nome, foto: L.foto, aparelho: aparelho()[L.email] || '' });
        if (r.status === 'sessao') return entrar(r);
        if (r.status === 'pendente' || r.status === 'bloqueado') {
          $('#lgCodTit').textContent = r.status === 'pendente' ? 'Aguardando autorização' : 'Acesso bloqueado';
          $('#lgCodTxt').innerHTML = r.status === 'pendente' ? `Este app só pode ser usado com autorização do administrador. Seu pedido de acesso foi registrado para <b>${esc(L.email)}</b> e o administrador foi avisado por e-mail.` : `O acesso de <b>${esc(L.email)}</b> foi bloqueado pelo administrador.`;
          $('#lgCod').disabled = true; $('#lgCodOk').disabled = true; st.textContent = r.status === 'pendente' ? '⏳ Assim que for autorizado, entre novamente.' : '⛔ Fale com o escritório.';
          $('#lgReenv').textContent = 'Verificar de novo'; return;
        }
        st.textContent = `Código enviado. Ele vale por ${r.validadeMin || 10} minutos; confira também a caixa de spam.`; $('#lgCod').focus();
      } catch (e) { st.textContent = e.message; }
    };
    const onGoogle = resp => {
      L.idToken = resp.credential; L.viaGoogle = true;
      try { const p = JSON.parse(decodeURIComponent(escape(atob(resp.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); L.email = String(p.email || '').toLowerCase(); L.nome = p.name || ''; L.foto = p.picture || ''; if (!p.email_verified) { $('#lgStatus').textContent = 'Essa conta Google não tem e-mail verificado. Use outra conta.'; return; } } catch { }
      pedirCodigo();
    };
    if (pronto) {
      const ini = () => { try { google.accounts.id.initialize({ client_id: CONFIG.GOOGLE_CLIENT_ID, callback: onGoogle, auto_select: true, ux_mode: 'popup' }); google.accounts.id.renderButton($('#gbtn'), { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'signin_with', locale: 'pt-BR', width: 280 }); $('#lgStatus').textContent = 'Somente pessoas autorizadas pelo administrador conseguem entrar.'; } catch { $('#lgStatus').textContent = 'Não foi possível carregar o login do Google.'; } };
      if (window.google?.accounts?.id) ini();
      else { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = ini; s.onerror = () => $('#lgStatus').textContent = 'Não foi possível carregar o login do Google. Verifique a internet e recarregue a página.'; document.head.appendChild(s); }
    }
    $('#lgCod').oninput = e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    $('#lgStepCode').onsubmit = async e => {
      e.preventDefault(); const st = $('#lgCodSt'), cod = $('#lgCod').value;
      if (cod.length !== 6) { st.textContent = 'Digite os 6 dígitos do código.'; return; }
      $('#lgCodOk').disabled = true; st.textContent = 'Conferindo…';
      try { await entrar(L.ref ? await api('consultaVerificar', { ref: L.ref, code: cod }) : await api('verifyCode', { email: L.email, code: cod })); } catch (err) { st.textContent = err.message; $('#lgCodOk').disabled = false; }
    };
    $('#lgReenv').onclick = pedirCodigo;
    $$('[data-lgback]').forEach(b => b.onclick = () => { try { google.accounts.id.disableAutoSelect(); } catch { } L.ref = ''; step('Google'); });
    $('#lgSemGoogle') && ($('#lgSemGoogle').onclick = () => step('Email'));
    $('#lgStepEmail').onsubmit = e => { e.preventDefault(); L.ident = $('#lgMail').value.trim(); L.viaGoogle = false; L.idToken = null; if (L.ident) pedirConsulta(); };
    // link público (Instagram/Linktree): …/#/consulta abre direto a consulta do cliente
    if (/^#\/?consulta/.test(location.hash) && apiUrl()) step('Email');
    $('#lgLocal') && ($('#lgLocal').onclick = async () => {
      Session.mode = 'local'; Session.token = null; Session.user = { email: 'local', nome: 'Administrador', papel: 'admin' }; Session.save();
      await DB.init(); App.boot();
    });
  },

  /* ---------------- ESTRUTURA: sidebar + topo ---------------- */
  shell() {
    const u = Session.user;
    const foto = u.foto ? `<img class="avatar img" src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((u.nome || u.email)[0].toUpperCase())}</span>`;
    document.getElementById('root').innerHTML = `
    <div class="app">
      <aside class="side" id="side">
        <button class="icon-btn side-close" id="btnClose" aria-label="Fechar menu">${icon('x')}</button>
        <a class="side-brand" href="#/painel"><img src="${BRAND.logoLight}" alt="Amorim Firmo"><div class="caption">${BRAND.caption}</div></a>
        <div class="side-profile">${foto}<div><b>${esc(u.nome || 'Usuário')}</b><small>${esc(u.email === 'local' ? 'modo local' : u.email)}</small><span class="role">${u.papel === 'admin' ? 'Administrador' : 'Equipe'}</span></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="side-foot">
          <div id="conexSlot"></div>
          ${Session.isAdmin ? `<a href="#/gestao" class="side-btn" id="lnkGestao">${icon('settings')}<span>Gestão do App</span><em class="pend-badge" hidden>0</em></a>` : ''}
          <button class="side-btn danger" id="btnOut">${icon('logout')}<span>Sair</span></button>
          <div class="side-ver">versão ${APP_VERSAO} — Amorim Firmo<br><button class="link tiny" id="btnSobre">Sobre o App</button></div>
        </div>
      </aside>
      <div class="scrim" id="scrim"></div>
      <div class="main">
        <header class="top">
          <button class="menu-btn" id="btnMenu" aria-label="Abrir o menu">${icon('menu')}${u.foto ? `<img src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer">` : ''}<em class="pend-badge" hidden>0</em></button>
          <img src="${BRAND.logoDark}" class="top-logo" alt="Amorim Firmo">
          <div class="crumbs" id="crumbs"></div>
          <span class="sp"></span>
          <div class="gsearch">${icon('search')}<input id="gq" type="search" placeholder="Buscar processo, cliente, contrato…" autocomplete="off"><div class="gresults" id="gres" hidden></div></div>
          <button id="syncBadge" class="sync" title="Sincronizar agora"></button>
        </header>
        <main id="view" class="view"></main>
      </div>
    </div>`;
    $('#btnOut').onclick = async () => { if (await UI.confirm('Deseja sair do sistema?', 'Sair', false)) App.logout(); };
    $('#btnMenu').onclick = () => document.body.classList.add('side-open');
    $('#btnClose').onclick = $('#scrim').onclick = () => document.body.classList.remove('side-open');
    $('#btnSobre').onclick = () => App.sobre();
    $('#syncBadge').onclick = async () => { if (!Session.remote) return UI.toast('Modo local: os dados ficam apenas neste navegador. Use Gestão do App › Sistema › Backup para guardar uma cópia.', 'warn', 6000); try { await DB.flush(); await DB.pull(); App.render(true); UI.toast('Dados atualizados.'); } catch (e) { UI.toast(e.message, 'bad'); } };
    App.globalSearch(); UI.syncBadge(); App.badge(); Escritorio.badge();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => $$('[data-chart]').length && App.render(true), 250); });
  },
  sobre() {
    UI.modal({ title: 'Sobre o App', sub: `Amorim Firmo · versão ${APP_VERSAO}`, body: `<div class="about"><img src="${BRAND.logoDark}" alt="" class="about-logo"><div class="caption dark">${BRAND.caption}</div>
      <p>Sistema de gestão do escritório: processos judiciais com acompanhamento pelo cliente e consultoria jurídica com auditoria de contratos, indicadores e relatórios.</p>
      <ul class="plain checks">${FUNCIONALIDADES.map(f => `<li>${icon('check')} ${esc(f)}</li>`).join('')}</ul>
      <p class="muted small">Dados protegidos conforme a LGPD: acesso apenas a pessoas autorizadas, cada cliente vê somente o que lhe diz respeito, e toda alteração fica registrada na trilha de auditoria.</p></div>` });
  },
  nav(route) {
    const cnt = a => DB.where('processos', p => p.area === a && p.status !== 'Encerrado').length;
    const item = (href, ic, label, badge = '') => `<a href="#${href}" class="${route === href || (href !== '/painel' && route.startsWith(href)) ? 'on' : ''}">${icon(ic)}<span>${label}</span>${badge !== '' ? `<em>${badge}</em>` : ''}</a>`;
    $('#nav').innerHTML = `
      ${item('/painel', 'home', 'Visão geral')}
      <div class="nav-h">Judicial</div>
      ${item('/judicial/todos', 'layers', 'Todos os processos', DB.where('processos', p => p.status !== 'Encerrado').length || '')}
      ${Object.entries(AREAS).map(([k, a]) => item('/judicial/' + k, a.icon, a.nome, cnt(k) || '')).join('')}
      ${item('/atendimentos', 'briefcase', 'Atendimentos', DB.where('atendimentos', x => !/Ajuizado|Não prosseguiu/.test(x.status || '')).length || '')}
      ${item('/agenda', 'calendar', 'Agenda e prazos', DB.where('prazos', p => !p.concluido && daysUntil(p.data) !== null && daysUntil(p.data) <= 7).length || '')}
      <div class="nav-h">Consultoria jurídica</div>
      ${item('/empresas', 'building', 'Empresas', DB.all('empresas').length || '')}
      ${DB.all('achados').length ? item('/achados', 'alert', 'Achados de auditoria', DB.where('achados', x => achadoAberto(x) && /alto|cr[ií]tico/i.test(x.risco || '')).length || '') : ''}
      ${DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao)).map(e => `<a href="#/empresa/${e.id}" class="sub ${route.startsWith('/empresa/' + e.id) ? 'on' : ''}"><span>${esc(e.fantasia || e.razao)}</span></a>`).join('')}
      <div class="nav-h">Cadastros</div>
      ${item('/clientes', 'users', 'Clientes', DB.all('clientes').length || '')}`;
    $('#lnkGestao')?.classList.toggle('on', route.startsWith('/gestao'));
  },
  /** páginas de primeiro nível (menu) não têm "Voltar"; as de detalhe têm */
  TOPO: /^#?\/?(painel|judicial\/[a-z]+|agenda|atendimentos|clientes|empresas|achados|consulta|gestao(\/[a-z]+)?)?$/,
  voltar(parts) {
    if (App._nav > 0) { App._nav -= 2; history.back(); return; }
    const pai = [...parts].reverse().slice(1).find(p => p.href); location.hash = '#' + (pai ? pai.href : '/painel');
  },
  crumbs(parts) {
    const topo = App.TOPO.test(location.hash);
    $('#crumbs').innerHTML = (topo ? '' : `<button class="back-btn" id="btnVoltar" title="Voltar à página anterior">${icon('chevL')}<span>Voltar</span></button>`) + parts.map((p, i) => i < parts.length - 1 && p.href ? `<a href="#${p.href}">${esc(p.t)}</a>` : `<b>${esc(p.t)}</b>`).join(`<span class="sep">/</span>`);
    $('#btnVoltar')?.addEventListener('click', () => App.voltar(parts));
  },
  render(keepScroll) {
    if (!Session.isStaff) return Portal.render();
    const route = (location.hash || '#/painel').slice(1).split('?')[0] || '/painel';
    const [, a, b, c] = route.split('/');
    if (a === 'consulta') { history.replaceState(null, '', '#/painel'); return App.render(); } // link do cliente aberto por alguém da equipe
    App.nav(route); document.body.classList.remove('side-open'); Tip.hide();
    const v = $('#view'); const y = scrollY;
    try {
      if (Session.remote && Escritorio.st && !Escritorio.st.conectado && a !== 'gestao') { Escritorio.gate(v); UI.syncBadge(); return; }
      if (a === 'painel' || !a) Views.painel(v);
      else if (a === 'judicial') Judicial.list(v, b || 'todos');
      else if (a === 'processo') Judicial.detail(v, b);
      else if (a === 'agenda') Views.agenda(v);
      else if (a === 'atendimentos') Atend.list(v);
      else if (a === 'atendimento') Atend.detail(v, b, c || 'caso');
      else if (a === 'achados') Achados.view(v);
      else if (a === 'empresas') Consult.list(v);
      else if (a === 'empresa') Consult.workspace(v, b, c || 'painel');
      else if (a === 'clientes') Views.clientes(v);
      else if (a === 'gestao' && Session.isAdmin) Gestao.render(v, b || 'info');
      else Views.painel(v);
    } catch (e) { console.error(e); v.innerHTML = `<div class="empty">${icon('alert')}<p>Erro ao abrir esta tela: ${esc(e.message)}</p></div>`; }
    if (keepScroll) scrollTo(0, y); else scrollTo(0, 0);
    UI.syncBadge();
  },
  globalSearch() {
    const q = $('#gq'), res = $('#gres');
    q.oninput = () => {
      const t = norm(q.value); if (t.length < 2) { res.hidden = true; return; }
      const out = [];
      DB.all('processos').forEach(p => { const cl = clienteNomes(p); if (norm(p.numero + ' ' + fmtCNJ(p.numero) + ' ' + p.classe + ' ' + cl + ' ' + p.parteContraria).includes(t)) out.push({ h: '#/processo/' + p.id, i: AREAS[p.area]?.icon || 'scale', t: fmtCNJ(p.numero), s: cl || p.classe }); });
      DB.all('clientes').forEach(c => { if (norm(c.nome + ' ' + c.doc + ' ' + c.email).includes(t)) out.push({ h: '#/clientes?c=' + c.id, i: 'user', t: c.nome, s: fmtDoc(c.doc) }); });
      DB.all('empresas').forEach(e => { if (norm(e.razao + ' ' + e.fantasia + ' ' + e.cnpj).includes(t)) out.push({ h: '#/empresa/' + e.id, i: 'building', t: e.fantasia || e.razao, s: fmtDoc(e.cnpj) }); });
      DB.all('contratos').forEach(c => { if (norm(c.codigo + ' ' + c.unidade + ' ' + c.tomador + ' ' + c.numero + ' ' + c.grupo).includes(t)) out.push({ h: `#/empresa/${c.empresaId}/contratos?k=${c.id}`, i: 'file', t: c.codigo + ' · ' + (c.unidade || c.grupo || ''), s: c.tomador }); });
      res.innerHTML = out.slice(0, 12).map(o => `<a href="${o.h}">${icon(o.i)}<div><b>${esc(o.t)}</b><small>${esc(o.s || '')}</small></div></a>`).join('') || '<div class="muted small pad">Nada encontrado.</div>';
      res.hidden = false;
    };
    q.onblur = () => setTimeout(() => res.hidden = true, 200);
    res.onclick = () => { q.value = ''; res.hidden = true; };
  }
};
const FUNCIONALIDADES = [
  'Processos judiciais por área (Cível, Penal, Administrativo, Previdenciário e Trabalhista)',
  'Validação do número CNJ e identificação automática do tribunal',
  'Cadastro de processos pelos arquivos: a IA lê petições, decisões ou os autos, preenche o cadastro (partes, cliente, vara, classe, valor, movimentações, audiências e prazos) e guarda os arquivos no Drive do escritório por área',
  'Movimentações importadas do DataJud/CNJ, com sincronização diária automática',
  'Agenda de prazos, audiências e compromissos, com alertas',
  'Portal do cliente: acesso próprio e restrito, só aos próprios processos e às movimentações liberadas',
  'Aviso por e-mail ao cliente quando há nova movimentação (opcional por processo)',
  'Consultoria jurídica: empresas, contratos e auditoria em 10 abas (obrigações, mão de obra, materiais, financeiro, medições, indicadores, achados, documentos e aditivos)',
  '“Juntar documentos”: arraste contratos, aditivos e planilhas — o app guarda no Drive, lê com IA, liga ao contrato certo e sugere o preenchimento',
  'Intimações do DJEN pela OAB dos advogados do escritório, consultadas sozinhas todo dia: lançadas nos processos, e os processos ainda não cadastrados aparecem para cadastrar com um clique',
  'Cadastro de empresas e clientes pelo CNPJ, com dados da Receita Federal, ou direto pelos documentos',
  'Importação e exportação no formato da planilha de auditoria (Excel)',
  'Painel com evolução de receitas, custos, tributos, previdência, admissões e desligamentos',
  'Visão 360º do contrato e índice de completude documental',
  'Relatório de auditoria pronto para impressão/PDF com brasão do escritório',
  'Login com Google, código por e-mail e autorização prévia do administrador',
  'Sincronização entre aparelhos e funcionamento sem internet (PWA)',
  'Trilha de auditoria: quem incluiu, alterou ou excluiu cada dado'
];
/* ---------------- TELAS GERAIS ---------------- */
function kpi(label, value, sub = '', tone = '', href = '') {
  const tag = href ? 'a' : 'div';
  return `<${tag} class="kpi ${tone}" ${href ? `href="${href}"` : ''}><span class="kpi-l">${label}</span><span class="kpi-v">${value}</span>${sub ? `<span class="kpi-s">${sub}</span>` : ''}</${tag}>`;
}
const clienteNomes = p => (p.clienteIds || []).map(id => DB.get('clientes', id)?.nome).filter(Boolean).join(', ');
const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
const contratoAtivo = c => !/encerrad|rescindid|extint/i.test(c.status || '') && !/encerrad/i.test(c.grupo || '') && isISO(c.fim) && daysUntil(c.fim) >= 0;
const semVigencia = c => !isISO(c.fim) && !/encerrad|rescindid|extint/i.test((c.status || '') + (c.grupo || ''));
const achadoAberto = a => !/conclu|validad|n[aã]o aplic/i.test(a.status || '');

const Views = {
  painel(v) {
    App.crumbs([{ t: 'Visão geral' }]);
    const procs = DB.where('processos', p => p.status !== 'Encerrado');
    const prazos = DB.where('prazos', p => !p.concluido && isISO(p.data)).sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));
    const prox7 = prazos.filter(p => daysUntil(p.data) <= 7);
    const atras = prazos.filter(p => daysUntil(p.data) < 0);
    const venc90 = DB.where('contratos', c => isISO(c.fim) && daysUntil(c.fim) >= 0 && daysUntil(c.fim) <= 90);
    const achAlt = DB.where('achados', a => achadoAberto(a) && /alto|cr[ií]tico/i.test(a.risco || ''));
    const movs = DB.all('movimentos').sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 8);
    const esc0 = escritorio();
    const empresas = DB.all('empresas'), djPend = DJEN.pendentes().length;
    let aba = 'jud'; try { aba = localStorage.getItem('af-painel-aba') || 'jud'; } catch (_) {}
    const jud = `
    <div class="pn-sec jud"><h2>${icon('scale')} Judicial</h2></div>
    <div class="pn-btns"><button class="btn ghost" id="nProc">${icon('plus')} Novo processo</button><button class="btn ghost" id="nProcDocs">${icon('upload')} Processo pelos arquivos</button></div>
    <div class="kpis">
      ${kpi('Processos em andamento', procs.length, Object.entries(AREAS).map(([k, a]) => [a.nome, procs.filter(p => p.area === k).length]).filter(x => x[1]).map(x => x.join(' ')).join(' · ') || 'nenhum', '', '#/judicial/todos')}
      ${kpi('Compromissos em 7 dias', prox7.length, atras.length ? `<b class="t-bad">${atras.length} em atraso</b>` : 'nenhum em atraso', atras.length ? 'bad' : '', '#/agenda')}
      ${kpi('Intimações novas (DJEN)', djPend, djPend ? '<u>revisar e cadastrar</u>' : 'nenhum processo novo', djPend ? 'warn' : '', djPend ? '#/painel?dj=1' : '')}
    </div>
    <section class="card"><header><h2>${icon('calendar')} Próximos compromissos</h2><a href="#/agenda" class="link">Ver agenda</a></header>
      ${prazos.length ? `<ul class="agenda-list">${prazos.slice(0, 7).map(Views.agendaItem).join('')}</ul>` : `<div class="empty sm">${icon('calendar')}<p>Nenhum prazo ou audiência cadastrado.</p></div>`}</section>
    ${DJEN.cardHtml()}
    <div class="grid2">
      <section class="card"><header><h2>${icon('scale')} Processos por área</h2></header>${hbarHtml(Object.entries(AREAS).map(([k, a]) => ({ label: a.nome, value: procs.filter(p => p.area === k).length, color: 'var(--s1)' })).filter(x => x.value), v => String(v))}</section>
      <section class="card"><header><h2>${icon('history')} Últimas movimentações</h2></header>
        ${movs.length ? `<ul class="feed">${movs.map(m => { const p = DB.get('processos', m.processoId); return `<li><a href="#/processo/${m.processoId}"><time>${fmtDate(m.data)}</time><div><b>${esc(m.titulo)}</b><small>${esc(p ? fmtCNJ(p.numero) + ' · ' + clienteNomes(p) : '')}</small></div>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : ''}</a></li>`; }).join('')}</ul>` : `<div class="empty sm">${icon('history')}<p>As movimentações dos processos aparecerão aqui.</p></div>`}</section>
    </div>`;
    const con = `
    <div class="pn-sec con"><h2>${icon('building')} Consultoria</h2></div>
    <div class="pn-btns"><button class="btn primary" id="nEmp">${icon('building')} Nova empresa</button></div>
    <div class="kpis">
      ${kpi('Empresas em consultoria', empresas.length, esc(empresas.map(e => e.sigla || (e.fantasia || e.razao || '').split(' ')[0]).slice(0, 5).join(' · ')) || 'nenhuma', '', '#/empresas')}
      ${kpi('Contratos auditados', DB.all('contratos').length, `nas ${empresas.length} empresa(s)`, '', '#/empresas')}
      ${kpi('Contratos vencendo (90 dias)', venc90.length, venc90.length ? '<u>ver lista</u>' : 'renovação ou encerramento', venc90.length ? 'warn' : '', venc90.length ? '#/painel?v90=1' : '')}
      ${kpi('Achados de risco alto', achAlt.length, achAlt.length ? 'em aberto · <u>ver e resolver</u>' : 'em aberto nos planos de ação', achAlt.length ? 'bad' : '', '#/achados')}
    </div>
    <section class="card"><header><h2>${icon('alert')} Alertas da consultoria</h2></header>${Views.alertasConsultoria()}</section>`;
    v.innerHTML = `
    <div class="page-h"><div><span class="eyebrow">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>${saudacao()}, ${esc((Session.user.nome || '').split(' ')[0] || 'Dr.')}</h1><p class="muted">Panorama do escritório ${esc(esc0.nome || 'Amorim Firmo')}.</p></div></div>
    <div class="pn-tabs"><button type="button" data-aba="jud" class="${aba === 'jud' ? 'on' : ''}">${icon('scale')} Judicial</button><button type="button" data-aba="con" class="${aba === 'con' ? 'on' : ''}">${icon('building')} Consultoria</button></div>
    ${aba === 'con' ? con : jud}`;
    $$('[data-aba]', v).forEach(b => b.onclick = () => { try { localStorage.setItem('af-painel-aba', b.dataset.aba); } catch (_) {} App.render(true); });
    $$('a[href="#/painel?dj=1"]', v).forEach(a => a.onclick = ev => { ev.preventDefault(); DJEN.revisarPendentes(); });
    $$('a[href="#/painel?v90=1"]', v).forEach(a => a.onclick = ev => { ev.preventDefault(); Consult.vencLista(null, venc90, null, 90); });
    if (aba === 'jud') {
      DJEN.bindCard(v);
      $('#nProc').onclick = () => Judicial.edit(null, 'civil');
      $('#nProcDocs').onclick = () => JudDocs.open();
      $$('[data-done]', v).forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); Views.toggleDone(b.dataset.done); });
    } else $('#nEmp').onclick = () => Consult.editEmpresa(null);
  },
  alertasConsultoria(empresaId) {
    const items = [];
    DB.where('contratos', c => (!empresaId || c.empresaId === empresaId) && isISO(c.fim)).forEach(c => {
      const d = daysUntil(c.fim), e = DB.get('empresas', c.empresaId);
      if (d >= 0 && d <= 90) items.push({ k: d <= 30 ? 'bad' : 'warn', d, t: `${c.codigo} vence em ${d} dia(s)`, s: `${c.unidade || c.tomador || ''} · ${e ? (e.fantasia || e.razao) : ''}`, h: `#/empresa/${c.empresaId}/contratos?k=${c.id}` });
      else if (d < 0 && d > -120 && !/encerrad/i.test((c.status || '') + (c.grupo || ''))) items.push({ k: 'bad', d, t: `${c.codigo} com vigência expirada há ${-d} dia(s)`, s: 'Confirmar prorrogação, novo contrato ou encerramento', h: `#/empresa/${c.empresaId}/contratos?k=${c.id}` });
    });
    DB.where('achados', a => (!empresaId || a.empresaId === empresaId) && achadoAberto(a) && isISO(a.prazo) && daysUntil(a.prazo) < 0).forEach(a => items.push({ k: 'bad', d: daysUntil(a.prazo), t: `Ação ${a.codigo || ''} com prazo vencido`, s: a.achado, h: `#/empresa/${a.empresaId}/achados` }));
    if (!items.length) return `<div class="empty sm">${icon('check')}<p>Nenhum alerta no momento.</p></div>`;
    items.sort((a, b) => a.d - b.d);
    return `<ul class="alerts">${items.slice(0, 8).map(i => `<li class="${i.k}"><a href="${i.h}">${icon('alert')}<div><b>${esc(i.t)}</b><small>${esc(String(i.s || '').slice(0, 110))}</small></div></a></li>`).join('')}</ul>${items.length > 8 ? `<p class="muted small">+ ${items.length - 8} alerta(s)</p>` : ''}`;
  },
  agendaItem(p) {
    const proc = DB.get('processos', p.processoId), d = daysUntil(p.data);
    const when = d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : d < 0 ? `${-d}d atrás` : `em ${d}d`;
    return `<li class="${p.concluido ? 'done' : d < 0 ? 'late' : d <= 2 ? 'soon' : ''}"><a href="${proc ? '#/processo/' + proc.id : '#/agenda'}"><div class="ag-date"><b>${fmtDate(p.data).slice(0, 5)}</b><small>${esc(p.hora || '')}</small></div><div class="ag-body"><span class="pill ${p.tipo === 'Prazo' ? 'serious' : p.tipo === 'Audiência' ? 'info' : 'neutral'}">${esc(p.tipo)}</span> <b>${esc(p.descricao)}</b><small>${proc ? esc(fmtCNJ(proc.numero) + ' · ' + clienteNomes(proc)) : ''}</small></div><span class="ag-when">${p.concluido ? 'concluído' : when}</span><button class="icon-btn sm" data-done="${p.id}" title="${p.concluido ? 'Reabrir' : 'Marcar como concluído'}">${icon('check')}</button></a></li>`;
  },
  async toggleDone(id) { const p = DB.get('prazos', id); if (!p) return; p.concluido = !p.concluido; await DB.save('prazos', p); App.render(true); },
  agenda(v) {
    App.crumbs([{ t: 'Judicial' }, { t: 'Agenda e prazos' }]);
    const st = Views._ag = Views._ag || { show: 'abertos', tipo: '' };
    let list = DB.all('prazos').filter(p => isISO(p.data));
    if (st.show === 'abertos') list = list.filter(p => !p.concluido); else if (st.show === 'concluidos') list = list.filter(p => p.concluido);
    if (st.tipo) list = list.filter(p => p.tipo === st.tipo);
    list.sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')) * (st.show === 'concluidos' ? -1 : 1));
    const groups = {}; list.forEach(p => { const k = p.data.slice(0, 7); (groups[k] = groups[k] || []).push(p); });
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Judicial</span><h1>Agenda e prazos</h1><p class="muted">Prazos processuais, audiências e compromissos de todos os processos.</p></div><div class="actions"><button class="btn primary" id="nAg">${icon('plus')} Novo compromisso</button></div></div>
    <div class="seg-tabs">${[['abertos', 'Em aberto'], ['concluidos', 'Concluídos'], ['todos', 'Todos']].map(([k, l]) => `<button class="${st.show === k ? 'on' : ''}" data-show="${k}">${l}</button>`).join('')}<select id="agTipo"><option value="">Todos os tipos</option>${SCHEMAS.prazos.fields[0].opts.map(o => `<option ${st.tipo === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>
    ${Object.keys(groups).length ? Object.entries(groups).map(([k, arr]) => `<section class="card"><header><h2>${MESES[+k.slice(5) - 1].replace(/^./, c => c.toUpperCase())} de ${k.slice(0, 4)}</h2><span class="muted small">${arr.length} compromisso(s)</span></header><ul class="agenda-list">${arr.map(Views.agendaItem).join('')}</ul></section>`).join('') : `<div class="empty">${icon('calendar')}<p>Nenhum compromisso ${st.show === 'abertos' ? 'em aberto' : ''}.</p></div>`}`;
    $$('[data-show]', v).forEach(b => b.onclick = () => { st.show = b.dataset.show; App.render(); });
    $('#agTipo').onchange = e => { st.tipo = e.target.value; App.render(); };
    $$('[data-done]', v).forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); Views.toggleDone(b.dataset.done); });
    $('#nAg').onclick = () => Judicial.editPrazo(null, null);
  },
  clientes(v) {
    App.crumbs([{ t: 'Cadastros' }, { t: 'Clientes' }]);
    const rows = DB.all('clientes').map(c => ({ ...c, _proc: DB.where('processos', p => (p.clienteIds || []).includes(c.id)).length }));
    const sc = { fields: [...SCHEMAS.clientes.fields, F('_proc', 'Processos', 'num')] };
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Cadastros</span><h1>Clientes</h1><p class="muted">Pessoas e empresas atendidas. O e-mail cadastrado é usado para o acesso ao portal do cliente.</p></div><div class="actions"><button class="btn primary" id="nCli">${icon('plus')} Novo cliente</button></div></div><section class="card flush" id="tbl"></section>`;
    dataTable($('#tbl'), { id: 'clientes', coll: 'clientes', rows, schema: sc, cols: ['nome', 'tipo', 'doc', 'email', 'telefone', '_proc'], onOpen: c => Views.clienteDetail(c.id), emptyMsg: 'Cadastre o primeiro cliente.' });
    $('#nCli').onclick = () => UI.editRecord('clientes', null);
    const q = new URLSearchParams(location.hash.split('?')[1] || ''); if (q.get('c')) Views.clienteDetail(q.get('c'));
  },
  clienteDetail(id) {
    const c = DB.get('clientes', id); if (!c) return;
    const procs = DB.where('processos', p => (p.clienteIds || []).includes(id));
    const emps = DB.where('empresas', e => e.clienteId === id);
    const m = UI.modal({
      title: c.nome, sub: `${esc(c.tipo || '')} ${c.doc ? '· ' + esc(fmtDoc(c.doc)) : ''}`, wide: true,
      body: `<div class="detail-grid"><div><span class="lbl">E-mail</span>${esc(c.email || '—')}</div><div><span class="lbl">Telefone</span>${esc(c.telefone || '—')}</div><div class="full"><span class="lbl">Endereço</span>${esc(c.endereco || '—')}</div></div>
      <h4 class="sec">Processos (${procs.length})</h4>${procs.length ? `<ul class="plain">${procs.map(p => `<li><a href="#/processo/${p.id}" data-close>${icon(AREAS[p.area]?.icon || 'scale')} <span class="mono">${esc(fmtCNJ(p.numero))}</span> · ${esc(p.classe || AREAS[p.area]?.nome || '')} ${pill(p.status || 'Ativo')}</a></li>`).join('')}</ul>` : '<p class="muted small">Nenhum processo vinculado.</p>'}
      ${emps.length ? `<h4 class="sec">Consultoria</h4><ul class="plain">${emps.map(e => `<li><a href="#/empresa/${e.id}" data-close>${icon('building')} ${esc(e.razao)}</a></li>`).join('')}</ul>` : ''}
      <div class="notice soft">${icon('key')}<div><b>Portal do cliente.</b> ${c.email ? `Ao conceder acesso, ${esc(c.email)} poderá entrar com código enviado por e-mail e ver apenas os próprios processos (somente as movimentações marcadas como visíveis).` : 'Cadastre um e-mail para conceder acesso.'}</div></div>`,
      foot: `<button class="btn ghost" id="cEdit">${icon('edit')} Editar</button><button class="btn ghost" id="cPrev">${icon('eye')} Ver como o cliente</button><button class="btn ghost" id="cAt">${icon('briefcase')} Novo atendimento</button><span class="sp"></span>${c.email ? `<button class="btn primary" id="cAcc">${icon('key')} Conceder acesso ao portal</button>` : ''}`
    });
    $('#cEdit', m).onclick = () => UI.editRecord('clientes', c);
    $('#cPrev', m).onclick = () => { UI.closeModal(); Portal.preview(id); };
    $('#cAcc', m)?.addEventListener('click', () => Views.grantAccess(c));
    $('#cAt', m).onclick = () => Atend.novo(c.id);
  },
  async grantAccess(c) {
    if (!Session.remote) return UI.toast('Disponível após conectar o servidor (Apps Script). No modo local, use “Ver como o cliente”.', 'warn', 6000);
    try { await api('userSave', { user: { email: c.email.toLowerCase(), nome: c.nome, papel: 'cliente', clienteId: c.id, status: 'autorizado' }, invite: true, appUrl: location.origin + location.pathname }); UI.closeModal(); UI.toast('Acesso concedido. O cliente recebeu um e-mail com as instruções.'); }
    catch (e) { UI.toast(e.message, 'bad'); }
  },
};

/* =====================================================================
   GESTÃO DO APP (administrador) — como no Custódia Digital
   abas: Informações · Usuários · Sistema · Auditoria
   ===================================================================== */
const Gestao = {
  users: null, log: null,
  render(v, tab) {
    App.crumbs([{ t: 'Gestão do App' }]);
    const tabs = [['info', 'Informações', 'chart'], ['usuarios', 'Usuários', 'users'], ['sistema', 'Sistema', 'settings'], ['auditoria', 'Auditoria', 'history']];
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Administração</span><h1>Gestão do App</h1><p class="muted">Informações do sistema, autorização de acessos, conexões e trilha de auditoria.</p></div></div>
      <div class="tabs">${tabs.map(([k, l, i]) => `<a href="#/gestao/${k}" class="${tab === k ? 'on' : ''}">${icon(i)}<span>${l}</span>${k === 'usuarios' ? '<em class="pend-badge" hidden>0</em>' : ''}</a>`).join('')}</div>
      <div id="gBody"></div>`;
    App.badge();
    Gestao[tab] ? Gestao[tab]($('#gBody')) : Gestao.info($('#gBody'));
  },
  info(el) {
    const n = c => DB.all(c).length;
    const audit = AUDIT.reduce((s, c) => s + n(c), 0);
    el.innerHTML = `<div class="grid2">
      <section class="card"><header><h2>${icon('file')} Dados do app</h2></header>
        <dl class="dl"><dt>Nome</dt><dd>Amorim Firmo — ${BRAND.caption}</dd><dt>Versão</dt><dd>${APP_VERSAO} (${VERSOES[0].data})</dd>
        <dt>Endereço</dt><dd>${esc(location.origin + location.pathname)}</dd>
        <dt>Armazenamento</dt><dd>${Session.remote ? 'Servidor Google (Apps Script + Planilha + Drive), sincronizado entre aparelhos' : 'Modo local — somente neste navegador'}</dd>
        <dt>Login</dt><dd>${CONFIG.GOOGLE_CLIENT_ID ? 'Google + código por e-mail + autorização' : 'não configurado (config.js)'}</dd></dl></section>
      <section class="card"><header><h2>${icon('chart')} Métricas do sistema</h2></header>
        <div class="metrics">${[['Processos', n('processos')], ['Movimentações', n('movimentos')], ['Compromissos', n('prazos')], ['Clientes', n('clientes')], ['Empresas', n('empresas')], ['Contratos', n('contratos')], ['Registros de auditoria', audit], ['Usuários', Gestao.users ? Gestao.users.filter(u => u.status === 'autorizado').length : '—']].map(([l, v]) => `<div><b>${fmtNum(v)}</b><span>${l}</span></div>`).join('')}</div></section>
    </div>
    <section class="card"><header><h2>${icon('list')} Funcionalidades do app</h2></header><ul class="plain checks cols2">${FUNCIONALIDADES.map(f => `<li>${icon('check')} ${esc(f)}</li>`).join('')}</ul></section>
    <section class="card"><header><h2>${icon('history')} Histórico de versões</h2></header>${VERSOES.map(vv => `<div class="ver"><b>${vv.numero}</b> <span class="muted small">${vv.data}</span><ul>${vv.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</section>`;
  },
  async usuarios(el) {
    if (!Session.remote) { el.innerHTML = `<section class="card"><div class="empty">${icon('key')}<p>A autorização de usuários funciona com o servidor conectado (veja CONFIGURAR-LOGIN.md). No modo local só existe o administrador deste navegador.</p></div></section>`; return; }
    el.innerHTML = `<section class="card"><div class="empty sm">${icon('sync', 'spin')}<p>Carregando usuários…</p></div></section>`;
    try { Gestao.users = await api('users'); } catch (e) { el.innerHTML = `<section class="card"><div class="empty">${icon('alert')}<p>${esc(e.message)}</p></div></section>`; return; }
    const us = Gestao.users; App.pendentes = us.filter(u => u.status === 'pendente').length; App.badge();
    const papel = { admin: 'Administrador', equipe: 'Equipe', cliente: 'Cliente' };
    const cliOpts = sel => `<option value="">— cliente —</option>${DB.all('clientes').sort((a, b) => a.nome.localeCompare(b.nome)).map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}`;
    const linha = (u, acoes) => `<div class="u-row"><span class="avatar sm">${u.foto ? `<img src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer">` : esc((u.nome || u.email)[0].toUpperCase())}</span><div class="u-who"><b>${esc(u.nome || u.email)}</b><small>${esc(u.email)}${u.papel ? ' · ' + papel[u.papel] : ''}${u.clienteId ? ' · ' + esc(DB.get('clientes', u.clienteId)?.nome || '') : ''}</small><small>${u.status === 'pendente' ? 'pediu acesso em ' + fmtDateTime(u.criado) : u.ultimoAcesso ? 'último acesso ' + fmtDateTime(u.ultimoAcesso) : 'ainda não entrou'}</small></div><div class="u-act">${acoes}</div></div>`;
    const pend = us.filter(u => u.status === 'pendente'), ok = us.filter(u => u.status === 'autorizado'), bloq = us.filter(u => u.status === 'bloqueado');
    el.innerHTML = `
      <section class="card"><header><h2>⏳ Pedidos de acesso <span class="count">${pend.length}</span></h2></header>
        <p class="muted small">Só entra no app quem você autorizar. Quem tenta entrar sem autorização vira um pedido aqui, e você recebe um e-mail avisando.</p>
        ${pend.length ? pend.map(u => linha(u, `<select data-papel="${esc(u.email)}"><option value="equipe">Equipe</option><option value="cliente">Cliente</option><option value="admin">Administrador</option></select><select data-cli="${esc(u.email)}" hidden>${cliOpts('')}</select><button class="btn primary sm" data-ok="${esc(u.email)}">Autorizar</button><button class="btn ghost sm" data-rm="${esc(u.email)}">Recusar</button>`)).join('') : '<p class="muted small">Nenhum pedido no momento.</p>'}</section>
      <section class="card"><header><h2>✅ Autorizados <span class="count">${ok.length}</span></h2></header>
        ${ok.map(u => linha(u, `<button class="btn ghost sm" data-ed="${esc(u.email)}">${icon('edit')} Editar</button>${u.email === Session.user.email ? '' : `<button class="btn ghost sm" data-bl="${esc(u.email)}">Bloquear</button>`}`)).join('') || '<p class="muted small">Nenhum.</p>'}</section>
      ${bloq.length ? `<section class="card"><header><h2>⛔ Bloqueados <span class="count">${bloq.length}</span></h2></header>${bloq.map(u => linha(u, `<button class="btn ghost sm" data-ed="${esc(u.email)}">Reativar</button><button class="btn ghost sm danger-text" data-rm="${esc(u.email)}">Remover</button>`)).join('')}</section>` : ''}
      <section class="card"><header><h2>➕ Autorizar antes de a pessoa entrar</h2></header>
        <form class="grid-form" id="uNovo"><div class="fld"><label>E-mail</label><input name="email" type="email" required placeholder="e-mail (conta Google ou e-mail do cliente)"></div><div class="fld"><label>Nome</label><input name="nome"></div>
        <div class="fld"><label>Perfil</label><select name="papel"><option value="equipe">Equipe do escritório</option><option value="cliente">Cliente (portal)</option><option value="admin">Administrador</option></select></div>
        <div class="fld" id="uNovoCli" hidden><label>Cliente vinculado</label><select name="clienteId">${cliOpts('')}</select></div>
        <div class="fld check full"><label class="switch"><input type="checkbox" name="invite" checked><span></span>Enviar e-mail de convite com o link do app</label></div></form>
        <div class="right"><button class="btn primary" id="uAdd">${icon('plus')} Autorizar</button></div>
        <p class="muted small">Administradores: e-mails da propriedade <b>DONOS</b> do Apps Script sempre têm acesso. Clientes veem só os próprios processos e, se a empresa estiver vinculada, o painel da consultoria.</p></section>`;
    const salvar = async (user, invite) => { try { await api('userSave', { user, invite, appUrl: location.origin + location.pathname }); UI.toast('Acesso atualizado: ' + user.email); Gestao.usuarios(el); } catch (e) { UI.toast(e.message, 'bad'); } };
    $$('[data-papel]', el).forEach(s => s.onchange = () => { $(`[data-cli="${s.dataset.papel}"]`, el).hidden = s.value !== 'cliente'; });
    $$('[data-ok]', el).forEach(b => b.onclick = () => { const em = b.dataset.ok, p = $(`[data-papel="${em}"]`, el).value, c = $(`[data-cli="${em}"]`, el).value; if (p === 'cliente' && !c) return UI.toast('Escolha o cliente vinculado.', 'bad'); const u = us.find(x => x.email === em); salvar({ ...u, papel: p, clienteId: p === 'cliente' ? c : '', status: 'autorizado' }, true); });
    $$('[data-bl]', el).forEach(b => b.onclick = async () => { if (await UI.confirm('Bloquear o acesso de ' + b.dataset.bl + '?', 'Bloquear')) salvar({ ...us.find(x => x.email === b.dataset.bl), status: 'bloqueado' }); });
    $$('[data-rm]', el).forEach(b => b.onclick = async () => { if (!await UI.confirm('Remover ' + b.dataset.rm + ' da lista?', 'Remover')) return; try { await api('userRemove', { email: b.dataset.rm }); Gestao.usuarios(el); } catch (e) { UI.toast(e.message, 'bad'); } });
    $$('[data-ed]', el).forEach(b => b.onclick = () => {
      const u = us.find(x => x.email === b.dataset.ed);
      const m = UI.modal({ title: 'Editar acesso', sub: esc(u.email), body: `<form class="grid-form"><div class="fld"><label>Nome</label><input name="nome" value="${esc(u.nome || '')}"></div><div class="fld"><label>Perfil</label><select name="papel">${Object.entries(papel).map(([k, l]) => `<option value="${k}" ${u.papel === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div><div class="fld full"><label>Cliente vinculado (perfil Cliente)</label><select name="clienteId">${cliOpts(u.clienteId)}</select></div></form>`, foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="uOk">Salvar</button>` });
      $('#uOk', m).onclick = () => { const f = $('form', m); UI.closeModal(); salvar({ ...u, nome: f.nome.value.trim(), papel: f.papel.value, clienteId: f.clienteId.value, status: 'autorizado' }); };
    });
    const fn = $('#uNovo'); fn.papel.onchange = () => $('#uNovoCli').hidden = fn.papel.value !== 'cliente';
    $('#uAdd').onclick = () => { const em = fn.email.value.trim().toLowerCase(); if (!em) return UI.toast('Informe o e-mail.', 'bad'); if (fn.papel.value === 'cliente' && !fn.clienteId.value) return UI.toast('Escolha o cliente vinculado.', 'bad'); salvar({ email: em, nome: fn.nome.value.trim(), papel: fn.papel.value, clienteId: fn.papel.value === 'cliente' ? fn.clienteId.value : '', status: 'autorizado' }, fn.invite.checked); };
  },
  sistema(el) {
    const e = escritorio();
    const linkCli = location.origin + location.pathname + '#/consulta';
    el.innerHTML = `<section class="card link-cli"><header><h2>${icon('search')} Link de consulta para os clientes</h2></header>
      <p class="muted small">Coloque este link no Instagram, no Linktree, no WhatsApp ou no cartão de visitas. O cliente informa o CPF, o telefone ou o e-mail do cadastro, recebe um código no e-mail cadastrado e vê só os próprios processos (apenas as movimentações marcadas como visíveis). O cadastro do cliente precisa ter e-mail.</p>
      <div class="btn-row"><input class="input mono" id="lkCli" value="${esc(linkCli)}" readonly><button class="btn primary sm" id="lkCopy">${icon('link')} Copiar</button><a class="btn ghost sm" href="${esc(linkCli)}" target="_blank" rel="noopener">${icon('eye')} Abrir</a></div></section>
      <div class="grid2">
      <section class="card"><header><h2>${icon('link')} Conexões</h2></header>
        <div class="conn"><span class="dot ${apiUrl() ? 'ok' : 'off'}"></span><div><b>Servidor (Google Apps Script)</b><small>${apiUrl() ? esc(apiUrl().slice(0, 60)) + '…' : 'não configurado — preencha APPS_SCRIPT_URL no config.js'}</small></div>${apiUrl() ? `<button class="btn ghost sm" id="tstSrv">Testar</button>` : ''}</div>
        <div class="conn"><span class="dot ${CONFIG.GOOGLE_CLIENT_ID ? 'ok' : 'off'}"></span><div><b>Login com Google</b><small>${CONFIG.GOOGLE_CLIENT_ID ? 'Client ID configurado' : 'não configurado — preencha GOOGLE_CLIENT_ID no config.js'}</small></div></div>
        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>DataJud / CNJ (movimentações)</b><small>${Session.remote ? 'consulta pelo servidor; sincronização diária automática' : 'disponível com o servidor conectado'}</small></div></div>

        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>E-mails (códigos, convites e avisos)</b><small>${Session.remote ? 'enviados pela conta Google dona do Apps Script' : 'disponível com o servidor conectado'}</small></div></div>

        ${CONFIG.APPS_SCRIPT_URL ? '' : `<p class="muted small">Para testar sem editar o config.js: <button class="link" id="cfgSrv">informar URL do servidor neste aparelho</button></p>`}
      </section>
      <section class="card"><header><h2>${icon('briefcase')} Conexão com o escritório (Drive e IA)</h2></header>${Escritorio.cardHtml()}</section>
      <section class="card"><header><h2>${icon('users')} Advogados do escritório (intimações no DJEN)</h2></header>${DJEN.advHtml()}</section>
      <section class="card"><header><h2>${icon('building')} Dados do escritório</h2></header>
        <p class="muted small">Usados no portal do cliente e no cabeçalho/assinatura dos relatórios.</p>
        <form id="cfgEsc" class="grid-form">
          <div class="fld full"><label>Nome do escritório</label><input name="nome" value="${esc(e.nome || 'Amorim Firmo')}"></div>
          <div class="fld"><label>Advogado responsável</label><input name="advogado" value="${esc(e.advogado || '')}"></div>
          <div class="fld"><label>Inscrição OAB</label><input name="oab" value="${esc(e.oab || '')}" placeholder="OAB/PE 00.000"></div>
          <div class="fld"><label>E-mail</label><input name="email" value="${esc(e.email || '')}"></div>
          <div class="fld"><label>WhatsApp (com DDD)</label><input name="whatsapp" value="${esc(e.whatsapp || '')}" placeholder="81999999999"></div>
          <div class="fld full"><label>Endereço</label><input name="endereco" value="${esc(e.endereco || '')}"></div>
          <div class="fld check full"><label class="switch"><input type="checkbox" name="djVisivel" ${e.djVisivel !== false ? 'checked' : ''}><span></span>Movimentações vindas do DataJud já ficam visíveis ao cliente</label></div>
        </form><div class="right"><button class="btn primary" id="cfgSave">${icon('check')} Salvar</button></div></section>
    </div>
    <section class="card"><header><h2>${icon('layers')} Backup</h2></header>
      <p class="muted small">${Session.remote ? 'Os dados já ficam guardados na planilha do servidor. O backup em arquivo é uma cópia extra.' : 'No modo local, faça backups regulares: os dados existem só neste navegador.'}</p>
      <div class="btn-row"><button class="btn ghost" id="bkExp">${icon('download')} Baixar backup (.json)</button><label class="btn ghost">${icon('upload')} Restaurar backup<input type="file" accept=".json" id="bkImp" hidden></label></div></section>`;
    Escritorio.bindCard(el); DJEN.bindAdv(el);
    $('#tstSrv') && ($('#tstSrv').onclick = async () => { try { const r = await api('ping'); UI.toast('Servidor respondeu: ' + (r.versao || 'ok')); } catch (err) { UI.toast(err.message, 'bad'); } });
    $('#cfgSrv') && ($('#cfgSrv').onclick = () => {
      const m = UI.modal({ title: 'Endereço do servidor', body: `<div class="fld full"><label>URL do Apps Script (termina em /exec)</label><input id="srvUrl" value="${esc(apiUrl())}"></div>`, foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="srvOk">Salvar</button>` });
      $('#srvOk', m).onclick = () => { ls.set('apiUrl', $('#srvUrl').value.trim()); UI.closeModal(); UI.toast('Salvo. Saia e entre novamente para usar o servidor.'); };
    });
    $('#cfgSave').onclick = async () => {
      const f = $('#cfgEsc'); const r = { ...e, id: 'escritorio' };
      ['nome', 'advogado', 'oab', 'email', 'whatsapp', 'endereco'].forEach(k => r[k] = f[k].value.trim()); r.djVisivel = f.djVisivel.checked;
      await DB.save('config', r); UI.toast('Dados do escritório salvos.');
    };
    $('#bkExp').onclick = () => { const o = { app: 'amorim-firmo', versao: APP_VERSAO, gerado: new Date().toISOString() }; COLLS.forEach(c => o[c] = DB.all(c)); download(new Blob([JSON.stringify(o)], { type: 'application/json' }), `backup-amorim-firmo-${todayISO()}.json`); };
    $('#bkImp').onchange = async ev => {
      const file = ev.target.files[0]; if (!file) return;
      try {
        const o = JSON.parse(await file.text()); if (o.app !== 'amorim-firmo') throw new Error('Arquivo de backup inválido.');
        if (!await UI.confirm('Restaurar este backup? Registros com o mesmo identificador serão substituídos.', 'Restaurar', false)) return;
        for (const c of COLLS) if (o[c]?.length) await DB.save(c, o[c]);
        UI.toast('Backup restaurado.'); App.render();
      } catch (err) { UI.toast(err.message, 'bad'); }
    };
    $('#lkCopy', el)?.addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#lkCli', el).value); UI.toast('Link copiado.'); } catch { $('#lkCli', el).select(); UI.toast('Selecione e copie o link (Ctrl+C).', 'warn'); } });
  },
  async auditoria(el) {
    if (!Session.remote) { el.innerHTML = `<section class="card"><div class="empty">${icon('history')}<p>A trilha de auditoria é registrada no servidor. Conecte o Apps Script para ativá-la.</p></div></section>`; return; }
    el.innerHTML = `<section class="card"><div class="empty sm">${icon('sync', 'spin')}<p>Carregando…</p></div></section>`;
    try {
      const log = await api('log');
      el.innerHTML = `<section class="card flush"><header class="pad"><h2>${icon('history')} Trilha de auditoria</h2><span class="muted small">últimas ${log.length} operações</span></header><div class="table-wrap"><table class="dt"><thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Coleção</th><th>Registros</th></tr></thead><tbody>${log.map(l => `<tr><td>${esc(fmtDateTime(l[0]))}</td><td>${esc(l[1])}</td><td>${pill(l[2])}</td><td>${esc(SCHEMAS[l[3]]?.titulo || l[3])}</td><td>${esc(l[4])}</td></tr>`).join('')}</tbody></table></div></section>`;
    } catch (e) { el.innerHTML = `<section class="card"><div class="empty">${icon('alert')}<p>${esc(e.message)}</p></div></section>`; }
  }
};
