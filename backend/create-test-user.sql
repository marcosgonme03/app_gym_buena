-- CREAR USUARIO DE PRUEBA
-- Ejecuta esto en Supabase SQL Editor

-- 1. Verificar usuarios existentes
SELECT id, email, created_at FROM auth.users;

-- 2. Si necesitas crear un usuario nuevo (esto lo hace Supabase Auth automáticamente, pero por si acaso):
-- Ve a Authentication > Users en Supabase Dashboard y crea un usuario con:
-- Email: test@gym.com
-- Password: test123456

-- 3. Una vez creado el usuario en auth.users, verifica que se creó el perfil:
SELECT * FROM public.users;

-- 4. Si el perfil NO existe, créalo manualmente:
-- REEMPLAZA 'USER_ID_AQUI' con el ID real del usuario de auth.users

/*
INSERT INTO public.users (user_id, email, name, last_name, role, created_at, updated_at)
VALUES (
  'USER_ID_AQUI',  -- Copiar el ID de auth.users
  'test@gym.com',
  'Usuario',
  'Prueba',
  'member',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- 5. Verificar que el perfil existe y tiene un role:
SELECT user_id, email, name, role FROM public.users;

-- 6. Si quieres hacer admin a un usuario:
-- UPDATE public.users SET role = 'admin' WHERE email = 'test@gym.com';
