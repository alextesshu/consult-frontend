# KAN-159 P6 evidence

See [delivery report](../../../KAN_159_REGISTRATION_P6.md). Browser requests use intercepted fixtures; isolated Django APIClient acceptance is separate. Screenshots deliberately retain the older branch's untouched shared shell, including its pre-fennec branding. Integration with approved dev/PR #64 branding remains a gate.

## Review entry points

- [Original P6](claude-p6-original.png), [original desktop Signup](claude-desktop-signup.png), [source provenance](source-capture.json).
- [Specialist P6](signup-375-step2.png), [client email step](signup-client-375-step2.png), [specialist final step](signup-375-account.png), [client final step](signup-client-375-account.png).
- [Specialist motion](signup-375-motion.webm), [client motion](signup-client-375-motion.webm). Videos include normal motion; still-image matrix predominantly uses reduced motion.
- Other stills follow `{signup|signup-client}-{375|390|640|768|1280}-{name|step2|account|loading|server-error}.png`. Desktop client is intentionally one form and has no step2 capture.
- [Browser results](browser-results.json), [keyboard visibility](keyboard-visibility.json), [pixel differences](v1-pixel-parity.json), [V1 style/geometry hashes](v1-dom-styles.json).
- [261 focused tests](focused-vitest.txt), [build](build.txt), [typecheck comparison](typecheck-comparison.json), [isolated backend 5 tests](backend-integration.txt), [manifest](manifest.json).

V1 final capture has identical element geometry/computed styles in all ten pairs. Pixel differences range from 0 to 97 edge pixels per image, maximum channel delta 2/255. These are retained rather than represented as perfect zero-pixel equality. Earlier ordinary-GPU captures also varied; the final parity script uses software rendering/color flags consistently for both versions.

## Reproduction — Windows PowerShell

Run from the registration worktree root. Use an already available Playwright module; no dependency was added. Set `PLAYWRIGHT_MODULE` to its actual installed module path if it is not resolvable as `playwright-core`.

In separate terminals, start the two isolated previews (do not replace a user's server on 5173):

```powershell
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/kan-159/p6/candidate.config.mjs --host localhost --port 5370 --strictPort
node node_modules/vite/bin/vite.js --config docs/ui-v2/evidence/kan-159/p6/baseline.config.mjs --host localhost --port 5371 --strictPort
```

Then run sequentially, because the full harness and parity harness both write V1 screenshots:

```powershell
node docs/ui-v2/evidence/kan-159/p6/browser.cjs
node docs/ui-v2/evidence/kan-159/p6/keyboard.cjs
node docs/ui-v2/evidence/kan-159/p6/parity.cjs
python docs/ui-v2/evidence/kan-159/p6/verify.py --refresh
```

The baseline Vite load hook reads only the two original registration views from exact starting HEAD; it does not checkout/reset files. Unchanged shared files are used by both previews. `source.cjs` separately captures the immutable snapshot served read-only at localhost:5173; it expects the exact canonical source path recorded in source-capture.json. It requires original support scripts/fonts to render, and never rewrites source HTML.

Frontend verification commands:

```powershell
npm run test:run -- src/views/SignupView.spec.ts src/views/ClientSignupView.spec.ts src/components/RegistrationWizardV2.spec.ts src/styles/signupV2.spec.ts src/styles/registrationP6.spec.ts src/lib/api.registration.spec.ts src/stores/auth.spec.ts src/views/LoginView.spec.ts src/lib/registrationAttribution.spec.ts src/lib/clientAcquisitionAttribution.spec.ts src/lib/uiVersion.spec.ts src/__tests__/app.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
npm run typecheck
git diff --check
```

Typecheck is advisory/nonzero with exactly the nine retained baseline diagnostics. Build retains the existing chunk-size warning.

## Isolated backend acceptance

Source: approved local backend PR #63 HEAD `812bba14ab553df447574df5d91d34aa0824a75c`, not backend dev and not a browser fixture. Harness: [test_contract.py](test_contract.py), [settings](kan159_test_settings.py). The settings contain only disposable test values, never production credentials.

Execution used an owned `postgres:16` container named `proconsult-kan159-p6-contract`, localhost port 58504, tmpfs storage and disposable database/user `registration_contract`. `btree_gist` was created in its template1 before schema sync. Mail was locmem; welcome/founder notification functions were mocked. With the evidence directory on PYTHONPATH and backend source as cwd:

```powershell
python -m pytest <absolute-evidence-path>/test_contract.py --ds=kan159_test_settings --nomigrations --create-db -o addopts= -o cache_dir=<temporary-cache-path> -q
```

Expected recorded result: 5 passed; one existing Google Python-version warning. No production migration proof, external delivery or full browser-to-backend acceptance is implied. The owned test container and preview servers are stopped after acceptance. Existing user servers are preserved.
