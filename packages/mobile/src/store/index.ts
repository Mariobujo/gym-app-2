// packages/mobile/src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import progressReducer from './slices/progressSlice'; // Ensure this path is correct

// Definimos el rootReducer combinando todos los reducers
const rootReducer = combineReducers({
  auth: authReducer,
  progress: progressReducer, // Ensure the progress reducer is added here
  // Aquí puedes añadir más reducers a medida que tu app crezca
});

// Creamos el store usando el rootReducer definido
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Exportamos los tipos
export type RootState = ReturnType<typeof rootReducer>; // Ensure RootState includes the progress slice
export type AppDispatch = typeof store.dispatch;