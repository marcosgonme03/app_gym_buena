-- ============================================================================
-- CLASSES MODULE (SaaS-ready) - Idempotent migration for Supabase
-- Compatible with existing public.users and existing public.classes legacy schema
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) Ensure enum/constraint compatibility
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'fitness_level'
  ) then
    create type fitness_level as enum ('beginner', 'intermediate', 'advanced');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) Upgrade existing classes table (keep legacy columns to avoid breakage)
-- ----------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trainer_id uuid not null references auth.users(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.classes
  add column if not exists title text,
  add column if not exists trainer_user_id uuid,
  add column if not exists slug text,
  add column if not exists cover_image_url text,
  add column if not exists level fitness_level,
  add column if not exists duration_min integer,
  add column if not exists is_active boolean not null default true;

-- Backfill modern fields from legacy ones when null
update public.classes
set
  title = coalesce(title, name),
  trainer_user_id = coalesce(trainer_user_id, trainer_id),
  slug = coalesce(slug, regexp_replace(lower(coalesce(title, name)), '[^a-z0-9]+', '-', 'g')),
  duration_min = coalesce(duration_min, greatest(1, floor(extract(epoch from (end_time - start_time)) / 60)::int))
where title is null
   or trainer_user_id is null
   or slug is null
   or duration_min is null;

alter table public.classes
  alter column trainer_user_id set not null,
  alter column title set not null,
  alter column slug set not null,
  alter column duration_min set not null;

-- FK to auth.users for modern trainer reference
alter table public.classes
  drop constraint if exists classes_trainer_user_id_fkey;

alter table public.classes
  add constraint classes_trainer_user_id_fkey
  foreign key (trainer_user_id) references auth.users(id) on delete restrict;

-- sensible checks
alter table public.classes
  drop constraint if exists classes_capacity_check,
  add constraint classes_capacity_check check (capacity > 0 and capacity <= 200);

alter table public.classes
  drop constraint if exists classes_duration_check,
  add constraint classes_duration_check check (duration_min > 0 and duration_min <= 600);

create index if not exists idx_classes_active on public.classes(is_active);
create index if not exists idx_classes_trainer_user_id on public.classes(trainer_user_id);
create unique index if not exists ux_classes_slug on public.classes(slug);

-- Ensure slug uniqueness after backfill (append short id suffix only if duplicated)
with ranked as (
  select id, slug,
         row_number() over (partition by slug order by created_at asc, id asc) as rn
  from public.classes
)
update public.classes c
set slug = c.slug || '-' || substr(replace(c.id::text, '-', ''), 1, 6)
from ranked r
where c.id = r.id
  and r.rn > 1;

-- ----------------------------------------------------------------------------
-- 3) class_sessions
-- ----------------------------------------------------------------------------
create table if not exists public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity_override integer,
  is_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_sessions_time_check check (ends_at > starts_at),
  constraint class_sessions_capacity_override_check check (capacity_override is null or (capacity_override > 0 and capacity_override <= 200))
);

create index if not exists idx_class_sessions_class_id on public.class_sessions(class_id);
create index if not exists idx_class_sessions_starts_at on public.class_sessions(starts_at);
create index if not exists idx_class_sessions_not_cancelled on public.class_sessions(is_cancelled) where is_cancelled = false;
create unique index if not exists ux_class_sessions_class_starts_at on public.class_sessions(class_id, starts_at);

-- ----------------------------------------------------------------------------
-- 4) class_bookings
-- ----------------------------------------------------------------------------
create table if not exists public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'booked',
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_bookings_status_check check (status in ('booked','cancelled','attended','no_show'))
);

create unique index if not exists ux_class_bookings_user_session
  on public.class_bookings(user_id, session_id);

create index if not exists idx_class_bookings_session_id on public.class_bookings(session_id);
create index if not exists idx_class_bookings_user_id on public.class_bookings(user_id);
create index if not exists idx_class_bookings_status on public.class_bookings(status);

-- ----------------------------------------------------------------------------
-- 5) trigger util
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- classes trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_classes_updated_at'
  ) THEN
    CREATE TRIGGER trg_classes_updated_at
      BEFORE UPDATE ON public.classes
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END $$;

-- class_sessions trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_class_sessions_updated_at'
  ) THEN
    CREATE TRIGGER trg_class_sessions_updated_at
      BEFORE UPDATE ON public.class_sessions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END $$;

-- class_bookings trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_class_bookings_updated_at'
  ) THEN
    CREATE TRIGGER trg_class_bookings_updated_at
      BEFORE UPDATE ON public.class_bookings
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at_timestamp();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6) Role helper functions (SECURITY DEFINER, no recursion in policies)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.user_id = p_uid and u.role = 'admin'
  );
$$;

create or replace function public.is_trainer(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.user_id = p_uid and u.role = 'trainer'
  );
$$;

create or replace function public.is_member(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.user_id = p_uid and u.role = 'member'
  );
$$;

-- ----------------------------------------------------------------------------
-- 7) RPC: book class safely with capacity check and row lock
-- ----------------------------------------------------------------------------
create or replace function public.book_class(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_class_id uuid;
  v_is_cancelled boolean;
  v_capacity integer;
  v_booked_count integer;
  v_booking_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED', 'message', 'Usuario no autenticado');
  end if;

  select s.class_id, s.is_cancelled, coalesce(s.capacity_override, c.capacity)
    into v_class_id, v_is_cancelled, v_capacity
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  where s.id = p_session_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'SESSION_NOT_FOUND', 'message', 'Sesión no encontrada');
  end if;

  if v_is_cancelled then
    return jsonb_build_object('success', false, 'code', 'SESSION_CANCELLED', 'message', 'La sesión está cancelada');
  end if;

  select count(*)::int
    into v_booked_count
  from public.class_bookings b
  where b.session_id = p_session_id
    and b.status in ('booked', 'attended');

  if v_booked_count >= v_capacity then
    return jsonb_build_object('success', false, 'code', 'SESSION_FULL', 'message', 'No hay plazas disponibles');
  end if;

  insert into public.class_bookings (session_id, user_id, status, booked_at, cancelled_at)
  values (p_session_id, v_uid, 'booked', now(), null)
  on conflict (user_id, session_id)
  do update set
    status = 'booked',
    booked_at = now(),
    cancelled_at = null,
    updated_at = now()
  returning id into v_booking_id;

  return jsonb_build_object('success', true, 'code', 'BOOKED', 'booking_id', v_booking_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- 8) RPC: cancel own booking
-- ----------------------------------------------------------------------------
create or replace function public.cancel_class_booking(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_booking_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED', 'message', 'Usuario no autenticado');
  end if;

  update public.class_bookings b
  set status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  where b.user_id = v_uid
    and b.session_id = p_session_id
    and b.status in ('booked', 'attended', 'no_show')
  returning b.id into v_booking_id;

  if v_booking_id is null then
    return jsonb_build_object('success', false, 'code', 'BOOKING_NOT_FOUND', 'message', 'Reserva no encontrada');
  end if;

  return jsonb_build_object('success', true, 'code', 'CANCELLED', 'booking_id', v_booking_id);
end;
$$;

create or replace function public.cancel_booking(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.cancel_class_booking(p_session_id);
$$;

-- ----------------------------------------------------------------------------
-- 9) RPC: trainer/admin attendance mark
-- ----------------------------------------------------------------------------
create or replace function public.mark_class_attendance(
  p_booking_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_allowed boolean := false;
  v_session_id uuid;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED');
  end if;

  if p_status not in ('attended', 'no_show') then
    return jsonb_build_object('success', false, 'code', 'INVALID_STATUS');
  end if;

  select b.session_id
  into v_session_id
  from public.class_bookings b
  where b.id = p_booking_id;

  if v_session_id is null then
    return jsonb_build_object('success', false, 'code', 'BOOKING_NOT_FOUND');
  end if;

  -- admin can always mark
  if public.is_admin(v_uid) then
    v_allowed := true;
  else
    -- trainer only for own class session
    select exists (
      select 1
      from public.class_sessions s
      join public.classes c on c.id = s.class_id
      where s.id = v_session_id
        and c.trainer_user_id = v_uid
    ) into v_allowed;
  end if;

  if not v_allowed then
    return jsonb_build_object('success', false, 'code', 'FORBIDDEN');
  end if;

  update public.class_bookings
  set status = p_status,
      cancelled_at = null,
      updated_at = now()
  where id = p_booking_id;

  return jsonb_build_object('success', true, 'code', 'UPDATED');
end;
$$;

-- ----------------------------------------------------------------------------
-- 10) RLS enable
-- ----------------------------------------------------------------------------
alter table public.classes enable row level security;
alter table public.class_sessions enable row level security;
alter table public.class_bookings enable row level security;

-- ----------------------------------------------------------------------------
-- 11) RLS policies: classes
-- ----------------------------------------------------------------------------
drop policy if exists classes_select_policy on public.classes;
create policy classes_select_policy
on public.classes
for select
to authenticated
using (
  (is_active = true)
  or public.is_admin(auth.uid())
  or trainer_user_id = auth.uid()
);

drop policy if exists classes_insert_policy on public.classes;
create policy classes_insert_policy
on public.classes
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or (public.is_trainer(auth.uid()) and trainer_user_id = auth.uid())
);

drop policy if exists classes_update_policy on public.classes;
create policy classes_update_policy
on public.classes
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or (public.is_trainer(auth.uid()) and trainer_user_id = auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or (public.is_trainer(auth.uid()) and trainer_user_id = auth.uid())
);

drop policy if exists classes_delete_policy on public.classes;
create policy classes_delete_policy
on public.classes
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 12) RLS policies: class_sessions
-- ----------------------------------------------------------------------------
drop policy if exists class_sessions_select_policy on public.class_sessions;
create policy class_sessions_select_policy
on public.class_sessions
for select
to authenticated
using (
  (
    starts_at >= (now() - interval '30 days')
    and is_cancelled = false
    and exists (
      select 1 from public.classes c
      where c.id = class_sessions.class_id
        and c.is_active = true
    )
  )
  or public.is_admin(auth.uid())
  or exists (
    select 1 from public.classes c
    where c.id = class_sessions.class_id
      and c.trainer_user_id = auth.uid()
  )
);

drop policy if exists class_sessions_insert_policy on public.class_sessions;
create policy class_sessions_insert_policy
on public.class_sessions
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.classes c
    where c.id = class_sessions.class_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
);

drop policy if exists class_sessions_update_policy on public.class_sessions;
create policy class_sessions_update_policy
on public.class_sessions
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.classes c
    where c.id = class_sessions.class_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
)
with check (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.classes c
    where c.id = class_sessions.class_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
);

drop policy if exists class_sessions_delete_policy on public.class_sessions;
create policy class_sessions_delete_policy
on public.class_sessions
for delete
to authenticated
using (
  public.is_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 13) RLS policies: class_bookings
-- ----------------------------------------------------------------------------
drop policy if exists class_bookings_select_policy on public.class_bookings;
create policy class_bookings_select_policy
on public.class_bookings
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = class_bookings.session_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
);

drop policy if exists class_bookings_insert_policy on public.class_bookings;
create policy class_bookings_insert_policy
on public.class_bookings
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists class_bookings_update_policy on public.class_bookings;
create policy class_bookings_update_policy
on public.class_bookings
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = class_bookings.session_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
  or exists (
    select 1
    from public.class_sessions s
    join public.classes c on c.id = s.class_id
    where s.id = class_bookings.session_id
      and c.trainer_user_id = auth.uid()
      and public.is_trainer(auth.uid())
  )
);

drop policy if exists class_bookings_delete_policy on public.class_bookings;
create policy class_bookings_delete_policy
on public.class_bookings
for delete
to authenticated
using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

-- ----------------------------------------------------------------------------
-- 14) grants for RPC
-- ----------------------------------------------------------------------------
grant execute on function public.book_class(uuid) to authenticated;
grant execute on function public.cancel_class_booking(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.mark_class_attendance(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 15) Seed catalog classes (idempotent by slug)
-- ----------------------------------------------------------------------------
insert into public.classes (
  title, slug, description, trainer_user_id, level, duration_min, capacity, is_active, cover_image_url,
  name, trainer_id, date, start_time, end_time
)
select
  seed.title,
  seed.slug,
  seed.description,
  trainer.user_id,
  seed.level::fitness_level,
  seed.duration_min,
  seed.capacity,
  true,
  seed.cover_image_url,
  seed.title,
  trainer.user_id,
  current_date,
  time '08:00',
  time '09:00'
from (
  values
    ('Cross Training', 'cross-training', 'Entrenamiento mixto de fuerza y cardio en circuito.', 'intermediate', 50, 18, 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1400&q=80'),
    ('Yoga Flow', 'yoga-flow', 'Sesión fluida enfocada en movilidad, respiración y control postural.', 'beginner', 60, 20, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80'),
    ('Pilates Core', 'pilates-core', 'Trabajo de core, estabilidad y control del movimiento.', 'beginner', 45, 16, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=80'),
    ('Spinning HIIT', 'spinning-hiit', 'Intervalos de alta intensidad sobre bicicleta indoor.', 'advanced', 45, 22, 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1400&q=80'),
    ('Zumba Energy', 'zumba-energy', 'Clase de baile fitness con enfoque cardiovascular y diversión.', 'beginner', 50, 25, 'https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1400&q=80'),
    ('Fuerza Funcional', 'fuerza-funcional', 'Patrones funcionales para mejorar fuerza aplicada y técnica.', 'intermediate', 55, 15, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80')
) as seed(title, slug, description, level, duration_min, capacity, cover_image_url)
cross join lateral (
  select u.user_id
  from public.users u
  where u.role in ('trainer', 'admin')
  order by case when u.role = 'trainer' then 0 else 1 end, u.created_at asc
  limit 1
) trainer
where trainer.user_id is not null
on conflict (slug)
do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  duration_min = excluded.duration_min,
  capacity = excluded.capacity,
  is_active = true,
  cover_image_url = excluded.cover_image_url,
  name = excluded.name,
  trainer_id = excluded.trainer_id,
  trainer_user_id = excluded.trainer_user_id,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 16) Seed upcoming sessions (idempotent)
-- ----------------------------------------------------------------------------
insert into public.class_sessions (
  class_id,
  starts_at,
  ends_at,
  capacity_override,
  is_cancelled
)
select
  c.id as class_id,
  (((current_date + s.day_offset)::timestamp + s.start_time) at time zone 'UTC') as starts_at,
  ((((current_date + s.day_offset)::timestamp + s.start_time) + make_interval(mins => c.duration_min)) at time zone 'UTC') as ends_at,
  null::integer as capacity_override,
  false as is_cancelled
from (
  values
    ('cross-training', 0, time '18:00'),
    ('cross-training', 2, time '18:00'),
    ('cross-training', 4, time '18:00'),
    ('yoga-flow', 1, time '09:00'),
    ('yoga-flow', 3, time '09:00'),
    ('yoga-flow', 5, time '09:00'),
    ('spinning-hiit', 0, time '19:00'),
    ('spinning-hiit', 2, time '19:00'),
    ('spinning-hiit', 4, time '19:00')
) as s(slug, day_offset, start_time)
join public.classes c on c.slug = s.slug
on conflict (class_id, starts_at)
do update set
  ends_at = excluded.ends_at,
  capacity_override = excluded.capacity_override,
  is_cancelled = false,
  updated_at = now();

-- ============================================================================
-- END CLASSES MODULE
-- ============================================================================
