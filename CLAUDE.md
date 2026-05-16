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
strategy.html           — Strategy hub (cards link to root worksheets)
operations.html         — Operations hub (cards link to root tools)
planning.html           — Planning hub (annual + quarterly rhythm visualisation)
learning-vault.html     — reference / how-to area (one active card + coming-soon placeholders)
one-page-plan.html      — printable landscape one-page business plan (fed by the 5 worksheets)
login.html              — gold standard login
forgot-password.html
reset-password.html
inactive.html           — shown when membership_status ≠ 'active'
offline.html            — service-worker offline fallback
404.html

core-values.html, core-focus.html, targets.html,
marketing-strategy.html, leadership-team.html
                        — Strategy worksheets (source of truth, feed one-page-plan)

scorecard.html, goals.html, meeting.html, issues.html
                        — Operations tools (source of truth, feed meeting.html)

learn/                  — reference area
└── values-discovery.html       — guided 3-step values exercise (localStorage)

css/
└── style.css           — Design 1 system v2.2

js/
├── auth.js             — sign in / out, membership gate
└── supabase.js         — Supabase client + dashboard helpers
```

## Key Rules
- All HTML pages use Design 1 (`css/style.css`) — no exceptions
- Strategy worksheets and Operations tools live at root and ARE the source-of-truth pages. `learn/` is reserved for reference / how-to content (guides, exercises like Values Discovery). `strategy.html` and `operations.html` cards must link to root URLs, not `learn/`.
- Strategy worksheets persist all field edits to localStorage (keys: `coach4u_core_values`, `coach4u_core_focus`, `coach4u_targets`, `coach4u_marketing_strategy`, `coach4u_leadership_team`). On first visit each worksheet seeds realistic sample data. `one-page-plan.html` reads from those keys with the original hardcoded text as fallback when localStorage is empty.
- Operations tools (scorecard / goals / meeting / issues) use a localStorage demo data stub seeded with realistic sample data. The previous `/api/...` calls are intercepted and routed to localStorage. Replace with the real Supabase data layer when ready.
- Bottom nav order is always: Home / Planning / Strategy / Operations / Learn — active item gets `.active` class

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
v0.5.67

## Recent Changes (v0.5.67)
- **Leadership Team moved INTO the One-Page Plan body** so the plan fits on a single A4 landscape page when printed (the previous full-width band below the 3-column body was pushing the print to a second page).
  - Now lives as a compact field at the bottom of the **"Who We Are"** column — fits thematically (the column already covers Core Values, Purpose, Niche).
  - Compact line-per-person format: `<strong>Name</strong> · <accent>Role</accent>` (responsibilities dropped from the one-pager — they still live in the worksheet for reference).
  - Empty placeholder rows (no name and no role) are filtered out — so the one-pager only shows team members the user has actually filled in.
- Removed the standalone `.doc-team` band markup, styles, and print rules. Cleaner DOM and one less page-break risk.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.67.

## Previous (v0.5.66)
Final polish on `planning.html`:
- **Fixed sign-out button class** — was `class="signOutBtn"` (mass-rename slip from v0.5.65 that broke its styling), now correctly `class="sign-out-btn"`.
- **Bottom nav font aligned** with all other pages (`10px / 0.5px letter-spacing`).
- **Subtitle tightened** — "The annual + quarterly cadence that drives your business. Each quarter reviews the last and produces the next set of goals." → "Your annual + quarterly rhythm. Each review closes one quarter and sets up the next."
- **Stage labels simplified** — dropped the "Step N · " prefix on every node (the visual top-to-bottom flow already conveys order); labels now read just "Once a Year", "End of Q1", etc.
- **Annual node balanced** — added a `Reviews: Last year's results` row so it has the same two-row layout as the Q1–Q4 nodes.
- **"Start Here" chip** added to the Annual node (light-teal pill on navy gradient) so the entry point of the loop reads immediately.
- **Primary CTA at top** — `View One-Page Plan` teal button above the flow, mirroring the pattern on Strategy/Operations hubs.
- **Cycle indicator simplified** — dropped the muted "Each year refreshes..." subtext line; the visual loop already conveys the message.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.66.

## Previous (v0.5.65)
Audit fixes for consistency across all pages:
- **Hub titles simplified.** Dropped the verb prefixes on the two hubs that had them — `strategy.html` "Build Your Strategy" → "Strategy", `operations.html` "Run Your Operations" → "Operations". Now all 4 hubs match (Strategy / Operations / Planning / Learning Vault) and the bottom-nav labels.
- **Goals header-title** changed from "Goals" to **"Quarterly Goals"** so the breadcrumb label matches the page heading.
- **Sign-out button id standardised** to `signOutBtn` across all 17 pages (6 newer tools used `sign-out-btn` kebab-case — `getElementById` references updated to match).
- **Google Fonts purged from utility pages.** `offline.html`, `404.html`, `inactive.html`, `forgot-password.html` were still loading Inter + Montserrat from `fonts.googleapis.com` despite the project rule. Removed the `<link>` tags and swapped inline `font-family: 'Montserrat'` / `'Inter'` references to the Aptos system stack (or `inherit` where `css/style.css` is loaded). `login.html` and `reset-password.html` were already clean.
- **"Next Meeting" stat tile** on the dashboard now opens `run-meeting.html?id=X` directly — aligned with the "Go to This Week's Meeting" button and the "View Meeting" panel link, all three landing in the active workspace.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.65.

## Previous (v0.5.64)
- **Consistent hint box across all 9 worksheets/tools.** Every Strategy worksheet and Operations tool now has the same pattern under its `ws-header`: subtitle + one minimal `.ws-hint` containing a single Learning Vault link. Dropped the verbose paragraph tips that were duplicating the subtitle on the 4 strategy worksheets + leadership-team, and removed the goals "How many goals?" inline tip in favor of the consistent pattern.
- **Added LV links** to `scorecard.html` (Weekly Numbers), `meeting.html` (Past Meetings), `issues.html`, `goals.html` (Quarterly Goals) — they had no Learning Vault link before.
- **`.ws-hint` promoted to shared `css/style.css`** so every page uses one canonical rule (`#f8fafc` bg, teal left border, accent-coloured link). The page-local copies still work as overrides.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.64.

## Previous (v0.5.63)
- **Text-clipping audit on worksheets.** Seeded content was overflowing the fixed `rows` height on textareas (e.g. the 3rd unique on Marketing Strategy was hidden below the visible area) and a long single-line input was clipping horizontally.
  - Added an `autoGrow(textarea)` helper to all 4 Strategy worksheets that resizes each textarea to its `scrollHeight` on initial load and on every keystroke — so the field always fits its content.
  - Converted the **Marketing Strategy "Our Guarantee"** field from `<input type="text">` to `<textarea rows="2">` (it had a long seed value that was clipping at the right edge on mobile).
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.63.

## Previous (v0.5.62)
- **Robust seed merging.** Both the worksheets' `loadData()` and the dashboard's `seedIfEmpty()` previously accepted ANY non-null object — so a stale empty `{}` in localStorage (from earlier sessions before the seed logic landed) would short-circuit the seed and leave fields blank. Replaced with a **merge-missing-keys** strategy: any SEED key that's `undefined` in the stored object gets filled in (intentional empty strings are preserved). Applied to all 4 worksheets + the dashboard.
- **Core Values worksheet now lists 8 values** (was 5). Inputs 6/7/8 are optional. Seed data still fills only values 1–5; 6–8 stay empty by default. Dashboard panel and one-page-plan pills both iterate `value_1..value_8` now.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.62.

## Previous (v0.5.61)
- **Dashboard panels are now fully live.** Every clickable tile and panel on `index.html` reads from localStorage instead of showing hardcoded sample text:
  - **Open Issues** stat tile — count of `coach4u_demo_issues` where status ≠ resolved
  - **Goals On Track** stat tile — `on_track` rocks / total rocks in the current quarter from `coach4u_demo_rocks` (falls back to all rocks if no quarter match)
  - **Next Meeting** stat tile — first non-completed meeting from `coach4u_demo_meetings`, rendered as "Mon DD"
  - **1-Year Goal** panel — reads `coach4u_targets`: joins `one_year_goals` lines (stripped of "N." prefixes), shows `one_year_date` + `one_year_revenue` in the meta line
  - **Core Values** panel — reads `coach4u_core_values`, renders one pill per non-empty `value_1..value_5`
  - **This Week** todos panel — pulls todos from this Monday's meeting (or next upcoming), shows up to 4 with owner + done state. The "View Meeting →" link now goes to `run-meeting.html?id=X`
  - **This Quarter** panel — progress bar + label show `on_track`/`total` for current quarter, rock list renders each with the matching status pill (on_track / at_risk / off_track / done / not_started)
- **Pre-seed on first visit.** Added `ensureSeeds()` on dashboard load — writes seeded defaults to all 5 localStorage keys (`coach4u_core_values`, `coach4u_targets`, `coach4u_demo_meetings`, `coach4u_demo_rocks`, `coach4u_demo_issues`) ONLY if the key is missing. Means visiting the dashboard first now populates the data so every page (worksheets, tools, one-page-plan) shows consistent content without having to tap through each tool to trigger its own seed.
- Tool/worksheet seeds remain in their own files as a no-op safety net (`localStorage.setItem` only fires if value is null/empty in each tool's `loadData()`).
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.61.

## Previous (v0.5.60)
- **Strategy worksheets now persist edits and seed dummy data.** All 4 Strategy worksheets (`core-values.html`, `core-focus.html`, `targets.html`, `marketing-strategy.html`) auto-save every field edit to localStorage and seed realistic example content on first visit. Matches the architecture `leadership-team.html` already used.
  - Keys: `coach4u_core_values`, `coach4u_core_focus`, `coach4u_targets`, `coach4u_marketing_strategy` (plus existing `coach4u_leadership_team`).
  - Save bar shows a brief "Saved ✓" pulse on each edit.
- **`one-page-plan.html` now reflects worksheet edits.** Each field on the printable plan got a stable `id` (`opp-purpose`, `opp-niche`, `opp-ten-year`, `opp-3yr-*`, `opp-1yr-*`, `opp-values`, `opp-target-market`, `opp-uniques`, `opp-process`, `opp-guarantee`). On load, an `applyWorksheetData()` reads the 4 new localStorage keys (+ the existing leadership team key) and overrides the hardcoded HTML where data exists. Hardcoded text remains as a fallback if localStorage is cleared.
- Multi-line fields (`one_year_goals`, `uniques`) render as numbered `<li>` items in the One-Page Plan, re-numbered from 1 regardless of how the user numbered them in the worksheet (the leading "N. " is stripped on render).
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.60.

## Previous (v0.5.59)
- **Issues simplified.** Priority (high/medium/low) removed entirely — gone from the modal, the card display, the seed data, and the localStorage save/load. Cards now just show description + owner (no priority badge, no date, no status — status is implicit by the column the card sits in). Solved tag also dropped (redundant in the Resolved column). The teal left-border replaces the per-priority red/amber/green border colors.
- **"Run Weekly Meeting" CTA** on `operations.html` now creates (or opens) this week's meeting and lands you in `run-meeting.html`. The button checks `coach4u_demo_meetings` localStorage — if a meeting exists for today's ISO-week Monday it opens that one; otherwise it creates one (status `scheduled`, current quarter) and opens it.
- **Goals tip.** Added a teal-bordered hint at the top of `goals.html`: "Aim for 3–7 company goals per quarter, plus 1–3 individual goals per leader. Keep them specific, measurable, and ownable." Updated the page subtitle to drop the EOS-style "3–7" inline phrasing (now in the tip box).
- **Scorecard renamed to "Weekly Numbers"** (avoids EOS jargon). Updated: page `<title>`, header label, `ws-title`, the Operations card label ("Weekly Numbers"), and the Run Meeting agenda item ("Numbers Review" + "Open Weekly Numbers →" link). File name `scorecard.html` and the URL stay the same.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.59

## Previous (v0.5.58)
- **PWA icon fixed.** `favicon.svg` had its "4U" text filled with `#001a33` — same as the navy background, so it rendered as just an empty area next to the "C". Repainted the "4U" in teal `#0D9488`, simplified the SVG, and added an explicit `apple-touch-icon` link on `index.html`. Updated `manifest.json`: app name → "Your Business Coach" (was an outdated tagline), broken `/assets/icon-*.png` references replaced with the working `favicon.svg`, theme/background colors aligned to navy `#003366`.
- **Hub top gap tightened.** `strategy.html` and `operations.html` had `.activities-section { padding: 24px 16px 0 }` on top of the container's mobile 20px top padding (44px total). Dropped the section's top padding so the primary CTA sits ~20px below the title bar.
- **Dashboard "Go to This Week's Meeting"** now opens the actual meeting in `run-meeting.html?id=X` instead of dropping you on the past-meetings list. The href is set on page load: finds the meeting whose date matches the current ISO-week Monday, falling back to the first non-completed meeting, falling back to the first meeting. Reads from the same `coach4u_demo_meetings` localStorage key.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.58

## Previous (v0.5.57)
- **Hub CTAs moved to top.** `strategy.html` "View One-Page Plan" button is now above the 5 worksheet cards (was below); `operations.html` "Run Weekly Meeting" button is now above the 4 tool cards (was below). The primary action is the first thing in view.
- **Dashboard link audit (`index.html`).** All clickable elements now go to the actual tool instead of the Operations hub:
  - Stat tile "Open Issues" → `issues.html` (was `operations.html`)
  - Stat tile "Goals On Track" → `goals.html` (was `operations.html`)
  - Stat tile "Next Meeting" → `meeting.html` (was `operations.html`)
  - "Go to This Week's Meeting" big CTA → `meeting.html` (was `operations.html`)
  - "View Meeting" panel link (This Week) → `meeting.html` (was `operations.html`)
  - "View Goals" panel link (This Quarter) → `goals.html` (was `operations.html`)
  - Edit links on 1-Year Goal (→`targets.html`) and Core Values (→`core-values.html`) were already correct
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.57

## Previous (v0.5.56)
- Added a new **Planning** section (`planning.html`) as a top-level hub between Home and Strategy in the bottom nav. The page visualises the annual + quarterly planning rhythm as a vertical flow: Annual Planning → Q1 Review → Q2 Review → Q3 Review → Q4 Review → cycles back to Annual. Each stage shows what it Reviews and what it Produces.
- Annual Planning card links to `one-page-plan.html`; each quarterly review card links to `goals.html`.
- Bottom nav extended from 4 to 5 items (Home / Planning / Strategy / Operations / Learn) on all pages: `index.html`, `strategy.html`, `operations.html`, `learning-vault.html`, all 5 Strategy worksheets, all 5 Operations tools (including the new `run-meeting.html`), and `learn/values-discovery.html`.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.56

## Previous (v0.5.55)
- **Issues** simplified: dropped the "In Progress" middle column from the kanban — now just **Open** and **Resolved**. Modal status dropdown drops the "In Progress" option. Any legacy `ids_in_progress` items in localStorage fall into the Open column (the renderer treats anything other than `resolved` as open). Seed data updated to match.
- **Scorecard** mobile improvements: metric (first) column is now **sticky** on the left so it stays visible while scrolling weekly values horizontally. Owner column hidden on screens ≤ 600px (secondary info; still visible on desktop). Cells / week columns / table padding all tightened on mobile so the table fits and feels less cramped. Week-column min-width moved from inline JS style to a `.col-week` class so the mobile media query can override.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.55

## Previous (v0.5.54)
- Split the Meeting tool into two pages: `meeting.html` is now a clean list of past / scheduled meetings (Operations card lands here), and `run-meeting.html` is the active workspace (timer, agenda, headlines, todos, rating, notes).
- Clicking a row in the past-meetings list opens `run-meeting.html?id=X`. The "+ New Meeting" button creates a meeting and navigates straight into `run-meeting.html`.
- `run-meeting.html` back link → `meeting.html` (Past Meetings). Both pages share the same `coach4u_demo_meetings` localStorage data, so changes in the workspace immediately reflect in the list.
- Removed the sidebar layout from `meeting.html`; the past meetings now render full-width with a chevron arrow per row.

## Previous (v0.5.53)
- Fixed the Start / End Meeting button on `meeting.html` rendering literal `&#x23F9;` / `&#x25B6;` text — `.textContent` doesn't decode HTML entities, so the JS-set button labels were showing escape codes instead of glyphs. Replaced with literal ⏹ / ▶ Unicode characters.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.53

## Previous (v0.5.52)
- Deleted two stray root orphans `marketing.html` and `targeting.html` — older Design 1 info-page versions of `marketing-strategy.html` / `targets.html`, unreferenced from anywhere in the app (left over from an earlier restructure)
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.52

## Previous (v0.5.51)
- Promoted Strategy worksheets and Operations tools out of `learn/` to the project root. `strategy.html` and `operations.html` are now the source-of-truth navigation — their cards land directly on first-class root pages (e.g., `/scorecard.html`, `/core-values.html`).
- The 4 placeholder info pages at root (was: `scorecard.html`, `goals.html`, `meeting.html`, `issues.html`) are gone; their slots now serve the actual tools (moved from `learn/`).
- 9 files moved with `git mv` so history follows: `core-values.html`, `core-focus.html`, `targets.html`, `marketing-strategy.html`, `leadership-team.html`, `scorecard.html`, `goals.html`, `meeting.html`, `issues.html`. All `../` relative paths inside those files stripped to root-relative.
- `strategy.html` (5 worksheet card hrefs), `operations.html` (Run Weekly Meeting CTA), `index.html` (Edit links on 1-Year Goal and Core Values panels) repointed from `learn/X.html` to `X.html`.
- `learning-vault.html` reframed as a reference / how-to area — keeps Values Discovery as the one active card and shows 4 'coming soon' how-to cards (How to Build a Scorecard, How to Run Level 10 Meetings, Setting Quarterly Priorities, Defining Your Core Focus).
- `learn/` now holds only `values-discovery.html` — the guided exercise stays put.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.51.

## Previous (v0.5.50)
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
