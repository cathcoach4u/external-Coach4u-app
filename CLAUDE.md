# Claude Code Project Memory

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes
- Bump version number with EVERY change (patch: 0.3.x) in: `VERSION`, `dashboard.html` header, and `CLAUDE.md`

## Project Overview
- Coach4U coaching portal — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses magic link (OTP) sign-in via Supabase

## Design System
- Primary (navy): `#003366`
- Accent (blue-teal): `#0D9488` — buttons, active borders, links
- Accent dark (hover): `#0F766E` — hover states
- Card borders: 2px solid, 12px border-radius
- Font: Aptos system stack
- Touch targets: 44px minimum height on mobile
- Links: blue-teal (`#0D9488`), not navy or green
- IMPORTANT: Do NOT use green-teal (`#00B894`, `#1D9E75`) on the dashboard — use `#0D9488` instead

## Key Files
- `dashboard.html` — Main dashboard with module cards
- `index.html` — Login page
- `js/auth.js` — Authentication (magic link, redirects)
- `js/supabase.js` — Supabase client config
- `css/style.css` — Shared design system for module pages
- `business/`, `growth/`, `teams/`, `personal/`, `relationships/`, `thrivehq/` — Module pages

## Current Version
v0.5.3

## Recent Fixes (v0.5.3)
- Built complete ThriveHQ external PWA app (Phase 1)
- Added ThriveHQ to `/thrivehq/` with separate Supabase project
- Configured PWA manifest and service worker for `/external-Coach4u-app/thrivehq/` path
- Magic link authentication ready with Supabase integration
- Brain Pulse dashboard with 4 sections (Capacity, Wellbeing, Strengths, Execution)
- Resources hub, account page, and offline support

## Previous Fixes (v0.5.2)
- Standardized typography: all fonts now use clean scale (11px, 12px, 14px, 16px, 18px, 24px, 32px)
- Consolidated 17 different font sizes into 7 standard sizes
- Improved readability with consistent type hierarchy
- Service worker cache version bumped to force refresh

## Previous Fixes (v0.5.1)
- Fixed critical bug: business/index.html was loading wrong app.js file (/js/app.js instead of js/app.js)
- Pills now functional - clicking switches panels correctly
- Removed error toasts from load functions - shows clean empty states
- Added version badge (v0.5.1) to business header
- Redesigned header to flex-direction column - pills no longer overlap content
- Nav pills styled as true pills (border-radius: 28px, proper spacing)

## Current Status
- **Coach4U**: WORKING - pills click, panels switch, business/growth/teams/personal/relationships pages functional
- **ThriveHQ**: READY - external PWA configured with Supabase, login page live
- **Mobile**: Responsive at 390px breakpoint

## Outstanding Tasks
1. ✅ **ThriveHQ Phase 1** - COMPLETE
2. Test ThriveHQ magic link authentication and dashboard
3. Populate resources table with ADHD tools/templates
4. Add test brain pulse assessments to see scores populate
5. Phase 2: Group chat functionality, historical tracking, client-initiated assessments
