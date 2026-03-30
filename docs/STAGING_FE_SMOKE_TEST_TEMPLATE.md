# Staging FE Smoke Test Template (PRO CONSULT)

Last updated: 2026-03-30  
Environment:
- Frontend: `https://staging.proconsult.space`
- API: `https://staging-api.proconsult.space`
- Branch mapping: `dev -> staging`, `main -> production`

Tester:
Date:
Build/commit:

## 1) Deploy Preflight (Canonical)

- [ ] Trigger deploy only via backend canonical deploy script for staging (no ad-hoc/manual remembered commands).
- [ ] Confirm deploy target is `dev` branch for staging.
- [ ] Open `https://staging.proconsult.space` after deploy completes.
- [ ] Verify footer deploy marker is visible:
  - env label: `Staging`
  - FE build marker: short commit SHA/version
- [ ] Record the same marker in `Build/commit` above before running smoke.

## 2) Smoke Checklist (Beta)

### Auth
- [ ] Signup (specialist) works, success path clear.
- [ ] Login works with valid credentials.
- [ ] Invalid login shows clear error (no crash).
- [ ] Logout returns to expected public state.
- [ ] Session restore after refresh works (no random logout).

### Beta Access Surfaces
- [ ] Cabinet shows current beta access marker/message.
- [ ] Billing page shows current access state clearly.
- [ ] Settings/account summary shows the same access semantics.
- [ ] No UI text implies user purchased a paid plan if they did not.
- [ ] If beta expiry exists: date is shown correctly.
- [ ] If beta expiry is unknown: neutral message shown (no fake deadline).

### Billing/Tariff Informational Mode
- [ ] Tariff section is visible and understandable as future/commercial model.
- [ ] During beta, checkout/select-plan behavior matches approved mode (hidden/disabled/informational).
- [ ] No confusing mixed messaging (`active paid plan` + `free beta`) on one screen.
- [ ] Navigation to/from billing page is stable.

### Profile / Media
- [ ] Profile page loads with explicit loading/error handling.
- [ ] Photo upload + crop + save works.
- [ ] Photo crop modal closes correctly after success.
- [ ] Photo delete works; preview removed after success.
- [ ] Video upload works.
- [ ] Video delete works; preview removed after success.
- [ ] Media validation messages are clear and inline.

### Public Profile
- [ ] Public profile opens from cabinet link.
- [ ] Main profile blocks render (about, contacts, media if enabled).
- [ ] Booking/contact CTA behavior is correct for auth/non-auth state.
- [ ] No misleading verification/ranking wording.

### Notifications
- [ ] Notifications list loads.
- [ ] Empty state is explicit and readable.
- [ ] Error state has clear retry path.
- [ ] Read/unread actions (if available) update UI correctly.

### Loading / Empty / Error States (Critical Screens)
- [ ] Cabinet dashboard
- [ ] Billing page
- [ ] Specialist profile editor
- [ ] Public profile page
- [ ] Notifications page
- [ ] Each screen has explicit and non-broken loading/empty/error behavior.

## 3) Defect Log Template

Use one row per issue.

| ID | Severity | Area | Repro steps | Expected | Actual | Screenshot/URL | Status |
|---|---|---|---|---|---|---|---|
| DEF-001 | High | Billing | 1) ... 2) ... 3) ... | ... | ... | ... | Open |
| DEF-002 | Medium | Profile/Media | 1) ... 2) ... | ... | ... | ... | Open |

Severity guide:
- `Blocker` - beta pass cannot proceed.
- `High` - critical user flow broken or misleading.
- `Medium` - flow works but UX is confusing/incomplete.
- `Low` - cosmetic/minor polish.

Status values:
- `Open`, `In Progress`, `Fixed`, `Verified`, `Won't Fix (beta)`.

## 4) Triage Outcome

### Beta Must-Have Fix Criteria
- Breaks core auth/session flow.
- Breaks profile/media core flow (upload/save/delete) or causes data inconsistency.
- Misrepresents beta access as paid ownership.
- Billing mode contradicts approved beta policy.
- Critical screen has missing/broken loading/error states.
- Routing/redirect issues causing loss of access or dead ends.

### Can Wait Until Post-Beta
- Minor copy polish not affecting trust/meaning.
- Non-critical visual alignment/spacing issues.
- Nice-to-have helper UI improvements.
- Secondary empty-state polish where core action still works.
