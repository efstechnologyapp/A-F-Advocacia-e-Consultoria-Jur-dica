/* Amorim Firmo — Advocacia e Consultoria Jurídica · app.js (gerado a partir de src/) */
'use strict';
/* =====================================================================
   AMORIM FIRMO — Advocacia e Consultoria Jurídica
   Núcleo: configuração, utilidades, armazenamento e sincronização
   ===================================================================== */

/* A configuração do login fica no arquivo config.js (veja CONFIGURAR-LOGIN.md) */
const APP_VERSAO = '1.0.0';
const CONFIG = Object.assign({ GOOGLE_CLIENT_ID: '', APPS_SCRIPT_URL: '' }, window.CONFIG || {}, { VERSION: APP_VERSAO });
const VERSOES = [
  { numero: '1.0.0', data: '09/11/2026', itens: ['Lançamento: seção Judicial (Cível, Penal, Administrativo, Previdenciário e Trabalhista) com movimentações, agenda e sincronização com o DataJud/CNJ', 'Portal do cliente com acesso próprio e restrito', 'Consultoria Jurídica: cadastro de empresas, auditoria de contratos em 10 abas espelhando a planilha, importação/exportação Excel, painel de indicadores e relatório de auditoria', 'Login com Google + código por e-mail + autorização do administrador', 'Gestão do App: informações, usuários, sistema e trilha de auditoria'] }
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- números, moeda, datas ---------- */
function num(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let s = String(v).replace(/R\$|\s/g, '');
  if (!/^-?[\d.,]+$/.test(s)) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
const isNum = v => num(v) !== null;
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const fmtMoney = v => (num(v) === null ? (v ?? '') : BRL.format(num(v)));
const fmtMoneyShort = v => {
  const n = num(v); if (n === null) return '—';
  const a = Math.abs(n);
  if (a >= 1e6) return 'R$ ' + NUM.format(+(n / 1e6).toFixed(2)) + ' mi';
  if (a >= 1e3) return 'R$ ' + NUM.format(+(n / 1e3).toFixed(1)) + ' mil';
  return BRL0.format(n);
};
const fmtNum = v => (num(v) === null ? (v ?? '') : NUM.format(num(v)));
const fmtPct = v => (v === null || !isFinite(v) ? '—' : NUM.format(+(v * 100).toFixed(1)) + '%');

function parseDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 20000 && v < 80000) { // serial do Excel
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) {
    let y = +m[3]; if (y < 100) y += 2000;
    const mo = +m[2], d = +m[1];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}
const isISO = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const fmtDate = v => { if (!v) return ''; const iso = isISO(v) ? v : parseDate(v); if (!iso) return String(v); const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtDateTime = v => { if (!v) return ''; const d = new Date(v); if (isNaN(d)) return fmtDate(v); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const daysUntil = iso => { if (!isISO(iso)) return null; return Math.round((new Date(iso + 'T12:00:00') - new Date(todayISO() + 'T12:00:00')) / 864e5); };
// competência -> 'AAAA-MM'
function parseComp(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && v > 20000) { const iso = parseDate(v); return iso.slice(0, 7); }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[\/.-](\d{4})$/); if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${String(+m[1]).padStart(2, '0')}`;
  m = s.match(/^(\d{4})-(\d{2})/); if (m) return `${m[1]}-${m[2]}`;
  const iso = parseDate(s); return iso ? iso.slice(0, 7) : null;
}
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtComp = v => { const c = /^\d{4}-\d{2}$/.test(v || '') ? v : parseComp(v); if (!c) return v ?? ''; const [y, m] = c.split('-'); return `${m}/${y}`; };
const fmtCompShort = c => { const [y, m] = c.split('-'); return `${MESES[+m - 1]}/${y.slice(2)}`; };

/* valores "não identificados" (lacunas documentais) */
const isGap = v => typeof v === 'string' && /^n[ãa]o (identificad|informad|localizad|apresentad|comprovad)/i.test(v.trim());

/* ---------- validações ---------- */
const onlyDigits = s => String(s || '').replace(/\D/g, '');
function validCPF(v) {
  const c = onlyDigits(v); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +c[t]) return false; }
  return true;
}
function validCNPJ(v) {
  const c = onlyDigits(v); if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return calc(12) === +c[12] && calc(13) === +c[13];
}
const fmtDoc = v => { const c = onlyDigits(v); if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); return v || ''; };
/* Número único CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
function cnjParts(v) {
  const d = onlyDigits(v); if (d.length !== 20) return null;
  return { n: d.slice(0, 7), dv: d.slice(7, 9), ano: d.slice(9, 13), j: d.slice(13, 14), tr: d.slice(14, 16), o: d.slice(16, 20), digits: d };
}
const fmtCNJ = v => { const p = cnjParts(v); return p ? `${p.n}-${p.dv}.${p.ano}.${p.j}.${p.tr}.${p.o}` : (v || ''); };
function validCNJ(v) {
  const p = cnjParts(v); if (!p) return false;
  const base = p.n + p.ano + p.j + p.tr + p.o + '00';
  let r = 0; for (const ch of base) r = (r * 10 + +ch) % 97;
  return String(98 - r).padStart(2, '0') === p.dv;
}
const UF_TR = ['', 'ac', 'al', 'ap', 'am', 'ba', 'ce', 'dft', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'se', 'sp', 'to'];
function tribunalAlias(v) {
  const p = cnjParts(v); if (!p) return null; const tr = +p.tr;
  switch (p.j) {
    case '8': return tr === 7 ? 'tjdft' : (UF_TR[tr] ? 'tj' + UF_TR[tr] : null);
    case '5': return tr === 0 ? 'tst' : 'trt' + tr;
    case '4': return tr ? 'trf' + tr : null;
    case '6': return tr === 0 ? 'tse' : (UF_TR[tr] ? 'tre-' + (tr === 7 ? 'df' : UF_TR[tr]) : null);
    case '3': return 'stj';
    case '7': return 'stm';
    case '9': return ({ 13: 'tjmmg', 21: 'tjmrs', 26: 'tjmsp' })[tr] || null;
  }
  return null;
}
const tribunalNome = a => a ? a.toUpperCase().replace('TRE-', 'TRE-') : '';

/* ---------- IndexedDB (cache local) ---------- */
const kv = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('amorim-firmo', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { this._db = r.result; res(this._db); };
      r.onerror = () => rej(r.error);
    });
  },
  async get(k) { try { const db = await this.open(); return await new Promise(res => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }); } catch { return undefined; } },
  async set(k, v) { try { const db = await this.open(); await new Promise(res => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = res; }); } catch { } },
  async del(k) { try { const db = await this.open(); await new Promise(res => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch { } }
};
const ls = {
  get(k, d = null) { try { const v = localStorage.getItem('af.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('af.' + k, JSON.stringify(v)); } catch { } },
  del(k) { try { localStorage.removeItem('af.' + k); } catch { } }
};

/* ---------- API (Apps Script) ---------- */
const apiUrl = () => CONFIG.APPS_SCRIPT_URL || ls.get('apiUrl', '');
async function api(action, payload = {}) {
  const url = apiUrl(); if (!url) throw new Error('Servidor não configurado.');
  const body = JSON.stringify({ action, token: Session.token, ...payload });
  const r = await fetch(url, { method: 'POST', body, redirect: 'follow' });
  const j = await r.json();
  if (!j.ok) { const e = new Error(j.error || 'Falha no servidor'); e.code = j.code; throw e; }
  return j.data;
}

/* ---------- Sessão ---------- */
const Session = {
  mode: null, token: null, user: null,
  load() { const s = ls.get('session'); if (s) Object.assign(this, s); return !!this.user; },
  save() { ls.set('session', { mode: this.mode, token: this.token, user: this.user }); },
  clear() { this.mode = this.token = this.user = null; ls.del('session'); },
  get isStaff() { return this.user && (this.user.papel === 'admin' || this.user.papel === 'equipe'); },
  get isAdmin() { return this.user && this.user.papel === 'admin'; },
  get remote() { return this.mode === 'remote'; }
};

/* ---------- Banco de dados local + sincronização ---------- */
const COLLS = ['clientes', 'processos', 'movimentos', 'prazos', 'empresas', 'contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos', 'config'];
const DB = {
  data: {}, outbox: [], syncing: false, lastSync: null,
  key() { return 'db:' + (Session.mode || 'x') + ':' + (Session.user?.email || 'local'); },
  reset() { this.data = {}; COLLS.forEach(c => this.data[c] = new Map()); },
  all(c) { return [...(this.data[c] || new Map()).values()]; },
  get(c, id) { return this.data[c]?.get(id) || null; },
  where(c, fn) { return this.all(c).filter(fn); },
  async init() {
    this.reset();
    const cached = await kv.get(this.key());
    if (cached) { for (const c of COLLS) for (const r of (cached[c] || [])) this.data[c].set(r.id, r); this.lastSync = cached._lastSync || null; }
    this.outbox = (await kv.get(this.key() + ':outbox')) || [];
  },
  async persist() {
    const o = { _lastSync: this.lastSync }; for (const c of COLLS) o[c] = this.all(c);
    await kv.set(this.key(), o); await kv.set(this.key() + ':outbox', this.outbox);
  },
  async pull() {
    if (!Session.remote) return;
    const d = await api('load');
    this.reset();
    for (const c of COLLS) for (const r of (d[c] || [])) this.data[c].set(r.id, r);
    // reaplica operações ainda não enviadas
    for (const op of this.outbox) this._applyLocal(op);
    this.lastSync = new Date().toISOString();
    await this.persist();
  },
  _applyLocal(op) {
    if (op.op === 'save') op.records.forEach(r => this.data[op.c].set(r.id, r));
    else op.ids.forEach(id => this.data[op.c].delete(id));
  },
  stamp(r) { r.updatedAt = new Date().toISOString(); r.updatedBy = Session.user?.email || 'local'; if (!r.createdAt) r.createdAt = r.updatedAt; return r; },
  async save(c, recs) {
    recs = (Array.isArray(recs) ? recs : [recs]).map(r => { if (!r.id) r.id = uid(c.slice(0, 2)); return this.stamp(r); });
    const op = { op: 'save', c, records: recs };
    this._applyLocal(op);
    if (Session.remote) { for (let i = 0; i < recs.length; i += 250) this.outbox.push({ op: 'save', c, records: recs.slice(i, i + 250) }); }
    await this.persist(); this.flush();
    return recs;
  },
  async remove(c, ids) {
    ids = Array.isArray(ids) ? ids : [ids];
    const op = { op: 'remove', c, ids }; this._applyLocal(op);
    if (Session.remote) this.outbox.push(op);
    await this.persist(); this.flush();
  },
  async flush() {
    if (!Session.remote || this.syncing || !this.outbox.length) { UI.syncBadge(); return; }
    if (!navigator.onLine) { UI.syncBadge(); return; }
    this.syncing = true; UI.syncBadge();
    try {
      while (this.outbox.length) {
        const op = this.outbox[0];
        if (op.op === 'save') await api('save', { collection: op.c, records: op.records });
        else await api('remove', { collection: op.c, ids: op.ids });
        this.outbox.shift(); await kv.set(this.key() + ':outbox', this.outbox);
      }
      this.lastSync = new Date().toISOString();
    } catch (e) {
      if (e.code === 'AUTH') { UI.toast('Sessão expirada. Entre novamente.', 'bad'); App.logout(); }
      else UI.toast('Sem conexão com o servidor — alterações guardadas e serão enviadas depois.', 'warn');
    } finally { this.syncing = false; UI.syncBadge(); }
  }
};
window.addEventListener('online', () => DB.flush());
/* =====================================================================
   Esquemas de dados — espelham as abas da planilha de auditoria
   ===================================================================== */
const F = (k, label, type = 'text', o = {}) => ({ k, label, type, ...o });
const SIM_NAO = ['Sim', 'Não', 'Parcial', 'Não verificado', 'Não aplicável'];
const RISCOS = ['Baixo', 'Médio', 'Alto', 'Crítico'];
const AREAS = {
  civil: { nome: 'Cível', icon: 'scale' },
  penal: { nome: 'Penal', icon: 'gavel' },
  administrativo: { nome: 'Administrativo', icon: 'landmark' },
  previdenciario: { nome: 'Previdenciário', icon: 'shield' },
  trabalhista: { nome: 'Trabalhista', icon: 'briefcase' }
};

const SCHEMAS = {
  /* ---------------- Judicial ---------------- */
  clientes: {
    titulo: 'Clientes', singular: 'cliente', fields: [
      F('tipo', 'Tipo', 'select', { opts: ['Pessoa física', 'Pessoa jurídica'], list: 1, req: 1 }),
      F('nome', 'Nome / razão social', 'text', { list: 1, req: 1, w: 'full' }),
      F('doc', 'CPF / CNPJ', 'doc', { list: 1 }),
      F('email', 'E-mail (acesso ao portal)', 'email', { list: 1 }),
      F('telefone', 'Telefone / WhatsApp', 'tel', { list: 1 }),
      F('endereco', 'Endereço', 'text', { w: 'full' }),
      F('obs', 'Observações', 'long')
    ]
  },
  processos: {
    titulo: 'Processos', singular: 'processo', fields: [
      F('numero', 'Número do processo (CNJ)', 'cnj', { list: 1, req: 1 }),
      F('area', 'Área', 'select', { opts: Object.keys(AREAS), labels: Object.values(AREAS).map(a => a.nome), req: 1 }),
      F('clienteIds', 'Cliente(s)', 'clientes', { w: 'full', req: 1 }),
      F('polo', 'Polo do cliente', 'select', { opts: ['Autor', 'Réu', 'Requerente', 'Requerido', 'Reclamante', 'Reclamado', 'Exequente', 'Executado', 'Impetrante', 'Assistente de acusação', 'Querelante', 'Querelado', 'Investigado', 'Terceiro interessado'] }),
      F('parteContraria', 'Parte contrária', 'text'),
      F('classe', 'Classe processual', 'text', { list: 1 }),
      F('assunto', 'Assunto', 'text'),
      F('orgao', 'Órgão julgador (vara/câmara)', 'text', { list: 1 }),
      F('comarca', 'Comarca / seção', 'text'),
      F('tribunal', 'Tribunal', 'text', { hint: 'Preenchido automaticamente pelo número CNJ' }),
      F('distribuicao', 'Data de distribuição', 'date'),
      F('valorCausa', 'Valor da causa (R$)', 'money'),
      F('status', 'Situação', 'select', { opts: ['Ativo', 'Suspenso', 'Sobrestado', 'Arquivado provisoriamente', 'Encerrado'], list: 1 }),
      F('fase', 'Fase', 'select', { opts: ['Conhecimento', 'Instrução', 'Sentença', 'Recursal', 'Cumprimento de sentença', 'Execução', 'Inquérito', 'Administrativa'] }),
      F('responsavel', 'Advogado responsável', 'text'),
      F('honorarios', 'Honorários contratados', 'text'),
      F('segredo', 'Segredo de justiça', 'bool'),
      F('notificarCliente', 'Avisar o cliente por e-mail a cada nova movimentação', 'bool', { w: 'full' }),
      F('obs', 'Anotações internas (não visíveis ao cliente)', 'long')
    ]
  },
  movimentos: {
    titulo: 'Movimentações', singular: 'movimentação', fields: [
      F('data', 'Data', 'date', { req: 1 }),
      F('titulo', 'Movimentação', 'text', { req: 1, w: 'full' }),
      F('descricao', 'Detalhes', 'long'),
      F('explicacao', 'Explicação ao cliente (linguagem simples)', 'long', { hint: 'Aparece no portal do cliente abaixo da movimentação' }),
      F('visivelCliente', 'Visível no portal do cliente', 'bool')
    ]
  },
  prazos: {
    titulo: 'Agenda e prazos', singular: 'compromisso', fields: [
      F('tipo', 'Tipo', 'select', { opts: ['Prazo', 'Audiência', 'Perícia', 'Reunião', 'Diligência', 'Julgamento', 'Outro'], req: 1 }),
      F('data', 'Data', 'date', { req: 1 }),
      F('hora', 'Hora', 'time'),
      F('descricao', 'Descrição', 'text', { req: 1, w: 'full' }),
      F('local', 'Local / link', 'text', { w: 'full' }),
      F('concluido', 'Concluído', 'bool'),
      F('visivelCliente', 'Visível no portal do cliente', 'bool')
    ]
  },
  /* ---------------- Consultoria ---------------- */
  empresas: {
    titulo: 'Empresas', singular: 'empresa', fields: [
      F('razao', 'Razão social', 'text', { req: 1, w: 'full' }),
      F('fantasia', 'Nome fantasia', 'text'),
      F('cnpj', 'CNPJ', 'doc'),
      F('segmento', 'Segmento', 'text'),
      F('sigla', 'Prefixo dos IDs de contrato', 'text', { hint: 'Ex.: JSP (gera JSP-001, JSP-002…)' }),
      F('contato', 'Contato principal', 'text'),
      F('email', 'E-mail', 'email'),
      F('telefone', 'Telefone', 'tel'),
      F('inicio', 'Início da consultoria', 'date'),
      F('honorario', 'Honorário mensal (R$)', 'money'),
      F('clienteId', 'Cliente com acesso ao portal', 'cliente', { hint: 'Permite à empresa ver painel e plano de ação no portal' }),
      F('obs', 'Observações', 'long')
    ]
  },
  contratos: {
    titulo: 'Contratos', sheet: 'Cadastro contratos', singular: 'contrato', key: 'codigo', fields: [
      F('codigo', 'ID contrato', 'text', { list: 1, req: 1 }),
      F('tomador', 'Tomador/cliente', 'text', { list: 1, w: 'full' }),
      F('cnpjTomador', 'CNPJ tomador', 'doc'),
      F('unidade', 'Unidade/local', 'text', { list: 1 }),
      F('grupo', 'Grupo contratual', 'text'),
      F('natureza', 'Natureza (público/privado)', 'select', { opts: ['Público', 'Privado'] }),
      F('objeto', 'Objeto/escopo resumido', 'long'),
      F('numero', 'Nº contrato/processo', 'text', { list: 1 }),
      F('inicio', 'Data início', 'date'),
      F('fim', 'Data fim/vigência', 'date', { list: 1 }),
      F('prazo', 'Prazo/prorrogação', 'text'),
      F('valorMensal', 'Valor mensal contratado (R$)', 'money', { list: 1 }),
      F('valorAnual', 'Valor anual estimado (R$)', 'money'),
      F('reajuste', 'Índice/data-base reajuste', 'text'),
      F('cct', 'Convenção coletiva/categoria', 'text'),
      F('fiscal', 'Fiscal/gestor do contrato', 'text'),
      F('responsavel', 'Responsável interno', 'text'),
      F('aditivos', 'Aditivos/alterações', 'long'),
      F('documentos', 'Documentos recebidos?', 'text'),
      F('status', 'Status', 'text', { list: 1 })
    ]
  },
  obrigacoes: {
    titulo: 'Obrigações', sheet: 'Obrigações', singular: 'obrigação', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1, req: 1 }),
      F('clausula', 'Cláusula/item', 'text', { list: 1 }),
      F('grupo', 'Grupo', 'select', { opts: ['Mão de obra', 'Benefícios', 'Materiais', 'Equipamentos', 'Gestão', 'Documental', 'Financeiro', 'Trabalhista', 'Previdenciário', 'Tributário', 'SST', 'Outros'], list: 1 }),
      F('obrigacao', 'Obrigação contratual / entrega exigida', 'long', { list: 1 }),
      F('frequencia', 'Frequência/prazo', 'text'),
      F('qtdPrevista', 'Quantidade prevista', 'text'),
      F('unidade', 'Unidade', 'text'),
      F('responsavel', 'Responsável', 'text'),
      F('evidencia', 'Evidência exigida', 'text'),
      F('verificado', 'O que foi verificado', 'long'),
      F('qtdRealizada', 'Quantidade realizada', 'text'),
      F('status', 'Status (cumprimento)', 'select', { opts: ['Cumprido', 'Parcialmente cumprido', 'Não cumprido', 'Não verificado', 'Não aplicável'], list: 1 }),
      F('desvio', 'Desvio/pendência', 'text'),
      F('impacto', 'Impacto (baixo/médio/alto)', 'select', { opts: ['Baixo', 'Médio', 'Alto'], list: 1 }),
      F('valorPrevisto', 'Valor previsto (R$)', 'money'),
      F('valorRealizado', 'Valor realizado (R$)', 'money'),
      F('diferenca', 'Diferença (R$)', 'money', { calc: 1 }),
      F('providencia', 'Providência recomendada', 'long'),
      F('prazo', 'Prazo', 'date'),
      F('respCorrecao', 'Responsável pela correção', 'text')
    ]
  },
  maoDeObra: {
    titulo: 'Mão de obra', sheet: 'Mão de obra', singular: 'posto', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1, req: 1 }),
      F('competencia', 'Competência (MM/AAAA)', 'comp', { list: 1 }),
      F('posto', 'Posto/função', 'text', { list: 1 }),
      F('cct', 'CCT/categoria', 'text'),
      F('qtdContratada', 'Qtd. contratada', 'num', { list: 1 }),
      F('qtdAlocada', 'Qtd. alocada', 'num', { list: 1 }),
      F('nome', 'Nome/matrícula (controle restrito)', 'text'),
      F('salario', 'Salário-base (R$)', 'money', { list: 1 }),
      F('adicionais', 'Adicionais (R$)', 'money'),
      F('horasExtras', 'Horas extras (R$)', 'money'),
      F('beneficios', 'Benefícios (R$)', 'money'),
      F('encargos', 'Encargos/provisões (R$)', 'money'),
      F('custoApurado', 'Custo total apurado (R$)', 'money', { list: 1 }),
      F('custoPrevisto', 'Custo previsto (R$)', 'money', { list: 1 }),
      F('diferenca', 'Diferença (R$)', 'money', { calc: 1, list: 1 }),
      F('ponto', 'Ponto/escala conferidos?', 'select', { opts: SIM_NAO }),
      F('folha', 'Folha/holerites conferidos?', 'select', { opts: SIM_NAO }),
      F('fgtsInss', 'FGTS/INSS conferidos?', 'select', { opts: SIM_NAO }),
      F('benefComprovados', 'Benefícios comprovados?', 'select', { opts: SIM_NAO }),
      F('aso', 'ASO/treinamentos/EPI?', 'select', { opts: SIM_NAO }),
      F('divergencia', 'Divergência/risco', 'text', { list: 1 }),
      F('evidencia', 'Evidência/localização', 'text')
    ]
  },
  materiais: {
    titulo: 'Materiais', sheet: 'Materiais', singular: 'item', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1, req: 1 }),
      F('competencia', 'Competência', 'comp', { list: 1 }),
      F('item', 'Item/material/equipamento', 'text', { list: 1 }),
      F('especificacao', 'Especificação exigida', 'text'),
      F('unidade', 'Unidade', 'text'),
      F('qtdPrevista', 'Qtd. prevista', 'num', { list: 1 }),
      F('qtdComprada', 'Qtd. comprada', 'num'),
      F('qtdEntregue', 'Qtd. entregue ao posto', 'num', { list: 1 }),
      F('qtdConsumida', 'Qtd. consumida/estoque', 'num'),
      F('fornecedor', 'Fornecedor', 'text'),
      F('nf', 'NF/documento', 'text'),
      F('dataCompra', 'Data compra', 'date'),
      F('precoUnit', 'Preço unitário (R$)', 'money'),
      F('valorTotal', 'Valor total (R$)', 'money', { list: 1 }),
      F('previsto', 'Orçamento/previsto (R$)', 'money', { list: 1 }),
      F('diferenca', 'Diferença (R$)', 'money', { calc: 1, list: 1 }),
      F('incluso', 'Está incluso no contrato?', 'select', { opts: SIM_NAO }),
      F('qualidade', 'Qualidade/conformidade', 'text'),
      F('estoque', 'Estoque/controle conferido?', 'select', { opts: SIM_NAO }),
      F('uso', 'Uso no posto comprovado?', 'select', { opts: SIM_NAO }),
      F('falta', 'Falta/excesso/desperdício', 'text'),
      F('obs', 'Observações/evidência', 'long')
    ]
  },
  financeiro: {
    titulo: 'Financeiro', sheet: 'Financeiro', singular: 'lançamento', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1 }),
      F('competencia', 'Competência', 'comp', { list: 1 }),
      F('tipo', 'Tipo (receita/custo)', 'select', { opts: ['Receita', 'Receita prevista', 'Custo', 'Custo previsto', 'Tributo', 'Retenção', 'Glosa'], list: 1 }),
      F('grupo', 'Grupo', 'text', { list: 1 }),
      F('descricao', 'Descrição', 'text', { list: 1, w: 'full' }),
      F('documento', 'Documento de suporte', 'text'),
      F('emissao', 'Data emissão', 'date'),
      F('vencimento', 'Data vencimento', 'date'),
      F('pagamento', 'Data pagamento/recebimento', 'date'),
      F('previsto', 'Valor previsto (R$)', 'money', { list: 1 }),
      F('realizado', 'Valor realizado (R$)', 'money', { list: 1 }),
      F('diferenca', 'Diferença (R$)', 'money', { calc: 1 }),
      F('pago', 'Pago/recebido?', 'text', { list: 1 }),
      F('centroCusto', 'Centro de custo', 'text'),
      F('classificacao', 'Classificação (direto/indireto)', 'select', { opts: ['Direto', 'Indireto'] }),
      F('obs', 'Observações', 'long')
    ]
  },
  medicoes: {
    titulo: 'Medições', sheet: 'Medições', singular: 'medição', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1, req: 1 }),
      F('competencia', 'Competência', 'comp', { list: 1 }),
      F('numero', 'Nº medição', 'text', { list: 1 }),
      F('periodo', 'Período medido', 'text'),
      F('servico', 'Serviço/indicador medido', 'text'),
      F('meta', 'Meta contratual', 'text'),
      F('resultado', 'Resultado apurado', 'text'),
      F('unidade', 'Unidade', 'text'),
      F('aprovado', 'Aprovado pelo tomador?', 'select', { opts: SIM_NAO, list: 1 }),
      F('valorMedido', 'Valor medido (R$)', 'money', { list: 1 }),
      F('valorFaturado', 'Valor faturado (R$)', 'money', { list: 1 }),
      F('glosa', 'Valor glosado/retido (R$)', 'money', { list: 1 }),
      F('nf', 'NF nº/data', 'text'),
      F('protocolo', 'Data de protocolo', 'date'),
      F('pagamento', 'Data de pagamento', 'date', { list: 1 }),
      F('prazoPgto', 'Prazo contratual pagamento', 'text', { hint: 'Nº de dias após o protocolo' }),
      F('atraso', 'Atraso (dias)', 'num', { calc: 1, list: 1 }),
      F('justificativa', 'Justificativa/glosa', 'text'),
      F('evidencia', 'Evidência', 'text')
    ]
  },
  indicadores: {
    titulo: 'Indicadores mensais', sheet: 'Indicadores mensais', singular: 'competência', key: 'competencia', fields: [
      F('competencia', 'Competência (MM/AAAA)', 'comp', { list: 1, req: 1 }),
      F('receita', 'Receita bruta (R$)', 'money', { list: 1 }),
      F('custo', 'Custo total (R$)', 'money', { list: 1 }),
      F('folha', 'Folha de pagamento (R$)', 'money', { list: 1 }),
      F('inss', 'INSS / previdência (R$)', 'money', { list: 1 }),
      F('fgts', 'FGTS (R$)', 'money', { list: 1 }),
      F('iss', 'ISS (R$)', 'money', { list: 1 }),
      F('federais', 'PIS/COFINS/IRPJ/CSLL (R$)', 'money', { list: 1 }),
      F('outrosTributos', 'Outros tributos (R$)', 'money'),
      F('headcount', 'Funcionários ativos', 'num', { list: 1 }),
      F('admissoes', 'Admissões', 'num', { list: 1 }),
      F('desligamentos', 'Desligamentos', 'num', { list: 1 }),
      F('obs', 'Observações', 'long')
    ]
  },
  achados: {
    titulo: 'Achados e plano de ação', sheet: 'Plano de ação', singular: 'achado', key: 'codigo', fields: [
      F('codigo', 'ID achado', 'text', { list: 1 }),
      F('contrato', 'ID contrato', 'contrato', { list: 1 }),
      F('periodo', 'Competência/período', 'text'),
      F('area', 'Área', 'text', { list: 1 }),
      F('achado', 'Achado/constatação', 'long', { list: 1, req: 1 }),
      F('criterio', 'Critério (cláusula/lei/política)', 'text'),
      F('causa', 'Causa provável', 'text'),
      F('risco', 'Risco/impacto', 'select', { opts: RISCOS, list: 1 }),
      F('valor', 'Valor envolvido (R$)', 'money'),
      F('recomendacao', 'Recomendação/ação corretiva', 'long'),
      F('responsavel', 'Responsável', 'text'),
      F('prazo', 'Prazo', 'date', { list: 1 }),
      F('status', 'Status', 'select', { opts: ['Pendente', 'Em andamento', 'Concluído', 'Validado', 'Não aplicável'], list: 1 }),
      F('evidenciaConclusao', 'Evidência de conclusão', 'text'),
      F('dataValidacao', 'Data de validação', 'date'),
      F('resultado', 'Resultado após correção', 'long')
    ]
  },
  documentos: {
    titulo: 'Inventário documental', sheet: 'Inventário documental', singular: 'documento', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1 }),
      F('tomador', 'Tomador', 'text'),
      F('grupo', 'Grupo contratual', 'text'),
      F('tipo', 'Tipo documento', 'text', { list: 1 }),
      F('numero', 'Número identificado', 'text', { list: 1 }),
      F('arquivo', 'Arquivo', 'text', { list: 1, w: 'full' }),
      F('link', 'Link do arquivo (Drive)', 'link', { list: 1, w: 'full' }),
      F('origem', 'RAR de origem', 'text'),
      F('caminho', 'Caminho interno', 'text', { w: 'full' }),
      F('paginas', 'Páginas', 'num', { list: 1 }),
      F('caracteres', 'Caracteres extraídos', 'num'),
      F('legibilidade', 'Legibilidade', 'text', { list: 1 }),
      F('valor', 'Valor rotulado (R$)', 'money'),
      F('tipoValor', 'Tipo valor', 'text'),
      F('datas', 'Datas mencionadas', 'text'),
      F('trecho', 'Trecho do valor', 'text'),
      F('limitacao', 'Limitação', 'text')
    ]
  },
  aditivos: {
    titulo: 'Aditivos', sheet: 'Aditivos identificados', singular: 'aditivo', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1 }),
      F('grupo', 'Grupo', 'text'),
      F('numero', 'Número identificado', 'text', { list: 1 }),
      F('nome', 'Nome do aditivo', 'text', { list: 1, w: 'full' }),
      F('caminho', 'Caminho interno', 'text', { w: 'full' }),
      F('datas', 'Datas citadas', 'text', { list: 1 }),
      F('valor', 'Valor citado (R$)', 'money', { list: 1 }),
      F('tipoValor', 'Tipo do valor', 'text'),
      F('trecho', 'Trecho de origem', 'text'),
      F('providencia', 'Providência de validação', 'text')
    ]
  }
};
/* coleções de auditoria (uma aba cada), na ordem da planilha */
const AUDIT = ['contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos'];

/* campos calculados — garantem consistência dos dados */
function derive(c, r) {
  const d = (a, b) => (num(a) !== null && num(b) !== null) ? +(num(a) - num(b)).toFixed(2) : (r.diferenca ?? null);
  if (c === 'obrigacoes') r.diferenca = d(r.valorRealizado, r.valorPrevisto);
  if (c === 'maoDeObra') {
    const parts = ['salario', 'adicionais', 'horasExtras', 'beneficios', 'encargos'].map(k => num(r[k]));
    if (num(r.custoApurado) === null && parts.slice(1).some(v => v !== null)) r.custoApurado = +parts.reduce((s, v) => s + (v || 0), 0).toFixed(2);
    r.diferenca = d(r.custoApurado, r.custoPrevisto);
  }
  if (c === 'materiais') {
    if (num(r.valorTotal) === null && num(r.precoUnit) !== null && num(r.qtdComprada) !== null) r.valorTotal = +(num(r.precoUnit) * num(r.qtdComprada)).toFixed(2);
    r.diferenca = d(r.valorTotal, r.previsto);
  }
  if (c === 'financeiro') r.diferenca = d(r.realizado, r.previsto);
  if (c === 'medicoes') {
    const pz = num(r.prazoPgto);
    if (isISO(r.protocolo) && pz !== null) {
      const venc = new Date(r.protocolo + 'T12:00:00'); venc.setDate(venc.getDate() + pz);
      const ref = isISO(r.pagamento) ? new Date(r.pagamento + 'T12:00:00') : new Date();
      r.atraso = Math.max(0, Math.round((ref - venc) / 864e5));
    }
  }
  return r;
}
/* =====================================================================
   Excel (.xlsx) — leitura e gravação sem bibliotecas externas
   ===================================================================== */
const XLSX = (() => {
  const td = new TextDecoder();
  async function inflate(u8) {
    const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  function unzipIndex(buf) {
    const dv = new DataView(buf); let e = buf.byteLength - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('Arquivo não é um .xlsx válido');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
      const name = td.decode(new Uint8Array(buf, p + 46, nl)); p += 46 + nl + xl + cl;
      const lnl = dv.getUint16(lho + 26, true), lxl = dv.getUint16(lho + 28, true);
      files[name] = { method, raw: new Uint8Array(buf, lho + 30 + lnl + lxl, csize) };
    }
    return files;
  }
  async function text(files, name) {
    name = name.replace(/^\//, '');
    const f = files[name]; if (!f) return null;
    return td.decode(f.method === 0 ? f.raw : await inflate(f.raw));
  }
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const tags = (el, t) => [...el.getElementsByTagNameNS('*', t)];
  const colIdx = ref => { const m = ref.match(/^[A-Z]+/)[0]; let n = 0; for (const ch of m) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

  /** lê um .xlsx → { nomeDaAba: [[...linha], ...] } */
  async function read(buf) {
    const files = unzipIndex(buf);
    const wb = xml(await text(files, 'xl/workbook.xml'));
    const rels = xml(await text(files, 'xl/_rels/workbook.xml.rels'));
    const relMap = {}; tags(rels, 'Relationship').forEach(r => relMap[r.getAttribute('Id')] = r.getAttribute('Target'));
    const ssTxt = await text(files, 'xl/sharedStrings.xml');
    const ss = ssTxt ? tags(xml(ssTxt), 'si').map(si => tags(si, 't').map(t => t.textContent).join('')) : [];
    const out = {};
    for (const sh of tags(wb, 'sheet')) {
      const rid = sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sh.getAttribute('r:id');
      let target = relMap[rid] || ''; target = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
      const sx = await text(files, target); if (!sx) continue;
      const rows = [];
      for (const row of tags(xml(sx), 'row')) {
        const ri = +row.getAttribute('r') - 1; const arr = [];
        for (const c of tags(row, 'c')) {
          const ref = c.getAttribute('r'), t = c.getAttribute('t');
          const vEl = tags(c, 'v')[0]; let v = vEl ? vEl.textContent : null;
          if (t === 's') v = ss[+v] ?? '';
          else if (t === 'inlineStr') v = tags(c, 't').map(x => x.textContent).join('');
          else if (t === 'b') v = v === '1';
          else if (t === 'str' || t === 'e') v = v ?? '';
          else if (v !== null && v !== '') v = +v;
          arr[ref ? colIdx(ref) : arr.length] = v;
        }
        rows[ri] = arr;
      }
      out[sh.getAttribute('name')] = Array.from(rows, r => r || []);
    }
    return out;
  }

  /* ---------- gravação ---------- */
  const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(entries) { // entries: [{name, data:Uint8Array}] — armazenado (sem compressão)
    const te = new TextEncoder(); const chunks = []; const central = []; let off = 0;
    for (const e of entries) {
      const nm = te.encode(e.name), crc = crc32(e.data), sz = e.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
      chunks.push(new Uint8Array(lh.buffer), nm, e.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + sz;
    }
    const cdSize = central.reduce((s, c) => s + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  /** sheets: [{name, title?, subtitle?, headers:[], types:[], rows:[[]]}] */
  function write(sheets) {
    const te = new TextEncoder(); const files = [];
    const safe = []; sheets.forEach(s => { let n = s.name.replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31); while (safe.includes(n)) n = n.slice(0, 29) + '_' + safe.length; safe.push(n); });
    files.push({ name: '[Content_Types].xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`) });
    files.push({ name: '_rels/.rels', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) });
    files.push({ name: 'xl/workbook.xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safe.map((n, i) => `<sheet name="${x(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><definedNames>${sheets.map((s, i) => s.rows.length ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${x(safe[i]).replace(/'/g, "''")}'!$A$${s.title ? 3 : 1}:$${colName(s.headers.length - 1)}$${(s.title ? 3 : 1) + s.rows.length}</definedName>` : '').join('')}</definedNames></workbook>`) });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) });
    // estilos: 0 normal, 1 cabeçalho, 2 moeda, 3 título, 4 subtítulo, 5 texto com quebra
    files.push({ name: 'xl/styles.xml', data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/></numFmts><fonts count="4"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF14203A"/><name val="Calibri"/></font><font><i/><sz val="9"/><color rgb="FF6B6F7B"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF14203A"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="thin"><color rgb="FFE7E0D2"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="6"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="164" borderId="1" applyNumberFormat="1" applyBorder="1"/><xf fontId="2" applyFont="1"/><xf fontId="3" applyFont="1"/><xf borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`) });
    sheets.forEach((s, i) => {
      const start = s.title ? 3 : 1; let rowsXml = '';
      if (s.title) rowsXml += `<row r="1"><c r="A1" t="inlineStr" s="3"><is><t>${x(s.title)}</t></is></c></row><row r="2"><c r="A2" t="inlineStr" s="4"><is><t>${x(s.subtitle || '')}</t></is></c></row>`;
      rowsXml += `<row r="${start}" ht="30" customHeight="1">${s.headers.map((h, ci) => `<c r="${colName(ci)}${start}" t="inlineStr" s="1"><is><t>${x(h)}</t></is></c>`).join('')}</row>`;
      s.rows.forEach((r, ri) => {
        const rn = start + 1 + ri;
        rowsXml += `<row r="${rn}">${r.map((v, ci) => {
          if (v === null || v === undefined || v === '') return '';
          const ref = colName(ci) + rn, ty = s.types?.[ci];
          if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"${ty === 'money' ? ' s="2"' : ' s="5"'}><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr" s="5"><is><t xml:space="preserve">${x(v)}</t></is></c>`;
        }).join('')}</row>`;
      });
      const widths = s.headers.map((h, ci) => { const L = Math.max(h.length, ...s.rows.slice(0, 200).map(r => String(r[ci] ?? '').length)); return Math.min(60, Math.max(10, L * 0.95)); });
      const last = colName(s.headers.length - 1) + (start + s.rows.length);
      files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: te.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${start}" topLeftCell="A${start + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, ci) => `<col min="${ci + 1}" max="${ci + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join('')}</cols><sheetData>${rowsXml}</sheetData>${s.rows.length ? `<autoFilter ref="A${start}:${last}"/>` : ''}</worksheet>`) });
    });
    return zip(files);
  }
  return { read, write };
})();

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
/* =====================================================================
   Gráficos em SVG — leves, sem dependências, com dica ao passar o mouse
   ===================================================================== */
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
function niceScale(min, max, ticks = 4) {
  if (min === max) { max = min + 1; }
  const span = max - min, raw = span / ticks, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = []; for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return { lo, hi, ticks: out };
}
function roundTop(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
/** spec: {labels, series:[{name, values, color?}], kind:'line'|'bar'|'stack', fmt, axisFmt} */
function svgChart(spec, W = 640, H = 240) {
  const { labels, series } = spec, kind = spec.kind || 'line';
  const fmtAx = spec.axisFmt || fmtMoneyShort;
  const n = labels.length, padL = 64, padR = 14, padT = 12, padB = 28;
  const pw = Math.max(40, W - padL - padR), ph = H - padT - padB;
  let vals = [];
  if (kind === 'stack') for (let i = 0; i < n; i++) vals.push(series.reduce((s, se) => s + Math.max(0, num(se.values[i]) || 0), 0));
  else series.forEach(se => se.values.forEach(v => { if (num(v) !== null) vals.push(num(v)); }));
  const sc = niceScale(Math.min(0, ...vals, 0), Math.max(0, ...vals, 1));
  const y = v => padT + ph - ((v - sc.lo) / (sc.hi - sc.lo)) * ph;
  const band = pw / Math.max(1, n);
  const xc = i => padL + band * i + band / 2;
  let g = '';
  sc.ticks.forEach(t => { g += `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}" class="${t === 0 ? 'axis0' : 'grid'}"/><text x="${padL - 8}" y="${y(t) + 4}" class="tick" text-anchor="end">${esc(fmtAx(t))}</text>`; });
  const every = Math.max(1, Math.ceil(n * 46 / pw));
  labels.forEach((l, i) => { if (i % every === 0 || i === n - 1 && n < 6) g += `<text x="${xc(i)}" y="${H - 8}" class="tick" text-anchor="middle">${esc(l)}</text>`; });
  let marks = '';
  if (kind === 'line') {
    series.forEach((se, si) => {
      const col = se.color || SERIES[si]; let d = '', pen = false;
      se.values.forEach((v, i) => { const nv = num(v); if (nv === null) { pen = false; return; } d += (pen ? 'L' : 'M') + xc(i).toFixed(1) + ',' + y(nv).toFixed(1); pen = true; });
      marks += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (n <= 24) se.values.forEach((v, i) => { const nv = num(v); if (nv !== null) marks += `<circle cx="${xc(i)}" cy="${y(nv)}" r="4" fill="${col}" stroke="var(--chart-bg)" stroke-width="2"/>`; });
    });
    marks += `<line class="xhair" x1="0" x2="0" y1="${padT}" y2="${padT + ph}" style="display:none"/>`;
  } else if (kind === 'bar') {
    const ns = series.length, gw = Math.min(band * 0.72, ns * 26), bw = Math.max(3, gw / ns - 2);
    series.forEach((se, si) => se.values.forEach((v, i) => {
      const nv = num(v); if (nv === null) return;
      const x0 = xc(i) - gw / 2 + si * (bw + 2), top = y(Math.max(0, nv)), h = Math.abs(y(nv) - y(0));
      marks += nv >= 0 ? `<path d="${roundTop(x0, top, bw, h, 4)}" fill="${se.color || SERIES[si]}"/>` : `<rect x="${x0}" y="${y(0)}" width="${bw}" height="${h}" fill="${se.color || SERIES[si]}"/>`;
    }));
  } else if (kind === 'stack') {
    const bw = Math.min(band * 0.6, 34);
    for (let i = 0; i < n; i++) {
      let acc = 0; const segs = series.map((se, si) => ({ v: Math.max(0, num(se.values[i]) || 0), si })).filter(s => s.v > 0);
      segs.forEach((s, k) => {
        const yTop = y(acc + s.v), yBot = y(acc); acc += s.v;
        const h = Math.max(0, yBot - yTop - (k ? 2 : 0));
        const col = series[s.si].color || SERIES[s.si];
        marks += k === segs.length - 1 ? `<path d="${roundTop(xc(i) - bw / 2, yTop, bw, h, 4)}" fill="${col}"/>` : `<rect x="${xc(i) - bw / 2}" y="${yTop}" width="${bw}" height="${h}" fill="${col}"/>`;
      });
    }
  }
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(spec.title || 'Gráfico')}">${g}${marks}<rect class="hit" x="${padL}" y="${padT}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
  return { svg, geom: { padL, band, n, xc } };
}
const Tip = {
  el: null,
  show(html, x, y) {
    if (!this.el) { this.el = document.createElement('div'); this.el.className = 'tip'; document.body.appendChild(this.el); }
    this.el.innerHTML = html; this.el.style.display = 'block';
    const r = this.el.getBoundingClientRect();
    let left = x + 14, top = y + 14;
    if (left + r.width > innerWidth - 8) left = x - r.width - 14;
    if (top + r.height > innerHeight - 8) top = y - r.height - 14;
    this.el.style.left = left + 'px'; this.el.style.top = top + 'px';
  },
  hide() { if (this.el) this.el.style.display = 'none'; }
};
function legendHtml(series) {
  if (series.length < 2) return '';
  return `<div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || SERIES[i]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}
/** monta gráfico interativo num elemento */
function mountChart(el, spec) {
  const fmt = spec.fmt || fmtMoney;
  const has = spec.series.some(s => s.values.some(v => num(v) !== null));
  if (!spec.labels.length || !has) { el.innerHTML = `<div class="chart-empty">${spec.empty || 'Sem dados para o período.'}</div>`; return; }
  const W = Math.max(280, el.clientWidth || 600), H = spec.height || 240;
  const { svg, geom } = svgChart(spec, W, H);
  el.innerHTML = legendHtml(spec.series) + svg + `<button class="link small tbl-toggle" type="button">Ver tabela</button><div class="chart-table" hidden></div>`;
  const s = $('svg', el), hit = $('.hit', s), xh = $('.xhair', s);
  const onMove = ev => {
    const pt = s.getBoundingClientRect(); const sx = (ev.clientX - pt.left) * (W / pt.width);
    const i = Math.max(0, Math.min(geom.n - 1, Math.floor((sx - geom.padL) / geom.band)));
    if (xh) { xh.setAttribute('x1', geom.xc(i)); xh.setAttribute('x2', geom.xc(i)); xh.style.display = ''; }
    const rows = spec.series.map((se, si) => `<div class="tip-row"><i style="background:${se.color || SERIES[si]}"></i><span>${esc(se.name)}</span><b>${num(se.values[i]) === null ? '—' : esc(fmt(se.values[i]))}</b></div>`).join('');
    const total = spec.kind === 'stack' ? `<div class="tip-row total"><span>Total</span><b>${esc(fmt(spec.series.reduce((a, se) => a + (num(se.values[i]) || 0), 0)))}</b></div>` : '';
    Tip.show(`<div class="tip-h">${esc(spec.fullLabels?.[i] || spec.labels[i])}</div>${rows}${total}`, ev.clientX, ev.clientY);
  };
  hit.addEventListener('mousemove', onMove);
  hit.addEventListener('mouseleave', () => { Tip.hide(); if (xh) xh.style.display = 'none'; });
  hit.addEventListener('touchstart', e => onMove(e.touches[0]), { passive: true });
  $('.tbl-toggle', el).onclick = e => {
    const t = $('.chart-table', el); t.hidden = !t.hidden; e.target.textContent = t.hidden ? 'Ver tabela' : 'Ocultar tabela';
    if (!t.hidden && !t.innerHTML) t.innerHTML = `<table class="mini"><thead><tr><th></th>${spec.series.map(se => `<th>${esc(se.name)}</th>`).join('')}</tr></thead><tbody>${spec.labels.map((l, i) => `<tr><td>${esc(spec.fullLabels?.[i] || l)}</td>${spec.series.map(se => `<td class="r">${num(se.values[i]) === null ? '—' : esc(fmt(se.values[i]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };
}
/** barras horizontais (ranking) em HTML */
function hbarHtml(items, fmt = fmtMoney, max = 8) {
  if (!items.length) return '<div class="chart-empty">Sem dados.</div>';
  const top = items.slice(0, max), m = Math.max(...top.map(i => i.value), 1);
  return `<div class="hbars">${top.map(i => `<div class="hbar" title="${esc(i.label)}: ${esc(fmt(i.value))}"><span class="hbar-l">${esc(i.label)}</span><span class="hbar-t"><span style="width:${Math.max(1.5, i.value / m * 100)}%;background:${i.color || 'var(--s1)'}"></span></span><span class="hbar-v">${esc(fmt(i.value))}</span></div>`).join('')}${items.length > max ? `<div class="muted small">+ ${items.length - max} outros</div>` : ''}</div>`;
}
/** barra segmentada (distribuição por status) */
function segBar(parts) {
  const tot = parts.reduce((s, p) => s + p.value, 0);
  if (!tot) return '<div class="chart-empty">Sem registros.</div>';
  return `<div class="segbar">${parts.filter(p => p.value).map(p => `<span style="flex:${p.value};background:${p.color}" title="${esc(p.label)}: ${p.value}"></span>`).join('')}</div>
  <div class="seglegend">${parts.filter(p => p.value).map(p => `<span><i style="background:${p.color}"></i>${esc(p.label)} <b>${p.value}</b> <em>${fmtPct(p.value / tot)}</em></span>`).join('')}</div>`;
}
/* =====================================================================
   Componentes de interface: ícones, avisos, janelas, formulários, tabelas
   ===================================================================== */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  scale: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M3 7h18"/><path d="m6 7-3 7a3 3 0 0 0 6 0Z"/><path d="m18 7-3 7a3 3 0 0 0 6 0Z"/>',
  gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  landmark: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3 3 8h18Z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M16 15h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>', chevL: '<path d="m15 6-6 6 6 6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  whatsapp: '<path d="M3 21l1.7-5A9 9 0 1 1 8 19.4Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2Z"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const UI = {
  toast(msg, kind = 'ok', ms = 3800) {
    let host = $('#toasts'); if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = `${icon(kind === 'ok' ? 'check' : 'alert')}<span>${esc(msg)}</span>`;
    host.appendChild(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
  },
  syncBadge() {
    const b = $('#syncBadge'); if (!b) return;
    if (!Session.remote) { b.className = 'sync local'; b.innerHTML = `${icon('layers')}<span>Modo local</span>`; b.title = 'Dados guardados apenas neste navegador'; return; }
    const pend = DB.outbox.length;
    if (DB.syncing) { b.className = 'sync busy'; b.innerHTML = `${icon('sync', 'spin')}<span>Sincronizando…</span>`; }
    else if (pend) { b.className = 'sync warn'; b.innerHTML = `${icon('clock')}<span>${pend} pendente(s)</span>`; }
    else { b.className = 'sync ok'; b.innerHTML = `${icon('check')}<span>Sincronizado</span>`; }
    b.title = DB.lastSync ? 'Última sincronização: ' + fmtDateTime(DB.lastSync) : '';
  },
  /* ---------- janela modal ---------- */
  modal({ title, sub = '', body, foot = '', wide = false, onOpen }) {
    UI.closeModal();
    const m = document.createElement('div'); m.className = 'modal-bg'; m.id = 'modal';
    m.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><header><div><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="icon-btn" data-close aria-label="Fechar">${icon('x')}</button></header><div class="modal-body">${body}</div>${foot ? `<footer>${foot}</footer>` : ''}</div>`;
    document.body.appendChild(m); document.body.classList.add('noscroll');
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) UI.closeModal(); });
    setTimeout(() => { const f = $('input:not([type=hidden]):not([type=checkbox]),select,textarea', m); f && f.focus(); }, 30);
    onOpen && onOpen(m); return m;
  },
  closeModal() { $('#modal')?.remove(); document.body.classList.remove('noscroll'); },
  confirm(msg, okLabel = 'Confirmar', danger = true) {
    return new Promise(res => {
      const m = UI.modal({ title: 'Confirmação', body: `<p class="confirm-msg">${msg}</p>`, foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfOk">${esc(okLabel)}</button>` });
      $('#cfOk', m).onclick = () => { UI.closeModal(); res(true); };
      m.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === m) res(false); });
    });
  },
  /* ---------- formulário a partir do esquema ---------- */
  field(f, v, ctx = {}) {
    const id = 'f_' + f.k, req = f.req ? ' required' : '', ro = f.calc ? ' readonly tabindex="-1"' : '';
    const lab = `<label for="${id}">${esc(f.label)}${f.req ? ' <b class="req">*</b>' : ''}${f.calc ? ' <em class="calc">automático</em>' : ''}</label>`;
    const hint = f.hint ? `<small>${esc(f.hint)}</small>` : '';
    const gap = isGap(v) ? ' gap' : '';
    let inp = '';
    switch (f.type) {
      case 'long': inp = `<textarea id="${id}" name="${f.k}" rows="3"${req}>${esc(v)}</textarea>`; break;
      case 'select': {
        const opts = f.opts.map((o, i) => `<option value="${esc(o)}" ${String(v ?? '') === o ? 'selected' : ''}>${esc(f.labels?.[i] || o)}</option>`).join('');
        const extra = v && !f.opts.includes(v) ? `<option selected value="${esc(v)}">${esc(v)}</option>` : '';
        inp = `<select id="${id}" name="${f.k}"${req}><option value="">—</option>${opts}${extra}</select>`; break;
      }
      case 'bool': return `<div class="fld check ${f.w === 'full' ? 'full' : ''}"><label class="switch"><input type="checkbox" id="${id}" name="${f.k}" ${v ? 'checked' : ''}><span></span>${esc(f.label)}</label>${hint}</div>`;
      case 'date': inp = isISO(v) || !v ? `<input type="date" id="${id}" name="${f.k}" value="${esc(v || '')}"${req}${ro}>` : `<input type="text" id="${id}" name="${f.k}" value="${esc(v)}" placeholder="dd/mm/aaaa"${req}>`; break;
      case 'time': inp = `<input type="time" id="${id}" name="${f.k}" value="${esc(v || '')}">`; break;
      case 'comp': inp = `<input type="text" id="${id}" name="${f.k}" value="${esc(/^\d{4}-\d{2}$/.test(v || '') ? fmtComp(v) : (v ?? ''))}" placeholder="MM/AAAA" inputmode="numeric"${req}>`; break;
      case 'money': case 'num': inp = `<input type="text" id="${id}" name="${f.k}" inputmode="decimal" value="${esc(num(v) !== null ? (f.type === 'money' ? num(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(num(v)).replace('.', ',')) : (v ?? ''))}"${req}${ro}>`; break;
      case 'email': inp = `<input type="email" id="${id}" name="${f.k}" value="${esc(v)}" autocomplete="off"${req}>`; break;
      case 'tel': inp = `<input type="tel" id="${id}" name="${f.k}" value="${esc(v)}">`; break;
      case 'link': inp = `<input type="url" id="${id}" name="${f.k}" value="${esc(v)}" placeholder="https://drive.google.com/…">`; break;
      case 'doc': inp = `<input type="text" id="${id}" name="${f.k}" value="${esc(isGap(v) ? v : fmtDoc(v))}" inputmode="numeric"${req}>`; break;
      case 'cnj': inp = `<input type="text" id="${id}" name="${f.k}" value="${esc(fmtCNJ(v))}" placeholder="0000000-00.0000.0.00.0000" inputmode="numeric"${req}>`; break;
      case 'contrato': {
        const list = DB.where('contratos', c => c.empresaId === ctx.empresaId).sort((a, b) => String(a.codigo).localeCompare(b.codigo));
        inp = `<input list="dl_${id}" id="${id}" name="${f.k}" value="${esc(v)}"${req}><datalist id="dl_${id}">${list.map(c => `<option value="${esc(c.codigo)}">${esc(c.unidade || c.grupo || c.tomador || '')}</option>`).join('')}</datalist>`; break;
      }
      case 'cliente': {
        const list = DB.all('clientes').sort((a, b) => a.nome.localeCompare(b.nome));
        inp = `<select id="${id}" name="${f.k}"><option value="">— nenhum —</option>${list.map(c => `<option value="${c.id}" ${v === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>`; break;
      }
      case 'clientes': {
        const sel = new Set(v || []); const list = DB.all('clientes').sort((a, b) => a.nome.localeCompare(b.nome));
        inp = `<div class="chips-select" id="${id}" data-name="${f.k}">${list.map(c => `<label class="chip-opt"><input type="checkbox" value="${c.id}" ${sel.has(c.id) ? 'checked' : ''}><span>${esc(c.nome)}</span></label>`).join('') || '<span class="muted small">Nenhum cliente cadastrado ainda.</span>'}<button type="button" class="chip-add" data-newcliente>${icon('plus')} Novo cliente</button></div>`; break;
      }
      default: inp = `<input type="text" id="${id}" name="${f.k}" value="${esc(v)}"${req}${ro}>`;
    }
    return `<div class="fld${f.type === 'long' || f.w === 'full' ? ' full' : ''}${gap}">${lab}${inp}${hint}</div>`;
  },
  form(schema, rec = {}, ctx = {}) { return `<form class="grid-form" novalidate>${schema.fields.map(f => UI.field(f, rec[f.k], ctx)).join('')}</form>`; },
  readForm(form, schema, base = {}) {
    const r = { ...base }; const errs = [];
    for (const f of schema.fields) {
      if (f.calc) continue;
      if (f.type === 'clientes') { r[f.k] = $$(`#f_${f.k} input:checked`, form).map(i => i.value); if (f.req && !r[f.k].length) errs.push(f.label); continue; }
      const el = form.elements[f.k]; if (!el) continue;
      let v = f.type === 'bool' ? el.checked : el.value.trim();
      if (f.type === 'money' || f.type === 'num') v = v === '' ? null : (num(v) ?? v);
      else if (f.type === 'date') v = v === '' ? null : (parseDate(v) || v);
      else if (f.type === 'comp') v = v === '' ? null : (parseComp(v) || v);
      else if (f.type === 'doc') v = isGap(v) ? v : onlyDigits(v) || v;
      else if (f.type === 'cnj') v = onlyDigits(v);
      if (f.req && (v === '' || v === null)) errs.push(f.label);
      if (f.type === 'doc' && v && /^\d+$/.test(v) && !(v.length === 11 ? validCPF(v) : v.length === 14 ? validCNPJ(v) : false)) errs.push(f.label + ' (dígito verificador inválido)');
      if (f.type === 'cnj' && v && !validCNJ(v)) errs.push(f.label + ' (número CNJ inválido)');
      r[f.k] = v;
    }
    return { rec: r, errs };
  },
  /** abre o formulário de edição genérico */
  editRecord(coll, rec, { title, ctx = {}, onSaved, extraBase = {}, allowDelete = true } = {}) {
    const sc = SCHEMAS[coll], isNew = !rec?.id; rec = rec || {};
    const m = UI.modal({
      title: title || (isNew ? 'Novo(a) ' + sc.singular : 'Editar ' + sc.singular), wide: sc.fields.length > 8,
      body: UI.form(sc, rec, ctx),
      foot: `${!isNew && allowDelete ? `<button class="btn ghost danger-text" id="mDel">${icon('trash')} Excluir</button>` : ''}<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="mSave">${icon('check')} Salvar</button>`
    });
    const form = $('form', m);
    $('[data-newcliente]', m)?.addEventListener('click', () => {
      const snap = UI.readForm(form, sc, { ...rec, ...extraBase }).rec;
      UI.editRecord('clientes', null, { onSaved: c => { snap.clienteIds = [...(snap.clienteIds || []), c.id]; UI.editRecord(coll, snap, { title, ctx, onSaved, extraBase, allowDelete }); } });
    });
    $('#mSave', m).onclick = async () => {
      const { rec: r, errs } = UI.readForm(form, sc, { ...rec, ...extraBase });
      if (errs.length) { UI.toast('Verifique: ' + errs.join(', '), 'bad', 5000); return; }
      if (sc.key && r[sc.key]) {
        const dup = DB.where(coll, x => x.id !== r.id && x[sc.key] === r[sc.key] && (!r.empresaId || x.empresaId === r.empresaId));
        if (dup.length) { UI.toast(`Já existe um registro com ${sc.fields.find(f => f.k === sc.key).label} “${r[sc.key]}”.`, 'bad'); return; }
      }
      derive(coll, r);
      const [saved] = await DB.save(coll, r); UI.closeModal(); UI.toast('Salvo com sucesso.');
      onSaved ? onSaved(saved) : App.render();
    };
    $('#mDel', m)?.addEventListener('click', async () => {
      if (!await UI.confirm(`Excluir este(a) ${sc.singular}? Esta ação não pode ser desfeita.`, 'Excluir')) return;
      await DB.remove(coll, rec.id); UI.toast('Registro excluído.'); App.render();
    });
    return m;
  },
  /* ---------- célula formatada ---------- */
  cell(f, v) {
    if (v === null || v === undefined || v === '') return '<span class="nil">—</span>';
    if (isGap(v)) return `<span class="gapcell" title="${esc(v)}">${icon('alert')} não identificado</span>`;
    switch (f.type) {
      case 'money': return num(v) === null ? esc(v) : `<span class="mono ${f.k === 'diferenca' && num(v) < 0 ? 'neg' : f.k === 'diferenca' && num(v) > 0 ? 'pos' : ''}">${esc(fmtMoney(v))}</span>`;
      case 'num': return `<span class="mono">${esc(fmtNum(v))}</span>`;
      case 'date': return esc(fmtDate(v));
      case 'comp': return esc(fmtComp(v));
      case 'doc': return esc(fmtDoc(v));
      case 'cnj': return `<span class="mono">${esc(fmtCNJ(v))}</span>`;
      case 'bool': return v ? icon('check') : '';
      case 'link': return `<a href="${esc(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${icon('link')} abrir</a>`;
      case 'contrato': return `<span class="tag">${esc(v)}</span>`;
    }
    if (['status', 'risco', 'impacto', 'aprovado'].includes(f.k) || f.type === 'select' && f.opts === SIM_NAO) return pill(v);
    const s = String(v); return s.length > 90 ? `<span title="${esc(s)}">${esc(s.slice(0, 88))}…</span>` : esc(s);
  }
};
function pill(v) {
  const n = norm(v); let k = 'neutral';
  if (/^(cumprido|concluido|validado|sim|ativo|aprovado)/.test(n)) k = 'good';
  else if (/critico|^nao cumprido|^nao$|^alto/.test(n)) k = 'critical';
  else if (/^parcial|^medio|em andamento|suspens|sobrest/.test(n)) k = 'warning';
  else if (/pendente|nao verificad|analise/.test(n)) k = 'serious';
  else if (/^baixo/.test(n)) k = 'info';
  return `<span class="pill ${k}">${esc(v)}</span>`;
}

/* ---------- Tabela de dados (busca, filtros, ordenação, paginação) ---------- */
const TableState = {};
function dataTable(host, { id, coll, rows, schema, onOpen, filters = [], actions = '', emptyMsg = 'Nenhum registro.', cols }) {
  const st = TableState[id] = TableState[id] || { q: '', sort: null, dir: 1, page: 0, f: {} };
  const fields = cols ? cols.map(k => schema.fields.find(f => f.k === k)) : schema.fields.filter(f => f.list);
  const draw = () => {
    let list = rows.slice();
    if (st.q) { const q = norm(st.q); list = list.filter(r => schema.fields.some(f => norm(r[f.k]).includes(q))); }
    filters.forEach(fl => { const v = st.f[fl.k]; if (v) list = list.filter(r => (fl.get ? fl.get(r) : r[fl.k]) === v); });
    if (st.sort) {
      const f = schema.fields.find(x => x.k === st.sort);
      list.sort((a, b) => {
        let x = a[st.sort], y = b[st.sort];
        if (f && (f.type === 'money' || f.type === 'num')) { x = num(x) ?? -Infinity; y = num(y) ?? -Infinity; return (x - y) * st.dir; }
        return String(x ?? '').localeCompare(String(y ?? ''), 'pt-BR', { numeric: true }) * st.dir;
      });
    }
    const per = 50, pages = Math.max(1, Math.ceil(list.length / per)); st.page = Math.min(st.page, pages - 1);
    const slice = list.slice(st.page * per, st.page * per + per);
    const moneyF = fields.filter(f => f.type === 'money');
    const totals = moneyF.length ? `<tr class="totals"><td colspan="1">Total (${list.length})</td>${fields.slice(1).map(f => f.type === 'money' ? `<td class="r mono">${esc(fmtMoney(list.reduce((s, r) => s + (num(r[f.k]) || 0), 0)))}</td>` : '<td></td>').join('')}</tr>` : '';
    $('.dt-body', host).innerHTML = slice.length ? `<div class="table-wrap"><table class="dt"><thead><tr>${fields.map(f => `<th data-sort="${f.k}" class="${f.type === 'money' || f.type === 'num' ? 'r' : ''}">${esc(f.label.replace(/ \(R\$\)/, ''))}${st.sort === f.k ? (st.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${slice.map(r => `<tr data-id="${r.id}">${fields.map(f => `<td class="${f.type === 'money' || f.type === 'num' ? 'r' : ''} ${f.type === 'long' ? 'wrap' : ''}">${UI.cell(f, r[f.k])}</td>`).join('')}</tr>`).join('')}${st.page === pages - 1 ? totals : ''}</tbody></table></div>
      ${pages > 1 ? `<div class="pager"><button class="btn ghost sm" data-pg="-1" ${st.page ? '' : 'disabled'}>${icon('chevL')}</button><span>Página ${st.page + 1} de ${pages} · ${list.length} registros</span><button class="btn ghost sm" data-pg="1" ${st.page < pages - 1 ? '' : 'disabled'}>${icon('chevR')}</button></div>` : `<div class="pager"><span>${list.length} registro(s)</span></div>`}` : `<div class="empty">${icon('list')}<p>${rows.length ? 'Nenhum resultado para o filtro.' : emptyMsg}</p></div>`;
    $$('th[data-sort]', host).forEach(th => th.onclick = () => { st.dir = st.sort === th.dataset.sort ? -st.dir : 1; st.sort = th.dataset.sort; draw(); });
    $$('tr[data-id]', host).forEach(tr => tr.onclick = () => onOpen && onOpen(rows.find(r => r.id === tr.dataset.id)));
    $$('[data-pg]', host).forEach(b => b.onclick = () => { st.page += +b.dataset.pg; draw(); });
  };
  host.innerHTML = `<div class="dt-tools"><div class="search">${icon('search')}<input type="search" placeholder="Buscar…" value="${esc(st.q)}"></div>${filters.map(fl => `<select data-filter="${fl.k}"><option value="">${esc(fl.label)}: todos</option>${fl.opts.map(o => `<option ${st.f[fl.k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`).join('')}<span class="sp"></span>${actions}</div><div class="dt-body"></div>`;
  $('.search input', host).oninput = e => { st.q = e.target.value; st.page = 0; draw(); };
  $$('[data-filter]', host).forEach(s => s.onchange = () => { st.f[s.dataset.filter] = s.value; st.page = 0; draw(); });
  draw();
}
/* =====================================================================
   Aplicação: login, estrutura, rotas, painel geral, clientes, agenda,
   acessos e configurações
   ===================================================================== */
const BRAND = {
  logoDark: 'assets/brasao.png', logoLight: 'assets/brasao-claro.png',
  caption: 'Advocacia e Consultoria Jurídica'
};
const escritorio = () => DB.get('config', 'escritorio') || { id: 'escritorio', nome: 'Amorim Firmo', subtitulo: BRAND.caption };

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
    App.shell(); window.onhashchange = () => App.render(); App.render();
    App.checkPendentes();
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
            ${apiUrl() ? `<button class="link small" id="lgSemGoogle">Sou cliente e não tenho conta Google</button>` : ''}
          </div>
          <form id="lgStepEmail" class="stack" hidden>
            <h1>Acesso do cliente</h1>
            <p class="muted">Informe o e-mail cadastrado pelo escritório. Enviaremos um código de acesso.</p>
            <div class="fld"><label for="lgMail">E-mail</label><input type="email" id="lgMail" required autocomplete="email" placeholder="seu@email.com"></div>
            <button class="btn primary block">${icon('mail')} Receber código</button>
            <button type="button" class="link small" data-lgback>Voltar ao login com Google</button>
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
    const L = { email: '', nome: '', foto: '', idToken: null, viaGoogle: true };
    const step = s => ['Google', 'Email', 'Code'].forEach(k => $('#lgStep' + k).hidden = k !== s);
    const aparelho = () => ls.get('aparelho', {});
    const entrar = async r => {
      Session.mode = 'remote'; Session.token = r.token; Session.user = { ...r.user, foto: r.user.foto || L.foto }; Session.save();
      const a = aparelho(); a[Session.user.email] = r.token; ls.set('aparelho', a);
      await DB.init(); try { await DB.pull(); } catch (e) { UI.toast(e.message, 'bad'); } App.boot(); UI.toast('Bem-vindo(a)!');
    };
    const pedirCodigo = async () => {
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
      try { await entrar(await api('verifyCode', { email: L.email, code: cod })); } catch (err) { st.textContent = err.message; $('#lgCodOk').disabled = false; }
    };
    $('#lgReenv').onclick = pedirCodigo;
    $$('[data-lgback]').forEach(b => b.onclick = () => { try { google.accounts.id.disableAutoSelect(); } catch { } step('Google'); });
    $('#lgSemGoogle') && ($('#lgSemGoogle').onclick = () => step('Email'));
    $('#lgStepEmail').onsubmit = e => { e.preventDefault(); L.email = $('#lgMail').value.trim().toLowerCase(); L.viaGoogle = false; L.idToken = null; if (L.email) pedirCodigo(); };
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
    App.globalSearch(); UI.syncBadge(); App.badge();
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
      ${item('/agenda', 'calendar', 'Agenda e prazos', DB.where('prazos', p => !p.concluido && daysUntil(p.data) !== null && daysUntil(p.data) <= 7).length || '')}
      <div class="nav-h">Consultoria jurídica</div>
      ${item('/empresas', 'building', 'Empresas', DB.all('empresas').length || '')}
      ${DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao)).map(e => `<a href="#/empresa/${e.id}" class="sub ${route.startsWith('/empresa/' + e.id) ? 'on' : ''}"><span>${esc(e.fantasia || e.razao)}</span></a>`).join('')}
      <div class="nav-h">Cadastros</div>
      ${item('/clientes', 'users', 'Clientes', DB.all('clientes').length || '')}`;
    $('#lnkGestao')?.classList.toggle('on', route.startsWith('/gestao'));
  },
  crumbs(parts) { $('#crumbs').innerHTML = parts.map((p, i) => i < parts.length - 1 && p.href ? `<a href="#${p.href}">${esc(p.t)}</a>` : `<b>${esc(p.t)}</b>`).join(`<span class="sep">/</span>`); },
  render(keepScroll) {
    if (!Session.isStaff) return Portal.render();
    const route = (location.hash || '#/painel').slice(1).split('?')[0] || '/painel';
    const [, a, b, c] = route.split('/');
    App.nav(route); document.body.classList.remove('side-open'); Tip.hide();
    const v = $('#view'); const y = scrollY;
    try {
      if (a === 'painel' || !a) Views.painel(v);
      else if (a === 'judicial') Judicial.list(v, b || 'todos');
      else if (a === 'processo') Judicial.detail(v, b);
      else if (a === 'agenda') Views.agenda(v);
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
  'Movimentações importadas do DataJud/CNJ, com sincronização diária automática',
  'Agenda de prazos, audiências e compromissos, com alertas',
  'Portal do cliente: acesso próprio e restrito, só aos próprios processos e às movimentações liberadas',
  'Aviso por e-mail ao cliente quando há nova movimentação (opcional por processo)',
  'Consultoria jurídica: empresas, contratos e auditoria em 10 abas (obrigações, mão de obra, materiais, financeiro, medições, indicadores, achados, documentos e aditivos)',
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
    v.innerHTML = `
    <div class="page-h"><div><span class="eyebrow">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>${saudacao()}, ${esc((Session.user.nome || '').split(' ')[0] || 'Dr.')}</h1><p class="muted">Panorama do escritório ${esc(esc0.nome || 'Amorim Firmo')}.</p></div>
      <div class="actions"><button class="btn ghost" id="nProc">${icon('plus')} Novo processo</button><button class="btn primary" id="nEmp">${icon('building')} Nova empresa</button></div></div>
    <div class="kpis">
      ${kpi('Processos em andamento', procs.length, Object.entries(AREAS).map(([k, a]) => `${a.nome} ${procs.filter(p => p.area === k).length}`).join(' · '), '', '#/judicial/todos')}
      ${kpi('Compromissos em 7 dias', prox7.length, atras.length ? `<b class="t-bad">${atras.length} em atraso</b>` : 'nenhum em atraso', atras.length ? 'bad' : '', '#/agenda')}
      ${kpi('Empresas em consultoria', DB.all('empresas').length, `${DB.all('contratos').length} contratos auditados`, '', '#/empresas')}
      ${kpi('Contratos vencendo (90 dias)', venc90.length, 'renovação ou encerramento', venc90.length ? 'warn' : '')}
      ${kpi('Achados de risco alto', achAlt.length, 'em aberto nos planos de ação', achAlt.length ? 'bad' : '')}
    </div>
    <div class="grid2">
      <section class="card"><header><h2>${icon('calendar')} Próximos compromissos</h2><a href="#/agenda" class="link">Ver agenda</a></header>
        ${prazos.length ? `<ul class="agenda-list">${prazos.slice(0, 7).map(Views.agendaItem).join('')}</ul>` : `<div class="empty sm">${icon('calendar')}<p>Nenhum prazo ou audiência cadastrado.</p></div>`}</section>
      <section class="card"><header><h2>${icon('history')} Últimas movimentações</h2></header>
        ${movs.length ? `<ul class="feed">${movs.map(m => { const p = DB.get('processos', m.processoId); return `<li><a href="#/processo/${m.processoId}"><time>${fmtDate(m.data)}</time><div><b>${esc(m.titulo)}</b><small>${esc(p ? fmtCNJ(p.numero) + ' · ' + clienteNomes(p) : '')}</small></div>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : ''}</a></li>`; }).join('')}</ul>` : `<div class="empty sm">${icon('history')}<p>As movimentações dos processos aparecerão aqui.</p></div>`}</section>
    </div>
    <div class="grid2">
      <section class="card"><header><h2>${icon('scale')} Processos por área</h2></header>${hbarHtml(Object.entries(AREAS).map(([k, a], i) => ({ label: a.nome, value: procs.filter(p => p.area === k).length, color: 'var(--s1)' })).filter(x => x.value), v => String(v))}</section>
      <section class="card"><header><h2>${icon('alert')} Alertas da consultoria</h2></header>${Views.alertasConsultoria()}</section>
    </div>`;
    $('#nProc').onclick = () => Judicial.edit(null, 'civil');
    $('#nEmp').onclick = () => Consult.editEmpresa(null);
    $$('[data-done]', v).forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); Views.toggleDone(b.dataset.done); });
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
      foot: `<button class="btn ghost" id="cEdit">${icon('edit')} Editar</button><button class="btn ghost" id="cPrev">${icon('eye')} Ver como o cliente</button><span class="sp"></span>${c.email ? `<button class="btn primary" id="cAcc">${icon('key')} Conceder acesso ao portal</button>` : ''}`
    });
    $('#cEdit', m).onclick = () => UI.editRecord('clientes', c);
    $('#cPrev', m).onclick = () => { UI.closeModal(); Portal.preview(id); };
    $('#cAcc', m)?.addEventListener('click', () => Views.grantAccess(c));
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
    el.innerHTML = `<div class="grid2">
      <section class="card"><header><h2>${icon('link')} Conexões</h2></header>
        <div class="conn"><span class="dot ${apiUrl() ? 'ok' : 'off'}"></span><div><b>Servidor (Google Apps Script)</b><small>${apiUrl() ? esc(apiUrl().slice(0, 60)) + '…' : 'não configurado — preencha APPS_SCRIPT_URL no config.js'}</small></div>${apiUrl() ? `<button class="btn ghost sm" id="tstSrv">Testar</button>` : ''}</div>
        <div class="conn"><span class="dot ${CONFIG.GOOGLE_CLIENT_ID ? 'ok' : 'off'}"></span><div><b>Login com Google</b><small>${CONFIG.GOOGLE_CLIENT_ID ? 'Client ID configurado' : 'não configurado — preencha GOOGLE_CLIENT_ID no config.js'}</small></div></div>
        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>DataJud / CNJ (movimentações)</b><small>${Session.remote ? 'consulta pelo servidor; sincronização diária automática' : 'disponível com o servidor conectado'}</small></div></div>
        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>E-mails (códigos, convites e avisos)</b><small>${Session.remote ? 'enviados pela conta Google dona do Apps Script' : 'disponível com o servidor conectado'}</small></div></div>
        ${CONFIG.APPS_SCRIPT_URL ? '' : `<p class="muted small">Para testar sem editar o config.js: <button class="link" id="cfgSrv">informar URL do servidor neste aparelho</button></p>`}
      </section>
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
/* =====================================================================
   CONSULTORIA JURÍDICA — empresas, auditoria de contratos, painel,
   importação/exportação Excel
   ===================================================================== */
const TABS = [
  ['painel', 'Painel', 'chart'], ['contratos', 'Contratos', 'file'], ['obrigacoes', 'Obrigações', 'check'], ['maoDeObra', 'Mão de obra', 'users'],
  ['materiais', 'Materiais', 'layers'], ['financeiro', 'Financeiro', 'briefcase'], ['medicoes', 'Medições', 'list'], ['indicadores', 'Indicadores', 'chart'],
  ['achados', 'Achados e plano de ação', 'alert'], ['documentos', 'Documentos', 'file'], ['aditivos', 'Aditivos', 'edit'], ['relatorios', 'Relatórios', 'printer']
];
const empRecs = (c, eid) => DB.where(c, r => r.empresaId === eid);
const tomadorBase = c => String(c.tomador || '').split(/ [–-] /)[0].replace(/\(ver unidade\)/i, '').trim() || 'Não informado';

const Consult = {
  list(v) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Empresas' }]);
    const emps = DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>Empresas</h1><p class="muted">Empresas atendidas na gestão e auditoria de contratos.</p></div><div class="actions"><button class="btn primary" id="nEmp">${icon('plus')} Nova empresa</button></div></div>
    ${emps.length ? `<div class="emp-grid">${emps.map(e => {
      const cs = empRecs('contratos', e.id), at = cs.filter(contratoAtivo), ach = empRecs('achados', e.id).filter(achadoAberto);
      const cart = at.reduce((s, c) => s + (num(c.valorMensal) || 0), 0);
      return `<a class="emp-card" href="#/empresa/${e.id}"><div class="emp-ini">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div class="emp-body"><b>${esc(e.fantasia || e.razao)}</b><small>${esc(e.razao)}${e.cnpj ? ' · ' + esc(fmtDoc(e.cnpj)) : ''}</small>
        <div class="emp-stats"><span><b>${cs.length}</b> contratos</span><span><b>${at.length}</b> vigentes</span><span><b>${ach.length}</b> achados abertos</span>${cart ? `<span><b>${fmtMoneyShort(cart)}</b>/mês</span>` : ''}</div></div>${icon('chevR')}</a>`;
    }).join('')}</div>` : `<div class="empty big">${icon('building')}<h3>Nenhuma empresa cadastrada</h3><p>Cadastre a primeira empresa e importe a planilha de auditoria dos contratos.</p><button class="btn primary" id="nEmp2">${icon('plus')} Cadastrar empresa</button></div>`}`;
    $('#nEmp').onclick = () => Consult.editEmpresa(null);
    $('#nEmp2') && ($('#nEmp2').onclick = () => Consult.editEmpresa(null));
  },
  editEmpresa(e) { UI.editRecord('empresas', e, { onSaved: s => { location.hash = '#/empresa/' + s.id; App.render(); } }); },

  workspace(v, eid, tab) {
    const e = DB.get('empresas', eid);
    if (!e) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Empresa não encontrada.</p></div>`; return; }
    const T = TABS.find(t => t[0] === tab) || TABS[0];
    App.crumbs([{ t: 'Consultoria', href: '/empresas' }, { t: e.fantasia || e.razao, href: '/empresa/' + eid }, { t: T[1] }]);
    const count = c => empRecs(c, eid).length;
    v.innerHTML = `<div class="ws-h"><div class="emp-ini lg">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div><span class="eyebrow">Consultoria jurídica</span><h1>${esc(e.fantasia || e.razao)}</h1><p class="muted">${esc(e.razao)}${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}${e.segmento ? ' · ' + esc(e.segmento) : ''}</p></div>
      <div class="actions wrap"><button class="btn ghost" id="wEdit">${icon('edit')} Empresa</button><label class="btn ghost">${icon('upload')} Importar planilha<input type="file" id="wImp" accept=".xlsx" hidden></label><button class="btn ghost" id="wExp">${icon('download')} Exportar Excel</button><button class="btn primary" id="wRep">${icon('printer')} Relatório</button></div></div>
      <div class="tabs scroll">${TABS.map(([k, l, i]) => `<a href="#/empresa/${eid}/${k}" class="${k === T[0] ? 'on' : ''}">${l}${SCHEMAS[k] ? `<em>${count(k)}</em>` : ''}</a>`).join('')}</div>
      <div id="wsBody"></div>`;
    $('#wEdit').onclick = () => Consult.editEmpresa(e);
    $('#wImp').onchange = ev => ev.target.files[0] && Consult.importar(e, ev.target.files[0]);
    $('#wExp').onclick = () => Consult.exportar(e);
    $('#wRep').onclick = () => Report.dialog(e);
    const body = $('#wsBody');
    if (T[0] === 'painel') Consult.painel(body, e);
    else if (T[0] === 'relatorios') Report.tab(body, e);
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
    dataTable($('#dt'), { id: coll + e.id, rows, schema: sc, filters, onOpen: open, actions: `<button class="btn primary sm" id="dtNew">${icon('plus')} Novo</button>`, emptyMsg: `Nenhum registro em ${sc.titulo}. Use “Novo” ou importe a planilha.` });
    $('#dtNew').onclick = () => {
      const base = {}; if (coll === 'contratos' && e.sigla) { const n = rows.map(r => +(String(r.codigo).match(/(\d+)$/) || [0, 0])[1]).reduce((a, b) => Math.max(a, b), 0) + 1; base.codigo = `${e.sigla}-${String(n).padStart(3, '0')}`; }
      if (coll === 'achados') base.status = 'Pendente';
      UI.editRecord(coll, base, { ctx, extraBase: { empresaId: e.id } });
    };
    const k = new URLSearchParams(location.hash.split('?')[1] || '').get('k');
    if (k && coll === 'contratos') { const r = DB.get('contratos', k); r && Consult.contrato360(e, r); }
  },

  /* visão 360º do contrato: tudo que se relaciona a ele */
  contrato360(e, c) {
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
      <div class="detail-grid">${SCHEMAS.contratos.fields.filter(f => !['codigo'].includes(f.k)).map(f => `<div class="${f.type === 'long' ? 'full' : ''}"><span class="lbl">${esc(f.label)}</span>${f.type === 'long' && c[f.k] && !isGap(c[f.k]) ? esc(c[f.k]) : UI.cell(f, c[f.k])}</div>`).join('')}</div>
      ${mini('Achados e plano de ação', 'achados', ac, ['codigo', 'area', 'achado', 'risco', 'status'])}
      ${mini('Obrigações', 'obrigacoes', ob, ['clausula', 'grupo', 'obrigacao', 'status'])}
      ${mini('Mão de obra', 'maoDeObra', mo, ['posto', 'qtdContratada', 'salario', 'custoPrevisto', 'divergencia'])}
      ${mini('Financeiro', 'financeiro', fi, ['tipo', 'grupo', 'descricao', 'previsto', 'realizado'])}
      ${me.length ? mini('Medições', 'medicoes', me, ['competencia', 'numero', 'valorMedido', 'valorFaturado', 'glosa']) : ''}
      ${ma.length ? mini('Materiais', 'materiais', ma, ['item', 'qtdPrevista', 'qtdEntregue', 'valorTotal']) : ''}
      ${mini('Documentos', 'documentos', dc, ['tipo', 'arquivo', 'paginas', 'legibilidade'])}
      ${ad.length ? mini('Aditivos', 'aditivos', ad, ['nome', 'datas', 'valor']) : ''}`,
      foot: `<button class="btn ghost danger-text" id="cDel">${icon('trash')} Excluir</button><span class="sp"></span><button class="btn ghost" id="cAch">${icon('alert')} Registrar achado</button><button class="btn primary" id="cEd">${icon('edit')} Editar contrato</button>`
    });
    $('#cEd', m).onclick = () => UI.editRecord('contratos', c, { ctx: { empresaId: e.id } });
    $('#cAch', m).onclick = () => UI.editRecord('achados', { contrato: c.codigo, status: 'Pendente' }, { ctx: { empresaId: e.id }, extraBase: { empresaId: e.id } });
    $('#cDel', m).onclick = async () => { if (!await UI.confirm(`Excluir o contrato ${c.codigo}? Os registros das outras abas são mantidos.`, 'Excluir')) return; await DB.remove('contratos', c.id); UI.closeModal(); App.render(); };
    $$('[data-rel]', m).forEach(tr => tr.onclick = () => { const [coll, id] = tr.dataset.rel.split(':'); UI.editRecord(coll, DB.get(coll, id), { ctx: { empresaId: e.id } }); });
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
    const achRisco = RISCOS.map((r, i) => ({ label: r, value: S.achAbertos.filter(a => norm(a.risco) === norm(r)).length, color: ['var(--info)', 'var(--warning)', 'var(--serious)', 'var(--critical)'][i] }));
    const achArea = {}; S.achAbertos.forEach(a => achArea[a.area || 'Outros'] = (achArea[a.area || 'Outros'] || 0) + 1);
    const ins = Consult.insights(S);
    host.innerHTML = `
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
      <section class="card"><header><h2>Vencimentos nos próximos 12 meses</h2></header><div data-chart="vc"></div></section>
      <section class="card"><header><h2>Achados em aberto por risco</h2></header>${segBar(achRisco)}<h4 class="sec">Por área</h4>${hbarHtml(Object.entries(achArea).map(([label, value]) => ({ label, value, color: 'var(--s2)' })).sort((a, b) => b.value - a.value), v => String(v), 6)}</section>
      <section class="card"><header><h2>Situação das obrigações</h2></header>${segBar(S.obDist)}<h4 class="sec">Alertas</h4>${Views.alertasConsultoria(e.id)}</section>
    </div>`;
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
    mountChart(C('vc'), { labels: venc12.map(x => fmtCompShort(x.k)), fullLabels: venc12.map(x => fmtComp(x.k)), kind: 'bar', series: [{ name: 'Contratos vencendo', values: venc12.some(x => x.n) ? venc12.map(x => x.n) : venc12.map(() => null) }], fmt: v => fmtNum(v) + ' contrato(s)', axisFmt: v => fmtNum(v), empty: 'Nenhum contrato com data de término cadastrada nos próximos 12 meses.' });
  },

  /* ---------------- IMPORTAÇÃO DA PLANILHA ---------------- */
  async importar(e, file) {
    let book; try { book = await XLSX.read(await file.arrayBuffer()); } catch (err) { UI.toast('Não consegui ler a planilha: ' + err.message, 'bad'); return; }
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
    if (!found.length) { UI.toast('Nenhuma aba reconhecida. Os nomes das colunas devem seguir o modelo da planilha de auditoria.', 'bad', 6000); return; }
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
   RELATÓRIO DE AUDITORIA — pronto para imprimir ou salvar em PDF
   ===================================================================== */
const Report = {
  SECOES: [['sumario', 'Sumário executivo e leitura do período'], ['carteira', 'Carteira de contratos'], ['indicadores', 'Indicadores econômico-financeiros (gráficos)'], ['obrigacoes', 'Conformidade das obrigações'], ['maodeobra', 'Mão de obra'], ['achados', 'Achados e plano de ação'], ['documentos', 'Cobertura documental e limitações']],
  tab(host, e) {
    const hist = (DB.get('config', 'rel:' + e.id)?.itens || []).slice().reverse();
    host.innerHTML = `<section class="card"><header><h2>${icon('printer')} Relatório de auditoria contratual</h2></header>
      <p class="muted">Gera um relatório completo com o brasão do escritório — sumário executivo, carteira de contratos, gráficos de receitas, custos, tributos e pessoal, conformidade, achados e plano de ação — pronto para imprimir ou salvar em PDF e entregar ao cliente.</p>
      <button class="btn primary" id="rGen">${icon('printer')} Gerar relatório</button></section>
      <section class="card"><header><h2>${icon('history')} Relatórios emitidos</h2></header>${hist.length ? `<ul class="plain">${hist.map(h => `<li>${icon('file')} <b>${esc(h.titulo)}</b> <span class="muted small">— ${esc(fmtDateTime(h.em))} por ${esc(h.por)}${h.periodo ? ' · período ' + esc(h.periodo) : ''}</span></li>`).join('')}</ul>` : '<p class="muted small">Nenhum relatório emitido ainda.</p>'}</section>`;
    $('#rGen').onclick = () => Report.dialog(e);
  },
  dialog(e) {
    const comps = empRecs('indicadores', e.id).map(i => i.competencia).filter(c => /^\d{4}-\d{2}$/.test(c || '')).sort();
    const esc0 = escritorio();
    const m = UI.modal({
      title: 'Gerar relatório', sub: esc(e.razao), wide: true, body: `<form class="grid-form" id="rf">
      <div class="fld full"><label>Título</label><input name="titulo" value="Relatório de Auditoria Contratual"></div>
      <div class="fld"><label>Período dos indicadores — de</label><input name="de" placeholder="MM/AAAA" value="${esc(comps[0] ? fmtComp(comps[0]) : '')}"></div>
      <div class="fld"><label>até</label><input name="ate" placeholder="MM/AAAA" value="${esc(comps.length ? fmtComp(comps[comps.length - 1]) : '')}"></div>
      <div class="fld"><label>Responsável técnico</label><input name="resp" value="${esc(esc0.advogado || Session.user.nome || '')}"></div>
      <div class="fld"><label>OAB</label><input name="oab" value="${esc(esc0.oab || '')}"></div>
      <div class="fld full"><label>Seções</label><div class="chips-select">${Report.SECOES.map(([k, l]) => `<label class="chip-opt"><input type="checkbox" name="sec" value="${k}" checked><span>${l}</span></label>`).join('')}</div></div>
      <div class="fld full"><label>Parecer / considerações do consultor</label><textarea name="parecer" rows="5" placeholder="Conclusões, recomendações prioritárias e próximos passos…"></textarea></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="conf" checked><span></span>Marcar como confidencial (rodapé)</label></div></form>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rOk">${icon('printer')} Gerar</button>`
    });
    $('#rOk', m).onclick = async () => {
      const f = $('#rf'); const o = { titulo: f.titulo.value, de: parseComp(f.de.value), ate: parseComp(f.ate.value), resp: f.resp.value, oab: f.oab.value, parecer: f.parecer.value, conf: f.conf.checked, secs: new Set($$('input[name=sec]:checked', f).map(i => i.value)) };
      UI.closeModal(); Report.open(e, o);
      const key = 'rel:' + e.id, cur = DB.get('config', key) || { id: key, itens: [] };
      cur.itens = [...(cur.itens || []), { titulo: o.titulo, em: new Date().toISOString(), por: Session.user.nome || Session.user.email, periodo: o.de ? fmtComp(o.de) + ' a ' + fmtComp(o.ate) : '' }].slice(-50);
      await DB.save('config', cur);
    };
  },
  build(e, o) {
    const S = Consult.stats(e, o.de, o.ate), I = S.ind, esc0 = escritorio();
    const L = I.map(i => fmtCompShort(i.competencia)), g = k => I.map(i => num(i[k]));
    const chart = (title, spec) => `<figure class="r-fig"><figcaption>${esc(title)}</figcaption>${spec.series.some(s => s.values.some(v => num(v) !== null)) ? legendHtml(spec.series) + svgChart(spec, 680, 220).svg : '<p class="r-muted">Sem dados no período.</p>'}</figure>`;
    const tbl = (heads, rows, cls = '') => `<table class="r-t ${cls}"><thead><tr>${heads.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const v = x => x === null || x === undefined || x === '' ? '—' : isGap(x) ? '<i class="r-gap">não identificado</i>' : esc(x);
    const per = o.de ? `${fmtComp(o.de)} a ${fmtComp(o.ate || o.de)}` : 'todo o histórico';
    let n = 0; const H = t => `<h2><span>${++n}.</span> ${esc(t)}</h2>`;
    const sec = [];
    if (o.secs.has('sumario')) {
      const ins = Consult.insights(S);
      sec.push(`<section>${H('Sumário executivo')}
      <div class="r-kpis"><div><b>${S.at.length}/${S.cs.length}</b><span>contratos vigentes</span></div><div><b>${S.carteira ? fmtMoneyShort(S.carteira) : '—'}</b><span>carteira mensal conhecida</span></div><div><b>${fmtPct(S.compl)}</b><span>completude documental</span></div><div><b>${fmtPct(S.conf)}</b><span>conformidade das obrigações</span></div><div><b>${S.achAbertos.length}</b><span>achados em aberto</span></div><div><b>${S.venc.length}</b><span>contratos vencendo em 90 dias</span></div></div>
      ${ins.length ? `<h3>Leitura do período</h3><ul>${ins.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}</section>`);
    }
    if (o.secs.has('carteira')) sec.push(`<section>${H('Carteira de contratos')}<p>${S.cs.length} contrato(s) cadastrados; ${S.at.length} vigentes; ${S.cs.filter(semVigencia).length} sem data de término identificada; ${S.expir.length} com vigência expirada sem registro de prorrogação.</p>
      ${tbl(['ID', 'Tomador / unidade', 'Nº', 'Início', 'Término', 'Valor mensal', 'Status'], S.cs.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true })).map(c => [esc(c.codigo), `${v(tomadorBase(c))}<br><small>${v(c.unidade || c.grupo)}</small>`, v(c.numero), v(fmtDate(c.inicio)), v(fmtDate(c.fim)), num(c.valorMensal) !== null ? esc(fmtMoney(c.valorMensal)) : v(c.valorMensal), v(c.status)]), 'small')}</section>`);
    if (o.secs.has('indicadores')) {
      const T = I.map(i => ['inss', 'fgts', 'iss', 'federais', 'outrosTributos'].reduce((s, k) => s + (num(i[k]) || 0), 0));
      sec.push(`<section>${H('Indicadores econômico-financeiros')}<p>Período analisado: ${esc(per)}.</p>
      ${chart('Receitas × custos (R$)', { labels: L, kind: 'line', series: [{ name: 'Receita', values: g('receita') }, { name: 'Custo total', values: g('custo') }, { name: 'Folha', values: g('folha') }] })}
      ${chart('Tributos e encargos, inclusive previdência (R$)', { labels: L, kind: 'stack', series: [{ name: 'INSS', values: g('inss') }, { name: 'FGTS', values: g('fgts') }, { name: 'ISS', values: g('iss') }, { name: 'PIS/COFINS/IRPJ/CSLL', values: g('federais') }, { name: 'Outros', values: g('outrosTributos') }] })}
      ${chart('Admissões × desligamentos', { labels: L, kind: 'bar', axisFmt: x => fmtNum(x), series: [{ name: 'Admissões', values: g('admissoes'), color: 'var(--s3)' }, { name: 'Desligamentos', values: g('desligamentos'), color: 'var(--s5)' }] })}
      ${I.length ? tbl(['Competência', 'Receita', 'Custo', 'Margem', 'Folha', 'Tributos/encargos', 'Carga s/ receita', 'Func.', 'Adm.', 'Desl.'], I.map((i, k) => [fmtComp(i.competencia), esc(fmtMoney(i.receita)), esc(fmtMoney(i.custo)), num(i.receita) ? fmtPct((num(i.receita) - (num(i.custo) || 0)) / num(i.receita)) : '—', esc(fmtMoney(i.folha)), esc(fmtMoney(T[k])), num(i.receita) ? fmtPct(T[k] / num(i.receita)) : '—', v(fmtNum(i.headcount)), v(fmtNum(i.admissoes)), v(fmtNum(i.desligamentos))]), 'small num') : ''}</section>`);
    }
    if (o.secs.has('obrigacoes')) sec.push(`<section>${H('Conformidade das obrigações contratuais')}<p>${S.ob.length} obrigações mapeadas. ${S.obDist.filter(x => x.value).map(x => `${x.label}: ${x.value}`).join(' · ')}.</p>
      ${S.ob.length ? tbl(['Contrato', 'Cláusula', 'Grupo', 'Obrigação', 'Status', 'Verificação'], S.ob.slice(0, 120).map(r => [esc(r.contrato), v(r.clausula), v(r.grupo), v(String(r.obrigacao || '').slice(0, 160)), v(r.status || 'sem status'), v(r.verificado)]), 'small') : ''}</section>`);
    if (o.secs.has('maodeobra')) {
      const byC = {}; S.mo.forEach(r => { const k = r.contrato; byC[k] = byC[k] || { p: 0, a: 0, prev: 0, ap: 0, div: new Set() }; byC[k].p += num(r.qtdContratada) || 0; byC[k].a += num(r.qtdAlocada) || 0; byC[k].prev += num(r.custoPrevisto) || 0; byC[k].ap += num(r.custoApurado) || 0; if (r.divergencia) byC[k].div.add(r.divergencia); });
      sec.push(`<section>${H('Mão de obra')}<p>${fmtNum(S.postos)} postos contratados; ${fmtNum(S.alocados)} com alocação comprovada. Custo previsto mensal: ${esc(fmtMoney(S.custoPrev))}${S.custoAp ? `; custo apurado: ${esc(fmtMoney(S.custoAp))}` : ''}.</p>
      ${Object.keys(byC).length ? tbl(['Contrato', 'Postos', 'Alocados', 'Custo previsto', 'Custo apurado', 'Divergências'], Object.entries(byC).sort().map(([k, x]) => [esc(k), fmtNum(x.p), fmtNum(x.a), esc(fmtMoney(x.prev)), x.ap ? esc(fmtMoney(x.ap)) : '—', esc([...x.div].join('; '))]), 'small') : ''}</section>`);
    }
    if (o.secs.has('achados')) {
      const ord = a => ({ 'critico': 0, 'alto': 1, 'medio': 2, 'baixo': 3 })[norm(a.risco)] ?? 4;
      const list = S.ach.slice().sort((a, b) => ord(a) - ord(b));
      sec.push(`<section>${H('Achados e plano de ação')}<p>${S.ach.length} achado(s) registrados, ${S.achAbertos.length} em aberto.</p>
      ${list.length ? tbl(['ID', 'Contrato', 'Área', 'Achado', 'Risco', 'Recomendação', 'Prazo', 'Status'], list.slice(0, 150).map(a => [v(a.codigo), v(a.contrato), v(a.area), v(a.achado), `<span class="r-risk ${norm(a.risco).replace(/\W/g, '')}">${v(a.risco)}</span>`, v(a.recomendacao), v(fmtDate(a.prazo)), v(a.status)]), 'small') : ''}</section>`);
    }
    if (o.secs.has('documentos')) {
      const docs = empRecs('documentos', e.id), ads = empRecs('aditivos', e.id);
      const leg = {}; docs.forEach(d => leg[d.legibilidade || 'Não informado'] = (leg[d.legibilidade || 'Não informado'] || 0) + 1);
      sec.push(`<section>${H('Cobertura documental e limitações')}<p>${docs.length} documento(s) inventariados e ${ads.length} aditivo(s) identificados. ${Object.entries(leg).map(([k, x]) => `${k}: ${x}`).join(' · ')}.</p>
      <p>Os campos marcados como <i class="r-gap">não identificado</i> correspondem a informações não localizadas nos documentos analisados e devem ser confirmadas junto ao tomador ou à área responsável. As conclusões deste relatório limitam-se aos documentos e dados disponibilizados até a data de emissão.</p></section>`);
    }
    if (o.parecer) sec.push(`<section>${H('Parecer do consultor')}<div class="r-parecer">${esc(o.parecer).replace(/\n/g, '<br>')}</div></section>`);
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(o.titulo)} — ${esc(e.razao)}</title><style>${Report.CSS}</style></head><body>
    <div class="cover"><img src="${new URL(BRAND.logoDark, location.href)}" alt=""><div class="cap">${BRAND.caption}</div><div class="rule"></div><h1>${esc(o.titulo)}</h1><p class="emp">${esc(e.razao)}${e.cnpj ? '<br>CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}</p><p class="meta">Período dos indicadores: ${esc(per)}<br>Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
    <main>${sec.join('')}
    <div class="sign"><div class="line"></div><b>${esc(o.resp || '')}</b><span>${esc(o.oab || '')}</span><span>${esc(esc0.nome || 'Amorim Firmo')} — ${BRAND.caption}</span></div></main>
    <footer>${esc(esc0.nome || 'Amorim Firmo')} · ${BRAND.caption}${o.conf ? ' · Documento confidencial — uso restrito ao cliente' : ''}</footer></body></html>`;
  },
  open(e, o) {
    const html = Report.build(e, o);
    const ov = document.createElement('div'); ov.className = 'report-ov';
    ov.innerHTML = `<div class="report-bar"><b>${icon('printer')} ${esc(o.titulo)}</b><span class="sp"></span><button class="btn primary" id="rPrint">${icon('printer')} Imprimir / salvar PDF</button><button class="btn ghost light" id="rHtml">${icon('download')} Baixar HTML</button><button class="icon-btn light" id="rClose">${icon('x')}</button></div><iframe title="Relatório"></iframe>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    const fr = $('iframe', ov); fr.srcdoc = html;
    $('#rPrint').onclick = () => fr.contentWindow.print();
    $('#rHtml').onclick = () => download(new Blob([html], { type: 'text/html' }), `Relatorio_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.html`);
    $('#rClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
  },
  CSS: `@page{size:A4;margin:18mm 16mm 20mm}*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#1d2433;font-size:10.5pt;line-height:1.5;margin:0;
  --s1:#2f6bb3;--s2:#c98a1e;--s3:#1d9a7c;--s4:#7056c9;--s5:#c4485e;--chart-bg:#fff}
  .cover{height:257mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always}
  .cover img{width:62mm}.cap{font:600 9pt 'Helvetica Neue',Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#9a7741;margin-top:4mm}
  .rule{width:40mm;height:1px;background:#b08a4e;margin:14mm 0 10mm}.cover h1{font-weight:400;font-size:24pt;margin:0 0 6mm;color:#14203a}.emp{font-size:13pt;margin:0 0 10mm}.meta{font:9.5pt Arial,sans-serif;color:#6b6f7b}
  main{font-family:'Helvetica Neue',Arial,sans-serif;font-size:9.5pt}h2{font-family:Georgia,serif;font-weight:400;color:#14203a;font-size:15pt;border-bottom:1px solid #d9c49a;padding-bottom:2mm;margin:9mm 0 4mm;page-break-after:avoid}
  h2 span{color:#b08a4e;margin-right:2mm}h3{font-size:10.5pt;color:#14203a;margin:5mm 0 2mm}section{page-break-inside:auto}
  .r-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:3mm 0 5mm}.r-kpis div{border:1px solid #e7e0d2;border-left:3px solid #b08a4e;padding:3mm 4mm;border-radius:2mm}.r-kpis b{display:block;font:400 16pt Georgia,serif;color:#14203a}.r-kpis span{color:#6b6f7b;font-size:8.5pt}
  .r-t{width:100%;border-collapse:collapse;margin:2mm 0 4mm}.r-t th{background:#14203a;color:#fff;font-weight:600;text-align:left;padding:1.6mm 2mm;font-size:8pt}.r-t td{border-bottom:1px solid #ece6da;padding:1.5mm 2mm;vertical-align:top}.r-t.small{font-size:7.8pt}.r-t.num td:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}.r-t tr{page-break-inside:avoid}
  .r-gap{color:#9a6b1e}.r-muted{color:#6b6f7b;font-style:italic}.r-risk.alto,.r-risk.critico{color:#b4233c;font-weight:700}.r-risk.medio{color:#a86a12;font-weight:600}
  figure{margin:3mm 0 6mm;page-break-inside:avoid}figcaption{font-weight:600;color:#14203a;margin-bottom:1mm}svg{width:100%;height:auto}.grid{stroke:#eee9df}.axis0{stroke:#b9b3a6}.tick{font:9px Arial,sans-serif;fill:#6b6f7b}.xhair,.hit{display:none}
  .legend{display:flex;gap:4mm;flex-wrap:wrap;font-size:8pt;color:#4a4f5c;margin-bottom:1mm}.legend i{display:inline-block;width:3mm;height:3mm;border-radius:1mm;margin-right:1.2mm;vertical-align:-.3mm}
  .r-parecer{border-left:3px solid #b08a4e;padding:2mm 5mm;background:#faf7f0}
  .sign{margin:18mm auto 0;width:80mm;text-align:center;display:flex;flex-direction:column;gap:.6mm;page-break-inside:avoid}.sign .line{border-top:1px solid #1d2433;margin-bottom:2mm}.sign span{color:#6b6f7b;font-size:8.5pt}
  footer{position:fixed;bottom:-12mm;left:0;right:0;text-align:center;font:7.5pt Arial,sans-serif;color:#8a8e98}
  @media screen{body{background:#e9e6df}.cover,main{background:#fff;max-width:210mm;margin:8mm auto;padding:16mm;box-shadow:0 2px 14px rgba(0,0,0,.08)}.cover{height:auto;min-height:250mm}footer{position:static;padding:4mm 0 10mm}}`
};
/* =====================================================================
   PORTAL DO CLIENTE — acesso próprio e restrito
   ===================================================================== */
const Portal = {
  st: { tab: 'processos', proc: null },
  shell() {
    const u = Session.user;
    document.getElementById('root').innerHTML = `<div class="portal" id="portal"></div>`;
    window.onhashchange = null;
    Portal.render();
  },
  render() { Portal.draw($('#portal'), Session.user.clienteId, false); },
  preview(clienteId, procId) {
    const ov = document.createElement('div'); ov.className = 'portal-preview';
    ov.innerHTML = `<div class="pv-bar">${icon('eye')} <span>Pré-visualização do portal — é exatamente o que o cliente vê</span><span class="sp"></span><button class="btn ghost light sm" id="pvClose">${icon('x')} Fechar</button></div><div class="portal" id="pvBody"></div>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    $('#pvClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
    Portal.st = { tab: 'processos', proc: procId || null };
    Portal.draw($('#pvBody'), clienteId, true);
  },
  draw(root, clienteId, preview) {
    const st = Portal.st, cli = DB.get('clientes', clienteId) || { nome: Session.user?.nome || '' };
    const esc0 = escritorio();
    const procs = DB.where('processos', p => (p.clienteIds || []).includes(clienteId));
    const emps = DB.where('empresas', e => e.clienteId === clienteId);
    const vis = id => DB.where('movimentos', m => m.processoId === id && m.visivelCliente).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    const ag = DB.where('prazos', x => procs.some(p => p.id === x.processoId) && x.visivelCliente && !x.concluido && isISO(x.data) && daysUntil(x.data) >= 0).sort((a, b) => a.data.localeCompare(b.data));
    const tabs = [['processos', 'Meus processos'], ['agenda', 'Agenda'], ...(emps.length ? [['consultoria', 'Consultoria']] : []), ['contato', 'Fale com o escritório']];
    const wa = onlyDigits(esc0.whatsapp);
    let body = '';
    if (st.tab === 'processos' && st.proc) {
      const p = DB.get('processos', st.proc); const ms = vis(p.id);
      body = `<button class="link" data-back>${icon('chevL')} Meus processos</button>
      <section class="card p-proc"><div class="proc-tags">${pill(AREAS[p.area]?.nome || '')} ${pill(p.status || 'Ativo')}</div><h2 class="mono">${esc(fmtCNJ(p.numero))}</h2><p class="muted">${esc(p.classe || '')}${p.orgao ? ' · ' + esc(p.orgao) : ''}${p.comarca ? ' · ' + esc(p.comarca) : ''}</p>
        <dl class="dl cols"><dt>Parte contrária</dt><dd>${esc(p.parteContraria || '—')}</dd><dt>Fase</dt><dd>${esc(p.fase || '—')}</dd><dt>Advogado</dt><dd>${esc(p.responsavel || esc0.advogado || '—')}</dd><dt>Tribunal</dt><dd>${esc(p.tribunal || '—')}</dd></dl></section>
      <section class="card"><header><h2>Andamento do processo</h2></header>${ms.length ? `<ol class="timeline client">${ms.map(m => `<li><span class="tl-dot"></span><time>${esc(fmtDate(m.data))}</time><b class="tl-t">${esc(m.titulo)}</b>${m.explicacao ? `<p class="explain">${esc(m.explicacao)}</p>` : m.descricao ? `<p>${esc(m.descricao)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Ainda não há movimentações disponíveis.</p>'}</section>`;
    } else if (st.tab === 'processos') {
      body = procs.length ? `<div class="p-cards">${procs.map(p => { const m = vis(p.id)[0]; return `<button class="p-card" data-proc="${p.id}"><div class="p-card-h">${icon(AREAS[p.area]?.icon || 'scale')}<span>${esc(AREAS[p.area]?.nome || '')}</span>${pill(p.status || 'Ativo')}</div><b class="mono">${esc(fmtCNJ(p.numero))}</b><small>${esc(p.classe || '')}</small><div class="p-last">${m ? `<time>${esc(fmtDate(m.data))}</time> ${esc(m.titulo)}` : 'Sem movimentações ainda'}</div><span class="p-more">Ver andamento ${icon('chevR')}</span></button>`; }).join('')}</div>` : `<div class="empty">${icon('scale')}<p>Nenhum processo vinculado ao seu cadastro.</p></div>`;
    } else if (st.tab === 'agenda') {
      body = ag.length ? `<section class="card"><ul class="agenda-list">${ag.map(x => { const p = DB.get('processos', x.processoId); return `<li><div class="ag-date"><b>${fmtDate(x.data).slice(0, 5)}</b><small>${esc(x.hora || '')}</small></div><div class="ag-body"><span class="pill info">${esc(x.tipo)}</span> <b>${esc(x.descricao)}</b><small>${esc(x.local || '')} · ${esc(fmtCNJ(p?.numero))}</small></div></li>`; }).join('')}</ul></section>` : `<div class="empty">${icon('calendar')}<p>Nenhum compromisso agendado.</p></div>`;
    } else if (st.tab === 'consultoria') {
      body = emps.map(e => { const S = Consult.stats(e), ins = Consult.insights(S); return `<section class="card"><header><h2>${icon('building')} ${esc(e.fantasia || e.razao)}</h2></header>
        <div class="kpis sm">${kpi('Contratos vigentes', `${S.at.length}/${S.cs.length}`)}${kpi('Completude documental', fmtPct(S.compl))}${kpi('Conformidade', fmtPct(S.conf))}${kpi('Ações em aberto', S.achAbertos.length)}</div>
        ${ins.length ? `<ul class="ins">${ins.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <h4 class="sec">Plano de ação em aberto</h4>${S.achAbertos.length ? `<div class="table-wrap"><table class="mini"><thead><tr><th>Contrato</th><th>Achado</th><th>Risco</th><th>Recomendação</th><th>Prazo</th><th>Status</th></tr></thead><tbody>${S.achAbertos.slice(0, 60).map(a => `<tr><td>${esc(a.contrato || '')}</td><td>${esc(a.achado || '')}</td><td>${pill(a.risco || '—')}</td><td>${esc(a.recomendacao || '')}</td><td>${esc(fmtDate(a.prazo))}</td><td>${pill(a.status || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">Nenhuma ação pendente.</p>'}
        <div class="right"><button class="btn primary" data-rep="${e.id}">${icon('printer')} Relatório completo</button></div></section>`; }).join('');
    } else {
      body = `<section class="card contact"><img src="${BRAND.logoDark}" alt="" class="about-logo"><div class="caption dark">${BRAND.caption}</div>
        <p>${esc(esc0.nome || 'Amorim Firmo')}${esc0.advogado ? ' — ' + esc(esc0.advogado) : ''}${esc0.oab ? ' · ' + esc(esc0.oab) : ''}</p>
        <div class="btn-row center">${wa ? `<a class="btn primary" href="https://wa.me/55${wa}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a>` : ''}${esc0.email ? `<a class="btn ghost" href="mailto:${esc(esc0.email)}">${icon('mail')} ${esc(esc0.email)}</a>` : ''}</div>
        ${esc0.endereco ? `<p class="muted small">${esc(esc0.endereco)}</p>` : ''}</section>`;
    }
    root.innerHTML = `<header class="p-top"><img src="${BRAND.logoDark}" alt="Amorim Firmo" class="p-logo"><div class="p-brand"><b>${esc(esc0.nome || 'Amorim Firmo')}</b><span class="caption dark">${BRAND.caption}</span></div><span class="sp"></span>${preview ? '' : `<button class="btn ghost sm" id="pOut">${icon('logout')} Sair</button>`}</header>
      <div class="p-hero"><span class="eyebrow">Área do cliente</span><h1>Olá, ${esc((cli.nome || '').split(' ')[0])}</h1><p>Acompanhe aqui o andamento dos seus processos${emps.length ? ' e da consultoria da sua empresa' : ''}. As informações são atualizadas pelo escritório.</p></div>
      <nav class="p-tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</nav>
      <main class="p-main">${body}</main>
      <footer class="p-foot">Acesso exclusivo e confidencial · ${esc(esc0.nome || 'Amorim Firmo')}</footer>`;
    const redraw = () => Portal.draw(root, clienteId, preview);
    $$('[data-tab]', root).forEach(b => b.onclick = () => { st.tab = b.dataset.tab; st.proc = null; redraw(); });
    $$('[data-proc]', root).forEach(b => b.onclick = () => { st.proc = b.dataset.proc; redraw(); root.scrollTop = 0; scrollTo(0, 0); });
    $$('[data-back]', root).forEach(b => b.onclick = () => { st.proc = null; redraw(); });
    $$('[data-rep]', root).forEach(b => b.onclick = () => Report.open(DB.get('empresas', b.dataset.rep), { titulo: 'Relatório de Auditoria Contratual', secs: new Set(Report.SECOES.map(s => s[0])), resp: esc0.advogado, oab: esc0.oab, conf: true }));
    $('#pOut', root)?.addEventListener('click', () => App.logout());
  }
};

/* ---------------- INÍCIO (após a splash) ---------------- */
window.addEventListener('DOMContentLoaded', async () => {
  const splash = document.getElementById('splash'); const t0 = performance.now();
  try { await App.start(); } catch (e) { console.error(e); App.loginScreen(); }
  const wait = Math.max(0, 2300 - (performance.now() - t0));
  setTimeout(() => { splash?.classList.add('out'); setTimeout(() => splash?.remove(), 900); }, wait);
});
