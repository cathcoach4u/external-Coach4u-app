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
v0.5.1

## Recent Fixes (v0.5.1)
- Fixed critical bug: business/index.html was loading wrong app.js file (/js/app.js instead of js/app.js)
- This prevented switchHub function from running, click handlers from working, and panels from displaying
- Pills now functional - clicking switches panels correctly
- Removed error toasts from load functions - shows clean empty states instead
- Added version badge (v0.5.1) to business header
- Nav pills styled as true pills (border-radius: 28px, semi-transparent white background, active pill white with navy text)
- Added 390px breakpoint for mobile nav pills (flex: 1 for equal width)

## Current Status
- **Functionality**: WORKING - pills click, panels switch, data attempts to load
- **Design**: BROKEN - header layout overlapping, pills not properly positioned, inconsistent spacing/fonts
- **Issue**: Pills overlap with content, header not responsive, needs comprehensive redesign

## Outstanding Tasks
1. **URGENT: Comprehensive redesign of business pages**
   - Fix header layout (pills overlapping content)
   - Fix pill positioning and spacing
   - Audit and fix all fonts, sizes, weights, hierarchy
   - Audit and fix all colors, contrast
   - Audit and fix all spacing, padding, margins
   - Ensure responsive mobile layout (390px+)
   - Consistent typography throughout
2. Ensure all functionality works: clicking tabs, loading data, switching panels
3. Visual polish and design audit
