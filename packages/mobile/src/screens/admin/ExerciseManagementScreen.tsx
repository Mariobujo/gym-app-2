import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import MediaUploader from '../../components/media/MediaUploader';
import { mediaFolders } from '../../constants/media.constants';

// Define la interfaz para el formulario
interface ExerciseFormState {
  name?: string;
  description?: string;
  media?: any; // Ajusta esto según la estructura de datos de tu aplicación
}

const ExerciseUploaderScreen = () => {
  // Estado para el formulario de ejercicio
  const [exerciseForm, setExerciseForm] = useState<ExerciseFormState>({
    name: '',
    description: '',
    media: null
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subir nuevo ejercicio</Text>
      
      <MediaUploader
        folder={mediaFolders.exerciseGifs}
        mediaType="gif"
        maxSizeInMB={10}
        onUploadComplete={(result) => {
          // Actualizar el estado o formulario con los resultados
          setExerciseForm((prev: ExerciseFormState) => ({
            ...prev,
            media: result.processed
          }));
        }}
        onError={(error) => {
          // Manejar el error
          console.error('Error al subir media:', error);
          Alert.alert('Error', 'No se pudo subir el archivo');
        }}
        title="Subir GIF de ejercicio"
        description="Selecciona un GIF que demuestre cómo realizar el ejercicio"
      />

      {/* Aquí puedes añadir más campos para el formulario */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});

export default ExerciseUploaderScreen;