# KAN-158 final visual polish and local acceptance

Follow-up to [initial delivery](KAN_158_PUBLIC_PROFILE.md), existing [Draft PR #55](https://github.com/alextesshu/consult-frontend/pull/55), branch `feat/ui-v2-stage-2-1-public-profile`, baseline `f84a3297e118559af1444d0bf06160e53c7353c5`. Stop at READY FOR VISUAL RE-REVIEW; no Ready transition, merge, deploy or Jira mutation.

Canonical source remains `claude-design-2026-10-23-4ff7cedd`, archive v6.6 / contents v6.7, full SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`. Comparison uses original [desktop HTML](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html), including inline CSS and handlers. Snapshots are unchanged.

## Findings and corrections

| Observation | Root cause and source comparison | Resolution |
| --- | --- | --- |
| Final letter of `Олександр Константінов` wraps at desktop width | Legacy scoped heading uses `overflow-wrap:anywhere`; source 40–60px desktop heading can exceed a real long surname's column. Prototype's short name did not expose it. | V2 wraps between words. A hidden intrinsic text probe measures the longest complete word with the actual loaded font and column width; font size decreases only when necessary. Source desktop clamp and mobile 34px remain the maximum. Resize/name/version changes recalculate; observer/listener and late font-ready callback are cleaned up. No V1 font override. |
| Short card content positioned too low | Equal-height outer scope cards are intentional in source, but nested legacy CSS Grid defaults stretch their auto rows, including the short card's header and body. This is a static layout bug, not a reveal or transition artifact. | V2 intrinsic content aligns to the top. Equal-height outer cards and all real authored text remain; no fixed card height or truncation. Long work paragraphs retain natural height. |
| Large section spacing / professional preparation | Source main column explicitly uses `gap:clamp(56px,7vw,88px)`. Preparation content is real public data with platform disclaimer, education, development and optional documents; source's demonstration years cannot be inferred. | Retain source section spacing and actual preparation content. Top-align intrinsic preparation rows; no fabricated dates or removal of real public fields. |
| Desktop panel has its own scrollbar | Source aside explicitly sets sticky top96px, max-height viewport−112px, overflow-y:auto, overscroll-behavior:contain and scrollbar-width:thin. Contacts make real panel longer than the demonstration. | Preserve designed independent scroll and keyboard reachability; match thin scrollbar. Verify action, contact focus, lower controls and page scrolling outside panel. No forced sticky action covering content and no change to scroll containment. |
| `Обрати час` while no slots exist | Existing recovery state correctly opens the generic request, but V2 template unconditionally replaced its label whenever direct-booking permission was true. | V2 rail, closing CTA, mobile CTA and About CTA share a label derived from existing `usesPublicRequestFlow`. Empty/error/request-only states say `Залишити запит`; available-time state retains `Обрати час`. Existing click/permission/payload logic unchanged. |

## Actual local backend versus replay evidence

Candidate origin is exactly `http://localhost:5173`, backend `http://127.0.0.1:8000`, actual published route `/s/specialist?ui=v2`. CORS/settings/backend files are unchanged. Direct real profile and availability requests return200; displayed public name, offers, biography, education, documents and contacts come from Django, not invented data. Anonymous token refresh401 is expected. No JavaScript page errors. Browser results retain response path/status and console errors without request credentials or full DTO dumps.

Direct real smoke covers 375x677,768x900,1280x900,1440x900, desktop panel scrolling/contact reachability, mobile single request sheet/form, About/Share and opening the actual request form. It deliberately stops before submission.

**Actual request submission/PENDING outcome is NOT validated in this follow-up.** Read-only local configuration inspection returned Django SMTP email backend; guest request creation synchronously calls specialist notification delivery. Delivery was not proven isolated to a test inbox, so no real guest POST or test email was sent, no local business data was created and no real booking was claimed. Existing fixture-backed pending acceptance remains historical evidence from the initial delivery, not real integration proof. A safely isolated notification sink/test specialist is required for that final submit check.

Repeated initial capture attempts encountered the actual anonymous30/min throttle, producing429. No rate-limit/CORS setting was changed and the failed attempts are not counted as passes. Final before/V1 comparisons and the 12 short/long-name variants replay public DTOs read from the local backend in memory, avoiding duplicate traffic; these are explicitly separate from four direct real V2 smoke checks. The pinned baseline is rendered with a temporary Vite load hook reading only the three runtime files from baseline commit; no worktree reset or other worktree edit.

## Validation

- Focused Vitest: **194/194 PASS**, eight files. Includes no-slot action/form/no-submit checks in both versions and title sizing/source restoration/observer cleanup regression.
- Production build PASS; existing chunk-size warning. Typecheck remains nine exact baseline diagnostics, zero new, not a clean PASS.
- Chromium: four widths, 12 name variants (short, reported name, long compound surname), complete words, no horizontal overflow, top-aligned cards, panel/overlays/form checks.
- V1 full-page parity: zero changed pixels at all four widths, using identical replayed real public DTOs and unchanged media.
- Twelve booking/request/offer/inquiry handlers remain AST-text identical to baseline; no business logic, API payload or permission change.
- Source archive SHA/CRC/import hashes, source immutability, protected shared runtime, UTF-8/relative links, exact file hashes and `git diff --check` verified by the delivery validator. Original first-delivery evidence/manifest is historical at `f84a329`; new follow-up inventory is separate.
- Automatic CI terminal result is recorded in Draft PR #55 and delivery response; no manual rerun.

PowerShell commands from this worktree:

```powershell
npm run test:run -- src/views/PublicProfileView.spec.ts src/components/public-profile src/composables/useProfileMotion.spec.ts src/styles/publicProfileV2.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck -- --force
python -X utf8 docs/ui-v2/evidence/kan-158/local-polish/validate_delivery.py
git diff --check
```

[Browser results](evidence/kan-158/local-polish/browser-results.json), [V1 pixel comparison](evidence/kan-158/local-polish/v1-parity.json), [exact follow-up file inventory](evidence/kan-158/local-polish/files.json), [test log](evidence/kan-158/local-polish/focused-tests.txt), [build](evidence/kan-158/local-polish/build.txt), [typecheck comparison](evidence/kan-158/local-polish/typecheck-comparison.json), [handler parity](evidence/kan-158/local-polish/business-handler-parity.json).

| Width | Before | After |
| --- | --- | --- |
| 375 | [Before](evidence/kan-158/local-polish/before-v2-375.png) | [After](evidence/kan-158/local-polish/after-v2-375.png) |
| 768 | [Before](evidence/kan-158/local-polish/before-v2-768.png) | [After](evidence/kan-158/local-polish/after-v2-768.png) |
| 1280 | [Before](evidence/kan-158/local-polish/before-v2-1280.png) | [After](evidence/kan-158/local-polish/after-v2-1280.png) |
| 1440 | [Before](evidence/kan-158/local-polish/before-v2-1440.png) | [After](evidence/kan-158/local-polish/after-v2-1440.png) |

Exact runtime/test files: `src/components/public-profile/PublicProfileHeroSection.vue`, `src/components/public-profile/PublicProfileHeroSection.spec.ts`, `src/styles/publicProfileV2.css`, `src/views/PublicProfileView.vue`, `src/views/PublicProfileView.spec.ts`. All remaining follow-up files are this report and its evidence directory. UI v1 default, approved fennec, shared shell, Home/For Clients/Discovery, backend and Claude's parallel worktree remain untouched.

Remaining product/backend gates: real safely isolated submit/PENDING acceptance above, server OG renderer/storage/cache/non-JS metadata, private owner preview, unsupported anonymous inquiry, guest-consent persistence; KAN-160 remains HOLD. No additional runtime gate is silently implemented.
