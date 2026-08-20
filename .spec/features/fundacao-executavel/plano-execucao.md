# Plano de execução — fundacao-executavel

> gerado por `onp-spec plano` em 2026-08-20 04:28 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano fundacao-executavel`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano fundacao-executavel --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/fundacao-executavel`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/fundacao-executavel-faixa-1` — worktree `../onp-worktrees/vibe_guard-fundacao-executavel-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Configurar toolchain e manifesto | `gpt-5.6-terra` | medium | `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore`, `.dockerignore`, `tests/toolchain.test.ts` |

#### faixa-2 — branch `spec/fundacao-executavel-faixa-2` — worktree `../onp-worktrees/vibe_guard-fundacao-executavel-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-002 | Criar configuração, logging e aplicação HTTP | `gpt-5.6-terra` | medium | `src/config/env.ts`, `src/shared/logger.ts`, `src/app/create-app.ts`, `src/app/server.ts`, `src/app/health.ts`, `tests/app-foundation.test.ts` |

#### faixa-3 — branch `spec/fundacao-executavel-faixa-3` — worktree `../onp-worktrees/vibe_guard-fundacao-executavel-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Integrar PostgreSQL, Redis, worker e readiness | `gpt-5.6-terra` | medium | `src/infrastructure/postgres.ts`, `src/infrastructure/redis.ts`, `src/app/readiness.ts`, `src/workers/index.ts`, `tests/readiness.test.ts`, `migrations/001-initial.sql` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/fundacao-executavel-faixa-4` — worktree `../onp-worktrees/vibe_guard-fundacao-executavel-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Configurar ambiente Docker Compose | `gpt-5.6-terra` | medium | `Dockerfile`, `docker-compose.yml`, `.env.example`, `tests/compose-contract.test.ts` |

#### faixa-5 — branch `spec/fundacao-executavel-faixa-5` — worktree `../onp-worktrees/vibe_guard-fundacao-executavel-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-005 | Configurar integração contínua e documentação operacional | `gpt-5.6-terra` | medium | `.github/workflows/ci.yml`, `README.md`, `tests/ci-contract.test.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/fundacao-executavel` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify fundacao-executavel` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Codex headless (codex exec)

```bash
bash .spec/features/fundacao-executavel/executar-tarefas.sh
```

Cada faixa roda `codex exec` com **janela de contexto limpa**, no seu worktree, com
`--model` e `model_reasoning_effort` já definidos por tarefa e sandbox `workspace-write`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/vibe_guard-fundacao-executavel-logs/`.

**Confirmação de custos — antes de executar**: os modelos e esforços por
tarefa estão nas tabelas acima; o agente CONFIRMA com o usuário se estão
dentro da licença/cota dele (modelo forte + esforço alto torra tokens).
Para gastar menos: `onp-spec plano fundacao-executavel --modelo gpt-5.6-luna --esforco baixo`
(tudo) ou por tarefa `onp-spec tarefa fundacao-executavel T-xxx --modelo <m> --esforco <nível>` — e regenere o plano.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo fundacao-executavel --tabela   # a tabela de andamento
onp-spec resumo fundacao-executavel            # o resumo em texto
```

