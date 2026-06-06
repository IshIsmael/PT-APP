// Flat ESLint config built on Expo's shared config.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'src/lib/database.types.ts'],
  },
];
