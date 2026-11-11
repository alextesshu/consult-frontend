# Incremental Claude Design Sync v5 — 2026-10-23

## Provenance / scope

- Current supplied snapshot: `claude-design-2026-10-23-7570f1ad`; SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`.
- Exact original source: `C:/Users/admin/dev/portfolio/consult/design-sources/Модернізація дизайну сайту ProConsult (v5).zip`; 1,474,654 bytes; 62 payload files.
- Previous imported snapshot: `claude-design-2026-10-23-e43f5f80`, SHA-256 `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`. V3 snapshot/manifest/audit/matrices and all older history remain unchanged.
- Feature pre-sync HEAD: `1003d2ee2d708108b6788d486866b3a4c47f0274`; verified origin/dev: `ce49fc5097cdd2f6d999b52d76a45a12448f535d`. Existing branch `docs/ui-v2-claude-design-sync-v3`, existing Draft PR #60 only.
- Actual registered worktree is `C:/Users/admin/dev/portfolio/consult/_ui_v2_design_sync_v3`. The supplied sibling path does not exist; branch, Git registry and expected HEAD establish the existing worktree identity. Local dev and other worktrees are untouched.
- No v4 ZIP was present. V3→v5 comparison is executed; v4-only archive comparison is NOT PERFORMED. CHANGELOG's v4 claims are preserved, not independently reconstructed. No CLAUDE.md is supplied.

[Active pointer](SNAPSHOT_CURRENT.json), [v5 manifest](SNAPSHOT_MANIFEST_V5.json), [frozen source](snapshots/2026-10-23-7570f1ad/README.md), [CHANGELOG](CHANGELOG.md), [file inventory](DESIGN_SYNC_V5_FILES.json), [validation](DESIGN_SYNC_V5_VALIDATION.md).

## Verified incremental delta

Exactly five existing source documents change: CHANGELOG, START_HERE, README, TZ_CODEX and MIGRATION_PLAN_V2. Five new payloads: Public-Content.dc.html, Session-Pages.dc.html, Service-Pages.dc.html, Emails.dc.html and legal-texts.json. No payload is removed. All 25 existing HTML references and 19 images/brand assets are byte-identical to v3 source. Source tokens/components/uiVersion/design system/PATCHES/CODEX_TASKS are unchanged; no runtime installation or redesign is performed.

| New reference / specification | Exact coverage and intended delta | Implementation gate |
| --- | --- | --- |
| Public-Content / 10.1–10.2 | Journal list/post/collection, author/featured/categories/cover/read-time; standalone client/specialist FAQ, local question+answer search and accordion | Existing content/visibility/SEO contracts; no mock posts/authors. Reconcile FAQ product/privacy/crisis copy first. |
| Session-Pages / 10.3–10.5 | Client session status hero/move/cancel/recovery; specialist external detail/manual payment/invite controls; account invite role/expiry/success states | Keep actual statuses, canJoinMeeting, recovery/roles/token privacy. No universal cancellation deadline, synthetic undo or assumed guest-history transfer. |
| Service-Pages + legal-texts.json / 10.6–10.7 | Legal documents/TOC/print/support cards; 403 and proposed real 404 | Preserve actual legal copy/dates and permission/alias behavior; prototype extract is not legal approval. Wildcard behavior is a separate runtime/routing task. |
| Emails / Stage 11 | Ten customer/specialist email scenarios and common HTML shell; plain text stays | Separately scoped backend/provider/rendering task, not implemented by this frontend reference sync. |
| Psychological Support TZ | Reuse Find-Specialist with existing discoveryLanding heading/SEO and proposed active topics | Current direction filter exists; topic-chip mapping is not established. No new route, semantic matching or crisis service inferred. |
| Support copy | support@proconsult.space in FAQ/support/email references | Claude-approved copy only; mailbox configuration, delivery, monitoring, hours and response commitments NOT VERIFIED. |

[44-row implementation matrix](IMPLEMENTATION_MATRIX_V5.md) carries forward unchanged v3 evidence and reassesses only affected identities; [state inventory](MOCKUP_STATES_V5.json) parses data-props without executing scripts.

## Readiness / chronology / source conflict

CHANGELOG original chronology is v5→v4→v3→v2→v1 (all source dates 2026-10-23), with source prose/history unmodified. [Readiness JSON](DESIGN_READINESS_V5.json) resolves **29 DESIGN READY HTML files**, **3 DESIGN IN PROGRESS future identities** and **Tour NOT REQUIRED — REDIRECT**.

- Public Journal/list/post/collection and standalone FAQ move from v3 IN PROGRESS to READY via Public-Content.
- Session-Pages, Service-Pages and Emails are new READY references. Psychological Support inherits existing READY discovery presentation, with no separate HTML.
- Support Chat is IN PROGRESS and needs a backend support model; existing ordinary Chat is still READY.
- Expanded Blog Editor is IN PROGRESS; current Specialist-Tools:blog (8.6) remains READY.
- Public Profile follow-up is IN PROGRESS; current Specialist-Profile (2.1) and PR #55 remain READY. **P3 source-status discrepancy:** START_HERE follow-up row says DESIGN READY (possible future update); CHANGELOG status table and explicit v5 entry say IN PROGRESS for the future follow-up. Preserve both source files verbatim, gate the future delta, retain current READY reference. This does not authorize or invent a new follow-up design.
- Tour is no longer an unfinished standalone page. Current src/router/index.ts:72 already redirects /tour to /#how-it-works. No new page/routing work here.
- Client Dashboard remains **HOLD**, regardless of READY status.

Raw START_HERE §1 still asks to replace runtime/docs/public assets and discard history. That is explicitly overridden by current task/canonical boundaries. Source generic “remaining pages without mockups” footer is stale for explicit Stage 10/11 coverage. Source claim “all router pages have a mockup” is not a verified route-by-route acceptance result.

## Stage 11 email scenarios and actual contract gaps

Static backend evidence is pinned to existing `origin/dev` **9f11568bf94ba0988ad1121e0c540e507a9e9e3f**. This is targeted source review, not a live send, mailbox verification, backend implementation or repeated full KAN-163 audit.

| Emails mail state / audience | Existing delivery evidence / future mapping | Required preservation or missing acceptance |
| --- | --- | --- |
| verify / all new accounts | core/services/account_email_verification.py:81–95, dispatch:101 | Token fragment/verification gates; source 24-hour note conflicts with actual 60 minutes (constant:19). Use real expiry, not prototype text. |
| reset / account owner | core/services/password_reset.py:33–40; config/settings.py:433 | UID/token flow and current password/reset validation; timeout currently one hour, configurable. |
| emailchange / account owner | core/services/account_email_change.py:85–90 | Keep new-address confirmation, current subject/expiry/safety text and old-address security behavior. |
| guest / guest client | Existing external guest-session invite flow; map booking services/notification DTO before HTML work | Real per-recipient token, date/timezone, payment instructions and can_join; no sample meeting URLs/names/dates. |
| proposal / guest client | booking/services_public_guest_booking_time_proposal_notifications.py:102 confirmed sender | Existing expiry/selection/one-shot/token/idempotency contract; no promise that a prototype-selected slot is booked. |
| reminder / client | Existing reminder behavior carried forward from KAN-163; precise producer/cadence/preference mapping still required | No new scheduling/preference feature inferred; send current actual meeting/state links under existing privacy rules. |
| request / specialist | booking/services_public_guest_request_notifications.py:192 confirmed sender | Existing recipient eligibility/idempotency and request privacy. Demo contact/topic rows and reply-within-a-day wording require product/privacy approval. |
| group / invited client | booking/email_utils.py:16–29 | Existing /invite token route/role/consent; no public group preview or automatic acceptance. |
| pro / specialist | booking/services_manual_billing_payment_notifications.py:28–67 | Actual manual confirmation/paid_through/entitlements. Demo Pro “up to 25” must not replace current plan limits (20, expandable to 26). |
| welcome / specialist (client welcome remains distinct) | core/services/onboarding_email.py:116–168, specialist_onboarding_email_delivery.py:110–114 | Preserve actual audience/body and onboarding suppression/webhook/idempotency/version semantics. No copy promising profile readiness in 15 minutes or mandatory photo without product evidence. |

**PARTIAL — HTML transport:** core/email.py:208–255 already supports optional html_message in send_mail_async and its guarded helper. Source's blanket “all emails are plain text” is not a correct transport-capability statement. ConfirmedEmailProvider.send (42–51), send_mail_confirmed (189–205), SMTP confirmed path and Resend payload (104–110: text only) do not accept HTML. OnboardingEmailMessage (110–114) contains subject/body/from_email/recipient, no html field. Future Stage 11 must propagate HTML through provider/message paths without changing confirmed delivery, failure classification, retries, idempotency keys, suppression or provider_message_id semantics. Do not bypass confirmed delivery via async.

**PRODUCT DECISION / SECURITY:** approved support copy does not configure a mailbox, sender hello@proconsult.space, domain authentication, replies or monitoring. Real absolute brand/action URLs, escaping/untrusted names/quotes, token leakage avoidance, optional versus mandatory notification preferences and working plaintext fallback need a future email task. The HTML viewer uses x-dc/flex/font CDN and href="#" demos; it is a design reference, not a production table-email template. Source TZ requires 600px table layout, inline CSS, no external fonts, preheader, button+fallback link and plain text retained. Gmail/Outlook/Apple Mail rendering and real sends remain unperformed.

## Other new backend/product boundaries

- **PARTIAL — Psychological Support:** src/router/index.ts:393–398 and src/lib/specialistDiscoveryLanding.ts:3 already define /specialists/psychological-support; PublicTherapistsView.vue:152–178 uses landing heading/SEO; useSpecialistDiscovery.ts:232–246 selects psychological_support direction. Source preselected topics are not the same contract as direction; preserve existing filters and verify mapping. No new mental-health/support-service guarantee.
- **PARTIAL / PRODUCT DECISION — FAQ copy:** Public-Content prototype says guest users can move/cancel through invite, nearest slots are searched, only specialist sees written data, diary is private and crisis support is around the clock. These are inherited unsupported/partial claims exposed by a new READY page, not newly implemented capabilities. Reuse KAN-163/KAN-140 privacy/search/reschedule/crisis gates; source approval does not override them. Do not silently publish or redesign the copy here.
- **PARTIAL — session detail:** no fixed 24-hour cancellation rule, no local-state undo as API proof, no payment flag determining meeting access. Account-invite history benefits need contract evidence; retain token/role/expiry guards and private-note exclusions. Client Dashboard HOLD remains.
- **PARTIAL / PRODUCT DECISION — legal/errors:** legal-texts.json is an imported source extract, not proof of parity with current legal documents or approved effective dates. Current support view already names support@proconsult.space at src/views/SupportAndDataRequestsView.vue:114; still no operational mailbox evidence. Existing wildcard src/router/index.ts:423 redirects home; real 404 requires future authorized routing change. Prototype 404 “Home” points to For-Clients, so preserve actual working destinations in implementation.
- **UNSUPPORTED / IN PROGRESS — support service:** no support-chat API/model is established by this sync; source explicitly says backend work needed. Ordinary ChatView does not imply a staffed support channel.

## Existing PR compatibility and Jira impact

Read-only PR metadata rechecked for this sync; all remain OPEN/Draft with unchanged heads:

| PR | Verified head | V5 impact |
| --- | --- | --- |
| Frontend #54 | eeafc58381858771ab4bf1ec12e85dfb873e4c15 | Signup references unchanged; keep registration/backend-first gates. |
| Frontend #55 | bc1a2225ce91732d1e723a7ef8491e5ce5313c35 | Current profile HTML unchanged and READY; future profile follow-up is blocked, not a reason to reset #55. |
| Frontend #56 | efdcbea4ce8d572bde020fa7260480d033397046 | Find-Specialist unchanged; dedicated Psychological Support landing reuse/topic mapping follow-up, no edits to #56. |
| Frontend #57 | b9305a60a4ff33cc85022ee081cb9144e9502547 | Client-Cabinet unchanged; new Session-Pages are separately scoped; Dashboard stays HOLD. |
| Frontend #59 | 2e15e011dc8a41ca1056d9a52daef14498ef9596 | Home unchanged; no duplicate refresh/reset. |
| Backend #63 | 812bba14ab553df447574df5d91d34aa0824a75c | Registration only; no Stage 11 provider/support implementation inferred. |

[Jira alignment](JIRA_ALIGNMENT_V5.md) proposes updates for KAN-153–163 without new tickets, comments or transitions. Prior Jira observations are carried forward, not presented as newly fetched state. KAN-155/159 unchanged; KAN-157 landing mapping; KAN-158 current profile versus future delta; KAN-160 HOLD; KAN-161 Support Chat/expanded editor gates; KAN-162 Stage 10 READY coverage/Tour redirect and Stage 11 ownership; KAN-163 only new contract gaps.

## Roadmap / next eligible task

[Integrated roadmap](MIGRATION_PLAN_V2.md): finish/review existing #60 sync → **KAN-158 public header/footer v2 branding** → contract-gated KAN-156 / KAN-157 follow-ups → small READY Stage 10 public/FAQ/legal scopes after their copy/contract checks, plus previously READY cabinet slices → separate backend Stage 11 after delivery-policy/contract approval. Keep #54/#63 gates, Dashboard HOLD and future support/editor/profile deltas blocked. No automatic Stage 4, email implementation or default-v2 rollout.

Next candidate stays exact and independent: App.vue public header/footer v2 brand presentation, separately named v2 assets and focused App/CSS tests; exclude HomeView/#59, profile/#55, routes/auth/minimal shells and v1 production logos. New v5 references do not change this independent scope or authorize it now.

## Validation / limits

See [executed checks](DESIGN_SYNC_V5_VALIDATION.md) and [exact inventory](DESIGN_SYNC_V5_FILES.json). Original external ZIP is unchanged; exact source.zip retains all bytes. Extracted Clients lines 85/272, Sessions 153 and Service-Pages 57 remove trailing ASCII whitespace only; all source/destination hashes are recorded. No prototype executed or dependency/CDN fetched. Historical snapshots and v3 UTF-8 correction remain intact.

No application tests/typecheck/build/browser matrix or live email/API/mailbox acceptance is performed for reference-only changes. No runtime behavior change, backend edit, other PR branch mutation, Jira write, Ready transition, merge or deployment. Update existing Draft #60 only; no manual CI dispatch/rerun.
