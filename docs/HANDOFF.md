# Handoff

Last updated: 2026-07-22
Owner: agent-maintained  
Canonical file: `docs/HANDOFF.md`  
Governance: `docs/HANDOFF_RULES.md`  
Phase archive: `docs/PHASE_CLOSE_SUMMARIES.md`

## Current Phase

KAN-46 directory discovery backend is implemented and staging-verified. KAN-47
uses that additive public endpoint in the frontend directory.

KAN-47 directory polish keeps the existing discovery contract: request groups
use a compact mobile select, direction mode waits for an explicit direction
before loading results, and the directory count uses Ukrainian inflection.

KAN-48 refines the existing public specialist profile presentation without
changing API routes, privacy contracts, or backend code:
- desktop content and sidebar spacing are widened within a centered safe layout;
- authored public work, request, journal, document, contact, and booking data
  remain the only profile sources;
- the public journal CTA appears only when public posts are available;
- public review publication consent remains a backend follow-up; no review
  behavior was changed in the frontend.

Cancelled and no-show client sessions now use the current public-profile
booking mode and availability before rendering a recovery CTA:
- available direct-booking slots lead to `/s/:slug#slots`;
- request-only, hidden availability, and an empty direct-booking horizon lead
  to `/s/:slug?intent=request`, which opens the existing generic request flow
  once after profile and auth initialization, request-flow eligibility, and
  the real request dialog/form are ready, then removes only that intent query
  parameter without resetting the open form;
- availability-loading failure uses the request CTA with distinct helper copy,
  rather than claiming that no slots exist;
- unavailable public profiles render no recovery CTA; external guest-session
  cancellation remains a separate backend follow-up.

Canonical backend contract:
backend repository — docs/DIRECTORY_DISCOVERY_CONTRACT.md

The frontend calls `GET /api/public/specialists/discovery/` for directory
discovery. The current name/slug lookup and direct profile routes remain
unchanged; the separate exact lookup appears above directory results and keeps
its existing secondary-flow behavior.

Short professional introduction copy is clarified locally and not
pushed/deployed:
- the existing `public_profile_summary` cabinet field now uses clearer
  professional-introduction label, helper, and placeholder copy;
- no new field was added, API payload/response handling and saved values are
  unchanged;
- readiness, public-profile runtime semantics, backend, dependencies, push,
  and deploy are unchanged.

KAN-28 optional secondary specialist phone is implemented locally and not
pushed/deployed:
- frontend API typing accepts additive `secondary_phone` and
  `show_secondary_phone` with safe defaults when older responses omit them;
- cabinet profile keeps the existing primary phone field and adds an optional
  secondary phone flow with add/remove controls, independent public visibility,
  local invalid/duplicate convenience validation, and backend field-error
  display near the secondary field;
- public profile runtime components were not changed because they already
  render backend-provided `contact_actions` labels and can show two `PHONE`
  actions in order;
- secondary phone is optional, defaults private, and is not a readiness
  requirement;
- no dependencies, endpoint path changes, push, or deploy.

CI usage reduction is complete locally and not pushed/deployed:
- automatic frontend CI now runs on `dev` pushes only; `main` push no longer
  repeats the same full CI;
- PR checks remain for `dev` and `main`, manual `workflow_dispatch` remains,
  and docs-only commits are skipped;
- frontend CI now has read-only permissions, concurrency cancellation, npm
  cache, and a 20-minute timeout while preserving `npm run build` and the full
  `npm run test:run`;
- runtime/deploy code, tests, migrations, and dependencies were not changed.

KAN-27 frontend documents/certificates upload UX is complete locally and not
pushed/deployed. Cabinet profile document management now has client-side
JPG/PNG/PDF validation up to 10 MB, accessible choose/drop upload area, pending
file preview/metadata, retry-safe upload failure handling, document card
metadata/previews with missing-file fallback, and shared-modal delete
confirmation. Frontend API typing now accepts optional/null document file
metadata. Backend/runtime public profile behavior, dependencies, deployment
scripts, and migrations were not changed.

KAN-27 public-profile document scalability hotfix is complete locally and not
pushed/deployed. The public documents/certificates subsection is collapsed by
default, shows the public document count in the header, and renders a more
compact responsive card grid only after expansion. API/backend behavior,
cabinet upload UX, dependencies, deployment scripts, and migrations were not
changed. Production remains pending staging approval.

KAN-37 admin specialist list CRM summary is complete locally and awaiting
review/staging decision. It is not production-deployed. The specialist list now
consumes backend `crm_summary` from `GET /api/admin/specialists/search/` and
shows compact readiness, visibility, and onboarding state per row. Public
profile action is gated by canonical visibility state plus
`public_profile_path`; missing summary data renders neutral fallback badges.
Admin specialist detail runtime, backend runtime, Admin Work Queue, migrations,
dependencies, deploy scripts, and automation flows were not changed. KAN-38 is
not production-closed.

KAN-36 admin specialist detail CRM alignment is complete locally and awaiting
review/staging decision. It is not production-deployed. The detail page now
prefers backend `admin_crm_state` from the KAN-35 contract and presents four
CRM sections: canonical readiness, publication/search visibility, client-entry
state, and onboarding Template A/B status. Legacy detail fields remain as a
fallback when `admin_crm_state` is absent. Backend runtime, admin specialist
list UI, Admin Work Queue behavior, migrations, dependencies, deployment
scripts, Template C, and automation flows were not changed.

KAN-1 email trigger/copy implementation is complete locally and awaiting
review/staging decision. It is not production-deployed.

KAN-1 staging QA hotfix is complete locally and not deployed:
- dashboard readiness now renders the canonical six hard profile requirements:
  public display name, short description, specializations (`topics` machine
  key), work format, base
  price decision, and first-contact path;
- the `topics` machine key is retained for compatibility, but the factual hard
  requirement is persisted `specializations`; `Основні запити` is not a hard
  blocker;
- the UI label for `topics` is `Спеціалізації`, and missing-item CTA routes to
  `/cabinet/profile?focus=specializations`;
- `/cabinet/profile?focus=specializations` scrolls/focuses the
  specializations field, preserves other query params, and clears only
  `focus`;
- booking settings now use a sticky explicit-save bar for unsaved changes;
- publication, direct-link availability, and search visibility are shown as
  separate publication state, not hard readiness requirements;
- `Фото та відео` copy now uses `Фото профілю` and `Відеовізитка`;
- follow-up frontend UX hotfix renamed the dashboard first-contact item to
  `Запис або запит`, routes that item to booking/request settings instead of
  availability creation, and adds state-dependent availability guidance;
- request-only remains a valid ready state without availability windows;
- no migrations, dependency changes, or deployment script changes.
- KAN-1 is not production-closed.

KAN-29 public profile visibility/readiness and availability creation guidance
is production-deployed, production smoke passed, manual production verification
passed, and Done.

Production baselines must be determined from Git and deployment evidence; this
handoff does not carry mutable commit hashes.

KAN-1 implementation planning should use the finalized KAN-29
visibility/readiness mapping from `docs/PROFILE_PUBLIC_URLS.md` and the backend
contract docs, not duplicate the full contract here.

KAN-1 frontend discovery summary:
- backend admin detail returns Template B email status;
- frontend API type and `AdminSpecialistDetailView` now expose Template A and
  Template B status;
- Template C runtime integration does not exist;
- no Template C frontend block was added.

Frontend production-closure slice is now integrated:

- Active Client Limit Increase / Billing add-on: production-closed
  - `/cabinet/billing` includes the active client limit increase request UI
  - quantity selector supports `+1..+available`
  - request API:
    `POST /api/cabinet/active-client-limit-increase-requests/`
  - request payload sends `requested_extra_slots` and optional
    `specialist_note`
  - `GET /api/cabinet/entitlements/` exposes active client limit data and
    `active_client_limit_increase_request`
  - plan limits:
    - Start: base `3`, max extra `3`, total max `6`
    - Pro: base `20`, max extra `6`, total max `26`
    - Leader does not show this specialist-facing expansion flow
  - price copy: `+1 активний клієнт — 200 грн/міс`
  - button text: `Запросити розширення ліміту`
  - helper examples:
    `+3 активні клієнти — 600 грн/міс`,
    `+6 активних клієнтів — 1 200 грн/міс`
  - total helper examples:
    `Разом після схвалення: 600 грн/міс`,
    `Разом після схвалення: 1 790 грн/міс`,
    `Разом після схвалення: 2 190 грн/міс`
  - success toast:
    `Запит на +N активні клієнти надіслано адміністратору.`
  - duplicate pending toast:
    `Запит на +N активні клієнти очікує розгляду.`
  - admin bell notification target:
    `/admin/work-queue?status=active&item_key=active_client_limit_increase_request:<id>`
  - frontend notification routing uses Vue Router for SPA admin deep links
    instead of hard reloads
  - production Caddy routes custom Vue admin pages to frontend before generic
    Django admin routing:
    `/admin/work-queue*`, `/admin/inbox*`,
    `/admin/billing-access-requests*`, `/admin/specialists*`
  - Django admin paths such as `/admin/booking/...`, `/admin/core/...`,
    `/admin/auth/...`, `/admin/login/...`, and `/admin/logout/...` remain
    backend routes
  - production checks passed:
    `/admin/work-queue?...` serves frontend SPA `200`; `/admin/booking/...`
    still routes to Django admin; after approve, returning to Work Queue no
    longer shows server-side `Not Found`
- Founder Beta Email / Notification Readiness: production-closed
  - frontend did not change runtime code or backend/API contracts
  - current staging backend direct email smoke returned `sent: 1` from
    `notifications@proconsult.space`
  - backend and frontend `dev` were promoted to `main`, production deploys
    completed, and local/server repos were returned to `dev`
  - production smoke passed for the same request-first flow
  - the most critical request-first smoke passed on staging:
    guest slot-less request -> specialist email -> bell notification ->
    `/cabinet/external-sessions` item -> Admin Work Queue operational
    visibility
  - confirmed frontend-visible results:
    - specialist bell panel showed slot-less public request notification
    - `/cabinet/external-sessions` showed the new pending request
    - `/admin/work-queue` showed the new public request as an operational item
    - no missing-marker email failure was shown for the smoked request
  - `PLATFORM_SETTING_TEXT` was corrected in staging and production env to
    Ukrainian copy; historical `BookingRuleAcceptance.text_snapshot` rows were
    left untouched
  - remaining non-blocking polish:
    - public request modal is too text-heavy
    - public request modal contains leftover English text
    - email still shows raw request topic values like `anxiety`,
      `relationships`, and `not_sure`
    - topic labels should be Ukrainian in email/admin/specialist surfaces
- Admin Work Queue Phase Admin-1: done, production-deployed, and smoke-checked
  - backend and frontend `dev` were promoted to `main`, production deploys
    completed, and local/server repos were returned to `dev`
  - route: `/admin/work-queue`
  - admin nav label: `Р§РµСЂРіР° СЂРѕР±РѕС‚Рё`
  - backend endpoint consumed: `GET /api/admin/work-queue/`
  - backend response shape: `summary/items`
  - frontend added counters, filters, cards, empty/loading/error states
  - filters: `РЈСЃС–`, `Р—Р°РїРёС‚Рё`, `РЎРїРµС†С–Р°Р»С–СЃС‚Рё`,
    `РџРѕРІС–РґРѕРјР»РµРЅРЅСЏ`, `Р—Р°РїСЂРѕС€РµРЅРЅСЏ`, `Billing`, `РџСЂРѕР±Р»РµРјРё`
  - cards render safe human-readable related metadata when available:
    specialist name/email, client display name/email, request ids, invite ids
  - grouped notification issues render operational copy and next-step hints
  - no fake action button is shown for `null`, empty, or `/` `target_url`
  - current `dev` adds lifecycle filters (`Активні`, `Відкриті`, `В роботі`,
    `Вирішені`, `Ігноровані`, `Усі`), inline detail, optional resolution note,
    and start/resolve/ignore/reopen actions
  - billing access items open `/admin/billing-access-requests/{id}` and show
    their domain status without duplicating billing approve/reject controls
  - public request cards are operational monitoring signals only: client name,
    contact value, topics, requested format value, and message content are not
    rendered
  - cards show request/specialist identifiers, boolean presence indicators,
    and a confidentiality notice; request handling remains in the specialist
    cabinet
- Admin specialist detail polish: production-deployed as part of the founder-beta readiness package; access modals now clarify test access vs service override and use Ukrainian/European date-time formatting
  - `РљРµСЂСѓРІР°С‚Рё С‚РµСЃС‚РѕРІРёРј РґРѕСЃС‚СѓРїРѕРј` means normal temporary
    beta/demo Pro access
  - `РЎР»СѓР¶Р±РѕРІРµ РїРµСЂРµРІРёР·РЅР°С‡РµРЅРЅСЏ` means exceptional manual override
    of effective access
  - visible date/time uses Ukrainian/European `DD.MM.YYYY` and `HH:mm`;
    browser US/AM-PM formatting should not be shown
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
- clients index and client modal workspace: done
  - production smoke passed after staging promotion
  - `origin/frontend dev` and `origin/frontend main` were aligned for that phase
  - local frontend repo, server frontend repo, and server backend repo were returned to `dev`
  - backend/API were not changed for this frontend phase
  - `/cabinet/clients` is now a compact client index: top count chips, table-like rows, no persistent right-side selected-client panel
  - clicking a client row opens modal `Картка клієнта`; full client management now lives in the modal
  - implemented modal tabs: `Огляд`, `Контакти`, `Сесії`, `Матеріали`, `Регулярний час`, `Приватний зошит`, `Нотатки`, `Доступ`

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
- Active client limit increase UI is current:
  - canonical page is `/cabinet/billing`
  - endpoint:
    `POST /api/cabinet/active-client-limit-increase-requests/`
  - payload: `requested_extra_slots`, optional `specialist_note`
  - Start allows up to `3` extra active clients, total max `6`
  - Pro allows up to `6` extra active clients, total max `26`
  - Leader has no specialist-facing expansion flow
  - add-on price is `200 грн/міс` per `+1 активний клієнт`
  - duplicate pending request is shown as an already pending request, not a new
    request
  - pending state copy must use `активний клієнт`, not English wording
- Specialist billing contract:
  - canonical endpoint is `GET /api/cabinet/entitlements/`
  - uses additive `base_plan`, `effective_plan`, `access_source`, `access_label`, `access_message`, `trial`, `override`, `current_request`, `latest_request`, `limits`, `features`
  - `current_request` is pending-only
  - `APPROVED`/`REJECTED` appear as `latest_request`
  - approved requests apply access; use `latest_request.applied` and `latest_request.applied_plan` to avoid contradictory UI
- Public profile visibility contract:
  - KAN-29 is production-closed and Done
  - canonical route/readiness/visibility details live in
    `docs/PROFILE_PUBLIC_URLS.md` and backend contract docs
  - handoff files should not duplicate the full state table
  - profile photo is recommended, but not a hard publication requirement
- Availability creation guidance:
  - dashboard readiness label is `Вікна для запису`
  - target is `/cabinet/slots?tab=availability&focus=create-availability`
  - action panel copy is `Додайте вікна для запису`,
    `Створіть доступний час одразу на кілька днів або тижнів.`,
    `Створити вікна для запису`, and `Додати одне вікно`
  - deep link waits for loading, scrolls/focuses the primary CTA, highlights
    briefly, removes only `focus`, does not open a modal, and respects reduced
    motion
  - empty states distinguish true empty week, status-filtered empty result, and
    weeks with only hidden past windows
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
- Admin Work Queue frontend contract:
  - route: `/admin/work-queue`
  - visible admin navigation label: `Р§РµСЂРіР° СЂРѕР±РѕС‚Рё`
  - consumes `GET /api/admin/work-queue/?status=...` with `summary/items`
  - mutation endpoints are `/start/`, `/resolve/`, `/ignore/`, and `/reopen/`
    under `/api/admin/work-queue/{item_key}/`
  - backend permission is `IsPlatformAdmin`; frontend route requires admin
    role
  - queue cards must prefer safe human-readable related metadata:
    - `specialist_display_name || specialist_name`, plus `specialist_email`
    - `client_display_name`, plus `client_email`
    - `request_id`
    - `invite_id`
  - ID-only fallback such as `РЎРїРµС†С–Р°Р»С–СЃС‚ #id` is allowed only when safe
    name/email data is absent
  - no duplicate related labels should be rendered
  - target links are rendered only for useful non-empty, non-`/` URLs
  - supported queue target examples:
    - `/admin/specialists/{id}`
    - `/admin/inbox`
    - `/admin/billing-access-requests/{id}`
  - grouped notification issue items can have `target_url=null`; no fake
    button should be shown
  - privacy boundary: do not render `payload`, `message`, `last_error`,
    `content`, `internal_note`, `note_body`, `journal`, `token_hash`,
    private notebook body, session note body, public request message body,
    private client history, or consultation content
  - public request content, client contact values, and topic labels are
    forbidden on this admin surface; only boolean presence indicators are
    allowed
  - lifecycle actions are operational tracking only; domain actions such as
    billing approve/reject remain on their dedicated screens
  - admin specialist detail renders `admin_context.work_queue_summary` with
    open/in-progress/resolved/ignored counts and the latest safe lifecycle
    actor/time/note
  - billing access list/detail render domain status separately from
    `work_queue_summary.latest_item` operational status
  - billing conflict warnings use `DOMAIN_CLOSED_OPERATIONAL_ACTIVE` and
    `DOMAIN_PENDING_OPERATIONAL_CLOSED`
  - Work Queue supports scoped links through `status`, `item_key`, and
    `specialist_id` query parameters
  - operational summaries must not render public request text, topics, client
    contact values, private notes, session notes, notebook content, invite
    secrets, or provider payloads/errors
- Founder-beta notification smoke contract:
  - frontend does not send email directly; email delivery is backend-owned
  - slot-less public request smoke must verify the specialist bell item from
    `/api/notifications/` and navigation to `/cabinet/external-sessions`
  - client account invite UI is manual sharing only:
    - create/regenerate should surface `invite_url` when backend returns it
    - no automatic email should be promised in UI or docs
  - Admin Work Queue must remain privacy-safe:
    - grouped notification issues are displayed from backend payload
    - historical grouped notification issues may be downgraded by backend
    - no fake action button for `target_url=null`, empty string, or `/`
    - lifecycle notes must not contain copied raw provider payloads/errors
  - production smoke should use one controlled founder-specialist and internal
    email recipients only
  - latest staging smoke for the critical request-first path passed; production
    smoke is not claimed in this handoff
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
    - invite copy uses account wording (`Запрошення підключити акаунт клієнта`, `Увійти у свій акаунт`, `Створити свій акаунт клієнта`)
    - login/signup show invite-context notice for `redirect` paths starting with `/client/invite/`
    - no auto-accept after auth; user confirms connection explicitly on the invite page
    - `/signup-client` now honors safe internal redirect paths
    - authenticated CLIENT users accept through `/api/client/client-record-account-invites/{token}/accept/`
    - after accept, frontend refreshes `me` and redirects to `/client`
    - the invite page must not expose `SessionNote`, `ClientJournal`, workbook content, `ClientRecord.internal_note`, or practice-board items
- `/cabinet/clients` current modal workspace:
  - the page is a compact client index, not a persistent two-pane client workspace
  - top count chips are frontend-derived from currently loaded registered/manual rows
  - client rows open `Картка клієнта`
  - `Огляд` summarizes status, cabinet state, contacts, sessions, materials, regular time, workbook, and notes
  - `Контакти` shows safe contact/account metadata; registered client phone is `Не вказано` when backend payload does not include it
  - `Сесії` is read-only and uses existing session cache/API data; it renders safe metadata only and links `Відкрити сесію` only when a real session id exists
  - `Перейти до списку сесій` links to generic `/cabinet/sessions`; there is no client-specific deep filter yet
  - `Оплати` is a read-only client payment overview tab backed by
    `GET /api/cabinet/client-records/{record_id}/payments/`
  - `Оплати` shows five status counters, session-level rows, date/time,
    duration, session status, session format, price, normalized payment state,
    and `Відкрити сесію` links to the relevant session detail page
  - `Оплати` does not include payment mutation controls; payment state changes
    remain in `/cabinet/sessions/{session_id}`
  - `Оплати` uses canonical ClientRecord identity: manual client -> `client.id`,
    registered client -> `client.client_record_id`; registered clients without
    `client_record_id` stay in neutral unavailable state and no invalid
    payments API request is made
  - payment explanation states that the client pays the specialist directly and
    Pro Consult does not accept, hold, process, or transfer consultation money
  - first-use payment guidance is state-based only; no localStorage flag,
    backend onboarding flag, or guided tour is used
  - `Матеріали` manages explicit `ClientMaterial` records only
  - ClientMaterial attachments are integrated: specialist can select multiple local files, frontend uploads them through repeated single-file attachment uploads, and refreshes attachment lists after upload/delete
  - client material download uses backend JSON `{ "download_url": "<signed-url>" }`; raw signed URLs/blob paths are not rendered in the DOM
  - `Регулярний час` uses existing ClientRegularTime helpers: `fetchClientRegularTimes`, `createClientRegularTime`, `updateClientRegularTime`, `pauseClientRegularTime`, `resumeClientRegularTime`
  - regular time UI preserves `HH:mm` visible time, `DD.MM.YYYY` visible dates, custom calendar popover for `Дата початку`, and viewport-safe modal scrolling
  - regular time does not generate sessions, slots, public booking behavior, or public profile behavior
  - `Приватний зошит` is specialist-only metadata in the modal; registered clients can open `/cabinet/clients/:clientId/workbook`
  - manual/no-registration workbook is unavailable until backend/API contract exists for manual client records
  - `Нотатки` is specialist-only session-note metadata; main list shows sessions with note metadata, with a secondary list for recent sessions where a note can be added
  - session note bodies are not rendered in the modal
  - `Доступ` is split into `Кабінет клієнта` and `Статус роботи`
  - registered clients show cabinet/access state without invite CTA
  - manual clients without account use the existing invite flow; linked manual clients do not show invite CTA
  - access tab reuses existing invite helpers: `fetchClientRecordAccountInvite`, `createClientRecordAccountInvite`, `regenerateClientRecordAccountInvite`, `revokeClientRecordAccountInvite`
  - existing archive/restore/activate behavior and confirmations are preserved
  - private `SessionNote`, `ClientJournal`, `Приватний зошит`, internal notes, private client history, and session-note bodies must not be exposed to client-facing UI
  - client-visible advice/materials remain explicit `ClientMaterial` artifacts only
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
  - manual-client payment status management is specialist-side only
  - client pays the specialist directly; Pro Consult does not accept, hold,
    process, or transfer consultation money
  - for a client without a cabinet, the client cannot send payment
    confirmation through Pro Consult; after checking actual receipt of funds,
    the specialist marks the session as paid
  - current copy:
    `Клієнт оплачує сесію безпосередньо вам. Оскільки в нього немає кабінету, він не може надіслати підтвердження через Pro Consult. Після перевірки надходження коштів позначте сесію оплаченою.`
  - do not use ambiguous copy such as `оплата ведеться вручну`
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

- KAN-1 email trigger/copy implementation is complete locally and awaiting
  review/staging decision.
- KAN-27 frontend documents/certificates upload UX is complete locally and
  awaiting review/staging decision.
- KAN-27 public-profile document scalability hotfix is complete locally and
  awaiting review/staging decision.
- KAN-29 is production-closed and Done.
- Manual Client Records Phase 1 and manual-client session creation are closed on frontend.
- Keep canonical slug/public-link behavior stable while extending profile-related UX.
- Keep queued follow-ups:
  - client cabinet/dashboard top upcoming sessions visibility
  - `professional_focus` + copy-personalization foundation

## Immediate Next Step

For KAN-1, review the local implementation and decide staging. Frontend now
shows backend-provided Template B status in API typing and
`AdminSpecialistDetailView`; Template C should remain absent until a runtime
trigger and integration contract are approved.

Keep manual-client, registered-client, and guest/external flows separate while extending account linking or client-cabinet access.

Do not add payment buttons for guest sessions until backend contract is confirmed.

## Validation Commands

Use the canonical Vitest run script and keep these three specs in scope for related manual-client/session/payment copy changes:

- `cd <frontend repository root>`
- `npm run test:run -- src/views/TherapistClientsView.spec.ts src/views/TherapistSessionDetailView.spec.ts src/views/TherapistSessionsView.spec.ts`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- CP1251-style scan:

```powershell
@'
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
```

- `git status --short --branch`
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
