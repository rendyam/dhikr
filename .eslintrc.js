// ESLint legacy config (eslintrc format) — compatible with ESLint 9 via ESLINT_USE_FLAT_CONFIG=false
// or via the eslint.config.js flat config below. We use the legacy format here for
// compatibility with eslint-plugin-react-native which does not yet support flat config.
module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-console': 'warn',
  },
};
