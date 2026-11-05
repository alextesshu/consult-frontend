# KAN-158 video dialog accessibility remediation

Base: `535940ffeedb108038992e93cd2cb27c0aa916be` (dev, 2026-10-26).

The prior final UX audit reproduced a pre-existing P2: the video used a plain
`div`, without modal semantics, initial focus, keyboard containment, Escape,
focus return or keyboard background isolation. A new view regression test failed
on that baseline because no labelled dialog existed.

## Scope and implementation

UI v2 reuses `PublicProfileOverlay` and its native `showModal()` lifecycle through
an isolated `video` variant. The existing video content, URL, controls, autoplay,
preload and appearance remain. UI v1 keeps its original markup and styles.
About, Share and Request continue using their existing branches.

- The native modal supplies an accessible name and makes the background inert.
- Initial focus goes to Close, with explicit capture of the originating trigger.
- Focus boundaries wrap both Tab directions without overriding browser-owned
  video shadow controls. A light-DOM key trap would skip those controls; native
  containment alone left document.activeElement outside the dialog at the boundary.
- Cancel/Escape, Close and the existing backdrop close the dialog. Closing also
  unmounts the video so playback does not continue invisibly.
- Video locks the document scroller, preserving body overflow and the page's
  scroll position. Locking both full-height body and html had collapsed the
  document's scroll range; this is avoided specifically for the video variant.
- Closing/unmount restores prior overflow and scroll position. Focus returns to
  the trigger if connected, otherwise to the adjacent Share action if connected.
  Route unmount safely skips detached return targets. Removing the video URL
  clears the open state, preventing an automatic reopen when video returns.
- Native shell padding and backdrop were checked against baseline geometry;
  the existing visual card is unchanged.

No booking, API, dependencies, backend, shared tokens or design snapshots change.
Current registered design remains `claude-design-2026-10-23-4ff7cedd`, SHA-256
`4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.
Approved appearance reference: Claude v6.9.1, SHA-256
`1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`.
This task does not activate that candidate snapshot.

## Browser regression

[Executable harness](browser.cjs), [synthetic VP8 media](audit-video.webm),
[machine-readable results](results.json), [before/after screenshots](screenshots/).

Chromium: **375, 390, 768, 820, 1100, 1280 px**, all at height 900.
The phone runs use reduced motion; tablet/desktop interaction runs use normal
motion. The advancing test clock avoids frozen Vue event timestamps.

At every width the harness checks:

- labelled native `:modal`, initial focus and valid decoded media;
- 12 Tab and 12 Shift+Tab presses, with every focus remaining inside the modal;
- PageDown/Space on the video, wheel on the backdrop, unchanged document scroll;
- Escape, Close, backdrop, reopening, focus restoration;
- reopening at a nonzero document scroll position without a jump;
- removal of the originating trigger and fallback focus;
- actual route unmount, restored overflow and no residual native modal;
- identical video-card geometry against dev;
- no page errors and no business POSTs.

All API traffic is intercepted. Anonymous refresh-token POSTs receive synthetic
401 responses; no request reaches Django or any specialist. The local media was
generated with canvas/MediaRecorder without camera or microphone access.

UI v1 comparison: six page pairs without masking and six open-video pairs with
only the native media element masked, **0 changed pixels**. The mask excludes
the timing-dependent browser loading spinner, not modal geometry or controls
outside the video. Playback attributes are separately asserted in Vitest.

### Reproduce (Windows PowerShell)

Use two separately owned preview servers, one on the feature worktree and one
on the exact baseline; leave the user's port 5173 alone. In each worktree:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:8470/api'
node node_modules/vite/bin/vite.js --host localhost --port 5510 --strictPort
# Baseline worktree: use 5511 instead.
```

From the feature worktree, using an already available Playwright installation
and Python/Pillow (no project dependency installation required):

```powershell
$env:PLAYWRIGHT_MODULE = '<absolute path to existing playwright-core>'
$env:VIDEO_PORT = '5510'
$env:VIDEO_BASELINE_PORT = '5511'
$env:VIDEO_EVIDENCE = Join-Path $env:TEMP 'kan158-video-browser'
node docs/ui-v2/evidence/kan-158/video-dialog/browser.cjs
```

The script exits nonzero on any assertion failure and writes results outside
the repository. Port 8470 is an intercepted fixture origin, not a real backend.

## Validation

Focused: **179 tests / 2 files PASS**. Full Vitest: **2030 tests / 131 files PASS**.
Production build: **PASS**, existing chunk-size warning only. Typecheck exits 2
on both exact dev baseline and candidate: **9 identical diagnostics, 0 new**.
`git diff --check`: **PASS**. Chromium and UI v1 parity: **PASS** as above.

Commands:

```powershell
node node_modules/vitest/vitest.mjs run src/components/public-profile/PublicProfileOverlay.spec.ts src/views/PublicProfileView.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
node node_modules/vue-tsc/bin/vue-tsc.js -b --force
git diff --check
```

Typecheck is compared against the exact dev baseline, including its existing
diagnostics; an exit code 2 is not reported as a clean typecheck.

## Limits

Chromium keyboard and DOM semantics were tested; manual screen-reader output,
Safari and Firefox are not certified by these checks. UI v1 intentionally retains
its pre-existing video accessibility behavior. No real-backend integration or
production/staging acceptance is claimed. No deployment, merge or Jira changes.
