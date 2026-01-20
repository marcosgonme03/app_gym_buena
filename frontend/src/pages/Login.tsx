import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateEmail, validatePassword } from '@/utils/validation';
import { supabase } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/auth/getProfile';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    setErrors({
      email: emailError || '',
      password: passwordError || '',
    });
    
    return !emailError && !passwordError;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    console.log('[Login] Starting login...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('[Login] Error:', error.message);
        setApiError(error.message || 'Credenciales inválidas');
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setApiError('Error al iniciar sesión');
        setIsLoading(false);
        return;
      }

      console.log('[Login] Auth successful, fetching profile...');
      
      // Obtener perfil para redirección correcta
      const profile = await getUserProfile(data.user.id);

      if (!profile) {
        setApiError('Perfil no encontrado. Contacta con soporte.');
        setIsLoading(false);
        return;
      }

      console.log('[Login] Profile loaded, role:', profile.role);

      // Redirigir según role
      const redirectMap = {
        admin: '/admin',
        trainer: '/trainer',
        member: '/app',
      };

      const targetRoute = redirectMap[profile.role];
      console.log('[Login] Redirecting to:', targetRoute);
      
      navigate(targetRoute);
    } catch (error) {
      console.error('[Login] Unexpected error:', error);
      setApiError('Error de conexión');
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="GymFlow"
      subtitle="Accede a tu zona privada"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {apiError && (
          <div 
            className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm"
            role="alert"
          >
            {apiError}
          </div>
        )}
        
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />
        
        <Input
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        
        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors focus-ring rounded"
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </div>
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Button>
        
        <div className="text-center pt-4 border-t border-dark-700">
          <p className="text-sm text-dark-400">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors focus-ring rounded"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
};
