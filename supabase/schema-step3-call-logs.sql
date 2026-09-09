-- ============================================================
-- LeadFinder India — Step 3 schema addition
-- Run this AFTER schema.sql, in the Supabase SQL editor.
-- Adds the call tracking CRM (call_logs table).
-- ============================================================

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  status text not null default 'not_called'
    check (status in (
      'not_called',
      'called_interested',
      'called_not_interested',
      'follow_up_scheduled'
    )),
  notes text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One evolving tracking record per lead per user — logging a new
  -- call updates the same row rather than creating a history entry.
  unique (user_id, lead_id)
);

create index if not exists call_logs_user_id_idx on public.call_logs (user_id);
create index if not exists call_logs_follow_up_at_idx on public.call_logs (follow_up_at);

alter table public.call_logs enable row level security;

create policy "Users can read their own call logs"
  on public.call_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own call logs"
  on public.call_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own call logs"
  on public.call_logs for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own call logs"
  on public.call_logs for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at current on every edit.
create or replace function public.set_call_logs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists call_logs_set_updated_at on public.call_logs;
create trigger call_logs_set_updated_at
  before update on public.call_logs
  for each row execute procedure public.set_call_logs_updated_at();
