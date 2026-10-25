# KAN-158 phase 1 — request_only helper copy

Base: `origin/dev` `3085c1cb4ac3ebd45a71feb0307bd5404881f24e`. Branch `fix/kan-158-request-only-helper`.

## Defect and root cause

Every `request_only` profile said «Наразі немає доступних вікон. Ви можете залишити запит, і спеціаліст узгодить час окремо.» under «Залишити запит».
- **Affected:** UI v1 (production default) and UI v2, desktop rail and phone sheet.
- **Why it misleads:** the specialist may well have slots; they are simply not public by configuration.

Root cause: `resolvePublicBookingRecovery` (`src/lib/publicBookingRecovery.ts`) returns the same `request` state for two different situations:
- a profile that is request-only by configuration;
- a direct-booking profile whose horizon has no slots.

`showDirectBookingRequestFallback` is that state, and `railRequestHelperText` (`src/views/PublicProfileView.vue`) chose the «no windows» copy from it alone.

## Fix (copy only)

`railRequestHelperText` shows the «no windows» copy only when public slot booking is actually enabled (`publicDirectBookingEnabled`) and the horizon is empty; otherwise the request helper (`REQUEST_CTA_HELPER_TEXT`).

Unchanged:
- the resolver, `showDirectBookingRequestFallback` and `usesPublicRequestFlow`;
- CTA labels, slot fetching and display;
- the guest request form and payload;
- permissions, visibility rules and the API.

Every other consumer of `usesPublicRequestFlow` is already combined with `!publicDirectBookingEnabled`, so its result for request_only does not depend on this flag.

| Profile | Helper under the request CTA |
|---|---|
| `request_only` (availability hidden or shown) | «Опишіть коротко, з чим хочете звернутися…» — no slot fetch, no slot existence/count disclosed |
| `direct_booking` with slots | slot selection (unchanged) |
| `direct_booking`, empty horizon | «Наразі немає доступних вікон…» + «Залишити запит» (unchanged) |
| `direct_booking`, availability error | «Не вдалося завантажити вільний час…» (unchanged) |

## Tests

`src/views/PublicProfileView.spec.ts` gains four cases: v1 and v2 × request_only with availability hidden and shown. The mocked specialist has a slot, and each case asserts:
- the request helper is shown and the «no windows» copy is absent;
- «Залишити запит» is present and «Обрати час» absent;
- no slot heading or chips, and zero `/booking/slots/` calls;
- no POST.

The four tests fail on `origin/dev` and pass with the fix. The existing no-slots (v1/v2) and availability-error tests are unchanged and pass.

## Browser evidence (`browser.cjs` → `browser.json`, `compare.py` → `parity.json`, `fixed-clock.cjs` → `fixed-clock.json`)

Setup:
- **Backend:** real disposable Django, `origin/dev` `9f11568` on loopback, with `seed_therapists` plus four CTA scenarios: direct with slots, request_only, request_only with public availability, direct without slots.
- **Builds:** candidate = this branch; baseline = `origin/dev`.
- **Pacing:** respects the 30/min anonymous throttle (0 throttled responses).

**Candidate: 32 loads (4 scenarios × v1/v2 × 375/390/768/1280), 0 problems.**
- request_only: «no windows» 0, request helper ≥ 1, 0 slot fetches, 0 slot chips, no «Обрати час», «Залишити запит» present.
- Direct with slots: slots fetched and shown («Обрати час» in v2, slot chips in v1).
- Direct without slots: the «no windows» fallback is kept.
- No non-GET request besides the token refresh, no page errors, no horizontal overflow.

**Baseline:** request_only showed «no windows» in v1 and v2.

**Pixel parity, candidate vs baseline:**
- Direct with slots and direct without slots: 0 changed pixels in v1 (1280, 375) and v2 directEmpty 1280.
- Direct v2 1280: a 134-pixel difference in one capture was rendering noise. The same region differed between two baseline captures in an earlier pass, and a targeted re-capture with the same fixed Playwright clock gives 0 changed pixels between builds and between repeats.
- request_only: only the request card changes — v1 the helper text (same height); v2 the helper text, one line longer, so the request card grows by one line.

A first pass crossed midnight (calendar «today» moved), so it was re-run on a stable date; that pass is not used as evidence.

Screenshots (`screenshots/`):
- before/after request_only v1 1280, v1 375 and v2 1280;
- candidate direct-without-slots v2 1280 (fallback kept).

## Checks

- Focused: `PublicProfileView.spec.ts` + `publicBookingRecovery.spec.ts` — 156 passed.
- Full Vitest (`--maxWorkers=2 --minWorkers=1`): 129 files, 1986 passed.
- `vue-tsc -b --force`: the same 9 baseline diagnostics as `origin/dev` (AdminWorkQueue, TherapistClients, specialistDiscoveryApi), none new.
- `npm run build`: PASS. `git diff --check`: PASS.
