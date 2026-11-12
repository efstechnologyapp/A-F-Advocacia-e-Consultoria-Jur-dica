'use strict';
/* =====================================================================
   AMORIM FIRMO — Advocacia e Consultoria Jurídica
   Núcleo: configuração, utilidades, armazenamento e sincronização
   ===================================================================== */

/* A configuração do login fica no arquivo config.js (veja CONFIGURAR-LOGIN.md) */
const APP_VERSAO = '1.21.0';
/* Desenvolvimento e proteção do aplicativo */
const DEV = { nome: 'EFS Technology', tel: '83 9 99944-7957', wa: '5583999447957', email: 'efstechnology.app@gmail.com' };
/** endereços em que o app pode rodar; outros domínios mostram o aviso de cópia não autorizada.
 *  Para um domínio próprio, inclua-o aqui ou em config.js (CONFIG.DOMINIOS = ['meudominio.com.br']). */
const DOMINIOS = ['efstechnologyapp.github.io', 'localhost', '127.0.0.1', '[::1]'];
const dominioOk = () => { const h = location.hostname.toLowerCase(); if (!/^https?:$/.test(location.protocol)) return true; return [...DOMINIOS, ...((window.CONFIG && window.CONFIG.DOMINIOS) || [])].some(d => h === d || h.endsWith('.' + d)) || h.endsWith('.localhost'); };
const CONFIG = Object.assign({ GOOGLE_CLIENT_ID: '', APPS_SCRIPT_URL: '' }, window.CONFIG || {}, { VERSION: APP_VERSAO });
const VERSOES = [
  { numero: '1.21.0', data: '12/11/2026', itens: ['A página Gestão do App (sistema, usuários do escritório, log, conexão do Drive e chave de IA) passa a ser exclusiva do desenvolvedor (EFS Technology). Os demais administradores continuam cuidando dos acessos de clientes nas empresas.'] },
  { numero: '1.20.5', data: '12/11/2026', itens: ['Portal da empresa › Acessos: a coluna “Pessoa” mostra “Nome (e-mail / telefone)” de cada usuário autorizado, com o WhatsApp clicável. Nome completo e WhatsApp podem ser informados no convite (pelo escritório ou no pedido do gerente) e a própria pessoa completa ou corrige em “Meus dados”.'] },
  { numero: '1.20.4', data: '12/11/2026', itens: ['Portal da empresa › Acessos: cada pessoa aparece uma vez, pelo e-mail e pelo nome que ela mesma informou (não mais o nome da empresa), com o perfil nesta empresa e a linha “Também acessa” para as outras empresas dela.', 'Servidor: registros repetidos do mesmo e-mail são juntados automaticamente.'] },
  { numero: '1.20.3', data: '12/11/2026', itens: ['Crédito do desenvolvedor (EFS Technology, WhatsApp e e-mail) no login, no menu, em “Sobre o App” e no portal do cliente.', 'Proteção: o app só roda nos endereços autorizados; uma cópia publicada em outro domínio mostra o aviso de cópia não autorizada. Aviso de direitos autorais no código.'] },
  { numero: '1.20.2', data: '12/11/2026', itens: ['Portal: quem tem acesso a várias empresas vê uma abertura própria — o cartão percorre os logos das empresas, acendendo um ponto para cada uma, e termina na tela de escolha.'] },
  { numero: '1.20.1', data: '12/11/2026', itens: ['Portal: quem tem perfil mais alto pode atuar num perfil abaixo (Diretoria → Gerente ou Funcionário; Gerente → Funcionário), pelo menu em “Atuar como”. Uma faixa avisa o perfil em uso e tem “Voltar ao meu perfil”.'] },
  { numero: '1.20.0', data: '12/11/2026', itens: ['Portal da empresa com 3 perfis: Funcionário (contratos, pendências atribuídas e remessa), Gerente/Administrador (contratos, plano de ação, revisa e envia a remessa, pede acessos de funcionários) e Diretoria (painel com carteira, receita, custos, margem, vigências e riscos; PDF executivo e Excel).', 'O servidor entrega a cada perfil só os dados que ele pode ver.', 'Empresa › aba “Portal da empresa”: acessos com perfil, reenviar convite, zerar senha, remover, aprovar pedidos do gerente e escolher quais achados publicar.', 'Remessa: o funcionário envia ao gerente, que revisa e envia ao escritório (sem gerente, vai direto).', 'Pré-visualização do portal com seletor de perfil.'] },
  { numero: '1.19.0', data: '12/11/2026', itens: ['Portal: o mesmo e-mail pode ter acesso a várias empresas. Ao entrar, o usuário vê os cards das empresas (contratos, ações em aberto e situação da remessa) e escolhe em qual vai trabalhar; o menu ganhou “Trocar de empresa”.', 'Habilitar o portal de uma segunda empresa para um e-mail já cadastrado agora soma o acesso, em vez de substituir.'] },
  { numero: '1.18.2', data: '12/11/2026', itens: ['Portal: o cartão de conexão (escritório × empresa) aparece em todo login e toda vez que o app é aberto, no lugar da abertura padrão.'] },
  { numero: '1.18.1', data: '12/11/2026', itens: ['Portal: botão do menu e painel lateral passam para o lado esquerdo; no topo do painel, a empresa e, abaixo, o nome do usuário, e-mail, cidade, data e hora do acesso.', '“Meus dados”: cada funcionário da empresa preenche os próprios dados (nome completo, cargo, telefone e endereço); o cadastro da empresa continua com o escritório.'] },
  { numero: '1.18.0', data: '12/11/2026', itens: ['Portal do cliente: senha própria. No 1º acesso, depois de confirmar o código do e-mail, a pessoa cria a senha; nos próximos, entra com e-mail e senha (com “Esqueci minha senha”). 5 tentativas erradas bloqueiam por 15 minutos.', 'Portal: menu do usuário (toque nas iniciais, no topo) com empresa, atalhos (Consultoria, Remessa mensal com prazo/situação, relatório), Meu perfil, Alterar senha, instalar o app, falar com o escritório e Sair.', 'Gestão › Usuários: mostra se o cliente já criou senha e tem o botão “Zerar senha”.'] },
  { numero: '1.17.3', data: '12/11/2026', itens: ['Habilitar portal: o botão mostra “Enviando convite…” girando enquanto envia e, no fim, uma janela confirma para quais e-mails o convite foi e como o cliente entra.'] },
  { numero: '1.17.2', data: '12/11/2026', itens: ['Portal da empresa: vários e-mails de acesso (separados por vírgula); “Habilitar portal” convida cada um e, depois, só os e-mails novos.'] },
  { numero: '1.17.1', data: '12/11/2026', itens: ['Empresas: o portal passa a ser da própria empresa. No cadastro, “E-mail de acesso ao portal” substitui a escolha entre clientes dos processos; o app cria o cliente pessoa jurídica com os dados da empresa.', 'Página da empresa: botões “Habilitar portal” (envia o convite; depois mostra “Portal habilitado”) e “Ver como a empresa”.', 'Portal de empresa sem processos judiciais abre direto na Consultoria.'] },
  { numero: '1.17.0', data: '12/11/2026', itens: ['Remessa mensal: no portal, a empresa informa por contrato o faturado, o recebido, os postos ocupados, faltas e ocorrências, e anexa os documentos do mês (folha, benefícios, FGTS/INSS, notas, recebimentos, ponto, aditivos/apólices).', 'Tudo o que a empresa envia entra na fila “Remessas mensais” do escritório e só alimenta os dados gerais quando aprovado: divergências automáticas (faturado × contrato, recebido × faturado, postos, documentos obrigatórios) viram achados; números vão para Financeiro e Mão de obra; arquivos para Documentos.', 'Aba “Remessas mensais” em cada empresa, indicador na Visão geral e prazo mensal configurável no cadastro da empresa.', 'Portal: abertura com o cartão de conexão (brasão × logo da empresa). Botão “Logo” na página da empresa.'] },
  { numero: '1.16.2', data: '11/11/2026', itens: ['Páginas do menu (áreas do Judicial, Agenda, Empresas, Achados, Clientes…) ganharam o botão “Visão geral” no topo; ao voltar, a visão geral abre no card da seção de onde você veio (Judicial ou Consultoria).'] },
  { numero: '1.16.1', data: '11/11/2026', itens: ['Visão geral: as abas Judicial e Consultoria viraram dois cards com resumo (processos e compromissos; empresas e achados de risco alto); o card escolhido fica destacado.'] },
  { numero: '1.16.0', data: '11/11/2026', itens: ['Visão geral separada em duas abas, Judicial e Consultoria; o app lembra a última aba aberta.', 'Judicial: processos em andamento, compromissos em 7 dias, intimações novas do DJEN, próximos compromissos, processos por área e últimas movimentações.', 'Consultoria: empresas, contratos auditados, contratos vencendo em 90 dias (com a lista), achados de risco alto e alertas.'] },
  { numero: '1.15.0', data: '11/11/2026', itens: ['Judicial: cada área (e “Todos os processos”) tem os cards “Pessoas físicas” e “Pessoas jurídicas”; tocar num card mostra só os processos daquele tipo, com as relações do escritório e em parceria. O tipo vem do cadastro do cliente (ou do CNPJ).', 'Card “Cliente a definir” aparece quando há processos sem cliente vinculado.'] },
  { numero: '1.14.3', data: '11/11/2026', itens: ['Judicial: botão “Alterar representação” nas relações de processos do escritório e em parceria, para corrigir em lote se o processo é próprio ou em parceria (e com quem).', 'Ficha do processo: campo “Representação” para trocar entre próprio e os parceiros.'] },
  { numero: '1.14.2', data: '11/11/2026', itens: ['Processos encontrados pela OAB: a tabela rola dentro da janela, com a barra de rolagem lateral sempre visível embaixo e o cabeçalho fixo no topo.'] },
  { numero: '1.14.1', data: '11/11/2026', itens: ['Processos encontrados pela OAB: nova coluna “Representação” para indicar se o processo é próprio ou em parceria (com parceiro já cadastrado ou com o advogado intimado junto, que passa a ser parceiro). Quando um parceiro cadastrado aparece na intimação, a opção já vem marcada.'] },
  { numero: '1.14.0', data: '11/11/2026', itens: ['Judicial: processos em parceria com outros advogados/escritórios ficam numa relação própria, abaixo dos processos do escritório, em cada área e em “Todos os processos”.', 'Botão “Parceiros”: lista os advogados intimados junto com os nossos (na mesma parte) para marcar quem é parceiro, com o nome do escritório; também dá para incluir pela OAB.', 'Ficha do processo: etiqueta “Em parceria com …” e a opção “não é parceria” para casos isolados.'] },
  { numero: '1.13.8', data: '11/11/2026', itens: ['Painel da empresa: “+ outros” em Contratos por tomador expande e recolhe a lista.', 'Achados em aberto: tocar num risco ou numa área abre a página de achados já filtrada para resolver.', 'Vencimentos: tocar num mês (gráfico ou tabela) lista os contratos que vencem nele; “Ver todos” mostra os 12 meses, e cada contrato abre a ficha.'] },
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
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__afInstall = e; });
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
  /** desenvolvedor do sistema: único com acesso à Gestão do App (no modo local, quem usa o app) */
  get isDev() { return !!this.user && this.user.papel === 'admin' && (this.mode === 'local' || this.user.dev === true); },
  get remote() { return this.mode === 'remote'; }
};

/* ---------- Banco de dados local + sincronização ---------- */
const COLLS = ['clientes', 'processos', 'movimentos', 'prazos', 'empresas', 'contratos', 'obrigacoes', 'maoDeObra', 'materiais', 'financeiro', 'medicoes', 'indicadores', 'achados', 'documentos', 'aditivos', 'config', 'atendimentos', 'supervenientes', 'remessas'];
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
