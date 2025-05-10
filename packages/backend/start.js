// Crear mocks para todas las dependencias problemáticas
global.TurboModuleRegistry = { getEnforcing: () => ({}) };

// Mock react-native y react-native-gesture-handler
require.cache[require.resolve('react-native')] = {
  exports: {}
};

require.cache[require.resolve('react-native-gesture-handler')] = {
  exports: {}
};

require('ts-node').register({ 
  transpileOnly: true, 
  skipProject: true,
  compilerOptions: {
    module: "CommonJS",
    moduleResolution: "Node"
  }
});

require('./src/server.ts');