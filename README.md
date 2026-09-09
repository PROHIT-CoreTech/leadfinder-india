# LeadFinder India — Step 1 through 5

The full build: auth, plan-based feature gating, a live Google Places
API (New) pipeline with 30-day caching, a call tracking CRM (My
Pipeline), Razorpay subscription payments, an onboarding flow, upgrade
empty states, a public landing page, and mobile-responsive layout.
This is the complete Vibe Coding prompt sequence — ready for real use
once you've worked through the setup steps below.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Paste your Project URL and anon key into `.env.local`.

## 3. Set up the database

Open **Supabase Dashboard → SQL Editor → New query**, paste the entire
contents of `supabase/schema.sql`, and run it. This creates:

- `leads` table (with 40 sample rows across Pune/Mumbai × Salons/Restaurants/Clinics/Gyms)
- `profiles` table (plan + monthly usage counter), auto-created for every new signup
- Row Level Security policies so only signed-in users can read leads, and
  each user can only see/update their own profile

Then run **`supabase/schema-step3-call-logs.sql`** the same way — it adds
the `call_logs` table that powers the call tracking CRM (My Pipeline).

Then run **`supabase/schema-step4-billing.sql`** — it adds the Razorpay
subscription tracking columns to `profiles` (plan status, next billing
date, usage reset date).

Then run **`supabase/schema-step5-onboarding.sql`** — it adds the
`business_type`, `primary_city`, and `onboarding_completed` columns
used by the onboarding flow.

## 4. Get the service role key (needed for Step 2's data pipeline)

Same page as step 1 — **Project Settings → API → Project API keys →
`service_role`**. This key bypasses Row Level Security, so it's only ever
used server-side inside `/api/leads/search`, never sent to the browser.
Paste it into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`.

## 5. Turn on the Google Places API (New)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) →
   create or pick a project.
2. **APIs & Services → Library** → search **"Places API (New)"** → Enable it.
   (Not the older "Places API" — this app calls the New Text Search endpoint.)
3. **APIs & Services → Credentials** → Create an API key. For safety,
   restrict it to "Places API (New)" only.
4. Put it in `.env.local` as `GOOGLE_PLACES_API_KEY`.
5. Google gives new accounts a **$200/month free credit** — enough for
   plenty of testing, but keep an eye on the Billing dashboard once you
   have real users, since this is the cost driver flagged in the master plan.

## 6. Turn on Google sign-in (optional but built into the login page)

1. Supabase Dashboard → **Authentication → Providers → Google** → enable it.
2. You'll need a Google Cloud OAuth Client ID/Secret — Supabase's provider
   page links directly to the Google Cloud setup steps and tells you which
   redirect URL to paste into your Google Cloud OAuth config.
3. If you skip this step, email/password sign-in still works fine on its own.

## 7. Set up Razorpay (needed for Step 4's payments)

1. Sign up / log in at [dashboard.razorpay.com](https://dashboard.razorpay.com).
   Test Mode is on by default — use it for all of this until you're ready
   to actually charge real customers.
2. **Settings → API Keys → Generate Test Key** → copy the **Key Id** and
   **Key Secret** into `.env.local` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. **Subscriptions → Plans → Create Plan** — create **three** plans, one per
   paid tier:
   - Starter — ₹499, Monthly
   - Pro — ₹999, Monthly
   - Agency — ₹2,499, Monthly

   Each one gives you a Plan ID (looks like `plan_XXXXXXXXXXXX`) — paste
   those into `.env.local` as `RAZORPAY_PLAN_STARTER` / `RAZORPAY_PLAN_PRO`
   / `RAZORPAY_PLAN_AGENCY`.
4. **Settings → Webhooks → Add New Webhook**:
   - Webhook URL: `https://your-deployed-domain.com/api/billing/webhook`
     (this only works once the app is deployed somewhere with a public
     URL — `localhost` won't receive webhooks; see the testing note below)
   - Active events: check `subscription.activated`, `subscription.charged`,
     `subscription.cancelled`, `subscription.completed`, `subscription.halted`
   - Set a webhook secret and paste it into `.env.local` as
     `RAZORPAY_WEBHOOK_SECRET`
5. **Testing Checkout locally**, since Razorpay's popup works fine on
   `localhost` even though webhooks can't reach it: use one of
   [Razorpay's published test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
   (e.g. card `4111 1111 1111 1111`, any future expiry, any CVV) to
   complete a test subscription end-to-end. The `/verify` route will
   still unlock the plan immediately after a successful test payment —
   only the webhook (for renewals/cancellations happening later) needs
   a real deployed URL.

## 8. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll land on `/login`. Create an account
(or use Google), and you'll be dropped into `/dashboard` where you can
search Pune/Mumbai leads by category.

## How the Google Places caching works

`/api/leads/search` is the only place that ever calls the live Google API.
On every search it checks the newest `last_updated` date for that exact
city+category in the `leads` table:

- **Fresh (≤ 30 days old, or the Step 1 sample rows you just seeded):**
  served straight from `leads`, zero API calls, zero cost.
- **Missing or stale (> 30 days old):** fetches up to 3 pages (~60 places)
  from Google Places API (New), replaces the old rows for that combo, and
  stamps `last_updated` with today's date.

Because the Step 1 seed data is stamped with today's date, none of the 8
existing Pune/Mumbai × category combos will hit the live API right away —
that's the caching working as intended. **To test the live pipeline right
now**, either:

- Run this in the Supabase SQL editor to force one combo to look stale:
  ```sql
  update public.leads
  set last_updated = current_date - interval '31 days'
  where city = 'Pune' and category = 'Salons';
  ```
  Then search Pune → Salons in the app — it'll call Google and replace
  those rows.
- Or just wait 30 days and it happens automatically.

If `GOOGLE_PLACES_API_KEY` is missing or the API call fails, the search
doesn't break — it falls back to whatever's cached and shows an amber
warning banner instead.

## How the call CRM works

- Click **"Log call"** next to any lead on the search page, or **"Update"**
  on an existing entry in **My Pipeline**, to open the tracking form:
  status, notes, and an optional follow-up date/time.
- Each (user, lead) pair has exactly one evolving record in `call_logs` —
  logging a lead again updates the same row instead of creating a new one.
- **My Pipeline** lists everything you've logged, sortable by follow-up
  date. Rows with a **"Follow-up scheduled"** status whose date has already
  passed are highlighted red as overdue.
- The three summary cards at the top: leads contacted this month (any
  status other than "Not called", logged this calendar month), follow-ups
  due today (status = "Follow-up scheduled" with today's date), and
  conversion rate (Interested ÷ (Interested + Not interested)).

## What's gated behind plan already

- Every new signup gets `plan = 'free'` automatically (via a database trigger).
- **Free**: 5 leads shown per search (hard cap, not paginated), no CSV export,
  no call CRM access.
- **Starter (₹499/mo)**: 100 leads/month, CSV export — still no CRM access.
- **Pro (₹999/mo)**: 500 leads/month, CSV export, full call CRM access.
- **Agency (₹2,499/mo)**: unlimited leads, CSV export, full CRM (team seats
  are priced in but not yet built as a feature — see "What's next" below).
- Locked features (CSV export, "Log call", the My Pipeline page) stay
  **visible** with an "Upgrade to unlock" tooltip/prompt rather than
  disappearing.
- To test a plan without going through checkout, manually edit your row in
  **Supabase Dashboard → Table Editor → profiles** and change `plan` to
  `starter` / `pro` / `agency`.

## How billing works

- Upgrading opens Razorpay Checkout via the Subscriptions API — the
  Plan ID env vars from step 7 above decide what the customer is
  actually charged; the app never hardcodes a price itself.
- Right after a successful payment, `/api/billing/verify` checks the
  payment signature server-side and unlocks the plan immediately — no
  waiting for a webhook.
- The webhook (`/api/billing/webhook`) is the ongoing source of truth:
  it keeps `next_billing_at` current on renewals and downgrades the
  user back to `free` automatically if a payment fails or they cancel
  from outside the app.
- **Cancel subscription** on the Billing page cancels immediately
  (not "at cycle end") and drops the user straight to Free — worth
  revisiting later if you'd rather let paying customers keep access
  through the period they already paid for.
- Known simplification: monthly usage (`leads_used_this_month`) counts
  leads *returned per search*, not truly unique leads ever viewed — a
  user re-searching the same city/category repeatedly will use up
  their monthly allowance faster than "leads I've actually looked at."
  Fine for an MVP; worth tightening once real usage patterns show up.

## Onboarding flow

- Right after signup (email/password or Google), a new user is
  redirected to `/onboarding` instead of straight to `/dashboard` —
  enforced in `dashboard/layout.tsx` by checking `onboarding_completed`.
- The form asks business type (Agency / Freelancer / Business) and a
  primary target city. Submitting sets `onboarding_completed = true`
  and saves `primary_city`, which pre-fills the City dropdown on the
  search page from then on.
- Business type is captured but not yet used to change behaviour
  anywhere else — it's there for future segmentation (e.g. different
  onboarding tips or default categories per business type).

## Empty states for plan limits

- **Free tier**: when a search finds more leads than the 5-per-search
  cap allows, a banner under the results says exactly how many are
  hidden and links straight to Billing.
- **Paid tier monthly cap reached**: instead of an error message, the
  whole results area is replaced with a dedicated empty state
  (`LimitReachedState`) — icon, plain-language explanation, and a
  plan-specific pitch for what upgrading unlocks next (e.g. Starter →
  Pro mentions the call CRM specifically, not just "more leads").

## Landing page

- `/` now shows a public marketing page (hero, how-it-works, features,
  pricing pulled from the same `PLAN_DETAILS` config used on the
  Billing page, a testimonials section, and an FAQ accordion) to
  anyone not signed in. Signed-in visitors are redirected straight to
  `/dashboard` as before.
- The testimonials section is intentionally a labelled placeholder —
  swap in real quotes once you have paying customers willing to give one.

## Mobile responsiveness

- The dashboard sidebar becomes a slide-in drawer below the `md`
  breakpoint, opened via a hamburger button in a thin mobile top bar —
  see `DashboardShell.tsx`.
- The search form, page padding, and pricing grids all reflow for
  narrow screens.
- **Scoping note**: the leads and pipeline tables still scroll
  horizontally on very small screens rather than being rebuilt as
  stacked cards — a common, acceptable pattern for data-dense tables,
  but worth revisiting with a card layout if mobile usage turns out to
  be heavy once you have real users.

## What's next (not covered by this prompt sequence)

- Team seats for the Agency plan (priced in, not yet built as a feature)
- A "cancel at cycle end" option instead of immediate cancellation
- Tightening monthly usage metering to count unique leads viewed,
  not leads returned per search
- Real testimonials once you have customers
- More cities/categories as demand comes in

This closes out the 5-prompt build sequence from the master plan —
from here it's about running Phase 0 validation for real and iterating
based on what actual agency owners tell you.
