# WorkaPool Contexts

Use this map when choosing where new TypeScript belongs. Prefer an existing folder that already owns the behavior.

## Repo roots

- Frontend app: `frontend`
- Backend app: `backend`

## Frontend (`frontend/src`)

| Folder | Owns |
| --- | --- |
| `features/<feature>/views/` | Route-level screens: params, fetching, orchestration, phase switching |
| `features/<feature>/pages/` | Same role as views when the feature already uses `pages/` (e.g. cargo) |
| `features/<feature>/components/` | Feature UI pieces consumed by a view/page |
| `features/<feature>/hooks/` | Feature-scoped React hooks |
| `features/<feature>/services/` | Feature API clients / React Query wrappers |
| `features/<feature>/types/` | Feature DTOs and domain types |
| `features/<feature>/viewmodels/` | View-model glue when the feature uses that layer |
| `features/<feature>/models/` | Client-side models when the feature uses that layer |
| `features/<feature>/utils/` | Feature-only helpers |
| `pages/` | Thin route entry wrappers and older screens not yet under `features/` |
| `components/<area>/` | Legacy area UI (e.g. `cargas`, `metas`) — prefer `features/` for new work |
| `components/ui/` | Shared primitives — treat as vendor; do not SRP-split or barrel-wrap |
| `layout/` | App chrome (DefaultLayout, shell) |
| `auth/` | AuthContext, PrivateRoute, session helpers |
| `hooks/` | Cross-feature React hooks |
| `lib/` | API base/fetch helpers, shared pure utilities |
| `services/` | Cross-feature or legacy API hooks not yet under a feature |
| `types/` | Shared DTO types used across features |
| `utils/` | Shared formatting / small pure helpers |
| `routes/` | Route table wiring |
| `validators/` | Shared form/input validators |

### Frontend placement rules

- New screen flow → add or extend a `*View` / feature `page` under `features/<feature>/`, extract UI into `features/<feature>/components/`.
- New UI for an existing feature → sibling file in that feature's `components/`.
- Domain type used by API + multiple features → `types/` or the owning feature `types/` if still single-owner.
- Type only used by one component → colocate in that component file.
- Do not dump feature helpers into root `lib/` / `utils/` when they belong under `features/<feature>/`.

## Backend (`backend/src`)

| Folder | Owns |
| --- | --- |
| `features/<domain>/useCases/` | One use-case class/file per application action |
| `features/<domain>/http/controllers/` | HTTP adapters (preferred when the feature already has `http/`) |
| `features/<domain>/http/routes/` | Route registration |
| `features/<domain>/http/schemas/` | Request/response validation schemas |
| `features/<domain>/controllers/` | HTTP adapters (legacy flat layout inside a feature) |
| `features/<domain>/routes/` | Route registration (legacy flat layout) |
| `features/<domain>/schemas/` | Validation schemas (legacy flat layout) |
| `features/<domain>/repositories/` | Persistence ports and Prisma/SQL adapters |
| `features/<domain>/mappers/` | DTO ↔ domain mapping |
| `features/<domain>/entities/` | Domain entities |
| `features/<domain>/services/` | Domain services that are not a single use-case |
| `features/<domain>/types/` | Domain-only types |
| `features/<domain>/CONTEXT.md` | Ubiquitous language for that domain — read before naming |
| `middlewares/` | Express middleware (auth, validate, etc.) |
| `config/` | Env/config loaders |
| `utils/` | Cross-domain pure helpers |
| `schedulers/` | Cron / watchdog jobs |
| `controllers/`, `routes/`, `services/`, `repositories/` (root) | Legacy only — do not add new domains here |

### Backend placement rules

- New domain action → new file under that feature's `useCases/`.
- New HTTP endpoint → controller + route + schema next to the owning feature; logic stays in the use-case (or service when the feature has not adopted use-cases yet).
- Match the folder style already used by that feature (`http/...` vs flat `controllers/`/`routes/`/`schemas/`).
- Do not park domain logic in root `utils/` / `services/` unless two or more domains truly own it.
- Read `features/<domain>/CONTEXT.md` when present before inventing names.

## Anti-patterns

- Growing a `*View` / page into a multi-region UI dump instead of feature components.
- New `index.ts` barrels for convenience re-exports.
- Putting new product UI into `components/ui/`.
- Extending root `backend/src/controllers` for a domain that already lives under `features/`.
- Mixing unrelated use-cases into one backend file.
- Dumping feature helpers into root `lib/` / `services/` when they belong under `features/<feature>/`.
