# VibeGuard — decomposição do MVP

O MVP será entregue em features verticais e auditáveis. A ordem abaixo reduz
dependências e permite provar cada capacidade antes de avançar.

## 1. Fundação executável

Configurar Node.js, TypeScript, Express, testes, lint, build, logs, variáveis
de ambiente, Docker Compose, PostgreSQL, Redis e CI.

## 2. Catálogo de repositórios

Persistir e expor criação, listagem e consulta de repositórios com validação e
erros consistentes.

## 3. Solicitação assíncrona de análise

Criar análises em estado `queued`, publicar `{ analysisId }` no BullMQ e
responder `202 Accepted` sem aguardar processamento.

## 4. Worker e ciclo de vida

Consumir jobs, controlar transições de estado, preparar e limpar workspaces,
clonar o commit solicitado e tratar falhas de infraestrutura.

## 5. Motor determinístico e regras iniciais

Descobrir arquivos de Node.js/TypeScript/JavaScript/Express, executar regras
estáticas puras e produzir findings sem executar código do alvo.

## 6. Findings e score

Persistir findings, calcular score limitado a 0–100 e expor consulta da
análise e dos respectivos findings.

## 7. Robustez do MVP

Cobrir integrações, recuperação de falhas, logs estruturados e o gate de CI
com lint, typecheck, testes e build.

## Dependências principais

```text
Fundação
  -> Repositórios
  -> Solicitação de análise
  -> Worker
  -> Motor e regras
  -> Findings e score
  -> Robustez final
```

Algumas tarefas internas poderão rodar em paralelo depois que cada feature
tiver critérios de aceite e arquivos mapeados. O paralelismo será apresentado
e confirmado antes da execução.
