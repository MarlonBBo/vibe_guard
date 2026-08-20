# VibeGuard — instruções permanentes

## Contexto

O VibeGuard analisa repositórios de código e identifica problemas que possam
reduzir a confiabilidade de aplicações. O MVP usa somente análise estática,
determinística e assíncrona. IA, LLM e execução dinâmica de código estão fora
do escopo.

## Stack obrigatória do MVP

- Node.js e TypeScript
- Express
- PostgreSQL
- Redis e BullMQ
- Docker e Docker Compose

## Regras de implementação

- Organizar o código por funcionalidade, conforme `docs/architecture.md`.
- Evitar abstrações sem uma necessidade concreta no código atual.
- Validar entradas externas com Zod.
- Usar logs estruturados e tratar falhas de PostgreSQL, Redis, Git,
  filesystem, filas e workers.
- O PostgreSQL é a fonte de verdade para análises e seus estados.
- Jobs BullMQ carregam somente `analysisId`.
- Nunca executar código vindo dos repositórios analisados.
- Sempre remover o workspace temporário, inclusive quando a análise falhar.
- Cada critério de aceite deve ter teste anotado com `@spec:AC-xxx`.
- Uma feature só está pronta após `onp-spec verify <feature>` e
  `onp-spec audit --ci` passarem.

## Qualidade mínima

Toda entrega deve manter lint, typecheck, testes e build executáveis na CI.
Testes não podem ser removidos, enfraquecidos ou pulados para fazer o gate
passar.
