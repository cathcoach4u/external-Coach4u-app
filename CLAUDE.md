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

## Design System

Two designs are used in this project. **Do not mix them.**
Both stylesheets are copied from `coach4u-shared/templates/css/` — that repo is a reference only, never modified directly.

### Design 1 — Dashboard & Login (`css/style.css` v2.2)
Applies to: `index.html` (portal homepage), `login.html`, `forgot-password.html`, `reset-password.html`, header, membership card, app card grid, footer.

- Primary (navy): `#003366`
- Primary dark: `#002244` — hover states
- Accent (teal): `#0D9488` — buttons, borders, links
- Accent dark: `#0F766E` — hover
- Text: `#333333` | Muted: `#888888`
- Font: Aptos system stack — **no Google Fonts**
- Card border: `2px solid var(--accent)` (teal)
- Border-radius: `10px`
- App card icon bg: `rgba(13,148,136,0.1)` (teal tint)

### Design 2 — Activity Pages (`css/activity.css` v1.0)
Applies to: all tool and activity pages — e.g. `business/vision-strategy.html`, any worksheet, builder, or exercise.

- Primary: `#1B3664` (darker navy)
- Accent: `#5684C4` (blue)
- Body text: `#2D2D2D`
- Font: Inter (headings) + Montserrat (body) — loaded via Google Fonts
- Card border: `1px solid #DDDDDD`, clean white background
- Border-radius: `16px`
- Input focus border: `#5684C4`
- Sticky save bar at bottom of page
- Uses `body.activity-page` class

## File Structure
```
business/
├── index.html              — slim ~300 lines (panels only, no modals)
├── css/
│   ├── activity.css        — activity/worksheet design system (Design 2)
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
└── style.css               — shared design system v2.2 (Design 1)

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
- Activity pages load: `../css/style.css` (for header/footer) + `css/activity.css` (for content)

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
v0.5.37

## Recent Changes (v0.5.37)
- Normalised inline CSS formatting in `operations.html` to match `strategy.html` byte-for-byte on shared rules (font sizes, weights, line-heights, card/nav styles)
- Both root hub pages confirmed using identical Aptos system stack via `css/style.css`
- No visual change — formatting consistency only

## Previous (v0.5.36)
- Created `learning-vault.html` — new top-level Learning Vault page with activity cards
- Created `learn/values-discovery.html` — 3-step guided discovery exercise (Identify → Define → In Action), saves to localStorage
- Added Learn tab (📚) as 4th item in bottom nav on all pages: index.html, strategy.html, operations.html, all strategy/* sub-pages
- Added discovery prompt on `strategy/core-values.html` linking to values-discovery exercise
- Learning Vault shows: Values Discovery (live), Core Focus / Targets / Marketing Strategy (coming soon)
- Values discovery “Finish” screen links back to `strategy/core-values.html` to enter results

## Previous (v0.5.35)
- Created `strategy/one-page-plan.html` — standalone landscape A4 one-page business plan
- 3-column layout: Who We Are / Where We Are Going / How We Go to Market
- Navy header bar, teal column headings, compact typography for single-page fit
- Print CSS uses `@page { size: A4 landscape; }` to force correct orientation
- “View One-Page Plan” button on strategy.html now links to this page
- strategy.html simplified — Section 2 (inline plan) removed, now just activity cards + link

## Previous (v0.5.34)
- Redesigned `strategy.html` with two sections on same page
- Section 1: "Build Your Strategy" — 2x2 activity cards (Core Values, Core Focus, Targets, Marketing Strategy) with description and teal border; "View One-Page Plan" scroll button
- Section 2: "Your One-Page Business Plan" — clean document layout with placeholder data; print button; print CSS hides Section 1 for A4 output
- Activity cards now link to `strategy/core-values.html`, `strategy/core-focus.html`, `strategy/targets.html`, `strategy/marketing-strategy.html`
- Three groups: WHO WE ARE, WHERE WE ARE GOING, HOW WE GO TO MARKET
- Auth wrapped in async init() function (no top-level return)

## Previous (v0.5.33)
- Redesign dashboard with placeholder sections: This Week, This Quarter, Core Focus, Business Pulse

## Previous (v0.5.12)
- Removed `organisation.chart.html` (Accountability Chart) — moved to `yourteamcoach`
- Removed `team-alignment.html` (Team Alignment) — moved to `yourteamcoach`
- Updated `index.html` to remove both module cards

## Previous (v0.5.11)
- Added Vision & Strategy standalone activity page (`business/vision-strategy.html`)
- Added `business/css/activity.css` (copied from coach4u-shared, Design 2)
- Updated CLAUDE.md to document two-design system
- Portal Vision & Strategy card now links to `business/vision-strategy.html`

## Previous (v0.5.9)
- Restored root `index.html` as the primary portal page (one card: Strategic Hub)
- Restored `business/index.html` as the full business app (7-tool module dashboard)
- Auth post-login redirect restored to `/business/`
- Root portal is the primary interface — all modules and AI will grow from here

## App URLs
- Portal (primary): `https://cathcoach4u.github.io/yourbusinesscoach/`
- Strategic Hub: `https://cathcoach4u.github.io/yourbusinesscoach/business/`

## Current Status
- **Business app**: WORKING — VTO, rocks, scorecard, meetings, issues
- **Vision & Strategy activity page**: WORKING — standalone worksheet at `business/vision-strategy.html`
- **Accountability Chart & Team Alignment**: MOVED to `yourteamcoach`
- **Mobile**: Responsive at 390px and 768px breakpoints
- **Login**: Gold standard v2.2

## Add a New Member (SQL)

```sql
INSERT INTO users (id, email, membership_status)
SELECT id, email, 'active'
FROM auth.users
WHERE LOWER(email) = LOWER('email@here.com');
```
