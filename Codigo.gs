/**
 * AMORIM FIRMO — Advocacia e Consultoria Jurídica
 * Servidor do app (Google Apps Script) — versão 1.0.0
 *
 * Faz: login (Google + código por e-mail + autorização do administrador),
 * guarda os dados numa Planilha Google, filtra o que cada cliente pode ver,
 * consulta o DataJud/CNJ, sincroniza movimentações todo dia e registra a trilha de auditoria.
 *
 * Passo a passo de instalação: CONFIGURAR-LOGIN.md
 */

const VERSAO = '1.0.0';
const DATAJUD_CHAVE_PADRAO = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='; // chave pública do CNJ (pode mudar: veja o wiki do DataJud)
const SESSAO_DIAS = 90;
const COLECOES = ['clientes', 'processos', 'movimentos', 'prazos', 'empresas', 'contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos', 'config'];
const AUDITORIA = ['contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos'];

/* ======================= INSTALAÇÃO ======================= */
/** Rode UMA vez pelo editor (botão Executar) depois de preencher as propriedades. */
function configurarInicial() {
  const P = PropertiesService.getScriptProperties();
  if (!P.getProperty('SEGREDO')) P.setProperty('SEGREDO', Utilities.getUuid() + Utilities.getUuid());
  if (!P.getProperty('PLANILHA_ID')) {
    const ss = SpreadsheetApp.create('Amorim Firmo — Base de Dados do App');
    P.setProperty('PLANILHA_ID', ss.getId());
  }
  const ss = planilha_();
  aba_(ss, 'dados', ['colecao', 'id', 'json', 'atualizadoEm', 'por']);
  aba_(ss, 'usuarios', ['email', 'nome', 'papel', 'clienteId', 'status', 'criado', 'ultimoAcesso', 'foto']);
  aba_(ss, 'log', ['quando', 'email', 'acao', 'colecao', 'registros']);
  const s1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1'); if (s1 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  if (!P.getProperty('DONOS')) P.setProperty('DONOS', Session.getEffectiveUser().getEmail());
  Logger.log('Pronto. Planilha: ' + ss.getUrl());
  Logger.log('Administradores (DONOS): ' + P.getProperty('DONOS'));
  Logger.log('Confira se a propriedade GOOGLE_CLIENT_ID está preenchida: ' + (P.getProperty('GOOGLE_CLIENT_ID') || 'FALTANDO'));
}
/** Cria o gatilho que sincroniza o DataJud todo dia às 6h. Rode uma vez. */
function instalarGatilhoDiario() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sincronizarDataJud').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sincronizarDataJud').timeBased().everyDays(1).atHour(6).create();
  Logger.log('Gatilho diário criado.');
}

/* ======================= ENTRADA ======================= */
function doGet() { return json_({ ok: true, data: { app: 'Amorim Firmo', versao: VERSAO } }); }
function doPost(e) {
  let req = {};
  try { req = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: 'Requisição inválida.' }); }
  try {
    const fn = ACOES[req.action];
    if (!fn) return json_({ ok: false, error: 'Ação desconhecida: ' + req.action });
    return json_({ ok: true, data: fn(req) });
  } catch (err) {
    return json_({ ok: false, error: err.message || String(err), code: err.code || '' });
  }
}
const ACOES = {
  ping: () => ({ versao: VERSAO }),
  login: login_, requestCode: pedirCodigoCliente_, verifyCode: conferirCodigo_,
  load: r => carregar_(auth_(r)),
  save: r => salvar_(auth_(r, 'equipe'), r.collection, r.records || []),
  remove: r => remover_(auth_(r, 'equipe'), r.collection, r.ids || []),
  users: r => { auth_(r, 'admin'); return usuarios_().map(u => u); },
  userSave: r => salvarUsuario_(auth_(r, 'admin'), r.user, r.invite, r.appUrl),
  userRemove: r => { const u = auth_(r, 'admin'); removerUsuario_(r.email); log_(u.email, 'remover acesso', 'usuarios', r.email); return true; },
  log: r => { auth_(r, 'admin'); const sh = planilha_().getSheetByName('log'); const n = sh.getLastRow(); if (n < 2) return []; const v = sh.getRange(Math.max(2, n - 299), 1, Math.min(300, n - 1), 5).getValues(); return v.reverse().map(l => [l[0] instanceof Date ? l[0].toISOString() : l[0], l[1], l[2], l[3], l[4]]); },
  datajud: r => { auth_(r, 'equipe'); return consultarDataJud_(r.numero); }
};

/* ======================= LOGIN ======================= */
function donos_() { return (PropertiesService.getScriptProperties().getProperty('DONOS') || '').toLowerCase().split(/[,;\s]+/).filter(String); }
function login_(r) {
  const email = String(r.email || '').toLowerCase();
  const info = verificarTokenGoogle_(r.idToken);
  if (info.email !== email) throw new Error('A conta Google não confere.');
  let u = acharUsuario_(email);
  if (donos_().indexOf(email) >= 0) {
    if (!u || u.status !== 'autorizado' || u.papel !== 'admin') u = gravarUsuario_({ email: email, nome: r.nome || (u && u.nome) || '', papel: 'admin', status: 'autorizado', foto: r.foto || '' });
  }
  if (!u) {
    gravarUsuario_({ email: email, nome: r.nome || '', papel: '', status: 'pendente', foto: r.foto || '' });
    avisarDonos_('Novo pedido de acesso', `<p><b>${esc_(r.nome || email)}</b> (${esc_(email)}) pediu acesso ao app do escritório.</p><p>Para autorizar, abra o app › <b>Gestão do App</b> › <b>Usuários</b>.</p>`);
    return { status: 'pendente' };
  }
  if (u.status === 'pendente') return { status: 'pendente' };
  if (u.status === 'bloqueado') return { status: 'bloqueado' };
  if (r.foto && r.foto !== u.foto) gravarUsuario_(Object.assign({}, u, { foto: r.foto, nome: u.nome || r.nome }));
  // aparelho já confirmado: entra direto
  const ap = lerToken_(r.aparelho);
  if (ap && ap.email === email) return sessao_(u);
  enviarCodigo_(email, u.nome || r.nome);
  return { status: 'codigo', validadeMin: 10 };
}
function pedirCodigoCliente_(r) {
  const email = String(r.email || '').toLowerCase();
  const u = acharUsuario_(email);
  if (!u || u.status !== 'autorizado') throw new Error('Este e-mail não tem acesso liberado. Fale com o escritório.');
  if (u.papel !== 'cliente') throw new Error('A equipe do escritório entra com a conta Google.');
  const ap = lerToken_(r.aparelho); if (ap && ap.email === email) return sessao_(u);
  enviarCodigo_(email, u.nome);
  return { status: 'codigo', validadeMin: 10 };
}
function enviarCodigo_(email, nome) {
  const C = CacheService.getScriptCache();
  const ult = C.get('envio:' + email); if (ult) throw new Error('Aguarde um minuto para pedir outro código.');
  const cod = String(Math.floor(100000 + Math.random() * 900000));
  C.put('cod:' + email, JSON.stringify({ c: cod, t: 0 }), 600); C.put('envio:' + email, '1', 55);
  email_(email, 'Seu código de acesso — Amorim Firmo', `<p>Olá${nome ? ', ' + esc_(nome.split(' ')[0]) : ''}.</p><p>Seu código de acesso ao app do escritório é:</p><p style="font:600 30px Georgia,serif;letter-spacing:8px;color:#121c33;margin:18px 0">${cod}</p><p style="color:#6b6f7b">Ele vale por 10 minutos. Se você não pediu este código, ignore este e-mail.</p>`);
}
function conferirCodigo_(r) {
  const email = String(r.email || '').toLowerCase(), C = CacheService.getScriptCache();
  const raw = C.get('cod:' + email); if (!raw) throw new Error('Código expirado. Peça um novo.');
  const o = JSON.parse(raw);
  if (o.t >= 5) { C.remove('cod:' + email); throw new Error('Muitas tentativas. Peça um novo código.'); }
  if (String(r.code) !== o.c) { o.t++; C.put('cod:' + email, JSON.stringify(o), 600); throw new Error('Código incorreto.'); }
  C.remove('cod:' + email);
  const u = acharUsuario_(email); if (!u || u.status !== 'autorizado') throw new Error('Acesso não autorizado.');
  return sessao_(u);
}
function sessao_(u) {
  gravarUsuario_(Object.assign({}, u, { ultimoAcesso: new Date().toISOString() }));
  return { status: 'sessao', token: criarToken_(u.email), user: { email: u.email, nome: u.nome, papel: u.papel, clienteId: u.clienteId || '', foto: u.foto || '' } };
}
function verificarTokenGoogle_(idToken) {
  if (!idToken) throw new Error('Entre com a conta Google.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Login do Google inválido. Tente de novo.');
  const t = JSON.parse(res.getContentText());
  const cid = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (cid && t.aud !== cid) throw new Error('Login de outro aplicativo.');
  if (String(t.email_verified) !== 'true') throw new Error('E-mail da conta Google não verificado.');
  return { email: String(t.email).toLowerCase(), nome: t.name || '' };
}
/* token assinado: email|expira|assinatura */
function criarToken_(email) {
  const exp = Date.now() + SESSAO_DIAS * 864e5, base = email + '|' + exp;
  return Utilities.base64EncodeWebSafe(base + '|' + assinar_(base));
}
function lerToken_(tok) {
  if (!tok) return null;
  try {
    const s = Utilities.newBlob(Utilities.base64DecodeWebSafe(tok)).getDataAsString().split('|');
    if (s.length !== 3 || assinar_(s[0] + '|' + s[1]) !== s[2] || +s[1] < Date.now()) return null;
    return { email: s[0] };
  } catch (e) { return null; }
}
function assinar_(t) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(t, PropertiesService.getScriptProperties().getProperty('SEGREDO'))); }
function auth_(r, nivel) {
  const t = lerToken_(r.token); if (!t) throw erro_('Sessão expirada. Entre novamente.', 'AUTH');
  const u = acharUsuario_(t.email); if (!u || u.status !== 'autorizado') throw erro_('Acesso não autorizado.', 'AUTH');
  const ok = !nivel || (nivel === 'admin' ? u.papel === 'admin' : (u.papel === 'admin' || u.papel === 'equipe'));
  if (!ok) throw erro_('Sem permissão para esta ação.', 'PERM');
  return u;
}

/* ======================= USUÁRIOS ======================= */
function usuarios_() {
  const sh = planilha_().getSheetByName('usuarios'), n = sh.getLastRow(); if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, 8).getValues().filter(r => r[0]).map(r => ({ email: String(r[0]).toLowerCase(), nome: r[1], papel: r[2], clienteId: r[3], status: r[4], criado: iso_(r[5]), ultimoAcesso: iso_(r[6]), foto: r[7] }));
}
function acharUsuario_(email) { return usuarios_().filter(u => u.email === email)[0] || null; }
function gravarUsuario_(u) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = planilha_().getSheetByName('usuarios'), n = sh.getLastRow();
    const emails = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(r => String(r[0]).toLowerCase()) : [];
    const i = emails.indexOf(u.email);
    const atual = i >= 0 ? sh.getRange(i + 2, 1, 1, 8).getValues()[0] : [];
    const row = [u.email, u.nome || '', u.papel || '', u.clienteId || '', u.status || 'pendente', atual[5] || new Date(), u.ultimoAcesso ? new Date(u.ultimoAcesso) : (atual[6] || ''), u.foto || atual[7] || ''];
    if (i >= 0) sh.getRange(i + 2, 1, 1, 8).setValues([row]); else sh.appendRow(row);
    return { email: row[0], nome: row[1], papel: row[2], clienteId: row[3], status: row[4], foto: row[7] };
  } finally { lock.releaseLock(); }
}
function salvarUsuario_(admin, u, convite, appUrl) {
  if (!u || !u.email) throw new Error('Informe o e-mail.');
  u.email = String(u.email).toLowerCase();
  if (u.status === 'autorizado' && !u.papel) throw new Error('Escolha o perfil.');
  if (appUrl) PropertiesService.getScriptProperties().setProperty('APP_URL', appUrl);
  const antes = acharUsuario_(u.email);
  const salvo = gravarUsuario_(Object.assign({}, antes || {}, u));
  log_(admin.email, 'acesso: ' + salvo.status + ' (' + salvo.papel + ')', 'usuarios', salvo.email);
  if (convite || (antes && antes.status === 'pendente' && salvo.status === 'autorizado')) {
    const url = appUrl || PropertiesService.getScriptProperties().getProperty('APP_URL') || '';
    const cliente = salvo.papel === 'cliente';
    email_(salvo.email, 'Seu acesso ao app do escritório Amorim Firmo', `<p>Olá${salvo.nome ? ', ' + esc_(String(salvo.nome).split(' ')[0]) : ''}.</p><p>Seu acesso ${cliente ? 'à <b>área do cliente</b>' : 'ao sistema do escritório'} foi liberado.</p>${url ? `<p style="margin:22px 0"><a href="${url}" style="background:#121c33;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Abrir o app</a></p>` : ''}<p style="color:#6b6f7b">${cliente ? 'Para entrar, informe este e-mail e digite o código que enviaremos (ou entre com sua conta Google, se tiver).' : 'Entre com sua conta Google; no primeiro acesso enviaremos um código para confirmar o e-mail.'}</p>`);
  }
  return salvo;
}
function removerUsuario_(email) {
  const sh = planilha_().getSheetByName('usuarios'), n = sh.getLastRow(); if (n < 2) return;
  const v = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = v.length - 1; i >= 0; i--) if (String(v[i][0]).toLowerCase() === email) sh.deleteRow(i + 2);
}

/* ======================= DADOS ======================= */
function lerTudo_() {
  const sh = planilha_().getSheetByName('dados'), n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, 5).getValues();
}
function escreverTudo_(linhas) {
  const sh = planilha_().getSheetByName('dados'), n = sh.getLastRow();
  if (n > 1) sh.getRange(2, 1, n - 1, 5).clearContent();
  if (linhas.length) sh.getRange(2, 1, linhas.length, 5).setValues(linhas);
  const sobra = sh.getMaxRows() - (linhas.length + 1); if (sobra > 500) sh.deleteRows(linhas.length + 2, sobra - 100);
}
function carregar_(u) {
  const out = {}; COLECOES.forEach(c => out[c] = []);
  lerTudo_().forEach(l => { if (out[l[0]]) { try { out[l[0]].push(JSON.parse(l[2])); } catch (e) { } } });
  if (u.papel === 'admin' || u.papel === 'equipe') return out;
  // CLIENTE: só o que é dele
  const cid = u.clienteId, f = {};
  COLECOES.forEach(c => f[c] = []);
  f.clientes = out.clientes.filter(c => c.id === cid);
  f.processos = out.processos.filter(p => (p.clienteIds || []).indexOf(cid) >= 0).map(p => { const x = Object.assign({}, p); delete x.obs; delete x.honorarios; return x; });
  const pids = f.processos.map(p => p.id);
  f.movimentos = out.movimentos.filter(m => pids.indexOf(m.processoId) >= 0 && m.visivelCliente);
  f.prazos = out.prazos.filter(x => pids.indexOf(x.processoId) >= 0 && x.visivelCliente);
  f.empresas = out.empresas.filter(e => e.clienteId === cid);
  const eids = f.empresas.map(e => e.id);
  AUDITORIA.forEach(c => f[c] = out[c].filter(r => eids.indexOf(r.empresaId) >= 0));
  f.config = out.config.filter(c => c.id === 'escritorio');
  return f;
}
function salvar_(u, col, recs) {
  if (COLECOES.indexOf(col) < 0) throw new Error('Coleção inválida.');
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const linhas = lerTudo_(), idx = {}; linhas.forEach((l, i) => idx[l[0] + '|' + l[1]] = i);
    const agora = new Date();
    recs.forEach(r => {
      if (!r || !r.id) return;
      const row = [col, r.id, JSON.stringify(r), agora, u.email];
      const k = col + '|' + r.id;
      if (idx[k] !== undefined) linhas[idx[k]] = row; else { idx[k] = linhas.length; linhas.push(row); }
    });
    escreverTudo_(linhas);
  } finally { lock.releaseLock(); }
  log_(u.email, 'salvar', col, recs.length === 1 ? (recs[0].codigo || recs[0].numero || recs[0].nome || recs[0].razao || recs[0].titulo || recs[0].id) : recs.length + ' registros');
  if (col === 'movimentos') avisarClientes_(recs);
  return { gravados: recs.length };
}
function remover_(u, col, ids) {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const set = {}; ids.forEach(i => set[i] = 1);
    escreverTudo_(lerTudo_().filter(l => !(l[0] === col && set[l[1]])));
  } finally { lock.releaseLock(); }
  log_(u.email, 'excluir', col, ids.length + ' registro(s)');
  return { removidos: ids.length };
}
function log_(email, acao, col, reg) { try { planilha_().getSheetByName('log').appendRow([new Date(), email, acao, col, String(reg).slice(0, 200)]); } catch (e) { } }

/* ======================= DATAJUD / CNJ ======================= */
const UF = ['', 'ac', 'al', 'ap', 'am', 'ba', 'ce', 'dft', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'se', 'sp', 'to'];
function aliasTribunal_(d) {
  const j = d.substr(13, 1), tr = +d.substr(14, 2);
  if (j === '8') return tr === 7 ? 'tjdft' : 'tj' + UF[tr];
  if (j === '5') return tr === 0 ? 'tst' : 'trt' + tr;
  if (j === '4') return 'trf' + tr;
  if (j === '6') return tr === 0 ? 'tse' : 'tre-' + (tr === 7 ? 'df' : UF[tr]);
  if (j === '3') return 'stj';
  if (j === '7') return 'stm';
  if (j === '9') return ({ 13: 'tjmmg', 21: 'tjmrs', 26: 'tjmsp' })[tr];
  return null;
}
function dataMov_(s) {
  s = String(s || '');
  if (/^\d{14}$/.test(s)) return s.substr(0, 4) + '-' + s.substr(4, 2) + '-' + s.substr(6, 2);
  return s.slice(0, 10);
}
function consultarDataJud_(numero) {
  const d = String(numero || '').replace(/\D/g, ''); if (d.length !== 20) throw new Error('Número CNJ inválido.');
  const alias = aliasTribunal_(d); if (!alias) throw new Error('Tribunal não suportado pelo DataJud.');
  const chave = PropertiesService.getScriptProperties().getProperty('DATAJUD_CHAVE') || DATAJUD_CHAVE_PADRAO;
  const res = UrlFetchApp.fetch('https://api-publica.datajud.cnj.jus.br/api_publica_' + alias + '/_search', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'APIKey ' + chave },
    payload: JSON.stringify({ query: { match: { numeroProcesso: d } }, size: 10 })
  });
  if (res.getResponseCode() === 401 || res.getResponseCode() === 403) throw new Error('A chave pública do DataJud foi alterada pelo CNJ. Atualize a propriedade DATAJUD_CHAVE (veja CONFIGURAR-LOGIN.md).');
  if (res.getResponseCode() !== 200) throw new Error('DataJud indisponível no momento (' + res.getResponseCode() + ').');
  const hits = (JSON.parse(res.getContentText()).hits || {}).hits || [];
  if (!hits.length) return { encontrado: false, tribunal: alias.toUpperCase() };
  const out = { encontrado: true, tribunal: alias.toUpperCase(), movimentos: [] }, vistos = {};
  hits.forEach(h => {
    const s = h._source || {};
    if (!out.classe && s.classe) out.classe = s.classe.nome;
    if (!out.orgao && s.orgaoJulgador) out.orgao = s.orgaoJulgador.nome;
    if (!out.assunto && s.assuntos && s.assuntos.length) out.assunto = s.assuntos.map(a => a.nome).filter(String).slice(0, 3).join('; ');
    if (!out.ajuizamento && s.dataAjuizamento) out.ajuizamento = dataMov_(s.dataAjuizamento);
    (s.movimentos || []).forEach(m => {
      const chave = String(m.dataHora) + '|' + m.codigo; if (vistos[chave]) return; vistos[chave] = 1;
      const comp = (m.complementosTabelados || []).map(c => [c.nome, c.descricao].filter(String).join(': ')).filter(String).join(' · ');
      out.movimentos.push({ data: dataMov_(m.dataHora), titulo: m.nome || 'Movimentação', descricao: comp + (s.grau ? (comp ? ' · ' : '') + s.grau : ''), chave: chave });
    });
  });
  out.movimentos.sort((a, b) => a.data < b.data ? 1 : -1);
  return out;
}
/** Roda todo dia (gatilho): busca movimentações novas de todos os processos em andamento. */
function sincronizarDataJud() {
  const linhas = lerTudo_(), get = c => linhas.filter(l => l[0] === c).map(l => JSON.parse(l[2]));
  const procs = get('processos').filter(p => p.status !== 'Encerrado' && String(p.numero || '').replace(/\D/g, '').length === 20);
  const movs = get('movimentos'), cfg = get('config').filter(c => c.id === 'escritorio')[0] || {};
  const novos = [], resumo = [];
  procs.forEach(p => {
    try {
      const r = consultarDataJud_(p.numero); if (!r.encontrado) return;
      const tem = {}; movs.filter(m => m.processoId === p.id).forEach(m => tem[m.chave || (m.data + '|' + m.titulo)] = 1);
      const n = r.movimentos.filter(m => !tem[m.chave]).map(m => ({ id: 'mo' + Utilities.getUuid().slice(0, 12), processoId: p.id, data: m.data, titulo: m.titulo, descricao: m.descricao, origem: 'datajud', chave: m.chave, visivelCliente: cfg.djVisivel !== false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'DataJud' }));
      if (n.length) { novos.push.apply(novos, n); resumo.push('<li>' + esc_(p.numero) + ': ' + n.length + ' nova(s)</li>'); }
      Utilities.sleep(400);
    } catch (e) { }
  });
  if (novos.length) {
    salvar_({ email: 'DataJud (automático)' }, 'movimentos', novos);
    avisarDonos_('Novas movimentações processuais', '<p>A sincronização diária com o DataJud encontrou novidades:</p><ul>' + resumo.join('') + '</ul>');
  }
}
/* aviso por e-mail ao cliente quando há movimentação visível nova (processos com a opção ligada) */
function avisarClientes_(recs) {
  try {
    const novos = recs.filter(m => m.visivelCliente && m.createdAt === m.updatedAt); if (!novos.length) return;
    const linhas = lerTudo_(), get = c => linhas.filter(l => l[0] === c).map(l => JSON.parse(l[2]));
    const procs = get('processos'), clis = get('clientes'), url = PropertiesService.getScriptProperties().getProperty('APP_URL') || '';
    const porProc = {}; novos.forEach(m => (porProc[m.processoId] = porProc[m.processoId] || []).push(m));
    Object.keys(porProc).forEach(pid => {
      const p = procs.filter(x => x.id === pid)[0]; if (!p || !p.notificarCliente) return;
      (p.clienteIds || []).forEach(cid => {
        const c = clis.filter(x => x.id === cid)[0]; if (!c || !c.email) return;
        email_(c.email, 'Atualização no seu processo — Amorim Firmo', `<p>Olá, ${esc_(String(c.nome || '').split(' ')[0])}.</p><p>Há novidade no processo <b>${esc_(p.numero)}</b>:</p><ul>${porProc[pid].map(m => `<li><b>${esc_(m.titulo)}</b>${m.explicacao ? '<br><span style="color:#6b6f7b">' + esc_(m.explicacao) + '</span>' : ''}</li>`).join('')}</ul>${url ? `<p><a href="${url}" style="color:#121c33;font-weight:600">Acompanhe pela área do cliente</a></p>` : ''}`);
      });
    });
  } catch (e) { }
}

/* ======================= UTILIDADES ======================= */
function planilha_() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILHA_ID');
  if (!id) throw new Error('Servidor não instalado: rode a função configurarInicial no editor do Apps Script.');
  return SpreadsheetApp.openById(id);
}
function aba_(ss, nome, cab) { let sh = ss.getSheetByName(nome); if (!sh) { sh = ss.insertSheet(nome); sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold'); sh.setFrozenRows(1); } return sh; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function erro_(m, code) { const e = new Error(m); e.code = code; return e; }
function iso_(v) { return v instanceof Date ? v.toISOString() : (v || ''); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function avisarDonos_(assunto, html) { donos_().forEach(d => { try { email_(d, assunto + ' — Amorim Firmo', html); } catch (e) { } }); }
function email_(para, assunto, corpo) {
  const html = `<div style="background:#f6f3ec;padding:28px 12px;font-family:Arial,sans-serif"><div style="max-width:520px;margin:0 auto;background:#fffdf9;border:1px solid #e7e0d2;border-radius:12px;overflow:hidden">
    <div style="background:#121c33;padding:20px;text-align:center"><div style="font:600 22px Georgia,serif;color:#fff;letter-spacing:2px">AMORIM FIRMO</div><div style="font-size:9px;letter-spacing:4px;color:#d9c49a;margin-top:6px">ADVOCACIA E CONSULTORIA JURÍDICA</div></div>
    <div style="padding:24px 26px;color:#1d2433;font-size:14px;line-height:1.6">${corpo}</div>
    <div style="padding:12px;text-align:center;font-size:11px;color:#8a8e98;border-top:1px solid #e7e0d2">Mensagem automática do app do escritório. Não responda.</div></div></div>`;
  MailApp.sendEmail({ to: para, subject: assunto, htmlBody: html, name: 'Amorim Firmo' });
}
