-- Create tip-users table
create table if not exists public."tip-users" (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  pseudo text,
  role text not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- triggers for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_tip_users on public."tip-users";
create trigger set_updated_at_tip_users
before update on public."tip-users"
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public."tip-users" enable row level security;

-- Policies
drop policy if exists "Select own profile" on public."tip-users";
create policy "Select own profile" on public."tip-users"
  for select using (auth.uid() = id);

drop policy if exists "Upsert own profile" on public."tip-users";
create policy "Upsert own profile" on public."tip-users"
  for insert with check (auth.uid() = id);

drop policy if exists "Update own profile" on public."tip-users";
create policy "Update own profile" on public."tip-users"
  for update using (auth.uid() = id);

drop policy if exists "Users view public profiles" on public."tip-users";
create policy "Users view public profiles" on public."tip-users"
  for select using (auth.uid() is not null);

-- Optional: index on pseudo for fast lookup
create index if not exists tip_users_pseudo_idx on public."tip-users"(pseudo);

-- Ensure case-insensitive uniqueness for pseudo and email (when provided)
-- Drop default unique constraint on pseudo if it exists (to replace with CI unique index)
alter table public."tip-users" drop constraint if exists "tip-users_pseudo_key";

create unique index if not exists tip_users_pseudo_unique_ci on public."tip-users" (lower(pseudo));
create unique index if not exists tip_users_email_unique_ci on public."tip-users" (lower(email)) where email is not null;

-- Optional: ensure role is one of allowed values
-- Ensure the column exists (for previously created tables)
alter table public."tip-users" add column if not exists role text;
alter table public."tip-users" alter column role set default 'user';
update public."tip-users" set role = 'user' where role is null;
alter table public."tip-users" alter column role set not null;

-- Add role check constraint
alter table public."tip-users" drop constraint if exists "tip-users_role_check";
alter table public."tip-users"
  add constraint "tip-users_role_check" check (role in ('user', 'admin'));

-- Add stats columns to tip-users (for previously created tables)
alter table public."tip-users" add column if not exists total_predictions integer default 0;
alter table public."tip-users" add column if not exists success_predictions integer default 0;
alter table public."tip-users" add column if not exists exact_score_predictions integer default 0;
alter table public."tip-users" add column if not exists success_rate numeric(5,2) default 0.00;
alter table public."tip-users" add column if not exists avg_odds numeric(5,2) default 0.00;


