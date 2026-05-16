# Claude Code Project Memory

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes
- Bump version number with EVERY change (patch: 0.5.x). Three files MUST stay in sync:
  - `CLAUDE.md` → `## Current Version` line
  - `VERSION` (just the number, e.g. `0.5.46`)
  - `sw.js` → `CACHE_VERSION = 'coach4u-vX.Y.Z'`
- The visible label on `index.html` dashboard footer must also be updated each bump
- For large file changes: split into small focused files (each under ~8KB) to avoid push timeouts

## Project Overview
- Coach4U business strategy portal — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses email + password sign-in via Supabase

## Design System

**One design.** Aptos system stack, navy `#003366` primary, teal `#0D9488` accent — applied to every page in the project.

- Primary (navy): `#003366` | Primary dark: `#002244` (hover)
- Accent (teal): `#0D9488` | Accent dark: `#0F766E` (hover)
- Text: `#333333` | Muted: `#888888`
- Font: **Aptos system stack** — no Google Fonts
- Card border: `2px solid var(--accent)` or `1px solid var(--border)` depending on prominence
- Border-radius: `10px`
- Tip box (`.ws-hint`): `#f8fafc` bg, teal left border — used for "Explore X exercises in the Learning Vault →" prompts

Stylesheets:
- `css/style.css` — main design system v2.2 (loaded on every page)

## File Structure
```
index.html              — root portal / dashboard
strategy.html           — Strategy hub
operations.html         — Operations hub
learning-vault.html     — Learning Vault hub
one-page-plan.html      — printable landscape one-page business plan
login.html              — gold standard login
forgot-password.html
reset-password.html
inactive.html           — shown when membership_status ≠ 'active'
offline.html            — service-worker offline fallback
404.html

scorecard.html, goals.html, meeting.html, issues.html
                        — Operations static info pages

learn/                  — all activities and interactive tools (flat)
├── values-discovery.html       — guided 3-step values exercise (localStorage)
├── core-values.html            — Strategy worksheet
├── core-focus.html             — Strategy worksheet
├── targets.html                — Strategy worksheet
├── marketing-strategy.html     — Strategy worksheet
├── scorecard.html              — Operations tool
├── goals.html                  — Operations tool
├── meeting.html                — Operations tool
└── issues.html                 — Operations tool

css/
└── style.css           — Design 1 system v2.2

js/
├── auth.js             — sign in / out, membership gate
└── supabase.js         — Supabase client + dashboard helpers
```

## Key Rules
- All HTML pages use Design 1 (`css/style.css`) — no exceptions
- Every interactive activity lives flat in `learn/`. No page outside the Learning Vault should link directly to a specific activity
- Strategy worksheets save bar is visual only (no save logic wired up yet)
- Operations tools (scorecard / goals / meeting / issues) use a localStorage demo data stub seeded with realistic sample data. The previous `/api/...` calls are intercepted and routed to localStorage. Replace with the real Supabase data layer when ready.
- Bottom nav order is always: Home / Strategy / Operations / Learn — active item gets `.active` class

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
Single project for auth + database. Every page (login, auth flows, dashboard, worksheets) uses the same client:
- URL: `https://eekefsuaefgpqmjdyniy.supabase.co`
- Anon key: `sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y`

Always use unversioned import:
```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
```

## Current Version
v0.5.50

## Recent Changes (v0.5.50)
- Operations tools (scorecard, goals, meeting, issues) now seed and persist a demo dataset to localStorage — replaces the `/api/...` calls that never had a backend. Each tool's `api()` helper is now a per-tool localStorage router with sensible seed data so the tools look populated on first visit and changes persist in-browser.
- localStorage keys: `coach4u_demo_scorecard`, `coach4u_demo_rocks`, `coach4u_demo_meetings`, `coach4u_demo_issues`. The Supabase data layer rebuild will replace this stub.
- Scorecard seeds 6 metrics (New Leads, Discovery Calls Booked, Proposals Sent, Revenue (£k), Client NPS, Marketing Posts) with the last 6 ISO-week Mondays of entries — values are computed relative to today so the cells always look "recent".
- Goals seeds 4 quarterly priorities for Q2 2026 (the dropdown's default selected quarter) with mixed statuses (on_track / at_risk / off_track) so the kanban-style board renders multiple groupings on first load.
- Meeting seeds a completed meeting on the current Monday (with 3 headlines and 4 to-dos) plus a scheduled meeting on the next Monday. Headline `type` values are `good_news` / `headline` to match the existing renderer; todos use `description` / `owner` / `done` fields.
- Issues seeds 4 items spanning open / in-progress / resolved with mixed priorities — field names (`description`, `owner`, `priority`, `status`, `solution`) match what the existing kanban renderer reads. Status enum uses `open` / `ids_in_progress` / `resolved` per the existing modal.
- All UI / CSS / event handlers / modal logic unchanged — only the `api()` helper bodies were replaced. UI loading states briefly flash via a 30ms `setTimeout` in the stub.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.50.

## Previous (v0.5.49)
- Converted the 4 Operations tool pages (`learn/meeting.html`, `learn/scorecard.html`, `learn/goals.html`, `learn/issues.html`) from the legacy `activity.css` shell to the Design 1 worksheet shell used elsewhere in the project
- Each tool now uses the standard `site-header` + `.container` + `.ws-header` / `.ws-title` / `.ws-sub` pattern, navy `#003366` / teal `#0D9488` Design 1 variables, and the unified Aptos-inherit font stack
- Replaced legacy `.act-btn .act-btn-primary` / `.act-btn .act-btn-secondary` with locally-scoped `.ws-btn` / `.ws-btn-secondary` rules in each file's `<style>` block
- Added the standard bottom nav (Home / Strategy / Operations / Learn) to all 4 pages with Operations marked active; back link in the site header now points to `../operations.html`
- **Deleted `css/activity.css`** — no longer referenced anywhere in the active app
- **Deleted root orphans `values.html` and `vision-strategy.html`** — leftovers from the deleted `business/` directory (Design 2, Google Fonts, referenced the now-deleted `css/activity.css`); not linked from anywhere in the app
- All tool functionality, IDs, data attributes, event listeners, modal/popover/table CSS, and `<script>` blocks remain untouched
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.49

## Previous (v0.5.48)
- Added a 5th Strategy activity card: **Leadership Team** (icon 👥) → `learn/leadership-team.html`
- New worksheet `learn/leadership-team.html` (Design 1): editable team-member cards with name / role / responsibilities, "+ Add Team Member" button, edit-in-place + delete per card, "Save Leadership Team" button. Persistence: `localStorage` key `coach4u_leadership_team`. Seeds with 5 default members (Cath Baker, Lou Henderson, Andrew Baker + 2 greyed `[Add your name]` placeholders) on first visit.
- `one-page-plan.html` now has a full-width **Leadership Team** band between the 3-column body and the footer — compact Name | Role | Key Responsibility table reading from the same `coach4u_leadership_team` localStorage key. Falls back to "Add your leadership team in the Strategy section." when empty. Includes print rules so the band stays on the same A4 landscape page.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.48.

## Previous (v0.5.47)
- Added a parallel teal CTA to `operations.html` so the Strategy and Operations hub pages match up visually — Strategy had "View One-Page Plan", Operations now has "Run Weekly Meeting" linking to `learn/meeting.html`
- Updated `VERSION` and `sw.js` `CACHE_VERSION` to v0.5.47; dashboard label in `index.html` bumped to v0.5.47

## Previous (v0.5.46)
- Added a subtle `v0.5.46` label at the bottom of `index.html` (dashboard) so the live version is visible without opening files
- Synced the stale `VERSION` file (was `0.5.3`) and `sw.js` `CACHE_VERSION` (was `coach4u-v0.5.3`) to the current version
- Going forward, every version bump in this file must also update `VERSION` and `sw.js` so all three stay in lockstep

## Previous (v0.5.45)
- **Flattened `learn/`.** Removed the `learn/strategy/` and `learn/operations/` subdirectories — all activity files now sit directly in `learn/`. `one-page-plan.html` stays at root (it's a printable report, not an activity).
- All inbound links updated: `strategy.html`, `index.html`, `learning-vault.html`, and the Operations static info pages now point to `learn/<file>.html` directly.
- Paths inside moved files: `../../X` → `../X`.

## Previous (v0.5.44)
- Consolidated activity hierarchy under `learn/` (initial restructure, with `learn/strategy/` and `learn/operations/` subdirectories — now flattened in v0.5.45)
- Single design system — `css/activity.css` rewritten to use Design 1 colours and Aptos; Google Fonts removed from the 4 Operations tools

## Previous (v0.5.42)
- Removed the footer block on `login.html` (Strengths-Based Coaching tagline + website + email + phone)

## Previous (v0.5.41)
- Restructured Operations: the 4 interactive tools (scorecard, goals, meeting, issues) moved into `learn/` as Learning Vault tools
- Root `scorecard.html`, `goals.html`, `meeting.html`, `issues.html` are now clean **Design 1** static info pages (placeholders for "What it is / Why it matters / How to use it") with a teal CTA linking to the tool in `learn/`
- Added a new "Operations Tools" section to `learning-vault.html` with 4 cards linking to the relocated tools
- Relocated tools keep their existing Design 2 styling for now — paths repointed (`../css/style.css`, `../login.html`, etc.) and back link goes to `../learning-vault.html`
- Bottom nav on the new static pages marks Operations as active; on the relocated tools, Learning Vault is the back target

## Previous (v0.5.40)
- Consolidated to a single Supabase project. The app now exclusively uses `eekefsuaefgpqmjdyniy.supabase.co` — the old `uoixetfvboevjxlkfyqy.supabase.co` project (which only hosted the AI proxy Edge Function for the now-deleted /business/ Strategic Hub) is no longer referenced anywhere
- Deleted orphan JS files: `js/ai.js` (AI coach client, only used by deleted business/index.html), `js/app.js` and `js/app-business.js` (both orphaned by the /business/ removal)
- Cleaned `sw.js` precache list — removed entries for `js/ai.js`, `js/app.js`, and three non-existent `growth/*` files
- Updated CLAUDE.md Supabase section to reflect the single-project reality; dropped `js/ai.js` from the File Structure block
- AI coach integration will be rebuilt fresh when reintroduced; not part of the current root app

## Previous (v0.5.39)
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
