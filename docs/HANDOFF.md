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
- public homepage repositioning for PRO CONSULT: done (structured practice + shareable public profile narrative)
- public specialist profile polish pass: done (landing-style hero, clearer booking CTA hierarchy, improved about/materials readability)
- specialist profile documents MVP: done (cabinet document management + public profile documents section with non-verification disclaimer)
- profile capability fields: done (online/offline availability + offline location + completed sessions bucket display wired across cabinet/public/catalog)
- next functional slice remains CRM history explicit-state normalization

## System State

- Repository: Consult frontend (`Vue 3`, `Vite`, `TypeScript`, `Pinia`, `Vue Router`, `Vitest`).
- Canonical persistent handoff file is this document.
- Public session execution contract is external meeting-link based (`meeting_url`/`meeting_provider`), no built-in video runtime.
- Legal minimum pages are statically served via frontend routes and integrated into global footer/auth entrypoints.
- Public homepage now follows the PRO CONSULT two-core promise:
  - structured practice management for specialists
  - shareable public profile / landing presence for attracting clients
- Public specialist profile surface is aligned with homepage promise:
  - stronger first-screen specialist presentation
  - explicit top + lower booking CTA path
  - clearer trust/materials section rhythm for shareable profile use
- Specialist profile documents are now supported end-to-end on frontend:
  - cabinet profile page supports upload/list/update/delete and public visibility toggle for profile documents
  - public specialist profile renders shared documents with explicit non-verification legal copy
- Specialist profile capability fields are now wired across key public and cabinet surfaces:
  - cabinet profile supports `offers_online`, `offers_offline`, and conditional `offline_location`
  - public specialist profile renders meeting format and conditional offline location
  - public catalog supports online/offline filters and format badges on cards
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
- Homepage information architecture is streamlined:
  - header navigation no longer includes FAQ
  - FAQ remains on homepage lower section and as a dedicated route
  - landing sections emphasize profile visibility, focused value pillars, and cleaner pricing copy
- Public profile presentation is now less dashboard-like and more specialist landing oriented, while preserving current booking/inquiry/journal behavior.
- Specialist-uploaded profile documents are visible in cabinet management and in public profile (when provided by backend), without implying platform verification.

## Active Work

- Keep CRM track narrow in `TherapistClientsView` without broad refactor.
- Next target: history surface explicit-state normalization (`loading/error/empty/retry`) with local retry scoped to history source.
- Preserve already-stabilized clients-list/reminders branches unchanged.
- Keep homepage copy consistency aligned with billing/product terminology (Ukrainian-first, no mixed-language feature labels).

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
