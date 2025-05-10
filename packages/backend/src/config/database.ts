// src/config/database.ts
import mongoose from 'mongoose';
import { MONGO_URI } from './env';

export const connectDB = async (): Promise<void> => {
  console.log(`Attempting to connect to MongoDB with URI: ${MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Oculta credenciales al imprimir
  
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : error}`);
    
    // Agregar más información para diagnóstico
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
    process.exit(1);
  }
};