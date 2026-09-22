# Quality Gate da Codebase

O workflow [`ci.yml`](./workflows/ci.yml) roda em cada PR direcionado à `main`.

## O que o CI faz

1. Conta linhas **adicionadas** no diff `base...head` (arquivos de teste excluídos) e falha se passar de **300**.
2. Instala dependências de `frontend/` e `backend/`.
3. Roda ESLint (frontend), TypeScript `--noEmit` e `npm run build` em ambos os pacotes (inclui `vite build` no frontend — smoke test no runner do GitHub, sem deploy).
4. Roda testes unitários com cobertura (`test:coverage`) no PR.
5. Compara a quantidade de testes unitários (`# tests` do runner) entre a base e o head; falha se algum pacote tiver menos testes que a base.
6. Publica cobertura no Summary da execução.

Arquivos ignorados no limite de tamanho: `*.test.ts(x)`, paths sob `test/` e `__tests__/`, e tudo sob `.github/` (harness/CI).

## Política do gate

O PR falha quando:

- ESLint reporta erro;
- typecheck ou build falha;
- algum teste unitário falha;
- a quantidade de testes (backend ou frontend) é menor que na base do PR;
- o PR adiciona mais de 300 linhas fora de arquivos de teste.

Cobertura percentual é **reportada**, mas nesta versão **não** barra queda de %.

Fora deste CI: Prisma validate/generate/migrate, Postgres/`test:integration`, CodeQL, npm audit, Issues automáticas.

## Onde consultar

Resultado no **Summary** da execução e no artifact `coverage-and-test-counts`. Reprocessar com **Re-run jobs**.

O workflow não tem agendamento nem push comum: valida alterações antes do merge em `main`.
