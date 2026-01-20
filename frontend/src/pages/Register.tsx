import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateEmail, validatePassword } from '@/utils/validation';
import { supabase } from '@/lib/supabase/client';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const nameError = !formData.name ? 'El nombre es obligatorio' : '';
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = 
      formData.password !== formData.confirmPassword 
        ? 'Las contraseñas no coinciden' 
        : '';
    const acceptTermsError = !formData.acceptTerms 
      ? 'Debes aceptar los términos y condiciones' 
      : '';
    
    setErrors({
      name: nameError,
      email: emailError || '',
      password: passwordError || '',
      confirmPassword: confirmPasswordError,
      acceptTerms: acceptTermsError,
    });
    
    return !nameError && !emailError && !passwordError && !confirmPasswordError && !acceptTermsError;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Registro con Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            last_name: '',
          },
        },
      });

      if (error) {
        setApiError(error.message || 'Error al crear la cuenta');
        setIsLoading(false);
        return;
      }

      // Registro exitoso
      console.log('Registro exitoso:', data);
      alert('¡Cuenta creada! Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      console.error('Error en registro:', error);
      setApiError('Error de conexión con el servidor');
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Únete a GymFlow hoy"
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
          label="Nombre completo"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Juan Pérez"
          autoComplete="name"
          required
        />
        
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
          autoComplete="new-password"
          helperText="Mínimo 6 caracteres"
          required
        />
        
        <Input
          label="Confirmar contraseña"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
        
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 cursor-pointer"
            />
            <span className="text-sm text-dark-300 group-hover:text-dark-200 transition-colors">
              Acepto los{' '}
              <a 
                href="/terminos" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
                onClick={(e) => e.stopPropagation()}
              >
                términos y condiciones
              </a>
              {' '}y la{' '}
              <a 
                href="/privacidad" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
                onClick={(e) => e.stopPropagation()}
              >
                política de privacidad
              </a>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.acceptTerms}
            </p>
          )}
        </div>
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        
        <div className="text-center pt-4 border-t border-dark-700">
          <p className="text-sm text-dark-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors focus-ring rounded"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
};
