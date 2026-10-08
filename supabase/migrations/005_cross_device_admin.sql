-- StudyFlow v13 — cross-device preferences + read-only admin analytics.
-- Run once in Supabase SQL Editor after deploying the v13 frontend.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
drop policy if exists studyflow_preferences_select_own on public.user_preferences;
drop policy if exists studyflow_preferences_insert_own on public.user_preferences;
drop policy if exists studyflow_preferences_update_own on public.user_preferences;
drop policy if exists studyflow_preferences_delete_own on public.user_preferences;
create policy studyflow_preferences_select_own on public.user_preferences for select to authenticated using (auth.uid() = user_id);
create policy studyflow_preferences_insert_own on public.user_preferences for insert to authenticated with check (auth.uid() = user_id);
create policy studyflow_preferences_update_own on public.user_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy studyflow_preferences_delete_own on public.user_preferences for delete to authenticated using (auth.uid() = user_id);

-- Membership in this table is the only source of admin authority.
-- There are intentionally no INSERT/UPDATE/DELETE policies for normal app users.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
drop policy if exists studyflow_admin_read_self on public.admin_users;
create policy studyflow_admin_read_self on public.admin_users for select to authenticated using (auth.uid() = user_id);

create or replace function public.is_studyflow_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
     and exists(select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

revoke all on function public.is_studyflow_admin() from public;
grant execute on function public.is_studyflow_admin() to authenticated;

create or replace function public.studyflow_admin_overview(
  period_start timestamptz default null,
  period_end timestamptz default null
)
returns table(
  user_id uuid,
  username text,
  display_name text,
  period_seconds bigint,
  all_time_seconds bigint,
  session_count bigint,
  last_study_at timestamptz,
  rank_no bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_studyflow_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  with period_stats as (
    select s.user_id,
           coalesce(sum(s.study_seconds),0)::bigint as seconds,
           count(*)::bigint as sessions
    from public.study_sessions s
    where s.deleted_at is null
      and (period_start is null or s.end_time >= period_start)
      and (period_end is null or s.end_time < period_end)
    group by s.user_id
  ), all_stats as (
    select s.user_id,
           coalesce(sum(s.study_seconds),0)::bigint as seconds,
           max(s.end_time) as last_study
    from public.study_sessions s
    where s.deleted_at is null
    group by s.user_id
  ), ranked as (
    select p.id,
           p.username,
           p.display_name,
           coalesce(ps.seconds,0)::bigint as period_seconds,
           coalesce(a.seconds,0)::bigint as all_time_seconds,
           coalesce(ps.sessions,0)::bigint as session_count,
           a.last_study as last_study_at,
           row_number() over(order by coalesce(ps.seconds,0) desc, coalesce(a.seconds,0) desc, p.created_at asc)::bigint as rank_no
    from public.profiles p
    left join period_stats ps on ps.user_id = p.id
    left join all_stats a on a.user_id = p.id
  )
  select ranked.id, ranked.username, ranked.display_name, ranked.period_seconds,
         ranked.all_time_seconds, ranked.session_count, ranked.last_study_at, ranked.rank_no
  from ranked
  order by ranked.rank_no, ranked.username nulls last;
end;
$$;

revoke all on function public.studyflow_admin_overview(timestamptz,timestamptz) from public;
grant execute on function public.studyflow_admin_overview(timestamptz,timestamptz) to authenticated;

create or replace function public.studyflow_admin_user_subjects(
  target_user uuid,
  period_start timestamptz default null,
  period_end timestamptz default null
)
returns table(
  subject_id uuid,
  subject_name text,
  study_seconds bigint,
  session_count bigint,
  last_studied_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_studyflow_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select s.subject_id,
         coalesce(sub.name, 'Unassigned')::text,
         coalesce(sum(s.study_seconds),0)::bigint,
         count(*)::bigint,
         max(s.end_time)
  from public.study_sessions s
  left join public.subjects sub on sub.id = s.subject_id
  where s.user_id = target_user
    and s.deleted_at is null
    and (period_start is null or s.end_time >= period_start)
    and (period_end is null or s.end_time < period_end)
  group by s.subject_id, sub.name
  order by sum(s.study_seconds) desc;
end;
$$;

revoke all on function public.studyflow_admin_user_subjects(uuid,timestamptz,timestamptz) from public;
grant execute on function public.studyflow_admin_user_subjects(uuid,timestamptz,timestamptz) to authenticated;

create or replace function public.studyflow_admin_recent_sessions(
  target_user uuid,
  row_limit int default 12
)
returns table(
  session_id uuid,
  subject_name text,
  start_time timestamptz,
  end_time timestamptz,
  study_seconds int,
  timer_type text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_studyflow_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select s.id,
         coalesce(sub.name, 'Unassigned')::text,
         s.start_time,
         s.end_time,
         s.study_seconds,
         s.timer_type
  from public.study_sessions s
  left join public.subjects sub on sub.id = s.subject_id
  where s.user_id = target_user and s.deleted_at is null
  order by s.end_time desc
  limit greatest(1, least(coalesce(row_limit,12),50));
end;
$$;

revoke all on function public.studyflow_admin_recent_sessions(uuid,int) from public;
grant execute on function public.studyflow_admin_recent_sessions(uuid,int) to authenticated;

-- IMPORTANT: promote admins only from Supabase SQL Editor, never from the browser app.
-- After this migration, run ONE command with your own StudyFlow username:
-- insert into public.admin_users(user_id)
-- select id from public.profiles where lower(username)=lower('YOUR_USERNAME')
-- on conflict (user_id) do nothing;

-- Keep the existing password-protected reset complete after adding cloud preferences.
create or replace function public.wipe_my_study_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  table_name text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  foreach table_name in array array[
    'distractions','user_achievements','study_sessions','tasks','topics',
    'goals','exams','subjects','user_settings','user_preferences'
  ] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('delete from public.%I where user_id = $1',table_name) using uid;
    end if;
  end loop;
end;
$$;

grant execute on function public.wipe_my_study_data() to authenticated;
