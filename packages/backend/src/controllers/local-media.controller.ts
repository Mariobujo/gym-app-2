// packages/backend/src/controllers/local-media.controller.ts

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import localMediaService, { upload, mediaFolders } from '../services/local-media.service';
import localMediaProcessingService from '../services/local-media-processing.service';
import { AppError } from '../utils/errors';

/**
 * Controlador para manejar operaciones de media en local
 */
export class LocalMediaController {
  /**
   * Middleware para subir archivo
   */
  uploadFile = upload.single('file');
  
  /**
   * Procesa un archivo recién subido
   */
  async processUploadedFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No se ha subido ningún archivo', 400);
      }
      
      const { folder } = req.query;
      if (!folder || typeof folder !== 'string') {
        throw new AppError('No se ha especificado la carpeta', 400);
      }
      
      // Obtener información del archivo
      const { filename, mimetype, path: filePath } = req.file;
      
      // Procesar archivo según su tipo y carpeta
      let result;
      
      if (folder === mediaFolders.exerciseGifs && mimetype === 'image/gif') {
        // Procesar GIF para ejercicios
        result = await localMediaProcessingService.processExerciseGif(folder, filename);
      } else if (mimetype.startsWith('image/')) {
        // Procesar imagen
        result = await localMediaProcessingService.processImage(folder, filename);
      } else if (mimetype.startsWith('video/')) {
        // Procesar video
        result = await localMediaProcessingService.processVideo(folder, filename);
      } else {
        // Tipo no soportado para procesamiento
        result = {
          original: {
            key: `${folder}/${filename}`,
            url: localMediaService.getMediaUrl(folder, filename)
          }
        };
      }
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todos los GIFs de ejercicios
   */
  async getExerciseGifs(req: Request, res: Response, next: NextFunction) {
    try {
      const gifs = localMediaService.getExerciseGifs();
      
      // Agrupar por baseName para tener todos los formatos juntos
      const groupedGifs: Record<string, any> = {};
      
      gifs.forEach(gif => {
        if (!groupedGifs[gif.baseName]) {
          groupedGifs[gif.baseName] = {
            gif: null,
            webp: null,
            mp4: null
          };
        }
        
        if (gif.key.endsWith('.gif')) {
          groupedGifs[gif.baseName].gif = { 
            key: gif.key, 
            url: gif.url 
          };
        } else if (gif.key.endsWith('.webp')) {
          groupedGifs[gif.baseName].webp = { 
            key: gif.key, 
            url: gif.url 
          };
        } else if (gif.key.endsWith('.mp4')) {
          groupedGifs[gif.baseName].mp4 = { 
            key: gif.key, 
            url: gif.url 
          };
        }
      });
      
      res.status(200).json({
        status: 'success',
        results: Object.keys(groupedGifs).length,
        data: { gifs: Object.values(groupedGifs) }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina un archivo
   */
  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { folder, filename } = req.params;
      
      if (!folder || !filename) {
        throw new AppError('Folder y filename son requeridos', 400);
      }
      
      // Intentar eliminar el archivo original
      const originalDeleted = localMediaService.deleteFile(folder, filename);
      
      // Intentar eliminar versiones optimizadas si existen
      const baseName = path.basename(filename, path.extname(filename));
      const possibleFormats = [
        `${baseName}-optimized.gif`,
        `${baseName}.webp`,
        `${baseName}.mp4`,
        `${baseName}-mobile.jpg`,
        `${baseName}-tablet.jpg`,
        `${baseName}-thumbnail.jpg`
      ];
      
      // Intentar eliminar cada formato
      possibleFormats.forEach(format => {
        localMediaService.deleteFile(folder, format, true);
      });
      
      if (!originalDeleted) {
        throw new AppError('No se encontró el archivo', 404);
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new LocalMediaController();