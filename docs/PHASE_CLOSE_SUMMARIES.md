# Phase-Close Summaries

Purpose:
- Keep a compact archive of frontend phases that were explicitly closed.

Usage:
- append one section per closed phase
- keep entries brief and operational
- do not duplicate current-state handoff detail from `docs/HANDOFF.md`

---

## 2026-04-12 - Canonical Public Short URL for Specialist Profile (Production + Staging Rolled Out)

### Context
- Phase targeted canonical-first specialist public profile routing and share semantics on frontend.
- Goal: move to canonical slug behavior without breaking legacy compatibility routes.

### Done
- Set canonical specialist route as primary: `/s/:slug`; legacy public routes preserved as compatibility fallback.
- Aligned public profile fetch with canonical endpoint: `GET /api/s/{slug}/`.
- Aligned cabinet profile contract usage to `GET/PATCH /api/cabinet/profile/` fields:
  - `slug`
  - `public_profile_path`
  - `public_profile_url`
- Locked cabinet share/open/copy policy to `public_profile_url` / `public_profile_path` (not legacy route templates).
- Locked slug update semantics and UI mapping for:
  - `SLUG_INVALID`
  - `SLUG_RESERVED`
  - `SLUG_TAKEN`
- Updated semantic rule: `specialist_slug` means canonical slug (not a legacy technical token).
- Follow-up integrated:
  - transliteration-aware slug generation
  - fallback slug cleanup only when `public_profile_enabled=false`
  - already public fallback URLs are not auto-rewritten

### Validation
- Production rollout verified:
  - backend deploy successful
  - frontend deploy successful
  - canonical `/s/{slug}` and cabinet canonical share flow working
- Staging rollout verified:
  - backend deploy successful
  - frontend deploy successful
  - `/s/{slug}` working
  - `/healthz` and `/readyz` routing fixed
- Operational deploy lesson confirmed:
  - Caddyfile changes require explicit Caddy reload/restart after deploy (`docker restart backend-caddy-1`)

### Deferred / Not in Scope
- `professional_focus`
- copy-personalization
- onboarding text adaptation
- broad SEO pass
- slug history / alias system
- redirect graph for old slugs
- tariff/role routing branches

### Key Commits
- Canonical short URL and slug follow-up were rolled out before this handoff documentation refresh.
- This frontend task records the canonical contract in docs and adds no runtime code changes.

### Merge Readiness
- Canonical public short URL phase is closed and documented for frontend handoff continuity.

## 2026-04-07 - Specialist-Side Guest Request UX Polish (Staging Verified)

### Context
- Public guest booking request submit flow and cabinet guest quota visibility were already closed and staging-verified.
- Remaining gap: specialist-side guest request handling had no dedicated actionable UI surface.

### Done
- Added specialist guest request panel in cabinet external sessions surface (`Гостьові запити`).
- Added clear request status semantics in UI for:
  - `pending`
  - `approved`
  - `declined`
  - `cancelled`
- Added approve/decline specialist actions directly in request cards.
- Added controlled online-approve UX with required `meeting_url` input before approve action.
- Added explicit post-decision bridge:
  - link to resulting external session from approved request (`external_session_id`)
  - invite link rendering when returned by approve response.
- Added and updated targeted FE tests for render/approve/decline and online-approve requirement.
- Backend changes were not required in this phase.

### Validation
- `npm run test:run -- src/views/ExternalSessionsView.spec.ts`
- `npm run typecheck`
- Staging manual smoke on `/cabinet/external-sessions`:
  - guest request panel visible
  - online pending request cannot be approved without meeting link
  - approve transitions status and links to resulting external session
  - decline transitions request to resolved state

### Deferred / Not in Scope
- Per-card inline error granularity for request decision actions.
- Per-card split loading indicators for approve vs decline.
- Backend contract documentation lock for guest request endpoints/response shape.

### Key Commits
- `d856b56` specialist-side guest request UX polish integrated on `dev`

### Merge Readiness
- `dev` includes specialist-side guest request UX improvements and is staging-verified.

## 2026-04-02 - External Guest Session FE Mapping Stabilization

### Context
- Phase focused on external guest public flow consistency for PRO CONSULT after backend contract confirmation.
- Scope was limited to frontend mapping/branching fixes, without backend contract changes.

### Done
- Fixed public resolve mapping to consistently read fields from `guest_session.*`.
- Enforced strict online/offline render branching on external guest page:
  - offline helper/location render only for offline format
  - online state does not show offline helper copy
- Fixed online join mapping to read URL from nested payload path `join.meeting_url`.
- Kept backward-compatible fallback to top-level `meeting_url` for compatibility.
- Ensured online join opens meeting in a new browser tab (`_blank`, `noopener,noreferrer`).
- Localized default external guest instruction copy to Ukrainian.

### Validation
- `npm run test:run -- src/views/ExternalGuestSessionInviteView.spec.ts`
- `npm run typecheck`

### Deferred / Not in Scope
- Backend endpoint contract changes
- Broad route/layout refactor
- New guest auth/account flows

### Key Commits
- `181259e` fix: localize default external guest invite instruction
- `45a1064` fix: enforce online/offline branching on external guest page
- `9c9c694` fix: map external guest join url from nested payload

### Merge Readiness
- `dev` includes external guest public mapping fixes and is ready for staging smoke validation.

---

## 2026-03-26 - Auth Hardening + Production Deployment Baseline

### Context
- Phase focused on auth runtime hardening and production deployment readiness for controlled beta.
- Scope included token transport/storage behavior and containerized frontend delivery setup.

### Done
- Switched frontend auth persistence to cookie-based refresh flow:
  - no refresh token in JS storage
  - access token held in memory only
  - silent restore after reload via refresh endpoint
- Added anti-race guardrails for restore/refresh behavior (`authEpoch`, debounced refresh).
- Enforced `withCredentials` on API requests for cookie-based auth runtime.
- Added production artifacts:
  - frontend `Dockerfile` (multi-stage build + nginx serve)
  - nginx SPA routing/caching config
  - build-time `VITE_API_BASE_URL` injection for deploy image

### Validation
- `npm run test:run`
- `npm run typecheck`
- `npm run build`

### Deferred / Not in Scope
- CRM feature-depth expansion
- Additional UX redesign slices
- New API contract changes

### Key Commits
- `9946db0` `Harden API auth and security runtime for cookie-based JWT flow`
- `a67eb78` `Add production infrastructure with Docker, Caddy, and environment settings`

### Merge Readiness
- `dev` documented as production-baseline ready for frontend runtime deployment assumptions.

---

## 2026-03-19 - Frontend Stabilization / Merge-Prep

### Context
- Phase focused on backend-contract alignment for booking/session flows, explicit-state hardening on high-traffic surfaces, and specialist session lifecycle parity.
- Scope intentionally excluded broad new feature expansion.

### Done
- Frontend booking/session surfaces switched to backend-coded error mapping (`reason_code` -> `code` -> `detail` fallback).
- Explicit `loading/error/empty` handling strengthened on key public/client surfaces.
- Specialist session list/detail lifecycle parity and regression coverage expanded (confirm/cancel/reschedule/approve/decline/complete + stale-state guards).
- Inquiry notification routing completed, including specialist `thread_id` preselection and client redirect path.
- Public runtime copy/behavior aligned with external meeting-link execution model.

### Validation
- Commands run:
  - `npm run test:run`
  - `npm run typecheck`
- Result:
  - `21` test files passed
  - `101` tests passed
  - `vue-tsc -b` passed

### Deferred / Not in Scope
- CRM depth expansion (bulk actions, richer client profile view)
- Additional billing/entitlements UX depth
- Broad error normalization outside the agreed slice

### Key Commits
- `5c3fe2e` Map booking and session error codes in frontend
- `bb42f71` Prepare explicit state surfaces for high-traffic views
- `be7a4fb` Add inquiry notifications and close specialist parity gap
- `0372ed1` Improve booking gating and notification routing

### Merge Readiness
- `dev` was validated, clean, and synced with `origin/dev` at phase close.
