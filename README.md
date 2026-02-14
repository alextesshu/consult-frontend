# Pro Consult Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router.

## Requirements

* Node.js 20.9+ (Vite 5)

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

## Routes

* `/` — Public Home (role choice + parallax scene)
* `/login` — Login
* `/signup` — Therapist signup
* `/cabinet` — Therapist dashboard
* `/cabinet/profile` — Profile editor + public preview
* `/cabinet/group-events` — Group events (list/create/delete drafts)
* `/cabinet/slots` — Slots (create/edit/delete)
* `/cabinet/sessions` — Therapist sessions (actions + notes + reschedule requests)
* `/cabinet/clients` — Therapist CRM (clients + archive/restore)
* `/cabinet/billing` — Plans & access (manual request)
* `/client` — Client dashboard (sessions + selected/viewed therapist)
* `/client/sessions/:id` — Client session detail (cancel/reschedule request)
* `/client/therapists` — Therapist list (choose + open profile)
* `/public` — Redirect to `/t/:slug` (auto via profile)
* `/t/:slug` — Public therapist profile + booking
* `/public/therapists` — Public therapists catalog

## Auth

Signup uses email + password only (username auto-generated).

Login accepts email or username:

* If input contains `@` -> send as `email`
* Else -> send as `username`

Tokens are stored in localStorage and auto-refreshed via `/api/auth/token/refresh/`.

## Implemented UI (Frontend)

* **HomeView**: public landing with therapist/client choice + parallax layer stack (no animation yet)
* **CabinetView**: account/entitlements overview + quick actions under the hero
* **ClientDashboardView**: client sessions list + selected therapist + viewed therapists
* **ClientSessionDetailView**: client cancel + reschedule request + reviews
* **ClientTherapistsView**: therapist list + open profile
* **SlotsView**: create/edit/delete slots + fill day/week + date navigation
* **GroupEventsView**: list drafts + create drafts + entitlement status display
* **TherapistSessionsView**: therapist actions + notes + reschedule requests
* **TherapistClientsView**: therapist CRM with archive/restore
* **BillingView**: plans + access state + request access
* **TherapistProfileView**: full profile editor, media upload preview, visibility toggles, public slug management
* **PublicProfileView**: public profile data + upcoming slots + booking + reviews
* **PublicTherapistsView**: public catalog with server-side filters
* **LoginView / SignupView**: redesigned auth pages

## Not Implemented Yet (Frontend Gaps)

### Therapist sessions
* Session detail page for therapists
* Filters (status/date), client name display improvements

### Client session actions
* Polished confirmation flows and status messaging

### Group Room full flow
* Group event details view
* Schedule / start / complete / cancel
* Participant management (add/remove/roles)
* Invites (create / accept / decline)

### Therapist CRM
* Bulk actions and richer client profile view

### Billing / Entitlements UX
* Upgrade UX and plan comparison refinements
* Deeper UI states for GRACE / RESTRICTED / OVER_LIMIT

### Public catalog
* Pagination + server-side sorting

### Ratings & reviews
* Moderation-ready UI states and review editing policy

### System UX
* 404 / 403 pages
* Global toast/notification layer

## Notes

* Non-home pages are constrained to 80% width.
* Parallax layers live in `src/assets/parallax/`.
* Public profile data is fetched from `/api/public/therapists/{slug}/`.

## Next Focus

1. Group Room full lifecycle (schedule/start/participants/invites)
2. Ratings & reviews (moderation UX)
3. Public catalog pagination + sorting
4. System UX (404/403, toasts)
