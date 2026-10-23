# KAN-156 — For Clients landing

> Current motion acceptance supersedes static-only demo/reveal/FAQ decisions below. See [full Claude motion implementation and coverage matrix](KAN_156_MOTION.md). Earlier captures/results remain historical evidence.
## Provenance and boundaries

- Base: `d47bae52562f13a80cb5118bd68823b3bf1a5abf` (merged #60/#61).
- Snapshot: `claude-design-2026-10-23-7570f1ad`.
- Original ZIP SHA-256, independently verified: `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`.
- [Approved HTML](snapshots/2026-10-23-7570f1ad/handoff/mockups/For-Clients.dc.html), [TZ](snapshots/2026-10-23-7570f1ad/handoff/TZ_CODEX.md), [design system](../DESIGN_SYSTEM.md), [contract gates](DESIGN_SYNC_2026-10-23_V5.md).
- Independent feature branch `feat/kan-156-for-clients`. Existing #54–#57/#59 and backend #63 heads/states preserved; KAN-160 stays HOLD. No backend, registration, HomeView, discovery implementation, global tokens, brand asset, authentication or permission change.
- The release-debt register has no open STAGED_READY/DEFERRED records. This task does not establish staging or production acceptance.

## Current visual correction

The initial explanatory-card substitution was not approved and is superseded by the [visual-fidelity correction](KAN_156_VISUAL_CORRECTION.md). Current screenshots and validation are linked there; initial captures below remain historical evidence.

## Implementation

Dedicated public `/for-clients` route, neutral public surface, shared approved fennec header/footer. V2 header desktop/mobile audience links reach this page; selected state follows the route. On this page only, the guest header CTA reaches client signup and the desktop specialist-pricing action is omitted. Existing public shell breakpoints/brand geometry and all authenticated/minimal-shell conditions are retained.

The page uses the mint split hero, search field/topic chips, three static specialist-preview cards, three-step request journey, six-question inline FAQ, emergency disclaimer and navy optional-client-cabinet banner. It reuses established `.pc2-*` classes and tokens. Page selectors, including media branches, are gated by `html[data-ui="v2"]` and page class. Native buttons expose expanded/controls state; closed answers use `hidden`. No prototype JavaScript, timed demo, hidden reveal observer or new dependency is shipped.

Without an effective v2 selection, `/for-clients` redirects with replace to the existing `/#client-entry-title`, retaining query parameters. Default remains v1. Explicit `?ui=v1` overrides persisted v2. Existing query/storage/environment precedence is unchanged. Switching away from v2 hides this page and restores the existing entry. Existing aliases and discovery routes remain intact.

## Deliberate contract/accessibility differences from the prototype

| Reference | Implemented boundary / reason |
| --- | --- |
| Fake specialist names, qualifications, photos and dated nearest slots | Three non-interactive specialist-preview cards retain the first example set from Claude with explicit illustration/non-live disclosure. Names/descriptions are prototype examples, not real profiles; initials replace the photo, and time uses neutral placeholders. Real-profile fetching remains separate. |
| Animated typing/listening/results simulation | Static labelled search; no false indication of semantic matching or live backend activity. Content is visible immediately and reduced motion needs no timer override. |
| `/find?q=...&topic=...` | Existing `/specialists?q=...`; NFKC/trim and existing 3–240 character validation. Empty submit opens the catalogue. Chips link to the verified existing request_group codes (emotional_state, work_career_burnout, relationships_family, self_esteem_change, loss_life_changes), labelled as categories rather than inferred semantics. No new endpoint, debounce or search behavior. |
| Universal guest contact, instant/nearest-time implications | Guest request availability is conditional on the specialist's public flow; requests require review and time agreement, not automatic session confirmation. No registration required to browse or use supported guest entry. |
| Only the specialist sees the request | Non-public request with limited authorized support/security/legal access under privacy policy. No guarantee against every form of lawful access or disclosure. |
| Reply within a day / monitored support | No response SLA. Technical support links to the current support page; mailbox operation is not claimed. |
| Prototype crisis numbers/hours | Neutral local-emergency-service guidance and explicit warning not to wait for this site. Official number/scope/hours verification is an unresolved content gate; no unverified numbers published. |
| Fixed reminder cadence / specialist notes | Cabinet benefits use actual session information, specialist contact and explicitly published materials; no private-note sharing or new notification guarantee. |
| Payment claims | Consultation terms are set by the specialist; platform subscription is separate. No automatic processing/refund guarantee. |
| Page-specific reference geometry, peach CTA, low-contrast tints and shared-shell breakpoints | The correction restores exact source hero/card/search radii and headline typography locally; shared tokens stay unchanged. Navy-only action policy, readable tint ink, 2px focus and the approved shared header/footer remain. See the current correction report for explicit residual differences. |

Metadata uses the existing public metadata helper: canonical `/for-clients` excludes query data; source title is retained and description omits unsupported nearest-slot claims. Leaving the page resets metadata using the existing lifecycle pattern.

## Local validation

PowerShell from the feature worktree:

```powershell
npm run test:run -- src/views/ForClientsView.spec.ts src/styles/forClientsV2.spec.ts src/router/index.spec.ts src/__tests__/app.spec.ts src/lib/uiVersion.spec.ts src/main.spec.ts src/styles/uiV2.spec.ts src/composables/useSpecialistDiscovery.spec.ts --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck -- --force
npm run build
git diff --check
```

The initial focused matrix passed 171/171 tests after correcting two test assertions (CSS test filesystem resolution and unnamed section regions). The final expanded matrix above passed **207/207 tests across 8 files**, exit 0. Existing jsdom `window.scrollTo` warnings are not browser exceptions.

Typecheck: exactly nine baseline diagnostics, zero new; a detached worktree at this exact base reproduces the same full diagnostic lines:

- specialistDiscoveryApi.spec.ts:22 — TS2353.
- AdminWorkQueueView.spec.ts:823 — TS2561.
- AdminWorkQueueView.vue:790 — TS18048; :845 and :852 — TS2532.
- TherapistClientsView.spec.ts:1676 and :3909 — TS2345.
- TherapistClientsView.vue:6789 — TS2345 and TS18048.

Build PASS; existing >500 kB chunk advisory remains. No new dependencies/configuration.

## Executed Chromium acceptance

Headless local Playwright/Chromium, loopback candidate `http://127.0.0.1:5296`, exact-base server `http://127.0.0.1:5295`. API calls were isolated with HTTP 401 fixtures, not a real backend. Both Vite processes were started for this task only; unrelated processes were untouched.

- 375×677, 768×900, 1280×900, 1440×900 plus 1099/1100/1101×900: correct v2 flag/computed font and mint background, one shared header/footer, approved 32px fennec, no horizontal overflow or page exceptions.
- Each width: FAQ pointer/Enter/Space, Tab/Shift+Tab and visible 2px focus; mobile disclosure/Escape focus return or desktop selected state; refresh; invalid/valid search, q handoff; Back/Forward; client-signup CTA opens existing form.
- Fresh default and explicit v1 deep links return to the existing Home client anchor with v1 selected.
- Font loading blocked at 375: application/content remain visible with fallback and no overflow.
- All five topic chips reach the existing filter codes; explicit v1 overrides stored v2, acquisition query survives fallback, persisted v2 works without a query, and a throwing localStorage property getter does not block mount or SPA navigation. Computed mint text, crisis text, primary button and cabinet text all exceed 4.5:1; [supplementary evidence](evidence/kan-156/supplementary-results.json).
- [Machine-readable viewport evidence](evidence/kan-156/browser-results.json), [v1 parity hashes](evidence/kan-156/v1-parity.json). Full-page v1 baseline/candidate captures are byte- and pixel-identical at all four primary widths after reveal/transition settling; full local images retained under the task's temporary parity directory.

Historical initial screenshots (superseded by correction): [desktop 1440](evidence/kan-156/for-clients-v2-1440.png), [desktop 1280](evidence/kan-156/for-clients-v2-1280.png), [tablet 768](evidence/kan-156/for-clients-v2-768.png), [mobile 375](evidence/kan-156/for-clients-v2-375.png), [font fallback](evidence/kan-156/font-fallback-375.png).

## Remaining gates

This is static landing/route acceptance, not real guest-request submission, signup, payment, invitation, email/support delivery, authenticated backend integration or specialist availability acceptance. The landing has no API loading/error state of its own; existing discovery and signup retain theirs. Real profile/slot data, crisis contacts, mailbox monitoring and future backend features require separate evidence/authorization. Client Dashboard remains HOLD. No merge, default rollout or deployment is included.
