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
Applies to: all tool and activity pages — e.g. `scorecard.html`, `goals.html`, `meeting.html`, `issues.html`, any worksheet, builder, or exercise.

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
index.html                  — root portal / dashboard
strategy.html               — Strategy hub (Build Your Strategy)
operations.html             — Operations hub (Run Your Operations)
learning-vault.html         — Learning Vault (guided activities)
login.html                  — gold standard login (no inline styles, no Google Fonts, PWA meta)
forgot-password.html        — gold standard forgot password
reset-password.html         — gold standard reset password

strategy/                   — Strategy worksheet sub-pages (Design 1 — Aptos)
├── core-values.html
├── core-focus.html
├── targets.html
├── marketing-strategy.html
└── one-page-plan.html

learn/                      — Learning Vault exercises
└── values-discovery.html

scorecard.html, goals.html, meeting.html, issues.html   — Operations sub-pages (Design 2)

css/
├── style.css               — shared design system v2.2 (Design 1)
└── activity.css            — activity-page design system (Design 2)

js/
├── auth.js                 — authentication (email+password, redirects)
├── supabase.js             — Supabase client config
└── ai.js                   — AI coach (Claude API)
```

## Key Rules
- Root hub pages (`index.html`, `strategy.html`, `operations.html`, `learning-vault.html`) load only `css/style.css` (Design 1 — Aptos)
- Operations sub-pages (`scorecard.html`, `goals.html`, `meeting.html`, `issues.html`) load `css/style.css` + `css/activity.css` + Google Fonts (Design 2)
- Strategy worksheets (`strategy/*.html`) currently load only `css/style.css` — kept on Design 1 by convention

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

Post-login redirect: `index.html` (root portal)

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
v0.5.39

## Recent Changes (v0.5.39)
- Removed legacy `business/` directory entirely — `business/index.html` (Strategic Hub SPA), `business/values.html`, `business/vision-strategy.html`, all of `business/css/` and `business/js/`
- Repointed post-login redirect: `login.html` and `js/auth.js` now send users to root `index.html` instead of `business/index.html`
- Removed `business/index.html` and `business/js/app.js` from `sw.js` precache list
- Cleaned `CLAUDE.md` of all `business/` references (file structure, key rules, app URLs, current status)
- The 8-tool Strategic Hub previously at `/business/` is superseded by the root dashboard + `strategy.html` + `operations.html`; Accountability Chart and Team Alignment already moved to `yourteamcoach` (per v0.5.12)

## Previous (v0.5.38)
- Added Learning Vault tip box to `strategy/core-focus.html`, `strategy/targets.html`, `strategy/marketing-strategy.html` — mirrors the pattern already on `strategy/core-values.html`
- Each tip contains a short practical insight and a teal "Explore [topic] exercises in the Learning Vault →" link to `learning-vault.html`
- Added `.ws-hint` CSS rule to `targets.html` and `marketing-strategy.html` (it was missing); reused existing rule on `core-focus.html`

## Previous (v0.5.37)
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

## Current Status
- **Root dashboard**: WORKING — index.html, strategy.html, operations.html, learning-vault.html
- **Strategy worksheets**: WORKING — `strategy/*.html` (core-values, core-focus, targets, marketing-strategy, one-page-plan)
- **Operations sub-pages**: WORKING — scorecard, goals, meeting, issues
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
