---
target: users components (TableUsers + filters + reset + setActive)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\gabriel\\WorkaPool\\frontend\\src\\features\\users\\components\\TableUsers.tsx"
target_fingerprint: "sha256:5a74768b79dd6712543629730900f25586f4fe57cf619e9c3df0f11712445aa0"
target_path: "C:\\Users\\gabriel\\WorkaPool\\frontend\\src\\features\\users\\components\\TableUsers.tsx"
timestamp: 2026-09-04T10-21-13Z
slug: ntend-src-features-users-components-tableusers-tsx
---
Method: dual-agent (A: cd8fc405-1993-486b-adc7-9b7c19a77975 · B: ccd52313-fcea-4865-b134-c9d0900e449d)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + toasts solid; Status is plain text, not badge |
| 2 | Match System / Real World | 3 | PT-BR dialogs solid; table leaks raw role enums / “Dpto” |
| 3 | User Control and Freedom | 2 | Reset dialog has no Cancel; no clear-search |
| 4 | Consistency and Standards | 2 | Edit unlabeled vs reset/active aria-label; blue pencil vs tokens; footer pattern drift |
| 5 | Error Prevention | 2 | Active AlertDialog good; reset: min 6 only, no confirm, easy mis-submit |
| 6 | Recognition Rather Than Recall | 2 | Icon-only Ações force icon literacy |
| 7 | Flexibility and Efficiency | 2 | Search+inactive useful; no shortcuts/bulk; unlabeled icons slow power path |
| 8 | Aesthetic and Minimalist Design | 3 | Dense Operate OK; AddDptoButton + table caption are clutter |
| 9 | Error Recovery | 3 | Toast errors solid; list load has no inline retry |
| 10 | Help and Documentation | 1 | No tooltips on critical actions; thin help for access-recovery job |
| **Total** | | **23/40** | **Acceptable** |

#### Design Specificity Verdict

**LLM assessment**: Mostly category-interchangeable admin CRUD with a thin WorkaPool coat. Dialogs name WorkaPool and login, roles match Pool Técnica domains, and “Exigir troca no próximo login” defaults safely — but the list surface (generic h1, equal-weight outline icons, plain Ativo/Inativo, raw ADMIN enums, AddDptoButton in the header) could ship in any SaaS admin unchanged. Character lives in deactivate/reset dialogs; the grid is not authored for Marina’s “someone can’t log in” pressure scene.

**Deterministic scan**: `detect.mjs --json` on `frontend/src/features/users/components` (and each target file + `usersView.tsx`) exited 0 with `[]` — **0 findings**. Detector and LLM do not conflict; the issues are interaction/IA/copy gaps the pattern detector does not cover (icon-only critical actions, missing Cancel, unscannable status).

**Visual overlays**: No reliable user-visible overlay. Browser visualization skipped — no browser automation tool exposed in this session. Frontend appears listening on :5858 but was unreachable for agent navigation/injection.

#### Overall Impression

Solid Operate scaffolding (filters, skeletons, AlertDialog for inactivate, safe reset default) undermined by a mute icon row that hides the real job — unblock access. Biggest opportunity: make **Redefinir senha** / **Reativar** scannable and finish the reset flow like an ops recovery, not a CRUD mutation toast.

#### What's Working

1. **`UsersSetActiveButton` guardrail** — AlertDialog title/verb match (`Inativar` / `Reativar`), consequence copy names login + WorkaPool.
2. **Reset safety default** — `mustChangePassword` defaults true with clear PT-BR label; description scopes to `{userLogin}`.
3. **Filter IA** — “Buscar por nome ou login” + “Mostrar inativos” is the right triage for access admin.

#### Priority Issues

**[P0] Critical actions are icon-only without visible labels/tooltips**
- **What**: `EditarButton` (Pencil, no aria-label), KeyRound reset, UserX/UserCheck active — violates DESIGN.md icon-only rule.
- **Why it matters**: Under pressure, Marina cannot decode which glyph unblocks login; Sam gets an unlabeled edit control.
- **Fix**: Visible label or tooltip on every action (`Editar`, `Redefinir senha`, `Inativar`/`Reativar`); consider text+icon for reset as recovery primary.
- **Suggested command**: `/impeccable clarify`

**[P1] Reset password dialog breaks footer & control pattern**
- **What**: Footer is submit-only (“Redefinir” / “Salvando...”) — no Cancel outline; submitting copy mismatches verb.
- **Why it matters**: High-stakes modal with no explicit exit; inconsistent with `UserForm`; easy accidental commit on wrong row.
- **Fix**: Cancel (outline) + Redefinir; submitting label “Redefinindo…”.
- **Suggested command**: `/impeccable harden`

**[P1] Status & role unscannable**
- **What**: Plain “Ativo”/“Inativo”; Acesso shows raw `user.role` (`ADMIN`) while form uses human labels.
- **Why it matters**: Inactive rows don’t pop when “Mostrar inativos” is on; vocabulary mismatch forces recall.
- **Fix**: Semantic badges for status; map roles through the same labels as `UserForm`.
- **Suggested command**: `/impeccable colorize`

**[P2] Empty state incomplete**
- **What**: Single muted sentence; no icon/title/CTA; no distinction between no users vs no matches.
- **Why it matters**: Dead end on first run or over-filtered search.
- **Fix**: Icon + title + helper + CTA to Novo usuário; split empty vs no-results copy.
- **Suggested command**: `/impeccable onboard`

**[P2] Header IA pollution + thin reset “end”**
- **What**: `AddDptoButton` beside Novo usuário; success is only toast “Senha redefinida”.
- **Why it matters**: Wrong adjacent task; recovery ends without helping Marina communicate temp password / must-change.
- **Fix**: Move/demote department create; stronger post-reset end (restate must-change, copy affordance).
- **Suggested command**: `/impeccable distill` + `/impeccable clarify`

#### Persona Red Flags

**Alex (Power User)**: Click-to-search only; three equal unlabeled icons; no bulk activate/reset; no column sort — power path is click-guess-click.

**Sam (a11y)**: `EditarButton` icon-only with no aria-label; reset/active named for SR but no visible text; reset missing Cancel relies on dialog chrome alone.

**ADMIN Marina (Pool Técnica)**: Needs Redefinir/Reativar in &lt;30s — both anonymous icons; must already know “Mostrar inativos”; toast “Senha redefinida” doesn’t hand her what to tell the colleague. Inativar dialog is the only moment written for her.

#### Minor Observations

- TableCaption “Lista de usuários” is noise.
- Pencil `text-blue-500` fights Pool Green tokens.
- No `overflow-x-auto` on 7-column table.
- Skeleton 3 rows vs DESIGN 4–5.
- Empty copy says “cadastro administrativo” while CTA is “Novo usuário”.

#### Questions to Consider

- If Marina’s #1 job is unblock login in &lt;30s, why is Redefinir senha a mute key icon?
- What is Adicionar departamento doing on Usuários?
- After “Senha redefinida,” what should Marina hold that a toast cannot provide?
- Should Ativo/Inativo be the loudest column on this ops-console grid?

#### Cognitive load

4/8 checklist failures (high extraneous load: icon literacy, header IA pollution, enum recall). Role select in UserForm exposes 7 options when opened.
