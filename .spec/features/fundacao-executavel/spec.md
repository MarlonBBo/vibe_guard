# Spec: Fundacao executavel

> feature: fundacao-executavel
> status: pronta

<!--
  Como ler este arquivo (o formato é verificado por `onp-spec audit`):
  - US-xxx = história de usuário · AC-xxx = critério de aceite
    ASM-xxx = suposição · Q-xxx = pergunta em aberto
    São códigos de rastreio: ligam a especificação às tarefas e aos testes.
  - Toda história de usuário precisa de pelo menos um critério de aceite.
  - Todo critério de aceite precisa de Dado/Quando/Então completos.
  - Os códigos são únicos no projeto inteiro (nunca reutilize um número).
  - Suposições e Perguntas em aberto são OBRIGATÓRIAS: se não há nenhuma,
    escreva "Nenhuma." — mas desconfie: quase toda feature esconde uma.
-->

## Contexto

O VibeGuard ainda não possui uma base executável. Esta feature entrega o
esqueleto mínimo para desenvolvimento e operação local: aplicação TypeScript,
configuração validada, conexão com PostgreSQL e Redis, logs estruturados,
containers, testes e CI.

## Histórias

### US-001 — Projeto reproduzível

Como pessoa desenvolvedora, quero instalar e validar o projeto com comandos
padronizados, para trabalhar sobre uma base reproduzível.

#### AC-001 — Ambiente Node reproduzível

- **Dado** um checkout limpo com Node.js 24 e npm
- **Quando** a pessoa executa `npm ci`
- **Então** as dependências são instaladas a partir do lockfile sem alterar sua resolução

#### AC-002 — Gate local completo

- **Dado** que as dependências estão instaladas
- **Quando** a pessoa executa lint, typecheck, testes e build pelos scripts do projeto
- **Então** todos os comandos terminam com código zero

### US-002 — Serviço configurável e observável

Como pessoa operadora, quero iniciar API e worker com configuração validada e
logs estruturados, para diagnosticar falhas sem expor segredos.

#### AC-003 — Configuração inválida interrompe a inicialização

- **Dado** que uma variável de ambiente obrigatória está ausente ou inválida
- **Quando** a API ou o worker inicia
- **Então** o processo termina com erro estruturado que identifica o campo sem registrar seu valor sensível

#### AC-004 — Logs estruturados identificam o serviço

- **Dado** que API ou worker está em execução
- **Quando** um evento operacional é registrado
- **Então** o log JSON contém nível, horário, mensagem e nome do serviço sem incluir segredos de configuração

### US-003 — Estado operacional verificável

Como pessoa operadora, quero distinguir processo vivo de serviço pronto, para
que automação e containers tomem decisões corretas.

#### AC-005 — Liveness não depende da infraestrutura

- **Dado** que o processo da API está ativo
- **Quando** `GET /health` é consultado
- **Então** a resposta é `200` mesmo que PostgreSQL ou Redis estejam indisponíveis

#### AC-006 — Readiness reflete PostgreSQL e Redis

- **Dado** que a API está ativa
- **Quando** `GET /ready` é consultado
- **Então** a resposta é `200` somente quando PostgreSQL e Redis respondem, ou `503` quando qualquer dependência falha

### US-004 — Ambiente local integrado

Como pessoa desenvolvedora, quero subir a aplicação e suas dependências com
Docker Compose, para reproduzir localmente a topologia do MVP.

#### AC-007 — Compose descreve todos os processos do MVP

- **Dado** um ambiente com Docker e Docker Compose
- **Quando** a configuração do Compose é validada
- **Então** ela contém API, worker, PostgreSQL e Redis com healthchecks e dependências de inicialização explícitas

### US-005 — Integração contínua protege a base

Como pessoa mantenedora, quero que cada mudança passe pelo mesmo gate de
qualidade, para impedir que a fundação deixe de compilar ou testar.

#### AC-008 — CI executa o gate completo

- **Dado** um push ou pull request
- **Quando** o workflow de integração contínua é executado
- **Então** ele instala pelo lockfile e executa lint, typecheck, testes e build com Node.js 24

#### AC-009 — Fundação permanece sem IA

- **Dado** o manifesto de dependências do projeto
- **Quando** suas dependências são inspecionadas
- **Então** nenhuma biblioteca ou serviço de IA, LLM ou RAG faz parte da fundação

## Decisões técnicas

- Node.js 24 LTS e npm;
- Express;
- testes com `node:test`;
- ESLint;
- logs estruturados com Pino;
- PostgreSQL via `pg` e migrations com `node-pg-migrate`;
- Redis compartilhado por API, worker e futura fila;
- endpoints `GET /health` e `GET /ready`;
- processos de API e worker separados.

## Fora de escopo

- cadastro de repositórios;
- criação ou processamento de análises;
- regras de análise e cálculo de score;
- autenticação;
- deploy em ambiente de produção.

## Suposições

<!-- O que estamos ASSUMINDO sem confirmação. Status: aberta | confirmada | invalidada -->

| ID | Suposição | Status | Resolução |
|---|---|---|---|
Nenhuma.

## Perguntas em aberto

<!-- O que ainda não sabemos. Status: aberta | respondida -->

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | Qual baseline técnico deve ser usado na fundação? | respondida | Node.js 24 LTS, npm, Express, node:test, ESLint, Pino, pg, node-pg-migrate, /health e /ready. |
