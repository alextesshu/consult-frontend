# Pro Consult UI v2 — current reference index

## Current supplied snapshot — v3

- ID: `claude-design-2026-10-23-e43f5f80`, imported 2026-10-23.
- Source: `C:/Users/admin/dev/portfolio/consult/design-sources/Модернізація дизайну сайту ProConsult (v3).zip`.
- SHA-256: `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`. Size: 1,432,398 bytes, 57 entries.
- [Start here](START_HERE.md), [source CHANGELOG](CHANGELOG.md), [v3 manifest](SNAPSHOT_MANIFEST_V3.json), [audit](DESIGN_SYNC_2026-10-23_V3.md), [page/Jira matrix](IMPLEMENTATION_MATRIX_V3.md), [Jira recommendations](JIRA_ALIGNMENT_V3.md), [future-sync checklist](DESIGN_SYNC_CHECKLIST.md).
- [Frozen supplied handoff](snapshots/2026-10-23-e43f5f80/README.md) and its exact `source.zip` preserve the full package. This is not a live Claude synchronization.
- Previous snapshot: `claude-design-2026-10-23-265f221a`; [original manifest](SNAPSHOT_MANIFEST.json), [original sync report](DESIGN_SYNC_2026-10-23.md), [original sources](snapshots/2026-10-23-265f221a/README.md), [former active references](snapshots/baseline-ce49fc5/README.md). All are retained. V2 ZIP was not supplied locally; its source CHANGELOG entry is not independent archive evidence.

## Design readiness and implementation are different

25 supplied HTML references are DESIGN READY. Public Journal (list/post/collection), standalone FAQ and Tour are DESIGN IN PROGRESS with no HTML. The For Clients FAQ accordion and AuthorJournal tools are separate READY identities. Every task must identify the exact snapshot and check that exact page status.

Frontend base is `ce49fc5097cdd2f6d999b52d76a45a12448f535d`. Foundations/header/initial Home/registration visual are merged through #53; Design Sync #58 is merged. #54–#57/#59 and backend #63 are still Draft. #59 already refreshes Home against the byte-identical Home reference. No existing branch/state is modified here.

**Client Dashboard remains HOLD** despite DESIGN READY. Registration retains backend-first rollout constraints. All new auth/diary/timed-task/group-preview/legal/crisis/undo behavior requires actual contracts and authorization. See the audit for new-to-import requirements; inherited KAN-163 boundaries are not cleared by readiness.

## Current reference pages

| Exact reference | Source design status |
| --- | --- |
| [Home.dc.html](mockups/Home.dc.html) | DESIGN READY |
| [Signup.dc.html](mockups/Signup.dc.html) | DESIGN READY |
| [Specialist-Profile.dc.html](mockups/Specialist-Profile.dc.html) | DESIGN READY |
| [For-Clients.dc.html](mockups/For-Clients.dc.html) | DESIGN READY |
| [Find-Specialist.dc.html](mockups/Find-Specialist.dc.html) | DESIGN READY |
| [Client-Signup.dc.html](mockups/Client-Signup.dc.html) | DESIGN READY |
| [Client-Cabinet.dc.html](mockups/Client-Cabinet.dc.html) | DESIGN READY |
| [Auth.dc.html](mockups/Auth.dc.html) | DESIGN READY |
| [Client-Pages.dc.html](mockups/Client-Pages.dc.html) | DESIGN READY |
| [Cabinet-Dashboard.dc.html](mockups/Cabinet-Dashboard.dc.html) | DESIGN READY |
| [Cabinet-Drawer.dc.html](mockups/Cabinet-Drawer.dc.html) | DESIGN READY |
| [Sessions.dc.html](mockups/Sessions.dc.html) | DESIGN READY |
| [Clients.dc.html](mockups/Clients.dc.html) | DESIGN READY |
| [Admin.dc.html](mockups/Admin.dc.html) | DESIGN READY |
| [Cabinet-Mobile.dc.html](mockups/Cabinet-Mobile.dc.html) | DESIGN READY |
| [Chat.dc.html](mockups/Chat.dc.html) | DESIGN READY |
| [Inquiries.dc.html](mockups/Inquiries.dc.html) | DESIGN READY |
| [Schedule.dc.html](mockups/Schedule.dc.html) | DESIGN READY |
| [Profile-Edit.dc.html](mockups/Profile-Edit.dc.html) | DESIGN READY |
| [Billing.dc.html](mockups/Billing.dc.html) | DESIGN READY |
| [Settings.dc.html](mockups/Settings.dc.html) | DESIGN READY |
| [Specialist-Tools.dc.html](mockups/Specialist-Tools.dc.html) | DESIGN READY |
| [Guest.dc.html](mockups/Guest.dc.html) | DESIGN READY |
| [Brand.dc.html](mockups/Brand.dc.html) | DESIGN READY |
| [Handoff-Spec.dc.html](mockups/Handoff-Spec.dc.html) | DESIGN READY |
| Журнал (список / допис / добірка) | DESIGN IN PROGRESS |
| FAQ | DESIGN IN PROGRESS |
| Тур | DESIGN IN PROGRESS |

## Safe reference boundary

Source tokens/components/uiVersion/PATCHES/design system and Home/Discovery/Brand/Handoff-Spec are unchanged from the previous export. Production files and assets remain untouched; do not reapply the original copy/install prompts.

Raw HTML contains inline styles, x-dc/sc-* placeholders, inert text/x-dc logic and original external font references. Do not execute or serve prototypes. Active `support.js` / `brand-listen.js` references are intentionally excluded; exact scripts exist only as frozen source evidence inside the versioned handoff and source.zip. No runtime import is added.

Only Clients source lines 85/272 and Sessions line 153 have trailing ASCII whitespace removed in extracted HTML copies, exactly as recorded by source/destination hashes. All original bytes remain in source.zip. CHANGELOG is published byte-identically, including its v3→v2→v1 chronology. Claude version labels do not prove separately available exports.

Canonical safeguards remain: default v1, query → storage → environment precedence, independent storage-failure fallback, successful-navigation reactive synchronization, v2 selector isolation, muted/focus contrast corrections, real tariff/API/permission rules and separate Git/rollout authorization. [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), [integrated TZ](TZ_CODEX.md), [plan](MIGRATION_PLAN_V2.md), [task entry point](CODEX_TASKS.md), [design system](../DESIGN_SYSTEM.md).
