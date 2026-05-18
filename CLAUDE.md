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
- **Your Business Coach** portal — PWA with Supabase authentication
- Hosted on GitHub Pages
- Uses email + password sign-in via Supabase
- **Repo visibility**: public (this is a GitHub Pages site). The Supabase anon key in this file is the `sb_publishable_*` (anon) variant, which is intentionally publishable — it's not a server-side secret. All security relies on Supabase RLS policies. **Never commit a `service_role` key.**

## Wording / Tone
- **No EOS jargon.** Removed in v0.5.116. Don't reintroduce: "Level 10" / "L10", "V/TO", "Vision/Traction Organizer", "Same Page Meeting", "IDS" / "Identify, Discuss, Solve" as a label, "Accountability Chart", "Right seat" / "right people", "GWC", "Quarterly Projects", "10-Year Target", "3-Year Picture", "Annual Meeting", "Headlines" (as a meeting agenda item), "Proven Process", "three uniques", verbatim "EOS", "Rocks" in user-facing copy. Use generic equivalents: "Weekly Team Meeting", "Org Chart", "Quarterly Goals", "10-Year Vision", "3-Year Outlook", "Annual Planning Session", "Customer & Team Highlights", "Discuss & Resolve", "Our Process", "What makes us different".
- The DB table `rocks` keeps its name (renaming would require a migration). UI surfaces it as "Quarterly Goals".

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
index.html              — root portal: account dashboard with multi-tenant switcher
business.html           — business-level dashboard (one biz)
setup.html              — first-business wizard for brand-new users

# Hubs (business-level)
strategy.html           — Strategy hub (cards link to root worksheets) + View One-Page Plan
operations.html         — Operations hub + Run Weekly Meeting + View One-Page Operations
planning.html           — Planning hub (annual + quarterly session lists)
learning-vault.html     — reference / how-to area

# Strategy worksheets (Supabase-backed, scoped by organisation_id)
core-values.html, core-focus.html, targets.html,
marketing-strategy.html, leadership-team.html, financials.html

# Operations tools (Supabase-backed, scoped by organisation_id)
scorecard.html          — Weekly Numbers
goals.html              — Quarterly Goals (rocks table)
meeting.html            — past weekly meetings (list)
run-meeting.html        — single weekly meeting workspace
issues.html             — open + resolved issues

# Planning sessions (Supabase-backed)
annual-sessions.html, run-annual-session.html
quarterly-sessions.html, run-quarterly-session.html
team-checkin.html       — auth-gated team-facing check-in form (17 rated statements + name + optional role)

# Printable one-pagers (read-only)
one-page-plan.html         — landscape A4 strategy doc (per business)
one-page-operations.html   — landscape A4 ops doc: Quarterly Goals + Weekly Numbers + Open Issues (per business)

# Account-level cross-business pages
account-strategy.html, account-operations.html, account-planning.html  — account-level hubs
account-plans.html              — carousel of every business's one-page strategy doc
account-ops-plans.html          — carousel of every business's one-page operations doc
account-values.html, account-focus.html, account-targets.html,
account-marketing.html, account-leadership.html                — per-worksheet carousels
account-numbers.html, account-goals.html, account-meetings.html, account-issues.html
                                                              — per-operations-tool carousels
account-annual.html, account-quarterly.html, account-checkins.html
                                                              — planning carousels

# Auth + utility
login.html, forgot-password.html, reset-password.html
inactive.html           — shown when membership_status ≠ 'active'
offline.html, 404.html

learn/
└── values-discovery.html       — guided 3-step values exercise (localStorage)

css/
└── style.css           — Design 1 system v2.2

js/
├── auth.js             — sign in / out, membership gate
├── active-org.js       — tracks active business + active subscription in localStorage
├── active-session.js   — floating "Resume Planning Session" pill
└── supabase.js         — Supabase client + dashboard helpers

supabase/
├── schema.sql          — full source-of-truth schema
└── v0.5.NNN-delta.sql  — per-version migration files (run in order on first apply)
```

## Key Rules

### Pages and routing
- All HTML pages use Design 1 (`css/style.css`) — no exceptions.
- Strategy worksheets and Operations tools live at root and ARE the source-of-truth pages. `learn/` is reserved for reference / how-to content (guides, exercises like Values Discovery). `strategy.html` and `operations.html` cards must link to root URLs, not `learn/`.
- Bottom nav order is always: **Home / Planning / Strategy / Operations / Learn** — active item gets `.active` class.
- Account-level pages use the white `.screen-toolbar` pattern (toolbar-back + toolbar-title); business-level pages use the navy `site-header` with `← Back · Your Business Coach · 🏢 [Business Name] pill`.

### Conventions every page must follow
- **Sign-out button** canonical ID: `id="signOutBtn"` (camelCase). Canonical class: `class="sign-out-btn"` (kebab-case). Both forms used together. JS lookups use `document.getElementById('signOutBtn')`.
- **Debounced text inputs** that auto-save (attendance, large textareas) use `setTimeout` debounce of **300ms** before writing. Checkbox toggles and button clicks save immediately.
- **Auto-resizing textareas** in worksheets use the `autoGrow(textarea)` helper (resize to `scrollHeight` on load + every keystroke).
- **No Google Fonts anywhere.** The Aptos system stack inherits from `css/style.css`.
- **Active organisation** is read via `window.activeOrg.get()` (exposes the current business id) and `window.activeOrg.getName()`. Set with `window.activeOrg.set(orgId, name)` when navigating into a business. Clears via `clear()`.
- **Active subscription** (multi-tenant): every account-level page that queries businesses MUST filter by the active subscription, otherwise it leaks data across client accounts. Pattern:
  ```js
  const subId = (window.activeOrg && window.activeOrg.getSubscription)
    ? window.activeOrg.getSubscription() : null;
  const memQuery = sb.from('team_members')
    .select('organisation_id, organisations!inner(id, name, subscription_id)')
    .eq('user_id', user.id).eq('status', 'active');
  if (subId) memQuery.eq('organisations.subscription_id', subId);
  const { data: mems } = await memQuery;
  ```
  The page must also load `<script src="js/active-org.js" defer></script>` for `window.activeOrg` to exist.

### Data layer (Supabase, organisation-scoped)
The localStorage-only stub is gone. Strategy worksheets, operations tools, planning sessions, and team check-ins all read/write Supabase, scoped by `organisation_id`. Tables (all in the `public` schema, all gated by RLS):

- **Strategy** — `core_values`, `core_focus`, `targets`, `marketing_strategy`, `leadership_team_members`, `financial_periods` (monthly revenue + expenses; 24-month window on the one-page plan)
- **Operations** — `scorecard_metrics`, `scorecard_entries`, `rocks`, `issues`, `meetings`, `meeting_headlines`, `meeting_todos`
- **Planning** — `annual_sessions`, `quarterly_sessions`, `team_checkins`
- **Multi-tenant** — `subscriptions`, `organisations`, `team_members`, `users`

RLS: any active team member can read; admins + coaches can write. `team_checkins` are readable by any active member of the org (aggregated results are transparent to the team) and INSERT-able by the submitting member.

LocalStorage is still used for:
- **Active org / subscription**: `coach4u_active_org_id`, `coach4u_active_org_name`, `coach4u_active_subscription_id`, `coach4u_active_subscription_name` (set by `js/active-org.js`)
- **Active planning session** (Resume pill): `coach4u_active_planning_session`
- **Operations demo stubs** (`coach4u_demo_meetings`, `coach4u_demo_rocks`, `coach4u_demo_scorecard`) — only `operations.html`'s "Run Weekly Meeting" button still reads `coach4u_demo_meetings`; the rest are vestigial. Slated for removal after the operations migration is fully verified.

## Multi-Tenant (v0.5.111+)
One user can own **multiple `subscriptions`** (one per client account). Active subscription tracked in localStorage as `coach4u_active_subscription_id`. UI:

- **Account switcher** at the top of `index.html` — `<select>` of every subscription the user owns + a `+ New client account` button (teal, top-right).
- **`+ New client account`** modal calls `create_client_account(account_name, business_name)` RPC → creates a new subscription + first business + admin team_member in one transaction, returns `(subscription_id, organisation_id)`. The new business becomes active and the user lands in `business.html`.
- **`+ New Business`** on the account dashboard calls `bootstrap_organisation(business_name, subscription_id)` — `subscription_id` is the currently-active sub, so the new biz lands in the right account.
- **Switching account** — the `<select>` change handler sets `setSubscription(...)`, clears the active org cache, and reloads. The membership query on the account dashboard scopes via `.eq('organisations.subscription_id', activeSub.id)` so each account's businesses are isolated.

Every `account-*.html` carousel page applies the same subscription scoping (v0.5.116). Without it the carousel would mix businesses across every account the user owns.

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

Post-login redirect: `index.html` (root portal). `login.html` honours a same-origin `?returnTo=` param (used by `team-checkin.html` to bounce the user back after sign-in).

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
v0.5.117

## Latest
- **v0.5.117** — **Monthly financials on the one-page plan.** New `financials.html` worksheet (linked from Strategy) lets the admin/coach enter monthly revenue + expenses for the **last 12 months (actuals)** and **next 12 months (forecast)** — 24 month rows total, profit auto-calculates per row + totals. Auto-saves to a new `financial_periods` Supabase table (`(organisation_id, period)` unique, nullable revenue + expenses). RLS: members read, admins+coaches write — same pattern as the rest of the strategy tables. The **bottom strip of `one-page-plan.html`** now renders a two-column financial outlook (Last 12 / Next 12 side by side, month × Rev × Exp × Profit, with totals row). **`account-plans.html`** carousel renders the same block per business so cross-business reviews include the financials. Multi-tenant aware — every read is `eq('organisation_id', orgId)`; the carousel scopes to the active subscription as of v0.5.115. **Requires SQL** — see `supabase/v0.5.117-delta.sql`.
- **v0.5.116** — Two big sweeps. **(1) Multi-tenant scoping** applied to the 12 remaining account-level carousel pages (`account-numbers`, `account-goals`, `account-meetings`, `account-issues`, `account-values`, `account-focus`, `account-targets`, `account-marketing`, `account-leadership`, `account-annual`, `account-quarterly`, `account-checkins`). Each now loads `js/active-org.js` and filters the `team_members` query by `organisations.subscription_id = activeSub.id`, matching the fix already applied to `account-plans.html` and `account-ops-plans.html`. **(2) EOS de-jargoning** — removed every verbatim EOS term from user-facing copy: "Level 10 Meetings" → "Weekly Team Meetings"; meeting agenda "Customer & Employee Headlines" → "Customer & Team Highlights"; "Issues — Identify, Discuss, Solve" → "Issues — Discuss & Resolve"; "Our three uniques" → "What makes us different"; "Our Proven Process" → "Our Process"; "3-Year Picture" → "3-Year Outlook" across worksheets and one-pagers; "quarterly Rocks" → "quarterly priorities". Rewrote all 17 team-checkin questions (replicated in `team-checkin.html` / `run-annual-session.html` / `run-quarterly-session.html`) to drop "Accountability Chart", "right seat / right people", "Quarterly Projects", "Annual Meetings", "10-Year Target", "3-Year Target" — order and meaning preserved so historical 1-5 scores still map to the same conceptual statements.
- **v0.5.115** — Account-level companion to v0.5.114. New **`account-ops-plans.html`** — carousel of every business's one-page operations doc, linked from `account-operations.html`. Same scoping fix backported to `account-plans.html` (strategy carousel).
- **v0.5.114** — New **`one-page-operations.html`**, parallel to `one-page-plan.html`. Landscape A4, three columns: Quarterly Goals · Weekly Numbers · Open Issues. Linked from `operations.html`.

## Current Status
- **Account dashboard** (`index.html`) — post-login landing; multi-tenant switcher + account header + stats + businesses list + users list (all Supabase-backed).
- **Business dashboard** (`business.html`) — single-business workspace; reads 1-Year Goal + Core Values panels from Supabase (`targets` + `core_values`), scoped to active organisation. Empty-state placeholders when no rows.
- **Hubs** — `strategy.html`, `operations.html`, `planning.html`, `learning-vault.html` — uniform Design 1 layout. Each links to a printable one-pager (`one-page-plan.html` for strategy, `one-page-operations.html` for ops; planning has no one-pager yet).
- **Strategy worksheets** — Supabase-backed, scoped by active org. Feed both `one-page-plan.html` and `account-plans.html`.
- **Operations tools** — Supabase-backed (rocks, scorecard_metrics + entries, issues, meetings + headlines + todos). Feed `one-page-operations.html` and `account-ops-plans.html`.
- **Planning sessions** — Supabase-backed (`annual_sessions`, `quarterly_sessions`). Workspaces use attendance checklist + team check-in share link. Aggregated check-in results visible to the whole team.
- **Team Check-in** — `team-checkin.html` is **auth-gated** (login required; honours `?returnTo=` param). 17 rated statements + name + optional role. Submissions write to `team_checkins` keyed by session_id + session_type. EOS-flavoured wording removed in v0.5.116.
- **Resume pill** — floating "Resume Planning Session" pill on every page when a session is in progress (`coach4u_active_planning_session`).
- **Mobile**: Responsive at 390px and 768px breakpoints.
- **Login**: Gold standard v2.2.
- **Accountability Chart & Team Alignment**: MOVED to `yourteamcoach`.

## Architecture (Supabase + Multi-Tenant)

The app is fully on Supabase. Team-scoped, role-based, multi-tenant.

### Team model
- A **buyer owns a `subscription`** with N seats and is the first Admin of every business inside it. One buyer may own multiple subscriptions (one per client account).
- Each team member has their own auth login but data is **team-scoped, not user-scoped** — one shared dataset per organisation.
- **3 roles**:
  - **Admin** — full edit access; invites/removes other members; renames/deletes the business itself.
  - **Coach** — admin-equivalent for data + team operations (full edit, invite/remove), but **exempt from per-seat billing**. Cannot rename or delete the business. Use case: the coach lives inside the client's account without consuming one of the client's seats.
  - **Member** — reads team data; submits check-ins; cannot edit team data.

### Schema overview (see `supabase/schema.sql` for the source of truth)
```
subscriptions   (id, owner_user_id, name, seat_count=3, included_businesses=1, status, stripe_*)
organisations   (id, subscription_id, name)
team_members    (id, organisation_id, user_id, invited_email, role, status, display_name, joined_at)
                — role: 'admin' | 'coach' | 'member'  |  status: 'pending' | 'active' | 'removed'
users           (id, email, membership_status)   — mirror of auth.users for gating

# strategy + operations + planning data
core_values, core_focus, targets, marketing_strategy, leadership_team_members
scorecard_metrics, scorecard_entries, rocks, issues
meetings, meeting_headlines, meeting_todos
annual_sessions, quarterly_sessions, team_checkins
                — all scoped by organisation_id
```

### RLS pattern
- **READ** (most tables): active team member of the org.
- **WRITE** (most tables): admins + coaches of the org (helper `user_admin_org_ids()` returns both roles).
- **`team_checkins`**: read by any active member; INSERT by the submitting member only.

## Pricing Model

Locked-in for launch:

| Item | Price |
|---|---|
| **Base license** — 1 business + 3 users included | **$150/month** |
| **Each additional business** | **$75/month** |
| **Each additional user** beyond the included 3 | **$60/month** |

### Key principles
- **Users are global per account**, not per business. One person who's a member of 3 businesses counts as 1 seat. Matches Notion / Slack / Linear.
- **Subscriptions are account-level** (one subscription per buyer), not per-organisation. The buyer's account can hold N businesses + M users.
- **Each business is fully isolated** by data — own One-Page Plan, scorecard, sessions, issues — but shares the global user pool.
- **Coaches** are admin-equivalent for data but billing-exempt (so the coach inside a client's account doesn't consume one of the client's seats).

### Worked examples

| Client | Configuration | Monthly |
|---|---|---|
| Solo founder | 1 business, 1 user | **$150** (3 user seats included, only 1 used) |
| Small team | 1 business, 5 users | $150 + (2 × $60) = **$270** |
| Holding co | 3 businesses, 3 users | $150 + $75 + $75 = **$300** |
| Same with more leaders | 3 businesses, 5 users | $300 + (2 × $60) = **$420** |
| Larger holding | 5 businesses, 12 users | $150 + (4 × $75) + (9 × $60) = **$990** |

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
