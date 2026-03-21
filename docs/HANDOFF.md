# Handoff

Last updated: 2026-03-21
Owner: agent-maintained
Primary use: persistent project handoff for agent-led work
Update trigger: after each meaningful completed task
Last agent task: add client-dashboard inquiry discoverability entrypoint (role-safe states, no inquiry/chat mixing) and sync handoff

Update rule:

- Refresh this file after each meaningful task completion.
- Keep sections short and factual.
- Update `Done`, `Changed files`, `Validation`, `Remaining work`, and `Risks / open questions` together.
- Do not use this file for speculative ideas without marking them as assumptions.
- Prefer updating this file instead of creating separate ad-hoc handoff notes.

## Context

- Repository role: frontend for Consult.
- Main stack: Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest.
- Primary product areas already present in routing: specialist cabinet, client dashboard, public specialist profile, public catalog, billing access request flow, analytics, slots, sessions, reviews, group events, journal.
- Current source-of-truth docs are `README.md`, `docs/UI_SHAPE_STANDARD.md`, and recent git history. This file is the persistent project handoff.
- `README.md` was synced with this handoff on 2026-03-11 to reduce documentation drift.
- Full phase-close write-up for the current slice lives in `docs/PHASE_CLOSE_SUMMARY.md`.

Current terminology note:

- UI/product term: `Робочий зошит`.
- Current technical contract still uses legacy `journal` naming in code and endpoint paths.
- Current backend model covers specialist-side private workbook only (`therapist + client` scoped record).
- Client-owned workbook / fully role-separated dual-workbook model is not implemented yet and must not be assumed by future changes.

## Product decision: session execution and meeting links

Canonical MVP policy:

- The platform supports external meeting links for online sessions.
- Built-in video calling is not part of the current MVP.
- The canonical flow is: specialist adds an external meeting link, client joins through the platform Join button, reminders and after-session flow work around that link.

Current scope:

- Supported: manual external meeting links (Google Meet, Zoom, other valid URLs).
- Supported: role-aware Join access, dashboard/session detail join entrypoints, reminder/bell join entrypoints.
- Not in scope: embedded calls, room tokens, WebRTC, Daily/Twilio/Zoom SDK.

Google Meet auto-creation:

- Automatic Meet creation is not considered the canonical product path.
- Any service-account-based Meet auto-creation must remain optional/flagged and not redefine the core product behavior.
- Current backend implementation is feature-flagged and must stay disabled by default (`SESSION_AUTO_CREATE_MEETING_ON_CONFIRM=0`).
- Canonical dev/prod flow remains manual external meeting link management by specialist.

Future direction:

- If automatic meeting creation becomes strategically important later, the preferred long-term approach is specialist-owned Google OAuth integration, not centralized platform-owned meeting creation.

## Done

Latest increment (2026-03-19):

- Client dashboard now has a dedicated `Запити до бронювання` discoverability card for inquiry entrypoints (client side).
- Dashboard inquiry card explicitly supports 4 role-safe states without mixing inquiry and chat semantics:
  - not started (`can_create_inquiry = true`) -> `Поставити запитання`;
  - existing inquiry (`inquiry_exists = true`) -> `Відкрити запит`;
  - unavailable/blocked state -> explanatory status without action CTA;
  - `ACTIVE_CLIENT` -> `Відкрити повний чат` (`/client/chat?therapist_id=...`) instead of inquiry CTA.
- Scope guardrail: this slice is a dashboard discoverability layer only; canonical inquiry flow remains in `/client/inquiries/:specialistId` and on the public specialist inquiry surface (`/specialist/:slug#inquiry` via redirect), with no inquiry contract changes.
- Added in-app 5-minute pre-session toast reminders for both roles with role-aware primary CTA routing:
  - specialist -> `/cabinet/sessions/:id`;
  - client -> `/client/sessions/:id`.
- Reminder CTA model now supports optional secondary `Приєднатися` action when `meeting_url` is valid and `join_available !== false`; otherwise only detail navigation is shown.
- Current dedupe strategy is session-scoped in `sessionStorage` and intentionally suppresses repeated reminders in the same browser session for the same role/session pair.
- `TherapistSessionsView` post-completion modal is now split into two parallel sections:
  - `Нотатки після сесії` (session-scoped note, saved to `/cabinet/sessions/{id}/note/`);
  - `Робочий зошит` (persistent role-scoped workbook, currently saved from specialist flow to `/cabinet/clients/{client_id}/journal/`).
- `Робочий зошит` is a long-term private working document of one interaction side. The UI term is shared for both roles, but data must stay owner-scoped and role-separated by default.
- Product guardrail: do not treat workbook data as a single shared note for a specialist-client pair. Preferred backend modeling is owner-separated records/fields (or explicit `author_role` + `visibility`) to prevent accidental cross-role exposure.
- UI copy in the modal now consistently uses this split: session-scoped notes remain local to a specific session, while `Робочий зошит` is a long-lived private workbook of the current role/side and must not be treated as a shared document between specialist and client.
- `TherapistSessionsView.spec.ts` now asserts the visible modal labels (`Нотатки після сесії`, `Робочий зошит`) after completion flow.
- Added dedicated frontend API wrappers for workbook load/save in `src/lib/specialistSessions.ts` (technical endpoint remains `/cabinet/clients/{client_id}/journal/` in current contract).
- Updated specialist sessions regression tests to assert both note sources are loaded in the post-complete modal.
- Fixed Django migration graph crash in backend by correcting dependency app label in `sessions/migrations/0014_clientjournal.py` (`sessions` -> `consult_sessions`).
- Client dashboard UX was simplified:
  - moved `Обрані спеціалісти` section above other content;
  - removed separate profile card from dashboard surface;
  - hero actions now use clearer CTAs: `Додати спеціаліста` and `Мій профіль`;
  - tips now include explicit `Каталог спеціалістів` guidance.
- Fixed false-positive live markers (`Сесія триває`) before actual start:
  - `ClientDashboardView` now prioritizes real slot window (`slot_start_at/slot_end_at`) over join window;
  - `CabinetView` hero live card now uses the same slot-first rule;
  - `TherapistSessionsView` priority card now shows `Заплановано` before start, even if join window is already open.
- Added/updated focused regression tests for all above UI fixes.

- Backend MVP: session confirmation now can auto-attach an online meeting link via `maybe_create_confirm_meeting_link(...)` inside `confirm_session(...)` when the feature flag is enabled.
- Added a dedicated backend service `sessions/services/meeting_autocreate.py` for Google Meet auto-creation flow (config-driven, safe fallback to no-link when integration is not configured).
- Added backend feature flags in settings/env:
  - `SESSION_AUTO_CREATE_MEETING_ON_CONFIRM`
  - `SESSION_AUTO_MEETING_PROVIDER`
  - `SESSION_CLIENT_CAN_VIEW_MEETING_URL_AFTER_CONFIRM`
  - `GOOGLE_MEET_SERVICE_ACCOUNT_FILE`
  - `GOOGLE_MEET_DELEGATED_USER`
  - `GOOGLE_MEET_CALENDAR_ID`
- Client meeting-link visibility policy is now explicit and configurable in backend access logic:
  - default behavior remains join-window only,
  - optional immediate visibility after confirm is controlled by `SESSION_CLIENT_CAN_VIEW_MEETING_URL_AFTER_CONFIRM`.
- Added backend regression tests for:
  - auto-link creation on confirm with feature flag enabled,
  - client visibility toggle behavior for meeting URL after confirm.
- `CabinetView` and `ClientDashboardView` live-session detection now treats in-window `SCHEDULED` sessions as live alongside `CONFIRMED`, so the `Сесія триває` marker does not disappear when confirmation lag exists.
- Direct join CTA rules remain unchanged: join link is still shown only when `join_available` and a valid external `meeting_url` are present.
- Added focused regression coverage for scheduled in-progress live markers in `CabinetView.spec.ts` and `ClientDashboardView.spec.ts`.
- Updated `TherapistSessionDetailView.spec.ts` to align with current backend meeting-access contract:
  - happy-path join assertions now use a `CONFIRMED` session with `join_available = true`;
  - meeting-link edit assertions now validate `updateSpecialistSessionMeeting(...)` instead of raw `apiPatch(...)`.
- Fixed one full-suite regression in `ClientSessionDetailView.spec.ts` by adding `specialist_public_slug` to the session factory used by completed/cancelled follow-up CTA checks.
- Full frontend Vitest suite is green after these updates (`22/22` files, `108/108` tests).
- Changes were committed and pushed to `origin/dev` as `21573ad`.
- Frontend session execution MVP now treats online sessions as backend-provided external meeting links only; built-in video room assumptions were removed from pricing/plan/session copy touched in this slice.
- Added shared external meeting helpers in `src/lib/sessionExecution.ts` for safe `meeting_url` normalization, join gating, provider labeling, and session-time hint copy.
- `ClientSessionDetailView` now shows external meeting context, `Приєднатися`, copy-link action, and follow-up booking CTA for completed/cancelled flows when the specialist public slug is available.
- `ClientDashboardView` now surfaces online meeting badges and join CTA on the priority upcoming session and the upcoming sessions list when backend payload includes a valid `meeting_url`.
- `TherapistSessionDetailView` now shows the same external meeting context for specialist-side detail review without inventing new edit mutations.
- Notification bell reminders in `App.vue` now expose a direct external `Приєднатися` action when notification payload includes `meeting_url` and the event is still actionable.
- Added focused regression coverage for shared meeting helpers, client dashboard join CTA, specialist session detail join CTA, client session detail follow-up/join CTA, and reminder join action in the bell feed.
- `README.md` is synced with this slice and now states that online session execution relies on external `meeting_url` / optional `meeting_provider`, not built-in video rooms.
- Added a standalone phase-close summary in `docs/PHASE_CLOSE_SUMMARY.md` for merge-prep / handoff use.
- Phase-close audit confirmed local `dev` was clean and matched `origin/dev` before validation (`git rev-list --left-right --count origin/dev...HEAD` -> `0 0`).
- Phase-close audit rechecked `README.md` and this handoff against the latest committed slice set (`0372ed1`, `be7a4fb`, `bb42f71`, `5c3fe2e`) with no runtime-doc drift requiring README changes.
- Analytics MVP for `/cabinet/analytics` is implemented with leader-gated insights, teaser state for non-leader users, and empty-state coverage.
- Analytics contract and fallback metrics are centralized in `src/lib/analytics.ts`.
- Analytics rendering behavior is covered in `src/views/AnalyticsView.spec.ts` and `src/lib/analytics.spec.ts`.
- Public specialist profile exists as a landing-style flow with booking, trust/about/contact blocks, reviews link, and journal preview.
- Specialist public profile editor is aligned with the current public profile structure, including visibility toggles, pricing, contacts, media, and share flow.
- `PublicProfileView` now has focused regression coverage for loaded-state rendering and booking gating before setting acceptance.
- `TherapistProfileView` now has focused regression coverage for loaded-state rendering and normalized save payload behavior.
- Specialist sessions support client-side status/date filtering in `TherapistSessionsView`.
- `TherapistSessionsView` now has focused list-level regression coverage for mount loading, list rendering, pending reschedule context, filter reset behavior, and empty states.
- `TherapistSessionsView` now also has focused mutation regression coverage for confirm, cancel, inline reschedule, recurring-series flows, and specialist-side reschedule request approve/decline flows, including reload/toast expectations.
- `TherapistSessionsView` now also covers specialist-side completion flow, including actual-duration prompt payload, post-complete list reload, and note-modal opening with refreshed note content.
- `TherapistSessionsView.spec.ts` now also covers stale specialist-side completion rejection, including inline error rendering and the expected no-reload / no-note-fetch behavior for an invalid status transition.
- `TherapistSessionsView.spec.ts` now also covers stale specialist-side confirm rejection, including inline error rendering and the no-reload behavior expected for an invalid status transition.
- `TherapistSessionsView.spec.ts` now derives formatted date expectations via shared session formatting helpers instead of hardcoded local-hour strings, which removes timezone-sensitive suite failures in CI/local runs.
- `TherapistSessionDetailView` exists at `/cabinet/sessions/:id` with status actions, request context, recurring creation, private notes, and focused mutation regression coverage for confirm/cancel happy paths, specialist-side reschedule request approve/decline flows, stale confirm rejection, reschedule panel guards, recurring input guard, and invalid/stale routes.
- `TherapistSessionDetailView.spec.ts` now also covers specialist-side detail reschedule submission from a suggested slot, including the expected mutation payload, refreshed session timing, and post-mutation context reloads.
- `TherapistSessionDetailView.spec.ts` now also covers specialist-side completion flow, including actual-duration prompt payload, refreshed session context, note reload after completion, and stale completion rejection without detail reloads.
- `SpecialistSessionsFlow.spec.ts` now adds a router-driven multi-step regression over the specialist session lifecycle, covering `list -> detail -> complete -> back to list` with shared backend state expectations across both surfaces.
- `SpecialistSessionsFlow.spec.ts` now also covers broader list/detail lifecycle parity for specialist flows: `confirm -> detail -> cancel -> back`, stale confirm rejection, detail reschedule, approve-request parity, decline-request parity, stale complete rejection, and `complete -> back`.
- `TherapistSessionsView` reschedule-request cards now show `Погодити` / `Відхилити` actions only for `PENDING` requests, matching the detail surface.
- `PublicProfileView` now maps a selected local calendar day to the backend UTC date-range contract for `/booking/slots/`, then filters the returned slots back to the selected local day before rendering.
- `PublicProfileView.spec.ts` now covers the UTC/local boundary regression where a slot starts on the previous UTC date but still belongs to the selected local day.
- `PublicProfileView` now surfaces setting acceptance as an explicit booking gate directly above the slot list, with clearer required-action copy next to the `Записатися` flow.
- Shared `src/lib/dateTime.ts` now centralizes user-facing `uk-UA` date/time formatting and forces 24-hour output for any formatter that includes time parts.
- `src/lib/dateTime.spec.ts` now locks the canonical no-AM/PM behavior for shared Ukrainian date/time formatting helpers.
- User-facing time rendering across notifications, chat, specialist sessions, client session detail, public booking/profile, specialist/client CRM views, availability preview, group events, and invite surfaces now routes through shared Ukrainian formatting helpers instead of local `toLocaleString(...)` calls.
- `AvailabilityRulesView` create/edit rule forms now use explicit 24-hour `HH:mm` selects for working hours, and availability rules fetched from the backend are normalized from `HH:mm:ss` to `HH:mm` before rendering or editing.
- `SlotsView` now clarifies that working hours do not create slots automatically, points specialists back to schedule generation, switches bulk-fill focus to the generated date, and explains that past night hours for `today` are intentionally skipped.
- `SlotsView` manual create/edit flows now block past slot timestamps locally with a clearer Ukrainian error instead of relying only on backend rejection.
- `SlotsView` now also filters out already-started free slots from the rendered list, so the cabinet does not keep showing expired windows returned by the backend.
- `src/views/SlotsView.spec.ts` now locks the regression where past free slots for the selected day must stay hidden while future ones remain visible.
- `SlotsView` now reads backend `conflict` metadata for slot overlaps, surfaces the exact conflicting slot time in inline errors, and explains when that conflicting slot is already in the past and therefore hidden from the default list.
- `SlotsView` keeps the generic overlap fallback only for API responses that omit conflict metadata.
- `src/views/SlotsView.spec.ts` now covers both the exact-conflict metadata path, including past-slot hidden-by-default messaging, and the generic fallback path for overlap errors.
- `SlotsView` create success flow now reloads `/cabinet/slots/`, syncs the selected date to the created slot, and shows a success toast instead of relying on the raw POST response to update local state.
- `src/views/SlotsView.spec.ts` now also covers the create-success regression where a newly created slot must appear immediately without a manual page refresh.
- Vitest test setup now pins `process.env.TZ = 'Europe/Kiev'` so timezone-sensitive frontend specs behave consistently between local runs and Ubuntu CI.
- Shared specialist session formatting, action guards, input parsing, note loading/saving, and booking action requests are centralized in `src/lib/specialistSessions.ts` and reused by `TherapistSessionsView` and `TherapistSessionDetailView`.
- `src/lib/specialistSessions.spec.ts` now adds focused helper-level regression coverage for shared session timing, duration parsing, recurring guards, in-progress status labeling, slot filtering, note fallback handling, and specialist session API wrapper endpoint/payload contracts.
- `src/router/index.spec.ts` now adds router-level regression coverage for the specialist session list/detail paths, including the numeric `:id(\\d+)` guard on `/cabinet/sessions/:id`, unauthenticated redirect-to-login behavior, and successful specialist access to the detail route.
- `ClientSessionDetailView` now shows clearer inline guidance for confirmed vs scheduled sessions and keeps reschedule actions disabled for non-active statuses.
- `ClientSessionDetailView` now has view-level regression coverage for confirmed/request-based, scheduled/direct-reschedule, and completed/cancelled disabled-action messaging flows.
- `PublicProfileView` now switches primary CTA from intro-booking to internal chat for clients who already have an active chat thread with that specialist, instead of falling back to external `mailto` / messenger links.
- `ChatView` now supports query-driven preselect by `therapist_id` or `thread_id`, so profile-driven chat entrypoints can open the intended thread directly.
- `PublicProfileView` and `ChatView` now have focused regression coverage for active-client chat surfacing and thread preselection.
- A separate pre-booking inquiry flow is now surfaced on `PublicProfileView` for non-active clients through `/api/inquiries/state/`, `/api/inquiries/threads/`, and `/api/inquiries/messages/`.
- Inquiry UI intentionally avoids chat wording: client CTA is `Поставити запитання` / `Уточнити деталі`, thread history stays inline on the profile, and blocked/closed states render calm explanatory copy via `src/lib/inquiryCopy.ts`.
- Canonical inquiry semantics are now aligned with contract: after `client create -> specialist reply -> client follow-up`, the thread stays `OPEN`, client send remains blocked, specialist may still send the final reply, and the public-profile UI shows `Ваше уточнення надіслано. Очікуйте відповіді спеціаліста.` for that post-follow-up state.
- Active-client behavior remains unchanged: `ACTIVE_CLIENT` inquiry state still routes users to the existing full chat path instead of exposing inquiry actions.
- Specialist handling for this MVP lives in a small dedicated `/cabinet/inquiries` surface, not a broader inbox redesign.
- Notifications bell/feed in `App.vue` uses `/api/notifications/`, `/api/notifications/read/`, and `/api/notifications/read-all/` as the primary runtime notification source.
- Notifications bell/feed now renders explicit reschedule copy for `RESCHEDULE_REQUESTED` / `RESCHEDULED` and routes session notifications by role: specialist -> `/cabinet/sessions/:id`, client -> `/client/sessions/:id`.
- Notifications bell/feed now also supports canonical inquiry notifications from `/api/notifications/*` with `source_kind = inquiry_message` and stable bounded copy for `INQUIRY_CREATED`, `INQUIRY_REPLIED`, and `INQUIRY_FOLLOWED_UP`.
- Inquiry notifications keep bell `read_at` / `read-all` semantics separate from inquiry thread read-state; the feed does not infer inquiry-thread unread/read from notification flags.
- Specialist inquiry notifications now route into `/cabinet/inquiries?thread_id=...`, and `SpecialistInquiriesView` honors `thread_id` query preselection when present.
- Client inquiry notifications now route through `/client/inquiries/:specialistId` to the existing public specialist inquiry surface, resolving the public slug before redirecting to `#inquiry`.
- `src/__tests__/app.spec.ts` now covers specialist `INQUIRY_CREATED`, client `INQUIRY_REPLIED`, specialist `INQUIRY_FOLLOWED_UP`, mixed read/read-all behavior, and the existing reschedule notification slice.
- `src/views/ClientInquiryRedirectView.spec.ts` now covers both the happy-path redirect to the public inquiry surface and the fallback state when a specialist slug cannot be resolved.
- `src/views/SpecialistInquiriesView.spec.ts` now covers query-driven `thread_id` preselection for notification entrypoints.
- `EmptyState.vue` now renders slot-only actions correctly, which unblocks shared empty/error surfaces from exposing retry or escape-hatch buttons without fake prop actions.
- `PublicTherapistsView`, `ClientTherapistsView`, and the high-traffic session/group-event sections of `ClientDashboardView` now use clearer explicit `loading / error / empty` branches via existing `LoadingSkeleton` and `EmptyState` patterns instead of mixing skeletons, muted strings, and toast-only failures.
- `PublicTherapistsView` now keeps catalog failures inside the view with a retry action and no longer collapses load failures into the same visual state as “nothing found”.
- `ClientTherapistsView` now exposes explicit empty and error states with a clear catalog fallback path, instead of raw inline muted/error copy.
- `ClientDashboardView` now prevents misleading “no upcoming sessions” messaging while booking/session data is still loading or failed to load; the priority card, upcoming/past sections, and group-events block each have distinct retryable state branches.
- Focused regression coverage for this prep slice now exists in `src/views/PublicTherapistsView.spec.ts`, `src/views/ClientTherapistsView.spec.ts`, and `src/views/ClientDashboardView.spec.ts`.
- `CabinetView` was audited in this pass but intentionally left runtime-stable; broader access/billing/error-state normalization there is still better deferred until the backend booking/session error dictionary and related access semantics are documented.
- `src/lib/bookingCopy.ts` now centralizes the finalized backend booking/session error contract on the frontend: `reason_code` takes precedence over `code`, and free-form `detail` remains only a fallback.
- Prepared booking/session surfaces now consume that mapping instead of guessing from `detail`: `PublicProfileView`, the sessions branch of `ClientDashboardView`, `ClientSessionDetailView`, `SlotsView`, `TherapistSessionsView`, and `TherapistSessionDetailView`.
- `SlotsView` keeps the explicit overlap/conflict rendering path, but now keys it off backend `code = SLOT_OVERLAP` first and falls back to overlap `detail` only when needed.
- Focused booking/session regression coverage now includes coded stale-transition/session-not-found cases in specialist detail/list views, coded overlap payloads in `SlotsView`, a coded sessions-error branch in `ClientDashboardView`, and a coded reschedule-request rejection in `ClientSessionDetailView`.

## Changed files

Latest task file list:

- `src/views/ClientDashboardView.vue`
- `src/views/ClientDashboardView.spec.ts`
- `docs/HANDOFF.md`
- `src/App.vue`
- `src/stores/toast.ts`
- `src/composables/useToast.ts`
- `src/components/ToastHost.vue`
- `src/__tests__/app.spec.ts`
- `docs/HANDOFF.md`
- `src/lib/specialistSessions.ts`
- `src/views/TherapistSessionsView.vue`
- `src/views/TherapistSessionsView.spec.ts`
- `../backend/sessions/migrations/0014_clientjournal.py`
- `src/views/ClientDashboardView.vue`
- `src/views/ClientDashboardView.spec.ts`
- `src/App.vue`
- `src/views/CabinetView.vue`
- `src/views/CabinetView.spec.ts`
- `src/views/TherapistSessionsView.vue`
- `src/views/TherapistSessionsView.spec.ts`
- `docs/HANDOFF.md`

- `src/lib/api.ts`
- `src/lib/sessionExecution.ts`
- `src/lib/sessionExecution.spec.ts`
- `src/views/ClientDashboardView.vue`
- `src/views/ClientDashboardView.spec.ts`
- `src/views/ClientSessionDetailView.vue`
- `src/views/ClientSessionDetailView.spec.ts`
- `src/views/TherapistSessionDetailView.vue`
- `src/views/TherapistSessionDetailView.spec.ts`
- `src/App.vue`
- `src/__tests__/app.spec.ts`
- `src/views/BillingView.vue`
- `src/views/HomeView.vue`
- `src/views/CabinetView.vue`
- `src/views/CabinetView.spec.ts`
- `../backend/config/settings.py`
- `../backend/sessions/api_views.py`
- `../backend/sessions/services/access.py`
- `../backend/sessions/services/meeting_autocreate.py`
- `../backend/sessions/tests/test_auto_meeting_confirm.py`
- `../backend/.env.example`
- `README.md`
- `docs/HANDOFF.md`
- `docs/PHASE_CLOSE_SUMMARY.md`

## Validation

Latest task validation:

```powershell
cd ../backend
.\.venv\Scripts\python.exe manage.py showmigrations consult_sessions
.\.venv\Scripts\python.exe manage.py check
cd ../backend
poetry run pytest sessions/tests/test_auto_meeting_confirm.py sessions/tests/test_session_access_gate.py -q
cd ../frontend
npm run test:run -- src/views/CabinetView.spec.ts src/views/ClientDashboardView.spec.ts
npm run test:run -- src/views/TherapistSessionDetailView.spec.ts
npm run test:run
```

Latest dashboard inquiry discoverability validation:

```powershell
cd ../frontend
npm run test:run -- src/views/ClientDashboardView.spec.ts
```

Additional focused checks run in this increment:

```powershell
cd ../frontend
npm run test:run -- src/views/ClientDashboardView.spec.ts
npm run test:run -- src/__tests__/app.spec.ts
npm run test:run -- src/views/CabinetView.spec.ts
npm run test:run -- src/views/TherapistSessionsView.spec.ts
```

Previous slice validation:

```powershell
npm run test:run -- src/lib/sessionExecution.spec.ts src/views/ClientSessionDetailView.spec.ts src/views/ClientDashboardView.spec.ts src/views/TherapistSessionDetailView.spec.ts src/__tests__/app.spec.ts
npm run test:run
npm run typecheck
```

## Remaining work

- No open work from this handoff update; all current frontend tests pass locally.
- Run full frontend suite once before release commit (only focused suites were rerun in the latest increment).
- Complete and validate the in-progress backend workbook slice end-to-end (API wiring/tests/migration apply) before merging backend branch; current endpoint naming still uses `journal` as a legacy contract detail.
- Finalize UX naming to avoid ambiguity between public specialist content and private client notes (current working labels are functional but still under product discussion).
- Google Meet auto-creation requires valid Google credentials/config (`service account` + delegated user) to produce real links in runtime; otherwise feature degrades safely to no auto-link.
- Backend-confirmed specialist-side editing for `meeting_url` / `meeting_provider` is still deferred until a canonical mutation endpoint and ownership rules are exposed to the frontend.
- Reminder surfaces beyond the bell feed should only be expanded if backend adds more stable join-enabled payloads; this slice intentionally avoided inventing reminder entrypoints.
- Add richer CRM workflows: bulk actions and a deeper client profile view.
- Expand system-level empty/loading/error states across remaining views, including `CabinetView`, once the backend contract for error semantics is stable enough to avoid frontend-only taxonomies.
- Clarify future billing and entitlements states if backend support for live billing is introduced.
- Booking/session-adjacent areas that still do not consume this contract remain intentionally deferred in this patch: group-event error normalization, notes/reviews-specific errors, and detail-based validation for some filter params.

## Risks / open questions

- There are pre-existing local backend changes beyond the migration fix in this increment (`sessions/api_views.py`, `sessions/models.py`, `sessions/serializers.py`, `booking/urls.py`, `config/settings.py`, etc.); these need a clean scoped review before commit.
- There is also an unrelated modified frontend file (`src/views/FeedbackPolicyView.vue`) in local working tree; confirm whether it belongs to this slice before final commit.
- The recent fix set intentionally included existing local edits in `src/lib/api.ts` and `src/views/TherapistSessionDetailView.vue` in commit `21573ad`; this should be considered when cherry-picking only spec changes.
- The frontend now consumes `meeting_url` / optional `meeting_provider` on session and notification payloads, but specialist-side editing is intentionally not wired until backend exposes a canonical write contract.
- Join CTA visibility is intentionally narrow: only actionable session statuses with a valid external URL render `Приєднатися`; if backend adds time-window or role-specific gating later, the shared helper should absorb it.
- Reminder join CTA currently ships through the existing notification bell/feed only; if product later needs dedicated reminder pages or push payload deep-links, those should follow the same backend gating contract instead of duplicating rules.
- Pre-session toast dedupe now keys by `pre_session_toast:{role}:{sessionId}:{startAt}`, which keeps reloads non-spammy while allowing a fresh reminder after reschedule with unchanged `sessionId`.
- Specialist-session list/detail parity now covers the active confirm/cancel/reschedule/approve/decline/complete branches plus stale confirm/complete rejection, but stale-cancel or future backend-only lifecycle branches would still need new matrix coverage if introduced.
- Public slot browsing now aligns selected local days with the backend UTC-boundary contract, but any future backend timezone/locale parameter would still be cleaner than frontend range translation.
- Public-profile chat surfacing currently infers message availability from existing chat threads; if backend relation rules change, a dedicated capability flag may still be worth adding later.
- Inquiry messaging is intentionally bounded and non-realtime: no attachments and no unified inbox with full chat; the dashboard card is discoverability-only and not a thread surface.
- Client inquiry notification deep-links currently resolve `specialist_id -> public_slug` through the public specialists catalog on demand; if catalog visibility rules or pagination assumptions change, that redirect path may need a dedicated backend resolver later.
- The new post-follow-up copy is derived in `PublicProfileView` from thread message history plus backend flags; if backend later exposes a dedicated reason/state for this step, the UI logic should be simplified to consume that directly.
- Authenticated clients are now steered away from raw external contact links on the public profile; public and non-client visitors still see direct contacts if the specialist exposed them.
- `/api/me` is still used for supplemental notification hints (`access_state`, entitlements, counts), but not as the primary notification feed.
- Notification read state is now broader than session events, but bell `read_at` intentionally remains decoupled from inquiry thread message state.
- Reschedule and inquiry notifications now read more clearly and route by role, but stronger visual differentiation than copy-only treatment may still be worth a later UX pass.
- `CabinetView` still uses simpler auth/bootstrap heuristics (`v-if="me"` plus entitlements/access hints), so any deeper empty/error-state pass there should be coordinated with backend access-state semantics rather than guessed locally.
- Some files display encoding issues in the current shell output, so copy-heavy changes should still be checked in-editor.
- Google Meet API quotas/permissions and Workspace delegation rules can block runtime link generation; with current MVP this failure path is intentionally non-blocking and does not break confirmation.
