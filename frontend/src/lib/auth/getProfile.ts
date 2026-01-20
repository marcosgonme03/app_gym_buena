import { supabase } from '../supabase/client';
import { UserProfile } from '../supabase/types';

/**
 * Obtiene el perfil del usuario desde public.users
 * IMPORTANTE: Nunca confiar en metadata de auth, siempre leer de public.users
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log('[getProfile] Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getProfile] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // CRÍTICO: Si hay error, NO usar fallback - el usuario debe arreglar su BD
      console.error('[getProfile] ❌ NO SE PUDO CARGAR EL PERFIL DESDE LA BD');
      console.error('[getProfile] Ve a Supabase Dashboard y verifica:');
      console.error('[getProfile] 1. Tabla "users" tiene un registro con user_id:', userId);
      console.error('[getProfile] 2. El registro tiene un "role" asignado');
      console.error('[getProfile] 3. Las RLS policies están correctas (ejecuta fix-rls-recursion.sql)');
      
      return null;
    }

    console.log('[getProfile] ✅ Profile loaded successfully:', {
      user_id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role
    });
    
    return data as UserProfile;
  } catch (err) {
    console.error('[getProfile] Unexpected error:', err);
    return null;
  }
}

/**
 * Obtiene la sesión actual y el perfil del usuario
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { session: null, profile: null, error: sessionError };
    }

    const profile = await getUserProfile(session.user.id);

    if (!profile) {
      return {
        session,
        profile: null,
        error: new Error('Profile not found in database. Contact support.'),
      };
    }

    return { session, profile, error: null };
  } catch (err) {
    console.error('[getCurrentUser] Error:', err);
    return { session: null, profile: null, error: err as Error };
  }
}
