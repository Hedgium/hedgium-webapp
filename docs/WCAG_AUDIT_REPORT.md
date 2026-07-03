# WCAG 2.1 Level AA Audit Report — `hedgium_webapp`

**Date:** 2026-07-03  
**Scope:** `hedgium_webapp/src` (authenticated trader shell, auth/onboarding, sandbox, admin, in-app marketing sections)  
**Method:** Static code audit against WCAG 2.1 Level AA success criteria; automated fixes applied where safe without changing product behaviour.

---

## Executive summary

The webapp already had strong accessibility foundations: `lang="en"` on `<html>`, skip links on the main app and auth shells, DaisyUI theme tokens tuned for contrast, labelled auth forms, toast live regions, and sandbox tab semantics.

This pass added **global `prefers-reduced-motion` support**, **skip links on sandbox and admin layouts**, **table semantics** on shared position tables, **dialog ARIA** on key modals, **page-level heading hierarchy** on Home/Positions/Reports, **aria-live** regions for dynamic lists, **accessible names** on icon-only controls, **form labels** on admin search fields, and **contrast / touch-target** improvements on trader-facing UI.

**Remaining manual review** is concentrated in admin modals (focus trap, native `<dialog>` migration), Recharts accessibility, live video contrast on the marketing hero, and spot-checking contrast ratios in the browser with a checker (e.g. axe, WAVE, Lighthouse).

---

## Already compliant (no change required)

| Area | Criterion | Location | Notes |
|------|-----------|----------|-------|
| Document language | 3.1.1 | `src/app/layout.tsx:59` | `<html lang="en">` |
| Skip link (app shell) | 2.4.1 | `HedgiumLayoutClient.tsx:17-30` | Skip link + `#main-content` |
| Skip link (auth) | 2.4.1 | `AuthFlowChrome.tsx:9-10` | Same pattern |
| Theme contrast tokens | 1.4.3 | `global.css:53-73` | Secondary, accent, info, success, warning darkened for AA |
| Login form labels & errors | 1.3.1, 3.3.2, 4.1.3 | `LoginPageClient.tsx` | `htmlFor`, `aria-invalid`, `role="alert"`, `aria-live` |
| Toast announcements | 4.1.3 | `AlertsContainer.tsx:43-47` | Persistent `aria-live="polite"` |
| Demo banner | 4.1.3 | `DemoModeBanner.tsx:17-19` | `role="status"` + labelled dismiss |
| Primary navigation | 2.4.4, 4.1.2 | `AuthNavigation.tsx` | `aria-label="Primary"`, `aria-current`, sr-only unread counts |
| Sandbox tabs | 4.1.2 | `SandboxPositionsContent.tsx` | `tablist` / `tab` / `tabpanel` |
| Native dialogs (broker) | 2.4.3, 4.1.2 | `BrokerCredentialHelpModal.tsx`, `BrokerConnect.tsx` login `<dialog>` | `showModal()` focus trap |
| Reference modals | 2.4.3 | `TradeCycleDetailsModal.tsx`, `ProfileLiveModal.tsx` | `role="dialog"`, `aria-modal`, `aria-labelledby` |
| Onboarding forms | 1.3.1, 4.1.3 | `onboarding/page.tsx`, forgot/reset password | Labelled inputs, `role="alert"` |
| Settings page title | 2.4.6 | `settings/page.tsx:41` | Single `<h1>Settings</h1>` |
| Alerts page title | 2.4.6 | `alerts/page.tsx:82` | Single `<h1>Alerts</h1>` |
| Sandbox page title | 2.4.6 | `sandbox/page.tsx:27` | Single `<h1>Sandbox</h1>` |
| FAQ disclosures | 2.1.1 | `FAQSection.tsx` | Native `<details>` / `<summary>` |

---

## Issues found and fixes applied

### Global

| # | Criterion | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|
| G1 | 2.3.3 | `global.css` | No `prefers-reduced-motion` handling for animations/transitions/AOS | Added `@media (prefers-reduced-motion: reduce)` block; disables animations and AOS transforms |
| G2 | 2.4.1 | `sandbox/layout.tsx:23-35` | No skip link; `<main>` lacked `id="main-content"` | Added skip link, `id="main-content"`, `tabIndex={-1}`; banner wrapped in `role="status"` |
| G3 | 2.4.1 | `admin/AdminLayoutClient.tsx:51-58` | No skip link on admin shell | Added skip link + `#main-content` on `<main>` |
| G4 | 1.3.1 | `admin/AdminLayoutClient.tsx:53` | `<aside>` without accessible name | `aria-label="Admin sidebar"` |
| G5 | 1.3.1 | `admin/Sidebar.tsx:69` | `<nav>` without accessible name | `aria-label="Admin navigation"` |

### Trader shell — Home, Positions, Reports, Alerts, Sandbox

| # | Criterion | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|
| T1 | 2.4.6 | `home/page.tsx:88` | No page `<h1>` | Added `<h1 className="sr-only">Home</h1>` |
| T2 | 2.4.6 | `positions/page.tsx:139` | No page `<h1>` | Added `<h1 className="sr-only">Positions</h1>` |
| T3 | 2.4.6 | `ProfileReportsPanel.tsx:278` | Client `/reports` lacked `<h1>` | Added visible `<h1>Reports</h1>` header; chart section renamed to `<h2>Charts</h2>` |
| T4 | 1.4.3 | `MarketHeader.tsx:209,218` | `text-base-content/50` on small labels | Raised to `/70`; connection dot uses `aria-label` instead of `title` only |
| T5 | 1.1.1 | `MarketHeader.tsx:249-252` | Trend icons not marked decorative | `aria-hidden="true"` on icons |
| T6 | 2.5.5 | `positions/page.tsx:223` | Refresh control below 44×44px | `min-h-11 min-w-11` on button |
| T7 | 1.3.1 | `PositionsTable.tsx:51-64` | Table missing caption and `scope` | `<caption className="sr-only">`, `scope="col"` on all headers |
| T8 | 1.4.3 | `PositionsTable.tsx:45,53` | `text-gray-400/500` low contrast | Replaced with `text-base-content/70` |
| T9 | 1.1.1 | `PositionsTable.tsx:92-96` | PnL icons not decorative | `aria-hidden="true"` |
| T10 | 4.1.2 | `ProfileReportsPanel.tsx:500-505` | Expand cycle button lacked accessible name | `aria-label` with cycle name and expand/collapse state |
| T11 | 4.1.3 | `ProfileReportsPanel.tsx:573` | Position load error not announced | `role="alert"` on error message |
| T12 | 4.1.3 | `alerts/page.tsx:145` | Notification list updates silently | `aria-live="polite"` on `<ul>` |
| T13 | 4.1.3 | `BrokerConnect.tsx:491` | Broker status error not announced | `role="alert"` on `statusError` |
| T14 | 2.5.5 | `DemoModeBanner.tsx:32` | Dismiss button `btn-xs` (~24px) | `btn-sm` + `min-h-11 min-w-11` |
| T15 | 2.5.5 | `AuthNav.tsx:84` | Account menu 32×32px | `min-h-11 min-w-11` |
| T16 | 1.4.3 | `sandbox/page.tsx:31` | `text-base-content/55` subtitle | Raised to `/70` |
| T17 | 2.5.5 | `SandboxPositionsContent.tsx:208` | Refresh 36×36px | `min-h-11 min-w-11` |
| T18 | 4.1.3 | `SandboxPositionsContent.tsx:338` | Load-more / phase content not announced | `aria-live="polite"` + `aria-busy` on tabpanel |
| T19 | 2.4.3 | `settings/page.tsx:76` | Extra tab stop on tabpanel (`tabIndex={0}`) | Removed redundant `tabIndex` |

### Shared components & modals

| # | Criterion | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|
| M1 | 2.4.3, 4.1.2 | `LivePositionsModal.tsx:27-34` | Overlay `div onClick`; no dialog semantics; keyboard-inaccessible backdrop | `role="dialog"`, `aria-modal`, `aria-labelledby`; keyboard-dismissible backdrop button; Escape handler; focus on open; table caption/scope; theme PnL colours |
| M2 | 2.4.3, 4.1.2 | `MarketDepthModal.tsx:255-294` | No dialog ARIA; close via `title` only; unlabelled controls | `role="dialog"`, `aria-modal`, `aria-labelledby`; `aria-label` on close; visible labels + `aria-label` on select and AsyncSelect |
| M3 | 1.1.1 | `BrokerCredentialHelpModal.tsx:134-137` | Step screenshots `alt=""` | Descriptive `alt` from step text |
| M4 | 1.4.3 | `not-found.tsx:65` | `text-base-content/50` support text | Raised to `/70` |
| M5 | 1.1.1 | `not-found.tsx:19-25` | Decorative SVG not hidden | `aria-hidden="true"` |

### In-app marketing / home sections

| # | Criterion | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|
| H1 | 1.1.1 | `WhatWeDoSection.tsx:86-88` | Carousel images `alt=""` with meaningful content | `alt` set from slide `bottomText` |
| H2 | 2.3.3 | `WhatWeDoSection.tsx:44-48` | Auto-advance ignores reduced motion | Interval skipped when `prefers-reduced-motion: reduce` |
| H3 | 2.5.5 | `WhatWeDoSection.tsx:100-106` | Carousel dots ~8×24px | `min-h-11 min-w-11` tab buttons with `role="tablist"` |
| H4 | 1.3.1 | `ComparisonTable.tsx:55-86` | Empty header cell; categories in `<td>`; no caption | `<caption>`, `scope="col"`, row categories as `<th scope="row">` |

### Admin (partial — high-traffic fixes)

| # | Criterion | File:Line | Issue | Fix |
|---|-----------|-----------|-------|-----|
| A1 | 1.3.1, 3.3.2 | Admin search inputs (settings, proxy-pool, profiles, market, leads, client-pnl, TradeCycles) | Placeholder-only search fields | `aria-label` on each search input; leads changed to `type="search"` |
| A2 | 4.1.2 | `admin/settings/page.tsx:274-289` | Edit/delete icon buttons: `title` only, `btn-xs` | `aria-label` with key name; `min-h-11 min-w-11` |

---

## Remaining manual review items

These were identified in the audit but **not** fully remediated (require design decisions, large refactors, or runtime verification).

### Critical — modals & focus (admin-heavy)

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 2.4.3, 4.1.2 | `SubscriptionPlanModal.tsx`, `UserWithoutProfileItem.tsx`, `profiles/page.tsx`, `profiles/[profileId]/page.tsx`, `ProfileLiveTradingPanel.tsx` (3 modals), `TradeCycles.tsx` (add/compare modals), `ProfileItem.tsx` (3 modals), `admin/settings/page.tsx` (create/edit modal), `ManualAdjustmentModal.tsx`, `StrategyOptionChainModal.tsx` | DaisyUI `modal-open` overlays lack consistent `role="dialog"`, `aria-modal`, focus trap, and keyboard-dismissible backdrops | Migrate to native `<dialog showModal()>` (see `BrokerCredentialHelpModal`) or shared `AccessibleModal` wrapper with focus trap + `aria-labelledby` |
| 2.1.1 | Same files — `modal-backdrop` `<div onClick>` | Backdrop dismiss mouse-only | Use `<form method="dialog">` backdrop or focusable dismiss control with Enter/Space |

### Tables

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 1.3.1 | `ProfileLiveTradingPanel.tsx` (4 tables), `TradeCycles.tsx`, `admin/settings/page.tsx`, research/admin report tables | Missing `scope` / `<caption>` | Add per-table captions (sr-only where redundant) and `scope="col"` / `scope="row"` |

### Forms & labels

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 1.3.1, 3.3.2 | `BuilderForm.tsx`, `LegForm.tsx`, `ResearchSymbolSearch.tsx`, assorted admin filters | Placeholder-only or unassociated inputs | Audit each control; add `<label>` or `aria-label` |
| 4.1.2 | `settings/ProfileTab.tsx:237` | Verify-email `<dialog aria-label>` | Prefer `aria-labelledby` tied to visible heading inside `VerifyEmail` |

### Colour contrast (verify in browser)

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 1.4.3 | `ProfileLiveTradingPanel.tsx`, `UserWithoutProfileItem.tsx`, `ProfileItem.tsx`, `HeroSection.tsx:74` | Residual `text-gray-400`, `text-base-content/50`, `opacity-50`, text over video | Run contrast checker on light/dark themes; bump muted text to `/70`+; add semi-opaque scrim behind hero copy |
| 1.4.3 | Recharts charts (`ReportCharts.tsx`, admin PnL charts) | Chart segments may fail 3:1 UI component contrast | Provide data table alternative or patterns + labels; document in audit walkthrough |

### Touch targets

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 2.5.5 | `UserWithoutProfileItem.tsx`, `TradeCycles.tsx` action buttons, `Navbar.tsx` mobile toggle, reports pagination chevrons | Residual `btn-xs` / small icon-only controls | Standardise `min-h-11 min-w-11` on icon-only actions |

### Motion & charts

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 2.3.3 | Home sections with `data-aos` | AOS not initialised in repo; CSS fallback added | If AOS is enabled later, gate `AOS.init({ disable: 'mobile' })` behind reduced-motion check |
| 1.1.1 | Recharts | SVG charts lack text alternatives | Add sr-only summary or toggle “View data table” |

### Screen reader / live regions

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 4.1.3 | WebSocket notification toasts (non-Alerts pages) | New notifications may not reach list live region | Confirm `NotificationProvider` announces or rely on `AlertsContainer` globally |
| 4.1.3 | `positions/page.tsx` refresh | Long async refresh only uses toast | Optional `aria-live` on summary section when refresh completes |

### Semantic HTML & landmarks

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 1.3.1 | `sandbox/layout.tsx` | Disclaimer banner inside flex column, not in landmark | Acceptable; optional `role="region" aria-label="Sandbox notice"` |
| 2.4.6 | Admin sub-pages | Some admin routes use `<h2>` without checking parent context | Verify one `<h1>` per route when admin is in scope for external audit |

### Language

| Criterion | Files | Issue | Recommended action |
|-----------|-------|-------|-------------------|
| 3.1.2 | User-generated content (alerts, trade cycle names) | Dynamic content may include non-English | No `lang` attribute on fragments — acceptable for proper names; flag if localized UI is added |

---

## QA checklist (demo audit path)

Per `docs/WCAG_DEMO.md`, manually verify with keyboard + screen reader (NVDA/VoiceOver):

1. Tab from page load — skip link appears and moves focus to `#main-content`.
2. Home → Positions → Reports → Alerts → Settings → Sandbox — one `<h1>` per page; logical heading order.
3. Positions table — screen reader reads column headers with positions data.
4. Reports — expand/collapse cycle announces state; chart section reachable by keyboard.
5. Alerts — filter buttons toggle; list updates polite (no excessive chatter).
6. Sandbox — phase tabs roving tabindex; refresh and load-more reachable at 44px.
7. Enable **Reduce motion** in OS — animations and carousel auto-advance stop.
8. Light and dark themes — spot-check Market header, muted subtitles, error/success text at 4.5:1.
9. Broker connect error (non-demo) — status error announced.

---

## Files changed in this remediation pass

`global.css`, `sandbox/layout.tsx`, `admin/AdminLayoutClient.tsx`, `admin/Sidebar.tsx`, `admin/settings/page.tsx`, `admin/proxy-pool/page.tsx`, `admin/profiles/page.tsx`, `admin/market/page.tsx`, `admin/leads/page.tsx`, `admin/client-pnl/page.tsx`, `home/page.tsx`, `positions/page.tsx`, `settings/page.tsx`, `sandbox/page.tsx`, `alerts/page.tsx`, `not-found.tsx`, `DemoModeBanner.tsx`, `AuthNav.tsx`, `BrokerConnect.tsx`, `MarketHeader.tsx`, `PositionsTable.tsx`, `LivePositionsModal.tsx`, `ProfileReportsPanel.tsx`, `SandboxPositionsContent.tsx`, `BrokerCredentialHelpModal.tsx`, `market/MarketDepthModal.tsx`, `admin/TradeCycles.tsx`, `home/ComparisonTable.tsx`, `home/WhatWeDoSection.tsx`

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- Demo walkthrough credentials: `docs/WCAG_DEMO.md`
- Design requirement: `AGENTS.md` — “Accessibility: UI and content should meet WCAG 2.1 Level AA”
