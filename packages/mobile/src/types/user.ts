// packages/mobile/src/types/user.ts
export interface User {
    id: string;
    name: string;
    email: string;
    // Añade aquí más campos según la estructura de tu usuario
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface UserProfile extends User {
    // Campos adicionales que puedan venir en el perfil
    weight?: number;
    height?: number;
    fitnessLevel?: string;
    goals?: string[];
  }