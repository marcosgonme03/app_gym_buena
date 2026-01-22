-- =====================================================
-- Script SQL: Migración de estructura de users y creación de body_metrics
-- Fecha: 2026-01-22
-- Descripción: Actualiza la tabla users con campos de objetivo y crea tabla body_metrics
-- =====================================================

-- 1. Crear enum para tipos de objetivo (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type') THEN
        CREATE TYPE goal_type AS ENUM (
            'lose_fat',
            'gain_muscle',
            'strength',
            'endurance',
            'mobility',
            'health'
        );
    END IF;
END $$;

-- 2. Añadir nuevas columnas a users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS goal_type goal_type,
ADD COLUMN IF NOT EXISTS goal_notes TEXT,
ADD COLUMN IF NOT EXISTS goal_target_date DATE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 3. Renombrar columna height a height_cm si existe la antigua
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'height'
    ) THEN
        ALTER TABLE public.users RENAME COLUMN height TO height_cm;
    END IF;
END $$;

-- 4. Eliminar columnas obsoletas de users (si existen)
ALTER TABLE public.users
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS goal,
DROP COLUMN IF EXISTS weight_kg,
DROP COLUMN IF EXISTS birth_date;  -- Usar date_of_birth en su lugar

-- 5. Asegurar que height_cm existe
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS height_cm INTEGER;

-- 6. Crear tabla body_metrics para tracking histórico de peso
CREATE TABLE IF NOT EXISTS public.body_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg >= 20 AND weight_kg <= 300),
    height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 80 AND height_cm <= 250)),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Crear índices en body_metrics para mejorar performance
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON public.body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_body_metrics_recorded_at ON public.body_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_recorded ON public.body_metrics(user_id, recorded_at DESC);

-- 8. Añadir comentarios para documentación
COMMENT ON COLUMN public.users.goal_type IS 'Tipo de objetivo de entrenamiento del usuario';
COMMENT ON COLUMN public.users.goal_notes IS 'Notas adicionales sobre el objetivo (max 1000 caracteres)';
COMMENT ON COLUMN public.users.goal_target_date IS 'Fecha en la que el usuario quiere alcanzar su objetivo';
COMMENT ON COLUMN public.users.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding';
COMMENT ON COLUMN public.users.height_cm IS 'Altura del usuario en centímetros';

COMMENT ON TABLE public.body_metrics IS 'Historial de métricas corporales (peso y altura) del usuario';
COMMENT ON COLUMN public.body_metrics.weight_kg IS 'Peso en kilogramos (20-300 kg)';
COMMENT ON COLUMN public.body_metrics.height_cm IS 'Altura en centímetros (80-250 cm) - opcional, puede duplicarse desde users';
COMMENT ON COLUMN public.body_metrics.recorded_at IS 'Fecha y hora en que se registró la métrica';

-- 9. Habilitar Row Level Security (RLS) en body_metrics
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas RLS para body_metrics
-- Los usuarios solo pueden ver sus propias métricas
CREATE POLICY "Users can view own body metrics"
ON public.body_metrics
FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar sus propias métricas
CREATE POLICY "Users can insert own body metrics"
ON public.body_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propias métricas
CREATE POLICY "Users can update own body metrics"
ON public.body_metrics
FOR UPDATE
USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propias métricas
CREATE POLICY "Users can delete own body metrics"
ON public.body_metrics
FOR DELETE
USING (auth.uid() = user_id);

-- Admins pueden ver todas las métricas
CREATE POLICY "Admins can view all body metrics"
ON public.body_metrics
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.user_id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 11. Crear índices en users para nuevas columnas
CREATE INDEX IF NOT EXISTS idx_users_goal_type ON public.users(goal_type) WHERE goal_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON public.users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_height_cm ON public.users(height_cm) WHERE height_cm IS NOT NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar estructura de users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('goal_type', 'goal_notes', 'goal_target_date', 'onboarding_completed', 'height_cm')
ORDER BY ordinal_position;

-- Verificar estructura de body_metrics
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'body_metrics'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'body_metrics';

-- =====================================================
-- DATOS DE PRUEBA (opcional - descomentar si quieres)
-- =====================================================

/*
-- Insertar métrica de ejemplo para un usuario
INSERT INTO public.body_metrics (user_id, weight_kg, height_cm, recorded_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- Reemplazar con un user_id real
    75.5,
    175,
    NOW()
);

-- Actualizar objetivo de un usuario
UPDATE public.users
SET 
    goal_type = 'gain_muscle',
    goal_notes = 'Quiero ganar 5kg de músculo en 6 meses',
    goal_target_date = (CURRENT_DATE + INTERVAL '6 months')::DATE,
    onboarding_completed = TRUE
WHERE user_id = '00000000-0000-0000-0000-000000000000';  -- Reemplazar con un user_id real
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
