# KAN-158 Phase 2 / PR C — responsive profile and external contacts

## Contact-card follow-up

The initial evidence below describes `11d12cce` validation. The subsequent
[long-contact regression report](contact-layout/README.md) records the row-layout
fix, full-contact geometry tests, updated validation and preservation of prior
acceptance. Existing screenshots/JSON below are retained as historical evidence.

Base: `origin/dev` `c1a77a393639865d039a4875aec5ee83ea320a51`, including PR A/B/D.
Branch: `feat/kan-158-responsive-contacts`; isolated `_kan158_phase2_responsive`.

## Design provenance and scope

User-approved **v6.9.1-candidate**, supplied archive:
`design-sources/Модернізація дизайну сайту ProConsult (v6.9.1).zip` outside Git.
SHA-256: `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`.
ZIP CRC PASS; entry paths and symlinks checked before extracting only reference
text into a temporary directory. No bundled runtime code or dependencies executed.

Read original `CHANGELOG.md`, `IMPLEMENTATION_SPEC.md`, `PRODUCT_DECISIONS.md`,
and the bundled profile template/JavaScript as data. Relevant source is
`proconsult-kan158-phase2-v6.9.1-candidate/Specialist-Profile-Phase2-v6.9.1.html`:
SHA-256 `25c2b8021bd66702a25263a275e419ca9e98ce4469f718c9e074d09b69342cae`.
Specification hash: `39c41ae3dbee5279e96f780dd8793b5df2b4dd99335a40ff34c03474e0b12cf3`.

This is a scoped approved implementation reference, **not promotion of the active
snapshot**. Canonical snapshot remains `claude-design-2026-10-23-4ff7cedd`, archive
SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.
No source index, immutable snapshot, manifest or canonical pointer changed.

## Implementation and fidelity

| Width | Booking presentation | Hero / contacts |
| --- | --- | --- |
| <768 | Native request dialog and bottom action bar | 88x110 photo beside introduction; full-width information below; contacts in page flow before final CTA |
| 768–799 | Inline full-width panel, no bottom bar | 180x225 photo beside introduction; 40px source title; contacts below panel |
| 800–1099 | Inline full-width panel, no bottom bar | 200x250 photo; contacts below panel |
| >=1100 | 400px booking rail with independent panel scroll | Separate tinted contacts card outside panel; 56px source title with long-word fitting |

The existing 860px `compactProfile` contract remains for FAQ/native share. A
separate local 767px query controls only booking Teleports, request-sheet guards,
panel focus/scroll behavior and the bottom bar. Both query listeners are released.
This distinction is needed to expose the approved tablet panel inline without
silently changing all consumers of `compactProfile`.

Desktop grid reserves a separate auto row for contacts and lets the panel shrink
with `min-height:0`/`height:auto`, keeping its own overflow. Contacts never enter
the panel's scroll container or the contact-step hidden selectors. At viewport
heights <=700px the rail becomes static and document scrolling reaches contacts;
the panel retains its independent viewport-bounded scroll. This is an explicit
usability fallback to avoid a tall sticky rail trapping its final card offscreen.

The title fitter reads the local CSS source size; CSS alone previously could not
override its inline size. Its complete-word fitting and v1 behavior are retained.
The extra booking wrapper is `display:contents` in v1 and has no v1 visual box.

No booking/API/payload, offer selection/filtering, request_only visibility,
slot-to-form sequence, #75 helper, profile-summary editor or contact data/actions
changed. Existing motion, reduced-motion, native dialogs and body-padding cleanup
remain; no new timers or artificial delays are used.

### Retained design differences / boundaries

- The prototype's intermediate Continue step is not introduced: selecting a slot
  opens the existing form directly, as required by the approved contract.
- Real calendar/filter controls remain; their full tablet panel may continue
  below the first viewport rather than hiding controls to copy a static mockup.
- Approved global fennec chrome and existing backend-driven profile content remain.
  This PR does not re-author unrelated design fields or the summary editor.

## Files

- `src/views/PublicProfileView.vue`
- `src/views/PublicProfileView.spec.ts`
- `src/styles/publicProfileV2.css`
- `src/styles/publicProfileV2.spec.ts`
- `src/components/public-profile/PublicProfileHeroSection.vue`
- `src/components/public-profile/PublicProfileHeroSection.spec.ts`
- This evidence directory: README, [browser harness](browser.cjs),
  [results](browser.json), `screenshots/`.

## Browser acceptance

Chromium, UI v2: **30 width/mode combinations** at
375/390/767/768/820/859/860/1099/1100/1280 and direct-with-slots,
direct-without-slots, request_only. Assertions include:

- No document overflow; one contacts card, outside panel scroll.
- Actual contact visibility checked with bounding rectangles AND hit-testing,
  including the desktop form state; copy action retains the synthetic value.
- Phone card precedes final CTA; footer text is clear of the fixed bottom bar.
- Panel/sheet, About and Share Esc; focus return; phone backdrop close, Tab wrap,
  repeated open/close; phone -> tablet -> phone reparenting while preserving input,
  no stale dialog/scroll lock.
- Exactly one intercepted request per explicit synthetic submission; selected
  `offer_type=intro`, slot ID 100 only in the slot path; request_only GETs no slots.
- Additional 1280x600 desktop checks ensure contacts can be reached by document scroll.

All **30 responsive + 30 interaction cases PASS**, plus **3 short-desktop PASS**.
No document overflow or page errors. All 30 cards pass actual visibility checks;
minimum measured footer-text clearance above the phone bar is **84.98 CSS px**.

UI v1 parity: **30 candidate/baseline pairs, 0 changed pixels**, all modes and all requested widths.
Baseline is the same `c1a77a3` in an owned temporary detached worktree. Raw pair
images are kept outside Git in `%TEMP%/prc-parity-c1a77a3`; results are in JSON.
The 36 screenshots in this folder cover initial geometry, phone footer, open form and
short desktop. They contain only synthetic data.

Every API call is intercepted. POST returns an explicitly synthetic pending
request, not a confirmed booking. No real specialist, Django database, external
notification or production/staging endpoint is contacted. Nonlocal requests are
blocked. This is fixture acceptance, **not real-backend E2E**.

Clock starts at a fixed date and advances. A completely frozen Date.now interferes
with Vue's timestamp guard for bubbling events, so `clock.install` is used rather
than `setFixedTime`; keyboard checks use actual Chromium input.

## Validation commands

```powershell
node node_modules/vitest/vitest.mjs run src/views/PublicProfileView.spec.ts src/styles/publicProfileV2.spec.ts src/components/public-profile/PublicProfileHeroSection.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
node node_modules/vue-tsc/bin/vue-tsc.js -b --force
node docs/ui-v2/evidence/kan-158/phase2-pr-c/browser.cjs
git diff --check
```

Harness expects candidate localhost:5470, baseline localhost:5471, both configured
with intercepted `VITE_API_BASE_URL=http://localhost:8470/api`.

Final local checks:

- Focused: **183 PASS** (169 profile + 7 CSS + 7 hero).
- Full: **130 files / 2024 PASS**, 151.22 seconds.
- Production build: **PASS**, 10.79 seconds, existing chunk warning only.
- Typecheck: **9 baseline diagnostics, 0 new**; complete output identical to an
  untouched base run. Both exit 2; this is not a clean typecheck PASS.
- `git diff --check`: **PASS**.
- Editor, contact component and active snapshot pointer: byte-identical to base.

Automatic CI is recorded separately in the delivery report.

No Ready, merge, deployment, Jira changes or modifications to other agents' worktrees.
