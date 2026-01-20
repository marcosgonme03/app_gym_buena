# Guía Paso a Paso: Configurar Fotos de Perfil

## 📋 Ejecutar en este orden:

### **Paso 1: Añadir columnas a la tabla users**

En **Supabase Dashboard** → **SQL Editor**, ejecuta SOLO esta parte primero:

```sql
-- Añadir campos adicionales a la tabla users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Verificar que las columnas se crearon
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

✅ **Resultado esperado**: Deberías ver las nuevas columnas en la lista.

---

### **Paso 2: Crear bucket de Storage desde la UI**

⚠️ **IMPORTANTE**: NO ejecutes SQL para crear el bucket. Hazlo desde la interfaz:

1. Ve a **Storage** en el panel lateral de Supabase
2. Click en **"New bucket"**
3. **Nombre**: `avatars` (exactamente así, sin mayúsculas)
4. ✅ **Marca como "Public bucket"** (importante para que las fotos sean visibles)
5. Click en **"Create bucket"**

✅ **Resultado**: Deberías ver el bucket "avatars" en la lista de Storage.

---

### **Paso 3: Crear políticas RLS para Storage**

Ahora SÍ, en **SQL Editor**, ejecuta esto:

```sql
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
```

✅ **Resultado esperado**: "Success. No rows returned"

---

### **Paso 4: Verificar políticas creadas**

En Storage → avatars → Policies, deberías ver:
- ✅ users_upload_own_avatar
- ✅ avatars_public_access
- ✅ users_update_own_avatar
- ✅ users_delete_own_avatar

---

## 🧪 **Probar funcionamiento:**

1. Login en tu app
2. Ve a Ajustes (⚙️)
3. Click en "Cambiar foto"
4. Selecciona una imagen
5. La foto debería subirse y aparecer en tu avatar

---

## ❌ **Si tienes errores comunes:**

### Error: "new row violates row-level security policy"
**Solución**: Asegúrate de que el bucket "avatars" está marcado como **Public**.

### Error: "Bucket avatars does not exist"
**Solución**: Crea el bucket desde la UI de Supabase (Paso 2).

### Error: "policy ... already exists"
**Solución**: Ya ejecutaste el SQL. No hace falta volver a ejecutarlo.

### La foto no se ve
**Solución**: 
1. Verifica que el bucket es público
2. En Storage → avatars → Configuration, asegúrate de que "Public" está en ON

---

## 📸 **Estructura de archivos:**

Las fotos se guardan así:
```
Storage/
  avatars/
    {user_id}/
      avatar.jpg
```

Ejemplo de URL:
```
https://PROJECT.supabase.co/storage/v1/object/public/avatars/USER_ID/avatar.jpg
```

¡Listo! 🚀
