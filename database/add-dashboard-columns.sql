-- =====================================================
-- DASHBOARD REDESIGN — DB CHANGES
-- Copiar y pegar en el SQL Editor de Supabase
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1.  Añadir % grasa corporal a la tabla body_metrics
-- ─────────────────────────────────────────────────────
ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS body_fat_pct REAL;

COMMENT ON COLUMN public.body_metrics.body_fat_pct
  IS 'Porcentaje de grasa corporal (0-100)';


-- ─────────────────────────────────────────────────────
-- 2.  Tabla: nutrition_plans
--     Un plan nutricional diario por usuario
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  breakfast     TEXT        NOT NULL DEFAULT '',
  lunch         TEXT        NOT NULL DEFAULT '',
  dinner        TEXT        NOT NULL DEFAULT '',
  snacks        TEXT                 DEFAULT '',
  notes         TEXT                 DEFAULT '',
  total_kcal    INTEGER              DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own nutrition plans"
  ON public.nutrition_plans
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS nutrition_plans_updated_at ON public.nutrition_plans;
CREATE TRIGGER nutrition_plans_updated_at
  BEFORE UPDATE ON public.nutrition_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────
-- 3.  Tabla: member_challenges
--     Retos / desafíos activos por usuario
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_challenges (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  description    TEXT                 DEFAULT '',
  total_days     INTEGER     NOT NULL DEFAULT 30,
  completed_days INTEGER     NOT NULL DEFAULT 0
                             CHECK (completed_days >= 0 AND completed_days <= total_days),
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  started_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  image_url      TEXT                 DEFAULT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.member_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own challenges"
  ON public.member_challenges
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS member_challenges_updated_at ON public.member_challenges;
CREATE TRIGGER member_challenges_updated_at
  BEFORE UPDATE ON public.member_challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────
-- 4.  Datos de ejemplo (opcional — borrar si no quieres)
-- ─────────────────────────────────────────────────────
-- Descomenta las líneas siguientes para insertar datos
-- de prueba en el usuario actualmente logueado.

/*
-- Plan nutricional de hoy
INSERT INTO public.nutrition_plans (user_id, date, breakfast, lunch, dinner, snacks, total_kcal)
VALUES (
  auth.uid(),
  CURRENT_DATE,
  'Avena con plátano y proteína de suero',
  'Pechuga de pollo con arroz integral y verduras',
  'Salmón al horno con batata y ensalada',
  'Almendras y manzana',
  2400
)
ON CONFLICT (user_id, date) DO NOTHING;

-- Desafío activo
INSERT INTO public.member_challenges (user_id, name, description, total_days, completed_days, is_active)
VALUES (
  auth.uid(),
  'Abs Challenge',
  '30 días de trabajo de core progresivo',
  30,
  20,
  TRUE
);
*/
