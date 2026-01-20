import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Avatar } from '@/components/common/Avatar';
import { updateMyProfile, updateMyAvatar } from '@/services/userProfile';

export const Settings: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    date_of_birth: ''
  });

  // 🔥 CRÍTICO: Sincronizar formData con profile cuando profile cambie
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
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    setMessage(null);

    try {
      console.log('[Settings] Guardando cambios:', formData);

      // Usar servicio de perfil con validaciones
      const updatedProfile = await updateMyProfile({
        name: formData.name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        bio: formData.bio || null,
        date_of_birth: formData.date_of_birth || null
      });

      console.log('[Settings] ✅ Perfil actualizado en BBDD:', updatedProfile);

      // Refrescar profile desde BBDD para sincronizar
      await refreshProfile();
      
      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
      
      // Auto-ocultar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('[Settings] ❌ Error al guardar:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al actualizar el perfil. Verifica los datos e intenta de nuevo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraStream(stream);
      setShowCamera(true);
    } catch (error) {
      console.error('[Settings] Error al acceder a la cámara:', error);
      setMessage({ type: 'error', text: 'No se pudo acceder a la cámara' });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !profile) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    // Convertir canvas a blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploadingAvatar(true);
      stopCamera();

      try {
        const fileName = `${profile.user_id}/avatar.jpg`;

        // Eliminar avatar anterior
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(profile.user_id);

        if (existingFiles && existingFiles.length > 0) {
          const filesToRemove = existingFiles.map(x => `${profile.user_id}/${x.name}`);
          await supabase.storage.from('avatars').remove(filesToRemove);
        }

        // Subir nueva foto
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const avatarUrlWithCache = publicUrl + '?t=' + Date.now();

        // Actualizar en base de datos usando servicio
        await updateMyAvatar(avatarUrlWithCache);

        await refreshProfile();
        setMessage({ type: 'success', text: '¡Foto capturada correctamente!' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error: any) {
        console.error('[Settings] Error al capturar foto:', error);
        setMessage({ type: 'error', text: error.message || 'Error al capturar la foto' });
      } finally {
        setUploadingAvatar(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;

    const file = e.target.files[0];
    
    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar 2MB' });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.user_id}/avatar.${fileExt}`;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      console.log('[Settings] Subiendo avatar:', fileName);

      // Eliminar avatar anterior si existe
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(profile.user_id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToRemove = existingFiles.map(x => `${profile.user_id}/${x.name}`);
        await supabase.storage.from('avatars').remove(filesToRemove);
      }

      // Subir nuevo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública con timestamp para evitar cache
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrlWithCache = publicUrl + '?t=' + Date.now();

      // Actualizar URL en la base de datos usando servicio
      await updateMyAvatar(avatarUrlWithCache);

      await refreshProfile();
      setMessage({ type: 'success', text: '¡Foto actualizada correctamente!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('[Settings] Error al subir foto:', error);
      setMessage({ type: 'error', text: error.message || 'Error al subir la foto' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!profile) return null;

  const getDashboardRoute = () => {
    switch (profile.role) {
      case 'admin': return '/admin';
      case 'trainer': return '/trainer';
      case 'member': return '/app';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(getDashboardRoute())}
                className="text-dark-400 hover:text-dark-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-dark-50">Ajustes</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje de éxito/error */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Foto de perfil */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-4">Foto de Perfil</h2>
          
          {showCamera ? (
            <div className="space-y-4">
              <div className="relative bg-dark-950 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md mx-auto"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={uploadingAvatar}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 text-white rounded-lg transition-colors"
                >
                  {uploadingAvatar ? 'Procesando...' : 'Capturar'}
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Avatar
                src={(profile as any)?.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="xl"
              />
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 text-white rounded-lg transition-colors"
                  >
                    {uploadingAvatar ? 'Subiendo...' : 'Subir foto'}
                  </button>
                  <button
                    onClick={startCamera}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-dark-800 hover:bg-dark-700 disabled:bg-dark-700 text-dark-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tomar foto
                  </button>
                </div>
                <p className="text-xs text-dark-500">
                  JPG, PNG o GIF. Max 2MB.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Apariencia */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-4">Apariencia</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-200 font-medium">Tema</p>
              <p className="text-sm text-dark-400">
                {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary-500' : 'bg-dark-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Información personal */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-50 mb-4">Información Personal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-dark-300 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-400 cursor-not-allowed"
              />
              <p className="text-xs text-dark-500 mt-1">
                El email no se puede cambiar
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-dark-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-dark-300 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-dark-300 mb-2">
                Biografía
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Cuéntanos sobre ti..."
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-700 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => navigate(getDashboardRoute())}
                className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-200 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
