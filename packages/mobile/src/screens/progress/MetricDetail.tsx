// packages/mobile/src/screens/progress/MetricDetail.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import progressApi from '../../api/progress.api';
import { IChartDataPoint, IProgress } from '@gym-app/shared/src/types/progress.interfaces';
import { formatDate } from '../../utils/date';

const screenWidth = Dimensions.get('window').width;

// Este componente muestra el detalle de una métrica específica
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type MetricDetailProps = {
  route: RouteProp<{ params: { type: string; metric: string; title: string; unit: string } }, 'params'>;
  navigation: StackNavigationProp<any>;
};

const MetricDetail: React.FC<MetricDetailProps> = ({ route, navigation }) => {
  const { type, metric, title, unit } = route.params;
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<IChartDataPoint[]>([]);
  const [rawData, setRawData] = useState<IProgress[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadData();
  }, [type, metric, timeRange, interval]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Determinar fecha de inicio según el rango de tiempo
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Cargar datos para gráfico y datos crudos
      const [chartDataResult, rawDataResult] = await Promise.all([
        progressApi.getChartData(type, metric, {
          interval,
          fromDate: startDate,
          limit: 100
        }),
        progressApi.getProgressData(type, metric, {
          fromDate: startDate,
          limit: 100,
          sort: 'desc'
        })
      ]);

      setChartData(chartDataResult);
      setRawData(rawDataResult);
    } catch (error) {
      console.error('Error loading metric data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const calculateStats = () => {
    if (rawData.length === 0) return { min: 0, max: 0, avg: 0, latest: 0 };

    const values = rawData.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const latest = values[0];

    return { min, max, avg, latest };
  };

  const stats = calculateStats();

  // Formatear los datos para el gráfico
  const chartConfig = {
    data: {
      labels: chartData.map(item => {
        const date = new Date(item.date);
        if (interval === 'day') return formatDate(date, 'short');
        if (interval === 'week') return `S${getWeekNumber(date)}`;
        return formatDate(date, 'full');
      }),
      datasets: [
        {
          data: chartData.map(item => item.value)
        }
      ]
    },
    chartConfig: {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: unit === '%' ? 1 : 0,
      color: (opacity = 1) => `rgba(61, 90, 254, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: '#3D5AFE'
      }
    }
  };

  // Función para obtener el número de semana
  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Controles de tiempo */}
      <View style={styles.timeControls}>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'week' && styles.activeTimeButton]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'week' && styles.activeTimeButtonText]}>
            7 días
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'month' && styles.activeTimeButton]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'month' && styles.activeTimeButtonText]}>
            1 mes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeButton, timeRange === 'year' && styles.activeTimeButton]}
          onPress={() => setTimeRange('year')}
        >
          <Text style={[styles.timeButtonText, timeRange === 'year' && styles.activeTimeButtonText]}>
            1 año
          </Text>
        </TouchableOpacity>
      </View>

      {/* Controles de intervalo */}
      <View style={styles.intervalControls}>
        <TouchableOpacity
          style={[styles.intervalButton, interval === 'day' && styles.activeIntervalButton]}
          onPress={() => setInterval('day')}
          disabled={timeRange === 'year'}
        >
          <Text style={[styles.intervalButtonText, interval === 'day' && styles.activeIntervalButtonText]}>
            Diario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.intervalButton, interval === 'week' && styles.activeIntervalButton]}
          onPress={() => setInterval('week')}
        >
          <Text style={[styles.intervalButtonText, interval === 'week' && styles.activeIntervalButtonText]}>
            Semanal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.intervalButton, interval === 'month' && styles.activeIntervalButton]}
          onPress={() => setInterval('month')}
          disabled={timeRange === 'week' || timeRange === 'month'}
        >
          <Text style={[styles.intervalButtonText, interval === 'month' && styles.activeIntervalButtonText]}>
            Mensual
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3D5AFE" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Tarjeta de estadísticas */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.latest.toFixed(unit === '%' ? 1 : 0)}{unit}</Text>
                <Text style={styles.statLabel}>Último</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.max.toFixed(unit === '%' ? 1 : 0)}{unit}</Text>
                <Text style={styles.statLabel}>Máximo</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.min.toFixed(unit === '%' ? 1 : 0)}{unit}</Text>
                <Text style={styles.statLabel}>Mínimo</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.avg.toFixed(unit === '%' ? 1 : 0)}{unit}</Text>
                <Text style={styles.statLabel}>Promedio</Text>
              </View>
            </View>
          </View>

          {/* Gráfico */}
          {chartData.length > 0 ? (
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Evolución</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={chartConfig.data}
                  width={Math.max(screenWidth - 40, chartData.length * 50)}
                  height={220}
                  chartConfig={chartConfig.chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ScrollView>
            </View>
          ) : (
            <View style={styles.noDataCard}>
              <Ionicons name="analytics-outline" size={50} color="#ccc" />
              <Text style={styles.noDataText}>No hay suficientes datos para mostrar un gráfico</Text>
            </View>
          )}

          {/* Historial de datos */}
          <View style={styles.historyCard}>
            <Text style={styles.cardTitle}>Historial</Text>
            {rawData.length > 0 ? (
              rawData.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{formatDate(new Date(item.date))}</Text>
                  <Text style={styles.historyValue}>{item.value.toFixed(unit === '%' ? 1 : 0)}{unit}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No hay datos para mostrar</Text>
            )}
          </View>
        </ScrollView>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  timeControls: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTimeButton: {
    backgroundColor: '#3D5AFE',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#555',
  },
  activeTimeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  intervalControls: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeIntervalButton: {
    backgroundColor: '#F0F4FF',
  },
  intervalButtonText: {
    fontSize: 14,
    color: '#777',
  },
  activeIntervalButtonText: {
    color: '#3D5AFE',
    fontWeight: 'bold',
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
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D5AFE',
  },
  statLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginRight: 16,
    borderRadius: 8,
  },
  noDataCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D5AFE',
  },
});

export default MetricDetail;