-- ============================================================================
-- Public class presence helpers (safe with strict RLS on class_bookings)
-- ============================================================================

-- Session booking counters for a batch of sessions
create or replace function public.get_sessions_booking_counts(p_session_ids uuid[])
returns table(session_id uuid, booked_count integer)
language sql
security definer
set search_path = public
as $$
  select
    b.session_id,
    count(b.id)::int as booked_count
  from public.class_bookings b
  where b.session_id = any(p_session_ids)
    and b.status = 'confirmed'
  group by b.session_id;
$$;

-- Public participants list for one session (limited fields)
create or replace function public.get_class_session_participants(
  p_session_id uuid,
  p_limit integer default 12
)
returns table(
  user_id uuid,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select
    u.user_id,
    trim(concat(coalesce(u.name, ''), ' ', coalesce(u.last_name, ''))) as full_name,
    u.avatar_url
  from public.class_bookings b
  join public.users u on u.user_id = b.user_id
  where b.session_id = p_session_id
    and b.status = 'confirmed'
  order by b.booked_at asc
  limit greatest(1, coalesce(p_limit, 12));
$$;

grant execute on function public.get_sessions_booking_counts(uuid[]) to authenticated;
grant execute on function public.get_class_session_participants(uuid, integer) to authenticated;
