export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'El email es obligatorio';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El formato del email no es válido';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  return null;
};
