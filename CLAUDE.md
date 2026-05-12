# Claude Code Project Memory

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes
- Bump version number with EVERY change (patch: 0.5.x) in `CLAUDE.md`
- For large file changes: split into small focused files (each under ~8KB) to avoid push timeouts

## Project Overview
- Coach4U business strategy portal — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses email + password sign-in via Supabase

## Design System (v2.2)
- Primary (navy): `#003366`
- Primary dark: `#002244` — hover states, dark headers
- Accent (teal): `#0D9488` — buttons, active borders, links
- Accent dark (hover): `#0F766E`
- Background: `#ffffff`
- Text: `#333333`
- Text muted: `#888888`
- Font: Aptos system stack — **no Google Fonts**
- Touch targets: 44px minimum height on mobile
- Card border-radius: 12px

## File Structure
```
business/
├── index.html              — slim ~300 lines (panels only, no modals)
├── css/
│   ├── base.css            — header overrides, vision banner, sub-nav, panel
│   ├── alignment.css       — team alignment & GWC
│   ├── org.css             — org chart / accountability chart
│   ├── rocks.css           — rocks / quarterly priorities
│   ├── scorecard.css       — scorecard table & cell popover
│   ├── meeting.css         — L10 meeting
│   ├── issues.css          — kanban / issues board
│   ├── ai.css              — AI coach FAB + floating sidebar
│   └── misc.css            — badges, forms, timer, group overview, responsive
└── js/
    ├── modals.js           — all modals + AI coach UI injected by JS
    └── app.js              — main app logic

css/
└── style.css               — shared design system v2.2 (variables, reset, cards, buttons, forms, login)

js/
├── auth.js                 — authentication (email+password, redirects)
├── supabase.js             — Supabase client config (points to business Supabase project)
└── ai.js                   — AI coach (Claude API)

login.html                  — gold standard login (no inline styles, no Google Fonts, PWA meta)
forgot-password.html        — gold standard forgot password
reset-password.html         — gold standard reset password
```

## Key Rules
- `business/index.html` loads: `css/style.css` (shared) + all 9 `business/css/*.css` files
- Modals are NOT in index.html — they are injected by `business/js/modals.js`
- Panel visibility: `.panel { display: block }` + `.panel.hidden { display: none }` (business override)
- Shared CSS uses opposite pattern: `.panel { display: none }` + `.panel.active { display: block }`

## Login Page Standard (Gold Standard v2.2)

`login.html` uses gold standard — no inline `<style>` blocks, no Google Fonts, `css/style.css` handles all login styling.

Required `<head>` structure:
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#003366">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Your Business Coach">
<link rel="stylesheet" href="css/style.css">
```

Post-login redirect: `business/index.html` (not `index.html`)

## Supabase
- **Auth pages** (login.html, forgot-password.html, reset-password.html):
  - URL: `https://eekefsuaefgpqmjdyniy.supabase.co`
  - Anon key: `sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y`
- **Dashboard app** (`js/supabase.js`):
  - URL: `https://uoixetfvboevjxlkfyqy.supabase.co`

Always use unversioned import:
```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
```

## Current Version
v0.5.8

## Recent Changes (v0.5.8)
- Root `index.html` is now the full business app (replaces old portal landing page)
- `business/index.html` is now a redirect to root for old bookmarks
- Auth post-login redirect updated from `/business/` to `/`
- App URL: `https://cathcoach4u.github.io/yourbusinesscoach/`

## Previous (v0.5.7)
- Removed hub tab navigation (Strategic / Operations / Team / Growth)
- Dashboard is now the home screen — shows all module cards on load
- Inside a tool, header shows `← Home` button; on dashboard shows `← Portal`
- Removed sub-nav entirely
- Flat navigation: Dashboard → Tool → Dashboard

## Previous (v0.5.6)
- Added Strategic Hub overview dashboard as Strategic tab default
- 7 module cards: Vision, Goals, Accountability Chart, Scorecard, Meeting, Issues, Team Alignment

## Current Status
- **Business app**: WORKING — VTO, org chart, rocks, scorecard, meetings, issues, team alignment
- **Mobile**: Responsive at 390px and 768px breakpoints
- **Login**: Gold standard v2.2

## Add a New Member (SQL)

```sql
INSERT INTO users (id, email, membership_status)
SELECT id, email, 'active'
FROM auth.users
WHERE LOWER(email) = LOWER('email@here.com');
```
