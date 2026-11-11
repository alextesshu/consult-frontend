# KAN-158 Phase 2 · PR B — consultation selection and pricing (v6.9.1)

Base `origin/dev` `041a705` (includes PR A, #76). Branch `feat/kan-158-offer-selection-pricing`. UI v2 only.

## Design provenance

| Item | Value |
|---|---|
| Archive | `Модернізація дизайну сайту ProConsult (v6.9.1).zip` |
| SHA-256 | `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d` |
| Candidate | `proconsult-kan158-phase2-v6.9.1-candidate`, approved for KAN-158 phase 2 by the product owner |
| Repo snapshot | `docs/ui-v2/SNAPSHOT_CURRENT.json` is still `claude-design-2026-10-23-4ff7cedd` (v6.6). v6.9.1 is **not** imported into the repository. |

## Unchanged

- API, backend and guest request payload: the same fields, and `offer_type` comes from the same `guestBookingForm.offer_type`.
- Availability and visibility rules: slots appear only for direct booking with public availability; request_only never fetches slots.
- Slot filtering rule: `slot duration ≥ offer duration`, which matches the backend check in `services_public_guest_booking.py`.
- «Обрати час» still scrolls to the slots (desktop) or opens the sheet (phone).
- A slot click still opens the form directly.
- The PR #75 request helper fix.
- UI v1, App header and footer.

## Changes (`PublicProfileView.vue`)

| Item | Before | After |
|---|---|---|
| Rail selection (v2) | The first offer looked selected on load | Nothing is selected until the visitor chooses. UI v1 keeps its default highlight. |
| Price before a choice | — | Final CTA: «N формати · від <мін.>». Phone bar: «від <мін.>» (direct) or «від <мін.>» context (request). «від» appears only when prices differ. |
| Price after a choice | — | Final CTA: «<формат> · <тривалість> · <ціна>». Phone bar, direct: context «<формат> · <тривалість>», headline «<ціна>». Phone bar without bookable time: context «<ціна> · <формат>», with the price first so a narrow bar truncates the name, not the price. |
| Slots before a choice | Filtered by the first offer | Unchanged. This is internal only, and nothing presents it as the visitor's choice. |
| Slots after a choice | Filtered by the chosen offer | Unchanged. Changing the offer re-filters the slots and re-syncs the date, so no incompatible slot stays visible. |
| Form (v2) | «Обраний варіант» whenever any offer had been chosen | «Обраний варіант» only when the form's `offer_type` equals the visitor's explicit choice. Otherwise the form asks, and the answer updates the rail, the price and the request together. |

Out of scope:
- the design's intermediate «Продовжити» step and the «Обрати формат» / «Змінити» links in the panel;
- the 860 px breakpoint and layout (PR C);
- the slot card's «Тривалість» line, which shows the slot window. A 20-minute intro in a 50-minute slot is valid by the backend contract.

## Tests

- `PublicProfileView.spec.ts`, +7 tests:
  - no preselection; the chosen price appears in the final CTA;
  - the explicit choice is sent as `offer_type`;
  - with no choice the form asks, and the answer syncs the screen and the request;
  - slots are filtered by the first offer, then by the chosen one;
  - phone bar for direct and request_only (request_only fetches 0 slots);
  - UI v1 default highlight unchanged.

  Five of the seven fail on `origin/dev`.
- **Full Vitest:** 130 files, 2005 passed.
- **`vue-tsc -b --force`:** the same 9 baseline diagnostics as `origin/dev`.
- **`npm run build`** and **`git diff --check`:** PASS.

## Browser evidence (`browser.cjs` → `browser.json`; `compare.py` → `parity.json`; `v1-recheck.cjs` → `v1-recheck.json`)

**Setup:**
- Real disposable Django (`origin/dev` backend `9f11568` on loopback, `seed_therapists` + scenarios).
- One fixed Playwright clock.
- Guest request POSTs are intercepted by Playwright: the payload is recorded and the backend is never written.

**Results:** **23 rows, 0 problems.**

Initial state, UI v2 (direct with slots, request_only, direct without slots × 375, 390, 768, 820 and 1280):
- no offer is pressed;
- the final CTA reads «3 формати · від 500 грн», «2 формати · від 1400 грн» and «Консультація · 1800 грн · 50 хв»;
- the phone bar shows «від …» for multi-price profiles;
- request_only makes 0 slot requests;
- no overflow, no page errors, and GET only besides the token refresh.

Desktop 1280, direct:
- Choosing «Парна консультація» (80 min) hides every 50-minute slot and shows «… · 80 хв · 2000 грн».
- Choosing «Ознайомча сесія» brings the slots back and shows «… · 20 хв · 500 грн».
- A slot click opens the form with «Обраний варіант: Ознайомча сесія». The intercepted request has `offer_type: "intro"` and the slot id.

Desktop 1280, no choice:
- The form asks (2 options and no «Обраний варіант»).
- Answering «Консультація» updates the final CTA to «… · 50 хв · 1200 грн». The request has `offer_type: "standard"`.

Phones 375/390, choosing in the sheet and closing it:

| Mode | Context | Headline |
|---|---|---|
| direct | «Ознайомча сесія · 20 хв» | «500 грн» |
| request_only | «2000 грн · Парна консультація» | «Час — після запиту» |
| direct without slots | «1800 грн · Консультація» | «Вільного часу зараз немає» |

At 375 the request_only context is truncated, but a Range measurement confirms the price is fully visible. request_only makes 0 slot requests.

**UI v1 parity vs `origin/dev`** (3 scenarios × 1280/375):
- Final run: 0 changed pixels on all 6 pages.
- An earlier run showed 17 px on direct-without-slots 1280. The targeted `v1-recheck.cjs` (both builds twice, same fixed clock) gave 0 px in every pair, baseline-vs-baseline included, so it was first-render noise.

Screenshots in `screenshots/`:
- `v2-direct-1280-initial.png`, `v2-direct-1280-intro-form.png`;
- 375 px initial and chosen states for direct, request_only and direct without slots (the request_only initial state shows the «від» price).
