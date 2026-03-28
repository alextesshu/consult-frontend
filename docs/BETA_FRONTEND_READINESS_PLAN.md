# Frontend Beta Readiness Plan (Pro Consult)

Last updated: 2026-03-27  
Status: planning only (no code changes requested)

## 1. Executive Recommendation
- For beta phase, frontend should clearly separate **current beta access state** from **future commercial tariffs**.
- Do not present beta users as if they already purchased a paid plan.
- Phase-1 focus: transparent status communication, predictable billing-page behavior, and copy polish for trust.
- Keep UI changes minimal and additive: banner/status blocks + disabled/informational plan actions where needed.

## 2. Beta Access UI/State Implementation Plan

### 2.1 Core UI principles
- Always show a truthful access label first: `Beta access` / `PRO beta access` / `Free during beta`.
- Treat tariffs (`START / PRO / LEADER`) as a **future model** during beta, not as proof of purchase.
- Do not force tariff selection in onboarding during beta.
- Keep specialist-first tone; avoid sales pressure.

### 2.2 Recommended phase-1 surfaces
Must-have:
- Cabinet top banner (global for authenticated specialist cabinet).
- Billing / plans page (`/cabinet/billing`) access summary block.
- Account/settings summary card (settings hub or profile summary block).

Nice-to-have:
- Lightweight inline badge in header/settings menu.
- Contextual tooltip/FAQ link near billing labels.

### 2.3 Suggested status text model (frontend display)
- `Beta access`
- `PRO beta access`
- `Free during beta`
- Optional: `Beta access until <date>` when expiry is known.

### 2.4 Expiry behavior
- Expiry known:
  - Show exact date in billing summary + cabinet banner.
  - Show neutral reminder text (`Ми нагадаємо про подальші кроки до завершення бета-доступу.`).
- Expiry unknown/not finalized:
  - Show `Термін бета-доступу уточнюється`.
  - Do not show fake countdown or assumptions.

### 2.5 Minimal frontend state assumptions (aligned with current frontend contracts)
Current available fields in frontend store/API:
- `me.access_state`
- `me.effective_entitlements.plan`

Phase-1 recommended backend-facing shape (if ADR already defines equivalent fields, use those exact names):
- `is_beta_user: boolean`
- `beta_access_level: 'BETA' | 'PRO_BETA' | null`
- `beta_free: boolean`
- `beta_expires_at: string | null`

Fallback until dedicated beta fields are exposed:
- Keep using `access_state` for technical access condition.
- Render beta messaging from explicit backend flag only; do not infer beta solely from tariff name.

### 2.6 What to intentionally omit in phase-1
- No checkout-first or forced plan-selection onboarding.
- No aggressive paywall UX.
- No complex billing timelines or migration wizard.

## 3. Billing/Tariff Page Behavior During Beta

### 3.1 Target behavior
- Billing page remains available.
- Top section first shows **current beta access state** (truthful current state).
- Tariff cards remain visible as "future/commercial model" for transparency.

### 3.2 Tariff visibility and actions
- Keep `START / PRO / LEADER` visible.
- Add caption above cards: `Модель тарифів після бета-періоду`.
- During beta, replace primary checkout actions with informational state:
  - Option A (recommended minimal): disable buttons with explicit text (`Недоступно під час бета`) and helper note.
  - Option B: keep request-interest CTA only (`Хочу отримати оновлення щодо тарифів`).

### 3.3 Avoiding purchase confusion
- Never show badge/text like `Поточний платний план` for beta-only users.
- If entitlement internally maps to `PRO`, label it in UI as `PRO beta access`, not purchased `PRO`.
- Add short clarifier in billing summary:
  - `Під час бета доступ може надаватися без оплати за запрошенням або когортою.`

### 3.4 Minimal phase-1 logic
- Access summary priority:
  1. Beta status block (source of truth for "now").
  2. Future tariff model block (informational).
- Disable/hide checkout by beta feature flag (`billing_checkout_enabled` or equivalent).

## 4. Hero/Positioning Copy Recommendations

### 4.1 Evaluation of current headline
Current: `Керування приватною практикою на власних умовах`  
Assessment: good baseline, credible and calm; can be kept if minor polish is preferred.

### 4.2 Headline options (3–5)
1. `Простір для ведення консультаційної практики на власних умовах`
2. `Ведіть консультаційну практику системно й у своєму стилі`
3. `Професійний простір для консультаційної практики`
4. `Упорядкована консультаційна практика без зайвого шуму`
5. `Консультаційна практика під вашим контролем`

### 4.3 Subtitle options
- `PRO CONSULT допомагає спеціалістам організувати роботу з клієнтами, зберігати професійне представлення онлайн і вести практику послідовно.`
- `Налаштування практики, публічний профіль, сесії та комунікація — в одному зрозумілому робочому просторі.`
- `Для спеціалістів, які хочуть працювати системно, прозоро й на власних умовах.`

### 4.4 CTA options (layout-compatible)
Primary:
- `Створити кабінет`
- `Перейти в кабінет`
Secondary:
- `Переглянути можливості`
- `Подивитися, як це працює`

## 5. Frontend Beta Release Checklist (Manual)

### 5.1 Auth/session
- Signup specialist flow: success/error states clear.
- Login/logout behavior stable.
- Session restore after refresh works; no false logout.
- Guard redirects behave predictably.

### 5.2 Beta access visibility
- Cabinet banner shows truthful beta status.
- Billing summary shows beta access + free-during-beta message.
- Settings summary mirrors same status wording.
- Known/unknown expiry variants render correctly.

### 5.3 Billing/tariff
- Tariff cards visible as future model, not forced now.
- Checkout/select-plan actions behave per beta mode (disabled/informational).
- No copy implying silent purchase.

### 5.4 Core specialist UX
- Profile editor, media upload/crop/delete flows stable.
- Public profile link/share still works.
- Notifications and key cabinet pages show explicit loading/empty/error/retry states.

### 5.5 Quality/polish
- Critical pages (home, cabinet, billing, profile, sessions) have consistent empty/loading/error messages.
- Mobile/tablet sanity check for banners and billing cards (no overlap/truncation).
- No mixed messaging (`plan active` vs `beta free`) in one screen.

## 6. Must-have vs Nice-to-have

### Must-have (beta gate)
- Honest beta status labeling on cabinet + billing + settings summary.
- Billing page action behavior aligned to beta (no forced checkout).
- Clear separation: current beta access vs future tariffs.
- Manual QA pass across auth/access/billing/profile critical paths.

### Nice-to-have (post-gate)
- Header-level compact beta badge.
- Contextual help link/tooltip for beta policy.
- Additional telemetry for confusion points on billing page.

## 7. Open Questions / Risks
- Which exact backend fields are canonical for beta state in frontend payload (`/auth/me` or separate endpoint)?
- Is beta expiry date guaranteed, optional, or absent for current cohort?
- During beta, should checkout actions be disabled globally or cohort-dependent?
- How should legacy users with existing paid entitlements be displayed when beta policy is active?
- If backend exposes only tariff entitlements without beta flags, frontend risks ambiguous copy; explicit beta fields are strongly recommended.
