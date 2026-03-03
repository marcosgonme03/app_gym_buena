-- ============================================================================
-- Add 4 new catalog classes + 2 upcoming sessions each (idempotent)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Seed new classes
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
    ('Boxeo Fitness', 'boxeo-fitness', 'Entrenamiento técnico y cardiovascular inspirado en boxeo funcional.', 'intermediate', 50, 18, 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80'),
    ('Body Pump', 'body-pump', 'Trabajo global con barras y cargas moderadas para mejorar fuerza y resistencia.', 'beginner', 55, 20, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1400&q=80'),
    ('TRX Suspension', 'trx-suspension', 'Sesión en suspensión para estabilidad, fuerza de core y control corporal.', 'advanced', 45, 14, 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1400&q=80'),
    ('Mobility & Stretch', 'mobility-stretch', 'Bloque de movilidad articular y estiramientos guiados para recuperación.', 'beginner', 40, 22, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80')
) as seed(title, slug, description, level, duration_min, capacity, cover_image_url)
cross join lateral (
  select u.user_id
  from public.users u
  where u.role in ('trainer', 'admin')
  order by case when lower(coalesce(u.name, '')) = 'nuevo' then 0 else 1 end,
           case when u.role = 'trainer' then 0 else 1 end,
           u.created_at
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
-- 2) Seed 2 upcoming sessions for each new class
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
    ('boxeo-fitness', 1, time '19:00'),
    ('boxeo-fitness', 3, time '11:30'),
    ('body-pump', 2, time '18:30'),
    ('body-pump', 5, time '10:00'),
    ('trx-suspension', 1, time '20:00'),
    ('trx-suspension', 4, time '12:00'),
    ('mobility-stretch', 2, time '09:30'),
    ('mobility-stretch', 6, time '17:30')
) offs(slug, day_offset, start_time)
  on c.slug = offs.slug
where c.is_active = true
on conflict (class_id, starts_at)
do update set
  ends_at = excluded.ends_at,
  capacity_override = excluded.capacity_override,
  is_cancelled = false,
  updated_at = now();
