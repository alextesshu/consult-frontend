# KAN-155 — Homepage v5 visual and motion acceptance

## Scope and provenance

Existing **Draft [PR #59](https://github.com/alextesshu/consult-frontend/pull/59)**, actual branch `feat/kan-155-homepage-v2-refresh`, target `dev`. Starting PR HEAD `2e15e011dc8a41ca1056d9a52daef14498ef9596`. Latest integration base fetched and merged without conflicts: `019501924cc3f17e23fdfb73450004be72fb7a28` (includes #60, #61 and #62). Integration commit: `bcb6d71` (`Merge dev into KAN-155 homepage branch`). The existing worktree `C:/Users/admin/dev/portfolio/consult/_kan155_homepage_v2` is retained as explicitly requested; local frontend `dev` is untouched.

Authoritative snapshot: **`claude-design-2026-10-23-7570f1ad`**, full original ZIP SHA-256 **`7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`**, independently checked against `design-sources/Модернізація дизайну сайту ProConsult (v5).zip`.

Canonical reference paths resolve exactly as supplied: [Home.dc.html](snapshots/2026-10-23-7570f1ad/handoff/mockups/Home.dc.html), [brand-listen.js](snapshots/2026-10-23-7570f1ad/handoff/mockups/brand-listen.js), [v5 matrix](IMPLEMENTATION_MATRIX_V5.md), [v5 sync](DESIGN_SYNC_2026-10-23_V5.md), [design system](../DESIGN_SYSTEM.md). Home is DESIGN READY. Historical matrix rows predate merged #61/#62; current Git and task evidence take precedence. KAN-156 supplies lifecycle patterns, without edits to its implementation.

This report supersedes the older static-only KAN-155 report and its deferred autoplay/For Clients statements. The [previous implementation/report](https://github.com/alextesshu/consult-frontend/tree/2e15e011dc8a41ca1056d9a52daef14498ef9596) remains in Git history.

## Visual and motion fidelity matrix

| Original Claude behavior | Vue implementation | Fidelity / deliberate deviation | Evidence |
| --- | --- | --- | --- |
| Centered hero, 900px max, source type/spacing, 112px mark (88 below 640px) | Page-local Home styles reproduce the source composition, clamp sizes, leading and spacing | Explicit task requests literal v5 page fidelity; shared tokens unchanged. Readable ink/muted colors replace insufficient source soft text. Existing truthful tariff meta remains below CTAs. | Hero frames at four widths; CSS contracts |
| PCListen symbol, 3 rings, duration 3.2s, delays 0/1.0667/2.1333s | Three page-owned ring spans and existing approved fennec SVG | Original ring geometry/mask gap 156–198°, scale 1.04→1.9, opacity .55→0, 1.5px peach border and cubic-bezier(.2,.6,.3,1). Approved SVG geometry untouched. | Hero recordings, CSS contracts |
| Mark breathing: scale 1→1.035→1, 3.2s ease-in-out | Same page-owned breathing keyframes | Exact motion; no imported prototype runtime | Hero recordings |
| Automatic i=0→1→2→3→0 every 3400ms | Independent `useHomeMotion` timeout with 3400ms step cadence | Exact boundaries/wrap; background suspension described below | 19 lifecycle tests, four-step videos |
| `autoplay`, `stepSeconds`, `reveal` in `data-props` | Defaults implemented (true / 3.4s / true) | These are prototype editor controls, absent from its rendered page; no developer controls shipped. An accessible pause/resume button is added for moving content. | Source JS review; view/browser acceptance |
| Manual node pick sets i and permanently pauses | Native pressed-state buttons select and stop cycling | Exact manual behavior. Added explicit resume starts a full new 3400ms period. Hidden copy is inert/aria-hidden; autoplay does not announce every change. | Unit tests, keyboard and browser hold checks |
| Track width i/3 × 75%; dot scale 1.12; completed dots filled | Nested track spans cover 75% of rail with inner i/3 progress | Same geometry and 1s cubic-bezier(.4,0,.2,1); dot all .5s ease, label color .5s | Four phase captures and computed styles |
| Four copy blocks crossfade, y=10px→0, .5s ease | Persistent overlapping grid copies transition opacity/transform .5s | Grid reserves tallest copy instead of original first-copy-only height; prevents interaction layout shifts. Delayed visibility retains outgoing fade, inaccessible copies inert. | Four-step screenshots and view tests |
| Profile enters/exits at y ±14px, .6s cubic-bezier(.2,.7,.2,1) | Persistent illustrated profile with exact source portrait/topics/card anatomy | Source portrait/name explicitly marked example. No fictional price, real profile link or actionable demo booking. | Step 0 frames; portrait byte copy |
| Request visible for steps 1/2; collapses details at step 2; status tint changes | Persistent request, grid rows 1fr→0fr .6s ease, status .6s, bars .9s ease | Source sample query retained. Neutral client label and clearly illustrative agreed-time state replace fabricated real identity/confirmed booking. Collapsed details aria-hidden. | Steps 1/2 intermediate and settled frames |
| Request progress 60/0/0→100/100/100 | Same fills and native text labels | Exact progress; non-actionable example | Step 1/2 screenshots |
| Session panel enters with y=16px, .8s cubic-bezier(.2,.7,.2,1) | Same separate navy bottom panel | Replaces fixed appointment date and automatic-link-sent claim with agreed-time example/arrangement copy | Step 2 frames |
| Work panel y ±14px, .6s; three separate rows | Same stacked illustration | Private notes, explicitly published materials and manually recorded payment stay distinct. No real payment/session data. | Step 3 frames |
| Band/value/blog reveal once; IO threshold .15; y=24px; opacity/transform .8s ease | Exactly these three sections have independent seen state and observer | No invented child stagger: source has none. Unobserve seen targets; visible fallback without IO or reduced motion. | Reveal frames and lifecycle tests |
| Six-card bento, spans 2/1/1 then 1/2/1; hover y=-4px/.35s | Source anatomy, portrait mini-profile, three-row calendar, exact hover curve/shadow | Example schedule visibly labelled. Safe notes/payment copy is longer. Below 1100px use two columns, below 640px one: raw source fixed four-column bento overflows on small screens. | Four-width full captures, no-overflow browser checks |
| Calendar highlight k=i%3; background .6s | Same step-synchronized row highlight | Source illustrative times/names retained under visible example label; no availability claim | Motion recording and phase styles |
| Blog three article-format rows; x=6px, border-color .3s | Source sample titles, clearly marked examples, no fabricated live article links | Same hierarchy and hover; no claimed live publications | Blog/full captures |
| Compact mint client section → For Clients | Existing `/for-clients`, approved shared header/footer remain intact | CTA analytics remain one-shot without extra event fields. Hero discovery CTA remains `/specialists`; no invented example-profile destination. | View tests; real router with HTTP 401 fixtures |
| Monthly/yearly controls, .25s, 990/9900 | Shared existing billing state and pricing data | Start 0, 3→6 clients; Pro 990/month or 9900/year, 20→26; trial and custom limits unchanged. Existing detailed commission/trial/custom/limits explanations remain after cards; this is longer than prototype. | Pricing/view tests and browser cycle switch |
| Source button hover .2s, responsive navigation | Home button transitions .2s; approved shared responsive shell reused | Shell geometry/wordmark retained, no shared shell edits | App/router suites; browser screenshots |
| Prototype reduced CSS disables animations, JS interval still advances | Production disables autoplay/timers and shows all revealed sections | Required accessibility correction; immediate keyboard/manual selection still available, runtime OS preference supported | Unit tests, four-width reduced browser acceptance |
| Prototype has no hidden-tab suspension | Pause remaining step time and running owned animations; resume without catch-up | Required lifecycle extension; canceled animations are not restarted | Exact remaining-time tests; synthetic visibility browser fixture |
| Prototype interval/IO cleanup only | Owned timeout/IO/media/visibility/paused-animation cleanup on unmount/version exit | No new dependency, backend API, global motion setting or unrelated animation change | Lifecycle tests, source isolation |

## Validation actually executed

PowerShell, feature worktree:

```powershell
npm run test:run -- src/composables/useHomeMotion.spec.ts src/views/HomeView.spec.ts src/styles/homeV2.spec.ts src/router/index.spec.ts src/__tests__/app.spec.ts src/lib/uiVersion.spec.ts src/main.spec.ts src/styles/uiV2.spec.ts src/views/ForClientsView.spec.ts src/composables/useForClientsMotion.spec.ts --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run test:run -- src/composables/useHomeMotion.spec.ts src/views/HomeView.spec.ts src/styles/homeV2.spec.ts --maxWorkers=1 --minWorkers=1
npm run typecheck -- --force
npm run build
git diff --check
```

- Expanded focused suite: **251/251 PASS**, 10 files. Final affected-file recheck after visual refinements: **43/43 PASS**, 3 files.
- Build: **PASS, process exit 0**; known >500kB chunk advisory remains. An initial PowerShell stderr wrapper produced shell status 1 despite Vite completing; the final invocation explicitly records native exit 0.
- Typecheck: **9 unchanged baseline diagnostics, 0 new**, exit 2. Exact `0195019` baseline was independently run in detached temporary worktree and compared; global typecheck does not pass. Diagnostic locations: specialistDiscoveryApi.spec.ts:22; AdminWorkQueueView.spec.ts:823; AdminWorkQueueView.vue:790/845/852; TherapistClientsView.spec.ts:1676/3909; TherapistClientsView.vue:6789 (two).
- `git diff --check`: PASS after removing an extra EOF blank line.
- Source isolation: legacy v1 template, whole scoped stylesheet and business-handler section identical to `0195019`. Shared App/router/For Clients code matches current dev exactly.

[Machine-readable validation](evidence/kan-155/v5/validation-results.json), [source isolation](evidence/kan-155/v5/source-isolation.json), [exact file inventory](evidence/kan-155/v5/files.json).

## Chromium acceptance and artifacts

Loopback preview uses existing `.env.test` via `vite --mode test`. Candidate `http://127.0.0.1:5314`; baseline `http://127.0.0.1:5315`, exact `0195019`. Separate temporary Vite cache directories prevent shared-node_modules optimizer races. No configuration changes are committed. Preview API calls are **HTTP 401 fixtures**, not live backend acceptance. Original reference runs in isolated ephemeral Chromium contexts; only reference contexts execute original support/React/font resources. The source load-order race is corrected solely in the test response by loading unchanged `brand-listen.js` after React and exposing the component instance. Source handlers, state, durations and design files stay unchanged. Source images and fonts are awaited before final captures.

| Width | Visual/motion/overflow | Keyboard/reduced/pricing/client navigation | v1 full-page parity |
| --- | --- | --- | --- |
| 375×677 | PASS | PASS | 0 changed pixels |
| 768×900 | PASS | PASS | 0 changed pixels |
| 1280×900 | PASS | PASS | 0 changed pixels |
| 1440×900 | PASS | PASS | 0 changed pixels |

[Motion results](evidence/kan-155/v5/motion-results.json), [acceptance results](evidence/kan-155/v5/acceptance-results.json), [pixel parity](evidence/kan-155/v5/v1-parity.json).

- Desktop: [Vue full page](evidence/kan-155/v5/vue-1440-full.png), [Claude full page](evidence/kan-155/v5/claude-1440-comparison-full.png), [Vue hero](evidence/kan-155/v5/vue-1440-hero.png), [Claude hero](evidence/kan-155/v5/claude-1440-hero.png).
- Mobile: [Vue full page](evidence/kan-155/v5/vue-375-full.png), [Claude full page](evidence/kan-155/v5/claude-375-comparison-full.png), [Vue profile phase](evidence/kan-155/v5/vue-375-step0.png).
- Desktop animation: [Vue recording](evidence/kan-155/v5/vue-1440.webm), [Claude recording](evidence/kan-155/v5/claude-1440.webm).
- Mobile animation: [Vue recording](evidence/kan-155/v5/vue-375.webm), [Claude recording](evidence/kan-155/v5/claude-375.webm).

Every width has `{claude|vue}-{width}-step{0..3}{-transition}.png`, hero/band/value/blog frames and full comparison captures. Final Vue full-page captures use reduced motion; normal-motion recordings show actual sequential transitions. Timing boundaries are unit-tested, not inferred from exact screenshot wall-clock timing under browser load. Source full-page mobile evidence retains the raw prototype overflow; the production adaptation is documented above.

A later 375px parity capture briefly differed by 4,551 pixels. It was investigated: all 312 legacy element geometry/type/color metrics match and two further settled captures were taken after awaiting fonts again following scroll. Final parity is 0 changed pixels; [repeat metric evidence](evidence/kan-155/v5/v1-375-metrics.json) and both repeat screenshots are retained. No v1 source change was made.

Final mobile-frame inspection found the last work row clipped at 375px. The mobile work layer now removes redundant inset padding and uses compact wrapped rows. [All 16 active-state bounds checks](evidence/kan-155/v5/illustration-fit.json) pass (four steps at four widths), also asserted during normal-motion capture; refreshed mobile step-3 evidence shows every row. The final CSS-only follow-up re-ran the 43 affected tests and production build successfully.

Browser acceptance additionally executes mobile-menu Enter/Escape and shared header navigation at all four widths ([navigation evidence](evidence/kan-155/v5/navigation-results.json)), manual hold beyond one cycle, explicit resume, zero running animations/timers while hidden, Tab/Enter/Space with 2px visible focus, no reduced autoplay after 3.5s, live preference changes and navigation cleanup. Visibility is a **synthetic `document.hidden`/`visibilitychange` fixture**, not real OS throttling certification. Browser fixtures do not validate live backend workflows, authentication, session creation, payment/provider delivery or availability.

## Delivery boundary

Existing Draft #59 only. Final commit/automatic CI run are recorded in the PR delivery description and final response; no manual CI rerun. No Ready transition, PR merge, deployment, rollout or Jira mutation. V1 stays default, KAN-160 stays HOLD, backend #63 and other PR branches are untouched. No open STAGED_READY/DEFERRED frontend entries were observed in the canonical release-debt register; no new runtime/deployment verification is implied.

Exact runtime/test files relative to dev:

```text
src/assets/home-v2/mark-band.png
src/assets/home-v2/mark-navy.png
src/assets/home-v2/maria-koval.webp
src/composables/useHomeMotion.spec.ts
src/composables/useHomeMotion.ts
src/styles/homeV2.spec.ts
src/views/HomeView.spec.ts
src/views/HomeView.vue
```

Task documentation: this report and the explicitly enumerated `evidence/kan-155/v5/` files. The two PNG decorations were already part of original #59; incoming #60/#61/#62 files are integration history, not new task edits.
