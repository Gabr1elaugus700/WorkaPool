# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - For page-size cursors fetched as PAGE_SIZE+1, test a dataset of exactly PAGE_SIZE and assert hasOlder false.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `backend/useCases` · harmful: 0
- features: overview-customer-observation-chat
- evidence: M5 ListOverviewCustomerObservationsUseCase.ts:63 (backend/useCases)
- last seen: 2026-09-30T13:34:55Z

### L-002 - When a spec edge case depends on a cache side effect (refetch on reopen), extract the decision to a pure helper or test the hook with a real QueryClient.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `frontend/hooks` · harmful: 0
- features: overview-customer-observation-chat
- evidence: M7 useOverviewCustomerObservations.ts:57 (frontend/hooks)
- last seen: 2026-09-30T13:34:55Z

### L-003 - When the spec fixes an error copy, assert the exact copy for server and network failures; do not surface apiFetch server messages instead.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `frontend/utils` · harmful: 0
- features: overview-customer-observation-chat
- evidence: OBSCHAT-03 AC7 overviewCustomerObservationsState.utils.test.ts:220 (frontend/utils)
- last seen: 2026-09-30T13:34:55Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
