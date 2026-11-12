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
      F('diaRemessa', 'Dia limite da remessa mensal', 'num', { hint: 'A empresa envia, pelo portal, os números e documentos do mês anterior até este dia (padrão: 15).' }),
      F('contato', 'Contato principal', 'text'),
      F('email', 'E-mail', 'email'),
      F('telefone', 'Telefone', 'tel'),
      F('inicio', 'Início da consultoria', 'date'),
      F('honorario', 'Honorário mensal (R$)', 'money'),
      F('emailPortal', 'E-mails de acesso ao portal', 'text', { w: 'full', hint: 'Um ou mais e-mails, separados por vírgula: cada pessoa entra no portal com o próprio e-mail (consultoria e remessa mensal). A própria empresa vira o cliente do portal; depois de salvar, toque em “Habilitar portal” na página da empresa.' }),
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
