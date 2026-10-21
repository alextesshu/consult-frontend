# UI v2 Stage 0B - implemented local infrastructure

Status: locally implemented, awaiting acceptance. Default remains v1.
See [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md). No commit, push, PR,
page migration, or deployment is authorized by this document.

## Bootstrap and CSS

`src/main.ts` imports `style.css`, `styles/tokens-v2.css`, then
`styles/components-v2.css`. `applyUiVersion()` runs before `createApp()` and the
existing verification-token URL sanitizer. The router is still imported after
that sanitizer. A successful `router.afterEach` reapplies the UI selection; failed
or aborted navigation is ignored. Routes, API, permissions and Pinia are unchanged.
The existing legacy-token cleanup action is guarded at its bootstrap call site so
denied storage cannot prevent cookie-based session restore. No stored token is used.

All v2 selector branches, including media queries and pseudo-elements, require
`html[data-ui="v2"]`. V1 CSS is unchanged. Token bridging and base v2 body,
heading/focus/selection/reduced-motion rules are intentional; page geometry is
not redesigned. Generic anchor-color overrides were removed so legacy links
and button-links keep their own colors. V2 inputs have explicit focus-visible
outlines after their base outline reset. Placeholders, kickers and inactive
navigation use existing `--pc-text-muted` for contrast.

## Selection and storage

- Only exact `v1` and `v2` are accepted. The first `ui` query value takes priority.
- A valid query is applied and persisted to `pc.ui` when possible.
- Read and write failures (including the storage accessor) are caught independently.
- A failed query write is remembered in this document ahead of stale storage.
- Otherwise valid storage wins over exact `VITE_UI_V2 === 'true'`, then v1.
- A denied read can reuse the last applied version; no storage failure blocks bootstrap.
- Reactive consumers through `isUiV2()` and `html[data-ui]` are updated together.
- Memory is not durable across refresh: without query or accessible persistence,
  a fresh document uses the build default (v1 unless separately changed).
- Query changes, redirects and browser Back/Forward are handled through successful
  router navigation; no history monkey-patching or route changes are introduced.

## Fonts and environment

`index.html` declares preconnects and one Onest 400/500/600 stylesheet with
`display=swap`, outside the managed metadata block. The resource is available in
both modes; Onest is applied only by v2 CSS. Existing Inter is retained for v1.
The app does not await font loading; system fonts remain a readable fallback.
`.env.example` has `VITE_UI_V2=`. This is a build-time default; runtime environment
changes alone do not update the bundle. No deployment configuration is changed.

## Verification and rollback

Focused tests: `src/lib/uiVersion.spec.ts`, `src/main.spec.ts`,
`src/styles/uiV2.spec.ts`, `src/__tests__/app.spec.ts`. Run `npm run typecheck`,
`npm run build`, and `git diff --check`. CSS contract tests do not substitute for
browser cascade/keyboard verification. Report executed browser checks separately.
Use 375x677, 768, 1280, and 1440px, default/v1/v2, refresh/SPA/history,
storage failure, focus, reduced motion, overflow and font fallback.

Rollback: open the existing route with `?ui=v1`; this overrides storage/env even
when persistence is denied. Existing v1 markup and CSS are retained. Source
mockups remain documentation-only; `support.js` and mockup CDN execution stay excluded.
