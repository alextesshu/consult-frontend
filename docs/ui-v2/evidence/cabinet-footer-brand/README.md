# UI v2 specialist cabinet footer branding

Independent PR from base `633ad808fd271015eb3655ce81832243350b7324`; it does not
depend on Header 07 and changes no header typography.

Only the specialist UI v2 `/cabinet*` footer replaces the historical PNG with
the existing approved compact horizontal `proconsult-fennec-header.svg` lockup.
That asset's historical name does not imply using the new Header07 uppercase
Manrope wordmark. Its original vector symbol and outlined Pro Consult wordmark
are unchanged. Existing cabinet sizing remains30px.

Legal, support, privacy controls, mobile tabbar/safe-area clearance, client
footer and UI v1 behavior are retained. No asset replacement, CSS, router, API,
auth, dependency, favicon or design-snapshot change is needed.

Validation: focused App119 PASS; full Vitest2318 PASS; production build PASS;
TypeScript9 existing baseline diagnostics, zero new; `git diff --check` PASS.
Synthetic Chromium at375/390/768/1280/1440 verifies the v2 lockup, legal links
and no overflow. All30 UI v1 header/footer PNG comparisons against unchanged
dev were exact matches. See `acceptance.json` and the375/1280 screenshots.

Detailed local evidence: `_preservation/header07-implementation-20261106T230315Z`
outside the repositories. Real signed-in staging visual acceptance remains
pending. No real account, backend, production, deployment or mutation was used.
