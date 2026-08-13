# Secure TypeScript

Use this reference when WorkaPool code touches auth, tokens, user input, HTML/URLs, storage, or secrets.

## Defaults

- Treat all external input as untrusted: request bodies, query/path params, browser storage, and URL-derived values.
- Fail closed on authz checks; do not rely on the client to enforce role or representative (`codRep`) boundaries.
- Prefer existing shared helpers (validation middleware/schemas, auth middleware, typed errors) over ad hoc checks.

## Frontend

- Never put secrets, API private keys, or DB credentials in `VITE_*` env vars or client source — anything shipped to the browser is public.
- Keep auth tokens only in the established session path (`AuthContext` / `localStorage` via `getAuthHeaders` / `apiFetch`). Do not duplicate token storage in random components.
- Do not render unsanitized HTML. Avoid `dangerouslySetInnerHTML` unless the HTML is strictly controlled and necessary; prefer text nodes.
- Validate and encode values used in URLs, query strings, and navigation params before use.
- Do not log tokens, passwords, or full auth headers in the browser console or UI debug panels in production paths.

## Backend

- Validate request payloads with the feature schema (Zod/middleware `validate`) before use-case or service logic.
- Enforce role / ownership access in the HTTP layer (middleware or controller) before returning or mutating tenant or representative-scoped data.
- Keep DB, ERP/Sapiens, SMTP, and other credentials in server env only.
- Return safe client messages; do not leak stack traces, secrets, or internal host details in API bodies. Prefer typed `AppError` (see `api-error-standardization`) when introducing or refactoring error paths.
- Do not trust client-supplied role, `codRep`, or ids for authorization without server-side checks.

## Data Handling

- Prefer allowlists over free-form string passthrough for enums, statuses (`sitcar`, situação de carga), and phase values.
- Serialize only the fields the client needs; do not echo secrets or internal identifiers unnecessarily.
- When writing to `localStorage` or similar, store the minimum session fields already used by the app — no passwords, no API private keys.

## Verification

- For auth or input-boundary changes, add or update focused tests around rejection paths.
- Manually confirm secrets are absent from frontend bundles and from API error payloads when touching those surfaces.
