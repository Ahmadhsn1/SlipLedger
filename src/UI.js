import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
const palettes = {
  light:{paper:"#FAF9F6",white:"#FFFFFF",ink:"#1A1C31",muted:"#54576B",green:"#414CC6",mint:"#DCE2FF",line:"#D8D8E0",gold:"#524993",error:"#A12848"},
  dark:{paper:"#121626",white:"#20263B",ink:"#F1F1FA",muted:"#B5B9CE",green:"#4653AE",mint:"#35416F",line:"#464F6A",gold:"#BEC4FF",error:"#FFA6BC"}
};
export function T({ children, kind = "body", style, ...props }) {
  const {s,color}=useTheme();
  return (
    <Text {...props} style={[s[kind], style]}>
      {children}
    </Text>
  );
}
export function Button({ children, onPress, quiet = false, disabled = false }) {
  const {s,color}=useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        quiet && s.quiet,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <T kind="button" style={{ color: quiet ? color.ink : "#fff" }}>
        {children}
      </T>
    </Pressable>
  );
}
export function Field({ label, ...props }) {
  const {s,color}=useTheme();
  return (
    <View style={{ gap: 5 }}>
      <T kind="label">{label}</T>
      <TextInput
        accessibilityLabel={label}
        maxLength={120}
        placeholderTextColor={color.muted}
        {...props}
        style={s.input}
      />
    </View>
  );
}
export function Chips({ values, selected, onSelect }) {
  const {s,color}=useTheme();
  return (
    <View style={s.wrap}>
      {values.map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === v }}
          onPress={() => onSelect(v)}
          style={[
            s.chip,
            selected === v && {
              backgroundColor: color.mint,
              borderColor: color.green,
            },
          ]}
        >
          <T kind="label">{v}</T>
        </Pressable>
      ))}
    </View>
  );
}
export function Row({ title, detail, amount, onPress }) {
  const {s,color}=useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
      <View style={{ flex: 1, gap: 4 }}>
        <T kind="strong">{title}</T>
        <T kind="note">{detail}</T>
      </View>
      {!!amount && <T kind="label">{amount}</T>}
      <T accessibilityElementsHidden>›</T>
    </Pressable>
  );
}
function styles(color){ return StyleSheet.create({
  body: { fontSize: 16, lineHeight: 23, color: color.ink },
  title: {
    fontSize: 33,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: color.ink,
  },
  strong: { fontSize: 17, fontWeight: "700", color: color.ink },
  label: { fontSize: 14, fontWeight: "600", color: color.ink },
  note: { fontSize: 14, lineHeight: 20, color: color.muted },
  button: { fontSize: 16, fontWeight: "700" },
  cap: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: color.ink,
  },
  btn: {
    backgroundColor: color.green,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  quiet: {
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.white,
  },
  input: {
    color: color.ink,
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 10,
    minHeight: 48,
    padding: 12,
    fontSize: 16,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  row: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: color.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  panel: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  hero: {
    backgroundColor: color.green,
    borderRadius: 20,
    padding: 22,
    gap: 10,
  },
});}

export const themes=Object.fromEntries(Object.entries(palettes).map(([key,color])=>[key,{color,s:styles(color)}]));
export const ThemeContext=React.createContext(themes.light);
export const useTheme=()=>React.useContext(ThemeContext);
export function resolveTheme(preference, system) {
  return preference==="Dark" || (preference!=="Light" && system==="dark") ? themes.dark : themes.light;
}
