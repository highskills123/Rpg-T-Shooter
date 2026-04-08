import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { COLORS } from "../lib/theme.js";

export function NeonButton({ label, onPress, variant = "cyan", compact = false, disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled
      ]}
    >
      <Text style={[styles.label, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(35, 30, 24, 0.9)"
  },
  compact: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  cyan: {
    borderColor: COLORS.cyan,
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  magenta: {
    borderColor: COLORS.magenta,
    shadowColor: COLORS.magenta,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  gold: {
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    borderColor: "#5f5547",
    shadowOpacity: 0,
    backgroundColor: "rgba(39, 34, 28, 0.92)"
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2
  },
  disabledLabel: {
    color: "#8d8374"
  }
});
