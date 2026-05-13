/**
 * Mock for react-native/Libraries/NativeComponent/ViewConfigIgnore.js
 *
 * The real file uses a Flow `const` type-parameter syntax that the version of
 * hermes-parser bundled inside babel-preset-expo cannot parse in the Jest
 * environment. This stub provides the same runtime API so tests can run.
 */

'use strict';

const ignoredViewConfigProps = new WeakSet();

function ConditionallyIgnoredEventHandlers(value) {
  return value;
}

function isIgnored(value) {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}

module.exports = {
  ConditionallyIgnoredEventHandlers,
  isIgnored,
  ignoredViewConfigProps,
};
