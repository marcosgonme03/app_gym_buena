-- ============================================================================
-- Seed classes + upcoming sessions (idempotent)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Seed base classes (if not present)
-- ----------------------------------------------------------------------------
insert into public.classes (
  title,
  slug,
  description,
  level,
  duration_min,
  capacity,
  cover_image_url,
  trainer_user_id,
  is_active,
  name,
  trainer_id,
  date,
  start_time,
  end_time
)
select
  seed.title,
  seed.slug,
  seed.description,
  seed.level::fitness_level,
  seed.duration_min,
  seed.capacity,
  seed.cover_image_url,
  trainer.user_id,
  true,
  seed.title,
  trainer.user_id,
  current_date,
  time '08:00',
  time '09:00'
from (
  values
    ('Cross Training', 'cross-training', 'Circuito de fuerza y cardio para mejorar condición general.', 'intermediate', 50, 16, 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1400&q=80'),
    ('Yoga Flow', 'yoga-flow', 'Movilidad, respiración y control postural en sesión guiada.', 'beginner', 60, 20, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80'),
    ('Pilates Core', 'pilates-core', 'Fortalecimiento de core y estabilidad global.', 'beginner', 45, 14, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=80'),
    ('Spinning HIIT', 'spinning-hiit', 'Intervalos de alta intensidad en bicicleta indoor.', 'advanced', 45, 22, 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1400&q=80'),
    ('Fuerza Funcional', 'fuerza-funcional', 'Trabajo funcional orientado a fuerza aplicada.', 'intermediate', 55, 15, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80')
) as seed(title, slug, description, level, duration_min, capacity, cover_image_url)
cross join lateral (
  select u.user_id
  from public.users u
  where u.role in ('trainer', 'admin')
  order by case when u.role = 'trainer' then 0 else 1 end, u.created_at
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
  cover_image_url = excluded.cover_image_url,
  trainer_user_id = excluded.trainer_user_id,
  trainer_id = excluded.trainer_id,
  is_active = true,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 2) Seed upcoming sessions by known slugs
-- ----------------------------------------------------------------------------
insert into public.class_sessions (
  class_id,
  starts_at,
  ends_at,
  capacity_override,
  is_cancelled
)
select
  c.id,
  ((current_date + offs.day_offset)::timestamp + offs.start_time) at time zone 'UTC' as starts_at,
  (((current_date + offs.day_offset)::timestamp + offs.start_time) + make_interval(mins => c.duration_min)) at time zone 'UTC' as ends_at,
  null::integer,
  false
from public.classes c
join (
  values
    ('cross-training', 0, time '18:30'),
    ('cross-training', 2, time '18:30'),
    ('cross-training', 4, time '18:30'),
    ('yoga-flow', 1, time '09:00'),
    ('yoga-flow', 3, time '09:00'),
    ('pilates-core', 2, time '10:30'),
    ('pilates-core', 5, time '10:30'),
    ('spinning-hiit', 0, time '19:30'),
    ('spinning-hiit', 2, time '19:30'),
    ('fuerza-funcional', 1, time '20:00'),
    ('fuerza-funcional', 4, time '20:00')
) offs(slug, day_offset, start_time)
  on c.slug = offs.slug
where c.is_active = true
on conflict (class_id, starts_at)
do update set
  ends_at = excluded.ends_at,
  capacity_override = excluded.capacity_override,
  is_cancelled = false,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 3) Fallback seed for any active class without future sessions
-- ----------------------------------------------------------------------------
insert into public.class_sessions (
  class_id,
  starts_at,
  ends_at,
  capacity_override,
  is_cancelled
)
select
  c.id,
  ((current_date + gs.day_offset)::timestamp + time '18:00') at time zone 'UTC' as starts_at,
  (((current_date + gs.day_offset)::timestamp + time '18:00') + make_interval(mins => c.duration_min)) at time zone 'UTC' as ends_at,
  null::integer,
  false
from public.classes c
cross join (values (1), (3), (6)) as gs(day_offset)
where c.is_active = true
  and not exists (
    select 1
    from public.class_sessions s
    where s.class_id = c.id
      and s.starts_at >= now()
  )
on conflict (class_id, starts_at)
do update set
  ends_at = excluded.ends_at,
  capacity_override = excluded.capacity_override,
  is_cancelled = false,
  updated_at = now();
