// packages/backend/src/services/local-media.service.ts

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { Request as ExpressRequest } from 'express';
import { FileFilterCallback } from 'multer';


// Configuración básica
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const OPTIMIZED_DIR = path.join(__dirname, '../../uploads-optimized');
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// Asegurarse que las carpetas existan
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(OPTIMIZED_DIR)) fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

// Crear subfolders para diferentes tipos
const mediaFolders = {
  exerciseGifs: 'exercise-gifs',
  exerciseImages: 'exercise-images',
  userAvatars: 'user-avatars',
  progressPhotos: 'progress-photos',
  thumbnails: 'thumbnails'
};

Object.values(mediaFolders).forEach(folder => {
  const folderPath = path.join(UPLOAD_DIR, folder);
  const optimizedPath = path.join(OPTIMIZED_DIR, folder);
  
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  if (!fs.existsSync(optimizedPath)) fs.mkdirSync(optimizedPath, { recursive: true });
});

// Configurar storage para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folder || 'default';
    const destPath = path.join(UPLOAD_DIR, folder.toString());
    
    // Asegurarse que la carpeta existe
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const fileExt = path.extname(file.originalname);
    const randomId = crypto.randomBytes(8).toString('hex');
    const sanitizedName = path.basename(file.originalname, fileExt)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    
    const filename = `${sanitizedName}-${randomId}${fileExt}`;
    cb(null, filename);
  }
});

// Configurar límites y filtros para multer
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB por defecto
  files: 1
};

const fileFilter = (
    req: any, // Usa any temporalmente para evitar conflictos de tipos
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
  // Validar MIME type
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedMimeTypes.join(', ')}`));
  }
  
  // Validar folder
  const folder = req.query.folder;
  if (!folder || !Object.values(mediaFolders).includes(folder.toString())) {
    return cb(new Error(`Carpeta inválida o no especificada. Carpetas permitidas: ${Object.values(mediaFolders).join(', ')}`));
  }
  
  // Aprobar el archivo
  cb(null, true);
};

// Exportar uploader configurado
export const upload = multer({ storage, limits, fileFilter });

/**
 * Servicio de Media Local - Maneja operaciones de archivos locales
 */
export class LocalMediaService {
  /**
   * Obtiene la URL para un archivo
   * @param folder Carpeta del archivo
   * @param filename Nombre del archivo
   * @param optimized Si se debe usar la versión optimizada
   */
  getMediaUrl(folder: string, filename: string, optimized = false): string {
    const baseUrl = optimized ? `${SERVER_URL}/media-optimized` : `${SERVER_URL}/media`;
    return `${baseUrl}/${folder}/${filename}`;
  }
  
  /**
   * Obtiene la ruta del sistema de archivos para un archivo
   * @param folder Carpeta del archivo
   * @param filename Nombre del archivo
   * @param optimized Si se debe usar la versión optimizada
   */
  getMediaPath(folder: string, filename: string, optimized = false): string {
    const baseDir = optimized ? OPTIMIZED_DIR : UPLOAD_DIR;
    return path.join(baseDir, folder, filename);
  }
  
  /**
   * Lista archivos en una carpeta
   * @param folder Carpeta a listar
   * @param optimized Si se debe usar la versión optimizada
   */
  listFiles(folder: string, optimized = false): string[] {
    const directoryPath = path.join(optimized ? OPTIMIZED_DIR : UPLOAD_DIR, folder);
    
    try {
      return fs.readdirSync(directoryPath);
    } catch (error) {
      console.error(`Error al listar archivos en ${directoryPath}:`, error);
      return [];
    }
  }
  
  /**
   * Elimina un archivo
   * @param folder Carpeta del archivo
   * @param filename Nombre del archivo
   * @param optimized Si se debe eliminar la versión optimizada
   */
  deleteFile(folder: string, filename: string, optimized = false): boolean {
    const filePath = this.getMediaPath(folder, filename, optimized);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error al eliminar archivo ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Obtiene todos los GIFs de ejercicios
   */
  getExerciseGifs() {
    const files = this.listFiles(mediaFolders.exerciseGifs, true);
    
    return files.map(filename => {
      // Extraer base del nombre para agrupar formatos
      let baseName = filename;
      if (filename.includes('-optimized')) {
        baseName = filename.replace('-optimized.gif', '');
      } else if (filename.endsWith('.webp')) {
        baseName = filename.replace('.webp', '');
      } else if (filename.endsWith('.mp4')) {
        baseName = filename.replace('.mp4', '');
      } else if (filename.endsWith('.gif')) {
        baseName = filename.replace('.gif', '');
      }
      
      return {
        key: `${mediaFolders.exerciseGifs}/${filename}`,
        url: this.getMediaUrl(mediaFolders.exerciseGifs, filename, true),
        baseName
      };
    });
  }
}

export default new LocalMediaService();
export { mediaFolders };