/* =====================================================================
   ATENDIMENTOS — do primeiro contato à petição inicial
   1) Cliente e caso  2) Contrato de honorários  3) Relato e documentos
   4) Petição inicial (IA redige, o advogado revisa no editor)
   ===================================================================== */
const Atend = {
  STATUS: ['Em atendimento', 'Contrato gerado', 'Contrato assinado', 'Inicial em elaboração', 'Inicial pronta', 'Ajuizado', 'Não prosseguiu'],
  TABS: [['caso', 'Cliente e caso', 'user'], ['contrato', 'Contrato de honorários', 'file'], ['fatos', 'Relato e documentos', 'list'], ['inicial', 'Petição inicial', 'gavel']],
  tom: s => /Ajuizado/.test(s) ? 'good' : /Não prosseguiu/.test(s) ? 'neutral' : /assinado|pronta/.test(s) ? 'info' : 'warn',
  cli: a => DB.get('clientes', a.clienteId),

  /* ---------- lista ---------- */
  list(v) {
    App.crumbs([{ t: 'Judicial' }, { t: 'Atendimentos' }]);
    const l = DB.all('atendimentos').sort((a, b) => String(b.atualizadoEm || b.criadoEm || '').localeCompare(String(a.atualizadoEm || a.criadoEm || '')));
    const abertos = l.filter(a => !/Ajuizado|Não prosseguiu/.test(a.status || ''));
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Judicial</span><h1>${icon('briefcase', 'h-ic')} Atendimentos</h1><p class="muted">Do primeiro contato com o cliente ao ajuizamento: contrato de honorários, relato dos fatos, documentos e petição inicial.</p></div>
      <div class="actions"><button class="btn primary" id="aNovo">${icon('plus')} Novo atendimento</button></div></div>
      <div class="kpis sm">${kpi('Em aberto', abertos.length)}${kpi('Contratos assinados', l.filter(a => a.contratoAssinado).length)}${kpi('Iniciais prontas', l.filter(a => a.status === 'Inicial pronta').length)}${kpi('Ajuizados', l.filter(a => a.status === 'Ajuizado').length)}</div>
      <section class="card flush" id="atTbl"></section>`;
    const rows = l.map(a => ({ ...a, _cli: Atend.cli(a)?.nome || '—', _area: AREAS[a.area]?.nome || '', _upd: String(a.atualizadoEm || a.criadoEm || '').slice(0, 10) }));
    dataTable($('#atTbl'), {
      id: 'atend', rows, schema: { fields: [F('_cli', 'Cliente'), F('assunto', 'Assunto / ação'), F('_area', 'Área'), F('parteContraria', 'Parte contrária'), F('status', 'Situação'), F('_upd', 'Atualizado', 'date')] },
      cols: ['_cli', 'assunto', '_area', 'parteContraria', 'status', '_upd'],
      filters: [{ k: 'status', label: 'Situação', opts: Atend.STATUS }],
      onOpen: a => location.hash = '#/atendimento/' + a.id, emptyMsg: 'Nenhum atendimento. Comece por “Novo atendimento” (ou pelo cadastro do cliente).'
    });
    $('#aNovo').onclick = () => Atend.novo();
  },

  /* ---------- novo ---------- */
  novo(clienteId) {
    const cls = DB.all('clientes').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const m = UI.modal({ title: 'Novo atendimento', sub: 'Abra o atendimento; o contrato, o relato e a inicial vêm nas próximas etapas.', body: `<form class="grid-form" id="anf">
      <div class="fld full"><label>Cliente *</label><select name="cli"><option value="">— escolha —</option>${cls.map(c => `<option value="${c.id}" ${c.id === clienteId ? 'selected' : ''}>${esc(c.nome)}${c.doc ? ' · ' + esc(fmtDoc(c.doc)) : ''}</option>`).join('')}<option value="_novo">+ Cadastrar novo cliente…</option></select></div>
      <div class="fld"><label>Área *</label><select name="area">${Object.entries(AREAS).map(([k, a]) => `<option value="${k}">${esc(a.nome)}</option>`).join('')}</select></div>
      <div class="fld"><label>Parte contrária</label><input name="pc" placeholder="Ex.: Hapvida Assistência Médica S.A."></div>
      <div class="fld full"><label>Assunto / ação pretendida *</label><input name="assunto" placeholder="Ex.: Negativa de cobertura de internação — obrigação de fazer e danos morais"></div></form>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="anOk">${icon('check')} Abrir atendimento</button>` });
    const f = $('#anf', m);
    f.cli.onchange = () => { if (f.cli.value === '_novo') { f.cli.value = ''; UI.editRecord('clientes', null, { onSaved: c => Atend.novo(c.id) }); } };
    $('#anOk', m).onclick = async () => {
      if (!f.cli.value || !f.assunto.value.trim()) return UI.toast('Escolha o cliente e informe o assunto.', 'bad');
      const [a] = await DB.save('atendimentos', { clienteId: f.cli.value, area: f.area.value, assunto: f.assunto.value.trim(), parteContraria: f.pc.value.trim(), status: 'Em atendimento', documentos: [], honorarios: { tipo: 'misto', abrangencia: 'primeiro', parcelas: 1, percentual: 30, cidade: 'João Pessoa' } });
      UI.closeModal(); location.hash = '#/atendimento/' + a.id + '/caso';
    };
  },

  /* ---------- detalhe ---------- */
  detail(v, id, tab) {
    const a = DB.get('atendimentos', id);
    if (!a) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Atendimento não encontrado.</p></div>`; return; }
    const c = Atend.cli(a);
    App.crumbs([{ t: 'Atendimentos', href: '/atendimentos' }, { t: c?.nome || 'Atendimento' }]);
    const feito = { caso: !!(c && a.assunto), contrato: !!a.contratoHtml, fatos: !!(a.relato || (a.documentos || []).length), inicial: !!a.inicialHtml };
    v.innerHTML = `<div class="proc-h"><div>
        <div class="proc-tags">${pill(AREAS[a.area]?.nome || '')} <span class="pill ${Atend.tom(a.status)}">${esc(a.status || 'Em atendimento')}</span>${a.processoId ? ` <a class="tag" href="#/processo/${a.processoId}">${icon('link')} processo</a>` : ''}</div>
        <h1 class="at-tit">${esc(c?.nome || 'Cliente não encontrado')}</h1>
        <p class="proc-sub">${esc(a.assunto || '')}${a.parteContraria ? ` <span class="vs">×</span> ${esc(a.parteContraria)}` : ''}</p></div>
        <div class="actions wrap"><select class="input" id="atSt" title="Situação do atendimento">${Atend.STATUS.map(s => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <nav class="steps">${Atend.TABS.map(([k, t, ic], i) => `<a href="#/atendimento/${id}/${k}" class="${k === tab ? 'on' : ''} ${feito[k] ? 'ok' : ''}"><span class="n">${feito[k] ? icon('check') : i + 1}</span>${esc(t)}</a>`).join('')}</nav>
      <div id="atBody"></div>`;
    $('#atSt').onchange = async e => { await DB.save('atendimentos', { ...a, status: e.target.value }); UI.toast('Situação atualizada.'); App.render(true); };
    const host = $('#atBody');
    ({ caso: Atend.tCaso, contrato: Atend.tContrato, fatos: Atend.tFatos, inicial: Atend.tInicial }[tab] || Atend.tCaso)(host, a, c);
  },
  async salvar(a, campos, msg) { Object.assign(a, campos); await DB.save('atendimentos', a); if (msg) UI.toast(msg); },

  /* ---------- 1. cliente e caso ---------- */
  faltas(c) {
    if (!c) return ['cliente'];
    const pj = c.tipo === 'Pessoa jurídica' || onlyDigits(c.doc).length === 14;
    return (pj ? [['doc', 'CNPJ'], ['endereco', 'endereço da sede'], ['representante', 'representante legal']] : [['doc', 'CPF'], ['rg', 'RG'], ['nacionalidade', 'nacionalidade'], ['estadoCivil', 'estado civil'], ['profissao', 'profissão'], ['endereco', 'endereço']]).filter(([k]) => !c[k]).map(([, l]) => l);
  },
  tCaso(host, a, c) {
    const fal = Atend.faltas(c);
    host.innerHTML = `<div class="grid-main"><section class="card"><header><h2>${icon('briefcase')} O caso</h2></header>
      <form class="grid-form" id="cf">
        <div class="fld"><label>Área</label><select name="area">${Object.entries(AREAS).map(([k, x]) => `<option value="${k}" ${k === a.area ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></div>
        <div class="fld"><label>Parte contrária</label><input name="parteContraria" value="${esc(a.parteContraria || '')}"></div>
        <div class="fld full"><label>Assunto / ação pretendida</label><input name="assunto" value="${esc(a.assunto || '')}"></div>
        <div class="fld full"><label>Anotações internas do atendimento</label><textarea name="obs" rows="4" placeholder="Como chegou ao escritório, urgência, combinações…">${esc(a.obs || '')}</textarea></div>
      </form><div class="right"><button class="btn primary" id="cfOk">${icon('check')} Salvar</button></div></section>
      <div class="col"><section class="card"><header><h2>${icon('user')} Cliente</h2><button class="btn ghost sm" id="cliEd">${icon('edit')} Editar cadastro</button></header>
        ${c ? `<p class="qualif">${Atend.qualif(c)}</p>` : '<p class="t-bad">Cliente não encontrado.</p>'}
        ${fal.length ? `<div class="notice">${icon('alert')}<div>Para o contrato e a inicial saírem completos, falta no cadastro: <b>${esc(fal.join(', '))}</b>.</div></div>` : `<p class="muted small">${icon('check')} Qualificação completa para o contrato e a inicial.</p>`}
      </section>
      <section class="card"><header><h2>${icon('list')} Próximos passos</h2></header><ol class="next">
        <li><a href="#/atendimento/${a.id}/contrato">Gerar o contrato de honorários</a></li><li><a href="#/atendimento/${a.id}/fatos">Registrar o relato e juntar os documentos</a></li><li><a href="#/atendimento/${a.id}/inicial">Redigir a petição inicial</a></li></ol></section></div></div>`;
    $('#cliEd').onclick = () => c && UI.editRecord('clientes', c, { onSaved: () => App.render(true) });
    $('#cfOk').onclick = () => { const f = $('#cf'); Atend.salvar(a, { area: f.area.value, parteContraria: f.parteContraria.value.trim(), assunto: f.assunto.value.trim(), obs: f.obs.value }, 'Salvo.').then(() => App.render(true)); };
  },
  /** qualificação do cliente para contrato e petição; o que falta vem marcado */
  qualif(c, html = true) {
    const F_ = (v, o) => v ? esc(v) : (html ? `<mark>[COMPLETAR: ${o}]</mark>` : `[COMPLETAR: ${o}]`);
    const nome = `<b>${esc(String(c.nome || '').toUpperCase())}</b>`;
    if (c.tipo === 'Pessoa jurídica' || onlyDigits(c.doc).length === 14)
      return `${nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${F_(c.doc && fmtDoc(c.doc), 'CNPJ')}, com sede em ${F_(c.endereco, 'endereço')}${c.email ? ', e-mail ' + esc(c.email) : ''}, neste ato representada por ${F_(c.representante, 'representante legal e qualificação')}`;
    const ec = c.estadoCivil ? c.estadoCivil.toLowerCase() : '';
    return `${nome}, ${F_(c.nacionalidade && c.nacionalidade.toLowerCase(), 'nacionalidade')}, ${F_(ec, 'estado civil')}, ${F_(c.profissao && c.profissao.toLowerCase(), 'profissão')}, portador(a) do RG nº ${F_(c.rg, 'RG')}, inscrito(a) no CPF sob o nº ${F_(c.doc && fmtDoc(c.doc), 'CPF')}, residente e domiciliado(a) em ${F_(c.endereco, 'endereço')}${c.email ? ', e-mail ' + esc(c.email) : ''}${c.telefone ? ', telefone ' + esc(c.telefone) : ''}${c.representante ? ', neste ato representado(a) por ' + esc(c.representante) : ''}`;
  },

  /* ---------- 2. contrato de honorários ---------- */
  tContrato(host, a, c) {
    const h = a.honorarios || {};
    host.innerHTML = `<section class="card"><header><h2>${icon('settings')} Condições dos honorários</h2></header>
      <form class="grid-form" id="hf">
        <div class="fld"><label>Modalidade</label><select name="tipo"><option value="fixo" ${h.tipo === 'fixo' ? 'selected' : ''}>Valor fixo</option><option value="exito" ${h.tipo === 'exito' ? 'selected' : ''}>Só êxito (percentual)</option><option value="misto" ${!h.tipo || h.tipo === 'misto' ? 'selected' : ''}>Fixo + êxito</option></select></div>
        <div class="fld" data-hf="fixo"><label>Valor fixo (R$)</label><input name="valor" inputmode="decimal" value="${esc(h.valor ? NUM.format(h.valor) : '')}" placeholder="0,00"></div>
        <div class="fld" data-hf="fixo"><label>Parcelas</label><input name="parcelas" type="number" min="1" max="48" value="${esc(h.parcelas || 1)}"></div>
        <div class="fld" data-hf="fixo"><label>1º vencimento</label><input name="venc" type="date" value="${esc(h.venc || '')}"></div>
        <div class="fld" data-hf="exito"><label>Êxito (% do proveito econômico)</label><input name="percentual" inputmode="decimal" value="${esc(h.percentual ?? 30)}"></div>
        <div class="fld"><label>Abrangência</label><select name="abrangencia"><option value="primeiro" ${h.abrangencia !== 'todas' ? 'selected' : ''}>1º grau (recursos com novo ajuste)</option><option value="todas" ${h.abrangencia === 'todas' ? 'selected' : ''}>Todas as instâncias, até o trânsito</option></select></div>
        <div class="fld"><label>Foro (comarca)</label><input name="cidade" value="${esc(h.cidade || 'João Pessoa')}"></div>
        <div class="fld full"><label>Objeto (o que o escritório vai fazer)</label><input name="objeto" value="${esc(h.objeto || ('propositura e acompanhamento de ' + (a.assunto || '[COMPLETAR: ação]') + (a.parteContraria ? ' em face de ' + a.parteContraria : '')))}"></div>
      </form>
      <div class="btn-row right"><button class="btn ${a.contratoHtml ? 'ghost' : 'primary'}" id="hGer">${icon('sparkle')} ${a.contratoHtml ? 'Gerar de novo (substitui o texto)' : 'Gerar contrato'}</button></div></section>
      <div id="ctEd"></div>`;
    const f = $('#hf');
    const vis = () => { const t = f.tipo.value; $$('[data-hf=fixo]', f).forEach(x => x.hidden = t === 'exito'); $$('[data-hf=exito]', f).forEach(x => x.hidden = t === 'fixo'); };
    f.tipo.onchange = vis; vis();
    const ler = () => ({ tipo: f.tipo.value, valor: num(f.valor.value) || 0, parcelas: Math.max(1, +f.parcelas.value || 1), venc: f.venc.value, percentual: num(f.percentual.value) || 0, abrangencia: f.abrangencia.value, cidade: f.cidade.value.trim() || 'João Pessoa', objeto: f.objeto.value.trim() });
    $('#hGer').onclick = async () => {
      if (a.contratoHtml && !await UI.confirm('Gerar de novo substitui o texto do contrato, inclusive o que foi editado. Continuar?', 'Gerar de novo', false)) return;
      const hon = ler(); const html = Atend.modeloContrato(a, c, escritorio(), hon);
      await Atend.salvar(a, { honorarios: hon, contratoHtml: html, status: a.status === 'Em atendimento' ? 'Contrato gerado' : a.status }, 'Contrato gerado. Revise o texto abaixo — pode editar à vontade.');
      App.render(true);
    };
    if (a.contratoHtml) Editor.montar($('#ctEd'), { html: a.contratoHtml, titulo: 'Contrato de honorários', salvar: html => Atend.salvar(a, { contratoHtml: html }),
      extra: `<label class="switch"><input type="checkbox" id="ctAss" ${a.contratoAssinado ? 'checked' : ''}><span></span>Contrato assinado</label>`,
      imprimir: html => Timbre.imprimir(html, 'Contrato de honorários — ' + (c?.nome || ''), { assinatura: false }) });
    $('#ctAss')?.addEventListener('change', async e => { await Atend.salvar(a, { contratoAssinado: e.target.checked, status: e.target.checked && /Em atendimento|Contrato gerado/.test(a.status) ? 'Contrato assinado' : a.status }, e.target.checked ? 'Contrato marcado como assinado.' : 'Desmarcado.'); App.render(true); });
  },
  modeloContrato(a, c, E, h) {
    const hoje = new Date(), dataExt = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const contratado = `<b>${esc(String(E.advogado || '[COMPLETAR: advogado]').toUpperCase())}</b>, advogado(a) inscrito(a) na ${esc(oabFmt(E.oab) || '[COMPLETAR: OAB]')}${E.nome ? `, integrante de ${esc(E.nome)}` : ''}, com escritório profissional em ${E.endereco ? esc(E.endereco) : '<mark>[COMPLETAR: endereço do escritório]</mark>'}${E.email ? ', e-mail ' + esc(E.email) : ''}`;
    const rs = v => `${fmtMoney(v)} (${extenso(v)})`;
    const parc = h.parcelas > 1 ? `em ${h.parcelas} (${extensoN(h.parcelas)}) parcelas mensais e sucessivas de ${rs(Math.round(h.valor / h.parcelas * 100) / 100)}, vencendo-se a primeira em ${h.venc ? fmtDate(h.venc) : '<mark>[COMPLETAR: data]</mark>'} e as demais no mesmo dia dos meses subsequentes` : `à vista, até ${h.venc ? fmtDate(h.venc) : '<mark>[COMPLETAR: data]</mark>'}`;
    const fixo = `<p><b>a)</b> honorários iniciais no valor de ${h.valor ? rs(h.valor) : '<mark>[COMPLETAR: valor]</mark>'}, pagos ${parc}, por PIX ou transferência bancária em favor do CONTRATADO;</p>`;
    const exito = `<p><b>${h.tipo === 'misto' ? 'b' : 'a'})</b> honorários de êxito correspondentes a ${NUM.format(h.percentual || 0)}% (${extensoN(h.percentual || 0)} por cento) sobre o proveito econômico obtido pelo CONTRATANTE — valor da condenação, do acordo ou do benefício alcançado, inclusive parcelas vencidas e, quando houver, doze vincendas —, devidos no momento do recebimento, a qualquer título.</p>`;
    let n = 0; const C = t => `<h2>CLÁUSULA ${['PRIMEIRA', 'SEGUNDA', 'TERCEIRA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÉTIMA', 'OITAVA', 'NONA', 'DÉCIMA', 'DÉCIMA PRIMEIRA', 'DÉCIMA SEGUNDA'][n++]} — ${t}</h2>`;
    return `<h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS</h1>
<p>Pelo presente instrumento particular, de um lado, ${c ? Atend.qualif(c) : '<mark>[COMPLETAR: cliente]</mark>'}, doravante denominado(a) <b>CONTRATANTE</b>; e, de outro, ${contratado}, doravante denominado(a) <b>CONTRATADO</b>, têm entre si justo e contratado o seguinte:</p>
${C('DO OBJETO')}<p>O CONTRATADO prestará ao CONTRATANTE serviços profissionais de advocacia consistentes na ${esc(h.objeto)}, ${h.abrangencia === 'todas' ? 'em todas as instâncias, até o trânsito em julgado da fase de conhecimento' : 'em primeiro grau de jurisdição'}.</p>
<p><b>Parágrafo único.</b> Não estão incluídos neste contrato ${h.abrangencia === 'todas' ? 'o cumprimento de sentença em autos apartados, ações autônomas, incidentais ou conexas' : 'recursos aos tribunais, o cumprimento de sentença, ações autônomas, incidentais ou conexas'}, que dependerão de novo ajuste entre as partes.</p>
${C('DOS HONORÁRIOS CONTRATUAIS')}<p>Pelos serviços descritos, o CONTRATANTE pagará ao CONTRATADO:</p>${h.tipo !== 'exito' ? fixo : ''}${h.tipo !== 'fixo' ? exito : ''}
<p><b>Parágrafo primeiro.</b> Os honorários de sucumbência fixados em juízo pertencem exclusivamente ao CONTRATADO (art. 23 da Lei nº 8.906/1994 e art. 85, § 14, do CPC) e não se compensam com os honorários aqui contratados.</p>
${h.tipo !== 'fixo' ? `<p><b>Parágrafo segundo.</b> Em caso de acordo, judicial ou extrajudicial, os honorários de êxito incidem sobre o valor acordado. Somados aos de sucumbência, os honorários não ultrapassarão as vantagens obtidas pelo CONTRATANTE (art. 50 do Código de Ética e Disciplina da OAB).</p>` : ''}
${C('DAS DESPESAS')}<p>Custas, taxas, emolumentos, perícias, diligências, deslocamentos, cópias e demais despesas do processo correm por conta do CONTRATANTE, mediante prestação de contas, salvo se deferida a gratuidade da justiça.</p>
${C('DAS OBRIGAÇÕES DO CONTRATANTE')}<p>O CONTRATANTE obriga-se a: (i) fornecer informações verdadeiras e completas e os documentos necessários, nos prazos solicitados; (ii) comunicar ao CONTRATADO qualquer mudança de endereço, telefone ou e-mail; (iii) não celebrar acordo sobre o objeto deste contrato sem a ciência do CONTRATADO; e (iv) manter os pagamentos em dia.</p>
${C('DAS OBRIGAÇÕES DO CONTRATADO')}<p>O CONTRATADO obriga-se a atuar com zelo e diligência, a manter sigilo sobre as informações recebidas e a informar o CONTRATANTE do andamento da causa, inclusive pelo portal do cliente e por e-mail. A obrigação assumida é de meio, e não de resultado.</p>
${C('DO INADIMPLEMENTO')}<p>O atraso no pagamento de qualquer parcela sujeitará o CONTRATANTE a multa de 2% (dois por cento), juros de 1% (um por cento) ao mês e correção monetária pelo IPCA, e acarretará o vencimento antecipado das demais parcelas.</p>
${C('DA REVOGAÇÃO E DA RENÚNCIA')}<p>O CONTRATANTE poderá revogar o mandato a qualquer tempo, permanecendo devidos os honorários iniciais e, quanto ao êxito, a parte proporcional ao trabalho realizado, calculada sobre o proveito econômico que vier a ser obtido. O CONTRATADO poderá renunciar ao mandato, continuando a representar o CONTRATANTE nos 10 (dez) dias seguintes à notificação, salvo substituição antes desse prazo (art. 5º, § 3º, da Lei nº 8.906/1994 e art. 112 do CPC).</p>
${C('DO TÍTULO EXECUTIVO')}<p>Este contrato constitui título executivo extrajudicial, nos termos do art. 24 da Lei nº 8.906/1994 e do art. 784, XII, do CPC.</p>
${C('DA PROTEÇÃO DE DADOS')}<p>Os dados pessoais do CONTRATANTE serão tratados exclusivamente para a execução deste contrato e para o exercício regular de direitos em processo judicial ou administrativo (art. 7º, V e VI, da Lei nº 13.709/2018 — LGPD), com sigilo e segurança.</p>
${C('DO FORO')}<p>Fica eleito o foro da Comarca de ${esc(h.cidade || 'João Pessoa')} para dirimir quaisquer questões oriundas deste contrato.</p>
<p>E, por estarem assim justos e contratados, firmam o presente instrumento em 2 (duas) vias de igual teor, na presença das testemunhas abaixo.</p>
<p class="local">${esc(h.cidade || 'João Pessoa')}, ${dataExt}.</p>
<div class="assin"><div><span></span><b>${esc(String(c?.nome || 'CONTRATANTE').toUpperCase())}</b>Contratante</div><div><span></span><b>${esc(String(E.advogado || 'CONTRATADO').toUpperCase())}</b>${esc(oabFmt(E.oab) || 'Contratado')}</div></div>
<div class="assin test"><div><span></span><b>Testemunha 1</b>Nome:<br>CPF:</div><div><span></span><b>Testemunha 2</b>Nome:<br>CPF:</div></div>`;
  },

  /* ---------- 3. relato e documentos ---------- */
  tFatos(host, a, c) {
    const docs = a.documentos || [], an = a.analise;
    host.innerHTML = `<div class="grid-main"><section class="card"><header><h2>${icon('edit')} Relato do cliente</h2><span class="muted small" id="rlSt"></span></header>
        <p class="muted small">Escreva ou cole o relato como o cliente contou (pode ser a conversa do WhatsApp). Não precisa organizar — a IA faz isso.</p>
        <textarea id="rel" class="relato" rows="16" placeholder="Ex.: Em março a cliente teve a filha recém-nascida internada de urgência e o plano negou a cobertura alegando carência…">${esc(a.relato || '')}</textarea>
        <div class="btn-row right"><button class="btn primary" id="rlIA" ${a.relato || docs.length ? '' : 'disabled'}>${icon('sparkle')} ${an ? 'Organizar os fatos de novo' : 'Organizar os fatos com a IA'}</button></div></section>
      <div class="col"><section class="card"><header><h2>${icon('upload')} Documentos (${docs.length})</h2>${a.pastaLink ? `<a class="link small" href="${esc(a.pastaLink)}" target="_blank" rel="noopener">${icon('link')} pasta no Drive</a>` : ''}</header>
        <div class="drop sm" id="atDrop">${icon('upload')}<b>Arraste aqui ou escolha</b><span>PDF, fotos e prints. Vão para o Drive do escritório e a IA resume o que cada um prova.</span><button class="btn ghost sm" id="atPick">Escolher arquivos</button><input type="file" id="atFile" multiple hidden accept=".pdf,image/*,.txt"></div>
        <ul class="at-docs">${docs.map((d, i) => `<li><div><b>Doc. ${i + 1}</b> ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener">${esc(d.nome)}</a>` : esc(d.nome)}${d.tipo ? ` <span class="tag">${esc(d.tipo)}</span>` : ''}${d.resumo ? `<small>${esc(d.resumo)}</small>` : d.erro ? `<small class="t-bad">${esc(d.erro)}</small>` : ''}</div><button class="icon-btn sm" data-dx="${i}" title="Tirar da lista">${icon('trash')}</button></li>`).join('')}</ul>
      </section></div></div>
      ${an ? Atend.analiseHtml(an) : ''}`;
    // relato: salva sozinho
    let t; $('#rel').oninput = e => { $('#rlIA').disabled = !e.target.value.trim() && !docs.length; $('#rlSt').textContent = 'editando…'; clearTimeout(t); t = setTimeout(() => Atend.salvar(a, { relato: e.target.value }).then(() => $('#rlSt') && ($('#rlSt').textContent = 'salvo')), 1500); };
    $('#rlIA').onclick = () => Atend.organizar(a, c);
    // documentos
    const dz = $('#atDrop'), inp = $('#atFile');
    $('#atPick').onclick = () => inp.click(); inp.onchange = () => Atend.juntar(a, [...inp.files]);
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); Atend.juntar(a, [...(e.dataTransfer.files || [])]); };
    $$('[data-dx]').forEach(b => b.onclick = async () => { if (!await UI.confirm('Tirar este documento da lista do atendimento? (O arquivo continua no Drive.)', 'Tirar')) return; const l = [...docs]; l.splice(+b.dataset.dx, 1); await Atend.salvar(a, { documentos: l }); App.render(true); });
  },
  async juntar(a, files) {
    files = files.filter(f => f.size); if (!files.length) return;
    if (!Session.remote) return UI.toast('Juntar documentos exige o servidor conectado.', 'warn');
    const c = Atend.cli(a), l = [...(a.documentos || [])];
    const tt = UI.toast(`Enviando ${files.length} arquivo(s)…`, 'ok', 60000);
    for (const [i, f] of files.entries()) {
      $('#atDrop span') && ($('#atDrop span').textContent = `Enviando e lendo ${i + 1} de ${files.length}: ${f.name}…`);
      const d = { nome: f.name, data: todayISO() };
      try {
        if (f.size > 30 * 1048576) throw new Error('arquivo acima de 30 MB');
        const leitura = await PdfLeve.preparar(f, { inicio: 20, fim: 10 });
        const r = await juntarELer({ modo: 'atendimento', destino: { key: a.id, nome: `${c?.nome || 'Cliente'} — ${a.assunto || ''}`.slice(0, 120) }, nome: f.name, mime: f.type || 'application/octet-stream', base64: await Docs.b64(f), ler: /pdf|image|text/.test(f.type || f.name), leitura });
        d.fileId = r.id; d.link = r.url; if (r.pasta) a.pastaLink = r.pasta;
        if (r.ia) { d.tipo = r.ia.tipoDocumento || ''; d.resumo = r.ia.resumo || ''; d.datas = r.ia.datas || []; d.valores = r.ia.valores || []; d.pessoas = r.ia.pessoas || []; }
        if (r.iaErro) d.erro = 'Guardado no Drive; a IA não leu agora (' + r.iaErro + ').';
      } catch (e) { d.erro = 'Não enviado: ' + e.message; }
      l.push(d);
    }
    tt?.remove?.();
    await Atend.salvar(a, { documentos: l, pastaLink: a.pastaLink || '' }, `${files.length} documento(s) juntado(s).`);
    App.render(true);
  },
  dadosIA(a, c) {
    const E = escritorio();
    return { escritorio: E.nome || 'Amorim Firmo', advogado: E.advogado || '', oab: oabFmt(E.oab) || '', cliente: c?.nome || '', qualificacao: c ? Atend.qualif(c, false).replace(/<[^>]+>/g, '') : '', area: AREAS[a.area]?.nome || '', assunto: a.assunto || '', parteContraria: a.parteContraria || '', relato: a.relato || '', documentos: (a.documentos || []).map(d => ({ nome: d.nome, tipo: d.tipo || '', resumo: d.resumo || '' })) };
  },
  async organizar(a, c) {
    const b = $('#rlIA'); b.disabled = true; b.innerHTML = `${icon('sync', 'spin')} A IA está organizando os fatos…`;
    try {
      const r = await apiT('redigir', { tipo: 'fatos', dados: Atend.dadosIA(a, c) }, 240000);
      await Atend.salvar(a, { analise: r, status: a.status === 'Em atendimento' || /Contrato/.test(a.status) ? a.status : a.status }, 'Fatos organizados. Confira abaixo e siga para a petição inicial.');
      App.render(true);
    } catch (e) { UI.toast('IA: ' + e.message, 'bad', 8000); b.disabled = false; b.innerHTML = `${icon('sparkle')} Organizar os fatos com a IA`; }
  },
  analiseHtml(an) {
    const li = l => (l || []).filter(Boolean).map(x => `<li>${esc(typeof x === 'string' ? x : JSON.stringify(x))}</li>`).join('');
    return `<section class="card an-card"><header><h2>${icon('sparkle')} Caso organizado pela IA</h2><span class="muted small">confira — a IA pode errar</span></header>
      ${an.acaoSugerida ? `<p><span class="lbl">Ação sugerida</span><b>${esc(an.acaoSugerida)}</b>${an.competencia ? `<br><small class="muted">${esc(an.competencia)}</small>` : ''}</p>` : ''}
      <div class="an-grid"><div><h4 class="sec">Fatos, em ordem</h4><ol class="an-fatos">${(an.fatos || []).map(f => `<li>${f.data ? `<time>${esc(fmtDate(f.data) || f.data)}</time>` : ''}${esc(f.descricao || '')}${f.prova ? ` <span class="tag">${esc(f.prova)}</span>` : ''}</li>`).join('')}</ol></div>
      <div>${(an.partesContrarias || []).length ? `<h4 class="sec">Parte(s) contrária(s)</h4><ul>${an.partesContrarias.map(p => `<li><b>${esc(p.nome || '')}</b>${p.doc ? ' · ' + esc(p.doc) : ''}${p.qualificacao ? `<br><small>${esc(p.qualificacao)}</small>` : ''}</li>`).join('')}</ul>` : ''}
        ${(an.pedidos || []).length ? `<h4 class="sec">Pedidos</h4><ul>${li(an.pedidos)}</ul>` : ''}
        ${(an.fundamentos || []).length ? `<h4 class="sec">Fundamentos legais</h4><ul>${li(an.fundamentos)}</ul>` : ''}</div></div>
      <div class="an-grid">${(an.documentosFaltantes || []).length ? `<div class="notice">${icon('file')}<div><b>Pedir ao cliente</b><ul>${li(an.documentosFaltantes)}</ul></div></div>` : ''}
        ${(an.perguntasAoCliente || []).length ? `<div class="notice">${icon('user')}<div><b>Perguntar ao cliente</b><ul>${li(an.perguntasAoCliente)}</ul></div></div>` : ''}
        ${(an.riscos || []).length ? `<div class="notice">${icon('alert')}<div><b>Pontos de atenção</b><ul>${li(an.riscos)}</ul></div></div>` : ''}</div></section>`;
  },

  /* ---------- 4. petição inicial ---------- */
  tInicial(host, a, c) {
    const an = a.analise || {}, o = a.opcoesInicial || {};
    const juizo = o.juizo || (an.competencia ? '' : '');
    host.innerHTML = `<section class="card"><header><h2>${icon('settings')} Dados para a petição</h2></header>
      ${!a.analise ? `<div class="notice">${icon('alert')}<div>Ainda não há fatos organizados. A IA pode redigir só com o relato, mas fica melhor se você passar antes por <a href="#/atendimento/${a.id}/fatos">Relato e documentos › Organizar os fatos</a>.</div></div>` : ''}
      <form class="grid-form" id="if">
        <div class="fld full"><label>Endereçamento (juízo)</label><input name="juizo" value="${esc(juizo)}" placeholder="Ex.: Excelentíssimo(a) Senhor(a) Juiz(a) de Direito da __ Vara Cível da Comarca de João Pessoa/PB"></div>
        ${an.competencia ? `<p class="muted small full" style="grid-column:1/-1;margin:-4px 0 0">Sugestão da IA: ${esc(an.competencia)}</p>` : ''}
        <div class="fld full"><label>Nome da ação</label><input name="acao" value="${esc(o.acao || an.acaoSugerida || a.assunto || '')}"></div>
        <div class="fld"><label>Valor da causa (R$)</label><input name="valorCausa" inputmode="decimal" value="${esc(o.valorCausa || (an.valorCausaSugerido ? NUM.format(an.valorCausaSugerido) : ''))}"></div>
        <div class="fld"><label>Cidade</label><input name="cidade" value="${esc(o.cidade || a.honorarios?.cidade || 'João Pessoa')}"></div>
        <div class="fld check"><label class="switch"><input type="checkbox" name="tutela" ${(o.tutela ?? an.tutelaUrgencia?.cabe) ? 'checked' : ''}><span></span>Pedido de tutela de urgência</label></div>
        <div class="fld check"><label class="switch"><input type="checkbox" name="gratuidade" ${(o.gratuidade ?? an.justicaGratuita) ? 'checked' : ''}><span></span>Requerer justiça gratuita</label></div>
        <div class="fld full"><label>Prioridade de tramitação (se houver)</label><input name="prioridade" value="${esc(o.prioridade || '')}" placeholder="Ex.: idoso (art. 1.048, I, do CPC)"></div>
        <div class="fld full"><label>Instruções para a IA</label><textarea name="instrucoes" rows="3" placeholder="Ex.: dar ênfase à urgência da internação; pedir danos morais de R$ 30.000,00; incluir a Gabriela como litisconsorte…">${esc(o.instrucoes || '')}</textarea></div>
      </form>
      <div class="btn-row right"><button class="btn ${a.inicialHtml ? 'ghost' : 'primary'}" id="iGer">${icon('sparkle')} ${a.inicialHtml ? 'Redigir de novo (substitui o texto)' : 'Redigir a petição inicial com a IA'}</button></div></section>
      <div id="inEd"></div>
      ${a.inicialHtml && !a.processoId ? `<section class="card"><header><h2>${icon('gavel')} Depois do protocolo</h2></header><p class="muted small">Ajuizou? Informe o número e o app cria o processo (cliente, parte contrária, área e documentos já vinculados) e passa a acompanhar as movimentações.</p><div class="btn-row"><input class="input" id="iCnj" placeholder="0000000-00.0000.0.00.0000" style="max-width:280px"><button class="btn primary" id="iAj">${icon('check')} Registrar ajuizamento</button></div></section>` : ''}`;
    const f = $('#if');
    const ler = () => ({ juizo: f.juizo.value.trim(), acao: f.acao.value.trim(), valorCausa: f.valorCausa.value.trim(), cidade: f.cidade.value.trim(), tutela: f.tutela.checked, gratuidade: f.gratuidade.checked, prioridade: f.prioridade.value.trim(), instrucoes: f.instrucoes.value.trim() });
    $('#iGer').onclick = async () => {
      if (a.inicialHtml && !await UI.confirm('Redigir de novo substitui o texto da petição, inclusive o que foi editado. Continuar?', 'Redigir de novo', false)) return;
      const b = $('#iGer'); b.disabled = true; b.innerHTML = `${icon('sync', 'spin')} A IA está redigindo a petição… (pode levar 1 ou 2 minutos)`;
      const op = { ...ler(), data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) };
      try {
        const r = await apiT('redigir', { tipo: 'inicial', dados: { ...Atend.dadosIA(a, c), fatos: an.fatos || [], reus: an.partesContrarias || [], fundamentos: an.fundamentos || [], pedidos: an.pedidos || [], opcoes: op } }, 300000);
        const html = Editor.limpar(r.html || '');
        if (!html) throw new Error('a IA devolveu texto vazio');
        await Atend.salvar(a, { opcoesInicial: ler(), inicialHtml: html, status: /Ajuizado/.test(a.status) ? a.status : 'Inicial em elaboração' }, 'Petição redigida. Revise com atenção: trechos [COMPLETAR] e [INSERIR PRECEDENTE] estão destacados.');
        App.render(true);
      } catch (e) { UI.toast('IA: ' + e.message, 'bad', 9000); b.disabled = false; b.innerHTML = `${icon('sparkle')} Redigir a petição inicial com a IA`; }
    };
    if (a.inicialHtml) Editor.montar($('#inEd'), { html: a.inicialHtml, titulo: 'Petição inicial', salvar: html => Atend.salvar(a, { inicialHtml: html }), peticao: true,
      extra: `<button class="btn ghost sm" id="inPronta">${icon('check')} Marcar como pronta</button>`,
      imprimir: html => Timbre.imprimir(html, 'Petição inicial — ' + (c?.nome || ''), { peticao: true }) });
    $('#inPronta')?.addEventListener('click', async () => { await Atend.salvar(a, { status: 'Inicial pronta' }, 'Petição marcada como pronta.'); App.render(true); });
    $('#iAj')?.addEventListener('click', async () => {
      const n = onlyDigits($('#iCnj').value); if (n.length !== 20) return UI.toast('Informe o número CNJ completo (20 dígitos).', 'bad');
      if (!validCNJ(n) && !await UI.confirm('O dígito verificador do número não confere. Registrar assim mesmo?', 'Registrar', false)) return;
      const ex = DB.all('processos').find(p => onlyDigits(p.numero) === n);
      const p = ex || (await DB.save('processos', { numero: n, area: a.area, clienteIds: a.clienteId ? [a.clienteId] : [], parteContraria: a.parteContraria || (an.partesContrarias || []).map(x => x.nome).join('; '), classe: (a.opcoesInicial?.acao || a.assunto || '').slice(0, 120), status: 'Ativo', fase: 'Conhecimento', tribunal: (tribunalAlias(n) || '').toUpperCase(), distribuicao: todayISO(), valorCausa: num(a.opcoesInicial?.valorCausa) || '', responsavel: escritorio().advogado || '', arquivos: (a.documentos || []).filter(d => d.link).map(d => ({ nome: d.nome, link: d.link, tipo: d.tipo || '', data: d.data })), pastaLink: a.pastaLink || '', obs: 'Originado do atendimento de ' + fmtDate(String(a.criadoEm || todayISO()).slice(0, 10)) + '.' }))[0];
      await DB.save('movimentos', { processoId: p.id, data: todayISO(), titulo: 'Petição inicial protocolada', descricao: a.opcoesInicial?.acao || '', origem: 'escritorio', visivelCliente: true });
      await Atend.salvar(a, { processoId: p.id, status: 'Ajuizado' }, 'Ajuizamento registrado: o processo foi criado e passa a ser acompanhado.');
      if (Session.remote && validCNJ(n)) { try { const r = await apiT('datajud', { numero: n }, 90000); const novos = Judicial.mergeDatajud(p, r); await DB.save('processos', p); if (novos.length) await DB.save('movimentos', novos); } catch { } }
      location.hash = '#/processo/' + p.id;
    });
  }
};

/* ---------- valores por extenso (contrato) ---------- */
function extensoN(n) {
  n = Math.floor(Math.abs(+n || 0)); if (!n) return 'zero';
  const U = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const ate999 = x => { if (x === 100) return 'cem'; const c = Math.floor(x / 100), r = x % 100, p = []; if (c) p.push(C[c]); if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' e ' + U[r % 10] : '')); return p.join(' e '); };
  const g = [[1e9, 'bilhão', 'bilhões'], [1e6, 'milhão', 'milhões'], [1e3, 'mil', 'mil']]; const p = []; let r = n;
  for (const [v, s, pl] of g) { const q = Math.floor(r / v); if (q) { p.push([v === 1e3 && q === 1 ? 'mil' : ate999(q) + ' ' + (q > 1 ? pl : s), q]); r %= v; } }
  if (r) p.push([ate999(r), r, true]);
  if (p.length < 2) return p[0][0];
  const [ut, uq, unid] = p.pop(), lig = uq < 100 || uq % 100 === 0 ? ' e ' : unid && p[p.length - 1][0].endsWith('mil') ? ' ' : ', ';
  return p.map(x => x[0]).join(', ') + lig + ut;
}
function extenso(v) {
  v = Math.round((num(v) || 0) * 100) / 100; const r = Math.floor(v), c = Math.round((v - r) * 100);
  const pr = r ? extensoN(r) + (r % 1e6 === 0 && r >= 1e6 ? ' de reais' : r === 1 ? ' real' : ' reais') : '';
  const pc = c ? extensoN(c) + (c === 1 ? ' centavo' : ' centavos') : '';
  return [pr, pc].filter(Boolean).join(' e ') || 'zero real';
}

/* ---------- editor de texto (contrato e petição) ---------- */
const Editor = {
  limpar(html) {
    const d = document.createElement('div'); d.innerHTML = String(html || '').replace(/```(html)?/g, '');
    d.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(x => x.remove());
    d.querySelectorAll('*').forEach(x => [...x.attributes].forEach(at => { if (!['class', 'href'].includes(at.name) || (at.name === 'href' && /^\s*javascript/i.test(at.value))) x.removeAttribute(at.name); }));
    // destaca o que falta
    d.innerHTML = d.innerHTML.replace(/\[(COMPLETAR|INSERIR PRECEDENTE|VERIFICAR)([^\]]*)\]/g, m => /<mark>/.test(m) ? m : `<mark>${m}</mark>`).replace(/<mark>(<mark>[^<]*<\/mark>)<\/mark>/g, '$1');
    return d.innerHTML.trim();
  },
  montar(host, { html, titulo, salvar, imprimir, extra = '', peticao = false }) {
    const B = (cmd, ic, t, arg) => `<button type="button" class="ed-b" data-cmd="${cmd}" ${arg ? `data-arg="${arg}"` : ''} title="${t}">${ic}</button>`;
    host.innerHTML = `<section class="card ed-card"><header><h2>${icon('file')} ${esc(titulo)}</h2><span class="muted small" id="edSt">salvo</span></header>
      <div class="ed-bar">${B('bold', '<b>N</b>', 'Negrito (Ctrl+B)')}${B('italic', '<i>I</i>', 'Itálico (Ctrl+I)')}${B('underline', '<u>S</u>', 'Sublinhado (Ctrl+U)')}<span class="ed-sep"></span>
        ${B('formatBlock', 'Título', 'Título', 'H2')}${B('formatBlock', 'Subtítulo', 'Subtítulo', 'H3')}${B('formatBlock', '¶', 'Parágrafo normal', 'P')}<span class="ed-sep"></span>
        ${B('insertOrderedList', '1.', 'Lista numerada')}${B('insertUnorderedList', '•', 'Lista')}${B('justifyFull', '≡', 'Justificar')}${B('justifyCenter', '☰', 'Centralizar')}<span class="ed-sep"></span>
        ${B('removeFormat', '⌫', 'Limpar formatação')}${B('undo', '↶', 'Desfazer')}${B('redo', '↷', 'Refazer')}
        <span class="sp"></span>${extra}<button type="button" class="btn ghost sm" id="edMark" title="Ir ao próximo trecho a completar">${icon('alert')} Próximo [COMPLETAR]</button><button type="button" class="btn primary sm" id="edPrint">${icon('printer')} Imprimir / PDF</button></div>
      <div class="ed-page ${peticao ? 'peticao' : ''}" id="edPg" contenteditable="true" spellcheck="true">${html}</div></section>`;
    const pg = $('#edPg', host), st = $('#edSt', host); let t;
    const gravar = async () => { clearTimeout(t); st.textContent = 'salvando…'; await salvar(Editor.limpar(pg.innerHTML)); st.textContent = 'salvo ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
    pg.addEventListener('input', () => { st.textContent = 'editando…'; clearTimeout(t); t = setTimeout(gravar, 3000); });
    pg.addEventListener('blur', () => { if (st.textContent === 'editando…') gravar(); });
    pg.addEventListener('paste', e => { e.preventDefault(); const txt = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertHTML', false, txt.split(/\n{2,}|\r\n\r\n/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')); });
    $$('.ed-b', host).forEach(b => b.onmousedown = e => { e.preventDefault(); document.execCommand(b.dataset.cmd, false, b.dataset.arg ? '<' + b.dataset.arg + '>' : null); pg.dispatchEvent(new Event('input')); });
    $('#edPrint', host).onclick = async () => { await gravar(); imprimir(Editor.limpar(pg.innerHTML)); };
    let k = -1; $('#edMark', host).onclick = () => { const ms = $$('mark', pg); if (!ms.length) return UI.toast('Nenhum trecho [COMPLETAR] pendente.'); k = (k + 1) % ms.length; ms[k].scrollIntoView({ block: 'center', behavior: 'smooth' }); const r = document.createRange(); r.selectNodeContents(ms[k]); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  }
};

/* ---------- impressão em papel timbrado ---------- */
const Timbre = {
  imprimir(corpo, titulo, { peticao = false } = {}) {
    const E = escritorio();
    const rod = [E.endereco, E.email, E.whatsapp && 'WhatsApp ' + E.whatsapp].filter(Boolean).join('  ·  ').replace(/["\\]/g, '');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@500;600&display=swap" rel="stylesheet">
      <style>@page{size:A4;margin:12mm 20mm 22mm 30mm;@bottom-center{content:"${rod}";font:7.5pt Manrope,Arial,sans-serif;color:#7d8190}@bottom-right{content:counter(page);font:8pt Manrope,Arial,sans-serif;color:#7d8190}}
      *{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:12pt/1.5 'Times New Roman',Times,serif;color:#111}
      table.pg{width:100%;border-collapse:collapse}table.pg>thead td{padding:0 0 9mm}
      .tb{text-align:center}.tb img{width:15mm}.tb .n{font:600 15pt/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.24em;color:#121c33;margin-top:1.4mm}.tb .l{font:600 6.2pt Manrope,Arial,sans-serif;letter-spacing:.36em;text-transform:uppercase;color:#a07c43;margin-top:1.2mm}.tb .r{width:28mm;height:0;border-top:.6pt solid #b08a4e;margin:3mm auto 0}
      .doc h1{font-size:12.5pt;text-align:center;font-weight:bold;margin:6mm 0 6mm;text-transform:uppercase}.doc h2{font-size:12pt;font-weight:bold;margin:6mm 0 2mm;text-transform:uppercase}.doc h3{font-size:12pt;font-weight:bold;font-style:italic;margin:4mm 0 2mm}
      .doc p{margin:0 0 3mm;text-align:justify}${peticao ? '.doc p{text-indent:25mm}.doc h1+p,.doc p:first-child{text-indent:0}' : ''}.doc li{text-align:justify;margin-bottom:1.5mm}.doc mark{background:#fff3c4}
      .doc .local{text-align:right;margin-top:8mm}.assin{display:flex;gap:14mm;margin-top:16mm;page-break-inside:avoid}.assin div{flex:1;text-align:center;font-size:10.5pt;line-height:1.35}.assin span{display:block;border-top:.8pt solid #111;margin-bottom:1.5mm}.assin b{display:block}.assin.test{margin-top:14mm;text-align:left}.assin.test div{text-align:left}
      @media print{.doc mark{background:none}}@media screen{body{background:#e9e6df;padding:8mm 0}table.pg{background:#fff;max-width:210mm;margin:0 auto;box-shadow:0 2px 16px rgba(0,0,0,.09)}table.pg td{padding-left:30mm;padding-right:20mm}table.pg>thead td{padding-top:12mm}table.pg>tbody td{padding-bottom:20mm}}</style></head><body>
      <table class="pg"><thead><tr><td><div class="tb"><img src="${new URL(BRAND.logoDark, location.href)}" alt=""><div class="n">${esc(nomeMarca().toUpperCase())}</div><div class="l">${esc(BRAND.caption)}</div><div class="r"></div></div></td></tr></thead>
      <tbody><tr><td><div class="doc">${corpo}</div></td></tr></tbody></table></body></html>`;
    Report.mostrar(html, titulo, titulo.replace(/[^\wÀ-ú]+/g, '_') + '.html');
  }
};
