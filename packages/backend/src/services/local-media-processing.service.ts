// packages/backend/src/services/local-media-processing.service.ts

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import sharp from 'sharp';
import localMediaService, { mediaFolders } from './local-media.service';
import { AppError } from '../utils/errors';

const execPromise = util.promisify(exec);

// Configuración
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const OPTIMIZED_DIR = path.join(__dirname, '../../uploads-optimized');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// Tamaños de imágenes
const imageSizes = {
  thumbnailWidth: 150,
  mobileWidth: 320,
  tabletWidth: 640
};

/**
 * Servicio para procesar y optimizar archivos multimedia
 */
export class LocalMediaProcessingService {
  /**
   * Procesa un GIF de ejercicio para optimizarlo
   * @param folder Carpeta del GIF
   * @param filename Nombre del archivo
   */
  async processExerciseGif(folder: string, filename: string): Promise<any> {
    try {
      const inputPath = path.join(UPLOAD_DIR, folder, filename);
      const fileExt = path.extname(filename);
      const baseName = path.basename(filename, fileExt);
      
      // Crear paths para versiones optimizadas
      const outputFolder = path.join(OPTIMIZED_DIR, folder);
      const optimizedGifPath = path.join(outputFolder, `${baseName}-optimized.gif`);
      const webpPath = path.join(outputFolder, `${baseName}.webp`);
      const mp4Path = path.join(outputFolder, `${baseName}.mp4`);
      
      // Asegurar que la carpeta existe
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      // Comando para optimizar GIF - requiere gifsicle instalado
      try {
        await execPromise(`gifsicle --optimize=3 --colors 256 -o "${optimizedGifPath}" "${inputPath}"`);
      } catch (error) {
        console.warn('Error optimizando GIF. ¿Está instalado gifsicle?', error);
        // Copiar el original como fallback
        fs.copyFileSync(inputPath, optimizedGifPath);
      }
      
      // Intentar crear WebP - requiere gif2webp (libwebp) instalado
      try {
        await execPromise(`gif2webp -mixed -q 80 -o "${webpPath}" "${optimizedGifPath}"`);
      } catch (error) {
        console.warn('Error creando WebP. ¿Está instalado gif2webp?', error);
        // Continuamos sin versión WebP
      }
      
      // Intentar crear MP4 - requiere ffmpeg instalado
      try {
        await execPromise(`ffmpeg -i "${optimizedGifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Path}"`);
      } catch (error) {
        console.warn('Error creando MP4. ¿Está instalado ffmpeg?', error);
        // Continuamos sin versión MP4
      }
      
      // Preparar resultado con URLs para las versiones que existan
      const result: any = {
        original: {
          key: `${folder}/${filename}`,
          url: localMediaService.getMediaUrl(folder, filename)
        },
        processed: {}
      };
      
      // Añadir versiones que se hayan creado correctamente
      if (fs.existsSync(optimizedGifPath)) {
        result.processed.gif = {
          key: `${folder}/${baseName}-optimized.gif`,
          url: localMediaService.getMediaUrl(folder, `${baseName}-optimized.gif`, true)
        };
      }
      
      if (fs.existsSync(webpPath)) {
        result.processed.webp = {
          key: `${folder}/${baseName}.webp`,
          url: localMediaService.getMediaUrl(folder, `${baseName}.webp`, true)
        };
      }
      
      if (fs.existsSync(mp4Path)) {
        result.processed.mp4 = {
          key: `${folder}/${baseName}.mp4`,
          url: localMediaService.getMediaUrl(folder, `${baseName}.mp4`, true)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error procesando GIF de ejercicio:', error);
      throw new AppError('Error al procesar GIF de ejercicio', 500);
    }
  }
  
  /**
   * Procesa una imagen para crear diferentes tamaños
   * @param folder Carpeta de la imagen
   * @param filename Nombre del archivo
   */
  async processImage(folder: string, filename: string): Promise<any> {
    try {
      const inputPath = path.join(UPLOAD_DIR, folder, filename);
      const fileExt = path.extname(filename);
      const baseName = path.basename(filename, fileExt);
      
      // Crear directorio de salida si no existe
      const outputFolder = path.join(OPTIMIZED_DIR, folder);
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      // Determinar formato de salida basado en extensión
      let format: keyof sharp.FormatEnum;
      
      if (fileExt.match(/\.(jpg|jpeg)$/i)) format = 'jpeg';
      else if (fileExt.match(/\.png$/i)) format = 'png';
      else if (fileExt.match(/\.webp$/i)) format = 'webp';
      else if (fileExt.match(/\.gif$/i)) format = 'gif';
      else format = 'jpeg'; // Default
      
      // Cargar imagen con sharp
      const image = sharp(inputPath);
      
      // Definir tamaños
      const sizes = {
        thumbnail: imageSizes.thumbnailWidth,
        mobile: imageSizes.mobileWidth,
        tablet: imageSizes.tabletWidth
      };
      
      // Resultado
      const result: any = {
        original: {
          key: `${folder}/${filename}`,
          url: localMediaService.getMediaUrl(folder, filename)
        },
        processed: {}
      };
      
      // Procesar cada tamaño
      for (const [size, width] of Object.entries(sizes)) {
        const outputPath = path.join(outputFolder, `${baseName}-${size}${fileExt}`);
        
        await image
          .clone()
          .resize(width)
          .toFile(outputPath);
        
        result.processed[size] = {
          key: `${folder}/${baseName}-${size}${fileExt}`,
          url: localMediaService.getMediaUrl(folder, `${baseName}-${size}${fileExt}`, true)
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw new AppError('Error al procesar imagen', 500);
    }
  }
  
  /**
   * Procesa un video para optimizarlo
   * @param folder Carpeta del video
   * @param filename Nombre del archivo
   */
  async processVideo(folder: string, filename: string): Promise<any> {
    try {
      const inputPath = path.join(UPLOAD_DIR, folder, filename);
      const fileExt = path.extname(filename);
      const baseName = path.basename(filename, fileExt);
      
      // Crear directorio de salida si no existe
      const outputFolder = path.join(OPTIMIZED_DIR, folder);
      const thumbnailFolder = path.join(OPTIMIZED_DIR, mediaFolders.thumbnails);
      
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      if (!fs.existsSync(thumbnailFolder)) {
        fs.mkdirSync(thumbnailFolder, { recursive: true });
      }
      
      // Paths de salida
      const thumbnailPath = path.join(thumbnailFolder, `${baseName}.jpg`);
      const optimizedPath = path.join(outputFolder, `${baseName}-optimized${fileExt}`);
      
      // Resultado base
      const result: any = {
        original: {
          key: `${folder}/${filename}`,
          url: localMediaService.getMediaUrl(folder, filename)
        },
        processed: {}
      };
      
      // Crear thumbnail usando ffmpeg
      try {
        await execPromise(`ffmpeg -i "${inputPath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`);
        
        result.processed.thumbnail = {
          key: `${mediaFolders.thumbnails}/${baseName}.jpg`,
          url: localMediaService.getMediaUrl(mediaFolders.thumbnails, `${baseName}.jpg`, true)
        };
      } catch (error) {
        console.warn('Error creando thumbnail de video:', error);
      }
      
      // Optimizar video
      try {
        await execPromise(`ffmpeg -i "${inputPath}" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart "${optimizedPath}"`);
        
        result.processed.video = {
          key: `${folder}/${baseName}-optimized${fileExt}`,
          url: localMediaService.getMediaUrl(folder, `${baseName}-optimized${fileExt}`, true)
        };
      } catch (error) {
        console.warn('Error optimizando video:', error);
      }
      
      return result;
    } catch (error) {
      console.error('Error procesando video:', error);
      throw new AppError('Error al procesar video', 500);
    }
  }
}

export default new LocalMediaProcessingService();