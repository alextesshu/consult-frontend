# Pro Consult UI v2 — reference index

## Current supplied design snapshot

- ID: `claude-design-2026-10-23-265f221a`; ingestion date 2026-10-23.
- SHA-256: `265f221a95ac9fc521a33138b06376b51ad4a822c79fd05e30f7303ef6b10948`.
- Source: `C:\Users\admin\dev\portfolio\consult\design-sources\Модернізація дизайну сайту ProConsult.zip`.
- [Claude project](https://claude.ai/design/p/c453ec11-5135-4169-a1c2-cf1d64218392) is provenance, not an automatic sync. New date-named exports in that folder require explicit import/checksum/version comparison.
- [Manifest and changed-file inventory](SNAPSHOT_MANIFEST.json), [page matrix / findings / contract gates / prioritized roadmap](DESIGN_SYNC_2026-10-23.md), [mandatory future-task checklist](DESIGN_SYNC_CHECKLIST.md).
- [Exact handoff sources](snapshots/2026-10-23-265f221a/README.md) and [previous Git references](snapshots/baseline-e4b903e/README.md).

Every future implementation and PR must identify its exact Claude snapshot and full checksum. The ZIP defines current UX/UI intent; runtime/product/permission contracts and explicit authorization govern execution. Prototype scripts and controls do not prove server capability.

## Actual implementation state

Frontend base is `e4b903e523836f44c2ac79c0403621382cf92d55`. Stage 0A/0B and 1.1/1.2/1.3a are merged. Registration completion #54, public profile #55, discovery #56 and client dashboard #57 remain Draft; backend registration #63 remains Draft. This sync does not change those branches/states or approve their merge.

**Further Client Dashboard implementation is HOLD** until updated UX approval and verification of request ownership/actions, reminders, rescheduling/cancellation, payment/material and diary boundaries. Reassess Homepage and Discovery against new references. For Clients is a new independent stage. Stage 4 has mockups now.

## Active reference pages

| Scope | Reference |
| --- | --- |
| Homepage / public header | [Home](mockups/Home.dc.html) |
| Specialist signup | [Signup](mockups/Signup.dc.html) |
| Public specialist profile | [Specialist-Profile](mockups/Specialist-Profile.dc.html) |
| Discovery | [Find-Specialist](mockups/Find-Specialist.dc.html) |
| Client signup | [Client-Signup](mockups/Client-Signup.dc.html) |
| Client dashboard — HOLD | [Client-Cabinet](mockups/Client-Cabinet.dc.html) |
| New public client landing | [For-Clients](mockups/For-Clients.dc.html) |
| Specialist dashboard | [Cabinet-Dashboard](mockups/Cabinet-Dashboard.dc.html) |
| Shared forms | [Cabinet-Drawer](mockups/Cabinet-Drawer.dc.html) |
| Specialist sessions | [Sessions](mockups/Sessions.dc.html) |
| Specialist clients/workbook | [Clients](mockups/Clients.dc.html) |
| Mobile cabinet/admin | [Cabinet-Mobile](mockups/Cabinet-Mobile.dc.html) |
| Admin | [Admin](mockups/Admin.dc.html) |
| Brand | [Brand](mockups/Brand.dc.html) |
| Component reference | [Handoff-Spec](mockups/Handoff-Spec.dc.html) |

Home A/B/C, Practice-Block-Options and Specialist-Dashboard are archived variants, not current targets. Images under mockups are documentation-only, including fictional demonstration people and the new fennec brand. No production logo/favicon has been changed.

## Reference execution boundary

Raw HTML preserves the export content (except three documented trailing-whitespace removals in Clients/Sessions; source and destination hashes are recorded separately) and contains x-dc/sc-* placeholders, inline styles, inert text/x-dc logic and original external font/script references. `support.js` and `brand-listen.js` are intentionally excluded. Do not execute prototypes, serve them as app pages, fetch their CDN dependencies or import these files into runtime. Static asset checks distinguish excluded scripts, dynamic template references and actual local image/page files.

Source CSS/TypeScript are frozen reference copies only. Existing runtime remains hardened: query v1/v2 overrides stored pc.ui, then exact VITE_UI_V2=true, else v1; independent storage read/write failures and per-document memory fallback cannot block bootstrap. applyUiVersion runs before createApp; only successful navigation synchronizes reactive state/html[data-ui]. Default remains v1. Existing muted-text/focus/isolation fixes and v1 rules remain intact.

See [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), [integrated TZ](TZ_CODEX.md), [task entrypoint](CODEX_TASKS.md), [design system](../DESIGN_SYSTEM.md) and [migration plan](../UI_MIGRATION_PLAN.md). Source conflicts are findings, not permission to copy runtime files or publish unverified SLA/payment/cancellation/crisis claims.
