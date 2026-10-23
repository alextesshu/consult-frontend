# Claude Design Sync v3 — 2026-10-23

## Identity and authority

- Snapshot: `claude-design-2026-10-23-e43f5f80`.
- Exact archive: `C:/Users/admin/dev/portfolio/consult/design-sources/Модернізація дизайну сайту ProConsult (v3).zip`.
- SHA-256: `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`; 1,432,398 bytes; 57 entries; import date 2026-10-23. Import date is not a verified cloud last-update timestamp.
- Frontend base: `ce49fc5097cdd2f6d999b52d76a45a12448f535d`, after merged PR #58. Local dev is untouched at `965f5e728233777abb4ef9f0c7bf4e4cbaf57ee7`.
- Previous imported snapshot: `claude-design-2026-10-23-265f221a`, SHA-256 `265f221a95ac9fc521a33138b06376b51ad4a822c79fd05e30f7303ef6b10948`.
- V2 archive is absent from the specified design-sources folder. V3-versus-v2 comparison was **not performed**. The original CHANGELOG's v2 release entry is preserved as a Claude claim, not a separately verified ZIP. Features new relative to current Git references may span Claude's source v1/v2/v3 releases; do not attribute all of them specifically to the v3 status-only release.
- [Current manifest](SNAPSHOT_MANIFEST_V3.json), [exact source package](snapshots/2026-10-23-e43f5f80/README.md), [previous manifest unchanged](SNAPSHOT_MANIFEST.json), [former active references](snapshots/baseline-ce49fc5/README.md).

Confirmed product/security/privacy and actual backend contracts precede runtime architecture, then selected source specification/status, page HTML and old snapshots. Source tokens > TZ > HTML applies to presentation only. No design skill/heuristic substitutes for Claude; accessibility/security/contract issues are findings.

## Readiness and chronology

The complete [CHANGELOG](CHANGELOG.md) is byte-identical to the archive and preserves original v3→v2→v1 order (all source entries dated 2026-10-23). The [source START_HERE](snapshots/2026-10-23-e43f5f80/handoff/START_HERE.md) §4 and CHANGELOG agree: **25 DESIGN READY mockups**, and **3 DESIGN IN PROGRESS identities** (Public Journal list/post/collection, standalone FAQ, Tour) without files. No CLAUDE.md is present; its absence is explicit, not an invented source.

Full status table: [readiness JSON](DESIGN_READINESS_V3.json) and [reference index](README.md). All prototype data-props/state alternatives are recorded without executing code in [state inventory](MOCKUP_STATES_V3.json).

For Clients is DESIGN READY, including its FAQ accordion. That is not the unfinished standalone FaqView. Specialist-Tools' author blog is also separate from unfinished public Journal views. Client diary is DESIGN READY as a visual reference but backend/security blocked; its specialist-side receiver panel is explicitly a later design round. Client Dashboard remains **HOLD** despite READY.

## Checksum and semantic comparison

Of the original 15 active HTML references, 4 are byte-identical (Home, Find-Specialist, Brand, Handoff-Spec), 11 change and 10 new ones expand coverage to 25. All 19 supplied reference images/brand assets are byte-identical to current references. Source DESIGN_SYSTEM, PATCHES, tokens-v2.css, components-v2.css and uiVersion.ts are byte-identical to the previous source snapshot; runtime hardening is not replaced.

| Existing changed reference | Exact delta against ce49fc5 reference |
| --- | --- |
| Admin | Close-button role/labels; Escape listener/cleanup for open panels. No new API proof. |
| Cabinet-Dashboard | Задачі → Завдання label only. |
| Cabinet-Drawer | role=dialog/aria-modal, close role/label; capture-phase Escape and cleanup. |
| Cabinet-Mobile | Tasks label only. |
| Client-Cabinet | Sticky sidebar/explicit display; sessions anchor, load-more state and profile link; revised sidebar/mobile navigation and content-centered toast. Old pending request/reminder/diary/action gaps remain. |
| Client-Signup | Numeric PCListen size/rings/duration bindings become template values. |
| Clients | Close role/label, Escape cleanup and Tasks label. |
| For-Clients | Crisis wording prioritizes emergency help and removes around-the-clock service claim; remaining contact/service claims are not verified. |
| Sessions | Dialog name, close role/label, Escape/cleanup and Tasks label. |
| Signup | Numeric PCListen bindings only. |
| Specialist-Profile | Numeric PCListen bindings only. |

New-to-import references: Auth, Client-Pages, Chat, Inquiries, Schedule, Profile-Edit, Billing, Settings, Specialist-Tools and Guest. Their exact states, layout, copy/interaction/dependency differences, actual Vue coverage and next actions are in the **34-row [implementation matrix](IMPLEMENTATION_MATRIX_V3.md)**. Session detail and client detail are embedded panels; calendar coverage is shared between Schedule and Sessions, not a fabricated standalone mockup.

Source spec changes: START_HERE/CHANGELOG added; CODEX_TASKS now delegates ingestion to START_HERE; README expands mapping; MIGRATION_PLAN adds stages 5a/5b–9; TZ adds shared dialog/Escape/44px/focus rules and the new screen specifications. Do not apply its still-present generic “remaining pages without mockups” footer to explicit new coverage.

## Open PR compatibility — read-only metadata and local source review

| PR | Verified head SHA | State | V3 assessment / action |
| --- | --- | --- | --- |
| [#54](https://github.com/alextesshu/consult-frontend/pull/54) | `eeafc58381858771ab4bf1ec12e85dfb873e4c15` | open / Draft=True | Signup bindings change only; preserve backend #63 dependency, legacy contracts, canonical enum, invitation and redirect boundaries. Review optional approaches/success copy separately. |
| [#55](https://github.com/alextesshu/consult-frontend/pull/55) | `bc1a2225ce91732d1e723a7ef8491e5ce5313c35` | open / Draft=True | Profile prototype binding correction only; existing request-first visual proposal remains, with inherited SLA/cancellation/payment/brand gates. Do not overwrite its branch. |
| [#56](https://github.com/alextesshu/consult-frontend/pull/56) | `efdcbea4ce8d572bde020fa7260480d033397046` | open / Draft=True | Find-Specialist reference unchanged. Prior explicit-submit/DTO-preserving proposal is not acceptance of automatic search, semantic labels or nearest-slot contracts. |
| [#57](https://github.com/alextesshu/consult-frontend/pull/57) | `b9305a60a4ff33cc85022ee081cb9144e9502547` | open / Draft=True | Client-Cabinet changed navigation/pagination/sidebar/toast; earlier hero/material/status foundation does not cover updated UX. Remains HOLD; no merge recommendation. |
| [#59](https://github.com/alextesshu/consult-frontend/pull/59) | `2e15e011dc8a41ca1056d9a52daef14498ef9596` | open / Draft=True | Home HTML byte-identical. Current refresh at this head has local/CI evidence for prior snapshot; no new Home redesign or cherry-pick is needed in this sync. Retains /specialists until KAN-156 and static page marks; global brand/header/footer remain follow-ups. |
| [#63](https://github.com/alextesshu/consult-backend/pull/63) | `812bba14ab553df447574df5d91d34aa0824a75c` | open / Draft=True | Backend registration contract remains independent and Draft. It does not enable password-reset changes, magic login, diary, timed tasks or guest group preview. |

No PR branch/state, merge, rebase, close or Ready operation occurred. CI success is not proof of v3 UX conformity. #59's previously observed automatic CI PASS is historical implementation evidence, not a rerun in this documentation sync.

## New-to-import backend / product deltas (carry forward KAN-163)

Backend evidence is pinned to `9f11568bf94ba0988ad1121e0c540e507a9e9e3f`; this is static source review, not production/API acceptance. The twelve earlier KAN-163 findings remain in the previous audit/context and are not re-audited here. New or materially expanded requirements:

| Requirement | Classification | Evidence / missing behavior / implication |
| --- | --- | --- |
| Auth magic/email-link login | UNSUPPORTED | No corresponding route in backend core/urls.py. Source TZ 5a explicitly marks new endpoints. Preserve current login; no fake successful send/exchange. |
| Remember-me/session persistence and reduced auth error states | PRODUCT DECISION REQUIRED | Source TZ lines 246–252 / Auth prototype. Frontend src/stores/auth.ts:89 removes legacy stored tokens; no role cue may assign roles or change safe redirects. Do not infer a localStorage-token scheme or collapse server security states. Token lifetimes, resend limits and cross-device logout claims require actual contract verification. |
| Single-field password reset | PARTIAL | Existing POST /api/auth/password-reset/confirm/ requires uid, token, new_password and new_password_confirm: backend core/serializers.py:93–104; routes core/urls.py:59–60. Signup #63 does not change reset. Do not remove confirmation/payload or invent new strength/validation rules in a visual task. |
| Client diary + session sharing/admin/backup claims | UNSUPPORTED / PRODUCT DECISION REQUIRED | Source TZ 5b and Client-Pages:diary propose new client CRUD/shared specialist reads. Existing sessions/api_views.py:2862/2983 private SessionNote/ClientJournal are specialist-only, not this diary. Admin/backup exclusions need a threat model, consent/retention design and legal review, not a visual promise. |
| Timed task board/automatic suggestions | PARTIAL | Backend sessions/models.py:601 already has related_client/related_session and source_type; serializers.py:284–348 exposes related_client_id/related_session_id. Source request to “add client_id/session_id” is inaccurate as a blanket claim. Due/bucket/default time view/source=auto and post-completion generation are not established. Map existing identifiers; do not add duplicate relations or fabricate tasks. |
| My specialists | PARTIAL | GET /api/client/specialists/ already exists (booking/urls.py:533, clients/api_views.py:93–94). Current frontend router/index.ts:335 redirects /client/specialists to public discovery. List presentation/routing/current-versus-past/action eligibility need DTO mapping; do not invent a new list API. |
| Guest group preview before login | UNSUPPORTED | Only group-invites/<token>/join/ is registered at backend booking/urls.py:496; source TZ Guest explicitly identifies missing public preview. Keep existing auth/redirect and token privacy; proposed endpoint wording is a source requirement, not an implemented API. |
| New guest proposal confirmation / payments / join timing | PARTIAL | Existing token accept/join/payment DTO flows are reusable; explicit selected-option then confirmation is a future UI behavior task. Preserve server state/error/can_join decisions, expiry and one-shot acceptance. Do not hard-code universal ten-minute access or sent-email guarantees. |
| Material grouping/read indicators and profile/feedback/group-event copy | PARTIAL / PRODUCT DECISION REQUIRED | Existing /api/client/materials/ remains published-only/owned; backend clients/services.py:2702/2743. New read persistence/aggregate counts must be mapped rather than inferred. Account deletion/record retention wording, anonymous/external-review consent and event visibility/recording require current contracts/legal review. |
| Crisis configuration, now also Chat | PRODUCT DECISION REQUIRED | Source TZ Chat requires configurable contacts and itself records conflicting provider information; For-Clients HTML wording changes. VITE_CRISIS_LINES is not present in current frontend. Source claims are unverified; no numbers/hours are endorsed by this sync. No emergency-content publication or new config is implemented. |
| Billing/settings/undo and autosave | PARTIAL / PRODUCT DECISION REQUIRED | Keep real plans/entitlements/trial/grace/manual billing, payment_instructions and linked notify_session_reminders_email capability. Prototype +0…+6 is not a universal API limit. Archive/delete/payment-method/slot/review/publication undo needs real inverse or explicitly delayed mutation, failure/race/reload acceptance; source state snapshots are not rollback APIs. |

## Findings / source conflicts

- **P2 — destructive source instructions:** START_HERE §1 says replace runtime/public brand files and docs wholesale, discard old versions; that conflicts with this task and implemented foundations. Exact source retained; canonical entry points explicitly override it. No such replacement is performed.
- **P2 — accessibility:** added role=button spans remain without native keyboard semantics/tabindex; close controls still 32/34/36px despite TZ's new 44px requirement. role=dialog alone is not focus trap/accessible naming/return focus. Preserve source; require implementation accessibility acceptance instead of copying prototype handlers. Existing soft-text and radius conflicts from the previous sync remain, since DS/tokens/old affected HTML are unchanged.
- **P2 — security/contract:** remember-me, reset confirmation, diary sharing, task model names and guest preview cannot be implemented literally. See the delta table; no API or authorization is invented.
- **P3 — source map/menu drift:** source TZ specifies 14 specialist menu entries including Group events; older Cabinet-Dashboard/Clients/Sessions arrays still contain 13. Exact current text spec takes precedence for future scoped visual mapping; routes/permissions still require verification. No global navigation change occurs now.
- **P3 — stale source claims:** README names Handoff-Spec at project root (actual ZIP path is handoff/mockups); mentions legacy brand assets/archived variants absent from v3 ZIP. MIGRATION_PLAN retains a “without mockups” footer and numbering collision between default rollout Stage 5 and auth/client 5a/5b. Source originals stay unchanged; canonical pointers distinguish these. No CLAUDE.md and no separate v2 archive were found.
- **P3 — source chronology scope:** the v3 CHANGELOG latest entry lists readiness/changelog only, while comparison to the repository also includes earlier newly imported coverage. Do not rewrite Claude history or imply separate v2 validation.

## Recommended Jira updates and implementation order

The [Jira alignment matrix](JIRA_ALIGNMENT_V3.md) contains exact recommendations for Epic KAN-153 and KAN-154–163. Their fetched status was Backlog and descriptions reference 265f221a; Jira is not technical/runtime truth. No issue was changed or duplicated.

[Integrated roadmap](MIGRATION_PLAN_V2.md): review this sync → **KAN-158 public header/footer v2 brand visual delta** → contract-gated KAN-156 → reassess #56 search behavior separately → retain #54/#63 registration gates → small READY cabinet/auth/client/tool/guest stages after mapping → integration/rollout only by separate command. KAN-160 stays HOLD; unfinished public Journal/FAQ/Tour stay blocked.

**Exact next eligible development candidate:** KAN-158, v2-only public header/footer branding in App.vue with separately named v2 assets and focused App/CSS tests. Home and Brand references are READY and unchanged; this avoids HomeView owned by #59 and PublicProfile owned by #55, requires no new backend contract and retains all current destinations/authenticated/minimal shells. Do not overwrite v1 logos, add `/for-clients` yet, or start broad Stage 4. That future task must approve its exact file scope; this sync implements nothing.

## Import and validation boundaries

Safe extraction validated all ZIP entries before writing: no traversal, absolute/drive path, symlink/special file, duplicate/case alias or escaping destination. Original ZIP unchanged. Exact copy source.zip preserves all original payload bytes/names, including scripts. Extracted Clients lines 85/272 and Sessions line 153 have trailing ASCII whitespace removed solely for ordinary Git diff validation; all hashes/normalizations are explicit. CHANGELOG chronology/copy is unmodified.

Active references intentionally omit support.js/brand-listen.js; raw scripts are retained only in the frozen snapshot. No prototype was executed, CDN fetched or dependency installed. Relative image/page paths stay intact. Historical active references are retained at baseline-ce49fc5; existing prior snapshots/manifest/audit stay unchanged.

Executed validation results and exact file inventory are recorded after the final audit in [validation](DESIGN_SYNC_V3_VALIDATION.md) and [changed-file inventory](DESIGN_SYNC_V3_FILES.json). Application tests, typecheck, build and browser acceptance are not run for this documentation/reference-only sync; no runtime conformance is claimed.
