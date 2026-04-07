# Handoff

Last updated: 2026-04-07  
Owner: agent-maintained  
Canonical file: `docs/HANDOFF.md`  
Governance: `docs/HANDOFF_RULES.md`  
Phase archive: `docs/PHASE_CLOSE_SUMMARIES.md`

## Current Phase

Frontend production-readiness slice is now integrated:
- cookie-based auth hardening: done (refresh token only in httpOnly cookie, silent restore, no token persistence in localStorage)
- production container baseline: done (Docker multi-stage build + nginx SPA routing)
- production API wiring: done (`VITE_API_BASE_URL` build-time injection for deploy artifacts)
- release docs sync for production infra/auth slice: done
- legal minimum baseline: done
- legal pages: done (`/terms`, `/privacy`, `/disclaimer`, `/support-and-data-requests`)
- footer legal links: done
- auth legal notice (Terms + Privacy): done
- public homepage repositioning for PRO CONSULT: done (structured practice + shareable public profile narrative)
- public specialist profile polish pass: done (landing-style hero, clearer booking CTA hierarchy, improved about/materials readability)
- specialist profile documents MVP: done (cabinet document management + public profile documents section with non-verification disclaimer)
- profile capability fields: done (online/offline availability + offline location + completed sessions bucket display wired across cabinet/public/catalog)
- booking/session format slice: done (booking create uses `session_format`, public booking chooser by specialist capabilities, offline sessions avoid join-link UX, format badges shown across key session surfaces)
- analytics session-format slice: done (overview now renders online/offline session metrics and offline-location distribution by selected range)
- public guest booking request: done (public unauthenticated request submit flow on specialist public profile)
- plan card guest quota visibility: done (`GET /api/cabinet/entitlements/` guest quota row in cabinet plan metrics)
- specialist-side guest request UX polish: done (specialist list/status/approve/decline surface, online approve `meeting_url` guard, post-approve link to resulting external session/invite)
- next functional slice: guest request micro-polish + contract-doc lock (no broad redesign)

## System State

- Repository: Consult frontend (`Vue 3`, `Vite`, `TypeScript`, `Pinia`, `Vue Router`, `Vitest`).
- Canonical persistent handoff file is this document.
- Auth runtime contract:
  - access token is memory-only
  - refresh token is cookie-only (`httpOnly`) and never exposed to JS storage
  - axios requests run with credentials
- Public session execution contract is external meeting-link based (`meeting_url`/`meeting_provider`), no built-in video runtime.
- Production deployment baseline:
  - frontend is served from nginx container
  - runtime assumes same-domain reverse-proxy routing with backend API under `/api`
  - staging build verification is available through:
    - visible deploy marker in footer (regular shell routes)
    - visible deploy marker in bottom-right for minimal-shell routes
    - technical probe element `#fe-build-probe` with `data-build-marker` for route-level verification
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
- Session format behavior is now wired end-to-end on frontend:
  - public booking sends normalized `session_format` (`online`/`offline`) based on specialist capability configuration
  - when specialist supports both formats, booking shows an explicit format chooser
  - client/specialist session details and lists expose format labels, and offline sessions do not expose misleading join-link actions
- External public guest session flow is now aligned with backend nested join payload:
  - online join reads meeting URL from `join.meeting_url`
  - backward-compatible fallback to top-level `meeting_url` is preserved
  - online meeting opens in a new browser tab and does not replace the guest page
- Specialist-side guest request runtime contract is now wired in cabinet:
  - `GET /api/cabinet/guest-booking-requests/`
  - `POST /api/cabinet/guest-booking-requests/{id}/approve/`
  - `POST /api/cabinet/guest-booking-requests/{id}/decline/`
  - online approve requires `meeting_url`; approved request is linked to resulting `external_session_id`
- Specialist analytics overview now includes format and offline location visibility:
  - metrics include online/offline totals and completed online/offline totals
  - offline location distribution list is rendered with empty-state handling
  - values refresh together with existing analytics blocks on range switch (`7d`/`30d`/`90d`)
- Current high-priority references for UI work:
  - `docs/UI_SHAPE_STANDARD.md`
  - `docs/HANDOFF.md`
  - `docs/HANDOFF_RULES.md`
  - `docs/BETA_FRONTEND_READINESS_PLAN.md`

## Stable Areas

- Auth transport and restore flow:
  - no refresh token in frontend storage
  - silent restore via cookie refresh endpoint
  - legacy token keys are cleaned on startup
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
- Public external guest page render/join mapping is stabilized for:
  - `guest_session.*` resolve payload rendering
  - strict online/offline branching
  - nested join payload mapping for `meeting_url`

## Active Work

- Guest request micro-polish on specialist-side surface:
  - per-card inline error granularity for decision actions
  - clearer per-card loading states for approve/decline
- Contract-doc lock between frontend/backend for guest request approve/decline response shape.
- Preserve current staging-proven guest request/external session behavior unchanged outside this bounded slice.

## Immediate Next Step

Implement and validate one focused specialist guest request micro-polish slice:
- per-card error/loading UX for decision actions
- no API contract changes
- append-only phase summary update after closure

## Critical Rules

- Do not invent API fields or change contracts without explicit backend confirmation.
- Keep UI states explicit and scoped per data source; avoid shared top-level error leakage.
- Reuse existing shared UI/state patterns (`LoadingSkeleton`, `EmptyState`, existing composables/stores).
- Preserve cookie-only refresh model; do not reintroduce localStorage token persistence.
- Keep handoff governance aligned with `docs/HANDOFF_RULES.md`:
  - `HANDOFF.md` = compact current snapshot
  - `PHASE_CLOSE_SUMMARIES.md` = append-only historical phase archive
