-- ============================================================================
-- Classes Bookings Module (RLS + Atomic RPC)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- class_bookings table
-- ----------------------------------------------------------------------------
create table if not exists public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.class_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'confirmed',
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.class_bookings
  add column if not exists session_id uuid,
  add column if not exists user_id uuid,
  add column if not exists status text,
  add column if not exists booked_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.class_bookings
set status = case
  when lower(status) = 'booked' then 'confirmed'
  when lower(status) = 'cancelled' then 'cancelled'
  when lower(status) = 'attended' then 'confirmed'
  else status
end
where status is not null;

alter table public.class_bookings
  alter column status set default 'confirmed';

alter table public.class_bookings
  drop constraint if exists class_bookings_status_check,
  add constraint class_bookings_status_check
    check (status in ('confirmed', 'cancelled'));

create unique index if not exists ux_class_bookings_session_user
  on public.class_bookings(session_id, user_id);

create index if not exists idx_class_bookings_user_id
  on public.class_bookings(user_id);

create index if not exists idx_class_bookings_session_id
  on public.class_bookings(session_id);

create index if not exists idx_class_sessions_starts_at
  on public.class_sessions(starts_at);

create unique index if not exists ux_class_sessions_class_starts_at
  on public.class_sessions(class_id, starts_at);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at_timestamp_generic()
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
  if not exists (select 1 from pg_trigger where tgname = 'trg_class_bookings_updated_at') then
    create trigger trg_class_bookings_updated_at
      before update on public.class_bookings
      for each row
      execute function public.set_updated_at_timestamp_generic();
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- RLS policies
-- ----------------------------------------------------------------------------
alter table public.class_bookings enable row level security;
alter table public.class_sessions enable row level security;

drop policy if exists class_bookings_select_own on public.class_bookings;
create policy class_bookings_select_own
on public.class_bookings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists class_bookings_insert_own on public.class_bookings;
create policy class_bookings_insert_own
on public.class_bookings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists class_bookings_update_own on public.class_bookings;
create policy class_bookings_update_own
on public.class_bookings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists class_bookings_delete_own on public.class_bookings;
create policy class_bookings_delete_own
on public.class_bookings
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists class_sessions_select_authenticated on public.class_sessions;
create policy class_sessions_select_authenticated
on public.class_sessions
for select
to authenticated
using (true);

-- ----------------------------------------------------------------------------
-- RPC: booking counts for sessions in one class (optimized counters)
-- ----------------------------------------------------------------------------
create or replace function public.get_class_session_booking_counts(p_class_id uuid)
returns table(session_id uuid, booked_count integer)
language sql
security definer
set search_path = public
as $$
  select
    s.id as session_id,
    count(b.id)::int as booked_count
  from public.class_sessions s
  left join public.class_bookings b
    on b.session_id = s.id
   and b.status = 'confirmed'
  where s.class_id = p_class_id
  group by s.id;
$$;

-- ----------------------------------------------------------------------------
-- RPC: reserve atomically (FOR UPDATE lock + capacity check)
-- ----------------------------------------------------------------------------
create or replace function public.book_class_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_capacity integer;
  v_starts_at timestamptz;
  v_is_cancelled boolean;
  v_current_count integer;
  v_booking_id uuid;
  v_existing_status text;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select coalesce(s.capacity_override, c.capacity), s.starts_at, s.is_cancelled
    into v_capacity, v_starts_at, v_is_cancelled
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  where s.id = p_session_id
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if v_is_cancelled then
    raise exception 'SESSION_CANCELLED';
  end if;

  if v_starts_at <= now() then
    raise exception 'SESSION_PAST';
  end if;

  select status
    into v_existing_status
  from public.class_bookings
  where session_id = p_session_id
    and user_id = v_uid
  for update;

  if found and v_existing_status = 'confirmed' then
    return jsonb_build_object(
      'success', true,
      'code', 'ALREADY_CONFIRMED',
      'message', 'Ya tenías esta sesión reservada.'
    );
  end if;

  select count(*)::int
    into v_current_count
  from public.class_bookings
  where session_id = p_session_id
    and status = 'confirmed';

  if v_current_count >= v_capacity then
    raise exception 'FULL';
  end if;

  insert into public.class_bookings (session_id, user_id, status, booked_at, cancelled_at)
  values (p_session_id, v_uid, 'confirmed', now(), null)
  on conflict (session_id, user_id)
  do update set
    status = 'confirmed',
    booked_at = now(),
    cancelled_at = null,
    updated_at = now()
  returning id into v_booking_id;

  return jsonb_build_object(
    'success', true,
    'code', 'BOOKED',
    'booking_id', v_booking_id
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- RPC: cancel booking by session
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
    raise exception 'UNAUTHENTICATED';
  end if;

  update public.class_bookings
  set status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  where session_id = p_session_id
    and user_id = v_uid
    and status = 'confirmed'
  returning id into v_booking_id;

  if v_booking_id is null then
    return jsonb_build_object(
      'success', true,
      'code', 'ALREADY_CANCELLED',
      'message', 'No había reserva activa para cancelar.'
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'code', 'CANCELLED',
    'booking_id', v_booking_id
  );
end;
$$;

grant execute on function public.get_class_session_booking_counts(uuid) to authenticated;
grant execute on function public.book_class_session(uuid) to authenticated;
grant execute on function public.cancel_class_booking(uuid) to authenticated;
