# KAN-155 — Homepage UI v2 refresh

## Source and boundaries

- Frontend base: `ce49fc5097cdd2f6d999b52d76a45a12448f535d` (`origin/dev`, Design Sync PR #58).
- Branch: `feat/kan-155-homepage-v2-refresh`.
- Claude snapshot: `claude-design-2026-10-23-265f221a`.
- Archive: `design-sources/Модернізація дизайну сайту ProConsult.zip`, supplied 2026-10-23.
- Archive SHA-256: `265f221a95ac9fc521a33138b06376b51ad4a822c79fd05e30f7303ef6b10948`.
- No newer export was present in the supplied design-sources directory. This is a snapshot, not a live Claude connection.
- Reference: [Home.dc.html](mockups/Home.dc.html), [Design Sync](DESIGN_SYNC_2026-10-23.md), [design system](../DESIGN_SYSTEM.md).

## Implemented delta

The existing v2 homepage now uses the Home snapshot's page-local mark, four-node journey rail and distinct anonymous profile/request/session/work illustrations, top-aligned dark conditions band, six-card public/private bento, three blog-format cards, compact mint client-entry strip and left-aligned pricing heading with adjacent cycle control.

Two page decorations are byte-identical to the ZIP/manifest. Their imports do not replace any production logo or favicon:

| Asset | SHA-256 |
| --- | --- |
| `src/assets/home-v2/mark-navy.png` | `474646f6d9ea9fd10afbd1e9347d2005ed3721d349c00911c58acf592a7b08d9` |
| `src/assets/home-v2/mark-band.png` | `19f1ca55e2838701a7d88ba72d7ad92e55adf69de6052f4d15d6d410e2a81ac4` |

All new page CSS is gated by `html[data-ui="v2"] .pc2-home`. Colors, type, spacing and radii use existing tokens. Shared buttons/cards are reused. Mint/peach text uses its corresponding ink token. Existing muted kickers and navy focus safeguards remain, including where the prototype uses insufficient soft-text contrast. Design-system 16px cards/24px panels and existing display typography take precedence over unsupported literal mockup dimensions.

## Preserved product behavior

- Default remains v1; v1 markup and scoped CSS are unchanged.
- Shared pricing, billing-cycle state, CTA handlers, role priority/fallback and one-shot analytics are unchanged.
- Start: 0 UAH, 3 active clients expandable to 6. Pro: 990 UAH/month or 9,900 UAH/year, 20 expandable to 26. Existing 30-day trial, commission, custom-format and limits explanations remain visible.
- Requests require specialist agreement; no simulated identity, price, booking, availability or automatically sent meeting link is introduced.
- Private specialist notes are distinguished from separately published client materials. Payment copy describes recording/confirming direct payments, not payment processing. This follows the KAN-163 audit and KAN-140's verified-claims boundary; it makes no new certification, encryption or compliance claim.
- No API, store, authentication, routing, permissions, header, footer, registration, discovery or dashboard code changes.

## Explicitly deferred

- KAN-156: `/for-clients` does not exist yet. Both existing client CTAs continue to `/specialists`; no broken link or claim that the new landing already exists.
- Global brand/header/footer/favicon replacement and the shared PCListen animation remain separate brand work. This page uses only the two static decorative assets; no prototype JavaScript/CDN is imported. Existing manual journey interaction is retained without autoplay.
- Prototype identities, calendar dates, paid/confirmed demo states and fake published article titles are replaced by clearly illustrative, generic capability presentation.
- No SLA/24-hour response promise, automatic payments or guaranteed client acquisition.

## Local validation — 2026-10-23

PowerShell commands run in the feature worktree:

```powershell
npm run test:run -- src/views/HomeView.spec.ts src/styles/homeV2.spec.ts src/__tests__/app.spec.ts src/lib/uiVersion.spec.ts src/main.spec.ts --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck
npm run build
git diff --check
```

- Focused Vitest: **127/127 PASS** across five files (Home 20, CSS 5, App 76, UI-version 21, bootstrap 5).
- Build: **PASS**; existing large-chunk advisory remains.
- Typecheck: **9 baseline diagnostics, exactly unchanged, 0 new**. Baseline was run before edits on the same base. Existing diagnostics: specialistDiscoveryApi.spec.ts:22; AdminWorkQueueView.spec.ts:823; AdminWorkQueueView.vue:790/845/852; TherapistClientsView.spec.ts:1676/3909; TherapistClientsView.vue:6789 (two diagnostics). Typecheck does not pass globally.
- `git diff --check`: **PASS**.
- Source comparison against the base: v1 template, entire legacy scoped stylesheet and shared business-handler section are identical.

### Chromium acceptance

Playwright with local Chromium, loopback-only Vite candidate `http://127.0.0.1:5214` and baseline `http://127.0.0.1:5215`. API requests are intercepted with guest/error or role fixtures. No live backend acceptance, real account operation or provider delivery was performed.

| Viewport | v2 structure / no overflow | Keyboard / reduced motion | v1 full-page parity |
| --- | --- | --- | --- |
| 375×677 | PASS | PASS | Pixel-identical |
| 768×900 | PASS | PASS | Pixel-identical |
| 1280×900 | PASS | PASS | Pixel-identical in two settled repeats |
| 1440×900 | PASS | PASS | Pixel-identical |

Additional executed checks: all four journey states; annual/monthly pricing; signup/discovery/support CTA navigation; default v1 and explicit selection; persisted refresh; SPA Back/Forward; billing/analytics state across version switches; restored v1 reveal observers; client-entry/pricing hash offsets at all four widths; unchanged footer and authenticated headers; CLIENT/SPECIALIST/ADMIN/mixed-role destinations; minimal shell; font-loading failure with delayed failing auth API. No page exceptions in passing cases.

Computed foreground/background contrast: mint 6.91:1, peach 6.11:1, dark feature/primary/Pro CTA 12.62:1, secondary CTA on its actual cream ancestor background 12.00:1. Tab/Shift+Tab and Enter executed; focus is solid 2px and reduced-motion transition is 0.001s.

Initial 1280px screenshot variance was investigated, not accepted on assumption: the v1 source is unchanged, geometry/type/color metrics for all 312 Home elements match, and two subsequent baseline/candidate captures are pixel-identical. Browser harness navigation uses the mounted app router; importing a second router after Vite HMR is not a valid SPA test.

Local evidence directory: `C:/Users/admin/AppData/Local/Temp/proconsult-kan155`.
Files include `matrix.json`, `behavior.json`, `final-visual.json`, `parity-final.json`, `parity-metrics.json`, `source-parity.json`, test/build/typecheck logs, baseline/candidate v1 captures and `v2-{375,768,1280,1440}.png` / `v2-*-top.png`. These artifacts are local, not uploaded PR attachments.

No staging/production deployment, manual CI rerun, Ready transition or merge is authorized by this work. Repository release-debt records contain no open STAGED_READY/DEFERRED entries; this is a register observation, not fresh deployment verification.
