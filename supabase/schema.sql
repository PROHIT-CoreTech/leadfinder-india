-- ============================================================
-- LeadFinder India — Step 1 schema
-- Run this in the Supabase SQL editor for your project
-- (Dashboard → SQL Editor → New query → paste → Run)
-- ============================================================

-- 1. LEADS TABLE ------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text,
  email text,
  rating numeric(2, 1),
  address text,
  website text,
  city text not null,
  category text not null,
  last_updated date not null default current_date
);

create index if not exists leads_city_category_idx
  on public.leads (city, category);

alter table public.leads enable row level security;

-- Any signed-in user can read leads. Writes are not exposed to
-- the client in this step — the data pipeline (Step 2) will
-- write via the Supabase service role key instead.
create policy "Authenticated users can read leads"
  on public.leads
  for select
  to authenticated
  using (true);


-- 2. PROFILES TABLE ----------------------------------------------
-- Mirrors auth.users with the subscription plan and monthly usage
-- counter used to gate features like CSV export.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free'
    check (plan in ('free', 'starter', 'pro', 'agency')),
  leads_used_this_month integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a free-tier profile row whenever someone signs up
-- (email/password or Google) so the dashboard never hits a
-- missing-profile edge case.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, plan, leads_used_this_month)
  values (new.id, 'free', 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. SAMPLE LEAD DATA ---------------------------------------------
-- 40 realistic rows across Pune + Mumbai x Salons/Restaurants/Clinics/Gyms
-- so the UI can be tested end-to-end before the live data pipeline
-- (Step 2) is connected.

insert into public.leads
  (business_name, phone, email, rating, address, website, city, category)
values
  -- Pune — Salons
  ('Glow & Co. Salon Studio', '+91 98221 44567', 'hello@glowandco.in', 4.6, 'FC Road, Shivajinagar, Pune', 'https://glowandco.in', 'Pune', 'Salons'),
  ('Radiance Unisex Salon', '+91 90211 78823', 'contact@radiancesalon.in', 4.3, 'Aundh, Pune', null, 'Pune', 'Salons'),
  ('The Style Loft', '+91 91581 32209', 'bookings@thestyleloft.in', 4.4, 'Koregaon Park, Pune', 'https://thestyleloft.in', 'Pune', 'Salons'),
  ('Bloom Beauty Bar', '+91 87933 90012', null, 3.9, 'Baner Road, Pune', null, 'Pune', 'Salons'),
  ('Urban Cuts Salon & Spa', '+91 98509 66741', 'info@urbancuts.in', 4.1, 'Kothrud, Pune', 'https://urbancuts.in', 'Pune', 'Salons'),

  -- Pune — Restaurants
  ('Konkan Coast Kitchen', '+91 99231 20044', 'reservations@konkancoast.in', 4.5, 'Deccan Gymkhana, Pune', 'https://konkancoast.in', 'Pune', 'Restaurants'),
  ('Peshwa Thali House', '+91 98816 40023', null, 4.2, 'Sadashiv Peth, Pune', null, 'Pune', 'Restaurants'),
  ('Spice Junction Multi-cuisine', '+91 90967 55210', 'info@spicejunction.in', 3.8, 'Viman Nagar, Pune', 'https://spicejunction.in', 'Pune', 'Restaurants'),
  ('The Terrace Bistro', '+91 88888 12456', 'hello@terracebistro.in', 4.6, 'Koregaon Park, Pune', 'https://terracebistro.in', 'Pune', 'Restaurants'),
  ('Malwa Ghar', '+91 96375 88012', null, 4.0, 'Karve Nagar, Pune', null, 'Pune', 'Restaurants'),

  -- Pune — Clinics
  ('CarePlus Family Clinic', '+91 98505 33221', 'appointments@careplus.in', 4.4, 'Kothrud, Pune', 'https://careplus.in', 'Pune', 'Clinics'),
  ('Sunrise Skin & Dental Clinic', '+91 99700 12987', 'contact@sunriseclinic.in', 4.1, 'Aundh, Pune', null, 'Pune', 'Clinics'),
  ('Wellness First Multispeciality', '+91 90112 44576', 'info@wellnessfirst.in', 4.3, 'Baner, Pune', 'https://wellnessfirst.in', 'Pune', 'Clinics'),
  ('Prime Health Diagnostics', '+91 89759 20033', null, 3.7, 'Shivajinagar, Pune', null, 'Pune', 'Clinics'),
  ('MedCare Physio & Ortho', '+91 98220 61190', 'info@medcarephysio.in', 4.5, 'Viman Nagar, Pune', 'https://medcarephysio.in', 'Pune', 'Clinics'),

  -- Pune — Gyms
  ('IronCore Fitness Studio', '+91 90755 34210', 'join@ironcorefitness.in', 4.5, 'Kothrud, Pune', 'https://ironcorefitness.in', 'Pune', 'Gyms'),
  ('PulsePoint Gym & CrossFit', '+91 98903 77012', null, 4.2, 'Baner, Pune', 'https://pulsepointgym.in', 'Pune', 'Gyms'),
  ('FlexZone 24x7 Fitness', '+91 99225 68741', 'info@flexzone.in', 3.9, 'Wakad, Pune', null, 'Pune', 'Gyms'),
  ('Momentum Strength Lab', '+91 88057 99123', 'hello@momentumlab.in', 4.6, 'Viman Nagar, Pune', 'https://momentumlab.in', 'Pune', 'Gyms'),
  ('Vitality Health Club', '+91 97633 40982', null, 4.0, 'Deccan Gymkhana, Pune', null, 'Pune', 'Gyms'),

  -- Mumbai — Salons
  ('Silk Route Salon', '+91 98192 55671', 'hello@silkroutesalon.in', 4.4, 'Bandra West, Mumbai', 'https://silkroutesalon.in', 'Mumbai', 'Salons'),
  ('Metro Glam Studio', '+91 90045 12290', null, 4.0, 'Andheri West, Mumbai', null, 'Mumbai', 'Salons'),
  ('The Grooming Room', '+91 88799 30021', 'bookings@groomingroom.in', 4.3, 'Powai, Mumbai', 'https://groomingroom.in', 'Mumbai', 'Salons'),
  ('Belleza Unisex Salon', '+91 91674 88203', null, 3.8, 'Malad West, Mumbai', null, 'Mumbai', 'Salons'),
  ('Aura Hair & Beauty Lounge', '+91 99870 44215', 'contact@auralounge.in', 4.5, 'Juhu, Mumbai', 'https://auralounge.in', 'Mumbai', 'Salons'),

  -- Mumbai — Restaurants
  ('Coastal Curry House', '+91 98213 66754', 'info@coastalcurry.in', 4.5, 'Bandra West, Mumbai', 'https://coastalcurry.in', 'Mumbai', 'Restaurants'),
  ('Bombay Tiffin Diner', '+91 90298 11045', null, 4.2, 'Dadar, Mumbai', null, 'Mumbai', 'Restaurants'),
  ('The Marine Table', '+91 88214 90032', 'reservations@marinetable.in', 4.6, 'Marine Lines, Mumbai', 'https://marinetable.in', 'Mumbai', 'Restaurants'),
  ('Spice Trail Kitchen', '+91 97699 22014', null, 3.9, 'Andheri East, Mumbai', null, 'Mumbai', 'Restaurants'),
  ('Old Town Cafe & Grill', '+91 96193 55098', 'hello@oldtowncafe.in', 4.1, 'Powai, Mumbai', 'https://oldtowncafe.in', 'Mumbai', 'Restaurants'),

  -- Mumbai — Clinics
  ('Harbour View Family Clinic', '+91 98673 20984', 'appointments@harbourview.in', 4.3, 'Chembur, Mumbai', 'https://harbourview.in', 'Mumbai', 'Clinics'),
  ('CityCare Skin & Dental', '+91 90224 87621', null, 4.0, 'Andheri West, Mumbai', null, 'Mumbai', 'Clinics'),
  ('Wellspring Multispeciality Clinic', '+91 88507 12093', 'info@wellspringclinic.in', 4.4, 'Powai, Mumbai', 'https://wellspringclinic.in', 'Mumbai', 'Clinics'),
  ('Suburban Diagnostics Hub', '+91 99321 60872', null, 3.7, 'Malad West, Mumbai', null, 'Mumbai', 'Clinics'),
  ('NeoLife Physio Centre', '+91 97722 45109', 'contact@neolifephysio.in', 4.5, 'Juhu, Mumbai', 'https://neolifephysio.in', 'Mumbai', 'Clinics'),

  -- Mumbai — Gyms
  ('SteelFrame Fitness Studio', '+91 90887 33021', 'join@steelframefitness.in', 4.4, 'Bandra West, Mumbai', 'https://steelframefitness.in', 'Mumbai', 'Gyms'),
  ('PowerHouse Gym & CrossFit', '+91 98675 09912', null, 4.1, 'Andheri East, Mumbai', 'https://powerhousegym.in', 'Mumbai', 'Gyms'),
  ('Zenith 24x7 Fitness', '+91 88123 47760', 'info@zenithfitness.in', 3.8, 'Malad West, Mumbai', null, 'Mumbai', 'Gyms'),
  ('Apex Strength & Conditioning', '+91 96631 20087', 'hello@apexstrength.in', 4.6, 'Powai, Mumbai', 'https://apexstrength.in', 'Mumbai', 'Gyms'),
  ('Coastal Wellness Club', '+91 97845 66019', null, 4.0, 'Juhu, Mumbai', null, 'Mumbai', 'Gyms')
on conflict do nothing;
