module.exports = function (api) {
  // Cache based on the NODE_ENV so test vs non-test configs are cached separately.
  const isTest = api.cache.using(() => process.env.NODE_ENV === 'test');
  return {
    presets: [
      [
        'babel-preset-expo',
        // Disable the react-native-reanimated Babel plugin in the test
        // environment — it requires 'react-native-worklets/plugin' which is
        // not installed and is not needed for unit tests.
        isTest ? { reanimated: false } : {},
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
