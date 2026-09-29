---
name: wt
description: Cria ou remove a worktree de uma issue (standalone ou epic) e a branch de uma filha dentro da worktree da epic, pelo scripts/worktree.ps1, com nomes padronizados. Acionada só via /wt.
disable-model-invocation: true
---

# /wt — worktree por issue

Cria e remove worktrees e branches de filha **sempre** por [`scripts/worktree.ps1`](../../../scripts/worktree.ps1), seguindo [github-issue-branch-pr.mdc](../../rules/github-issue-branch-pr.mdc).

Uma epic = uma worktree. Filha de epic **não** ganha worktree: vira uma branch dentro da worktree da epic, uma de cada vez.

Exemplos de uso:

- `/wt 123` — descobre o modo pela issue
- `/wt 123 epic 120 observacoes` — filha da epic 120, slug `observacoes`
- `/wt remove 123`

## Regras

- **Nunca** rodar `git worktree add`, `git checkout -b`, `git switch -c` ou `git branch` na mão. Se o script falhar, reporte o erro e pare; não contorne.
- Não assumir epic nem slug: o que não vier nos argumentos nem der para deduzir da issue, pergunte (use `AskQuestion`).
- Não mexer na worktree atual (sem `checkout`, `stash`, `pull`) fora do que o script faz.

## Fluxo — criar

1. **Issue.** Sem número → pergunte. Se ainda não existe issue, crie antes com a skill [create-github-issue](../create-github-issue/SKILL.md) e volte aqui.
2. **Ler a issue:**

   ```bash
   gh issue view <n> --json number,title,state,labels,body
   ```

   - `state` fechado → avise e pare.
   - Sem `type:*` ou sem natureza → completar labels antes (regra de branches).
3. **Modo e tipo:**

   | Sinal | Comando do script | Resultado |
   | --- | --- | --- |
   | Label `epic` | `new-epic` | worktree `epic-<n>-slug` |
   | Corpo com `Parte de #<pai>` ou epic nos argumentos | `new-child -Epic <pai>` | branch dentro da worktree da epic |
   | Nenhum dos dois | Pergunte: standalone ou filha de qual epic? | — |

   `-Type hotfix` se a issue tiver `type:hotfix`; senão `feature`.
4. **Slug.** Se não veio nos argumentos, proponha a partir do título: kebab-case, minúsculo, sem acento, 2 a 5 palavras. Confirme com o usuário antes de criar.
5. **Rodar** a partir da raiz de qualquer worktree do repo:

   ```powershell
   $root = git rev-parse --show-toplevel
   & "$root/scripts/worktree.ps1" new-child -Epic 120 -Issue 123 -Slug observacoes -Type feature
   ```

   Variantes: `new-epic -Issue <n> -Slug <slug>` (já faz push da epic) e `new -Issue <n> -Slug <slug> -Type <tipo>`.

   `new-child` falha se a worktree da epic não existir, tiver alterações não commitadas ou estiver em outra filha. Nesse último caso, pergunte se a filha atual já foi mergeada e, se sim, rode `finish-child` dela antes (ver abaixo).
6. **Reportar** ao usuário: pasta (para filha, a pasta da epic), branch, base e para onde vai o PR (`main` ou `epic/<pai>-slug`). Ofereça abrir a pasta como workspace (ferramenta `move_agent_to_root` do `cursor-app-control`, se disponível).

## Fluxo — remover

`/wt remove <n>`: confirme que o PR da issue foi mergeado (`gh pr list --state merged --search "<n>"`); se não foi, pergunte antes. Depois, pelo modo da issue:

| Issue | Comando |
| --- | --- |
| Filha de epic | `finish-child -Epic <pai> -Issue <n>` — volta a worktree da epic para `epic/<pai>-slug` atualizada e apaga a branch local da filha |
| Epic ou standalone | `remove -Issue <n>` — remove a pasta e a branch local |

```powershell
& "$(git rev-parse --show-toplevel)/scripts/worktree.ps1" finish-child -Epic <pai> -Issue <n>
& "$(git rev-parse --show-toplevel)/scripts/worktree.ps1" remove -Issue <n>
```

`finish-child` recusa se o conteúdo da filha ainda não estiver em `origin/epic/<pai>-slug`; só use `-Force` se o usuário confirmar que quer descartar a filha. `remove` não roda de dentro da worktree que será removida (o script recusa) e recusa worktree de epic com filha em andamento. Para filha de epic, lembre do `gh issue close <n>` se a issue ainda estiver aberta.
