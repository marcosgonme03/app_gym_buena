# Guía de Configuración de Ajustes y Fotos de Perfil

## 📋 Pasos para configurar la funcionalidad completa

### 1️⃣ **Ejecutar SQL en Supabase**

Ve a **Supabase Dashboard** → **SQL Editor** → **New query**

Copia y ejecuta el contenido de [add-profile-fields.sql](add-profile-fields.sql):

Esto creará:
- ✅ Nuevas columnas en tabla `users`: `avatar_url`, `phone`, `bio`, `date_of_birth`
- ✅ Bucket de storage `avatars` (público)
- ✅ Políticas RLS para subir, ver, actualizar y eliminar avatares

---

### 2️⃣ **Características implementadas**

#### **Página de Ajustes (/settings)**
- 🌓 **Toggle tema claro/oscuro** (persistente en localStorage)
- 📸 **Subida de foto de perfil** a Supabase Storage
- ✏️ **Editar información personal**:
  - Nombre y apellidos
  - Teléfono
  - Fecha de nacimiento
  - Biografía
- 💾 Actualización en tiempo real con Supabase

#### **Componente Avatar reutilizable**
- Muestra foto de perfil si existe
- Muestra iniciales si no hay foto
- Tamaños: sm, md, lg, xl
- Usado en todos los dashboards

#### **Integración en todos los roles**
- ✅ **Admin Dashboard**: Avatar en header y tabla de usuarios
- ✅ **Trainer Dashboard**: Avatar en header
- ✅ **Member Dashboard**: Avatar grande en header
- ✅ Botón de ajustes (⚙️) en todos los dashboards

---

### 3️⃣ **Cómo usar**

1. **Login** con cualquier usuario (admin, trainer o member)

2. **Click en el icono de ajustes** (⚙️) en el header

3. **Cambiar tema**:
   - Toggle para cambiar entre claro y oscuro
   - Se guarda automáticamente

4. **Cambiar foto de perfil**:
   - Click en "Cambiar foto"
   - Seleccionar imagen (JPG, PNG, GIF)
   - Se sube a Supabase Storage
   - Aparece automáticamente en todos los dashboards

5. **Editar información**:
   - Completar campos adicionales
   - Click en "Guardar Cambios"
   - Se actualiza en la base de datos

---

### 4️⃣ **Estructura de Storage**

Las fotos se guardan en:
```
avatars/
  {user_id}/
    avatar.jpg (o .png, .gif)
```

URL pública ejemplo:
```
https://rkyjpakkigmphuinjorp.supabase.co/storage/v1/object/public/avatars/{user_id}/avatar.jpg
```

---

### 5️⃣ **Archivos creados/modificados**

**Nuevos:**
- `frontend/src/contexts/ThemeContext.tsx` - Gestión del tema
- `frontend/src/components/common/Avatar.tsx` - Componente reutilizable
- `frontend/src/pages/Settings.tsx` - Página de ajustes
- `backend/add-profile-fields.sql` - SQL para nuevos campos

**Modificados:**
- `frontend/src/App.tsx` - Ruta `/settings` y ThemeProvider
- `frontend/src/contexts/AuthContext.tsx` - Método `refreshProfile()`
- `frontend/src/lib/supabase/types.ts` - Tipos actualizados
- `frontend/src/pages/AdminDashboard.tsx` - Avatar integrado
- `frontend/src/pages/TrainerDashboard.tsx` - Avatar integrado
- `frontend/src/pages/MemberDashboard.tsx` - Avatar integrado

---

### 6️⃣ **Verificar funcionamiento**

```sql
-- Ver usuarios con fotos
SELECT user_id, name, email, avatar_url, phone, bio 
FROM public.users;

-- Ver archivos en storage
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars';
```

---

### 🎨 **Tema claro (próximamente)**

El tema claro está preparado pero requiere ajustar los colores en Tailwind. Por ahora el toggle cambia la clase pero los estilos están optimizados para modo oscuro.

Para implementar tema claro completo:
1. Añadir variantes `light:` en `tailwind.config.ts`
2. Crear variables CSS para ambos temas
3. Ajustar colores `dark-*` para que funcionen en ambos modos

¡Todo listo para usar! 🚀
