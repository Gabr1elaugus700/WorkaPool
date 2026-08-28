# Quality Gate da Codebase

O workflow [`codebase-quality-gate.yml`](./workflows/codebase-quality-gate.yml) é executado em cada PR direcionado à `main`. Ele sobe um PostgreSQL descartável para permitir que os testes de integração existentes também façam parte da comparação.

## O que é comparado

O workflow executa a mesma coleta no commit-base e no commit do PR. O relatório compara:

- cobertura V8 de `lines`, `statements`, `functions` e `branches`;
- total de testes unitários e de integração, testes aprovados e falhas;
- erros e avisos do ESLint;
- resultado da verificação TypeScript;
- vulnerabilidades `npm audit` altas e críticas;
- alertas de segurança encontrados pelo CodeQL, com os novos alertas destacados pelo GitHub no PR.

Cada cobertura é apresentada com valor anterior, valor do PR e variação em pontos percentuais. Testes, ESLint e npm audit também mostram a variação quantitativa. Exemplo: `42,1% → 45,8% (+3,7 pp)`. O CodeQL usa a comparação nativa do GitHub e aparece na aba **Security** e nas anotações do PR.

## Política do gate

O PR falha quando:

- uma suíte de testes falha;
- a verificação TypeScript falha;
- qualquer índice de cobertura diminui;
- aumentam erros ou avisos do ESLint;
- aumentam vulnerabilidades altas ou críticas no `npm audit`;
- a análise do CodeQL não consegue concluir.

O CodeQL publica os alertas na aba **Security** do repositório. Falhas determinísticas da comparação também podem gerar Issues automaticamente. Issues são deduplicadas por PR e categoria. Em PRs vindos de forks, o GitHub não concede permissão de escrita ao token; nesse caso, o relatório continua funcionando, mas a Issue precisa ser criada manualmente.

## Onde consultar

O resultado aparece no **Summary** da execução e no artifact `quality-gate-report`. A execução pode ser reprocessada pelo botão **Re-run jobs** do GitHub Actions.

O workflow não possui agendamento nem é executado por push comum: sua finalidade é validar cada alteração antes do merge em `main`.
