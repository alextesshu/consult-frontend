# Handoff

Last updated: 2026-03-12
Owner: agent-maintained
Primary use: persistent project handoff for agent-led work
Update trigger: after each meaningful completed task
Last agent task: clarify booking gate placement and role-aware reschedule notifications

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

## Done

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
- `SpecialistSessionsFlow.spec.ts` now also covers broader list/detail lifecycle parity for specialist flows: `confirm -> detail -> cancel -> back`, stale confirm rejection, detail reschedule, approve-request parity, stale complete rejection, and complete -> back.
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

## Changed files

- `src/App.vue`
- `src/__tests__/app.spec.ts`
- `src/lib/api.ts`
- `src/views/PublicProfileView.vue`
- `src/views/PublicProfileView.spec.ts`
- `src/views/SpecialistSessionsFlow.spec.ts`
- `src/views/TherapistSessionsView.vue`
- `README.md`
- `docs/HANDOFF.md`

## Validation

Latest task validation:

```powershell
npm run test:run -- src/views/SpecialistSessionsFlow.spec.ts
npm run test:run -- src/views/PublicProfileView.spec.ts
npm run test:run -- src/__tests__/app.spec.ts
npm run typecheck
```

## Remaining work

- Add richer CRM workflows: bulk actions and a deeper client profile view.
- Expand system-level empty/loading/error states across remaining views.
- Clarify future billing and entitlements states if backend support for live billing is introduced.
- Inquiry MVP does not yet have dedicated client dashboard discoverability outside the public specialist profile.
- Broaden specialist session parity coverage further for decline-request and stale-cancel style paths if the lifecycle surface keeps changing.

## Risks / open questions

- Specialist-session list/detail parity is substantially stronger now, but the router-driven matrix still does not cover every stale/decline branch.
- Public slot browsing now aligns selected local days with the backend UTC-boundary contract, but any future backend timezone/locale parameter would still be cleaner than frontend range translation.
- Public-profile chat surfacing currently infers message availability from existing chat threads; if backend relation rules change, a dedicated capability flag may still be worth adding later.
- Inquiry messaging is intentionally bounded and non-realtime: no attachments, no dashboard card surfacing, and no unified inbox with full chat.
- The new post-follow-up copy is derived in `PublicProfileView` from thread message history plus backend flags; if backend later exposes a dedicated reason/state for this step, the UI logic should be simplified to consume that directly.
- Authenticated clients are now steered away from raw external contact links on the public profile; public and non-client visitors still see direct contacts if the specialist exposed them.
- `/api/me` is still used for supplemental notification hints (`access_state`, entitlements, counts), but not as the primary notification feed.
- Reschedule notifications now read more clearly and route by role, but stronger visual differentiation than copy-only treatment may still be worth a later UX pass.
- The full Vitest suite (`npm run test:run`) was not rerun in this follow-up; validation here is targeted session/profile/app coverage plus `vue-tsc -b`.
- Some files display encoding issues in the current shell output, so copy-heavy changes should still be checked in-editor.
