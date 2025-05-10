// packages/mobile/babel.config.js
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        // Añade plugins para mejorar la compatibilidad con módulos CJS
        '@babel/plugin-transform-modules-commonjs',
      ]
    };
  };