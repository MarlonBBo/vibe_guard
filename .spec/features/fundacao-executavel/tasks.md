# Tasks: Fundacao executavel

> feature: fundacao-executavel

<!--
  Como ler este arquivo (o formato é verificado por `onp-spec audit`):
  - T-xxx = tarefa (código de rastreio, único no projeto inteiro).
  - Toda tarefa referencia em `Refs:` pelo menos uma história de usuário
    (US-xxx) ou critério de aceite (AC-xxx).
  - Toda tarefa lista os arquivos que cria/altera em `Arquivos:` — capriche:
    é o que decide o que `onp-spec plano` roda em PARALELO (arquivos
    disjuntos) e o que roda em sequência.
  - Campos opcionais por tarefa, usados pelo plano de execução:
    `- Modelo: claude-sonnet-5` e `- Esforço: alto` (baixo|medio|alto|xalto|max).
  - Uma tarefa só pode virar [concluida] quando os critérios de aceite dela
    tiverem prova PASS registrada por `onp-spec verify`.
  Status: pendente | em-andamento | concluida
    (atalho: `onp-spec tarefa <feature> <T-xxx> <status>`)
-->

## T-001 — Configurar toolchain e manifesto [concluida]
- Refs: US-001, AC-001, AC-002, US-005, AC-009
- Arquivos: package.json, package-lock.json, tsconfig.json, eslint.config.js, .gitignore, .dockerignore, tests/toolchain.test.ts
- Modelo: gpt-5.6-terra
- Esforço: medio
- Notas: Fixar Node.js 24, declarar todos os scripts e dependências da fundação e provar o contrato do manifesto sem adicionar bibliotecas de IA.

## T-002 — Criar configuração, logging e aplicação HTTP [concluida]
- Refs: US-002, AC-003, AC-004, US-003, AC-005
- Arquivos: src/config/env.ts, src/shared/logger.ts, src/app/create-app.ts, src/app/server.ts, src/app/health.ts, tests/app-foundation.test.ts
- Modelo: gpt-5.6-terra
- Esforço: medio
- Notas: Implementar validação com Zod, Pino, entrada da API e liveness sem depender de PostgreSQL ou Redis.

## T-003 — Integrar PostgreSQL, Redis, worker e readiness [concluida]
- Refs: US-002, AC-003, AC-004, US-003, AC-006
- Arquivos: src/infrastructure/postgres.ts, src/infrastructure/redis.ts, src/app/readiness.ts, src/workers/index.ts, tests/readiness.test.ts, migrations/001-initial.sql
- Modelo: gpt-5.6-terra
- Esforço: medio
- Notas: Criar ciclos de conexão e encerramento explícitos; readiness deve testar as duas dependências.

## T-004 — Configurar ambiente Docker Compose [concluida]
- Refs: US-004, AC-007
- Arquivos: Dockerfile, docker-compose.yml, .env.example, tests/compose-contract.test.ts
- Modelo: gpt-5.6-terra
- Esforço: medio
- Notas: Definir serviços separados para API e worker, além de PostgreSQL e Redis com healthchecks.

## T-005 — Configurar integração contínua e documentação operacional [concluida]
- Refs: US-001, AC-002, US-005, AC-008
- Arquivos: .github/workflows/ci.yml, README.md, tests/ci-contract.test.ts
- Modelo: gpt-5.6-terra
- Esforço: medio
- Notas: Executar npm ci, lint, typecheck, testes e build em push e pull request usando Node.js 24.
