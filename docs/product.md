# VibeGuard — visão do produto

## Problema

Repositórios podem acumular padrões que reduzem a confiabilidade, a segurança
e a capacidade de evolução de uma aplicação. O VibeGuard oferece uma análise
repetível desses padrões e devolve achados objetivos, localizáveis e
acionáveis.

## Objetivo do MVP

Entregar uma base pequena e confiável capaz de cadastrar repositórios,
processar análises estáticas de forma assíncrona e consultar os achados e a
pontuação resultantes.

## Características centrais

- análise determinística: a mesma versão do repositório e o mesmo conjunto de
  regras produzem o mesmo resultado;
- processamento assíncrono: criar uma análise não bloqueia a API até o fim do
  processamento;
- rastreabilidade: cada achado informa regra, categoria, severidade, arquivo e
  linha quando aplicável;
- segurança por inspeção: nenhum código do repositório analisado é executado;
- PostgreSQL como fonte de verdade para dados e estados;
- escopo inicial voltado a Node.js, TypeScript, JavaScript e Express.

## Domínio

### Repository

Campos principais: `id`, `name`, `url`, `provider`, `external_id`,
`default_branch`, `created_at` e `updated_at`.

### Analysis

Campos principais: `id`, `repository_id`, `commit_sha`, `status`, `score`,
`started_at`, `finished_at` e `created_at`.

Estados permitidos: `queued`, `running`, `completed` e `failed`.

### Finding

Campos principais: `id`, `analysis_id`, `rule_id`, `category`, `severity`,
`file_path`, `line`, `title`, `description`, `suggestion` e `created_at`.

Severidades permitidas: `critical`, `high`, `medium`, `low` e `info`.

Categorias iniciais: `reliability`, `security`, `api`, `database` e
`maintainability`.

## API inicial

```http
POST /repositories
GET /repositories
GET /repositories/:id

POST /repositories/:id/analyses
GET /analyses/:id
GET /analyses/:id/findings
```

`POST /repositories/:id/analyses` responde com `202 Accepted` depois de
persistir a análise como `queued` e enfileirar um job que contém somente o
`analysisId`.

## Pontuação

A pontuação começa em 100, aplica a penalidade de cada achado e limita o
resultado inferior a zero em 0.

| Severidade | Penalidade |
|---|---:|
| critical | -15 |
| high | -7 |
| medium | -3 |
| low | -1 |
| info | 0 |

## Fora do MVP

- IA, LLM e RAG;
- GitHub App e PR Guard;
- Kubernetes e Kafka;
- execução dinâmica de código;
- testes de carga;
- análise de múltiplas linguagens além do ecossistema inicial.

## Decisões de produto pendentes

- comportamento para solicitações repetidas da mesma análise de repositório e commit;
- catálogo exato das primeiras regras determinísticas;
- paginação e limites operacionais das consultas de análises e findings;
- limites de tamanho, tempo e rede aplicados ao clone.

## Decisões confirmadas

- o MVP aceita somente repositórios públicos acessíveis por HTTPS;
- `commitSha` é opcional ao solicitar análise; quando omitido, o serviço
  resolve a ponta da branch padrão e persiste o SHA imutável antes de
  enfileirar o job;
- o score começa em 100 e é limitado ao intervalo de 0 a 100;
- a API do MVP não possui autenticação e não deve ser exposta publicamente.
- o catálogo aceita inicialmente somente repositórios públicos do GitHub via HTTPS;
- `POST /repositories` recebe somente a URL e deriva nome, provedor, identificador externo e branch padrão;
- URLs de repositórios repetidas respondem `409 Conflict`;
- `GET /repositories` não possui paginação no MVP.
