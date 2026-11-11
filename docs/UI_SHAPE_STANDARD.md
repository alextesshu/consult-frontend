# UI Shape Standard

> Applies to UI v1 only. For opt-in UI v2, see `DESIGN_SYSTEM.md` section 8.
> The v1 rules below remain unchanged.

## Purpose
Lock a consistent, less-rounded SaaS visual language for header, landing, and cabinet surfaces.

## Tokens
Defined in `src/style.css`:

- `--radius-xs: 6px`
- `--radius-sm: 10px`
- `--radius-md: 12px`
- `--radius-lg: 16px`
- `--radius-xl: 20px`
- `--radius-pill: 999px`

## Component Rules
- Header shell: `10px`
- Header text buttons: `height 32px`, `padding 4px 12px`, `radius 6px`
- Header icon buttons: `32x32`, `radius 6px`
- Header logout button: `height 32px`, `padding 4px 12px`, `radius 6px`
- Hero CTA: `height 41px`, `padding 0 18px`, `radius 10px`
- Hero image: `radius 16px`

## QA Matrix (Visual)
Checked states:
- Desktop `1440px`: spacing and hierarchy stable.
- Tablet `1024px`: topbar wraps without overlap.
- Mobile `375px`: header controls remain readable and tappable.

Interactive states checked:
- `hover`
- `focus-visible`
- `active`
- `disabled`

## Guardrail
Do not reintroduce pill-like controls in header/cabinet unless explicitly required by product.
