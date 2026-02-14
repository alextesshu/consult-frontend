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
* `/cabinet/sessions` — Therapist sessions (in progress)
* `/client` — Client dashboard (sessions + selected/viewed therapist)
* `/client/therapists` — Therapist list (choose + open profile)
* `/public` — Redirect to `/t/:slug` (auto via profile)
* `/t/:slug` — Public therapist profile + booking

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
* **ClientTherapistsView**: therapist list + open profile
* **SlotsView**: create/edit/delete slots + fill day/week + date navigation
* **GroupEventsView**: list drafts + create drafts + entitlement status display
* **TherapistSessionsView**: skeleton page for therapist sessions (in progress)
* **TherapistProfileView**: full profile editor, media upload preview, visibility toggles, public slug management
* **PublicProfileView**: real public profile data + upcoming slots list + booking CTA
* **LoginView / SignupView**: redesigned auth pages

## Not Implemented Yet (Frontend Gaps)

### Therapist sessions
* Sessions list and detail page for therapists
* Actions: confirm / complete / cancel / reschedule
* Session notes UI (`GET|PUT /api/cabinet/sessions/{id}/note/`)

### Client session actions
* Client cancel or reschedule flow
* Session detail view for clients

### Group Room full flow
* Group event details view
* Schedule / start / complete / cancel
* Participant management (add/remove/roles)
* Invites (create / accept / decline)

### Therapist CRM
* Client list, states (ACTIVE/INACTIVE/ARCHIVED)
* Archive and restore actions

### Billing / Entitlements UX
* Plans and upgrade screen
* `request-access` flow (`/api/cabinet/billing/request-access/`)
* UI states for GRACE / RESTRICTED / OVER_LIMIT (beyond badges)

### Public catalog
* Public therapists list with search/filters/pagination

### Ratings & reviews
* Client ratings for sessions/therapists
* Optional text reviews with moderation-ready UI states

### System UX
* 404 / 403 pages
* Global toast/notification layer

## Notes

* Non-home pages are constrained to 80% width.
* Parallax layers live in `src/assets/parallax/`.
* Public profile data is fetched from `/api/public/therapists/{slug}/`.

## Next Focus

1. Therapist sessions (list, detail, transitions, notes)
2. Client session actions (cancel/reschedule + details)
3. Group Room full lifecycle (schedule/start/participants/invites)
4. Ratings & reviews (client scores + optional feedback)
