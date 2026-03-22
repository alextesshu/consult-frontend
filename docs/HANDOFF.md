# Handoff

Last updated: 2026-03-23  
Owner: agent-maintained  
Canonical file: `docs/HANDOFF.md`  
Governance: `docs/HANDOFF_RULES.md`  
Phase archive: `docs/PHASE_CLOSE_SUMMARIES.md`

## Current Phase

Frontend legal minimum baseline for controlled beta is now integrated:
- legal pages: done (`/terms`, `/privacy`, `/disclaimer`, `/support-and-data-requests`)
- footer legal links: done
- auth legal notice (Terms + Privacy): done
- next functional slice remains CRM history explicit-state normalization

## System State

- Repository: Consult frontend (`Vue 3`, `Vite`, `TypeScript`, `Pinia`, `Vue Router`, `Vitest`).
- Canonical persistent handoff file is this document.
- Public session execution contract is external meeting-link based (`meeting_url`/`meeting_provider`), no built-in video runtime.
- Legal minimum pages are statically served via frontend routes and integrated into global footer/auth entrypoints.
- Current high-priority references for UI work:
  - `docs/UI_SHAPE_STANDARD.md`
  - `docs/HANDOFF.md`
  - `docs/HANDOFF_RULES.md`

## Stable Areas

- `TherapistClientsView` has isolated explicit-state handling for:
  - clients list (`loading/error/empty/retry`)
  - reminders (`loading/error/empty/retry`)
- Legal navigation baseline is in place:
  - global footer links for Terms/Privacy/Disclaimer/Support
  - auth notice links for Terms/Privacy
- `CabinetView` secondary `/me` snapshot branch has explicit loading/error/retry behavior.
- Booking/session error surfaces rely on shared backend-coded error mapping (`reason_code` -> `code` -> `detail` fallback).

## Active Work

- Keep CRM track narrow in `TherapistClientsView` without broad refactor.
- Next target: history surface explicit-state normalization (`loading/error/empty/retry`) with local retry scoped to history source.
- Preserve already-stabilized clients-list/reminders branches unchanged.

## Immediate Next Step

Implement and validate one focused `TherapistClientsView` history-state slice:
- explicit `loading/error/empty/retry`
- targeted specs only for history branch behavior
- handoff sync after completion

## Critical Rules

- Do not invent API fields or change contracts without explicit backend confirmation.
- Keep UI states explicit and scoped per data source; avoid shared top-level error leakage.
- Reuse existing shared UI/state patterns (`LoadingSkeleton`, `EmptyState`, existing composables/stores).
- Keep handoff governance aligned with `docs/HANDOFF_RULES.md`:
  - `HANDOFF.md` = compact current snapshot
  - `PHASE_CLOSE_SUMMARIES.md` = append-only historical phase archive
