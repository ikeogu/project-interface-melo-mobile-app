import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

export default function SplashScreen({ onFinish }) {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onFinish, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>A</Text>
        </View>
        <Text style={styles.appName}>Aura</Text>
        <Text style={styles.tagline}>Your AI contacts</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center' },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoLetter: { fontSize: 44, fontWeight: '700', color: '#FFFFFF' },
  appName: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
});
