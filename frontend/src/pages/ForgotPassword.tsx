import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '@/components/auth/AuthCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateEmail } from '@/utils/validation';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setIsLoading(true);
    
    // Simular llamada API
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 800);
  };

  if (isSuccess) {
    return (
      <AuthCard
        title="Revisa tu email"
        subtitle="Te hemos enviado instrucciones para restablecer tu contraseña"
      >
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm text-center">
            Si existe una cuenta con el email <strong>{email}</strong>, recibirás un correo con instrucciones.
          </div>
          
          <Link to="/login">
            <Button fullWidth variant="secondary">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Introduce tu email y te enviaremos instrucciones"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={error}
          placeholder="tu@email.com"
          autoComplete="email"
          required
        />
        
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
        </Button>
        
        <div className="text-center pt-4 border-t border-dark-700">
          <Link
            to="/login"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors focus-ring rounded"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthCard>
  );
};
