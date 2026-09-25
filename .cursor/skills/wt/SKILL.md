---
name: wt
description: Cria ou remove a worktree de uma issue pelo scripts/worktree.ps1, com nome de branch e pasta padronizados (standalone, epic ou filha de epic). Acionada só via /wt.
disable-model-invocation: true
---

# /wt — worktree por issue

Cria ou remove worktrees **sempre** por [`scripts/worktree.ps1`](../../../scripts/worktree.ps1), seguindo [github-issue-branch-pr.mdc](../../rules/github-issue-branch-pr.mdc).

Exemplos de uso:

- `/wt 123` — descobre o modo pela issue
- `/wt 123 epic 120 observacoes` — filha da epic 120, slug `observacoes`
- `/wt remove 123`

## Regras

- **Nunca** rodar `git worktree add`, `git checkout -b` ou `git branch` na mão. Se o script falhar, reporte o erro e pare; não contorne.
- Não assumir epic nem slug: o que não vier nos argumentos nem der para deduzir da issue, pergunte (use `AskQuestion`).
- Não mexer na worktree atual (sem `checkout`, `stash`, `pull`).

## Fluxo — criar

1. **Issue.** Sem número → pergunte. Se ainda não existe issue, crie antes com a skill [create-github-issue](../create-github-issue/SKILL.md) e volte aqui.
2. **Ler a issue:**

   ```bash
   gh issue view <n> --json number,title,state,labels,body
   ```

   - `state` fechado → avise e pare.
   - Sem `type:*` ou sem natureza → completar labels antes (regra de branches).
3. **Modo e tipo:**

   | Sinal | Comando do script |
   | --- | --- |
   | Label `epic` | `new-epic` |
   | Corpo com `Parte de #<pai>` ou epic nos argumentos | `new-child -Epic <pai>` |
   | Nenhum dos dois | Pergunte: standalone ou filha de qual epic? |

   `-Type hotfix` se a issue tiver `type:hotfix`; senão `feature`.
4. **Slug.** Se não veio nos argumentos, proponha a partir do título: kebab-case, minúsculo, sem acento, 2 a 5 palavras. Confirme com o usuário antes de criar.
5. **Rodar** a partir da raiz de qualquer worktree do repo:

   ```powershell
   $root = git rev-parse --show-toplevel
   & "$root/scripts/worktree.ps1" new-child -Epic 120 -Issue 123 -Slug observacoes -Type feature
   ```

   Variantes: `new-epic -Issue <n> -Slug <slug>` (já faz push da epic) e `new -Issue <n> -Slug <slug> -Type <tipo>`.
6. **Reportar** ao usuário: pasta criada, branch, base e para onde vai o PR (`main` ou `epic/<pai>-slug`). Ofereça abrir a pasta como workspace (ferramenta `move_agent_to_root` do `cursor-app-control`, se disponível).

## Fluxo — remover

`/wt remove <n>`: confirme que o PR da issue foi mergeado (`gh pr list --state merged --search "<n>"`); se não foi, pergunte antes. Depois:

```powershell
& "$(git rev-parse --show-toplevel)/scripts/worktree.ps1" remove -Issue <n>
```

Não rode de dentro da worktree que será removida (o script recusa). Para filha de epic, lembre do `gh issue close <n>` se a issue ainda estiver aberta.
