# About Me — Frontend

## Role
Tech Lead — sole designer, developer, and decision-maker for the Hedgium frontend.

## React / Next.js Experience
Advanced. Deep familiarity with the App Router, SSR/SSG patterns, component architecture,
and hooks. Building and owning a production-grade Next.js frontend solo.

## Project: Hedgium Frontend
A Next.js SaaS frontend for an algorithmic trading platform. Covers:
- **Trader dashboard** — live portfolio and trade visibility
- **Admin panel** — user management, strategies, orders
- **Auth flows** — login, registration, password reset, session handling
- **Strategy Builder** — UI for constructing and configuring trading strategies

## Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + DaisyUI
- **State:** Zustand (client-side global state)
- **Backend:** Django REST API

## Priorities (in order)
1. **Security** — correct session handling, no token leaks, safe auth flows
2. **Correctness** — UI must always reflect true backend state (especially trade data)
3. **Performance** — fast load times, no layout shifts, efficient re-renders
4. **UX** — clean, intuitive flows built for traders, not general users
5. **Maintainability** — component structure I can revisit and extend solo

## Known Pain Point
Keeping TypeScript types in sync with the Django REST API — especially as models evolve.
