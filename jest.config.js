/**
 * Jest configuration that extends jest-expo and adds a stub transform for
 * react-native/Libraries/NativeComponent/ViewConfigIgnore.js.
 *
 * That file uses a Flow `const T` type-parameter syntax that the version of
 * hermes-parser bundled inside babel-preset-expo (0.29.1) cannot parse.
 * The stub transformer bypasses Babel entirely for this one file.
 */

'use strict';

const expoPreset = require('jest-expo/jest-preset');

// Build the transform map with the stub entry FIRST so it takes precedence
// over the catch-all babel-jest pattern from jest-expo.
const transform = {
  // Stub out ViewConfigIgnore.js — its Flow `const T` type-parameter syntax
  // is not supported by the hermes-parser version bundled in babel-preset-expo.
  'ViewConfigIgnore\\.js$': '<rootDir>/jest-transform-stub.js',
};

// Add all other transforms from the preset after the stub
for (const [pattern, transformer] of Object.entries(expoPreset.transform || {})) {
  transform[pattern] = transformer;
}

module.exports = {
  ...expoPreset,

  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js',
  ],

  transform,
};
