-- ============================================================
-- LeadFinder India — Step 5 schema addition
-- Run this AFTER the previous schema files.
-- Adds onboarding fields to `profiles`.
-- ============================================================

alter table public.profiles
  add column if not exists business_type text
    check (business_type in ('agency', 'freelancer', 'business')),
  add column if not exists primary_city text,
  add column if not exists onboarding_completed boolean not null default false;
