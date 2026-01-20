# 🧪 Script de Pruebas - Persistencia de Ajustes

## Pre-requisitos
1. ✅ Ejecutaste `fix-profile-persistence.sql` en Supabase
2. ✅ Frontend compilando sin errores
3. ✅ Backend corriendo en puerto 5050
4. ✅ Tienes un usuario member creado

---

## PRUEBA RÁPIDA (5 minutos)

### 1. Abrir app en navegador
```
http://localhost:5173
```

### 2. Abrir DevTools
- Presiona **F12**
- Ve a pestaña **Console**
- Deja la consola abierta durante todas las pruebas

### 3. Login como member
Usuario de prueba (si tienes uno)

### 4. Ir a Ajustes
Click en el icono ⚙️ o navega a `/settings`

### 5. Verificar carga inicial
En consola debes ver:
```
[Settings] Syncing formData with profile: { user_id: "...", name: "...", ... }
```

✅ **SI LO VES:** formData se sincronizó correctamente  
❌ **SI NO LO VES:** profile no se cargó, revisa AuthContext

---

### 6. Cambiar datos
Modifica:
- **Nombre:** "Test Usuario"
- **Teléfono:** "+34 600 123 456"
- **Bio:** "Esta es mi biografía de prueba"
- **Fecha nacimiento:** "1990-01-15"

### 7. Guardar cambios
Click en **"Guardar Cambios"**

En consola debes ver esta secuencia:
```
[Settings] Guardando cambios: { name: "Test Usuario", ... }
[ProfileService] Updating profile: { name: "Test Usuario", ... }
[ProfileService] Update data prepared: { name: "Test Usuario", ... }
[ProfileService] Profile updated successfully: { user_id: "..." }
[Settings] ✅ Perfil actualizado en BBDD: { user_id: "...", name: "Test Usuario", ... }
[AuthContext] Refreshing profile...
[getProfile] Fetching profile for user: ...
[getProfile] ✅ Profile loaded successfully: { user_id: "...", name: "Test Usuario", ... }
[AuthContext] ✅ Profile refreshed successfully
[Settings] Syncing formData with profile: { name: "Test Usuario", ... }
```

✅ **SI VES ESTO:** Todo funciona perfecto  
❌ **SI VES ERROR:** Anota el mensaje exacto

Debes ver mensaje verde: **"¡Perfil actualizado correctamente!"**

---

### 8. PRUEBA CRÍTICA: Recargar página
Presiona **F5** (recarga completa)

**Verificar:**
- ✅ Los campos mantienen los valores guardados
- ✅ Consola muestra: `[Settings] Syncing formData with profile:`
- ✅ No hay valores vacíos ni defaults

---

### 9. PRUEBA CRÍTICA: Cerrar sesión y volver
1. Click en **"Cerrar sesión"**
2. Login de nuevo con el mismo usuario
3. Ve a **Ajustes**

**Verificar:**
- ✅ Nombre: "Test Usuario"
- ✅ Teléfono: "+34 600 123 456"
- ✅ Bio: "Esta es mi biografía de prueba"
- ✅ Fecha: "1990-01-15"

---

## PRUEBAS DE VALIDACIÓN

### Validación 1: Nombre vacío
1. Borra el campo Nombre (déjalo vacío)
2. Click "Guardar Cambios"

**Resultado esperado:**
```
❌ Mensaje rojo: "El nombre es obligatorio"
```

### Validación 2: Teléfono muy corto
1. Teléfono: "123"
2. Click "Guardar Cambios"

**Resultado esperado:**
```
❌ Mensaje rojo: "El teléfono debe tener entre 9 y 20 caracteres"
```

### Validación 3: Bio muy larga
1. Bio: (copia 501 caracteres)
2. Click "Guardar Cambios"

**Resultado esperado:**
```
❌ Mensaje rojo: "La biografía no puede superar 500 caracteres"
```

### Validación 4: Fecha futura
1. Fecha: "2030-01-01"
2. Click "Guardar Cambios"

**Resultado esperado:**
```
❌ Mensaje rojo: "La fecha de nacimiento no puede ser futura"
```

---

## VERIFICACIÓN EN BASE DE DATOS

### 1. Ir a Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2. Table Editor → users
Busca tu registro por email

### 3. Verificar columnas:
- `name`: "Test Usuario"
- `phone`: "+34 600 123 456"
- `bio`: "Esta es mi biografía de prueba"
- `date_of_birth`: "1990-01-15"
- `updated_at`: Debe ser reciente (hace pocos minutos)

✅ **SI ESTÁN ESOS VALORES:** Persistencia funciona  
❌ **SI SON NULL O VACÍOS:** No se está guardando

---

## VERIFICAR POLÍTICAS RLS

### En Supabase: Authentication → Policies

Busca tabla: **users**

Debes ver:
- ✅ `users_select_own` (SELECT)
- ✅ `users_update_own` (UPDATE)
- ✅ `users_insert_system` (INSERT)

**Detalles de users_update_own:**
- **USING:** `auth.uid() = user_id`
- **WITH CHECK:** `auth.uid() = user_id`

---

## PRUEBA DE PERMISOS (Seguridad)

### Intentar actualizar otro usuario (debe fallar)

**En consola del navegador:**
```javascript
// Obtener tu user_id actual
const { data: { user } } = await supabase.auth.getUser();
console.log('Mi user_id:', user.id);

// Intentar actualizar OTRO usuario (cualquier UUID diferente)
const { data, error } = await supabase
  .from('users')
  .update({ name: 'HACK' })
  .eq('user_id', '00000000-0000-0000-0000-000000000000')
  .select();

console.log('Error esperado:', error);
// Debe decir: "new row violates row-level security policy"
```

✅ **SI DA ERROR:** RLS funciona correctamente  
❌ **SI SE ACTUALIZA:** RLS MAL CONFIGURADO (vuelve a ejecutar SQL)

---

## CHECKLIST FINAL

Marca cada una después de probar:

- [ ] ✅ Login como member
- [ ] ✅ Ajustes carga datos correctamente
- [ ] ✅ Consola muestra logs de sincronización
- [ ] ✅ Cambiar datos y guardar funciona
- [ ] ✅ Mensaje verde "¡Perfil actualizado correctamente!"
- [ ] ✅ Recargar página (F5) mantiene cambios
- [ ] ✅ Cerrar sesión y volver mantiene cambios
- [ ] ✅ Validación de nombre vacío funciona
- [ ] ✅ Validación de teléfono funciona
- [ ] ✅ Validación de bio larga funciona
- [ ] ✅ Validación de fecha futura funciona
- [ ] ✅ BBDD muestra valores guardados
- [ ] ✅ Columna updated_at es reciente
- [ ] ✅ RLS policies existen y están activas
- [ ] ✅ Intentar hackear otro usuario falla

---

## SI ALGO FALLA

### Error: "No tienes permisos para actualizar este perfil"

**Solución:**
```sql
-- Vuelve a ejecutar en Supabase SQL Editor:
-- fix-profile-persistence.sql
```

### Error: "La columna X no existe"

**Solución:**
```sql
-- Ejecuta en SQL Editor:
ALTER TABLE public.users ADD COLUMN X TYPE;
-- Reemplaza X con la columna que falta
-- Reemplaza TYPE con el tipo correcto (TEXT, VARCHAR(20), DATE)
```

### Error: "Profile not found"

**Causa:** No existe registro en `users` para tu auth user

**Solución:**
1. Ve a Authentication → Users
2. Copia el UUID de tu usuario
3. Ve a Table Editor → users
4. Busca ese UUID en user_id
5. Si no existe, el trigger no funcionó
6. Ejecuta `fix-rls-recursion.sql` para recrear trigger

### Los datos no se sincronizan en UI

**Solución:**
1. Cierra completamente el navegador
2. Abre de nuevo
3. Login
4. Limpia caché: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### Consola no muestra logs

**Causa:** Logs deshabilitados o filtrados

**Solución:**
1. En DevTools Console
2. Verifica que el filtro no esté activo
3. Asegúrate que "All levels" está seleccionado
4. Busca por "Settings" o "ProfileService"

---

**Tiempo estimado:** 5-10 minutos  
**Última actualización:** 20 Enero 2026
