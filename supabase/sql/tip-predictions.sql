-- Create tip-predictions table
create table if not exists public."tip-predictions" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."tip-users"(id) on delete cascade,
  sport text not null,
  competition text not null,
  match_name text not null,
  date date not null,
  time time not null,
  odds numeric(5,2) not null,
  probable_score text,
  prediction_text text not null,
  details text,
  status text not null default 'pending_validation',
  result text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure status is one of allowed values
alter table public."tip-predictions" drop constraint if exists "tip-predictions_status_check";
alter table public."tip-predictions"
  add constraint "tip-predictions_status_check" check (status in ('pending_validation', 'active', 'waiting_result', 'success', 'failed', 'exact_success'));

-- Ensure result is one of allowed values when present
alter table public."tip-predictions" drop constraint if exists "tip-predictions_result_check";
alter table public."tip-predictions"
  add constraint "tip-predictions_result_check" check (result is null or result in ('success', 'failed', 'exact_success'));

-- Triggers for updated_at
drop trigger if exists set_updated_at_tip_predictions on public."tip-predictions";
create trigger set_updated_at_tip_predictions
before update on public."tip-predictions"
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public."tip-predictions" enable row level security;

-- Policies
drop policy if exists "Users view own predictions" on public."tip-predictions";
create policy "Users view own predictions" on public."tip-predictions"
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own predictions" on public."tip-predictions";
create policy "Users insert own predictions" on public."tip-predictions"
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own pending" on public."tip-predictions";
create policy "Users update own pending" on public."tip-predictions"
  for update using (auth.uid() = user_id and status = 'pending_validation');

drop policy if exists "Admins view all" on public."tip-predictions";
create policy "Admins view all" on public."tip-predictions"
  for select using (
    exists (
      select 1 from public."tip-users"
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins update all" on public."tip-predictions";
create policy "Admins update all" on public."tip-predictions"
  for update using (
    exists (
      select 1 from public."tip-users"
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Users view active predictions" on public."tip-predictions";
create policy "Users view active predictions" on public."tip-predictions"
  for select using (status in ('active', 'waiting_result', 'success', 'failed', 'exact_success') and auth.uid() is not null);

-- Indexes for performance
create index if not exists tip_predictions_user_id_idx on public."tip-predictions"(user_id);
create index if not exists tip_predictions_status_idx on public."tip-predictions"(status);
create index if not exists tip_predictions_date_time_idx on public."tip-predictions"(date, time);

