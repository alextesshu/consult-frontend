# Final integrated registration evidence

Authoritative report: [KAN-159 final integration](../../../KAN_159_FINAL_INTEGRATION.md). Source design/body geometry remain as documented in the earlier P6 report; all screenshots here use the merged fennec Public Mobile shell and Specialist Dashboard dev revision.

Baseline: `c864fcb629a372170c79b8ae33e409c4c9091f78`. Starting registration HEAD: `8f81967a2e5aecdd4e7024edaebc203c5c0b4f4d`. Merge had no conflicts and no manual runtime changes. The manifest inventories the complete final PR delta relative to that dev baseline; imported dev files are not task-specific edits. Previous P6 evidence remains historical at its original commit.

Review [specialist step 2](signup-375-step2.png), [client step 2](signup-client-375-step2.png), [specialist motion](signup-375-motion.webm), [client motion](signup-client-375-motion.webm), [browser matrix](browser-results.json), [auth/history checks](navigation.json) and [V1 parity](v1-pixel-parity.json). All other role/width/state screenshots follow the same naming scheme as the original P6 evidence. No browser-to-real-backend claim: browser APIs are explicit fixtures; fresh isolated Django tests have their own log.

Reproduce from the registration worktree root in Windows PowerShell, using an already installed Playwright module (`PLAYWRIGHT_MODULE` may point to its exact module directory). No new dependency was added.

Create/use a detached checkout at the baseline SHA and make the existing dependencies available there. Candidate server:

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/kan-159/p6/candidate.config.mjs --host localhost --port 5370 --strictPort
```

In another terminal, set `KAN159_BASELINE_ROOT` to the actual detached baseline directory, then:

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/kan-159/integration/baseline.config.mjs --host localhost --port 5371 --strictPort
```

Sequential evidence generation (the parity harness intentionally runs last because it shares screenshot filenames with the full browser harness):

```powershell
node docs/ui-v2/evidence/kan-159/integration/browser.cjs
node docs/ui-v2/evidence/kan-159/integration/keyboard.cjs
node docs/ui-v2/evidence/kan-159/integration/navigation.cjs
node docs/ui-v2/evidence/kan-159/integration/parity.cjs
python docs/ui-v2/evidence/kan-159/integration/verify.py --refresh
```

The 246-test focused command is recorded in focused-vitest.txt. Build/typecheck commands were `npm run build` and `npm run typecheck -- --force`; typecheck was also run independently in the baseline checkout. The nine diagnostics match exactly. Original source rendering and motion timing analysis are retained in the historical P6 evidence and immutable snapshot; runtime code was not rewritten.

The fresh backend run used the retained P6 APIClient harness/settings at exact PR #63 SHA, disposable PostgreSQL 16 on 58504, locmem mail, mocked notification delivery and isolated `--nomigrations` schema sync. Its five cases passed, and the container was removed. No external email or real database was used.
