/* =====================================================================
   CADASTRAR PROCESSOS PELOS ARQUIVOS — arraste petições, decisões ou a
   cópia dos autos: a IA lê, o app preenche o cadastro do processo (você
   confere) e guarda os arquivos no Drive do escritório em
   Judicial (processos) / Área / Processo.
   ===================================================================== */
const JudDocs = {
  fila: [],
  POLOS: SCHEMAS.processos.fields.find(f => f.k === 'polo').opts,
  FASES: SCHEMAS.processos.fields.find(f => f.k === 'fase').opts,
  ATIVO: /autor|requerente|reclamante|exequente|impetrante|querelante|assistente|vitima|vítima/i,

  open(alvo) {
    JudDocs.fila = []; JudDocs.alvo = alvo || null;
    const remoto = Session.remote && Escritorio.conectado, ia = remoto && Escritorio.st.ia;
    const m = UI.modal({
      title: alvo ? 'Juntar arquivos ao processo' : 'Cadastrar processos pelos arquivos', sub: alvo ? esc(fmtCNJ(alvo.numero)) : 'Petições, decisões, sentenças, atas, intimações ou a cópia integral dos autos (PDF)', wide: true,
      body: `<div class="drop" id="drop">${icon('upload')}<b>Arraste aqui os arquivos ou a pasta</b><span>${alvo ? 'Os arquivos vão para a pasta deste processo no Drive do escritório; a IA aponta movimentações e prazos novos.' : 'Pode juntar arquivos de vários processos de uma vez: o app separa por número do processo, preenche o cadastro para você conferir e organiza tudo no Drive por área.'}</span>
        <div class="btn-row center"><label class="btn ghost sm">Escolher arquivos<input type="file" multiple hidden id="dFiles" accept=".pdf,.png,.jpg,.jpeg,.zip"></label><label class="btn ghost sm">Escolher pasta<input type="file" hidden id="dDir" webkitdirectory multiple></label></div></div>
        <div id="dList"></div>
        <div class="dopts">
          <label class="switch"><input type="checkbox" id="jDrive" ${remoto ? 'checked' : 'disabled'}><span></span>Guardar no Google Drive do escritório (Judicial › Área › Processo)</label>
          <label class="switch"><input type="checkbox" id="jIA" ${ia ? 'checked' : 'disabled'}><span></span>Ler com IA e preencher o cadastro (número, partes, vara, classe, valor, movimentações, audiências e prazos)</label>
          ${!Session.remote ? '<p class="muted small">No modo local, o app só identifica o número do processo pelo nome do arquivo.</p>' : !Escritorio.conectado ? '<p class="muted small">Conecte a conta do escritório (Gestão do App › Sistema) para guardar no Drive e ler com IA.</p>' : !ia ? '<p class="muted small">Cadastre a chave do Gemini do escritório (Gestão do App › Sistema) para a leitura por IA.</p>' : ''}
        </div>`,
      foot: `<span class="muted small" id="dCount"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="dGo" disabled>${icon('sparkle')} Processar</button>`
    });
    const add = async files => {
      for (const f of files) {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext === 'zip') { try { for (const z of await XLSX.unzip(await f.arrayBuffer())) { const nm = z.name.split('/').pop(), ex = nm.split('.').pop().toLowerCase(); if (['pdf', 'png', 'jpg', 'jpeg'].includes(ex) && !nm.startsWith('.')) Docs.fila.push({ file: new File([z.data], nm, { type: ex === 'pdf' ? 'application/pdf' : 'image/' + (ex === 'jpg' ? 'jpeg' : ex) }), path: z.name, st: 'na fila' }); } } catch (err) { UI.toast('Não consegui abrir ' + f.name, 'bad'); } continue; }
        if (ext === 'rar') { UI.toast(`${f.name}: descompacte o .rar antes.`, 'warn'); continue; }
        if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext) || f.name.startsWith('.')) continue;
        if (Docs.fila.some(x => x.file.name === f.name && x.file.size === f.size)) continue;
        Docs.fila.push({ file: f, path: f.webkitRelativePath || f.name, st: 'na fila' });
      }
      Docs.drawList();
    };
    Docs.fila = [];
    const walk = (entry, out) => new Promise(res => {
      if (entry.isFile) entry.file(f => { out.push(f); res(); }, res);
      else if (entry.isDirectory) { const rd = entry.createReader(), all = []; const next = () => rd.readEntries(async es => { if (!es.length) { for (const x of all) await walk(x, out); res(); } else { all.push(...es); next(); } }, res); next(); }
      else res();
    });
    const dz = $('#drop', m);
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', async e => { e.preventDefault(); dz.classList.remove('over'); const it = [...(e.dataTransfer.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean); if (it.length) { const out = []; for (const x of it) await walk(x, out); add(out); } else add([...e.dataTransfer.files]); });
    $('#dFiles', m).onchange = ev => add([...ev.target.files]);
    $('#dDir', m).onchange = ev => add([...ev.target.files]);
    $('#dGo', m).onclick = () => JudDocs.processar({ drive: $('#jDrive', m).checked, ia: $('#jIA', m).checked });
  },

  async processar(opt) {
    const go = $('#dGo'); go.disabled = true; go.innerHTML = icon('sync', 'spin') + ' Processando…';
    $$('[data-rmf]').forEach(b => b.remove());
    const e0 = escritorio(), alvo = JudDocs.alvo, res = [];
    const destinoAlvo = alvo ? { tipo: 'processo', area: alvo.area, key: alvo.id, nome: JudDocs.nomePasta(alvo) } : null;
    for (const x of Docs.fila) {
      const set = (st, cls) => { x.st = st; x.cls = cls; Docs.drawList(); };
      const r = { nome: x.file.name, path: x.path };
      try {
        if (opt.drive) {
          if (x.file.size > 30 * 1048576) throw new Error('arquivo acima de 30 MB');
          let leitura = null;
          if (opt.ia) { set('preparando a leitura…', 'busy'); leitura = await PdfLeve.preparar(x.file, { modo: 'processo', inicio: 25, fim: 15 }); r.leitura = leitura; }
          set(opt.ia ? 'guardando no Drive e lendo com IA…' : 'guardando no Drive…', 'busy');
          const up = await juntarELer({ modo: 'processo', destino: destinoAlvo, nome: x.file.name, mime: x.file.type || 'application/pdf', base64: await Docs.b64(x.file), ler: opt.ia, leitura, contexto: { escritorio: e0.nome || 'Amorim Firmo', advogado: e0.advogado || '', oab: e0.oab || '' } }, t => set(t, 'busy'));
          r.link = up.url; r.fileId = up.id; r.ia = up.ia || null; if (up.iaErro) r.iaErro = up.iaErro; if (up.pasta) r.pasta = up.pasta;
        }
        r.num = onlyDigits(r.ia?.numero || ''); if (r.num.length !== 20) { const mm = x.file.name.match(/\d{7}[-.\s_]?\d{2}[-.\s_]?\d{4}[-.\s_]?\d[-.\s_]?\d{2}[-.\s_]?\d{4}/); r.num = mm ? onlyDigits(mm[0]) : ''; }
        set(r.iaErro ? (r.link ? 'guardado' : 'pronto') + ' (IA: ' + r.iaErro.slice(0, 50) + ')' : r.ia ? 'lido' + (r.num ? ' · ' + fmtCNJ(r.num) : '') : r.link ? 'guardado' : 'pronto', r.iaErro ? 'err' : 'ok');
      } catch (err) { r.erro = err.message; set('erro: ' + err.message, 'err'); }
      res.push(r);
    }
    const ok = res.filter(r => !r.erro), erros = res.filter(r => r.erro);
    if (erros.length) UI.toast(erros.map(r => r.nome + ': ' + r.erro).join(' · '), 'bad', 8000);
    if (!ok.length) return;
    UI.closeModal();
    // agrupa por processo
    let grupos;
    if (alvo) grupos = [{ num: onlyDigits(alvo.numero), arquivos: ok, alvo }];
    else {
      const map = {}; ok.filter(r => r.num).forEach(r => (map[r.num] = map[r.num] || []).push(r));
      let sem = ok.filter(r => !r.num);
      grupos = Object.entries(map).map(([num, arquivos]) => ({ num, arquivos }));
      // arquivo sem número (procuração, documento pessoal…): vai para o processo com as mesmas partes
      const nomesDo = arqs => new Set(arqs.flatMap(a => (a.ia?.partes || []).map(p => norm(p.nome))).filter(Boolean));
      sem = sem.filter(r => {
        const meus = (r.ia?.partes || []).map(p => norm(p.nome)).filter(Boolean);
        const alvoG = grupos.length === 1 ? grupos[0] : grupos.find(g => meus.some(n => nomesDo(g.arquivos).has(n)));
        if (alvoG) { alvoG.arquivos.push(r); return false; } return true;
      });
      if (sem.length) grupos.push({ num: '', arquivos: sem });
      grupos.forEach(g => g.alvo = g.num ? DB.all('processos').find(p => onlyDigits(p.numero) === g.num) || null : null);
    }
    JudDocs.grupos = grupos; JudDocs.revisar(0);
  },

  /** junta as leituras de vários arquivos do mesmo processo (a primeira informação encontrada vale) */
  fundir(arqs) {
    const ia = {}; const lidos = arqs.map(a => a.ia).filter(Boolean);
    const ordem = ['Petição inicial', 'Cópia integral dos autos', 'Denúncia', 'Inquérito', 'Sentença', 'Acórdão', 'Decisão'];
    lidos.sort((a, b) => (ordem.indexOf(a.tipoDocumento) + 1 || 99) - (ordem.indexOf(b.tipoDocumento) + 1 || 99));
    ['numero', 'tribunal', 'orgao', 'comarca', 'classe', 'assunto', 'area', 'valorCausa', 'distribuicao', 'fase', 'resumo', 'pedidos'].forEach(k => { const v = lidos.map(l => l[k]).find(v => v !== null && v !== undefined && v !== ''); if (v !== undefined) ia[k] = v; });
    ia.segredo = lidos.some(l => l.segredo === true);
    const partes = []; let cIdx = null;
    lidos.forEach(l => (l.partes || []).forEach((p, i) => {
      if (!p || !p.nome) return;
      let j = partes.findIndex(x => (p.doc && onlyDigits(x.doc) === onlyDigits(p.doc)) || norm(x.nome) === norm(p.nome));
      if (j < 0) { partes.push({ ...p }); j = partes.length - 1; } else Object.keys(p).forEach(k => { if (!partes[j][k] && p[k]) partes[j][k] = p[k]; });
      if (l.clienteIndice === i && cIdx === null) cIdx = j;
    }));
    ia.partes = partes; ia.clienteIndice = cIdx;
    const seen = new Set(); ia.movimentacoes = [];
    lidos.forEach(l => (l.movimentacoes || []).forEach(mv => { const d = parseDate(mv.data), k = d + '|' + norm(mv.titulo); if (!d || !mv.titulo || seen.has(k)) return; seen.add(k); ia.movimentacoes.push({ ...mv, data: d }); }));
    ia.movimentacoes.sort((a, b) => a.data.localeCompare(b.data));
    const seen2 = new Set(); ia.compromissos = [];
    lidos.forEach(l => (l.compromissos || []).forEach(c => { const d = parseDate(c.data), k = d + '|' + norm(c.descricao); if (!d || seen2.has(k) || daysUntil(d) < 0) return; seen2.add(k); ia.compromissos.push({ ...c, data: d }); }));
    ia.tipos = [...new Set(lidos.map(l => l.tipoDocumento).filter(Boolean))];
    // peças principais (data + resumo) viram movimentações da linha do tempo
    const seen3 = new Set(); ia.pecas = [];
    lidos.forEach(l => (l.pecas || []).forEach(pc => { const d = parseDate(pc.data); if (!pc.tipo) return; const k = (d || '') + '|' + norm(pc.tipo); if (seen3.has(k)) return; seen3.add(k); ia.pecas.push({ ...pc, data: d }); }));
    ia.pecas.sort((a, b) => String(a.data || '9').localeCompare(String(b.data || '9')));
    ia.pecas.filter(pc => pc.data).forEach(pc => {
      const titulo = pc.tipo + (pc.instancia && !/1/.test(pc.instancia) ? ` (${pc.instancia})` : ''), k = pc.data + '|' + norm(titulo);
      if (!ia.movimentacoes.some(mv => mv.data === pc.data && (norm(mv.titulo).includes(norm(pc.tipo).split(' ')[0]) || norm(pc.tipo).includes(norm(mv.titulo))))) ia.movimentacoes.push({ data: pc.data, titulo, descricao: pc.resumo || '' });
    });
    // trânsito em julgado da fase de conhecimento
    const tj = lidos.map(l => l.transitoEmJulgado).filter(t => t && t.ocorreu && (!t.fase || /conhec/i.test(t.fase))).map(t => ({ ...t, data: parseDate(t.data) })).sort((a, b) => String(a.data || '9').localeCompare(String(b.data || '9')))[0];
    if (tj) { ia.transito = tj; if (tj.data && !ia.movimentacoes.some(mv => /tr[âa]nsit/i.test(mv.titulo))) ia.movimentacoes.push({ data: tj.data, titulo: 'Trânsito em julgado da fase de conhecimento', descricao: tj.fonte || '' }); }
    ia.movimentacoes.sort((a, b) => a.data.localeCompare(b.data));
    ia.lidasPecas = arqs.flatMap(a => a.leitura?.pecas || []);
    return ia;
  },
  nomePasta: p => `${fmtCNJ(p.numero) || 'Sem número'}${clienteNomes(p) ? ' — ' + clienteNomes(p).slice(0, 60) : ''}`,
  acharCliente(pt) { return DB.all('clientes').find(c => (pt.doc && onlyDigits(c.doc) === onlyDigits(pt.doc) && onlyDigits(pt.doc).length >= 11) || norm(c.nome) === norm(pt.nome)) || null; },
  poloOpt(polo) { return JudDocs.POLOS.find(o => norm(o) === norm(polo)) || (JudDocs.ATIVO.test(polo || '') ? 'Autor' : polo ? 'Réu' : ''); },

  /** uma tela de revisão por processo (Processo 1 de N) */
  revisar(i) {
    const g = JudDocs.grupos[i]; if (!g) { App.render(); return; }
    const ia = JudDocs.fundir(g.arquivos), alvo = g.alvo, n = JudDocs.grupos.length;
    const base = alvo ? clone(alvo) : { status: 'Ativo', clienteIds: [] };
    const vazio = v => v === null || v === undefined || v === '';
    const pre = {
      numero: g.num || onlyDigits(ia.numero), area: AREAS[ia.area] ? ia.area : null, classe: ia.classe, assunto: ia.assunto, orgao: ia.orgao, comarca: ia.comarca,
      tribunal: ia.tribunal || (tribunalAlias(g.num || ia.numero) || '').toUpperCase(), distribuicao: parseDate(ia.distribuicao), valorCausa: num(ia.valorCausa),
      fase: JudDocs.FASES.find(f => norm(f) === norm(ia.fase)) || null, segredo: ia.segredo || undefined, transito: ia.transito?.data || null
    };
    Object.entries(pre).forEach(([k, v]) => { if (vazio(base[k]) && !vazio(v)) base[k] = v; });
    if (!base.area) base.area = 'civil';
    if (!alvo && ia.resumo) base.obs = `Resumo (lido pela IA): ${ia.resumo}${ia.pedidos ? '\nPedidos/imputação: ' + ia.pedidos : ''}`;
    // partes e cliente sugerido
    const partes = ia.partes || [];
    let cIdx = ia.clienteIndice;
    if (cIdx === null || cIdx === undefined) { const k = partes.findIndex(p => JudDocs.acharCliente(p)); cIdx = k >= 0 ? k : null; }
    if (cIdx !== null && partes[cIdx]) {
      const pc = partes[cIdx], cl = JudDocs.acharCliente(pc);
      if (cl && !base.clienteIds.includes(cl.id)) base.clienteIds = [...base.clienteIds, cl.id];
      if (vazio(base.polo)) base.polo = JudDocs.poloOpt(pc.polo);
      if (vazio(base.parteContraria)) { const ativoCli = JudDocs.ATIVO.test(pc.polo || ''); base.parteContraria = partes.filter((p, j) => j !== cIdx && (JudDocs.ATIVO.test(p.polo || '') !== ativoCli)).map(p => p.nome).join('; ') || null; }
    }
    const movExist = alvo ? new Set(DB.where('movimentos', mv => mv.processoId === alvo.id).map(mv => mv.data + '|' + norm(mv.titulo))) : new Set();
    const movs = (ia.movimentacoes || []).filter(mv => !movExist.has(mv.data + '|' + norm(mv.titulo)));
    const comps = ia.compromissos || [];
    const lidos = g.arquivos.filter(a => a.ia).length;
    const m = UI.modal({
      title: alvo ? 'Atualizar processo' : 'Novo processo', sub: `${n > 1 ? `Processo ${i + 1} de ${n} · ` : ''}${g.arquivos.length} arquivo(s)${lidos ? ` · ${lidos} lido(s) pela IA` : ''}`, wide: true,
      body: `<div class="jd-files">${g.arquivos.map(a => `<span class="tag">${icon('file')} ${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.nome)}</a>` : esc(a.nome)}${a.ia?.tipoDocumento ? ' · ' + esc(a.ia.tipoDocumento) : ''}</span>`).join('')}</div>
        ${alvo ? `<div class="notice soft">${icon('check')}<div>Processo <b>${esc(fmtCNJ(alvo.numero))}</b> já cadastrado: os arquivos serão juntados a ele e só os campos vazios serão completados.</div></div>` : ''}
        ${ia.transito ? `<div class="notice tj">${icon('scale')}<div><b>A fase de conhecimento transitou em julgado${ia.transito.data ? ' em ' + fmtDate(ia.transito.data) : ''}.</b> ${esc(ia.transito.fonte || '')} — o campo “Trânsito em julgado” já está preenchido abaixo.</div></div>` : ''}
        ${ia.lidasPecas.length ? `<details class="jd-pecas"><summary>${icon('list')} ${ia.lidasPecas.length} peça(s) principal(is) identificada(s) e lida(s) pela IA</summary><div>${ia.lidasPecas.map(pc => `<span class="tag">${esc(pc.tipo)} · págs. ${pc.de}–${pc.ate}</span>`).join(' ')}</div></details>` : ''}
        ${g.arquivos.some(a => a.iaErro) ? `<div class="notice">${icon('alert')}<div>A IA não leu: ${g.arquivos.filter(a => a.iaErro).map(a => `<b>${esc(a.nome)}</b> (${esc(a.iaErro)})`).join('; ')}. Complete à mão o que faltar.${Session.remote && g.arquivos.some(a => a.iaErro && a.fileId) ? `<div class="btn-row" style="margin-top:8px"><button class="btn primary sm" id="jdReler">${icon('sparkle')} Ler de novo com a IA</button></div>` : ''}</div></div>` : ''}
        ${partes.length ? `<h4 class="sec">Partes encontradas — quem é o cliente do escritório?</h4><div class="jd-partes">${partes.map((p, j) => { const cl = JudDocs.acharCliente(p); return `<label class="jd-parte"><input type="radio" name="jdCli" value="${j}" ${j === cIdx ? 'checked' : ''}><div><b>${esc(p.nome)}</b><small>${esc(p.polo || '')}${p.doc ? ' · ' + esc(fmtDoc(p.doc)) : ''}${(p.advogados || []).length ? ' · adv.: ' + esc(p.advogados.join(', ')) : ''}</small></div>${cl ? '<span class="pill good">já é cliente</span>' : '<span class="pill neutral">novo</span>'}</label>`; }).join('')}<label class="jd-parte"><input type="radio" name="jdCli" value="-1" ${cIdx === null ? 'checked' : ''}><div><b>Nenhuma destas / escolher abaixo</b></div></label></div>
          <label class="switch"><input type="checkbox" id="jdNovoCli" checked><span></span>Cadastrar a parte escolhida como cliente, se ainda não for</label>` : ''}
        <h4 class="sec">Dados do processo ${lidos ? '<span class="muted small">— preenchidos pela IA; confira</span>' : ''}</h4>
        ${UI.form(SCHEMAS.processos, base)}
        ${movs.length ? `<label class="switch"><input type="checkbox" id="jdMov" checked><span></span>Lançar ${movs.length} movimentação(ões) encontradas nos documentos</label><div class="muted small pl">${movs.slice(-6).map(mv => `${fmtDate(mv.data)} — ${esc(mv.titulo)}`).join(' · ')}${movs.length > 6 ? ' …' : ''}</div>` : ''}
        ${comps.length ? `<label class="switch"><input type="checkbox" id="jdComp" checked><span></span>Lançar na agenda ${comps.length} compromisso(s): ${comps.map(c => `${esc(c.tipo || 'Prazo')} em ${fmtDate(c.data)}${c.hora ? ' ' + esc(c.hora) : ''}`).join(', ')}</label>` : ''}
        ${Session.remote ? `<label class="switch"><input type="checkbox" id="jdDJ" checked><span></span>Buscar também as movimentações no DataJud/CNJ</label>` : ''}`,
      foot: `${n > 1 ? `<button class="btn ghost" id="jdPular">Pular este</button>` : ''}<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="jdOk">${icon('check')} ${alvo ? 'Atualizar' : 'Cadastrar'}${n > 1 && i < n - 1 ? ' e ir para o próximo' : ''}</button>`
    });
    const form = $('form', m);
    $('[data-newcliente]', m)?.remove(); // o cliente novo vem da escolha da parte acima
    // escolher a parte atualiza polo / parte contrária / chips
    $$('input[name=jdCli]', m).forEach(rd => rd.onchange = () => {
      const j = +rd.value, pc = partes[j]; if (!pc) return;
      const cl = JudDocs.acharCliente(pc); if (cl) { const ch = $(`#f_clienteIds input[value="${cl.id}"]`, m); if (ch) ch.checked = true; }
      if (form.polo) form.polo.value = JudDocs.poloOpt(pc.polo);
      const ativoCli = JudDocs.ATIVO.test(pc.polo || ''); if (form.parteContraria) form.parteContraria.value = partes.filter((p, k) => k !== j && JudDocs.ATIVO.test(p.polo || '') !== ativoCli).map(p => p.nome).join('; ');
    });
    $('#f_numero', m)?.addEventListener('input', ev => { const d = onlyDigits(ev.target.value); if (d.length === 20) { ev.target.value = fmtCNJ(d); ev.target.classList.toggle('invalid', !validCNJ(d)); const t = $('#f_tribunal', m); if (t && !t.value) t.value = (tribunalAlias(d) || '').toUpperCase(); } });
    $('#jdPular', m)?.addEventListener('click', () => JudDocs.revisar(i + 1));
    $('#jdReler', m)?.addEventListener('click', async ev => {
      const b = ev.currentTarget; b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Lendo… (pode levar até 2 minutos)';
      const e0 = escritorio();
      for (const a of g.arquivos.filter(a => a.iaErro && a.fileId)) {
        try { a.ia = await apiT('reler', { fileId: a.fileId, nome: a.nome, modo: 'processo', leitura: a.leitura || null, contexto: { escritorio: e0.nome || 'Amorim Firmo', advogado: e0.advogado || '', oab: e0.oab || '' } }); delete a.iaErro; }
        catch (err) { a.iaErro = err.message; }
      }
      const ok = g.arquivos.every(a => !a.iaErro);
      UI.toast(ok ? 'Arquivo lido pela IA.' : 'A IA ainda não conseguiu ler. Tente de novo em alguns minutos.', ok ? 'ok' : 'warn', 6000);
      if (!g.num) { const n2 = onlyDigits(JudDocs.fundir(g.arquivos).numero || ''); if (n2.length === 20) { g.num = n2; g.alvo = DB.all('processos').find(p => onlyDigits(p.numero) === n2) || null; } }
      JudDocs.revisar(i);
    });
    $('#jdOk', m).onclick = async () => {
      const b = $('#jdOk', m);
      const j = +($('input[name=jdCli]:checked', m)?.value ?? -1), pc = partes[j];
      let novoCli = null;
      if (pc && $('#jdNovoCli', m)?.checked && !JudDocs.acharCliente(pc)) novoCli = { id: uid('cl'), tipo: pc.tipo === 'Pessoa jurídica' || onlyDigits(pc.doc).length === 14 ? 'Pessoa jurídica' : 'Pessoa física', nome: pc.nome, doc: onlyDigits(pc.doc) || '', email: pc.email || '', telefone: pc.telefone || '', endereco: pc.endereco || '' };
      const { rec, errs } = UI.readForm(form, SCHEMAS.processos, base);
      const errs2 = errs.filter(x => !(novoCli && /Cliente/.test(x)));
      if (errs2.length) { UI.toast('Verifique: ' + errs2.join(', '), 'bad', 6000); return; }
      if (!alvo && rec.numero && DB.all('processos').some(p => onlyDigits(p.numero) === onlyDigits(rec.numero))) { UI.toast('Já existe um processo com esse número.', 'bad'); return; }
      b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Salvando…';
      if (novoCli) { await DB.save('clientes', novoCli); rec.clienteIds = [...new Set([...(rec.clienteIds || []), novoCli.id])]; }
      if (partes.length) rec.partes = DJEN.fundirPartes(rec.partes, partes.map((pt, k) => ({ nome: pt.nome, polo: JudDocs.ATIVO.test(pt.polo || '') ? 'Ativo' : pt.polo ? 'Passivo' : '', papel: pt.polo || '', doc: onlyDigits(pt.doc) || '', advogados: (pt.advogados || []).map(a => ({ nome: String(a.nome || a) })), cliente: k === j })));
      if (!rec.tribunal) { const t = tribunalAlias(rec.numero); if (t) rec.tribunal = t.toUpperCase(); }
      const [p] = await DB.save('processos', rec);
      // arquivos: move para Judicial / Área / Processo e registra no processo
      const ids = g.arquivos.filter(a => a.fileId).map(a => a.fileId);
      let pasta = g.arquivos.find(a => a.pasta)?.pasta || p.pastaLink || '';
      if (ids.length && Session.remote) { try { const r = await api('mover', { ids, destino: { tipo: 'processo', area: p.area, key: p.id, nome: JudDocs.nomePasta(p) } }); pasta = r.pasta || pasta; } catch (err) { UI.toast('Os arquivos ficaram em “_A classificar”: ' + err.message, 'warn'); } }
      const arqAnt = (p.arquivos || []).filter(a => !g.arquivos.some(x => x.nome === a.nome));
      p.arquivos = [...arqAnt, ...g.arquivos.map(a => ({ nome: a.nome, link: a.link || '', tipo: a.ia?.tipoDocumento || '', data: todayISO() }))];
      if (pasta) p.pastaLink = pasta;
      await DB.save('processos', p);
      const vis = escritorio().djVisivel !== false;
      if ($('#jdMov', m)?.checked) await DB.save('movimentos', movs.map(mv => ({ processoId: p.id, data: mv.data, titulo: mv.titulo, descricao: mv.descricao || '', origem: 'documento', visivelCliente: vis })));
      if ($('#jdComp', m)?.checked) await DB.save('prazos', comps.map(c => ({ processoId: p.id, tipo: SCHEMAS.prazos.fields[0].opts.find(o => norm(o) === norm(c.tipo)) || 'Prazo', data: c.data, hora: c.hora || '', descricao: c.descricao || c.tipo || 'Compromisso', local: c.local || '', concluido: false, visivelCliente: /audi|per[ií]cia|julgamento/i.test(c.tipo || '') })));
      if ($('#jdDJ', m)?.checked && validCNJ(p.numero)) { try { const r = await api('datajud', { numero: onlyDigits(p.numero) }); const novos = Judicial.mergeDatajud(p, r); await DB.save('processos', p); if (novos.length) await DB.save('movimentos', novos); } catch { } }
      UI.closeModal(); UI.toast(`${alvo ? 'Processo atualizado' : 'Processo cadastrado'}: ${fmtCNJ(p.numero) || 'sem número'}.`);
      if (i < n - 1) JudDocs.revisar(i + 1); else { location.hash = '#/processo/' + p.id; App.render(); }
    };
  }
};
