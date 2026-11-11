/* =====================================================================
   JUNTAR DOCUMENTOS — arraste a pasta com contratos, aditivos e planilha;
   o app guarda no Drive, lê com IA, liga ao contrato certo e preenche.
   ===================================================================== */
const Docs = {
  fila: [],
  STOP: new Set(['contrato', 'contratos', 'de', 'da', 'do', 'das', 'dos', 'e', 'n', 'no', 'na', 'ct', 'pdf', 'termo', 'aditivo', 'aditivos', 'copia', 'final', 'assinado', 'scan', 'digitalizado', '1', '2', '3']),
  ABREV: { gab: 'gabinete', sec: 'secretaria', adm: 'administracao', pg: 'procuradoria geral', proc: 'procuradoria', fin: 'financas', com: 'comunicacao', agr: 'agricultura', pol: 'politica', ab: 'abastecimento', tur: 'turismo', saude: 'saude', educ: 'educacao', seduc: 'educacao' },

  lote: 0,
  open(e) {
    Docs.fila = []; Docs.lote++; // uma nova juntada encerra a conferência que tenha ficado pendente
    const m = UI.modal({
      title: e ? 'Juntar documentos' : 'Nova empresa a partir dos documentos', sub: e ? esc(e.fantasia || e.razao) : 'Arraste os contratos e a planilha: o app identifica a empresa contratada, busca o CNPJ na Receita e cadastra tudo', wide: true,
      body: `<div class="drop" id="drop">${icon('upload')}<b>Arraste aqui a pasta ou os arquivos</b><span>Contratos, termos aditivos, termos de referência (PDF), a planilha de auditoria (.xlsx) ou um .zip com tudo</span>
        <div class="btn-row center"><label class="btn ghost sm">Escolher arquivos<input type="file" multiple hidden id="dFiles" accept=".pdf,.xlsx,.zip,.png,.jpg,.jpeg"></label><label class="btn ghost sm">Escolher pasta<input type="file" hidden id="dDir" webkitdirectory multiple></label></div></div>
        <p class="muted small">Arquivos .rar não podem ser lidos pelo navegador: descompacte antes (no Windows: botão direito › Extrair tudo) e arraste a pasta.</p>
        <div id="dList"></div>
        <div class="dopts">
          <label class="switch"><input type="checkbox" id="dDrive" ${Escritorio.conectado ? 'checked' : 'disabled'}><span></span>Guardar os arquivos no Google Drive do escritório${Escritorio.st?.conta ? ' (' + esc(Escritorio.st.conta) + ')' : ''}</label>
          <label class="switch"><input type="checkbox" id="dIA" ${Escritorio.conectado && Escritorio.st.ia ? 'checked' : 'disabled'}><span></span>Ler o conteúdo dos PDFs com IA (chave do escritório) e sugerir o preenchimento</label>
          ${!Session.remote ? '<p class="muted small">No modo local, o app só cadastra os documentos e os liga aos contratos.</p>' : !Escritorio.conectado ? '<p class="muted small">Conecte a conta do escritório (Gestão do App › Sistema) para guardar no Drive e ler com IA.</p>' : !Escritorio.st.ia ? '<p class="muted small">Para a leitura por IA, cadastre a chave do Gemini do escritório em Gestão do App › Sistema.</p>' : ''}
        </div>`,
      foot: `<span class="muted small" id="dCount"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="dGo" disabled>${icon('sparkle')} Processar</button>`
    });
    const add = async files => {
      for (const f of files) {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (ext === 'zip') { try { for (const z of await XLSX.unzip(await f.arrayBuffer())) { const nm = z.name.split('/').pop(); const ex = nm.split('.').pop().toLowerCase(); if (['pdf', 'xlsx', 'png', 'jpg', 'jpeg'].includes(ex) && !nm.startsWith('.')) Docs.fila.push({ file: new File([z.data], nm, { type: ex === 'pdf' ? 'application/pdf' : ex === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'image/' + (ex === 'jpg' ? 'jpeg' : ex) }), path: z.name, st: 'na fila' }); } } catch (err) { UI.toast('Não consegui abrir ' + f.name + ': ' + err.message, 'bad'); } continue; }
        if (ext === 'rar') { UI.toast(`${f.name}: descompacte o .rar antes de enviar.`, 'warn', 6000); continue; }
        if (!['pdf', 'xlsx', 'png', 'jpg', 'jpeg'].includes(ext) || f.name.startsWith('.') || f.name.startsWith('~$')) continue;
        if (Docs.fila.some(x => x.file.name === f.name && x.file.size === f.size)) continue;
        Docs.fila.push({ file: f, path: f.webkitRelativePath || f.name, st: 'na fila' });
      }
      Docs.drawList();
    };
    const walk = (entry, out) => new Promise(res => {
      if (entry.isFile) entry.file(f => { out.push(f); res(); }, res);
      else if (entry.isDirectory) { const rd = entry.createReader(); const all = []; const next = () => rd.readEntries(async es => { if (!es.length) { for (const x of all) await walk(x, out); res(); } else { all.push(...es); next(); } }, res); next(); }
      else res();
    });
    const dz = $('#drop', m);
    ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e2 => { e2.preventDefault(); dz.classList.add('over'); }));
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', async e2 => {
      e2.preventDefault(); dz.classList.remove('over');
      const items = [...(e2.dataTransfer.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
      if (items.length) { const out = []; for (const it of items) await walk(it, out); add(out); } else add([...e2.dataTransfer.files]);
    });
    $('#dFiles', m).onchange = ev => add([...ev.target.files]);
    $('#dDir', m).onchange = ev => add([...ev.target.files]);
    $('#dGo', m).onclick = () => Docs.processar(e, { drive: $('#dDrive', m).checked, ia: $('#dIA', m).checked });
  },
  drawList() {
    const L = $('#dList'); if (!L) return;
    const kb = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
    L.innerHTML = Docs.fila.length ? `<ul class="dfiles">${Docs.fila.map((x, i) => `<li class="${x.cls || ''}">${icon(x.file.name.toLowerCase().endsWith('.xlsx') ? 'list' : 'file')}<div><b>${esc(x.file.name)}</b><small>${kb(x.file.size)}${x.match ? ' · ' + esc(x.match) : ''}</small></div><span class="dst">${x.cls === 'busy' ? icon('sync', 'spin') : x.cls === 'ok' ? icon('check') : x.cls === 'err' ? icon('alert') : ''} ${esc(x.st)}</span>${x.cls ? '' : `<button class="icon-btn sm" data-rmf="${i}">${icon('x')}</button>`}</li>`).join('')}</ul>` : '';
    $$('[data-rmf]', L).forEach(b => b.onclick = () => { Docs.fila.splice(+b.dataset.rmf, 1); Docs.drawList(); });
    const n = Docs.fila.length; $('#dCount') && ($('#dCount').textContent = n ? `${n} arquivo(s)` : '');
    $('#dGo') && ($('#dGo').disabled = !n);
  },
  b64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(file); }); },

  /* ---------- casar arquivo ↔ contrato ---------- */
  tokens(s) {
    return norm(String(s || '').replace(/\.[a-z0-9]+$/i, '').replace(/\(\d+\)/g, ' ').replace(/[_\-–.,;/°º]+/g, ' ')).split(' ').filter(t => t && !Docs.STOP.has(t)).flatMap(t => (Docs.ABREV[t] || t).split(' '));
  },
  match(e, nome, ia) {
    const cs = empRecs('contratos', e.id); if (!cs.length) return null;
    const base = norm(nome.replace(/\(\d+\)/g, '').replace(/\.[a-z0-9]+$/i, ''));
    // 1) nome do arquivo citado nas evidências/inventário
    for (const coll of ['documentos', 'aditivos', 'maoDeObra', 'obrigacoes']) {
      const hit = empRecs(coll, e.id).find(r => r.contrato && [r.arquivo, r.nome, r.evidencia, r.caminho].some(v => v && norm(String(v).replace(/\(\d+\)/g, '')).includes(base)));
      if (hit) { const c = cs.find(x => x.codigo === hit.contrato); if (c) return { c, por: 'nome do arquivo citado na planilha' }; }
    }
    // 2) número do contrato (lido pela IA ou presente no nome: 633_2025)
    const nums = [ia?.numeroContrato, ...(nome.match(/\d{2,5}[_\/.-]\d{4}/g) || [])].filter(Boolean).map(v => onlyDigits(v));
    for (const n of nums) { const c = cs.find(x => x.numero && onlyDigits(x.numero) === n); if (c) return { c, por: 'número do contrato' }; }
    // 3) semelhança entre nome/unidade e o cadastro
    const ft = new Set([...Docs.tokens(nome), ...Docs.tokens(ia?.unidade)]);
    let best = null, bs = 0;
    cs.forEach(c => {
      const txt = [c.unidade, c.grupo, c.tomador].join(' '), ct = Docs.tokens(txt);
      const acr = norm(c.unidade || '').split(' ').filter(w => w.length > 2).map(w => w[0]).join('');
      let s = 0; ft.forEach(t => { if (t.length >= 2 && t === acr) s += 3; else if (ct.includes(t)) s += t.length > 3 ? 2 : 1; else if (t.length >= 3 && ct.some(w => w.startsWith(t))) s += 1.5; });
      s = s / Math.max(3, ct.length) * 3 + s * 0.2;
      if (s > bs) { bs = s; best = c; }
    });
    return bs >= 1.6 ? { c: best, por: 'semelhança de nome/unidade' } : null;
  },

  /* ---------- processamento ---------- */
  async processar(e, opt) {
    const go = $('#dGo'); go.disabled = true; go.innerHTML = icon('sync', 'spin') + ' Processando…';
    $$('[data-rmf]').forEach(b => b.remove());
    const planilhas = [], res = [];
    for (const x of Docs.fila) {
      const set = (st, cls) => { x.st = st; x.cls = cls; Docs.drawList(); };
      if (x.file.name.toLowerCase().endsWith('.xlsx')) { planilhas.push(x.file); set('planilha — será importada', 'ok'); continue; }
      const r = { nome: x.file.name, path: x.path, size: x.file.size };
      try {
        if (opt.drive) {
          if (x.file.size > 30 * 1048576) throw new Error('arquivo acima de 30 MB');
          const ler = opt.ia && /pdf|image/.test(x.file.type || 'pdf');
          set(ler ? 'guardando no Drive do escritório e lendo com IA…' : 'guardando no Drive do escritório…', 'busy');
          const leitura = ler ? await PdfLeve.preparar(x.file, { inicio: 30, fim: 10 }) : null; r.leitura = leitura;
          const up = await juntarELer({ empresaKey: e ? e.id : '_classificar', empresa: e ? (e.fantasia || e.razao) : '_A classificar', nome: x.file.name, mime: x.file.type || 'application/pdf', base64: await Docs.b64(x.file), ler, leitura }, t => set(t, 'busy'));
          r.link = up.url; r.fileId = up.id; r.ia = up.ia || null; if (up.iaErro) r.iaErro = up.iaErro;
        }
        set(r.iaErro ? (r.link ? 'guardado no Drive' : 'pronto') + ' (IA: ' + r.iaErro.slice(0, 60) + ')' : r.ia ? (r.link ? 'guardado e lido' : 'lido') : r.link ? 'guardado no Drive' : 'pronto', r.iaErro ? 'err' : 'ok');
      } catch (err) { r.erro = err.message; set('erro: ' + err.message, 'err'); }
      res.push(r);
    }
    UI.closeModal();
    if (!e) return Docs.novaEmpresa(res, planilhas);
    Docs.finalizar(e, res, planilhas);
  },
  async finalizar(e, res, planilhas) {
    const nao = [], lote = Docs.lote;
    for (const p of planilhas) {
      if (Docs.lote !== lote) return; // outra juntada começou: esta para aqui
      const r = await Consult.importar(e, p, true);
      if (r === 'nao') nao.push(p.name);
      if (r === 'substituido') return; // o usuário saiu da conferência para outra tela: não reabre as próximas
    }
    if (nao.length) UI.toast(`${nao.length === 1 ? 'Planilha não reconhecida' : nao.length + ' planilhas não reconhecidas'}: ${nao.join(', ')}. O app reconhece a planilha de auditoria e os relatórios do DP (folha de pagamento, vale-alimentação, cesta básica, vale-transporte e férias).`, 'bad', 9000);
    if (res.length) Docs.revisar(e, res.filter(r => !r.erro), res.filter(r => r.erro));
    else location.hash = '#/empresa/' + e.id;
  },
  /* identifica a empresa contratada nos documentos e cadastra (com dados da Receita) */
  async novaEmpresa(res, planilhas) {
    const votos = {};
    res.forEach(r => { const c = onlyDigits(r.ia?.cnpjContratada); const k = validCNPJ(c) ? c : ''; const nm = r.ia?.contratada; if (k || nm) { const v = votos[k || norm(nm)] = votos[k || norm(nm)] || { cnpj: k, nome: nm || '', n: 0 }; v.n++; if (!v.nome && nm) v.nome = nm; } });
    for (const p of planilhas) { // planilha de auditoria: coluna "Responsável interno"
      try { const book = await XLSX.read(await p.arrayBuffer()); for (const rows of Object.values(book)) { const hi = rows.findIndex(r => (r || []).some(c => norm(c) === 'responsavel interno')); if (hi < 0) continue; const ci = rows[hi].findIndex(c => norm(c) === 'responsavel interno'); rows.slice(hi + 1).forEach(r => { const nm = r?.[ci]; if (nm && typeof nm === 'string' && nm.length > 5 && !isGap(nm)) { const v = votos[norm(nm)] = votos[norm(nm)] || { cnpj: '', nome: nm, n: 0 }; v.n++; } }); } } catch { }
    }
    const best = Object.values(votos).sort((a, b) => (b.cnpj ? 1 : 0) - (a.cnpj ? 1 : 0) || b.n - a.n)[0] || { cnpj: '', nome: '' };
    const existente = DB.all('empresas').find(x => (best.cnpj && onlyDigits(x.cnpj) === best.cnpj) || (best.nome && norm(x.razao) === norm(best.nome)));
    const seguir = async emp => {
      const ids = res.filter(r => r.fileId).map(r => r.fileId);
      if (ids.length && Escritorio.conectado) { try { await api('mover', { ids, empresaKey: emp.id, empresa: emp.fantasia || emp.razao }); } catch (err) { UI.toast('Arquivos ficaram na pasta “_A classificar”: ' + err.message, 'warn'); } }
      location.hash = '#/empresa/' + emp.id; App.render();
      Docs.finalizar(emp, res, planilhas);
    };
    if (existente) {
      if (await UI.confirm(`Os documentos são da empresa <b>${esc(existente.razao)}</b>, que já está cadastrada. Juntar a ela?`, 'Juntar', false)) return seguir(existente);
    }
    UI.toast(best.nome || best.cnpj ? `Empresa identificada nos documentos: ${String(best.nome || fmtDoc(best.cnpj)).replace(/\.$/, '')}. Confira e salve.` : 'Não identifiquei a empresa nos documentos: informe o CNPJ.', best.nome || best.cnpj ? 'ok' : 'warn', 6000);
    const m = UI.editRecord('empresas', { cnpj: best.cnpj, razao: best.nome || '', sigla: best.nome ? RFB.siglaDe(best.nome) : '' }, { title: 'Confirmar empresa', onSaved: seguir });
    if (best.cnpj) setTimeout(() => $('.rfb-btn', m)?.click(), 50);
  },

  /* ---------- revisão: o que será preenchido ---------- */
  ESTRUT: ['numero', 'cnpjTomador', 'inicio', 'fim', 'valorMensal', 'valorAnual'],
  temAditivo(c) { return (c.aditivos && !isGap(c.aditivos) && /aditivo|prorroga/i.test(c.aditivos)) || empRecs('aditivos', c.empresaId).some(a => a.contrato === c.codigo); },
  CAMPOS: [['tomador', 'tomador'], ['cnpjTomador', 'cnpjTomador'], ['unidade', 'unidade'], ['objeto', 'objeto'], ['numero', 'numeroContrato'], ['inicio', 'inicio'], ['fim', 'fim'], ['prazo', 'prazo'], ['valorMensal', 'valorMensal'], ['valorAnual', 'valorAnual'], ['reajuste', 'reajuste'], ['cct', 'cct'], ['fiscal', 'fiscal']],
  revisar(e, res, erros) {
    // casa cada arquivo com um contrato (depois da importação da planilha, se houver)
    res.forEach(r => { const mt = Docs.match(e, r.nome, r.ia); r.contrato = mt?.c?.codigo || ''; r.por = mt?.por || ''; });
    const cs = empRecs('contratos', e.id).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }));
    const vazio = v => v === null || v === undefined || v === '' || isGap(v);
    const igual = (f, a, b) => { if (f.type === 'money') return Math.abs((num(a) || 0) - (num(b) || 0)) < 0.01; if (f.type === 'date') return parseDate(a) === parseDate(b); if (f.type === 'doc') return onlyDigits(a) === onlyDigits(b); return norm(a) === norm(b); };
    const card = (r, i) => {
      const c = cs.find(x => x.codigo === r.contrato), ia = r.ia || {};
      const ehAditivo = /aditivo/i.test(ia.tipo || r.nome);
      const linhas = r.ia ? Docs.CAMPOS.map(([k, ik]) => {
        const f = SCHEMAS.contratos.fields.find(x => x.k === k); let nv = ia[ik];
        if (nv === null || nv === undefined || nv === '') return '';
        if (f.type === 'date') nv = parseDate(nv) || nv; if (f.type === 'money') nv = num(nv) ?? nv;
        const at = c ? c[k] : null;
        if (!vazio(at) && igual(f, at, nv)) return '';
        const conflito = !vazio(at);
        if (ehAditivo && conflito && !['fim', 'prazo', 'valorMensal', 'valorAnual'].includes(k)) return '';
        if (!ehAditivo && conflito && c && Docs.temAditivo(c) && ['inicio', 'fim', 'prazo'].includes(k)) return ''; // vigência original já alterada por aditivo
        const estrut = Docs.ESTRUT.includes(k);
        const tag = !conflito ? '' : ehAditivo ? 'alteração do aditivo' : estrut ? 'divergência' : 'redação diferente';
        return `<tr class="${conflito && estrut && !ehAditivo ? 'conf' : ''}"><td><label class="switch sm"><input type="checkbox" data-f="${i}:${k}" ${conflito && !ehAditivo ? '' : 'checked'}><span></span></label></td><td>${esc(f.label.replace(/ \(R\$\)/, ''))}</td><td>${UI.cell(f, at)}</td><td><b>${UI.cell(f, nv)}</b>${tag ? `<em class="divg ${estrut ? '' : 'soft'}">${tag}</em>` : ''}</td></tr>`;
      }).join('') : '';
      const nPostos = c ? empRecs('maoDeObra', e.id).filter(x => x.contrato === c.codigo).length : 0;
      const postos = (ia.postos || []).filter(p => p && p.posto);
      const obr = (ia.obrigacoes || []).filter(o => o && o.obrigacao);
      return `<section class="rev" data-i="${i}">
        <header>${icon(ehAditivo ? 'edit' : 'file')}<div><b>${esc(r.nome)}</b><small>${esc(ia.tipo || 'Documento')}${ia.numeroAditivo ? ' · ' + esc(ia.numeroAditivo) : ''}${ia.paginas ? ' · ' + ia.paginas + ' pág.' : ''}${r.link ? ` · <a href="${esc(r.link)}" target="_blank" rel="noopener">abrir no Drive</a>` : ''}</small></div>
          <select data-c="${i}"><option value="__novo">+ Criar novo contrato</option><option value="__nenhum" ${!r.contrato ? '' : ''}>Só registrar o documento (sem contrato)</option>${cs.map(x => `<option value="${esc(x.codigo)}" ${x.codigo === r.contrato ? 'selected' : ''}>${esc(x.codigo)} · ${esc((x.unidade || x.grupo || '').slice(0, 50))}</option>`).join('')}</select></header>
        <p class="muted small">${r.contrato ? `Ligado a <b>${esc(r.contrato)}</b> por ${esc(r.por)}.` : 'Não encontrei um contrato correspondente — escolha um ou crie um novo.'}${r.iaErro && r.fileId ? ` <button type="button" class="btn ghost xs" data-reler="${i}">${icon('sync')} Ler de novo com a IA</button>` : ''}${r.iaErro ? ` <span class="t-bad">A IA não conseguiu ler: ${esc(r.iaErro)}</span>` : ''}</p>
        ${linhas ? `<table class="mini revt"><thead><tr><th></th><th>Campo</th><th>No cadastro</th><th>No documento</th></tr></thead><tbody>${linhas}</tbody></table>` : (r.ia ? '<p class="muted small">Os dados do documento conferem com o cadastro.</p>' : '')}
        ${ia.alteracoes ? `<p class="small"><b>O que o documento altera:</b> ${esc(ia.alteracoes)}</p>` : ''}
        ${postos.length ? `<label class="switch"><input type="checkbox" data-postos="${i}" ${nPostos ? '' : 'checked'}><span></span>Lançar ${postos.length} posto(s) em Mão de obra ${nPostos ? `<em class="divg">já há ${nPostos} lançados — marcar substitui</em>` : ''}</label><div class="muted small pl">${postos.slice(0, 8).map(p => `${esc(p.posto)} (${fmtNum(p.quantidade) || '?'})${num(p.custoMensalTotal) !== null ? ' ' + fmtMoneyShort(p.custoMensalTotal) : ''}`).join(' · ')}${postos.length > 8 ? ' …' : ''}</div>` : ''}
        ${obr.length ? `<label class="switch"><input type="checkbox" data-obr="${i}" ${c && empRecs('obrigacoes', e.id).some(o => o.contrato === c.codigo && o.origem === 'ia') ? '' : 'checked'}><span></span>Lançar ${obr.length} obrigação(ões) contratual(is) na matriz de obrigações</label>` : ''}
        ${ia.observacoes ? `<div class="notice soft">${icon('sparkle')}<div><b>Pontos de atenção apontados pela IA:</b> ${esc(ia.observacoes)}</div></div>` : ''}
      </section>`;
    };
    const m = UI.modal({
      title: 'Revisar e aplicar', sub: `${res.length} documento(s) processado(s)${erros.length ? ` · ${erros.length} com erro` : ''}`, wide: true,
      body: `${erros.length ? `<div class="notice">${icon('alert')}<div>${erros.map(r => `<b>${esc(r.nome)}</b>: ${esc(r.erro)}`).join('<br>')}</div></div>` : ''}
        <p class="muted small">Campos vazios ou “não identificado” no cadastro já vêm marcados. <b>Divergências</b> entre o cadastro e o documento vêm desmarcadas — confira antes de aplicar; o app pode registrá-las como achados de auditoria.</p>
        ${res.map(card).join('')}
        <label class="switch"><input type="checkbox" id="rvAch" checked><span></span>Registrar as divergências não aplicadas como achados no plano de ação (risco médio)</label>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rvOk">${icon('check')} Aplicar</button>`
    });
    $$('[data-reler]', m).forEach(b => b.onclick = async () => {
      const r = res[+b.dataset.reler]; b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Lendo…';
      try { r.ia = await apiT('reler', { fileId: r.fileId, nome: r.nome, leitura: r.leitura || null }, 300000); delete r.iaErro; UI.toast('Documento lido pela IA.'); }
      catch (err) { r.iaErro = /demorou/.test(err.message) ? 'a IA demorou demais — tente de novo em alguns minutos' : err.message; UI.toast('IA: ' + r.iaErro, 'warn', 7000); }
      Docs.revisar(e, res, erros);
    });
    $('#rvOk', m).onclick = async () => {
      const b = $('#rvOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Aplicando…';
      const saves = { contratos: [], documentos: [], maoDeObra: [], obrigacoes: [], achados: [], aditivos: [] }, remover = [];
      let seq = cs.map(x => +(String(x.codigo).match(/(\d+)$/) || [0, 0])[1]).reduce((a, n) => Math.max(a, n), 0);
      const work = {};
      let achSeq = empRecs('achados', e.id).filter(a => /^DOC-/.test(a.codigo || '')).length;
      res.forEach((r, i) => {
        const ia = r.ia || {}; let sel = $(`[data-c="${i}"]`, m).value, c = null;
        if (sel === '__novo') { seq++; c = { id: uid('co'), empresaId: e.id, codigo: `${e.sigla || 'CT'}-${String(seq).padStart(3, '0')}`, status: 'Cadastrado a partir de documento' }; work[c.codigo] = c; }
        else if (sel !== '__nenhum') c = work[sel] = work[sel] || clone(cs.find(x => x.codigo === sel));
        if (c) {
          Docs.CAMPOS.forEach(([k, ik]) => {
            const chk = $(`[data-f="${i}:${k}"]`, m); if (!chk) return;
            const f = SCHEMAS.contratos.fields.find(x => x.k === k); let nv = ia[ik];
            if (f.type === 'date') nv = parseDate(nv) || nv; if (f.type === 'money') nv = num(nv) ?? nv; if (f.type === 'doc') nv = onlyDigits(nv) || nv;
            if (chk.checked) c[k] = nv;
            else if ($('#rvAch', m).checked && !vazio(c[k]) && Docs.ESTRUT.includes(k) && !(Docs.temAditivo(c) && ['inicio', 'fim', 'prazo'].includes(k))) saves.achados.push({ empresaId: e.id, codigo: `DOC-${String(++achSeq).padStart(3, '0')}`, contrato: c.codigo, area: 'Documental', achado: `Divergência entre o cadastro e o documento “${r.nome}” no campo ${f.label.replace(/ \(R\$\)/, '')}: cadastro “${fmtDate(c[k]) && f.type === 'date' ? fmtDate(c[k]) : f.type === 'money' ? fmtMoney(c[k]) : c[k]}”, documento “${f.type === 'date' ? fmtDate(nv) : f.type === 'money' ? fmtMoney(nv) : nv}”.`, criterio: r.nome, risco: 'Médio', recomendacao: 'Confirmar o valor vigente com o tomador e corrigir o cadastro.', status: 'Pendente' });
          });
          if (/aditivo/i.test(ia.tipo || r.nome)) {
            const linha = `${ia.numeroAditivo || 'Termo aditivo'}${ia.alteracoes ? ': ' + ia.alteracoes : ''}`;
            if (!String(c.aditivos || '').includes(linha.slice(0, 40))) c.aditivos = [c.aditivos && !isGap(c.aditivos) ? c.aditivos : '', linha].filter(Boolean).join('\n');
            saves.aditivos.push({ empresaId: e.id, contrato: c.codigo, numero: ia.numeroAditivo || '', nome: r.nome, datas: [ia.inicio, ia.fim].filter(Boolean).map(fmtDate).join('; '), valor: num(ia.valorGlobal) ?? num(ia.valorAnual) ?? null, tipoValor: num(ia.valorGlobal) !== null ? 'global' : num(ia.valorAnual) !== null ? 'anual' : '', trecho: ia.alteracoes || '', providencia: 'Lido por IA — conferir no documento' });
          }
          if (!/^Sim/i.test(c.documentos || '')) c.documentos = 'Sim – documento(s) anexado(s) no app';
          if (!c.tomador && ia.tomador) c.tomador = ia.tomador;
          saves.contratos.push(c);
          const pc = $(`[data-postos="${i}"]`, m);
          if (pc?.checked) {
            empRecs('maoDeObra', e.id).filter(x => x.contrato === c.codigo).forEach(x => remover.push(['maoDeObra', x.id]));
            (ia.postos || []).filter(p => p && p.posto).forEach(p => saves.maoDeObra.push(derive('maoDeObra', { empresaId: e.id, contrato: c.codigo, posto: p.posto, qtdContratada: num(p.quantidade), salario: num(p.salario), custoPrevisto: num(p.custoMensalTotal), cct: ia.cct || '', evidencia: r.nome + (r.link ? ' — ' + r.link : '') })));
          }
          if ($(`[data-obr="${i}"]`, m)?.checked) (ia.obrigacoes || []).filter(o => o && o.obrigacao).forEach(o => saves.obrigacoes.push({ empresaId: e.id, contrato: c.codigo, clausula: o.clausula || '', grupo: o.grupo || '', obrigacao: o.obrigacao, frequencia: o.frequencia || '', responsavel: o.responsavel || 'Contratada', evidencia: r.nome, status: 'Não verificado', origem: 'ia' }));
        }
        const docAnt = empRecs('documentos', e.id).find(d => norm(String(d.arquivo || '').replace(/\(\d+\)/g, '')) === norm(r.nome.replace(/\(\d+\)/g, '')));
        saves.documentos.push(Object.assign(docAnt ? clone(docAnt) : { empresaId: e.id }, { contrato: c?.codigo || docAnt?.contrato || '', tomador: c?.tomador || ia.tomador || '', tipo: ia.tipo || (/aditivo/i.test(r.nome) ? 'Termo aditivo' : 'Documento'), numero: ia.numeroContrato || docAnt?.numero || '', arquivo: r.nome, link: r.link || docAnt?.link || '', caminho: r.path, paginas: ia.paginas || docAnt?.paginas || null, pecas: (ia.pecas || []).filter(x => x && x.tipo).length ? ia.pecas.filter(x => x && x.tipo) : (docAnt?.pecas || []), legibilidade: r.ia ? 'Lido por IA (' + (ia.legibilidade || 'ok') + ')' : (docAnt?.legibilidade || 'Não lido'), limitacao: r.ia ? 'Dados extraídos por IA — conferir no documento' : (docAnt?.limitacao || '') }));
      });
      const uniq = {}; saves.contratos.forEach(c => uniq[c.id] = c); saves.contratos = Object.values(uniq);
      const rmBy = {}; remover.forEach(([coll, id]) => (rmBy[coll] = rmBy[coll] || []).push(id));
      for (const [coll, ids] of Object.entries(rmBy)) await DB.remove(coll, ids);
      for (const [coll, list] of Object.entries(saves)) if (list.length) await DB.save(coll, list);
      UI.closeModal();
      UI.toast(`Aplicado: ${saves.contratos.length} contrato(s), ${saves.documentos.length} documento(s), ${saves.maoDeObra.length} posto(s), ${saves.obrigacoes.length} obrigação(ões), ${saves.achados.length} achado(s).`, 'ok', 7000);
      App.render();
    };
  }
};
