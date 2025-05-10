// packages/backend/src/routes/local-media.routes.ts

import { Router } from 'express';
import localMediaController from '../controllers/local-media.controller';
import protect, { restrictTo } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Proteger todas las rutas de media
router.use(protect as any);

// Ruta para subir archivos
router.post(
  '/upload',
  (localMediaController.uploadFile as any),
  (localMediaController.processUploadedFile as any)
);

// Ruta para obtener GIFs de ejercicios
router.get(
  '/exercise-gifs',
  (cacheMiddleware(60 * 15) as any),
  (localMediaController.getExerciseGifs as any)
);

// Ruta para eliminar archivos (solo admin)
router.delete(
  '/:folder/:filename',
  (restrictTo(['admin'] as any) as any),
  (localMediaController.deleteFile as any)
);

export default router;