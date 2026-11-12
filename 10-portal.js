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
    const u0 = Session.user, emp0 = DB.where('empresas', e => e.clienteId === u0.clienteId)[0];
    ConnSplash.show(emp0, (DB.get('clientes', u0.clienteId) || {}).nome || u0.nome);
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
    const tabs = [['processos', 'Meus processos'], ['agenda', 'Agenda'], ...(emps.length ? [['consultoria', 'Consultoria'], ['remessa', 'Remessa mensal']] : []), ['contato', 'Fale com o escritório']];
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
    if ($('#pRem', root)) Remessa.portal($('#pRem', root), emps, redraw);
  }
};

/* ---------------- INÍCIO (após a splash) ---------------- */
window.addEventListener('DOMContentLoaded', async () => {
  if (window.__afPopup) return; // janela de retorno do login do Google
  const splash = document.getElementById('splash'); const t0 = performance.now();
  try { await App.start(); } catch (e) { console.error(e); App.loginScreen(); }
  const wait = Math.max(0, 2300 - (performance.now() - t0));
  setTimeout(() => { splash?.classList.add('out'); setTimeout(() => splash?.remove(), 900); }, wait);
});
