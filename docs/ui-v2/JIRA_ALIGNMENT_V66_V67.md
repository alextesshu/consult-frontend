# Jira alignment and release gates - KAN-154

Evidence observed 2026-10-24 at frontend dev `e63b1ca1a941f56c6578c32a7b964a133404bbb6`. [Machine PR evidence](PR_EVIDENCE_V66_V67.json). Task identities supplied by the user; Jira state was not fetched or modified. Merged is repository integration evidence, not deployment or Jira Done.

| Jira | Verified delivery | Proposed alignment, no Jira write |
| --- | --- | --- |
| KAN-155 | Home #52/#59 MERGED | Retain desktop acceptance; only P1 mobile follow-up |
| KAN-156 | For Clients #62 MERGED | Retain five demo cycles/real-query safeguards; scoped P3 mobile delta |
| KAN-157 | Discovery #56 MERGED | Retain source motion/search contracts; P4 sheet/compact cards follow-up with filter/count gates |
| KAN-158 | Approved public brand #61 MERGED; profile #55 OPEN Draft | Keep brand override; reconcile new desktop/mobile profile in existing delivery; separate OG decision |
| KAN-159 | Signup #53 MERGED; completion #54 OPEN Draft; backend #63 OPEN Draft | No duplicate registration task; retain backend-first contract, P6 mobile mapping; onboarding separately gated |
| KAN-160 | Dashboard #57 OPEN Draft | HOLD unchanged despite new Client-Mobile/READY references |
| KAN-161 | Existing legacy cabinet/auth/tools/notifications APIs; no full v6.6 delivery established | Separate small visual slices and contract tasks; do not report all legacy pages implemented in v2 |
| KAN-162 | Foundations #49/#50 and selected public pages merged; no default-v2 rollout established | Coverage/acceptance/release gating only; v1 remains default |

## Exact frontend PR observations

| PR | State | HEAD | Merge commit |
| --- | --- | --- | --- |
| [#49](https://github.com/alextesshu/consult-frontend/pull/49) | MERGED | `02ed9d644cd892ae3d6b68448096bff47793c884` | `7a101daede5c0f69fe806d2814e7175273c2bb7a` |
| [#50](https://github.com/alextesshu/consult-frontend/pull/50) | MERGED | `762ac856339df9badb8220884f688ab310bf91f0` | `b7f1119edbe8c9926202038df47a3bba47aab9a5` |
| [#51](https://github.com/alextesshu/consult-frontend/pull/51) | MERGED | `60106c9ddf4641fbc38904461ffb3f34511f6a54` | `b8fc5a4935889d4cc7eb6711c87cc8251fb42a30` |
| [#52](https://github.com/alextesshu/consult-frontend/pull/52) | MERGED | `4e00cc2a6cea17ff1e637e3396c813554aad15ea` | `7bbb89fd517ba5df507b1c624206617f959177de` |
| [#53](https://github.com/alextesshu/consult-frontend/pull/53) | MERGED | `ed413cf091fd9fdb573ab4e25bb4c12d3d0afb51` | `e4b903e523836f44c2ac79c0403621382cf92d55` |
| [#54](https://github.com/alextesshu/consult-frontend/pull/54) | OPEN Draft | `eeafc58381858771ab4bf1ec12e85dfb873e4c15` | None |
| [#55](https://github.com/alextesshu/consult-frontend/pull/55) | OPEN Draft | `bc1a2225ce91732d1e723a7ef8491e5ce5313c35` | None |
| [#56](https://github.com/alextesshu/consult-frontend/pull/56) | MERGED | `bbbc02991204ad92db29d95b211078bcb44a53a9` | `e63b1ca1a941f56c6578c32a7b964a133404bbb6` |
| [#57](https://github.com/alextesshu/consult-frontend/pull/57) | OPEN Draft | `b9305a60a4ff33cc85022ee081cb9144e9502547` | None |
| [#59](https://github.com/alextesshu/consult-frontend/pull/59) | MERGED | `b7d4529e4a38a27f2a7722e1a54ee4b2f4d14e3b` | `d666a6cfec4417517ef4f472ea27300cdf81b033` |
| [#61](https://github.com/alextesshu/consult-frontend/pull/61) | MERGED | `e8e58a8c3c038647f3bc7e54daf37e727458aec3` | `d47bae52562f13a80cb5118bd68823b3bf1a5abf` |
| [#62](https://github.com/alextesshu/consult-frontend/pull/62) | MERGED | `2c6a78f75b5a7aca0e506697df13ab9024636664` | `019501924cc3f17e23fdfb73450004be72fb7a28` |

Backend #63: OPEN Draft, HEAD `812bba14ab553df447574df5d91d34aa0824a75c`; registration scope only, untouched. Other PR heads/branches are not modified by this sync. Local frontend dev remains `965f5e728233777abb4ef9f0c7bf4e4cbaf57ee7`.

## All 20 unresolved source backend decisions

Source [BACKEND_DECISIONS](snapshots/2026-10-23-4ff7cedd/handoff/BACKEND_DECISIONS.md) has 20 blank decision cells; no approvals inferred. Source rows 5/8/10 contain truncated wording, so cross-read full TZ and actual contracts. Items 5/6 are one coordinated support capability, not two duplicate implementations. The source wording sometimes understates existing APIs: reconciliation below is not permission to implement.

| Source # | Area | Classification | Reconciled boundary |
| --- | --- | --- | --- |
| 1 | Profile conditions/consent | CONTRACT GATE | Existing setting_accepted is not proof of versioned specialist consent; verify server fact/version and existing flow. |
| 2 | Magic login/auth errors | CONTRACT GATE | No new magic-link endpoint/session policy assumed; verify real blocked/unverified codes. |
| 3 | My specialists | CONTRACT GATE | Related-specialist API exists; map eligibility/DTO and current routing, not a duplicate endpoint task. Client HOLD. |
| 4 | Crisis copy | CONTRACT GATE | Recheck approved configurable contacts before release; source numbers/hours not verified here. No operational helpline claim. |
| 5 | Support user thread | CONTRACT GATE | SupportThread/SupportMessage lifecycle and email copy require separate approved backend scope. |
| 6 | Support staff queue | CONTRACT GATE | Staff-only assignment, note visibility, first response metrics and status transitions; never expose internal notes. |
| 7 | Timed tasks | CONTRACT GATE | client_id/session_id/due/source/auto-generation and reversible moves need contract audit; retain status mode until supported. |
| 8 | Expanded blog | CONTRACT GATE | Featured, cover, slug and collections/order already represented in DTOs. scheduled_at/SEO/publication queue must be verified. |
| 9 | Public group invite | CONTRACT GATE | Retain existing unauthenticated login redirect until approved public safe DTO; do not expose raw tokens/meeting data. |
| 10 | Client session actions | CONTRACT GATE | Actual server cancellation/reschedule/canJoinMeeting/payment/recovery rules; no fixed 24h or simulated undo. Client HOLD. |
| 11 | Guest history transfer | CONTRACT GATE | Verify account-invite history semantics/role/expiry; no promise from prototype copy. Client HOLD. |
| 12 | 404 routing | CONTRACT GATE | Wildcard currently redirects; true 404 plus existing profile aliases needs separately authorized routing change. |
| 13 | OG rendering | CONTRACT GATE | Separate server metadata/render/storage/cache/updated_at invalidation, hidden noindex and non-JS bots decision. |
| 14 | Profile view event | CONTRACT GATE | No-cookie/dedup/bot exclusion requires privacy and measurement contract, not invented frontend counters. |
| 15 | Acquisition source | CONTRACT GATE | Existing attribution is not proof of proposed complete search/share/blog/direct mapping; verify consent/ref/UTM behavior. |
| 16 | Retention funnel | CONTRACT GATE | Verify person-based request-to-first-session-to-3+ aggregation; never derive fabricated conversion rates. |
| 17 | Onboarding persistence | CONTRACT GATE | Existing onboarding-state/readiness API; wizard resume/checklist hidden/manual publish must match actual eligibility. Publication and search visibility remain distinct. |
| 18 | Notification feed | CONTRACT GATE | Feed/read/read-all exist. Audit event types, pagination/filter/count/read semantics, 90-day retention and badge vs bell; new preferences not automatically supported. |
| 19 | Telegram notifications | CONTRACT GATE | Separate approved bot linking/token/chat_id/queue/stop/preference/privacy scope. Existing task code elsewhere is not dev acceptance; do not duplicate without reconciliation. |
| 20 | Professional taxonomy | CONTRACT GATE | psychiatrist to psychoanalyst must be reconciled with real enum, data migration and compatibility; do not silently rename API values. |

## Inherited and release gates

- KAN-160/diary/privacy/read markers/new client navigation remain DEFERRED/HOLD; legal deletion/private-note/published-material boundaries remain authoritative.
- Preserve real prices/limits/trial/grace/entitlements, actual token expiry and confirmed delivery/idempotency/suppression. [V5 provider/email audit](DESIGN_SYNC_2026-10-23_V5.md) remains applicable; v6.7 copy does not fix provider transport gaps.
- No global fixed cancellation window, automatic booking/confirmation, fake nearest slot or payment-driven meeting access. Do not publish mailbox availability/SLA or unverified crisis copy.
- Runtime route/query/storage/env/permissions and approved fennec geometry take precedence. Missing source links/sample guest route stay evidence only.
- Implementation release acceptance needs actual loading/empty/error, keyboard/focus, reduced motion/cleanup/visibility, responsive states, v1 parity and relevant automated checks. Fixtures and synthetic visibility do not certify backend workflows/OS throttling.
- Default-v2 rollout, staging/production acceptance, Ready/merge/deployment each need separate authorization. This docs Draft PR supplies none. No manual CI dispatch/rerun.
