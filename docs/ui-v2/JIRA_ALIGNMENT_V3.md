# V3 — recommended Jira alignment (no mutations)

All issue descriptions still reference the old 265f221a snapshot when read. Their Jira status was Backlog; that is not implementation or runtime truth. No ticket/comment/transition/duplicate was created.

| Issue | Verified identity | Proposed update for review |
| --- | --- | --- |
| [KAN-153](https://proconsultspace.atlassian.net/browse/KAN-153) | Pro Consult вЂ” UI v2 redesign and Claude Design migration | Set current supplied snapshot/readiness links to v3; retain v1 fallback and separate deployment gates. |
| [KAN-154](https://proconsultspace.atlassian.net/browse/KAN-154) | Claude Design Sync вЂ” canonical reference update | Record PR #58 merged, then this incremental v3 sync; replace stale Draft/#58 description only after review. |
| [KAN-155](https://proconsultspace.atlassian.net/browse/KAN-155) | UI v2 вЂ” refresh homepage against current Claude design | Link Draft #59; Home HTML unchanged in v3; do not restart implementation or equate CI with design/merge approval. |
| [KAN-156](https://proconsultspace.atlassian.net/browse/KAN-156) | UI v2 вЂ” implement For Clients landing page | Mark For-Clients DESIGN READY including its inline FAQ; gate crisis/copy/query handoff; no automatic implementation. |
| [KAN-157](https://proconsultspace.atlassian.net/browse/KAN-157) | UI v2 вЂ” update specialist discovery/search | Find-Specialist unchanged; keep #56; carry KAN-163 search/slot constraints. |
| [KAN-158](https://proconsultspace.atlassian.net/browse/KAN-158) | UI v2 вЂ” reconcile public specialist profile and brand/header | Profile HTML changes only PCListen binding types; next candidate is isolated App public header/footer v2 branding, retaining working links. |
| [KAN-159](https://proconsultspace.atlassian.net/browse/KAN-159) | UI v2 вЂ” registration contract integration | Keep #54/#63 rollout/CI gates; source signup bindings do not change the API; reset confirmation is a separate contract. |
| [KAN-160](https://proconsultspace.atlassian.net/browse/KAN-160) | UI v2 вЂ” client dashboard redesign (HOLD) | Keep HOLD despite READY; record new sidebar/sessions pagination/navigation and Client-Pages/diary dependencies. |
| [KAN-161](https://proconsultspace.atlassian.net/browse/KAN-161) | UI v2 вЂ” specialist cabinet stages from new mockups | Expand scope inventory to READY Auth/Client-Pages/Chat/Inquiries/Schedule/Profile-Edit/Billing/Settings/Tools/Guest, but split stages and backend gates; do not start all Stage 4. |
| [KAN-162](https://proconsultspace.atlassian.net/browse/KAN-162) | UI v2 вЂ” integration acceptance and rollout | Public Journal/FAQ/Tour IN PROGRESS; readiness must gate integration; rollout/default-v2 remains separately approved. |
| [KAN-163](https://proconsultspace.atlassian.net/browse/KAN-163) | Claude UX features вЂ” backend contract and product policy audit | Add only new-to-import auth/reset/session-policy, diary-sharing, timed-task, guest-group-preview, legal/crisis and real-undo deltas; do not repeat closed capability analysis. |
