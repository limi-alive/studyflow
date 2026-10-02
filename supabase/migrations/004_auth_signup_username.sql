-- StudyFlow v12 — self-contained account signup, unique usernames, RLS profile isolation,
-- password-protected study-data reset support.
-- Run this ONCE in Supabase SQL Editor. It safely supersedes 003_profiles_reset.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_username_unique_ci
  on public.profiles(lower(username))
  where username is not null;

create or replace function public.handle_new_studyflow_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text := lower(trim(coalesce(new.raw_user_meta_data->>'username','')));
  final_username text;
begin
  if requested_username ~ '^[a-z0-9_]{3,24}$' then
    final_username := requested_username;
  else
    final_username := 'user_' || substr(replace(new.id::text,'-',''),1,10);
  end if;

  insert into public.profiles(id,username,display_name,created_at,updated_at)
  values(
    new.id,
    final_username,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), final_username),
    now(),
    now()
  )
  on conflict(id) do update set
    username = coalesce(public.profiles.username, excluded.username),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
exception
  when unique_violation then
    raise exception 'Username already taken';
end;
$$;

drop trigger if exists on_auth_user_created_studyflow_profile on auth.users;
create trigger on_auth_user_created_studyflow_profile
after insert on auth.users
for each row execute function public.handle_new_studyflow_user();

insert into public.profiles(id,username,display_name,created_at,updated_at)
select
  id,
  'user_' || substr(replace(id::text,'-',''),1,10),
  coalesce(raw_user_meta_data->>'display_name',raw_user_meta_data->>'name'),
  now(),
  now()
from auth.users
on conflict(id) do update set
  username = coalesce(public.profiles.username,excluded.username),
  updated_at = now();

alter table public.profiles enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
on public.profiles for select to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.is_username_available(candidate text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(candidate));
begin
  if normalized !~ '^[a-z0-9_]{3,24}$' then return false; end if;
  return not exists(
    select 1 from public.profiles
    where lower(username) = normalized
      and id <> coalesce(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid)
  );
end;
$$;

-- Anonymous access is intentionally limited to a boolean availability check.
-- It does not expose profile rows or email addresses.
grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.claim_username(candidate text, display_name_input text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(candidate));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if normalized !~ '^[a-z0-9_]{3,24}$' then raise exception 'Invalid username'; end if;

  begin
    insert into public.profiles(id,username,display_name,updated_at)
    values(auth.uid(),normalized,nullif(trim(display_name_input),''),now())
    on conflict(id) do update set
      username=excluded.username,
      display_name=coalesce(excluded.display_name,public.profiles.display_name),
      updated_at=now();
    return true;
  exception when unique_violation then
    return false;
  end;
end;
$$;

grant execute on function public.claim_username(text,text) to authenticated;

create or replace function public.wipe_my_study_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  table_name text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  foreach table_name in array array[
    'distractions','user_achievements','study_sessions','tasks','topics',
    'goals','exams','subjects','user_settings'
  ] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('delete from public.%I where user_id = $1',table_name) using uid;
    end if;
  end loop;
end;
$$;

grant execute on function public.wipe_my_study_data() to authenticated;

-- Enforce strict per-user isolation on StudyFlow user-owned tables that already exist.
-- This intentionally replaces policies on these private V1 tables with auth.uid() = user_id.
do $$
declare
  tbl text;
  pol text;
begin
  foreach tbl in array array[
    'subjects','topics','tasks','study_sessions','goals','exams',
    'user_settings','user_achievements','distractions','user_themes'
  ] loop
    if to_regclass('public.' || tbl) is not null
       and exists (
         select 1 from information_schema.columns c
         where c.table_schema='public' and c.table_name=tbl and c.column_name='user_id'
       ) then
      execute format('alter table public.%I enable row level security', tbl);

      for pol in
        select p.policyname from pg_policies p
        where p.schemaname='public' and p.tablename=tbl
      loop
        execute format('drop policy if exists %I on public.%I', pol, tbl);
      end loop;

      execute format('create policy studyflow_select_own on public.%I for select to authenticated using (auth.uid() = user_id)', tbl);
      execute format('create policy studyflow_insert_own on public.%I for insert to authenticated with check (auth.uid() = user_id)', tbl);
      execute format('create policy studyflow_update_own on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', tbl);
      execute format('create policy studyflow_delete_own on public.%I for delete to authenticated using (auth.uid() = user_id)', tbl);
    end if;
  end loop;
end;
$$;
