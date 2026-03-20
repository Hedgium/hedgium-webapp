# Design Principles — Hedgium Frontend

Apply these principles across all UI so the product feels like a modern, professional SaaS platform: clean, compact, and consistent.

---

## Overall direction

- **Modern & minimal** — No visual clutter. Every element has a purpose. Avoid decorative flourishes.
- **Compact & scannable** — Dense but readable. Users should find information and actions quickly without excessive scrolling or whitespace.
- **Professional** — Typography, spacing, and color should feel trustworthy and product-grade, not playful or consumer-marketing.
- **Consistent** — Same patterns for forms, cards, buttons, and feedback everywhere (auth, app, admin).

---

## Layout

- **Page background** — Use `bg-base-200` (or equivalent surface) for full-page context; reserve `bg-base-100` for content containers and cards.
- **Content width** — Constrain width where it helps focus: e.g. narrow forms (max ~380–400px), medium content (max-w-2xl), wide content (max-w-7xl) for data-heavy tables/dashboards.
- **Centering** — Center narrow flows (auth, simple forms) with `flex items-center justify-center` and consistent vertical padding (`py-8` or similar).
- **Cards / containers** — `rounded-xl`, light border (`border-base-300`), and minimum shadow by default. Prefer no shadow unless elevation is necessary; when needed use only subtle `shadow-sm`. Avoid heavy shadows or strong borders.

---

## Typography

- **Hierarchy** — One clear page/section title (e.g. `text-2xl font-semibold`), optional short subtitle (`text-base text-base-content/60`). Use smaller labels for form fields (`text-sm font-medium text-base-content/80`).
- **Body** — Default size `text-base` for form copy and secondary text; reserve `text-lg` for primary content where needed.
- **Links & actions** — Primary actions use `text-primary` and `hover:underline` or button styles; keep link text concise.

---

## Forms & inputs

- **Fields** — Prefer compact inputs: `input-sm`, fixed height (e.g. `h-9`) for alignment. Use semantic `<form>`, `type="submit"`, and `autoComplete` where appropriate.
- **Labels** — Small, above the field: `text-sm font-medium text-base-content/80`, tight margin below label (`mb-1.5`).
- **Icons in inputs** — If used, place with `absolute` positioning; keep icon size modest (`h-4 w-4`) and color muted (`text-base-content/40`).
- **Errors** — Inline, below the field: `text-sm text-error`. Clear single-line messages.
- **Primary button** — Full-width in narrow forms when there’s one main action. Use `btn-primary btn-sm` with consistent height. Show loading state (e.g. spinner) instead of disabled-only when submitting.

---

## Color & theme

- Use DaisyUI semantic tokens: `text-base-content`, `text-base-content/60` (muted), `text-primary`, `bg-base-100`, `bg-base-200`, `border-base-300`, `text-error`, `text-success`.
- Avoid raw grays or hex in UI; prefer theme tokens so light/dark and future themes stay consistent.

---

## Feedback & state

- **Loading** — Prefer simple **skeletons** when possible: use skeleton placeholders that mirror the layout of the content being loaded (cards, rows, text lines). Skeletons reduce layout shift and feel faster. Use a **spinner** (e.g. Loader2) for inline actions (buttons, form submit) or when the loading area is too small for a meaningful skeleton. Avoid “Loading...” text alone.
- **Success / error** — Short, single-line messages. Use `text-success` / `text-error` and place near the relevant control or at top of form.
- **Empty states** — Brief copy and optional single CTA; no large illustrations unless product-specific.

---

## Auth & focused flows

- Auth and other focused flows (e.g. single-purpose forms) should feel calm: one main card, one primary CTA, minimal links (e.g. “Forgot password?”, “Sign up”). Secondary actions in a single line below the card, muted (`text-sm text-base-content/50`).

---

## Summary

**Modern, clean, compact, professional.** Constrain width where it helps, use small typography and compact controls, rely on theme tokens, and keep patterns consistent across auth, app, and admin so the product feels like one coherent platform.
