# Phase-Close Summaries

Purpose:
- Keep a compact archive of frontend phases that were explicitly closed.

Usage:
- append one section per closed phase
- keep entries brief and operational
- do not duplicate current-state handoff detail from `docs/HANDOFF.md`

---

## 2026-07-12 - KAN-29 Public Profile Visibility Production Close

### Context
- KAN-29 public profile visibility/readiness and availability creation
  guidance is complete, production-deployed, production smoke passed, manual
  production verification passed, and Done.
- Backend production/main HEAD:
  `88ce3d6`.
- Frontend production/main HEAD:
  `344addc`.
- No database migrations were required.
- Backend and frontend server repositories were returned to `dev` after the
  production deploy.

### Done
- Frontend visibility controls use explicit save and distinguish persisted live
  state from unsaved local toggle state.
- Public copy/open actions follow persisted publication state.
- Profile photo is recommended but not a publication or search blocker.
- Availability creation guidance is production-verified with the contextual
  `/cabinet/slots?tab=availability&focus=create-availability` route.
- The canonical visibility/readiness contract remains in
  `docs/PROFILE_PUBLIC_URLS.md`; this archive does not duplicate the full
  state table.

### Validation
- Backend production validation completed:
  - backend and reminder-worker rebuilt and restarted;
  - Django system check passed with 0 issues;
  - `GET https://proconsult.space/healthz` returned `200`;
  - `GET https://proconsult.space/readyz` returned `200`.
- Frontend production validation completed:
  - production Vite build passed;
  - frontend container restarted;
  - `GET /login` returned `200`;
  - `GET /cabinet` returned `200`;
  - `GET /cabinet/profile` returned `200`;
  - `GET /cabinet/slots?tab=availability` returned `200`;
  - manual production smoke passed.

### Next Recommended Phase
- KAN-1 email trigger/copy discovery is complete; runtime implementation has
  not started and scope remains pending approval.
- Frontend discovery summary:
  - backend admin detail returns Template B email status;
  - frontend API type and `AdminSpecialistDetailView` currently expose only
    Template A status;
  - Template B frontend admin status is an implementation candidate;
  - Template C runtime integration does not exist;
  - no frontend implementation has started.

---

## 2026-07-12 - Client Payment Overview Production Close

### Context
- Client payment overview phase KAN-30 / KAN-31 / KAN-32 / KAN-33 / KAN-34 is
  complete, production-deployed, and manually verified.
- Backend production baseline:
  `26e5f51 Add client payment overview API`.
- Frontend production baseline:
  `0fbc32a Clarify manual client payment flow`.

### Done
- Client card modal includes read-only tab `Оплати`.
- `Оплати` shows summary counters, session-level payment rows, date/time,
  duration, session status, session format, price, normalized payment state,
  and `Відкрити сесію` links.
- Payment state changes remain in `/cabinet/sessions/{session_id}`.
- Direct-payment copy is visible: clients pay specialists directly, and
  Pro Consult does not accept, hold, process, or transfer consultation money.
- Manual-client session detail explains that a client without a cabinet cannot
  send payment confirmation through Pro Consult and that the specialist marks
  the session as paid after checking actual receipt of funds.
- Contextual first-use guidance is state-based only; no localStorage flag,
  backend first-use flag, or guided tour was added.

### Validation
- Production verification covered client payment overview, manual-client
  payment flow, direct-payment explanation, production HTTP smoke checks,
  health checks, and readiness checks.

## 2026-06-20 - Active Client Limit Increase / Billing Add-on Production Close

### Context
- Frontend phase for active client limit increase requests is complete and
  production-deployed.
- Scope covered `/cabinet/billing` UI, success/pending toast feedback, admin
  Work Queue target behavior, admin bell notification routing, and production
  routing verification.
- Backend and frontend production deploys completed from `main`; server
  worktrees were returned to `dev` and clean.

### Done
- `/cabinet/billing` shows active client limit increase request UI.
- Quantity selector supports `+1..+available`.
- Request call:
  `POST /api/cabinet/active-client-limit-increase-requests/`.
- Payload includes `requested_extra_slots` and optional `specialist_note`.
- `/api/cabinet/entitlements/` provides active client entitlement data and
  `active_client_limit_increase_request`.
- Plan limits in UI:
  - Start: base `3`, max extra `3`, total max `6`;
  - Pro: base `20`, max extra `6`, total max `26`;
  - Leader does not show this specialist-facing expansion flow.
- Price copy: `+1 активний клієнт — 200 грн/міс`.
- Button text: `Запросити розширення ліміту`.
- Helper examples:
  - `+3 активні клієнти — 600 грн/міс`;
  - `+6 активних клієнтів — 1 200 грн/міс`.
- Total helper examples:
  - Start `+3` -> `Разом після схвалення: 600 грн/міс`;
  - Pro `+4` -> `Разом після схвалення: 1 790 грн/міс`;
  - Pro `+6` -> `Разом після схвалення: 2 190 грн/міс`.
- Success toast:
  `Запит на +N активні клієнти надіслано адміністратору.`
- Duplicate pending toast:
  `Запит на +N активні клієнти очікує розгляду.`
- Admin bell notification target:
  `/admin/work-queue?status=active&item_key=active_client_limit_increase_request:<id>`.
- Notification clicks for SPA admin Work Queue targets use Vue Router and do
  not hard reload.
- Work Queue `Відкрити` for Django admin model paths still opens the backend
  Django admin URL.

### Routing
- Production Caddy routes custom Vue admin pages to frontend:
  `/admin/work-queue`, `/admin/work-queue/*`, `/admin/inbox`,
  `/admin/inbox/*`, `/admin/billing-access-requests`,
  `/admin/billing-access-requests/*`, `/admin/specialists`,
  `/admin/specialists/*`.
- Django admin pages remain backend routes:
  `/admin/booking/...`, `/admin/core/...`, `/admin/auth/...`,
  `/admin/login/...`, `/admin/logout/...`.
- Production checks passed:
  - `/admin/work-queue?...` returns frontend SPA `200`;
  - `/admin/booking/activeclientlimitincreaserequest/` routes to Django admin;
  - after Django admin approve, returning to Work Queue no longer shows
    server-side `Not Found`.

### Validation
- Frontend local validation previously passed:
  - `npm run test:run -- src/views/AdminWorkQueueView.spec.ts src/views/BillingView.spec.ts src/__tests__/app.spec.ts`;
  - `npm run typecheck`.
- Known non-blocking test stderr:
  `window.scrollTo is not implemented in jsdom`.

### Next Recommended Phase
- Privacy Policy / confidentiality / support contact flow polish.

---

## 2026-06-06 - Founder Beta Email / Notification Readiness Production Close

### Context
- Docs-only closure after backend email/notification discovery, staging
  founder-beta smoke, production deploy, and production smoke.
- Frontend runtime code, backend/API contracts, styles, and tests were not
  changed.
- Current staging backend direct email smoke returned `sent: 1` from
  `notifications@proconsult.space`.
- The most critical request-first flow passed on staging.
- Production smoke passed for the same request-first flow.
- Backend and frontend `dev` were promoted to `main`, production deploys
  completed, and local/server repos were returned to `dev`.
- This is a controlled founder-beta closure, not a blanket public-launch claim.

### Documented
- Email delivery is backend-owned:
  - Django SMTP email backend;
  - expected sender: `notifications@proconsult.space`;
  - Resend SMTP is the production baseline;
  - backend `send_mail_async(..., fail_silently=False)` uses synchronous
    failure-observable sending.
- Critical founder-beta flows relevant to frontend smoke:
  - slot-less public request specialist email plus bell notification;
  - reminder delivery surfaced through notification feed;
  - billing/access request surfaced through Admin Work Queue;
  - manual client invite link sharing, with no automatic email expected;
  - onboarding/welcome emails are useful but weaker in DB observability.
- Frontend smoke expectations:
  - specialist bell panel shows slot-less public request notification and
    routes to `/cabinet/external-sessions`;
  - `/admin/work-queue` does not show a missing-marker item for the smoked
    public request after successful backend email marker;
  - manual client invite UI displays/copies `invite_url` after create or
    regenerate and does not imply automatic email;
  - billing/access request smoke, when run, appears in Admin Work Queue with a
    useful target.
- Admin Work Queue state:
  - `/admin/work-queue` is production-deployed and smoke-checked;
  - notification issues are grouped/classified by backend;
  - historical notification issues older than 7 days without recent failures
    can be downgraded by backend and shown as historical;
  - Admin-2 mutations remain deferred.

### Smoke Checklist
- Staging:
  - direct backend email smoke to controlled mailbox: passed with `sent: 1`;
  - create one slot-less public request and verify request pending: passed;
  - verify specialist email receipt: passed;
  - verify backend marker: passed;
  - verify specialist bell item: passed;
  - verify `/cabinet/external-sessions` showed the new pending request:
    passed;
  - verify `/admin/work-queue` showed the new public request as an operational
    item: passed;
  - verify no missing-marker queue item was created for the request: passed;
  - create/regenerate a manual client invite and verify returned/copyable
    invite URL, with no automatic email expected;
  - check reminder failed/pending/sent counts and recent failure absence;
  - if billing/access smoke is safe, verify Admin Work Queue target.
- Production:
  - direct email smoke to internal address only: passed;
  - one controlled founder-specialist public request smoke: passed;
  - read-only Admin Work Queue check after smoke: passed;
  - avoid synthetic production failures unless explicitly approved.

### Deferred / Not in Scope
- Remaining non-blocking polish:
  - public request modal is too text-heavy;
  - public request modal contains leftover English text;
  - email still shows raw request topic values like `anxiety`,
    `relationships`, and `not_sure`;
  - topic labels should be Ukrainian in email/admin/specialist surfaces.
- Optional durable backend `OutboundEmailAudit` / outbound email receipt model
  for non-`ReminderDelivery` sends.
- That backend follow-up would require a migration if implemented.
- No frontend runtime work is required unless backend exposes a new audit
  surface or action contract.

### Founder-Beta Decision
- Current state is acceptable for controlled founder-beta based on the passed
  staging smoke above and the confirmed production smoke for the same flow.
- This remains a controlled founder-beta closure, not a blanket public-launch
  claim.

---

## 2026-06-06 - Admin Work Queue Phase Admin-1 Production Closure

### Context
- Frontend Admin Work Queue Phase Admin-1 was implemented and production-deployed/
  smoke-checked.
- Backend/API contracts were already provided by the backend phase; this frontend phase did not change backend runtime behavior.

### Done
- Added `/admin/work-queue` as the read-only admin queue surface.
- Added admin navigation entry `Р§РµСЂРіР° СЂРѕР±РѕС‚Рё`.
- Consumes `GET /api/admin/work-queue/` with response shape `summary` / `items`.
- Added summary counters, filter tabs, actionable cards, and empty/loading/error states.
- Added filters for `РЈСЃС–`, `Р—Р°РїРёС‚Рё`, `РЎРїРµС†С–Р°Р»С–СЃС‚Рё`, `РџРѕРІС–РґРѕРјР»РµРЅРЅСЏ`, `Р—Р°РїСЂРѕС€РµРЅРЅСЏ`, `Billing`, and `РџСЂРѕР±Р»РµРјРё`.
- Work queue cards prefer safe human-readable metadata from the backend:
  - specialist display/name and email
  - client display name and client email
  - public request id/status
  - invite id
- ID-only specialist fallback is shown only when no safe specialist name/email exists.
- Duplicate related labels are suppressed.
- Notification grouped issues render operational copy and hints without pretending to have an entity detail target.
- `Р’С–РґРєСЂРёС‚Рё` action renders only for useful non-empty `target_url` values that are not `/`.
- Confirmed useful targets include `/admin/specialists/{id}`, `/admin/inbox`, and `/admin/billing-access-requests/{id}`.
- `target_url: null`, empty string, or `/` does not render a fake action button.
- Polished `AdminSpecialistDetailView` access-control copy:
  - `РљРµСЂСѓРІР°С‚Рё С‚РµСЃС‚РѕРІРёРј РґРѕСЃС‚СѓРїРѕРј` for normal temporary beta/demo Pro access
  - `РЎР»СѓР¶Р±РѕРІРµ РїРµСЂРµРІРёР·РЅР°С‡РµРЅРЅСЏ` for exceptional manual override
- Admin specialist detail dates/times use Ukrainian/European display format, not US/AM-PM format.
- No admin queue mutations or Admin-2 actions were added.

### Privacy Boundary
- Work queue UI must not render private/raw fields such as:
  - `payload`
  - `message`
  - `last_error`
  - `content`
  - `internal_note`
  - `note_body`
  - `journal`
  - `token_hash`
  - private notebook body
  - session note body
  - public request message body
  - private client history
  - consultation content

### Changed files
- `src/views/AdminWorkQueueView.vue`
- `src/views/AdminWorkQueueView.spec.ts`
- `src/views/AdminSpecialistDetailView.vue`
- `src/views/AdminSpecialistDetailView.spec.ts`
- `src/router/index.ts`
- `src/router/index.spec.ts`
- `src/__tests__/app.spec.ts`
- `docs/HANDOFF.md`
- `docs/PHASE_CLOSE_SUMMARIES.md`

### Validation
- Staging smoke-check completed for the frontend phase.
- This docs closure should be validated with `git diff --check` and repository encoding scans for known mojibake/replacement-character signatures.

```powershell
cd C:\Users\admin\dev\portfolio\consult\frontend

git diff --check
```

### Deferred / Not in Scope
- Admin-2 mutation actions remain deferred until explicit backend contracts exist.
- Resend/domain readiness remains an operational prerequisite for notification closure.
- Queue freshness/pagination may be needed if operational volume grows.
- More precise admin detail pages can replace list/context targets after those routes exist.

### Merge Readiness
- Phase is closed as production-deployed and smoke-checked.

---

## 2026-06-05 - Clients Index / Client Modal Workspace Phase

### Context
- Frontend clients page phase was completed, deployed to staging, promoted to production, and production smoke-check passed.
- `origin/frontend dev` and `origin/frontend main` are both at `0f11eb2 Add client modal access tab`.
- Local frontend repo, server frontend repo, and server backend repo were returned to `dev`.
- Backend/API were not changed in this phase.

### Done
- Reworked `/cabinet/clients` into a compact client index with top count chips and table-like rows.
- Removed the persistent right-side selected-client summary panel.
- Moved full specialist-side client management into modal `Картка клієнта`.
- Implemented modal tabs: `Огляд`, `Контакти`, `Сесії`, `Матеріали`, `Регулярний час`, `Приватний зошит`, `Нотатки`, `Доступ`.
- Integrated ClientMaterial attachment UI with repeated single-file uploads and client signed-URL download flow.
- Added regular-time modal workspace polish, Ukrainian/European date/time handling, and viewport-safe modal scrolling.
- Added specialist-only workbook and session-note metadata tabs without exposing private bodies.
- Added access/cabinet invite management tab using existing invite helpers and existing archive/restore/activate behavior.

### Changed files
- `src/views/TherapistClientsView.vue`
- `src/views/TherapistClientsView.spec.ts`
- `src/views/ClientMaterialsView.vue`
- `src/views/ClientMaterialsView.spec.ts`
- `src/lib/api.ts`
- `src/lib/api.clientMaterials.spec.ts`
- `docs/HANDOFF.md`
- `docs/PHASE_CLOSE_SUMMARIES.md`

### Validation
- Production smoke-check passed after staging promotion.
- Final frontend validation during phase included targeted material/client specs, typecheck, build, `git diff --check`, and the docs mojibake scans below:
  - `@'`
    from pathlib import Path

    roots = [Path("README.md"), Path("docs")]
    patterns = [
        "\uFFFD",
        "\u0420\u00a7",
        "\u0420\u0408",
        "\u0420\u2014",
        "\u0420\u040e",
        "\u0420\u045f",
        "\u0420\u0459",
        "\u0420\u00b5",
        "\u0420\u00b0",
        "\u0420\u0455",
        "\u0420\u2018",
        "\u0420\u0491",
        "\u0420\u00bb",
        "\u0420\u2026",
        "\u0421\u201a",
        "\u0421\u2013",
        "\u0421\u0453",
        "\u0421\u040f",
        "\u0421\u0409",
        "\u0421\u20ac",
        "\u0421\u2020",
    ]

    files = []
    for root in roots:
        if root.is_file():
            files.append(root)
        elif root.is_dir():
            files.extend(root.rglob("*"))

    matches = []
    for path in files:
        if path.is_dir() or path.suffix.lower() not in {".md", ".txt"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for lineno, line in enumerate(text.splitlines(), start=1):
            if any(pattern in line for pattern in patterns):
                matches.append(f"{path}:{lineno}:{line}")

    if matches:
        print("\n".join(matches))
        raise SystemExit(1)

    print("No CP1251-style mojibake found.")
'@ | python -
  - `git status --short --branch`
- Manual/no-registration private notebook support needs backend/API contract if product decides to support it.
- `/cabinet/sessions` does not yet support client-specific modal deep filtering.
- Registered/client relation payload does not expose phone; contacts show `Не вказано`.
- `TherapistClientsView.vue` should be split into modal section components in a later frontend refactor.
- Existing `TherapistClientsView.spec.ts` router injection warnings should be cleaned up with a proper router mock/provide.
- If client list pagination is added, top count chips will need backend aggregate counts.

### Merge Readiness
- Phase is closed and production-verified.
- Current operational state is documented in `docs/HANDOFF.md`.

---

## 2026-04-28 - Manual Clients / Confidentiality / Payment Docs Refresh

### Context
- Runtime manual-client polish slices were already completed:
  - session cards status hierarchy cleanup
  - manual client payment labels cleanup
  - upcoming sessions label clarification
  - manual client cabinet-access copy fix
  - workbook confidentiality copy audit
- Frontend docs still contained stale deferred-session wording and risky workbook/materials access wording.

### Done
- Updated current frontend state for manual clients in `/cabinet/clients`.
- Documented manual client badges: `Без кабінету` and `З кабінетом`.
- Documented create/edit/archive/restore, search/filter, manual client card session/payment summaries, `Майбутніх сесій`, and `Створити сесію`.
- Documented manual session detail payment UI, per-session price editing, and specialist-side manual paid marking.
- Documented cancelled paid settlement UI and resolved/edit behavior.
- Documented `/cabinet/sessions` card status hierarchy and canonical payment labels.
- Added hard confidentiality rule: private notes and workbook / `Робочий зошит` are specialist-only and must not be described as client-accessible.
- Added spec obligation for future Vue copy/UI changes touching labels, statuses, buttons, route/CTA behavior, confidentiality wording, payment labels, or manual-client surfaces.

### Changed files
- `docs/HANDOFF.md`
- `docs/MANUAL_CLIENTS_RFC.md`
- `docs/UI_MIGRATION_PLAN.md`
- `docs/PHASE_CLOSE_SUMMARIES.md`

### Validation
- Docs-only change.
- Reference commands for related future FE work:

```powershell
cd C:\Users\admin\dev\portfolio\consult\frontend

npm run test:run -- src/views/TherapistClientsView.spec.ts src/views/TherapistSessionDetailView.spec.ts src/views/TherapistSessionsView.spec.ts
npm run typecheck
npm run build
```

### Deferred / Not in Scope
- Runtime Vue/component changes.
- Backend contract changes.
- Client cabinet invite/link/deduplication implementation.
- Guest/external flow changes.

### Merge Readiness
- Docs now reflect current frontend manual-client, payment, and confidentiality behavior.

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
