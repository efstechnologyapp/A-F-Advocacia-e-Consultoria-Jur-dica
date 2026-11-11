/* =====================================================================
   CONSULTA DE CNPJ (dados públicos da Receita Federal via BrasilAPI)
   ===================================================================== */
const RFB = {
  async lookup(cnpj) {
    const d = onlyDigits(cnpj);
    if (!validCNPJ(d)) throw new Error('CNPJ inválido (confira os dígitos).');
    let j = null;
    try { const r = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + d); if (r.status === 404) throw new Error('CNPJ não encontrado na base da Receita.'); if (r.ok) j = RFB.deBrasilApi(await r.json()); } catch (e) { if (/não encontrado/.test(e.message)) throw e; }
    if (!j && Session.remote) { try { j = RFB.deBrasilApi(await api('cnpj', { cnpj: d })); } catch { } }
    if (!j) { try { const r = await fetch('https://open.cnpja.com/office/' + d); if (r.ok) j = RFB.deCnpja(await r.json()); } catch { } }
    if (!j) throw new Error('Consulta indisponível no momento. Tente de novo em instantes.');
    j.cnpj = d; return j;
  },
  cap: s => String(s || '').toLowerCase().replace(/(^|\s|\/|-)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, w => w.toLowerCase()).replace(/\b(Ltda|Me|Epp|Eireli|S\/a|Sa)\b/gi, w => w.toUpperCase()),
  deBrasilApi(o) {
    const end = [[o.descricao_tipo_de_logradouro, o.logradouro].filter(Boolean).join(' '), o.numero, o.complemento, o.bairro, [o.municipio, o.uf].filter(Boolean).join('/'), o.cep ? 'CEP ' + String(o.cep).replace(/(\d{5})(\d{3})/, '$1-$2') : ''].filter(x => x && String(x).trim()).join(', ');
    const tel = String(o.ddd_telefone_1 || '').replace(/\D/g, '');
    return {
      razao: o.razao_social || '', fantasia: o.nome_fantasia || '', segmento: [o.cnae_fiscal, o.cnae_fiscal_descricao].filter(Boolean).join(' — '),
      situacao: o.descricao_situacao_cadastral || '', abertura: parseDate(o.data_inicio_atividade), porte: o.porte || o.descricao_porte || '',
      capital: num(o.capital_social), endereco: RFB.cap(end).replace(/Cep /, 'CEP ').replace(/\/([a-z]{2})\b/gi, (m, u) => '/' + u.toUpperCase()), telefone: tel ? tel.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3') : '', email: (o.email || '').toLowerCase(),
      socios: (o.qsa || []).map(s => `${RFB.cap(s.nome_socio || s.nome)}${s.qualificacao_socio ? ' — ' + s.qualificacao_socio : ''}`).join('\n'), natureza: o.natureza_juridica || ''
    };
  },
  deCnpja(o) {
    const a = o.address || {};
    return {
      razao: o.company?.name || '', fantasia: o.alias || '', segmento: [o.mainActivity?.id, o.mainActivity?.text].filter(Boolean).join(' — '),
      situacao: o.status?.text || '', abertura: parseDate(o.founded), porte: o.company?.size?.text || '', capital: num(o.company?.equity),
      endereco: [a.street, a.number, a.details, a.district, [a.city, a.state].filter(Boolean).join('/'), a.zip ? 'CEP ' + a.zip : ''].filter(Boolean).join(', '),
      telefone: o.phones?.[0] ? `(${o.phones[0].area}) ${o.phones[0].number}` : '', email: o.emails?.[0]?.address || '',
      socios: (o.company?.members || []).map(m => `${m.person?.name}${m.role?.text ? ' — ' + m.role.text : ''}`).join('\n')
    };
  },
  siglaDe(razao) {
    const ws = norm(razao).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(w => w.length > 1 && !['de', 'da', 'do', 'das', 'dos', 'e', 'ltda', 'me', 'epp', 'sa', 'eireli', 'servicos', 'comercio'].includes(w));
    const first = ws[0] || 'CT';
    return (first.length <= 4 ? first : ws.slice(0, 3).map(w => w[0]).join('')).toUpperCase();
  },
  /** adiciona o botão "Buscar na Receita" ao formulário */
  attach(m, coll) {
    const fk = coll === 'empresas' ? 'cnpj' : 'doc';
    const inp = $('#f_' + fk, m); if (!inp) return;
    const fld = inp.closest('.fld');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost sm rfb-btn'; b.innerHTML = icon('search') + ' Buscar na Receita';
    fld.appendChild(b);
    const set = (k, v, force) => { const el = $('#f_' + k, m); if (!el || v === null || v === undefined || v === '') return; if (!force && el.value && !isGap(el.value)) return; el.value = k === 'abertura' ? (parseDate(v) || '') : k === 'capital' ? num(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : v; el.classList.add('filled'); };
    const run = async () => {
      if (coll === 'clientes' && onlyDigits(inp.value).length !== 14) return UI.toast('A consulta à Receita funciona para CNPJ (pessoa jurídica).', 'warn');
      b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Consultando…';
      try {
        const j = await RFB.lookup(inp.value); inp.value = fmtDoc(j.cnpj);
        if (coll === 'empresas') { ['razao', 'fantasia', 'segmento', 'situacao', 'abertura', 'porte', 'capital', 'endereco', 'telefone', 'email', 'socios'].forEach(k => set(k, j[k], true)); if (!$('#f_sigla', m).value) $('#f_sigla', m).value = RFB.siglaDe(j.fantasia || j.razao); }
        else { set('nome', j.razao, true); set('endereco', j.endereco); set('telefone', j.telefone); set('email', j.email); const t = $('#f_tipo', m); if (t) t.value = 'Pessoa jurídica'; }
        UI.toast(`Dados da Receita carregados${j.situacao ? ' · situação: ' + j.situacao : ''}.`, /ativa/i.test(j.situacao || 'ativa') ? 'ok' : 'warn', 5000);
      } catch (e) { UI.toast(e.message, 'bad', 5000); }
      finally { b.disabled = false; b.innerHTML = icon('search') + ' Buscar na Receita'; }
    };
    b.onclick = run;
    inp.addEventListener('input', () => { if (onlyDigits(inp.value).length === 14 && validCNPJ(inp.value) && !$(coll === 'empresas' ? '#f_razao' : '#f_nome', m).value) run(); });
  }
};
