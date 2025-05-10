import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ExerciseGifPlayer from '../../components/media/ExerciseGifPlayer';

// Definición de datos de ejemplo para un ejercicio
// Asegúrate de ajustar esto según la interfaz ExerciseGifFormats que tengas definida
const sampleExercise = {
  media: {
    gif: { key: 'gif', url: 'https://example.com/sample.gif', width: 400, height: 300 },
    webp: { key: 'webp', url: 'https://example.com/sample.webp', width: 400, height: 300 },
    mp4: { key: 'mp4', url: 'https://example.com/sample.mp4', width: 400, height: 300 }
  }
};

const ExercisesScreen = () => {
  // Si necesitas un estado para manejar un ejercicio real, podrías usar:
  // const [exercise, setExercise] = useState(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Ejercicios</Text>
      <Text style={styles.subtitle}>Aquí se mostrarán los diferentes ejercicios disponibles.</Text>
      
      {/* Aquí renderizamos el ExerciseGifPlayer con datos de ejemplo */}
      {sampleExercise.media && (
        <ExerciseGifPlayer 
          formats={sampleExercise.media}
          width="100%"
          height={200}
          autoPlay={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  }
});

export default ExercisesScreen;