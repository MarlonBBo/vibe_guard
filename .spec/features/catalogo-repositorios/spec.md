# Spec: Catalogo de repositorios

> feature: catalogo-repositorios
> status: auditada

## Contexto

O VibeGuard precisa manter um catalogo duravel dos repositorios que poderao
ser analisados. Esta feature entrega criacao, listagem e consulta individual
por HTTP, com PostgreSQL como fonte de verdade, validacao Zod e respostas de
erro consistentes. Ela nao inicia analises nem acessa o conteudo do repositorio.

## Historias

### US-006 - Cadastrar repositorio

Como pessoa usuaria da API, quero cadastrar um repositorio publico, para que
ele possa ser selecionado em uma analise futura.

#### AC-010 - Repositorio GitHub valido e cadastrado

- **Dado** o corpo `{ "url": "https://github.com/owner/repository" }` apontando para um repositorio publico com branch padrao
- **Quando** `POST /repositories` e chamado
- **Entao** a API confirma o acesso sem clonar, deriva os metadados, persiste o repositorio e responde `201 Created` com `id`, `name`, `url`, `provider`, `externalId`, `defaultBranch`, `createdAt` e `updatedAt`

#### AC-011 - Entrada invalida e recusada

- **Dado** um corpo malformado, uma URL que nao usa HTTPS ou uma URL fora de `github.com`
- **Quando** `POST /repositories` e chamado
- **Entao** a API responde `400 Bad Request` com erro estruturado e nao persiste o repositorio

#### AC-012 - Repositorio inacessivel e recusado

- **Dado** uma URL HTTPS valida do GitHub que aponta para repositorio inexistente, privado ou sem uma branch padrao resolvivel
- **Quando** `POST /repositories` e chamado
- **Entao** a API responde `422 Unprocessable Entity` com erro estruturado e nao persiste o repositorio

#### AC-013 - Cadastro duplicado e recusado

- **Dado** que a URL canonica de um repositorio ja esta cadastrada
- **Quando** `POST /repositories` e chamado novamente para a mesma URL
- **Entao** a API responde `409 Conflict` com erro estruturado e mantem apenas um cadastro

### US-007 - Listar repositorios

Como pessoa usuaria da API, quero listar os repositorios cadastrados, para
escolher qual deles analisar.

#### AC-014 - Catalogo completo listado de forma deterministica

- **Dado** que existem repositorios cadastrados
- **Quando** `GET /repositories` e chamado
- **Entao** a API responde `200 OK` com todos os repositorios, sem paginacao, ordenados do cadastro mais recente para o mais antigo e sem expor campos internos do banco

### US-008 - Consultar repositorio

Como pessoa usuaria da API, quero consultar um repositorio pelo identificador,
para confirmar seus dados antes de solicitar uma analise.

#### AC-015 - Repositorio encontrado pelo identificador

- **Dado** um identificador de repositorio existente
- **Quando** `GET /repositories/:id` e chamado
- **Entao** a API responde `200 OK` com os dados publicos do repositorio correspondente

#### AC-016 - Repositorio inexistente informado claramente

- **Dado** um identificador valido que nao pertence a nenhum repositorio
- **Quando** `GET /repositories/:id` e chamado
- **Entao** a API responde `404 Not Found` com erro estruturado

## Decisoes tecnicas

- o corpo de criacao contem somente `url`;
- a URL aceita usa `https`, host exato `github.com`, dois segmentos de caminho e nao contem credenciais, query string ou fragmento;
- a URL e normalizada sem barra final e sem o sufixo `.git`; a forma canonica e unica no PostgreSQL;
- `provider` e sempre `github`, `externalId` corresponde a `owner/repository` e `name` corresponde ao nome do repositorio;
- a branch padrao e obtida com `git ls-remote --symref`, usando argumentos sem shell; nenhum conteudo remoto e executado ou clonado;
- IDs sao UUIDs e a API apresenta nomes de campos em `camelCase`;
- erros usam `{ "error": { "code": "...", "message": "..." } }` e nao incluem detalhes internos;
- a listagem ordena por `created_at DESC, id DESC`;
- PostgreSQL permanece a fonte de verdade.

## Fora de escopo

- criar ou enfileirar analises;
- clonar, executar ou inspecionar o conteudo do repositorio;
- autenticar chamadas da API;
- atualizar ou excluir repositorios;
- integrar GitHub App ou receber webhooks.

## Suposicoes

| ID | Suposicao | Status | Resolucao |
|---|---|---|---|
Nenhuma.

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-002 | Qual provedor de repositorio o catalogo aceita inicialmente? | respondida | Somente GitHub publico via HTTPS. |
| Q-003 | Como o cadastro reage quando a mesma URL ja existe? | respondida | Responde `409 Conflict`. |
| Q-004 | A primeira listagem deve ter paginacao? | respondida | Nao; retorna o catalogo completo no MVP. |
| Q-005 | Quais dados o cliente envia no cadastro e quais o VibeGuard deriva? | respondida | O cliente envia somente `url`; o VibeGuard deriva nome, provedor, identificador externo e branch padrao. |
