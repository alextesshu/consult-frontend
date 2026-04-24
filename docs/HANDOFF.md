# Handoff

Last updated: 2026-04-12  
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
- canonical public short URL for specialist profile: done (`/s/:slug` primary route, `GET /api/s/{slug}/`, cabinet canonical share/open fields)
- transliteration-aware slug generation follow-up: done (fallback cleanup only when `public_profile_enabled=false`)
- next functional slice: Mini-phase B - `professional_focus` + copy-personalization foundation (separate from slug/routing phase)
- queued follow-up after Mini-phase B: client cabinet/dashboard top upcoming sessions visibility

## System State

- Repository: Consult frontend (`Vue 3`, `Vite`, `TypeScript`, `Pinia`, `Vue Router`, `Vitest`).
- Canonical persistent handoff file is this document.
- Specialist billing/tariff beta model is current:
  - canonical page is `/cabinet/billing`
  - cabinet tariff CTA routes to `/cabinet/billing`, not `/pricing`
  - Pro Consult is in beta; payment is not collected
  - tariffs are shown as future access model
  - Start = `0 грн / міс`, up to `3` active clients
  - Pro = `990 грн / міс` or `9 900 грн / рік`
  - Leader = `2 490 грн / міс` or `24 900 грн / рік`
  - yearly price rule: monthly price x 10
  - old euro prices must not be shown in billing UI
- Specialist billing contract:
  - canonical endpoint is `GET /api/cabinet/entitlements/`
  - uses additive `base_plan`, `effective_plan`, `access_source`, `access_label`, `access_message`, `trial`, `override`, `current_request`, `latest_request`, `limits`, `features`
  - `current_request` is pending-only
  - `APPROVED`/`REJECTED` appear as `latest_request`
  - approved requests apply access; use `latest_request.applied` and `latest_request.applied_plan` to avoid contradictory UI
- Leader beta freeze:
  - Leader is visible as unavailable/future on `/cabinet/billing`
  - no specialist-facing Leader request/checkout CTA during beta
  - specialist self-service Leader request/checkout returns `UNSUPPORTED_SELF_SERVE_PLAN`
  - admin can still assign/approve Leader manually
  - existing Leader users must keep working
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
- Specialist session workspace action contract is code-driven:
  - frontend uses `workspace.pending_task_items` / `workspace.available_action_items` as primary source
  - legacy `pending_tasks` / `available_actions` stay fallback-only for compatibility payloads
  - CTA routing is resolved by canonical action `code` only; `label` is display-only and unknown codes are ignored safely
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
- Canonical specialist public profile contract is now active:
  - primary public route is `/s/:slug`
  - primary public fetch is `GET /api/s/{slug}/`
  - cabinet profile contract is `GET/PATCH /api/cabinet/profile/` with `slug`, `public_profile_path`, `public_profile_url`
  - cabinet share/open/copy uses `public_profile_url` or `public_profile_path` as source of truth
  - `specialist_slug` semantics is canonical slug (not legacy token, not UUID-like identifier)
  - slug update validation codes mapped in UI: `SLUG_INVALID`, `SLUG_RESERVED`, `SLUG_TAKEN`
- Slug generation/runtime guardrails:
  - transliteration-aware slug generation is enabled
  - fallback slug cleanup (`specialist`, `specialist-2`, etc.) applies only when `public_profile_enabled=false`
  - already public fallback URLs are not auto-rewritten
- Deploy routing guardrail:
  - if Caddy routing/health config changes, deploy must include explicit Caddy reload/restart (current container: `backend-caddy-1`)
- Current high-priority references for UI work:
  - `docs/UI_SHAPE_STANDARD.md`
  - `docs/HANDOFF.md`
  - `docs/HANDOFF_RULES.md`
  - `docs/BETA_FRONTEND_READINESS_PLAN.md`
  - `docs/PROFILE_PUBLIC_URLS.md`

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

- Mini-phase B scope (next standalone direction):
  - `professional_focus` foundation
  - copy-personalization foundation
- Keep canonical slug/public-link behavior stable while extending profile-related UX.
- Keep the separate follow-up queued: client cabinet/dashboard top upcoming sessions visibility.

## Immediate Next Step

Implement and validate one focused Mini-phase B slice without mixing slug/routing changes:
- add `professional_focus` and copy-personalization foundation where contract is confirmed
- keep canonical share/open flow unchanged (`public_profile_url` / `public_profile_path`)
- keep compatibility routes working while avoiding new legacy-first assumptions

## Critical Rules

- Do not invent API fields or change contracts without explicit backend confirmation.
- Keep UI states explicit and scoped per data source; avoid shared top-level error leakage.
- Reuse existing shared UI/state patterns (`LoadingSkeleton`, `EmptyState`, existing composables/stores).
- Preserve cookie-only refresh model; do not reintroduce localStorage token persistence.
- Do not regress canonical public profile assumptions:
  - `/s/:slug` stays primary
  - legacy public routes stay compatibility-only
  - do not reintroduce code/UUID-like public profile sharing UX as primary path
- Keep `public_profile_url`/`public_profile_path` as public-link source of truth; avoid ad-hoc URL construction drift.
- For Caddyfile changes, backend/frontend deploy alone is insufficient; include explicit Caddy reload/restart.
- Keep handoff governance aligned with `docs/HANDOFF_RULES.md`:
  - `HANDOFF.md` = compact current snapshot
  - `PHASE_CLOSE_SUMMARIES.md` = append-only historical phase archive
