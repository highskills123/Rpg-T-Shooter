import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { STRIP_FRAME_SIZE } from "../data/gameSprites.js";

export function SpriteStrip({
  source,
  frame = 0,
  frameCount = 6,
  size = STRIP_FRAME_SIZE,
  sourceFrameSize = STRIP_FRAME_SIZE,
  style,
  imageStyle
}) {
  const safeFrame = ((frame % frameCount) + frameCount) % frameCount;
  const scale = size / sourceFrameSize;
  const stripWidth = sourceFrameSize * frameCount * scale;
  const offsetX = safeFrame * size;

  return (
    <View style={[styles.viewport, { width: size, height: size }, style]}>
      <Image
        source={source}
        resizeMode="stretch"
        resizeMethod="resize"
        style={[
          styles.strip,
          {
            width: stripWidth,
            height: size,
            transform: [{ translateX: -offsetX }]
          },
          imageStyle
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: "hidden"
  },
  strip: {
    position: "absolute",
    left: 0,
    top: 0
  }
});
