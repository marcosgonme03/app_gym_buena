# GymFlow - Módulo de Autenticación

Aplicación profesional de gimnasio con módulo de login completo. Este proyecto está dividido en frontend (React + TypeScript + Tailwind) y backend (Node.js + Express + TypeScript).

## 📁 Estructura del Proyecto

```
app_gym_buena/
├── frontend/          # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthCard.tsx      # Card reutilizable para auth
│   │   │   └── ui/
│   │   │       ├── Button.tsx        # Botón personalizado
│   │   │       └── Input.tsx         # Input personalizado
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Panel principal (mock)
│   │   │   ├── ForgotPassword.tsx    # Recuperar contraseña
│   │   │   ├── Login.tsx             # Página de login
│   │   │   └── Register.tsx          # Registro de usuario
│   │   ├── types/
│   │   │   └── auth.ts               # Tipos TypeScript
│   │   ├── utils/
│   │   │   └── validation.ts         # Validaciones
│   │   ├── App.tsx                   # Router principal
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Estilos globales
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── backend/           # Node.js + Express + TypeScript
    ├── src/
    │   ├── config/
    │   │   └── env.ts                # Configuración de entorno
    │   ├── middleware/
    │   │   └── errorHandler.ts       # Manejo de errores
    │   ├── routes/
    │   │   └── auth.ts               # Rutas de autenticación
    │   ├── types/
    │   │   └── auth.types.ts         # Tipos TypeScript
    │   └── index.ts                  # Servidor Express
    ├── .env                          # Variables de entorno
    ├── .env.example                  # Ejemplo de variables
    ├── package.json
    └── tsconfig.json
```

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ y npm
- Git (opcional)

### 1️⃣ Instalar dependencias

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2️⃣ Arrancar el proyecto

**Opción A: Arrancar ambos servicios (recomendado)**

En dos terminales diferentes:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

El backend arrancará en: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El frontend arrancará en: `http://localhost:5173`

**Opción B: Scripts desde la raíz (Windows)**

Si estás en la raíz del proyecto, puedes usar:

**PowerShell:**
```powershell
# Backend
cd backend; npm run dev

# Frontend (en otra terminal)
cd frontend; npm run dev
```

### 3️⃣ Probar la aplicación

1. Abre tu navegador en `http://localhost:5173`
2. Verás la pantalla de login de GymFlow
3. Prueba el health check del backend: `http://localhost:3001/health`

## 🧪 Pruebas Manuales

### Login
- Email: cualquier email válido (ej: `test@test.com`)
- Password: mínimo 6 caracteres (ej: `123456`)
- Al hacer login exitoso, navegarás al Dashboard

### Validaciones
- Email inválido: muestra error "El formato del email no es válido"
- Contraseña corta: muestra error "La contraseña debe tener al menos 6 caracteres"
- Campos vacíos: muestra errores correspondientes

### Navegación
- `/login` → Página de login
- `/register` → Registro de usuario
- `/forgot-password` → Recuperar contraseña
- `/dashboard` → Panel principal (después de login)

## 🎨 Características de Diseño

- ✅ **Diseño profesional y moderno** con gradientes sutiles
- ✅ **Responsive** para móvil y desktop
- ✅ **Modo oscuro** por defecto
- ✅ **Efectos glass** en tarjetas
- ✅ **Animaciones suaves** en botones y transiciones
- ✅ **Accesibilidad**: labels, focus visible, navegación por teclado
- ✅ **Sin componentes externos** (control total del código)
- ✅ **Validación en tiempo real** con mensajes claros

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev      # Modo desarrollo (Vite)
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Linter
```

### Backend
```bash
npm run dev      # Modo desarrollo con hot-reload
npm run build    # Compilar TypeScript
npm start        # Ejecutar build compilado
npm run lint     # Linter
```

## 🌐 Endpoints del Backend

### Health Check
```http
GET /health
```

**Response 200:**
```json
{
  "ok": true,
  "service": "gym-backend",
  "timestamp": "2026-01-20T...",
  "environment": "development"
}
```

### Login (Mock)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "token": "mock-jwt-token-1234567890",
  "user": {
    "id": "user-abc123",
    "email": "test@test.com",
    "name": "Usuario Demo"
  }
}
```

**Response 400 (Errores de validación):**
```json
{
  "message": "Errores de validación",
  "errors": {
    "email": ["El formato del email no es válido"],
    "password": ["La contraseña debe tener al menos 6 caracteres"]
  }
}
```

## 🔐 Variables de Entorno

El backend usa las siguientes variables (ver `backend/.env`):

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🔄 Próximos Pasos: Integración con Base de Datos

Actualmente, el proyecto usa **mocks** para simular autenticación. Para conectar una base de datos real:

### 1. Instalar dependencias de BD

**Opción PostgreSQL:**
```bash
cd backend
npm install pg @types/pg
# O con ORM:
npm install prisma @prisma/client
```

**Opción MySQL:**
```bash
npm install mysql2
# O con ORM:
npm install sequelize
```

### 2. Configurar conexión

Añadir a `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/gymflow"
# O para MySQL:
# DATABASE_URL="mysql://user:password@localhost:3306/gymflow"
```

### 3. Crear modelos y migraciones

**Con Prisma:**
```bash
npx prisma init
npx prisma migrate dev --name init
```

### 4. Implementar servicios reales

Crear `backend/src/services/authService.ts`:
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(email: string, password: string) {
    // 1. Buscar usuario en BD
    const user = await db.user.findUnique({ where: { email } });
    
    // 2. Verificar contraseña
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Credenciales inválidas');
    }
    
    // 3. Generar JWT real
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    
    return { token, user };
  }
}
```

### 5. Actualizar rutas

Reemplazar el mock en `backend/src/routes/auth.ts` con llamadas al servicio real:
```typescript
const authService = new AuthService();
const result = await authService.login(email, password);
```

### 6. Implementar middleware de autenticación

Para proteger rutas:
```typescript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No autorizado' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### 7. Integrar en frontend

Actualizar `frontend/src/pages/Login.tsx` para llamar al API real:
```typescript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

if (response.ok) {
  const data = await response.json();
  localStorage.setItem('token', data.token);
  navigate('/dashboard');
}
```

## 📝 Notas Técnicas

- **No hay credenciales reales** en el código
- El token JWT es un **mock** (sin validación)
- Las validaciones son solo en **cliente y mock en servidor**
- Para producción, implementar:
  - Autenticación real con BD
  - Encriptación de contraseñas (bcrypt)
  - JWT real con secret
  - Rate limiting
  - HTTPS
  - Refresh tokens

## 🆘 Troubleshooting

**Puerto en uso:**
```bash
# Cambiar puerto en backend/.env
PORT=3002

# O en frontend/vite.config.ts
server: { port: 5174 }
```

**CORS errors:**
- Verificar que `FRONTEND_URL` en `backend/.env` coincida con la URL del frontend
- Verificar que el backend esté corriendo

**Módulos no encontrados:**
```bash
# Reinstalar dependencias
cd frontend && npm install
cd backend && npm install
```

## 📄 Licencia

Este proyecto es un TFG/proyecto educativo.

---

**Desarrollado con ❤️ para GymFlow**
