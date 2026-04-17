# Design Principles — Hedgium Frontend

Apply these principles across all UI so the product feels like a modern, professional SaaS platform: clean, compact, and consistent. **Reference implementation:** Reports and Positions (`/reports`, `/positions`) — match their shell, surfaces, and typography unless a screen has a strong reason to differ.

---

## Overall direction

- **Modern & minimal** — No visual clutter. Every element has a purpose. Avoid decorative flourishes.
- **Compact & scannable** — Dense but readable. Users should find information and actions quickly without excessive scrolling or whitespace.
- **Professional** — Typography, spacing, and color should feel trustworthy and product-grade, not playful or consumer-marketing.
- **Consistent** — Same patterns for forms, cards, buttons, and feedback everywhere (auth, app, admin).

---

## Layout (app pages — Reports / Positions pattern)

- **Page shell** — Full-height context: outer `relative min-h-screen`. Behind content, a fixed non-interactive layer (`pointer-events-none`, `-z-10`) with:
  - Base wash: `bg-gradient-to-b from-base-200 via-base-200 to-base-300/80`
  - Soft color orbs: large blurred circles (`blur-3xl` / `blur-2xl`) at low opacity using `bg-primary/10–12`, `bg-secondary/10`, `bg-accent/10` as appropriate
  - Optional: very subtle grid or line texture masked to fade out toward the bottom (keep opacity low so it stays quiet)
- **Content width** — Main app columns: `max-w-6xl` (e.g. Positions) or `max-w-7xl` (e.g. Reports, chart-heavy). Horizontal padding: `px-4 py-6 md:px-8 md:py-8` (or `py-8` / `py-10` for heavier pages). Use `space-y-8`–`space-y-10` between major sections.
- **Narrow flows** — Auth and simple forms: center with `flex items-center justify-center`, `py-8` or similar; forms often `max-w-[380px]`–`max-w-md`.
- **Cards & panels** — Primary surfaces: `rounded-2xl`, `border border-base-300/50`–`/70`, translucent fills like `bg-base-100/55`–`/80` or `bg-base-200/35` for nested stat tiles. Use `backdrop-blur-sm` or `backdrop-blur-md` where a panel should feel slightly lifted from the gradient. Nested KPI or table cells: often `rounded-xl` with the same border vocabulary.
- **Depth without shadows** — **Do not use `shadow-*` (including `shadow-sm`, `shadow-inner`, or glow shadows) on app surfaces, cards, joins, or primary buttons.** Separation comes from borders, translucent backgrounds, blur, and spacing — not drop shadows. (Legacy screens may still have shadows; new work should converge on this rule.)

---

## Typography

- **Page title** — e.g. `text-2xl font-bold tracking-tight text-base-content md:text-3xl` for a top-level heading, or `text-xl font-semibold md:text-2xl` for a strong section title (see Reports / Positions).
- **Subtitle / helper** — One line under the title: `text-sm text-base-content/55` (or `/60` for slightly stronger emphasis).
- **Section labels (“eyebrows”)** — Uppercase, tight tracking: `text-[11px]` or `text-xs font-semibold uppercase tracking-wider text-base-content/45`–`/50`.
- **In-card headings** — `text-lg font-semibold` or `text-sm font-semibold uppercase tracking-wide text-base-content/80` for compact sub-blocks.
- **KPIs & numbers** — `text-lg md:text-xl font-bold` (or `font-semibold`) with `tabular-nums`; use `text-success` / `text-error` / muted content for sign and context.
- **Body & meta** — Secondary lines in panels: `text-sm text-base-content/55`–`/60`. Tags, dates, chips: `text-xs`–`text-[11px]` with `text-base-content/45`–`/70` as appropriate.
- **Forms (labels)** — `text-sm font-medium text-base-content/80` above fields; inline errors `text-sm text-error`.
- **Links & actions** — Primary actions: `btn` / `btn-primary`; text links can use `text-primary` with clear hover affordance.

---

## Forms & inputs

- **Fields** — Prefer compact inputs: `input-sm`, fixed height (e.g. `h-9`) for alignment. Use semantic `<form>`, `type="submit"`, and `autoComplete` where appropriate.
- **Icons in inputs** — If used, place with `absolute` positioning; keep icon size modest (`h-4 w-4`) and color muted (`text-base-content/40`).
- **Primary button** — In dense app UI, `btn-primary btn-sm` is common; show loading (e.g. spinner) instead of disabled-only when submitting.

---

## Color & theme

- Use DaisyUI semantic tokens: `text-base-content`, `text-base-content/55`–`/60` (muted), `text-primary`, `bg-base-100`, `bg-base-200`, `border-base-300` (often with `/50`–`/70` opacity), `text-error`, `text-success`.
- Avoid raw grays or hex in UI; prefer theme tokens so light/dark and future themes stay consistent.
- Accent tints (e.g. `from-primary/10`, `border-primary/20`) for one highlighted KPI or focus state — sparingly.

---

## Controls & patterns (app)

- **Icon + heading rows** — Section headers often pair a `h-5 w-5 text-primary` Lucide icon with the title.
- **Segmented / toggle groups** — DaisyUI `join` + `join-item`, `btn btn-sm`, active `btn-primary`, inactive `btn-ghost` with `border border-base-300/60` — **no shadow on the join**.
- **Icon-only actions** — e.g. `btn btn-circle btn-ghost` with `border border-base-300/70` for refresh / secondary actions.
- **Lists & expandable rows** — Borders and hover via `border-primary/25` and slight motion (`hover:-translate-y-0.5`) if needed — not shadow.

---

## Feedback & state

- **Loading** — Prefer **skeletons** that mirror layout (cards, rows, chart areas). Use a **spinner** for small regions or button-level loading. Avoid bare “Loading...” copy alone.
- **Success / error** — Short, single-line toasts or inline messages; `text-success` / `text-error`.
- **Empty states** — Brief copy, optional single CTA (`btn-primary btn-sm`), dashed border container (`border-dashed border-base-300/70`) — no reliance on shadows.

---

## Auth & focused flows

- Calm, single-focus: one main card, one primary CTA, minimal secondary links (`text-sm text-base-content/50`). Card can use `rounded-xl border border-base-300` and `bg-base-100` — **still avoid shadows** when aligning with the app shell above.

---

## Summary

**Modern, clean, compact, professional.** Use the Reports / Positions shell (gradient + soft blurs + optional grid), `max-w-6xl`–`max-w-7xl` content, `rounded-2xl` panels with light borders and translucent fills, and typography hierarchy as above. **No box shadows** — depth comes from borders, translucency, and backdrop blur. Keep patterns consistent so the product feels like one coherent platform.
