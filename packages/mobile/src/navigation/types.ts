// packages/mobile/src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// Parámetros para AuthStack (stack de autenticación)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword?: undefined;
};
  
// Parámetros para MainStack (stack de aplicación principal)
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Exercises: undefined;
  ExerciseDetail: { id: string };
  Routines: undefined;
  RoutineDetail: { id: string };
  CreateRoutine: undefined;
  EditRoutine: { id: string };
  WorkoutExecution: { routineId: string };
  Progress: undefined;
  // Añade aquí más pantallas según sea necesario
};
  
// Tipo global para el navigation container
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Loading?: undefined;
};