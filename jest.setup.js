/**
 * Jest global setup file.
 *
 * Pre-configures React Native Testing Library with known host component names
 * so it skips the auto-detection step that triggers a Babel parse error in
 * react-native 0.81 + jest-expo (ViewConfigIgnore.js uses a Flow `const`
 * type-parameter that the default Babel parser rejects when @flow is present
 * but the hermes-parser override doesn't fire in time).
 */

const { configure } = require('@testing-library/react-native');

configure({
  hostComponentNames: {
    text: 'Text',
    textInput: 'TextInput',
    image: 'Image',
    switch: 'Switch',
    scrollView: 'ScrollView',
    modal: 'Modal',
  },
});
