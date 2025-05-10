// packages/shared/src/types/auth.types.ts
import { User } from './user.types';

/**
 * Estado del slice de autenticación en Redux
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Credenciales para el login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Datos para el registro de usuario
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  profile?: {
    displayName?: string;
    [key: string]: any;
  };
}

/**
 * Respuesta de la API para autenticación
 */
export interface AuthResponse {
  status: string;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Datos de usuario actualizados
 */
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  birthdate?: string;
  gender?: string;
  weight?: number;
  height?: number;
  fitnessLevel?: string;
  goals?: string[];
  equipmentAvailable?: string[];
  bio?: string;
}