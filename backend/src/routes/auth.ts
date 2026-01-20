import { Router, Request, Response } from 'express';
import { LoginRequest, AuthResponse } from '../types/auth.types.js';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * POST /api/auth/login
 * Login con Supabase Auth
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  // Validación básica
  const errors: Record<string, string[]> = {};

  if (!email) {
    errors.email = ['El email es obligatorio'];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = ['El formato del email no es válido'];
  }

  if (!password) {
    errors.password = ['La contraseña es obligatoria'];
  } else if (password.length < 6) {
    errors.password = ['La contraseña debe tener al menos 6 caracteres'];
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Errores de validación',
      errors,
    });
  }

  try {
    // Login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AUTH] Error en login:', error.message);
      return res.status(401).json({
        message: 'Credenciales inválidas',
        errors: {
          general: [error.message],
        },
      });
    }

    if (!data.user || !data.session) {
      return res.status(401).json({
        message: 'No se pudo autenticar el usuario',
      });
    }

    // Obtener perfil del usuario desde public.users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.warn('[AUTH] Perfil no encontrado:', profileError.message);
    }

    const response: AuthResponse = {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: userProfile?.name || 'Usuario',
        role: userProfile?.role || 'member',
      },
    };

    console.log(`[AUTH] Login exitoso para: ${email} (${userProfile?.role || 'sin rol'})`);

    res.status(200).json(response);
  } catch (err) {
    console.error('[AUTH] Error inesperado:', err);
    res.status(500).json({
      message: 'Error interno del servidor',
    });
  }
});

/**
 * POST /api/auth/register
 * Registro con Supabase Auth
 */
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, lastName } = req.body;

  // Validaciones
  if (!email || !password || !name) {
    return res.status(400).json({
      message: 'Email, contraseña y nombre son obligatorios',
    });
  }

  try {
    // Registrar en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          last_name: lastName || '',
        },
      },
    });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(201).json({
      message: 'Usuario registrado correctamente. Revisa tu email para confirmar.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err) {
    console.error('[AUTH] Error en registro:', err);
    res.status(500).json({
      message: 'Error al registrar usuario',
    });
  }
});

export default router;
