import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

// One animation value shared across all blocks in a list so they pulse in sync
function useSkeletonPulse() {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 850, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return pulse;
}

function Block({ pulse, width, height, borderRadius = 6, style }) {
  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius, opacity: pulse },
        style,
      ]}
    />
  );
}

// ── Row skeletons (pulse passed from parent so all rows sync) ────────────────

function ContactRowSkeleton({ pulse }) {
  return (
    <View style={styles.row}>
      <Block pulse={pulse} width={46} height={46} borderRadius={23} />
      <View style={styles.info}>
        <Block pulse={pulse} width={120} height={14} />
        <Block pulse={pulse} width={170} height={11} style={styles.secondLine} />
      </View>
    </View>
  );
}

function ChatRowSkeleton({ pulse }) {
  return (
    <View style={styles.row}>
      <Block pulse={pulse} width={50} height={50} borderRadius={25} />
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Block pulse={pulse} width={130} height={14} />
          <Block pulse={pulse} width={38} height={10} />
        </View>
        <Block pulse={pulse} width={190} height={11} style={styles.secondLine} />
      </View>
    </View>
  );
}

// ── List-level components (own the shared pulse) ─────────────────────────────

export function ContactsSkeletonList({ count = 7 }) {
  const pulse = useSkeletonPulse();
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <ContactRowSkeleton pulse={pulse} />
          {i < count - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
}

export function ChatsSkeletonList({ count = 7 }) {
  const pulse = useSkeletonPulse();
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <ChatRowSkeleton pulse={pulse} />
          {i < count - 1 && <View style={styles.separator} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  info: { flex: 1, marginLeft: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondLine: { marginTop: 8 },
  block: { backgroundColor: Colors.backgroundTertiary },
  separator: {
    height: 0.5,
    backgroundColor: Colors.separator,
    marginLeft: 74,
  },
});
