import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const palette = { bg: '#09090b', card: '#151518', text: '#fafafa', muted: '#a1a1aa', border: 'rgba(255,255,255,.10)' };
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => { if (mounted) setReduced(v); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}

export function GlassCard({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <LinearGradient colors={['rgba(255,255,255,.18)', 'rgba(255,255,255,.04)']} style={[s.edge, style]}>
    <View style={[s.card, Platform.OS === 'web' && ({ backdropFilter: 'blur(20px)', boxShadow: '0 12px 36px rgba(0,0,0,.15)' } as ViewStyle)]}>{children}</View>
  </LinearGradient>;
}

export function MotionButton({ children, onPress, label, selected, disabled, style }: PropsWithChildren<{
  onPress: () => void; label: string; selected?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}>) {
  const motion = useRef(new Animated.Value(0)).current;
  const pointerX = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const animate = (value: number) => Animated.timing(motion, { toValue: reduced ? 0 : value, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    onHoverIn={() => animate(1)} onHoverOut={() => { animate(0); Animated.timing(pointerX, { toValue: 0, duration: 300, useNativeDriver: false }).start(); }}
    onPointerMove={event => {
      if (Platform.OS === 'web' && !reduced) {
        const element = event.currentTarget as unknown as { getBoundingClientRect?: () => { left: number; width: number } };
        const bounds = element.getBoundingClientRect?.();
        if (bounds?.width) pointerX.setValue(Math.max(-3, Math.min(3, ((event.nativeEvent.clientX - bounds.left) / bounds.width - .5) * 6)));
      }
    }}
    onPressIn={() => animate(-1)} onPressOut={() => animate(0)}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={[s.button, Platform.OS === 'web' && ({ transitionProperty: 'background-color, border-color, opacity', transitionDuration: reduced ? '0ms' : '300ms' } as ViewStyle), style, selected && s.selected, focused && s.focus, disabled && { opacity: .45 }]}>
    <Animated.View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
      transform: [{ translateX: pointerX }, { translateY: motion.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, -2] }) }] }}>{children}</Animated.View>
  </Pressable>;
}

export function Reveal({ children }: PropsWithChildren) {
  const value = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { value.setValue(1); return; }
    value.setValue(0);
    const animation = Animated.timing(value, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' });
    animation.start(); return () => animation.stop();
  }, [reduced, value]);
  return <Animated.View style={{ opacity: value, gap: 24, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>{children}</Animated.View>;
}
export function Radar({ active }: { active: boolean }) {
  const value = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    value.setValue(0);
    if (!active || reduced) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start(); return () => loop.stop();
  }, [active, reduced, value]);
  return <View style={s.radar}>
    {active && <Animated.View style={[s.ring, { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [.5, 0] }), transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }] }]} />}
    <View style={[s.dot, !active && { backgroundColor: '#71717a' }]} />
  </View>;
}
const s = StyleSheet.create({
  edge: { borderRadius: 24, padding: 1, overflow: 'hidden' },
  card: { backgroundColor: 'rgba(20,20,23,.95)', borderRadius: 23, padding: 24, gap: 20, flex: 1 },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 14, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.035)' },
  selected: { backgroundColor: '#fafafa', borderColor: '#fafafa' },
  focus: { borderColor: '#a1a1aa', borderWidth: 2 },
  radar: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  ring: { width: 16, height: 16, position: 'absolute', borderWidth: 1, borderColor: '#fafafa', borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fafafa' },
});
