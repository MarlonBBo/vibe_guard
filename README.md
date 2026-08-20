# VibeGuard

VibeGuard faz análise estática, determinística e assíncrona de repositórios para encontrar problemas que reduzem a confiabilidade de aplicações. Esta fundação não executa código dos repositórios analisados e não inclui IA, LLM ou RAG.

## Pré-requisitos

- Node.js 24 LTS e npm
- Docker e Docker Compose (para a topologia local completa)

## Desenvolvimento local

Instale as dependências a partir do lockfile e execute o mesmo gate usado na CI:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## Ambiente com Docker Compose

Copie as variáveis de exemplo e defina uma senha local para PostgreSQL:

```bash
cp .env.example .env
docker compose up --build
```

O Compose inicia processos separados para API e worker, além de PostgreSQL e Redis. A API fica disponível em `http://localhost:3000`; `GET /health` verifica que o processo está vivo e `GET /ready` só responde com sucesso quando PostgreSQL e Redis estão disponíveis.

Para encerrar a topologia, use `docker compose down`. Para remover também os dados locais dos volumes, use `docker compose down -v`.

## Integração contínua

Em cada push e pull request, o workflow instala dependências com `npm ci` usando Node.js 24 e executa lint, typecheck, testes e build.
