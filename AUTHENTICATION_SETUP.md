# ✅ Sistema de Autenticación con Roles - COMPLETADO

## 🎯 Estado Actual

### Infraestructura Creada
✅ **Frontend:**
- `lib/supabase/client.ts` - Cliente Supabase configurado
- `lib/supabase/types.ts` - Tipos TypeScript (UserProfile, Role, Class, Booking)
- `lib/auth/getProfile.ts` - Funciones getUserProfile y getCurrentUser
- `contexts/AuthContext.tsx` - Context de autenticación global
- `components/guards/ProtectedRoute.tsx` - Guard con redirección según role
- `pages/MemberDashboard.tsx` - Dashboard profesional para members
- `pages/AdminDashboard.tsx` - Dashboard para admins
- `pages/TrainerDashboard.tsx` - Dashboard para trainers
- `App.tsx` - Rutas configuradas con AuthProvider y ProtectedRoute
- `Login.tsx` - Login actualizado con Supabase directo + redirección por role
- `Register.tsx` - Registro actualizado con Supabase directo

✅ **Backend:**
- Supabase conectado correctamente
- Endpoints `/api/auth/login` y `/api/auth/register` funcionando
- Variables de entorno configuradas

✅ **Database:**
- Tabla `public.users` con columnas: user_id, email, name, last_name, role, created_at, updated_at
- Enum `user_role` con valores: admin, trainer, member
- Trigger `handle_new_user()` para auto-crear perfil en public.users
- RLS habilitado

---

## 🔴 PROBLEMA CRÍTICO DETECTADO

### Error: Infinite Recursion en RLS Policies

**Síntoma:**
```
[AUTH] Perfil no encontrado: infinite recursion detected in policy for relation "users"
[AUTH] Login exitoso para: admin@gym.com (sin rol)
```

**Causa:**
Las RLS policies originales tenían subqueries que consultaban la tabla `users` dentro de policies sobre la misma tabla `users`, causando recursión infinita.

**Solución:**
Ejecutar el archivo `backend/fix-rls-recursion.sql` en Supabase SQL Editor.

---

## 🚀 Pasos para Activar el Sistema Completo

### 1. Arreglar RLS Policies (CRÍTICO) ✅ YA EJECUTADO

~~Ve a Supabase Dashboard → SQL Editor y ejecuta el contenido de:~~
~~`backend/fix-rls-recursion.sql`~~

**YA COMPLETADO**

---

### 2. Crear Usuario de Prueba (OBLIGATORIO AHORA)

**Opción A: Desde Supabase Dashboard (RECOMENDADO)**

1. Ve a **Supabase Dashboard** → https://supabase.com/dashboard/project/rkyjpakkigmphuinjorp
2. **Authentication** → **Users** → **Add User**
3. Crea un usuario:
   - Email: `test@gym.com`
   - Password: `test123456`
   - Click **Create user**

4. **IMPORTANTE:** Verifica que se creó el perfil automáticamente:
   - Ve a **Table Editor** → tabla `users`
   - Deberías ver un registro con `email = test@gym.com`
   - Si NO existe, ve al paso 5

5. **Si el perfil NO existe** (el trigger falló), ejecútalo manualmente:
   - Ve a **SQL Editor**
   - Ejecuta:
   ```sql
   -- Primero obtén el user_id
   SELECT id, email FROM auth.users WHERE email = 'test@gym.com';
   
   -- Luego inserta el perfil (reemplaza USER_ID_AQUI)
   INSERT INTO public.users (user_id, email, name, last_name, role, created_at, updated_at)
   VALUES (
     'USER_ID_AQUI',  -- Copia el ID del SELECT anterior
     'test@gym.com',
     'Usuario',
     'Prueba',
     'member',
     NOW(),
     NOW()
   );
   ```

**Opción B: Usar el email que ya tienes registrado**

Si ya tienes un usuario registrado (como `marcosgonme03@gmail.com`):

1. Ve a **Table Editor** → `users`
2. Verifica que existe un registro con ese email
3. Si existe, úsalo para login
4. Si NO existe, créalo:
```sql
SELECT id FROM auth.users WHERE email = 'marcosgonme03@gmail.com';

INSERT INTO public.users (user_id, email, name, last_name, role, created_at, updated_at)
VALUES (
  'USER_ID_DEL_SELECT',
  'marcosgonme03@gmail.com',
  'Marcos',
  'González',
  'member',
  NOW(),
  NOW()
);
```

---

### 3. Probar el Sistema

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Deberías ver: `✅ Supabase conectado correctamente`

2. **Inicia el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Prueba el flujo completo:**
   - Ve a `http://localhost:5173/login`
   - Login con `admin@gym.com` / `admin123` → Debería redirigir a `/admin`
   - Logout (botón en el dashboard)
   - Login con `trainer@gym.com` / `trainer123` → Debería redirigir a `/trainer`
   - Logout
   - Login con `member@gym.com` / `member123` → Debería redirigir a `/app`

4. **Prueba protección de rutas:**
   - Estando logeado como member, intenta acceder a `/admin` → Debería redirigir a `/app`
   - Sin estar logeado, intenta acceder a `/app` → Debería redirigir a `/login`

---

## 🎨 Características Implementadas

### AuthContext
- `session`: Sesión actual de Supabase
- `profile`: Perfil del usuario desde public.users
- `loading`: Estado de carga
- `error`: Errores de autenticación
- `signOut()`: Función para cerrar sesión
- `refreshProfile()`: Actualizar perfil manualmente

### ProtectedRoute
- Validación de autenticación
- Validación de role permitido
- Redirección automática según role:
  - Admin → `/admin`
  - Trainer → `/trainer`
  - Member → `/app`
- Estados de carga y error
- Skeleton mientras carga

### Login/Register
- Autenticación directa con Supabase (sin pasar por backend)
- Redirección automática según role después de login
- Validación de errores
- Estados de carga

### Dashboards
- **MemberDashboard:** Stats cards (Próxima Clase, Mi Plan, Acciones) + Sección "Mis Reservas"
- **AdminDashboard:** Placeholder con estructura similar
- **TrainerDashboard:** Placeholder con estructura similar

---

## 📋 Pendientes (Futuras Mejoras)

### Base de Datos
- [ ] Crear tabla `classes` con columnas: id, name, description, trainer_id, schedule, capacity
- [ ] Crear tabla `bookings` con columnas: id, user_id, class_id, status, created_at
- [ ] Implementar queries en MemberDashboard para mostrar reservas reales

### Frontend
- [ ] Implementar funcionalidad de reserva de clases
- [ ] Agregar calendario de clases
- [ ] Panel de admin para gestionar usuarios/clases
- [ ] Panel de trainer para gestionar sus clases
- [ ] Perfil de usuario editable

### Backend
- [ ] Endpoints para CRUD de classes
- [ ] Endpoints para CRUD de bookings
- [ ] Middleware de autorización por role
- [ ] Validación de capacidad de clases

---

## 🔧 Configuración de Variables de Entorno

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://rkyjpakkigmphuinjorp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreWpwYWtraWdtcGh1aW5qb3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMzc3MDUsImV4cCI6MjA1MzcxMzcwNX0.pgoKiVC-ZPvS_TAm2HEmQA_8m7luQepmZn3cZ7d7XJA
VITE_API_URL=http://localhost:5050
```

### Backend (.env)
```env
SUPABASE_URL=https://rkyjpakkigmphuinjorp.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreWpwYWtraWdtcGh1aW5qb3JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODEzNzcwNSwiZXhwIjoyMDUzNzEzNzA1fQ.-eLb5Ww9OM386MsbRVOoFA_ZWyk9jHAfPuSZhg8rq5E
PORT=5050
```

---

## 🐛 Troubleshooting

### Error: "infinite recursion detected"
→ Ejecuta `fix-rls-recursion.sql` en Supabase SQL Editor

### Login exitoso pero dice "(sin rol)"
→ Las RLS policies están bloqueando la lectura del perfil. Ejecuta el fix de RLS.

### No redirige después de login
→ Verifica que el usuario tenga un role asignado en `public.users`

### Error 401 en fetch
→ Verifica que las variables de entorno estén correctas en `.env`

### Frontend no conecta con Supabase
→ Verifica que instalaste `@supabase/supabase-js` con `npm install`

---

## 📚 Arquitectura de Seguridad

### Principios Implementados
1. **RLS Habilitado:** Todas las tablas protegidas con Row Level Security
2. **AuthUID Direct:** Policies usan `auth.uid()` sin subqueries
3. **Role-Based Access:** ProtectedRoute valida roles en frontend
4. **Profile from DB:** Nunca confiar en metadata, siempre leer de public.users
5. **Trigger Auto-Profile:** Auto-creación de perfil en public.users al registrarse

### Flujo de Autenticación
```
1. Usuario hace login → Supabase Auth
2. Supabase retorna session con JWT
3. Frontend obtiene profile de public.users usando user_id
4. AuthContext almacena session + profile
5. ProtectedRoute valida role y redirige
6. Dashboard renderiza según role
```

---

## ✅ Checklist de Implementación

- [x] Cliente Supabase frontend
- [x] Tipos TypeScript
- [x] AuthContext con session y profile
- [x] ProtectedRoute con role validation
- [x] Login con redirección por role
- [x] Register con Supabase Auth
- [x] 3 Dashboards (Member, Admin, Trainer)
- [x] App.tsx con rutas protegidas
- [x] Fix SQL para RLS recursion
- [ ] **EJECUTAR fix-rls-recursion.sql en Supabase** ← PRÓXIMO PASO CRÍTICO
- [ ] Crear usuarios de prueba
- [ ] Probar flujo completo

---

**Siguiente paso:** Ve a Supabase Dashboard → SQL Editor y ejecuta `fix-rls-recursion.sql` para arreglar las policies. Luego crea los usuarios de prueba y testea el sistema. 🚀
