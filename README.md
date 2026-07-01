# Pro Consult Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router.

![Frontend CI](https://github.com/alextesshu/consult-frontend/actions/workflows/ci.yml/badge.svg?branch=dev)

## Product Frame

Pro Consult is a practice platform for specialists: professional public
presence, ethical opt-in discovery, no-registration requests, scheduling,
request-to-session workflow, sessions, client records, private specialist
workspace, explicitly published client materials, blog/publications, tasks,
practice workflow, and payment-status boundaries.

Public discovery is not a marketplace ranking surface. The frontend must not
introduce ratings, "top specialists", paid ranking, commission, or
guaranteed-client language. Specialists control public profile visibility and
search visibility.
Private notes, private notebook/workbook, and internal client records remain
specialist-only; client-visible materials are explicit published artifacts.

## Requirements

- Node.js 20.9+ (Vite 5)

## Setup

Create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

Install deps:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

## Testing

```bash
npm run test
```

Quality gate for PRs to `dev`/`main`:

```bash
npm run typecheck
npm run build
npm run test:run
```

## Routes (Key)

- `/` — Public Home (role choice + parallax scene)
- `/login` — Login
- `/signup` — Specialist signup
- `/cabinet` — Specialist dashboard
- `/cabinet/profile` — Specialist profile management
- `/cabinet/analytics` — Specialist analytics overview (Leader-gated insights)
- `/cabinet/group-events` — Group events (full lifecycle + participants + invites)
- `/cabinet/slots` — Schedule and public availability windows
- `/cabinet/sessions` — Specialist sessions (actions + notes + reschedule requests)
- `/cabinet/sessions/:id` — Specialist session detail
- `/cabinet/reviews` — Specialist reviews moderation
- `/cabinet/clients` — Specialist client records (clients + archive/restore)
- `/cabinet/billing` — Plans & access, including active client limit increase requests
- `/client` — Client dashboard (sessions + selected/viewed specialist)
- `/client/inquiries/:specialistId` — Client inquiry redirect to the public specialist inquiry surface
- `/client/sessions/:id` — Client session detail (cancel/reschedule request)
- `/client/specialists` — Specialist list (choose + open profile)
- `/client/therapists` — Legacy alias for specialists list
- `/client/group-events/:id` — Client group event detail
- `/invite/:token` — Group invite join (client acceptance flow)
- `/public` — Redirect to the current user's canonical public profile when available
- `/s/:slug` — Canonical public specialist profile / specialist landing page
- `/t/:slug` — Legacy public profile alias, compatibility-only
- `/specialists` — Ethical opt-in specialist discovery/profile search
- `/therapists` — Legacy alias for specialist discovery/profile search

## Auth

Signup uses email + password only (username auto-generated).

Login accepts email or username:

- If input contains `@` -> send as `email`
- Else -> send as `username`

Access token is stored **in memory only** (Pinia store). Refresh token is delivered as an `httpOnly` cookie and never exposed to JS.

Session is silently restored on page reload via cookie-based refresh (`/api/auth/token/refresh/`). No tokens in localStorage — legacy keys are actively cleaned on startup.

## Implemented UI (Frontend)

- **HomeView**: public landing with specialist/client choice + parallax layer stack
- **CabinetView**: account/entitlements overview + quick actions
- **ClientDashboardView**: client sessions list + selected/viewed specialists + intro price in cards
- **ClientDashboardView**: client sessions list + selected/viewed specialists + explicit loading/error/empty prep for priority, upcoming/past sessions, and group events
- **ClientDashboardView**: upcoming online sessions now surface external meeting badges and `Приєднатися` CTA when backend payload includes `meeting_url`
- **ClientSessionDetailView**: client cancel + reschedule request + reviews + external join CTA/copy link + follow-up request/session CTA after completed/cancelled sessions
- **ClientTherapistsView**: specialist list + open profile + intro price in cards + explicit empty/error states (legacy file name)
- **ClientGroupEventView**: client-facing group event detail
- **SlotsView**: schedule surface plus public availability window management
- **GroupEventsView**: full group lifecycle (create/schedule/start/complete/cancel), participants (roles/status), invites
- **TherapistSessionsView**: specialist actions + notes + reschedule requests + status/date filters
- **TherapistSessionDetailView**: specialist session detail with status actions, recurring flow, request context, private note, and external meeting-link context
- **TherapistReviewsView**: specialist review moderation (approve/hide/respond) + filters
- **TherapistClientsView**: specialist client records with archive/restore
- **BillingView**: plans + access state + per-plan upgrade request (manual billing) + active client limit increase request UI
- **TherapistProfileView**: step-by-step profile editor, media upload preview, visibility toggles, public link
  - standard price + intro price (duration + currency)
  - visibility toggles: `show_price`, `show_intro_price`
- **PublicProfileView**: landing-style public profile + request-first availability + trust/about/contact blocks + journal preview
  - setting acceptance is surfaced as an explicit request gate directly above available-time actions
- **Public request UX**: request-first public profile flow; `Обрати час` submits a request for a selected public availability window, while `Залишити запит без вибору часу` creates a request without selected time. A request is not an automatically confirmed session.
- **Booking/session error contract**: prepared frontend booking/session surfaces now consume backend `code` / `reason_code` first and keep `detail` only as a fallback
- **PublicTherapistsView**: opt-in public specialist discovery/profile search with server-side filters + intro price in cards + explicit in-view load/error/empty branches (legacy file name)
- **ExternalSessionsView**: includes `/cabinet/external-sessions#guest-requests`, the specialist request queue for no-registration/public guest requests.
- **LoginView / SignupView**: redesigned auth pages
- **System**: global toast/notification layer, notification bell with unread state, explicit reschedule notification copy, canonical inquiry notification copy, reminder-driven external join CTA when payload includes `meeting_url`, role-aware session/inquiry routing, 404/403 pages, empty states, loading skeletons
- **Invites**: group invite join page with consent + status messaging

## Not Implemented Yet (Frontend Gaps)

### Client session actions

- Polished confirmation flows and status messaging

### Group events UX

- Participant list filtering (role/status), invite link copy, and inline moderation cues

### Specialist client records

- Bulk actions and richer client profile view

### Billing / Entitlements UX

- Auto-billing integration (Stripe/Paddle) with live status updates
- Deeper UI states for GRACE / RESTRICTED / OVER_LIMIT

### System UX

- Finish the broader empty/loading/error pass across remaining views

### Quality / regression coverage

- Specialist session list/detail parity now covers confirm -> detail -> cancel -> back, detail reschedule, approve/decline request parity, stale confirm/complete rejection, and complete -> back
- Broader matrix expansion is only still needed if new lifecycle branches are added, such as stale cancel or future backend-only transitions

## Notes

- Non-home pages are constrained to 80% width.
- Parallax layers live in `src/assets/parallax/`.
- Public profile data is fetched from canonical `GET /api/s/{slug}/`.
  Legacy aliases `/api/public/specialists/{slug}/` and
  `/api/public/therapists/{slug}/` are compatibility-only.
- `/specialists` is opt-in discovery/profile search, not marketplace ranking.
  Do not add ratings, "top specialists", paid placement, or guaranteed-client
  language.
- Specialists appear in discovery only when the backend exposes them as both
  public-profile enabled and search-visible.
- `/s/:slug` is a specialist-owned public landing page. Selecting available
  time creates a request for specialist review, not an automatically confirmed
  session and not payment confirmation.
- `/cabinet/external-sessions#guest-requests` is the request queue for
  no-registration/public guest requests.
- Specialist sidebar `Запити` badge shows all pending guest requests awaiting
  specialist decision. It should use `pending_guest_requests_count`, not unread
  notification count and not slotless-only count.
- Public-facing specialist name uses `First L.` format.
- Keep files saved in UTF-8 to avoid broken Ukrainian text.
- Analytics contract for the cabinet view is centralized in `src/lib/analytics.ts`.
- Backend interprets `date`, `date_from`, `date_to` filters as UTC day boundaries (send `YYYY-MM-DD` in UTC).
- Billing upgrade requests call `POST /api/billing/request-access/` with `requested_plan`.
- Public pricing/landing copy must follow the currently implemented tariff and
  beta-access contracts; do not introduce speculative future prices or payment
  promises in frontend docs or copy.
- Active client limit increase requests call
  `POST /api/cabinet/active-client-limit-increase-requests/` with
  `requested_extra_slots` and optional `specialist_note`.
  - `/api/cabinet/entitlements/` exposes active client entitlement data and
    `active_client_limit_increase_request`.
  - Start supports base `3`, max extra `3`, total max `6`.
  - Pro supports base `20`, max extra `6`, total max `26`.
  - Leader does not show the specialist-facing expansion flow.
  - Price copy: `+1 активний клієнт — 200 грн/міс`.
  - Quantity selector supports `+1..+available`.
  - Button text: `Запросити розширення ліміту`.
  - Helper examples:
    `+3 активні клієнти — 600 грн/міс`,
    `+6 активних клієнтів — 1 200 грн/міс`.
  - Total helper examples:
    `Разом після схвалення: 600 грн/міс` for Start `+3`,
    `Разом після схвалення: 1 790 грн/міс` for Pro `+4`,
    `Разом після схвалення: 2 190 грн/міс` for Pro `+6`.
  - Success toast:
    `Запит на +N активні клієнти надіслано адміністратору.`
  - Duplicate pending toast:
    `Запит на +N активні клієнти очікує розгляду.`
- Client profile photos come from `/api/client/profile/` > `photo_url`.
  - If `photo_url` is present but image is missing, check GCS config on backend.
  - For signed URLs (`GCS_PUBLIC=false`), refresh the page to regenerate the URL.
- Persistent project handoff lives in `docs/HANDOFF.md` and is maintained as the current agent-facing status file.
- Handoff governance rules live in `docs/HANDOFF_RULES.md`; closed-phase history is archived in `docs/PHASE_CLOSE_SUMMARIES.md`.
- Online session execution in this MVP uses backend-provided external `meeting_url` plus optional `meeting_provider`; built-in video rooms are not part of the frontend runtime.

## Deployment (Production)

Build image with API URL baked in:

```bash
docker build --build-arg VITE_API_BASE_URL=https://proconsult.space/api -t proconsult-frontend .
```

Served via `nginx` on port 80. All routes return `index.html` for Vue Router.
Full stack: see `docker-compose.prod.yml` in backend repo.

Production routing note: custom Vue admin SPA pages under `/admin/*` must be
served by the frontend before generic Django admin routing. Current Vue admin
paths are `/admin/work-queue`, `/admin/inbox`, `/admin/billing-access-requests`,
and `/admin/specialists` with their subpaths. Django admin model paths such as
`/admin/booking/...`, `/admin/core/...`, `/admin/auth/...`, `/admin/login/...`,
and `/admin/logout/...` must remain backend routes.

## Next Focus

1. Privacy Policy / confidentiality / support contact flow polish
2. Specialist client records depth: bulk actions and richer client profile view
3. Broader empty/loading/error normalization for remaining non-booking views
