# Amorim Firmo — Advocacia e Consultoria Jurídica

App (PWA) de gestão do escritório, no mesmo formato do Custódia Digital e do Meus Concursos: hospedado no GitHub Pages, login com Google + código por e-mail + autorização do administrador, servidor em Google Apps Script e dados numa Planilha Google.

## Estrutura

| Arquivo | Para quê |
|---|---|
| `index.html` | telas, visual e tela de abertura (splash) |
| `app.js` | toda a lógica do app (gerado a partir da pasta `src/`) |
| `config.js` | ID do cliente Google e URL do Apps Script |
| `sw.js`, `manifest.json` | instalar como app e funcionar sem internet |
| `brasao.png`, `brasao-claro.png`, `icon-192.png`, `icon-512.png` | brasão (versões escura e clara) e ícones — ficam na raiz, junto do index.html |
| `apps-script/Codigo.gs` | servidor (cole no Google Apps Script) |
| `src/` | código-fonte em módulos (para manutenção; não precisa ir ao GitHub) |
| `CONFIGURAR-LOGIN.md` | passo a passo de instalação |

## O que o app faz

**Sidebar** — brasão, foto/nome/e-mail de quem está logado, navegação (Visão geral · Judicial · Consultoria jurídica · Clientes), **Gestão do App** (administrador, com contador de pedidos pendentes), Sair, versão e "Sobre o App". No celular, abre pelo botão ☰.

**Judicial** — subseções Cível, Penal, Administrativo, Previdenciário e Trabalhista.
- Cadastro do processo com validação do número CNJ (dígito verificador) e identificação automática do tribunal.
- Linha do tempo de movimentações: lançamento manual ou importação do **DataJud/CNJ**, com sincronização automática diária. Cada movimentação tem o **olho** (visível ou não ao cliente) e um campo de **explicação em linguagem simples** para o cliente.
- Agenda de prazos e audiências com alertas de atraso.
- **Ver como o cliente**: pré-visualiza exatamente o que o cliente verá.
- Aviso por e-mail ao cliente quando há movimentação nova (opcional por processo).

**Consultoria jurídica** — cadastro de empresas; para cada uma, um espaço com as abas da planilha de auditoria:
Contratos · Obrigações · Mão de obra · Materiais · Financeiro · Medições · Indicadores mensais · Achados e plano de ação · Documentos (inventário) · Aditivos · Relatórios.
- **Importar planilha**: lê o .xlsx no modelo da auditoria (ex.: *Auditoria_Contratos_JSP_Goiana_Consolidada.xlsx*), reconhece as abas pelos nomes das colunas e permite *substituir* ou *acrescentar*. Contratos citados nas outras abas mas ausentes do cadastro são criados automaticamente (marcados como "cadastro incompleto").
- **Exportar Excel**: devolve tudo no mesmo formato de abas, com cabeçalho, filtros e valores em R$.
- **Painel**: contratos vigentes, carteira mensal, **completude documental**, conformidade das obrigações, achados por risco, postos contratados, vencimentos dos próximos 12 meses, e gráficos de **receitas × custos, tributos e encargos (INSS/previdência, FGTS, ISS, federais), admissões × desligamentos, funcionários ativos, margem e carga tributária**, com **leitura automática do período**.
- **Visão 360º do contrato**: clicando num contrato, tudo que se liga a ele (obrigações, mão de obra, financeiro, achados, documentos, aditivos) numa tela só.
- Campos "Não identificado no contrato" ficam destacados como lacunas documentais.
- **Relatório de auditoria** com capa e brasão, sumário executivo, gráficos, conformidade, mão de obra, achados e parecer — imprimir ou salvar em PDF.

**Portal do cliente** — acesso próprio e restrito: processos, andamento (só o liberado), agenda, contato do escritório e, para empresas, painel e plano de ação da consultoria.

**Gestão do App** (administrador) — abas Informações (dados do app, funcionalidades, métricas, histórico de versões), Usuários (pedidos pendentes, autorizados, bloqueados, autorizar antes), Sistema (conexões, dados do escritório, backup) e Auditoria (trilha de quem incluiu/alterou/excluiu).

## Atualizar o app

Edite os arquivos em `src/` e gere o `app.js` juntando-os em ordem (`cat src/*.js > app.js`), ou peça ao Claude a nova versão. Ao publicar, troque a versão em `sw.js` (`CACHE`) para os aparelhos baixarem a atualização.
