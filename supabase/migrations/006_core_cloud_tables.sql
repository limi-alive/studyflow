-- StudyFlow v13.2 — create the core cloud tables required by sync/admin.
-- Safe to run after 004_auth_signup_username.sql and 005_cross_device_admin.sql.

create extension if not exists pgcrypto;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  emoji text,
  color text not null default '#8a6cff',
  goal_minutes int,
  exam_date timestamptz,
  priority int not null default 1,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  parent_id uuid references public.topics(id) on delete cascade,
  name text not null,
  kind text not null default 'topic' check (kind in ('chapter','topic')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  description text,
  priority int not null default 1,
  deadline timestamptz,
  estimated_minutes int,
  actual_minutes int,
  status text not null default 'todo' check (status in ('todo','in_progress','completed','skipped','archived')),
  repeat text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  study_seconds int not null check (study_seconds >= 0),
  break_seconds int not null default 0,
  pause_seconds int not null default 0,
  timer_type text not null,
  focus_rating int check (focus_rating between 1 and 5),
  note text,
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  target numeric not null,
  period text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  name text not null,
  date timestamptz not null,
  priority int not null default 1,
  target_hours numeric,
  completed_hours numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'en',
  calendar_type text not null default 'gregorian',
  number_format text not null default 'latin',
  week_start text not null default 'monday',
  theme_id text not null default 'studio',
  default_timer text not null default 'stopwatch',
  pomodoro_focus int not null default 25,
  pomodoro_short_break int not null default 5,
  pomodoro_long_break int not null default 15,
  notifications boolean not null default true,
  haptics boolean not null default true,
  sounds boolean not null default false,
  reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists subjects_user_idx on public.subjects(user_id);
create index if not exists topics_user_subject_idx on public.topics(user_id, subject_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists sessions_user_start_idx on public.study_sessions(user_id, start_time desc);
create index if not exists sessions_subject_idx on public.study_sessions(subject_id);
create index if not exists sessions_updated_idx on public.study_sessions(updated_at);
create index if not exists goals_user_idx on public.goals(user_id);
create index if not exists exams_user_date_idx on public.exams(user_id, date);

-- Strict per-user RLS. Admin analytics reads through SECURITY DEFINER RPCs from migration 005.
do $$
declare
  tbl text;
  pol text;
begin
  foreach tbl in array array['subjects','topics','tasks','study_sessions','goals','exams'] loop
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
  end loop;
end $$;

alter table public.user_settings enable row level security;
drop policy if exists studyflow_settings_select_own on public.user_settings;
drop policy if exists studyflow_settings_insert_own on public.user_settings;
drop policy if exists studyflow_settings_update_own on public.user_settings;
drop policy if exists studyflow_settings_delete_own on public.user_settings;
create policy studyflow_settings_select_own on public.user_settings for select to authenticated using (auth.uid() = user_id);
create policy studyflow_settings_insert_own on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
create policy studyflow_settings_update_own on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy studyflow_settings_delete_own on public.user_settings for delete to authenticated using (auth.uid() = user_id);

-- Quick sanity check: the required relations should all resolve after this migration.
do $$
begin
  if to_regclass('public.study_sessions') is null then
    raise exception 'StudyFlow setup failed: study_sessions was not created';
  end if;
end $$;
