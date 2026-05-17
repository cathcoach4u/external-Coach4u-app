# Supabase — Setup & Migration

The full schema lives in `schema.sql`. This file explains how to apply it and what each part does.

## How to apply the schema

1. Open the Supabase dashboard for the project at **https://eekefsuaefgpqmjdyniy.supabase.co**.
2. Click **SQL Editor** in the left nav.
3. Click **New query**.
4. Paste the contents of `schema.sql` (entire file).
5. Click **Run**.
6. You should see "Success. No rows returned" with no error messages.

The script is **idempotent** — safe to re-run. The `DROP TABLE IF EXISTS … CASCADE` block at the top wipes the old schema before creating the new one. **This destroys all existing data** in the old EOS-style tables (vto, rocks, scorecard_metrics, etc.) — the app has not yet been wired to Supabase so those tables are empty anyway, but worth noting.

The `public.users` table (the membership-status gate) is preserved — only its policies are recreated.

## What the schema gives you

Per the locked architecture in `CLAUDE.md`:

- **Account-level subscriptions** — one row in `subscriptions` per paying customer. Includes seat count + included businesses fields for the pricing model.
- **Multi-business support** — one row in `organisations` per business. Each subscription can own N organisations.
- **Team membership with 2 roles** — `team_members` table links users to organisations as `admin` or `member`.
- **Domain tables** — `core_values`, `core_focus`, `targets`, `marketing_strategy`, `leadership_team_members`, `scorecard_metrics`, `scorecard_entries`, `rocks`, `issues`, `meetings` + `meeting_headlines` + `meeting_todos`, `annual_sessions`, `quarterly_sessions`, `team_checkins`. All scoped by `organisation_id`.
- **RLS policies** — members can read all org data; only admins can write. `team_checkins` is special: any active member can INSERT (submit their own check-in), all members can read aggregated results.
- **Helper functions** — `public.user_org_ids(uid)` and `public.user_admin_org_ids(uid)` make policies compact and consistent.

## After applying the schema

Until the app pages are migrated from localStorage to Supabase (v0.5.83 in the plan), the app keeps working from the local demo data. The tables will sit empty.

## Testing the RLS

After running the schema, you can verify RLS works:

```sql
-- As a logged-in user, try inserting your own subscription
INSERT INTO public.subscriptions (owner_user_id) VALUES (auth.uid()) RETURNING id;

-- Create an organisation under that subscription
INSERT INTO public.organisations (subscription_id, name)
VALUES (<the id from above>, 'Test Business') RETURNING id;

-- Add yourself as admin
INSERT INTO public.team_members (organisation_id, user_id, role, status, joined_at)
VALUES (<org id>, auth.uid(), 'admin', 'active', now()) RETURNING id;

-- Now you should be able to read it back
SELECT * FROM public.organisations;          -- shows your org
SELECT * FROM public.team_members;           -- shows your membership
SELECT * FROM public.v_active_team;          -- the convenience view
```

## Bootstrap function — `bootstrap_organisation(business_name text)`

A SECURITY DEFINER function the app calls when a user creates their first business (or any subsequent business). Avoids the RLS chicken-and-egg of "can't insert team_member because you're not yet a team_member admin".

Behaviour:
- If the user has no `subscriptions` row → creates one with `owner_user_id = auth.uid()`
- Inserts a new `organisations` row under that subscription with the given name
- Inserts a `team_members` row for the caller with `role='admin'`, `status='active'`
- Returns the new `organisation_id`

Call from JS:
```js
const { data: orgId, error } = await supabase.rpc('bootstrap_organisation', {
  business_name: 'Acme Coaching'
});
```

Granted to `authenticated` role only — anonymous users cannot call it.

## Tables created

| Table | Rows per org | Notes |
|---|---|---|
| `subscriptions` | n/a (account-level) | Stripe IDs, seat counts |
| `organisations` | 1 row per business | belongs to a subscription |
| `team_members` | 1 per user-in-org | role + status + invited_email for pending invites |
| `core_values` | 1 | value_1..value_8 |
| `core_focus` | 1 | purpose, niche |
| `targets` | 1 | 10-year + 3-year + 1-year fields |
| `marketing_strategy` | 1 | target_market, uniques, proven_process, guarantee |
| `leadership_team_members` | N | name, role, responsibilities |
| `scorecard_metrics` | N | name, owner, goal, measurement_type |
| `scorecard_entries` | N | linked to metric; (metric_id, week_date) unique |
| `rocks` | N | quarterly priorities |
| `issues` | N | open / resolved |
| `meetings` | N | weekly L10-style |
| `meeting_headlines` | N | linked to meeting |
| `meeting_todos` | N | linked to meeting |
| `annual_sessions` | N | attendance + areas_completed |
| `quarterly_sessions` | N | attendance + areas_completed |
| `team_checkins` | N | scores + comments jsonb |

## Next steps in the build plan

After this schema lands:
- **v0.5.80** — Auth/signup flow updates: on first signup, create `subscriptions` + `organisations` + `team_members` (admin) rows for the new user
- **v0.5.81** — "My Businesses" landing page + business switcher in header
- **v0.5.82** — "My Team" page (invite teammates, manage roles)
- **v0.5.83** — Replace each tool's localStorage `api()` with `supabase.from(...)` calls scoped to the active org
- **v0.5.84** — Migration helper for existing localStorage data + final QA
