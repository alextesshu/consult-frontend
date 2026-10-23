# Pro Consult UI v2 — current reference index (v5)

Snapshot `claude-design-2026-10-23-7570f1ad`, SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`; imported 2026-10-23. Source archive: `C:/Users/admin/dev/portfolio/consult/design-sources/Модернізація дизайну сайту ProConsult (v5).zip`; 1,474,654 bytes; 62 payload files.

[Start here](START_HERE.md), [manifest](SNAPSHOT_MANIFEST_V5.json), [active pointer](SNAPSHOT_CURRENT.json), [CHANGELOG](CHANGELOG.md), [v5 audit](DESIGN_SYNC_2026-10-23_V5.md), [implementation matrix](IMPLEMENTATION_MATRIX_V5.md), [Jira recommendations](JIRA_ALIGNMENT_V5.md), [validation](DESIGN_SYNC_V5_VALIDATION.md), [exact file inventory](DESIGN_SYNC_V5_FILES.json).

[Exact frozen v5 source](snapshots/2026-10-23-7570f1ad/README.md) includes source.zip. Previous snapshot `claude-design-2026-10-23-e43f5f80`, [v3 manifest](SNAPSHOT_MANIFEST_V3.json), [v3 audit](DESIGN_SYNC_2026-10-23_V3.md), [v3 source](snapshots/2026-10-23-e43f5f80/README.md), original 265f221a sources and all older references remain unchanged. V4 ZIP is absent: only its original CHANGELOG account is available. This is the latest supplied snapshot, not automatically synchronized Claude cloud state.

## Readiness

| Exact reference / identity | Current design status |
| --- | --- |
| [Admin.dc.html](mockups/Admin.dc.html) | DESIGN READY |
| [Auth.dc.html](mockups/Auth.dc.html) | DESIGN READY |
| [Billing.dc.html](mockups/Billing.dc.html) | DESIGN READY |
| [Brand.dc.html](mockups/Brand.dc.html) | DESIGN READY |
| [Cabinet-Dashboard.dc.html](mockups/Cabinet-Dashboard.dc.html) | DESIGN READY |
| [Cabinet-Drawer.dc.html](mockups/Cabinet-Drawer.dc.html) | DESIGN READY |
| [Cabinet-Mobile.dc.html](mockups/Cabinet-Mobile.dc.html) | DESIGN READY |
| [Chat.dc.html](mockups/Chat.dc.html) | DESIGN READY |
| [Client-Cabinet.dc.html](mockups/Client-Cabinet.dc.html) | DESIGN READY |
| [Client-Pages.dc.html](mockups/Client-Pages.dc.html) | DESIGN READY |
| [Client-Signup.dc.html](mockups/Client-Signup.dc.html) | DESIGN READY |
| [Clients.dc.html](mockups/Clients.dc.html) | DESIGN READY |
| [Emails.dc.html](mockups/Emails.dc.html) | DESIGN READY |
| [Find-Specialist.dc.html](mockups/Find-Specialist.dc.html) | DESIGN READY |
| [For-Clients.dc.html](mockups/For-Clients.dc.html) | DESIGN READY |
| [Guest.dc.html](mockups/Guest.dc.html) | DESIGN READY |
| [Handoff-Spec.dc.html](mockups/Handoff-Spec.dc.html) | DESIGN READY |
| [Home.dc.html](mockups/Home.dc.html) | DESIGN READY |
| [Inquiries.dc.html](mockups/Inquiries.dc.html) | DESIGN READY |
| [Profile-Edit.dc.html](mockups/Profile-Edit.dc.html) | DESIGN READY |
| [Public-Content.dc.html](mockups/Public-Content.dc.html) | DESIGN READY |
| [Schedule.dc.html](mockups/Schedule.dc.html) | DESIGN READY |
| [Service-Pages.dc.html](mockups/Service-Pages.dc.html) | DESIGN READY |
| [Session-Pages.dc.html](mockups/Session-Pages.dc.html) | DESIGN READY |
| [Sessions.dc.html](mockups/Sessions.dc.html) | DESIGN READY |
| [Settings.dc.html](mockups/Settings.dc.html) | DESIGN READY |
| [Signup.dc.html](mockups/Signup.dc.html) | DESIGN READY |
| [Specialist-Profile.dc.html](mockups/Specialist-Profile.dc.html) | DESIGN READY |
| [Specialist-Tools.dc.html](mockups/Specialist-Tools.dc.html) | DESIGN READY |
| Support Chat | DESIGN IN PROGRESS |
| Expanded Blog Editor follow-up | DESIGN IN PROGRESS |
| Public Profile follow-up | DESIGN IN PROGRESS |
| Tour | NOT REQUIRED — REDIRECT |

Current Blog Editor 8.6 and Public Profile 2.1 remain READY; their expanded/future versions are separate IN PROGRESS identities. See the audit for source profile-status drift. Client Dashboard remains HOLD regardless of design readiness. For Clients inline FAQ is separate from now-READY standalone FAQ.

All previous 25 HTML files and 19 images are byte-identical to v3 source. New references: Public-Content, Session-Pages, Service-Pages, Emails and legal-texts.json. Source tokens/components/uiVersion/design system/PATCHES/CODEX_TASKS are unchanged. Existing implementation #54–#57/#59 and backend #63 remain Draft without branch/state changes.

## Safe reference boundary

No application source/runtime CSS/assets/config/backend changes. Do not repeat initial handoff installation. Active scripts support.js and brand-listen.js remain excluded; raw versions are retained only as frozen source evidence. External font references and text/x-dc logic are inert references, not dependencies. Service-Pages' legal-texts.json resolves locally; do not replace current legal text with an unverified extract.

Four source trailing-whitespace-only lines across Clients/Sessions/Service-Pages are normalized in extracted copies; original bytes/hashes remain in source.zip. CHANGELOG is byte-identical with v5→v4→v3→v2→v1 chronology. Full source and destination hashes are in the manifest.

[Design system](../DESIGN_SYSTEM.md), [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), [integrated TZ](TZ_CODEX.md), [roadmap](MIGRATION_PLAN_V2.md), [future-sync checklist](DESIGN_SYNC_CHECKLIST.md).
