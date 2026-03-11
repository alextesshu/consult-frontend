# Handoff

Last updated: 2026-03-12
Owner: agent-maintained
Primary use: persistent project handoff for agent-led work
Update trigger: after each meaningful completed task
Last agent task: add list-view stale completion regression coverage

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
- `TherapistSessionDetailView.spec.ts` now also covers specialist-side completion flow, including actual-duration prompt payload, refreshed session context, and note reload after completion.
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

## Changed files

- `src/views/TherapistSessionsView.spec.ts`
- `src/views/TherapistSessionsView.spec.ts`
- `docs/HANDOFF.md`

## Validation

Current task validation:

```powershell
npm run test:run -- src/views/TherapistSessionsView.spec.ts
npm run typecheck
```

Current task validation passed: the expanded therapist-sessions list spec and `npm run typecheck` succeeded after adding stale completion regression coverage.

## Remaining work

- Add richer CRM workflows: bulk actions and a deeper client profile view.
- Expand system-level empty/loading/error states across remaining views.
- Clarify future billing and entitlements states if backend support for live billing is introduced.
- Inquiry MVP does not yet have dedicated client dashboard discoverability outside the public specialist profile.
- Broaden specialist-session regression coverage toward higher-level multi-step integration if those paths keep changing.
- Decide whether some remaining view-only time/status assertions should be replaced with helper-spec coverage as shared session rules evolve.

## Risks / open questions

- Specialist-session list/detail mutation parity is stronger now, but there is still no higher-level integration spec asserting end-to-end parity between them.
- Completion flow is now covered at the view level in both list and detail surfaces, but there is still no router/integration-level assertion covering a real multi-step specialist session lifecycle.
- Completion flow is now stronger at the list/detail view level, but detail-side stale completion rejection still has no dedicated regression spec.
- Shared specialist-session helper and API wrapper coverage now exists, but there is still no integration-level assertion proving that list/detail surfaces stay aligned against the same backend lifecycle.
- Public-profile chat surfacing currently infers message availability from existing chat threads; if backend relation rules change, a dedicated capability flag may still be worth adding later.
- Inquiry messaging is intentionally bounded and non-realtime: no attachments, no dashboard card surfacing, and no unified inbox with full chat.
- The new post-follow-up copy is derived in `PublicProfileView` from thread message history plus backend flags; if backend later exposes a dedicated reason/state for this step, the UI logic should be simplified to consume that directly.
- Authenticated clients are now steered away from raw external contact links on the public profile; public and non-client visitors still see direct contacts if the specialist exposed them.
- `/api/me` is still used for supplemental notification hints (`access_state`, entitlements, counts), but not as the primary notification feed.
- The full Vitest suite (`npm run test:run`) was not rerun in this follow-up helper-spec task; validation here was the new targeted spec plus `vue-tsc -b`.
- Some files display encoding issues in the current shell output, so copy-heavy changes should still be checked in-editor.
