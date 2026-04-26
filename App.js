import 'react-native-gesture-handler';
import { NativeModules } from 'react-native';
// registerGlobals wires WebRTC globals — only runs when native module is present
if (NativeModules.LivekitReactNativeModule) {
  try {
    const { registerGlobals } = require('@livekit/react-native');
    registerGlobals();
  } catch (e) {
    console.warn('[LiveKit] registerGlobals failed:', e?.message);
  }
}
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
