// packages/scripts/security-check.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directorios a revisar
const directories = [
  'packages/backend',
  'packages/mobile',
  'packages/shared'
];

console.log('🔍 Iniciando revisión de seguridad...');

// Verificar dependencias vulnerables
console.log('\n📦 Verificando dependencias con vulnerabilidades conocidas...');
directories.forEach(dir => {
  console.log(`\nRevisando ${dir}:`);
  try {
    execSync(`cd ${dir} && npm audit`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`⚠️ Se encontraron vulnerabilidades en ${dir}`);
  }
});

// Verificar problemas de código con ESLint security plugin
console.log('\n🔎 Verificando problemas de seguridad en el código...');
try {
  // Asegúrate de tener instalado eslint-plugin-security
  execSync('npx eslint --ext .ts,.tsx --no-error-on-unmatched-pattern packages/backend/src packages/mobile/src packages/shared/src -c .eslintrc.security.js', 
    { stdio: 'inherit' });
} catch (error) {
  console.error('⚠️ Se encontraron problemas potenciales de seguridad en el código');
}

// Verificar configuraciones sensibles
console.log('\n⚙️ Verificando configuraciones sensibles...');

// Verificar si hay secretos en código
console.log('\n🔑 Buscando secretos en el código fuente...');
try {
  execSync('npx detect-secrets-cli scan .', { stdio: 'inherit' });
} catch (error) {
  console.error('Error al buscar secretos:', error.message);
}

console.log('\n✅ Revisión de seguridad completada');