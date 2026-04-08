import { Platform } from "react-native";

export const COLORS = {
  background: "#12150f",
  panel: "rgba(27, 24, 18, 0.94)",
  cyan: "#8fa97a",
  magenta: "#8a5c72",
  gold: "#c7a56a",
  text: "#f3ead7",
  muted: "#a5967f"
};

export const MONO_FONT = Platform.select({
  ios: "Courier New",
  android: "monospace",
  default: "monospace"
});
