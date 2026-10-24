# KAN-158 request panel scroll correction

Existing [Draft PR #55](https://github.com/alextesshu/consult-frontend/pull/55), branch `feat/ui-v2-stage-2-1-public-profile`, starting HEAD `5b294accb50d874a013c4f7f1cb13abe8e84f341`. Source remains `claude-design-2026-10-23-4ff7cedd`, archive v6.6 / contents v6.7, SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.

## Root cause

The desktop request action correctly changed the existing guest form state, but its inline presentation retained the old modal's `height:100dvh`, wrapper overflow:auto, content overflow:hidden and body overflow:auto. At1440x900, the sidebar was786px high while its nested modal wrapper was900px high with1295px content. Wheel/focus could select different scroll owners. The inherited sticky submit also covered the consent checkbox, intercepting a real mouse click. There was no panel-local positioning on opening/reopening.

Native focus/Tab scrolling traverses scroll ancestors and can move the document even when the sidebar is sticky. Existing scrollIntoView calls belong to other profile navigation/rules paths; the guest CTA itself did not call scrollIntoView. Playwright locator clicks additionally scroll ancestors before the click, so the final acceptance uses physical pointer clicks for the request flow and records documentY independently.

Claude's [desktop reference](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html) intentionally specifies sticky top96px, viewport−112px height cap, overflow-y:auto and overscroll containment. Those rules are preserved.

## Correction

- V2 inline wrapper/content/body have natural height and visible overflow. Submit is in normal form flow. Desktop sidebar remains the single scroll owner; mobile native dialog remains the single owner with the nested sidebar explicitly overflow:visible.
- A post-render Vue watcher focuses the desktop form region with preventScroll and resets only sidebar.scrollTop. Closing/reopening and viewport/version state transitions are handled without timers or document scrolling.
- A small presentation helper reveals the focused field's entire label/error group using sidebar geometry and scrollTop. Programmatic validation/offer focus uses preventScroll. New generic form errors are revealed after render; typing and topic selection do not reset positioning.
- Interior desktop Tab/Shift+Tab uses the same local focus helper, respects disabled/hidden/inert controls and native radio-group tab stops. First/last control exits remain normal document navigation; there is no desktop focus trap. Mobile retains its native dialog focus containment and original pre-render opening watcher. A reduced-motion race found during acceptance was corrected by keeping mobile and desktop watchers separate.
- Booking validation decisions, payloads, permissions, endpoints and request lifecycle are unchanged. One required-field focus call and offer-edit focus call delegate to the presentation helper; these are the only adjustments within existing action functions.

## Validation and limits

Actual local profile: `http://localhost:5173/s/specialist?ui=v2`, Django `http://127.0.0.1:8000`. No CORS/backend change. Four direct real GET acceptance runs at1280x900,1440x900,375x677,768x900 use actual profile/availability. Before/V1/reduced-motion cases replay actual public DTOs in memory, distinct from direct smoke. A pinned temporary baseline server reads original files from Git; no other worktree is changed.

Browser checks cover physical CTA clicks, wheel, complete Tab navigation through the enabled submit, typing, topic selection, reachable consent, missing-name/contact errors, two close/reopen cycles and unchanged documentY. Mobile also checks native scroll lock, focus containment/return, Escape/backdrop. Reduced motion is checked at1440 and375. Synthetic Chromium wheel exercises the wheel/trackpad event path; physical OS trackpad hardware is not certified.

Empty required-field validation is exercised via the real UI; it returns before any API mutation. An additional browser safety guard rejects any attempted guest POST and the final result records zero attempts. No real request, email, booking or PENDING outcome is claimed; local SMTP is not isolated, as documented in the [previous acceptance](KAN_158_LOCAL_POLISH.md).

- Focused Vitest:159/159 PASS across four files.
- Production build PASS; existing chunk warning. Typecheck: nine exact baseline diagnostics, zero new; not a clean typecheck pass.
- V1 full-page parity: zero changed pixels at all four widths.
- Scope, UTF-8/links, source integrity, business-handler normalization and exact inventory checked by the evidence validator; git diff --check PASS.
- Automatic CI terminal result is recorded in Draft PR #55 and final delivery response; no manual rerun.

```powershell
npm run test:run -- src/lib/profilePanelScroll.spec.ts src/views/PublicProfileView.spec.ts src/components/public-profile/PublicProfileOverlay.spec.ts src/styles/publicProfileV2.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck -- --force
python -X utf8 docs/ui-v2/evidence/kan-158/request-scroll/validate_delivery.py
git diff --check
```

[Browser results](evidence/kan-158/request-scroll/browser-results.json), [V1 parity](evidence/kan-158/request-scroll/v1-parity.json), [exact file inventory](evidence/kan-158/request-scroll/files.json), [focused tests](evidence/kan-158/request-scroll/focused-tests.txt), [build](evidence/kan-158/request-scroll/build.txt), [typecheck comparison](evidence/kan-158/request-scroll/typecheck-comparison.json), [business handler comparison](evidence/kan-158/request-scroll/business-handler-parity.json).

Screenshots: [before desktop](evidence/kan-158/request-scroll/before-1440.png), [after desktop](evidence/kan-158/request-scroll/after-1440-open.png), [desktop validation](evidence/kan-158/request-scroll/after-1440-validation.png), [desktop bottom/consent/submit](evidence/kan-158/request-scroll/after-1440-bottom.png), [mobile](evidence/kan-158/request-scroll/after-375-open.png), [mobile bottom](evidence/kan-158/request-scroll/after-375-bottom.png).

Exact source/test files: `src/views/PublicProfileView.vue`, `src/views/PublicProfileView.spec.ts`, `src/styles/publicProfileV2.css`, `src/lib/profilePanelScroll.ts`, `src/lib/profilePanelScroll.spec.ts`. Other files are this report and its evidence directory. Prior evidence remains historical at its original commit.

UI v1 default, fennec, shared shell, Home/For Clients/Discovery and Claude Code's Public Mobile worktree are unchanged. Backend PR #63 unchanged; KAN-160 HOLD. Existing OG/private-preview/anonymous-inquiry/consent gates remain. Stop at READY FOR VISUAL RE-REVIEW, Draft only; no merge/deployment/Jira mutation.
