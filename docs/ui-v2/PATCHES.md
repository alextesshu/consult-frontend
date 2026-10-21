# Зміни у frontend — що куди покласти

> Stage 0B instructions only - not applied in Stage 0A.
> Source CSS/TypeScript was imported unchanged, without runtime imports.
> Before activation, resolve storage exceptions, reactive SPA updates, link/button
> specificity, and component-selector isolation; add tests and verify v1 smoke.
> See [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md). No deployment is authorized here.

Обсяг: **токени + спільні компоненти**, усе за прапорцем `data-ui="v2"`. Сторінки, бізнес-логіка, роути, API — не чіпаються. За замовчуванням v1, тож без прапорця нічого не змінюється.

## 1. Нові файли (скопіювати як є)
- `src/styles/tokens-v2.css`
- `src/styles/components-v2.css`
- `src/lib/uiVersion.ts`

## 2. `src/main.ts`
```ts
import './style.css'
import './styles/tokens-v2.css'      // після style.css — має перекривати legacy-змінні
import './styles/components-v2.css'
import { applyUiVersion } from './lib/uiVersion'

applyUiVersion() // до createApp(), щоб не було спалаху v1
```

## 3. `index.html` — шрифт Onest (кирилиця)
У `<head>`, до будь-яких стилів:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600&display=swap&subset=cyrillic,latin" rel="stylesheet">
```
Inter з `../../src/style.css` (рядок 1) поки лишається — він потрібен для v1. Прибрати після етапу 5.

## 4. `.env.example`
```
# UI v2 за замовчуванням для всіх (true) або лише за ?ui=v2 (порожньо)
VITE_UI_V2=
```

## 5. Перемикання для тесту
- `?ui=v2` вмикає (запам'ятовується в localStorage `pc.ui`), `?ui=v1` вимикає.
- Staging: `VITE_UI_V2=true`. Production: порожньо до окремого погодження rollout на етапі 5; завершення етапу 4 не є дозволом.

## 6. Тести
- `uiVersion.spec.ts`: query > localStorage > env; невалідні значення ігноруються.
- Snapshot/visual-тести, що звіряють `border-radius: 4px` (UI_SHAPE_STANDARD.md), запускати з `data-ui="v1"` — для v2 стандарт форми змінено, див. DESIGN_SYSTEM.md §8.

## 7. Конфлікти з чинними документами
- `docs/UI_SHAPE_STANDARD.md` описує радіуси 6–20px; v1 workspace tokens також використовують 2–4px. Для v2 його замінює шкала 8/12/16/24 + pill. Додати в нього примітку «v1 only».
- `style.css` `body { font-weight: 200 }` — у v2 перекрито на 400 (200 погано читається на кирилиці).
- Radial-градієнти фону `body` / `body::before` у v2 вимкнено.
