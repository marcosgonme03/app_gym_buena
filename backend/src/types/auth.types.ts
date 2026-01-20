export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'trainer' | 'member';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
