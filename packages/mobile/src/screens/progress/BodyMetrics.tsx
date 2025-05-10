import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { RootState } from '../../store';
import { fetchBodyMetrics, addBodyMetric } from '../../store/slices/progressSlice';
import { BodyMetric, MetricType } from '../../types/progress.types';
import { formatDate } from '../../utils/date';
import { calculateBMI } from '../../utils/calculators';

const screenWidth = Dimensions.get('window').width;

const metricOptions = [
  { label: 'Weight', value: MetricType.WEIGHT, unit: 'kg' },
  { label: 'Body Fat', value: MetricType.BODY_FAT, unit: '%' },
  { label: 'Chest', value: MetricType.CHEST, unit: 'cm' },
  { label: 'Waist', value: MetricType.WAIST, unit: 'cm' },
  { label: 'Hips', value: MetricType.HIPS, unit: 'cm' },
  { label: 'Arms', value: MetricType.ARMS, unit: 'cm' },
  { label: 'Thighs', value: MetricType.THIGHS, unit: 'cm' },
];

const BodyMetrics: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(MetricType.WEIGHT);
  const [newValue, setNewValue] = useState<string>('');
  const [showTip, setShowTip] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const { bodyMetrics, loading, error } = useSelector((state: RootState) => state.progress);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchBodyMetrics());
  }, [dispatch]);

  const handleAddMetric = () => {
    if (!newValue || isNaN(parseFloat(newValue))) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }

    const value = parseFloat(newValue);
    dispatch(addBodyMetric({ type: selectedMetric, value }));
    setNewValue('');
    Alert.alert('Success', 'Measurement added successfully');
  };

  const getMetricData = (): BodyMetric[] => {
    return (bodyMetrics || [])
      .filter((metric: BodyMetric) => metric.type === selectedMetric)
      .sort((a: BodyMetric, b: BodyMetric) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Get last 7 entries
  };

  const chartData = {
    labels: getMetricData().map((metric) => formatDate(metric.date, 'short')),
    datasets: [
      {
        data: getMetricData().map((metric) => metric.value),
        color: (opacity = 1) => `rgba(61, 90, 254, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const getCurrentMetricValue = (): number | null => {
    const metrics = getMetricData();
    return metrics.length > 0 ? metrics[metrics.length - 1].value : null;
  };

  const getMetricChange = (): { value: number; isPositive: boolean } | null => {
    const metrics = getMetricData();
    if (metrics.length < 2) return null;
    
    const latest = metrics[metrics.length - 1].value;
    const previous = metrics[metrics.length - 2].value;
    const change = latest - previous;
    
    // For weight and body measurements, negative change is generally positive progress
    // For muscle measurements (arms, chest), positive change is good
    const isPositiveChange = selectedMetric === MetricType.ARMS || selectedMetric === MetricType.CHEST 
      ? change > 0 
      : change < 0;
    
    return {
      value: Math.abs(change),
      isPositive: isPositiveChange
    };
  };

  const getTip = (): string => {
    const currentValue = getCurrentMetricValue();
    
    if (!currentValue) return "Start tracking to get personalized tips!";
    
    switch (selectedMetric) {
      case MetricType.WEIGHT:
        const bmi = user?.profile?.height ? calculateBMI(currentValue, user.profile.height) : null;
        if (bmi) {
          if (bmi < 18.5) return "Your BMI indicates you're underweight. Consider focusing on muscle building and increasing caloric intake.";
          if (bmi < 25) return "Your BMI is in the healthy range. Maintain your current habits with a balanced diet and regular exercise.";
          if (bmi < 30) return "Your BMI indicates you're overweight. Consider a slight caloric deficit and increased cardio.";
          return "Your BMI indicates obesity. Consider consulting a healthcare professional for a personalized weight management plan.";
        }
        return "Regular tracking of your weight can help you stay accountable to your fitness goals.";
        
      case MetricType.BODY_FAT:
        if (currentValue < 10) return "Your body fat percentage is very low. This might be ideal for competitive athletes but may be difficult to maintain long-term.";
        if (currentValue < 20) return "Your body fat percentage is in the athletic to fitness range. Great work maintaining a healthy level!";
        if (currentValue < 25) return "Your body fat percentage is in the acceptable range. Consistent strength training can help reduce this further.";
        return "Consider incorporating more strength training and reviewing your nutrition to reduce body fat percentage.";
        
      case MetricType.WAIST:
        return "Waist circumference is a good indicator of visceral fat. A healthy waist size is generally less than 35 inches for women and 40 inches for men.";
        
      case MetricType.CHEST:
      case MetricType.ARMS:
        return "Increases in these measurements while maintaining or reducing body fat percentage indicate muscle growth. Great job!";
        
      case MetricType.HIPS:
      case MetricType.THIGHS:
        return "Lower body measurements can change with both fat loss and muscle gain. Focus on the trend rather than absolute numbers.";
        
      default:
        return "Regular tracking helps you understand your body's changes in response to your fitness program.";
    }
  };

  const getSelectedMetricUnit = (): string => {
    const metric = metricOptions.find(option => option.value === selectedMetric);
    return metric ? metric.unit : '';
  };

  if (loading && !bodyMetrics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D5AFE" />
        <Text style={styles.loadingText}>Loading your metrics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#F44336" />
        <Text style={styles.errorText}>Failed to load metrics</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchBodyMetrics())}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Metrics</Text>
        <TouchableOpacity style={styles.tipButton} onPress={() => setShowTip(!showTip)}>
          <Ionicons name="information-circle" size={24} color="#3D5AFE" />
        </TouchableOpacity>
      </View>
      
      {showTip && (
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>{getTip()}</Text>
        </View>
      )}
      
      <View style={styles.metricSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {metricOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.metricOption,
                selectedMetric === option.value && styles.selectedMetricOption,
              ]}
              onPress={() => setSelectedMetric(option.value)}
            >
              <Text
                style={[
                  styles.metricOptionText,
                  selectedMetric === option.value && styles.selectedMetricOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.currentMetricContainer}>
        <Text style={styles.currentMetricLabel}>Current {metricOptions.find(m => m.value === selectedMetric)?.label}</Text>
        <View style={styles.currentMetricValueContainer}>
          <Text style={styles.currentMetricValue}>
            {getCurrentMetricValue() !== null ? getCurrentMetricValue() : '--'}
          </Text>
          <Text style={styles.currentMetricUnit}>{getSelectedMetricUnit()}</Text>
        </View>
        
        {getMetricChange() && (
          <View style={styles.changeContainer}>
            <Ionicons
              name={getMetricChange()?.isPositive ? 'trending-up' : 'trending-down'}
              size={18}
              color={getMetricChange()?.isPositive ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.changeText,
                { color: getMetricChange()?.isPositive ? '#4CAF50' : '#F44336' },
              ]}
            >
              {getMetricChange()?.value.toFixed(1)} {getSelectedMetricUnit()} since last measurement
            </Text>
          </View>
        )}
      </View>
      
      {getMetricData().length > 1 ? (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Progress Over Time</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(61, 90, 254, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#3D5AFE',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics" size={50} color="#CCCCCC" />
          <Text style={styles.noDataText}>
            Add more measurements to see your progress chart
          </Text>
        </View>
      )}
      
      <View style={styles.addMetricContainer}>
        <Text style={styles.addMetricTitle}>Add New Measurement</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newValue}
            onChangeText={setNewValue}
            placeholder={`Enter value in ${getSelectedMetricUnit()}`}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddMetric}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent History</Text>
        {getMetricData().length > 0 ? (
          getMetricData()
            .slice()
            .reverse()
            .map((metric, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyDate}>{formatDate(metric.date)}</Text>
                <Text style={styles.historyValue}>
                  {metric.value} {getSelectedMetricUnit()}
                </Text>
              </View>
            ))
        ) : (
          <Text style={styles.noHistoryText}>No measurements recorded yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tipButton: {
    padding: 5,
  },
  tipContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3D5AFE',
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  metricSelector: {
    marginBottom: 20,
  },
  metricOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
  },
  selectedMetricOption: {
    backgroundColor: '#3D5AFE',
  },
  metricOptionText: {
    color: '#555',
    fontSize: 14,
  },
  selectedMetricOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currentMetricContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  currentMetricLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  currentMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentMetricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  currentMetricUnit: {
    fontSize: 18,
    color: '#666',
    marginLeft: 5,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  changeText: {
    fontSize: 14,
    marginLeft: 5,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  noDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
  },
  addMetricContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addMetricTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#3D5AFE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3D5AFE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});