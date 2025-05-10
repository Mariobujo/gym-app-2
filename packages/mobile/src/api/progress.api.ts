// packages/mobile/src/api/progress.api.ts

import apiClient from './apiClient';
import { IProgress, IRecord, IProgressSummary, IChartDataPoint, IAvailableMetric } from '@gym-app/shared/src/types/progress.interfaces';

export const progressApi = {
  // Obtener resumen de progreso
  getProgressSummary: async (): Promise<IProgressSummary> => {
    const response = await apiClient.get('/progress/summary');
    return response.data.data.summary;
  },
  
  // Obtener métricas disponibles
  getAvailableMetrics: async (): Promise<IAvailableMetric[]> => {
    const response = await apiClient.get('/progress/metrics');
    return response.data.data.metrics;
  },
  
  // Obtener datos de progreso para una métrica
  getProgressData: async (
    type: string,
    metric: string,
    options: {
      limit?: number;
      fromDate?: Date;
      toDate?: Date;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<IProgress[]> => {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.fromDate) params.append('fromDate', options.fromDate.toISOString());
    if (options.toDate) params.append('toDate', options.toDate.toISOString());
    if (options.sort) params.append('sort', options.sort);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/progress/metrics/${type}/${metric}${query}`);
    return response.data.data.progress;
  },
  
  // Obtener datos para gráficos
  getChartData: async (
    type: string,
    metric: string,
    options: {
      interval?: 'day' | 'week' | 'month';
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    } = {}
  ): Promise<IChartDataPoint[]> => {
    const params = new URLSearchParams();
    
    if (options.interval) params.append('interval', options.interval);
    if (options.fromDate) params.append('fromDate', options.fromDate.toISOString());
    if (options.toDate) params.append('toDate', options.toDate.toISOString());
    if (options.limit) params.append('limit', options.limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`/progress/charts/${type}/${metric}${query}`);
    return response.data.data.chartData;
  },
  
  // Obtener récords personales
  getUserRecords: async (exerciseId?: string): Promise<IRecord[]> => {
    const params = exerciseId ? `?exerciseId=${exerciseId}` : '';
    const response = await apiClient.get(`/progress/records${params}`);
    return response.data.data.records;
  },
  
  // Registrar entrada de progreso manual
  createProgressEntry: async (progressData: Partial<IProgress>): Promise<IProgress> => {
    const response = await apiClient.post('/progress', progressData);
    return response.data.data.progress;
  },
  
  // Registrar récord manual
  createManualRecord: async (recordData: Partial<IRecord>): Promise<IRecord> => {
    const response = await apiClient.post('/progress/records', recordData);
    return response.data.data.record;
  },
  
  // Eliminar entrada de progreso
  deleteProgressEntry: async (id: string): Promise<void> => {
    await apiClient.delete(`/progress/${id}`);
  }
};

export default progressApi;