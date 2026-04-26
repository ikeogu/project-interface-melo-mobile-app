const { withMainApplication } = require('@expo/config-plugins');

/**
 * Config plugin that manually registers LiveKit + WebRTC native packages in
 * Android's MainApplication.kt. Required because @livekit/react-native
 * explicitly does not support Expo managed workflow's auto-linking.
 */
const withLiveKit = (config) => {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('LivekitReactNativePackage')) {
      return config;
    }

    // Modify getPackages() — change the single-line return into a multi-step one
    // that appends both LiveKit packages to the PackageList result.
    contents = contents.replace(
      /return PackageList\(this\)\.packages/,
      [
        'val packages = PackageList(this).packages',
        '              packages.add(com.livekit.reactnative.LivekitReactNativePackage())',
        '              packages.add(com.oney.WebRTCModule.WebRTCModulePackage())',
        '              return packages',
      ].join('\n')
    );

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withLiveKit;
