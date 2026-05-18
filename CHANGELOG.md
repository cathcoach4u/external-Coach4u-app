# Changelog

All notable changes to the project. The two most recent entries live in `CLAUDE.md`; everything else is here.

---

## v0.5.109
- **Extended the team-member dropdown to the other 3 free-text owner fields** — completes the v0.5.108 pattern. Now consistent across every owner field in the app: every "who's responsible?" picker is a select populated from the active org's `team_members`, so reports can `GROUP BY owner` reliably.
- **Files migrated (3):**
  - `scorecard.html` — `metric-owner` in the Add/Edit Metric modal (was `<input type="text" placeholder="Name">`)
  - `issues.html` — `issue-owner` in the Add/Edit Issue modal (was `<input type="text" placeholder="Who raised this?">`)
  - `run-meeting.html` — `todo-owner` in the inline "Add a to-do" row at the bottom of the To-Dos list (was `<input type="text" placeholder="Owner" style="max-width:120px;">`). This one's special because the input is rendered inside a template string per call to `renderTodos()`, so it uses an `ownerSelectHtml(id, currentValue)` builder helper rather than the imperative `renderOwnerSelect(currentValue)` pattern used by the modals.
- **Same loader + fallback pattern** as v0.5.108: `loadOwnerOptions()` queries `team_members WHERE organisation_id = orgId AND status != 'removed'`, builds a deduped sorted list (preferring `display_name`, falling back to `invited_email`). When editing an existing row whose owner doesn't match a current team member, the option "Name (not on team)" is appended so legacy values aren't lost.
- **No schema changes.** Values still stored as text in `scorecard_metrics.owner`, `issues.owner`, `meeting_todos.owner`. RLS untouched.
- **Architectural detail:** for `run-meeting.html`, the IIFE needed careful re-closing (`})()`) and the helpers were added at module-scope after the IIFE. `OWNER_NAMES` and `loadOwnerOptions` / `ownerSelectHtml` are accessible from `renderTodos` because the IIFE pauses at its first `await`, letting the script's top-level continue executing past the IIFE call before `renderTodos` is ever invoked.

---

## v0.5.108
- **Quarterly Goals owner field is now a dropdown of the active org's team members** instead of a free-text input. User feedback: with the old text field, typos like "cath" vs "Cath" prevented reliable per-user reporting — "show me all of Cath's goals" wouldn't work because the values were inconsistent.
- **How it works:**
  - On page load, `loadOwnerOptions()` queries `team_members` for the active org (excluding `status='removed'`) and builds a deduped, sorted list of names — using `display_name` first, falling back to `invited_email` if no display name has been set.
  - The Add / Edit Goal modal's Owner field renders as `<select>` with "— Unassigned —" + each team member name.
  - When editing a rock whose `owner` is a legacy free-text value (e.g. a name that's no longer on the team), the select appends a one-off option labelled "Name (not on team)" so the original value isn't lost.
- **No schema change** — the saved value is still text in `rocks.owner`. The change is purely UI-side. Reports against canonical owner names (`GROUP BY owner`) now produce correct counts because the strings are constrained to the team list.
- **Same pattern can be applied later** to `scorecard_metrics.owner`, `meeting_todos.owner`, `issues.owner` — they're all free-text today. Doing them in a follow-up if requested.

---

## v0.5.107
- **Bug fix: every "Send invite" click failed with `column reference "role" is ambiguous`.** The `invite_team_member(business_id, email, role, display_name)` RPC has a parameter named `role`, and the `team_members` table has a `role` column. The admin-check inside the function used the unqualified `role` reference, which Postgres flagged as ambiguous and refused to run.
- **Fix:** qualified every column reference inside the function as `team_members.role` / `team_members.organisation_id` / `team_members.user_id` / `team_members.status` / `team_members.invited_email`, plus `auth.users.email` in the user-lookup query. The function signature and behaviour are unchanged.
- **Requires SQL:** see `supabase/v0.5.107-delta.sql` — paste the entire file into the Supabase SQL Editor and run once. The `CREATE OR REPLACE FUNCTION` replaces the function in place. No data migration.
- **Verified the fix matches `schema.sql`** — both are now in sync, so any future fresh deployment of the schema will already be correct.

---

## v0.5.106
- **Mobile responsive fixes for the standardized navy header (v0.5.105).** With "Your Business Coach" + back-link + biz-pill + Sign Out all in the same bar, the worst-case width at ~390px (iPhone) added up to ~415px — overflow / wrap territory. Audited the 22 navy-header pages: none of them have inline header CSS, so the fix is purely in `css/style.css`.
- **Changes in `css/style.css`:**
  - `@media (max-width: 640px)` — tightened `.header-inner` gap from 16px → 8px, `.header-left` gap from 16px → 10px with `min-width: 0; flex: 1 1 auto` so it can shrink. `.header-title` dropped from 17px → 16px with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` so it truncates instead of overflowing. `.header-back` and `.sign-out-btn` get `flex-shrink: 0; white-space: nowrap` so they stay intact. Sign Out padding shrunk 5px 10px → 5px 9px and font 13px → 12px.
  - `@media (max-width: 480px)` — `.header-title` to 14px. `.biz-pill` font 11px → 10px, padding 3px 8px → 3px 7px, max-width 140px → 110px.
  - `@media (max-width: 400px)` — new breakpoint just for tight phones. `.header-left` gap → 8px, `.header-title` → 13px, `.biz-pill` max-width → 90px, `.header-back` → 12px.
- **Bottom-nav** (5 items: Home / Planning / Strategy / Operations / Learn) was already handled — each `.bottom-nav-item` uses `flex: 1`, so 5 even slots fit on any phone width down to ~320px.
- **No per-page HTML changes** — all 22 navy-header pages share `css/style.css`, so the single CSS update fixes them all.

---

## v0.5.105
- **Every navy site-header now says "Your Business Coach"** instead of the page-specific name. User feedback: with the same navy bar showing different titles per page (Planning, Strategy, Core Values, etc.), there was no consistent brand anchor. The page-specific name was also redundant with the body subheading (`<h1 class="ws-title">🗺️ Planning</h1>` etc.) right below it.
- **The header now reads identically on every business-level and account-level hub/worksheet page:** `← Back · Your Business Coach · [🏢 Active Business pill]`. Context comes from the back-link target (Home / Account / Strategy / etc.) and the body's page-intro `<h1>` (which already exists on every page — `core-values.html`'s "⭐ Core Values", `planning.html`'s "🗺️ Planning", `scorecard.html`'s "📊 Weekly Numbers", etc.).
- **Files updated (22):** `business.html`, `index.html`, `account-strategy.html`, `account-planning.html`, `account-operations.html`, `strategy.html`, `planning.html`, `operations.html`, `learning-vault.html`, `core-values.html`, `core-focus.html`, `targets.html`, `marketing-strategy.html`, `leadership-team.html`, `scorecard.html`, `goals.html`, `meeting.html`, `run-meeting.html`, `issues.html`, `annual-sessions.html`, `quarterly-sessions.html`, `run-annual-session.html`, `run-quarterly-session.html`, `team-checkin.html`.
- **One ordered sed pass:** `s|<span class="header-title">[^<]*</span>|<span class="header-title">Your Business Coach</span>|g` across all root HTML files. The biz-pill (`#activeBizName`) markup that v0.5.98 added is unaffected — it still sits right after the header-title and renders `🏢 [Business Name]` on business-level pages.
- **Not touched:** account-level carousel leaf pages (`account-plans`, `account-values`, etc.) use a separate white `.screen-toolbar` pattern (toolbar-back + toolbar-title), not the navy `site-header`. Their toolbar titles are page-specific by design ("One-Page Plans — All Businesses" etc.) and weren't part of the user's "dark blue area" feedback. Same for `404.html`, `offline.html`, `inactive.html`, `forgot-password.html`, `reset-password.html`, `login.html` (no header) and `setup.html`.

---

## v0.5.104
- **Stripped hardcoded sample text from `one-page-plan.html`.** This was the root cause of the user-reported "the previous dummy data is still appearing". The page's body had Coach4U-flavoured sample text baked into the HTML (Integrity / Growth mindset / Client first / Accountability pills; "To help business owners build thriving…" purpose; "$1.2M" 3-year revenue; etc.). The v0.5.99 migration swapped the data source from localStorage to Supabase but kept the render helpers as overlays — `setText` / `renderValuesPills` / `renderNumList` only OVERWROTE the DOM when the field had a value, so when the Supabase row was empty (e.g. a fresh business), the hardcoded fallback stayed visible. Looked like the data had migrated; was actually static markup.
- **Cleared every `opp-*` element to empty / `&mdash;`** so the doc starts with no fake content baked in. Including the doc-header `Your Business Name` → bound to active-org name; doc-year `2025 – 2035` → `currentYear – currentYear+10`.
- **Helpers updated to always render with placeholders:**
  - `setText(id, value, placeholder)` now always touches the DOM. Empty value → renders the placeholder (default `—`) with a `.empty` class for muted-italic styling.
  - `renderNumList(id, raw, emptyLabel)` renders a single muted `<li>` with the empty label when no items.
  - `renderValuesPills(data)` adds an `.empty-pills` class and "No core values recorded yet." text when no values.
- **CSS additions:** `.field-value.empty` / `.fin-cell .field-value.empty` / `.num-list.empty-list` / `.values-pills.empty-pills` — all muted grey italic.
- **Org name fetch:** init reads `window.activeOrg.getName()` first. If the cache is empty (e.g. user bookmarked the URL), it adds a 6th parallel query to `organisations` for the name as a fallback so the doc-header always populates.
- **No behaviour change** when the Supabase row IS filled — those values still render the same way.

---

## v0.5.103
- **Removed the stale "data-layer migration pending" banner from all 13 account-level carousel pages.** The yellow `data-banner` was introduced in v0.5.91 / v0.5.96 when the cross-business carousel pages shipped before the worksheet pages were wired to Supabase. After the v0.5.99–v0.5.102 migration the banner became wrong: it kept firing whenever every business returned empty data, but that's no longer "data layer pending" — it's just "no one's filled in this worksheet yet", which the per-card empty-state placeholders (e.g. "No core values recorded yet") already communicate clearly.
- **Mechanics:** stripped the `<div id="dataBanner">…</div>` markup AND the `if (!anyData) document.getElementById('dataBanner').style.display = 'block'` JS toggle from each of the 13 carousel pages: `account-plans`, `account-values`, `account-focus`, `account-targets`, `account-marketing`, `account-leadership`, `account-annual`, `account-quarterly`, `account-checkins`, `account-numbers`, `account-goals`, `account-meetings`, `account-issues`. The `.data-banner` CSS class definitions are left in place as harmless dead code.
- **No other functional changes.** Carousels still work end-to-end; empty cards still show "— not recorded —" / "No X recorded yet" inline; the share-link experience is unchanged.

---

## v0.5.102
- **`team-checkin.html` wired to Supabase — login required.** The deferred item from v0.5.101 is now done. The form is no longer anonymous; respondents sign in with their Supabase account, which lets the page validate them via RLS and stamp `team_checkins.user_id` properly. Matches the "team-scoped, role-based" architecture documented in `CLAUDE.md`.
- **New flow:**
  1. Recipient clicks the share link `team-checkin.html?session={uuid}&type=annual|quarterly`.
  2. Page validates the URL params. Missing / malformed → "Invalid check-in link" message.
  3. `supabase.auth.getUser()` — if no session, redirects to `login.html?returnTo=<current URL>`. After successful sign-in, `login.html` redirects back to the check-in.
  4. Fetches the session from `annual_sessions` or `quarterly_sessions` (single query). RLS naturally enforces membership — if the signed-in user isn't a member of the owning org, the query returns nothing → "You don't have access to this check-in" with a "Sign in as a different user" link.
  5. Queries `team_members` for `display_name` + active membership confirmation.
  6. Checks `team_checkins` for an existing submission by this user for this session. If found → "Already submitted on {date}" — resubmission blocked for MVP.
  7. Otherwise renders the 17-question form with the name field pre-filled from `team_members.display_name` (falling back to the user's email prefix).
  8. On submit → `INSERT INTO team_checkins` with `organisation_id`, `session_id`, `session_type`, `user_id = auth.uid()`, `name`, `role`, `scores` (17-int array), `comments` (17-string array). RLS policy "members insert own team_checkin" handles the WITH CHECK.
- **`login.html` gains `?returnTo=` support.** Reads the param, validates it's same-origin via the URL constructor, and redirects there instead of `index.html` after sign-in (or pre-resolves the session check at page load). Falls back to `index.html` if the param is missing or unsafe.
- **No SQL changes.** The RLS policies for `team_checkins` (`members read team_checkins`, `members insert own team_checkin`, `admins update/delete team_checkins`) were already in the original schema — they just didn't get exercised because the form was localStorage-only.
- **URL shape unchanged.** The share link generated by `run-annual-session.html` / `run-quarterly-session.html` (uuid-based since v0.5.101) keeps working — the page now expects string ids instead of `parseInt`'d numerics.
- **Workspace results light up automatically.** Now that team members write to `team_checkins`, the aggregated read in `run-annual-session.html` / `run-quarterly-session.html` (and the cross-business `account-checkins.html` carousel) shows real responses instead of "No responses yet".
- **Header now includes a "Sign Out" button** so a user who's signed in as the wrong account can swap users without leaving the page.
- **localStorage stub removed.** The old `coach4u_team_checkins` localStorage key is no longer written to. Any existing values are ignored (fresh-data approach, same as the other batches).
- **Data-layer migration complete.** All five batches are now live: Strategy (v0.5.99) → Operations (v0.5.100) → Planning admin (v0.5.101) → Team check-ins (v0.5.102). Every business-level page is on Supabase, scoped by `coach4u_active_org_id` or by URL param + RLS validation.

---

## v0.5.101
- **Planning batch wired to Supabase.** The 4 planning admin pages (`annual-sessions.html`, `run-annual-session.html`, `quarterly-sessions.html`, `run-quarterly-session.html`) are no longer backed by `localStorage` — they now read and write directly to the `annual_sessions` / `quarterly_sessions` / `team_checkins` Supabase tables, scoped by the active organisation. This is the third slice of the data-layer migration (strategy batch in v0.5.99, operations batch in v0.5.100).
- **Fresh-data approach — no localStorage migration.** Consistent with the locked plan, this migration does NOT copy old `coach4u_annual_sessions` / `coach4u_quarterly_sessions` / `coach4u_team_checkins` values into Supabase. New businesses see no sessions until they create one via the "+ New Annual/Quarterly Session" button. The legacy localStorage keys are left in place but unread.
- **The 4 admin pages migrated:**
  - `annual-sessions.html` → `SELECT * FROM annual_sessions WHERE organisation_id = orgId ORDER BY session_date DESC`. The "+ New Annual Session" button INSERTs a new row (today's date, current year, status `scheduled`, empty `attendance`, empty `areas_completed` jsonb) and redirects to `run-annual-session.html?id={uuid}`. Session ids are uuids returned by Postgres `gen_random_uuid()` — the prior `Date.now()*1000+random` numeric id scheme is gone.
  - `run-annual-session.html` → loads a single session by uuid (`.maybeSingle()`) plus its team check-ins (`SELECT * FROM team_checkins WHERE session_id = id AND session_type = 'annual'`). Attendance textarea: 300ms-debounced `UPDATE annual_sessions SET attendance = ? WHERE id = ?`. Area checklist (4 areas): on toggle, full `areas_completed` jsonb is recomputed and immediately upserted; UI state is rolled back on save error. Status dropdown and timer Start/Stop also UPDATE the row. Aggregated check-in results (count, per-question avg with red/amber/green dots, expandable comments) preserved 1:1 — only the data source swapped.
  - `quarterly-sessions.html` → same shape as annual-sessions but for `quarterly_sessions`. "+ New Quarterly Session" opens the existing modal (target quarter + date pickers), INSERTs with the chosen values + `target_quarter`, then redirects. The next-upcoming-quarter helper and `quarterEndDate` math kept as-is.
  - `run-quarterly-session.html` → same shape as run-annual-session but for `quarterly_sessions` with 3 areas instead of 4. Sets the active-session pill label to `(target_quarter || 'Quarterly') + ' Session'` on Start.
- **Per-page behaviour:**
  - **No-active-org guard** — every planning page calls `window.activeOrg.get()` after auth + membership check. No active org → `window.location.href = 'index.html'`.
  - **Workspace pages also guard on `?id=`** — `run-annual-session.html` with no id redirects to `annual-sessions.html`; `run-quarterly-session.html` with no id redirects to `quarterly-sessions.html`. Previously they showed an inline "no session selected" empty state; the redirect is cleaner and matches `run-meeting.html` (migrated in v0.5.100).
  - **Invalid session id** — if `?id={uuid}` doesn't match a row, the workspace shows a friendly "Session not found" message with a back-link to the list page. No crash.
  - **Load on init** — `Promise.all`-style parallel loads (session row + team_checkins) where applicable. Body opacity stays at 0 until the load resolves; set to 1 on success or error so a Supabase failure doesn't trap the user behind a blank page.
  - **Save on edit** — debounce on attendance (300ms), immediate on area checkbox toggle, status dropdown, timer transitions, INSERTs from "+ New Session" buttons.
  - **RLS reality** — admins write, members read. Member writes will hit RLS denial and be logged via `console.warn` + toast. Read-only mode deferred.
- **SEED removal.** The old `_annualSeed()` / `_quarterlySeed()` constants + `_annualLoad()` / `_quarterlySave()` localStorage helpers are deleted from the 4 admin pages. A short JS block comment at the top of each script preserves the previous sample-data shape for future reference. The numeric id scheme (`5001`, `5002`, `6001`, `6002`, `6003`) is gone — uuids only.
- **`coach4u_active_planning_session` localStorage key kept alive.** The floating "Resume Planning Session" pill (rendered by `js/active-session.js` on every main page) still uses this localStorage key to know which session to link back to. Workspace pages continue to call `window.activeSession.set('annual', sessionId, label)` on Start and `window.activeSession.clear()` on Complete. This is a UI hint, not the data of record — the actual session row lives in Supabase.
- **`js/active-session.js` fix.** Previously the pill's `isStillActive()` check read `coach4u_annual_sessions` / `coach4u_quarterly_sessions` localStorage to verify the underlying session was still in progress. With those keys no longer populated, the check would always fail and the pill would self-clear immediately after being set. Simplified `isStillActive()` to trust the pill's own record — the workspace pages call `window.activeSession.clear()` explicitly on completion / timer-stop, which is the correct source of truth for the pill's lifecycle.
- **`team-checkin.html` deferred.** The public, anonymous team check-in form is intentionally left unchanged in this version. Migrating it requires a separate design decision on how to handle anonymous INSERTs into `team_checkins`:
  - **(A)** Loosen RLS to allow anon INSERT after validating the session exists (needs an `EXISTS` clause referencing `annual_sessions` / `quarterly_sessions`).
  - **(B)** A SECURITY DEFINER RPC for anonymous submissions.
  - **(C)** Switch to the "team members must log in" model from the planned architecture (changes UX — no longer truly anonymous).
  - Until that decision lands, `team-checkin.html` still writes to `localStorage` (`coach4u_team_checkins`). The workspace pages now query the Supabase `team_checkins` table for the results display — so until `team-checkin.html` is migrated, the aggregated results section will show "No responses yet" for any new session. Existing localStorage check-ins are no longer surfaced (intentional: fresh-data approach).
- **Visual / UX unchanged.** Existing DOM IDs preserved (`session-status`, `attendance-input`, `areas-progress`, `ci-results`, `ci-comments-toggle`, `timer-btn`, `timer-elapsed`, `new-session-btn`, `new-session-modal`, etc.). Toast notifications still fire for save/update success and failure. The site-header / bottom-nav / `#activeBizName` business pill / Resume Planning Session pill — all unchanged. No frameworks added.
- **Account-level carousel pages light up automatically.** `account-annual.html`, `account-quarterly.html`, and `account-checkins.html` (added in v0.5.96 to aggregate planning data across all businesses) have been waiting for real writes — they now stop showing "data-layer-pending" as soon as any business creates a session.
- **Next:** the `team-checkin.html` migration is the last localStorage holdout for the planning subsystem. Once that lands (along with the design decision on anonymous-submit), the legacy `coach4u_*` localStorage keys can be retired entirely and `ensureSeeds()` in `business.html` removed.

---

## v0.5.100
- **Operations batch wired to Supabase.** The 4 operations tools (`scorecard.html`, `goals.html`, `meeting.html` + `run-meeting.html`, `issues.html`) are no longer backed by `localStorage` — they now read and write directly to the corresponding Supabase tables, scoped by the active organisation. This is the second slice of the data-layer migration (strategy batch shipped in v0.5.99).
- **Fresh-data approach — no localStorage migration.** Per the locked plan, this migration does NOT copy old `coach4u_demo_*` localStorage values into Supabase. New businesses see empty tools and fill them in fresh. The old localStorage keys are left in place untouched (the `ensureSeeds()` block in `business.html` still seeds them for legacy reasons, but the dashboard panels no longer read from them — they query Supabase instead).
- **The 5 operations pages migrated:**
  - `scorecard.html` → 2-table CRUD on `scorecard_metrics` + `scorecard_entries`. Loads metrics ordered by `sort_order`, then loads all entries for the visible 6-week window via `.in('metric_id', [...]).gte('week_date', oldest)`. Cell save uses `upsert({ metric_id, week_date, value }, { onConflict: 'metric_id,week_date' })`. Clearing a cell DELETEs by composite key. Metric add/edit/delete uses INSERT/UPDATE/DELETE; child entries are CASCADE-deleted via the FK. **Schema note:** the page's "measurement type" dropdown now uses the canonical `count|currency|percentage|score` values from the `scorecard_metrics.measurement_type` CHECK constraint (the old localStorage stub used `'number'` — switched to `'count'` to match the DB).
  - `goals.html` → CRUD on `rocks` filtered by `quarter = currentQuarter()`. Computes the current quarter in JS as `'Q' + (Math.floor(d.getMonth() / 3) + 1) + ' ' + d.getFullYear()`. Quarter dropdown now built dynamically (5-quarter window: previous, current, next 3) instead of being hardcoded to Q1–Q4 2026 + Q1 2027. Status options exposed in the modal include `not_started` to match the DB CHECK constraint. `company_rock` is now a real boolean (DB column type) rather than the old 0/1 integer; UI behavior unchanged. Add inserts with `sort_order = max + 1`; edit and delete by id.
  - `meeting.html` → list of meetings ordered by `meeting_date DESC`. "+ New Meeting" INSERTs into `meetings` with `status='scheduled'` and the user-chosen date + quarter, then redirects to `run-meeting.html?id={uuid}`. Quarter dropdown also built dynamically.
  - `run-meeting.html` → loads the meeting + its `meeting_headlines` + `meeting_todos` via `Promise.all`. CRUD on each child table is via INSERT/UPDATE/DELETE keyed by `id`. Status change (Scheduled / In Progress / Completed) updates `meetings.status`. The "Start Meeting" timer transitions status to `in_progress` on start and `completed` on stop. Rating buttons UPDATE `meetings.rating`. Notes "Save Notes" button UPDATEs `meetings.notes`. **Edge case noted:** the existing page used URL param `?id={numeric}`; we now use `?id={uuid}` — the page reads the raw string param and passes it through to Supabase queries unchanged. If no `id` is in the URL, `run-meeting.html` redirects to `meeting.html` (was: showed an empty-state message).
  - `issues.html` → CRUD on `issues` ordered by `created_at DESC`. The kanban Open/Resolved split is computed client-side from the result set. Owner filter is a client-side filter against the in-memory `_issues` list (was: refetched). Mark-as-resolved requires a solution per existing UX. Add inserts, edit updates, delete deletes by id.
- **Per-page behaviour:**
  - **No-active-org guard** — every operations page calls `window.activeOrg.get()` after auth + membership check. No active org → `window.location.href = 'index.html'`. `run-meeting.html` adds a second guard: no `?id=` URL param → `window.location.href = 'meeting.html'`.
  - **Load on init** — Single Supabase query per table scoped by `organisation_id` (or by parent foreign key for child tables). Use `Promise.all` for parallel loads where a page needs both parent + children (run-meeting + business.html dashboard).
  - **Save on edit** — Immediate save for buttons / checkboxes / Add / Delete. Modal-driven edits (goals, issues, metrics) save on the modal's Save button click. Cell edits in scorecard upsert immediately. Save errors are caught with `console.warn` and surfaced via toast — they don't crash the page.
  - **RLS reality** — admins write, members read. Member writes will hit RLS denial and be logged silently. Read-only mode is deferred until a later release.
- **`business.html` dashboard panels migrated.** The 3 panels and 2 stat tiles that previously read `coach4u_demo_*` localStorage now query Supabase:
  - **"Open Issues" stat tile** → `supabase.from('issues').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('status', 'open')`.
  - **"Goals On Track" stat tile** → count of current-quarter rocks with status `on_track` or `done` over the total. Quarter computed from JS clock; no fallback-to-all-rocks hack (the old localStorage version had one because the seed quarter was hardcoded as Q2 2026 — no longer needed with real per-business data).
  - **"This Week" panel** → most recent meeting's open todos (`meeting_todos` where `done=false`, ordered by `created_at`, limited to 4). The "focus meeting" is the same one used for the "Next Meeting" tile and the meeting button link (this-week's Monday meeting, else next upcoming, else most recent). When no meeting exists the panel keeps its default "No todos for this week yet" copy.
  - **"This Quarter" panel** → rocks for the current quarter from Supabase, rendered with the same status-pill colors as before (`pill-green / pill-amber / pill-red / pill-grey`). Progress bar shows `on_track` count / total.
  - **"1-Year Goal" + "Core Values" panels** were already on Supabase as of v0.5.99 — left as-is; verified they still work after this pass.
  - `renderDashboard()` is now `async`, takes `orgId` as a param, runs 5 parallel queries via `Promise.all`, then a 6th query for todos once the focus meeting is known. Errors are logged via `console.warn`; partial failures don't trap the user behind a blank page.
- **`ensureSeeds()` left in place but unread.** The block that seeds the old `coach4u_demo_*` keys is still called on first visit. Reading from those keys for the dashboard panels is gone — they're now live Supabase queries. The seeds are harmless; they'll be removed in a future cleanup pass once we're sure no other page depends on them.
- **SEED removal in each tool.** Each operations page's old `_*Seed()` constant + `_*Load()` + `api()` function block (the localStorage demo stub from v0.5.50) has been deleted entirely. A short JS block comment at the top of each script preserves the previous sample data values for future reference. The `_LS_KEY` constants are gone. The `currentBusinessId = 1` hardcoded value is gone — now uses real `orgId` from `window.activeOrg.get()`.
- **Visual / UX unchanged.** Existing DOM field IDs preserved (cell-popover, metric-modal, goal-modal, issue-modal, agenda accordion, rating buttons, etc.). Toast notifications still fire for save success / failure. The site-header, bottom-nav, `#activeBizName` business pill — all unchanged. No frameworks added; each page remains a self-contained vanilla ES module with its own Supabase client init.
- **Account-level carousel pages light up automatically.** `account-numbers.html`, `account-goals.html`, `account-meetings.html`, and `account-issues.html` (added in earlier versions to aggregate operations data across all businesses) have been waiting for real writes — they now stop showing "data-layer-pending" as soon as any business uses a tool.
- **Next: v0.5.101+** continues the migration with the planning session workspaces (`annual-sessions.html` / `run-annual-session.html` / `quarterly-sessions.html` / `run-quarterly-session.html`) and the team check-in flow (`team-checkin.html` results aggregation). After that, the localStorage layer can be retired entirely and `ensureSeeds()` removed.

---

## v0.5.99
- **Strategy batch wired to Supabase.** The 5 strategy worksheets and the one-pager reader are no longer backed by `localStorage` — they read and write directly to Supabase, scoped by the active organisation. This is the first slice of the data-layer migration teed up in v0.5.97 / v0.5.98.
- **Fresh-data approach — no localStorage migration.** Per the locked plan, the migration does **not** copy old `coach4u_*` localStorage values into Supabase. New businesses see empty inputs and fill them in fresh. The old localStorage keys are left in place untouched (and the dashboard panels in `business.html` still seed them for sample-data display until that page is migrated separately).
- **The 6 files migrated:**
  - `core-values.html` → single-row upsert on `core_values` (PK `organisation_id`; 8 value columns). `value_1`..`value_8` map directly to the existing input `data-key` attributes.
  - `core-focus.html` → single-row upsert on `core_focus` (PK `organisation_id`; `purpose`, `niche`).
  - `targets.html` → single-row upsert on `targets` (PK `organisation_id`; 9 columns covering 10-year vision + 3-year picture + 1-year plan).
  - `marketing-strategy.html` → single-row upsert on `marketing_strategy` (PK `organisation_id`; `target_market`, `uniques`, `proven_process`, `guarantee`).
  - `leadership-team.html` → multi-row CRUD on `leadership_team_members` (uuid id, `name`, `role`, `responsibilities`, `placeholder`, `sort_order`). INSERT on Add Team Member, DELETE on the per-card trash icon, debounced UPDATE-by-id on field edits.
  - `one-page-plan.html` → READ-ONLY. Replaced the 5 localStorage reads with a single `Promise.all` of 5 Supabase queries (4 `.maybeSingle()` for the org-keyed tables + 1 `.order('sort_order')` for the team). DOM field IDs (`opp-*`) and rendering helpers (`setText` / `renderNumList` / `renderValuesPills` / `renderTeamTable`) are unchanged — only the data source swapped.
- **Per-page behaviour:**
  - **No-active-org guard** — after the auth/membership check, each page calls `window.activeOrg.get()`. No active org → `window.location.href = 'index.html'`. Bookmark-direct-to-worksheet without first picking a business now redirects cleanly to the account dashboard.
  - **Load on init** — `SELECT * FROM TABLE WHERE organisation_id = orgId` with `.maybeSingle()` for the 1-row tables, `.order('sort_order')` for `leadership_team_members`. Body opacity stays at 0 until the load resolves; on success or error it's set to 1 (so a load error doesn't trap the user behind a blank page).
  - **Save on edit** — 300ms debounce on text inputs and textareas, immediate save on Add / Delete. The save sends the full local state via `upsert({ organisation_id, ...data }, { onConflict: 'organisation_id' })` for the 1-row tables. Failures are caught with `console.warn` and don't crash the page — the user can keep typing and the next save attempt may succeed.
  - **RLS reality** — admins write, members read. If a member tries to type in a worksheet the upsert will return an RLS denial; we log it silently and leave the local state in place. Building a proper read-only mode is deferred until later.
- **SEED removal.** Each worksheet's old `SEED = { … }` constant + `loadData()` merge-missing-keys helper has been removed. The old sample-data values are preserved as a JS block comment at the top of the script for future reference. The `STORAGE_KEY` constants are gone too.
- **Leadership team UX preserved 1:1.** Existing card-with-edit-toggle UI, Add button at top, per-card edit + delete icons, "Save Leadership Team" footer button — all unchanged visually. Under the hood: every keystroke in the edit form schedules a debounced `UPDATE` keyed by row `id`; Add inserts a new row (with `sort_order = max + 1`) and returns the generated uuid; Delete removes by id. Pending debounce timers are flushed when the user exits edit mode or clicks Save, and cancelled when a row is deleted. The `placeholder` column is honored: the one-pager view filters placeholder rows out (matching the previous localStorage behaviour); the editable list still shows them so users can promote them once filled in.
- **Account-level carousel pages light up automatically.** `account-values.html`, `account-focus.html`, `account-targets.html`, `account-marketing.html`, `account-leadership.html`, and `account-plans.html` already read from the same 5 Supabase tables (added in v0.5.96). They've been waiting for real writes; now that the worksheets write, those pages stop showing "data-layer-pending" as soon as any business fills in any field.
- **No visual or UX changes elsewhere.** Existing DOM `data-key` and `opp-*` IDs untouched. `autoGrow` textarea behaviour preserved. `body { opacity: 0 }` initial-load pattern preserved. The site-header / bottom-nav / `#activeBizName` business-pill all unchanged. No frameworks added; each page stays a self-contained vanilla ES module with its own Supabase client init.
- **Next: v0.5.100+** continues the migration on the operations tools (`scorecard.html`, `goals.html`, `meeting.html` + `run-meeting.html`, `issues.html`) and the planning session workspaces. `business.html` dashboard panels stay on the localStorage seeds until those datasets land in Supabase too.

---

## v0.5.98
- **Every business-level page now shows a `🏢 [Business Name]` pill in its header.** Before this, all business-level pages (`strategy.html`, `core-values.html`, `scorecard.html`, etc.) looked structurally identical to their account-level counterparts (`account-strategy.html`, etc.) — same site-header, same navy bar, just a different page title. With multiple businesses under one account, the user couldn't tell at a glance which business they were currently editing. Now the business name is unmissable.
- **Visual:** small teal pill (`.biz-pill`) with 🏢 prefix, placed right after the `header-title` span in the site-header. Stands out clearly against the navy background. Empty state collapses to `display: none` so account-level pages (which don't include the pill markup) are unaffected. Mobile shrinks the pill to fit narrow screens.
- **State management:** `js/active-org.js` extended to track both the org ID and the org name in localStorage (`coach4u_active_org_id` + `coach4u_active_org_name`). The set/clear methods always update both in sync. New `renderHeader()` method finds `#activeBizName` and populates it; auto-runs on DOMContentLoaded.
- **Wiring:**
  - `index.html` (account dashboard): when a business card's "Open" button is clicked, calls `set(orgId, orgName)` instead of just `set(orgId)`. Also caches the first membership's name when no active org is set.
  - `business.html`: when it resolves the active org from memberships, calls `set(activeId, name)` so the cache is always fresh before navigation to child pages.
  - 19 other business-level pages: just need the `<span id="activeBizName" class="biz-pill"></span>` markup in their header + the `<script src="js/active-org.js" defer></script>` tag — both added via two sed passes. `one-page-plan.html` uses a sticky toolbar instead of `site-header`, so its pill goes after `.toolbar-title`.
- **Not added to** account-level pages (`index.html`, `account-strategy.html`, etc.) — they're already distinct via their "Account" header and "Across All Businesses" page intros.
- **Edge case:** if a user bookmarks a business-level page URL directly and lands without first going through the dashboard, the name might not be cached yet → pill is empty → `display: none` hides it gracefully. The normal flow (login → account dashboard → click Open → business pages) always primes the cache.

---

## v0.5.97
- **Cleanup pass before the data-layer migration.** Two changes shipped here.
- **(1) File rename — account dashboard is now the root `index.html`.**
  - `my-businesses.html` (account dashboard, post-login landing) → `index.html`
  - Former `index.html` (single-business dashboard) → `business.html`
  - Why: visiting the root URL was loading the business dashboard, which only made sense if you had a single active business already selected. The account dashboard is the true "home" — it shows every business, the stats, the team. Root URL now serves the account dashboard.
  - Update mechanics: two ordered `sed` passes across all HTML files. First pass replaced `index.html` URLs → `business.html` (in `href=`, `'…'`, `"…"` contexts). Second pass replaced `my-businesses.html` URLs → `index.html`. 38 HTML files modified; no broken references left after grep verification.
  - `setup.html` line 70 redirect (when a user with existing memberships hits the wizard) now goes to `index.html` (account picker) instead of `business.html` (specific biz), since multi-business users with no stale active org should land on the picker.
  - `business.html` already had the right guards: no memberships → setup, multi-biz + stale active org → `index.html`, single biz → use it.
  - GitHub Pages serves `/` from `index.html`, so the root URL `https://cathcoach4u.github.io/yourbusinesscoach/` now opens the SARUBA account dashboard directly.
- **(2) Dead CSS removed from the account dashboard.**
  - Stripped `.topic-section`, `.topic-section-title`, `.topic-grid`, `.topic-card`, `.tc-icon`, `.tc-name`, `.topic-card.available:hover`, `.topic-card.coming-soon`, `.coming-soon-pill`, `.available-pill` — all leftover from the v0.5.89 topic launcher that v0.5.95 removed.
  - Also stripped the placeholder comment that said "Hub navigation lives in the bottom-nav" — the bottom-nav speaks for itself.
- **Version label** moved to `business.html` footer (it travelled with the renamed file). CLAUDE.md's version-bump checklist updated to point to `business.html` instead of `index.html`.
- **Next: v0.5.98+** starts wiring the business-level worksheet pages to write to Supabase (fresh-data approach — no localStorage migration). Strategy batch first (5 worksheets + one-page-plan reader).

---

## v0.5.96
- **Built all 12 cross-business carousel leaf pages.** Every card on the 3 account-level hub pages (`account-strategy.html`, `account-planning.html`, `account-operations.html`) now opens to a real navigable page. Same carousel chrome as `account-plans.html`: sticky toolbar with "← Account" back-link + page title + Print/PDF button, page intro, optional yellow data-banner, prev/next buttons hinting the neighbour business name, centre showing current business name + "Business X of Y" + dot indicators, keyboard ArrowLeft / ArrowRight nav, print-current-view via `@media print` hiding everything except the active card. Each page is a leaf page (no bottom-nav), mirroring `one-page-plan.html` at the business level.
- **Strategy ×5:**
  - `account-values.html` — reads `core_values` (PK organisation_id, columns value_1..value_8); per-business card shows big teal pills for each non-empty value (up to 8) in a responsive grid; empty state "No core values recorded yet."
  - `account-focus.html` — reads `core_focus`; two-column layout (Purpose / Niche) that stacks on narrow screens, each in a teal-bordered block with uppercase label.
  - `account-targets.html` — reads `targets`; three sections — 10-Year Vision (text), 3-Year Picture (date/revenue/profit financial row + description), 1-Year Plan (date/revenue/profit row + numbered goals list).
  - `account-marketing.html` — reads `marketing_strategy`; four sections — Target Market, What Makes Us Different (numbered list from `uniques`), Our Process, Our Guarantee.
  - `account-leadership.html` — reads `leadership_team_members` (multi-row per org, ordered by `sort_order`, filtering out `placeholder = true`); list of name (navy bold) · role (teal bold) with responsibilities below.
- **Planning ×3:**
  - `account-annual.html` — reads `annual_sessions`; list ordered most-recent-first with date + year + status pill (green/amber/grey for completed/in_progress/scheduled) + "Areas completed: X of Y" computed from `areas_completed` jsonb (4 areas assumed).
  - `account-quarterly.html` — same shape as annual but uses `target_quarter` instead of year and 3 areas assumed.
  - `account-checkins.html` — reads `team_checkins`; 3-tile stat row (submissions count, overall avg score / 5, most recent submission date) + latest 3 contributors with their average scores. Defensive handling of empty `scores` arrays so a missing-data submission won't crash averaging.
- **Operations ×4:**
  - `account-numbers.html` — reads `scorecard_metrics` ordered by `sort_order`, then a single batched `scorecard_entries` query (`.in('metric_id', metricIds)`, descending by `week_date`) grouped client-side into the metricId → entries map. Per-business table: Metric · Owner | Goal | Most recent value | Last 4 weeks trend.
  - `account-goals.html` — reads `rocks`, filters to current quarter (computed in JS as `Q{n} YYYY`). Top of card: current quarter label + "X on track of Y total" summary. Each row: description (with 🏢 prefix for `company_rock`) + owner + colored status pill (done=green / on_track=teal / at_risk=amber / off_track=red / not_started=grey).
  - `account-meetings.html` — reads `meetings`, descending by `meeting_date`, capped at 10 per business. Each row: date + quarter + status pill + rating (only when status='completed' and rating set) + 1-line notes preview.
  - `account-issues.html` — reads `issues` filtered to `status='open'`, descending by `created_at`. Top banner: "Open issues: X". Each row: description + owner + raised date. Empty state celebrates: "No open issues for this business. 🎉"
- **Hub pages updated:** `account-strategy.html` (5 cards), `account-planning.html` (3 cards), and `account-operations.html` (4 cards) — all 12 previously coming-soon cards flipped to available. Pattern: removed `.coming-soon` modifier class and replaced `<span class="soon-pill">Coming soon</span>` with `<span class="act-arrow">›</span>`, matching the existing available-card style on the business-level hubs.
- **Data layer reality:** most worksheet/operations pages still save to localStorage; the Supabase tables exist (per `supabase/schema.sql`) but most queries currently return zero rows. Every new page shows the same yellow data-layer-pending banner as `account-plans.html` when all businesses return empty, with the per-page worksheet name customised. The banner disappears as soon as any business has real Supabase data.
- **Carousel edge cases:** zero businesses → "Create your first business" link to `setup.html`; one business → no prev/next buttons, just the single card; 2+ businesses → full carousel with dots + keyboard nav (arrow keys ignored when typing in inputs/textareas).

---

## v0.5.95
- **Removed the 4 hub cards from `my-businesses.html`.** They duplicated the bottom-nav added in v0.5.94 — same labels, same destinations, just bigger and higher up the page. With the bottom-nav doing the navigation, the dashboard is cleaner and the focus shifts back to what actually belongs on a dashboard: account info, stats, business snapshots, and team management.
- Dashboard now renders: account header (SARUBA + Rename) → stats row (Businesses / Users / Open Issues / Goals On Track) → per-business snapshot grid → users / team section.
- Dead CSS (`.hub-section`, `.hub-grid`, `.hub-card`, `.hub-icon`, `.hub-text`, `.hub-name`, `.hub-desc`, `.hub-arrow`) stripped from the style block. The 4 account hub pages (`account-strategy.html` etc.) are unchanged and still reachable from the bottom-nav.

---

## v0.5.94
- **Bottom-nav added to the account-level pages**, matching the business app's pattern. Same 5-item layout: Home / Planning / Strategy / Operations / Learn. The user request: "Build the 4 headings the same way you have in the others. Down the bottom." Confirmed the right destinations for each item.
- **Added to:**
  - `my-businesses.html` — active = Home
  - `account-strategy.html` — active = Strategy
  - `account-planning.html` — active = Planning
  - `account-operations.html` — active = Operations
- **Destinations:**
  - Home → `my-businesses.html` (account dashboard)
  - Planning → `account-planning.html`
  - Strategy → `account-strategy.html`
  - Operations → `account-operations.html`
  - Learn → `learning-vault.html` (shared with business app — learning content isn't business-scoped)
- **Not added to leaf carousel pages** like `account-plans.html` — those follow the `one-page-plan.html` pattern (sticky toolbar with "← Account" back-link replaces the bottom-nav, since the carousel UI needs vertical space at the bottom).
- `.container { padding-bottom: 90px; }` on the 4 nav-enabled pages so content doesn't hide behind the nav.

---

## v0.5.93
- **Account-level navigation now mirrors the business app's structure.** The owner's mental model is consistent: SARUBA (account) is structured like a single business — Planning, Strategy, Operations, Learn — just rolled up across every business.
- **`my-businesses.html` restructure:** the 16-card topic launcher is replaced with a clean **4-card hub grid** (Planning / Strategy / Operations / Learn). Bigger cards, accent border, icon + name + description + arrow — same visual language as `strategy.html` / `operations.html` / `planning.html` but more prominent (these are top-level navigation). Card order matches the business app's bottom-nav: Planning, Strategy, Operations, Learn.
- **3 new account-level hub pages** mirroring the business hubs:
  - `account-strategy.html` — copies `strategy.html`. CTA: "View One-Page Plans — All Businesses" (live). Cards: Core Values / Core Focus / Targets / Marketing Strategy / Leadership Team (all coming-soon).
  - `account-planning.html` — copies `planning.html`. Cards: Annual Planning / Quarterly Planning / Team Check-ins (all coming-soon).
  - `account-operations.html` — copies `operations.html`. Cards: Weekly Numbers / Quarter Goals / Meetings / Issues (all coming-soon).
- Each new hub uses the same `.activity-card` pattern as the business hubs, with a `.coming-soon` modifier (opacity 0.55, pointer-events: none, "Coming soon" pill, neutral border). Identical auth gate + Sign Out wiring.
- **"Learn" on the dashboard** links directly to `learning-vault.html` (no account-level hub needed — learning content is shared across all businesses).
- **Architecture is now 3 levels:**
  1. **Account dashboard** (`my-businesses.html`) — header + stats + 4 hub cards + businesses snapshot + users
  2. **Account hub pages** (`account-strategy.html` etc.) — list of cross-business views inside that theme
  3. **Account leaf pages** (`account-plans.html` etc.) — carousel: one business at a time with arrows/dots/keyboard nav
- All 4 hub-card destinations work. Only 1 of 12 leaf pages (`account-plans.html`) is built; the rest follow the same carousel template.

---

## v0.5.92
- **`account-plans.html` switched from "stack all businesses" to a carousel** — one business' one-pager visible at a time, arrows to step through. The v0.5.91 stacked-vertically approach was wrong: scrolling through 3 full one-pagers stacked is overwhelming, and the mental model is "look at one, then look at the next", not "see them all at once".
- **Carousel UI:**
  - Top nav bar (white card, navy buttons): **← Prev (Business name)** | _Current Business Name_ + "Business X of Y" + dot indicators | **(Business name) Next →**
  - The prev/next buttons preview the next/previous business name as a hint inside the button itself.
  - Dot indicators below the counter — click a dot to jump straight to that business.
  - Keyboard `ArrowLeft` / `ArrowRight` to step through (ignored when typing in inputs/textareas).
  - Single business in account → no arrows, just the name + "Your only business" line.
- **Print now prints just the current view** (not all businesses) — `@media print` hides the carousel nav + intro + banner + toolbar, so you get exactly the one one-pager you're looking at as a single landscape A4 page.
- All other v0.5.91 behaviour preserved: Supabase queries scoped to caller's orgs, empty-field placeholders, yellow data-layer-pending banner when all businesses return empty, "← Account" back link.

---

## v0.5.91
- **New page: `account-plans.html` — cross-business One-Page Plans view.** The first real cross-business topic page; the proof-of-concept for the topic launcher (v0.5.89).
- **Use case:** owner running a board / strategy meeting wants to see every business' one-pager side-by-side without drilling into each one individually. Topic-first navigation: "I want to compare plans" → not "I want to open Business A, then Business B".
- **Layout:** account-level page (no business bottom-nav, no "← Home" — "← Account" back link to `my-businesses.html`). Stacked vertically: one compact one-pager card per business, in alphabetical order by name. Each card reuses the same 3-column layout as the per-business `one-page-plan.html` (Who We Are / Where We Are Going / How We Go to Market).
- **Data flow:** loads the caller's active `team_members` rows, then fires 5 parallel Supabase queries scoped to that orgId set — `core_values`, `core_focus`, `targets`, `marketing_strategy`, `leadership_team_members`. Builds a per-org data map and renders one card per business. Empty fields render as muted italic "— not recorded —" placeholders instead of looking broken.
- **Data-layer reality:** worksheet pages still save to localStorage (Supabase wiring lands in v0.5.94). So today the cross-business view will show every business as empty. To make this obvious rather than confusing, when every business returns zero strategy data the page shows a yellow banner: "Heads up: strategy worksheets currently save locally on each business. Once the data layer migration lands (v0.5.94), edits sync to Supabase and this page populates automatically."
- **Print:** landscape A4, page-break-after each business so a 3-business account prints to 3 pages. Toolbar Print/PDF button. Mobile shows a teal hint to scroll right inside each plan card for the 3-column doc.
- **Topic launcher update:** `account-plans.html` card on `my-businesses.html` flipped from `coming-soon` to `available` with an "Open" pill. 4 available cards on the dashboard now: Learning Vault, Businesses, Team, One-Page Plans. 12 still coming-soon (the rest of the cross-business pages).
- **Why this one first:** validates the navigation pattern (topic-first, account-level page, "← Account" back link), the visual pattern (compact card per business), and the data pattern (parallel queries scoped to orgId set, empty-state handling, banner for data-layer-pending). The remaining 12 cross-business pages follow the same template.

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
