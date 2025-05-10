export type RootStackParamList = {
    Main: undefined;
    Login: undefined;
    Register: undefined;
    RecordsList: undefined;
    ExerciseFilter: { onSelect: (exerciseId: string) => void };
  };
  
  export type MainTabParamList = {
    Exercises: undefined;
    Routines: undefined;
    Profile: undefined;
  };
