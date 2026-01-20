-- Añadir campos adicionales a la tabla users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- NOTA: El bucket de storage 'avatars' debe crearse manualmente desde la UI de Supabase:
-- 1. Ve a Storage en el panel de Supabase
-- 2. Click en "New bucket"
-- 3. Nombre: avatars
-- 4. Marca como "Public bucket"
-- 5. Click en "Create bucket"

-- Eliminar políticas antiguas si existen (para evitar conflictos)
DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_access" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;

-- Policy: Permitir a usuarios autenticados subir sus propios avatares
CREATE POLICY "users_upload_own_avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Todos pueden ver los avatares (son públicos)
CREATE POLICY "avatars_public_access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Usuarios pueden actualizar sus propios avatares
CREATE POLICY "users_update_own_avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Usuarios pueden eliminar sus propios avatares
CREATE POLICY "users_delete_own_avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificar que las columnas se crearon
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
