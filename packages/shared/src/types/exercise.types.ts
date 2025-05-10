// Añadir o modificar la interfaz de Exercise para incluir el campo media
export interface Exercise {
    id: string;
    name: string;
    description: string;
    // Otros campos existentes...
    
    // Nuevo campo para media
    media?: {
      gif?: { key: string; url: string };
      webp?: { key: string; url: string };
      mp4?: { key: string; url: string };
    };
  }