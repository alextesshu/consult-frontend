# PR #74 review remediation

Baseline: `1d03d1e029e56324a2c4149380e80c88dcfa8fd7` on the existing integration
branch/worktree. Target remains `feat/uc-02-calendar-3a`; PR stays Draft.
The prior [integration evidence](../uc00-uc02-integration/README.md) is preserved
byte-for-byte and describes the original integration HEAD, not these review fixes.

## P1 root cause and synchronization invariant

The adapter exposed all GET refreshes as both `canWrite=false` and `saving=true`.
The root/menu handlers therefore silently rejected an immediate action after focus
or visibility started a background GET. Revision filtering alone also did not fence
late GET error/recovery callbacks, and an adapter GET callback could dismiss a newer
PATCH conflict message.

The accepted-action invariant is now:

1. Initial loading and explicit retry/reconnect validation block settings writes.
   Ordinary focus/visibility revalidation with a confirmed snapshot does not.
2. An accepted user write immediately retires background adapter ownership. There
   is no second adapter edit queue, deferred upload, duplicate PATCH or replay.
3. The existing serialized store PATCH captures the latest accepted revision.
   A monotonic in-memory read generation fences GET success/error callbacks at
   dispatch and at write success or recovery boundaries. Epoch fencing remains.
4. Old reads cannot change confirmed state, requiresReload, or error state. The
   adapter operation ticket separately prevents an old callback from dismissing
   the conflict message. Old network requests may finish, but cannot apply.
5. A 409 starts a fresh recovery GET and exposes the authoritative result/error;
   the rejected edit is not retried. Explicit retry cannot reuse a retired GET.

The store change is only in the PR #74 integration branch. PR #71 and its worktree
remain unchanged. API URLs, payload contracts, backend guards and booking are unchanged.

## P2 changes

- Refresh/save announcements use one persistent visually-hidden live status region,
  outside normal flow; no calendar shift or permanent blank status row.
- Phone sheet offers Day/List only. A saved Week projects to selected Day, without
  a viewport-triggered PATCH. Desktop retains Week/Day/List.
- Clicking the already selected preview tab does nothing. Only the explicit
  preview adoption button can save that preview mode. Return/refresh/history do
  not PATCH. Cleanup preserves other query values and hash, and a late successful
  adoption does not replace a newer navigation/history destination.
- View fieldset gets its name from its legend alone; layer fieldset is separately
  named "Видимість шарів". No duplicate aria-label/legend for view controls.

## Exact source/test files changed

- `src/composables/useServerCalendarPreferencesSource.ts`
- `src/stores/calendarPreferences.ts`
- `src/stores/calendarPreferences.spec.ts`
- `src/components/calendar-v2/ServerCalendarV2.vue`
- `src/components/calendar-v2/ServerCalendarV2.spec.ts`
- `src/components/calendar-v2/CalendarV2.vue`
- `src/components/calendar-v2/CalendarViewMenu.vue`

New review evidence is contained in this directory. No changes to previous evidence,
calendarGridScale, CalendarTimeGrid, calendar CSS, API client, backend or #71/#72/#73.

## Verification

- Regression-first: six of eight selected new component scenarios failed against
  the reviewed HEAD; auth/history cases already passing were retained.
- Focused store/root/server tests: **79 PASS** (34 store, 21 root, 24 server).
- Full Vitest: **143 files / 2129 PASS**, no skips/unhandled errors, 168.24 seconds.
- Production build: PASS, existing chunk-size warning only.
- Typecheck: exactly **9 baseline diagnostics, zero new**, complete output compared
  with the current `origin/dev` baseline `3085c1cb4ac3ebd45a71feb0307bd5404881f24e`.
- `git diff --check`: PASS.

Unit/component cases cover focus -> immediate mode click; visibility -> immediate
layer click; GET after successful PATCH; obsolete GET failure; 409 recovery while an
older GET remains pending; explicit retry ownership; logout/specialist switch;
initial/error-recovery gates; selected preview tab; concurrent history navigation;
375/390 phone options and accessible groups. Existing serialized PATCH/no-localStorage
and authentication tests remain in the full suite.

## Browser and real-backend evidence

[browser.json](browser.json), [script](browser.cjs), and screenshots:

- [Refresh pending](screenshots/desktop-refresh-pending.png)
- [Save pending](screenshots/desktop-save-pending.png)
- [375px sheet](screenshots/mobile-375-view.png)
- [390px sheet](screenshots/mobile-390-view.png)

**Six browser groups PASS** against the real isolated Django backend at
`47d57b5791e750cb3a47846be67f9e2e655bb3ec`, migration 0098, disposable PostgreSQL
database `uc_integration`. GET responses are fetched from Django and deliberately
held before fulfillment to reproduce ordering; successful data are not fixtures.
Focus/visibility signals are controlled DOM events; clicks are actual Chromium
mouse input. This is not a claim of physical OS Alt-Tab testing.

- Focus + pending GET + immediate mode click: one guarded PATCH, HTTP 200; late GET
  cannot revert mode. Mode-control top stays identical during GET and held PATCH.
- Visibility + pending GET + layer checkbox: one HTTP 200 PATCH; checked state survives.
- Another synthetic API write makes the UI PATCH stale: real HTTP 409, recovery GET,
  persistent conflict message after late GET, no replay.
- Selected preview tab, refresh, Back/Forward and return: zero implicit writes;
  explicit adoption: exactly one guarded PATCH. Query/hash are preserved.
- 375/390 sheet: Day/List only, Day selected for persisted Week, zero projection
  writes, distinct accessible groups and no document overflow.
- Logout/login while GET pending: new specialist's Week view and feed remain isolated.

Synthetic data/credentials only; credentials and tokens stay outside Git. The test
backend uses the previously proven isolated locmem email/provider/network guards,
test-only throttle rates and loopback CORS settings. Source backend is mounted read-only.
No primary local DB, production/staging configuration, migrations or workers changed.

Prior V1 viewport parity, five-width integration matrix and actual touch/scroll
evidence remain in the original evidence folder; they were not regenerated for
these narrow review changes. The scale/time-grid/CSS blobs are unchanged.

## Commands and remaining gates

```powershell
npx vitest run src/components/calendar-v2/ServerCalendarV2.spec.ts src/stores/calendarPreferences.spec.ts src/components/calendar-v2/CalendarV2.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
npx vue-tsc -b --force
git diff --check
```

Browser reproduction requires the owned isolated backend/preview and external
`UCI_CREDENTIALS`, plus `UCI_ISOLATED_DATABASE=uc_integration`:

```powershell
node docs/ui-v2/evidence/pr74-remediation/browser.cjs
```

No remaining confirmed P1/P2 findings within this review scope. Automatic integration
CI is still NOT RUN because this PR targets a feature branch; no gate bypass, retarget
or manual run. Fresh normal CI is required before an approved dev-target promotion.
Backend #64's separate billing gate remains. No Ready, merge, deployment or Jira change.
