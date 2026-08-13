---
name: writing-typescript
description: Apply SRP-oriented TypeScript organization and React componentization in WorkaPool. Use when creating, editing, reviewing, or refactoring JS/TS in frontend or backend — components, hooks, views, use-cases, services, utilities, constants, tests, imports/exports, performance-sensitive code, or secure code.
---

# Writing TypeScript

## Overview

Apply strict SRP-oriented source organization across WorkaPool (`frontend`, `backend`). Keep behavior scoped by feature/domain, keep file ownership obvious, and componentize React UI by responsibility. Prefer improving structure on the code you touch; do not mass-refactor unrelated legacy without an explicit ask.

Cross-skill boundaries:

- Deep-module interface vocabulary → `codebase-design` / `improve-codebase-architecture`
- Red→green test loop → `tdd`
- Typed API errors (`AppError`, codes, HTTP shape) → `api-error-standardization`

## WorkaPool Layout

Read `references/workapool-contexts.md` before adding or moving source files.

| Area | Put new code in |
| --- | --- |
| Route/screen orchestration | `frontend/src/features/<feature>/views/` (or `pages/` inside the feature) |
| Feature UI | `frontend/src/features/<feature>/components/` |
| Design-system primitives | `frontend/src/components/ui/` (do not reorganize) |
| Legacy area UI still under `components/` | Prefer `features/<feature>/` when creating new pieces; only extend `components/<area>/` when the change is tiny and already lives there |
| Feature hooks / API / types | `frontend/src/features/<feature>/{hooks,services,types,utils}/` |
| Cross-feature hooks / helpers | `frontend/src/hooks/`, `lib/`, `utils/`, `types/` |
| Auth/session | `frontend/src/auth/` |
| App chrome | `frontend/src/layout/` |
| Thin route entry | `frontend/src/pages/`, `routes/` |
| Domain backend | `backend/src/features/<domain>/` (`useCases`, `http` or `controllers`/`routes`/`schemas`, `repositories`, `mappers`, `entities`, `services`) |
| Cross-cutting backend | `backend/src/middlewares/`, `config/`, `utils/`, `schedulers/` |

## Core Rules

- Inspect the nearest existing feature/domain folder before adding or moving code.
- Put each implementation in the folder that owns its behavior.
- Keep at most one public value export per source file (one component, hook, function, class, service, or cohesive constant object).
- Export owned types/interfaces from the same file as their implementation when they describe that export; put cross-feature DTOs in `types/` (frontend) or the domain `schemas`/`entities`/`types` (backend).
- Do not create new `index.ts` barrels or multi-value re-export files. Import directly from the owning source file.
- For related runtime constants, export one cohesive typed object instead of many named constants.
- Extract repeated logic and UI patterns into narrowly owned abstractions before duplication spreads.
- Split long files when they mix unrelated behavior, rendering, data fetching, styles, constants, or helpers.
- Keep source moves behavior-preserving unless the user explicitly asks for behavior changes.
- Never use TypeScript `any`.

### Exceptions

- `components/ui/`: leave generated multi-export primitives as-is.
- Existing feature `index.ts` (e.g. `orderLoss`, cargo `components` barrel): do not expand it; prefer direct sibling imports for new files.
- Legacy root `backend/src/{controllers,routes,services,repositories}/`: do not grow these for new domains; put new work under `features/<domain>/`.

## React Componentization (required)

This skill owns structural componentization (SRP), not visual design.

When creating or editing frontend React UI:

1. **Views orchestrate; children present.** `*View` / feature `pages` own routing params, data fetching, session state, and phase switching. They must not accumulate large JSX for multiple UI regions.
2. **One responsibility per component file.** Layout shell, list row, empty state, dialog body, filter bar, phase panel, etc. each get their own file under the feature folder when they are distinct responsibilities.
3. **Split before the file grows.** If you are about to add a second distinct UI region, interaction mode, or phase to an existing component, extract first — then wire the parent.
4. **Colocate by feature.** Put extracted pieces in `features/<feature>/components/`, not back into a generic dump folder or unrelated `components/<area>/`.
5. **Name by role.** Prefer `PedidoCard`, `CargaDropzone`, `OrderDetailsModal` over vague names like `Helper` or `Section2`.
6. **Pass narrow props.** Children receive only what they render or invoke; keep fetch/side effects in the view/page or a dedicated hook.

Reference patterns in-repo: `features/orderLoss/views/OrderLossView.tsx` + `features/orderLoss/components/*`; `features/cargo/pages/ControleDeCargas.tsx` + `features/cargo/components/*`.

## Quality Gates

- Maintainability: one value export, direct imports, colocated owned types, feature folders, componentized React UI.
- Performance: avoid needless work, accidental quadratic paths, main-thread blocking, and unbounded buffering. See `references/performance.md` when relevant.
- Security: validate external input, avoid injection/XSS, keep secrets out of client bundles. See `references/secure-typescript.md` when relevant.
- Verification: run focused tests when risk warrants it; for frontend style/code edits run `npm run lint` in `frontend`. Do not run production build commands unless the user asks.

## Workflow

1. Check the current tree and relevant tests before editing.
2. Choose the existing feature/domain folder by responsibility; create a new feature folder only when none fits.
3. For React UI, decide the view/page vs feature-component split up front; extract regions into sibling files.
4. Keep implementation files narrow: one exported class, function, hook, component, service, or constant collection.
5. Colocate types with the export, or place shared DTOs in the shared types/schema layer.
6. Update imports to direct source paths after moves.
7. Run focused verification appropriate to the change, including frontend lint for code/style edits.

## References

- Read `references/workapool-contexts.md` before editing source organization.
- Read `references/performance.md` for render paths, hot loops, async fanout, large lists, or large data handling.
- Read `references/secure-typescript.md` when code touches user input, HTML/URLs, storage, auth, API tokens, or secrets.
