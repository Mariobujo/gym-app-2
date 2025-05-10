// packages/mobile/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { User } from '../../types/user';
import { AuthState, LoginCredentials, RegisterData, AuthResponse } from '../../types/auth';

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,  // Importante: debe comenzar como true
  error: null,
  isAuthenticated: false,
};

// Acción asíncrona para login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      
      // Guardar token en AsyncStorage para persistencia
      await AsyncStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      // Manejar errores de forma adecuada
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue('Error de inicio de sesión. Inténtalo de nuevo.');
      }
    }
  }
);

// Acción asíncrona para registro
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      
      // Guardar token en AsyncStorage para persistencia
      await AsyncStorage.setItem('token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue('Error de registro. Inténtalo de nuevo.');
      }
    }
  }
);

// Acción asíncrona para cargar el perfil del usuario
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      // @ts-ignore - Acceder al estado de Redux
      const token = getState().auth.token;
      
      if (!token) {
        throw new Error('No hay token disponible');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${API_URL}/api/auth/profile`, config);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue('Error al cargar el perfil de usuario.');
      }
    }
  }
);

// Acción asíncrona para restaurar la sesión desde AsyncStorage
export const restoreToken = createAsyncThunk(
  'auth/restoreToken',
  async (_, { dispatch }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        // Si hay un token, cargamos el perfil del usuario
        dispatch(loadUser());
        return token;
      }
      
      return null;
    } catch (error) {
      console.log('Error al restaurar token:', error);
      return null;
    }
  }
);

// Acción asíncrona para cerrar sesión
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await AsyncStorage.removeItem('token');
      return null;
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
      throw error;
    }
  }
);

// Creación del slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload as string;
    });

    // Load User
    builder.addCase(loadUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(loadUser.rejected, (state, action) => {
      state.isLoading = false;
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = action.payload as string;
    });

    // Restore Token
    builder.addCase(restoreToken.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(restoreToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    });
    builder.addCase(restoreToken.rejected, (state) => {
      state.isLoading = false;
      state.token = null;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearErrors } = authSlice.actions;

export default authSlice.reducer;