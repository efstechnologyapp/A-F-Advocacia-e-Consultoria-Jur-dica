/* =====================================================================
   PERFIS DA EMPRESA NO PORTAL
   func = Funcionário (operação) · ger = Gerente/Administrador (gestão do
   dia a dia) · dir = Diretoria (visão estratégica, só consulta).
   O servidor já entrega só os dados de cada perfil; aqui ficam as telas.
   ===================================================================== */
/** telefone no formato 83 99999.9999 com o ícone do WhatsApp clicável */
function zapLink(t) { const d = onlyDigits(t).replace(/^55(?=\d{10,11}$)/, ''); const f = d.length === 11 ? `${d.slice(0, 2)} ${d.slice(2, 7)}.${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)}.${d.slice(6)}` : t; return `${esc(f)} <a class="wa-ic" href="https://wa.me/55${d}" target="_blank" rel="noopener" title="Conversar no WhatsApp">${icon('whatsapp')}</a>`; }
const Perfis = {
  NOMES: { func: 'Funcionário', ger: 'Gerente / Administrador', dir: 'Diretoria' },
  CURTO: { func: 'Funcionário', ger: 'Gerente', dir: 'Diretoria' },
  /** perfil do usuário nesta empresa (na pré-visualização, o escolhido na barra) */
  RANK: { func: 1, ger: 2, dir: 3 },
  /** perfil real do usuário nesta empresa */
  real(e) { return e?.perfilPortal || Perfis.daSessao(e) || 'func'; },
  /** perfil em uso: quem tem perfil mais alto pode atuar num perfil abaixo (ex.: gerente cobrindo férias de funcionário) */
  de(e, preview) {
    if (preview) return Portal.prevPerfil || 'ger';
    const r = Perfis.real(e); let a = ''; try { a = sessionStorage.getItem('af-pf:' + e?.id) || ''; } catch (_) {}
    return a && Perfis.RANK[a] < Perfis.RANK[r] ? a : r;
  },
  /** perfis em que o usuário pode atuar (o dele e os abaixo) */
  possiveis: e => ['dir', 'ger', 'func'].filter(k => Perfis.RANK[k] <= Perfis.RANK[Perfis.real(e)]),
  atuarComo(e, pf) {
    try { if (pf === Perfis.real(e)) sessionStorage.removeItem('af-pf:' + e.id); else sessionStorage.setItem('af-pf:' + e.id, pf); } catch (_) {}
    Portal.st = { tab: Perfis.abas(pf)[0][0], proc: null }; Remessa.pst = { emp: e.id }; Portal.render(); scrollTo(0, 0);
    UI.toast(pf === Perfis.real(e) ? `De volta ao seu perfil: ${Perfis.NOMES[pf]}.` : `Agora você está atuando como ${Perfis.NOMES[pf]}.`, 'ok');
  },
  daSessao(e) { const x = String(Session.user?.clienteId || '').split(/[,;\s]+/).find(s => s.split(':')[0] === e?.clienteId); return x && x.split(':')[1]; },
  abas(pf) {
    if (pf === 'dir') return [['diretoria', 'Painel da Diretoria'], ['contratos', 'Contratos']];
    if (pf === 'ger') return [['contratos', 'Contratos'], ['plano', 'Plano de ação'], ['remessa', 'Remessa mensal'], ['equipe', 'Equipe']];
    return [['contratos', 'Contratos'], ['plano', 'Minhas pendências'], ['remessa', 'Remessa mensal']];
  },
  ICON: { diretoria: 'chart', contratos: 'file', plano: 'alert', equipe: 'users', remessa: 'upload', processos: 'scale', agenda: 'calendar', contato: 'whatsapp' },

  /* ---------------- contratos (lista simples) ---------------- */
  contratos(host, e) {
    const cs = empRecs('contratos', e.id).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }));
    const sit = c => { if (/^(encerrad|rescindid)/i.test(c.status || '')) return '<span class="pill muted">Encerrado</span>'; if (/licita/i.test(c.status || '')) return '<span class="pill muted">Em licitação</span>'; if (!isISO(c.fim)) return '<span class="pill">Vigente</span>'; const d = daysUntil(c.fim); return d < 0 ? '<span class="pill bad">Vencido</span>' : d <= 90 ? `<span class="pill warn">Vence em ${d} dia(s)</span>` : '<span class="pill ok">Vigente</span>'; };
    host.innerHTML = `<section class="card"><header><h2>${icon('file')} Contratos <small class="muted">${cs.length}</small></h2></header>
      ${cs.length ? `<div class="table-wrap"><table class="dt"><thead><tr><th>Contrato</th><th>Órgão / unidade</th><th>Nº</th><th>Início</th><th>Fim</th><th>Situação</th></tr></thead><tbody>${cs.map(c => `<tr><td><b>${esc(c.codigo || '')}</b></td><td>${esc(c.tomador || '')}<small class="muted" style="display:block">${esc(c.unidade || '')}</small></td><td>${esc(c.numero || '—')}</td><td>${fmtDate(c.inicio) || '—'}</td><td>${fmtDate(c.fim) || '—'}</td><td>${sit(c)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhum contrato cadastrado.</p>'}</section>`;
  },

  /* ---------------- plano de ação (gerente: todos; funcionário: os dele) ---------------- */
  async plano(host, e, pf, preview, redraw) {
    const as = empRecs('achados', e.id).filter(a => preview ? a.visivelEmpresa === 'Sim' && (pf !== 'func' || !!a.responsavelPortal) : (pf !== 'func' || a.responsavelPortal === Session.user?.email))
      .sort((a, b) => (achadoAberto(b) - achadoAberto(a)) || RISCOS.indexOf(b.risco) - RISCOS.indexOf(a.risco));
    let equipe = [];
    if (pf === 'ger' && !preview && Session.remote) { try { equipe = (await api('equipe', { empresaId: e.id })).membros.filter(m => m.status === 'autorizado'); } catch (_) {} }
    const rk = r => `<span class="pill ${/alto|crít/i.test(r || '') ? 'bad' : /médio/i.test(r || '') ? 'warn' : 'muted'}">${esc(r || '—')}</span>`;
    host.innerHTML = `<section class="card"><header><h2>${icon('alert')} ${pf === 'func' ? 'Minhas pendências' : 'Plano de ação'} <small class="muted">${as.filter(achadoAberto).length} em aberto</small></h2></header>
      <p class="muted small">${pf === 'func' ? 'Itens que o gerente da empresa atribuiu a você. Informe a providência tomada; o escritório confere e encerra.' : 'Pontos levantados pela auditoria do escritório. Atribua um responsável e um prazo interno; a providência informada vai para o escritório conferir e encerrar.'}</p>
      ${as.length ? as.map(a => `<article class="pa-item ${achadoAberto(a) ? '' : 'fechado'}" data-ach="${a.id}">
        <div class="pa-h"><b>${esc(a.codigo || '')}</b>${a.contrato ? ` · ${esc(a.contrato)}` : ''} ${rk(a.risco)} <span class="pill ${achadoAberto(a) ? 'info' : 'ok'}">${esc(a.status || 'Pendente')}</span>${a.prazo ? `<small class="muted">prazo do escritório: ${fmtDate(a.prazo)}</small>` : ''}</div>
        <p class="pa-t">${esc(a.achado || '')}</p>${a.recomendacao ? `<p class="pa-r"><b>O que fazer:</b> ${esc(a.recomendacao)}</p>` : ''}
        ${pf === 'ger' ? `<div class="pa-g"><label>Responsável na empresa<select data-resp>${['', ...new Set([...equipe.filter(m => m.perfil === 'func').map(m => m.email), a.responsavelPortal].filter(Boolean))].map(x => `<option value="${esc(x)}" ${x === (a.responsavelPortal || '') ? 'selected' : ''}>${x ? esc((equipe.find(m => m.email === x)?.nome || '') + ' ' + x) : '— eu mesmo —'}</option>`).join('')}</select></label><label>Prazo interno<input type="date" data-prz value="${esc(a.prazoInterno || '')}"></label></div>` : a.prazoInterno ? `<small class="muted">Prazo interno: ${fmtDate(a.prazoInterno)}</small>` : ''}
        ${achadoAberto(a) ? `<label class="pa-p">Providência tomada<textarea rows="2" data-prov placeholder="Ex.: termo aditivo assinado e enviado em 10/12…">${esc(a.providenciaEmpresa || '')}</textarea></label><div class="right"><button class="btn primary sm" data-salvar>${icon('check')} Salvar</button></div>` : a.providenciaEmpresa ? `<p class="pa-r"><b>Providência:</b> ${esc(a.providenciaEmpresa)}</p>` : ''}
        ${a.providenciaEm ? `<small class="muted">Atualizado por ${esc(a.providenciaPor || '')} em ${fmtDateTime(a.providenciaEm)}</small>` : ''}
      </article>`).join('') : `<p class="muted">${pf === 'func' ? 'Nenhuma pendência atribuída a você.' : 'Nenhum item publicado pelo escritório.'}</p>`}</section>`;
    $$('[data-salvar]', host).forEach(b => b.onclick = async () => {
      const art = b.closest('[data-ach]'), id = art.dataset.ach, a = DB.get('achados', id);
      const dados = { id, providencia: $('[data-prov]', art)?.value.trim() ?? undefined, responsavelPortal: $('[data-resp]', art)?.value, prazoInterno: $('[data-prz]', art)?.value };
      b.disabled = true;
      try {
        let x;
        if (preview || !Session.remote) { x = { ...a, providenciaEmpresa: dados.providencia, providenciaEm: new Date().toISOString(), providenciaPor: Session.user?.nome || '', status: a.status === 'Pendente' && dados.providencia ? 'Em andamento' : a.status, ...(pf === 'ger' ? { responsavelPortal: dados.responsavelPortal || '', prazoInterno: dados.prazoInterno || '' } : {}) }; await DB.save('achados', x); }
        else { x = await api('achadoPortal', dados); DB._applyLocal({ op: 'save', c: 'achados', records: [x] }); await DB.persist(); }
        UI.toast('Salvo. O escritório vai conferir.', 'ok'); redraw();
      } catch (err) { b.disabled = false; UI.toast(err.message, 'bad'); }
    });
  },

  /* ---------------- equipe (gerente) ---------------- */
  async equipe(host, e, preview) {
    if (preview || !Session.remote) { host.innerHTML = `<section class="card"><p class="muted">Na pré-visualização a equipe não é carregada. O gerente vê aqui quem tem acesso à empresa e pede ao escritório a inclusão ou a remoção de funcionários.</p></section>`; return; }
    host.innerHTML = `<section class="card"><p class="muted">Carregando a equipe…</p></section>`;
    let d; try { d = await api('equipe', { empresaId: e.id }); } catch (err) { host.innerHTML = `<section class="card"><p class="muted">${esc(err.message)}</p></section>`; return; }
    const desenha = () => {
      host.innerHTML = `<section class="card"><header><h2>${icon('users')} Equipe com acesso <small class="muted">${d.membros.length}</small></h2></header>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Pessoa</th><th>Perfil</th><th>Último acesso</th><th></th></tr></thead><tbody>${d.membros.map(m => `<tr><td><b>${esc(m.nome || 'nome ainda não informado')}</b> <span class="muted">(${esc(m.email)}${m.telefone ? ` / ${zapLink(m.telefone)}` : ''})</span></td><td>${esc(Perfis.CURTO[m.perfil] || m.perfil)}</td><td>${m.ultimoAcesso ? fmtDateTime(m.ultimoAcesso) : 'ainda não entrou'}</td><td>${m.perfil === 'func' && m.email !== Session.user.email ? `<button class="link small" data-rem="${esc(m.email)}">pedir remoção</button>` : ''}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="card"><header><h2>${icon('plus')} Pedir acesso para um funcionário</h2></header><p class="muted small">O escritório aprova o pedido e o funcionário recebe o convite por e-mail.</p>
          <form class="grid-form" id="eqF"><div class="fld"><label>Nome completo</label><input name="nome" required></div><div class="fld"><label>E-mail</label><input name="email" type="email" required></div><div class="fld"><label>WhatsApp</label><input name="tel" inputmode="tel" placeholder="83 99999.9999"></div><div class="fld full right"><button class="btn primary">${icon('upload')} Enviar pedido ao escritório</button></div></form></section>
        ${d.pedidos.length ? `<section class="card"><header><h2>⏳ Pedidos aguardando o escritório</h2></header><ul class="plain">${d.pedidos.map(p => `<li>${p.tipo === 'remover' ? 'Remover' : 'Incluir'} <b>${esc(p.nome || p.email)}</b> (${esc(p.email)}) · ${fmtDateTime(p.em)} <button class="link small" data-cancel="${p.id}">cancelar</button></li>`).join('')}</ul></section>` : ''}`;
      const pedir = async (o, btn) => { if (btn) btn.disabled = true; try { d.pedidos = await api('equipePedido', { empresaId: e.id, ...o }); UI.toast('Pedido enviado ao escritório.', 'ok'); desenha(); } catch (err) { if (btn) btn.disabled = false; UI.toast(err.message, 'bad'); } };
      $('#eqF', host).onsubmit = ev => { ev.preventDefault(); const f = ev.target; pedir({ nome: f.nome.value.trim(), email: f.email.value.trim(), telefone: f.tel.value.trim(), tipo: 'incluir' }, $('button', f)); };
      $$('[data-rem]', host).forEach(b => b.onclick = () => confirm(`Pedir ao escritório a remoção do acesso de ${b.dataset.rem}?`) && pedir({ email: b.dataset.rem, tipo: 'remover' }, b));
      $$('[data-cancel]', host).forEach(b => b.onclick = () => pedir({ cancelar: b.dataset.cancel }, b));
    };
    desenha();
  }
};
