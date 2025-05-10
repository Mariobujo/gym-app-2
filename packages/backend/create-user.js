// packages/backend/create-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-app');

// Definir un esquema de usuario simple
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Generar hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Crear usuario
    const user = new User({
      name: 'Usuario Prueba',
      email: 'test@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Guardar en la base de datos
    await user.save();
    console.log('Usuario creado exitosamente:', user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTestUser();