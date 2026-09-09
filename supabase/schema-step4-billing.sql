-- ============================================================
-- LeadFinder India — Step 4 schema addition
-- Run this AFTER schema.sql and schema-step3-call-logs.sql.
-- Adds Razorpay subscription tracking to `profiles`.
-- ============================================================

alter table public.profiles
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'cancelled')),
  add column if not exists next_billing_at timestamptz,
  -- The date leads_used_this_month next resets to 0. Defaults to the
  -- 1st of next month so existing users get a clean first cycle.
  add column if not exists usage_reset_at date not null default (
    date_trunc('month', current_date) + interval '1 month'
  )::date;
