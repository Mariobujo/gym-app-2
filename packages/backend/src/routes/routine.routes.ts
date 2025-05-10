// src/routes/routine.routes.ts

import { Router } from 'express';
import { routineController } from '../controllers/routine.controller';
import  authenticate  from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validate.middleware';
import { cacheMiddleware as cache } from '../middleware/cache.middleware';

const router = Router();

// Public routes (some with caching)
router.get('/', 
  validate(schemas.pagination, 'query'), 
  cache(300), 
  routineController.getRoutines
);

router.get('/templates', 
  validate(schemas.pagination, 'query'), 
  cache(600), 
  routineController.getRoutineTemplates
);

router.get('/by-objective/:objective', 
  validate(schemas.pagination, 'query'), 
  cache(300), 
  routineController.getRoutinesByObjective
);

router.get('/by-user/:userId', 
  validate(schemas.id, 'params'), 
  validate(schemas.pagination, 'query'), 
  cache(300), 
  routineController.getRoutinesByUser
);

router.get('/:id', 
  validate(schemas.id, 'params'), 
  cache(300), 
  routineController.getRoutineById
);

// Protected routes
router.use(authenticate);

router.get('/my', 
  validate(schemas.pagination, 'query'), 
  routineController.getUserRoutines
);

router.post('/', 
  validate(schemas.routine.create), 
  routineController.createRoutine
);

router.put('/:id', 
  validate(schemas.id, 'params'), 
  validate(schemas.routine.update), 
  routineController.updateRoutine
);

router.delete('/:id', 
  validate(schemas.id, 'params'), 
  routineController.deleteRoutine
);

router.post('/copy/:id', 
  validate(schemas.id, 'params'), 
  validate(schemas.routine.copy), 
  routineController.copyRoutine
);

router.put('/:id/publish', 
  validate(schemas.id, 'params'), 
  validate(schemas.routine.publish), 
  routineController.toggleRoutineVisibility
);

router.post('/:id/rate', 
  validate(schemas.id, 'params'), 
  validate(schemas.routine.rate), 
  routineController.rateRoutine
);

export default router;