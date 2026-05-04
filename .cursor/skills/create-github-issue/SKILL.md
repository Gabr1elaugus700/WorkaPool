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
- SEMPRE adicionar labels na issue

## Labels para issue no GitHub
Use as seguintes regras ao criar issues:

- bug → quando algo existente não funciona como esperado ou está causando um erro operacional
- enhancement → quando for melhoria ou nova funcionalidade ou feature nova
- documentation → quando envolver documentação
- refactor → quando for melhoria interna no código sem alteração de comportamento externo
- test → quando for criação, ajuste ou melhoria de testes automatizados
- performance → quando for otimização de desempenho (tempo de resposta, queries, consumo, etc)
- infra → quando envolver infraestrutura, deploy, Docker, CI/CD, banco de dados ou ambiente
- ai → quando envolver lógica de IA, prompts, agentes, automações com LLM ou comportamento inteligente

Labels disponiveis no repositorio:
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
- Sempre escolha pelo menos 1 label ao criar uma issue.
- Priorize clareza e contexto técnico.
- Se aplicável, use mais de um label.

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
Selecionar automaticamente os labels mais adequados ao contexto da issue.

## Execução

Gerar e executar o comando:

gh issue create \
  --title "<TITLE>" \
  --body "<BODY>" \
  --label "<LABELS>"

## Importante
- Escape corretamente aspas
- Não quebrar o comando
- Executar no terminal do projeto