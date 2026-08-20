# Constituição — v1.1.0

<!--
  Princípios inegociáveis do projeto. Não são estilo: são restrições.
  P-xxx = princípio (código de rastreio, como US/AC/T).
  Níveis: [DEVE] obrigatório · [RECOMENDADO] forte · [PODE] permitido/explícito.
  Todo [DEVE] precisa de verificação executável — senão o audit acusa
  "princípio sem verificação" (PRINCIPIO_SEM_VERIFICACAO). Formatos:
    - verificação(gate): satisfeita pelo próprio audit (só p/ princípios "meta")
    - verificação(teste): @principle:P-xxx
    - verificação(proibido): `regex` em `glob`
    - verificação(obrigatório): `regex` em `glob`
-->

## P-001 [DEVE] Todo requisito tem prova executável

Nenhuma feature é declarada pronta sem o audit em modo CI sair limpo (exit 0).
Este princípio é verificado pelo próprio mecanismo do audit (AC_SEM_TESTE,
AC_SEM_PROVA, TASK_CONCLUIDA_SEM_PROVA) — não precisa de teste extra seu.

- verificação(gate): intrínseca ao audit

## P-002 [RECOMENDADO] Segredos nunca em código

Chaves e senhas vêm de variáveis de ambiente, nunca hard-coded.

- verificação(proibido): `(api[_-]?key|senha|password)\s*[:=]\s*['"][^'"]{8,}` em `src/**/*.js`

## P-003 [DEVE] O MVP não utiliza inteligência artificial

A análise usa somente regras estáticas, explícitas e determinísticas. IA, LLM
e RAG não participam da API, do worker, do motor de análise ou do score.

- verificação(proibido): `(openai|anthropic|langchain|llamaindex|generative-ai)` em `package.json`

## P-004 [DEVE] Código do repositório analisado nunca é executado

API, worker, scanner, analyzer e regras podem inspecionar arquivos, mas não
instalam dependências nem executam scripts ou runtimes fornecidos pelo alvo.
Git é permitido apenas para clone, checkout e leitura de metadados.

- verificação(proibido): `(npm|npx|yarn|pnpm|bun|node|tsx|ts-node)\s+(install|run|exec|test|start)` em `src/**/*.ts`

## P-005 [RECOMENDADO] Abstrações nascem de necessidades concretas

O projeto favorece módulos por funcionalidade e implementações diretas. Uma
abstração compartilhada só é criada quando houver uso concreto que a justifique.
