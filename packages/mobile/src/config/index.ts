// packages/mobile/src/config/index.ts
// Usa la URL de tu API
export const API_URL = 'http://localhost:3000'; // Cambia esto según tu entorno
// Para dispositivos físicos o emuladores, necesitarás usar la IP de tu máquina
// Por ejemplo: 'http://192.168.1.100:5000'

// Para Expo en desarrollo, puedes usar:
// export const API_URL = Platform.OS === 'android' 
//   ? 'http://10.0.2.2:5000'  // Para emulador Android
//   : 'http://localhost:5000'; // Para iOS