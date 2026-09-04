---
target: users components post-polish
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\gabriel\\WorkaPool\\frontend\\src\\features\\users\\components\\TableUsers.tsx"
target_fingerprint: "sha256:06d9d8fec07fe272a42723cb15d9a7d6daa03dbb1123be89d6d9ef841330bf38"
target_path: "C:\\Users\\gabriel\\WorkaPool\\frontend\\src\\features\\users\\components\\TableUsers.tsx"
timestamp: 2026-09-04T11-15-51Z
slug: ntend-src-features-users-components-tableusers-tsx
---
---
target: users components post-polish
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\gabriel\\WorkaPool\\frontend\\frontend\\src\\features\\users\\components\\TableUsers.tsx"
timestamp: 2026-09-04T11-14-56Z
slug: ntend-src-features-users-components-tableusers-tsx
---
Method: dual-agent (A: 9df72aaf-9dfa-4d9f-a0c2-0c8b63e8dceb · B: 6fb57ce2-a21c-46ca-b8b2-55af0b90353c)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + toasts + submitting labels; no result count / filter chrome |
| 2 | Match System / Real World | 3 | PT-BR + role/função formatters; still generic CRUD directory |
| 3 | User Control and Freedom | 3 | Cancel + submit lock solid; no clear-search |
| 4 | Consistency and Standards | 2 | AddDptoButton on Usuários breaks feature IA |
| 5 | Error Prevention | 3 | AlertDialog + minLength + must-change default |
| 6 | Recognition Rather Than Recall | 4 | Labeled row actions + semantic badges |
| 7 | Flexibility and Efficiency | 1 | No bulk / accelerators; one-row-at-a-time |
| 8 | Aesthetic and Minimalist Design | 2 | Action wrap + wrong header CTA = noise |
| 9 | Error Recovery | 3 | Toast errors; form kept on failed reset |
| 10 | Help and Documentation | 1 | Password hint only; empty not onboarded |
| **Total** | | **28/40** | **Good** |

#### Design Specificity Verdict

**LLM assessment**: Still category-interchangeable admin CRUD with WorkaPool vocabulary bolted on. Product character lives in PT-BR ops copy, Pool Green Ativo badge, and role/função formatters — not in layout or Operations Console framing. Prior wounds (icon-only actions, raw enums, broken reset chrome) are closed.

**Deterministic scan**: `detect.mjs` on components + `usersView.tsx` exited 0 with `[]` — **0 findings**. Detector agrees the surface is pattern-clean; remaining issues are IA/hierarchy/efficiency.

**Visual overlays**: None. Browser visualization skipped — no browser automation in this session.

#### Overall Impression

Clear lift from **23 → 28/40**. Directory is now Operate-legible for day-to-day CRUD. Ceiling is set by header IA (`AddDptoButton`), equal-weight row actions, empty/help gaps, and no power path — largely intentional leftovers from top-3 scope.

#### What's Working

1. Row actions labeled (Editar / Redefinir senha / Inativar|Reativar) with aria-labels and aria-hidden icons.
2. Scanability: Ativo/Inativo badges, formatUserRoleLabel / formatUserFuncaoLabel, truncate + overflow-x-auto.
3. Reset dialog production-shaped: Cancel + Redefinir, lock while submitting, form reset, min-length hint.

#### Priority Issues

**[P1] AddDptoButton on Usuários header**
- Wrong primary job beside Novo usuário; hurts single-focus and consistency.
- Fix: remove or relocate to Departamentos.
- Suggested: `/impeccable distill`

**[P1] Equal-weight triple action cluster**
- Editar / Redefinir / Inativar all outline sm — high-stakes and routine look identical; wraps on narrow widths.
- Fix: Editar primary; quieter secondary / overflow for reset and active.
- Suggested: `/impeccable layout` or `/impeccable distill`

**[P2] Empty state still text-only**
- No icon/title/CTA; create lives only in header. (Known prior out-of-scope.)
- Suggested: `/impeccable onboard`

**[P2] No power-user / batch path**
- No multi-select or bulk status; H7 remains 1.
- Suggested: `/impeccable shape` or `/impeccable harden`

**[P3] Active search not visible / clearable**
- defaultValue + Buscar; no clear chip when search is set.
- Suggested: `/impeccable polish`

#### Persona Red Flags

**Alex**: Labeled actions help finding controls, not throughput — still no bulk.

**Sam**: Much better (labels, hints, Cancel). Residual: dense sm targets when wrapped; no live-region on skeleton.

**ADMIN Marina**: Can scan status/acesso and reset soberly. Still jolted by departamento create on Usuários; empty list doesn’t hand her Novo usuário.

#### Minor Observations

- Skeleton continuity with table card is good.
- Ações column still dominates width with three labeled buttons.
- Filter-aware empty copy would help when “Mostrar inativos” / search yield zero.

#### Questions to Consider

- Why does the first control on Usuários create a departamento?
- Should Redefinir / Inativar share weight with Editar?
- When empty says “crie o primeiro cadastro,” why isn’t that a button?
