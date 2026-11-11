# KAN-158 slot accessibility remediation

Base: `b22e67f8d5d24e753aaf1e5ba81fed13e2caa124`. No deployment.

Design unchanged: canonical v6.6 `claude-design-2026-10-23-4ff7cedd`
(`4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`),
scoped v6.9.1 overlay `claude-design-2026-10-26-1dbb9008`
(`1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`).

## Changes and regression evidence

- A: an action-only aria-label replaced the visible time in the accessible name.
  UI v2 now prefixes the same formatted local time used by the visible label,
  once, before the existing action/status text. UI v1 retains its existing name.
- B: the background transitioned while the foreground changed immediately,
  producing approximately 1:1 contrast during entry. Restricting transition
  properties to transform, border-color and box-shadow changes both text and
  background atomically. Focus outline and existing interaction states remain.
- Baseline regression run: two failing assertions and one passing V1 control.
  Focused Vitest: 189/189; full Vitest: 2038/2038 across 131 files. Production
  build passes with the existing chunk-size warning. Typecheck has the same
  nine diagnostics as the exact base, zero new diagnostics.

## Browser acceptance

Windows 11 Pro x64, headless Chromium 145.0.7632.6 and native Firefox 158.0
through Playwright 1.58.2 WebDriver BiDi. Viewports: 375x667, 390x844, 1280x900.
All API responses in `browser.cjs` are isolated fixtures; all mutations are
intercepted. This is not real-backend booking acceptance.

Frame samples cover hover entry and keyboard focus, including normal and
reduced motion. Baseline transient minimum is 1:1; corrected minimum is about
12.62:1. Default and disabled presentation are also recorded (disabled is a
temporary DOM presentation probe, not an additional availability state).
Chromium additionally covers touch emulation on both mobile widths. Firefox
reduced motion uses a temporary browser-profile preference, verified with
matchMedia; no Firefox touch-emulation claim is made.

- [Chromium samples and assertions](chromium/results.json)
- [Firefox samples and assertions](firefox/results.json)
- [UI v1 pixel parity: zero changed pixels, both engines and all widths](v1-parity.json)
- [Before: prior read-only staging capture of transient contrast](baseline-transition-375.png)
- [After: Chromium mobile](chromium/candidate-normal-375.png)
- [After: Firefox mobile](firefox/candidate-normal-375.png)
- [After: Chromium desktop](chromium/candidate-normal-1280.png)
- [After: Firefox desktop](firefox/candidate-normal-1280.png)

Empty availability contains no selectable slots. Request-only performs no slot
GET. Existing form opening remains functional without submitting a request.
Reproduce with both owned baseline and candidate preview servers, then run
`node docs/ui-v2/evidence/kan-158/slot-accessibility/browser.cjs chromium`
and the same command with `firefox`. Ports/module path can be overridden by
the environment variables documented in the script.

## Firefox Enter investigation: TOOLING SUSPECTED

Isolated Enter activates the native consultation button. After the full
video/focus sequence, activeElement is the correct visible, enabled button,
but document.hasFocus() is false and native Enter does not synthesize a click.
The same failure occurs in an independent native dialog/video/button page
without Vue or any Pro Consult code: isolated one click versus full-sequence
zero clicks. A plain diagnostic button on the application page fails too.

- [Application focus/event diagnostic](firefox-site-focus-diagnostic.json)
- [Independent native control results](firefox-native-control.json)
- [Independent control reproducer](firefox-native-control.cjs)

This does not establish a frontend defect. No speculative keyboard handler was
added. Headed Firefox with a real keyboard remains a manual gate. Native
Firefox/headless/BiDi focus behavior cannot establish real-user acceptance.
DOM roles/names and browser keyboard checks are not screen-reader testing;
actual assistive technology and Safari acceptance remain separate manual gates.

No API, backend, booking policy, design snapshot, Jira or environment changes.
