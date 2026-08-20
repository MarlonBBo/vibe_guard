# VibeGuard — arquitetura do MVP

## Estilo

A aplicação usa arquitetura modular por funcionalidade. As camadas e
interfaces devem nascer de necessidades concretas; não criar abstrações para
possíveis usos futuros.

```text
src/
├── app/
├── modules/
│   ├── repositories/
│   ├── analyses/
│   └── findings/
├── analysis/
│   ├── analyzer.ts
│   ├── scanner.ts
│   └── rules/
├── workers/
├── queues/
├── infrastructure/
├── shared/
└── config/
```

## Componentes

### API Express

Valida entradas com Zod, coordena casos de uso e responde sem executar a
análise. Erros possuem respostas consistentes e logs estruturados.

### PostgreSQL

Armazena repositórios, análises, findings e o estado durável do processamento.
É a fonte de verdade; Redis não substitui o estado persistido.

### Redis e BullMQ

Transportam jobs assíncronos. Cada job contém somente `analysisId`; worker e
tentativas posteriores recarregam os demais dados do PostgreSQL.

### Analysis Worker

Para cada job:

1. busca a análise e o repositório;
2. marca a análise como `running`;
3. cria um workspace temporário;
4. clona o repositório e faz checkout do `commit_sha`;
5. entrega os arquivos ao motor de análise;
6. persiste findings e score;
7. remove o workspace em um bloco de finalização;
8. marca a análise como `completed` ou `failed`.

### Motor de análise

O worker coordena infraestrutura e ciclo de vida. `analyzer.ts` coordena a
avaliação, `scanner.ts` descobre e lê arquivos permitidos, e cada regra detecta
um problema sem efeitos colaterais. O motor inspeciona conteúdo, mas nunca
instala dependências nem executa scripts do repositório.

## Fluxo principal

```text
Cliente
  -> API: cria Analysis(queued) no PostgreSQL
  -> BullMQ: publica { analysisId }
  -> API: responde 202

Worker
  -> PostgreSQL: carrega Analysis + Repository e marca running
  -> Git/filesystem: prepara workspace no commit solicitado
  -> Analyzer/Rules: produz findings determinísticos
  -> PostgreSQL: salva findings + score e marca completed
  -> filesystem: remove workspace mesmo em caso de erro
```

## Score

O cálculo começa em 100, soma as penalidades dos findings e limita o resultado
ao intervalo de 0 a 100. A ordem dos findings não altera o resultado.

## Segurança operacional

- aceitar no MVP somente URLs HTTPS de repositórios públicos;
- manter a API sem autenticação restrita a ambiente local ou rede confiável;
- não executar `npm install`, scripts, binários ou comandos fornecidos pelo
  repositório analisado;
- tratar URL e conteúdo clonado como entrada não confiável;
- limitar recursos de clone e leitura quando os limites forem definidos;
- não registrar segredos ou conteúdo sensível desnecessário nos logs;
- executar cleanup em sucesso, falha e cancelamento tratável.
