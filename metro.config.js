const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { resolver } = defaultConfig;

const config = {
  resolver: {
    ...resolver,
    resolverMainFields: ['react-native', 'browser', 'main'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
