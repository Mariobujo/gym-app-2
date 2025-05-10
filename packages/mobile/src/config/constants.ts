// packages/mobile/src/config/constants.ts

// URL base de la API para las solicitudes
export const API_URL = 'http://localhost:3000'; // Cambia esto según tu entorno

// Constantes de autenticación
export const AUTH_TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// Constantes de almacenamiento
export const STORAGE_KEYS = {
  USER_PROFILE: 'userProfile',
  WORKOUT_DRAFT: 'workoutDraft',
  SETTINGS: 'appSettings',
  RECENT_EXERCISES: 'recentExercises',
  FAVORITE_EXERCISES: 'favoriteExercises',
  LAST_SYNC: 'lastSyncTimestamp'
};

// Constantes para tiempos de caché (en milisegundos)
export const CACHE_TIMES = {
  EXERCISES: 24 * 60 * 60 * 1000, // 24 horas
  ROUTINES: 12 * 60 * 60 * 1000,  // 12 horas
  PROGRESS: 30 * 60 * 1000,       // 30 minutos
  USER_RECORDS: 60 * 60 * 1000,   // 1 hora
};

// Constantes para tipos de métricas
export const METRIC_TYPES = {
  BODY: 'body',
  PERFORMANCE: 'performance',
  EXERCISE: 'exercise',
  HABIT: 'habit'
};

// Constantes para unidades
export const UNITS = {
  WEIGHT: {
    KG: 'kg',
    LB: 'lb'
  },
  DISTANCE: {
    KM: 'km',
    MI: 'mi',
    M: 'm'
  },
  TIME: {
    SEC: 'seconds',
    MIN: 'minutes',
    HOUR: 'hours'
  }
};

// Constantes para entrenamientos
export const WORKOUT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABORTED: 'aborted'
};

// Constantes para filtros de tiempo
export const TIME_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL_TIME: 'all_time'
};