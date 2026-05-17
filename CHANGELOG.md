# Changelog

All notable changes to the project. The two most recent entries live in `CLAUDE.md`; everything else is here.

---

## v0.5.90
- **Topic launcher fix — Businesses & Team are now `available` cards, not "Coming soon".** The v0.5.89 agent over-applied the "only Learning Vault is clickable" rule and marked all three "Learning & Account" cards as coming-soon. But the Businesses and Team sections exist right below on the same page — their `#businesses` and `#team` anchors are real navigation, not future work. Flipped both cards from `class="topic-card coming-soon"` to `class="topic-card available"` with an "Open" pill.
- Dashboard now has **3 available topic cards** (Learning Vault → `learning-vault.html`, Businesses → `#businesses` anchor, Team → `#team` anchor) and **13 coming-soon** (the cross-business pages still to be built in v0.5.91+).
- No other functional changes. VERSION / `sw.js` / `index.html` footer all bumped to v0.5.90 per the convention.

---

## v0.5.89
- **SARUBA dashboard restructured from a per-business snapshot view into a topic launcher.** `my-businesses.html` now leads with **14 topic cards** organised into 4 themed sections — Strategy / Operations / Planning / Learning & Account — each card a future cross-business view (e.g. "see Core Values for every business side-by-side"). This is the structural step; the actual cross-business pages get built one-by-one in v0.5.90+.
- **Topic card sections** (14 cards total):
  - **📋 Strategy** (6): One-Page Plans, Core Values, Core Focus, Targets, Marketing, Leadership
  - **🎯 Operations** (4): Quarter Goals, Weekly Numbers, Issues, Meetings
  - **🗓️ Planning** (3): Annual Sessions, Quarterly Sessions, Team Check-ins
  - **📚 Learning & Account** (3): Learning Vault, Businesses, Team
- **Topic card states**:
  - **`.coming-soon`** — opacity 0.55, `pointer-events: none`, grey "Coming soon" pill. All 13 cross-business cards.
  - **`.available`** — full opacity, hover lift, teal "Open" pill. **Learning Vault → `learning-vault.html`** + Businesses / Team → scroll-anchor to existing sections on the same page (`#businesses`, `#team`).
- **Destination URLs locked in** for the future cards so v0.5.90+ only has to ship the pages: `account-plans.html`, `account-values.html`, `account-focus.html`, `account-targets.html`, `account-marketing.html`, `account-leadership.html`, `account-goals.html`, `account-numbers.html`, `account-issues.html`, `account-meetings.html`, `account-annual.html`, `account-quarterly.html`, `account-checkins.html`.
- **Account-level scoping cleaned up** — `my-businesses.html` no longer has the business-tools bottom-nav (Home / Planning / Strategy / Operations / Learn) or the "← Home" back link in the site-header. The account dashboard is the top of the hierarchy; there's nothing above. Header is now just **"Account"** + Sign Out.
- **Business dashboard (`index.html`) gains a "← Account" back link** so users can navigate upward from their business view to SARUBA. Other per-business pages (planning.html, strategy.html, operations.html, all worksheets, all tools) keep their existing "← Home" back link — those still point to the business dashboard, which is correct.
- **Existing snapshot cards + team section retained** below the topic launcher (now anchored at `#businesses` and `#team`) so the v0.5.88 snapshot view is still one scroll away. Per-business cards keep their snapshot grid, ⋮ menu (Rename / Delete), and "Open ›" button — full v0.5.88 functionality intact, just no longer the centrepiece.
- **CSS additions**: `.topic-section`, `.topic-section-title`, `.topic-grid`, `.topic-card`, `.topic-card.coming-soon`, `.topic-card.available`, `.coming-soon-pill`, `.available-pill`. Responsive grid: 3 cols desktop, 2 cols tablet, 1 col phone.
- No SQL changes. No data layer changes.

## v0.5.88
- **SARUBA account dashboard rebuilt as an owner's snapshot view.** `my-businesses.html` used to be a business-list switcher (name + role pill + Open ›). It's now a real overview surface so the account holder sees "what's going on across my businesses" without drilling in.
- **Stats row expanded from 2 to 4 tiles**: Businesses / Users / **Open Issues** (NEW — account-level sum of `issues.status='open'` across every org the caller is in) / **Goals On Track** (NEW — `<onTrack>/<total>` rocks for the current quarter, summed across all orgs). Tiles wrap to a 2×2 grid under 480px.
- **Per-business cards are now snapshot "report cards"** with a 3-cell grid (stacks to 1 column under 600px):
  - **📊 Revenue (1yr)** — `targets.one_year_revenue` (e.g. "$420K") or "Not set"
  - **🎯 Quarter Goals** — `<onTrack> of <total>` rocks for `Q<n> YYYY` (current quarter format) or "0 of 0"
  - **⚠️ Open Issues** — count of `issues.status='open'` for that org
  - **📅 Next meeting** line below the grid — earliest `meetings.meeting_date` where status ≠ 'completed' AND date ≥ today, formatted as "Mon 19 May", or "None scheduled"
- **Fetching strategy**: a single `Promise.all` batches 5 queries (memberships team rows + the 4 new snapshot tables). Each of the snapshot queries uses `.in('organisation_id', orgIds)` — so it stays at 1 round-trip per table regardless of how many businesses the user has. Results are grouped client-side into a `snapshotByOrg` Map for O(1) lookup per card.
- **Goals on-track logic**: a rock counts as on-track if `status IN ('on_track','done','complete')` — matches the existing seed-data values.
- **Empty-state handling**: every snapshot field renders gracefully when the underlying tables return zero rows (still localStorage-backed in most pages). Revenue → "Not set", Goals → "0 of 0", Issues → "0", Next meeting → "None scheduled". No errors, no broken UI.
- **Header tweaks**: "Account overview — what's happening across your businesses." subhead replaces the previous "Manage every business and teammate". Section header is now "Your Businesses" / "Your Team (N)" — added a header-aligned `+ New Business` and `+ Invite User` button next to each section title for quicker access (the wide CTA buttons at the bottom of each section are unchanged).
- All admin-only functionality preserved: ⋮ menu (Rename / Delete), `bootstrap_organisation` / `rename_business` / `delete_business` / `invite_team_member` / `remove_team_member` RPC calls, `Open ›` → set active org + `index.html` navigation, "Rename account ›" link. No SQL changes — all schema already exists from v0.5.79 + v0.5.84.

## v0.5.87
- **Removed "Seats: X of Y" stat tile** from the SARUBA account dashboard. It duplicated the Users tile in plan-capacity framing — "1 of 3" felt ambiguous (status? error?). The stats row is now a clean 2-tile grid: **Businesses** + **Users**. Seat-allowance / billing context can surface later in a proper "Account / Billing" section when Stripe is wired up.

## v0.5.86
- **Removed the "Active" pill from `my-businesses.html` business cards.** Previously the page auto-marked one business as "Active" on every visit (the localStorage-default selection), which felt like phantom state — implied a business was open even when the user had just logged in and not done anything. Now the account dashboard is a clean list with role pills only. Users tap "Open ›" on a card to enter that business. The underlying `coach4u_active_org_id` localStorage mechanism is unchanged and still drives which business `index.html` and other tools load when navigated to directly.

## v0.5.85
- **Account dashboard is the first landing page after sign-in.** `login.html` now redirects to `my-businesses.html` (was `index.html`) on a successful sign-in AND when an existing session is detected. Every user lands on their SARUBA parent dashboard first, seeing all businesses, can switch into one, manage users, etc. before drilling into a specific business's data.
- **First-run guard added to `my-businesses.html`**: if a signed-in user has zero active `team_members` rows, the page auto-redirects to `setup.html` so the new-user wizard still fires. Avoids the awkward "empty businesses list" state for brand-new users.

## v0.5.84
- **SARUBA account dashboard** — `my-businesses.html` rebuilt from a simple switcher into the comprehensive parent dashboard:
  - Account header (existing — shows the subscription name)
  - **Stats row** (NEW) — 3 tiles: Businesses count, Users count (de-duplicated across the user's admin orgs + pending invites), Seats used / total
  - **Businesses section** — each card now has a "•••" menu (admin-only) with Rename and Delete actions. Click the row body to switch into that business and go to the dashboard
  - **Users section** (NEW) — lists all teammates the caller can see, grouped by user, with a role-pill per business + × to remove. "+ Invite User" button at section header opens a modal: email + display name + role + checkbox list of admin businesses to grant access to. Pending invites show with a "pending" pill until the invited person signs up.
- **5 new Supabase RPC functions** (`SECURITY DEFINER`, granted to `authenticated`):
  - `invite_team_member(business_id, email, role, display_name)` — admin-only. Creates `team_members` row. If the email already maps to an `auth.users` id, sets `user_id` + `status='active'` immediately. Otherwise stores `invited_email` + `status='pending'`.
  - `remove_team_member(member_id)` — admin-only. Soft-removes by setting `status='removed'`. Prevents removing yourself if you're the sole admin.
  - `rename_business(business_id, new_name)` — admin-only. `UPDATE organisations SET name = …`.
  - `delete_business(business_id)` — admin + subscription owner. `DELETE FROM organisations`. Cascades all team_members + domain data.
  - `link_pending_invites()` — trigger function on `auth.users INSERT`. Auto-converts pending invites matching the new user's email into active memberships.
- **Routing change**: in `index.html`, if the user has >1 membership AND no valid active org is selected, redirect to `my-businesses.html`. Single-business users still go straight to their dashboard. This makes the parent dashboard the natural landing page for multi-business users.

### SQL delta to paste
The new SQL is already appended to `supabase/schema.sql`. To apply, you can either re-paste the whole file (idempotent — DROP block at top handles re-runs) or paste just the new functions from lines 730 onwards.

## v0.5.83
- **Parent account / business hierarchy introduced.**
  - `subscriptions` now has a `name` column representing the account / license-holder name (e.g. "SARUBA").
  - Organisations under it are the operational businesses (e.g. "Coach4U Coaching", "Coach4U Development").
- **Two new Supabase RPC functions:**
  - `bootstrap_account_and_business(account_name, business_name)` — called by `setup.html` on first signup. Creates the subscription with the account name, creates the first organisation, makes the user the admin in one transaction.
  - `update_account_name(new_name)` — called by the "Rename account" modal on `my-businesses.html` so existing users can set their account name.
- **`setup.html` now asks for two names**: account / company (parent) + first business. Submits to `bootstrap_account_and_business`, redirects to `my-businesses.html` (the parent dashboard) instead of straight to the business dashboard.
- **`my-businesses.html` becomes the parent dashboard:**
  - Shows the account name at the top as the page heading.
  - "Rename account ›" link in the header opens a modal that calls `update_account_name`. Shows "Set account name" if the name is still null (handles existing v0.5.81 users).
- **Dashboard "Manage businesses ›" link relabelled to "Account dashboard ›"** to match the parent/child mental model.
- **`supabase/schema.sql` needs re-running OR a small delta** — chat message has the SQL delta block.

## v0.5.82
- **Dashboard "Manage businesses" link always visible.** Previously the link was only rendered when the user belonged to 2+ businesses, leaving single-business users with no in-app way to reach `my-businesses.html` to add their second business. Now the link always shows, with adaptive label: "Switch business ›" if the user has 2+ orgs, "Manage businesses ›" if they have 1.

## v0.5.81
- **New page `my-businesses.html`** — lists every organisation the user is an active member of with role pill, highlights the current active one, and has a "+ Create New Business" modal that calls the existing `bootstrap_organisation` RPC (handles both first business and additional). Tapping a different business sets it active and redirects back to the dashboard.
- **New helper `js/active-org.js`** — tiny module exposing `window.activeOrg.get() / set(orgId) / clear()` backed by `localStorage.coach4u_active_org_id`. Loaded via `<script defer>` on every page that needs to know which business is currently selected.
- **`index.html` (dashboard) extended**:
  - Resolves the user's team memberships on load.
  - Picks the active org (stored selection if still valid, else first).
  - Shows the business name at the top of the dashboard (replaces the static "Business Dashboard" heading).
  - Shows a "Switch business ›" link below the date when the user belongs to more than one business — link goes to `my-businesses.html`.
- **`setup.html`** sets the newly-created org as active immediately after creation, so the user lands on the dashboard with the correct business pre-selected.
- `sw.js` precache adds `js/active-org.js`.
- **Data layer still on localStorage** — every tool reads/writes localStorage as before. v0.5.83 will wire each tool's `api()` to read Supabase scoped by active org.

## v0.5.80
- **First-business setup flow.** New `setup.html` page asks a brand-new user for their business name. On submit it calls a single Supabase RPC (`bootstrap_organisation`) that creates the user's `subscriptions` row + first `organisations` row + admin `team_members` row in one transaction.
- **`bootstrap_organisation(business_name text)` function** added to `supabase/schema.sql`. Marked SECURITY DEFINER so it can write the bootstrap rows that the user's own RLS policies would block (you can't INSERT a team_member admin row when you have no admin team_member row yet). Also handles the case where a user already has a subscription and just wants to add another business — same function, different code path. Granted to the `authenticated` role only.
- **`index.html` auth flow extended.** After the membership-status check, it now looks up `team_members` for the user. If there's no active row, redirect to `setup.html`. Means existing accounts (no team_member yet) hit the wizard the next time they sign in.
- **`supabase/README.md` updated** to document the new bootstrap function with a JS call example.
- **App code still on localStorage for the data tools** — the wizard creates real Supabase rows but the worksheets / sessions / tools all keep using localStorage until v0.5.83.

## v0.5.79
- **Supabase schema written.** `supabase/schema.sql` is a complete clean-slate migration:
  - **DROPs** the old EOS-style tables (`businesses`, `vto`, `rocks`, `scorecard_metrics`, `scorecard_entries`, `meetings`, `meeting_headlines`, `meeting_todos`, `issues`, `seats`, `members`, `values_ratings`, `gwc_ratings`, `user_modules`, `organisations`). Preserves `public.users` (the membership-status gate).
  - **CREATEs** the new team-scoped schema: `subscriptions` (account-level), `organisations`, `team_members`; 5 strategy tables (`core_values`, `core_focus`, `targets`, `marketing_strategy`, `leadership_team_members`); operations (`scorecard_metrics`, `scorecard_entries`, `rocks`, `issues`); meetings (`meetings`, `meeting_headlines`, `meeting_todos`); planning sessions (`annual_sessions`, `quarterly_sessions`); `team_checkins`.
  - **RLS enabled** on every domain table. Two helper functions (`public.user_org_ids(uid)` and `public.user_admin_org_ids(uid)`) make every policy compact. Pattern: members read everything in their orgs; admins write. `team_checkins` is the only domain table where members can INSERT (submit their own check-in); everything else is admin-write.
  - **Indexes** on every FK + commonly-queried columns (subscription_id, organisation_id, quarter, session_date, week_date).
  - **One convenience view** (`v_active_team`) joining team_members + auth.users.users + organisations.
- **`supabase/README.md`** added with paste-and-run instructions + a quick RLS test you can run to verify policies work end-to-end.
- **App code unchanged** — still on localStorage. Wiring tools to Supabase queries begins at v0.5.83.

## v0.5.78
- **Captured the launch pricing model in CLAUDE.md.** New "Pricing Model" section locks in: $150/mo base license (1 business + 3 users included), $75/mo per additional business, $60/mo per additional user.
- **Global-user principle** explicitly documented: one person who's a member of 3 businesses still counts as 1 seat. Matches Notion / Slack / Linear conventions.
- **Schema implication captured**: `subscriptions` table lives at the account level (one subscription per buyer, owns N organisations). Replaces the per-org `seat_count` from the v0.5.75 schema sketch.
- Worked examples included for solo / small team / IAS-style holding / larger configurations.
- Docs-only change — no code touched.

## v0.5.77
- **`sw.js` precache trimmed.** Removed the UMD Supabase CDN URL (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`) — every page consumes the ESM bundle since v0.5.76, so the UMD entry was dead bytes in the precache.

## v0.5.76
- **Pre-Supabase migration cleanup** — fixed all 10 items from the v0.5.74 audit so the codebase is clean before the Supabase data layer is wired in:
  1. **Session shape divergence resolved.** `coach4u_annual_sessions` and `coach4u_quarterly_sessions` now use ONE shape everywhere: `{ id, session_date, year/target_quarter, status, attendance, areas_completed }`. Dropped `agenda` + `rating` from index.html `ensureSeeds()`, the "+ New …" creators in `annual-sessions.html` / `quarterly-sessions.html`, the self-seeds in the run-session pages, and the `${s.rating ? '· …/10' : ''}` list-row fragments.
  2. **Meeting seed status aligned.** Meeting id 4001 is now `status:'completed'` in all 3 places (`index.html` ensureSeeds + `meeting.html` self-seed + `run-meeting.html` self-seed) with matching rating + notes.
  3. **Sign-out class fixed on 5 Ops pages.** `scorecard.html`, `goals.html`, `meeting.html`, `run-meeting.html`, `issues.html` were using `class="signOutBtn"` (rendered unstyled — only `.sign-out-btn` is in CSS). Now all use canonical `class="sign-out-btn" id="signOutBtn"`.
  4. **Dead links fixed.** `learn/values-discovery.html` final CTA → `../core-values.html` (was `../strategy/core-values.html` from before v0.5.45). `404.html` secondary button → `/index.html` (was `/dashboard.html`).
  5. **`ensureSeeds()` now seeds 4 previously-missing keys.** Dashboard pre-seeds `coach4u_core_focus`, `coach4u_marketing_strategy`, `coach4u_leadership_team`, `coach4u_demo_scorecard` (metrics + 6 weeks of sample entries) on first visit, using the same shapes the worksheet/tool pages expect.
  6. **`membership_status` check added to 10 pages.** Was missing on `planning.html`, all 5 Operations tools (`scorecard / goals / meeting / run-meeting / issues`), and all 4 Planning session pages (`annual-sessions / run-annual-session / quarterly-sessions / run-quarterly-session`). Inactive users could deep-link in; now they bounce to `inactive.html`.
  7. **`sw.js` precache cleaned.** Removed non-existent `dashboard.html`. Added `favicon.svg` + `js/active-session.js`. Removed dead `js/auth.js` + `js/supabase.js` entries.
  8. **Supabase SDK consolidated to ESM.** Converted 9 files from UMD (`<script src="…/umd/supabase.min.js">` + `window.supabase.createClient`) to ESM (`<script type="module">` + `import { createClient } from '…/+esm'`). Pages affected: `scorecard / goals / meeting / run-meeting / issues / annual-sessions / quarterly-sessions / run-annual-session / run-quarterly-session`. No inline `onclick` handlers needed migration (all event wiring is `addEventListener` based). `team-checkin.html` does not use Supabase and was untouched.
  9. **Dead JS files removed.** `js/auth.js` and `js/supabase.js` deleted (referenced by no HTML); now only `js/active-session.js` remains.
  10. **Aggregated team check-in results re-introduced.** Both `run-annual-session.html` and `run-quarterly-session.html` now show, below the Copy Link / Open Form buttons: "{N} team responses received" (or "No responses yet"), and when N>0 a compact table — one row per question (truncated to ~80 chars) with average score + red/amber/green dot (red < 3, amber 3–3.9, green ≥ 4), sorted lowest-average first — plus a "Show individual comments" expander grouping comments by question with the submitter's name. The 17 EOS-style `CHECKIN_QUESTIONS` array is duplicated into both run-session files so the questions can be displayed (Supabase migration will make this a server-side constant).
- Version bump: 0.5.75 → 0.5.76. `CACHE_VERSION` in `sw.js` bumped to `coach4u-v0.5.76`. `CLAUDE.md` "Pre-migration cleanup required" subsection removed from the Planned Architecture block (those items are done).

## v0.5.75
- **Documented the planned Supabase team architecture in CLAUDE.md.** Locked-in decisions:
  - **2-tier roles**: Admin (manages seats, edits all data, sends invites) vs. Member (reads team data, fills check-ins only).
  - **Subscription model**: a business buys N seats; first buyer is Admin; Admin allocates seats by email invite.
  - **Team-scoped data**: every data table scoped by `organisation_id`; all team members see ONE shared dataset (One-Page Plan, sessions, scorecard, etc.). Replaces the per-user assumption baked into today's localStorage.
  - **Check-in flow**: Admin schedules session → emails invite link to members → members log in + submit → aggregated results visible to **everyone on the team** (max-transparency model) for setting planning priorities. This reverses the v0.5.73 simplification (which stripped the aggregated results because the form was thought to be public; now that it's authenticated + team-scoped, the aggregation comes back).
- Captured the pre-migration cleanup checklist from the v0.5.74 audit (10 items) into CLAUDE.md so it's not lost.
- Docs-only change — no code touched.

## v0.5.74
- **Restructured project docs.** Moved full version history out of `CLAUDE.md` into `CHANGELOG.md` (this file). CLAUDE.md is now lean project memory + conventions + planned architecture; this file is the version log.
- Tightened `CLAUDE.md` Key Rules: added canonical sign-out ID (`signOutBtn` + class `sign-out-btn`), 300ms debounce convention for auto-save text inputs, explicit no-Google-Fonts rule, and a Supabase key-exposure note (anon key is intentionally publishable; security via RLS; never commit `service_role`).
- Listed all 4 version-sync targets explicitly (CLAUDE.md / VERSION / sw.js / index.html footer label).
- Clarified the team-checkin question count: 17 rated statements + 1 required name field + 1 optional role field (was reported as "17 questions" / "18 questions" depending on whether the name field was counted).
- Documented that the repo is intentionally public (GitHub Pages) and the Supabase anon key in the file is the `sb_publishable_*` variant.

## v0.5.73
- **Planning session workspaces simplified to attendance + checklist + share link.** Both `run-annual-session.html` and `run-quarterly-session.html` previously had a multi-step agenda accordion with per-step notes textareas, a 1–10 session-rating step, a "Review Team Check-in" agenda step, and a big inline aggregated check-in results table at the top. Stripped all of that.
- New workspace shape (both files): **status dropdown + timer**, then a **📋 Attendance** block (single textarea, debounced ~300ms auto-save), then **✅ Areas to Cover** (one checkbox per area with the existing Strategy/Goals deep-links inline beside each row + a "{n} of {total} areas completed" progress hint), then a **🌟 Team Check-in** block reduced to two buttons — **Copy Check-in Link** (teal, clipboard + toast) and **Open Form** (secondary). No count, no aggregated table, no comments view.
- **Annual** workspace has 4 areas: Review Last Year / Refresh Core Values + Core Focus / Update 10-Year + 3-Year Picture / Set 1-Year Plan + Q1 Goals. **Quarterly** has 3 areas: Review Last Quarter / Lessons + Adjustments / Set Next Quarter's Goals.
- **Persistence** — two new fields on each session object: `attendance: '<string>'` and `areas_completed: { [areaId]: boolean }`. Attendance saves debounced on input; checkboxes save immediately.
- Removed CSS / JS: `.rating-btns`, `.rating-btn`, `.notes-textarea`, `.ci-table`, `.ci-dot*`, `.ci-comments`, `.ci-q`, `.ci-c`, `.checkin-empty`, `.label-sm`, `.agenda-*` rules; `loadCheckins`, `aggregate`, `renderCheckinResultsTable`, `renderCheckinComments`, `updateAgendaNotes`, `buildAgendaSteps`, `priorQuarter` helpers.

## v0.5.72
- **Team Check-in form added.** A new public, auth-free page `team-checkin.html` lets team members rate organisational health statements (EOS-style) before each Annual or Quarterly planning session. The leader copies a per-session link (`team-checkin.html?session=<id>&type=annual|quarterly`) from the session workspace and shares it.
- **Form structure**: required name field + optional role field + **17 rated statements** (1–5 Likert, 1 = Strongly Disagree, 5 = Strongly Agree) + optional comment per question.
- **17 statements** cover vision, core focus, 10-year + 3-year targets, accountability chart, "right seat", leadership trust, issue solving, weekly meetings, quarterly priorities, annual meetings, core values hiring/firing, "right people", mentoring/coaching, strengths-based culture, and thriving culture.
- **Database-ready JSON**. Submissions write to localStorage under `coach4u_team_checkins` as `{ id, session_id, session_type, name, role, submitted_at, scores: number[17], comments: string[17] }` — same shape that will post to a future Supabase `team_checkins` table.
- **Workspace aggregation** added in v0.5.72 but later removed in v0.5.73 in favour of the slim share-link block.

## v0.5.71
- **Floating Resume Planning Session pill.** When you tap Start Session on an Annual or Quarterly Planning workspace, a teal pill appears bottom-center on every page in the app. Tap it to return to the in-progress session. Clears automatically when you mark the session completed or click End Session.
- Implemented as a shared `js/active-session.js` loaded via `<script defer>` on every main page (21 pages).
- Exposes `window.activeSession.set()` / `clear()` used by the two `run-*-session.html` workspaces. localStorage key: `coach4u_active_planning_session`.

## v0.5.70
- **`planning.html` restructured as a standard hub** to match the Strategy and Operations layout. Dropped the vertical flow visualisation; replaced with the same `activity-card` pattern.
- Top: "View One-Page Plan" teal CTA. Below: 2 activity cards — Annual Planning → `annual-sessions.html`, Quarterly Planning → `quarterly-sessions.html`.

## v0.5.69
- **Planning is now actionable, not just a diagram.** 4 new pages built on the same pattern as `meeting.html` + `run-meeting.html`:
  - `annual-sessions.html` — list of past + scheduled annual planning sessions
  - `run-annual-session.html` — single-session workspace (originally 5-step agenda; simplified in v0.5.73)
  - `quarterly-sessions.html` — list of past + scheduled quarterly sessions; "+ New" modal asks which quarter
  - `run-quarterly-session.html` — single-session workspace (originally 4-step agenda; simplified in v0.5.73)
- localStorage keys: `coach4u_annual_sessions` (array), `coach4u_quarterly_sessions` (array). No nested wrapper.
- Seed data: annual list seeds 1 completed + 1 scheduled. Quarterly list seeds 2 completed + 1 scheduled.
- `planning.html` cards repointed; `index.html` `ensureSeeds()` extended.

## v0.5.68
- **Planning page collapsed from 5 sessions to 4.** The "Q1 Review" was redundant — the Annual Planning session already produces the Q1 plan.
- New flow: Annual Planning (sets year + Q1) → Q2 Planning Session → Q3 Planning Session → Q4 Planning Session → cycles back.

## v0.5.67
- **Leadership Team moved INTO the One-Page Plan body** so the plan fits on a single A4 landscape page when printed. Lives as a compact field at the bottom of the "Who We Are" column. Empty placeholder rows filtered out.

## v0.5.66
Final polish on `planning.html`:
- Fixed sign-out button class regression. Bottom nav font aligned with other pages.
- Subtitle tightened; stage labels simplified; Annual node balanced with a "Reviews" row; "Start Here" chip added; "View One-Page Plan" CTA at top.

## v0.5.65
Audit fixes for consistency across all pages:
- Hub titles simplified — `strategy.html` "Build Your Strategy" → "Strategy", `operations.html` "Run Your Operations" → "Operations".
- Goals header-title → "Quarterly Goals".
- **Sign-out button id standardised to `signOutBtn` across all 17 pages.** (Some used `sign-out-btn` kebab-case.)
- Google Fonts purged from `offline.html`, `404.html`, `inactive.html`, `forgot-password.html`.
- "Next Meeting" stat tile on the dashboard now opens `run-meeting.html?id=X` directly.

## v0.5.64
- **Consistent hint box across all 9 worksheets/tools.** Every Strategy worksheet and Operations tool now has the same pattern: subtitle + one minimal `.ws-hint` with a single Learning Vault link.
- `.ws-hint` promoted to shared `css/style.css`.

## v0.5.63
- **Text-clipping audit on worksheets.** Added `autoGrow(textarea)` helper to resize each textarea to its `scrollHeight`.
- Marketing Strategy "Our Guarantee" field converted from `<input>` to `<textarea rows="2">`.

## v0.5.62
- **Robust seed merging.** `loadData()` and dashboard `seedIfEmpty()` now use a **merge-missing-keys** strategy: any SEED key that's `undefined` in the stored object gets filled in (intentional empty strings are preserved).
- Core Values worksheet now lists 8 values (was 5); seed still fills 1–5.

## v0.5.61
- **Dashboard panels are now fully live.** Every clickable tile and panel on `index.html` reads from localStorage instead of hardcoded sample text (Open Issues, Goals On Track, Next Meeting, 1-Year Goal, Core Values, This Week todos, This Quarter rocks).
- Pre-seed on first visit via `ensureSeeds()` — writes seeded defaults to all localStorage keys ONLY if missing.

## v0.5.60
- **Strategy worksheets now persist edits and seed dummy data.** All 4 Strategy worksheets auto-save every field edit to localStorage and seed realistic example content on first visit.
  - Keys: `coach4u_core_values`, `coach4u_core_focus`, `coach4u_targets`, `coach4u_marketing_strategy` (plus existing `coach4u_leadership_team`).
- **`one-page-plan.html` now reflects worksheet edits.** Each field on the printable plan got a stable `id`; `applyWorksheetData()` reads the localStorage keys and overrides hardcoded HTML where data exists.

---

## Earlier History (v0.5.9 – v0.5.59) — Summary
Pre-v0.5.60 milestones, compressed:
- **v0.5.59** — Issues simplified (priority removed); "Run Weekly Meeting" CTA creates this-week's meeting; Goals tip box; Scorecard renamed to "Weekly Numbers".
- **v0.5.58** — PWA icon fixed (4U now visible in teal); hub top gap tightened; Dashboard "Go to This Week's Meeting" opens `run-meeting.html?id=X` directly.
- **v0.5.55–v0.5.57** — Issues kanban → 2 columns; Scorecard mobile sticky-column; Hub CTAs moved to top; Dashboard links all repointed to actual tools.
- **v0.5.54** — Meeting split into past-list (`meeting.html`) + active workspace (`run-meeting.html`).
- **v0.5.51** — Strategy worksheets + Operations tools promoted out of `learn/` to project root. `learn/` reduced to reference area (Values Discovery only).
- **v0.5.50** — Operations tools (scorecard/goals/meeting/issues) given localStorage demo data stub in place of dead `/api/...` calls.
- **v0.5.41–v0.5.49** — Multiple structure passes consolidating to Design 1 (Aptos, navy + teal). Deleted legacy `business/`, `css/activity.css`, root orphans (`values.html`, `vision-strategy.html`, `marketing.html`, `targeting.html`). Login gold-standardised.
- **v0.5.33–v0.5.40** — Dashboard placeholder sections built; Strategy + One-Page Plan landscape layout introduced; Learning Vault + Values Discovery exercise added; consolidated to single Supabase project.
- **v0.5.9–v0.5.12** — Root portal restored as primary; legacy modules (Accountability Chart, Team Alignment) moved out to `yourteamcoach`.

---

## Ancient History (v0.5.1 – v0.5.4) — predecessor era

These entries describe an earlier project structure (`business/`, `growth/`, `thrivehq/` paths) that no longer exists. Kept for record only.

### v0.5.4 — 2026-04-29 — Design system alignment (v1.3)
- Updated brand colours across all pages: primary navy `#1B3664`, blue-teal `#5684C4` (later replaced by Design 1 navy `#003366` + teal `#0D9488`)
- Added Inter Bold and Montserrat Regular (Google Fonts) to all pages (later removed)
- Inlined module CSS; inlined Supabase client; standardised login form IDs
- Bumped service worker cache version to `coach4u-v0.5.3`

### v0.5.3
- Built complete ThriveHQ external PWA app (Phase 1) under `/thrivehq/` (later removed)

### v0.5.2
- Standardised typography to 7 size steps

### v0.5.1
- Fixed `business/index.html` loading wrong `app.js`; nav pill restyling; header redesign
