-- StudyFlow v13.4 — privacy-limited leaderboard for all authenticated users.
-- Exposes only rank, username/display name and aggregate study totals.
-- It does NOT expose email, private notes, subjects, session timestamps or passwords.

create or replace function public.studyflow_public_leaderboard(
  period_start timestamptz default null,
  period_end timestamptz default null,
  row_limit int default 12
)
returns table(
  username text,
  display_name text,
  period_seconds bigint,
  session_count bigint,
  rank_no bigint,
  is_me boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  with totals as (
    select s.user_id,
           coalesce(sum(s.study_seconds),0)::bigint as seconds,
           count(*)::bigint as sessions
    from public.study_sessions s
    where s.deleted_at is null
      and (period_start is null or s.end_time >= period_start)
      and (period_end is null or s.end_time < period_end)
    group by s.user_id
  ), ranked as (
    select p.id,
           p.username,
           p.display_name,
           coalesce(t.seconds,0)::bigint as seconds,
           coalesce(t.sessions,0)::bigint as sessions,
           row_number() over(
             order by coalesce(t.seconds,0) desc,
                      coalesce(t.sessions,0) desc,
                      p.created_at asc
           )::bigint as ranking
    from public.profiles p
    left join totals t on t.user_id = p.id
  )
  select r.username,
         r.display_name,
         r.seconds,
         r.sessions,
         r.ranking,
         (r.id = auth.uid())
  from ranked r
  order by r.ranking
  limit greatest(3, least(coalesce(row_limit,12),50));
end;
$$;

revoke all on function public.studyflow_public_leaderboard(timestamptz,timestamptz,int) from public;
grant execute on function public.studyflow_public_leaderboard(timestamptz,timestamptz,int) to authenticated;
