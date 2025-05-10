// packages/mobile/src/utils/errorHandling.ts

import axios, { AxiosError } from 'axios';

/**
 * Maneja errores de API de forma consistente
 * @param error Error capturado en el catch
 * @param defaultMessage Mensaje por defecto a mostrar
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'Error en la operación'): Error => {
  // Si es un error de Axios, extraer información relevante
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Respuesta del servidor disponible
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      // Intentar extraer mensaje de error del backend
      let errorMessage;
      try {
        if (axiosError.response.data) {
          const data = axiosError.response.data as any;
          errorMessage = data.message || data.error || JSON.stringify(data);
        }
      } catch {
        errorMessage = defaultMessage;
      }
      
      return new Error(`Error ${status}: ${errorMessage || defaultMessage}`);
    }
    
    // Errores de red u otros errores de Axios
    if (axiosError.request) {
      return new Error(`Error de red: No se recibió respuesta del servidor`);
    }
    
    // Errores de configuración
    return new Error(`Error de configuración: ${axiosError.message}`);
  }
  
  // Si es un error normal, devolverlo como está o convertirlo a Error
  if (error instanceof Error) {
    return error;
  }
  
  // Para cualquier otro tipo de error, crear un nuevo Error
  return new Error(defaultMessage);
};