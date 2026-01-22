-- ============================================================================
-- SISTEMA DE PLANIFICACIÓN SEMANAL DE ENTRENAMIENTOS
-- Versión: 1.0
-- Fecha: 22 Enero 2026
-- Descripción: Permite a usuarios member crear planes semanales estructurados
-- ============================================================================

-- ============================================================================
-- TABLA: weekly_workout_plans
-- Representa un plan de entrenamiento para una semana específica
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, -- Lunes de esa semana (ISO)
    title TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un usuario solo puede tener un plan por semana
    CONSTRAINT unique_user_week UNIQUE(user_id, week_start)
);

-- Índice para búsquedas rápidas por usuario y semana
CREATE INDEX IF NOT EXISTS idx_weekly_workout_plans_user_week 
ON public.weekly_workout_plans(user_id, week_start);

-- ============================================================================
-- TABLA: weekly_workout_sessions
-- Representa una sesión de entrenamiento en un día específico
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.weekly_workout_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_weekly_workout_sessions_user 
ON public.weekly_workout_sessions(user_id, session_date);

CREATE INDEX IF NOT EXISTS idx_weekly_workout_sessions_plan 
ON public.weekly_workout_sessions(plan_id, order_index);

-- ============================================================================
-- TABLA: weekly_workout_exercises
-- Representa un ejercicio dentro de una sesión
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.weekly_workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL CHECK (sets >= 1 AND sets <= 20),
    reps INTEGER NOT NULL CHECK (reps >= 1 AND reps <= 50),
    rest_seconds INTEGER CHECK (rest_seconds IS NULL OR (rest_seconds >= 0 AND rest_seconds <= 600)),
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_weekly_workout_exercises_user 
ON public.weekly_workout_exercises(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_workout_exercises_session 
ON public.weekly_workout_exercises(session_id, order_index);

-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================
COMMENT ON TABLE public.weekly_workout_plans IS 
'Planes de entrenamiento semanales. Cada usuario puede tener un plan por semana.';

COMMENT ON COLUMN public.weekly_workout_plans.week_start IS 
'Lunes de la semana (formato ISO: YYYY-MM-DD). Define el inicio de la semana del plan.';

COMMENT ON TABLE public.weekly_workout_sessions IS 
'Sesiones de entrenamiento individuales dentro de un plan semanal.';

COMMENT ON TABLE public.weekly_workout_exercises IS 
'Ejercicios específicos dentro de una sesión de entrenamiento.';

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a weekly_workout_plans
DROP TRIGGER IF EXISTS update_weekly_workout_plans_updated_at ON public.weekly_workout_plans;
CREATE TRIGGER update_weekly_workout_plans_updated_at
    BEFORE UPDATE ON public.weekly_workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a weekly_workout_sessions
DROP TRIGGER IF EXISTS update_weekly_workout_sessions_updated_at ON public.weekly_workout_sessions;
CREATE TRIGGER update_weekly_workout_sessions_updated_at
    BEFORE UPDATE ON public.weekly_workout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en las 3 tablas
ALTER TABLE public.weekly_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_workout_exercises ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: weekly_workout_plans
-- ============================================================================

-- SELECT: Los usuarios solo pueden ver sus propios planes
DROP POLICY IF EXISTS select_own_weekly_workout_plans ON public.weekly_workout_plans;
CREATE POLICY select_own_weekly_workout_plans 
ON public.weekly_workout_plans
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Solo pueden crear planes para sí mismos
DROP POLICY IF EXISTS insert_own_weekly_workout_plans ON public.weekly_workout_plans;
CREATE POLICY insert_own_weekly_workout_plans 
ON public.weekly_workout_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo pueden actualizar sus propios planes
DROP POLICY IF EXISTS update_own_weekly_workout_plans ON public.weekly_workout_plans;
CREATE POLICY update_own_weekly_workout_plans 
ON public.weekly_workout_plans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo pueden eliminar sus propios planes
DROP POLICY IF EXISTS delete_own_weekly_workout_plans ON public.weekly_workout_plans;
CREATE POLICY delete_own_weekly_workout_plans 
ON public.weekly_workout_plans
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS: weekly_workout_sessions
-- ============================================================================

DROP POLICY IF EXISTS select_own_weekly_workout_sessions ON public.weekly_workout_sessions;
CREATE POLICY select_own_weekly_workout_sessions 
ON public.weekly_workout_sessions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_weekly_workout_sessions ON public.weekly_workout_sessions;
CREATE POLICY insert_own_weekly_workout_sessions 
ON public.weekly_workout_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS update_own_weekly_workout_sessions ON public.weekly_workout_sessions;
CREATE POLICY update_own_weekly_workout_sessions 
ON public.weekly_workout_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS delete_own_weekly_workout_sessions ON public.weekly_workout_sessions;
CREATE POLICY delete_own_weekly_workout_sessions 
ON public.weekly_workout_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS: weekly_workout_exercises
-- ============================================================================

DROP POLICY IF EXISTS select_own_weekly_workout_exercises ON public.weekly_workout_exercises;
CREATE POLICY select_own_weekly_workout_exercises 
ON public.weekly_workout_exercises
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_weekly_workout_exercises ON public.weekly_workout_exercises;
CREATE POLICY insert_own_weekly_workout_exercises 
ON public.weekly_workout_exercises
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS update_own_weekly_workout_exercises ON public.weekly_workout_exercises;
CREATE POLICY update_own_weekly_workout_exercises 
ON public.weekly_workout_exercises
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS delete_own_weekly_workout_exercises ON public.weekly_workout_exercises;
CREATE POLICY delete_own_weekly_workout_exercises 
ON public.weekly_workout_exercises
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'weekly_workout%'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename LIKE 'weekly_workout%'
ORDER BY tablename, policyname;

-- Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'weekly_workout%'
ORDER BY tablename, indexname;

-- ============================================================================
-- SCRIPT COMPLETADO
-- ============================================================================
