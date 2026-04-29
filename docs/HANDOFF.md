# Handoff

Last updated: 2026-04-28
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
- manual client records and sessions: done
  - backend `ClientRecord` model/API implemented and staging-smoked
  - frontend create/edit/archive/restore integrated on `/cabinet/clients`
  - active-client counting includes active manual records and active registered relations
  - dashboard empty-client hint updated
  - clients page manual-client hint added
  - manual-client cards can create canonical sessions from `/cabinet/clients`
  - manual session payment, per-session price, and cancelled-paid resolution UI are wired
- queued follow-ups:
  - client cabinet/dashboard top upcoming sessions visibility
  - `professional_focus` + copy-personalization foundation if profile-copy work resumes
- manual client sessions foundation: done
  - backend schema supports `Session.client_record`
  - session serializers expose manual-client identity fields
  - backend endpoint can create canonical sessions for active manual `ClientRecord`
  - specialist UI displays manual sessions as `Клієнт без кабінету`
  - manual session detail explains that the client does not yet have cabinet access
  - basic specialist lifecycle smoke passed: create, confirm, meeting link add/edit/copy, cancel, complete
  - private session note is hidden by default on detail page
  - manual session creation UI from client card is active

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
- Manual client records and manual sessions are active:
  - specialists can manually create client cards without requiring a registered client account
  - frontend page: `/cabinet/clients`
  - main frontend file: `src/views/TherapistClientsView.vue`
  - dashboard hint file: `src/views/CabinetView.vue`
  - backend API:
    - `GET /api/cabinet/client-records/`
    - `POST /api/cabinet/client-records/`
    - `PATCH /api/cabinet/client-records/{record_id}/`
    - `POST /api/cabinet/client-records/{record_id}/archive/`
    - `POST /api/cabinet/client-records/{record_id}/restore/`
  - manual record name field is `display_name`, not `full_name`
  - manual records return `source=manual`; `has_account`/`user_id` describe account-linked state
  - frontend labels:
  - manual ClientRecord without linked account: `Без кабінету`
  - manual ClientRecord with linked account: `З кабінетом`
  - registered clients: `З кабінетом`
  - manual ClientRecord rows without linked account expose specialist-side account invite controls:
    - create invite
    - copy invite link when backend returns `invite_url`
    - regenerate invite
    - revoke invite
  - manual client cards support create/edit/archive/restore
  - manual clients are searchable/filterable together with registered clients
  - manual client card shows custom/default session price, nearest session, payment status for nearest or last session, future sessions count, last session, and short client description
  - the old `Заплановано` label was clarified to `Майбутніх сесій`
  - manual client cards have CTA `Створити сесію`
  - the create-session modal allows choosing an available slot and session format
  - after creation, frontend redirects to created session detail
  - manual session detail displays client identity as `Без кабінету`
  - registered-client-only actions remain hidden for manual clients where unsupported
  - linked ClientRecord remains the canonical manual/client-record card
  - session creation continues through `POST /api/cabinet/client-records/{record_id}/sessions/`; backend resolves `Session.client` when `ClientRecord.user` exists
  - invite copy is limited to client access to their own sessions in the client cabinet; do not expose specialist notes, ClientJournal, workbook, or `internal_note`
  - client-facing account invite route:
    - `/client/invite/:token`
    - public preview loads without auth
    - unauthenticated users go to login/signup with `redirect=/client/invite/:token`
    - `/signup-client` now honors safe internal redirect paths
    - authenticated CLIENT users accept through `/api/client/client-record-account-invites/{token}/accept/`
    - after accept, frontend refreshes `me` and redirects to `/client`
    - the invite page must not expose `SessionNote`, `ClientJournal`, workbook content, `ClientRecord.internal_note`, or practice-board items
- Manual client records architecture guardrail:
  - `ClientRecord` is not a parallel manual-client system
  - `ClientRecord` is the future specialist-owned client identity layer
  - current transition model keeps `ClientRelation` unchanged for registered clients
  - active-client count is combined:
    - active registered `ClientRelation` rows
    - active manual `ClientRecord` rows
  - guest/external participants remain separate and must not auto-create `ClientRecord`
  - no fake users
  - no auto-linking by email/phone
  - no guest conversion without explicit future design
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
- manual client sessions foundation: done
  - backend schema supports `Session.client_record`
  - session serializers expose manual-client identity fields
  - backend endpoint can create canonical sessions for active manual `ClientRecord`
  - specialist UI displays manual sessions as `Клієнт без кабінету`
  - manual session detail explains that the client does not yet have cabinet access
  - basic specialist lifecycle smoke passed: create, confirm, meeting link add/edit/copy, cancel, complete
  - private session note is hidden by default on detail page
  - manual session creation UI from client card is active
- Manual session detail/payment UI is active:
  - manual session detail has `Оплата сесії`
  - session price snapshot is shown
  - specialist can edit per-session price
  - price edit affects only this session, not the client's custom price
  - specialist can manually mark session paid
  - manual payment is specialist-side only
- Cancelled paid payment resolution UI is active:
  - `/cabinet/sessions` cards prioritize settlement status over basic payment status
  - cancelled paid unresolved sessions show a settlement badge, not only `Оплачено`
  - `/cabinet/sessions/{id}` shows `Оплата після скасування`
  - pending copy: `Сесію скасовано, але оплату було підтверджено. Оберіть, як обробити оплату.`
  - actions: `Позначити як повернену`, `Зарахувати на майбутню сесію`, `Залишити за домовленістю`
  - resolved states: `Оплату повернено`, `Зараховано на майбутню сесію`, `Оплату залишено за домовленістю`
  - resolved UX hides the three action buttons by default, shows `Змінити рішення`, and edit mode allows changing note/resolution
  - successful update toast: `Рішення щодо оплати оновлено.`
- Session card status hierarchy for `/cabinet/sessions`:
  1. lifecycle status
  2. payment / settlement status
  3. time urgency
  4. source/identity
  5. attention flags only if meaningful
  - `Нова заявка` was removed as duplicate noise
  - `Потрібне підтвердження` remains the clear `SCHEDULED` attention label
  - priority action label should use `Підтвердити сесію`, not ambiguous `Підтвердити`
- Manual client payment labels:
  - summary labels: `Оплата найближчої`, `Оплата останньої`
  - states: `Оплачено`, `Не оплачено`, `Очікує підтвердження оплати`, `Потребує рішення щодо оплати`, `Оплату повернено`, `Зараховано на майбутню сесію`, `Оплату залишено за домовленістю`, `Немає сесій`, `Немає даних про оплату`

## Stable Areas

- Auth transport and restore flow:
  - no refresh token in frontend storage
  - silent restore via cookie refresh endpoint
  - legacy token keys are cleaned on startup
- `TherapistClientsView` has isolated explicit-state handling for:
  - clients list (`loading/error/empty/retry`)
  - reminders (`loading/error/empty/retry`)
  - manual client records (`GET /cabinet/client-records/`) are loaded non-blockingly
  - registered clients remain visible if manual records endpoint fails
  - manual clients are filtered/searchable together with registered clients
  - registered-client-only actions are hidden for manual clients
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

- Manual Client Records Phase 1 and manual-client session creation are closed on frontend.
- Keep canonical slug/public-link behavior stable while extending profile-related UX.
- Keep queued follow-ups:
  - client cabinet/dashboard top upcoming sessions visibility
  - `professional_focus` + copy-personalization foundation

## Immediate Next Step

Keep manual-client, registered-client, and guest/external flows separate while extending account linking or client-cabinet access.

Do not add payment buttons for guest sessions until backend contract is confirmed.

## Validation Commands

Use the canonical Vitest run script and keep these three specs in scope for related manual-client/session/payment copy changes:

```powershell
cd C:\Users\admin\dev\portfolio\consult\frontend

npm run test:run -- src/views/TherapistClientsView.spec.ts src/views/TherapistSessionDetailView.spec.ts src/views/TherapistSessionsView.spec.ts
npm run typecheck
npm run build
```

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
- Do not regress manual client record assumptions:
  - use `display_name`, not `full_name`
  - manual records use `/api/cabinet/client-records/`
  - do not reuse `/api/cabinet/clients/{client_id}/...` for manual records because existing registered-client routes use registered `User.id`
  - do not show registered-client-only actions for manual clients unless backend support exists
  - do not create fake users for manual clients
  - do not auto-link manual clients by email/phone
  - do not convert guests into client records automatically
- Private session notes and workbook / `Робочий зошит` are specialist-only confidential documents.
  - Frontend copy must never imply that connecting a client cabinet gives the client access to specialist notes or workbook.
  - Canonical safe cabinet wording: `Підключення кабінету дасть клієнту доступ до власних сесій, нагадувань, оплати та комунікації зі спеціалістом.`
  - Safe workbook wording: `Робочий зошит по клієнту`, `Внутрішній робочий зошит спеціаліста`, `Внутрішній розділ спеціаліста, не видимий клієнту.`
  - Avoid `Робочий зошит клієнта`, `клієнту відкриється робочий зошит`, `доступ до робочого зошита`, and `access workbook/materials` unless the text explicitly says it is specialist-only and not visible to the client.
  - Future client account/cabinet copy may mention only own sessions, reminders, payment/instructions, communication, and explicitly shared materials.
- Any frontend copy/UI change in Vue files must include checking/updating related `*.spec.ts` files, especially text labels, status badges, buttons, route/CTA behavior, confidentiality wording, payment state labels, and manual-client surfaces.
  - Likely specs: `src/views/TherapistClientsView.spec.ts`, `src/views/TherapistSessionDetailView.spec.ts`, `src/views/TherapistSessionsView.spec.ts`
- Keep handoff governance aligned with `docs/HANDOFF_RULES.md`:
  - `HANDOFF.md` = compact current snapshot
  - `PHASE_CLOSE_SUMMARIES.md` = append-only historical phase archive
