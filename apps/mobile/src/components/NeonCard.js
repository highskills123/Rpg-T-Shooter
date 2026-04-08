import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "../lib/theme.js";

export function NeonCard({ children, accent = "cyan", style }) {
  return <View style={[styles.card, styles[accent], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    backgroundColor: COLORS.panel
  },
  cyan: {
    borderColor: "rgba(143, 169, 122, 0.34)",
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 }
  },
  magenta: {
    borderColor: "rgba(138, 92, 114, 0.34)",
    shadowColor: COLORS.magenta,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 }
  }
});
