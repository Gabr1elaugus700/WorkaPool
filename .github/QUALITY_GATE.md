# Quality Gate

O workflow [`ci.yml`](./workflows/ci.yml) roda em cada PR para `main`, em **um único job**.

## O que o CI faz

1. Instala `frontend/` e `backend/`, gera o Prisma client (necessário para typecheck/testes).
2. `lint` (frontend), `typecheck`, `build` e `test:coverage` nos dois pacotes.
3. Gates de PR ([`pr-quality-gate.mjs`](./scripts/pr-quality-gate.mjs)):
   - **tamanho:** falha se o PR adiciona mais de **300 linhas** fora de arquivos de teste
   - **testes:** falha se a quantidade de `test(` / `it(` no diff da base → head diminuiu
4. Publica cobertura e o resultado dos gates no Summary.

Arquivos ignorados no limite de 300 linhas: `*.test.*`, `*.spec.*`, pastas `test` / `tests` / `__tests__`.

## Política

O PR falha quando lint, typecheck, build ou testes falham; quando há menos testes que a base; ou quando passa de 300 linhas adicionadas (sem testes).

Cobertura percentual é **reportada**, mas **não** barra queda de % nesta versão.

Fora deste CI: Postgres / `test:integration`, CodeQL, npm audit, Issues automáticas.

## Onde ver

Summary da execução no GitHub Actions.
