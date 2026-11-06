# KAN-158 Phase 2 / PR D: specialist summary limit

Base: `origin/dev` at `041a705199bcc3aa9c4eff9a4f2efa8e71930642`.
Branch: `feat/kan-158-summary-160`, isolated `_kan158_summary_160` worktree.

## Scope and contract

This is the explicitly approved product limit for the shared v1/v2 editor,
not a public-profile redesign. No design snapshot, public rendering, booking,
backend, router, shell, or other profile-field behavior is changed.

- Count Unicode code points, consistent with the Django string-length limit.
  Whitespace and combining characters count; no trimming or normalization.
- New/changed summaries over 160 cannot save. The editor retains the full input,
  shows the count/error, and focuses the field after a rejected save.
- The counter and live notice are associated with the textarea; `aria-invalid`
  reflects validation. No native maxlength that silently truncates pasted input.
- Compare exact text with the last successfully loaded/saved dirty snapshot.
  Unchanged legacy descriptions above 160 are allowed, with an explicit notice.
- **Unchanged legacy text is omitted from the partial PATCH**, so saving another
  field cannot rewrite it through backend whitespace normalization. This is an
  intentional payload-omission safeguard, not a claim that the legacy value is
  retransmitted. Changed valid text is sent exactly as entered.
- A successful save replaces the comparison baseline. Reintroducing the old long
  text after shortening is a new edit and fails validation.
- Backend `max_length=240` stays unchanged. Other API clients can still submit
  161–240 characters; 160 is currently enforced by this editor only. Existing
  server normalization of newly submitted text is outside this frontend PR.

## Files

- `src/views/TherapistProfileView.vue`: local validation, accessible counter/notice,
  save guard and summary-only payload handling.
- `src/views/TherapistProfileView.spec.ts`: boundary/legacy/Unicode regression tests
  and updated expectation that valid summary whitespace is sent unchanged.
- This evidence folder: browser harness, results and 12 field screenshots.

## Browser acceptance

[Harness](browser.cjs), [results](browser.json). Chromium, 375/1280px, UI v1/v2:
all four combinations PASS, no document overflow or page errors.

- 161 characters: retained, invalid, no PATCH, focus returns to textarea.
- 0/159/160: one PATCH per save; exact raw summary in payload.
- 240-character legacy including leading/trailing whitespace: change another
  field; PATCH omits summary; loaded text remains exact after refresh.
- Edit legacy to 239: blocked; shorten to 160: accepted.

Screenshots per UI/width: `normal-*`, `invalid-*`, `legacy-*`.

These are **synthetic browser fixtures**, not real Django E2E or proof of database
mutation. The fixture preserves omitted fields on partial updates. Backend model
and serializer were inspected read-only; no backend tests or servers were run.
No real credentials or private data are used; external requests are blocked.

Reproduce with the installed Playwright package path in the harness and a local
Vite origin (default `http://localhost:5460`) configured for
`VITE_API_BASE_URL=http://localhost:8460/api` (intercepted; no server required):

```powershell
node docs/ui-v2/evidence/kan-158/summary-160/browser.cjs
```

## Verification

- Focused profile Vitest: **115 PASS**.
- Final full Vitest: **130 files / 2007 PASS**, 342.10 seconds.
- Production build: **PASS**, existing chunk-size warning only.
- Typecheck: **9 baseline diagnostics, zero new**, complete output identical to
  the pre-change base log. Typecheck exits 2; it is not reported as a clean PASS.
- `git diff --check`: **PASS**.

```powershell
node node_modules/vitest/vitest.mjs run src/views/TherapistProfileView.spec.ts
npm run test:run -- --maxWorkers=2 --minWorkers=1
npm run build
npx vue-tsc -b --force
git diff --check
```

Public rendering and unrelated v1/v2 runtime files remain byte-identical to base.
No V1 pixel-parity claim is made for this intentionally changed shared editor.
Claude's PR B worktree is separate and was not edited by this task.
No merge, Ready, deployment or Jira mutation.
