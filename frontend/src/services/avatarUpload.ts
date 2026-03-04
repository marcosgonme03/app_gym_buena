/**
 * avatarUpload — Servicio para subir / reemplazar el avatar de un usuario.
 *
 * Centraliza la lógica de Supabase Storage que estaba duplicada en Settings.tsx
 * (funciones handleAvatarUpload y handleCapture hacían exactamente lo mismo).
 *
 * NOTA: No modifica ningún esquema SQL. Sólo gestiona el bucket 'avatars'.
 */

import { supabase } from '@/lib/supabase/client';
import { updateMyAvatar } from '@/services/userProfile';

export interface AvatarUploadResult {
  publicUrl: string;
}

/**
 * Sube un blob/File como nuevo avatar del usuario, eliminando los archivos
 * anteriores del mismo directorio en el bucket 'avatars'.
 *
 * @param userId    UUID del usuario (usado como prefijo de carpeta en el bucket)
 * @param file      Blob o File a subir
 * @param fileName  Ruta completa en el bucket, ej: "uuid/avatar.jpg"
 * @param contentType  MIME type del archivo (default: 'image/jpeg')
 */
export async function uploadAvatar(
  userId: string,
  file: Blob | File,
  fileName: string,
  contentType = 'image/jpeg'
): Promise<AvatarUploadResult> {
  // 1. Eliminar archivos anteriores del directorio del usuario
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(userId);

  if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filesToRemove);
  }

  // 2. Subir el nuevo archivo
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true, contentType });

  if (uploadError) {
    throw new Error(`Error al subir imagen: ${uploadError.message}`);
  }

  // 3. Obtener URL pública con cache-buster para forzar recarga
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

  // 4. Persistir URL en la base de datos
  await updateMyAvatar(avatarUrlWithCache);

  return { publicUrl: avatarUrlWithCache };
}
