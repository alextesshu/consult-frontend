# KAN-158 Phase 2 · PR A — public profile visual layer (v6.9.1)

Base `origin/dev` `5f0ce90` (includes Phase 1, #75). Branch `feat/kan-158-profile-visual-ux`. Design: `v6.9.1-candidate` (`Specialist-Profile-Phase2-v6.9.1.html`, IMPLEMENTATION_SPEC). UI v2 only.

**Unchanged:**
- booking/request state, offer selection, slot selection and filtering;
- guest request payload, visibility rules and API;
- breakpoints (860 px);
- the profile editor;
- `App.vue` header and footer.

## Changes

| Item | Implementation |
|---|---|
| External contacts card | New `PublicProfileExternalContacts.vue` («Написати напряму · поза Pro Consult» + note). Same `contact_actions` data, the same visibility condition (`showDirectContactActions`) and the same copy action as the former «Мої контакти» rail block. UI v2 removes contacts from the rail. |
| Photo fallback | `PublicProfileHeroSection.vue`: a missing photo or a load error shows an initials tile (`role="img"`, explicit label); a new URL retries. UI v1 markup is unchanged. |
| Full short description | UI v2 CSS override removes the hero `line-clamp`; the shared component keeps the UI v1 clamp. |
| Timezone label | New `src/lib/displayTimezone.ts`: «Час за Києвом» for Europe/Kyiv **and** the legacy `Europe/Kiev`, otherwise «Ваш місцевий час · <IANA>». Slot dates and times already use the browser zone, so the label names exactly that zone; no offset is computed. Shown under «Вільні вікна». |
| Phone sticky bar | Context line + headline. «від» appears only when prices differ, so it never implies a selection. Wording by mode: see the next table. |
| Final CTA | Navy block, one primary action; the existing secondary actions render as text links. The heading depends on mode, and the offers line comes from the configured offers. The same actions, handlers and visibility conditions. |
| Footer clearance | While the phone bar is shown, `body` gets bottom padding equal to the bar height. It is page-scoped, the previous value is restored on removal or unmount, and there are no global CSS rules. |

Sticky bar wording by mode:

| Mode | Context line | Headline |
|---|---|---|
| direct booking with slots | «Консультації <формат>» | «від <мін.>» |
| direct booking without slots | price | «Вільного часу зараз немає» |
| availability error | price | «Вільний час не завантажився» |
| request_only | price | «Час — після запиту» |

Copy is neutral: no name forms, pronouns or response-time promises. request_only never says «немає доступних вікон», and the direct-booking no-slots fallback is kept.

### Known limitation (no state or layout change in this PR)
- **Desktop contacts card:** it is the last block of the request panel, separated as a tinted card. The design places it as a separate card under the panel. Splitting the sticky, independently scrolling `aside` would touch the panel scroll and focus logic and the `.pc2-request-panel--contact > …` selectors, which belongs with the layout work (PR C). At 1280×900 the card is reached by scrolling the panel.
- **768–859 px:** these widths keep the current compact layout. The breakpoint migration is PR C.

## Tests

- **New:**
  - `displayTimezone.spec.ts` (3): Kyiv, `Europe/Kiev`, Berlin, empty, mocked Intl.
  - `PublicProfileHeroSection.spec.ts` (+1): v2 fallback for a missing or broken photo, retry on a new URL; v1 unchanged.
  - `publicProfileV2.spec.ts` (+1): CSS contract for the unclamped description and the contacts card hidden in the contact step.
  - `PublicProfileView.spec.ts` (+7):
    - v2 direct booking with slots: timezone label, contacts card inside the panel with the copy action, neutral final CTA and offers line;
    - direct booking without slots: «no windows» fallback kept, request-led CTA;
    - request_only: no slots, no timezone label, contacts card;
    - phone sticky bar for the three modes, contacts in the page flow, footer clearance set and restored;
    - UI v1 unchanged.
- **Focused suites:** 215 passed.
- **Full Vitest:** 130 files, 1998 passed.
- **`vue-tsc -b --force`:** the same 9 baseline diagnostics as `origin/dev`.
- **`npm run build`** and **`git diff --check`:** PASS.

## Browser evidence (`browser.cjs` → `browser.json`; `compare.py` → `parity.json`; `v1-recheck.cjs` → `v1-recheck.json`)

Setup:
- **Backend:** real disposable Django (`origin/dev` backend on loopback, `seed_therapists` + CTA scenarios). Every scenario profile has public contacts and enough sections for the final CTA.
- **Clock:** one fixed Playwright clock.
- **Photos:** external photo hosts are blocked, so the seeded photos are «broken» and exercise the fallback.

**18 rows, 0 problems:**
- UI v2, direct with slots / request_only / direct without slots × 375, 390, 768, 820, 1280:
  - the contacts card is in the panel (≥ 860) or in the page flow (< 860), never in the rail;
  - the timezone label shows for direct booking and not for request_only;
  - the final CTA heading and offers line;
  - the sticky bar wording;
  - body clearance 77 px;
  - photo fallback; full description;
  - no overflow, no page errors, GET only (no POST/PATCH besides the token refresh);
  - request_only makes 0 slot requests.
- `Europe/Berlin` browser zone: «Ваш місцевий час · Europe/Berlin».
- Full phone page at 375/390: at the bottom the last footer text ends at y≈650 and the bar starts at y=735, so the footer is not covered.

**UI v1 parity vs `origin/dev`** (direct, request_only and direct-without-slots at 1280 and 375):
- 4 of 6 pages: 0 changed pixels.
- The other two 1280 pages differed in one pass. A targeted re-check with the same fixed clock gives:
  - direct: 0 changed pixels in every pair;
  - request_only: baseline-vs-baseline also differs by the same 1543 px (first-render text rasterization), and the second baseline equals the candidate at 0 px.

  So no UI v1 change.

Screenshots: `screenshots/` — v2 1280 for all three modes; 375/390 for each mode; direct at 768 and 820; phone page bottom at 375 and 390.
