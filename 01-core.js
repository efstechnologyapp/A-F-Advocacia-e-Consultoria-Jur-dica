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
