/* =====================================================================
   DJEN — Diário de Justiça Eletrônico Nacional (API pública do CNJ)
   Com o cadastro dos advogados do escritório (nome, OAB, UF), o app
   consulta uma vez por dia as intimações publicadas em nome deles:
   • lança cada intimação no processo já cadastrado;
   • lista os processos ainda não cadastrados para você cadastrar
     (com os andamentos do DataJud) ou ignorar.
   A consulta sai do navegador (Brasil); se não der, tenta pelo servidor.
   ===================================================================== */
const DJEN = {
  API: 'https://comunicaapi.pje.jus.br/api/v1/comunicacao',
  rodando: false,
  /** "1. HAPVIDA ASSISTENCIA MEDICA S.A. (AGRAVANTE)" → nome "HAPVIDA ASSISTENCIA MEDICA S.A.", papel "Agravante" */
  limparNome: n => String(n || '').replace(/^\s*\d+\s*[.)-]\s*/, '').replace(/\s*\(([^()]{3,40})\)\s*$/, '').trim(),
  papelDe: n => { const m = String(n || '').match(/\(([^()]{3,40})\)\s*$/); return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : ''; },
  ehAdvDoEscritorio: nome => (escritorio().advogados || []).some(a => a.nome && norm(a.nome) === norm(nome)),
  estado() { return DB.get('config', 'djen') || { id: 'djen', pendentes: [], ignorados: [] }; },
  pendentes() { const existe = new Set(DB.all('processos').map(p => onlyDigits(p.numero))); return (DJEN.estado().pendentes || []).filter(q => !existe.has(q.numero)); },
  advogados() { return (escritorio().advogados || []).filter(a => a.ativo !== false && onlyDigits(a.oab) && a.uf).map(a => ({ ...a })); },
  titulo: n => String(n || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, w => w.toLowerCase()),
  dataISO(d) { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); },
  limpar: t => String(t || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim(),
  /** aceita variações de nomes de campos da API */
  norm(it) {
    const g = (...ks) => { for (const k of ks) if (it[k] !== undefined && it[k] !== null && it[k] !== '') return it[k]; return ''; };
    const num = onlyDigits(g('numero_processo', 'numeroProcesso', 'numeroprocessocommascara', 'numero_processo_com_mascara'));
    const dest = (it.destinatarios || []).map(d => ({ nome: DJEN.limparNome(d.nome), papel: DJEN.papelDe(d.nome), polo: d.polo === 'A' ? 'Ativo' : d.polo === 'P' ? 'Passivo' : d.polo === 'T' ? 'Terceiro' : (d.polo || '') }));
    const advs = (it.destinatarioadvogados || it.destinatarioAdvogados || []).map(d => { const a = d.advogado || d; return { nome: a.nome || '', oab: onlyDigits(a.numero_oab || a.numeroOab || ''), uf: a.uf_oab || a.ufOab || '' }; });
    return {
      id: String(g('id', 'hash')), hash: g('hash'), numero: num.length === 20 ? num : '', data: parseDate(g('data_disponibilizacao', 'datadisponibilizacao', 'dataDisponibilizacao')) || '',
      tribunal: g('siglaTribunal', 'sigla_tribunal'), orgao: g('nomeOrgao', 'nome_orgao'), classe: g('nomeClasse', 'nome_classe'),
      tipo: g('tipoComunicacao', 'tipo_comunicacao') || 'Intimação', tipoDoc: g('tipoDocumento', 'tipo_documento'), texto: DJEN.limpar(g('texto')), link: g('link'), destinatarios: dest, advogados: advs
    };
  },
  /** uma página da API. O DJEN limita ~20 consultas/min (429) e responde 500 ("sistema muito ocupado")
   *  quando a página contém certos registros defeituosos — aí a página é lida em blocos menores. */
  async pagina(params, progresso) {
    const qs = new URLSearchParams(params).toString();
    for (let t = 0; ; t++) {
      let r;
      try { r = await fetch(DJEN.API + '?' + qs, { headers: { Accept: 'application/json' }, cache: 'no-store' }); }
      catch (e) {
        // falha de rede/CORS no navegador: reserva pelo servidor
        if (!Session.remote) throw new Error('não consegui acessar o DJEN (' + e.message + ')');
        return await apiT('djen', { params }, 120000);
      }
      if (r.ok) return await r.json();
      if (r.status === 429 && t < 3) { progresso && progresso('limite de consultas por minuto do DJEN — aguardando…'); await sleep(20000); continue; }
      if (r.status >= 500 && t < 1) { await sleep(4000); continue; }
      const e = new Error(r.status === 429 ? 'o DJEN limitou as consultas por agora' : r.status >= 500 ? 'o DJEN está instável agora' : 'o DJEN respondeu ' + r.status);
      e.status = r.status; throw e;
    }
  },
  /** intimações de um advogado, da mais nova para a mais antiga, até a data "de" (sem "de": todo o histórico) */
  async buscar(adv, de, progresso) {
    const out = [], nome = adv.nome || 'OAB ' + adv.oab + '/' + String(adv.uf).toUpperCase();
    const base = { numeroOab: onlyDigits(adv.oab), ufOab: String(adv.uf).toUpperCase() };
    let falhas = 0, seguidas = 0;
    for (let pag = 1; pag <= 60; pag++) {
      progresso && progresso(`${nome}: página ${pag}${out.length ? ` · ${out.length} intimações` : ''}…`);
      let itens = [], fim = false;
      try {
        const j = await DJEN.pagina({ ...base, itensPorPagina: 100, pagina: pag }, progresso);
        itens = (j.items || j.itens || j.content || []).map(DJEN.norm); fim = itens.length < 100; seguidas = 0;
      } catch (e) {
        if (!(e.status >= 500)) throw e;
        // página com registro defeituoso: lê em blocos de 5 e pula só o bloco que falhar
        let ruins = 0;
        for (let k = 20 * (pag - 1) + 1; k <= 20 * pag; k++) {
          progresso && progresso(`${nome}: página ${pag} em partes (${k - 20 * (pag - 1)}/20)…`);
          await sleep(3200);
          try {
            const j = await DJEN.pagina({ ...base, itensPorPagina: 5, pagina: k }, progresso);
            const l = (j.items || j.itens || j.content || []).map(DJEN.norm); itens.push(...l);
            if (l.length < 5) { fim = true; break; }
          } catch (e2) { if (!(e2.status >= 500)) throw e2; ruins++; }
        }
        falhas += ruins;
        if (ruins === 20) { if (++seguidas >= 2) throw new Error('o DJEN está instável agora'); } else seguidas = 0;
      }
      const dentro = de ? itens.filter(x => !x.data || x.data >= de) : itens;
      out.push(...dentro.map(x => ({ ...x, advogadoBusca: adv.nome || adv.oab })));
      if (fim || (de && dentro.length < itens.length)) break;
      await sleep(3200); // a API aceita ~20 consultas por minuto
    }
    out.falhas = falhas;
    return out;
  },
  areaPorTribunal(numero, classe) {
    const p = cnjParts(numero), c = norm(classe);
    if (p?.j === '5') return 'trabalhista';
    if (/penal|crime|criminal|habeas|inquerito|denuncia|queixa|execucao da pena|termo circunstanciado/.test(c)) return 'penal';
    if (/previd|inss|beneficio|aposentadoria|auxilio/.test(c)) return 'previdenciario';
    if (/mandado de seguranca|improbidade|execucao fiscal|acao popular|servidor/.test(c)) return 'administrativo';
    if (p?.j === '4' && /previd|beneficio/.test(c)) return 'previdenciario';
    return 'civil';
  },
  /**
   * Sincroniza: lança intimações nos processos cadastrados e atualiza a lista
   * de processos encontrados ainda não cadastrados. manual=true ignora o "já rodou hoje".
   */
  async sincronizar({ manual = false, progresso } = {}) {
    if (DJEN.rodando) return null;
    const advs = DJEN.advogados(); if (!advs.length) { if (manual) UI.toast('Cadastre os advogados do escritório (Gestão do App › Sistema).', 'warn'); return null; }
    const st = DJEN.estado(), hoje = todayISO();
    if (!manual && st.ultima === hoje) return null;
    DJEN.rodando = true; DJEN.badge();
    try {
      const de = st.ultima ? DJEN.dataISO(new Date(new Date(st.ultima + 'T12:00:00').getTime() - 2 * 864e5)) : DJEN.dataISO(Date.now() - (manual ? 365 : 90) * 864e5);
      let itens = [], falhas = 0;
      const refazer = !st.textosCompletos && (DB.all('movimentos').some(m => m.origem === 'djen' && (m.descricao || '').length >= 5990) || (st.pendentes || []).some(q => q.intimacoes.some(i => (i.texto || '').length >= 5990)));
      for (const a of advs) {
        // advogado recém-cadastrado: todo o histórico disponível no DJEN; depois, só o que é novo
        // 1ª consulta do advogado (ou textos antigos cortados em 6 mil caracteres): todo o histórico; depois, só o novo
        const res = await DJEN.buscar(a, a.consultado && !refazer ? de : null, progresso);
        itens.push(...res); falhas += res.falhas || 0;
        if (!a.nome) { const n = res.flatMap(x => x.advogados).find(x => onlyDigits(x.oab) === onlyDigits(a.oab) && x.nome); if (n) a.nome = DJEN.titulo(n.nome); }
        a.consultado = hoje;
      }
      { const lista = (escritorio().advogados || []).map(x => { const a = advs.find(y => y.id === x.id); return a ? { ...x, nome: x.nome || a.nome || '', consultado: a.consultado } : x; }); await DB.save('config', { ...escritorio(), id: 'escritorio', advogados: lista }); }
      const vistos = new Set(); itens = itens.filter(x => x.numero && x.id && !vistos.has(x.id) && vistos.add(x.id));
      const procs = DB.all('processos'), porNum = {}; procs.forEach(p => porNum[onlyDigits(p.numero)] = p);
      const movPorChave = {}; DB.all('movimentos').filter(m => m.chave).forEach(m => movPorChave[m.chave] = m); const temMov = new Set(Object.keys(movPorChave)), corrigidos = [];
      const novasMov = [], porProc = {}, pend = {}; (st.pendentes || []).forEach(x => pend[x.numero] = x);
      const ign = new Set(st.ignorados || []);
      for (const x of itens) {
        const p = porNum[x.numero];
        if (p) {
          (porProc[p.id] = porProc[p.id] || []).push({ dest: x.destinatarios, advs: x.advogados });
          const chave = 'djen:' + x.id;
          if (temMov.has(chave)) { const mv = movPorChave[chave]; if (mv && (mv.descricao || '').length >= 5990 && x.texto.length > (mv.descricao || '').length) corrigidos.push({ ...mv, descricao: x.texto.slice(0, DJEN.MAXTXT) }); continue; }
          temMov.add(chave);
          novasMov.push({ processoId: p.id, data: x.data, titulo: `${x.tipo}${x.tipoDoc ? ' — ' + x.tipoDoc : ''} (DJEN)`, descricao: x.texto.slice(0, DJEN.MAXTXT), origem: 'djen', chave, visivelCliente: false, link: x.link || '' });
        } else if (!ign.has(x.numero)) {
          const q = pend[x.numero] = pend[x.numero] || { numero: x.numero, tribunal: x.tribunal, orgao: x.orgao, classe: x.classe, partes: [], intimacoes: [], advogado: x.advogadoBusca };
          const ja = q.intimacoes.find(i => i.id === x.id); if (ja && (ja.texto || '').length < x.texto.length) ja.texto = x.texto.slice(0, DJEN.MAXTXT);
          if (!ja) q.intimacoes.push({ id: x.id, data: x.data, tipo: x.tipo, tipoDoc: x.tipoDoc, texto: x.texto.slice(0, DJEN.MAXTXT), link: x.link, dest: x.destinatarios, advs: x.advogados });
          x.destinatarios.forEach(d => { if (d.nome && !q.partes.some(pp => norm(pp.nome) === norm(d.nome))) q.partes.push(d); });
          q.ultima = [q.ultima, x.data].filter(Boolean).sort().pop();
          if (!q.orgao && x.orgao) q.orgao = x.orgao; if (!q.classe && x.classe) q.classe = x.classe;
        }
      }
      if (novasMov.length) await DB.save('movimentos', novasMov);
      if (corrigidos.length) await DB.save('movimentos', corrigidos); // textos que antes ficavam cortados em 6 mil caracteres
      // partes e advogados dos processos já cadastrados; cliente automático se ainda não houver
      const procAt = [];
      for (const [pid, ints] of Object.entries(porProc)) { const p = DB.get('processos', pid); if (p && await DJEN.aplicarPartes(p, ints)) procAt.push(p); }
      if (procAt.length) await DB.save('processos', procAt);
      const pendentes = Object.values(pend).filter(q => !porNum[q.numero]).sort((a, b) => String(b.ultima).localeCompare(String(a.ultima)));
      const r = { falhas, intimacoes: itens.length, novasMov: novasMov.length, processosNovos: pendentes.length - (st.pendentes || []).filter(q => !porNum[q.numero]).length };
      await DB.save('config', { ...st, id: 'djen', ultima: hoje, ultimaExec: new Date().toISOString(), por: Session.user.email, pendentes, erro: '', resumo: r, textosCompletos: true });
      if (novasMov.length || r.processosNovos > 0) UI.toast(`DJEN: ${novasMov.length} intimação(ões) nova(s) lançada(s)${r.processosNovos > 0 ? ` · ${r.processosNovos} processo(s) novo(s) encontrado(s) pela OAB` : ''}.`, 'ok', 8000);
      else if (manual) UI.toast(`DJEN consultado: ${itens.length} intimação(ões) no período, nada novo.`);
      return r;
    } catch (e) {
      await DB.save('config', { ...st, id: 'djen', ultimaExec: new Date().toISOString(), erro: e.message });
      if (manual) UI.toast('DJEN: ' + e.message, 'bad', 8000);
      return null;
    } finally { DJEN.rodando = false; DJEN.badge(); if (manual || !$('#modal')) App.render(true); }
  },
  /** roda sozinho uma vez por dia (o primeiro da equipe que abrir o app) */
  auto() {
    if (!Session.isStaff) return;
    setTimeout(() => DJEN.manutencao(), 5000);
    if (DJEN.advogados().length && (DJEN.estado().ultima !== todayISO() || !DJEN.estado().textosCompletos)) setTimeout(() => DJEN.sincronizar(), 8000);
  },
  MAXTXT: 30000,
  /** nome do advogado a partir do que ficou gravado (nome ou só o nº da OAB) */
  nomeAdv(v) { if (!/^\d+$/.test(String(v || '').trim())) return v || ''; const a = (escritorio().advogados || []).find(x => onlyDigits(x.oab) === String(v).trim()); return a?.nome || v; },
  /** junta processos duplicados (mesmo número) e corrige o responsável gravado só com a OAB */
  async manutencao() {
    if (DJEN._mant) return; DJEN._mant = true;
    try {
      const grupos = {}; DB.all('processos').forEach(p => { const n = onlyDigits(p.numero); if (n.length === 20) (grupos[n] = grupos[n] || []).push(p); });
      const salvarP = [], salvarM = [], removerM = [], removerP = [], salvarZ = [], removerZ = [];
      for (const l of Object.values(grupos)) {
        if (l.length < 2) continue;
        const peso = p => (p.clienteIds || []).length * 100 + (p.arquivos || []).length * 10 + Object.values(p).filter(v => v !== '' && v != null).length;
        l.sort((a, b) => peso(b) - peso(a) || String(a.criadoEm || a.atualizadoEm || '').localeCompare(String(b.criadoEm || b.atualizadoEm || '')));
        const [fica, ...sai] = l;
        for (const o of sai) {
          Object.keys(o).forEach(k => { if (['id', 'criadoEm', 'atualizadoEm', 'por'].includes(k)) return; const v = fica[k]; if ((v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) && o[k] != null && o[k] !== '') fica[k] = o[k]; });
          if ((o.partes || []).length) fica.partes = DJEN.fundirPartes(fica.partes, o.partes);
          if ((o.arquivos || []).length) fica.arquivos = [...(fica.arquivos || []), ...o.arquivos.filter(a => !(fica.arquivos || []).some(b => b.nome === a.nome))];
          const minhas = DB.where('movimentos', m => m.processoId === fica.id), chave = m => m.chave || (m.data + '|' + norm(m.titulo));
          const tem = new Set(minhas.map(chave));
          DB.where('movimentos', m => m.processoId === o.id).forEach(m => { if (tem.has(chave(m))) removerM.push(m.id); else { tem.add(chave(m)); salvarM.push({ ...m, processoId: fica.id }); } });
          DB.where('prazos', z => z.processoId === o.id).forEach(z => { const dup = DB.where('prazos', y => y.processoId === fica.id && y.data === z.data && norm(y.descricao) === norm(z.descricao)).length; if (dup) removerZ.push(z.id); else salvarZ.push({ ...z, processoId: fica.id }); });
          removerP.push(o.id);
        }
        salvarP.push(fica);
      }
      DB.all('processos').forEach(p => {
        if (removerP.includes(p.id)) return;
        let mudou = false; const n = DJEN.nomeAdv(p.responsavel); if (n !== (p.responsavel || '')) { p.responsavel = n; mudou = true; }
        if ((p.partes || []).length) {
          const limpas = p.partes.filter(x => !DJEN.ehAdvDoEscritorio(DJEN.limparNome(x.nome))).map(x => ({ ...x, papel: x.papel || DJEN.papelDe(x.nome), nome: DJEN.limparNome(x.nome) }));
          if (JSON.stringify(limpas) !== JSON.stringify(p.partes)) { p.partes = limpas; mudou = true; }
          const lc = (p.parteContraria || '').split(/;\s*/).filter(n => n && !DJEN.ehAdvDoEscritorio(DJEN.limparNome(n))).map(DJEN.limparNome).join('; ');
          if (lc !== (p.parteContraria || '')) { p.parteContraria = lc; mudou = true; }
        }
        const pc = (p.partes || []).find(x => x.cliente);
        if (pc && pc.polo) {
          if (!p.polo) { p.polo = DJEN.poloCliente(pc.polo, p.area); mudou = true; }
          if (!p.parteContraria) { const pcs = p.partes.filter(x => x.polo && x.polo !== pc.polo && x.polo !== 'Terceiro').map(x => x.nome).join('; '); if (pcs) { p.parteContraria = pcs; mudou = true; } }
        }
        if (mudou && !salvarP.includes(p)) salvarP.push(p);
      });
      if (salvarM.length) await DB.save('movimentos', salvarM);
      if (removerM.length) await DB.remove('movimentos', removerM);
      if (salvarZ.length) await DB.save('prazos', salvarZ);
      if (removerZ.length) await DB.remove('prazos', removerZ);
      if (salvarP.length) await DB.save('processos', salvarP);
      if (removerP.length) { await DB.remove('processos', removerP); UI.toast(`${removerP.length} processo(s) duplicado(s) foram unificados.`, 'ok', 6000); App.render(true); }
    } finally { DJEN._mant = false; }
  },
  /**
   * Parte dispositiva de uma decisão publicada: o trecho a partir de "Ante o exposto", "Isto posto",
   * "Dispositivo", "Acordam"… até o fim. Textos curtos voltam inteiros.
   */
  dispositivo(t) {
    t = String(t || '').trim();
    if (t.length <= 1400) return { texto: t, resumido: false };
    const fortes = /(ante o exposto|diante do exposto|pelo exposto|por todo o exposto|em face do exposto|face ao exposto|do exposto|ante o acima|diante do acima|isto posto|isso posto|posto isso|posto isto|em raz[aã]o do exposto|por essas raz[oõ]es|por estas raz[oõ]es|com essas considera[cç][oõ]es|com estas considera[cç][oõ]es|pelos fundamentos expostos|\bac[oó]rd[aã]m\b|\bacorda[m]?\s+(os|a|o)\b)/gi;
    const fracos = /(\bdecido\b|\bdecide-se\b|\bresolvo\b|\bdetermino\b|\bdefiro\b|\bindefiro\b|\bjulgo\b|\bhomologo\b|\bconcedo\b|\bnego\b|\bdou provimento\b|\bnego provimento\b|\bconhe[cç]o\b)/gi;
    const ultimo = re => { let m, pos = -1; re.lastIndex = 0; while ((m = re.exec(t))) pos = m.index; return pos; };
    let pos = Math.max(ultimo(fortes), ultimo(/\bDISPOSITIVO\b/g)); // título da seção, em maiúsculas
    if (pos < t.length * 0.25) { const f = ultimo(fracos); if (f > pos) pos = f; }
    if (pos < 0) return { texto: '… ' + t.slice(-1000).replace(/^\S*\s/, ''), resumido: true };
    let d = t.slice(pos);
    if (d.length > 3500) d = d.slice(0, 3500).replace(/\s\S*$/, '') + ' …';
    return { texto: d, resumido: true };
  },
  ehDecisao: titulo => /senten|decis|ac[oó]rd[aã]o|monocr|voto|julgamento/i.test(titulo || ''), // despachos ficam inteiros
  badge() { $$('[data-djen-st]').forEach(el => el.innerHTML = DJEN.rodando ? `${icon('sync', 'spin')} consultando o DJEN…` : DJEN.status()); },
  status() { const s = DJEN.estado(); return s.ultimaExec ? `última consulta ${fmtDateTime(s.ultimaExec)}${!s.erro && s.resumo?.falhas ? ` · <span class="muted">${s.resumo.falhas} bloco(s) com defeito no próprio DJEN foram pulados</span>` : ''}${s.erro ? ` · <span class="t-bad">${esc(s.erro)}</span>` : ''}` : 'ainda não consultado'; },

  /* ---------- cartão do painel / judicial ---------- */
  cardHtml() {
    if (!DJEN.advogados().length) return Session.isAdmin ? `<section class="card djen-card"><header><h2>${icon('mail')} Intimações pela OAB (DJEN)</h2></header><p class="muted small">Cadastre os advogados do escritório em <a href="#/gestao/sistema">Gestão do App › Sistema</a> e o app passa a buscar sozinho, todo dia, as intimações e os processos em que eles atuam.</p></section>` : '';
    const s = DJEN.estado(), existe = new Set(DB.all('processos').map(p => onlyDigits(p.numero))), pend = (s.pendentes || []).filter(q => !existe.has(q.numero));
    const recentes = DB.where('movimentos', m => m.origem === 'djen').sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 5);
    return `<section class="card djen-card"><header><h2>${icon('mail')} Intimações pela OAB (DJEN)</h2><span class="muted small" data-djen-st>${DJEN.rodando ? icon('sync', 'spin') + ' consultando…' : DJEN.status()}</span></header>
      ${pend.length ? `<div class="notice">${icon('alert')}<div><b>${pend.length} processo(s) com intimação em nome dos advogados do escritório ainda não estão cadastrados.</b><div class="btn-row" style="margin-top:8px"><button class="btn primary sm" id="djPend">${icon('list')} Revisar e cadastrar</button></div></div></div>` : ''}
      ${recentes.length ? `<ul class="feed">${recentes.map(m => { const p = DB.get('processos', m.processoId); return `<li><a href="#/processo/${m.processoId}"><time>${fmtDate(m.data)}</time><div><b>${esc(m.titulo)}</b><small>${esc(p ? fmtCNJ(p.numero) + ' · ' + (clienteNomes(p) || p.classe || '') : '')}</small></div></a></li>`; }).join('')}</ul>` : '<p class="muted small">Nenhuma intimação lançada ainda.</p>'}
      <div class="right btn-row">${DJEN.cadastrados().length ? `<button class="btn ghost sm" id="djDesf">${icon('list')} Processos cadastrados pela OAB (${DJEN.cadastrados().length})</button>` : ''}<button class="btn ghost sm" id="djAgora">${icon('sync')} Consultar agora</button></div></section>`;
  },
  bindCard(root) {
    $('#djPend', root)?.addEventListener('click', () => DJEN.revisarPendentes());
    $('#djAgora', root)?.addEventListener('click', () => DJEN.sincronizar({ manual: true }));
    $('#djDesf', root)?.addEventListener('click', () => DJEN.gerenciarCadastrados());
  },
  /* ---------- partes, advogados e cliente ---------- */
  PJ: /\b(ltda|s\.?\s?\/?a\.?|eireli|\bme\b|epp|cia|companhia|banco|instituto|associa[cç][aã]o|cooperativa|funda[cç][aã]o|sindicato|munic[ií]pio|estado d|uni[aã]o|inss|caixa econ|empresa|com[eé]rcio|servi[cç]os|engenharia|construtora|ind[uú]stria|condom[ií]nio|igreja|partido|minist[eé]rio|secretaria|prefeitura|c[aâ]mara)\b/i,
  intsDe(q) { return (q.intimacoes || []).some(i => i.dest) ? q.intimacoes : [{ dest: q.partes || [], advs: [] }]; },
  meuAdv(a) { return DJEN.advogados().some(x => onlyDigits(x.oab) === onlyDigits(a.oab) && String(x.uf).toUpperCase() === String(a.uf || '').toUpperCase()) || DJEN.advogados().some(x => a.nome && norm(x.nome) === norm(a.nome)); },
  /** lê as intimações: partes por polo, advogados de cada polo e votos de lado (intimações que só intimam um polo) */
  analisar(ints) {
    const partes = [], votos = { Ativo: 0, Passivo: 0 };
    const achar = nome => partes.find(p => norm(p.nome) === norm(nome));
    for (const i of ints) {
      const dest = (i.dest || []).filter(d => d.nome);
      dest.forEach(d => { const p = achar(d.nome); if (!p) partes.push({ nome: d.nome, polo: d.polo || '', papel: d.papel || '', advogados: [] }); else if (!p.polo && d.polo) p.polo = d.polo; });
      const polos = [...new Set(dest.map(d => d.polo || '?'))];
      if (polos.length !== 1 || !['Ativo', 'Passivo'].includes(polos[0])) continue;
      votos[polos[0]]++;
      dest.forEach(d => { const p = achar(d.nome); (i.advs || []).forEach(a => { if (a.nome && !p.advogados.some(x => norm(x.nome) === norm(a.nome))) p.advogados.push({ nome: a.nome, oab: a.oab || '', uf: a.uf || '', escritorio: DJEN.meuAdv(a) }); }); });
    }
    // os próprios advogados do escritório não são partes (ex.: execução de honorários aparece com o nome do advogado)
    const meus = new Set(DJEN.advogados().map(a => norm(a.nome)).filter(Boolean));
    return { partes: partes.filter(p => !meus.has(norm(p.nome))), votos };
  },
  clienteDe: pt => DB.all('clientes').find(c => norm(c.nome) === norm(pt.nome)) || null,
  /** sugestão de cliente: 1º parte que já é cliente cadastrado; 2º sinal forte das intimações (só um polo intimado, ≥2 vezes, nenhuma do outro) com uma única parte nesse polo */
  sugerir(partes, votos) {
    const k = partes.findIndex(p => DJEN.clienteDe(p)); if (k >= 0) return { i: k, por: 'já é cliente' };
    const forte = votos.Ativo >= 2 && !votos.Passivo ? 'Ativo' : votos.Passivo >= 2 && !votos.Ativo ? 'Passivo' : null;
    const l = forte ? partes.map((p, i) => [p, i]).filter(([p]) => p.polo === forte) : [];
    return l.length === 1 ? { i: l[0][1], por: 'sugestão pelas intimações' } : null;
  },
  /** seletor "quem é o cliente" na revisão */
  clienteSelect(q, i) {
    const { partes, votos } = DJEN.analisar(DJEN.intsDe(q)), sug = DJEN.sugerir(partes, votos);
    if (!partes.length) return '<small class="muted">sem partes na intimação</small>';
    return `<select class="input sm" data-djcli="${i}"><option value="">Definir depois</option>${partes.map((p, k) => `<option value="${esc(p.nome)}" ${sug?.i === k ? 'selected' : ''}>${esc(p.nome.length > 42 ? p.nome.slice(0, 40) + '…' : p.nome)}${p.polo ? ' (' + esc(p.polo.toLowerCase()) + ')' : ''}${DJEN.clienteDe(p) ? ' ✓' : ''}</option>`).join('')}</select>${sug ? `<br><small class="muted">${esc(sug.por)}</small>` : ''}`;
  },
  fundirPartes(atuais, novas) {
    const l = (atuais || []).map(p => ({ ...p, advogados: [...(p.advogados || [])] }));
    for (const n of novas) {
      let p = l.find(x => norm(x.nome) === norm(n.nome));
      if (!p) { l.push({ ...n, advogados: [...(n.advogados || [])] }); continue; }
      ['polo', 'papel', 'doc'].forEach(k => { if (!p[k] && n[k]) p[k] = n[k]; });
      if (n.cliente) p.cliente = true;
      (n.advogados || []).forEach(a => { if (!p.advogados.some(x => norm(x.nome) === norm(a.nome))) p.advogados.push(a); });
    }
    return l;
  },
  poloCliente(lado, area) { const trab = area === 'trabalhista'; return lado === 'Ativo' ? (trab ? 'Reclamante' : 'Autor') : lado === 'Passivo' ? (trab ? 'Reclamado' : 'Réu') : 'Terceiro interessado'; },
  /**
   * Grava as partes no processo. Cliente: escolha = nome da parte escolhida na revisão (cria o cliente se preciso);
   * sem escolha, só vincula se alguma parte JÁ for cliente cadastrado. Devolve true se mudou algo.
   */
  async aplicarPartes(p, ints, escolha) {
    const { partes } = DJEN.analisar(ints);
    if (!partes.length) return false;
    const antes = JSON.stringify([p.partes, p.clienteIds, p.parteContraria, p.polo]);
    p.partes = DJEN.fundirPartes(p.partes, partes);
    if (!(p.clienteIds || []).length) {
      let alvo = escolha ? p.partes.find(x => norm(x.nome) === norm(escolha)) : p.partes.find(x => DJEN.clienteDe(x));
      if (alvo) {
        let c = DJEN.clienteDe(alvo);
        if (!c) { c = { id: uid('cl'), tipo: DJEN.PJ.test(alvo.nome) ? 'Pessoa jurídica' : 'Pessoa física', nome: alvo.nome, obs: `Cadastrado pelo processo ${fmtCNJ(p.numero)} (intimação no DJEN). Completar CPF/CNPJ e contato.` }; await DB.save('clientes', c); }
        alvo.cliente = true; p.clienteIds = [c.id];
      }
    }
    const pc = p.partes.find(x => x.cliente);
    if (pc && pc.polo) {
      if (!p.polo) p.polo = DJEN.poloCliente(pc.polo, p.area);
      if (!p.parteContraria) p.parteContraria = p.partes.filter(x => x.polo && x.polo !== pc.polo && x.polo !== 'Terceiro').map(x => x.nome).join('; ');
    }
    return JSON.stringify([p.partes, p.clienteIds, p.parteContraria, p.polo]) !== antes;
  },
  /* ---------- processos encontrados pela OAB ---------- */
  revisarPendentes() {
    const st = DJEN.estado(), existe = new Set(DB.all('processos').map(p => onlyDigits(p.numero)));
    const pend = (st.pendentes || []).filter(q => !existe.has(q.numero));
    if (!pend.length) return UI.toast('Nenhum processo pendente.');
    const m = UI.modal({
      title: 'Processos encontrados pela OAB', sub: `${pend.length} processo(s) com intimação no DJEN em nome dos advogados do escritório`, wide: true,
      body: `<p class="muted small"><b>Marque só os processos que o escritório acompanha</b> (nenhum vem marcado; a caixa do cabeçalho marca todos). O app cria o processo com tribunal, vara, classe e as partes de cada polo, busca os andamentos no DataJud e lança as intimações. Na coluna “Cliente do escritório”, escolha qual parte é o cliente: partes que já são clientes vêm marcadas (✓); nas demais, o app sugere quando as intimações dão sinal claro. O cliente é vinculado ou criado na hora — e pode ficar para depois. Em “Representação”, diga se o processo é <b>próprio</b> ou <b>em parceria</b> (o app já indica quando um parceiro cadastrado é intimado junto); processos em parceria vão para a relação própria, abaixo dos processos do escritório.</p>
        <div class="table-wrap tw-fixa"><table class="dt"><thead><tr><th><input type="checkbox" id="djTodos" title="Marcar/desmarcar todos"></th><th>Processo</th><th>Tribunal / órgão</th><th>Classe</th><th>Partes</th><th>Cliente do escritório</th><th>Representação</th><th>Última intimação</th></tr></thead><tbody>
        ${pend.map((q, i) => `<tr><td><input type="checkbox" data-dj="${i}"></td><td class="mono">${esc(fmtCNJ(q.numero))}</td><td>${esc(q.tribunal || '')}<br><small class="muted">${esc(q.orgao || '')}</small></td><td>${esc(q.classe || '')}</td><td class="wrap"><small>${q.partes.slice(0, 4).map(p => esc(p.nome) + (p.polo ? ` <em class="muted">(${esc(p.polo)})</em>` : '')).join('<br>')}</small></td><td>${DJEN.clienteSelect(q, i)}</td><td>${Parceria.select(q, i)}</td><td>${esc(fmtDate(q.ultima))}<br><small class="muted">${q.intimacoes.length} intimação(ões)</small></td></tr>`).join('')}
        </tbody></table></div>`,
      foot: `<button class="btn ghost" id="djIgn">Ignorar marcados</button><span class="sp"></span><button class="btn ghost" data-close>Fechar</button><button class="btn primary" id="djCad">${icon('plus')} Cadastrar marcados</button>`
    });
    const marcados = () => $$('[data-dj]:checked', m).map(c => pend[+c.dataset.dj]);
    const conta = () => { const n = marcados().length; $('#djCad', m).innerHTML = `${icon('plus')} Cadastrar ${n} de ${pend.length}`; $('#djCad', m).disabled = !n; $('#djIgn', m).textContent = `Ignorar ${n} marcado(s)`; };
    $('#djTodos', m).onchange = ev => { $$('[data-dj]', m).forEach(c => c.checked = ev.target.checked); conta(); };
    $$('[data-dj]', m).forEach(c => c.onchange = conta); conta();
    $('#djIgn', m).onclick = async () => {
      const sel = marcados(); if (!sel.length) return;
      if (!await UI.confirm(`Ignorar ${sel.length} processo(s)? Eles não voltarão a aparecer nesta lista.`, 'Ignorar', false)) return;
      const nums = new Set(sel.map(q => q.numero));
      await DB.save('config', { ...st, pendentes: pend.filter(q => !nums.has(q.numero)), ignorados: [...new Set([...(st.ignorados || []), ...nums])] });
      UI.toast(`${sel.length} processo(s) ignorado(s).`); App.render(true);
    };
    $('#djCad', m).onclick = async () => {
      const sel = marcados(); if (!sel.length) return;
      if (DJEN.rodando) return UI.toast('Aguarde: a consulta ao DJEN está em andamento.', 'warn');
      const b = $('#djCad', m); b.disabled = true; DJEN.rodando = true;
      const vis = escritorio().djVisivel !== false; let n = 0, semCli = 0, jaTinha = 0;
      try {
      for (const q of sel) {
        b.innerHTML = `${icon('sync', 'spin')} Cadastrando ${++n} de ${sel.length}…`;
        if (DB.all('processos').some(x => onlyDigits(x.numero) === q.numero)) { jaTinha++; continue; } // nunca duplica
        const proc = { numero: q.numero, area: DJEN.areaPorTribunal(q.numero, q.classe), tribunal: q.tribunal || (tribunalAlias(q.numero) || '').toUpperCase(), orgao: q.orgao, classe: q.classe, status: 'Ativo', clienteIds: [], partes: [], responsavel: DJEN.nomeAdv(q.advogado), obs: 'Cadastrado pela consulta à OAB no DJEN.', origemCadastro: 'djen' };
        await DJEN.aplicarPartes(proc, DJEN.intsDe(q), $(`[data-djcli="${pend.indexOf(q)}"]`, m)?.value || '');
        await Parceria.aplicar(proc, $(`[data-djrep="${pend.indexOf(q)}"]`, m)?.value || '');
        if (!proc.clienteIds.length) { semCli++; proc.obs += ' Indicar o cliente.'; }
        const [p] = await DB.save('processos', proc);
        await DB.save('movimentos', q.intimacoes.map(i => ({ processoId: p.id, data: i.data, titulo: `${i.tipo}${i.tipoDoc ? ' — ' + i.tipoDoc : ''} (DJEN)`, descricao: i.texto, origem: 'djen', chave: 'djen:' + i.id, visivelCliente: false, link: i.link || '' })));
        if (Session.remote && validCNJ(q.numero)) { try { const r = await apiT('datajud', { numero: q.numero }, 90000); const novos = Judicial.mergeDatajud(p, r); await DB.save('processos', p); if (novos.length) await DB.save('movimentos', novos.map(x => ({ ...x, visivelCliente: vis }))); } catch { } }
      }
      } finally { DJEN.rodando = false; }
      const nums = new Set(sel.map(q => q.numero));
      await DB.save('config', { ...DJEN.estado(), pendentes: (DJEN.estado().pendentes || []).filter(q => !nums.has(q.numero)) });
      UI.closeModal(); UI.toast(`${sel.length - jaTinha} processo(s) cadastrado(s)${jaTinha ? ` · ${jaTinha} já existia(m) e não foi(ram) duplicado(s)` : ''}${semCli ? ` · ${semCli} ainda sem cliente (indique depois, no processo)` : ', com partes e cliente'}.`, 'ok', 8000);
      location.hash = '#/judicial/todos'; App.render();
    };
  },
  /** processos que entraram pela consulta à OAB */
  cadastrados() { return DB.all('processos').filter(p => p.origemCadastro === 'djen' || /^Cadastrado pela consulta à OAB/.test(p.obs || '')); },
  /** desfazer em lote: devolve à lista de revisão ou remove e ignora */
  gerenciarCadastrados() {
    const l = DJEN.cadastrados().sort((a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));
    if (!l.length) return UI.toast('Nenhum processo cadastrado pela OAB.');
    const m = UI.modal({
      title: 'Processos cadastrados pela OAB', sub: `${l.length} processo(s) entraram pela consulta ao DJEN`, wide: true,
      body: `<p class="muted small">Marque os que <b>não</b> devem ficar na relação do escritório. <b>Devolver para a revisão</b> tira o processo da relação e o põe de volta na lista “Revisar e cadastrar”; <b>Remover e ignorar</b> tira e não mostra mais nas consultas pela OAB. Movimentações e prazos desses processos também saem.</p>
        <div class="table-wrap"><table class="dt"><thead><tr><th><input type="checkbox" id="dcTodos"></th><th>Processo</th><th>Tribunal / órgão</th><th>Classe</th><th>Cliente</th><th>Movimentações</th></tr></thead><tbody>
        ${l.map((p, i) => `<tr><td><input type="checkbox" data-dc="${i}"></td><td class="mono">${esc(fmtCNJ(p.numero))}</td><td>${esc(p.tribunal || '')}<br><small class="muted">${esc(p.orgao || '')}</small></td><td>${esc(p.classe || '')}</td><td>${esc(clienteNomes(p) || '—')}</td><td>${DB.where('movimentos', x => x.processoId === p.id).length}</td></tr>`).join('')}
        </tbody></table></div>`,
      foot: `<button class="btn ghost danger-text" id="dcIgn" disabled>Remover e ignorar</button><span class="sp"></span><button class="btn ghost" data-close>Fechar</button><button class="btn primary" id="dcVolta" disabled>Devolver para a revisão</button>`
    });
    const sel = () => $$('[data-dc]:checked', m).map(c => l[+c.dataset.dc]);
    const conta = () => { const n = sel().length; $('#dcVolta', m).disabled = $('#dcIgn', m).disabled = !n; $('#dcVolta', m).textContent = `Devolver ${n} para a revisão`; $('#dcIgn', m).textContent = `Remover e ignorar ${n}`; };
    $('#dcTodos', m).onchange = ev => { $$('[data-dc]', m).forEach(c => c.checked = ev.target.checked); conta(); };
    $$('[data-dc]', m).forEach(c => c.onchange = conta); conta();
    const tirar = async (ignorar, ps) => {
      if (!ps.length) return;
      const st = DJEN.estado(), pend = [...(st.pendentes || [])], ign = new Set(st.ignorados || []);
      for (const p of ps) {
        const n = onlyDigits(p.numero), movs = DB.where('movimentos', x => x.processoId === p.id);
        if (ignorar) ign.add(n);
        else if (!pend.some(q => q.numero === n)) {
          const ints = movs.filter(x => x.origem === 'djen').map(x => ({ id: String(x.chave || '').replace('djen:', '') || x.id, data: x.data, tipo: (x.titulo || '').split(' — ')[0].replace(' (DJEN)', ''), tipoDoc: ((x.titulo || '').split(' — ')[1] || '').replace(' (DJEN)', ''), texto: x.descricao || '', link: x.link || '', dest: (p.partes || []).filter(y => y.polo).map(y => ({ nome: y.nome, polo: y.polo })), advs: [] }));
          pend.push({ numero: n, tribunal: p.tribunal, orgao: p.orgao, classe: p.classe, partes: (p.partes || []).map(y => ({ nome: y.nome, polo: y.polo })), intimacoes: ints, advogado: p.responsavel, ultima: ints.map(x => x.data).sort().pop() || '' });
        }
        if (movs.length) await DB.remove('movimentos', movs.map(x => x.id));
        const zs = DB.where('prazos', x => x.processoId === p.id); if (zs.length) await DB.remove('prazos', zs.map(x => x.id));
      }
      await DB.remove('processos', ps.map(p => p.id));
      await DB.save('config', { ...st, id: 'djen', pendentes: pend.filter(q => !ign.has(q.numero)), ignorados: [...ign] });
      UI.closeModal(); UI.toast(ignorar ? `${ps.length} processo(s) removido(s) e ignorado(s).` : `${ps.length} processo(s) devolvido(s) para a revisão.`, 'ok', 7000); App.render(true);
    };
    $('#dcVolta', m).onclick = () => tirar(false, sel());
    $('#dcIgn', m).onclick = async () => { const ps = sel(); if (await UI.confirm(`Remover ${ps.length} processo(s) da relação do escritório e não mostrar mais nas consultas pela OAB?`, 'Remover')) tirar(true, ps); };
  },
  /* ---------- cadastro dos advogados (Gestão do App › Sistema) ---------- */
  advHtml() {
    const lista = escritorio().advogados || [];
    return `<p class="muted small">Informe só o <b>número da OAB e a seccional</b>; o nome vem do próprio DJEN. O app consulta <b>uma vez por dia</b>, sozinho, as intimações publicadas no DJEN em nome destes advogados: lança as intimações nos processos e mostra os processos ainda não cadastrados.</p>
      ${lista.length ? `<div class="adv-list">${lista.map((a, i) => `<div class="adv-row"><span class="dot ${a.ativo !== false ? 'ok' : 'off'}"></span><div><b>${esc(a.nome || 'Nome aparece após a primeira consulta')}</b><small>OAB/${esc(String(a.uf || '').toUpperCase())} ${esc(a.oab)}</small></div><button class="btn ghost sm" data-advtg="${i}">${a.ativo !== false ? 'Pausar' : 'Ativar'}</button><button class="icon-btn sm" data-advrm="${i}" title="Remover">${icon('trash')}</button></div>`).join('')}</div>` : '<p class="muted small">Nenhum advogado cadastrado.</p>'}
      <form class="adv-form" id="advForm"><input name="oab" placeholder="Nº da OAB" inputmode="numeric"><select name="uf">${UF_TR.slice(1).map(u => u === 'dft' ? 'DF' : u.toUpperCase()).sort().map(u => `<option ${u === 'PB' ? 'selected' : ''}>${u}</option>`).join('')}</select><button class="btn primary sm">${icon('plus')} Adicionar</button></form>
      <div class="conn"><span class="dot ${DJEN.estado().erro ? 'off' : DJEN.estado().ultimaExec ? 'ok' : 'off'}"></span><div><b>Consulta diária ao DJEN</b><small data-djen-st>${DJEN.status()}</small></div><button class="btn ghost sm" id="advAgora">Consultar agora</button></div>`;
  },
  bindAdv(el) {
    const salvar = async lista => { await DB.save('config', { ...escritorio(), id: 'escritorio', advogados: lista }); Gestao.sistema(el); };
    $('#advForm', el)?.addEventListener('submit', ev => {
      ev.preventDefault(); const f = ev.target, oab = onlyDigits(f.oab.value);
      if (!oab) return UI.toast('Informe o número da OAB.', 'bad');
      const lista = [...(escritorio().advogados || [])];
      if (lista.some(a => onlyDigits(a.oab) === oab && String(a.uf).toUpperCase() === f.uf.value)) return UI.toast('Essa OAB já está cadastrada.', 'warn');
      lista.push({ id: uid('ad'), nome: '', oab, uf: f.uf.value, ativo: true });
      salvar(lista).then(() => { UI.toast(`OAB/${f.uf.value} ${oab} cadastrada. Buscando todas as intimações dele no DJEN — o nome vem de lá.`, 'ok', 7000); $('#advAgora', el)?.click(); });
    });
    $$('[data-advtg]', el).forEach(b => b.onclick = () => { const l = [...escritorio().advogados]; l[+b.dataset.advtg] = { ...l[+b.dataset.advtg], ativo: l[+b.dataset.advtg].ativo === false }; salvar(l); });
    $$('[data-advrm]', el).forEach(b => b.onclick = async () => { if (!await UI.confirm('Remover este advogado da consulta diária?', 'Remover')) return; const l = [...escritorio().advogados]; l.splice(+b.dataset.advrm, 1); salvar(l); });
    $('#advAgora', el)?.addEventListener('click', () => DJEN.sincronizar({ manual: true, progresso: t => $$('[data-djen-st]').forEach(x => x.innerHTML = icon('sync', 'spin') + ' ' + esc(t)) }));
  }
};
