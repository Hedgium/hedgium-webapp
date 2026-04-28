# AGENTS.md — Hedgium Webapp

AI agent context for the `hedgium_webapp` Next.js project.
Read this before touching any code.

---

## Project Identity

**hedgium_webapp** is the main trading SaaS application for Hedgium.
This is where authenticated users live — traders, admins, and onboarding flows.

The public marketing site lives in `hedgium_frontend` (brand + leads only).
The backend API lives in `hedgium_backend` (Django + Ninja Extra).

**Priorities (in order):**
1. Security — correct session handling, no token leaks, safe auth flows
2. Correctness — UI must always reflect true backend state (especially trade data)
3. Performance — fast load, no unnecessary re-renders, efficient real-time updates
4. UX — clean, intuitive flows built for traders, not general consumers
5. Maintainability — solo codebase, must be easy to revisit and extend

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + DaisyUI v5 |
| Charts | Recharts |
| Complex selects | react-select |
| State | Zustand v5 |
| Auth | JWT (httpOnly cookies via `js-cookie` + `jsonwebtoken`) |
| Icons | Lucide React |
| Animations | AOS (minimal — app context, not marketing) |
| Theme | next-themes |
| Backend | Django REST API (`hedgium_backend`) |

---

## Routes

```
/                   → Home / redirect based on auth state
/login              → JWT login
/register           → New account
/forgot-password    → Password reset request
/reset-password     → Password reset confirm
/onboarding         → Post-signup onboarding flow
/web-login          → Broker web login (Kite/Zerodha)
/get-started        → Pre-auth entry point
/about              → About page (within app shell)
/(app)/             → Authenticated app shell
/admin/             → Admin panel (role-gated)
/sandbox/           → Sandbox / paper trading
/complaint-status   → Public complaint lookup
/privacy-policy     → Legal
/terms-of-use       → Legal
/refund-policy      → Legal
/grievance-redressal → Legal
/mitc-ia            → MITC — Investment Adviser
/mitc-ra            → MITC — Research Analyst
```

Protected routes under `/(app)/` and `/admin/` require valid JWT session.
Middleware or layout-level auth checks must guard all authenticated paths.

---

## Project Structure

```
hedgium_webapp/
├── 00_Context/             # Working style, brand voice, design principles — read first
├── src/
│   ├── app/                # App Router — pages, layouts, API routes
│   │   ├── (app)/          # Authenticated app shell (dashboard, positions, reports, etc.)
│   │   ├── admin/          # Admin panel pages (role-gated)
│   │   ├── sandbox/        # Sandbox / paper trading
│   │   ├── login/          # Auth flow pages
│   │   └── api/            # Next.js API routes (thin proxies or server actions)
│   ├── components/         # Shared UI components
│   │   ├── home/           # Landing/marketing sections inside the app
│   │   ├── admin/          # Admin-specific components
│   │   ├── positions/      # Position display components
│   │   ├── reports/        # Reports and charts
│   │   ├── sandbox/        # Sandbox UI
│   │   ├── settings/       # Settings pages
│   │   ├── skeletons/      # Loading skeleton components
│   │   └── *.tsx           # Shared: AuthFlowShell, Navbar, BrokerConnect, etc.
│   ├── services/           # API call functions — one file per domain
│   │   ├── liveTradingActions.ts
│   │   ├── positions.ts
│   │   ├── builder.ts
│   │   ├── profile.ts
│   │   └── brokerProxyPool.ts
│   ├── store/              # Zustand stores — one per domain
│   │   ├── authStore.ts
│   │   ├── alertStore.ts
│   │   ├── notificationStore.ts
│   │   └── sandboxStore.ts
│   ├── types/              # Shared TypeScript types — API contracts
│   │   ├── positions.ts
│   │   ├── builder.ts
│   │   ├── profile.ts
│   │   └── brokerProxyPool.ts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Low-level utilities, API client config
│   ├── providers/          # React context providers
│   ├── content/            # Static content (copy, legal text)
│   ├── data/               # Static data / constants
│   ├── context/            # React context definitions
│   ├── utils/              # Shared utility functions
│   └── middleware.ts       # Next.js middleware — auth guards
├── public/                 # Static assets
└── tailwind.config.js      # Tailwind + DaisyUI theme config
```

---

## Architecture Rules

### Pages
- Pages are thin — push logic into hooks, services, or stores.
- Prefer Server Components for data fetching. Use `"use client"` only when interactivity requires it.
- Authenticated pages live under `/(app)/` with layout-level session validation.

### Services (`src/services/`)
- One file per backend domain. All Django API calls go here — not inside components.
- Return typed responses. Never return `any` or raw `fetch` response objects.
- Handle API errors at the service layer; throw structured errors for UI to catch.

### State (`src/store/`)
- One Zustand store per domain — auth, alerts, notifications, sandbox.
- Keep stores focused; don't dump unrelated state into one store.
- No prop drilling more than 2 levels — lift to store instead.

### Types (`src/types/`)
- Single source of truth for Django API response shapes.
- When `hedgium_backend` API changes, update types here **immediately** — do not drift.
- No `any`. No implicit `any`. Use discriminated unions for multi-state shapes (loading / error / data).

### Middleware (`src/middleware.ts`)
- Handles auth routing — unauthenticated requests to protected paths redirect to `/login`.
- Do not duplicate auth logic inside individual page components.

---

## Auth Rules

- JWTs live in **httpOnly cookies** — never `localStorage`, never `sessionStorage`.
- Never expose `NEXT_PUBLIC_` prefixed secrets.
- `ProtectedRoute` component and middleware are the two layers of auth enforcement — both must stay in place.
- Do not trust the frontend for authorization — all sensitive operations are enforced server-side in `hedgium_backend`.
- Session expiry: handle 401 responses globally (redirect to login, clear store).

---

## Design Direction

See `00_Context/design-principles.md` for the full visual system. Core rules:

- **Reference implementation:** Reports and Positions pages — match their shell and typography.
- **No box shadows** — depth via borders, translucency (`bg-base-100/55`–`/80`), and `backdrop-blur`.
- **DaisyUI semantic tokens** — never raw hex or hardcoded grays.
- **Skeletons over spinners** for layout-level loading states. Spinners for button-level or small regions.
- **Compact and scannable** — dense but readable; traders scan, they don't read.

---

## Performance Rules

- Use `React.memo` and `useMemo` deliberately — not as a default reflex.
- Lazy-load heavy components (charts, strategy builder, modals) with `next/dynamic`.
- Recharts components are heavy — always lazy-load them.
- Avoid re-renders from store subscriptions — subscribe to slices, not the whole store.
- Minimize client-side JS in the critical path — lean on Server Components where possible.

---

## Backend Contract (`hedgium_backend`)

- API is Django Ninja Extra — all endpoints are typed and schema-driven.
- API base URL comes from environment config — never hardcode it.
- All financial figures from the API (PnL, margin, price) are authoritative — never derive them client-side.
- If the API shape changes, update `src/types/` and all affected service files before touching UI.

---

## AI Collaboration Rules

Read `00_Context/working-style.md` for the full contract. Key points:

- Senior Next.js engineer tone — explain *why*, skip the basics.
- Production-grade code only. No shortcuts.
- No `any` in TypeScript. All props typed. All API responses explicitly typed.
- Prefer Server Components; use `"use client"` only when unavoidable.
- Flag anything touching auth, session state, or financial data display for extra review.
- When confidence is low, say so and offer two options with trade-offs.
- Never guess at API contract changes — ask before assuming.

---

## Communication Style

Read `00_Context/brand-voice.md`. Core rules:

- Get to the point. No preamble.
- Headers, bullets, code blocks consistently.
- No filler: no "Great!", "Certainly!", "It's worth noting..."
