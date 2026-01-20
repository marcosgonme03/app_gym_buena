/**
 * Servicio de perfil de usuario
 * Gestiona todas las operaciones CRUD del perfil en public.users
 * Incluye validaciones y manejo de errores robusto
 */

import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';

export interface UpdateProfilePayload {
  name?: string;
  last_name?: string;
  phone?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
}

export interface ProfileServiceError {
  message: string;
  field?: string;
  code?: string;
}

/**
 * Validar payload antes de enviar a Supabase
 */
function validateProfilePayload(payload: UpdateProfilePayload): ProfileServiceError | null {
  // Validar teléfono
  if (payload.phone && payload.phone.trim()) {
    const phoneClean = payload.phone.replace(/\s/g, '');
    if (phoneClean.length < 9 || phoneClean.length > 20) {
      return { message: 'El teléfono debe tener entre 9 y 20 caracteres', field: 'phone' };
    }
  }

  // Validar bio
  if (payload.bio && payload.bio.length > 500) {
    return { message: 'La biografía no puede superar 500 caracteres', field: 'bio' };
  }

  // Validar fecha de nacimiento
  if (payload.date_of_birth && payload.date_of_birth.trim()) {
    const date = new Date(payload.date_of_birth);
    if (isNaN(date.getTime())) {
      return { message: 'Fecha de nacimiento inválida', field: 'date_of_birth' };
    }
    
    // No permitir fechas futuras
    if (date > new Date()) {
      return { message: 'La fecha de nacimiento no puede ser futura', field: 'date_of_birth' };
    }

    // No permitir fechas muy antiguas (más de 120 años)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 120);
    if (date < minDate) {
      return { message: 'Fecha de nacimiento demasiado antigua', field: 'date_of_birth' };
    }
  }

  // Validar nombre
  if (payload.name !== undefined) {
    const nameTrimmed = payload.name.trim();
    if (!nameTrimmed) {
      return { message: 'El nombre es obligatorio', field: 'name' };
    }
    if (nameTrimmed.length < 2) {
      return { message: 'El nombre debe tener al menos 2 caracteres', field: 'name' };
    }
    if (nameTrimmed.length > 50) {
      return { message: 'El nombre no puede superar 50 caracteres', field: 'name' };
    }
  }

  // Validar apellido
  if (payload.last_name !== undefined && payload.last_name.trim()) {
    const lastNameTrimmed = payload.last_name.trim();
    if (lastNameTrimmed.length > 50) {
      return { message: 'El apellido no puede superar 50 caracteres', field: 'last_name' };
    }
  }

  return null;
}

/**
 * Obtener perfil del usuario autenticado
 * Lee directamente desde public.users usando auth.uid()
 */
export async function getMyProfile(): Promise<UserProfile | null> {
  try {
    console.log('[ProfileService] Fetching profile...');

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[ProfileService] No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[ProfileService] Error fetching profile:', error);
      throw new Error(`Error al cargar perfil: ${error.message}`);
    }

    if (!data) {
      console.error('[ProfileService] Profile not found for user:', user.id);
      return null;
    }

    console.log('[ProfileService] Profile loaded:', { user_id: data.user_id, role: data.role });
    return data as UserProfile;
  } catch (error: any) {
    console.error('[ProfileService] Unexpected error:', error);
    throw error;
  }
}

/**
 * Actualizar perfil del usuario autenticado
 * Solo actualiza el registro que pertenece al usuario (RLS automático)
 */
export async function updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  try {
    console.log('[ProfileService] Updating profile:', payload);

    // Validar payload
    const validationError = validateProfilePayload(payload);
    if (validationError) {
      throw new Error(validationError.message);
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Preparar datos para actualizar
    // Convertir strings vacías a null para campos opcionales
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }

    if (payload.last_name !== undefined) {
      updateData.last_name = payload.last_name.trim() || null;
    }

    if (payload.phone !== undefined) {
      updateData.phone = payload.phone && payload.phone.trim() ? payload.phone.trim() : null;
    }

    if (payload.bio !== undefined) {
      updateData.bio = payload.bio && payload.bio.trim() ? payload.bio.trim() : null;
    }

    if (payload.date_of_birth !== undefined) {
      updateData.date_of_birth = payload.date_of_birth && payload.date_of_birth.trim() 
        ? payload.date_of_birth.trim() 
        : null;
    }

    console.log('[ProfileService] Update data prepared:', updateData);

    // Ejecutar UPDATE con .select() para obtener el resultado
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[ProfileService] Update error:', error);
      
      // Mensajes de error más amigables
      if (error.code === 'PGRST301') {
        throw new Error('No se encontró el perfil del usuario');
      }
      if (error.code === '42501') {
        throw new Error('No tienes permisos para actualizar este perfil');
      }
      
      throw new Error(`Error al actualizar: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se recibió confirmación de la actualización');
    }

    console.log('[ProfileService] Profile updated successfully:', { user_id: data.user_id });
    return data as UserProfile;
  } catch (error: any) {
    console.error('[ProfileService] Update failed:', error);
    throw error;
  }
}

/**
 * Actualizar avatar del usuario
 */
export async function updateMyAvatar(avatarUrl: string): Promise<void> {
  try {
    console.log('[ProfileService] Updating avatar URL:', avatarUrl);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('[ProfileService] Avatar update error:', error);
      throw new Error(`Error al actualizar avatar: ${error.message}`);
    }

    console.log('[ProfileService] Avatar updated successfully');
  } catch (error: any) {
    console.error('[ProfileService] Avatar update failed:', error);
    throw error;
  }
}
