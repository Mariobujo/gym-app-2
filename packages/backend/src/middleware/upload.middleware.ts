// packages/backend/src/middleware/upload.middleware.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors';
import config from '../config';

// Asegurar que el directorio de subidas exista
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Definir tipos MIME permitidos por categoría
interface MimeTypes {
  images: string[];
  documents: string[];
  videos: string[];
  all: string[];
}

const ALLOWED_MIME_TYPES: MimeTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  all: [] // Se llenará automáticamente con todos los tipos
};

// Llenar el array 'all' con todos los tipos permitidos
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.videos
];

// Tamaños máximos por categoría (en bytes)
const MAX_FILE_SIZES = {
  images: 5 * 1024 * 1024, // 5MB
  documents: 10 * 1024 * 1024, // 10MB
  videos: 50 * 1024 * 1024, // 50MB
  all: 50 * 1024 * 1024 // 50MB
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crear subdirectorios según tipo de archivo
    const category = getFileCategory(file.mimetype);
    const categoryDir = path.join(UPLOAD_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    cb(null, categoryDir);
  },
  filename: (req, file, cb) => {
    // Crear nombre seguro único para evitar colisiones y path traversal
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${fileExt}`;
    
    cb(null, uniqueName);
  }
});

// Determinar categoría de archivo según MIME type
function getFileCategory(mimetype: string): string {
  if (ALLOWED_MIME_TYPES.images.includes(mimetype)) {
    return 'images';
  }
  if (ALLOWED_MIME_TYPES.documents.includes(mimetype)) {
    return 'documents';
  }
  if (ALLOWED_MIME_TYPES.videos.includes(mimetype)) {
    return 'videos';
  }
  return 'other';
}

// Filtro de archivos por MIME type
const fileFilter = (category: keyof MimeTypes = 'all') => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ALLOWED_MIME_TYPES[category];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`, 400) as any);
    }
  };
};

// Funciones de validación adicionales
const validateFileName = (filename: string): boolean => {
  // Solo permitir caracteres alfanuméricos, guiones, guiones bajos y puntos
  const regex = /^[a-zA-Z0-9_.-]+$/;
  return regex.test(filename);
};

// Crear middlewares específicos por tipo
export const uploadImage = multer({
  storage,
  fileFilter: fileFilter('images') as any,
  limits: {
    fileSize: MAX_FILE_SIZES.images
  }
});

export const uploadDocument = multer({
  storage,
  fileFilter: fileFilter('documents') as any,
  limits: {
    fileSize: MAX_FILE_SIZES.documents
  }
});

export const uploadVideo = multer({
  storage,
  fileFilter: fileFilter('videos') as any,
  limits: {
    fileSize: MAX_FILE_SIZES.videos
  }
});

export const uploadAny = multer({
  storage,
  fileFilter: fileFilter('all') as any,
  limits: {
    fileSize: MAX_FILE_SIZES.all
  }
});

// Middleware para manejar errores de multer
export const handleUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Archivo demasiado grande. Por favor sube un archivo más pequeño.', 400));
    }
    return next(new AppError(`Error en la subida de archivo: ${err.message}`, 400));
  }
  next(err);
};

// Middleware para sanitizar metadatos de archivos
export const sanitizeFile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }
  
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(req.file.path)) {
      return next(new AppError('Archivo no encontrado', 404));
    }
    
    // Validar nombre de archivo
    if (!validateFileName(path.basename(req.file.path))) {
      // Eliminar archivo y retornar error
      fs.unlinkSync(req.file.path);
      return next(new AppError('Nombre de archivo inválido', 400));
    }
    
    // Aquí se podrían añadir escaneos antivirus o verificaciones adicionales
    // Por ejemplo, integración con ClamAV u otras herramientas de seguridad
    
    next();
  } catch (error) {
    // Si ocurre algún error, eliminar el archivo para prevenir archivos huérfanos
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    next(new AppError('Error al procesar el archivo', 500));
  }
};

// Exportar configuraciones preestablecidas
export default {
  uploadImage: uploadImage.single('file'),
  uploadDocument: uploadDocument.single('file'),
  uploadVideo: uploadVideo.single('file'),
  uploadAny: uploadAny.single('file'),
  uploadMultipleImages: uploadImage.array('files', 10),
  handleUploadErrors,
  sanitizeFile,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};