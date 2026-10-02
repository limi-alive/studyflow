-- StudyFlow database schema. Run in Supabase SQL editor or via migration tooling.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, icon text, emoji text, color text not null default '#8a6cff', goal_minutes int,
  exam_date timestamptz, priority int not null default 1, archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade, parent_id uuid references public.topics(id) on delete cascade,
  name text not null, kind text not null default 'topic' check (kind in ('chapter','topic')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null, topic_id uuid references public.topics(id) on delete set null,
  title text not null, description text, priority int not null default 1, deadline timestamptz, estimated_minutes int, actual_minutes int,
  status text not null default 'todo' check (status in ('todo','in_progress','completed','skipped','archived')), repeat text,
  created_at timestamptz not null default now(), completed_at timestamptz, updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null, topic_id uuid references public.topics(id) on delete set null, task_id uuid references public.tasks(id) on delete set null,
  start_time timestamptz not null, end_time timestamptz not null, study_seconds int not null check(study_seconds >= 0), break_seconds int not null default 0,
  pause_seconds int not null default 0, timer_type text not null, focus_rating int check(focus_rating between 1 and 5), note text, device_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, target numeric not null, period text not null, subject_id uuid references public.subjects(id) on delete set null,
  start_date date, end_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null, name text not null, date timestamptz not null, priority int not null default 1,
  target_hours numeric, completed_hours numeric, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade, language text not null default 'en', calendar_type text not null default 'gregorian',
  number_format text not null default 'latin', week_start text not null default 'monday', theme_id text not null default 'liquid', default_timer text not null default 'stopwatch',
  pomodoro_focus int not null default 25, pomodoro_short_break int not null default 5, pomodoro_long_break int not null default 15,
  notifications boolean not null default true, haptics boolean not null default true, sounds boolean not null default false, reduce_motion boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade, status text not null default 'pending', created_at timestamptz not null default now(), unique(requester_id,addressee_id)
);
create table if not exists public.shared_challenges (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null, target_minutes int not null, starts_at timestamptz not null, ends_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.challenge_members (
  challenge_id uuid not null references public.shared_challenges(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(challenge_id,user_id)
);

create index if not exists subjects_user_idx on public.subjects(user_id);
create index if not exists topics_user_subject_idx on public.topics(user_id,subject_id);
create index if not exists tasks_user_status_idx on public.tasks(user_id,status);
create index if not exists tasks_subject_idx on public.tasks(subject_id);
create index if not exists sessions_user_start_idx on public.study_sessions(user_id,start_time desc);
create index if not exists sessions_subject_idx on public.study_sessions(subject_id);
create index if not exists sessions_updated_idx on public.study_sessions(updated_at);
create index if not exists goals_user_idx on public.goals(user_id);
create index if not exists exams_user_date_idx on public.exams(user_id,date);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.goals enable row level security;
alter table public.exams enable row level security;
alter table public.user_settings enable row level security;
alter table public.friendships enable row level security;
alter table public.shared_challenges enable row level security;
alter table public.challenge_members enable row level security;

-- Private user-owned tables: auth.uid() must equal user_id.
do $$
declare t text;
begin
  foreach t in array array['subjects','topics','tasks','study_sessions','goals','exams'] loop
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

drop policy if exists profile_owner on public.profiles;
create policy profile_owner on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists settings_owner on public.user_settings;
create policy settings_owner on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists friendship_parties on public.friendships;
create policy friendship_parties on public.friendships for select using (auth.uid() in (requester_id,addressee_id));
drop policy if exists friendship_create on public.friendships;
create policy friendship_create on public.friendships for insert with check (auth.uid() = requester_id);
drop policy if exists friendship_update on public.friendships;
create policy friendship_update on public.friendships for update using (auth.uid() in (requester_id,addressee_id));

drop policy if exists challenge_owner on public.shared_challenges;
create policy challenge_owner on public.shared_challenges for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists challenge_member_read on public.challenge_members;
create policy challenge_member_read on public.challenge_members for select using (auth.uid() = user_id);
drop policy if exists challenge_member_join on public.challenge_members;
create policy challenge_member_join on public.challenge_members for insert with check (auth.uid() = user_id);

-- Extension tables reserved by the product specification for V1.5/V2.
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, description text, xp_reward int not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade, achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(), primary key(user_id,achievement_id)
);
create table if not exists public.themes (
  id text primary key, name text not null, definition jsonb not null default '{}'::jsonb, is_public boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.user_themes (
  user_id uuid not null references auth.users(id) on delete cascade, theme_id text not null references public.themes(id) on delete cascade,
  definition jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(), primary key(user_id,theme_id)
);
create table if not exists public.distractions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete cascade, reason text not null, created_at timestamptz not null default now()
);
create table if not exists public.sync_metadata (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null, last_sync_at timestamptz, cursor text, updated_at timestamptz not null default now(), unique(user_id,device_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.themes enable row level security;
alter table public.user_themes enable row level security;
alter table public.distractions enable row level security;
alter table public.sync_metadata enable row level security;

drop policy if exists achievements_read on public.achievements;
create policy achievements_read on public.achievements for select using (true);
drop policy if exists user_achievements_owner on public.user_achievements;
create policy user_achievements_owner on public.user_achievements for select using (auth.uid() = user_id);
drop policy if exists themes_read on public.themes;
create policy themes_read on public.themes for select using (is_public = true);
drop policy if exists user_themes_owner on public.user_themes;
create policy user_themes_owner on public.user_themes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists distractions_owner on public.distractions;
create policy distractions_owner on public.distractions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists sync_metadata_owner on public.sync_metadata;
create policy sync_metadata_owner on public.sync_metadata for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
