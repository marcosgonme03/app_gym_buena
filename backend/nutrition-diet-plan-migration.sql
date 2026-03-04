-- ============================================================================
-- NUTRITION DIET PLAN — Weekly meal plan tables & helpers
-- Run AFTER nutrition-module-migration.sql
-- ============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  diet_plan_items — recurring weekly plan (one row per food per meal/day)
--     day_of_week: 0=Lunes … 6=Domingo (ISO Monday = 0)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.diet_plan_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6),
  meal_type    text not null check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack')),
  food_name    text not null,
  grams        numeric(8,2) not null default 100,
  calories     numeric(8,2) not null default 0,
  protein_g    numeric(8,2) not null default 0,
  carbs_g      numeric(8,2) not null default 0,
  fat_g        numeric(8,2) not null default 0,
  order_index  int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists diet_plan_items_user_day_idx
  on public.diet_plan_items (user_id, day_of_week);

-- RLS
alter table public.diet_plan_items enable row level security;

drop policy if exists "Users manage own diet_plan_items" on public.diet_plan_items;
create policy "Users manage own diet_plan_items"
  on public.diet_plan_items
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  Extend nutrition_entries with source_plan_item_id
--     Allows linking a consumed entry back to the plan item it came from.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.nutrition_entries
  add column if not exists source_plan_item_id uuid
    references public.diet_plan_items(id) on delete set null;

create index if not exists nutrition_entries_source_plan_idx
  on public.nutrition_entries (user_id, entry_date, source_plan_item_id)
  where source_plan_item_id is not null;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3.  get_today_diet — returns all plan items for today's day_of_week
--     with consumed flag (true if a nutrition_entry exists with that plan item id today)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_today_diet(p_user_id uuid)
returns table (
  id                uuid,
  day_of_week       smallint,
  meal_type         text,
  food_name         text,
  grams             numeric,
  calories          numeric,
  protein_g         numeric,
  carbs_g           numeric,
  fat_g             numeric,
  order_index       int,
  consumed          boolean,
  entry_id          uuid
)
language sql
security definer
as $$
  with today_entries as (
    select id, source_plan_item_id
    from public.nutrition_entries
    where user_id   = p_user_id
      and entry_date = current_date
      and source_plan_item_id is not null
  )
  select
    dpi.id,
    dpi.day_of_week,
    dpi.meal_type,
    dpi.food_name,
    dpi.grams,
    dpi.calories,
    dpi.protein_g,
    dpi.carbs_g,
    dpi.fat_g,
    dpi.order_index,
    (te.id is not null)           as consumed,
    te.id                         as entry_id
  from public.diet_plan_items dpi
  left join today_entries te on te.source_plan_item_id = dpi.id
  where dpi.user_id    = p_user_id
    and dpi.day_of_week = extract(isodow from current_date)::smallint - 1
  order by dpi.meal_type, dpi.order_index, dpi.created_at;
$$;

grant execute on function public.get_today_diet(uuid) to authenticated;
