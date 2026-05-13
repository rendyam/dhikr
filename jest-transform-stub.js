/**
 * A Jest transform that returns a simple stub for files that cannot be
 * parsed by the version of hermes-parser bundled inside babel-preset-expo.
 *
 * Used for:
 *   react-native/Libraries/NativeComponent/ViewConfigIgnore.js
 *   (uses Flow `const T` type-parameter syntax unsupported by hermes-parser 0.29.1)
 */

'use strict';

module.exports = {
  process() {
    return {
      code: `
'use strict';
const ignoredViewConfigProps = new WeakSet();
function DynamicallyInjectedByGestureHandler(object) {
  ignoredViewConfigProps.add(object);
  return object;
}
function ConditionallyIgnoredEventHandlers(value) { return value; }
function isIgnored(value) {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}
Object.defineProperty(exports, '__esModule', { value: true });
exports.DynamicallyInjectedByGestureHandler = DynamicallyInjectedByGestureHandler;
exports.ConditionallyIgnoredEventHandlers = ConditionallyIgnoredEventHandlers;
exports.isIgnored = isIgnored;
exports.ignoredViewConfigProps = ignoredViewConfigProps;
      `.trim(),
    };
  },
};
