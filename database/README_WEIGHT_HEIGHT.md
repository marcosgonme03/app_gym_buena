# Actualización de Base de Datos - Peso y Altura

## 📋 Instrucciones para ejecutar en Supabase

### 1. Acceder al SQL Editor de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. En el menú lateral, haz clic en **"SQL Editor"**
3. Haz clic en **"New query"** (Nueva consulta)

### 2. Ejecutar el Script

Copia y pega el contenido del archivo `add_weight_height_columns.sql` en el editor SQL:

```sql
-- Script para añadir columnas de peso y altura a la tabla profiles
-- Ejecutar este script en el SQL Editor de Supabase

-- Añadir columna de peso (en kg, permite decimales)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

-- Añadir columna de altura (en cm, número entero)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Añadir comentarios para documentación
COMMENT ON COLUMN profiles.weight IS 'Peso del usuario en kilogramos (kg). Ejemplo: 75.5';
COMMENT ON COLUMN profiles.height IS 'Altura del usuario en centímetros (cm). Ejemplo: 175';

-- Crear índices para mejorar el rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_profiles_weight ON profiles(weight);
CREATE INDEX IF NOT EXISTS idx_profiles_height ON profiles(height);
```

### 3. Ejecutar la Consulta

1. Haz clic en el botón **"Run"** (Ejecutar) o presiona `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)
2. Deberías ver el mensaje: **"Success. No rows returned"**

### 4. Verificar los Cambios

Ejecuta esta consulta para verificar que las columnas se crearon correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('weight', 'height');
```

Deberías ver un resultado como:

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| weight      | numeric   | YES         |
| height      | integer   | YES         |

### 5. Ver Datos (Opcional)

Para ver las nuevas columnas en la tabla de perfiles:

```sql
SELECT user_id, name, last_name, weight, height 
FROM profiles 
LIMIT 5;
```

---

## ✅ Cambios Realizados

### Base de Datos (Supabase)

- ✅ Nueva columna `weight` (DECIMAL(5,2)) - Peso en kilogramos con 2 decimales
- ✅ Nueva columna `height` (INTEGER) - Altura en centímetros
- ✅ Índices creados para optimizar consultas
- ✅ Comentarios añadidos para documentación

### Frontend (React)

**Archivo**: `frontend/src/pages/Settings.tsx`

- ✅ Añadidos campos de entrada para peso y altura
- ✅ Validación de formData con peso y altura
- ✅ Integración con el servicio de perfil

**Archivo**: `frontend/src/services/userProfile.ts`

- ✅ Añadido `weight` y `height` al interface `UpdateProfilePayload`
- ✅ Validaciones añadidas:
  - Peso: 0-300 kg
  - Altura: 0-250 cm

---

## 🎨 Interfaz de Usuario

Los nuevos campos aparecen en la sección **"Información Personal"** de Ajustes:

```
┌─────────────────────────────────────┐
│  Peso (kg)          Altura (cm)    │
│  [75.5____]         [175_____]     │
└─────────────────────────────────────┘
```

- **Peso**: Input numérico con decimales (step 0.1)
- **Altura**: Input numérico entero
- **Grid responsive**: 2 columnas en desktop, 1 en mobile

---

## 🔧 Uso en el Código

### Guardar peso y altura

```typescript
await updateMyProfile({
  name: 'Juan',
  last_name: 'Pérez',
  weight: 75.5,  // kg
  height: 175    // cm
});
```

### Leer peso y altura

```typescript
const profile = await getMyProfile();
console.log(profile.weight); // 75.5
console.log(profile.height); // 175
```

### Calcular IMC (Índice de Masa Corporal)

```typescript
if (profile.weight && profile.height) {
  const heightInMeters = profile.height / 100;
  const imc = profile.weight / (heightInMeters * heightInMeters);
  console.log('IMC:', imc.toFixed(1));
}
```

---

## 🚀 Próximas Mejoras (Opcional)

1. **Calculadora de IMC**: Mostrar IMC automático cuando se ingresen peso y altura
2. **Tracking de peso**: Guardar histórico de cambios de peso
3. **Gráficas de progreso**: Visualizar evolución del peso en el tiempo
4. **Objetivos de peso**: Integrar con el componente ActiveGoal
5. **Recomendaciones personalizadas**: Sugerir entrenamientos según peso/altura

---

## ⚠️ Notas Importantes

1. **Las columnas son opcionales** (NULL permitido) - No son obligatorias
2. **Los datos existentes no se ven afectados** - Las columnas se añaden vacías
3. **Validaciones en frontend y backend** - Seguridad doble capa
4. **Índices creados** - Optimización de consultas para futuros reportes

---

## 📝 Log de Cambios

**Fecha**: 22 de enero de 2026  
**Versión**: 1.1.0  
**Autor**: Development Team

### Archivos Modificados

- `database/add_weight_height_columns.sql` (NUEVO)
- `frontend/src/pages/Settings.tsx` (MODIFICADO)
- `frontend/src/services/userProfile.ts` (MODIFICADO)

### Archivos de Documentación

- `database/README_WEIGHT_HEIGHT.md` (NUEVO - este archivo)

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.
