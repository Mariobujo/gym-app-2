import api from './api';
import { handleApiError } from '../utils/errorHandling';
import { MediaType, MediaConfirmResponse, ExerciseGifsResponse } from '../types/media.types';

/**
 * Cliente API para medios locales
 */
export class LocalMediaApi {
  /**
   * Sube un archivo multimedia
   * @param fileUri URI local del archivo
   * @param fileName Nombre original
   * @param folder Carpeta destino
   * @param mediaType Tipo de media
   */
  async uploadMedia(
    fileUri: string,
    fileName: string,
    folder: string,
    mediaType: MediaType
  ): Promise<MediaConfirmResponse> {
    try {
      // Crear formData para envío multipart
      const formData = new FormData();
      
      // Añadir archivo al formData
      // En React Native, necesitamos usar un objeto especial
      const fileObject: any = {
        uri: fileUri,
        name: fileName,
        type: this.getMimeType(fileName, mediaType)
      };
      
      formData.append('file', fileObject);
      
      // Hacer la petición
      const response = await api.post(`/local-media/upload?folder=${folder}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error en subida de archivo:', error);
      throw handleApiError(error, 'Error al subir archivo');
    }
  }
  
  /**
   * Obtiene todos los GIFs de ejercicios
   */
  async getExerciseGifs(): Promise<ExerciseGifsResponse> {
    try {
      const response = await api.get('/local-media/exercise-gifs');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Error al obtener GIFs de ejercicios');
    }
  }
  
  /**
   * Obtiene el MIME type basado en el tipo de archivo
   */
  private getMimeType(fileName: string, mediaType: MediaType): string {
    if (mediaType === 'gif') {
      return 'image/gif';
    }
    
    if (mediaType === 'image') {
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        return 'image/jpeg';
      } else if (fileName.endsWith('.png')) {
        return 'image/png';
      } else if (fileName.endsWith('.webp')) {
        return 'image/webp';
      }
      return 'image/jpeg'; // Por defecto
    }
    
    if (mediaType === 'video') {
      if (fileName.endsWith('.mp4')) {
        return 'video/mp4';
      } else if (fileName.endsWith('.webm')) {
        return 'video/webm';
      }
      return 'video/mp4'; // Por defecto
    }
    
    return 'application/octet-stream'; // Tipo genérico
  }
}

export default new LocalMediaApi();