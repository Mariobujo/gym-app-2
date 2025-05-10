import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BodyMetric, MetricType, PersonalRecord, ProgressState, AddBodyMetricPayload } from '../../types/progress.types';
import api from '../../api/api';

// Initial state
const initialState: ProgressState = {
  bodyMetrics: null,
  personalRecords: null,
  summary: null,
  loading: false,
  error: null,
};

// Async thunks

/**
 * Fetch all body metrics for the user
 */
export const fetchBodyMetrics = createAsyncThunk(
  'progress/fetchBodyMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/progress');
      return response.data.data.metrics;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to fetch body metrics';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch metrics by type
 */
export const fetchMetricsByType = createAsyncThunk(
  'progress/fetchMetricsByType',
  async (type: MetricType, { rejectWithValue }) => {
    try {
      const response = await api.get(`/progress/type/${type}`);
      return response.data.data.metrics;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to fetch metrics by type';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch metrics summary
 */
export const fetchMetricsSummary = createAsyncThunk(
  'progress/fetchMetricsSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/progress/summary');
      return response.data.data.summary;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to fetch metrics summary';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Fetch personal records
 */
export const fetchPersonalRecords = createAsyncThunk(
  'progress/fetchPersonalRecords',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/progress/records');
      return response.data.data.records;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to fetch personal records';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Add a new body metric
 */
export const addBodyMetric = createAsyncThunk(
  'progress/addBodyMetric',
  async (metricData: AddBodyMetricPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/progress', metricData);
      
      // After adding a new metric, refresh all metrics and summary
      dispatch(fetchBodyMetrics());
      dispatch(fetchMetricsSummary());
      
      return response.data.data.metric;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to add body metric';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Update an existing body metric
 */
export const updateBodyMetric = createAsyncThunk(
  'progress/updateBodyMetric',
  async ({ id, updates }: { id: string; updates: Partial<BodyMetric> }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/progress/${id}`, updates);
      
      // After updating a metric, refresh all metrics and summary
      dispatch(fetchBodyMetrics());
      dispatch(fetchMetricsSummary());
      
      return response.data.data.metric;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to update body metric';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Delete a body metric
 */
export const deleteBodyMetric = createAsyncThunk(
  'progress/deleteBodyMetric',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/progress/${id}`);
      
      // After deleting a metric, refresh all metrics and summary
      dispatch(fetchBodyMetrics());
      dispatch(fetchMetricsSummary());
      
      return id;
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || 'Failed to delete body metric';
      return rejectWithValue(errorMessage);
    }
  }
);

// Create the slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearProgressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBodyMetrics
      .addCase(fetchBodyMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBodyMetrics.fulfilled, (state, action: PayloadAction<BodyMetric[]>) => {
        state.loading = false;
        state.bodyMetrics = action.payload;
      })
      .addCase(fetchBodyMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchMetricsByType
      .addCase(fetchMetricsByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricsByType.fulfilled, (state, action: PayloadAction<BodyMetric[]>) => {
        state.loading = false;
        // We don't replace all bodyMetrics, just add/update the ones of this type
        if (!state.bodyMetrics) {
          state.bodyMetrics = action.payload;
        } else {
          const type = action.payload[0]?.type;
          if (type) {
            // Filter out existing metrics of this type
            const filteredMetrics = state.bodyMetrics.filter(
              (metric) => metric.type !== type
            );
            // Add the new metrics
            state.bodyMetrics = [...filteredMetrics, ...action.payload];
          }
        }
      })
      .addCase(fetchMetricsByType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchMetricsSummary
      .addCase(fetchMetricsSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetricsSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchMetricsSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // fetchPersonalRecords
      .addCase(fetchPersonalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPersonalRecords.fulfilled, (state, action: PayloadAction<PersonalRecord[]>) => {
        state.loading = false;
        state.personalRecords = action.payload;
      })
      .addCase(fetchPersonalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // addBodyMetric
      .addCase(addBodyMetric.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBodyMetric.fulfilled, (state) => {
        state.loading = false;
        // The full metrics list will be refreshed via fetchBodyMetrics
      })
      .addCase(addBodyMetric.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // updateBodyMetric
      .addCase(updateBodyMetric.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBodyMetric.fulfilled, (state) => {
        state.loading = false;
        // The full metrics list will be refreshed via fetchBodyMetrics
      })
      .addCase(updateBodyMetric.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // deleteBodyMetric
      .addCase(deleteBodyMetric.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBodyMetric.fulfilled, (state) => {
        state.loading = false;
        // The full metrics list will be refreshed via fetchBodyMetrics
      })
      .addCase(deleteBodyMetric.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProgressError } = progressSlice.actions;

export default progressSlice.reducer;