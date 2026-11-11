/* =====================================================================
   CONEXÃO COM O ESCRITÓRIO — como a conexão com a repartição do
   Custódia Digital. O administrador conecta UMA VEZ a conta Google do
   escritório; depois disso todos os usuários habilitados já entram
   conectados. Arquivos vão para o Drive do escritório e a IA usa a chave
   do escritório, embora todo o código fique na conta da efstech.
   ===================================================================== */
const Escritorio = {
  st: null, erro: null,
  get conectado() { return !!this.st?.conectado; },
  redirectUri: () => location.origin + location.pathname,
  async check() {
    if (!Session.remote || !Session.isStaff) return;
    try { Escritorio.st = await api('escStatus'); Escritorio.erro = null; }
    catch (e) { Escritorio.erro = e.message; if (/desconhecida/i.test(e.message)) Escritorio.st = { conectado: false, desatualizado: true }; }
    Escritorio.badge();
  },
  /** login do Google (janela) com a conta do escritório → código → servidor guarda a autorização */
  conectar() {
    if (!CONFIG.GOOGLE_CLIENT_ID) return UI.toast('Preencha o GOOGLE_CLIENT_ID no config.js.', 'bad');
    const state = 'afesc' + Math.random().toString(36).slice(2);
    ls.set('escState', state);
    const p = new URLSearchParams({ client_id: CONFIG.GOOGLE_CLIENT_ID, redirect_uri: Escritorio.redirectUri(), response_type: 'code', scope: 'https://www.googleapis.com/auth/drive.file', access_type: 'offline', prompt: 'consent select_account', include_granted_scopes: 'true', state });
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + p;
    const w = window.open(url, 'afesc', 'width=520,height=680');
    if (!w) { location.href = url; return; } // janela bloqueada: segue na mesma aba
    UI.toast('Entre com a conta Google do escritório na janela que abriu.', 'ok', 6000);
  },
  /** chamado quando a janela do Google volta com o código */
  async receber(code, state) {
    if (!code || state !== ls.get('escState')) return UI.toast('Conexão cancelada ou expirada. Tente de novo.', 'warn');
    ls.del('escState');
    try { Escritorio.st = await api('escConectar', { code, redirectUri: Escritorio.redirectUri() }); UI.toast('Conta do escritório conectada: ' + Escritorio.st.conta + '. Todos os usuários habilitados já estão conectados.', 'ok', 7000); }
    catch (e) { UI.toast(e.message, 'bad', 9000); }
    Escritorio.badge(); App.render();
  },
  /** sidebar: “Conectado ao escritório ●” (como o status da repartição no Custódia) */
  badge() {
    const h = $('#conexSlot'); if (!h) return;
    if (!Session.remote) { h.innerHTML = ''; return; }
    const s = Escritorio.st || {};
    h.innerHTML = `<div class="drive-card ${s.conectado ? 'on' : ''}"><div class="drive-row"><span class="dot ${s.conectado ? 'ok' : 'off'}"></span><div><b>${s.conectado ? 'Conectado ao escritório' : 'Escritório não conectado'}</b><small>${s.conectado ? esc(s.conta) + (s.ia ? ' · IA ativa' : '') : Escritorio.erro ? 'sem resposta do servidor' : 'Drive e IA indisponíveis'}</small></div></div>${s.conectado && s.pasta ? `<a class="side-btn mini" href="${esc(s.pasta)}" target="_blank" rel="noopener">${icon('link')} Pasta no Drive</a>` : ''}${!s.conectado && Session.isAdmin ? `<button class="side-btn mini" id="escSideBtn">Conectar</button>` : ''}</div>`;
    $('#escSideBtn')?.addEventListener('click', Escritorio.conectar);
  },
  /** tela de bloqueio enquanto o escritório não estiver conectado */
  gate(v) {
    App.crumbs([{ t: 'Conectar ao escritório' }]);
    const adm = Session.isAdmin, des = Escritorio.st?.desatualizado;
    v.innerHTML = `<div class="gate"><img src="${BRAND.logoDark}" alt="" class="gate-logo"><div class="caption dark">${BRAND.caption}</div>
      <h1>Conectar ao escritório</h1>
      ${des ? `<div class="notice">${icon('alert')}<div>O servidor (Apps Script) ainda está na versão anterior. Cole o novo <b>Codigo.gs</b> e publique uma <b>Nova versão</b> da implantação.</div></div>` : ''}
      ${adm ? `<p>Para começar, conecte a <b>conta Google do escritório</b>. Os documentos que a equipe juntar serão guardados no Google Drive dessa conta, e a leitura por IA usará a chave dela — o app só guarda os cadastros.</p>
        <ol class="steps left"><li>Clique em <b>Conectar conta do escritório</b>.</li><li>Na janela do Google, entre com <b>a conta do escritório</b> (ex.: amorimfirmo.adv@gmail.com) e clique em <b>Continuar / Permitir</b>.</li><li>Pronto: daqui em diante todos os usuários habilitados entram já conectados.</li></ol>
        <button class="btn primary big" id="gateBtn" ${des ? 'disabled' : ''}>${icon('link')} Conectar conta do escritório</button>
        <p class="muted small">O app só terá acesso aos arquivos que ele mesmo criar no Drive (permissão “drive.file”). Dá para desconectar a qualquer momento em Gestão do App › Sistema.</p>`
      : `<p>O administrador ainda não conectou a conta do escritório. Assim que ele conectar, você terá acesso automaticamente — basta recarregar esta página.</p><button class="btn ghost" id="gateRe">${icon('sync')} Verificar de novo</button>`}
    </div>`;
    $('#gateBtn')?.addEventListener('click', Escritorio.conectar);
    $('#gateRe')?.addEventListener('click', async () => { await Escritorio.check(); App.render(); });
  },
  /** cartão em Gestão do App › Sistema */
  cardHtml() {
    if (!Session.remote) return `<p class="muted small">Disponível com o servidor conectado.</p>`;
    const s = Escritorio.st || {};
    return `<p class="muted small">Como a repartição no Custódia Digital: tudo o que a equipe junta vai para o <b>Google Drive da conta do escritório</b> e a IA usa a <b>chave do escritório</b>. O código e os cadastros ficam no app (efstech).</p>
      <div class="conn"><span class="dot ${s.conectado ? 'ok' : 'off'}"></span><div><b>Google Drive do escritório</b><small>${s.conectado ? esc(s.conta) + (s.pasta ? ` · <a href="${esc(s.pasta)}" target="_blank" rel="noopener">abrir pasta</a>` : '') : 'não conectado'}</small></div><button class="btn ghost sm" id="escCon">${s.conectado ? 'Trocar conta' : 'Conectar'}</button>${s.conectado ? `<button class="btn ghost sm danger-text" id="escDes">Desconectar</button>` : ''}</div>
      <div class="conn"><span class="dot ${s.ia ? 'ok' : 'off'}"></span><div><b>IA para leitura de documentos (Gemini)</b><small>${s.ia ? 'chave do escritório configurada (' + esc(s.iaMascara) + ')' + (s.iaModelo ? ' · modelo ' + esc(s.iaModelo) + ' (escolhido automaticamente)' : '') : 'sem chave — os documentos são guardados, mas não lidos'}</small></div><button class="btn ghost sm" id="escIA">Configurar</button></div>`;
  },
  bindCard(el) {
    $('#escCon', el)?.addEventListener('click', Escritorio.conectar);
    $('#escDes', el)?.addEventListener('click', async () => {
      if (!await UI.confirm('Desconectar a conta do escritório? A equipe deixa de conseguir juntar documentos até conectar de novo. Os arquivos já guardados continuam no Drive do escritório.', 'Desconectar')) return;
      try { Escritorio.st = await api('escDesconectar'); Escritorio.badge(); App.render(); } catch (e) { UI.toast(e.message, 'bad'); }
    });
    $('#escIA', el)?.addEventListener('click', () => {
      const conta = Escritorio.st?.conta;
      const m = UI.modal({ title: 'Chave do Gemini do escritório', body: `<ol class="steps"><li>Abra o <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> entrando com a conta do escritório${conta ? ` (<b>${esc(conta)}</b>)` : ''} — a cota e o custo da IA ficam nessa conta.</li><li>Clique em <b>Create API key</b> e copie a chave.</li><li>Cole abaixo e clique em Testar e salvar.</li></ol>
        <div class="fld full"><label>Chave</label><input id="iaK" type="password" autocomplete="off" placeholder="AIza…"></div>
        <div class="notice soft">${icon('alert')}<div><b>Sigilo dos contratos:</b> no plano gratuito do Gemini, o Google pode usar o conteúdo enviado para melhorar os produtos dele. Para documentos de clientes, ative o faturamento no projeto da chave (AI Studio › Billing) — custa centavos por documento e o conteúdo deixa de ser usado pelo Google.</div></div>
        <p class="muted small">A chave fica guardada no servidor, nunca no navegador.</p>`, foot: `<button class="btn ghost danger-text" id="iaDel">Remover chave</button><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="iaOk">Testar e salvar</button>` });
      $('#iaOk', m).onclick = async () => { const b = $('#iaOk', m); b.disabled = true; b.textContent = 'Testando…'; try { Escritorio.st = await apiT('iaChave', { chave: $('#iaK').value.trim() }, 120000); UI.closeModal(); UI.toast('Chave do Gemini do escritório salva e testada' + (Escritorio.st.iaModelo ? ' · modelo ' + Escritorio.st.iaModelo : '') + '.'); App.render(true); Escritorio.badge(); } catch (err) { UI.toast(err.message, 'bad', 6000); b.disabled = false; b.textContent = 'Testar e salvar'; } };
      $('#iaDel', m).onclick = async () => { try { Escritorio.st = await api('iaChave', { chave: '' }); UI.closeModal(); App.render(true); Escritorio.badge(); } catch (err) { UI.toast(err.message, 'bad'); } };
    });
  }
};

/* retorno do login do Google (janela ou mesma aba) */
(function () {
  const q = new URLSearchParams(location.search);
  if (!q.get('state') || !/^afesc/.test(q.get('state'))) return;
  const msg = { afesc: true, code: q.get('code'), state: q.get('state'), error: q.get('error') };
  history.replaceState(null, '', location.pathname + location.hash);
  if (window.opener && window.opener !== window) { try { window.opener.postMessage(msg, location.origin); } catch { } document.documentElement.innerHTML = '<p style="font:16px sans-serif;padding:40px;text-align:center">Conta conectada. Pode fechar esta janela.</p>'; setTimeout(() => window.close(), 300); window.__afPopup = true; }
  else ls.set('escPend', msg);
})();
window.addEventListener('message', e => { if (e.origin === location.origin && e.data?.afesc) { if (e.data.error) UI.toast('Conexão cancelada.', 'warn'); else Escritorio.receber(e.data.code, e.data.state); } });
