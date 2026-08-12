# WCAG audit — demo account (webapp)

Accessibility auditors need a logged-in walkthrough of the trader shell without real broker data or live trading. This uses the same **demo user** mechanism as the mobile Play Store review flow.

## What auditors get

- A Django user with **`is_demo=True`** (admin-only; never self-service signup).
- After login, `GET users/auth/me/` returns `is_demo: true`.
- The webapp routes **data** requests to **`/api/demo/...`** — synthetic JSON from `hedgium_backend/demo/fixtures_data.py`.
- This is **not** `/api/sandbox/` (client peer-preview by plan tier).

## Django admin checklist

Create or reuse a demo user with:

| Field | Value |
|-------|--------|
| `is_demo` | `True` |
| `is_active` | `True` |
| `verified` | `True` |
| `signup_step` | `verified` |
| `kyc_skipped` | `True` |
| `is_staff` | `False` (unless you intend staff API access) |

Use a strong random password. Share **only** this username/password with the audit firm — never credentials for a real trading account.

You may use the same user as Google Play review (`HedgiumApp/docs/PLAY_STORE_DEMO.md`) or a dedicated account (e.g. `wcag-audit`).

## Pages to traverse

Auditors should cover the main authenticated shell:

- `/home` — trade cycles, market header (REST quotes)
- `/positions` — PnL summary, trade cycle positions
- `/reports` — charts and trade-cycle reports
- `/alerts` — notification list (HTTP; no live WebSocket on demo)
- `/settings` — profile (read-only), theme (local), password tab (read-only notice)
- `/simulation` — illustrative E1/E2 dashboard and reference strategies (demo fixtures)

Skip `/admin` and `/add-broker` — not part of the demo experience.

## Simulation (demo users)

Demo accounts use **`/api/demo/sandbox/*`** (not real `/api/sandbox/` DB profiles). The webapp **Simulation** nav link is shown for `is_demo` users; `simulationFetch` still requests `sandbox/…` (rewritten to `demo/sandbox/…` via `authFetch`). Backend paths remain `/api/sandbox/*` and `/api/demo/sandbox/*`.

Fixture data lives in `hedgium_backend/demo/sandbox_fixtures.py` — dashboard E1/E2 summary, before/after joining trade cycles, and position details per plan tier (BASIC / MASTERS / LEGENDS notional scaling).

## How the webapp routes APIs

When `user.is_demo` is true, [`src/utils/api.ts`](../src/utils/api.ts) `authFetch` rewrites paths to `demo/...` (same logic as [`HedgiumApp/utils/api.ts`](../../HedgiumApp/utils/api.ts)). Auth endpoints (`users/auth/*`, `users/token/refresh/`) stay on real paths.

## QA before handing credentials to auditors

1. Log in as the demo user on the webapp.
2. Confirm the **Preview mode** banner appears and is dismissible.
3. Walk Home → Positions → Reports → Alerts → Settings → Simulation — no 403 errors on data calls.
4. Confirm broker bar shows **DEMO** with full metrics dropdown (E1 total, E1 PnL, avl cash, total AC) from demo fixtures.
5. Log in as a normal client — confirm APIs do **not** use `demo/` prefix.
6. Optional: leave session open 30+ minutes — cookie token refresh should succeed.

## Related docs

- Backend fixtures: `hedgium_backend/demo/README.md`
- Mobile Play review: `HedgiumApp/docs/PLAY_STORE_DEMO.md`
