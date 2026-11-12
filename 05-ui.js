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
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
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
  /** resolve quando o modal for fechado */
  /** resolve quando o modal for fechado; 'substituido' se outra janela tomou o lugar dele */
  aguardar(m) { return new Promise(r => { const t = setInterval(() => { if (!m.isConnected) { clearInterval(t); r($('#modal') ? 'substituido' : undefined); } }, 300); }); },
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
  editRecord(coll, rec, { title, ctx = {}, onSaved, extraBase = {}, allowDelete = true, voltar } = {}) {
    const sc = SCHEMAS[coll], isNew = !rec?.id; rec = rec || {};
    const m = UI.modal({
      title: title || (isNew ? 'Novo(a) ' + sc.singular : 'Editar ' + sc.singular), wide: sc.fields.length > 8,
      body: UI.form(sc, rec, ctx),
      foot: `${!isNew && allowDelete ? `<button class="btn ghost danger-text" id="mDel">${icon('trash')} Excluir</button>` : ''}<span class="sp"></span>${voltar ? `<button class="btn ghost" id="mVoltar">${icon('chevL')} Voltar</button>` : `<button class="btn ghost" data-close>Cancelar</button>`}<button class="btn primary" id="mSave">${icon('check')} Salvar</button>`
    });
    if (voltar) { $('#mVoltar', m).onclick = () => voltar(); $('header [data-close]', m)?.addEventListener('click', ev => { ev.stopPropagation(); voltar(); }); }
    const form = $('form', m);
    $('[data-newcliente]', m)?.addEventListener('click', () => {
      const snap = UI.readForm(form, sc, { ...rec, ...extraBase }).rec;
      UI.editRecord('clientes', null, { onSaved: c => { snap.clienteIds = [...(snap.clienteIds || []), c.id]; UI.editRecord(coll, snap, { title, ctx, onSaved, extraBase, allowDelete, voltar }); } });
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
      if (voltar) voltar();
    };
    $('#mDel', m)?.addEventListener('click', async () => {
      if (!await UI.confirm(`Excluir este(a) ${sc.singular}? Esta ação não pode ser desfeita.`, 'Excluir')) return;
      await DB.remove(coll, rec.id); UI.toast('Registro excluído.'); App.render();
      if (voltar) voltar();
    });
    if (coll === 'empresas' || coll === 'clientes') RFB.attach(m, coll);
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
function dataTable(host, { id, coll, rows, schema, onOpen, filters = [], actions = '', tools = '', sortDefault = null, emptyMsg = 'Nenhum registro.', cols }) {
  const st = TableState[id] = TableState[id] || { q: '', sort: sortDefault, dir: 1, page: 0, f: {} };
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
    host._list = list; // lista filtrada e ordenada (usada na impressão)
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
  host.innerHTML = `<div class="dt-tools"><div class="search">${icon('search')}<input type="search" placeholder="Buscar…" value="${esc(st.q)}"></div>${filters.map(fl => `<select data-filter="${fl.k}"><option value="">${esc(fl.label)}: todos</option>${fl.opts.map(o => `<option ${st.f[fl.k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`).join('')}${tools}<span class="sp"></span>${actions}</div><div class="dt-body"></div>`;
  $('.search input', host).oninput = e => { st.q = e.target.value; st.page = 0; draw(); };
  $$('[data-filter]', host).forEach(s => s.onchange = () => { st.f[s.dataset.filter] = s.value; st.page = 0; draw(); });
  draw();
}
