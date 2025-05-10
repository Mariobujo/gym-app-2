import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define la interfaz para un ejercicio
interface Exercise {
  id: string;
  name: string;
  description?: string;
  media?: any; // Considera definir un tipo más específico para media
  // Agrega otras propiedades según sea necesario
}

// Define la interfaz para el estado
interface ExerciseState {
  data: Exercise[];
  loading: boolean;
  error: string | null;
  // Agrega otras propiedades de estado según sea necesario
}

// Estado inicial
const initialState: ExerciseState = {
  data: [],
  loading: false,
  error: null
};

// Crear el slice
const exerciseSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {
    // Otras acciones aquí...
    
    // Añadir una acción para actualizar el media de un ejercicio
    updateExerciseMedia: (state: ExerciseState, action: PayloadAction<{ exerciseId: string, media: any }>) => {
      const { exerciseId, media } = action.payload;
      const exerciseIndex = state.data.findIndex((ex: Exercise) => ex.id === exerciseId);
      
      if (exerciseIndex !== -1) {
        state.data[exerciseIndex].media = media;
      }
    }
  }
});

// Exportar acciones y reducer
export const { updateExerciseMedia } = exerciseSlice.actions;
export default exerciseSlice.reducer;