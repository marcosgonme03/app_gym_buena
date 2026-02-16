-- ============================================================================
-- FASE DASHBOARD FUNCIONAL: TABLA workout_sessions (idempotente)
-- Reutiliza tablas existentes:
-- - weekly_workout_plans
-- - weekly_workout_sessions
-- - weekly_workout_exercises
-- - workout_logs
-- ============================================================================

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  plan_session_id uuid null,
  status text not null default 'not_started',
  started_at timestamptz null,
  completed_at timestamptz null,
  estimated_duration_min integer null,
  actual_duration_min integer null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints seguras (sin fallar si ya existen)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_sessions_status_check'
  ) then
    alter table public.workout_sessions
      add constraint workout_sessions_status_check
      check (status in ('not_started', 'in_progress', 'completed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_sessions_unique_user_date'
  ) then
    alter table public.workout_sessions
      add constraint workout_sessions_unique_user_date
      unique (user_id, workout_date);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_sessions_duration_check'
  ) then
    alter table public.workout_sessions
      add constraint workout_sessions_duration_check
      check (
        (estimated_duration_min is null or estimated_duration_min >= 0)
        and (actual_duration_min is null or actual_duration_min >= 0)
      );
  end if;
end $$;

-- FK opcional a weekly_workout_sessions (solo si existe esa tabla)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'weekly_workout_sessions'
  ) and not exists (
    select 1 from pg_constraint where conname = 'workout_sessions_plan_session_id_fkey'
  ) then
    alter table public.workout_sessions
      add constraint workout_sessions_plan_session_id_fkey
      foreign key (plan_session_id)
      references public.weekly_workout_sessions(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_workout_sessions_user_id
  on public.workout_sessions(user_id);

create index if not exists idx_workout_sessions_user_date
  on public.workout_sessions(user_id, workout_date desc);

create index if not exists idx_workout_sessions_plan_session_id
  on public.workout_sessions(plan_session_id)
  where plan_session_id is not null;

alter table public.workout_sessions enable row level security;

-- Políticas RLS (sin recursión)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_sessions'
      and policyname = 'workout_sessions_select_own'
  ) then
    create policy workout_sessions_select_own
      on public.workout_sessions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_sessions'
      and policyname = 'workout_sessions_insert_own'
  ) then
    create policy workout_sessions_insert_own
      on public.workout_sessions
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_sessions'
      and policyname = 'workout_sessions_update_own'
  ) then
    create policy workout_sessions_update_own
      on public.workout_sessions
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workout_sessions'
      and policyname = 'workout_sessions_delete_own'
  ) then
    create policy workout_sessions_delete_own
      on public.workout_sessions
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Trigger updated_at (si no existe)
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_workout_sessions_updated_at'
  ) then
    create trigger trg_workout_sessions_updated_at
      before update on public.workout_sessions
      for each row
      execute function public.set_updated_at_timestamp();
  end if;
end $$;
