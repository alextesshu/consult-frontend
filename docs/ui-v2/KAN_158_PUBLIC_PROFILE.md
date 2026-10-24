# KAN-158 public specialist profile v6.6/v6.7

Existing [Draft PR #55](https://github.com/alextesshu/consult-frontend/pull/55), branch `feat/ui-v2-stage-2-1-public-profile`. Starting HEAD `bc1a2225ce91732d1e723a7ef8491e5ce5313c35`; verified dev integration base `7d437689a648923d319a26d604b7b31eb81b4473` (merged design sync #63). Integrated in `239d663` preserving both independent CSS append blocks; subsequent page-only CSS is moved out of shared components so approved shared branding matches dev exactly. Local frontend dev and other task branches remain unchanged.

Source: `claude-design-2026-10-23-4ff7cedd`, original archive SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`; archive labeled v6.6, contents through v6.7. Exact references: [desktop](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html), [mobile](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile-Mobile.dc.html), [Share-Card](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Share-Card.dc.html), [backend decisions](snapshots/2026-10-23-4ff7cedd/handoff/BACKEND_DECISIONS.md). Source snapshots and approved fennec geometry are not modified.

## Fidelity and justified contract differences

| Claude behavior / exact values | Vue implementation | Justified boundary / difference |
| --- | --- | --- |
| Desktop1240 container, 300-360 request column, gap clamp28/4vw/56, portrait4:5/radius24 | Profile-owned styles; real hero/media/trust/topics/offers | Approved shared header/footer retained; no fake video duration, fallback portrait or credentials |
| Desktop h1 clamp40/4.6vw/60, line1.02; summary19/1.55 | Exact page rules, real professional-focus label where available | No guessed role if DTO lacks focus; fields/chips remain specialist-authored |
| Work cards, with/without cards and education/documents | Real authored blocks laid out as cards; desktop scope pair and mobile78% snap strip; actual public education/documents | No invented three-stage treatment, fixed years or qualification badges; unstructured DTO text retained and platform verification disclaimer preserved |
| Desktop info row / mobile3 tiles | Actual trust data; format/location combined without dropping extra public metadata | Extra actual trust fields may add tiles; no invented language/location/experience |
| Sticky panel96px, max viewport minus112px, overscroll contain | Independently scrolling actual request panel; preserved offer compatibility/calendar/request flow | Public availability flags authoritative; real dates/slots only; retained expandable full calendar instead of losing navigation |
| Five compact days, offer rows, time controls, slotless action | Real selected month/date/offer state reused; source day strip and time chips | Selecting a slot opens existing contact/confirmation step directly; no duplicate provisional booking state or simulated Next/confirmation |
| Guest email/phone/Telegram | Existing form/channel validation/endpoint and existing contact chooser | No new inquiry transport or private contact exposure; only eligible public contact actions rendered |
| Conditions accordion/consent | Real booking_rules items/version/text and existing prompt/checkbox/accept handlers; collapsed grid400ms; accepted notice only when server marks every actual rule accepted | No fabricated universal agreement/TTL/version; guest request payload unchanged, source guest consent persistence remains a separate backend/product decision |
| Questions before first session | Existing authenticated inquiry eligibility/thread/reply states and native actual request message field | Source anonymous600-character email question flow is not invented; unsupported anonymous thread remains gated |
| FAQ first-open desktop, single-open toggle; grid400ms, plus300ms | Native buttons, aria-expanded/controls, inert collapsed answers; source easing | Desktop first-open/mobile initially collapsed; responsive state is reset safely; real FAQ only, no prototype cancellation/clinical claims |
| Documents grid450ms, arrow300ms | Persistent inert v2 grid and source rotation; v1 conditional grid retained | Real public documents and existing download safety only |
| Request focus glow1400ms, shadow600ms | Lifecycle-owned highlight timer and exact source shadows | Reduced motion removes highlight; hidden time pauses with remaining interval, no catch-up |
| Mobile <860: portrait1:1, h1 34/1.05, summary16/1.55, bottom CTA52 | Responsive profile and fixed safe-area bottom bar | Minimum only within one currency; mixed currencies use current base offer label, no implicit conversion. Slot summary is loaded public date, otherwise neutral time-agreement text |
| Request sheet86%, transform400ms cubic-bezier(.2,.8,.2,1), dim300ms | One native dialog with a single teleported panel/form; drawer header swipe/down, Escape/backdrop; body lock, focus containment/return | 86dvh adapts real browser viewport. Actual signed-client confirmation/success remain inside native top layer on mobile; business actions unchanged |
| About full-screen mobile; desktop min640/viewport-40, radius28 | Real full biography, source400ms mobile transition; native desktop modal; CTA closes then opens/highlights request | Desktop source modal appears immediately; native modal supplies missing keyboard/focus behavior |
| Share under photo; desktop popover / mobile sheet; native share where available | Anchored transparent-backdrop native desktop dialog; source400ms mobile sheet; native share success/cancel/error handling; Telegram/Instagram/Facebook/Threads/copy | Async clipboard success only after success, errors visible; Instagram copies with guidance. Share links use canonical loaded slug, no source sample URLs. Native OS sharing is mocked in acceptance, not certified on devices |
| Owner preview / hidden | Existing confirmed-owner unpublished explanation/settings links retained; generic public404 unavailable composition and safe discovery route | Canonical /s/:slug has no private preview contract. No cabinet data rendered publicly, no direct Publish mutation, no inferred reason why a404 is unavailable |
| Lifecycle / accessibility | Native top layer, Tab containment, Escape/backdrop, header swipe, delayed animated close; route/resize/UI-version cleanup; reduced-motion and visibility handling; disposed timers/listeners | Shared v2 foundation forces1ms reduced transition duration; presentation timers settle immediately. Visibility checks synthetic, not OS throttling |
| Share-Card OG1200x630/1080x1080 | Frontend sharing panel uses actual public photo/name/link | Server OG image generation, storage, caching/invalidation, non-JS metadata/hidden policy remain a separate backend decision; no new OG claim |

## Validation and evidence

[Browser results](evidence/kan-158/v66-v67/browser-acceptance.json), [lifecycle/reduced/native-share/error cases](evidence/kan-158/v66-v67/lifecycle-acceptance.json), [authenticated confirmation](evidence/kan-158/v66-v67/client-confirmation.json), [V1 pixel parity](evidence/kan-158/v66-v67/v1-parity.json), [source capture details](evidence/kan-158/v66-v67/source-captures.json), [exact file inventory](evidence/kan-158/v66-v67/files.json).

- Focused implementation/guest-request/profile/share/metadata/version/App regressions: 315/315 PASS across13 files. [Log](evidence/kan-158/v66-v67/focused-tests.txt).
- Final narrow rerun after panel refinements: 152/152 PASS; [log](evidence/kan-158/v66-v67/final-targeted-tests.txt).
- Twelve business handlers remain AST-text identical to starting PR HEAD; [hash evidence](evidence/kan-158/v66-v67/business-handler-parity.json).
- Production build PASS; existing chunk-size warning retained. [Log](evidence/kan-158/v66-v67/build.txt).
- Typecheck: nine baseline diagnostics, zero new; not a clean typecheck PASS. [Log](evidence/kan-158/v66-v67/typecheck.txt), [comparison](evidence/kan-158/v66-v67/typecheck-comparison.json).
- Chromium375x677,768x900,1280x900,1440x900; no horizontal overflow, one request panel/form, actual fixture POST only after submission, pending guest outcome, About/share/FAQ/docs phases captured. Source and Vue captures are separate, not a claim of pixel identity to prototype data/chrome.
- V1 full-page pixel comparison against dev runtime tree: zero changed pixels at all four widths. Initial image-only mismatch was a baseline missing snapshot asset fixture; fixed identical image bytes for both and recaptured. No production code adjustment was needed for that mismatch.
- Scope: default v1, shared App/brand/tokens/router/API/Home/For Clients/Discovery and backend unchanged. Prior public-profile implementation retained; existing styles/uiV2 spec change is inherited from starting PR. Source snapshots immutable.

PowerShell commands from this worktree:

```powershell
npm run test:run -- src/views/PublicProfileView.spec.ts src/components/public-profile src/composables/useProfileMotion.spec.ts src/styles/publicProfileV2.spec.ts src/components/ShareDialog.spec.ts src/lib/publicMetadata.spec.ts src/lib/publicBookingRecovery.spec.ts src/lib/uiVersion.spec.ts src/__tests__/app.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck -- --force
git diff --check
```

Browser harnesses/fixtures and pixel/source/scope validators are retained with evidence. Source renders execute original local DC/React support only for explicitly requested visual acceptance; React/font CDN loading is allowed in the reference context. Only outer mobile phone-board scaffold is resized for viewport comparison; source content/state/CSS are retained and no snapshot is edited. API traffic is intercepted fixtures, external analytics blocked. These runs do not certify real backend workflows, phone/Telegram/email delivery, private preview, device native sharing or production deployment.

## Review and release boundary

Update existing Draft #55 only. Final commit and automatic CI terminal result belong to PR delivery evidence; no manual CI rerun. No new PR, Jira changes, Ready transition, merge, deployment or global rollout. KAN-160 remains HOLD; backend registration #63 untouched. The release-debt register contains no open STAGED_READY/DEFERRED frontend records; no deployment inference is made. Remaining product/backend gates are explicit in the matrix above; next action is visual acceptance of this Draft PR.
