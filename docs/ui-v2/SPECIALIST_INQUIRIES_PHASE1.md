# Specialist inquiries — UI v2 Phase 1

2026-10-24. **READY FOR VISUAL REVIEW**, one Draft PR to dev. Branch `feat/ui-v2-specialist-inquiries`, isolated worktree `_specialist_inquiries_v2`. Base at task start: `b2d3e3eb90562b000a6ffd2e35eeda8302d003b8`, containing #65/#66/#67. No KAN-159, Claude worktree, backend, guest workflow, API DTO/client, router, auth or shared-shell source changes.

During implementation branding PR #68 merged; target dev became `6f91363f6fbed0f63d6fb181a6aa45ecffb3ba00`. No automatic merge/rebase was performed. Its two runtime files were read through a temporary Vite git-show overlay for separate prospective integration checks. They were never copied into this worktree. Final PR CI is recorded separately for the pushed SHA; the workflow uses the normal pull_request checkout.

## Design provenance and fidelity

Canonical snapshot: `claude-design-2026-10-23-4ff7cedd` (archive v6.6, contents v6.7). Original ZIP SHA-256 reverified: `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.

Sources: [Inquiries desktop/responsive HTML](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Inquiries.dc.html), [Cabinet-Mobile-2 M9/M10](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Cabinet-Mobile-2.dc.html), current design system/matrix/audit and original TZ. Both references are DESIGN READY; contract boundaries take precedence over demo content. Original HTML/CSS/JS was inspected and rendered in a separate context. Source files were not edited; the M10 sample contact is masked in its screenshot.

| Source feature | Phase 1 result | Classification |
| --- | --- | --- |
| Desktop list/detail | Existing shell hosts a 280–360px list and minmax(0,1fr) detail pane; independent scroll regions; <1024px switches to one panel. Onest, navy/cream palette, 16px cards, two-line previews and colored status banners follow source. | IMPLEMENTED |
| M9 list | 26px mobile title, horizontally scrollable 36px filter chips, 14px/two-line previews, unread dot/orange border, actual counts. Initial compact route shows the list unless thread_id is supplied. | IMPLEMENTED |
| M10 thread | Back target 44px, heading, status, message bubbles, auto-growing composer (internal scroll capped at 200px). Existing registered-client card CTA is retained on a second mobile header row. | IMPLEMENTED WITH SHELL BOUNDARY |
| Native accessible controls | Real buttons/tabs, arrow/Home/End filter navigation, focus to selected thread heading, Back restores list trigger/filter fallback; deep-link/history handling uses only existing thread_id. | IMPLEMENTED |
| Motion | Row max-height 400ms +350ms delay; opacity 300ms +300ms delay; toast 350ms cubic-bezier(.2,.8,.2,1), 3200ms dwell. Actual server success drives transitions; no simulated 600ms API delay. Leaving rows are disabled/aria-hidden, removed after the transition, and all timers/listeners are cleaned up. | IMPLEMENTED |
| Reduced motion | No CSS animation/transition, no leaving-row delay; media changes clear pending removal timers. Normal/reduced browser evidence retained. | IMPLEMENTED |
| First-question sample preview | Actual last_message_preview is used, without claiming it is the first question. | CONTRACT PRESERVED |
| Quick replies / 600 counter | Neither unapproved templates nor a fabricated limit are rendered. Long input remains supported. | DEFERRED |
| Email/contact claims | No email field, delivery promise or sample contacts in runtime. Notification toast confirms only actual reply API success. | CONTRACT PRESERVED |
| Close/spam/propose-session | No new mutations, IDs or guest/session workflow introduced. | CONTRACT GATE |
| Full-screen M10 / hidden tabbar | Existing global header/tabbar/footer and content insets remain. The local thread fills available content; it does not reproduce a standalone 375px prototype phone frame. | SHARED-SHELL INTEGRATION GATE |
| Navigation badge | Cabinet Shell “Запити” still targets guest booking requests and keeps its existing badge. This page remains /cabinet/inquiries. | PRODUCT BOUNDARY PRESERVED |

No full-page pixel parity against the prototype is claimed: shared-shell geometry, unsupported actions, server copy/state, real preview and the existing client-card action are deliberate boundaries. Original captures: [desktop](evidence/specialist-inquiries-phase1/claude-desktop-1440.png), [responsive list](evidence/specialist-inquiries-phase1/claude-list-375.png), [M9](evidence/specialist-inquiries-phase1/claude-m9.png), [M10 with contact masked](evidence/specialist-inquiries-phase1/claude-m10.png).

## Existing contracts and reliability

Only existing GET /inquiries/threads/, GET /inquiries/messages/?thread_id=…&limit=50 and POST /inquiries/messages/send/ are used. No DTO changes. Terminal status takes precedence in grouping; OPEN threads use actual can_specialist_reply. Replies reload server state, including CLOSED after the last allowed exchange rather than forcing a local waiting state. Active-client chat link targets /cabinet/chat without passing an inquiry ID as a chat ID. Registered client-card routing uses client_id only.

- Synchronous in-flight guard prevents repeated submits before/after DOM updates. Pending send captures its thread ID and text.
- Drafts and send errors stay in per-thread component memory. Sending A cannot clear/edit the draft for B; B can be edited while A is pending, while a second send waits for completion.
- Generations and active-ID checks reject obsolete thread/message responses. Disposal invalidates async work and removes media/timer callbacks.
- Successful message loading reconciles unread to zero; failed reads preserve unread. Late responses from a previously selected thread cannot replace the visible conversation.
- Inquiry reason_code mapping remains authoritative; guest API code is not used as an inquiry status or client-resolution instruction.
- When send succeeds but state refresh fails, the affected thread requires refresh before another submit; no duplicate POST is automatically retried. Real list/message errors have retry controls.
- Compact mode returns to the list when the selected thread disappears, and exposes list permission errors instead of leaving an empty detail pane. Repeated row-removal timers are replaced safely.
- The reduced-motion toast override uses the same selector specificity as its animation rule; browser evidence confirms animation is disabled immediately.
- No message/contact text is sent to analytics or placed in URL/storage. The existing thread_id query is the only navigation identifier added.

Backend ownership/permission checks remain unchanged. This does not add server-side cross-tab exactly-once guarantees or inquiry-to-guest conversion. KAN-143 remains in the separate guest workflow.

## Validation

- Focused Vitest: **20/20 PASS**, including all six original view cases, twelve new view/reliability cases and two CSS contract cases.
- Full local frontend Vitest: **1955/1955 PASS**, 129 files, after final runtime changes. Existing unrelated jsdom navigation/router warnings are retained in the log.
- Production build: PASS, existing large-chunk warning remains.
- Forced typecheck: **9 unchanged baseline diagnostics, 0 new**; advisory command is nonzero. Baseline was captured before editing at exact task base.
- Chromium: **375,390,640,768,1023,1024,1280,1440px**, all without document overflow. List/detail breakpoint, filters/keyboard, heading/Back focus, history, unread, sending/double-submit, retained B/A drafts, privacy and retained shell tabbar verified. Additional empty/list loading/list error/message error/send error/stale switching/CLOSED/removed selection/403 refresh cases passed. No page JavaScript errors.
- Motion: actual CSS row transitions report 400/350 and 300/300 duration/delay, toast 350ms; reduced mode reports no row/toast animations. [Normal-motion recording](evidence/specialist-inquiries-phase1/motion-1280.webm).
- V1 template (apart from v-else) and scoped stylesheet are unchanged. **All eight baseline/candidate screenshot pairs have 0 changed pixels.** Separate incoming-branding overlay comparison also has **0 changed pixels on all eight widths**.
- git diff --check, UTF-8, local links, strict changed-file scope and checksum inventory verified before commit.

Evidence: [browser results](evidence/specialist-inquiries-phase1/browser-results.json), [V1 pixels](evidence/specialist-inquiries-phase1/v1-parity.json), [source isolation](evidence/specialist-inquiries-phase1/v1-source-isolation.json), [incoming #68 checks](evidence/specialist-inquiries-phase1/incoming-results.json), [incoming V1 pixels](evidence/specialist-inquiries-phase1/incoming-v1-parity.json), [typecheck](evidence/specialist-inquiries-phase1/typecheck-comparison.json), [full tests](evidence/specialist-inquiries-phase1/full-tests.txt).

All browser API responses are **explicit intercepted fixtures**, with synthetic non-personal names/messages. Incoming checks are a read-only prospective App/CSS overlay, not an actual local merge or backend E2E. No private production data, raw tokens or email delivery are involved. Screen-reader semantics are checked through native roles/DOM; no manual assistive-device or real phone keyboard acceptance is claimed.

## Scope and delivery

Runtime: src/views/SpecialistInquiriesView.vue and new src/styles/inquiriesV2.css. Tests: src/views/SpecialistInquiriesView.spec.ts and new src/styles/inquiriesV2.spec.ts. Documentation: this report and [exact file/checksum manifest](evidence/specialist-inquiries-phase1/manifest.json).

Commands:

```powershell
npm run test:run -- src/views/SpecialistInquiriesView.spec.ts src/styles/inquiriesV2.spec.ts --maxWorkers=1 --minWorkers=1
npm run test:run -- --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck -- --force
git diff --check
```

Remaining decisions: unified inbox/navigation destination and badge semantics; full-screen mobile shell support; approved reply templates; any new message limit; inquiry email delivery/contact exposure; explicit close/spam/session-proposal contracts. These are excluded, not simulated. UI v1 remains default; KAN-160 remains HOLD. Keep Draft; no Jira, Ready transition, merge, deployment or backend edits.

Reproduction and complete screenshot naming are in the [evidence README](evidence/specialist-inquiries-phase1/README.md). Owned previews are stopped at delivery; user services and unrelated worktrees remain untouched.
