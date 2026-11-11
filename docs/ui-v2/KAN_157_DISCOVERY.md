# KAN-157 — Discovery full Claude v5 fidelity

## Scope and provenance

Existing **Draft [PR #56](https://github.com/alextesshu/consult-frontend/pull/56)**, branch `feat/ui-v2-stage-2-2-discovery`, target `dev`. Verified original PR HEAD: `efdcbea4ce8d572bde020fa7260480d033397046`. Current integration base: **`d666a6cfec4417517ef4f472ea27300cdf81b033`**, including merged #60/#61/#62/#59. Integrated without conflicts in commit `153b721` (`Merge dev into KAN-157 discovery branch`). Existing worktree retained: `C:/Users/admin/dev/portfolio/consult/_ui_v2_stage2_2_discovery`. Local `frontend/dev` remains unchanged.

Authoritative snapshot **`claude-design-2026-10-23-7570f1ad`**; full original ZIP SHA-256 **`7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`**, checked against `design-sources/Модернізація дизайну сайту ProConsult (v5).zip`.

Canonical paths resolve exactly: [Find-Specialist.dc.html](snapshots/2026-10-23-7570f1ad/handoff/mockups/Find-Specialist.dc.html), [brand-listen.js](snapshots/2026-10-23-7570f1ad/handoff/mockups/brand-listen.js), [v5 matrix](IMPLEMENTATION_MATRIX_V5.md), [sync audit](DESIGN_SYNC_2026-10-23_V5.md), [design system](../DESIGN_SYSTEM.md). Discovery is DESIGN READY; backend/product gaps remain separately gated. Older matrix references to missing shared shell/For Clients and pre-merge Home are historical, reconciled against actual Git/PR metadata.

## Complete visual and interaction inventory

| Claude reference | Vue implementation | Difference / contract boundary | Evidence |
| --- | --- | --- | --- |
| Shared 76px header, 64px below 640; fennec and client navigation | Current approved shared header/footer are reused unchanged | Approved shared responsive menu/brand composition supersedes raw prototype chrome; no App/shared CSS edit | Four-width captures, App/router tests; source isolation |
| Hero max 820px; title clamp(38px,5vw,60px), 1.04 line height, -.04em; padding clamp(48px,7vw,80px) | Same page-local composition, spacing and typography | Standard landing metadata/heading remains authoritative on psychological-support landing | Matching source/Vue hero/full captures |
| Search pill, white surface, 1.5px border, 48px inner field, 22px left inset, shadow | Same anatomy and dimensions, native submit button | Native label/hint and visible focus added; existing input length validation retained | CSS contracts, keyboard/validation acceptance |
| Focus border navy, .25s border transition | `:focus-within`, exact .25s transition | Readable muted placeholder replaces insufficient source soft text; 2px keyboard outline retained | Source CSS and focus evidence |
| Four placeholders, 3200ms interval; hide 400ms, y=-8px; show next and wrap | `useDiscoveryMotion`, exact idle tick/transition cadence and all four original examples | Pure aria-hidden visual overlay: input is never programmatically filled. Screen-reader hint remains constant. | 14 lifecycle tests, placeholder exit/enter frames |
| Placeholder rotation skips while focused or q nonempty | Focus/text stop owned scheduling; blur/clear restart one full 3200ms period | Source retains its global interval clock; restarting a full interval avoids immediate movement after interaction. No draft submission or mutation. | Unit tests and browser request count after 750ms typing |
| Seven categories toggle selected state; .2s all transition | Native pressed buttons with original labels and supported request-group codes; same toggle/color timing | Uses real `setRequestGroup(code/null)`; preserves unsubmitted draft and existing applied q. No frontend keyword inference. | View regression, API request records |
| All/online/offline segmented control; selected white surface/shadow, .25s | Native radio group, exact composition/transition | Existing `format` semantics, URL/history/API calls retained. Arrow-key selection works. | Browser keyboard/history and composable regression |
| Prototype only has request-group mode | Existing professional-direction mode preserved as compact radio controls | Existing feature/API contract, not an unsupported new filter. Psychological-support retains real direction mapping and metadata; no inferred topic defaults. | Existing request/direction/landing tests and browser acceptance |
| Typing calls `bump` and schedules `listen` after 600ms | Typing changes only existing draft plus decorative placeholder visibility | **Simulation not copied:** no debounce or request until explicit Enter/submit. | View no-debounce test and browser request counts |
| Search/category runs a simulated 800ms listening phase | Real `loading` controls listening indicator; real results are displayed as soon as response renders | **No artificial 800ms hold.** Loading skeleton replaces stale result links; real errors/retry are retained. | Deferred-response test, loading/error/retry captures |
| PCListen: 32px, two rings, 1.8s, second delayed .9s, mark breath 3.2s | Existing approved SVG and page-owned rings/breath with same geometry and timing | Gap 156–198°, scale 1.04→1.9, opacity .55→0, cubic-bezier(.2,.6,.3,1). Exact source ring accent #2f8c86 is local; shared tokens/brand geometry unchanged. | Listening frames/recordings and CSS contracts |
| `bump`: list opacity .35/y6px; reset fade after 160ms; transition .3s ease | Same .35/y6 and .3s state transition while actual request is loading | **160ms simulation timeout omitted:** real loading duration controls state; stale specialists are not shown as if current. Format changes also reflect actual network work. | Result/listening captures and stale-link regression |
| Cards opacity 0→1, y14px→0; .45s opacity, .55s cubic-bezier(.2,.8,.2,1), delay min(i,5)×.08s | Real returned cards enter with exact source transitions/stagger after paint boundary | Animation never delays response by a simulated timer. Pending paint frames are superseded/canceled on a new load, preference change, version exit or navigation. Existing API groups/order retained; stagger restarts within each group. | Computed transition results, cancellation tests, reveal frames |
| Card grid auto-fill min(100%,520px), gap14; card 24px radius, padding20; photo112/gap20 or photo72/gap14 below640 | Same geometry, real photo/public name/price/specializations/summary/topics/format/location | Sparse data is omitted without invented identities/prices; initials derive from the public name. Long names wrap instead of overflowing mobile. | Card tests, full captures, long-name browser stress |
| Card hover shadow 0 16px 40px rgba(18,35,58,.08), border transition .3s | Same shadow/timing; no arbitrary vertical hover motion | Border uses existing readable/strong border token; native 2px focus added; keyboard-focused cards immediately bypass stagger/fade | Hover captures, CSS and keyboard tests |
| Four source avatar tints | Same decorative four-tint cycle for missing-photo cards | Decorative presentation only, unrelated to credentials, rank or relationship | Result captures |
| Source matching badge inferred from KW/qGroups | Badge only when real API item `match_kind === 'exact'`; neutral “За вашим запитом” | No semantic matching or “works with topic” inference; related/fallback/null get no exact badge. | Exact/related/fallback/null regression tests |
| Nearest-window border row with fabricated dates | Same separated footer-row structure: “Звернення · У профілі спеціаліста” | **Nearest-slot gate retained:** DTO has no public slot value. No invented availability, appointment, booking action or guarantee. Whole card remains a single canonical profile link. | Card tests and source/Vue comparisons |
| Result count and non-ranking explanation | Real response total with existing Ukrainian inflection; count is politely announced | No fabricated demo result data enters runtime. Server groups, eligibility and opt-in visibility remain backend-owned. | View/API tests, fixture response records |
| Empty state dashed 24px panel, pale mark, copy and reset | Same panel hierarchy and approved decorative mark, real response-driven empty state | Genuine initial empty directory distinguished from active-search empty state; no empty state while waiting/pending direction | Empty/loading tests and captures |
| Prototype has no real network error/retry state | Real error panel, alert, retry; validation beside input | Production states preserved, using source-compatible panel anatomy; no synthetic successful fallback | Browser error/retry and view tests |
| Optional account navy card, guide mint card, lookup white card | Three original panels, 24px radius, 28px padding, 14px gap | Unsupported diary/rescheduling promises replaced by existing session/material/account-setting descriptions. No KAN-160 work or permission change. | Full captures and DOM tests |
| Lookup plus rotates45°/changes tint .3s; grid 0fr↔1fr .4s ease | Native button with aria-expanded/controls, same plus/grid motion; collapsed panel inert/aria-hidden | Source lookup input has no search handler; existing real name/URL lookup, validation, loading/error/retry are preserved. Mobile lookup form wraps safely. | Transition frames, Enter/Space checks, legacy lookup regression |
| Scroll reveals | None present in the original Discovery JavaScript | None invented; no IntersectionObserver or generic scroll fades added | Original state/handler inventory, scoped CSS |
| Source only reduces PCListen CSS; placeholder timers still run | Production reduced motion stops all owned timers/paint scheduling; cards/lookup remain usable immediately | Required accessibility correction, including live OS preference changes and missing matchMedia fallback | Reduced/browser/lifecycle tests |
| Source clears interval/timeouts/resize listener; no background handling | Owned timeout/frames/media/visibility/paused animations disposed; hidden tab suspends remaining placeholder delay and active animations | Lifecycle extension. Hidden responses become accessible without replaying obsolete transitions; canceled animations are never revived. No source resize listener needed for CSS breakpoints. | Lifecycle tests, synthetic visibility fixture and navigation cleanup |

## Product and isolation evidence

No API/composable/search-route changes. `q`, `request_group`, direction/format/page handling, explicit submit, NFKC/3–240 validation, shuffle seed/page size, canonical `/s/:slug` fallback, query/history synchronization, metadata and analytics retain existing implementations. Prototype `topic` aliases, KW matching, hardcoded specialists, near slots, diary and automatic booking/response claims are not introduced.

[Source isolation](evidence/kan-157/v5/source-isolation.json) proves unchanged legacy scoped styles and business-handler section, plus byte-equivalent App/shared tokens/shared CSS/router/Home/For Clients/search-composable/API files relative to `d666a6c` (normalized line endings). Existing reactive v1↔v2 tests preserve draft/billing-independent search state, legacy lookup data and one canonical card link. V1 remains default.

## Validation actually run

PowerShell from the feature worktree:

```powershell
npm run test:run -- src/views/PublicTherapistsView.spec.ts src/components/PublicSpecialistCard.spec.ts src/styles/discoveryV2.spec.ts src/composables/useDiscoveryMotion.spec.ts src/composables/useSpecialistDiscovery.spec.ts src/lib/api.specialistDiscovery.spec.ts src/lib/specialistDiscoveryApi.spec.ts src/lib/specialistDiscoveryRotation.spec.ts src/router/index.spec.ts src/lib/uiVersion.spec.ts src/__tests__/app.spec.ts src/main.spec.ts --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck -- --force
npm run build
git diff --check
```

Focused suite: **249/249 PASS across 12 files**. Initial focused failures exposed outdated DOM selectors, paint-fixture synchronization and an explicit inert-attribute removal case; resolved before the final suite. Typecheck initially found one newly added test-only `exact` option unsupported by Testing Library; corrected, and the affected view recheck is **36/36 PASS**. Final typecheck: **9 identical baseline diagnostics, 0 new**, exit 2; baseline independently run in detached exact `d666a6c` worktree. Build **PASS, exit 0**, existing >500kB chunk advisory. Final targeted rechecks after the type correction and accessibility guards: **36 view tests, 14 motion tests and 6 CSS tests PASS**; build re-run with exit 0. Whitespace/link/inventory checks PASS.

The nine baseline locations remain specialistDiscoveryApi.spec.ts:22; AdminWorkQueueView.spec.ts:823; AdminWorkQueueView.vue:790/845/852; TherapistClientsView.spec.ts:1676/3909; TherapistClientsView.vue:6789 (two). Global typecheck is not claimed to pass. [Validation results](evidence/kan-157/v5/validation-results.json).

One final browser acceptance matrix followed the visual preflight; only targeted font/pixel reconciliation and stable full-page captures followed, not another broad implementation cycle. Candidate `http://127.0.0.1:5356`, exact-base v1 `http://127.0.0.1:5355`, existing `.env.test` via `vite --mode test`. Separate temporary Vite cache directories avoid linked node_modules optimizer races. No configuration/dependency change.

| Viewport | Claude/Vue visual and motion | Keyboard/reduced/no overflow | v1 parity |
| --- | --- | --- | --- |
| 375×677 | PASS | PASS | 0 changed pixels |
| 768×900 | PASS | PASS | 0 changed pixels |
| 1280×900 | PASS | PASS | 0 changed pixels |
| 1440×900 | PASS | PASS | 0 changed pixels |

The first 768px parity pair differed by 4,172 pixels. All element geometry/font/color metrics matched, and two additional settled captures after waiting for fonts were retained. Final [parity](evidence/kan-157/v5/v1-parity.json) is 0 at every width; [768px metrics](evidence/kan-157/v5/v1-768-metrics.json). No v1 source/style fix was made to obtain parity.

Browser checks execute non-submitting typing beyond 600ms; explicit Enter; 3/240 boundaries; category toggle; format keyboard selection; browser Back; direction/psychological-support mapping; canonical profile navigation; real request loading/error/retry/empty; legacy URL normalization; native lookup Enter/Space/inert; 2px focus; reduced motion/live preference changes; long-name DOM stress; hidden-tab timers/frames/animations; navigation cleanup. [Motion/computed transition results](evidence/kan-157/v5/motion-results.json), [acceptance results](evidence/kan-157/v5/acceptance-results.json).

Targeted final browser checks at 375 and 1440px additionally verify immediate visible focus during card entrance, zero timers after v2→v1 and resumed placeholder rotation after returning from a previously focused empty input. [Keyboard/motion guard evidence](evidence/kan-157/v5/keyboard-motion-guard.json). These lifecycle/accessibility refinements do not alter settled visual comparisons.

## Visual and motion artifacts

- Desktop comparison: [Claude](evidence/kan-157/v5/claude-1440-full.png), [Vue](evidence/kan-157/v5/vue-1440-full.png).
- Mobile comparison: [Claude](evidence/kan-157/v5/claude-375-full.png), [Vue](evidence/kan-157/v5/vue-375-full.png).
- Desktop motion: [Claude recording](evidence/kan-157/v5/claude-1440.webm), [Vue recording](evidence/kan-157/v5/vue-1440.webm).
- Mobile motion: [Claude recording](evidence/kan-157/v5/claude-375.webm), [Vue recording](evidence/kan-157/v5/vue-375.webm).

All four widths include `{claude|vue}-{width}-{hero|placeholder-exit|placeholder-enter|listening|card-reveal|results|hover|lookup-transition|empty|full}.png`, Vue error captures and reduced full-page captures. Full Vue comparison captures await settled card opacity. Unit tests verify exact boundaries; real-time recordings/screenshots do not claim frame-perfect wall-clock synchronization under system load.

The prototype executes only in isolated ephemeral reference contexts using its original support/React/font resources. A test-response-only adaptation loads unchanged brand-listen after React to avoid the original load-order race and exposes the component instance; source files, constants and handlers are untouched. No prototype runtime enters the Vue application.

All application API data is explicitly **synthetic fixtures**; initial fixture rows mirror source specimen composition solely to compare the UI. Runtime cards always read real supported API props. Auth requests use HTTP 401; error/retry and deferred loading are fixtures. No live backend eligibility/search/account/session/provider/availability acceptance is claimed. Background visibility uses synthetic `document.hidden`/`visibilitychange`, not OS throttling certification.

## Delivery boundary and exact scope

Existing Draft #56 only. Final SHA and terminal automatic GitHub CI are recorded in its delivery description/final response; no manual dispatch or rerun. No Ready transition, PR merge, deployment, rollout, Jira mutation or other PR branch edit. KAN-160 stays HOLD and backend #63 remains outside this task. No open STAGED_READY/DEFERRED frontend entries were observed in the release-debt register; no deployment inference is made.

Runtime/test scope:

```text
src/components/PublicSpecialistCard.spec.ts
src/components/PublicSpecialistCard.vue
src/composables/useDiscoveryMotion.spec.ts
src/composables/useDiscoveryMotion.ts
src/styles/discoveryV2.spec.ts
src/views/PublicTherapistsView.spec.ts
src/views/PublicTherapistsView.vue
```

Plus this report and the [exact artifact/file inventory](evidence/kan-157/v5/files.json). Incoming dev integration files are history, not new KAN-157 edits. Remaining differences are the explicit accessibility and current product-contract adaptations in the matrix; nearest-slot/semantic-matching/diary/backend gates are not silently cleared. Next action: visual acceptance of this Draft PR.
