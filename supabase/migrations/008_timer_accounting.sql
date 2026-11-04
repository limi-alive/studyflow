-- PR #16 prerequisite: apply BEFORE deploying the matching client; do not run from the browser.
-- Additive schema only. Existing RLS and historical sessions/payouts are unchanged.
-- Legacy sessions (no active_segments) retain their full study_seconds at end_time.
alter table public.study_sessions add column if not exists active_segments jsonb;
create index if not exists studyflow_sessions_end_live on public.study_sessions(end_time) where deleted_at is null;
alter table public.user_settings add column if not exists checkpoint_minutes int not null default 120;
alter table public.user_settings drop constraint if exists studyflow_checkpoint_minutes_range;
alter table public.user_settings add constraint studyflow_checkpoint_minutes_range check (checkpoint_minutes between 1 and 240);

create or replace function public.studyflow_validate_segments() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare segment jsonb; first_at timestamptz; last_at timestamptz; previous_end timestamptz; total_ms numeric := 0;
begin
  if new.study_seconds < 0 or new.end_time < new.start_time then
    raise exception 'Invalid study session' using errcode = '23514';
  end if;
  -- Historic oversized rows remain editable for unrelated metadata; no new oversized credit.
  if new.study_seconds > 86400 then
    if tg_op = 'INSERT' or new.active_segments is not null then
      raise exception 'Excessive study duration' using errcode = '23514';
    end if;
    if new.study_seconds is distinct from old.study_seconds then
      raise exception 'Excessive study duration' using errcode = '23514';
    end if;
  end if;
  if new.active_segments is null then return new; end if;
  if new.end_time > now() + interval '5 minutes' then
    raise exception 'Future active segment' using errcode = '23514';
  end if;
  if jsonb_typeof(new.active_segments) <> 'array' then
    raise exception 'Invalid active segments' using errcode = '23514';
  end if;
  if jsonb_array_length(new.active_segments) > 500 then
    raise exception 'Too many active segments' using errcode = '23514';
  end if;
  for segment in select value from jsonb_array_elements(new.active_segments) loop
    if jsonb_typeof(segment) <> 'object' or jsonb_typeof(segment->'start') <> 'string' or jsonb_typeof(segment->'end') <> 'string' then
      raise exception 'Invalid active segment' using errcode = '23514';
    end if;
    if (segment->>'start') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
      or (segment->>'end') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$' then
      raise exception 'Active segments must use UTC ISO timestamps' using errcode = '23514';
    end if;
    first_at := (segment->>'start')::timestamptz;
    last_at := (segment->>'end')::timestamptz;
    if first_at < new.start_time or last_at > new.end_time or last_at <= first_at or (previous_end is not null and first_at < previous_end) then
      raise exception 'Invalid active segment bounds' using errcode = '23514';
    end if;
    total_ms := total_ms + extract(epoch from last_at-first_at)*1000;
    previous_end := last_at;
  end loop;
  if total_ms <> new.study_seconds*1000 then
    raise exception 'Segment duration does not match study time' using errcode = '23514';
  end if;
  return new;
end; $$;
drop trigger if exists studyflow_validate_segments_trigger on public.study_sessions;
create trigger studyflow_validate_segments_trigger before insert or update on public.study_sessions
for each row execute function public.studyflow_validate_segments();
revoke all on function public.studyflow_validate_segments() from public, anon, authenticated;

-- Private helper; only owner-executed SECURITY DEFINER analytics RPCs call it.
-- Ordered union counts concurrent overlapping segments once per user, retaining every history row.
create or replace function public.studyflow_counted_intervals(period_start timestamptz, period_end timestamptz)
returns table(user_id uuid, subject_id uuid, session_id uuid, seconds numeric)
language sql stable security definer set search_path = public, pg_temp as $$
with legacy as (
  select s.user_id, s.subject_id, s.id as session_id, s.study_seconds::numeric as seconds
  from public.study_sessions s where s.deleted_at is null and s.active_segments is null
    and (period_start is null or s.end_time >= period_start)
    and (period_end is null or s.end_time < period_end)
), segments as (
  select s.user_id, s.subject_id, s.id as session_id,
         greatest((part.value->>'start')::timestamptz, coalesce(period_start, '-infinity'::timestamptz)) as begins,
         least((part.value->>'end')::timestamptz, coalesce(period_end, 'infinity'::timestamptz)) as finishes
  from public.study_sessions s cross join lateral jsonb_array_elements(s.active_segments) as part(value)
  where s.deleted_at is null and s.active_segments is not null
    and (period_start is null or s.end_time > period_start)
    and (period_end is null or s.start_time < period_end)
), ordered as (
  select seg.*,
         max(seg.finishes) over (partition by seg.user_id order by seg.begins, seg.finishes, seg.session_id
           rows between unbounded preceding and 1 preceding) as already_covered
  from segments seg where seg.finishes > seg.begins
), credited as (
  select o.user_id, o.subject_id, o.session_id,
         greatest(0, extract(epoch from (o.finishes - greatest(o.begins, coalesce(o.already_covered, o.begins))))) as seconds
  from ordered o
)
select l.user_id, l.subject_id, l.session_id, l.seconds from legacy l
union all
select c.user_id, c.subject_id, c.session_id, c.seconds from credited c where c.seconds > 0;
$$;
revoke all on function public.studyflow_counted_intervals(timestamptz,timestamptz) from public, anon, authenticated;

create or replace function public.studyflow_public_leaderboard(
  period_start timestamptz default null, period_end timestamptz default null, row_limit int default 12
) returns table(username text, display_name text, period_seconds bigint, session_count bigint, rank_no bigint, is_me boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  return query with totals as (
    select x.user_id, floor(sum(x.seconds))::bigint as seconds, count(distinct x.session_id)::bigint as sessions
    from public.studyflow_counted_intervals(period_start,period_end) x group by x.user_id
  ), ranked as (
    select p.id,p.username,p.display_name,coalesce(t.seconds,0)::bigint as seconds,
      coalesce(t.sessions,0)::bigint as sessions,
      row_number() over(order by coalesce(t.seconds,0) desc,coalesce(t.sessions,0) desc,p.created_at asc)::bigint as ranking
    from public.profiles p left join totals t on t.user_id=p.id
  )
  select r.username,r.display_name,r.seconds,r.sessions,r.ranking,(r.id=auth.uid()) from ranked r
  order by r.ranking limit greatest(3,least(coalesce(row_limit,12),50));
end; $$;
revoke all on function public.studyflow_public_leaderboard(timestamptz,timestamptz,int) from public;
grant execute on function public.studyflow_public_leaderboard(timestamptz,timestamptz,int) to authenticated;

create or replace function public.studyflow_admin_overview(period_start timestamptz default null, period_end timestamptz default null)
returns table(user_id uuid,username text,display_name text,period_seconds bigint,all_time_seconds bigint,session_count bigint,last_study_at timestamptz,rank_no bigint)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.is_studyflow_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return query with ps as (
    select x.user_id,floor(sum(x.seconds))::bigint as seconds,count(distinct x.session_id)::bigint as sessions
    from public.studyflow_counted_intervals(period_start,period_end) x group by x.user_id
  ), a as (
    select x.user_id,floor(sum(x.seconds))::bigint as seconds,max(s.end_time) as last_study
    from public.studyflow_counted_intervals(null,null) x join public.study_sessions s on s.id=x.session_id
    group by x.user_id
  ), ranked as (
    select p.id,p.username,p.display_name,coalesce(ps.seconds,0)::bigint as period_seconds,
      coalesce(a.seconds,0)::bigint as all_time_seconds,coalesce(ps.sessions,0)::bigint as session_count,
      a.last_study as last_study_at,
      row_number() over(order by coalesce(ps.seconds,0) desc,coalesce(a.seconds,0) desc,p.created_at asc)::bigint as rank_no
    from public.profiles p left join ps on ps.user_id=p.id left join a on a.user_id=p.id
  )
  select r.id,r.username,r.display_name,r.period_seconds,r.all_time_seconds,r.session_count,r.last_study_at,r.rank_no
  from ranked r order by r.rank_no,r.username nulls last;
end; $$;
revoke all on function public.studyflow_admin_overview(timestamptz,timestamptz) from public;
grant execute on function public.studyflow_admin_overview(timestamptz,timestamptz) to authenticated;

create or replace function public.studyflow_admin_user_subjects(target_user uuid,period_start timestamptz default null,period_end timestamptz default null)
returns table(subject_id uuid,subject_name text,study_seconds bigint,session_count bigint,last_studied_at timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if not public.is_studyflow_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  return query
  select x.subject_id,coalesce(sub.name,'Unassigned')::text,floor(sum(x.seconds))::bigint,
    count(distinct x.session_id)::bigint,max(s.end_time)
  from public.studyflow_counted_intervals(period_start,period_end) x
  join public.study_sessions s on s.id=x.session_id
  left join public.subjects sub on sub.id=x.subject_id and sub.user_id=x.user_id
  where x.user_id=target_user group by x.subject_id,sub.name order by sum(x.seconds) desc;
end; $$;
revoke all on function public.studyflow_admin_user_subjects(uuid,timestamptz,timestamptz) from public;
grant execute on function public.studyflow_admin_user_subjects(uuid,timestamptz,timestamptz) to authenticated;

-- Rollback after a separately reviewed backup: restore the previous analytics RPC definitions
-- from migrations 005/007, and restore the previous client. Keep additive columns and stored
-- segments: dropping either would permanently destroy source history. Never delete payout data.
