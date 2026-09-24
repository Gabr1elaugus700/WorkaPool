---
name: create-github-issue
description: Cria issues estruturadas no GitHub a partir de insights do usuario. Use quando o usuario pedir para registrar bugs, melhorias, refatoracoes ou tarefas para nao perder contexto.
---

# Create GitHub Issue

Atue como Tech Lead Engenheiro de Software e transforme qualquer insight do usuario em uma GitHub Issue estruturada, criando-a via GitHub CLI.

## Quando usar
Use esta skill sempre que o usuario disser algo como:
- "criar task"
- "anotar isso"
- "criar issue"
- "não quero perder isso"
- ou descrever uma melhoria, bug ou refatoração
- quando, durante uma implementacao, identificar uma possivel melhoria/correcao

## Regras
- NAO alterar codigo
- NAO executar build
- APENAS criar a issue
- Quando faltar clareza sobre a issue, sempre questione o usuario
- SEMPRE adicionar labels na issue: exatamente um `type:*` **e** ≥1 label de natureza

## Labels — pipeline (obrigatório, exatamente um)

| Label | Quando |
| --- | --- |
| `type:feature` | Feature, melhoria ou trabalho planejado — pipeline completo (PRD/grill-me quando aplicável) |
| `type:hotfix` | Correção urgente/operacional — mesma CI, sem cerimonial de PRD |

Heurística:
- Bug operacional urgente / produção quebrada → `type:hotfix` + `bug`
- Bug não urgente, melhoria, feature nova → `type:feature` + natureza adequada (`bug` ou `enhancement`)
- Refactor, docs, testes, infra, AI → em geral `type:feature` + a natureza correspondente

## Labels — natureza (obrigatório, ≥1)

- bug → quando algo existente não funciona como esperado ou está causando um erro operacional
- enhancement → quando for melhoria ou nova funcionalidade ou feature nova
- documentation → quando envolver documentação
- refactor → quando for melhoria interna no código sem alteração de comportamento externo
- test → quando for criação, ajuste ou melhoria de testes automatizados
- performance → quando for otimização de desempenho (tempo de resposta, queries, consumo, etc)
- infra → quando envolver infraestrutura, deploy, Docker, CI/CD, banco de dados ou ambiente
- ai → quando envolver lógica de IA, prompts, agentes, automações com LLM ou comportamento inteligente

## Epic (issue pai + filhas)

Quando o trabalho for uma epic (varias issues entregues numa branch pai `epic/<n>-slug`):
- **Issue pai:** `type:feature` + natureza + `epic`. No corpo, secao `## Filhas` com checklist `- [ ] #<m>` (atualizar a cada filha criada).
- **Issue filha:** pergunte o numero da pai se nao estiver claro. Inclua `Parte de #<n>` no inicio do corpo e vincule como sub-issue:

```bash
child_id=$(gh api repos/{owner}/{repo}/issues/<m> --jq .id)
gh api repos/{owner}/{repo}/issues/<n>/sub_issues -X POST -F sub_issue_id=$child_id
```

Se o vinculo de sub-issue falhar, mantenha so o `Parte de #<n>` + checklist na pai e avise o usuario. Fluxo de branch/PR da epic: [github-issue-branch-pr.mdc](../../rules/github-issue-branch-pr.mdc).

Labels disponiveis no repositorio:
- epic (Issue pai de uma epic) - `#3E4B9E`
- type:feature (Feature — full pipeline) - `#0E8A16`
- type:hotfix (Hotfix — same CI, no PRD ceremony) - `#D93F0B`
- bug (Something isn't working) - `#d73a4a`
- documentation (Improvements or additions to documentation) - `#0075ca`
- duplicate (This issue or pull request already exists) - `#cfd3d7`
- enhancement (New feature or request) - `#a2eeef`
- help wanted (Extra attention is needed) - `#008672`
- invalid (This doesn't seem right) - `#e4e669`
- question (Further information is requested) - `#d876e3`
- wontfix (This will not be worked on) - `#ffffff`
- refactor (Code improvement without behavior change) - `#fbca04`
- test (Add or improve tests) - `#0e8a16`
- performance (Performance improvements) - `#5319e7`
- infra (DevOps / infra / deployment) - `#1d76db`
- ai (AI-related logic or prompt changes) - `#c5def5`

### Regras para label
- Sempre incluir **um** de: `type:feature` | `type:hotfix`.
- Sempre incluir **pelo menos uma** label de natureza.
- Priorize clareza e contexto técnico.
- Se aplicável, use mais de uma label de natureza.
- Issue pai de epic: adicionar também `epic`.

## Estrutura da Issue

Title:
Deve ser curto, direto e técnico

Body:
Deve conter:

## Contexto
Explique o problema atual

## Objetivo
O que precisa ser feito

## Escopo Técnico
Detalhes técnicos claros do que deve ser alterado

## Critérios de Aceite
- [ ] Condição 1
- [ ] Condição 2

## Observações
Opcional

## Labels
Selecionar automaticamente: um `type:*` + natureza(s) adequadas.

## Execução

Gerar e executar o comando (incluir `type:*` e natureza no `--label`):

gh issue create \
  --title "<TITLE>" \
  --body "<BODY>" \
  --label "type:feature,enhancement"

## Importante
- Escape corretamente aspas
- Não quebrar o comando
- Executar no terminal do projeto
- Nunca criar issue sem `type:feature` ou `type:hotfix`
