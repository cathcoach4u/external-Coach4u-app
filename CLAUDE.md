# Claude Code Project Memory

> **Full version history lives in `CHANGELOG.md`.** This file is project memory: workflow, conventions, current state. Only the most recent change stays here as a pointer.

## Git Workflow
- Always push changes directly to `main` branch
- Commit with clear, descriptive messages
- Push after every commit — do not batch pushes
- **Bump version number with EVERY change** (patch: 0.5.x). **Four files MUST stay in sync:**
  1. `CLAUDE.md` → `## Current Version` line
  2. `VERSION` (just the number, e.g. `0.5.74`)
  3. `sw.js` → `CACHE_VERSION = 'coach4u-vX.Y.Z'`
  4. `business.html` → visible label at the bottom of the dashboard footer (`<p ...>vX.Y.Z</p>`)
- Append a new entry to `CHANGELOG.md` for every bump. Keep the most recent 1–2 entries duplicated under `## Latest` in this file as a pointer.
- For large file changes: split into small focused files (each under ~8KB) to avoid push timeouts

## Project Overview
- **Coach4U business strategy portal** — PWA with Supabase authentication
- Hosted on GitHub Pages at `/external-Coach4u-app/`
- Uses email + password sign-in via Supabase
- **Repo visibility**: public (this is a GitHub Pages site). The Supabase anon key in this file is the `sb_publishable_*` (anon) variant, which is intentionally publishable — it's not a server-side secret. All security relies on Supabase RLS policies. **Never commit a `service_role` key.**

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
index.html              — root portal: SARUBA account dashboard (formerly my-businesses.html)
business.html           — business-level dashboard (formerly index.html)
setup.html              — first-business wizard
strategy.html           — Strategy hub (cards link to root worksheets)
operations.html         — Operations hub (cards link to root tools)
planning.html           — Planning hub (2 activity cards → annual + quarterly session lists)
annual-sessions.html    — list of past + scheduled annual planning sessions
run-annual-session.html — workspace for a single annual planning session (attendance + areas checklist + share link to team check-in)
quarterly-sessions.html — list of past + scheduled quarterly planning sessions
run-quarterly-session.html — workspace for a single quarterly planning session (attendance + areas checklist + share link)
team-checkin.html       — public team-facing check-in form (no auth) — 17 EOS-style rated statements + name + optional role; submissions write to coach4u_team_checkins keyed by session_id + session_type
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

learn/                  — reference area (only contains values-discovery.html)
└── values-discovery.html       — guided 3-step values exercise (localStorage)

css/
└── style.css           — Design 1 system v2.2

js/
├── auth.js             — sign in / out, membership gate
├── active-session.js   — floating "Resume Planning Session" pill (reads coach4u_active_planning_session)
└── supabase.js         — Supabase client + dashboard helpers
```

## Key Rules

### Pages and routing
- All HTML pages use Design 1 (`css/style.css`) — no exceptions.
- Strategy worksheets and Operations tools live at root and ARE the source-of-truth pages. `learn/` is reserved for reference / how-to content (guides, exercises like Values Discovery). `strategy.html` and `operations.html` cards must link to root URLs, not `learn/`.
- Bottom nav order is always: **Home / Planning / Strategy / Operations / Learn** — active item gets `.active` class.

### Conventions every page must follow
- **Sign-out button** canonical ID: `id="signOutBtn"` (camelCase). Canonical class: `class="sign-out-btn"` (kebab-case). Both forms used together. JS lookups use `document.getElementById('signOutBtn')`.
- **Debounced text inputs** that auto-save (attendance, large textareas) use `setTimeout` debounce of **300ms** before writing to localStorage. Checkbox toggles and button clicks save immediately.
- **Auto-resizing textareas** in worksheets use the `autoGrow(textarea)` helper (resize to `scrollHeight` on load + every keystroke).
- **No Google Fonts anywhere** — the Aptos system stack inherits from `css/style.css`. Every utility page (`offline.html`, `404.html`, `inactive.html`, `forgot-password.html`) was audited in v0.5.65; do not reintroduce.

### Data layer (localStorage demo stub)
- Strategy worksheets persist all field edits to localStorage. Keys: `coach4u_core_values`, `coach4u_core_focus`, `coach4u_targets`, `coach4u_marketing_strategy`, `coach4u_leadership_team`. On first visit each worksheet seeds realistic sample data via a **merge-missing-keys** strategy (undefined keys get filled from SEED; intentional empty strings preserved). `one-page-plan.html` reads from those keys with the original hardcoded text as fallback when localStorage is empty.
- Operations tools (scorecard / goals / meeting / issues) use a localStorage demo data stub seeded with realistic sample data. The previous `/api/...` calls are intercepted and routed to localStorage. Replace with the real Supabase data layer when ready.
- Planning sessions use `coach4u_annual_sessions` (array) and `coach4u_quarterly_sessions` (array). No nested wrapper.
- Team check-in submissions: `coach4u_team_checkins` (array of `{ id, session_id, session_type, name, role, submitted_at, scores: number[17], comments: string[17] }`).
- Active planning session (for the Resume pill): `coach4u_active_planning_session` (single object).
- **Dashboard pre-seeds** all keys on first visit via `ensureSeeds()` in `business.html`.

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
Single project for auth + database. Every page uses the same client:
- URL: `https://eekefsuaefgpqmjdyniy.supabase.co`
- Anon key (publishable): `sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y`

The anon key is intentionally exposed — it's a `sb_publishable_*` key, designed for client-side use. Security is enforced via Supabase **Row Level Security (RLS)** policies on each table. **Never commit the `service_role` key** (server-side secret).

Always use unversioned import:
```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
```

## App URLs
- **Production** (only): `https://cathcoach4u.github.io/yourbusinesscoach/`
- No staging or branch preview URLs. GitHub Pages deploys `main` directly on every push.

## Current Version
v0.5.97

## Latest
- **v0.5.97** — **Cleanup pass before the data-layer migration.** Renamed `my-businesses.html` → `index.html` (account dashboard is now the root), and the former `index.html` → `business.html` (per-business dashboard). All href / location refs across 38 HTML files updated in two ordered sed passes. Stripped dead `.topic-*` / `.coming-soon-pill` / `.available-pill` CSS from the account dashboard (leftover from the v0.5.89 topic launcher that v0.5.95 removed). `setup.html` "already-onboarded" redirect goes to the account dashboard (`index.html`) instead of `business.html` so multi-business users land on the picker. Version label moved to `business.html`'s footer; CLAUDE.md updated. **Next: v0.5.98+ wires the strategy worksheets to Supabase** (fresh-data approach — no localStorage migration).
- **v0.5.96** — Built all 12 cross-business carousel leaf pages so every card on the 3 account-level hub pages now opens to a real navigable page (Strategy ×5, Planning ×3, Operations ×4). Same carousel chrome as `account-plans.html`: prev/next arrows + business name + dot indicators + keyboard arrows + print-current-view. Hub-page cards (`account-strategy.html` / `account-planning.html` / `account-operations.html`) flipped from "Coming soon" to "Open" for all 12. Data layer is still localStorage for most worksheet/operations pages, so empty businesses show the data-layer-pending banner — same pattern as `account-plans.html`.

## Current Status
- **Account dashboard** (`index.html`) — post-login landing; SARUBA account header + stats + businesses snapshot + users (Supabase-backed)
- **Business dashboard** (`business.html`) — single-business workspace; reads all panels from localStorage (`coach4u_*` keys), pre-seeds on first visit via `ensureSeeds()`
- **Hubs** — `strategy.html`, `operations.html`, `planning.html`, `learning-vault.html` — uniform Design 1 layout (CTA + activity cards)
- **Strategy worksheets** at root — core-values, core-focus, targets, marketing-strategy, leadership-team. Auto-save to localStorage, seed on first visit, feed `one-page-plan.html`
- **Operations tools** at root — scorecard (Weekly Numbers), goals (Quarterly Goals), meeting (Past list) + run-meeting (workspace), issues. localStorage demo data stub in place of `/api/...` calls
- **Planning sessions** — annual-sessions + run-annual-session (4 areas) and quarterly-sessions + run-quarterly-session (3 areas). Workspaces use attendance + checklist + team check-in share link (no notes / no rating)
- **Team Check-in** — public auth-free `team-checkin.html` (17 EOS-style rated statements + name + optional role). Submissions to `coach4u_team_checkins` keyed by session_id + session_type. Ready for Supabase swap-in
- **Resume pill** — floating "Resume Planning Session" pill on every page when a session is in progress (`coach4u_active_planning_session`)
- **Mobile**: Responsive at 390px and 768px breakpoints
- **Login**: Gold standard v2.2
- **Accountability Chart & Team Alignment**: MOVED to `yourteamcoach`

## Planned Architecture (Supabase Migration)

The localStorage layer is a stopgap. When wired to Supabase, the app moves to a **team-scoped, role-based** model. Locked-in design decisions:

### Team model
- A **business buys the subscription** with N seats and becomes the org's first Admin.
- Each team member has their own login (per-user auth) but data is **team-scoped, not user-scoped** — one shared dataset per organisation. Cath edits Core Values → Lou + Andrew see the change.
- **2 roles only** (MVP):
  - **Admin** — manages seats (invite/remove), edits ALL team data, schedules planning sessions, sends check-in invites, sees aggregated results.
  - **Member** — reads team data, fills check-in forms when invited. **Cannot edit team data.**

### Schema sketch
```
organisations         (id, name, seat_count, owner_user_id, created_at)
team_members          (id, organisation_id, user_id, invited_email, role, status, display_name, joined_at)
                      -- role: 'admin' | 'member' | status: 'pending' | 'active' | 'removed'

[all data tables]     -- core_values, core_focus, targets, marketing_strategy, leadership_team_members,
                      --   scorecard_metrics + scorecard_entries, rocks, issues,
                      --   meetings + meeting_headlines + meeting_todos,
                      --   annual_sessions, quarterly_sessions, team_checkins
                      -- scoped by `organisation_id` column (replaces today's hardcoded `business_id: 1`)
```

### RLS pattern
- **READ** (most tables): any active team member can read team data
  ```sql
  USING (organisation_id IN (SELECT organisation_id FROM team_members
                              WHERE user_id = auth.uid() AND status = 'active'))
  ```
- **WRITE** (most tables): only Admins can write
  ```sql
  WITH CHECK (organisation_id IN (SELECT organisation_id FROM team_members
                                   WHERE user_id = auth.uid() AND status = 'active' AND role = 'admin'))
  ```
- **`team_checkins`** (special):
  - READ: any active member of the org (everyone on the team sees aggregated results — including individual comments grouped by author, per the agreed transparency model).
  - INSERT: any active member can submit their own check-in.

### Check-in flow (Supabase version)
1. Admin schedules a planning session in the app.
2. Admin clicks **Send Check-in Invitations** → invitation emails go out with a link to the form (MVP: Admin copies/pastes link; later: Supabase Edge Function auto-sends).
3. Members open the link → log in with their own credentials → submit the 17-question form.
4. Submissions auto-aggregate; the session workspace shows averages + lowest-scoring areas + comments grouped by question (re-introduces the v0.5.72 results display that was stripped in v0.5.73 — it was right for the public-form model, wrong for the team model).
5. Admin uses aggregated results to set planning priorities.

## Pricing Model

Locked-in for the launch:

| Item | Price |
|---|---|
| **Base license** — 1 business + 3 users included | **$150/month** |
| **Each additional business** | **$75/month** |
| **Each additional user** beyond the included 3 | **$60/month** |

### Key principles
- **Users are global per account**, not per business. One person who's a member of 3 businesses counts as 1 seat. This keeps the model customer-friendly and matches the industry trend (Notion / Slack / Linear).
- **Subscriptions are account-level** (one subscription per buyer), not per-organisation. The buyer's account can hold N businesses + M users.
- **Each business is fully isolated** by data — own One-Page Plan, scorecard, sessions, issues — but shares the global user pool.

### Worked examples

| Client | Configuration | Monthly |
|---|---|---|
| Solo founder | 1 business, 1 user | **$150** (3 user seats included, only 1 used) |
| Small team | 1 business, 5 users | $150 + (2 × $60) = **$270** |
| **IAS-style holding** | 3 businesses, 3 users | $150 + $75 + $75 = **$300** |
| Same with more leaders | 3 businesses, 5 users | $300 + (2 × $60) = **$420** |
| Larger holding | 5 businesses, 12 users | $150 + (4 × $75) + (9 × $60) = **$990** |

### Schema implications

The pricing model dictates that subscriptions live at the **account** level, not per organisation:

- `subscriptions` table: `id`, `owner_user_id`, `seat_count` (defaults to 3), `included_businesses` (defaults to 1), `created_at`, `status`
- `organisations.subscription_id` → `subscriptions.id` (the buyer's subscription owns N orgs)
- `organisations` does NOT have `seat_count` (deprecates that idea from the v0.5.75 sketch)
- `team_members.user_id` is unique per account (across all orgs in that subscription) — i.e. the same user_id can appear in multiple `team_members` rows pointing to different `organisation_id`s in the same subscription, but counts as 1 seat for billing

Billing logic on subscription change:
- Add a business → `+$75/month`
- Add a user beyond the included 3 → `+$60/month`
- Remove a business → prorated refund / next cycle
- The buyer's account = the entity Stripe (or chosen billing provider) bills

## Add a New Member (SQL)

```sql
INSERT INTO users (id, email, membership_status)
SELECT id, email, 'active'
FROM auth.users
WHERE LOWER(email) = LOWER('email@here.com');
```
