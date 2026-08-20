# Tasks: Catalogo repositorios

> feature: catalogo-repositorios

## T-006 - Inspecionar e normalizar repositorios publicos do GitHub [pendente]

- Refs: US-006, AC-010, AC-011, AC-012
- Arquivos: src/modules/repositories/github-repository.ts, tests/github-repository.test.ts
- Modelo: gpt-5.6-terra
- Esforco: medio
- Notas: Validar e canonicalizar URLs com Zod; consultar `git ls-remote --symref` via `execFile`, com timeout e sem shell; derivar nome, externalId e defaultBranch; nunca clonar nem executar codigo remoto.

## T-007 - Persistir o catalogo no PostgreSQL [pendente]

- Refs: US-006, US-007, US-008, AC-010, AC-013, AC-014, AC-015, AC-016
- Arquivos: migrations/002-create-repositories.sql, src/modules/repositories/repository.ts, src/modules/repositories/repository-store.ts, tests/repository-store.test.ts
- Modelo: gpt-5.6-terra
- Esforco: medio
- Notas: Criar tabela e indice unico para URL canonica; implementar create, list e findById com queries parametrizadas, UUID e mapeamento explicito entre snake_case e camelCase.

## T-008 - Expor a API de repositorios e integrar a aplicacao [pendente]

- Refs: US-006, US-007, US-008, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016
- Arquivos: src/modules/repositories/repositories-router.ts, src/modules/repositories/repository-schemas.ts, src/modules/repositories/github-repository.ts, src/modules/repositories/repository-store.ts, src/app/create-app.ts, src/app/server.ts, tests/repositories-api.test.ts
- Modelo: gpt-5.6-terra
- Esforco: medio
- Notas: Montar POST/GET/GET:id com dependencias injetaveis, traduzir validacao, remoto, duplicidade e ausencia para 400/422/409/404, preservar logs estruturados e provar todos os criterios na fronteira HTTP.
