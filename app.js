/* Amorim Firmo — Advocacia e Consultoria Jurídica · app.js (gerado a partir de src/) */
'use strict';
/* =====================================================================
   AMORIM FIRMO — Advocacia e Consultoria Jurídica
   Núcleo: configuração, utilidades, armazenamento e sincronização
   ===================================================================== */

/* A configuração do login fica no arquivo config.js (veja CONFIGURAR-LOGIN.md) */
const APP_VERSAO = '1.13.7';
const CONFIG = Object.assign({ GOOGLE_CLIENT_ID: '', APPS_SCRIPT_URL: '' }, window.CONFIG || {}, { VERSION: APP_VERSAO });
const VERSOES = [
  { numero: '1.13.7', data: '11/11/2026', itens: ['Visão geral: o quadro “Últimas movimentações” passou a ser o último da página.'] },
  { numero: '1.13.6', data: '11/11/2026', itens: ['Ficha do contrato: o quadro “postos contratados” mostra o salário-base × quantidade de cada posto e a linha “Total mensal” com o total de postos, de salários-base e do custo previsto.'] },
  { numero: '1.13.5', data: '11/11/2026', itens: ['Ficha do contrato: ao abrir um item (posto, linha mensal do DP, obrigação, achado, documento, custo superveniente) ou “Editar contrato”, a janela tem o botão “Voltar”, que retorna à ficha do contrato; salvar ou excluir também retornam à ficha.'] },
  { numero: '1.13.4', data: '11/11/2026', itens: ['Ficha do contrato: Mão de obra separada em dois quadros — “postos contratados” e “custo mês a mês (Departamento Pessoal)”, este com competência, postos contratados, empregados na folha, folha bruta, benefícios, férias, salários previstos e divergência, em ordem de mês. Corrigido: a coluna de custo apurado (folha bruta) não recebe mais, por engano, o valor dos benefícios nos meses em que o relatório da folha não traz o bruto — basta juntar de novo a planilha da folha para corrigir os meses já importados.'] },
  { numero: '1.13.3', data: '11/11/2026', itens: ['Juntada de várias planilhas: terminada a última conferência, a tela se encerra. Se você sair de uma conferência para outra janela (ex.: abrir um contrato) ou começar nova juntada, as conferências pendentes da juntada anterior não reaparecem depois.'] },
  { numero: '1.13.2', data: '11/11/2026', itens: ['Relatórios do DP juntados na mesma leva: cada planilha passa a aproveitar os vínculos departamento → contrato criados pela anterior (ex.: férias usa o nº de contrato lido no vale-transporte).'] },
  { numero: '1.13.1', data: '11/11/2026', itens: ['Relatórios do DP: o contrato de cada departamento também é identificado pelo nº do contrato que a própria planilha traz (ex.: tabela do consolidado do vale-transporte) e pelos nº guardados na importação da folha. Departamento com nº de contrato não cadastrado no app aparece com o nº indicado.'] },
  { numero: '1.13.0', data: '11/11/2026', itens: ['RELATÓRIOS DO DP: além da folha de pagamento, o app reconhece os relatórios de vale-alimentação, cesta básica, vale-transporte e férias. Os departamentos são ligados aos contratos pelos vínculos da folha. Em Mão de obra, a linha do DP de cada competência recebe Benefícios (VA + cesta + VT), Encargos/provisões (férias pagas), Benefícios comprovados? e divergência quando há empregados da folha sem vale-alimentação; a evidência detalha cada benefício. Em Obrigações, as de benefícios e de férias já cadastradas recebem o verificado, o valor realizado e o status. Os demais dados das planilhas são ignorados.'] },
  { numero: '1.12.2', data: '11/11/2026', itens: ['Ao juntar várias planilhas de uma vez, cada uma é tratada por vez (a conferência da folha do DP não é mais atropelada pelas seguintes) e as não reconhecidas aparecem num único aviso, com os nomes dos arquivos.'] },
  { numero: '1.12.1', data: '11/11/2026', itens: ['FOLHA DE PAGAMENTO (DP): ao juntar na empresa o “Relatório da Folha de Pagamento” do Departamento Pessoal, o app liga cada departamento ao contrato pelo nº (abas antigas, sem nº, pelo código do departamento) e preenche os campos que a auditoria já tem. Em Mão de obra, uma linha por competência com alocados na folha × postos contratados, folha bruta × custo previsto, CCT, divergências (postos vagos, saldo a pagar, pagamento após o 5º dia útil) e evidência. Em Obrigações, a execução com os postos recebe o verificado, a quantidade realizada e o status; o pagamento dos salários recebe previsto (líquido) × realizado (pago), desvios e status. Importar de novo atualiza sem duplicar.'] },
  { numero: '1.11.0', data: '11/11/2026', itens: ['CUSTOS SUPERVENIENTES por contrato: na ficha do contrato, “Juntar notas fiscais” (PDF com várias notas, mesmo escaneadas; fotos; XML da NF-e) com natureza do pedido (reembolso, reequilíbrio, repactuação), justificativa e situação (em análise, apresentado, deferido, pago)', 'A IA separa as notas do PDF e lê de cada uma só o essencial — número, data, emitente, valor total e a anotação à mão — e sugere o contrato pela anotação/local; uma tela de conferência permite marcar as notas e ajustar o contrato de cada uma', 'Conferências automáticas: duplicidade, mesmo emitente/data/valor, emissão fora da vigência, destinatário com CNPJ diferente da contratada, sem justificativa', 'Relatório de auditoria do contrato (papel timbrado): identificação, documentação, mão de obra, achados, obrigações, custos supervenientes com quantidade de documentos e valor total por natureza e situação, parecer e assinatura — e anexo com a cópia de cada nota (as páginas exatas)', 'Nova aba “Custos supervenientes” na empresa'] },
  { numero: '1.10.2', data: '11/11/2026', itens: ['PDF compilado (ex.: aditivo + contrato original + termo de referência + anexos no mesmo arquivo): a IA lista cada peça com as páginas, e na ficha do contrato o lápis ao lado do arquivo permite marcar o que ele contém', 'A legenda da documentação passa a reconhecer o contrato principal dentro do compilado e lembra de concluir o achado correspondente', 'Documento do inventário sem arquivo: botão para escolher o PDF e anexá-lo ao Drive ali mesmo', 'Peças marcadas no compilado contam como arquivo: o aditivo do inventário deixa de aparecer “sem arquivo” quando está dentro do PDF; e o achado do contrato-base pode ser concluído com um clique, com a evidência (arquivo e páginas) já escrita'] },
  { numero: '1.10.1', data: '11/11/2026', itens: ['Juntar documentos (empresas, processos e atendimentos): o arquivo é guardado no Drive primeiro e lido pela IA em seguida — se a IA demorar ou estiver ocupada, o arquivo não se perde e aparece o botão “Ler de novo com a IA”', 'A IA desiste com aviso claro antes de estourar o tempo (em vez de “o servidor demorou demais”)', 'Tabelas da consultoria (contratos, obrigações, mão de obra, achados…) sempre em ordem pelo código (JSP-001, JSP-002…); clicar no título da coluna continua reordenando', 'Ficha do contrato: botões para abrir no Drive o contrato, os aditivos e os demais arquivos juntados (ou “Juntar o contrato”, se ainda não houver), com uma legenda do que falta (ex.: “Falta o contrato principal — só há termo aditivo”)', 'Documento do inventário sem arquivo: botão para escolher o PDF e anexá-lo ao Drive ali mesmo, ficando disponível para abrir na ficha do contrato'] },
  { numero: '1.10.0', data: '10/11/2026', itens: ['Link de consulta para os clientes (…/#/consulta), para o Instagram, Linktree e WhatsApp: o cliente informa CPF/CNPJ, telefone ou e-mail do cadastro, recebe um código no e-mail cadastrado e vê só os próprios processos — sem precisar de conta Google nem de liberação manual', 'Link pronto para copiar em Gestão do App › Sistema', 'Celular: os botões do topo das telas quebram a linha em vez de passar da largura da tela (sem precisar arrastar para o lado)'] },
  { numero: '1.9.0', data: '10/11/2026', itens: ['Nova seção ATENDIMENTOS (Judicial › Atendimentos, ou “Novo atendimento” no cadastro do cliente): do primeiro contato ao ajuizamento, em 4 etapas', 'Contrato de honorários: modelo padrão completo (objeto, honorários fixos, de êxito ou mistos com valor por extenso, sucumbência, despesas, revogação, título executivo, LGPD, foro, assinaturas) gerado com a qualificação do cliente e do advogado, editável e impresso em papel timbrado', 'Relato e documentos: relato livre + documentos no Drive do escritório; a IA resume o que cada documento prova e organiza o caso (fatos em ordem, parte contrária, ação sugerida, competência, fundamentos, pedidos, documentos a pedir, perguntas ao cliente e riscos)', 'Petição inicial redigida pela IA com base nos fatos revisados, sem jurisprudência inventada (marca [INSERIR PRECEDENTE] e [COMPLETAR]); editor no app e impressão em papel timbrado', 'Registrar ajuizamento: informe o número e o processo é criado já vinculado ao cliente, com os documentos', 'Cadastro do cliente com nacionalidade, estado civil, profissão, RG e representante legal (para a qualificação)', 'Achados de auditoria: painel próprio (clique no cartão da Visão geral ou no menu) com o que cada achado significa — critério, causa, risco, contrato, valor e o que fazer — e ações para resolver: em andamento, responsável e prazo, concluir com evidência', 'Cabeçalhos com o nome curto do escritório (a legenda já diz “Advocacia e Consultoria Jurídica”) e OAB no formato “OAB/PB 33.255”', 'Botão Voltar também no celular'] },
  { numero: '1.8.2', data: '10/11/2026', itens: ['Corrigida a duplicação de processos: a lista de processos encontrados pela OAB passava do limite de 50 mil caracteres por célula da planilha e não era gravada no servidor — agora registros grandes são gravados em partes; o cadastro nunca cria um processo com número já existente; duplicados existentes são unificados sozinhos (movimentações, prazos, partes e arquivos)', 'Decisões, sentenças, acórdãos e despachos publicados mostram só a PARTE DISPOSITIVA; a íntegra fica em “ler inteiro teor” (também no portal do cliente)', 'Intimações com texto longo agora são guardadas inteiras (antes eram cortadas em 6 mil caracteres, perdendo o dispositivo) — a próxima consulta completa os textos antigos', 'Cartão Partes no topo do processo, antes das movimentações', 'Botão Voltar nas páginas de detalhe', 'Advogado responsável aparece com o nome (não só o nº da OAB)', 'Revisão dos processos encontrados pela OAB: nenhum vem marcado — você marca os que o escritório acompanha, e o botão mostra quantos serão cadastrados (“Cadastrar 3 de 34”)', 'Processos cadastrados pela OAB: lista para desfazer em lote — devolver para a revisão ou remover e ignorar', 'Dados do processo logo abaixo das Partes, antes das movimentações', 'Textos longos: botão “▲ recolher” depois de ler tudo', 'Valor das causas: o cartão mostra em quantos processos há valor e abre uma tela para informar os demais (DJEN e DataJud não trazem esse dado); “50.000” passa a ser lido como cinquenta mil', 'Partes: nomes limpos (sem “1.” e com o papel — agravante, agravado… — à parte) e sem os advogados do escritório listados como parte', 'Botão “é o cliente” em cada parte: troca o cliente do processo com um clique (acerta polo e parte contrária; o cliente criado por engano sai do cadastro) — e o cartão Partes passa a refletir o cliente escolhido em Editar', 'Impressão da relação de processos (ícone ao lado do filtro de situação): todos ou por área, respeitando filtro e busca — cabeçalho com brasão, dados do escritório, indicadores, agrupamento por área, paginação e aviso de sigilo; pronto para imprimir ou salvar em PDF', 'Cadastro de cliente: ao digitar um CNPJ válido, os dados da Receita entram sozinhos (razão social, endereço, telefone, e-mail)', 'E-mail do cliente direto na página do processo: informar/alterar, ligar o aviso automático de andamento e convidar para o portal'] },
  { numero: '1.8.1', data: '10/11/2026', itens: ['Cadastro de advogado só com o número da OAB e a seccional: o nome vem do próprio DJEN na primeira consulta', 'Ao cadastrar uma OAB, a busca começa na hora e traz todo o histórico de intimações do advogado no DJEN (depois, só as novas)', 'Consulta ao DJEN mais robusta: quando a API responde “sistema muito ocupado”, o app espera e tenta de novo, respeitando o limite de consultas por minuto', 'Consulta testada com a OAB real: a API do DJEN às vezes falha em páginas com registros defeituosos (“sistema muito ocupado”) — o app agora tenta de novo e, se preciso, lê a página em partes e pula só o trecho defeituoso', 'Cliente: vinculado sozinho quando uma parte já é cliente cadastrado; nos demais casos, a revisão mostra as partes de cada processo para escolher o cliente (com sugestão quando as intimações dão sinal claro) — testes com os processos reais mostraram que o lado do escritório não dá para deduzir com segurança só pelo DJEN'] },
  { numero: '1.8.0', data: '10/11/2026', itens: ['Partes em campos próprios: polo ativo e polo passivo, cada parte com seus advogados (OAB/UF) e o selo “escritório” nos advogados da casa', 'Cliente automático: a parte do lado em que atua o advogado do escritório vira o cliente — vinculada se já existir, criada se não existir', 'Na revisão dos processos encontrados pela OAB, a coluna “Cliente do escritório” mostra o lado detectado e permite corrigir', 'Processos já cadastrados sem cliente recebem partes e cliente a cada nova intimação'] },
  { numero: '1.7.0', data: '10/11/2026', itens: ['Cadastro dos advogados do escritório (nome, OAB, UF) em Gestão do App › Sistema', 'Consulta automática diária às intimações do DJEN (API pública do CNJ) em nome desses advogados: cada intimação é lançada no processo, com o texto publicado', 'Processos com intimação ainda não cadastrados aparecem para revisar e cadastrar com um clique (com os andamentos do DataJud) ou ignorar'] },
  { numero: '1.6.0', data: '10/11/2026', itens: ['A IA lê as PEÇAS PRINCIPAIS dos autos (inicial, contestação, réplica, saneador, audiência de instrução, alegações finais, sentença, recursos, contrarrazões, decisões monocráticas e acórdãos, cumprimento de sentença e impugnação, alvará, termo de compromisso/guarda e certidão de trânsito), identificadas pelo índice do PDF ou pelo rodapé do PJe', 'Cada peça principal vira movimentação com data e resumo do que pede ou decide', 'Trânsito em julgado da fase de conhecimento: detectado nos arquivos, no DataJud e na sincronização diária, com selo no processo e no portal do cliente'] },
  { numero: '1.5.0', data: '10/11/2026', itens: ['Leitura leve dos PDFs, igual ao app Meus Concursos: o arquivo completo vai para o Drive, mas a IA recebe só o texto das primeiras e últimas páginas (ou imagens leves, se o PDF for digitalizado) — gasta uma fração da cota do Gemini', 'Tempo-limite nas chamadas à IA: nenhum botão fica preso em “Testando…” ou “Processando…”'] },
  { numero: '1.4.1', data: '10/11/2026', itens: ['IA mais resistente à cota gratuita: se o modelo escolhido estourar o limite (comum com PDFs grandes), o app tenta automaticamente outros modelos do Gemini, cada um com cota própria', 'Botão “Ler de novo com a IA” na revisão do processo, sem precisar enviar o arquivo outra vez', 'Mensagem clara do motivo quando a IA não consegue ler'] },
  { numero: '1.4.0', data: '10/11/2026', itens: ['Cadastrar processos pelos arquivos: arraste petições, decisões, atas ou a cópia dos autos — a IA preenche o cadastro (número, partes, cliente, vara, classe, valor, fase), lança movimentações, audiências e prazos, e você confere antes de salvar', 'Arquivos guardados no Drive do escritório em Judicial (processos) › Área › Processo; a pasta acompanha a área se o processo for reclassificado', 'Vários processos de uma vez, separados pelo número CNJ', 'Cartão “Arquivos” e botão “Juntar arquivos” no processo'] },
  { numero: '1.3.1', data: '09/11/2026', itens: ['Escolha automática do modelo do Gemini, igual ao app Meus Concursos: usa o “flash” mais novo disponível para a chave, guarda por 7 dias e troca sozinho se o Google aposentar o modelo', 'Novas tentativas automáticas quando o Gemini está ocupado (limite por minuto)'] },
  { numero: '1.3.0', data: '09/11/2026', itens: ['Conexão com o escritório (como a repartição no Custódia Digital): o administrador conecta uma vez a conta Google do escritório e todos os usuários habilitados já entram conectados', 'Documentos juntados vão para o Google Drive da conta do escritório e a IA usa a chave do escritório — todo o código continua na conta da efstech', 'A equipe só começa a usar o app depois que o escritório estiver conectado'] },
  { numero: '1.2.0', data: '09/11/2026', itens: ['Cadastro de empresa pelo CNPJ com dados públicos da Receita Federal (razão social, atividade, situação, endereço, sócios)', 'Cadastro de empresa pelos documentos: a IA identifica a contratada nos contratos, o app consulta a Receita e cria a empresa já com os arquivos', 'Consulta de CNPJ também no cadastro de clientes pessoa jurídica'] },
  { numero: '1.1.0', data: '09/11/2026', itens: ['“Juntar documentos”: arraste a pasta com contratos, aditivos e planilha — o app guarda no Drive, lê os PDFs com IA (Gemini), liga cada arquivo ao contrato e sugere o preenchimento, com revisão antes de aplicar', 'Divergências entre cadastro e documento viram achados de auditoria', 'Postos e obrigações extraídos do contrato entram em Mão de obra e Obrigações', 'Configuração da chave do Gemini em Gestão do App › Sistema'] },
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
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // 50.000 = cinquenta mil
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
const COLLS = ['clientes', 'processos', 'movimentos', 'prazos', 'empresas', 'contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos', 'config', 'atendimentos', 'supervenientes'];
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
      else UI.toast(navigator.onLine && e.message && !/fetch|network|rede/i.test(e.message) ? 'O servidor recusou uma gravação: ' + e.message + ' — as alterações continuam guardadas neste aparelho.' : 'Sem conexão com o servidor — alterações guardadas e serão enviadas depois.', 'warn', 8000);
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
      F('nacionalidade', 'Nacionalidade', 'text', { hint: 'Para a qualificação no contrato e na inicial' }),
      F('estadoCivil', 'Estado civil', 'select', { opts: ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Separado(a)', 'Viúvo(a)'] }),
      F('profissao', 'Profissão', 'text'),
      F('rg', 'RG / órgão expedidor', 'text'),
      F('representante', 'Representante legal (pessoa jurídica ou incapaz)', 'text', { w: 'full' }),
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
      F('transito', 'Trânsito em julgado (fase de conhecimento)', 'date', { hint: 'Preenchido automaticamente pela certidão de trânsito nos arquivos ou pelo DataJud' }),
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
      F('cnpj', 'CNPJ', 'doc', { hint: 'Digite o CNPJ e clique em “Buscar na Receita” para preencher o resto' }),
      F('razao', 'Razão social', 'text', { req: 1 }),
      F('fantasia', 'Nome fantasia', 'text'),
      F('segmento', 'Atividade principal (CNAE)', 'text'),
      F('situacao', 'Situação cadastral (RFB)', 'text'),
      F('abertura', 'Data de abertura', 'date'),
      F('porte', 'Porte', 'text'),
      F('capital', 'Capital social (R$)', 'money'),
      F('endereco', 'Endereço', 'text', { w: 'full' }),
      F('socios', 'Quadro de sócios e administradores', 'long'),
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
  supervenientes: {
    titulo: 'Custos supervenientes', sheet: 'Custos supervenientes', singular: 'comprovante', fields: [
      F('contrato', 'ID contrato', 'contrato', { list: 1 }),
      F('dataEmissao', 'Data de emissão', 'date', { list: 1 }),
      F('tipoDoc', 'Tipo de documento', 'select', { opts: ['NF-e', 'NFS-e', 'Cupom fiscal', 'Recibo', 'Fatura', 'Boleto', 'Guia', 'Outro'], list: 1 }),
      F('numero', 'Número', 'text', { list: 1 }),
      F('emitente', 'Emitente (fornecedor)', 'text', { list: 1 }),
      F('cnpjEmitente', 'CNPJ do emitente', 'doc'),
      F('destinatario', 'Destinatário', 'text'),
      F('cnpjDestinatario', 'CNPJ do destinatário', 'doc'),
      F('anotacao', 'Anotação / local (escrito na nota)', 'text'),
      F('descricao', 'Descrição (opcional)', 'text', { w: 'full' }),
      F('valor', 'Valor (R$)', 'money', { list: 1 }),
      F('natureza', 'Natureza do pedido', 'select', { opts: ['Reembolso de despesa extraordinária', 'Reequilíbrio econômico-financeiro (fato imprevisível)', 'Repactuação / reajuste (CCT, insumos)', 'Outro'], list: 1 }),
      F('justificativa', 'Justificativa (por que o custo não estava previsto)', 'long', { w: 'full' }),
      F('status', 'Situação', 'select', { opts: ['Em análise', 'Apresentado à Administração', 'Deferido', 'Deferido parcialmente', 'Indeferido', 'Pago'], list: 1 }),
      F('valorDeferido', 'Valor deferido (R$)', 'money'),
      F('protocolo', 'Protocolo / processo administrativo', 'text'),
      F('link', 'Arquivo (Drive)', 'link'),
      F('obsAuditoria', 'Observações da auditoria', 'long', { w: 'full' })
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
const AUDIT = ['contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos', 'supervenientes'];

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
  /** descompacta um .zip → [{name, data:Uint8Array}] */
  async function unzip(buf) {
    const files = unzipIndex(buf), out = [];
    for (const [name, f] of Object.entries(files)) { if (name.endsWith('/')) continue; out.push({ name, data: f.method === 0 ? f.raw : await inflate(f.raw) }); }
    return out;
  }
  return { read, write, unzip };
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
/* =====================================================================
   Aplicação: login, estrutura, rotas, painel geral, clientes, agenda,
   acessos e configurações
   ===================================================================== */
const BRAND = {
  logoDark: 'brasao.png', logoLight: 'brasao-claro.png',
  caption: 'Advocacia e Consultoria Jurídica'
};
const escritorio = () => DB.get('config', 'escritorio') || { id: 'escritorio', nome: 'Amorim Firmo', subtitulo: BRAND.caption };
/** nome para cabeçalhos: sem "Advocacia e Consultoria Jurídica", que já vai na legenda */
const nomeMarca = () => String(escritorio().nome || 'Amorim Firmo').replace(/[\s,–—-]*(sociedade de advogados|advocacia)(\s*(e|&)\s*consultoria(\s+jur[ií]dica)?)?\s*$/i, '').trim() || 'Amorim Firmo';
/** OAB sempre no formato "OAB/PB 33.255" */
const oabFmt = (v = escritorio().oab) => { v = String(v || '').trim(); if (!v || /oab/i.test(v)) return v; const d = onlyDigits(v), uf = (v.match(/\b([A-Z]{2})\b/) || [])[1] || ((escritorio().advogados || [])[0]?.uf || 'PB').toUpperCase(); return d ? `OAB/${uf} ${d.length > 3 ? d.slice(0, -3) + '.' + d.slice(-3) : d}` : v; };

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
    App.shell(); App._nav = 0; window.onhashchange = () => { App._nav++; App.render(); }; App.render();
    App.checkPendentes();
    Escritorio.check().then(() => {
      const pend = ls.get('escPend'); if (pend && Session.isAdmin) { ls.del('escPend'); if (pend.error) UI.toast('Conexão cancelada.', 'warn'); else return Escritorio.receber(pend.code, pend.state); }
      App.render(true);
      DJEN.auto();
    });
    if (!Session.remote) DJEN.auto();
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
            ${apiUrl() ? `<button class="btn ghost block lg-cli" id="lgSemGoogle">${icon('search')} Sou cliente — consultar meus processos</button>` : ''}
          </div>
          <form id="lgStepEmail" class="stack" hidden>
            <h1>Consulte seus processos</h1>
            <p class="muted">Informe o <b>CPF</b> (ou CNPJ), o <b>telefone com DDD</b> ou o <b>e-mail</b> que você informou ao escritório. Para proteger seus dados, enviamos um código de acesso ao e-mail do seu cadastro.</p>
            <div class="fld"><label for="lgMail">CPF, telefone ou e-mail</label><input id="lgMail" required autocomplete="username" placeholder="000.000.000-00 · (83) 99999-9999 · seu@email.com"></div>
            <button class="btn primary block">${icon('mail')} Receber código no e-mail</button>
            <p class="note" id="lgCliSt"></p>
            <button type="button" class="link small" data-lgback>Sou do escritório — entrar com Google</button>
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
    const L = { email: '', nome: '', foto: '', idToken: null, viaGoogle: true, ref: '', ident: '' };
    const step = s => ['Google', 'Email', 'Code'].forEach(k => $('#lgStep' + k).hidden = k !== s);
    const aparelho = () => ls.get('aparelho', {});
    const entrar = async r => {
      Session.mode = 'remote'; Session.token = r.token; Session.user = { ...r.user, foto: r.user.foto || L.foto }; Session.save();
      const a = aparelho(); a[Session.user.email] = r.token; ls.set('aparelho', a);
      await DB.init(); try { await DB.pull(); } catch (e) { UI.toast(e.message, 'bad'); } App.boot(); UI.toast('Bem-vindo(a)!');
    };
    const pedirConsulta = async () => {
      const st = $('#lgCliSt'); st.textContent = 'Procurando seu cadastro…';
      try {
        const r = await api('consultaPedir', { ident: L.ident });
        L.ref = r.ref; L.email = r.destino;
        $('#lgCodTit').textContent = r.nome ? `Olá, ${r.nome}!` : 'Confirme seu acesso';
        $('#lgCodTxt').innerHTML = `Enviamos um código de 6 dígitos para o e-mail do seu cadastro, <b>${esc(r.destino)}</b>. Digite-o abaixo para ver seus processos.`;
        $('#lgCod').disabled = false; $('#lgCodOk').disabled = false; $('#lgCodSt').textContent = `O código vale por ${r.validadeMin || 10} minutos; confira também a caixa de spam.`; step('Code'); $('#lgCod').focus(); st.textContent = '';
      } catch (e) { st.textContent = e.message; if (!$('#lgStepEmail').hidden) return; step('Email'); }
    };
    const pedirCodigo = async () => {
      if (L.ref) return pedirConsulta();
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
      try { await entrar(L.ref ? await api('consultaVerificar', { ref: L.ref, code: cod }) : await api('verifyCode', { email: L.email, code: cod })); } catch (err) { st.textContent = err.message; $('#lgCodOk').disabled = false; }
    };
    $('#lgReenv').onclick = pedirCodigo;
    $$('[data-lgback]').forEach(b => b.onclick = () => { try { google.accounts.id.disableAutoSelect(); } catch { } L.ref = ''; step('Google'); });
    $('#lgSemGoogle') && ($('#lgSemGoogle').onclick = () => step('Email'));
    $('#lgStepEmail').onsubmit = e => { e.preventDefault(); L.ident = $('#lgMail').value.trim(); L.viaGoogle = false; L.idToken = null; if (L.ident) pedirConsulta(); };
    // link público (Instagram/Linktree): …/#/consulta abre direto a consulta do cliente
    if (/^#\/?consulta/.test(location.hash) && apiUrl()) step('Email');
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
          <div id="conexSlot"></div>
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
    App.globalSearch(); UI.syncBadge(); App.badge(); Escritorio.badge();
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
      ${item('/atendimentos', 'briefcase', 'Atendimentos', DB.where('atendimentos', x => !/Ajuizado|Não prosseguiu/.test(x.status || '')).length || '')}
      ${item('/agenda', 'calendar', 'Agenda e prazos', DB.where('prazos', p => !p.concluido && daysUntil(p.data) !== null && daysUntil(p.data) <= 7).length || '')}
      <div class="nav-h">Consultoria jurídica</div>
      ${item('/empresas', 'building', 'Empresas', DB.all('empresas').length || '')}
      ${DB.all('achados').length ? item('/achados', 'alert', 'Achados de auditoria', DB.where('achados', x => achadoAberto(x) && /alto|cr[ií]tico/i.test(x.risco || '')).length || '') : ''}
      ${DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao)).map(e => `<a href="#/empresa/${e.id}" class="sub ${route.startsWith('/empresa/' + e.id) ? 'on' : ''}"><span>${esc(e.fantasia || e.razao)}</span></a>`).join('')}
      <div class="nav-h">Cadastros</div>
      ${item('/clientes', 'users', 'Clientes', DB.all('clientes').length || '')}`;
    $('#lnkGestao')?.classList.toggle('on', route.startsWith('/gestao'));
  },
  /** páginas de primeiro nível (menu) não têm "Voltar"; as de detalhe têm */
  TOPO: /^#?\/?(painel|judicial\/[a-z]+|agenda|atendimentos|clientes|empresas|achados|consulta|gestao(\/[a-z]+)?)?$/,
  voltar(parts) {
    if (App._nav > 0) { App._nav -= 2; history.back(); return; }
    const pai = [...parts].reverse().slice(1).find(p => p.href); location.hash = '#' + (pai ? pai.href : '/painel');
  },
  crumbs(parts) {
    const topo = App.TOPO.test(location.hash);
    $('#crumbs').innerHTML = (topo ? '' : `<button class="back-btn" id="btnVoltar" title="Voltar à página anterior">${icon('chevL')}<span>Voltar</span></button>`) + parts.map((p, i) => i < parts.length - 1 && p.href ? `<a href="#${p.href}">${esc(p.t)}</a>` : `<b>${esc(p.t)}</b>`).join(`<span class="sep">/</span>`);
    $('#btnVoltar')?.addEventListener('click', () => App.voltar(parts));
  },
  render(keepScroll) {
    if (!Session.isStaff) return Portal.render();
    const route = (location.hash || '#/painel').slice(1).split('?')[0] || '/painel';
    const [, a, b, c] = route.split('/');
    if (a === 'consulta') { history.replaceState(null, '', '#/painel'); return App.render(); } // link do cliente aberto por alguém da equipe
    App.nav(route); document.body.classList.remove('side-open'); Tip.hide();
    const v = $('#view'); const y = scrollY;
    try {
      if (Session.remote && Escritorio.st && !Escritorio.st.conectado && a !== 'gestao') { Escritorio.gate(v); UI.syncBadge(); return; }
      if (a === 'painel' || !a) Views.painel(v);
      else if (a === 'judicial') Judicial.list(v, b || 'todos');
      else if (a === 'processo') Judicial.detail(v, b);
      else if (a === 'agenda') Views.agenda(v);
      else if (a === 'atendimentos') Atend.list(v);
      else if (a === 'atendimento') Atend.detail(v, b, c || 'caso');
      else if (a === 'achados') Achados.view(v);
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
  'Cadastro de processos pelos arquivos: a IA lê petições, decisões ou os autos, preenche o cadastro (partes, cliente, vara, classe, valor, movimentações, audiências e prazos) e guarda os arquivos no Drive do escritório por área',
  'Movimentações importadas do DataJud/CNJ, com sincronização diária automática',
  'Agenda de prazos, audiências e compromissos, com alertas',
  'Portal do cliente: acesso próprio e restrito, só aos próprios processos e às movimentações liberadas',
  'Aviso por e-mail ao cliente quando há nova movimentação (opcional por processo)',
  'Consultoria jurídica: empresas, contratos e auditoria em 10 abas (obrigações, mão de obra, materiais, financeiro, medições, indicadores, achados, documentos e aditivos)',
  '“Juntar documentos”: arraste contratos, aditivos e planilhas — o app guarda no Drive, lê com IA, liga ao contrato certo e sugere o preenchimento',
  'Intimações do DJEN pela OAB dos advogados do escritório, consultadas sozinhas todo dia: lançadas nos processos, e os processos ainda não cadastrados aparecem para cadastrar com um clique',
  'Cadastro de empresas e clientes pelo CNPJ, com dados da Receita Federal, ou direto pelos documentos',
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
      <div class="actions"><button class="btn ghost" id="nProc">${icon('plus')} Novo processo</button><button class="btn ghost" id="nProcDocs">${icon('upload')} Processo pelos arquivos</button><button class="btn primary" id="nEmp">${icon('building')} Nova empresa</button></div></div>
    <div class="kpis">
      ${kpi('Processos em andamento', procs.length, Object.entries(AREAS).map(([k, a]) => `${a.nome} ${procs.filter(p => p.area === k).length}`).join(' · '), '', '#/judicial/todos')}
      ${kpi('Compromissos em 7 dias', prox7.length, atras.length ? `<b class="t-bad">${atras.length} em atraso</b>` : 'nenhum em atraso', atras.length ? 'bad' : '', '#/agenda')}
      ${kpi('Empresas em consultoria', DB.all('empresas').length, `${DB.all('contratos').length} contratos auditados`, '', '#/empresas')}
      ${kpi('Contratos vencendo (90 dias)', venc90.length, 'renovação ou encerramento', venc90.length ? 'warn' : '')}
      ${kpi('Achados de risco alto', achAlt.length, achAlt.length ? 'em aberto · <u>ver e resolver</u>' : 'em aberto nos planos de ação', achAlt.length ? 'bad' : '', '#/achados')}
    </div>
      <section class="card"><header><h2>${icon('calendar')} Próximos compromissos</h2><a href="#/agenda" class="link">Ver agenda</a></header>
        ${prazos.length ? `<ul class="agenda-list">${prazos.slice(0, 7).map(Views.agendaItem).join('')}</ul>` : `<div class="empty sm">${icon('calendar')}<p>Nenhum prazo ou audiência cadastrado.</p></div>`}</section>
    <div class="grid2">
      <section class="card"><header><h2>${icon('scale')} Processos por área</h2></header>${hbarHtml(Object.entries(AREAS).map(([k, a], i) => ({ label: a.nome, value: procs.filter(p => p.area === k).length, color: 'var(--s1)' })).filter(x => x.value), v => String(v))}</section>
      <section class="card"><header><h2>${icon('alert')} Alertas da consultoria</h2></header>${Views.alertasConsultoria()}</section>
    </div>
    ${DJEN.cardHtml()}
      <section class="card"><header><h2>${icon('history')} Últimas movimentações</h2></header>
        ${movs.length ? `<ul class="feed">${movs.map(m => { const p = DB.get('processos', m.processoId); return `<li><a href="#/processo/${m.processoId}"><time>${fmtDate(m.data)}</time><div><b>${esc(m.titulo)}</b><small>${esc(p ? fmtCNJ(p.numero) + ' · ' + clienteNomes(p) : '')}</small></div>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : ''}</a></li>`; }).join('')}</ul>` : `<div class="empty sm">${icon('history')}<p>As movimentações dos processos aparecerão aqui.</p></div>`}</section>`;
    DJEN.bindCard(v);
    $('#nProc').onclick = () => Judicial.edit(null, 'civil');
    $('#nProcDocs').onclick = () => JudDocs.open();
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
      foot: `<button class="btn ghost" id="cEdit">${icon('edit')} Editar</button><button class="btn ghost" id="cPrev">${icon('eye')} Ver como o cliente</button><button class="btn ghost" id="cAt">${icon('briefcase')} Novo atendimento</button><span class="sp"></span>${c.email ? `<button class="btn primary" id="cAcc">${icon('key')} Conceder acesso ao portal</button>` : ''}`
    });
    $('#cEdit', m).onclick = () => UI.editRecord('clientes', c);
    $('#cPrev', m).onclick = () => { UI.closeModal(); Portal.preview(id); };
    $('#cAcc', m)?.addEventListener('click', () => Views.grantAccess(c));
    $('#cAt', m).onclick = () => Atend.novo(c.id);
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
    const linkCli = location.origin + location.pathname + '#/consulta';
    el.innerHTML = `<section class="card link-cli"><header><h2>${icon('search')} Link de consulta para os clientes</h2></header>
      <p class="muted small">Coloque este link no Instagram, no Linktree, no WhatsApp ou no cartão de visitas. O cliente informa o CPF, o telefone ou o e-mail do cadastro, recebe um código no e-mail cadastrado e vê só os próprios processos (apenas as movimentações marcadas como visíveis). O cadastro do cliente precisa ter e-mail.</p>
      <div class="btn-row"><input class="input mono" id="lkCli" value="${esc(linkCli)}" readonly><button class="btn primary sm" id="lkCopy">${icon('link')} Copiar</button><a class="btn ghost sm" href="${esc(linkCli)}" target="_blank" rel="noopener">${icon('eye')} Abrir</a></div></section>
      <div class="grid2">
      <section class="card"><header><h2>${icon('link')} Conexões</h2></header>
        <div class="conn"><span class="dot ${apiUrl() ? 'ok' : 'off'}"></span><div><b>Servidor (Google Apps Script)</b><small>${apiUrl() ? esc(apiUrl().slice(0, 60)) + '…' : 'não configurado — preencha APPS_SCRIPT_URL no config.js'}</small></div>${apiUrl() ? `<button class="btn ghost sm" id="tstSrv">Testar</button>` : ''}</div>
        <div class="conn"><span class="dot ${CONFIG.GOOGLE_CLIENT_ID ? 'ok' : 'off'}"></span><div><b>Login com Google</b><small>${CONFIG.GOOGLE_CLIENT_ID ? 'Client ID configurado' : 'não configurado — preencha GOOGLE_CLIENT_ID no config.js'}</small></div></div>
        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>DataJud / CNJ (movimentações)</b><small>${Session.remote ? 'consulta pelo servidor; sincronização diária automática' : 'disponível com o servidor conectado'}</small></div></div>

        <div class="conn"><span class="dot ${Session.remote ? 'ok' : 'off'}"></span><div><b>E-mails (códigos, convites e avisos)</b><small>${Session.remote ? 'enviados pela conta Google dona do Apps Script' : 'disponível com o servidor conectado'}</small></div></div>

        ${CONFIG.APPS_SCRIPT_URL ? '' : `<p class="muted small">Para testar sem editar o config.js: <button class="link" id="cfgSrv">informar URL do servidor neste aparelho</button></p>`}
      </section>
      <section class="card"><header><h2>${icon('briefcase')} Conexão com o escritório (Drive e IA)</h2></header>${Escritorio.cardHtml()}</section>
      <section class="card"><header><h2>${icon('users')} Advogados do escritório (intimações no DJEN)</h2></header>${DJEN.advHtml()}</section>
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
    Escritorio.bindCard(el); DJEN.bindAdv(el);
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
    $('#lkCopy', el)?.addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#lkCli', el).value); UI.toast('Link copiado.'); } catch { $('#lkCli', el).select(); UI.toast('Selecione e copie o link (Ctrl+C).', 'warn'); } });
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
    const rows = procs.map(p => { const m = lastMov(p.id); return { ...p, _cli: clienteNomes(p) || '⚠ cliente a definir', _area: AREAS[p.area]?.nome, _ult: m?.data || null, _ultT: m?.titulo || '', _prox: DB.where('prazos', x => x.processoId === p.id && !x.concluido && isISO(x.data) && daysUntil(x.data) >= 0).sort((a, b) => a.data.localeCompare(b.data))[0]?.data || null }; });
    const sc = { fields: [F('numero', 'Número', 'cnj'), F('_cli', 'Cliente(s)'), F('_area', 'Área'), F('classe', 'Classe'), F('orgao', 'Órgão julgador'), F('status', 'Situação', 'select', { opts: [] }), F('_ult', 'Última movimentação', 'date'), F('_prox', 'Próximo compromisso', 'date'), F('parteContraria', 'Parte contrária'), F('assunto', 'Assunto')] };
    const ativos = procs.filter(p => p.status !== 'Encerrado' && p.status !== 'Arquivado provisoriamente');
    const valor = procs.reduce((s, p) => s + (num(p.valorCausa) || 0), 0), comValor = procs.filter(p => num(p.valorCausa) > 0).length;
    const semMov30 = ativos.filter(p => { const m = lastMov(p.id); return !m || daysUntil(m.data) < -30; }).length;
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Judicial</span><h1>${icon(A?.icon || 'layers', 'h-ic')} ${all ? 'Todos os processos' : 'Direito ' + (A.nome === 'Cível' ? 'Civil' : A.nome)}</h1><p class="muted">Processos próprios do escritório, com movimentações e acesso do cliente pelo portal.</p></div>
      <div class="actions"><button class="btn ghost" id="nProc">${icon('plus')} Novo processo</button><button class="btn primary" id="nProcDocs">${icon('upload')} Cadastrar pelos arquivos</button></div></div>
      <div class="kpis sm">${kpi('Em andamento', ativos.length)}${kpi('Total cadastrados', procs.length)}${kpi('Valor das causas', fmtMoneyShort(valor), comValor < procs.length ? `em ${comValor} de ${procs.length} processos · <button class="link" id="kVal">informar os demais</button>` : '')}${kpi('Sem movimentação há 30+ dias', semMov30, 'merecem consulta', semMov30 ? 'warn' : '')}</div>
      ${DJEN.pendentes().length ? `<div class="notice">${icon('mail')}<div><b>${DJEN.pendentes().length} processo(s) com intimação no DJEN em nome dos advogados do escritório ainda não cadastrados.</b> <button class="link" id="djPendJ">Revisar e cadastrar</button></div></div>` : ''}
      ${DJEN.cadastrados().length ? `<p class="muted small right"><button class="link" id="djDesfJ">${icon('list')} Processos cadastrados pela OAB (${DJEN.cadastrados().length}) — devolver para a revisão</button></p>` : ''}
      <section class="card flush" id="tbl"></section>`;
    $('#djPendJ')?.addEventListener('click', () => DJEN.revisarPendentes());
    $('#djDesfJ')?.addEventListener('click', () => DJEN.gerenciarCadastrados());
    $('#kVal')?.addEventListener('click', () => Judicial.completarValores(procs));
    dataTable($('#tbl'), {
      id: 'proc-' + area, rows, schema: sc, cols: all ? ['numero', '_cli', '_area', 'classe', 'status', '_ult', '_prox'] : ['numero', '_cli', 'classe', 'orgao', 'status', '_ult', '_prox'],
      filters: [{ k: 'status', label: 'Situação', opts: SCHEMAS.processos.fields.find(f => f.k === 'status').opts }],
      tools: `<button class="icon-btn tool-print" id="pRel" title="Imprimir a relação de processos (com os filtros e a busca aplicados)">${icon('printer')}</button>`,
      onOpen: p => location.hash = '#/processo/' + p.id, emptyMsg: 'Nenhum processo cadastrado nesta área.'
    });
    $('#pRel').onclick = () => { const st = TableState['proc-' + area] || {}; Report.processos($('#tbl')._list || rows, { area: all ? null : area, situacao: st.f?.status || '', busca: st.q || '' }); };
    $('#nProc').onclick = () => Judicial.edit(null, all ? 'civil' : area);
    $('#nProcDocs').onclick = () => JudDocs.open();
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
        <div class="proc-tags">${pill(A.nome)} ${pill(p.status || 'Ativo')} ${p.fase ? `<span class="tag">${esc(p.fase)}</span>` : ''} ${p.transito ? `<span class="pill tj">${icon('scale')} Transitado em julgado em ${esc(fmtDate(p.transito))}</span>` : ''} ${p.segredo ? '<span class="pill critical">Segredo de justiça</span>' : ''} ${p.tribunal ? `<span class="tag">${esc(p.tribunal)}</span>` : ''}</div>
        <h1 class="mono proc-num">${esc(fmtCNJ(p.numero))} ${validCNJ(p.numero) ? '' : `<span class="pill serious" title="Dígito verificador não confere">verificar número</span>`}</h1>
        <p class="proc-sub">${esc(p.classe || 'Classe não informada')}${p.assunto ? ' · ' + esc(p.assunto) : ''}</p>
        <p class="proc-parts"><b>${esc(clientes.map(c => c.nome).join(', ') || 'Cliente não vinculado')}</b> <span class="muted">(${esc(p.polo || 'polo não informado')})</span> <span class="vs">×</span> ${esc(p.parteContraria || '—')}</p>
      </div>
      <div class="actions wrap">
        <button class="btn ghost" id="pEdit">${icon('edit')} Editar</button>
        <button class="btn ghost" id="pPrev">${icon('eye')} Ver como o cliente</button>
        <button class="btn ghost" id="pDocs">${icon('upload')} Juntar arquivos</button>
        <button class="btn primary" id="pSync">${icon('sync')} Buscar movimentações (DataJud)</button>
      </div>
    </div>
    ${Judicial.partesHtml(p)}
<section class="card dados-card"><header><h2>${icon('file')} Dados do processo</h2></header>
          <dl class="dl cols">
            <dt>Cliente(s)</dt><dd>${clientes.map(c => `<a href="#/clientes?c=${c.id}">${esc(c.nome)}</a>`).join(', ') || '—'}</dd>
            <dt>Órgão julgador</dt><dd>${esc(p.orgao || '—')}</dd><dt>Comarca</dt><dd>${esc(p.comarca || '—')}</dd>
            <dt>Distribuição</dt><dd>${esc(fmtDate(p.distribuicao) || '—')}</dd><dt>Valor da causa</dt><dd>${esc(fmtMoney(p.valorCausa) || '—')}</dd>
            <dt>Fase</dt><dd>${esc(p.fase || '—')}</dd>${p.transito ? `<dt>Trânsito em julgado</dt><dd>${esc(fmtDate(p.transito))} (fase de conhecimento)</dd>` : ''}<dt>Responsável</dt><dd>${esc(p.responsavel || '—')}</dd><dt>Honorários</dt><dd>${esc(p.honorarios || '—')}</dd>
            <dt>E-mail do cliente</dt><dd>${clientes.length ? clientes.map(c => c.email ? esc(c.email) : '<span class="t-warn">não informado</span>').join(', ') : '—'} ${clientes.length ? `<button class="link small" id="pMail">${clientes.some(c => c.email) ? 'alterar' : 'informar'}</button>` : ''}</dd>
            <dt>Aviso ao cliente</dt><dd>${p.notificarCliente ? (clientes.some(c => c.email) ? 'por e-mail a cada movimentação' : '<span class="t-warn">ligado, mas sem e-mail do cliente</span>') : 'desativado'} ${clientes.length ? `<button class="link small" id="pMail2">${p.notificarCliente ? 'configurar' : 'ativar'}</button>` : ''}</dd>
          </dl>
          ${p.obs ? `<div class="note-box"><span class="lbl">Anotações internas</span>${esc(p.obs)}</div>` : ''}
        </section>
    <div class="grid-main">
      <section class="card">
        <header><h2>${icon('history')} Movimentações</h2><div class="hdr-actions"><span class="muted small">${visiveis} de ${movs.length} visíveis ao cliente</span><button class="btn ghost sm" id="mAdd">${icon('plus')} Lançar</button></div></header>
        ${p.ultimaSync ? `<p class="muted small">Última consulta ao DataJud: ${esc(fmtDateTime(p.ultimaSync))}</p>` : ''}
        ${movs.length ? `<ol class="timeline">${movs.map(m => `<li class="${m.visivelCliente ? '' : 'hidden-mov'}"><span class="tl-dot"></span><div class="tl-head"><time>${esc(fmtDate(m.data))}</time>${m.origem === 'datajud' ? '<span class="badge">DataJud</span>' : m.origem === 'djen' ? '<span class="badge djen">DJEN</span>' : m.origem === 'documento' ? '<span class="badge soft">Documento</span>' : '<span class="badge soft">Escritório</span>'}<span class="sp"></span><button class="icon-btn sm" data-vis="${m.id}" title="${m.visivelCliente ? 'Visível ao cliente — clique para ocultar' : 'Oculto do cliente — clique para mostrar'}">${icon(m.visivelCliente ? 'eye' : 'eyeOff')}</button><button class="icon-btn sm" data-mov="${m.id}" title="Editar">${icon('edit')}</button></div><b class="tl-t">${esc(m.titulo)}</b>${Judicial.textoMov(m)}${m.link ? `<a class="link small" href="${esc(m.link)}" target="_blank" rel="noopener">${icon('link')} abrir publicação</a>` : ''}${m.explicacao ? `<p class="explain">${icon('user')} <span>${esc(m.explicacao)}</span></p>` : ''}</li>`).join('')}</ol>` : `<div class="empty sm">${icon('history')}<p>Nenhuma movimentação. Lance manualmente ou busque no DataJud.</p></div>`}
      </section>
      <div class="col">

        <section class="card"><header><h2>${icon('file')} Arquivos</h2>${p.pastaLink ? `<a class="link small" href="${esc(p.pastaLink)}" target="_blank" rel="noopener">${icon('link')} Pasta no Drive</a>` : ''}</header>
          ${(p.arquivos || []).length ? `<ul class="plain files">${p.arquivos.map(a => `<li>${icon('file')} ${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.nome)}</a>` : esc(a.nome)}${a.tipo ? ` <span class="muted small">· ${esc(a.tipo)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">Nenhum arquivo. Use “Juntar arquivos” para guardar petições, decisões e documentos na pasta do processo no Drive do escritório.</p>'}</section>
        <section class="card"><header><h2>${icon('calendar')} Agenda</h2><button class="btn ghost sm" id="aAdd">${icon('plus')} Novo</button></header>
          ${prazos.length ? `<ul class="agenda-list compact">${prazos.map(Views.agendaItem).join('')}</ul>` : '<p class="muted small">Nenhum prazo ou audiência.</p>'}</section>
      </div>
    </div>`;
    $('#pEdit').onclick = () => Judicial.edit(p);
    ['#pMail', '#pMail2'].forEach(k => $(k)?.addEventListener('click', () => Judicial.emailCliente(p)));
    $$('[data-ptcli]', v).forEach(b => b.onclick = () => Judicial.tornarCliente(p, +b.dataset.ptcli));
    $('#pPrev').onclick = () => { if (!clientes.length) return UI.toast('Vincule um cliente ao processo.', 'warn'); Portal.preview(clientes[0].id, p.id); };
    $('#pSync').onclick = () => Judicial.datajud(p);
    $('#pDocs').onclick = () => JudDocs.open(p);
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
  /** texto da movimentação: nas decisões publicadas, só a parte dispositiva (a íntegra fica em "ler inteiro teor") */
  recolher: `<button type="button" class="link small tl-rec" onclick="const d=this.closest('details');d.open=false;d.scrollIntoView({block:'nearest',behavior:'smooth'})">▲ recolher</button>`,
  /** completar o valor da causa dos processos que não têm (o DJEN e o DataJud não informam esse dado) */
  completarValores(procs) {
    const l = procs.filter(p => !(num(p.valorCausa) > 0));
    const m = UI.modal({ title: 'Valor da causa', sub: `${l.length} processo(s) sem valor informado`, wide: true,
      body: `<p class="muted small">O DJEN e o DataJud não informam o valor da causa. Digite os valores que souber (os vazios ficam como estão) — ou use “Juntar arquivos” com a petição inicial no processo, que a IA preenche sozinha.</p>
        <div class="table-wrap"><table class="dt"><thead><tr><th>Processo</th><th>Cliente</th><th>Classe</th><th style="width:170px">Valor da causa (R$)</th></tr></thead><tbody>
        ${l.map((p, i) => `<tr><td class="mono">${esc(fmtCNJ(p.numero))}</td><td>${esc(clienteNomes(p) || '—')}</td><td>${esc(p.classe || '')}</td><td><input class="input sm" data-vc="${i}" inputmode="decimal" placeholder="0,00"></td></tr>`).join('')}</tbody></table></div>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="vcOk">${icon('check')} Salvar valores</button>` });
    $('#vcOk', m).onclick = async () => {
      const mud = $$('[data-vc]', m).map(x => [l[+x.dataset.vc], num(x.value)]).filter(([, v]) => v > 0).map(([p, v]) => ({ ...p, valorCausa: v }));
      if (mud.length) await DB.save('processos', mud);
      UI.closeModal(); UI.toast(`${mud.length} valor(es) salvo(s).`); App.render(true);
    };
  },
  textoMov(m) {
    const t = m.descricao || ''; if (!t) return '';
    if (DJEN.ehDecisao(m.titulo)) {
      const d = DJEN.dispositivo(t);
      if (d.resumido) return `<p class="dispositivo"><span class="disp-tag">Dispositivo</span>${esc(d.texto)}</p><details class="tl-more full"><summary><span class="link small">ler inteiro teor</span></summary><p class="pre">${esc(t)}</p>${Judicial.recolher}</details>`;
    }
    return t.length > 420 ? `<details class="tl-more"><summary><span class="tl-prev">${esc(t.slice(0, 300))}… </span><span class="link small">ler tudo</span></summary><p class="pre">${esc(t)}</p>${Judicial.recolher}</details>` : `<p>${esc(t)}</p>`;
  },
  /** e-mail do(s) cliente(s) e aviso automático de andamento */
  emailCliente(p) {
    const cls = (p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean);
    const m = UI.modal({ title: 'E-mail do cliente', sub: fmtCNJ(p.numero),
      body: `<p class="muted small">É por este e-mail que o cliente recebe o aviso de cada nova movimentação visível para ele e, se você quiser, o acesso ao portal para acompanhar o processo.</p>
        ${cls.map((c, i) => `<div class="fld"><label>${esc(c.nome)}</label><input class="input" type="email" data-em="${i}" value="${esc(c.email || '')}" placeholder="nome@exemplo.com"></div>`).join('')}
        <label class="switch" style="margin-top:10px"><input type="checkbox" id="emAviso" ${p.notificarCliente || !cls.some(c => c.email) ? 'checked' : ''}><span></span>Avisar o cliente por e-mail a cada nova movimentação deste processo</label>
        <label class="switch"><input type="checkbox" id="emPortal"><span></span>Dar acesso ao portal do cliente (ele recebe um convite por e-mail)</label>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="emOk">${icon('check')} Salvar</button>` });
    $('#emOk', m).onclick = async () => {
      const mails = $$('[data-em]', m).map(x => x.value.trim().toLowerCase());
      const ruim = mails.find(e => e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)); if (ruim) return UI.toast('E-mail inválido: ' + ruim, 'bad');
      const aviso = $('#emAviso', m).checked, portal = $('#emPortal', m).checked;
      const mud = cls.map((c, i) => ({ ...c, email: mails[i] })).filter((c, i) => c.email !== (cls[i].email || ''));
      if (mud.length) await DB.save('clientes', mud);
      if (!!p.notificarCliente !== aviso) await DB.save('processos', { ...p, notificarCliente: aviso });
      UI.closeModal();
      if (portal) for (const c of cls.map((c, i) => ({ ...c, email: mails[i] })).filter(c => c.email)) await Views.grantAccess(c);
      else UI.toast('Salvo.' + (aviso && !mails.some(Boolean) ? ' Atenção: sem e-mail, o aviso não tem para onde ir.' : ''), aviso && !mails.some(Boolean) ? 'warn' : 'ok');
      App.render(true);
    };
  },
  partesHtml(p) {
    // quem é cliente vem dos clientes vinculados ao processo (o que for escolhido em Editar vale aqui também)
    const nomesCli = new Set((p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean).map(c => norm(c.nome)));
    const ps = (p.partes || []).map((x, i) => ({ ...x, i, papel: x.papel || DJEN.papelDe(x.nome), nome: DJEN.limparNome(x.nome) })).filter(x => !DJEN.ehAdvDoEscritorio(x.nome)); if (!ps.length) return '';
    ps.forEach(x => x.cliente = nomesCli.size ? nomesCli.has(norm(x.nome)) : false);
    const grupo = (pl, tit) => { const l = ps.filter(x => (x.polo || '') === pl); return l.length ? `<div class="pt-grupo"><h4>${tit}</h4>${l.map(x => `<div class="pt-item"><div class="pt-linha"><div><b>${esc(x.nome)}</b>${x.cliente ? ' <span class="pill good">cliente</span>' : ''}${x.papel ? ` <small class="muted">${esc(x.papel)}</small>` : ''}${x.doc ? ` <small class="muted mono">${esc(fmtDoc(x.doc))}</small>` : ''}</div>${x.cliente ? '' : `<button class="btn ghost xs" data-ptcli="${x.i}" title="Tornar esta parte o cliente do escritório neste processo">${icon('user')} é o cliente</button>`}</div>${(x.advogados || []).length ? `<small class="pt-adv">${icon('user')} ${x.advogados.map(a => esc(a.nome) + (a.oab ? ` <span class="muted">(OAB ${esc(a.oab)}${a.uf ? '/' + esc(a.uf) : ''})</span>` : '') + (a.escritorio ? ' <span class="badge soft">escritório</span>' : '')).join(' · ')}</small>` : ''}</div>`).join('')}</div>` : ''; };
    return `<section class="card partes-card"><header><h2>${icon('users')} Partes</h2></header><div class="pt-cols">${grupo('Ativo', 'Polo ativo')}${grupo('Passivo', 'Polo passivo')}${grupo('Terceiro', 'Terceiros interessados')}${grupo('', 'Polo não informado')}</div></section>`;
  },
  /** troca o cliente do processo pela parte escolhida: vincula (ou cria) o cliente, acerta o polo e a parte contrária */
  async tornarCliente(p, idx) {
    const pt = (p.partes || [])[idx]; if (!pt) return;
    const nome = DJEN.limparNome(pt.nome);
    const antigos = (p.clienteIds || []).map(i => DB.get('clientes', i)).filter(Boolean);
    const msg = antigos.length ? `Trocar o cliente deste processo de <b>${esc(antigos.map(c => c.nome).join(', '))}</b> para <b>${esc(nome)}</b>?` : `Definir <b>${esc(nome)}</b> como cliente deste processo?`;
    if (!await UI.confirm(msg, 'Confirmar', false)) return;
    let c = DB.all('clientes').find(x => norm(x.nome) === norm(nome));
    if (!c) { c = { id: uid('cl'), tipo: DJEN.PJ.test(nome) ? 'Pessoa jurídica' : 'Pessoa física', nome, obs: `Cadastrado pelo processo ${fmtCNJ(p.numero)}. Completar CPF/CNPJ e contato.` }; await DB.save('clientes', c); }
    p.partes = p.partes.map((x, i) => ({ ...x, cliente: i === idx }));
    p.clienteIds = [c.id];
    if (pt.polo === 'Ativo' || pt.polo === 'Passivo') {
      p.polo = DJEN.poloCliente(pt.polo, p.area);
      p.parteContraria = p.partes.filter(x => x.polo && x.polo !== pt.polo && x.polo !== 'Terceiro' && !DJEN.ehAdvDoEscritorio(DJEN.limparNome(x.nome))).map(x => DJEN.limparNome(x.nome)).join('; ');
    }
    await DB.save('processos', p);
    // o cliente trocado, se foi criado automaticamente e não tem outro processo nem acesso ao portal, sai do cadastro
    const sobra = antigos.filter(a => a.id !== c.id && /^Cadastrado (automaticamente )?pelo processo/.test(a.obs || '') && !a.email && !DB.all('processos').some(x => (x.clienteIds || []).includes(a.id)));
    if (sobra.length) await DB.remove('clientes', sobra.map(a => a.id));
    UI.toast(`Cliente do processo: ${nome}.${sobra.length ? ` O cadastro de ${sobra.map(a => a.nome).join(', ')}, criado por engano, foi removido.` : ''}`, 'ok', 7000);
    App.render(true);
  },
  mergeDatajud(p, r) {
    p.ultimaSync = new Date().toISOString();
    if (!r.encontrado) return [];
    ['classe', 'orgao', 'assunto'].forEach(k => { if (!p[k] && r[k]) p[k] = r[k]; });
    if (!p.distribuicao && r.ajuizamento) p.distribuicao = parseDate(r.ajuizamento);
    if (!p.tribunal && r.tribunal) p.tribunal = r.tribunal;
    const tj = !p.transito && (r.movimentos || []).filter(m => /tr[âa]nsit[oa] em julgado/i.test(m.titulo + ' ' + (m.descricao || ''))).sort((a, b) => a.data.localeCompare(b.data))[0];
    if (tj) { p.transito = tj.data; setTimeout(() => UI.toast(`A fase de conhecimento transitou em julgado em ${fmtDate(tj.data)}.`, 'ok', 7000), 400); }
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
  ['achados', 'Achados e plano de ação', 'alert'], ['supervenientes', 'Custos supervenientes', 'briefcase'], ['documentos', 'Documentos', 'file'], ['aditivos', 'Aditivos', 'edit'], ['relatorios', 'Relatórios', 'printer']
];
const empRecs = (c, eid) => DB.where(c, r => r.empresaId === eid);
const tomadorBase = c => String(c.tomador || '').split(/ [–-] /)[0].replace(/\(ver unidade\)/i, '').trim() || 'Não informado';

const Consult = {
  list(v) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Empresas' }]);
    const emps = DB.all('empresas').sort((a, b) => (a.fantasia || a.razao).localeCompare(b.fantasia || b.razao));
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>Empresas</h1><p class="muted">Empresas atendidas na gestão e auditoria de contratos.</p></div><div class="actions"><button class="btn ghost" id="nEmp">${icon('plus')} Nova empresa</button><button class="btn primary" id="nEmpDocs">${icon('upload')} Cadastrar pelos documentos</button></div></div>
    ${emps.length ? `<div class="emp-grid">${emps.map(e => {
      const cs = empRecs('contratos', e.id), at = cs.filter(contratoAtivo), ach = empRecs('achados', e.id).filter(achadoAberto);
      const cart = at.reduce((s, c) => s + (num(c.valorMensal) || 0), 0);
      return `<a class="emp-card" href="#/empresa/${e.id}"><div class="emp-ini">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div class="emp-body"><b>${esc(e.fantasia || e.razao)}</b><small>${esc(e.razao)}${e.cnpj ? ' · ' + esc(fmtDoc(e.cnpj)) : ''}</small>
        <div class="emp-stats"><span><b>${cs.length}</b> contratos</span><span><b>${at.length}</b> vigentes</span><span><b>${ach.length}</b> achados abertos</span>${cart ? `<span><b>${fmtMoneyShort(cart)}</b>/mês</span>` : ''}</div></div>${icon('chevR')}</a>`;
    }).join('')}</div>` : `<div class="empty big">${icon('building')}<h3>Nenhuma empresa cadastrada</h3><p>Digite o CNPJ (os dados vêm da Receita Federal) ou simplesmente arraste a pasta com os contratos e a planilha — o app identifica a empresa e cadastra tudo.</p><div class="btn-row center"><button class="btn ghost" id="nEmp2">${icon('plus')} Cadastrar pelo CNPJ</button><button class="btn primary" id="nEmpDocs2">${icon('upload')} Cadastrar pelos documentos</button></div></div>`}`;
    $('#nEmp').onclick = () => Consult.editEmpresa(null);
    $('#nEmp2') && ($('#nEmp2').onclick = () => Consult.editEmpresa(null));
    $('#nEmpDocs').onclick = () => Docs.open(null);
    $('#nEmpDocs2') && ($('#nEmpDocs2').onclick = () => Docs.open(null));
  },
  editEmpresa(e) { UI.editRecord('empresas', e, { onSaved: s => { location.hash = '#/empresa/' + s.id; App.render(); } }); },

  workspace(v, eid, tab) {
    const e = DB.get('empresas', eid);
    if (!e) { v.innerHTML = `<div class="empty">${icon('alert')}<p>Empresa não encontrada.</p></div>`; return; }
    const T = TABS.find(t => t[0] === tab) || TABS[0];
    App.crumbs([{ t: 'Consultoria', href: '/empresas' }, { t: e.fantasia || e.razao, href: '/empresa/' + eid }, { t: T[1] }]);
    const count = c => empRecs(c, eid).length;
    v.innerHTML = `<div class="ws-h"><div class="emp-ini lg">${esc((e.fantasia || e.razao).slice(0, 2).toUpperCase())}</div><div><span class="eyebrow">Consultoria jurídica</span><h1>${esc(e.fantasia || e.razao)}</h1><p class="muted">${esc(e.razao)}${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}${e.segmento ? ' · ' + esc(e.segmento) : ''}</p></div>
      <div class="actions wrap"><button class="btn ghost" id="wEdit">${icon('edit')} Empresa</button><button class="btn ghost" id="wExp">${icon('download')} Exportar Excel</button><button class="btn ghost" id="wRep">${icon('printer')} Relatório</button><button class="btn primary" id="wDocs">${icon('upload')} Juntar documentos</button></div></div>
      <div class="tabs scroll">${TABS.map(([k, l, i]) => `<a href="#/empresa/${eid}/${k}" class="${k === T[0] ? 'on' : ''}">${l}${SCHEMAS[k] ? `<em>${count(k)}</em>` : ''}</a>`).join('')}</div>
      <div id="wsBody"></div>`;
    $('#wEdit').onclick = () => Consult.editEmpresa(e);
    $('#wDocs').onclick = () => Docs.open(e);
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
    dataTable($('#dt'), { id: coll + e.id, rows, schema: sc, filters, sortDefault: sc.key || (sc.fields.some(f => f.k === 'contrato') ? 'contrato' : null), onOpen: open, actions: `<button class="btn primary sm" id="dtNew">${icon('plus')} Novo</button>`, emptyMsg: `Nenhum registro em ${sc.titulo}. Use “Novo” ou importe a planilha.` });
    $('#dtNew').onclick = () => {
      const base = {}; if (coll === 'contratos' && e.sigla) { const n = rows.map(r => +(String(r.codigo).match(/(\d+)$/) || [0, 0])[1]).reduce((a, b) => Math.max(a, b), 0) + 1; base.codigo = `${e.sigla}-${String(n).padStart(3, '0')}`; }
      if (coll === 'achados') base.status = 'Pendente';
      UI.editRecord(coll, base, { ctx, extraBase: { empresaId: e.id } });
    };
    const k = new URLSearchParams(location.hash.split('?')[1] || '').get('k');
    if (k && coll === 'contratos') { const r = DB.get('contratos', k); r && Consult.contrato360(e, r); }
  },

  /* visão 360º do contrato: tudo que se relaciona a ele */
  /** tipo "canônico" de um documento, para casar inventário × peças do compilado */
  tipoDoc: t => /aditivo|apostil/i.test(t || '') ? 'aditivo' : /refer[eê]ncia|\bTR\b/i.test(t || '') ? 'tr' : /edital/i.test(t || '') ? 'edital' : /planilha/i.test(t || '') ? 'planilha' : /anexo/i.test(t || '') ? 'anexo' : /contrato/i.test(t || '') ? 'contrato' : 'outro',
  /** compilado (com link) que já contém a peça deste documento do inventário */
  cobertoPor(d, l) { if (d.link) return null; const k = Consult.tipoDoc(d.tipo || d.arquivo); return l.find(x => x.link && (x.pecas || []).some(p => Consult.tipoDoc(p.tipo) === k)) || null; },
  /** o que um PDF contém: várias peças num arquivo só (aditivo + contrato + TR + anexos) */
  conteudoDoc(e, c, d) {
    const T = ['Termo aditivo', 'Contrato', 'Termo de referência', 'Edital', 'Planilha de custos', 'Anexo', 'Outro'];
    const at = d.pecas || [], pega = t => at.find(x => x.tipo === t);
    const m = UI.modal({ title: 'O que este PDF contém?', sub: esc(d.arquivo || ''), body: `<p class="muted small">Marque as peças que estão neste arquivo e, se souber, a página em que cada uma começa. Assim o app sabe, por exemplo, que o contrato principal está aqui mesmo que o PDF comece pelo aditivo.</p>
      <table class="mini pecas-t"><thead><tr><th></th><th>Peça</th><th>Página inicial</th><th>Página final</th></tr></thead><tbody>${T.map((t, i) => { const x = pega(t) || {}; return `<tr><td><input type="checkbox" data-pc="${i}" ${pega(t) ? 'checked' : ''}></td><td>${t}</td><td><input class="input sm" type="number" min="1" data-pi="${i}" value="${esc(x.paginaInicial || '')}"></td><td><input class="input sm" type="number" min="1" data-pf="${i}" value="${esc(x.paginaFinal || '')}"></td></tr>`; }).join('')}</tbody></table>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="pcOk">${icon('check')} Salvar</button>` });
    $$('[data-pi],[data-pf]', m).forEach(x => x.oninput = () => { const i = x.dataset.pi ?? x.dataset.pf; if (x.value) $(`[data-pc="${i}"]`, m).checked = true; });
    $('#pcOk', m).onclick = async () => {
      const pecas = T.map((t, i) => $(`[data-pc="${i}"]`, m).checked ? { tipo: t, paginaInicial: +$(`[data-pi="${i}"]`, m).value || null, paginaFinal: +$(`[data-pf="${i}"]`, m).value || null } : null).filter(Boolean)
        .sort((a, b) => (a.paginaInicial || 999) - (b.paginaInicial || 999));
      await DB.save('documentos', { ...d, pecas, tipo: pecas.length > 1 ? 'PDF compilado' : (pecas[0]?.tipo || d.tipo) });
      UI.toast('Conteúdo do PDF registrado.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
    };
  },
  /** legenda discreta: o que falta na documentação deste contrato */
  diagArquivos(e, c, l) {
    const eAd = d => (d.pecas || []).length ? (d.pecas || []).some(x => /aditivo|apostil/i.test(x.tipo || '')) : /aditivo|apostil/i.test((d.tipo || '') + ' ' + (d.arquivo || ''));
    const temPeca = (d, re) => (d.pecas || []).some(x => re.test(x.tipo || ''));
    const eCt = d => temPeca(d, /^contrato/i) || (!eAd(d) && /contrato/i.test(d.tipo || ''));
    const lk = l.filter(d => d.link), ctOk = lk.some(eCt), adOk = lk.some(eAd), semLink = l.filter(d => !d.link && !Consult.cobertoPor(d, l)), cobertos = l.filter(d => Consult.cobertoPor(d, l));
    const temAditivo = adOk || l.some(eAd) || (c.aditivos && !isGap(c.aditivos) && /aditivo/i.test(c.aditivos));
    const msgs = [];
    if (!l.length) msgs.push('Nenhum documento deste contrato no app: junte o contrato principal e, se houver, os aditivos.');
    else if (!ctOk) msgs.push(lk.length ? `<b>Falta o contrato principal</b> no Drive — ${adOk ? 'só há termo(s) aditivo(s)' : 'os arquivos juntados não foram reconhecidos como contrato'}. Sem ele não dá para conferir objeto, cláusulas e valores originais: obtenha o PDF com o tomador e junte aqui.` : '<b>Falta o contrato principal</b> no Drive: junte o PDF do contrato original.');
    if (ctOk && temAditivo && !adOk) msgs.push('O cadastro registra aditivo, mas o PDF do aditivo não está no Drive.');
    if (semLink.length) msgs.push(`${semLink.length} documento(s) do inventário da auditoria ainda sem arquivo no Drive — clique no botão tracejado para escolher o PDF (do RAR descompactado) e anexá-lo.`);
    const ach = DB.where('achados', a => a.empresaId === e.id && a.contrato === c.codigo && achadoAberto(a) && /contrato[- ]base|contrato (principal|original)|n[aã]o (foi )?identificad[oa] (o )?contrato|pdf leg[ií]vel/i.test(a.achado || ''));
    if (cobertos.length) msgs.push(`${cobertos.length} documento(s) do inventário (${esc(cobertos.map(d => d.arquivo || d.tipo).join('; ').slice(0, 120))}) estão dentro do PDF compilado.`);
    if (ach.length && !ctOk && msgs.length) msgs.push(`Relacionado ao(s) achado(s) em aberto ${esc(ach.map(a => a.codigo).join(', '))}.`);
    const pgCt = lk.flatMap(d => (d.pecas || []).filter(x => /^contrato/i.test(x.tipo || '')).map(x => x.paginaInicial)).filter(Boolean)[0];
    if (ctOk && ach.length) msgs.push(`O contrato principal está no Drive${pgCt ? ` (a partir da pág. ${pgCt})` : ''}, então o achado ${esc(ach.map(a => a.codigo).join(', '))} pode ser concluído: <button type="button" class="link small" data-achok="${ach.map(a => a.id).join(',')}">concluir com esta evidência</button>.`);
    if (ctOk && !semLink.length) msgs.unshift('Documentação no Drive: contrato principal' + (adOk ? ' e aditivo(s)' : '') + ' presentes.');
    if (!msgs.length) msgs.push('Sem pendências de documentação.');
    return `<p class="arq-leg">${icon(ctOk && !semLink.length ? 'check' : 'alert')}<span>${msgs.join(' ')}</span></p>`;
  },
  /** arquivos do contrato no Drive do escritório (contrato, aditivos, termos…) */
  arquivosHtml(e, c, dc) {
    const ord = d => /aditivo/i.test(d.tipo || d.arquivo || '') ? 1 : /contrato/i.test(d.tipo || '') ? 0 : 2;
    const l = dc.slice().sort((a, b) => ord(a) - ord(b) || String(a.arquivo || '').localeCompare(String(b.arquivo || ''), 'pt-BR', { numeric: true }));
    const comLink = l.filter(d => d.link), sem = l.filter(d => !d.link && !Consult.cobertoPor(d, l));
    return `<div class="arq-bar"><span class="lbl">${icon('file')} Arquivos no Drive</span>
      ${comLink.map(d => `<span class="arq-w"><a class="arq" href="${esc(d.link)}" target="_blank" rel="noopener" title="${esc(d.arquivo || '')}">${icon('link')}<span><b>${(d.pecas || []).length > 1 ? 'PDF compilado' : esc((d.pecas || [])[0]?.tipo || d.tipo || 'Documento')}${d.numero ? ' ' + esc(d.numero) : ''}</b><small>${(d.pecas || []).length > 1 ? esc(d.pecas.map(x => x.tipo + (x.paginaInicial ? ' (p. ' + x.paginaInicial + (x.paginaFinal && x.paginaFinal !== x.paginaInicial ? '–' + x.paginaFinal : '') + ')' : '')).join(' · ')) : esc(d.arquivo || 'abrir no Drive')}</small></span></a><button type="button" class="arq-ed" data-dcont="${d.id}" title="Dizer o que este PDF contém (contrato, aditivo, termo de referência, anexos…)">${icon('edit')}</button></span>`).join('')}
      ${!comLink.length ? `<span class="muted small">${sem.length ? `${sem.length} documento(s) no inventário, ainda sem arquivo no Drive.` : 'Nenhum arquivo juntado a este contrato.'}</span> <button class="btn ghost xs" id="cJunt">${icon('upload')} Juntar o contrato</button>` : ''}
      ${sem.map(d => `<button type="button" class="arq falta" data-djunt="${d.id}" title="Este documento está no inventário da auditoria, mas o arquivo não está no Drive. Clique para escolher o PDF e anexá-lo.">${icon('upload')}<span><b>${esc(d.tipo || 'Documento')} — sem arquivo</b><small>${esc(d.arquivo || 'escolher o PDF')}</small></span></button>`).join('')}<input type="file" id="cDocF" hidden accept=".pdf,image/*"></div>${Consult.diagArquivos(e, c, l)}`;
  },
  /** postos contratados, com o total mensal (salário-base × quantidade e custo previsto) */
  moPostos(L) {
    const m = v => num(v) !== null ? fmtMoney(v) : '—', n = v => num(v) !== null ? fmtNum(v) : '—';
    const q = L.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), sal = L.reduce((s, r) => s + (num(r.salario) || 0) * (num(r.qtdContratada) || 0), 0), prev = L.reduce((s, r) => s + (num(r.custoPrevisto) || 0), 0);
    return `<h4 class="sec">Mão de obra — postos contratados <span class="count">${L.length}</span></h4>${L.length ? `<div class="table-wrap"><table class="mini"><thead><tr><th>Posto/função</th><th class="r">Qtd. contratada</th><th class="r">Salário-base (unitário)</th><th class="r">Salário-base × qtd.</th><th class="r">Custo previsto</th><th>Divergência/risco</th></tr></thead><tbody>
      ${L.map(r => `<tr data-rel="maoDeObra:${r.id}"><td>${esc(r.posto || '')}</td><td class="r">${n(r.qtdContratada)}</td><td class="r">${m(r.salario)}</td><td class="r">${num(r.salario) !== null && num(r.qtdContratada) !== null ? fmtMoney(num(r.salario) * num(r.qtdContratada)) : '—'}</td><td class="r">${m(r.custoPrevisto)}</td><td>${r.divergencia && !isGap(r.divergencia) ? esc(r.divergencia) : '—'}</td></tr>`).join('')}
      </tbody><tfoot><tr style="font-weight:700;border-top:2px solid var(--line-strong)"><td>Total mensal</td><td class="r">${fmtNum(q)}</td><td class="r"></td><td class="r">${sal ? fmtMoney(sal) : '—'}</td><td class="r">${prev ? fmtMoney(prev) : '—'}</td><td></td></tr></tfoot></table></div>` : '<p class="muted small">Nenhum posto cadastrado.</p>'}`;
  },
  /** linhas mensais vindas dos relatórios do DP (folha e benefícios), em ordem de competência */
  moMensal(L) {
    if (!L.length) return '';
    L = L.slice().sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)));
    const m = v => num(v) !== null ? fmtMoney(v) : '—', n = v => num(v) !== null ? fmtNum(v) : '—';
    return `<h4 class="sec">Mão de obra — custo mês a mês (Departamento Pessoal) <span class="count">${L.length}</span></h4>
      <p class="muted small" style="margin:-4px 0 8px">Uma linha por competência, com os dados dos relatórios do DP (folha de pagamento, vale-alimentação, cesta básica, vale-transporte e férias). A folha bruta só aparece nos meses em que o relatório da folha a informa. Clique na linha para ver a evidência completa.</p>
      <div class="table-wrap"><table class="mini"><thead><tr><th>Competência</th><th class="r">Postos contratados</th><th class="r">Empregados na folha</th><th class="r">Folha bruta</th><th class="r">Folha líquida</th><th class="r">Benefícios</th><th class="r">Férias</th><th class="r">Salários previstos</th><th>Divergência</th></tr></thead><tbody>
      ${L.map(r => `<tr data-rel="maoDeObra:${r.id}"><td><b>${esc(fmtComp(r.competencia))}</b></td><td class="r">${n(r.qtdContratada)}</td><td class="r">${n(r.qtdAlocada)}</td><td class="r">${m(r.custoApurado)}</td><td class="r">${m(r.liquido)}</td><td class="r">${m(r.beneficios)}</td><td class="r">${m(r.encargos)}</td><td class="r">${m(r.custoPrevisto)}</td><td>${r.divergencia ? esc(r.divergencia) : '—'}</td></tr>`).join('')}
      </tbody></table></div>`;
  },
  contrato360(e, c) {
    const volta = () => Consult.contrato360(e, DB.get('contratos', c.id) || c);
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
      ${Consult.arquivosHtml(e, c, dc)}
      <div class="detail-grid">${SCHEMAS.contratos.fields.filter(f => !['codigo'].includes(f.k)).map(f => `<div class="${f.type === 'long' ? 'full' : ''}"><span class="lbl">${esc(f.label)}</span>${f.type === 'long' && c[f.k] && !isGap(c[f.k]) ? esc(c[f.k]) : UI.cell(f, c[f.k])}</div>`).join('')}</div>
      ${mini('Achados e plano de ação', 'achados', ac, ['codigo', 'area', 'achado', 'risco', 'status'])}
      ${Superv.html(e, c)}
      ${mini('Obrigações', 'obrigacoes', ob, ['clausula', 'grupo', 'obrigacao', 'status'])}
      ${Consult.moPostos(mo.filter(r => r.origem !== 'folhaDP'))}
      ${Consult.moMensal(mo.filter(r => r.origem === 'folhaDP'))}
      ${mini('Financeiro', 'financeiro', fi, ['tipo', 'grupo', 'descricao', 'previsto', 'realizado'])}
      ${me.length ? mini('Medições', 'medicoes', me, ['competencia', 'numero', 'valorMedido', 'valorFaturado', 'glosa']) : ''}
      ${ma.length ? mini('Materiais', 'materiais', ma, ['item', 'qtdPrevista', 'qtdEntregue', 'valorTotal']) : ''}
      ${mini('Documentos', 'documentos', dc, ['tipo', 'arquivo', 'paginas', 'legibilidade'])}
      ${ad.length ? mini('Aditivos', 'aditivos', ad, ['nome', 'datas', 'valor']) : ''}`,
      foot: `<button class="btn ghost danger-text" id="cDel">${icon('trash')} Excluir</button><span class="sp"></span><button class="btn ghost" id="svRel">${icon('printer')} Relatório do contrato</button><button class="btn ghost" id="cAch">${icon('alert')} Registrar achado</button><button class="btn primary" id="cEd">${icon('edit')} Editar contrato</button>`
    });
    $('#cEd', m).onclick = () => UI.editRecord('contratos', c, { ctx: { empresaId: e.id }, voltar: volta });
    $('#cJunt', m)?.addEventListener('click', () => { UI.closeModal(); Docs.open(e); });
    $$('[data-dcont]', m).forEach(b => b.onclick = () => Consult.conteudoDoc(e, c, DB.get('documentos', b.dataset.dcont)));
    Superv.bind(m, e, c);
    $$('[data-achok]', m).forEach(b => b.onclick = async () => {
      const dcs = DB.where('documentos', d => d.empresaId === e.id && d.contrato === c.codigo && d.link);
      const ct = dcs.find(d => (d.pecas || []).some(p => Consult.tipoDoc(p.tipo) === 'contrato')) || dcs.find(d => Consult.tipoDoc(d.tipo) === 'contrato');
      const pc = (ct?.pecas || []).find(p => Consult.tipoDoc(p.tipo) === 'contrato');
      const ev = `Contrato-base localizado no Drive do escritório: ${ct?.arquivo || 'arquivo do contrato'}${pc?.paginaInicial ? `, págs. ${pc.paginaInicial}${pc.paginaFinal ? '–' + pc.paginaFinal : ''}` : ''}.`;
      if (!await UI.confirm(`Concluir ${b.dataset.achok.split(',').length} achado(s) com a evidência:<br><i>${esc(ev)}</i>`, 'Concluir', false)) return;
      await DB.save('achados', b.dataset.achok.split(',').map(id => ({ ...DB.get('achados', id), status: 'Concluído', evidenciaConclusao: ev, dataValidacao: todayISO() })));
      UI.toast('Achado concluído.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
    });
    // anexar o arquivo a um documento do inventário que ainda não está no Drive
    let alvo = null; const fArq = $('#cDocF', m);
    $$('[data-djunt]', m).forEach(b => b.onclick = () => { alvo = DB.get('documentos', b.dataset.djunt); fArq.value = ''; fArq.click(); });
    fArq && (fArq.onchange = async () => {
      const f = fArq.files[0]; if (!f || !alvo) return;
      if (!Session.remote) return UI.toast('Anexar arquivos exige o servidor conectado.', 'warn');
      const b = $(`[data-djunt="${alvo.id}"]`, m); b.disabled = true; b.querySelector('b').textContent = 'Enviando ao Drive…';
      try {
        const up = await juntarELer({ empresaKey: e.id, empresa: e.fantasia || e.razao, nome: f.name, mime: f.type || 'application/pdf', base64: await Docs.b64(f), ler: false });
        await DB.save('documentos', { ...alvo, link: up.url, arquivo: alvo.arquivo || f.name, arquivoDrive: f.name });
        UI.toast('Arquivo anexado. Já pode abrir pelo botão.'); Consult.contrato360(e, DB.get('contratos', c.id) || c);
      } catch (err) { UI.toast('Não consegui anexar: ' + err.message, 'bad', 7000); b.disabled = false; b.querySelector('b').textContent = (alvo.tipo || 'Documento') + ' — sem arquivo'; }
    });
    $('#cAch', m).onclick = () => UI.editRecord('achados', { contrato: c.codigo, status: 'Pendente' }, { ctx: { empresaId: e.id }, extraBase: { empresaId: e.id }, voltar: volta });
    $('#cDel', m).onclick = async () => { if (!await UI.confirm(`Excluir o contrato ${c.codigo}? Os registros das outras abas são mantidos.`, 'Excluir')) return; await DB.remove('contratos', c.id); UI.closeModal(); App.render(); };
    $$('[data-rel]', m).forEach(tr => tr.onclick = () => { const [coll, id] = tr.dataset.rel.split(':'); UI.editRecord(coll, DB.get(coll, id), { ctx: { empresaId: e.id }, voltar: volta }); });
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
    const vazia = !S.cs.length && !empRecs('documentos', e.id).length;
    host.innerHTML = `${vazia ? `<div class="drop-hero">${icon('upload')}<div><b>Comece juntando os documentos da empresa</b><span>Arraste a pasta com os contratos, aditivos e a planilha de auditoria: o app guarda no Drive, lê com IA, liga cada arquivo ao contrato e monta o painel.</span></div><button class="btn primary" id="heroDocs">${icon('upload')} Juntar documentos</button></div>` : ''}
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
    $('#heroDocs', host)?.addEventListener('click', () => Docs.open(e));
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
  async importar(e, file, quieto) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    let book; try { book = await XLSX.read(await file.arrayBuffer()); } catch (err) { UI.toast('Não consegui ler a planilha: ' + err.message, 'bad'); return; }
    const tdp = BenefDP.tipo(book); if (tdp) return BenefDP.importar(e, book, file, tdp);
    if (FolhaDP.reconhece(book)) return FolhaDP.importar(e, book, file);
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
    if (!found.length) { if (quieto) return 'nao'; UI.toast('Nenhuma aba reconhecida. Os nomes das colunas devem seguir o modelo da planilha de auditoria.', 'bad', 6000); return; }
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
    return UI.aguardar(m);
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
   PAINEL DE ACHADOS — o que cada achado significa e como resolver
   ===================================================================== */
const Achados = {
  view(v, q = {}) {
    App.crumbs([{ t: 'Consultoria jurídica' }, { t: 'Achados de auditoria' }]);
    const st = Achados.st = Achados.st || { risco: 'alto', status: 'abertos', emp: '', area: '', busca: '' };
    if (q.risco) st.risco = q.risco;
    const emps = DB.all('empresas'), nomeE = id => { const e = DB.get('empresas', id); return e ? (e.fantasia || e.razao) : '—'; };
    const todos = DB.all('achados');
    const filtra = a => (st.risco === 'todos' || (st.risco === 'alto' ? /alto|cr[ií]tico/i.test(a.risco || '') : norm(a.risco) === norm(st.risco)))
      && (st.status === 'todos' || (st.status === 'abertos' ? achadoAberto(a) : !achadoAberto(a)))
      && (!st.emp || a.empresaId === st.emp) && (!st.area || (a.area || 'Sem área') === st.area)
      && (!st.busca || norm([a.codigo, a.contrato, a.achado, a.criterio, a.causa, a.recomendacao, a.responsavel].join(' ')).includes(norm(st.busca)));
    const l = todos.filter(filtra).sort((a, b) => Achados.peso(b) - Achados.peso(a) || String(a.prazo || '9').localeCompare(String(b.prazo || '9')));
    const abertosAlto = todos.filter(a => achadoAberto(a) && /alto|cr[ií]tico/i.test(a.risco || ''));
    const venc = abertosAlto.filter(a => a.prazo && daysUntil(a.prazo) < 0).length, semResp = abertosAlto.filter(a => !a.responsavel).length;
    const valor = abertosAlto.reduce((s, a) => s + (num(a.valor) || 0), 0);
    const areas = [...new Set(todos.map(a => a.area || 'Sem área'))].sort();
    const porArea = {}; l.forEach(a => { const k = a.area || 'Sem área'; porArea[k] = (porArea[k] || 0) + 1; });
    v.innerHTML = `<div class="page-h"><div><span class="eyebrow">Consultoria jurídica</span><h1>${icon('alert', 'h-ic')} Achados de auditoria</h1>
        <p class="muted">Achado é uma irregularidade ou risco encontrado na auditoria dos contratos — por exemplo, obrigação trabalhista ou fiscal sem comprovação, contrato vencido, valor divergente. Cada um traz o critério violado, a causa, o risco e a ação corretiva recomendada. Resolver é: executar a recomendação, guardar a evidência e marcar como concluído.</p></div></div>
      <div class="kpis sm">${kpi('Alto/crítico em aberto', abertosAlto.length, 'exigem ação', abertosAlto.length ? 'bad' : '')}${kpi('Com prazo vencido', venc, 'entre os de risco alto', venc ? 'warn' : '')}${kpi('Sem responsável', semResp, 'defina quem resolve', semResp ? 'warn' : '')}${kpi('Valor envolvido', valor ? fmtMoneyShort(valor) : '—', 'nos de risco alto em aberto')}</div>
      <section class="card ach-guia"><header><h2>${icon('list')} Como resolver, em 4 passos</h2></header><ol>
        <li><b>Entenda</b> — leia a constatação e o critério (cláusula, lei ou norma que não foi cumprida).</li>
        <li><b>Atribua</b> — defina o responsável na empresa e um prazo realista; marque “Em andamento”.</li>
        <li><b>Corrija</b> — execute a recomendação (cobrar documento, regularizar recolhimento, aditar contrato, notificar o tomador…).</li>
        <li><b>Comprove e conclua</b> — registre a evidência (guia paga, certidão, aditivo assinado) e conclua. O achado sai do painel e entra no relatório como resolvido.</li></ol></section>
      <div class="dt-tools ach-f"><div class="search">${icon('search')}<input id="acB" type="search" placeholder="Buscar no achado, contrato, recomendação…" value="${esc(st.busca)}"></div>
        <select id="acR"><option value="alto" ${st.risco === 'alto' ? 'selected' : ''}>Risco alto e crítico</option>${RISCOS.map(r => `<option value="${r}" ${st.risco === r ? 'selected' : ''}>Risco ${r.toLowerCase()}</option>`).join('')}<option value="todos" ${st.risco === 'todos' ? 'selected' : ''}>Todos os riscos</option></select>
        <select id="acS"><option value="abertos" ${st.status === 'abertos' ? 'selected' : ''}>Em aberto</option><option value="fechados" ${st.status === 'fechados' ? 'selected' : ''}>Resolvidos</option><option value="todos" ${st.status === 'todos' ? 'selected' : ''}>Todos</option></select>
        ${emps.length > 1 ? `<select id="acE"><option value="">Todas as empresas</option>${emps.map(e => `<option value="${e.id}" ${st.emp === e.id ? 'selected' : ''}>${esc(e.fantasia || e.razao)}</option>`).join('')}</select>` : ''}
        <select id="acA"><option value="">Todas as áreas</option>${areas.map(x => `<option ${st.area === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      ${Object.keys(porArea).length > 1 ? `<div class="ach-areas">${Object.entries(porArea).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<button class="chip ${st.area === k ? 'on' : ''}" data-ar="${esc(k)}">${esc(k)} <b>${n}</b></button>`).join('')}</div>` : ''}
      <p class="muted small">${l.length} achado(s)</p>
      <div class="ach-list">${l.map(a => Achados.card(a, nomeE(a.empresaId), emps.length > 1)).join('') || `<div class="empty">${icon('check')}<p>Nenhum achado com estes filtros.</p></div>`}</div>`;
    const re = () => Achados.view(v);
    $('#acB').oninput = e => { st.busca = e.target.value; clearTimeout(Achados._t); Achados._t = setTimeout(() => { re(); const i = $('#acB'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); };
    $('#acR').onchange = e => { st.risco = e.target.value; re(); }; $('#acS').onchange = e => { st.status = e.target.value; re(); };
    $('#acE')?.addEventListener('change', e => { st.emp = e.target.value; re(); }); $('#acA').onchange = e => { st.area = e.target.value; re(); };
    $$('[data-ar]').forEach(b => b.onclick = () => { st.area = st.area === b.dataset.ar ? '' : b.dataset.ar; re(); });
    $$('[data-ac]').forEach(b => b.onclick = () => Achados.acao(b.dataset.ac, b.dataset.id, re));
  },
  peso: a => ({ 'crítico': 4, critico: 4, alto: 3, 'médio': 2, medio: 2, baixo: 1 }[norm(a.risco)] || 0),
  card(a, emp, mostraEmp) {
    const d = a.prazo ? daysUntil(a.prazo) : null, aberto = achadoAberto(a);
    const c = a.contrato && DB.where('contratos', x => x.empresaId === a.empresaId && x.codigo === a.contrato)[0];
    return `<article class="ach ${norm(a.risco)} ${aberto ? '' : 'fechado'}">
      <header><span class="pill ${/cr[ií]t/i.test(a.risco) ? 'critical' : /alto/i.test(a.risco) ? 'serious' : /m[eé]dio/i.test(a.risco) ? 'warn' : 'neutral'}">Risco ${esc((a.risco || '—').toLowerCase())}</span>
        <b class="mono">${esc(a.codigo || '')}</b>${a.area ? `<span class="tag">${esc(a.area)}</span>` : ''}${mostraEmp ? `<span class="muted small">${esc(emp)}</span>` : ''}
        <span class="sp"></span><span class="pill ${aberto ? (/andamento/i.test(a.status) ? 'info' : 'neutral') : 'good'}">${esc(a.status || 'Pendente')}</span></header>
      <p class="ach-t">${esc(a.achado || '')}</p>
      <dl class="dl cols ach-dl">
        ${a.criterio ? `<dt>Critério</dt><dd>${esc(a.criterio)}</dd>` : ''}${a.causa ? `<dt>Causa provável</dt><dd>${esc(a.causa)}</dd>` : ''}
        ${c || a.contrato ? `<dt>Contrato</dt><dd>${c ? `<button class="link" data-ac="contrato" data-id="${a.id}">${esc(a.contrato)} · ${esc(tomadorBase(c) || c.objeto || '')}</button>` : esc(a.contrato)}</dd>` : ''}${a.periodo ? `<dt>Período</dt><dd>${esc(a.periodo)}</dd>` : ''}
        ${num(a.valor) ? `<dt>Valor envolvido</dt><dd>${esc(fmtMoney(a.valor))}</dd>` : ''}
        <dt>Responsável</dt><dd>${a.responsavel ? esc(a.responsavel) : '<span class="t-warn">não definido</span>'}</dd>
        <dt>Prazo</dt><dd>${a.prazo ? `${esc(fmtDate(a.prazo))}${aberto && d !== null ? (d < 0 ? ` <b class="t-bad">vencido há ${-d} dia(s)</b>` : d <= 7 ? ` <b class="t-warn">em ${d} dia(s)</b>` : '') : ''}` : '<span class="t-warn">sem prazo</span>'}</dd>
        ${a.evidenciaConclusao ? `<dt>Evidência</dt><dd>${esc(a.evidenciaConclusao)}${a.dataValidacao ? ' · ' + esc(fmtDate(a.dataValidacao)) : ''}</dd>` : ''}</dl>
      ${a.recomendacao ? `<div class="ach-rec">${icon('check')}<div><span>O que fazer</span>${esc(a.recomendacao)}</div></div>` : ''}
      <footer>${aberto ? `${/andamento/i.test(a.status) ? '' : `<button class="btn ghost sm" data-ac="andamento" data-id="${a.id}">${icon('clock')} Em andamento</button>`}<button class="btn ghost sm" data-ac="atribuir" data-id="${a.id}">${icon('user')} Responsável e prazo</button><button class="btn primary sm" data-ac="concluir" data-id="${a.id}">${icon('check')} Concluir com evidência</button>` : `<button class="btn ghost sm" data-ac="reabrir" data-id="${a.id}">Reabrir</button>`}<span class="sp"></span><button class="btn ghost sm" data-ac="editar" data-id="${a.id}">${icon('edit')} Editar</button></footer></article>`;
  },
  acao(tipo, id, re) {
    const a = DB.get('achados', id); if (!a) return;
    const e = DB.get('empresas', a.empresaId);
    const salvar = async (campos, msg) => { await DB.save('achados', { ...a, ...campos }); UI.toast(msg); re(); };
    if (tipo === 'andamento') return salvar({ status: 'Em andamento' }, 'Achado em andamento.');
    if (tipo === 'reabrir') return salvar({ status: 'Pendente', dataValidacao: '' }, 'Achado reaberto.');
    if (tipo === 'editar') return UI.editRecord('achados', a, { ctx: { empresaId: a.empresaId }, onSaved: re });
    if (tipo === 'contrato') { const c = DB.where('contratos', x => x.empresaId === a.empresaId && x.codigo === a.contrato)[0]; return c && e && Consult.contrato360(e, c); }
    if (tipo === 'atribuir') {
      const m = UI.modal({ title: 'Responsável e prazo', sub: esc(a.codigo || ''), body: `<form class="grid-form" id="atf"><div class="fld full"><label>Responsável (na empresa ou no escritório)</label><input name="r" value="${esc(a.responsavel || '')}" placeholder="Ex.: Setor de RH da JSP — Maria"></div><div class="fld"><label>Prazo</label><input type="date" name="p" value="${esc(a.prazo || '')}"></div></form>`,
        foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="atOk">${icon('check')} Salvar</button>` });
      $('#atOk', m).onclick = () => { const f = $('#atf', m); UI.closeModal(); salvar({ responsavel: f.r.value.trim(), prazo: f.p.value, status: achadoAberto(a) && !/andamento/i.test(a.status) ? 'Em andamento' : a.status }, 'Responsável e prazo definidos.'); };
      return;
    }
    if (tipo === 'concluir') {
      const m = UI.modal({ title: 'Concluir achado', sub: esc(a.codigo || ''), body: `<p class="muted small">${esc(a.achado || '')}</p><form class="grid-form" id="cof"><div class="fld full"><label>Evidência de conclusão *</label><input name="ev" value="${esc(a.evidenciaConclusao || '')}" placeholder="Ex.: guia do FGTS de 03/2025 paga em 10/04 (anexada); aditivo nº 2 assinado"></div><div class="fld"><label>Data</label><input type="date" name="dt" value="${todayISO()}"></div></form>`,
        foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="coOk">${icon('check')} Concluir</button>` });
      $('#coOk', m).onclick = () => { const f = $('#cof', m); if (!f.ev.value.trim()) return UI.toast('Registre a evidência — é o que comprova a correção no relatório.', 'bad'); UI.closeModal(); salvar({ status: 'Concluído', evidenciaConclusao: f.ev.value.trim(), dataValidacao: f.dt.value }, 'Achado concluído.'); };
    }
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
    <div class="sign"><div class="line"></div><b>${esc(o.resp || '')}</b><span>${esc(o.oab || '')}</span><span>${esc(nomeMarca())} — ${BRAND.caption}</span></div></main>
    <footer>${esc(nomeMarca())} · ${BRAND.caption}${o.conf ? ' · Documento confidencial — uso restrito ao cliente' : ''}</footer></body></html>`;
  },
  open(e, o) { Report.mostrar(Report.build(e, o), o.titulo, `Relatorio_${(e.fantasia || e.razao).replace(/[^\w]+/g, '_')}_${todayISO()}.html`); },
  mostrar(html, titulo, arquivo) {
    const ov = document.createElement('div'); ov.className = 'report-ov';
    ov.innerHTML = `<div class="report-bar"><b>${icon('printer')} ${esc(titulo)}</b><span class="sp"></span><button class="btn primary" id="rPrint">${icon('printer')} Imprimir / salvar PDF</button><button class="btn ghost light" id="rHtml">${icon('download')} Baixar HTML</button><button class="icon-btn light" id="rClose">${icon('x')}</button></div><iframe title="Relatório"></iframe>`;
    document.body.appendChild(ov); document.body.classList.add('noscroll');
    const fr = $('iframe', ov); fr.srcdoc = html;
    $('#rPrint').onclick = () => fr.contentWindow.print();
    $('#rHtml').onclick = () => download(new Blob([html], { type: 'text/html' }), arquivo);
    $('#rClose').onclick = () => { ov.remove(); document.body.classList.remove('noscroll'); };
  },
  /* ---------- Relação de processos do escritório ---------- */
  processos(lista, { area, situacao, busca }) {
    const E = escritorio(), A = area ? AREAS[area] : null, agora = new Date();
    const titulo = A ? 'Direito ' + (A.nome === 'Cível' ? 'Civil' : A.nome) : 'Todos os processos';
    const ultMov = p => DB.where('movimentos', m => m.processoId === p.id).sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];
    const proxComp = p => DB.where('prazos', z => z.processoId === p.id && !z.concluido && String(z.data) >= todayISO()).sort((a, b) => String(a.data).localeCompare(String(b.data)))[0];
    const ordem = Object.keys(AREAS);
    const ps = lista.slice().sort((a, b) => ordem.indexOf(a.area) - ordem.indexOf(b.area) || String(a.numero).localeCompare(String(b.numero)));
    const valor = ps.reduce((s, p) => s + (num(p.valorCausa) || 0), 0), comValor = ps.filter(p => num(p.valorCausa) > 0).length;
    const ativos = ps.filter(p => (p.status || 'Ativo') === 'Ativo').length, tj = ps.filter(p => p.transito).length;
    const clientesN = new Set(ps.flatMap(p => p.clienteIds || [])).size;
    const porArea = ordem.map(k => [k, ps.filter(p => p.area === k).length]).filter(([, n]) => n);
    const filtros = [situacao && 'Situação: ' + situacao, busca && `Busca: “${busca}”`].filter(Boolean).join(' · ');
    const contato = [E.endereco, E.email, E.whatsapp && 'WhatsApp ' + E.whatsapp].filter(Boolean).map(esc).join('<span class="dot">·</span>');
    const linha = (p, i) => {
      const u = ultMov(p), z = proxComp(p), cli = (p.clienteIds || []).map(id => DB.get('clientes', id)?.nome).filter(Boolean).join(', ');
      return `<tr><td class="n">${i + 1}</td>
        <td><b class="cnj">${esc(fmtCNJ(p.numero))}</b><small>${esc([p.tribunal, p.orgao].filter(Boolean).join(' · '))}</small>${p.distribuicao ? `<small>Distribuído em ${esc(fmtDate(p.distribuicao))}</small>` : ''}</td>
        <td><b class="cli">${cli ? esc(cli) : '<i class="gap">cliente a definir</i>'}</b>${p.polo ? ` <small class="polo">${esc(p.polo)}</small>` : ''}${p.parteContraria ? `<small class="vs">× ${esc(p.parteContraria)}</small>` : ''}</td>
        <td>${esc(p.classe || '—')}${p.assunto ? `<small>${esc(p.assunto)}</small>` : ''}</td>
        <td class="r">${num(p.valorCausa) > 0 ? esc(fmtMoney(p.valorCausa)) : '—'}</td>
        <td><span class="st st-${norm(p.status || 'Ativo').replace(/\s+/g, '-')}">${esc(p.status || 'Ativo')}</span>${p.fase ? `<small>${esc(p.fase)}</small>` : ''}${p.transito ? `<small class="tj">Trânsito em ${esc(fmtDate(p.transito))}</small>` : ''}</td>
        <td>${u ? `<b class="d">${esc(fmtDate(u.data))}</b><small>${esc(String(u.titulo || '').replace(/ \((DJEN|DataJud)\)$/, '').slice(0, 70))}</small>` : '—'}${z ? `<small class="prox">Próximo: ${esc(z.tipo || '')} em ${esc(fmtDate(z.data))}</small>` : ''}</td></tr>`;
    };
    let i = 0;
    const grupos = A ? `<tbody>${ps.map(p => linha(p, i++)).join('')}</tbody>` : porArea.map(([k, n]) => `<tbody><tr class="grp"><td colspan="7">${esc(AREAS[k].nome)} <span>${n} processo(s)</span></td></tr>${ps.filter(p => p.area === k).map(p => linha(p, i++)).join('')}</tbody>`).join('');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relação de processos — ${esc(E.nome || 'Amorim Firmo')}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${Report.CSS_REL}@page{@bottom-left{content:"${String(nomeMarca()).replace(/["\\]/g, '')} — ${BRAND.caption} · Documento interno, protegido pelo sigilo profissional (Lei 8.906/94, art. 7º, II)";font:7pt Manrope,Arial,sans-serif;color:#8a8e98}}</style></head><body><div class="folha">
      <header class="cab">
        <div class="marca"><img src="${new URL(BRAND.logoDark, location.href)}" alt="">
          <div><div class="nome">${esc(nomeMarca().toUpperCase())}</div><div class="leg">${esc(BRAND.caption)}</div>
          ${E.advogado ? `<div class="resp">${esc(E.advogado)}${E.oab ? ` <span class="dot">·</span> ${esc(oabFmt(E.oab))}` : ''}</div>` : ''}${contato ? `<div class="cont">${contato}</div>` : ''}</div></div>
        <div class="doc"><div class="tipo">Relação de processos</div><h1>${esc(titulo)}</h1>${filtros ? `<div class="filt">${filtros}</div>` : ''}
          <div class="emit">Emitido em ${agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}, às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br>por ${esc(Session.user?.nome || Session.user?.email || '')}</div></div>
      </header>
      <div class="filete"></div>
      <section class="kpis">
        <div><b>${ps.length}</b><span>processo(s) relacionados</span></div>
        <div><b>${ativos}</b><span>em andamento</span></div>
        <div><b>${clientesN}</b><span>cliente(s)</span></div>
        <div><b>${valor ? esc(fmtMoneyShort(valor)) : '—'}</b><span>valor das causas${comValor < ps.length ? ` · informado em ${comValor} de ${ps.length}` : ''}</span></div>
        <div><b>${tj}</b><span>com trânsito em julgado</span></div>
      </section>
      ${!A && porArea.length > 1 ? `<div class="areas">${porArea.map(([k, n]) => `<span><i style="width:${Math.max(4, Math.round(n / ps.length * 100))}%"></i>${esc(AREAS[k].nome)} <b>${n}</b></span>`).join('')}</div>` : ''}
      <table class="rel"><thead><tr><th class="n">#</th><th style="width:25%">Processo / juízo</th><th style="width:22%">Cliente × parte contrária</th><th style="width:15%">Classe / assunto</th><th class="r">Valor da causa</th><th>Situação</th><th style="width:15%">Última movimentação</th></tr></thead>${grupos}</table>
      ${ps.length ? '' : '<p class="vazio">Nenhum processo com os filtros aplicados.</p>'}
      <p class="nota">Fontes: cadastro do escritório, DataJud (CNJ) e Diário de Justiça Eletrônico Nacional (DJEN). Valores da causa conforme informados no cadastro.</p>
      <footer><span>${esc(nomeMarca())} — ${esc(BRAND.caption)}</span><span>Documento interno · informação sigilosa protegida pelo sigilo profissional (Lei 8.906/94, art. 7º, II)</span></footer>
      </div></body></html>`;
    Report.mostrar(html, 'Relação de processos — ' + titulo, `Relacao_processos_${A ? area + '_' : ''}${todayISO()}.html`);
  },
  CSS_REL: `@page{size:A4 portrait;margin:13mm 12mm 16mm;@bottom-right{content:"Página " counter(page) " de " counter(pages);font:7.5pt Manrope,Arial,sans-serif;color:#8a8e98}}
  *{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;font:8pt/1.4 Manrope,'Helvetica Neue',Arial,sans-serif;color:#1d2433}
  .cab{display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;padding-bottom:4mm}
  .marca{display:flex;align-items:center;gap:4mm}.marca img{width:20mm;height:auto}
  .nome{font:600 18pt/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.16em;color:#121c33}
  .leg{font:600 6.4pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43;margin:1.6mm 0 2.6mm}
  .resp{font-weight:600;font-size:8pt;color:#121c33}.cont{font-size:7.2pt;max-width:95mm;color:#5d6270;margin-top:.6mm}.dot{color:#b08a4e;margin:0 1.6mm}
  .doc{text-align:right;max-width:70mm}.tipo{font:700 7pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43}
  .doc h1{font:600 17pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33;margin:1mm 0 1.2mm}.filt{font-size:8pt;color:#121c33;margin-bottom:1mm}.emit{font-size:7.6pt;color:#6b6f7b}
  .filete{height:3px;border-top:1.2pt solid #b08a4e;border-bottom:.5pt solid #b08a4e;margin-bottom:4.5mm}
  .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:3mm;margin-bottom:3.5mm}
  .kpis div{border:1px solid #e7e0d2;border-left:2.5pt solid #b08a4e;border-radius:1.6mm;padding:2.2mm 2.6mm;background:#fcfaf5}
  .kpis b{display:block;font:600 13.5pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33}.kpis span{font-size:6.8pt;line-height:1.3;display:block;color:#6b6f7b}
  .areas{display:flex;flex-wrap:wrap;gap:2mm 6mm;margin:0 0 4mm;font-size:7.8pt;color:#4a4f5c}.areas span{display:inline-flex;align-items:center;gap:1.6mm}.areas i{display:inline-block;height:2mm;min-width:3mm;max-width:22mm;background:#121c33;border-radius:1mm}.areas b{color:#121c33}
  table.rel{width:100%;border-collapse:collapse}
  .rel thead th{background:#121c33;color:#fff;font:700 6.3pt Manrope,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-align:left;padding:2.2mm 2mm;border-bottom:1.5pt solid #b08a4e}
  .rel td{padding:1.8mm 1.6mm;border-bottom:.5pt solid #e7e0d2;vertical-align:top}.rel tr{page-break-inside:avoid}
  .rel tbody tr:nth-child(even):not(.grp) td{background:#fbf9f4}
  .rel small{display:block;color:#6b6f7b;font-size:6.9pt;margin-top:.5mm}.rel .cnj{font-variant-numeric:tabular-nums;letter-spacing:.01em;white-space:nowrap}
  .rel .n{width:7mm;color:#a07c43;font-weight:700;text-align:center}.rel .r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.rel .c{text-align:center;white-space:nowrap}
  .rel .d{font-weight:600}.rel .cli{font-weight:600;color:#121c33}.rel small.polo{display:inline;margin:0}.rel .vs{color:#4a4f5c}.rel .gap{color:#a86a12}.rel .tj{color:#6a4fb3}.rel .prox{color:#1d7a63}
  .grp td{background:#f3ede0!important;font:600 11pt 'Cormorant Garamond',Georgia,serif;color:#121c33;letter-spacing:.04em;padding:2.2mm 2.4mm;border-bottom:.8pt solid #b08a4e}.grp span{font:600 7.2pt Manrope,Arial,sans-serif;color:#a07c43;letter-spacing:.12em;text-transform:uppercase;margin-left:3mm}
  .st{display:inline-block;padding:.3mm 2mm;border-radius:5mm;font-weight:700;font-size:7.2pt;background:#e5f2ec;color:#1d7a63}.st-encerrado,.st-arquivado-provisoriamente{background:#ecebe8;color:#5d6270}.st-suspenso,.st-sobrestado{background:#fbf0dc;color:#9a6b1e}
  .vazio{text-align:center;color:#6b6f7b;padding:10mm}.nota{font-size:7pt;color:#8a8e98;margin-top:3mm}
  @media print{footer{display:none!important}}
  footer{display:flex;justify-content:space-between;font-size:7pt;color:#8a8e98;border-top:.5pt solid #e7e0d2;padding-top:1.4mm}
  @media screen{body{background:#e9e6df;padding:8mm 0}.folha{background:#fff;max-width:210mm;margin:0 auto;padding:13mm 12mm 6mm;box-shadow:0 2px 16px rgba(0,0,0,.09)}footer{position:static;margin-top:5mm}}`,
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
      <section class="card p-proc"><div class="proc-tags">${pill(AREAS[p.area]?.nome || '')} ${pill(p.status || 'Ativo')} ${p.transito ? `<span class="pill tj">Transitado em julgado em ${esc(fmtDate(p.transito))}</span>` : ''}</div><h2 class="mono">${esc(fmtCNJ(p.numero))}</h2><p class="muted">${esc(p.classe || '')}${p.orgao ? ' · ' + esc(p.orgao) : ''}${p.comarca ? ' · ' + esc(p.comarca) : ''}</p>
        <dl class="dl cols"><dt>Parte contrária</dt><dd>${esc(p.parteContraria || '—')}</dd><dt>Fase</dt><dd>${esc(p.fase || '—')}</dd><dt>Advogado</dt><dd>${esc(p.responsavel || esc0.advogado || '—')}</dd><dt>Tribunal</dt><dd>${esc(p.tribunal || '—')}</dd></dl></section>
      <section class="card"><header><h2>Andamento do processo</h2></header>${ms.length ? `<ol class="timeline client">${ms.map(m => `<li><span class="tl-dot"></span><time>${esc(fmtDate(m.data))}</time><b class="tl-t">${esc(m.titulo)}</b>${m.explicacao ? `<p class="explain">${esc(m.explicacao)}</p>` : m.descricao ? `<p>${esc(DJEN.ehDecisao(m.titulo) ? DJEN.dispositivo(m.descricao).texto : m.descricao)}</p>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Ainda não há movimentações disponíveis.</p>'}</section>`;
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
  if (window.__afPopup) return; // janela de retorno do login do Google
  const splash = document.getElementById('splash'); const t0 = performance.now();
  try { await App.start(); } catch (e) { console.error(e); App.loginScreen(); }
  const wait = Math.max(0, 2300 - (performance.now() - t0));
  setTimeout(() => { splash?.classList.add('out'); setTimeout(() => splash?.remove(), 900); }, wait);
});
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
/* =====================================================================
   CONEXÃO COM O ESCRITÓRIO — como a conexão com a repartição do
   Custódia Digital. O administrador conecta UMA VEZ a conta Google do
   escritório; depois disso todos os usuários habilitados já entram
   conectados. Arquivos vão para o Drive do escritório e a IA usa a chave
   do escritório, embora todo o código fique na conta da efstech.
   ===================================================================== */
const Escritorio = {
  st: null, erro: null,
  get conectado() { return !!this.st?.conectado; },
  redirectUri: () => location.origin + location.pathname,
  async check() {
    if (!Session.remote || !Session.isStaff) return;
    try { Escritorio.st = await api('escStatus'); Escritorio.erro = null; }
    catch (e) { Escritorio.erro = e.message; if (/desconhecida/i.test(e.message)) Escritorio.st = { conectado: false, desatualizado: true }; }
    Escritorio.badge();
  },
  /** login do Google (janela) com a conta do escritório → código → servidor guarda a autorização */
  conectar() {
    if (!CONFIG.GOOGLE_CLIENT_ID) return UI.toast('Preencha o GOOGLE_CLIENT_ID no config.js.', 'bad');
    const state = 'afesc' + Math.random().toString(36).slice(2);
    ls.set('escState', state);
    const p = new URLSearchParams({ client_id: CONFIG.GOOGLE_CLIENT_ID, redirect_uri: Escritorio.redirectUri(), response_type: 'code', scope: 'https://www.googleapis.com/auth/drive.file', access_type: 'offline', prompt: 'consent select_account', include_granted_scopes: 'true', state });
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + p;
    const w = window.open(url, 'afesc', 'width=520,height=680');
    if (!w) { location.href = url; return; } // janela bloqueada: segue na mesma aba
    UI.toast('Entre com a conta Google do escritório na janela que abriu.', 'ok', 6000);
  },
  /** chamado quando a janela do Google volta com o código */
  async receber(code, state) {
    if (!code || state !== ls.get('escState')) return UI.toast('Conexão cancelada ou expirada. Tente de novo.', 'warn');
    ls.del('escState');
    try { Escritorio.st = await api('escConectar', { code, redirectUri: Escritorio.redirectUri() }); UI.toast('Conta do escritório conectada: ' + Escritorio.st.conta + '. Todos os usuários habilitados já estão conectados.', 'ok', 7000); }
    catch (e) { UI.toast(e.message, 'bad', 9000); }
    Escritorio.badge(); App.render();
  },
  /** sidebar: “Conectado ao escritório ●” (como o status da repartição no Custódia) */
  badge() {
    const h = $('#conexSlot'); if (!h) return;
    if (!Session.remote) { h.innerHTML = ''; return; }
    const s = Escritorio.st || {};
    h.innerHTML = `<div class="drive-card ${s.conectado ? 'on' : ''}"><div class="drive-row"><span class="dot ${s.conectado ? 'ok' : 'off'}"></span><div><b>${s.conectado ? 'Conectado ao escritório' : 'Escritório não conectado'}</b><small>${s.conectado ? esc(s.conta) + (s.ia ? ' · IA ativa' : '') : Escritorio.erro ? 'sem resposta do servidor' : 'Drive e IA indisponíveis'}</small></div></div>${s.conectado && s.pasta ? `<a class="side-btn mini" href="${esc(s.pasta)}" target="_blank" rel="noopener">${icon('link')} Pasta no Drive</a>` : ''}${!s.conectado && Session.isAdmin ? `<button class="side-btn mini" id="escSideBtn">Conectar</button>` : ''}</div>`;
    $('#escSideBtn')?.addEventListener('click', Escritorio.conectar);
  },
  /** tela de bloqueio enquanto o escritório não estiver conectado */
  gate(v) {
    App.crumbs([{ t: 'Conectar ao escritório' }]);
    const adm = Session.isAdmin, des = Escritorio.st?.desatualizado;
    v.innerHTML = `<div class="gate"><img src="${BRAND.logoDark}" alt="" class="gate-logo"><div class="caption dark">${BRAND.caption}</div>
      <h1>Conectar ao escritório</h1>
      ${des ? `<div class="notice">${icon('alert')}<div>O servidor (Apps Script) ainda está na versão anterior. Cole o novo <b>Codigo.gs</b> e publique uma <b>Nova versão</b> da implantação.</div></div>` : ''}
      ${adm ? `<p>Para começar, conecte a <b>conta Google do escritório</b>. Os documentos que a equipe juntar serão guardados no Google Drive dessa conta, e a leitura por IA usará a chave dela — o app só guarda os cadastros.</p>
        <ol class="steps left"><li>Clique em <b>Conectar conta do escritório</b>.</li><li>Na janela do Google, entre com <b>a conta do escritório</b> (ex.: amorimfirmo.adv@gmail.com) e clique em <b>Continuar / Permitir</b>.</li><li>Pronto: daqui em diante todos os usuários habilitados entram já conectados.</li></ol>
        <button class="btn primary big" id="gateBtn" ${des ? 'disabled' : ''}>${icon('link')} Conectar conta do escritório</button>
        <p class="muted small">O app só terá acesso aos arquivos que ele mesmo criar no Drive (permissão “drive.file”). Dá para desconectar a qualquer momento em Gestão do App › Sistema.</p>`
      : `<p>O administrador ainda não conectou a conta do escritório. Assim que ele conectar, você terá acesso automaticamente — basta recarregar esta página.</p><button class="btn ghost" id="gateRe">${icon('sync')} Verificar de novo</button>`}
    </div>`;
    $('#gateBtn')?.addEventListener('click', Escritorio.conectar);
    $('#gateRe')?.addEventListener('click', async () => { await Escritorio.check(); App.render(); });
  },
  /** cartão em Gestão do App › Sistema */
  cardHtml() {
    if (!Session.remote) return `<p class="muted small">Disponível com o servidor conectado.</p>`;
    const s = Escritorio.st || {};
    return `<p class="muted small">Como a repartição no Custódia Digital: tudo o que a equipe junta vai para o <b>Google Drive da conta do escritório</b> e a IA usa a <b>chave do escritório</b>. O código e os cadastros ficam no app (efstech).</p>
      <div class="conn"><span class="dot ${s.conectado ? 'ok' : 'off'}"></span><div><b>Google Drive do escritório</b><small>${s.conectado ? esc(s.conta) + (s.pasta ? ` · <a href="${esc(s.pasta)}" target="_blank" rel="noopener">abrir pasta</a>` : '') : 'não conectado'}</small></div><button class="btn ghost sm" id="escCon">${s.conectado ? 'Trocar conta' : 'Conectar'}</button>${s.conectado ? `<button class="btn ghost sm danger-text" id="escDes">Desconectar</button>` : ''}</div>
      <div class="conn"><span class="dot ${s.ia ? 'ok' : 'off'}"></span><div><b>IA para leitura de documentos (Gemini)</b><small>${s.ia ? 'chave do escritório configurada (' + esc(s.iaMascara) + ')' + (s.iaModelo ? ' · modelo ' + esc(s.iaModelo) + ' (escolhido automaticamente)' : '') : 'sem chave — os documentos são guardados, mas não lidos'}</small></div><button class="btn ghost sm" id="escIA">Configurar</button></div>`;
  },
  bindCard(el) {
    $('#escCon', el)?.addEventListener('click', Escritorio.conectar);
    $('#escDes', el)?.addEventListener('click', async () => {
      if (!await UI.confirm('Desconectar a conta do escritório? A equipe deixa de conseguir juntar documentos até conectar de novo. Os arquivos já guardados continuam no Drive do escritório.', 'Desconectar')) return;
      try { Escritorio.st = await api('escDesconectar'); Escritorio.badge(); App.render(); } catch (e) { UI.toast(e.message, 'bad'); }
    });
    $('#escIA', el)?.addEventListener('click', () => {
      const conta = Escritorio.st?.conta;
      const m = UI.modal({ title: 'Chave do Gemini do escritório', body: `<ol class="steps"><li>Abra o <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> entrando com a conta do escritório${conta ? ` (<b>${esc(conta)}</b>)` : ''} — a cota e o custo da IA ficam nessa conta.</li><li>Clique em <b>Create API key</b> e copie a chave.</li><li>Cole abaixo e clique em Testar e salvar.</li></ol>
        <div class="fld full"><label>Chave</label><input id="iaK" type="password" autocomplete="off" placeholder="AIza…"></div>
        <div class="notice soft">${icon('alert')}<div><b>Sigilo dos contratos:</b> no plano gratuito do Gemini, o Google pode usar o conteúdo enviado para melhorar os produtos dele. Para documentos de clientes, ative o faturamento no projeto da chave (AI Studio › Billing) — custa centavos por documento e o conteúdo deixa de ser usado pelo Google.</div></div>
        <p class="muted small">A chave fica guardada no servidor, nunca no navegador.</p>`, foot: `<button class="btn ghost danger-text" id="iaDel">Remover chave</button><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="iaOk">Testar e salvar</button>` });
      $('#iaOk', m).onclick = async () => { const b = $('#iaOk', m); b.disabled = true; b.textContent = 'Testando…'; try { Escritorio.st = await apiT('iaChave', { chave: $('#iaK').value.trim() }, 120000); UI.closeModal(); UI.toast('Chave do Gemini do escritório salva e testada' + (Escritorio.st.iaModelo ? ' · modelo ' + Escritorio.st.iaModelo : '') + '.'); App.render(true); Escritorio.badge(); } catch (err) { UI.toast(err.message, 'bad', 6000); b.disabled = false; b.textContent = 'Testar e salvar'; } };
      $('#iaDel', m).onclick = async () => { try { Escritorio.st = await api('iaChave', { chave: '' }); UI.closeModal(); App.render(true); Escritorio.badge(); } catch (err) { UI.toast(err.message, 'bad'); } };
    });
  }
};

/* retorno do login do Google (janela ou mesma aba) */
(function () {
  const q = new URLSearchParams(location.search);
  if (!q.get('state') || !/^afesc/.test(q.get('state'))) return;
  const msg = { afesc: true, code: q.get('code'), state: q.get('state'), error: q.get('error') };
  history.replaceState(null, '', location.pathname + location.hash);
  if (window.opener && window.opener !== window) { try { window.opener.postMessage(msg, location.origin); } catch { } document.documentElement.innerHTML = '<p style="font:16px sans-serif;padding:40px;text-align:center">Conta conectada. Pode fechar esta janela.</p>'; setTimeout(() => window.close(), 300); window.__afPopup = true; }
  else ls.set('escPend', msg);
})();
window.addEventListener('message', e => { if (e.origin === location.origin && e.data?.afesc) { if (e.data.error) UI.toast('Conexão cancelada.', 'warn'); else Escritorio.receber(e.data.code, e.data.state); } });
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
/* =====================================================================
   LEITURA LEVE DE PDF — mesma ideia do app Meus Concursos: o arquivo
   completo vai para o Drive, mas a IA recebe só o que importa, extraído
   aqui no navegador com o pdf.js.
   • Processos: identifica as PEÇAS PRINCIPAIS (pelo índice/marcadores do
     PDF do PJe/eproc ou pelo rodapé "Num. … - Pág. 1" e pelo título da
     peça) e manda só elas, rotuladas.
   • Contratos: primeiras e últimas páginas.
   • PDF digitalizado: imagens JPEG leves das páginas principais.
   ===================================================================== */
const PECAS = [ // ordem importa: as mais específicas primeiro
  ['Certidão de trânsito em julgado', /tr[âa]nsit[oa] em julgado/i, 'fim'],
  ['Impugnação ao cumprimento de sentença', /impugna[çc][ãa]o ao cumprimento/i],
  ['Cumprimento de sentença', /cumprimento (definitivo |provis[óo]rio )?de senten[çc]a/i],
  ['Contrarrazões', /contrarraz[õo]es|contra-raz[õo]es/i],
  ['Embargos de declaração', /embargos de declara[çc][ãa]o/i],
  ['Recurso especial / extraordinário', /recurso (especial|extraordin[áa]rio)/i],
  ['Agravo', /\bagravo\b/i],
  ['Apelação', /\bapela[çc][ãa]o\b|recurso ordin[áa]rio|recurso inominado/i],
  ['Acórdão', /\bac[óo]rd[ãa]o\b/i, 'fim'],
  ['Decisão monocrática', /decis[ãa]o monocr[áa]tica/i, 'fim'],
  ['Réplica', /r[ée]plica|impugna[çc][ãa]o [àa] contesta[çc][ãa]o/i],
  ['Petição inicial', /peti[çc][ãa]o inicial|exordial|reclama[çc][ãa]o trabalhista|den[úu]ncia|queixa-crime/i],
  ['Contestação', /contesta[çc][ãa]o|defesa pr[ée]via|resposta [àa] acusa[çc][ãa]o/i],
  ['Decisão saneadora', /saneador|saneamento|despacho saneador/i, 'fim'],
  ['Audiência de instrução', /termo de audi[êe]ncia|ata de audi[êe]ncia|audi[êe]ncia de instru[çc][ãa]o/i],
  ['Alegações finais', /alega[çc][õo]es finais|memoriais/i],
  ['Sentença', /\bsenten[çc]a\b/i, 'fim'],
  ['Alvará', /\balvar[áa]\b/i],
  ['Termo de compromisso / guarda', /termo de (compromisso|guarda)/i]
];
const PdfLeve = {
  VER: '3.11.174',
  carregar() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (PdfLeve._p) return PdfLeve._p;
    PdfLeve._p = new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfLeve.VER}/pdf.min.js`;
      s.onload = () => { let n = 0; const iv = setInterval(() => { if (window.pdfjsLib) { clearInterval(iv); try { if (!/mjs$/.test(window.pdfjsLib.GlobalWorkerOptions.workerSrc || '')) window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PdfLeve.VER}/pdf.worker.min.js`; } catch { } ok(window.pdfjsLib); } else if (++n > 50) { clearInterval(iv); falha(new Error('pdf.js indisponível')); } }, 100); };
      s.onerror = () => { PdfLeve._p = null; falha(new Error('pdf.js indisponível')); };
      document.head.appendChild(s);
    });
    return PdfLeve._p;
  },
  faixa(N, ini, fim) { const out = []; for (let i = 1; i <= N; i++) if (i <= ini || i > N - fim) out.push(i); return out; },
  classificar(t) { const s = String(t || ''); for (const [nome, re, foco] of PECAS) if (re.test(s)) return { tipo: nome, foco: foco || 'inicio' }; return null; },
  async textoPagina(pdf, i) {
    const c = await (await pdf.getPage(i)).getTextContent();
    return c.items.map(it => (it.str || '') + (it.hasEOL ? '\n' : ' ')).join('').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  },
  /** índice (marcadores) do PDF → [{pagina, titulo}] */
  async indice(pdf) {
    try {
      const out = [], ol = await pdf.getOutline(); if (!ol) return out;
      const visitar = async itens => { for (const it of itens || []) { try { let d = it.dest; if (typeof d === 'string') d = await pdf.getDestination(d); if (Array.isArray(d) && d[0]) { const pi = typeof d[0] === 'number' ? d[0] : await pdf.getPageIndex(d[0]); out.push({ pagina: pi + 1, titulo: it.title || '' }); } } catch { } await visitar(it.items); } };
      await visitar(ol);
      return out.sort((a, b) => a.pagina - b.pagina);
    } catch { return []; }
  },
  /** divide os autos em peças: [{tipo, foco, de, ate, titulo}] */
  pecas(N, inicios) {
    const lista = inicios.filter((x, i, a) => i === 0 || x.pagina !== a[i - 1].pagina);
    return lista.map((x, i) => ({ ...x, de: x.pagina, ate: (lista[i + 1]?.pagina || N + 1) - 1 }));
  },
  /** páginas a mandar de cada peça: começo e, nas decisões, o fim (dispositivo) */
  paginasDaPeca(p) {
    const n = p.ate - p.de + 1, out = new Set();
    for (let k = 0; k < Math.min(3, n); k++) out.add(p.de + k);
    const fim = p.foco === 'fim' ? 3 : 1; for (let k = 0; k < Math.min(fim, n); k++) out.add(p.ate - k);
    return [...out].sort((a, b) => a - b);
  },
  async render(pdf, i) {
    const pg = await pdf.getPage(i), v1 = pg.getViewport({ scale: 1 });
    const vp = pg.getViewport({ scale: Math.min(1.6, 1300 / v1.width) });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: ctx, viewport: vp }).promise;
    return cv.toDataURL('image/jpeg', 0.6).split(',')[1];
  },
  /**
   * Prepara o que a IA vai ler. Devolve {texto|imagens, paginas, usadas, pecas?} ou null
   * (aí o servidor manda o PDF original). o.modo: 'processo' | 'contrato'
   */
  async preparar(file, o = {}) {
    if (!/pdf/i.test(file.type || file.name)) return null;
    try {
      const pdfjs = await PdfLeve.carregar();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const N = pdf.numPages;
      if (o.modo === 'processo' && N > 12) { const r = await PdfLeve.porPecas(pdf, N); if (r) return r; }
      return await PdfLeve.porPaginas(pdf, N, o);
    } catch (e) { console.warn('Leitura leve indisponível:', e.message); return null; }
  },
  async porPaginas(pdf, N, o) {
    const ini = o.inicio ?? 25, fim = o.fim ?? 15, maxChars = o.maxChars ?? 90000;
    const pags = PdfLeve.faixa(N, ini, fim), partes = []; let comTexto = 0;
    for (const i of pags) { const t = await PdfLeve.textoPagina(pdf, i); if (t.replace(/\s/g, '').length > 150) comTexto++; partes.push(`[página ${i} de ${N}]\n${t}`); }
    if (comTexto >= Math.max(1, pags.length * 0.5)) {
      let texto = partes.join('\n\n');
      if (texto.length > maxChars) texto = texto.slice(0, Math.round(maxChars * 0.65)) + '\n\n[…trecho omitido…]\n\n' + texto.slice(-Math.round(maxChars * 0.35));
      return { texto, paginas: N, usadas: pags.length };
    }
    const ip = PdfLeve.faixa(N, o.imgInicio ?? 10, o.imgFim ?? 6), imagens = [];
    for (const i of ip) imagens.push(await PdfLeve.render(pdf, i));
    return { imagens, paginas: N, usadas: ip.length };
  },
  /** autos do processo: só as peças principais */
  async porPecas(pdf, N) {
    // 1) índice do PDF (PJe/eproc) — funciona até em PDF digitalizado
    let inicios = (await PdfLeve.indice(pdf)).map(x => ({ pagina: x.pagina, titulo: x.titulo, ...(PdfLeve.classificar(x.titulo) || {}) }));
    // 2) sem índice: texto de todas as páginas; começo de peça = rodapé "Pág. 1" ou título no topo
    const textos = {}; let comTexto = 0;
    if (!inicios.length || inicios.every(x => !x.tipo)) {
      inicios = []; const marca = {};
      for (let i = 1; i <= N; i++) {
        const t = await PdfLeve.textoPagina(pdf, i); textos[i] = t;
        if (t.replace(/\s/g, '').length > 150) comTexto++;
        marca[i] = /Num\.?\s*\d+\s*-\s*P[áa]g\.?\s*1(?!\d)/i.test(t); // rodapé do PJe: 1ª página de cada documento
      }
      const comMarca = Object.values(marca).filter(Boolean).length > 1;
      for (let i = 1; i <= N; i++) {
        const topo = textos[i].slice(0, 450), c = PdfLeve.classificar(topo);
        const linhas = topo.split('\n').map(l => l.trim()).filter(l => l.length > 4);
        if (i === 1 || (comMarca ? marca[i] : c)) inicios.push({ pagina: i, titulo: (linhas.find(l => PdfLeve.classificar(l)) || linhas[0] || '').slice(0, 90), ...(c || {}) });
      }
      if (comTexto < N * 0.3) return null; // digitalizado e sem índice: usa o modo por páginas (imagens)
    }
    const pecas = PdfLeve.pecas(N, inicios.length ? inicios : [{ pagina: 1, titulo: '' }]);
    const principais = pecas.filter(p => p.tipo);
    if (!principais.length) return null;
    const sumario = principais.map(p => `- ${p.tipo} (págs. ${p.de}–${p.ate})${p.titulo && norm(p.titulo) !== norm(p.tipo) ? ' — ' + p.titulo : ''}`).join('\n');
    const temTexto = Object.keys(textos).length ? comTexto >= N * 0.3 : (await PdfLeve.textoPagina(pdf, principais[0].de)).replace(/\s/g, '').length > 150;
    if (temTexto) {
      const orcamento = 100000, porPeca = Math.max(3500, Math.min(10000, Math.floor(orcamento / (principais.length + 1))));
      const blocos = [];
      const capa = (textos[1] ?? await PdfLeve.textoPagina(pdf, 1)).slice(0, 4000);
      blocos.push(`=== CAPA / PRIMEIRA PÁGINA ===\n${capa}`);
      for (const p of principais) {
        const pags = PdfLeve.paginasDaPeca(p); let t = '';
        for (const i of pags) t += `[pág. ${i}]\n${textos[i] ?? await PdfLeve.textoPagina(pdf, i)}\n`;
        if (t.length > porPeca) t = p.foco === 'fim' ? t.slice(0, Math.round(porPeca * 0.4)) + '\n[…]\n' + t.slice(-Math.round(porPeca * 0.6)) : t.slice(0, porPeca);
        blocos.push(`=== PEÇA: ${p.tipo.toUpperCase()} (págs. ${p.de}–${p.ate}) ===\n${t}`);
      }
      const usadas = new Set([1, ...principais.flatMap(PdfLeve.paginasDaPeca)]).size;
      return { texto: `SUMÁRIO DAS PEÇAS PRINCIPAIS IDENTIFICADAS (${principais.length} de ${pecas.length} documentos dos autos):\n${sumario}\n\n${blocos.join('\n\n')}`, paginas: N, usadas, pecas: principais.map(p => ({ tipo: p.tipo, de: p.de, ate: p.ate })) };
    }
    // digitalizado com índice: imagens da 1ª página de cada peça (e do fim das decisões)
    const pags = [...new Set([1, ...principais.flatMap(p => p.foco === 'fim' ? [p.de, p.ate] : [p.de])])].sort((a, b) => a - b).slice(0, 24);
    const imagens = []; for (const i of pags) imagens.push(await PdfLeve.render(pdf, i));
    return { imagens, sumario, paginas: N, usadas: pags.length, pecas: principais.map(p => ({ tipo: p.tipo, de: p.de, ate: p.ate })) };
  }
};
/** chamada ao servidor com tempo-limite (como no Meus Concursos): não deixa botão preso */
function apiT(action, payload, ms = 300000) {
  return Promise.race([api(action, payload), new Promise((_, falha) => setTimeout(() => falha(new Error('o servidor demorou demais para responder — tente de novo')), ms))]);
}

/**
 * Guarda o arquivo no Drive do escritório e, numa segunda chamada, pede a leitura à IA.
 * Assim o arquivo nunca se perde por demora da IA: se a leitura falhar, fica guardado e dá para “Ler de novo”.
 */
async function juntarELer(p, aviso) {
  const up = await apiT('juntar', { ...p, ler: false, leitura: null }, 240000);
  if (!p.ler) return up;
  aviso && aviso('guardado no Drive; lendo com a IA…');
  try { up.ia = await apiT('reler', { fileId: up.id, nome: p.nome, modo: p.modo, leitura: p.leitura || null, contexto: p.contexto }, 300000); }
  catch (e) { up.iaErro = /demorou/.test(e.message) ? 'a IA demorou demais (documento grande ou IA do Google ocupada) — use “Ler de novo” em alguns minutos' : e.message; }
  return up;
}
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
      body: `<p class="muted small"><b>Marque só os processos que o escritório acompanha</b> (nenhum vem marcado; a caixa do cabeçalho marca todos). O app cria o processo com tribunal, vara, classe e as partes de cada polo, busca os andamentos no DataJud e lança as intimações. Na coluna “Cliente do escritório”, escolha qual parte é o cliente: partes que já são clientes vêm marcadas (✓); nas demais, o app sugere quando as intimações dão sinal claro. O cliente é vinculado ou criado na hora — e pode ficar para depois.</p>
        <div class="table-wrap"><table class="dt"><thead><tr><th><input type="checkbox" id="djTodos" title="Marcar/desmarcar todos"></th><th>Processo</th><th>Tribunal / órgão</th><th>Classe</th><th>Partes</th><th>Cliente do escritório</th><th>Última intimação</th></tr></thead><tbody>
        ${pend.map((q, i) => `<tr><td><input type="checkbox" data-dj="${i}"></td><td class="mono">${esc(fmtCNJ(q.numero))}</td><td>${esc(q.tribunal || '')}<br><small class="muted">${esc(q.orgao || '')}</small></td><td>${esc(q.classe || '')}</td><td class="wrap"><small>${q.partes.slice(0, 4).map(p => esc(p.nome) + (p.polo ? ` <em class="muted">(${esc(p.polo)})</em>` : '')).join('<br>')}</small></td><td>${DJEN.clienteSelect(q, i)}</td><td>${esc(fmtDate(q.ultima))}<br><small class="muted">${q.intimacoes.length} intimação(ões)</small></td></tr>`).join('')}
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
/* =====================================================================
   CUSTOS SUPERVENIENTES — notas fiscais de gastos extraordinários
   (reembolso, reequilíbrio econômico-financeiro, repactuação) por contrato,
   e o RELATÓRIO DE AUDITORIA DO CONTRATO, com cópia das notas.
   ===================================================================== */
const Superv = {
  ABERTOS: /an[aá]lise|apresentado/i,
  lista: (e, c) => DB.where('supervenientes', r => r.empresaId === e.id && r.contrato === c.codigo).sort((a, b) => String(a.dataEmissao || '').localeCompare(String(b.dataEmissao || ''))),
  tom: s => /pago|^deferido$/i.test(s || '') ? 'good' : /parcial/i.test(s || '') ? 'info' : /indefer/i.test(s || '') ? 'critical' : /apresent/i.test(s || '') ? 'info' : 'warn',

  /** conferências automáticas de cada comprovante */
  alertas(r, c, e) {
    const a = [], d = isISO(r.dataEmissao) ? r.dataEmissao : null;
    if (!num(r.valor)) a.push('sem valor');
    if (!d) a.push('sem data de emissão');
    else { if (isISO(c.inicio) && d < c.inicio) a.push('emitida antes do início do contrato'); if (isISO(c.fim) && d > c.fim) a.push('emitida após o fim da vigência'); }
    const cnpjC = onlyDigits(e.cnpj);
    if (cnpjC && onlyDigits(r.cnpjDestinatario) && onlyDigits(r.cnpjDestinatario).slice(0, 8) !== cnpjC.slice(0, 8)) a.push('destinatário com CNPJ diferente da contratada');
    if (onlyDigits(r.cnpjEmitente) && cnpjC && onlyDigits(r.cnpjEmitente).slice(0, 8) === cnpjC.slice(0, 8)) a.push('emitida pela própria contratada');
    if (num(r.valor) && DB.where('supervenientes', x => x.id !== r.id && x.empresaId === r.empresaId && x.dataEmissao === r.dataEmissao && num(x.valor) === num(r.valor) && onlyDigits(x.cnpjEmitente) === onlyDigits(r.cnpjEmitente) && norm(x.numero) !== norm(r.numero)).length) a.push('outra nota do mesmo emitente, data e valor — conferir se não é compra em dobro');
    if (r.numero && DB.where('supervenientes', x => x.id !== r.id && x.empresaId === r.empresaId && norm(x.numero) === norm(r.numero) && onlyDigits(x.cnpjEmitente) === onlyDigits(r.cnpjEmitente)).length) a.push('possível duplicidade (mesmo número e emitente)');
    if (!r.justificativa) a.push('sem justificativa');
    if (r.iaObs) a.push(r.iaObs);
    return a;
  },
  totais(l) {
    const soma = f => l.reduce((s, r) => s + (num(f(r)) || 0), 0);
    return { pedido: soma(r => r.valor), deferido: soma(r => /deferido|pago/i.test(r.status || '') && !/indefer/i.test(r.status || '') ? (num(r.valorDeferido) ?? num(r.valor)) : 0), pago: soma(r => /pago/i.test(r.status || '') ? (num(r.valorDeferido) ?? num(r.valor)) : 0), analise: soma(r => Superv.ABERTOS.test(r.status || 'Em análise') ? r.valor : 0) };
  },

  /** seção na ficha do contrato */
  html(e, c) {
    const l = Superv.lista(e, c), T = Superv.totais(l);
    return `<h4 class="sec">Custos supervenientes <span class="count">${l.length}</span><span class="sp"></span><button type="button" class="btn primary xs" id="svAdd">${icon('upload')} Juntar notas fiscais</button></h4>
      <p class="muted small">Notas fiscais e comprovantes de gastos extraordinários ou imprevisíveis, não cobertos pelo contrato, para pedir reembolso, reequilíbrio ou repactuação à Administração.</p>
      ${l.length ? `<div class="sv-tot"><span>Documentos <b>${l.length}</b></span><span>Valor total <b>${esc(fmtMoney(T.pedido))}</b></span><span class="x">Pedido <b>${esc(fmtMoney(T.pedido))}</b></span><span>Em análise <b>${esc(fmtMoney(T.analise))}</b></span><span>Deferido <b>${esc(fmtMoney(T.deferido))}</b></span><span>Pago <b>${esc(fmtMoney(T.pago))}</b></span></div>
      <div class="table-wrap"><table class="mini sv-t"><thead><tr><th>Data</th><th>Documento</th><th>Emitente</th><th>Anotação / conferência</th><th class="r">Valor</th><th>Natureza</th><th>Situação</th><th></th></tr></thead><tbody>
      ${l.map(r => { const al = Superv.alertas(r, c, e); return `<tr data-sv="${r.id}"><td>${esc(fmtDate(r.dataEmissao) || '—')}</td><td>${esc(r.tipoDoc || '')} ${esc(r.numero || '')}${r.link ? ` <a href="${esc(r.link)}" target="_blank" rel="noopener" class="link small" onclick="event.stopPropagation()">abrir</a>` : ''}</td><td>${esc(r.emitente || '—')}</td><td class="wrap">${esc([r.anotacao && '✍ ' + r.anotacao, r.descricao].filter(Boolean).join(' · ') || '—')}${al.length ? `<br>${al.map(x => `<span class="sv-al">${icon('alert')} ${esc(x)}</span>`).join(' ')}` : ''}</td><td class="r mono">${esc(fmtMoney(r.valor) || '—')}</td><td><small>${esc((r.natureza || '').split(' (')[0])}</small></td><td><span class="pill ${Superv.tom(r.status)}">${esc(r.status || 'Em análise')}</span></td><td>${icon('edit')}</td></tr>`; }).join('')}
      </tbody></table></div>` : ''}`;
  },
  bind(m, e, c) {
    $('#svAdd', m)?.addEventListener('click', () => Superv.dialog(e, c));
    $('#svRel', m)?.addEventListener('click', () => Superv.relatorioDialog(e, c));
    $$('[data-sv]', m).forEach(tr => tr.onclick = () => UI.editRecord('supervenientes', DB.get('supervenientes', tr.dataset.sv), { ctx: { empresaId: e.id }, voltar: () => Consult.contrato360(e, DB.get('contratos', c.id) || c) }));
  },

  /* ---------- juntar notas ---------- */
  dialog(e, c) {
    const nat = SCHEMAS.supervenientes.fields.find(f => f.k === 'natureza').opts;
    const m = UI.modal({ title: 'Juntar notas fiscais e comprovantes', sub: `${esc(c.codigo)} · ${esc(c.unidade || c.tomador || '')}`, wide: true, body: `
      <div class="drop" id="svDrop">${icon('upload')}<b>Arraste aqui as notas fiscais</b><span>PDF (pode ter várias notas, escaneadas), fotos ou o XML da NF-e. O arquivo vai para o Drive do escritório e a IA separa as notas e lê de cada uma só o essencial: número, data, emitente, valor total e a anotação à mão (local/contrato). Depois você confere e indica o contrato de cada uma.</span><div class="btn-row center"><label class="btn ghost sm">Escolher arquivos<input type="file" id="svF" multiple hidden accept=".pdf,.xml,image/*"></label></div></div>
      <ul class="dfiles" id="svList"></ul>
      <form class="grid-form" id="svf"><div class="fld"><label>Natureza do pedido</label><select name="nat">${nat.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="fld"><label>Situação</label><select name="st">${SCHEMAS.supervenientes.fields.find(f => f.k === 'status').opts.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="fld full"><label>Justificativa (vale para as notas deste envio; dá para ajustar uma a uma depois)</label><textarea name="jus" rows="3" placeholder="Ex.: compras de EPIs e gêneros para cestas básicas exigidas pela CCT 2026, não previstas na planilha de custos…"></textarea></div></form>`,
      foot: `<span class="muted small" id="svN"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="svGo" disabled>${icon('sparkle')} Juntar e ler</button>` });
    let files = [];
    const draw = () => { $('#svList', m).innerHTML = files.map(x => `<li><span>${icon('file')} ${esc(x.f.name)}</span><small class="${x.cls || ''}">${esc(x.st || '')}</small></li>`).join(''); $('#svN', m).textContent = files.length ? files.length + ' arquivo(s)' : ''; $('#svGo', m).disabled = !files.length; };
    const add = fl => { files.push(...[...fl].filter(f => f.size).map(f => ({ f }))); draw(); };
    $('#svF', m).onchange = ev => add(ev.target.files);
    const dz = $('#svDrop', m); dz.ondragover = ev => { ev.preventDefault(); dz.classList.add('over'); }; dz.ondragleave = () => dz.classList.remove('over'); dz.ondrop = ev => { ev.preventDefault(); dz.classList.remove('over'); add(ev.dataTransfer.files); };
    $('#svGo', m).onclick = async () => {
      if (!Session.remote) return UI.toast('Juntar notas exige o servidor conectado.', 'warn');
      const f = $('#svf', m), base = { natureza: f.nat.value, status: f.st.value, justificativa: f.jus.value.trim() };
      $('#svGo', m).disabled = true; const notas = [];
      const contratos = empRecs('contratos', e.id).map(x => ({ codigo: x.codigo, local: [x.tomador, x.unidade].filter(y => y && !isGap(y)).join(' / ') }));
      for (const x of files) {
        const set = (st, cls) => { x.st = st; x.cls = cls; draw(); };
        try {
          if (x.f.size > 30 * 1048576) throw new Error('acima de 30 MB');
          const xml = /\.xml$/i.test(x.f.name) ? await x.f.text() : null, nfe = xml ? Superv.lerXML(xml) : null;
          set('guardando no Drive do escritório…', 'busy');
          const up = await apiT('juntar', { modo: 'nf', empresaKey: e.id, empresa: e.fantasia || e.razao, nome: x.f.name, mime: x.f.type || (xml ? 'text/xml' : 'application/pdf'), base64: await Docs.b64(x.f), ler: false }, 240000);
          const doArq = { fileId: up.id, link: up.url, arquivo: x.f.name, mime: x.f.type || (xml ? 'text/xml' : 'application/pdf') };
          if (nfe) { notas.push({ ...nfe, ...doArq }); set('XML lido', 'ok'); continue; }
          if (xml) throw new Error('XML não reconhecido como NF-e — junte o PDF da nota');
          // páginas como imagem, em lotes, para a IA separar e ler cada nota
          let pags = [];
          if (/pdf/i.test(x.f.type || x.f.name)) {
            const pdfjs = await PdfLeve.carregar(), pdf = await pdfjs.getDocument({ data: new Uint8Array(await x.f.arrayBuffer()) }).promise;
            const N = Math.min(pdf.numPages, 80); if (pdf.numPages > 80) set(`lendo as primeiras 80 de ${pdf.numPages} páginas…`, 'busy');
            for (let p = 1; p <= N; p++) pags.push({ p, get: () => PdfLeve.render(pdf, p) });
          } else pags.push({ p: 1, get: () => Superv.imgJPEG(x.f) });
          let lidas = 0, falhas = 0;
          for (let i = 0; i < pags.length; i += 4) {
            const lote = pags.slice(i, i + 4);
            set(`lendo páginas ${lote[0].p}–${lote[lote.length - 1].p} de ${pags.length} com a IA…`, 'busy');
            try {
              const imagens = []; for (const pg of lote) imagens.push(await pg.get());
              const r = await apiT('lerNotas', { imagens, paginas: lote.map(pg => pg.p), contratos }, 300000);
              (r.notas || []).filter(n => n && (n.numero || n.valorTotal || n.emitente)).forEach(n => { notas.push({ ...n, ...doArq }); lidas++; });
            } catch (err) { falhas++; notas.push({ ...doArq, paginaInicial: lote[0].p, paginaFinal: lote[lote.length - 1].p, observacoes: 'A IA não leu estas páginas (' + err.message + '): preencha à mão.', falhou: true }); }
          }
          set(`${lidas} nota(s) lida(s)${falhas ? ` · ${falhas} lote(s) sem leitura` : ''}`, falhas ? 'err' : 'ok');
        } catch (err) { set('erro: ' + err.message, 'err'); }
      }
      if (!notas.length) return UI.toast('Nenhuma nota para registrar.', 'warn');
      Superv.revisar(e, c, Superv.juntarContinuacoes(notas), base);
    };
  },
  /** nota que continua na página seguinte ("folha 2/2") vem às vezes em duas entradas: junta */
  juntarContinuacoes(l) {
    const out = [];
    for (const n of l) {
      const ant = out[out.length - 1];
      if (ant && n.fileId === ant.fileId && n.numero && norm(n.numero) === norm(ant.numero) && onlyDigits(n.cnpjEmitente) === onlyDigits(ant.cnpjEmitente)) { ant.paginaFinal = Math.max(ant.paginaFinal || 0, n.paginaFinal || n.paginaInicial || 0); ant.valorTotal = ant.valorTotal || n.valorTotal; continue; }
      out.push(n);
    }
    return out;
  },
  imgJPEG(file) {
    return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 1500 / im.width), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res(cv.toDataURL('image/jpeg', 0.75).split(',')[1]); }; im.onerror = () => rej(new Error('imagem ilegível')); im.src = u; });
  },
  /** contrato sugerido para a nota: o que a IA indicou ou o que casa com o local/anotação */
  sugerir(n, cs, padrao) {
    if (n.contratoSugerido && cs.some(x => x.codigo === n.contratoSugerido)) return n.contratoSugerido;
    const txt = norm([n.anotacao, n.localEntrega, n.municipioDestinatario].filter(Boolean).join(' ')), tk = txt.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    let best = null, bs = 0;
    for (const x of cs) { const alvo = norm([x.tomador, x.unidade].filter(y => y && !isGap(y)).join(' ')); const sc = tk.filter(w => alvo.includes(w)).length; if (sc > bs) { bs = sc; best = x.codigo; } }
    return best || padrao;
  },
  revisar(e, c, notas, base) {
    const cs = empRecs('contratos', e.id).sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric: true }));
    notas.forEach(n => n._ct = Superv.sugerir(n, cs, c.codigo));
    const raiz = onlyDigits(e.cnpj).slice(0, 8);
    const tot = notas.reduce((s, n) => s + (num(n.valorTotal) || 0), 0);
    const m = UI.modal({ title: 'Conferir as notas lidas', sub: `${notas.length} nota(s) · ${esc(fmtMoney(tot))} — indique o contrato de cada uma`, wide: true, body: `
      <p class="muted small">Marque as notas que entram no pedido. O contrato vem sugerido pela anotação à mão ou pelo local de entrega; ajuste se precisar. Depois de salvar, cada nota pode ser corrigida na ficha do contrato.</p>
      <div class="table-wrap"><table class="mini sv-rev"><thead><tr><th><input type="checkbox" id="srT" checked></th><th>Pág.</th><th>Nota</th><th>Emitente</th><th>Destinatário</th><th>Anotação / local</th><th class="r">Valor</th><th>Contrato</th></tr></thead><tbody>
      ${notas.map((n, i) => { const rd = onlyDigits(n.cnpjDestinatario).slice(0, 8); return `<tr class="${n.falhou ? 'falhou' : ''}"><td><input type="checkbox" data-sr="${i}" ${n.falhou ? '' : 'checked'}></td><td>${esc(n.paginaInicial || '')}${n.paginaFinal && n.paginaFinal !== n.paginaInicial ? '–' + esc(n.paginaFinal) : ''}</td>
        <td>${esc(n.tipoDoc || '')} ${esc(n.numero || '—')}<br><small>${esc(fmtDate(n.dataEmissao) || '')}</small></td><td>${esc(n.emitente || '—')}</td>
        <td>${esc(n.destinatario || '—')}${rd && raiz && rd !== raiz ? `<br><span class="sv-al">${icon('alert')} CNPJ diferente da contratada</span>` : ''}</td>
        <td>${esc([n.anotacao && '✍ ' + n.anotacao, n.localEntrega || n.municipioDestinatario].filter(Boolean).join(' · ') || '—')}${n.observacoes ? `<br><small class="t-warn">${esc(n.observacoes)}</small>` : ''}</td>
        <td class="r mono">${esc(fmtMoney(n.valorTotal) || '—')}</td>
        <td><select class="input sm" data-sc="${i}">${cs.map(x => `<option value="${esc(x.codigo)}" ${x.codigo === n._ct ? 'selected' : ''}>${esc(x.codigo)} · ${esc(String(x.unidade && !isGap(x.unidade) ? x.unidade : x.tomador || '').slice(0, 34))}</option>`).join('')}</select></td></tr>`; }).join('')}
      </tbody></table></div>`,
      foot: `<span class="muted small" id="srN"></span><span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="srOk">${icon('check')} Registrar notas marcadas</button>` });
    const conta = () => { const k = $$('[data-sr]:checked', m).length; $('#srN', m).textContent = `${k} de ${notas.length} marcada(s)`; $('#srOk', m).disabled = !k; };
    $('#srT', m).onchange = ev => { $$('[data-sr]', m).forEach(x => x.checked = ev.target.checked); conta(); }; $$('[data-sr]', m).forEach(x => x.onchange = conta); conta();
    $('#srOk', m).onclick = async () => {
      const recs = $$('[data-sr]:checked', m).map(x => { const i = +x.dataset.sr, n = notas[i]; return { ...base, empresaId: e.id, contrato: $(`[data-sc="${i}"]`, m).value, tipoDoc: n.tipoDoc || 'NF-e', numero: n.numero || '', serie: n.serie || '', dataEmissao: parseDate(n.dataEmissao) || '', emitente: n.emitente || '', cnpjEmitente: onlyDigits(n.cnpjEmitente), destinatario: n.destinatario || '', cnpjDestinatario: onlyDigits(n.cnpjDestinatario), localEntrega: '', anotacao: n.anotacao || '', valor: num(n.valorTotal) || '', descricao: '', chave: onlyDigits(n.chaveAcesso), iaObs: n.observacoes || '', link: n.link, fileId: n.fileId, arquivo: n.arquivo, mime: n.mime, paginaInicial: n.paginaInicial || null, paginaFinal: n.paginaFinal || n.paginaInicial || null }; });
      await DB.save('supervenientes', recs);
      const porCt = {}; recs.forEach(r => porCt[r.contrato] = (porCt[r.contrato] || 0) + 1);
      UI.toast(`${recs.length} nota(s) registrada(s): ${Object.entries(porCt).map(([k, v]) => `${k} (${v})`).join(', ')}.`, 'ok', 8000);
      Consult.contrato360(e, DB.get('contratos', c.id) || c);
    };
  },
  /** NF-e (XML) lida no próprio navegador */
  lerXML(txt) {
    try {
      const d = new DOMParser().parseFromString(txt, 'text/xml'), g = (sel, el = d) => el.getElementsByTagName(sel)[0]?.textContent?.trim() || '';
      const inf = d.getElementsByTagName('infNFe')[0]; if (!inf) return null;
      const emit = d.getElementsByTagName('emit')[0], dest = d.getElementsByTagName('dest')[0];
      return { tipoDoc: 'NF-e', numero: g('nNF'), serie: g('serie'), dataEmissao: (g('dhEmi') || g('dEmi')).slice(0, 10), emitente: emit ? g('xNome', emit) : '', cnpjEmitente: emit ? g('CNPJ', emit) || g('CPF', emit) : '', destinatario: dest ? g('xNome', dest) : '', cnpjDestinatario: dest ? g('CNPJ', dest) || g('CPF', dest) : '', valorTotal: num(g('vNF')), chaveAcesso: (inf.getAttribute('Id') || '').replace(/^NFe/, ''), observacoes: null };
    } catch { return null; }
  },

  /* ---------- relatório de auditoria do contrato ---------- */
  relatorioDialog(e, c) {
    const E = escritorio();
    const m = UI.modal({ title: 'Relatório de auditoria do contrato', sub: `${esc(c.codigo)} · ${esc(c.unidade || c.tomador || '')}`, body: `<form class="grid-form" id="rcf">
      <div class="fld full"><label>Parecer / conclusão do auditor</label><textarea name="par" rows="5" placeholder="Conclusões, riscos e recomendações para este contrato…"></textarea></div>
      <div class="fld"><label>Responsável técnico</label><input name="resp" value="${esc(E.advogado || '')}"></div><div class="fld"><label>OAB</label><input name="oab" value="${esc(oabFmt(E.oab))}"></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="anexo" checked><span></span>Anexar cópia das notas fiscais e comprovantes (busca os arquivos no Drive)</label></div>
      <div class="fld check full"><label class="switch"><input type="checkbox" name="obr" checked><span></span>Incluir a lista de obrigações contratuais</label></div></form>`,
      foot: `<span class="sp"></span><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="rcOk">${icon('printer')} Gerar relatório</button>` });
    $('#rcOk', m).onclick = async () => {
      const f = $('#rcf', m), o = { parecer: f.par.value.trim(), resp: f.resp.value.trim(), oab: f.oab.value.trim(), anexo: f.anexo.checked, obr: f.obr.checked };
      const b = $('#rcOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Montando…';
      try { await Superv.relatorio(e, c, o, t => b.innerHTML = icon('sync', 'spin') + ' ' + esc(t)); UI.closeModal(); }
      catch (err) { UI.toast(err.message, 'bad', 7000); b.disabled = false; b.innerHTML = icon('printer') + ' Gerar relatório'; }
    };
  },
  async copias(l, prog) {
    const out = [], cache = {};
    for (const [i, r] of l.entries()) {
      prog && prog(`Preparando cópia ${i + 1} de ${l.length}…`);
      const it = { r, imgs: [], erro: '' };
      try {
        if (!r.fileId) throw new Error('sem arquivo no Drive');
        const f = cache[r.fileId] = cache[r.fileId] || await apiT('baixar', { fileId: r.fileId }, 120000), mime = f.mime || r.mime || '';
        if (/image\//.test(mime)) it.imgs.push(`data:${mime};base64,${f.base64}`);
        else if (/pdf/.test(mime) || /\.pdf$/i.test(r.arquivo || '')) {
          if (!f.pdf) { const pdfjs = await PdfLeve.carregar(); f.pdf = await pdfjs.getDocument({ data: Uint8Array.from(atob(f.base64), ch => ch.charCodeAt(0)) }).promise; }
          const ini = Math.max(1, r.paginaInicial || 1), fim = Math.min(f.pdf.numPages, r.paginaFinal || (r.paginaInicial ? r.paginaInicial : Math.min(3, f.pdf.numPages)));
          for (let p = ini; p <= Math.min(fim, ini + 3); p++) it.imgs.push('data:image/jpeg;base64,' + await PdfLeve.render(f.pdf, p));
          if (r.paginaInicial) it.pags = `pág. ${ini}${fim > ini ? '–' + fim : ''} de ${r.arquivo || 'arquivo'}`;
        } else if (/xml/.test(mime) || /\.xml$/i.test(r.arquivo || '')) it.xml = Superv.lerXML(decodeURIComponent(escape(atob(f.base64))));
      } catch (err) { it.erro = err.message; }
      out.push(it);
    }
    return out;
  },
  async relatorio(e, c, o, prog) {
    const E = escritorio(), rel = coll => DB.where(coll, r => r.empresaId === e.id && r.contrato === c.codigo);
    const ac = rel('achados'), ob = rel('obrigacoes'), mo = rel('maoDeObra'), dc = rel('documentos'), sv = Superv.lista(e, c), T = Superv.totais(sv);
    const v = x => x === null || x === undefined || x === '' ? '—' : isGap(x) ? '<i class="gap">não identificado</i>' : esc(x);
    const dt = (l, k) => `<div><dt>${l}</dt><dd>${k}</dd></div>`;
    const d = isISO(c.fim) ? daysUntil(c.fim) : null;
    const copias = o.anexo && sv.length ? await Superv.copias(sv, prog) : [];
    prog && prog('Montando o relatório…');
    let n = 0; const H = t => `<h2><span>${++n}.</span> ${esc(t)}</h2>`;
    const tbl = (h, rows, cls = '') => `<table class="t ${cls}"><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    const diag = Consult.diagArquivos(e, c, dc).replace(/<button[^>]*>.*?<\/button>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
    const porNat = {}; sv.forEach(r => { const k = (r.natureza || 'Outro'); porNat[k] = (porNat[k] || 0) + (num(r.valor) || 0); });
    const corpo = `
      <div class="capa"><div class="tipo">Relatório de auditoria contratual</div><h1>Contrato ${esc(c.numero && !isGap(c.numero) ? c.numero : c.codigo)}</h1>
        <p class="sub">${esc(c.tomador || '')}${c.unidade && !isGap(c.unidade) && !norm(c.tomador).includes(norm(c.unidade)) ? ' — ' + esc(c.unidade) : ''}</p>
        <p class="meta">Contratada: <b>${esc(e.razao || '')}</b>${e.cnpj ? ' · CNPJ ' + esc(fmtDoc(e.cnpj)) : ''}<br>Identificação interna: ${esc(c.codigo)} · Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
      <div class="kp"><div><b>${c.fim ? esc(fmtDate(c.fim)) : '—'}</b><span>fim da vigência${d !== null ? (d < 0 ? ` · expirada há ${-d} dias` : ` · ${d} dias restantes`) : ''}</span></div><div><b>${num(c.valorMensal) ? esc(fmtMoneyShort(c.valorMensal)) : '—'}</b><span>valor mensal</span></div><div><b>${ac.filter(achadoAberto).length}</b><span>achados em aberto</span></div><div><b>${esc(fmtMoneyShort(T.pedido) || 'R$ 0')}</b><span>custos supervenientes pedidos</span></div></div>
      ${H('Identificação do contrato')}<dl class="dl">${dt('Nº do contrato / processo', v(c.numero))}${dt('Tomador', v(c.tomador))}${dt('CNPJ do tomador', v(c.cnpjTomador && fmtDoc(c.cnpjTomador)))}${dt('Unidade / local', v(c.unidade))}${dt('Início', v(fmtDate(c.inicio)))}${dt('Fim da vigência', v(fmtDate(c.fim)))}${dt('Prazo / prorrogação', v(c.prazo))}${dt('Valor mensal', v(fmtMoney(c.valorMensal)))}${dt('Valor anual estimado', v(fmtMoney(c.valorAnual)))}${dt('Reajuste', v(c.reajuste))}${dt('Convenção coletiva', v(c.cct))}${dt('Fiscal / gestor', v(c.fiscal))}</dl>
      ${c.objeto && !isGap(c.objeto) ? `<p><b>Objeto.</b> ${esc(c.objeto)}</p>` : ''}${c.aditivos && !isGap(c.aditivos) ? `<p><b>Aditivos e alterações.</b> ${esc(c.aditivos)}</p>` : ''}
      ${H('Documentação analisada')}${dc.length ? tbl(['Documento', 'Conteúdo', 'Arquivo'], dc.map(x => [esc(x.tipo || 'Documento') + (x.numero ? ' ' + esc(x.numero) : ''), esc((x.pecas || []).map(p => p.tipo + (p.paginaInicial ? ` (p. ${p.paginaInicial}${p.paginaFinal ? '–' + p.paginaFinal : ''})` : '')).join(' · ') || '—'), (x.link ? `<a href="${esc(x.link)}">${esc(x.arquivo || 'Drive')}</a>` : esc(x.arquivo || '—') + ' <i class="gap">(sem arquivo no Drive)</i>')])) : '<p class="muted">Nenhum documento registrado.</p>'}
      <p class="nota">${esc(diag)}</p>
      ${mo.length ? H('Mão de obra contratada') + tbl(['Posto', 'Qtd.', 'Salário', 'Custo previsto'], mo.map(x => [esc(x.posto || ''), esc(x.qtdContratada ?? ''), esc(fmtMoney(x.salario) || '—'), esc(fmtMoney(x.custoPrevisto) || '—')]), 'num') : ''}
      ${H('Achados e plano de ação')}${ac.length ? tbl(['Código', 'Achado', 'Risco', 'Recomendação', 'Situação'], ac.sort((a, b) => Achados.peso(b) - Achados.peso(a)).map(x => [esc(x.codigo || ''), esc(x.achado || ''), `<b class="rk ${norm(x.risco)}">${esc(x.risco || '')}</b>`, esc(x.recomendacao || '—'), esc(x.status || '') + (x.evidenciaConclusao ? `<br><small>${esc(x.evidenciaConclusao)}</small>` : '')])) : '<p class="muted">Nenhum achado registrado.</p>'}
      ${o.obr && ob.length ? H('Obrigações contratuais') + tbl(['Cláusula', 'Obrigação', 'Situação'], ob.map(x => [esc(x.clausula || ''), esc(x.obrigacao || ''), esc(x.status || '—')])) : ''}
      ${H('Custos supervenientes (reembolso, reequilíbrio e repactuação)')}
      ${sv.length ? `<p>Foram apresentados <b>${sv.length}</b> documento(s) de comprovação de gastos, totalizando <b>${esc(fmtMoney(T.pedido))}</b>: em análise ${esc(fmtMoney(T.analise))}, deferido ${esc(fmtMoney(T.deferido))}, pago ${esc(fmtMoney(T.pago))}.</p>
        ${tbl(['Natureza', 'Documentos', 'Valor'], Object.entries(porNat).map(([k, x]) => [esc(k), String(sv.filter(r => (r.natureza || 'Outro') === k).length), esc(fmtMoney(x))]), 'num')}
        ${tbl(['#', 'Data', 'Documento', 'Emitente', 'Anotação / justificativa', 'Valor', 'Situação', 'Conferência'], sv.map((r, i) => { const al = Superv.alertas(r, c, e); return [`${i + 1}`, esc(fmtDate(r.dataEmissao) || '—'), `${esc(r.tipoDoc || '')} ${esc(r.numero || '')}`, `${esc(r.emitente || '—')}${r.cnpjEmitente ? `<br><small>${esc(fmtDoc(r.cnpjEmitente))}</small>` : ''}`, `${esc([r.anotacao, r.descricao].filter(Boolean).join(' · ') || '—')}${r.justificativa ? `<br><small><i>${esc(r.justificativa)}</i></small>` : ''}`, `<span class="nw">${esc(fmtMoney(r.valor) || '—')}</span>${num(r.valorDeferido) ? `<br><small>deferido ${esc(fmtMoney(r.valorDeferido))}</small>` : ''}`, esc(r.status || 'Em análise') + (r.protocolo ? `<br><small>${esc(r.protocolo)}</small>` : ''), al.length ? `<span class="al">${al.map(esc).join('; ')}</span>` : '<span class="ok">sem apontamentos</span>']; }))}` : '<p class="muted">Nenhum custo superveniente registrado para este contrato.</p>'}
      ${o.parecer ? H('Parecer') + `<div class="parecer">${esc(o.parecer).replace(/\n/g, '<br>')}</div>` : ''}
      <div class="assin1"><span></span><b>${esc(o.resp || '')}</b>${esc(o.oab || '')}<br>${esc(nomeMarca())} — ${esc(BRAND.caption)}</div>
      ${copias.length ? `<section class="anexos"><h2 class="ax">Anexo — cópia dos comprovantes</h2>${copias.map((x, i) => `<figure class="cp"><figcaption>Comprovante ${i + 1} — ${esc(x.r.tipoDoc || '')} ${esc(x.r.numero || '')} · ${esc(x.r.emitente || '')} · ${esc(fmtMoney(x.r.valor) || '')} · ${esc(fmtDate(x.r.dataEmissao) || '')}${x.pags ? ` <i>(${esc(x.pags)})</i>` : ''}${x.erro ? ` <i>(${esc(x.erro)})</i>` : ''}</figcaption>${x.imgs.map(s => `<img src="${s}" alt="">`).join('')}${x.xml ? Superv.danfe(x.xml) : ''}${!x.imgs.length && !x.xml ? `<p class="muted">Cópia indisponível${x.r.link ? ` — <a href="${esc(x.r.link)}">abrir no Drive</a>` : ''}.</p>` : ''}</figure>`).join('')}</section>` : ''}`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Auditoria — ${esc(c.codigo)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>${Superv.CSS}@page{@bottom-left{content:"${nomeMarca().replace(/["\\]/g, '')} — ${BRAND.caption} · Relatório de auditoria do contrato ${String(c.codigo).replace(/["\\]/g, '')}";font:7pt Manrope,Arial,sans-serif;color:#8a8e98}}</style></head><body>
      <table class="pg"><thead><tr><td><div class="tb"><img src="${new URL(BRAND.logoDark, location.href)}" alt=""><div><div class="n">${esc(nomeMarca().toUpperCase())}</div><div class="l">${esc(BRAND.caption)}</div></div></div></td></tr></thead><tbody><tr><td>${corpo}</td></tr></tbody></table></body></html>`;
    Report.mostrar(html, 'Relatório de auditoria — ' + c.codigo, `Auditoria_${String(c.codigo).replace(/[^\w-]+/g, '_')}_${todayISO()}.html`);
  },
  danfe(x) {
    return `<div class="danfe"><div class="dh"><b>NF-e nº ${esc(x.numero)}${x.serie ? ' · série ' + esc(x.serie) : ''}</b><span>Emissão ${esc(fmtDate(x.dataEmissao) || '')}</span></div>
      <p><b>Emitente:</b> ${esc(x.emitente)} — ${esc(fmtDoc(x.cnpjEmitente))}<br><b>Destinatário:</b> ${esc(x.destinatario)} — ${esc(fmtDoc(x.cnpjDestinatario))}${x.chaveAcesso ? `<br><b>Chave de acesso:</b> <span class="mono">${esc(x.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim())}</span>` : ''}</p>

      <p class="r"><b>Valor total da nota: ${esc(fmtMoney(x.valorTotal))}</b></p><p class="muted small">Representação simplificada do XML da NF-e, para conferência — não substitui o DANFE.</p></div>`;
  },
  CSS: `@page{size:A4;margin:12mm 14mm 16mm;@bottom-right{content:"Página " counter(page) " de " counter(pages);font:7.5pt Manrope,Arial,sans-serif;color:#8a8e98}}
  *{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;font:9pt/1.5 Manrope,'Helvetica Neue',Arial,sans-serif;color:#1d2433}
  table.pg{width:100%;border-collapse:collapse}table.pg>thead td{padding:0 0 5mm}
  .tb{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1.5mm;border-bottom:1.2pt solid #b08a4e;padding-bottom:3mm}.tb img{width:13mm}.tb .n{font:600 14pt/1 'Cormorant Garamond',Georgia,serif;letter-spacing:.2em;color:#121c33}.tb .l{font:600 6pt Manrope,Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#a07c43;margin-top:1.2mm}
  .capa{margin:5mm 0 5mm;text-align:center}.capa .tipo{font:700 7pt Manrope,Arial,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#a07c43}.capa h1{font:600 22pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33;margin:1.5mm 0}.capa .sub{font-size:11pt;margin:0 0 2mm;color:#121c33}.capa .meta{font-size:8.5pt;color:#5d6270;margin:0}
  .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-bottom:4mm}.kp div{border:1px solid #e7e0d2;border-left:2.5pt solid #b08a4e;border-radius:1.6mm;padding:2.4mm 3mm;background:#fcfaf5}.kp b{display:block;font:600 14pt/1.1 'Cormorant Garamond',Georgia,serif;color:#121c33}.kp span{font-size:7.4pt;color:#6b6f7b}
  h2{font:600 13pt 'Cormorant Garamond',Georgia,serif;color:#121c33;border-bottom:.6pt solid #d9c49a;padding-bottom:1.2mm;margin:6mm 0 2.5mm;page-break-after:avoid}h2 span{color:#b08a4e;margin-right:1.5mm}
  .dl{display:grid;grid-template-columns:repeat(3,1fr);gap:2mm 5mm;margin:0 0 3mm}.dl dt{font-size:7pt;letter-spacing:.06em;text-transform:uppercase;color:#8a8e98}.dl dd{margin:0;font-weight:500}
  .t{width:100%;border-collapse:collapse;margin:1.5mm 0 3mm;font-size:8pt}.t th{background:#121c33;color:#fff;text-align:left;font-weight:600;padding:1.6mm 2mm;font-size:7pt;letter-spacing:.04em;text-transform:uppercase}.t td{border-bottom:.5pt solid #ece6da;padding:1.5mm 2mm;vertical-align:top}.t tr{page-break-inside:avoid}.t small{color:#6b6f7b}.t.num td:not(:first-child){text-align:right}.nw{white-space:nowrap}
  .gap{color:#9a6b1e}.muted{color:#6b6f7b}.nota{font-size:8pt;color:#5d6270;background:#faf7f0;border-left:2pt solid #b08a4e;padding:2mm 3mm}.al{color:#a8461e;font-size:7.5pt}.ok{color:#1d7a63;font-size:7.5pt}.rk.alto,.rk.critico{color:#b4233c}.rk.medio{color:#a86a12}
  .parecer{border-left:2.5pt solid #b08a4e;background:#faf7f0;padding:3mm 4mm}.assin1{width:85mm;margin:14mm auto 0;text-align:center;font-size:8.5pt;page-break-inside:avoid}.assin1 span{display:block;border-top:.8pt solid #1d2433;margin-bottom:1.5mm}.assin1 b{display:block}
  .anexos{page-break-before:always}h2.ax{margin-top:0}.cp{margin:0 0 6mm;page-break-inside:avoid}.cp figcaption{font-weight:600;color:#121c33;margin-bottom:2mm;font-size:8.5pt}.cp img{display:block;max-width:100%;max-height:235mm;margin:0 auto 3mm;border:.5pt solid #ddd}
  .danfe{border:.8pt solid #121c33;padding:3mm;border-radius:1mm}.danfe .dh{display:flex;justify-content:space-between;border-bottom:.6pt solid #ccc;padding-bottom:1.5mm;margin-bottom:2mm}.danfe .r{text-align:right}.mono{font-family:monospace}
  @media screen{body{background:#e9e6df;padding:8mm 0}table.pg{background:#fff;max-width:210mm;margin:0 auto;box-shadow:0 2px 16px rgba(0,0,0,.09)}table.pg td{padding-left:14mm;padding-right:14mm}table.pg>thead td{padding-top:12mm}table.pg>tbody td{padding-bottom:16mm}}`
};
/* =====================================================================
   FOLHA DE PAGAMENTO (DP) — lê o "Relatório da Folha de Pagamento" do
   Departamento Pessoal e preenche os campos que a auditoria já tem:
   Mão de obra (alocados × contratados, custo da folha) e Obrigações
   (execução com os postos e pagamento dos salários).
   ===================================================================== */
const FolhaDP = {
  MESES: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],

  /** a planilha é um relatório de folha? (cabeçalho com DEPARTAMENTO + VALOR LÍQUIDO) */
  reconhece(book) {
    return Object.values(book).some(rows => FolhaDP.cabecalho(rows) >= 0);
  },
  cabecalho(rows) {
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const h = Array.from(rows[i] || [], norm);
      if (h.some(c => c.startsWith('departamento')) && h.some(c => c.includes('liquido'))) return i;
    }
    return -1;
  },

  /** "006/2025", "013_2025", "04014001-24", "4801.4032.2025", 310140082025 → "6/2025" etc. */
  chave(s) {
    s = String(s ?? '').trim(); if (!s || s === '-') return null;
    let m = s.match(/^(.*\d)\s*[\/_.\-]\s*(\d{4}|\d{2})$/);
    if (m) { const b = onlyDigits(m[1]).replace(/^0+/, ''); if (b) return b + '/' + (m[2].length === 2 ? '20' + m[2] : m[2]); }
    const d = onlyDigits(s); m = d.match(/^(\d+?)(20\d\d)$/);
    if (m && d.length >= 6) return m[1].replace(/^0+/, '') + '/' + m[2];
    return null;
  },
  /** chaves de um contrato do app (campo nº contrato/processo pode trazer mais de um número) */
  chavesContrato(c) {
    const out = new Set();
    String(c.numero || '').split(/[,;|\s]+(?:e\s+)?|\s+[–-]\s+/).forEach(t => { const k = FolhaDP.chave(t.replace(/^n[ºo°.]*/i, '')); k && out.add(k); });
    (String(c.numero || '').match(/\d[\d.]*\s*[\/_\-]\s*\d{2,4}/g) || []).forEach(t => { const k = FolhaDP.chave(t); k && out.add(k); });
    return out;
  },
  codDep: d => (String(d || '').match(/^\s*0*(\d+(?:\.\d+)?)/) || [])[1] || null,

  /** competência pela aba: "SETEMBRO_2026", "13º SALÁRIO_1º PARCELA" (+ título "… - 09.2026") */
  competencia(nome, rows) {
    const n = norm(nome), topo = rows.slice(0, 8).flat().filter(x => typeof x === 'string').join(' ');
    const ano = (n.match(/20\d\d/) || topo.match(/20\d\d/) || [new Date().getFullYear()])[0];
    if (/13/.test(n) && /salario|parcela/.test(n)) { const p = /2\s*[ºoa°]?\s*parcela/.test(n) ? 2 : 1; return { comp: `${ano}-${p === 2 ? '12' : '11'}`, decimo: p }; }
    const mi = FolhaDP.MESES.findIndex(m => n.includes(m));
    if (mi >= 0) return { comp: `${ano}-${String(mi + 1).padStart(2, '0')}` };
    const t = topo.match(/(\d{2})[.\/](20\d\d)/); if (t) return { comp: `${t[2]}-${t[1]}` };
    return null;
  },

  /** lê todas as abas mensais → linhas { aba, comp, decimo, contrato, esfera, dep, cod, cct, colab, bruto, liquido, envio, aprovacao, previsao, pago, saldo } */
  ler(book) {
    const linhas = [];
    for (const [nome, rows] of Object.entries(book)) {
      if (/consolidado/.test(norm(nome))) continue;
      const hi = FolhaDP.cabecalho(rows); if (hi < 0) continue;
      const cp = FolhaDP.competencia(nome, rows); if (!cp) continue;
      const h = Array.from(rows[hi] || [], norm), col = f => h.findIndex(f);
      const C = {
        contrato: col(c => c.includes('contrato')), esfera: col(c => c.startsWith('esfera')), dep: col(c => c.startsWith('departamento')), cct: col(c => c === 'cct'),
        colab: col(c => c.includes('colaborador')), bruto: col(c => c.includes('bruto')), liquido: col(c => c.includes('liquido')),
        envio: col(c => c.includes('envio')), aprovacao: col(c => c.includes('aprovacao')), previsao: col(c => c.includes('previsao')),
        pago: col(c => c.includes('pgto realizado') || c.includes('pagamento realizado')), saldo: col(c => c.includes('saldo'))
      };
      const g = (r, k) => C[k] >= 0 ? r[C[k]] : undefined;
      for (const r of rows.slice(hi + 1)) {
        const dep = String(g(r, 'dep') ?? '').trim();
        if (!dep || /^total/i.test(dep) || /^total/i.test(String(g(r, 'contrato') ?? ''))) continue;
        const v = k => { const x = num(g(r, k)); return x === null ? null : x; };
        const dt = k => { const x = g(r, k); return x === undefined || x === null || x === '' ? '' : parseDate(x) || ''; };
        const l = { aba: nome, comp: cp.comp, decimo: cp.decimo || 0, contrato: g(r, 'contrato'), chave: FolhaDP.chave(g(r, 'contrato')), esfera: String(g(r, 'esfera') ?? '').trim(), dep, cod: FolhaDP.codDep(dep), cct: g(r, 'cct'), colab: v('colab'), bruto: v('bruto'), liquido: v('liquido'), envio: dt('envio'), aprovacao: dt('aprovacao'), previsao: dt('previsao'), pago: v('pago'), saldo: v('saldo') };
        if (!(l.liquido || l.bruto || l.colab || l.pago)) continue; // linha zerada
        if (l.decimo && (l.envio || l.aprovacao)) l.comp = (l.envio || l.aprovacao).slice(0, 7); // 13º: mês em que foi processado
        linhas.push(l);
      }
    }
    // abas antigas não trazem o nº do contrato: usa o código do departamento das abas que trazem
    const porCod = {};
    linhas.forEach(l => { if (l.chave && l.cod && !porCod[l.cod]) porCod[l.cod] = l.chave; });
    linhas.forEach(l => { if (!l.chave && l.cod && porCod[l.cod]) l.chave = porCod[l.cod]; });
    return linhas;
  },

  idDe(...p) { let h = 0; const s = p.join('|'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return 'fdp' + (h >>> 0).toString(36) + s.length.toString(36); },

  /** 5º dia útil (segunda a sábado, sem feriados) do mês seguinte à competência — CLT art. 459, § 1º */
  limitePgto(comp) {
    const [y, m] = comp.split('-').map(Number); const d = new Date(y, m, 1, 12); let n = 0;
    for (;;) { if (d.getDay() !== 0 && ++n === 5) break; d.setDate(d.getDate() + 1); }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /** linhas da folha de um contrato → { meses (folha mensal por competência), decimo } */
  resumir(ls) {
    const M = {}, D = [];
    ls.forEach(l => {
      if (l.decimo) { D.push(l); return; }
      const x = M[l.comp] = M[l.comp] || { comp: l.comp, colab: 0, temColab: false, bruto: 0, temBruto: true, liq: 0, pago: 0, saldo: 0, data: '', envio: '', aprovacao: '', cct: '', abas: new Set(), deps: new Set() };
      if (l.colab !== null) { x.colab += l.colab; x.temColab = true; }
      if (l.bruto === null) x.temBruto = false; else x.bruto += l.bruto;
      x.liq += l.liquido || 0; x.pago += l.pago || 0;
      x.saldo += l.saldo !== null ? l.saldo : Math.max(0, (l.liquido || 0) - (l.pago || 0));
      const d = l.previsao || l.aprovacao || ''; if (d > x.data) x.data = d;
      if (l.envio > x.envio) x.envio = l.envio; if (l.aprovacao > x.aprovacao) x.aprovacao = l.aprovacao;
      if (l.cct && l.cct !== '-' && !x.cct) x.cct = String(l.cct);
      x.abas.add(l.aba); x.deps.add(l.dep);
    });
    const meses = Object.values(M).sort((a, b) => a.comp.localeCompare(b.comp));
    meses.forEach(x => { if (!x.temBruto) x.bruto = null; x.limite = FolhaDP.limitePgto(x.comp); x.atraso = !!x.data && x.data > x.limite; });
    return { meses, decimo: D };
  },

  /** registros de Mão de obra (um por competência) e atualização das Obrigações do contrato */
  preencher(e, c, ls) {
    const { meses, decimo } = FolhaDP.resumir(ls);
    const postos = DB.where('maoDeObra', r => r.empresaId === e.id && r.contrato === c.codigo && r.origem !== 'folhaDP');
    const qtd = postos.reduce((s, r) => s + (num(r.qtdContratada) || 0), 0), prev = postos.reduce((s, r) => s + (num(r.salario) || 0) * (num(r.qtdContratada) || 0), 0); // salários-base previstos × postos
    const mo = meses.map(x => {
      const div = [];
      if (qtd && x.temColab && x.colab < qtd) div.push(`${fmtNum(qtd - x.colab)} posto(s) sem empregado na folha (${fmtNum(x.colab)} de ${fmtNum(qtd)})`);
      if (qtd && x.temColab && x.colab > qtd) div.push(`${fmtNum(x.colab - qtd)} empregado(s) além dos postos contratados`);
      if (x.saldo > 0) div.push('saldo de salários a pagar ' + fmtMoney(x.saldo));
      if (x.atraso) div.push(`pagamento após o 5º dia útil (${fmtDate(x.data)}; limite ${fmtDate(x.limite)})`);
      const id = FolhaDP.idDe(e.id, 'mo', c.codigo, x.comp);
      return BenefDP.compor({ ...(DB.get('maoDeObra', id) || {}),
        id, empresaId: e.id, contrato: c.codigo, competencia: x.comp, origem: 'folhaDP',
        posto: BenefDP.POSTO, deps: [...new Set(ls.filter(l => l.comp === x.comp && l.cod).map(l => l.cod))], cct: x.cct ? 'CCT ' + x.cct : '',
        qtdContratada: qtd || null, qtdAlocada: x.temColab ? x.colab : null, custoApurado: x.bruto, bruto: x.bruto, liquido: +x.liq.toFixed(2), custoPrevisto: prev || null,
        divFolha: div.join('; '),
        evFolha: `Relatório da Folha de Pagamento (DP), aba ${[...x.abas].join(', ')} — ${[...x.deps].join(', ')}: líquido ${fmtMoney(x.liq)}, pago ${fmtMoney(x.pago)}${x.envio ? ', enviada à controladoria em ' + fmtDate(x.envio) : ''}${x.aprovacao ? ', aprovada em ' + fmtDate(x.aprovacao) : ''}${x.bruto === null ? ' (o relatório deste mês não traz o valor bruto)' : ''}${prev ? `. Custo previsto = salários-base dos postos contratados (${fmtMoney(prev)})` : ''}`
      });
    });
    // ---------- Obrigações ----------
    const obs = DB.where('obrigacoes', r => r.empresaId === e.id && r.contrato === c.codigo);
    const periodo = meses.length ? `${fmtComp(meses[0].comp)} a ${fmtComp(meses[meses.length - 1].comp)}` : '';
    const ult = [...meses].reverse().find(x => x.temColab);
    const marca = '[Folha DP]';
    const juntar = (antigo, novo) => { const a = String(antigo || '').split('\n').filter(t => !t.startsWith(marca)).join('\n').trim(); return (/n[aã]o verificad|n[aã]o apresentad/i.test(a) || !a ? '' : a + '\n') + marca + ' ' + novo; };
    const upd = [];
    // execução com os postos contratados
    const exec = obs.filter(r => r.grupo === 'Mão de obra' || /dedica[cç][aã]o exclusiva|postos|aloca[cç]|efetivo/i.test(r.obrigacao || ''));
    if (ult && exec.length) {
      const oc = qtd ? ult.colab / qtd : null;
      const st = oc === null ? null : oc >= 0.95 ? 'Cumprido' : oc >= 0.5 ? 'Parcialmente cumprido' : 'Não cumprido';
      const serie = meses.filter(x => x.temColab).map(x => `${fmtComp(x.comp)}: ${fmtNum(x.colab)}`).join(' · ');
      exec.forEach(r => upd.push({ ...r,
        verificado: juntar(r.verificado, `Colaboradores na folha de pagamento por competência (${periodo}): ${serie}.${qtd ? ` Postos contratados: ${fmtNum(qtd)}.` : ' Postos contratados não cadastrados na aba Mão de obra.'}`),
        qtdPrevista: qtd ? String(qtd) : r.qtdPrevista, qtdRealizada: `${fmtNum(ult.colab)} (${fmtComp(ult.comp)})`,
        ...(st ? { status: st, desvio: ult.colab < qtd ? `${fmtNum(qtd - ult.colab)} posto(s) sem empregado na folha em ${fmtComp(ult.comp)}` : '', impacto: st === 'Cumprido' ? r.impacto : (oc < 0.8 ? 'Alto' : 'Médio') } : {}),
        evidencia: r.evidencia || 'Relatório da Folha de Pagamento (DP)'
      }));
    }
    // pagamento dos salários
    if (meses.length) {
      const liq = meses.reduce((s, x) => s + x.liq, 0), pago = meses.reduce((s, x) => s + x.pago, 0), sald = meses.filter(x => x.saldo > 0), atr = meses.filter(x => x.atraso);
      const st = sald.length ? 'Não cumprido' : atr.length ? 'Parcialmente cumprido' : 'Cumprido';
      const desvio = [sald.length && 'saldo a pagar: ' + sald.map(x => `${fmtComp(x.comp)} ${fmtMoney(x.saldo)}`).join(', '), atr.length && 'pago após o 5º dia útil: ' + atr.map(x => `${fmtComp(x.comp)} (${fmtDate(x.data)})`).join(', ')].filter(Boolean).join('; ');
      let ver = `Folha líquida ${periodo}: ${fmtMoney(liq)}; pago ${fmtMoney(pago)}.${decimo.length ? ` 13º salário: ${decimo.map(l => `${l.decimo}ª parcela ${fmtMoney(l.liquido || l.bruto || 0)}${l.saldo ? ' (saldo ' + fmtMoney(l.saldo) + ')' : ''}`).join(', ')}.` : ''} ${meses.some(x => x.data) ? ` Datas de pagamento/aprovação: ${meses.filter(x => x.data).map(x => `${fmtComp(x.comp)} ${fmtDate(x.data)}`).join(' · ')}.` : ''}`;
      ver = ver.replace(/\s+/g, ' ').trim();
      const sal = obs.filter(r => /sal[aá]ri|remunera[cç]|folha de pagamento/i.test(r.obrigacao || ''));
      const base = { verificado: ver, qtdRealizada: `${meses.length} competência(s)`, status: st, desvio, impacto: sald.length ? 'Alto' : atr.length ? 'Médio' : 'Baixo', valorPrevisto: +liq.toFixed(2), valorRealizado: +pago.toFixed(2) };
      if (sal.length) sal.forEach(r => upd.push({ ...r, ...base, verificado: juntar(r.verificado, ver) }));
      else upd.push({ id: FolhaDP.idDe(e.id, 'ob', c.codigo), empresaId: e.id, contrato: c.codigo, clausula: 'CLT, art. 459, § 1º', grupo: 'Trabalhista', obrigacao: 'Pagar os salários dos empregados alocados no contrato até o 5º dia útil do mês seguinte', frequencia: 'Mensal', qtdPrevista: `${meses.length} competência(s)`, unidade: 'folha', responsavel: 'Contratada', evidencia: 'Relatório da Folha de Pagamento (DP), comprovantes de crédito', origem: 'folhaDP', ...base, verificado: marca + ' ' + ver });
    }
    return { mo, ob: upd.map(r => derive('obrigacoes', r)), meses };
  },

  async importar(e, book, file) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    const linhas = FolhaDP.ler(book);
    if (!linhas.length) { UI.toast('Reconheci o relatório de folha, mas não encontrei linhas com valores.', 'bad', 6000); return; }
    const contratos = empRecs('contratos', e.id), mapa = {};
    contratos.forEach(c => FolhaDP.chavesContrato(c).forEach(k => { (mapa[k] = mapa[k] || []).push(c); }));
    const grupos = {};
    linhas.forEach(l => {
      const k = l.cod || l.dep; const g = grupos[k] = grupos[k] || { k, dep: l.dep, esfera: l.esfera, chave: l.chave, numero: l.contrato, linhas: [] };
      g.linhas.push(l); if (!g.chave && l.chave) g.chave = l.chave; if ((!g.numero || g.numero === '-') && l.contrato) g.numero = l.contrato; if (!g.esfera && l.esfera) g.esfera = l.esfera;
    });
    const G = Object.values(grupos).sort((a, b) => (+a.k || 0) - (+b.k || 0));
    G.forEach(g => { const cs = g.chave ? mapa[g.chave] || [] : []; g.auto = cs.length === 1 ? cs[0].id : ''; });
    const comps = [...new Set(linhas.filter(l => !l.decimo).map(l => l.comp))].sort();
    const ok = G.filter(g => g.auto), sem = G.filter(g => !g.auto);
    const opts = sel => `<option value="">— não lançar —</option>${contratos.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt', { numeric: true })).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.codigo)}${c.numero ? ' · nº ' + esc(c.numero) : ''} — ${esc(c.unidade || c.tomador || '')}</option>`).join('')}`;
    const ult = g => g.linhas.filter(l => !l.decimo).sort((a, b) => b.comp.localeCompare(a.comp))[0] || g.linhas[0];
    const linha = g => { const u = ult(g); return `<tr><td><b>${esc(g.dep)}</b><small class="muted" style="display:block">${esc(g.esfera || '')}${g.numero && g.numero !== '-' ? ' · contrato ' + esc(g.numero) : ''}</small></td><td class="r">${u.colab !== null ? fmtNum(u.colab) : '—'}</td><td class="r">${u.liquido !== null ? fmtMoney(u.liquido) : '—'}</td><td><select data-fdp="${esc(g.k)}">${opts(g.auto)}</select></td></tr>`; };
    const tab = list => `<div class="table-wrap"><table class="dt"><thead><tr><th>Departamento (planilha)</th><th class="r">Colab. (últ.)</th><th class="r">Líquido (últ.)</th><th>Contrato no app</th></tr></thead><tbody>${list.map(linha).join('')}</tbody></table></div>`;
    const m = UI.modal({
      title: 'Folha de pagamento (DP)', sub: esc(file.name), wide: true,
      body: `<p class="muted">Competências: <b>${comps.map(fmtComp).join(', ')}</b>. Cada departamento foi ligado ao contrato pelo <b>nº do contrato</b> (confira e ajuste se preciso). Em cada contrato serão preenchidos:</p>
        <ul class="muted small" style="margin:0 0 10px 18px"><li><b>Mão de obra</b> — uma linha por competência: qtd. alocada (colaboradores na folha) × qtd. contratada (soma dos postos), custo apurado (folha bruta) × custo previsto, CCT, divergências (postos vagos, saldo a pagar, pagamento após o 5º dia útil) e evidência.</li>
        <li><b>Obrigações</b> — a obrigação de execução com os postos recebe o que foi verificado, a quantidade realizada e o status; a de pagamento dos salários recebe valores previsto (líquido) e realizado (pago), desvios e status (é criada se não existir).</li></ul>
        <p class="muted small">Importar de novo atualiza as mesmas linhas, sem duplicar.</p>
        <h4 class="sec">Ligados a contratos do app <span class="count">${ok.length}</span></h4>${ok.length ? tab(ok) : '<p class="muted small">Nenhum departamento corresponde ao nº de um contrato cadastrado nesta empresa.</p>'}
        <details ${ok.length ? '' : 'open'}><summary class="sec">Sem contrato correspondente no app <span class="count">${sem.length}</span> <small class="muted">— contratos não cadastrados, feristas, administrativo…</small></summary>${sem.length ? tab(sem) : ''}</details>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="fdpOk">${icon('upload')} Preencher</button>`
    });
    const conta = () => { const n = new Set($$('[data-fdp]', m).map(s => s.value).filter(Boolean)).size; $('#fdpOk', m).innerHTML = `${icon('upload')} Preencher ${n} contrato(s)`; $('#fdpOk', m).disabled = !n; };
    $$('[data-fdp]', m).forEach(s => s.onchange = conta); conta();
    $('#fdpOk', m).onclick = async () => {
      const b = $('#fdpOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Preenchendo…';
      const porC = {};
      $$('[data-fdp]', m).forEach(s => { if (s.value && grupos[s.dataset.fdp]) (porC[s.value] = porC[s.value] || []).push(...grupos[s.dataset.fdp].linhas); });
      const MO = [], OB = [];
      for (const [cid, ls] of Object.entries(porC)) { const c = DB.get('contratos', cid); if (!c) continue; const r = FolhaDP.preencher(e, c, ls); MO.push(...r.mo); OB.push(...r.ob); }
      // lançamentos da versão anterior (financeiro e mão de obra por departamento) são substituídos
      const velhos = DB.where('financeiro', r => r.empresaId === e.id && r.origem === 'folhaDP').map(r => r.id); if (velhos.length) await DB.remove('financeiro', velhos);
      const novos = new Set(MO.map(r => r.id)), vm = DB.where('maoDeObra', r => r.empresaId === e.id && r.origem === 'folhaDP' && !novos.has(r.id) && !BenefDP.temBenef(r) && Object.keys(porC).some(id => DB.get('contratos', id)?.codigo === r.contrato)).map(r => r.id); if (vm.length) await DB.remove('maoDeObra', vm);
      const deps = { ...(e.dpDeps || {}) }; $$('[data-fdp]', m).forEach(s => { const g = grupos[s.dataset.fdp], c = s.value && DB.get('contratos', s.value); if (g && c && /^\d/.test(g.k)) deps[g.k] = c.codigo; });
      const nums = { ...(e.dpNums || {}) }; G.forEach(g => { if (/^\d/.test(g.k) && g.chave && g.numero && g.numero !== '-') nums[g.k] = String(g.numero); });
      await DB.save('empresas', { ...DB.get('empresas', e.id), dpDeps: deps, dpNums: nums });
      if (MO.length) await DB.save('maoDeObra', MO); if (OB.length) await DB.save('obrigacoes', OB);
      UI.closeModal(); UI.toast(`Folha aplicada em ${Object.keys(porC).length} contrato(s): ${MO.length} linhas de mão de obra e ${OB.length} obrigações preenchidas.`, 'ok', 6000); App.render();
    };
    return UI.aguardar(m);
  }
};
/* =====================================================================
   RELATÓRIOS DO DP — vale-alimentação, cesta básica, vale-transporte e
   férias. Preenchem os campos já existentes: Mão de obra (benefícios,
   encargos/provisões, benefícios comprovados, divergência, evidência)
   e Obrigações (benefícios e férias).
   ===================================================================== */
const BenefDP = {
  POSTO: 'Total do contrato — Departamento Pessoal (folha e benefícios)',
  NOME: { va: 'Vale-alimentação', cesta: 'Cesta básica', vt: 'Vale-transporte', ferias: 'Férias' },
  MESES: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],

  temBenef: r => ['va', 'vt', 'cesta', 'ferias'].some(k => num(r[k]) !== null && r[k] !== undefined),

  /** monta os campos visíveis da linha de mão de obra a partir das partes (folha + benefícios) */
  compor(r) {
    const v = k => num(r[k]);
    const bs = ['va', 'cesta', 'vt'].filter(k => v(k) !== null);
    r.beneficios = bs.length ? +bs.reduce((s, k) => s + v(k), 0).toFixed(2) : null;
    r.encargos = v('ferias') !== null ? v('ferias') : null;
    const div = [r.divFolha], ev = [r.evFolha];
    const qa = v('qtdAlocada');
    if (v('vaQtd') !== null && qa) { if (v('vaQtd') < qa * 0.95) div.push(`${fmtNum(qa - v('vaQtd'))} empregado(s) da folha sem vale-alimentação (${fmtNum(v('vaQtd'))} de ${fmtNum(qa)})`); }
    if (r.va !== undefined && r.va !== null) ev.push(`Vale-alimentação: ${fmtMoney(r.va)}${v('vaQtd') !== null ? ` para ${fmtNum(v('vaQtd'))} empregado(s)` : ''}${r.vaDia ? ` (valor por dia: ${typeof r.vaDia === 'number' ? fmtMoney(r.vaDia) : r.vaDia})` : ''}`);
    if (r.cesta !== undefined && r.cesta !== null) ev.push(`Cesta básica: ${fmtMoney(r.cesta)}${v('cestaQtd') !== null ? ` para ${fmtNum(v('cestaQtd'))} empregado(s)` : ''}${r.cestaUnit ? ` (cesta ${fmtMoney(r.cestaUnit)})` : ''}`);
    if (r.vt !== undefined && r.vt !== null) ev.push(`Vale-transporte: recarga ${fmtMoney(r.vt)}${v('vtDevido') !== null ? `, devido ${fmtMoney(r.vtDevido)}` : ''}`);
    if (r.ferias !== undefined && r.ferias !== null) ev.push(!num(r.ferias) ? 'Férias: nenhuma paga no mês' : `Férias pagas: ${fmtMoney(r.ferias)}${v('feriasQtd') ? ` para ${fmtNum(v('feriasQtd'))} empregado(s)` : ''}`);
    r.divergencia = div.filter(Boolean).join('; ');
    r.evidencia = ev.filter(Boolean).join(' | ');
    if (bs.length) r.benefComprovados = r.divergencia.includes('sem vale-alimentação') ? 'Parcial' : 'Sim';
    // "Custo total apurado" = folha bruta do relatório da folha (derive() somaria benefícios e férias quando o bruto falta)
    const bruto = r.bruto !== undefined ? num(r.bruto) : (!r.evFolha || /não traz o valor bruto/.test(r.evFolha) ? null : num(r.custoApurado));
    r.bruto = bruto; r.custoApurado = null;
    derive('maoDeObra', r);
    r.custoApurado = bruto;
    r.diferenca = bruto !== null && num(r.custoPrevisto) !== null ? +(bruto - num(r.custoPrevisto)).toFixed(2) : null;
    return r;
  },

  /** que relatório é este? */
  tipo(book) {
    for (const [nome, rows] of Object.entries(book)) {
      if (/^planilha\s*\d/.test(norm(nome))) continue;
      const topo = rows.slice(0, 12).map(r => Array.from(r || [], norm));
      const tit = topo.flat().join(' ');
      for (const h of topo) {
        if (!h.some(c => c.startsWith('departamento'))) continue;
        if (h.some(c => c.includes('recarga')) && h.some(c => c.includes('valor devido'))) return 'vt';
        if (h.some(c => c.includes('qtd ativos')) || /ticket alimenta|vale.alimenta/.test(tit)) return 'va';
        if (h.some(c => c.includes('valores da cesta') || c.includes('qtde ativos'))) return 'cesta';
        if (h.some(c => c === 'totais') || /ferias/.test(tit)) return 'ferias';
      }
      if (/relatorio.{0,4}ferias|ferias - /.test(tit) && !/consolidado/.test(norm(nome))) return 'ferias';
    }
    return null;
  },

  anoDe(book) {
    for (const rows of Object.values(book)) for (const r of rows.slice(0, 10)) for (const c of Array.from(r || [])) { const m = String(c ?? '').match(/\b(20\d\d)\b/); if (m) return m[1]; const n = String(c ?? '').match(/\b\d{2}\.(\d{2})\b/); if (n) return '20' + n[1]; }
    return String(new Date().getFullYear());
  },
  /** competência pelo nome da aba ou título: "VALORES |09.26", "1ª QUINZENA AGOSTO", "MARÇO" + "FÉRIAS 03.26" */
  comp(nome, rows, ano) {
    const n = norm(nome); let m = n.match(/(\d{1,2})\.(\d{2})\b/);
    if (m) return `20${m[2]}-${String(+m[1]).padStart(2, '0')}`;
    const mi = BenefDP.MESES.findIndex(x => n.includes(x));
    if (mi >= 0) { const t = rows.slice(0, 4).flat().map(x => String(x ?? '')).join(' ').match(/(\d{2})\.(\d{2})\b/); const a = t && +t[1] === mi + 1 ? '20' + t[2] : ano; return `${a}-${String(mi + 1).padStart(2, '0')}`; }
    return null;
  },

  ler(book, tipo) {
    const ano = BenefDP.anoDe(book), out = [];
    for (const [nome, rows] of Object.entries(book)) {
      if (/consolidado|^planilha/.test(norm(nome))) continue;
      const comp = BenefDP.comp(nome, rows, ano); if (!comp) continue;
      if (tipo === 'ferias') {
        for (const r of rows) {
          const a = Array.from(r || []); const j = a.findIndex(c => typeof c === 'string' && /^\s*0*\d+(\.\d+)?\s*-/.test(c)); if (j < 0 || j > 2) continue;
          const valor = num(a[j + 2]), qtd = num(a[j + 4]);
          out.push({ aba: nome, comp, dep: a[j].trim(), cod: FolhaDP.codDep(a[j]), valor: valor || 0, qtd: qtd || 0 });
        }
        continue;
      }
      let hi = -1; for (let i = 0; i < Math.min(14, rows.length); i++) if (Array.from(rows[i] || [], norm).some(c => c.startsWith('departamento'))) { hi = i; break; }
      if (hi < 0) continue;
      const hr = Array.from(rows[hi] || []), h = hr.map(norm), col = f => h.findIndex(f);
      const C = { dep: col(c => c.startsWith('departamento')), esf: col(c => c === 'esfera') };
      if (tipo === 'va') { C.unit = col(c => c.includes('valor por dia')); C.qtd = col(c => c.includes('qtd ativos')); C.valor = hr.findIndex(c => typeof c === 'number' && c > 20000); if (C.valor < 0) C.valor = C.qtd + 1; }
      if (tipo === 'cesta') { C.unit = col(c => c.includes('valores da cesta')); C.qtd = col(c => c.includes('qtde ativos')); C.valor = col(c => c === 'valor'); }
      if (tipo === 'vt') { C.valor = col(c => c.includes('recarga')); C.devido = col(c => c.includes('valor devido')); C.econ = col(c => c.includes('economia')); }
      for (const r0 of rows.slice(hi + 1)) {
        const r = Array.from(r0 || []), dep = String(r[C.dep] ?? '').trim();
        if (!/^\s*0*\d+(\.\d+)?\s*-/.test(dep)) continue;
        const g = k => C[k] >= 0 ? r[C[k]] : undefined;
        const valor = num(g('valor')), qtd = num(g('qtd'));
        if (!valor && !qtd && !num(g('devido'))) continue;
        out.push({ aba: nome, comp, dep, cod: FolhaDP.codDep(dep), esfera: String(g('esf') ?? '').trim(), valor: valor || 0, qtd, unit: g('unit') ?? '', devido: num(g('devido')) });
      }
    }
    return out;
  },

  /** nº do contrato de cada departamento, lido das tabelas da própria planilha que trazem "Nº CONTRATO" (ex.: consolidado do VT) */
  numeros(book) {
    const out = {};
    for (const rows of Object.values(book)) {
      let C = null;
      for (const r0 of rows) {
        const r = Array.from(r0 || []), h = r.map(norm);
        const ic = h.findIndex(c => /^n.{0,2}\s*contrato/.test(c)), id = h.findIndex(c => c.startsWith('departamento'));
        if (ic >= 0 && id >= 0) { C = { ic, id }; continue; }
        if (!C) continue;
        const cod = FolhaDP.codDep(r[C.id]), k = FolhaDP.chave(r[C.ic]);
        if (cod && k && !out[cod]) out[cod] = String(r[C.ic]).trim();
      }
    }
    return out;
  },

  /** departamento → contrato: vínculos já usados (folha), nº do contrato no nome, linhas do DP já gravadas */
  mapa(e) {
    const M = { ...(e.dpDeps || {}) };
    DB.where('maoDeObra', r => r.empresaId === e.id && r.origem === 'folhaDP').forEach(r => {
      (r.deps || []).forEach(d => { if (!M[d]) M[d] = r.contrato; });
      const t = String(r.evFolha || r.evidencia || '').match(/—\s(.+?):\s*líquido/); if (t) t[1].split(', ').forEach(d => { const k = FolhaDP.codDep(d); if (k && !M[k]) M[k] = r.contrato; });
    });
    return M;
  },

  async importar(e, book, file, tipo) {
    e = DB.get('empresas', e.id) || e; // pode ter mudado na planilha anterior (vínculos do DP)
    const linhas = BenefDP.ler(book, tipo), nomeT = BenefDP.NOME[tipo];
    if (!linhas.length) { UI.toast(`Reconheci o relatório de ${nomeT.toLowerCase()}, mas não encontrei linhas com valores.`, 'bad', 6000); return; }
    const contratos = empRecs('contratos', e.id), byCod = BenefDP.mapa(e), chaves = {}, nums = { ...(e.dpNums || {}), ...BenefDP.numeros(book) };
    contratos.forEach(c => FolhaDP.chavesContrato(c).forEach(k => (chaves[k] = chaves[k] || []).push(c)));
    const grupos = {};
    linhas.forEach(l => { const k = l.cod || l.dep; const g = grupos[k] = grupos[k] || { k, dep: l.dep, esfera: l.esfera, linhas: [] }; g.linhas.push(l); if (!g.esfera && l.esfera) g.esfera = l.esfera; });
    const G = Object.values(grupos).sort((a, b) => (+a.k || 0) - (+b.k || 0));
    G.forEach(g => {
      const cod = byCod[g.k] && contratos.find(c => c.codigo === byCod[g.k]);
      if (cod) { g.auto = cod.id; return; }
      const nm = g.linhas.map(l => l.dep).join(' ').match(/\d[\d.]*\s*\/\s*\d{2,4}/);
      g.numero = nums[g.k] || (nm ? nm[0] : '');
      const cs = g.numero ? chaves[FolhaDP.chave(g.numero)] || [] : [];
      g.auto = cs.length === 1 ? cs[0].id : '';
    });
    const comps = [...new Set(linhas.map(l => l.comp))].sort();
    const ok = G.filter(g => g.auto), sem = G.filter(g => !g.auto);
    const opts = sel => `<option value="">— não lançar —</option>${contratos.slice().sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt', { numeric: true })).map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.codigo)}${c.numero ? ' · nº ' + esc(c.numero) : ''} — ${esc(c.unidade || c.tomador || '')}</option>`).join('')}`;
    const ult = g => g.linhas.slice().sort((a, b) => b.comp.localeCompare(a.comp))[0];
    const linha = g => { const u = ult(g); return `<tr><td><b>${esc(g.dep)}</b>${g.esfera || g.numero ? `<small class="muted" style="display:block">${esc(g.esfera || '')}${g.numero ? `${g.esfera ? ' · ' : ''}contrato ${esc(g.numero)}${g.auto ? '' : ' — não cadastrado no app (ou sem nº no cadastro)'}` : ''}</small>` : ''}</td><td class="r">${u.qtd ? fmtNum(u.qtd) : '—'}</td><td class="r">${fmtMoney(u.valor)}<small class="muted" style="display:block">${fmtComp(u.comp)}</small></td><td><select data-bdp="${esc(g.k)}">${opts(g.auto)}</select></td></tr>`; };
    const tab = list => `<div class="table-wrap"><table class="dt"><thead><tr><th>Departamento (planilha)</th><th class="r">${tipo === 'vt' ? '' : 'Empregados'}</th><th class="r">Valor (últ.)</th><th>Contrato no app</th></tr></thead><tbody>${list.map(linha).join('')}</tbody></table></div>`;
    const destino = tipo === 'ferias' ? '<b>Encargos/provisões</b> (férias pagas no mês) e a obrigação de férias, se houver' : `<b>Benefícios</b> (soma de vale-alimentação, cesta básica e vale-transporte), <b>Benefícios comprovados?</b>${tipo === 'va' ? ', divergência quando há empregados da folha sem vale-alimentação' : ''} e as obrigações de benefícios já cadastradas no contrato`;
    const m = UI.modal({
      title: `${nomeT} (DP)`, sub: esc(file.name), wide: true,
      body: `<p class="muted">Competências: <b>${comps.map(fmtComp).join(', ')}</b>. Os departamentos foram ligados aos contratos pelos vínculos já usados na folha de pagamento e pelo nº do contrato informado na própria planilha. Em cada contrato e competência, a linha do DP em <b>Mão de obra</b> recebe ${destino}. Importar de novo atualiza sem duplicar.</p>
        <h4 class="sec">Ligados a contratos do app <span class="count">${ok.length}</span></h4>${ok.length ? tab(ok) : '<p class="muted small">Nenhum departamento ligado. Importe antes a folha de pagamento (ela cria os vínculos) ou escolha os contratos abaixo.</p>'}
        <details ${ok.length ? '' : 'open'}><summary class="sec">Sem contrato correspondente <span class="count">${sem.length}</span></summary>${sem.length ? tab(sem) : ''}</details>`,
      foot: `<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="bdpOk">${icon('upload')} Preencher</button>`
    });
    const conta = () => { const n = new Set($$('[data-bdp]', m).map(s => s.value).filter(Boolean)).size; $('#bdpOk', m).innerHTML = `${icon('upload')} Preencher ${n} contrato(s)`; $('#bdpOk', m).disabled = !n; };
    $$('[data-bdp]', m).forEach(s => s.onchange = conta); conta();
    $('#bdpOk', m).onclick = async () => {
      const b = $('#bdpOk', m); b.disabled = true; b.innerHTML = icon('sync', 'spin') + ' Preenchendo…';
      const porC = {}, deps = { ...(e.dpDeps || {}) };
      $$('[data-bdp]', m).forEach(s => { const g = grupos[s.dataset.bdp]; if (!s.value || !g) return; (porC[s.value] = porC[s.value] || []).push(...g.linhas); const c = DB.get('contratos', s.value); if (c && /^\d/.test(g.k)) deps[g.k] = c.codigo; });
      const MO = [], OB = [];
      for (const [cid, ls] of Object.entries(porC)) {
        const c = DB.get('contratos', cid); if (!c) continue;
        const porComp = {}; ls.forEach(l => (porComp[l.comp] = porComp[l.comp] || []).push(l));
        for (const [comp, L] of Object.entries(porComp)) {
          const id = FolhaDP.idDe(e.id, 'mo', c.codigo, comp), r = { ...(DB.get('maoDeObra', id) || { id, empresaId: e.id, contrato: c.codigo, competencia: comp, origem: 'folhaDP', posto: BenefDP.POSTO }) };
          const soma = k => L.some(l => num(l[k]) !== null) ? +L.reduce((s, l) => s + (num(l[k]) || 0), 0).toFixed(2) : null;
          const un = [...new Set(L.map(l => l.unit).filter(x => x !== '' && x !== null && x !== undefined))].join(' / ');
          if (tipo === 'va') Object.assign(r, { va: soma('valor'), vaQtd: soma('qtd'), vaDia: un });
          if (tipo === 'cesta') Object.assign(r, { cesta: soma('valor'), cestaQtd: soma('qtd'), cestaUnit: num(un) ?? un });
          if (tipo === 'vt') Object.assign(r, { vt: soma('valor'), vtDevido: soma('devido') });
          if (tipo === 'ferias') Object.assign(r, { ferias: soma('valor'), feriasQtd: soma('qtd') });
          r.posto = BenefDP.POSTO;
          MO.push(BenefDP.compor(r));
        }
      }
      if (MO.length) await DB.save('maoDeObra', MO);
      for (const cid of Object.keys(porC)) { const c = DB.get('contratos', cid); if (c) OB.push(...BenefDP.obrigacoes(e, c)); }
      if (OB.length) await DB.save('obrigacoes', OB);
      await DB.save('empresas', { ...DB.get('empresas', e.id), dpDeps: deps, dpNums: { ...(DB.get('empresas', e.id).dpNums || {}), ...BenefDP.numeros(book) } });
      UI.closeModal(); UI.toast(`Relatório de ${nomeT.toLowerCase()} aplicado em ${Object.keys(porC).length} contrato(s): ${MO.length} linhas de mão de obra e ${OB.length} obrigações.`, 'ok', 6000); App.render();
    };
    return UI.aguardar(m);
  },

  /** obrigações de benefícios e de férias, recalculadas a partir das linhas do DP do contrato */
  obrigacoes(e, c) {
    const L = DB.where('maoDeObra', r => r.empresaId === e.id && r.contrato === c.codigo && r.origem === 'folhaDP').sort((a, b) => String(a.competencia).localeCompare(String(b.competencia)));
    const obs = DB.where('obrigacoes', r => r.empresaId === e.id && r.contrato === c.codigo), out = [], marca = '[Benefícios DP]';
    const juntar = (antigo, novo, mk) => { const a = String(antigo || '').split('\n').filter(t => !t.startsWith(mk)).join('\n').trim(); return (/n[aã]o verificad|n[aã]o apresentad/i.test(a) || !a ? '' : a + '\n') + mk + ' ' + novo; };
    const com = k => L.filter(r => num(r[k]) !== null && r[k] !== undefined);
    const serie = (k, q) => com(k).map(r => `${fmtComp(r.competencia)} ${fmtMoney(r[k])}${q && num(r[q]) !== null ? ` (${fmtNum(r[q])})` : ''}`).join(' · ');
    const B = ['va', 'cesta', 'vt'].filter(k => com(k).length);
    if (B.length) {
      const partes = B.map(k => `${BenefDP.NOME[k]}: ${serie(k, { va: 'vaQtd', cesta: 'cestaQtd' }[k])}`);
      const falta = com('va').filter(r => num(r.qtdAlocada) && num(r.vaQtd) !== null && num(r.vaQtd) < num(r.qtdAlocada) * 0.95);
      const total = +L.reduce((s, r) => s + (num(r.beneficios) || 0), 0).toFixed(2);
      const ver = `${partes.join('. ')}. Total no período: ${fmtMoney(total)}.`;
      const base = { qtdRealizada: `${com(B[0]).length} competência(s)`, valorRealizado: total, ...(com('va').some(r => num(r.qtdAlocada)) ? { status: falta.length ? 'Parcialmente cumprido' : 'Cumprido', desvio: falta.map(r => `${fmtComp(r.competencia)}: ${fmtNum(num(r.qtdAlocada) - num(r.vaQtd))} empregado(s) da folha sem vale-alimentação`).join('; '), impacto: falta.length ? 'Médio' : 'Baixo' } : {}) };
      const alvo = obs.filter(r => r.grupo === 'Benefícios' || /vale|alimenta[cç]|refei[cç]|transporte|cesta|benef[ií]cio/i.test(r.obrigacao || ''));
      if (alvo.length) alvo.forEach(r => out.push(derive('obrigacoes', { ...r, ...base, verificado: juntar(r.verificado, ver, marca) })));
    }
    const F = com('ferias').filter(r => num(r.ferias));
    const fer = obs.filter(r => /f[eé]rias/i.test(r.obrigacao || ''));
    if (fer.length && com('ferias').length) {
      const ver = F.length ? `Férias pagas: ${serie('ferias', 'feriasQtd')}.` : `Nenhuma férias paga nas competências do relatório (${com('ferias').map(r => fmtComp(r.competencia)).join(', ')}).`;
      fer.forEach(r => out.push(derive('obrigacoes', { ...r, verificado: juntar(r.verificado, ver, '[Férias DP]'), valorRealizado: +F.reduce((s, x) => s + num(x.ferias), 0).toFixed(2) })));
    }
    return out;
  }
};
