import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { NeonButton } from "../components/NeonButton.js";
import { NeonCard } from "../components/NeonCard.js";
import { ENEMY_TYPES } from "../data/enemies.js";
import { POWER_UPS } from "../data/powerUps.js";
import { WEAPONS } from "../data/weapons.js";
import { COLORS, MONO_FONT } from "../lib/theme.js";

const weaponDescriptions = [
  `${WEAPONS.plasma.name}: Balanced default auto-fire.`,
  `${WEAPONS.spread.name}: Three-way burst for crowd control.`,
  `${WEAPONS.laser.name}: Fast, piercing beam weapon.`,
  `${WEAPONS.rocket.name}: Heavy splash damage against packs and bosses.`,
  `${WEAPONS.chain.name}: Arcs between nearby enemies.`
];

const controlLines = [
  "Drag left or right anywhere to move your hero.",
  "Auto-fire stays active while you dodge.",
  "Pick up portals to swap and unlock weapons.",
  "Shield blocks damage, Rapid Fire doubles fire rate, Bomb clears the wave.",
  "A Greatsword Skeleton mini-boss appears every 5 levels."
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.pageGlowTop} />
      <View style={styles.pageGlowBottom} />
      <View style={styles.pageMist} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>ABOUT</Text>
          <NeonButton compact label="HOME" variant="magenta" onPress={() => router.replace("/")} />
        </View>

        <NeonCard>
          <Text style={styles.sectionTitle}>ARSENAL</Text>
          {weaponDescriptions.map((line) => (
            <Text key={line} style={styles.bodyLine}>
              {line}
            </Text>
          ))}
        </NeonCard>

        <NeonCard accent="magenta">
          <Text style={styles.sectionTitle}>CONTROLS</Text>
          {controlLines.map((line) => (
            <Text key={line} style={styles.bodyLine}>
              {line}
            </Text>
          ))}
        </NeonCard>

        <NeonCard>
          <Text style={styles.sectionTitle}>ENEMIES + POWER-UPS</Text>
          <Text style={styles.bodyLine}>
            {Object.values(ENEMY_TYPES)
              .map((enemy) => enemy.name)
              .join(" / ")}
          </Text>
          <Text style={styles.bodyLine}>
            {Object.values(POWER_UPS)
              .map((power) => power.name)
              .join(" / ")}
          </Text>
        </NeonCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  pageGlowTop: {
    position: "absolute",
    top: -70,
    left: -30,
    width: 280,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(153, 170, 132, 0.08)"
  },
  pageGlowBottom: {
    position: "absolute",
    right: -40,
    bottom: 30,
    width: 260,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(132, 105, 118, 0.08)"
  },
  pageMist: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 120,
    height: 150,
    borderRadius: 120,
    backgroundColor: "rgba(190, 197, 176, 0.05)"
  },
  content: {
    padding: 18,
    gap: 14
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1.2
  },
  sectionTitle: {
    marginBottom: 10,
    color: COLORS.gold,
    fontFamily: MONO_FONT,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.2
  },
  bodyLine: {
    color: "#d7c9b2",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6
  }
});
