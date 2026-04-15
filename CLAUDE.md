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
v0.5.2

## Recent Fixes (v0.5.2)
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

## Design Audit Results (v0.5.1)
**Typography Issues Found:**
- Inconsistent font sizes: 26px, 22px, 16px, 14px, 13.5px, 13px, 12.5px, 12px, 11px
- Inconsistent font weights: 800, 700, 600, 500, 400 (no clear hierarchy)
- No unified type scale

**Color Issues:**
- Primary navy #003366 correct
- Text colors vary (#212529, #6C757D, etc)
- Hard-coded alert colors not using variables

**Spacing Issues:**
- Too many padding/margin values (5px to 28px)
- No consistent spacing scale
- Multiple breakpoints: 390px, 600px, 768px, 960px, 1000px

**Current Status**
- **Functionality**: WORKING - pills click, panels switch
- **Design**: IN PROGRESS - header fixed, need typography/spacing refactor
- **Mobile**: Responsive but breakpoints messy

## Outstanding Tasks
1. ✅ **Typography Refactor** - COMPLETE (v0.5.2)
2. **Spacing Refactor** - Standardize to 8, 12, 16, 24, 32px scale
3. **Color Variables** - Convert hard-coded colors to CSS variables
4. **Simplify Breakpoints** - Consolidate to 390px, 768px, 1200px
5. **Test Mobile Responsiveness** - Verify all pages work at 390px+
