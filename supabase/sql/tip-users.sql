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
do $$ begin
  -- owners can select own row
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tip-users' and policyname='Select own profile'
  ) then
    create policy "Select own profile" on public."tip-users"
      for select using (auth.uid() = id);
  end if;

  -- owners can upsert own row
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tip-users' and policyname='Upsert own profile'
  ) then
    create policy "Upsert own profile" on public."tip-users"
      for insert with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tip-users' and policyname='Update own profile'
  ) then
    create policy "Update own profile" on public."tip-users"
      for update using (auth.uid() = id);
  end if;
end $$;

-- Optional: index on pseudo for fast lookup
create index if not exists tip_users_pseudo_idx on public."tip-users"(pseudo);

-- Ensure case-insensitive uniqueness for pseudo and email (when provided)
do $$ begin
  -- Drop default unique constraint on pseudo if it exists (to replace with CI unique index)
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tip-users' and c.conname = 'tip-users_pseudo_key'
  ) then
    alter table public."tip-users" drop constraint "tip-users_pseudo_key";
  end if;
end $$;

create unique index if not exists tip_users_pseudo_unique_ci on public."tip-users" (lower(pseudo));
create unique index if not exists tip_users_email_unique_ci on public."tip-users" (lower(email)) where email is not null;

-- Optional: ensure role is one of allowed values
do $$ begin
  -- Ensure the column exists (for previously created tables)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tip-users' and column_name = 'role'
  ) then
    alter table public."tip-users" add column role text;
    alter table public."tip-users" alter column role set default 'user';
    update public."tip-users" set role = 'user' where role is null;
    alter table public."tip-users" alter column role set not null;
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tip-users' and c.conname = 'tip-users_role_check'
  ) then
    alter table public."tip-users"
      add constraint "tip-users_role_check" check (role in ('user', 'admin'));
  end if;
end $$;


