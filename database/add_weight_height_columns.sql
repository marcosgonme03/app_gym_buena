-- Script para añadir columnas de peso y altura a la tabla users
-- Ejecutar este script en el SQL Editor de Supabase

-- Añadir columna de peso (en kg, permite decimales)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

-- Añadir columna de altura (en cm, número entero)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Añadir comentarios para documentación
COMMENT ON COLUMN users.weight IS 'Peso del usuario en kilogramos (kg). Ejemplo: 75.5';
COMMENT ON COLUMN users.height IS 'Altura del usuario en centímetros (cm). Ejemplo: 175';

-- Crear índices para mejorar el rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_users_weight ON users(weight);
CREATE INDEX IF NOT EXISTS idx_users_height ON users(height);

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('weight', 'height');

-- Consulta de ejemplo para ver los datos
-- SELECT user_id, name, last_name, weight, height FROM users LIMIT 5;
