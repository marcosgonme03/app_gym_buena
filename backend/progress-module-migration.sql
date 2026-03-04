-- ============================================================================
-- PROGRESS MODULE — Backend views, RPCs & triggers
-- Run this AFTER training-module-migration.sql
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  Extend get_workout_stats ─ add months_active
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_workout_stats(p_user_id uuid)
returns table (
  total_sessions      bigint,
  total_weight_kg     numeric,
  this_month_sessions bigint,
  this_week_sessions  bigint,
  avg_duration_min    numeric,
  months_active       bigint
)
language sql
security definer
as $$
  select
    count(*)                                                                                     as total_sessions,
    coalesce(sum(total_weight_kg), 0)                                                            as total_weight_kg,
    count(*) filter (
      where date_trunc('month', workout_date::timestamptz) = date_trunc('month', now())
    )                                                                                            as this_month_sessions,
    count(*) filter (
      where date_trunc('week', workout_date::timestamptz)  = date_trunc('week',  now())
    )                                                                                            as this_week_sessions,
    round(avg(actual_duration_min), 0)                                                           as avg_duration_min,
    count(distinct date_trunc('month', workout_date::timestamptz))                               as months_active
  from public.workout_sessions
  where user_id = p_user_id
    and status  = 'completed';
$$;

grant execute on function public.get_workout_stats(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  v_personal_records ─ max weight per exercise per user
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.v_personal_records as
with ranked as (
  select
    se.user_id,
    se.exercise_name,
    se.weight_kg,
    se.session_id,
    ws.workout_date                                                                              as last_date,
    count(*) over (partition by se.user_id, se.exercise_name)                                   as total_exercises,
    rank()   over (
      partition by se.user_id, se.exercise_name
      order by se.weight_kg desc, ws.workout_date desc
    )                                                                                            as rn
  from public.session_exercises   se
  join public.workout_sessions    ws  on ws.id = se.session_id
  where se.weight_kg > 0
    and ws.status = 'completed'
)
select
  user_id,
  exercise_name,
  weight_kg       as max_weight_kg,
  total_exercises,
  last_date,
  session_id
from ranked
where rn = 1;

grant select on public.v_personal_records to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  v_most_frequent_exercise ─ all exercises ranked by frequency per user
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.v_most_frequent_exercise as
select
  se.user_id,
  se.exercise_name,
  count(*) as total_times
from public.session_exercises   se
join public.workout_sessions    ws  on ws.id = se.session_id
where ws.status = 'completed'
group by se.user_id, se.exercise_name;

grant select on public.v_most_frequent_exercise to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  get_workout_evolution ─ weekly series with empty slots (last N weeks)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_workout_evolution(
  p_user_id uuid,
  p_weeks   int default 12
)
returns table (
  week_start      date,
  total_weight_kg numeric,
  session_count   bigint
)
language sql
security definer
as $$
  with weeks as (
    select generate_series(
      (date_trunc('week', now()) - ((p_weeks - 1) * interval '1 week'))::date,
      date_trunc('week', now())::date,
      '1 week'
    )::date as week_start
  ),
  agg as (
    select
      date_trunc('week', workout_date::timestamptz)::date  as week_start,
      coalesce(sum(total_weight_kg), 0)                    as total_weight_kg,
      count(*)                                             as session_count
    from public.workout_sessions
    where user_id = p_user_id
      and status  = 'completed'
    group by 1
  )
  select
    w.week_start,
    coalesce(a.total_weight_kg, 0) as total_weight_kg,
    coalesce(a.session_count,   0) as session_count
  from       weeks w
  left join  agg   a  on a.week_start = w.week_start
  order by   w.week_start;
$$;

grant execute on function public.get_workout_evolution(uuid, int) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5.  Trigger: auto-recalculate total_weight_kg + exercise_count on
--     workout_sessions whenever session_exercises rows change.
--
--     Formula mirrors what the frontend computed:
--       total_weight_kg = SUM(weight_kg * sets_completed * reps_target)
--       exercise_count  = COUNT(*) of all exercises in session
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.refresh_session_metrics()
returns trigger
language plpgsql
security definer
as $$
declare
  v_session_id uuid;
begin
  -- For DELETE the new row is NULL, use old
  v_session_id := coalesce(new.session_id, old.session_id);

  update public.workout_sessions
  set
    total_weight_kg = (
      select coalesce(
        sum(
          coalesce(weight_kg,       0) *
          coalesce(sets_completed,  0) *
          coalesce(reps_target,     0)
        ), 0
      )
      from public.session_exercises
      where session_id = v_session_id
    ),
    exercise_count = (
      select count(*)
      from public.session_exercises
      where session_id = v_session_id
    )
  where id = v_session_id;

  return coalesce(new, old);
end;
$$;

-- Create trigger only if it does not exist yet
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_session_exercises_metrics'
  ) then
    create trigger trg_session_exercises_metrics
      after insert or update or delete
      on public.session_exercises
      for each row
      execute function public.refresh_session_metrics();
  end if;
end $$;
