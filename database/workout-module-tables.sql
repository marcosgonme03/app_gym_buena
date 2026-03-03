-- ============================================================================
-- WORKOUT MODULE — TABLAS COMPLETAS
-- Copiar y pegar completo en el SQL Editor de Supabase
-- Orden: extensions → tables → indexes → RLS → functions → sample data
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLA: routines
--    Rutinas de entrenamiento (plantillas, no sesiones)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routines (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  category          TEXT        NOT NULL DEFAULT 'general',   -- fuerza | hipertrofia | cardio | general
  level             TEXT        NOT NULL DEFAULT 'beginner',  -- beginner | intermediate | advanced
  muscle_group      TEXT,                                     -- Pecho, Espalda, Piernas, etc.
  estimated_duration_min INT    DEFAULT 45,
  description       TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routines_category_check CHECK (category IN ('fuerza','hipertrofia','cardio','general')),
  CONSTRAINT routines_level_check    CHECK (level    IN ('beginner','intermediate','advanced'))
);

COMMENT ON TABLE  public.routines                     IS 'Rutinas de entrenamiento creadas por el usuario';
COMMENT ON COLUMN public.routines.category            IS 'Categoría: fuerza | hipertrofia | cardio | general';
COMMENT ON COLUMN public.routines.level               IS 'Nivel: beginner | intermediate | advanced';
COMMENT ON COLUMN public.routines.muscle_group        IS 'Grupo muscular principal (texto libre)';
COMMENT ON COLUMN public.routines.estimated_duration_min IS 'Duración estimada en minutos';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA: exercises
--    Ejercicios que pertenecen a una rutina
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercises (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id    UUID    NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  sets          INT     NOT NULL DEFAULT 3 CHECK (sets  BETWEEN 1 AND 20),
  reps          INT     NOT NULL DEFAULT 10 CHECK (reps BETWEEN 1 AND 100),
  weight        NUMERIC(6,2),                   -- kg, nullable para bodyweight
  rest_seconds  INT     DEFAULT 60,             -- descanso entre series
  notes         TEXT,
  order_index   INT     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.exercises             IS 'Ejercicios de cada rutina';
COMMENT ON COLUMN public.exercises.weight      IS 'Peso en kg; NULL para ejercicios de peso corporal';
COMMENT ON COLUMN public.exercises.order_index IS 'Orden dentro de la rutina (0-based)';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ALTER: workout_sessions — añadir campos nuevos
--    (Las columnas total_weight_kg y session_name ya pueden existir del script anterior)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS routine_id         UUID        REFERENCES public.routines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category           TEXT        DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS muscle_group       TEXT,
  ADD COLUMN IF NOT EXISTS total_weight_kg    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_name       TEXT,
  ADD COLUMN IF NOT EXISTS started_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at       TIMESTAMPTZ;

COMMENT ON COLUMN public.workout_sessions.routine_id   IS 'Rutina usada en esta sesión (NULL = entrenamiento libre)';
COMMENT ON COLUMN public.workout_sessions.category     IS 'Copia de la categoría de la rutina para filtros rápidos';
COMMENT ON COLUMN public.workout_sessions.muscle_group IS 'Grupo muscular principal trabajado';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_routines_user_id
  ON public.routines (user_id);

CREATE INDEX IF NOT EXISTS idx_routines_category
  ON public.routines (category);

CREATE INDEX IF NOT EXISTS idx_exercises_routine_id
  ON public.exercises (routine_id);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date_status
  ON public.workout_sessions (user_id, workout_date, status);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_category
  ON public.workout_sessions (user_id, category);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS — Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

-- routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "routines: users own rows" ON public.routines;
CREATE POLICY "routines: users own rows"
  ON public.routines
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercises: users own rows" ON public.exercises;
CREATE POLICY "exercises: users own rows"
  ON public.exercises
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FUNCIÓN: updated_at trigger (si no existe)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_routines_updated_at ON public.routines;
CREATE TRIGGER trg_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. FUNCIÓN: get_workout_stats (reemplaza la anterior si ya existe)
--    Usada via supabase.rpc('get_workout_stats')
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_workout_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions      BIGINT,
  total_weight_kg     NUMERIC,
  this_month_sessions BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)                                AS total_sessions,
    COALESCE(SUM(ws.total_weight_kg), 0)   AS total_weight_kg,
    COUNT(*) FILTER (
      WHERE DATE_TRUNC('month', ws.workout_date) = DATE_TRUNC('month', CURRENT_DATE)
    )                                       AS this_month_sessions
  FROM public.workout_sessions ws
  WHERE ws.user_id = p_user_id
    AND ws.status  = 'completed';
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VISTA: v_workout_history (enriquecida con rutina y ejercicios)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_workout_history AS
SELECT
  ws.id,
  ws.user_id,
  ws.workout_date,
  ws.status,
  ws.actual_duration_min,
  ws.total_weight_kg,
  ws.session_name,
  ws.category,
  ws.muscle_group,
  ws.routine_id,
  r.name                                                    AS routine_name,
  r.level                                                   AS routine_level,
  COALESCE(ws.session_name, r.name, wws.name, 'Entrenamiento libre')
                                                            AS display_name,
  COALESCE(
    (SELECT COUNT(*) FROM public.exercises        e2  WHERE e2.routine_id = r.id),
    (SELECT COUNT(*) FROM public.weekly_workout_exercises wwe WHERE wwe.session_id = ws.plan_session_id),
    0
  )::INT                                                    AS exercise_count
FROM public.workout_sessions   ws
LEFT JOIN public.routines                r   ON ws.routine_id    = r.id
LEFT JOIN public.weekly_workout_sessions wws ON ws.plan_session_id = wws.id
WHERE ws.status = 'completed';

COMMENT ON VIEW public.v_workout_history IS
  'Vista de historial de sesiones completadas con nombre y ejercicios resueltos';


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. (OPCIONAL) Datos de ejemplo — descomenta las líneas para usar
--    Inserta una rutina de ejemplo y 3 sesiones completadas
-- ─────────────────────────────────────────────────────────────────────────────
/*
-- Rutina de ejemplo
INSERT INTO public.routines (user_id, name, category, level, muscle_group, estimated_duration_min)
VALUES (
  auth.uid(),
  'Fuerza Full Body',
  'fuerza',
  'intermediate',
  'Pecho · Espalda · Piernas',
  55
)
ON CONFLICT DO NOTHING;

-- Ejercicios de esa rutina
WITH r AS (SELECT id FROM public.routines WHERE user_id = auth.uid() AND name = 'Fuerza Full Body' LIMIT 1)
INSERT INTO public.exercises (routine_id, user_id, name, sets, reps, weight, order_index)
SELECT r.id, auth.uid(), e.name, e.sets, e.reps, e.weight, e.idx
FROM r, (VALUES
  ('Press de banca',    4, 8,  80.0, 0),
  ('Sentadilla',        4, 6,  100.0, 1),
  ('Peso muerto',       3, 5,  120.0, 2),
  ('Pull-ups',          3, 10, NULL, 3),
  ('Press militar',     3, 8,  50.0, 4)
) AS e(name, sets, reps, weight, idx)
ON CONFLICT DO NOTHING;

-- Sesiones completadas de ejemplo
INSERT INTO public.workout_sessions (
  user_id, workout_date, status,
  started_at, completed_at,
  estimated_duration_min, actual_duration_min,
  session_name, category, muscle_group, total_weight_kg
)
VALUES
  (auth.uid(), CURRENT_DATE - 2, 'completed',
   NOW() - INTERVAL '2 days 1 hour', NOW() - INTERVAL '2 days',
   55, 52, 'Pecho y Tríceps',   'fuerza',      'Pecho',  3600),
  (auth.uid(), CURRENT_DATE - 4, 'completed',
   NOW() - INTERVAL '4 days 1 hour', NOW() - INTERVAL '4 days',
   60, 58, 'Piernas y Hombros', 'fuerza',      'Piernas', 4280),
  (auth.uid(), CURRENT_DATE - 6, 'completed',
   NOW() - INTERVAL '6 days 1 hour', NOW() - INTERVAL '6 days',
   45, 44, 'Espalda y Bíceps',  'hipertrofia', 'Espalda', 2900)
ON CONFLICT (user_id, workout_date) DO NOTHING;
*/
