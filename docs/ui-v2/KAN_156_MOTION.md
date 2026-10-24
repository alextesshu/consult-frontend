# KAN-156 — full Claude motion fidelity

Existing Draft PR #62, branch `feat/kan-156-for-clients`; reviewed starting HEAD `4bb2a24000a8cffcf49cdb0aa4ec810a5c0c4663`, unchanged dev base `d47bae52562f13a80cb5118bd68823b3bf1a5abf`.

Source: `claude-design-2026-10-23-7570f1ad`, original ZIP SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`. [Original page and state machine](snapshots/2026-10-23-7570f1ad/handoff/mockups/For-Clients.dc.html), [listening component](snapshots/2026-10-23-7570f1ad/handoff/mockups/brand-listen.js). No snapshot, shared token or approved SVG geometry is modified.

The user explicitly requires the approved motion as part of the visual identity. This supersedes the earlier static-only demo/FAQ/reveal implementation and its historical acceptance. Live backend claims remain unsupported; animated examples do not become live search results.

## Motion coverage matrix

| Original Claude behavior | Vue implementation | Fidelity / justified difference |
| --- | --- | --- |
| Five CQ examples, starting at anxiety; wrap after loss | `forClientsDemos.ts` contains all five exact queries and fifteen source-supplied illustrative card rows | Original names/roles/topics only. No dates, appointments, qualifications or professionals added; source slot/format claims omitted, neutral placeholders retained. |
| `type`: 42 + random × 40 ms per character | Lifecycle-owned single timeout, same random interval | Browser comparisons use random=0.5; deterministic unit tests cover endpoints and midpoint. |
| Final typing pause 250ms → listen 900ms → show | Same state/transition order | Demo string is an aria-hidden visual overlay; actual input remains empty. |
| Show hold 5200ms → hide 450ms → next index/type | Same hold/exit/wrap, index-keyed card DOM reused | No synthesized live API requests or debounce. |
| Caret: 1s steps(1), visible first half, hidden second half | Page-scoped caret keyframes | Removed entirely with reduced motion. |
| PCListen 32px, two rings, 1.8s, second ring delayed .9s | Approved fennec SVG plus page-owned ring spans | Source mask gap 156–198°, ring scale 1.04→1.9, opacity .55→0 and cubic-bezier(.2,.6,.3,1). Page-local motion accent preserves the exact source #2f8c86 for rings/caret; shared color tokens and symbol geometry remain unchanged. |
| Mark breath 3.2s ease-in-out, scale 1→1.035→1 | Same breath keyframes and duration | Approved symbol asset, no copied prototype runtime. |
| Listen opacity 1 in type/listen, .35 otherwise, .3s transition | Same opacity mapping/transition | Visible status explicitly says demo, without live matching claim. |
| Card reveal/exit: opacity .45s ease, transform .55s cubic-bezier(.2,.8,.2,1), y=14px | Same properties/curves; reveal delays 0/.12/.24s, exit delay zero | Hidden cards are also aria-hidden. No fake profile/booking controls. |
| Four rotating avatar tints and matching-topic highlight | Same (card index + demo index) modulo four and lower-case topic match | Readable tint ink tokens; initials retained in place of the prototype photo. |
| Card hover shadow .2s; chips transition .25s | Same source shadow geometry and chip color/border transitions | Static illustration cards gain no navigation/action. |
| Field border changes with type/focus | .3s border transition, typing/idle teal tokens | Navy focus border/visible 2px outline preserved for accessibility. |
| Manual chip pick resets type/count and stops auto cycle | Native pressed-state buttons select the demo, type/listen then hold indefinitely | Preserves user-entered text instead of silently clearing it as the source does. |
| Focus stops auto, finishes current demo and shows cards; blur does not restart | Same focus/blur state mapping | Input events also stop cycling; visual example never overwrites real input. |
| Enter/Find submits real text or current demo fallback | Existing `/specialists`: normalized validated user `q` wins; only an explicit submit with blank input sends current demo `q` plus verified `request_group` | Actual input stays unchanged. Source's unsupported `/find` and `topic` replaced by established routes/parameters. Accessible hint explains blank-field submission. Chip selection alone never navigates. |
| Steps reveal at IO threshold .2, once; opacity .6s, y .7s; delays .1/.22/.34s | Same threshold, properties, easing and stagger | Unobserve once seen; visible fallback if IO unavailable. |
| Cabinet perks reveal at IO .2; opacity .5s, y .6s; delays .3/.42/.54s | Same sequence | Existing safe perk copy retained; no reminder cadence/private-note promise added. |
| FAQ: one open, first open; rows 0fr↔1fr .35s; plus rotation .3s, background .2s | Same grid/rotation/background motion | Native button supports Enter/Space. Closed content becomes aria-hidden/inert immediately; visibility hides after closing animation. |
| `<640px` card slot moves below details | Existing responsive grid/availability row retained | Same motion/stagger on all widths. Shared approved header/footer unchanged. |
| Reduced-motion branch skips typed increments but original JS still loops CQ | Production explicitly stops all automatic loops/timers, shows static demo and all sections, disables caret/rings/breath/transitions | Required accessibility correction: original still cycles after hold/hide; not copied. Manual category changes remain immediate and static. OS preference changes are handled at runtime. |
| Original clears only its timeout/observer on unmount | Owned timeout/IO/media/visibility listeners cleaned on navigation, v1 change and unmount | No orphan timers. Missing matchMedia falls back to static reduced presentation. |
| No original background-tab handling | Pause remaining timeout and running owned WAAPI/CSS animations; resume remaining interval without catch-up | Required lifecycle extension. Canceled animations are not restarted; paused animations are canceled on disposal. |

## Validation and scope

Relevant PowerShell commands from this worktree:

```powershell
npm run test:run -- src/views/ForClientsView.spec.ts src/composables/useForClientsMotion.spec.ts src/styles/forClientsV2.spec.ts src/router/index.spec.ts src/__tests__/app.spec.ts src/lib/uiVersion.spec.ts src/main.spec.ts src/styles/uiV2.spec.ts src/composables/useSpecialistDiscovery.spec.ts --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck -- --force
npm run build
git diff --check
```

The composable tests cover exact phase boundaries and all five cycles, random typing cadence, all manual choices, focus/blur, hidden-tab pause in each phase, exact remaining-time resume, initial hidden mount, reduced preference and live changes, observer threshold/fallback, navigation/version/unmount cleanup, inactive v1, CSS animation pause/resume/cancel and canceled-transition safety. View tests cover explicit search handoff without implicit input mutation, preserving typed input through manual demo selection, CTA/FAQ/metadata and v1 fallback. CSS contracts preserve exact motion curves/durations, v2 selector isolation and reduced-motion overrides.

Local expanded matrix: **236/236 PASS across 9 files**; final affected-file recheck: **45/45 PASS**. Build **PASS**. Typecheck: **exactly 9 unchanged baseline diagnostics, 0 new**. UTF-8/credential-pattern/Markdown path checks and `git diff --check` PASS. Automatic CI status for the final commit is reported separately in Draft #62 after GitHub completes it. Existing nine TypeScript diagnostics are baseline debt; no unrelated fixes are included.

## Chromium comparison and evidence

Application preview: loopback `http://127.0.0.1:5296`; exact-base v1 comparison: `http://127.0.0.1:5295`. Application API calls use isolated HTTP 401 fixtures, not real backend acceptance. No application API, auth, booking, payment, permission, routing, registration or shared-shell contract is changed.

Original source prototype and Vue run in separate ephemeral Chromium contexts at **375×677, 768×900, 1280×900 and 1440×900**. Only the isolated source-reference context loads its original support runtime/React/font CDNs; none is imported into the application. An allowlist blocks unrelated hosts/API traffic. Source comparison adaptations are limited to exposing the original component instance for observation and loading unchanged `brand-listen.js` after React: the raw original otherwise throws **React is not defined** due to its load-order race. Original state machine, event handlers, constants, timings and motion remain unchanged.

Both run with deterministic random=0.5. Captures include typing, listening, sequential reveal, hold and hide, plus steps/perks reveals and intermediate FAQ expansion. Desktop recordings show the full five-demo progression. Screenshot sampling is real-time browser capture, not a claim that every frame/timer fires at identical wall-clock instants under system load. Exact timer boundaries are unit-tested separately. Raw prototype appointments/SLA/privacy text in reference evidence are not product claims.

| Width | Original prototype video | Vue video | Representative phase comparison |
| --- | --- | --- | --- |
| 375 | [Claude](evidence/kan-156/motion/claude-375.webm) | [Vue](evidence/kan-156/motion/vue-375.webm) | [Claude listening](evidence/kan-156/motion/claude-375-listening.png) / [Vue listening](evidence/kan-156/motion/vue-375-listening.png) |
| 768 | — | — | [Claude reveal](evidence/kan-156/motion/claude-768-reveal.png) / [Vue reveal](evidence/kan-156/motion/vue-768-reveal.png) |
| 1280 | — | — | [Claude reveal](evidence/kan-156/motion/claude-1280-reveal.png) / [Vue reveal](evidence/kan-156/motion/vue-1280-reveal.png) |
| 1440 | [Claude](evidence/kan-156/motion/claude-1440.webm) | [Vue](evidence/kan-156/motion/vue-1440.webm) | [Claude reveal](evidence/kan-156/motion/claude-1440-reveal.png) / [Vue reveal](evidence/kan-156/motion/vue-1440-reveal.png) |

[Motion states/computed transitions](evidence/kan-156/motion/motion-results.json), [reduced-motion/keyboard/input/lifecycle acceptance](evidence/kan-156/motion/acceptance-results.json), [v1 image parity](evidence/kan-156/motion/v1-parity.json). All phase images follow `{claude|vue}-{width}-{typing|listening|reveal|hold|hide|steps-reveal|faq-transition|perks-reveal}.png`. Reduced full-page captures follow `reduced-{width}.png`.

Reduced browser checks require zero component timers/animations, no automatic change beyond the 5.2s hold, immediate manual pick, keyboard FAQ/2px focus, inert collapsed content, live OS-preference changes and explicit v1 fallback. Visibility is a **browser-dispatched visibilitychange fixture with document.hidden overridden**, exercising real owned timers and WAAPI animations; it is not a claim of OS/browser-background throttling certification. SPA navigation verifies zero remaining motion timers. Full-page v1 screenshots are pixel-identical to exact dev base at all four widths.

## Remaining boundaries

No live search results, availability or real client workflow is certified by these fixtures. Explicit illustrative labels, safe privacy/crisis/support wording, neutral time labels, initials, source-equivalent token colors, and approved fennec chrome remain deliberate differences. Demo motion is not evidence of backend matching capability. No new dependency or global motion/brand change is introduced. KAN-160 stays HOLD and backend #63 remains outside this task; other Draft PRs are untouched. No Ready transition, merge, Jira mutation or deployment.


## Exact motion-increment inventory

84 files: 6 source/tests, 3 task documents, 75 phase images/videos/result artifacts. Previous evidence is preserved.

```text
docs/ui-v2/KAN_156_FOR_CLIENTS.md
docs/ui-v2/KAN_156_MOTION.md
docs/ui-v2/KAN_156_VISUAL_CORRECTION.md
docs/ui-v2/evidence/kan-156/motion/acceptance-results.json
docs/ui-v2/evidence/kan-156/motion/claude-1280-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-hide.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-hold.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-listening.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1280-typing.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-hide.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-hold.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-listening.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-1440-typing.png
docs/ui-v2/evidence/kan-156/motion/claude-1440.webm
docs/ui-v2/evidence/kan-156/motion/claude-375-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/claude-375-hide.png
docs/ui-v2/evidence/kan-156/motion/claude-375-hold.png
docs/ui-v2/evidence/kan-156/motion/claude-375-listening.png
docs/ui-v2/evidence/kan-156/motion/claude-375-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-375-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-375-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-375-typing.png
docs/ui-v2/evidence/kan-156/motion/claude-375.webm
docs/ui-v2/evidence/kan-156/motion/claude-768-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/claude-768-hide.png
docs/ui-v2/evidence/kan-156/motion/claude-768-hold.png
docs/ui-v2/evidence/kan-156/motion/claude-768-listening.png
docs/ui-v2/evidence/kan-156/motion/claude-768-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-768-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-768-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/claude-768-typing.png
docs/ui-v2/evidence/kan-156/motion/motion-results.json
docs/ui-v2/evidence/kan-156/motion/reduced-1280.png
docs/ui-v2/evidence/kan-156/motion/reduced-1440.png
docs/ui-v2/evidence/kan-156/motion/reduced-375.png
docs/ui-v2/evidence/kan-156/motion/reduced-768.png
docs/ui-v2/evidence/kan-156/motion/v1-parity.json
docs/ui-v2/evidence/kan-156/motion/vue-1280-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-hide.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-hold.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-listening.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1280-typing.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-hide.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-hold.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-listening.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-1440-typing.png
docs/ui-v2/evidence/kan-156/motion/vue-1440.webm
docs/ui-v2/evidence/kan-156/motion/vue-375-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/vue-375-hide.png
docs/ui-v2/evidence/kan-156/motion/vue-375-hold.png
docs/ui-v2/evidence/kan-156/motion/vue-375-listening.png
docs/ui-v2/evidence/kan-156/motion/vue-375-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-375-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-375-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-375-typing.png
docs/ui-v2/evidence/kan-156/motion/vue-375.webm
docs/ui-v2/evidence/kan-156/motion/vue-768-faq-transition.png
docs/ui-v2/evidence/kan-156/motion/vue-768-hide.png
docs/ui-v2/evidence/kan-156/motion/vue-768-hold.png
docs/ui-v2/evidence/kan-156/motion/vue-768-listening.png
docs/ui-v2/evidence/kan-156/motion/vue-768-perks-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-768-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-768-steps-reveal.png
docs/ui-v2/evidence/kan-156/motion/vue-768-typing.png
src/composables/useForClientsMotion.spec.ts
src/composables/useForClientsMotion.ts
src/lib/forClientsDemos.ts
src/styles/forClientsV2.spec.ts
src/views/ForClientsView.spec.ts
src/views/ForClientsView.vue
```
