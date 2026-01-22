import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Avatar } from '@/components/common/Avatar';
import { updateMyProfile, updateMyAvatar } from '@/services/userProfile';
import { getMyLatestBodyMetric, insertBodyMetric } from '@/services/bodyMetrics';
import { GoalType } from '@/lib/supabase/types';

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
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [loadingWeight, setLoadingWeight] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    goal_type: '' as GoalType | '',
    goal_notes: '',
    goal_target_date: ''
  });

  // Cargar peso actual desde body_metrics
  useEffect(() => {
    const loadCurrentWeight = async () => {
      try {
        const latestMetric = await getMyLatestBodyMetric();
        if (latestMetric) {
          setCurrentWeight(latestMetric.weight_kg);
          setFormData(prev => ({
            ...prev,
            weight_kg: latestMetric.weight_kg.toString()
          }));
        }
      } catch (error) {
        console.error('[Settings] Error al cargar peso:', error);
      } finally {
        setLoadingWeight(false);
      }
    };

    loadCurrentWeight();
  }, []);

  // Sincronizar formData con profile cuando profile cambie
  useEffect(() => {
    if (profile) {
      console.log('[Settings] Syncing formData with profile:', profile);
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        date_of_birth: profile.date_of_birth || '',
        height_cm: profile.height_cm?.toString() || '',
        level: profile.level || 'beginner',
        goal_type: profile.goal_type || '',
        goal_notes: profile.goal_notes || '',
        goal_target_date: profile.goal_target_date || ''
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      
      const heightValue = formData.height_cm && formData.height_cm !== '' 
        ? parseInt(formData.height_cm.toString()) 
        : null;
      
      const weightValue = formData.weight_kg && formData.weight_kg !== '' 
        ? parseFloat(formData.weight_kg.toString()) 
        : null;
      
      console.log('[Settings] Altura:', formData.height_cm, '→', heightValue);
      console.log('[Settings] Peso:', formData.weight_kg, '→', weightValue);

      // 1. Actualizar perfil en users
      const updatedProfile = await updateMyProfile({
        name: formData.name,
        last_name: formData.last_name,
        phone: formData.phone || null,
        bio: formData.bio || null,
        date_of_birth: formData.date_of_birth || null,
        height_cm: heightValue,
        level: formData.level,
        goal_type: formData.goal_type || null,
        goal_notes: formData.goal_notes || null,
        goal_target_date: formData.goal_target_date || null,
        onboarding_completed: true  // Marcar onboarding como completado
      });

      console.log('[Settings] ✅ Perfil actualizado en BBDD:', updatedProfile);

      // 2. Si el peso cambió, insertar nueva métrica en body_metrics
      if (weightValue && weightValue !== currentWeight) {
        await insertBodyMetric({
          weight_kg: weightValue,
          height_cm: heightValue  // Opcionalmente guardar altura también
        });
        setCurrentWeight(weightValue);
        console.log('[Settings] ✅ Nueva métrica corporal guardada');
      }

      // 3. Refrescar profile desde BBDD para sincronizar
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
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200">
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
              <h1 className="text-2xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">Ajustes</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
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
        <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-4">Foto de Perfil</h2>
          
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
                  className="px-6 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
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
                    className="px-4 py-2 bg-dark-800 hover:bg-dark-700 disabled:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Tomar foto
                  </button>
                </div>
                <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500">
                  JPG, PNG o GIF. Max 2MB.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Apariencia */}
        <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-4">Apariencia</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-200 dark:text-dark-200 light:text-gray-900 font-medium">Tema</p>
              <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
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
        <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-4">Información Personal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-400 light:bg-gray-100 light:border-gray-300 light:text-gray-500 rounded-lg text-dark-400 cursor-not-allowed"
              />
              <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                El email no se puede cambiar
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Medidas físicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight_kg" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                  Peso (kg) {loadingWeight && <span className="text-xs text-dark-500">Cargando...</span>}
                </label>
                <input
                  type="number"
                  id="weight_kg"
                  name="weight_kg"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  placeholder="75.5"
                  step="0.1"
                  min="20"
                  max="300"
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                  Se guardará el historial de cambios
                </p>
              </div>

              <div>
                <label htmlFor="height_cm" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  id="height_cm"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleChange}
                  placeholder="175"
                  min="80"
                  max="250"
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Nivel de experiencia */}
            {profile.role === 'member' && (
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                  Nivel de Experiencia
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>
            )}

            {/* Objetivo de entrenamiento */}
            {profile.role === 'member' && (
              <>
                <div>
                  <label htmlFor="goal_type" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                    Objetivo Principal {!profile.onboarding_completed && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    id="goal_type"
                    name="goal_type"
                    value={formData.goal_type}
                    onChange={handleChange}
                    required={!profile.onboarding_completed}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecciona tu objetivo</option>
                    <option value="lose_fat">Perder grasa</option>
                    <option value="gain_muscle">Ganar músculo</option>
                    <option value="strength">Aumentar fuerza</option>
                    <option value="endurance">Mejorar resistencia</option>
                    <option value="mobility">Mejorar movilidad</option>
                    <option value="health">Salud general</option>
                  </select>
                  {!profile.onboarding_completed && (
                    <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                      Debes seleccionar un objetivo para completar tu perfil
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="goal_target_date" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                    Fecha Objetivo (opcional)
                  </label>
                  <input
                    type="date"
                    id="goal_target_date"
                    name="goal_target_date"
                    value={formData.goal_target_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                    ¿Cuándo quieres alcanzar tu objetivo?
                  </p>
                </div>

                <div>
                  <label htmlFor="goal_notes" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                    Notas sobre tu Objetivo (opcional)
                  </label>
                  <textarea
                    id="goal_notes"
                    name="goal_notes"
                    value={formData.goal_notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ej: Quiero perder 5 kg antes de mi boda, me cuesta mantener la constancia..."
                    maxLength={1000}
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                    {formData.goal_notes.length}/1000 caracteres
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">
                Biografía
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-100 light:bg-white light:border-gray-300 light:text-gray-900 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <p className="text-xs text-dark-500 dark:text-dark-500 light:text-gray-500 mt-1">
                {formData.bio.length}/500 caracteres
              </p>
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
                className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 font-medium rounded-lg transition-colors"
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
