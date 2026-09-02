## Problem

The `/users` area is a legacy, incomplete admin surface: no create UI, broken department edit flow, unauthenticated `/api/users` and `/api/departamentos`, password hash leaks, and no admin password reset. Fleet links here for MOTORISTA registration but the page cannot create users.

## Goals

- [ ] ADMIN-only user management UI (list, search, create, edit, inactivate/reactivate)
- [ ] RESTful `/api/users` with use-case architecture (aligned with trucks/frota)
- [ ] Admin password reset via dedicated endpoint (separate from first-login flow)
- [ ] Soft deactivate (`isActive`) — no hard delete; inactive users cannot log in
- [ ] Department link fix (add vs update function)
- [ ] Generic form builder reused by Users and TruckForm
- [ ] Deep link from Fleet: `/users?create=1&role=MOTORISTA`
- [ ] Re-enable nav link with `allowedRoles={["ADMIN"]}`

## Design decisions (confirmed)

| Area | Decision |
|------|----------|
| Access | ADMIN only (frontend + backend) |
| Create | Full form via `POST /api/users`; public register removed |
| Password on create | Admin sets temp password; `mustChangePassword: true` |
| Admin reset | `POST /api/users/:id/reset-password`; default `mustChangePassword: true` |
| `codRep` | Required when `role = VENDAS` |
| Department | Max 1 dept; required for `GERENTE_DPTO` and `ALMOX` |
| Deactivate | `isActive` field (Prisma migration); reactivate in same UI |
| List | Active users by default; toggle to show inactive |
| Roles | All 7 Prisma roles; block self-demotion of own ADMIN |
| Login.tsx | Out of scope (unchanged) |
| AddDptoButton | Kept on users page header |

## Implementation slices (vertical)

1. **Slice 1** — Secure API (auth middleware, DTO without password)
2. **Slice 2** — Create user (`POST /api/users` + use case)
3. **Slice 3** — List + search (backend list + read-only UI)
4. **Slice 4** — Edit user + department link fix
5. **Slice 5** — Admin reset password
6. **Slice 6** — Soft deactivate + login guard
7. **Slice 7** — Form builder + UserForm create/edit
8. **Slice 8** — TruckForm migration to form builder
9. **Slice 9** — ADMIN route/nav + Fleet deep link
10. **Slice 10** — Department feature refactor (auth, dedupe repository)

## Related security findings

- #78 — admin APIs without server-side gate
- #77 — public register role escalation

## Out of scope

- Login.tsx UI refactor
- Multi-department per user
- Hard delete
- Self-service password change (logged-in user, non-first-login)

## Test tracking

- [x] Test suite: #87 — Test suite: Users admin management refactor
