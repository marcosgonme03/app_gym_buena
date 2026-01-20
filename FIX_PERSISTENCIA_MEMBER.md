# 🔧 FIX: Persistencia de Ajustes de Member

## 🔴 PROBLEMA IDENTIFICADO

### Causa Exacta:
El estado `formData` en `Settings.tsx` se inicializaba **UNA SOLA VEZ** cuando el componente se montaba:

```tsx
const [formData, setFormData] = useState({
  name: profile?.name || '', // ❌ profile es null en el primer render
  ...
});
```

**Timeline del bug:**
1. Componente Settings se monta → `profile = null` (AuthContext aún cargando)
2. `formData` se inicializa con strings vacíos: `{ name: '', phone: '', ... }`
3. AuthContext termina de cargar → `profile` se actualiza con datos reales
4. **PERO** `formData` NO se actualiza (useState solo ejecuta una vez)
5. Usuario cambia datos y guarda
6. Se guarda correctamente en BBDD ✅
7. Al recargar, `refreshProfile()` trae datos actualizados
8. **PERO** `formData` sigue con valores viejos porque no se sincroniza con `profile`

### Consecuencias:
- Los cambios SÍ se guardaban en Supabase
- Pero la UI mostraba datos desactualizados
- Al cerrar sesión y volver a entrar, parecía que no se habían guardado

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Servicio de Perfil Robusto

**Archivo:** `frontend/src/services/userProfile.ts`

Creado un servicio centralizado con:

#### `getMyProfile()`
- Lee perfil desde `public.users` usando `auth.uid()`
- Validación de sesión activa
- Logs detallados para debugging

#### `updateMyProfile(payload)`
- **Validaciones antes de guardar:**
  - Teléfono: 9-20 caracteres
  - Bio: máx 500 caracteres
  - Fecha nacimiento: no futura, no >120 años
  - Nombre: obligatorio, 2-50 caracteres
  - Apellido: máx 50 caracteres
- Convierte strings vacías a `null` para campos opcionales
- Usa `.select()` para obtener resultado del UPDATE
- Mensajes de error amigables según código PostgreSQL

#### `updateMyAvatar(avatarUrl)`
- Actualiza solo el `avatar_url` en BBDD
- Timestamp automático en `updated_at`

**Beneficios:**
- Validación centralizada (no duplicar lógica)
- Manejo consistente de errores
- Logs para debugging
- Reutilizable en otros componentes

---

### 2. Sincronización Automática de FormData

**Archivo:** `frontend/src/pages/Settings.tsx`

```tsx
// ✅ useEffect sincroniza formData cuando profile cambia
useEffect(() => {
  if (profile) {
    console.log('[Settings] Syncing formData with profile:', profile);
    setFormData({
      name: profile.name || '',
      last_name: profile.last_name || '',
      email: profile.email || '',
      phone: (profile as any)?.phone || '',
      bio: (profile as any)?.bio || '',
      date_of_birth: (profile as any)?.date_of_birth || ''
    });
  }
}, [profile]); // 🔥 Se ejecuta cada vez que profile cambia
```

**Flujo corregido:**
1. Settings se monta → `formData` vacío inicialmente
2. `profile` se carga → **useEffect detecta cambio**
3. `formData` se actualiza automáticamente con datos reales
4. Usuario cambia datos → `setFormData` actualiza estado local
5. Usuario guarda → `updateMyProfile()` guarda en BBDD
6. `refreshProfile()` recarga desde BBDD
7. **useEffect detecta cambio en profile**
8. `formData` se sincroniza con nuevos valores

---

### 3. Mejora en refreshProfile

**Archivo:** `frontend/src/contexts/AuthContext.tsx`

```tsx
const refreshProfile = async () => {
  console.log('[AuthContext] Refreshing profile...');
  
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      console.warn('[AuthContext] No session found during refresh');
      return;
    }

    // Forzar recarga desde BBDD (no cache)
    const userProfile = await getUserProfile(currentSession.user.id);

    if (!userProfile) {
      console.error('[AuthContext] Profile not found during refresh');
      setError(new Error('Perfil no encontrado'));
      return;
    }

    setProfile(userProfile);
    console.log('[AuthContext] ✅ Profile refreshed successfully');
  } catch (err) {
    console.error('[AuthContext] Error refreshing profile:', err);
    setError(err as Error);
  }
};
```

**Cambios:**
- Valida sesión actual antes de refrescar
- Manejo de errores explícito
- Logs claros para debugging
- No depende del estado previo de `session`

---

### 4. RLS Policies Correctas

**Archivo:** `backend/fix-profile-persistence.sql`

Script idempotente que:

#### Verifica y crea columnas (si no existen):
- `avatar_url TEXT`
- `phone VARCHAR(20)`
- `bio TEXT`
- `date_of_birth DATE`

#### Políticas RLS sin recursión:

```sql
-- SELECT: Usuario solo ve su propio perfil
CREATE POLICY "users_select_own"
ON public.users FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- UPDATE: Usuario solo actualiza su propio perfil
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- INSERT: Solo el sistema (bloqueado para usuarios)
CREATE POLICY "users_insert_system"
ON public.users FOR INSERT TO authenticated
WITH CHECK (false);
```

**Por qué funciona:**
- Usa `auth.uid()` directamente (no subqueries a `users`)
- Evita recursión infinita
- USING: condición para leer
- WITH CHECK: condición para escribir

---

## 📋 PASOS PARA IMPLEMENTAR

### 1. Ejecutar SQL en Supabase

**Dashboard → SQL Editor → Nuevo Query**

Ejecuta: `backend/fix-profile-persistence.sql`

**Resultado esperado:**
```
✅ 4 columnas verificadas/creadas
✅ 3 policies creadas
✅ Sin errores de recursión
```

### 2. Código ya actualizado

Archivos modificados:
- ✅ `frontend/src/services/userProfile.ts` (nuevo)
- ✅ `frontend/src/pages/Settings.tsx` (useEffect + servicio)
- ✅ `frontend/src/contexts/AuthContext.tsx` (refreshProfile mejorado)

---

## 🧪 CÓMO PROBAR (CHECKLIST)

### Prueba 1: Cambios simples
1. Login como member
2. Ve a Ajustes (⚙️)
3. Cambia: Nombre, Teléfono, Bio, Fecha
4. Click "Guardar Cambios"
5. ✅ Mensaje "¡Perfil actualizado correctamente!"
6. Recarga página (F5)
7. ✅ Cambios siguen ahí

### Prueba 2: Persistencia entre sesiones
1. Cambia bio a "Soy un atleta dedicado"
2. Guarda
3. Cierra sesión
4. Vuelve a hacer login
5. Ve a Ajustes
6. ✅ Bio debe decir "Soy un atleta dedicado"

### Prueba 3: Validaciones
1. Intenta guardar nombre vacío → ❌ Error
2. Intenta bio de >500 caracteres → ❌ Error
3. Intenta fecha futura → ❌ Error
4. Intenta teléfono muy corto → ❌ Error

### Prueba 4: Consola del navegador (F12)
Al guardar, debes ver:
```
[Settings] Guardando cambios: {...}
[ProfileService] Updating profile: {...}
[ProfileService] Update data prepared: {...}
[ProfileService] Profile updated successfully: {...}
[Settings] ✅ Perfil actualizado en BBDD: {...}
[AuthContext] Refreshing profile...
[AuthContext] ✅ Profile refreshed successfully
[Settings] Syncing formData with profile: {...}
```

Si hay error:
```
[ProfileService] Update error: {...}
[Settings] ❌ Error al guardar: {...}
```

### Prueba 5: Verificar en BBDD
**Supabase Dashboard → Table Editor → users**

Busca tu registro por `user_id`, verifica que:
- `phone` tiene tu número
- `bio` tiene tu texto
- `date_of_birth` tiene tu fecha
- `updated_at` es reciente

---

## 🔍 DEBUGGING

### Si los cambios no se guardan:

#### 1. Revisa consola del navegador (F12)
Busca mensajes:
- `[Settings] Guardando cambios:` → Verifica payload
- `[ProfileService] Update error:` → Lee el error exacto

#### 2. Errores comunes y soluciones:

**"No tienes permisos para actualizar este perfil"**
- **Causa:** RLS policies mal configuradas
- **Solución:** Re-ejecuta `fix-profile-persistence.sql`

**"Profile not found"**
- **Causa:** No existe registro en `users` para tu auth user
- **Solución:** Verifica que el trigger `on_auth_user_created` funciona

**"La columna X no existe"**
- **Causa:** Columnas no creadas en BBDD
- **Solución:** Ejecuta `fix-profile-persistence.sql`

**"El nombre es obligatorio"**
- **Causa:** Validación del servicio
- **Solución:** Ingresa un nombre válido (2-50 caracteres)

#### 3. Verifica sesión activa:
```typescript
// En consola del navegador:
supabase.auth.getUser().then(({ data }) => console.log(data));
```

Debe retornar tu usuario con `id` y `email`.

---

## 🚫 LO QUE NO SE TOCÓ (COMO SE PIDIÓ)

### Admin y Trainer NO afectados:
- ❌ No se modificó `AdminDashboard.tsx`
- ❌ No se modificó `TrainerDashboard.tsx`
- ❌ Settings funciona para todos los roles
- ✅ Cada rol solo ve/edita su propio perfil (RLS)

### Guard clauses implícitas:
- RLS asegura que cada usuario solo accede a su registro
- `auth.uid() = user_id` en todas las policies
- No hace falta validar role en el código (Postgres lo hace)

---

## 📊 COMPARACIÓN ANTES/DESPUÉS

### ANTES ❌
```typescript
// Settings.tsx
const [formData] = useState({
  name: profile?.name || '' // profile = null al montar
});
// formData = { name: '' } y NUNCA se actualiza

// Al cargar profile:
// profile = { name: "Juan" }
// formData = { name: '' } // ❌ Desincronizado
```

### DESPUÉS ✅
```typescript
// Settings.tsx
const [formData, setFormData] = useState({ name: '' });

useEffect(() => {
  if (profile) {
    setFormData({ name: profile.name }); // 🔄 Sincronización
  }
}, [profile]);

// Al cargar profile:
// profile = { name: "Juan" }
// useEffect detecta cambio → formData = { name: "Juan" } ✅
```

---

## 🎯 RESUMEN TÉCNICO

### Problema:
Estado React desincronizado con Supabase

### Solución:
1. **useEffect** sincroniza formData ↔ profile
2. **Servicio** centraliza lógica y validaciones
3. **refreshProfile** mejorado recarga desde BBDD
4. **RLS** sin recursión asegura permisos

### Resultado:
✅ Cambios persisten entre recargas  
✅ Cambios persisten entre sesiones  
✅ Validaciones robustas  
✅ Mensajes de error claros  
✅ Debugging con logs  
✅ Admin/Trainer no afectados  

---

## 📞 SOPORTE

Si después de aplicar los cambios sigues teniendo problemas:

1. Abre consola del navegador (F12)
2. Ve a Ajustes
3. Cambia algo y guarda
4. Copia TODOS los logs de consola
5. Adjunta captura de pantalla de:
   - Supabase → Table Editor → users (tu registro)
   - Supabase → Authentication → Policies (policies activas)

---

**Última actualización:** 20 Enero 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementado y listo para probar
