# UC-00 x Calendar 3a server preferences integration

## Topology and provenance

- Own branch: `feat/uc00-calendar-3a-integration`.
- Own worktree: `C:/Users/admin/dev/portfolio/consult/_uc00_uc02_integration`.
- PR target: `feat/uc-02-calendar-3a`, not dev/main.
- Approved UX base #73: `ad6c3a39361678c815b29f2f5eef5574b9ba7aac` (FINAL UX PASS).
- UC-01 #72 ancestor: `02516d3d432b2655ecd8fef31aaf1ca7afd04718`.
- UC-00 #71 merged without conflicts: `21253b7ccd9ffdf92c6f206647d92c28062cfa14`.
- Local merge commit: `e8b79230d3caec1c4dba76403bec3317d815a26d`.
- Real backend #64: `47d57b5791e750cb3a47846be67f9e2e655bb3ec`, migration `0098`.

Design authority is the user-approved #73 UX and product-approved regular_view integration.
Its v6.8 reference is `handoff/CALENDAR_3A_SPEC.md` (DESIGN READY) / Calendar-UX #3a
inside `design-sources/Модернізація дизайну сайту ProConsult (v6.8).zip`, SHA-256
`039ef5446679f7da124bb620ba9f7daac26d657071a5313688c61755cae4d2d7`.
The prior canonical snapshot `claude-design-2026-10-23-4ff7cedd`, full archive SHA-256
`4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`, remains unchanged.
No snapshot replacement or global design-document synchronization is part of this task.

## Implementation scope

The five imported UC-00 API/store/composable/test files are byte-identical to #71.
The integration does not duplicate normalization, revision handling, the PATCH queue,
regular_view capability detection or 409 recovery.

- `src/composables/useServerCalendarPreferencesSource.ts`: thin source projection,
  write gating, lifecycle GET reloads, offline/read-error handling, auth-epoch cleanup.
- `src/components/calendar-v2/ServerCalendarV2.vue`: authoritative loading/error/retry
  wrapper; active feed/calendar mounts only after a server snapshot exists.
- `src/components/calendar-v2/ServerCalendarV2.spec.ts`: 15 integration scenarios.
- `src/lib/calendarPreferencesSource.ts`: async-compatible injected source interface;
  local source retained for isolated component fixtures, not API-error fallback.
- `src/components/calendar-v2/CalendarV2.vue` and its spec: URL-only preview, guarded
  explicit adoption, restored Week/Day/List rendering and server-confirmed keyboard focus.
- `src/components/calendar-v2/CalendarViewMenu.vue`: regular-view controls, read-only
  settings state and initial close-control focus when inputs are disabled.
- `src/views/SpecialistSessionsEntryView.vue` and its spec: production v2 uses the
  server wrapper; v1 keeps the existing sessions view.
- `src/styles/calendarV2.css`: only two new v2-scoped view-button layout rules.

`calendarGridScale.ts`, its tests and `CalendarTimeGrid.vue` are unchanged from #73.
Original timeline clipping, scroll chaining, sheet header/scroll lock, event markers,
availability windows, summaries and next-action behavior are preserved.
No backend, router, App.vue, navigation mapping, booking or occupancy changes.

## Behavior

The display source maps `state.view` to UC-00 `displayRegularView`, never legacy view
for a supported server. `needs_action` renders actions while regular_view survives.
Mode/layer/reset commands go directly through the imported store; view commands use
its dedicated `setRegularView`. No localStorage preference persistence.

`?mode=` is a projection only; `actions` aliases needs_action. A different query mode
shows preview defaults from the existing mode reference, never writes them. Settings
are disabled until explicit adoption or return to saved settings. Adoption is one
guarded mode PATCH. Mount, refresh and Back/Forward do not PATCH. Successful explicit
selection clears the query; failure/409 does not retry or mutate the route implicitly.

Offline or failed refresh retains only the confirmed snapshot read-only. An initial
GET failure displays retry, without mounting a calendar with invented preferences.
401/403 read failures hide the calendar; write denial preserves readable state and
disables settings writes. Reconnect/focus/visible-tab/route re-entry only reload by GET.
An unknown regular_view capability is read-only, using #71's display fallback.

The auth epoch clears shared feed results and remounts the calendar/feed instance.
Old preference responses are still fenced by the imported UC-00 store.

## Validation results

- Targeted final calendar/source/grid tests: 41 passed.
- Full final Vitest: **143 files, 2117 passed**, no skipped tests or unhandled errors;
  `npx vitest run --maxWorkers=2 --minWorkers=1`, 197.28 seconds.
- Production build: PASS (existing chunk-size warning).
- Typecheck: the exact same 9 diagnostics as `origin/dev` `3085c1c...`, zero new;
  both ran `vue-tsc -b --force` with identical dependencies and their complete logs compared.
- `git diff --check`: PASS.

One earlier full run correctly failed on an async permission-test assertion, fixed
to await the completed recovery. New focus regressions were reproduced before fixing.
A later default-worker run had three `Worker exited unexpectedly` errors while browser
tools were active; it is not PASS evidence. Only owned leaked probe processes were
stopped and the full suite rerun with two workers, without excluding tests or editing CI.

## Real API acceptance

[real-backend.json](real-backend.json) and [reproduction script](real-backend.cjs):
**12 acceptance groups PASS**, including a 15-row viewport/view matrix.

Successful API responses are real Django responses, not fixtures. PostgreSQL 16 uses
the disposable database `uc_integration` on tmpfs; the primary local database is untouched.
Migration 0098 was applied before the server started. Django source was mounted read-only.
API/frontend origins: `http://localhost:8412/api` / `http://localhost:5412`.

Two independent Chromium contexts/cookie jars represent devices; no physical-device
or cross-browser-engine acceptance is claimed.

| Scenario | Evidence |
|---|---|
| Profile auth / preferences / feeds | Real API GETs 200; zero page errors |
| Day -> actions -> Day | regular_view=day survives reload and second browser |
| Custom layer / reset | Mode preserved, custom then defaults; regular_view retained |
| Preview / history / refresh | Zero preference writes before explicit adoption; adoption one PATCH |
| Stale UI PATCH | Real HTTP 409, recovery GET, visible conflict, no replay |
| Concurrent same revision | Two real requests: one 200, one 409 |
| Offline / reconnect | Confirmed snapshot read-only; no queued upload |
| Outage | Controlled GET 503 injection; successful data still real; explicit retry |
| 375/390/768/1280/1440 | Week/Day/List, no document overflow, mobile week projects day |
| Wheel | Sparse timeline passes wheel to page, timeline scrollTop stays zero |
| Specialist switch | UI logout/login, separate preference/feed instance |
| Permissions | Actual anonymous 401 and client 403, API-only checks |

Initial 401/403/503 UI behavior, capability fallback, conflict recovery, snapshot safety,
keyboard focus and auth fencing also have component/unit fixture coverage, distinct from
the real-backend groups above. Calendar business endpoints receive GET only. Explicit
preferences PATCH and ordinary auth login/refresh/logout POST are recorded separately.
Preference PATCH payloads/responses are included; auth bodies/tokens are never recorded.

[Touch evidence](touch-and-states.json): actual CDP touch gestures at 375 and 390,
page delta +265 px, close button 44 px, scroll lock restored, focus returned, no overflow.
These contexts used normal motion; the main real-backend matrix used reduced motion.

Disposable-only safety: locmem email, no provider tokens, onboarding kill switch,
outbound DNS/socket/SMTP guard and bridge masquerading disabled. Docker Desktop's
internal network could not publish loopback, so the owned test bridge was used instead.
Only host loopback port 8412 is published. Synthetic test throttle rates were raised
after rapid reloads hit /me/ 429. Test CORS allows the two localhost preview origins.
No production/staging or repository settings/env files were changed.

All names and account addresses in screenshots are synthetic local data. Credentials
were generated outside Git and are required only by local environment file-path inputs.

## UI v1 parity

[parity.json](parity.json): **9/9 viewport pairs, zero changed pixels**, against the
immutable #73 source archive. Sessions at all five widths; slots/dashboard additionally
at 375 and 1280. Viewport height 900, identical Chromium rendering configuration,
fixed date, fonts/network settled, animations disabled, no element masking or CSS overrides.
UI v1 made zero calendar-preferences requests.

Exploratory full-page captures had 9-23 header edge pixels of raster variance; an
unchanged-baseline versus itself control reproduced the same locations. Viewport capture
avoids that full-page surface effect; the remaining 1280 slots capture was repeated after
settling the capture surface. Final committed parity numbers are viewport comparisons,
not a claim of zero full-page raster variance. The comparator examines all RGB channels.

## Commands and reproduction

Run from the integration worktree in Windows PowerShell:

```powershell
npx vitest run src/components/calendar-v2/ServerCalendarV2.spec.ts src/components/calendar-v2/CalendarV2.spec.ts src/lib/calendarGridScale.spec.ts
npx vitest run --maxWorkers=2 --minWorkers=1
npm run build
npx vue-tsc -b --force
git diff --check
```

The browser scripts require an explicitly confirmed disposable database and external
synthetic credential files (`UCI_ISOLATED_DATABASE=uc_integration`, `UCI_CREDENTIALS`,
`UCI_CLIENT_CREDENTIALS`). They use the existing local Playwright cache, no new dependency.
Start the isolated migrated backend and the two local previews first; no production
credentials or domains are accepted. `parity.cjs` optionally accepts UCI_PARITY_WIDTH /
UCI_PARITY_ROUTE for a targeted capture; it retains the other recorded pairs.

```powershell
node docs/ui-v2/evidence/uc00-uc02-integration/real-backend.cjs
node docs/ui-v2/evidence/uc00-uc02-integration/touch-and-states.cjs
node docs/ui-v2/evidence/uc00-uc02-integration/parity.cjs
python docs/ui-v2/evidence/uc00-uc02-integration/compare.py
```

## Release gates

The existing frontend workflow only triggers for PRs targeting dev/main (or pushes to
dev). This integration PR targets #73's feature branch, so absent automatic Actions is
**NOT RUN**, not SUCCESS. No workflow edits, retargeting, dispatch or CI bypass.
Final approved integration into a dev-targeting PR still requires fresh normal CI for
that exact merge tree. Backend #64's known CI billing gate is also unresolved; local
acceptance is not backend promotion approval. No Ready, dev/main merge or deployment.
