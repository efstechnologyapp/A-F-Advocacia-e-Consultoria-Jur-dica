# Como configurar o login, os acessos e a sincronização

O app usa três serviços gratuitos do Google, os mesmos do Meus Concursos e do Custódia Digital:

- **Google Cloud (ID do cliente OAuth)**: mostra o botão "Fazer login com o Google" para a equipe do escritório.
- **Google Apps Script**: envia os códigos por e-mail, confere quem está autorizado, guarda os dados numa Planilha Google, consulta o DataJud/CNJ e manda os avisos.
- **GitHub Pages**: hospeda o app (como os outros dois).

Leva uns 20 minutos e é feito uma vez só. **Use a conta Google do escritório** (é nela que ficarão a planilha com os dados e de onde sairão os e-mails).

## 1. Publicar o app no GitHub Pages

1. Crie um repositório (ex.: `AmorimFirmo`) na conta GitHub de sua preferência.
2. Envie **todos os arquivos deste pacote** para a raiz do repositório (a pasta `apps-script` e a pasta `src` são opcionais).
3. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
4. Anote o endereço, ex.: `https://SEU-USUARIO.github.io/AmorimFirmo/`.

> Já dá para abrir e usar em **modo local** (dados só naquele navegador) para conhecer o app e testar a importação da planilha.

## 2. Criar o ID do cliente no Google Cloud

1. Acesse https://console.cloud.google.com/ e crie um projeto, por exemplo "Amorim Firmo".
2. **APIs e serviços → Tela de permissão OAuth** (ou "Google Auth Platform"):
   - Tipo de usuário: **Externo** · Nome do app: Amorim Firmo · e-mail de suporte: o do escritório.
   - Escopos: nenhum (o login usa só e-mail e perfil).
   - Clique em **Publicar app** (com só e-mail/perfil não há análise do Google). Se preferir deixar em *Teste*, adicione em **Usuários de teste** o e-mail de cada pessoa da equipe.
3. **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - **Origens JavaScript autorizadas**: `https://SEU-USUARIO.github.io` (sem barra no final e sem o nome do repositório).
4. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`).

## 3. Publicar o Apps Script (servidor)

1. Acesse https://script.google.com/ → **Novo projeto** → nome "Amorim Firmo – Servidor".
2. Apague o conteúdo de `Código.gs` e cole todo o arquivo `apps-script/Codigo.gs`.
3. **Configurações do projeto (engrenagem) → Propriedades do script → Adicionar propriedade**:

   | Propriedade | Valor |
   |---|---|
   | `GOOGLE_CLIENT_ID` | o ID copiado no passo 2 |
   | `DONOS` | e-mail(s) do(s) administrador(es), separados por vírgula — ex.: do seu irmão e o seu |

4. No editor, escolha a função **configurarInicial** e clique em **Executar**. Aceite as permissões (planilhas, e-mail, serviços externos). Se aparecer "O Google não verificou este app": **Avançado → Acessar (não seguro)** — o script é seu.
   Ela cria a planilha **"Amorim Firmo — Base de Dados do App"** no Drive (abas `dados`, `usuarios`, `log`).
5. Escolha a função **instalarGatilhoDiario** e clique em **Executar** — liga a busca diária (6h) de movimentações no DataJud.
6. **Implantar → Nova implantação** → tipo **App da Web** · Executar como: **Eu** · Quem pode acessar: **Qualquer pessoa** → **Implantar**.
7. Copie a **URL do app da Web** (termina em `/exec`).

> **Atualizando o script depois?** Cole o novo código e vá em **Implantar → Gerenciar implantações → lápis → Versão: Nova versão → Implantar**. A URL continua a mesma.

## 4. Preencher o config.js

```js
window.CONFIG = {
  GOOGLE_CLIENT_ID: "123456789-abc...apps.googleusercontent.com",
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfy.../exec"
};
```

Salve (commit) no GitHub. Em um ou dois minutos o app passa a pedir o login.

## Como funciona o acesso

**Administrador (e-mails em `DONOS`)** — sempre entra. Vê a **Gestão do App** na sidebar, com a contagem de pedidos pendentes.

**Equipe do escritório** — entra com o Google. No primeiro acesso, o pedido fica *pendente* e o administrador recebe um e-mail. Ao autorizar (Gestão do App › Usuários), a pessoa recebe o convite. Depois, no primeiro login em cada aparelho, confirma o e-mail com um código de 6 dígitos.

**Clientes** — o escritório autoriza antes (Gestão do App › Usuários › "Autorizar antes de a pessoa entrar", perfil *Cliente*, vinculando ao cadastro do cliente) ou pelo botão **Conceder acesso ao portal** na ficha do cliente. O cliente não precisa de conta Google: na tela de login usa **"Sou cliente e não tenho conta Google"**, recebe o código no e-mail e entra.
O servidor entrega a cada cliente **somente**:
- os processos em que ele está vinculado (sem anotações internas nem honorários);
- as movimentações e compromissos marcados como **visíveis ao cliente** (ícone do olho);
- o painel e o plano de ação da empresa, se ele for o contato vinculado a uma empresa da consultoria.

O aparelho fica lembrado por 90 dias (até clicar em **Sair**).

## DataJud (movimentações dos tribunais)

O botão **Buscar movimentações (DataJud)** e a rotina diária consultam a API pública do CNJ. A chave pública atual já está no script. Se um dia o CNJ trocá-la (o app avisa), pegue a nova em https://datajud-wiki.cnj.jus.br/api-publica/acesso e crie a propriedade `DATAJUD_CHAVE` com o novo valor.
Observação: a base do DataJud pode levar alguns dias para refletir uma movimentação recente, e processos em segredo de justiça não aparecem.

## Limites gratuitos do Google

- E-mails (códigos, convites, avisos): cerca de 100/dia em conta Gmail; 1.500/dia em Google Workspace.
- Planilha: suficiente para dezenas de milhares de registros.
