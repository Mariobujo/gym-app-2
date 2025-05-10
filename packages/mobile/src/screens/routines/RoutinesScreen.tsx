import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RoutinesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Rutinas</Text>
      <Text>Aquí se mostrarán las rutinas disponibles.</Text>
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
    marginBottom: 20,
  },
});

export default RoutinesScreen;