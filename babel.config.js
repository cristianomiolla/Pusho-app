module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // IMPORTANTE: worklets-core DEVE venire PRIMA di reanimated
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin',
    ],
  };
};
