-- ============================================================================
-- NUTRITION MODULE — Tables, Views, RPCs & RLS policies
-- Run this in the Supabase SQL editor.
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  nutrition_entries — one row per food item per meal per day
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.nutrition_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null default current_date,
  meal_type   text not null check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack')),
  food_name   text not null,
  grams       numeric(8,2) not null default 100,
  calories    numeric(8,2) not null default 0,
  protein_g   numeric(8,2) not null default 0,
  carbs_g     numeric(8,2) not null default 0,
  fat_g       numeric(8,2) not null default 0,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists nutrition_entries_user_date_idx
  on public.nutrition_entries (user_id, entry_date desc);

-- RLS
alter table public.nutrition_entries enable row level security;

drop policy if exists "Users manage own nutrition_entries" on public.nutrition_entries;
create policy "Users manage own nutrition_entries"
  on public.nutrition_entries
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  v_daily_nutrition_summary
--     One row per (user_id, entry_date, meal_type) with aggregated macros
--     + a daily total row (meal_type = 'total') per user+date.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.v_daily_nutrition_summary as
-- Per–meal aggregates
select
  user_id,
  entry_date,
  meal_type,
  round(sum(calories), 1)  as total_calories,
  round(sum(protein_g), 1) as total_protein_g,
  round(sum(carbs_g),   1) as total_carbs_g,
  round(sum(fat_g),     1) as total_fat_g,
  count(*)::int            as item_count
from public.nutrition_entries
group by user_id, entry_date, meal_type;

grant select on public.v_daily_nutrition_summary to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  get_nutrition_stats — averages over the last 30 days with entries
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_nutrition_stats(p_user_id uuid)
returns table (
  avg_calories  numeric,
  avg_protein_g numeric,
  avg_carbs_g   numeric,
  avg_fat_g     numeric,
  days_logged   bigint
)
language sql
security definer
as $$
  with daily as (
    select
      entry_date,
      sum(calories)  as day_calories,
      sum(protein_g) as day_protein_g,
      sum(carbs_g)   as day_carbs_g,
      sum(fat_g)     as day_fat_g
    from public.nutrition_entries
    where user_id   = p_user_id
      and entry_date >= current_date - interval '30 days'
    group by entry_date
  )
  select
    round(avg(day_calories),  1) as avg_calories,
    round(avg(day_protein_g), 1) as avg_protein_g,
    round(avg(day_carbs_g),   1) as avg_carbs_g,
    round(avg(day_fat_g),     1) as avg_fat_g,
    count(*)                     as days_logged
  from daily;
$$;

grant execute on function public.get_nutrition_stats(uuid) to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4.  get_nutrition_evolution — daily totals for the last 30 days
--     Returns a row for every calendar day even with no data (0 values).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_nutrition_evolution(
  p_user_id uuid,
  p_days    int default 30
)
returns table (
  entry_date     date,
  total_calories numeric,
  total_protein_g numeric,
  total_carbs_g   numeric,
  total_fat_g     numeric
)
language sql
security definer
as $$
  with days as (
    select generate_series(
      current_date - ((p_days - 1) * interval '1 day'),
      current_date,
      '1 day'
    )::date as entry_date
  ),
  agg as (
    select
      entry_date,
      round(sum(calories),  1) as total_calories,
      round(sum(protein_g), 1) as total_protein_g,
      round(sum(carbs_g),   1) as total_carbs_g,
      round(sum(fat_g),     1) as total_fat_g
    from public.nutrition_entries
    where user_id = p_user_id
      and entry_date >= current_date - ((p_days - 1) * interval '1 day')
    group by entry_date
  )
  select
    d.entry_date,
    coalesce(a.total_calories,   0) as total_calories,
    coalesce(a.total_protein_g,  0) as total_protein_g,
    coalesce(a.total_carbs_g,    0) as total_carbs_g,
    coalesce(a.total_fat_g,      0) as total_fat_g
  from       days d
  left join  agg  a using (entry_date)
  order by   d.entry_date;
$$;

grant execute on function public.get_nutrition_evolution(uuid, int) to authenticated;
