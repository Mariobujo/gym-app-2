// packages/mobile/src/api/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a las solicitudes
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si es un error de token expirado (401) y no hemos intentado renovar el token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Aquí podrías implementar la lógica para renovar el token
      // Por ahora, simplemente rechazamos la promesa y manejamos el logout en el componente
      
      // Si tienes un endpoint para renovar el token:
      // try {
      //   const refreshToken = await AsyncStorage.getItem('refreshToken');
      //   const res = await axios.post(`${API_URL}/api/auth/refresh-token`, { refreshToken });
      //   const { token } = res.data;
      //   
      //   await AsyncStorage.setItem('token', token);
      //   api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      //   
      //   return api(originalRequest);
      // } catch (refreshError) {
      //   // Si falla la renovación del token, limpiar autenticación
      //   await AsyncStorage.removeItem('token');
      //   await AsyncStorage.removeItem('refreshToken');
      //   
      //   // Aquí podrías navegar a la pantalla de login
      //   
      //   return Promise.reject(refreshError);
      // }
    }
    
    return Promise.reject(error);
  }
);

export default api;