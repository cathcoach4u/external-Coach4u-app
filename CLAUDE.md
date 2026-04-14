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
- Accent (teal): `#00B894`
- Accent dark: `#00997A`
- Card borders: 2px solid, 12px border-radius
- Font: Aptos system stack
- Touch targets: 44px minimum height on mobile
- Links: teal (`#00B894`), not navy

## Key Files
- `dashboard.html` — Main dashboard with module cards
- `index.html` — Login page
- `js/auth.js` — Authentication (magic link, redirects)
- `js/supabase.js` — Supabase client config
- `css/style.css` — Shared design system for module pages
- `business/`, `growth/`, `teams/`, `personal/`, `relationships/`, `thrivehq/` — Module pages

## Current Version
v0.3.0
