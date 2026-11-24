import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { themes, useTheme } from "./UI";

const workspaces = ["Personal", "Business"];

export default function WorkspaceSlider({ selected, onSelect }) {
  const dark = useTheme() === themes.dark;
  const position = useRef(new Animated.Value(Number(selected === "Business"))).current;
  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    const update = value => { if (active) setReduceMotion(value); };
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", update);
    return () => { active = false; listener.remove(); };
  }, []);
  useEffect(() => {
    const toValue = Number(selected === "Business");
    if (reduceMotion) { position.setValue(toValue); return; }
    const animation = Animated.timing(position, { toValue, duration: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [position, reduceMotion, selected]);
  const gestures = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
      Math.abs(dx) > 12 && Math.abs(dx) > 1.5 * Math.abs(dy),
    onPanResponderRelease: (_, { dx }) => {
      if (Math.abs(dx) >= 18) onSelect(dx > 0 ? "Business" : "Personal");
    },
  }), [onSelect]);
  const half = Math.max(0, (width - 6) / 2);
  return (
    <View {...gestures.panHandlers} onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: dark ? "#222632" : "#e7e8ef" }]}>
      <Animated.View pointerEvents="none" style={[styles.thumb, {
        backgroundColor: dark ? "#414962" : "#ffffff", width: half,
        transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }],
      }]} />
      {workspaces.map(name => (
        <Pressable key={name} accessibilityRole="button" accessibilityLabel={name + " workspace"}
          accessibilityState={{ selected: selected === name }} onPress={() => onSelect(name)} style={styles.button}>
          <Text style={[styles.label, { color: dark ? (selected === name ? "#fafaff" : "#bdc2d1") :
            (selected === name ? "#252d49" : "#535967") }]}>{name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 232, maxWidth: "100%", alignSelf: "flex-start", borderRadius: 30, padding: 3, flexDirection: "row" },
  thumb: { position: "absolute", top: 3, bottom: 3, left: 3, borderRadius: 30 },
  button: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  label: { fontSize: 14, fontWeight: "600", textAlign: "center" },
});
