# WCAG 2.1 Level AA Audit — Non-Admin Pages (`hedgium_webapp`)

**Date:** 2026-07-03 (re-audit)  
**Scope:** All user-facing routes excluding `/admin/**`  
**Method:** Static code review of current `src/` (no code changes in this pass — prior remediation retained)

---

## Executive summary

The **demo audit path** (Home → Positions → Reports → Alerts → Settings → Simulation, plus auth/onboarding) is **largely WCAG 2.1 AA compliant** after the earlier remediation pass. Core infrastructure is in place: document language, skip links on main shells, reduced-motion CSS, labelled auth forms, live regions for toasts/alerts, table semantics on `PositionsTable`, dialog patterns on broker modals, page-level headings, and corrected internal links.

**No additional code changes were made in this re-audit.** Remaining gaps are documented below for manual verification or a future focused pass. Highest-risk items for an external auditor: **Recharts data alternatives**, **muted text contrast on trade cards**, and **focus trapping** on `LivePositionsModal` (currently unused).

---

## Scope — pages audited

| Route | File |
|-------|------|
| `/` | `app/page.tsx` + `LoginPageClient.tsx` |
| `/forgot-password` | `app/forgot-password/page.tsx` |
| `/reset-password/[uidb64]/[token]` | `app/reset-password/[uidb64]/[token]/page.tsx` |
| `/onboarding` | `app/onboarding/page.tsx` + `OnboardingFlow.tsx` |
| `/home` | `app/(app)/home/page.tsx` |
| `/positions` | `app/(app)/positions/page.tsx` |
| `/reports` | `app/(app)/reports/page.tsx` → `ProfileReportsPanel.tsx` |
| `/alerts` | `app/(app)/alerts/page.tsx` |
| `/settings` | `app/(app)/settings/page.tsx` |
| `/add-broker` | `app/(app)/add-broker/page.tsx` |
| `/simulation` | `app/simulation/page.tsx` + layout |
| 404 | `app/not-found.tsx` |

**Shared shells:** `HedgiumLayoutClient`, `simulation/layout.tsx`, `AuthFlowShell` / `AuthFlowChrome`, `AuthNav`, `AuthNavigation`, `AuthFooter`, `AuthFlowFooter`, `DemoModeBanner`, `BrokerConnect`, `AlertsContainer`.

---

## Already compliant (prior fixes — no action needed)

| Area | Criterion | Location | Status |
|------|-----------|----------|--------|
| Document language | 3.1.1 | `app/layout.tsx:59` — `<html lang="en">` | ✓ |
| Skip links | 2.4.1 | `HedgiumLayoutClient.tsx:17`, `AuthFlowChrome.tsx:9`, `simulation/layout.tsx:25` | ✓ |
| Main landmark | 1.3.1 | `#main-content` + `tabIndex={-1}` on app/simulation shells | ✓ |
| Reduced motion | 2.3.3 | `global.css:30-44` — `prefers-reduced-motion` | ✓ |
| Theme contrast tokens | 1.4.3 | `global.css` DaisyUI light/dark palette tuning | ✓ |
| Login / auth forms | 1.3.1, 3.3.2, 4.1.3 | `LoginPageClient.tsx` — labels, `aria-invalid`, `role="alert"`, `aria-live` | ✓ |
| Forgot / reset password | 1.3.1, 4.1.3 | Labelled inputs, `role="alert"`, links to `/` | ✓ |
| Onboarding signup/terms/profile | 2.4.6, 4.1.3 | `SignupStep`, `TermsStep`, `CompleteProfileStep`, `VerificationStep` — each has `<h1>` + form errors | ✓ |
| Signup stepper shell | — | `OnboardingFlow.tsx` — single `/onboarding` route | ✓ |
| Page headings | 2.4.6 | Home/Positions sr-only `<h1>`; Reports/Alerts/Settings/Simulation visible `<h1>` | ✓ |
| Primary navigation | 2.4.4, 4.1.2 | `AuthNavigation.tsx` — `aria-label="Primary"`, `aria-current`, sr-only unread counts | ✓ |
| Mobile account menu | 2.1.1, 4.1.2 | `AuthNav.tsx` — `aria-expanded`, labelled button, Escape closes | ✓ |
| Touch targets (key controls) | 2.5.5* | Demo dismiss, account menu, simulation/positions refresh — `min-h-11 min-w-11` | ✓ |
| Positions table | 1.3.1 | `PositionsTable.tsx` — `<caption>`, `scope="col"`, semantic colours | ✓ |
| Toast / status | 4.1.3 | `AlertsContainer.tsx`, `DemoModeBanner.tsx` | ✓ |
| Alerts list updates | 4.1.3 | `alerts/page.tsx` — `aria-live="polite"` on notification `<ul>` | ✓ |
| Broker status errors | 4.1.3 | `BrokerConnect.tsx` — `role="alert"` on `statusError` | ✓ |
| Native dialogs | 2.4.3, 4.1.2 | `BrokerCredentialHelpModal.tsx`, `BrokerConnect` login `<dialog>` | ✓ |
| Simulation tabs | 4.1.2 | `SimulationPositionsContent.tsx` — `tablist` / `tab` / `tabpanel` | ✓ |
| Internal links | 2.4.4 | Broken `/welcome`, `/get-started`, `/upgrade` removed; `AuthFlowBrand` → `/` | ✓ |
| Settings tabs | 4.1.2 | `settings/page.tsx` — `role="tablist"`, `aria-selected`, roving `tabIndex` | ✓ |
| Reports expand controls | 4.1.2 | `ProfileReportsPanel.tsx` — `aria-expanded` + `aria-label` on cycle buttons | ✓ |
| Auth flow footer legal | 2.4.4 | `AuthFlowFooter.tsx` — external marketing legal URLs | ✓ |
| Support email consistency | — | `TradeCycleCard`, add-broker, `AuthFlowFooter` — `support@hedgium.in` | ✓ |

\*2.5.5 is WCAG **2.1 AAA** (44×44px). Included because the audit checklist requested it; AA does not require 44px targets.

---

## Remaining issues

### High — verify or fix before external audit

| # | Criterion | File:Line | Issue | Fix in prior pass? | Recommended action |
|---|-----------|-----------|-------|-------------------|-------------------|
| H1 | **1.1.1** | `ReportsMarginChart.tsx:45-106` | Recharts margin line chart — SVG with no text alternative or labelled summary | No | Add sr-only data table or `aria-labelledby` + visible “View as table” toggle |
| H2 | **1.1.1** | `ReportsPnlMonthlyBarChart.tsx:58-104` | PnL bar chart — same gap | No | Same as H1 |
| H3 | **1.4.3** | `TradeCycleCard.tsx:60,129,145-147,175-179` | Secondary text at `text-base-content/40`–`/55` at 11–12px on home cards | No | Raise to `text-base-content/70` minimum on readable copy |
| H4 | **1.4.3** | `PositionsSummary.tsx:48,63,72,78,84` | `text-gray-500` labels on positions/simulation summary tiles | No | Use `text-base-content/70` |
| H5 | **1.4.3** | `UnmappedOrdersTable.tsx:56,80,122-124` | `text-gray-500` labels; raw `text-green-500`/`text-red-500` | No | Theme tokens `text-base-content/70`, `text-success`/`text-error` |
| H6 | **2.4.6** | `OnboardingFlow.tsx` + `VerifyEmail.tsx:227` | Verify-email step uses `<h2>` only when stepper visible — no page `<h1>` | No | Add sr-only `<h1>Verify email</h1>` on that step |
| H7 | **2.4.3** | `LivePositionsModal.tsx:27-68` | Dialog ARIA present but **no focus trap**; Tab can escape | Partial | Use `<dialog showModal()>` or focus trap (**component not imported anywhere yet**) |

### Medium — AA-adjacent / polish

| # | Criterion | File:Line | Issue | Fix in prior pass? | Recommended action |
|---|-----------|-----------|-------|-------------------|-------------------|
| M1 | **2.4.1** | `not-found.tsx:10-75` | No skip link; content not in `<main id="main-content">` | No | Add skip link + `<main>` wrapper |
| M2 | **1.3.1** | `SignUpStepper.tsx:25-42` | Visual stepper only — no `aria-current="step"` or step count for AT | No | `aria-label="Signup progress"`, sr-only “Step 2 of 4” |
| M3 | **1.3.1** | `alerts/page.tsx:168-174` | “Was unread” dot is visual/`title` only | No | sr-only text on affected rows |
| M4 | **2.1.1** | `settings/page.tsx:44-61` | Vertical tablist lacks arrow-key navigation | No | `onKeyDown` for Arrow Up/Down per WAI-ARIA tabs |
| M5 | **4.1.2** | `ProfileTab.tsx:234-237` | Verify-email dialog uses `aria-label` instead of `aria-labelledby` | No | Point to `VerifyEmail` heading `id` |
| M6 | **1.4.13** | `positions/page.tsx:216-218` | Reload help only in CSS tooltip (`data-tip`) | No | Extend `aria-label` or add visible helper |
| M7 | **1.4.13** | `KycStatusIndicator.tsx` | Status tooltips not keyboard-accessible | No | Rely on `aria-label` (nav variant) or `aria-describedby` |
| M8 | **1.4.3** | `TradeCyclePositions.tsx:117-119` | Metadata `text-base-content/45` at 11px | No | Bump to `/70` |
| M9 | **1.4.3** | `AuthFlowFooter.tsx:53-59` | Legal microcopy at `text-[10px]` `/65` | No | `text-xs` + `/70`+ |
| M10 | **1.4.3** | `MarketHeader.tsx:265` | Empty state `text-base-content/60` | No | Verify contrast; use `/70` if borderline |
| M11 | **1.1.1** | `TradeCyclePositions.tsx:87-92` | Status icons inline with text, not `aria-hidden` | No | `aria-hidden="true"` on decorative icons |
| M12 | **4.1.3** | `TradeCyclePositions.tsx:129-140` | “Load more positions” missing `aria-busy` | No | Add `aria-busy={loadingMore}` |
| M13 | **1.1.1** | `not-found.tsx:49-59` | Back arrow SVG not `aria-hidden` | No | `aria-hidden="true"` (link text already present) |

### Touch targets (2.5.5 — AAA / 44px checklist)

Not required for **AA** certification; list for manual QA if targeting AAA or internal 44px policy.

| File:Line | Control | Approx. size |
|-----------|---------|--------------|
| `VerifyEmail.tsx:257` | OTP inputs `w-10 h-10` | 40px |
| `add-broker/page.tsx:324-351` | Help / copy `btn-xs` | &lt;44px |
| `BrokerConnect.tsx:401` | Metrics dropdown trigger | &lt;44px |
| `TradeCycleCard.tsx:215` | “Show all legs” `btn-xs` | &lt;44px |
| `settings/page.tsx:33` | Back button `btn-circle` | May be &lt;44px |
| `KycStatusIndicator.tsx:91` | Pending badge control | 32px |
| `AlertsContainer.tsx:64` | Toast dismiss | `btn-sm` |
| `AuthNavigation.tsx:154-180` | Mobile dock items | Verify in browser |

---

## Issues explicitly not in scope

- All `/admin/**` routes and admin-only components (`TradeCycleDetailsModal`, `MarketDepthModal` on admin market page, etc.)
- Deleted dormant marketing components (`Navbar`, `Footer`, `components/home/*`) — removed from webapp; live on `hedgium_frontend`

---

## Demo walkthrough QA checklist

Use the demo account per `docs/WCAG_DEMO.md`.

1. **Keyboard:** Tab from load — skip link appears on app/simulation/auth shells; Enter jumps to `#main-content`.
2. **Headings:** One logical `<h1>` per page (Home/Positions use sr-only; others visible).
3. **Forms:** Login, signup, forgot/reset — Tab order logical; errors announced (`role="alert"`).
4. **Home:** Trade cycle cards readable; locked strategy links go to Settings / mailto.
5. **Positions / Simulation:** Summary tiles and position tables scannable; table headers announced.
6. **Reports:** Charts visible — confirm auditor accepts Recharts or provide data table alternative (H1/H2).
7. **Alerts:** Filter buttons toggle; list uses live region.
8. **Settings:** Profile/password/theme tabs switch with visible focus ring.
9. **Reduced motion:** OS setting on — animations suppressed (`global.css`).
10. **Themes:** Spot-check light + dark on Market header, trade cards, muted subtitles.

---

## Change log

| Pass | Date | Changes |
|------|------|---------|
| Initial remediation | 2026-07-03 | Skip links, reduced-motion, table semantics, dialog ARIA, headings, contrast/touch on key controls, aria-live, link fixes — see `WCAG_AUDIT_REPORT.md` |
| Link / cleanup | 2026-07-03 | `AuthFlowBrand` → `/`, support email, deleted unused marketing components |
| **This re-audit** | 2026-07-03 | **Report only — no code changes** |

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- Demo credentials path: `docs/WCAG_DEMO.md`
- Full-repo audit (includes admin): `docs/WCAG_AUDIT_REPORT.md`
