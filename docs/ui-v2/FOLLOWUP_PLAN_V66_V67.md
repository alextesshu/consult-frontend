# Recommended follow-up breakdown

Current [matrix](IMPLEMENTATION_MATRIX_V66_V67.md), [gates](JIRA_ALIGNMENT_V66_V67.md) and [source audit](DESIGN_SYNC_2026-10-24_V66_V67.md). This is a proposal, not new Jira tasks or implementation approval. Reuse existing KAN ownership and open Draft PRs; search actual work before creating any new issue. No duplicate desktop Home/For Clients/Discovery, existing inquiry/feed/read APIs or collections work.

| Order | Existing owner / proposed scope | Classification | Preconditions / acceptance |
| --- | --- | --- | --- |
| P0 | KAN-154 reference sync | VISUAL UPDATE reference only | Review this single docs Draft PR; immutable source, hashes, links, matrix, no runtime |
| P1 | KAN-158 shared public mobile header/menu P2 | VISUAL UPDATE / MOTION UPDATE | Preserve approved fennec/navigation/minimal shells; full-screen focus/escape/body lock and responsive tests |
| P1 | KAN-155 mobile P1 | VISUAL UPDATE / MOTION UPDATE | 72px mark, full-width actions, horizontal snap journey/dots; retain desktop state machine and v1; separate small follow-up |
| P1 | KAN-156 mobile P3 | VISUAL UPDATE | Query/CTA stacking/topic strip; retain manual stop, real-input priority, all five motion demos and q/request_group |
| P1 | KAN-157 mobile P4 | VISUAL UPDATE / MOTION UPDATE / CONTRACT GATE | Sheet72%, count, compact64 cards; map supported filters, live N and availability; no invented API fields |
| P2 | KAN-158 profile #55 + updated desktop/mobile references | VISUAL UPDATE / MOTION UPDATE / NEW FEATURE | Reconcile existing Draft scope before additions; real offers/inquiry/contact/consent/preview; mobile86% sheet, sharing/About accessibility |
| P2 | KAN-158 OG Share-Card | NEW FEATURE / CONTRACT GATE | Separate server metadata/render/cache decision; no frontend-only promise of messenger previews |
| P2 | KAN-159 #54 P6 registration mobile | VISUAL UPDATE / CONTRACT GATE | Preserve #63/backend-first registration/verification/invitation/attribution; map actual role steps |
| P2 | KAN-161 auth P5 and cabinet/mobile slices | VISUAL UPDATE / MOTION UPDATE | Real DTO/state/permission mapping per page; magic login separately blocked; native gestures need explicit keyboard alternatives |
| P2 | KAN-161 blog and analytics visual slices | VISUAL UPDATE / MOTION UPDATE | Reuse actual collections/featured/cover/slug; verify scheduling/SEO, period comparison, funnel/source aggregates separately |
| P2 | KAN-159/KAN-161 onboarding | NEW FEATURE / CONTRACT GATE | Save/resume and manual publish/readiness/checklist mapping; no registration contract or search-visibility change by prototype |
| P2 | KAN-161 notification bell/settings/list | ALREADY IMPLEMENTED APIs / VISUAL UPDATE / CONTRACT GATE | Reuse feed/read/read-all; verify full list/filter/retention/event/preferences; N4 overrides Settings presentation |
| P3 | KAN-161 support and Telegram | NEW FEATURE / CONTRACT GATE | Separate backend/product/privacy contracts; reconcile existing related tasks/branches before proposing new issue |
| HOLD | KAN-160 client/mobile/diary | DEFERRED | Explicit UX/product/backend approval; READY reference does not release HOLD |
| P3 | KAN-162 journal/FAQ/legal/error/guest/email slices | VISUAL UPDATE / CONTRACT GATE | Retain legal/copy/routes and provider/privacy gates; backend email separate repository task |
| Last | KAN-162 default-v2 rollout | DEFERRED | Explicit rollout approval plus completed acceptance/release gates; v1 remains default |

For each approved implementation: fetch current dev, inspect matrix/affected PRs, use a separate worktree, cite exact snapshot/full checksum, define files and motion/state acceptance before editing. Do not rewrite desktop pages simply because mobile references are new. No automated issue creation, Ready, merge, deployment or CI rerun follows this plan.
