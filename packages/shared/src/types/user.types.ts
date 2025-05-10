/**
 * Interfaz para el perfil del usuario
 */
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  // Otros campos de perfil según sea necesario
  bio?: string;
  avatar?: string;
}

/**
 * Interfaz para tokens de autenticación
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Interfaz para el modelo de usuario
 */
export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  emailVerified: boolean;
}

/**
 * Interfaz para la respuesta de autenticación
 */
export interface UserAuthResponse {
  user: User;
  tokens: Tokens;
}

// Extiende la interfaz Request de Express para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}
export interface IUser {
  email: string;
  password: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    // Otros campos del perfil
  };
  emailVerified: boolean; // Añadido
  // Otros campos del usuario
}