module.exports = {
  presets: ['module:@react-native/babel-preset', 'babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env.local',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ]
  ],
};
