# Claude Code Project Memory

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes

## Project Overview
- Coach4U coaching portal — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses magic link (OTP) sign-in via Supabase

## Design System
- Primary (navy): `#003366`
- Accent (blue-teal): `#1D9E75` — buttons, active borders, links
- Accent dark (hover): `#0F6E56` — hover states
- Card borders: 2px solid, 12px border-radius
- Font: Aptos system stack
- Touch targets: 44px minimum height on mobile
- Links: blue-teal (`#1D9E75`), not navy or green-teal
- IMPORTANT: Do NOT use `#00B894` (green-teal) on the dashboard — use `#1D9E75` instead

## Key Files
- `dashboard.html` — Main dashboard with module cards
- `index.html` — Login page
- `js/auth.js` — Authentication (magic link, redirects)
- `js/supabase.js` — Supabase client config
- `css/style.css` — Shared design system for module pages
- `business/`, `growth/`, `teams/`, `personal/`, `relationships/`, `thrivehq/` — Module pages

## Current Version
v0.3.0
