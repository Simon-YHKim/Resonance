module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // react-native-reanimated/plugin 은 항상 마지막
      'react-native-reanimated/plugin',
    ],
  };
};
