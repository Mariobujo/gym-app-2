// packages/backend/src/utils/logger.ts

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { NODE_ENV } from '../config/env';

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para los niveles
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Agregar colores a winston
winston.addColors(colors);

// Determinar nivel basado en entorno
const level = () => {
  return NODE_ENV === 'development' ? 'debug' : 'info';
};

// Formato para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf((info) => {
    const { timestamp, level, message, metadata } = info;
    // Si hay datos adicionales, incluirlos en el log
    const meta = metadata && typeof metadata === 'object' && Object.keys(metadata).length ? 
      `\n${JSON.stringify(metadata, null, 2)}` : '';
    
    return `${timestamp} [${level.toUpperCase()}]: ${message}${meta}`;
  })
);

// Formato para consola
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  format
);

// Transportes
const transports = [
  // Consola para todos los entornos
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // Archivo para todos los logs
  new winston.transports.File({
    filename: path.join(logDir, 'all.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Archivo específico para errores
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Archivo específico para HTTP
  new winston.transports.File({
    filename: path.join(logDir, 'http.log'),
    level: 'http',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Crear el logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Adaptador para usar con morgan
// Usar una propiedad de objetos con índice para evitar errores de tipo
(logger as any).stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Exportar logger
export default logger;