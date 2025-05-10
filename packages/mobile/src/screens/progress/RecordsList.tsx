// packages/mobile/src/screens/progress/RecordsList.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import progressApi from '../../api/progress.api';
import { IRecord } from '@gym-app/shared/src/types/progress.interfaces';
import { formatDate } from '../../utils/date';

import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation'; // Adjust the path as needed

type RecordsListProps = {
  navigation: StackNavigationProp<RootStackParamList, 'RecordsList'>;
};

const RecordsList = ({ navigation }: RecordsListProps) => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<IRecord[]>([]);
  const [filterExercise, setFilterExercise] = useState<string | null>(null);

  // Actualizar los datos cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [filterExercise])
  );

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await progressApi.getUserRecords(filterExercise || undefined);
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecordItem = ({ item }: { item: IRecord }) => {
    const exerciseName = item.exerciseId ? item.exerciseId : 'Ejercicio';
    
    // Determinar el ícono según el tipo de récord
    let icon: 'barbell-outline' | 'time-outline' | 'repeat-outline' = 'barbell-outline';
    if (item.type === 'endurance') icon = 'time-outline';
    else if (item.type === 'reps') icon = 'repeat-outline';
    
    return (
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#3D5AFE" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.recordName}>{exerciseName}</Text>
            <Text style={styles.recordType}>
              {item.type === 'weight' ? 'Peso máximo' : 
               item.type === 'volume' ? 'Volumen máximo' : 
               item.type === 'reps' ? 'Repeticiones máximas' : 'Duración máxima'}
            </Text>
          </View>
        </View>
        
        <View style={styles.recordDetails}>
          <View style={styles.valueContainer}>
            <Text style={styles.recordValue}>{item.value}</Text>
            <Text style={styles.unitText}>
              {item.type === 'weight' ? 'kg' : 
               item.type === 'volume' ? 'kg' : 
               item.type === 'reps' ? 'reps' : 'seg'}
            </Text>
          </View>
          
          <Text style={styles.dateText}>{formatDate(new Date(item.date))}</Text>
        </View>
        
        {item.previous && (
          <View style={styles.previousContainer}>
            <Text style={styles.previousLabel}>Anterior:</Text>
            <Text style={styles.previousValue}>{item.previous.value}</Text>
            <Text style={styles.previousUnit}>
              {item.type === 'weight' ? 'kg' : 
               item.type === 'volume' ? 'kg' : 
               item.type === 'reps' ? 'reps' : 'seg'}
            </Text>
            <Text style={styles.previousDate}>
              {formatDate(new Date(item.previous.date))}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Récords Personales</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => navigation.navigate('ExerciseFilter', {
            onSelect: (exerciseId: string) => setFilterExercise(exerciseId)
          })}
        >
          <Ionicons name="filter-outline" size={22} color="#3D5AFE" />
          <Text style={styles.filterText}>Filtrar</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D5AFE" />
          <Text style={styles.loadingText}>Cargando récords...</Text>
        </View>
      ) : records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.exerciseId || item.date} // Use a combination of unique properties
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Aún no tienes récords personales</Text>
          <Text style={styles.emptySubtext}>Sigue entrenando para conseguir tus primeros récords</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
  },
  filterText: {
    fontSize: 14,
    color: '#3D5AFE',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777',
  },
  listContainer: {
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recordType: {
    fontSize: 14,
    color: '#777',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  recordValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3D5AFE',
  },
  unitText: {
    fontSize: 16,
    color: '#777',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#777',
  },
  previousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  previousLabel: {
    fontSize: 12,
    color: '#777',
    marginRight: 6,
  },
  previousValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#777',
  },
  previousUnit: {
    fontSize: 12,
    color: '#777',
    marginLeft: 2,
    marginRight: 8,
  },
  previousDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default RecordsList;