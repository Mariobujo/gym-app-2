// packages/mobile/src/utils/securityUtils.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Importaciones con comprobación para entornos donde los módulos pueden no estar disponibles
let SecureStore: any = null;
let Crypto: any = null;

// Intentar importar las dependencias de Expo de manera segura
try {
  // Importaciones dinámicas para manejar entornos donde estos módulos no están disponibles
  SecureStore = require('expo-secure-store');
  Crypto = require('expo-crypto');
} catch (error) {
  console.warn('Expo secure modules not available, using fallback methods');
  // Implementar alternativas básicas si los módulos no están disponibles
  SecureStore = {
    setItemAsync: async (key: string, value: string) => AsyncStorage.setItem(key, value),
    getItemAsync: async (key: string) => AsyncStorage.getItem(key),
    deleteItemAsync: async (key: string) => AsyncStorage.removeItem(key)
  };
  
  Crypto = {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algorithm: string, text: string) => {
      // Implementación muy básica para entornos sin expo-crypto
      // Nota: Esto NO es seguro para producción, solo para desarrollo
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertir a integer de 32 bits
      }
      return hash.toString(16);
    }
  };
}

/**
 * Utilidades para manejo seguro de datos en el cliente móvil
 */
class SecurityUtils {
  /**
   * Almacena datos sensibles de forma segura
   * Usa SecureStore en iOS/Android y AsyncStorage con cifrado en web
   */
  async secureStore(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // En web, cifrar antes de usar AsyncStorage
      const encryptedValue = await this.encrypt(value);
      await AsyncStorage.setItem(key, encryptedValue);
    } else {
      // En dispositivos nativos, usar SecureStore
      await SecureStore.setItemAsync(key, value);
    }
  }

  /**
   * Recupera datos sensibles almacenados de forma segura
   */
  async secureRetrieve(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // En web, recuperar y descifrar
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      return this.decrypt(encryptedValue);
    } else {
      // En dispositivos nativos, usar SecureStore
      return await SecureStore.getItemAsync(key);
    }
  }

  /**
   * Elimina datos sensibles almacenados de forma segura
   */
  async secureDelete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  /**
   * Cifra datos sensibles para almacenamiento en web
   * NOTA: Este es un método simplificado, en una implementación real
   * deberías usar una biblioteca de cifrado más robusta
   */
  private async encrypt(text: string): Promise<string> {
    // Obtener o generar una clave de cifrado
    let encryptionKey = await AsyncStorage.getItem('app_encryption_key');
    
    // Si no existe la clave de cifrado, generarla
    if (!encryptionKey) {
      // Generar una clave única por instalación
      encryptionKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `gym-app-secret-${new Date().getTime()}-${Math.random()}`
      );
      // Verificar que el valor no sea null antes de almacenarlo
      if (encryptionKey) {
        await AsyncStorage.setItem('app_encryption_key', encryptionKey);
      } else {
        // Si hay un error generando la clave, usar una clave por defecto (no seguro, solo para evitar errores)
        encryptionKey = 'fallback-encryption-key';
        await AsyncStorage.setItem('app_encryption_key', encryptionKey);
      }
    }

    // Simulación de cifrado simple (¡en producción usa una biblioteca de cifrado!)
    // Este es solo un ejemplo básico, no seguro para producción
    const prefix = encryptionKey.substring(0, 8);
    return btoa(`${prefix}:${text}`);
  }

  /**
   * Descifra datos para uso en la aplicación web
   */
  private async decrypt(encryptedText: string): Promise<string> {
    // Obtener clave de cifrado
    const encryptionKey = await AsyncStorage.getItem('app_encryption_key');
    if (!encryptionKey) return '';

    // Simulación de descifrado simple
    try {
      const decoded = atob(encryptedText);
      const parts = decoded.split(':');
      
      if (parts.length !== 2 || parts[0] !== encryptionKey.substring(0, 8)) {
        return '';
      }
      
      return parts[1];
    } catch (error) {
      console.error('Error decrypting data:', error);
      return '';
    }
  }

  /**
   * Genera un hash de una contraseña para comparaciones locales
   * (útil para validaciones sin enviar contraseña al servidor)
   */
  async hashPassword(password: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  }

  /**
   * Sanea datos de entrada para prevenir inyección
   */
  sanitizeInput(input: string): string {
    // Eliminar caracteres potencialmente peligrosos
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/`/g, '&#96;');
  }

  /**
   * Valida una URL para prevenir redirecciones maliciosas
   */
  isValidUrl(url: string): boolean {
    try {
      // Verificar que es una URL válida
      const parsedUrl = new URL(url);
      
      // Permitir solo HTTP/HTTPS
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return false;
      }
      
      // Lista de dominios permitidos
      const allowedDomains = [
        'yourdomain.com',
        'api.yourdomain.com',
        'cdn.yourdomain.com'
      ];
      
      // En desarrollo permitir localhost
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        allowedDomains.push('localhost');
      }
      
      // Verificar dominio permitido
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      );
    } catch (error) {
      return false;
    }
  }
}

export default new SecurityUtils();