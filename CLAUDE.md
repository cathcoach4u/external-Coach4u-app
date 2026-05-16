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
planning.html           — Planning hub (2 activity cards → annual + quarterly session lists)
annual-sessions.html    — list of past + scheduled annual planning sessions
run-annual-session.html — workspace for a single annual planning session (attendance + areas checklist + share link to team check-in)
quarterly-sessions.html — list of past + scheduled quarterly planning sessions
run-quarterly-session.html — workspace for a single quarterly planning session (attendance + areas checklist + share link)
team-checkin.html       — public team-facing check-in form (no auth) — 17-question EOS-style organisational survey; submissions write to coach4u_team_checkins keyed by session_id + session_type
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

scorecard.html, goals.html, meeting.html, run-meeting.html, issues.html
                        — Operations tools (meeting.html = past list, run-meeting.html = workspace)

learn/                  — reference area
└── values-discovery.html       — guided 3-step values exercise (localStorage)

css/
└── style.css           — Design 1 system v2.2

js/
├── auth.js             — sign in / out, membership gate
├── active-session.js   — floating "Resume Planning Session" pill (reads coach4u_active_planning_session)
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
v0.5.73

## Recent Changes (v0.5.73)
- **Planning session workspaces simplified to attendance + checklist + share link.** Both `run-annual-session.html` and `run-quarterly-session.html` previously had a multi-step agenda accordion with per-step notes textareas, a 1–10 session-rating step, a "Review Team Check-in" agenda step, and a big inline aggregated check-in results table at the top. Stripped all of that.
- New workspace shape (both files): **status dropdown + timer**, then a **📋 Attendance** block (single textarea, debounced ~300ms auto-save), then **✅ Areas to Cover** (one checkbox per area with the existing Strategy/Goals deep-links inline beside each row + a "{n} of {total} areas completed" progress hint), then a **🌟 Team Check-in** block reduced to two buttons — **Copy Check-in Link** (teal, clipboard + toast) and **Open Form** (secondary). No count, no aggregated table, no comments view.
- **Annual** workspace has 4 areas: Review Last Year / Refresh Core Values + Core Focus / Update 10-Year + 3-Year Picture / Set 1-Year Plan + Q1 Goals. **Quarterly** has 3 areas: Review Last Quarter / Lessons + Adjustments / Set Next Quarter's Goals.
- **Persistence** — two new fields on each session object: `attendance: '<string>'` and `areas_completed: { [areaId]: boolean }`. Attendance saves debounced on input; checkboxes save immediately. Existing fields (`id`, `session_date`, `status`, `year`/`target_quarter`) preserved. New seeded sessions drop `agenda` / `rating` (the renderer no longer reads them); pre-existing localStorage data is left alone — no migration.
- **Removed CSS / JS**: `.rating-btns`, `.rating-btn`, `.notes-textarea`, `.ci-table`, `.ci-dot*`, `.ci-comments`, `.ci-q`, `.ci-c`, `.checkin-empty`, `.label-sm`, `.agenda-*` rules; `loadCheckins`, `aggregate`, `renderCheckinResultsTable`, `renderCheckinComments`, `updateAgendaNotes`, `buildAgendaSteps`, `priorQuarter` helpers. `team-checkin.html` itself is unchanged.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.73.

## Previous (v0.5.72)
- **Team Check-in form added.** A new public, auth-free page `team-checkin.html` lets team members rate 17 organisational health statements (1–5 Likert, EOS-style) before each Annual or Quarterly planning session. The leader copies a per-session link (`team-checkin.html?session=<id>&type=annual|quarterly`) from the session workspace and shares it with the team. Anyone with the link can submit — no Supabase auth gate.
- **17 questions** cover vision, core focus, 10-year + 3-year targets, accountability chart, "right seat", leadership trust, issue solving, weekly meetings, quarterly priorities, annual meetings, core values hiring/firing, "right people", mentoring/coaching, strengths-based culture, and thriving culture.
- **Each question** offers a 1–5 rating (1 = Strongly Disagree, 5 = Strongly Agree) plus an optional comment expander. Submissions validate required name + all 17 ratings before saving.
- **Database-ready JSON.** Submissions write to localStorage under `coach4u_team_checkins` as an array of `{ id, session_id, session_type, name, role, submitted_at (ISO), scores: number[17], comments: string[17] }`. This is the exact shape that will post to a future Supabase `team_checkins` table when the data layer is wired up — no restructuring needed.
- **Workspace aggregation.** Both `run-annual-session.html` and `run-quarterly-session.html` now have a "🌟 Team Check-in" block above the agenda showing the response count, a **Copy Check-in Link** button (clipboard + toast), an **Open Form** preview link, and a compact results table sorted lowest-avg first with red/amber/green dots (< 3 red, 3–4 amber, ≥ 4 green) so weak spots surface immediately.
- **New "Review Team Check-in" agenda item** inserted as Step 1 in both workspaces, pushing the existing steps to 2–6 (annual) / 2–5 (quarterly). Step body shows the same aggregated table plus per-question comments grouped by author so the team can read individual feedback during the meeting. Existing agenda step IDs (1–5 / 1–4) are unchanged in the underlying data — only the display number shifts — so saved notes still attach to the right step.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.72.

## Previous (v0.5.71)
- **Floating Resume Planning Session pill.** When you tap Start Session on an Annual or Quarterly Planning workspace, a teal pill appears bottom-center on every page in the app. Tap it to return to the in-progress session. Clears automatically when you mark the session completed or click End Session.
- Implemented as a shared `js/active-session.js` loaded via `<script defer>` on every main page (21 pages: the dashboard, all 4 hubs, the 5 Strategy worksheets, the 5 Operations tools, the 4 planning session pages, the one-page plan, and `learn/values-discovery.html`).
- Exposes `window.activeSession.set()` / `clear()` used by the two `run-*-session.html` workspaces. localStorage key: `coach4u_active_planning_session`.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.71.

## Previous (v0.5.70)
- **`planning.html` restructured as a standard hub** to match the Strategy and Operations layout. Dropped the vertical flow visualisation (was a 4-node concept map); replaced with the same `activity-card` pattern used on the other hubs.
  - Top: **"View One-Page Plan"** teal CTA (matches Strategy's pattern).
  - Below: **2 activity cards** — **Annual Planning** → `annual-sessions.html`, **Quarterly Planning** → `quarterly-sessions.html`.
  - Subtitle simplified to: "Your annual + quarterly planning rhythm. Set the year, then reset each quarter."
- All planning page state, links, and routing preserved; only the layout changed.
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.70.

## Previous (v0.5.69)
- **Planning is now actionable, not just a diagram.** The Planning page cards previously dead-ended on the One-Page Plan and the Goals tool. They now open dedicated session list pages, mirroring the weekly Meeting flow.
  - **4 new pages** built on the same pattern as `meeting.html` + `run-meeting.html`:
    - `annual-sessions.html` — list of past + scheduled annual planning sessions, "+ New Annual Session" creates a session for today and opens the workspace
    - `run-annual-session.html` — single-session workspace with 5-step agenda accordion (Review Last Year / Refresh Core Values + Core Focus / Update 10-Year + 3-Year Picture / Set 1-Year Plan + Q1 Goals / Conclude — Rate the Session), each with a prompt, notes textarea, and per-step Save button; deep-links to the relevant Strategy worksheets
    - `quarterly-sessions.html` — list of past + scheduled quarterly sessions, "+ New Quarterly Session" opens a modal asking which quarter (Q2 / Q3 / Q4 / Q1 next year — pre-fills the next upcoming quarter) and auto-fills the date as the end of the prior quarter
    - `run-quarterly-session.html` — single-session workspace with 4-step agenda (Review Last Quarter / Lessons + Adjustments / Set Next Quarter's Goals / Conclude — Rate the Session), prompt text dynamically refers to the prior quarter (e.g. "Walk through every Q1 2026 goal…")
  - Both workspaces use the same status dropdown (scheduled / in_progress / completed), Start/End Session timer, 1–10 rating buttons, and per-step notes pattern from `run-meeting.html`.
  - **localStorage keys**: `coach4u_annual_sessions` (array of session objects) and `coach4u_quarterly_sessions` (array of session objects). No nested wrapper — simpler than the meetings shape.
  - **Seed data**: annual list seeds 1 completed session (this year's Jan 1, rating 8, sample notes per step) + 1 scheduled (next year's Jan 1). Quarterly list seeds 2 completed (Q2 2026 + Q3 2026 with notes) + 1 scheduled for the next upcoming quarter.
  - **`planning.html` cards repointed**: Annual → `annual-sessions.html`; all three Q2/Q3/Q4 cards → `quarterly-sessions.html`. The "View One-Page Plan" top CTA is unchanged.
  - **`index.html` `ensureSeeds()` extended** so visiting the dashboard first pre-seeds both new keys (matches the existing pattern for the 5 worksheet/operations keys).
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.69.

## Previous (v0.5.68)
- **Planning page collapsed from 5 sessions to 4.** The previous "Q1 Review" was redundant — the Annual Planning session already produces the Q1 plan, so a separate Q1 Review meeting was double work.
  - New flow: **Annual Planning** (sets year + Q1 plan) → **Q2 Planning Session** (end of Q1, produces Q2 goals) → **Q3 Planning Session** (end of Q2, produces Q3 goals) → **Q4 Planning Session** (end of Q3, produces Q4 goals) → cycles back to next year's Annual.
  - Renamed the quarterly nodes from "Qn Review" → "Qn Planning Session" since each is forward-looking (reviews the prior quarter then plans the next). Icon changed from 🔁 to 🎯.
  - Subtitle updated: "Four sessions a year. Annual sets the year and Q1; three quarterly sessions reset for Q2, Q3, and Q4."
- Bumped `VERSION`, `sw.js` `CACHE_VERSION`, and dashboard label to v0.5.68.

## Previous (v0.5.67)
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

## Earlier History (v0.5.9 – v0.5.59) — Summary
Pre-v0.5.60 milestones, compressed:
- **v0.5.59** — Issues simplified (priority removed); "Run Weekly Meeting" CTA creates this-week's meeting; Goals tip box; Scorecard renamed to "Weekly Numbers".
- **v0.5.58** — PWA icon fixed (4U now visible in teal); hub top gap tightened; Dashboard "Go to This Week's Meeting" opens `run-meeting.html?id=X` directly.
- **v0.5.55–v0.5.57** — Issues kanban → 2 columns; Scorecard mobile sticky-column; Hub CTAs moved to top; Dashboard links all repointed to actual tools.
- **v0.5.54** — Meeting split into past-list (`meeting.html`) + active workspace (`run-meeting.html`).
- **v0.5.51** — Strategy worksheets + Operations tools promoted out of `learn/` to project root. `learn/` reduced to reference area (Values Discovery only).
- **v0.5.50** — Operations tools (scorecard/goals/meeting/issues) given localStorage demo data stub in place of dead `/api/...` calls.
- **v0.5.41–v0.5.49** — Multiple structure passes consolidating to Design 1 (Aptos, navy + teal). Deleted legacy `business/`, `css/activity.css`, root orphans `values.html`, `vision-strategy.html`, `marketing.html`, `targeting.html`. Login gold-standardised.
- **v0.5.33–v0.5.40** — Dashboard placeholder sections built; Strategy + One-Page Plan landscape layout introduced; Learning Vault + Values Discovery exercise added; consolidated to single Supabase project.
- **v0.5.9–v0.5.12** — Root portal restored as primary; legacy modules (Accountability Chart, Team Alignment) moved out to `yourteamcoach`.

## App URLs
- Portal (primary): `https://cathcoach4u.github.io/yourbusinesscoach/`

## Current Status
- **Dashboard** (`index.html`) — live, reads all panels from localStorage (`coach4u_*` keys), pre-seeds on first visit via `ensureSeeds()`
- **Hubs** — `strategy.html`, `operations.html`, `planning.html`, `learning-vault.html` — uniform Design 1 layout (CTA + activity cards)
- **Strategy worksheets** at root — core-values, core-focus, targets, marketing-strategy, leadership-team. Auto-save to localStorage, seed on first visit, feed `one-page-plan.html`
- **Operations tools** at root — scorecard (Weekly Numbers), goals (Quarterly Goals), meeting (Past list) + run-meeting (workspace), issues. localStorage demo data stub in place of `/api/...` calls
- **Planning sessions** — annual-sessions + run-annual-session (4 areas) and quarterly-sessions + run-quarterly-session (3 areas). Workspaces now use attendance + checklist + team check-in share link (no notes / no rating)
- **Team Check-in** — public auth-free `team-checkin.html` (17 EOS-style questions, 1–5 Likert). Submissions to `coach4u_team_checkins` keyed by session_id + session_type. Ready for Supabase swap-in
- **Resume pill** — floating "Resume Planning Session" pill on every page when a session is in progress (`coach4u_active_planning_session`)
- **Mobile**: Responsive at 390px and 768px breakpoints
- **Login**: Gold standard v2.2
- **Accountability Chart & Team Alignment**: MOVED to `yourteamcoach`

## Add a New Member (SQL)

```sql
INSERT INTO users (id, email, membership_status)
SELECT id, email, 'active'
FROM auth.users
WHERE LOWER(email) = LOWER('email@here.com');
```
