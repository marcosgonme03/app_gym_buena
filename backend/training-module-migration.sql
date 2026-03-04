-- ============================================================================
-- TRAINING MODULE — FULL MIGRATION (idempotente, ejecución segura)
-- Versión: 1.0  |  Módulo: Entrenamientos
-- ============================================================================
-- Ejecutar en Supabase → SQL Editor
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  TABLA routines
--     Biblioteca de rutinas reutilizables por usuario
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.routines (
  id                    uuid         primary key default gen_random_uuid(),
  user_id               uuid         not null references auth.users(id) on delete cascade,
  name                  text         not null,
  category              text         not null default 'general'
                                     check (category in ('fuerza','hipertrofia','cardio','general')),
  description           text         null,
  estimated_duration_min integer     null check (estimated_duration_min > 0),
  created_at            timestamptz  not null default now(),
  updated_at            timestamptz  not null default now()
);

create index if not exists idx_routines_user_id on public.routines(user_id);

alter table public.routines enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routines' and policyname='routines_select_own') then
    create policy routines_select_own on public.routines for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routines' and policyname='routines_insert_own') then
    create policy routines_insert_own on public.routines for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routines' and policyname='routines_update_own') then
    create policy routines_update_own on public.routines for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routines' and policyname='routines_delete_own') then
    create policy routines_delete_own on public.routines for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  TABLA routine_exercises
--     Ejercicios template de cada rutina (no se modifican al ejecutar una sesión)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.routine_exercises (
  id            uuid        primary key default gen_random_uuid(),
  routine_id    uuid        not null references public.routines(id) on delete cascade,
  user_id       uuid        not null references auth.users(id) on delete cascade,
  exercise_name text        not null,
  sets          smallint    not null default 3 check (sets between 1 and 50),
  reps          smallint    not null default 10 check (reps between 1 and 200),
  weight_kg     numeric(6,2) null,
  rest_seconds  smallint    null     check (rest_seconds >= 0),
  notes         text        null,
  order_index   smallint    not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_routine_exercises_routine_id on public.routine_exercises(routine_id);
create index if not exists idx_routine_exercises_user_id    on public.routine_exercises(user_id);

alter table public.routine_exercises enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routine_exercises' and policyname='routine_exercises_select_own') then
    create policy routine_exercises_select_own on public.routine_exercises for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routine_exercises' and policyname='routine_exercises_insert_own') then
    create policy routine_exercises_insert_own on public.routine_exercises for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routine_exercises' and policyname='routine_exercises_update_own') then
    create policy routine_exercises_update_own on public.routine_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='routine_exercises' and policyname='routine_exercises_delete_own') then
    create policy routine_exercises_delete_own on public.routine_exercises for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  TABLA weekly_plans
--     Una fila por día de semana (0=Lun … 6=Dom) con la rutina asignada
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.weekly_plans (
  id          uuid       primary key default gen_random_uuid(),
  user_id     uuid       not null references auth.users(id) on delete cascade,
  day_of_week smallint   not null check (day_of_week between 0 and 6),
  routine_id  uuid       null     references public.routines(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Unique: un plan por usuario-día
do $$ begin
  if not exists (select 1 from pg_constraint where conname='weekly_plans_user_day_uq') then
    alter table public.weekly_plans
      add constraint weekly_plans_user_day_uq unique (user_id, day_of_week);
  end if;
end $$;

create index if not exists idx_weekly_plans_user_id on public.weekly_plans(user_id);

alter table public.weekly_plans enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_plans' and policyname='weekly_plans_select_own') then
    create policy weekly_plans_select_own on public.weekly_plans for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_plans' and policyname='weekly_plans_insert_own') then
    create policy weekly_plans_insert_own on public.weekly_plans for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_plans' and policyname='weekly_plans_update_own') then
    create policy weekly_plans_update_own on public.weekly_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_plans' and policyname='weekly_plans_delete_own') then
    create policy weekly_plans_delete_own on public.weekly_plans for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  COLUMNAS ADICIONALES en workout_sessions   (idempotente via IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='session_name') then
    alter table public.workout_sessions add column session_name text null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='category') then
    alter table public.workout_sessions add column category text null
      check (category in ('fuerza','hipertrofia','cardio','general'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='muscle_group') then
    alter table public.workout_sessions add column muscle_group text null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='routine_id') then
    alter table public.workout_sessions add column routine_id uuid null references public.routines(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='total_weight_kg') then
    alter table public.workout_sessions add column total_weight_kg numeric(10,2) null default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='workout_sessions' and column_name='exercise_count') then
    alter table public.workout_sessions add column exercise_count integer null default 0;
  end if;
end $$;

-- Permitir múltiples sesiones en el mismo día (quitar unique si existe)
do $$ begin
  if exists (select 1 from pg_constraint where conname='workout_sessions_unique_user_date') then
    alter table public.workout_sessions drop constraint workout_sessions_unique_user_date;
  end if;
end $$;

-- Actualizar constraint status para incluir 'planned'
do $$ begin
  if exists (select 1 from pg_constraint where conname='workout_sessions_status_check') then
    alter table public.workout_sessions drop constraint workout_sessions_status_check;
  end if;
  alter table public.workout_sessions
    add constraint workout_sessions_status_check
    check (status in ('planned', 'not_started', 'in_progress', 'completed', 'cancelled'));
end $$;

create index if not exists idx_workout_sessions_routine_id
  on public.workout_sessions(routine_id) where routine_id is not null;

create index if not exists idx_workout_sessions_date_user
  on public.workout_sessions(user_id, workout_date);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5.  TABLA session_exercises
--     Ejercicios ejecutados DENTRO de una sesión activa (snapshot de routine_exercises)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.session_exercises (
  id             uuid         primary key default gen_random_uuid(),
  session_id     uuid         not null references public.workout_sessions(id) on delete cascade,
  user_id        uuid         not null references auth.users(id) on delete cascade,
  exercise_name  text         not null,
  sets_total     smallint     not null default 3,
  reps_target    smallint     not null default 10,
  weight_kg      numeric(6,2) null,
  sets_completed smallint     null default 0,
  notes          text         null,
  order_index    smallint     not null default 0,
  completed_at   timestamptz  null,
  created_at     timestamptz  not null default now()
);

create index if not exists idx_session_exercises_session_id on public.session_exercises(session_id);
create index if not exists idx_session_exercises_user_id    on public.session_exercises(user_id);

alter table public.session_exercises enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='session_exercises' and policyname='session_exercises_select_own') then
    create policy session_exercises_select_own on public.session_exercises for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='session_exercises' and policyname='session_exercises_insert_own') then
    create policy session_exercises_insert_own on public.session_exercises for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='session_exercises' and policyname='session_exercises_update_own') then
    create policy session_exercises_update_own on public.session_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='session_exercises' and policyname='session_exercises_delete_own') then
    create policy session_exercises_delete_own on public.session_exercises for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6.  VISTA v_workout_history
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.v_workout_history as
select
  ws.id,
  ws.user_id,
  ws.workout_date,
  coalesce(ws.session_name, r.name, 'Entrenamiento libre') as session_name,
  coalesce(ws.category, r.category, 'general')             as category,
  ws.status,
  ws.actual_duration_min,
  ws.total_weight_kg,
  coalesce(ws.exercise_count, 0)                           as exercise_count,
  ws.routine_id,
  ws.completed_at,
  ws.started_at,
  ws.notes
from public.workout_sessions ws
left join public.routines r on r.id = ws.routine_id;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7.  RPC get_workout_stats (p_user_id)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.get_workout_stats(p_user_id uuid)
returns table(
  total_sessions     bigint,
  total_weight_kg    numeric,
  this_month_sessions bigint,
  this_week_sessions  bigint,
  avg_duration_min    numeric
)
language sql
security definer
as $$
  select
    count(*)                                                              as total_sessions,
    coalesce(sum(total_weight_kg), 0)                                     as total_weight_kg,
    count(*) filter (
      where date_trunc('month', workout_date) = date_trunc('month', current_date)
    )                                                                     as this_month_sessions,
    count(*) filter (
      where workout_date >= date_trunc('week', current_date)
    )                                                                     as this_week_sessions,
    round(avg(actual_duration_min) filter (where actual_duration_min > 0), 1) as avg_duration_min
  from public.workout_sessions
  where user_id = p_user_id
    and status = 'completed';
$$;

grant execute on function public.get_workout_stats(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8.  RPC create_session_from_today_plan (p_user_id)
--     Crea automáticamente sesión desde weekly_plans si hay rutina asignada hoy
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_session_from_today_plan(p_user_id uuid)
returns public.workout_sessions
language plpgsql
security definer
as $$
declare
  v_day_of_week smallint;
  v_weekly_plan public.weekly_plans%rowtype;
  v_routine     public.routines%rowtype;
  v_session     public.workout_sessions%rowtype;
  v_today       date := current_date;
begin
  -- Día de semana: Supabase EXTRACT returns 0=Sun…6=Sat; convertimos a 0=Lun…6=Dom
  v_day_of_week := ((extract(dow from v_today)::smallint + 6) % 7);

  -- Buscar plan para hoy
  select * into v_weekly_plan
  from public.weekly_plans
  where user_id = p_user_id and day_of_week = v_day_of_week
  limit 1;

  if not found then
    return null; -- sin rutina para hoy
  end if;

  -- Obtener rutina
  select * into v_routine
  from public.routines
  where id = v_weekly_plan.routine_id and user_id = p_user_id
  limit 1;

  if not found then
    return null;
  end if;

  -- Insertar sesión (evitar duplicado: si ya existe planned/in_progress hoy, devolverla)
  select * into v_session
  from public.workout_sessions
  where user_id = p_user_id
    and workout_date = v_today
    and status in ('planned','not_started','in_progress')
  order by created_at desc
  limit 1;

  if found then
    return v_session;
  end if;

  insert into public.workout_sessions (
    user_id, workout_date, routine_id, session_name, category,
    estimated_duration_min, status
  )
  values (
    p_user_id, v_today, v_routine.id, v_routine.name, v_routine.category,
    v_routine.estimated_duration_min, 'planned'
  )
  returning * into v_session;

  -- Copiar ejercicios de la rutina como session_exercises
  insert into public.session_exercises
    (session_id, user_id, exercise_name, sets_total, reps_target, weight_kg, rest_seconds, notes, order_index)
  select
    v_session.id, p_user_id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, order_index
  from public.routine_exercises
  where routine_id = v_routine.id
  order by order_index;

  return v_session;
end;
$$;

grant execute on function public.create_session_from_today_plan(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9.  RPC create_session_with_routine (p_user_id, p_routine_id, p_date)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_session_with_routine(
  p_user_id   uuid,
  p_routine_id uuid,
  p_date      date default current_date
)
returns public.workout_sessions
language plpgsql
security definer
as $$
declare
  v_routine public.routines%rowtype;
  v_session public.workout_sessions%rowtype;
begin
  select * into v_routine
  from public.routines
  where id = p_routine_id and user_id = p_user_id;

  if not found then
    raise exception 'Routine not found';
  end if;

  -- Avoid duplicate planned/in_progress sessions for same date+routine
  select * into v_session
  from public.workout_sessions
  where user_id = p_user_id
    and workout_date = p_date
    and routine_id   = p_routine_id
    and status in ('planned','not_started','in_progress')
  order by created_at desc limit 1;

  if found then
    return v_session;
  end if;

  insert into public.workout_sessions (
    user_id, workout_date, routine_id, session_name, category,
    estimated_duration_min, status
  )
  values (
    p_user_id, p_date, v_routine.id, v_routine.name, v_routine.category,
    v_routine.estimated_duration_min, 'planned'
  )
  returning * into v_session;

  insert into public.session_exercises
    (session_id, user_id, exercise_name, sets_total, reps_target, weight_kg, rest_seconds, notes, order_index)
  select v_session.id, p_user_id, exercise_name, sets, reps, weight_kg, rest_seconds, notes, order_index
  from public.routine_exercises
  where routine_id = p_routine_id
  order by order_index;

  return v_session;
end;
$$;

grant execute on function public.create_session_with_routine(uuid, uuid, date) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Trigger updated_at para nuevas tablas
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at_timestamp()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='trg_routines_updated_at') then
    create trigger trg_routines_updated_at
      before update on public.routines
      for each row execute function public.set_updated_at_timestamp();
  end if;
  if not exists (select 1 from pg_trigger where tgname='trg_weekly_plans_updated_at') then
    create trigger trg_weekly_plans_updated_at
      before update on public.weekly_plans
      for each row execute function public.set_updated_at_timestamp();
  end if;
end $$;
