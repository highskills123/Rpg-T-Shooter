import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { NeonButton } from "../components/NeonButton.js";
import { NeonCard } from "../components/NeonCard.js";
import { SpriteStrip } from "../components/SpriteStrip.js";
import { ENEMY_TYPES } from "../data/enemies.js";
import { PLAYER_CHARACTERS, PLAYER_CHARACTER_ORDER, DEFAULT_PLAYER_CHARACTER } from "../data/playerCharacters.js";
import { PLAYER_SPRITES } from "../data/gameSprites.js";
import { fetchHighScores } from "../lib/leaderboardApi.js";
import { COLORS, MONO_FONT } from "../lib/theme.js";

export default function MenuScreen() {
  const router = useRouter();
  const [scores, setScores] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(DEFAULT_PLAYER_CHARACTER);

  const selectedProfile = PLAYER_CHARACTERS[selectedCharacter];
  const selectedSprite = PLAYER_SPRITES[selectedCharacter];

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      fetchHighScores().then((nextScores) => {
        if (mounted) {
          setScores(nextScores);
        }
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View />
          <NeonButton compact label="ABOUT" variant="magenta" onPress={() => router.push("/about")} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>RETRO FANTASY BARRAGE</Text>
          <Text style={styles.title}>Rpg T Shooter</Text>
          <Text style={styles.subtitle}>
            Retro top-down survival with woodland, fairy, and storybook combat tones across a dark enchanted battlefield.
          </Text>
          <View style={styles.heroLoadout}>
            <View style={styles.heroPreview}>
              <SpriteStrip
                source={selectedSprite.animations.idle.source}
                size={selectedSprite.previewSize}
                frame={0}
                frameCount={selectedSprite.animations.idle.frameCount}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>SELECTED HERO</Text>
              <Text style={styles.heroName}>{selectedProfile.name}</Text>
              <Text style={styles.heroDescription}>{selectedProfile.description}</Text>
            </View>
          </View>
          <NeonButton
            label={`PLAY AS ${selectedProfile.name.toUpperCase()}`}
            onPress={() =>
              router.push({
                pathname: "/game",
                params: { character: selectedCharacter }
              })
            }
          />
        </View>

        <NeonCard>
          <Text style={styles.sectionTitle}>CHOOSE YOUR HERO</Text>
          <View style={styles.characterGrid}>
            {PLAYER_CHARACTER_ORDER.map((characterKey) => {
              const profile = PLAYER_CHARACTERS[characterKey];
              const sprite = PLAYER_SPRITES[characterKey];
              const selected = characterKey === selectedCharacter;
              return (
                <Pressable
                  key={characterKey}
                  onPress={() => setSelectedCharacter(characterKey)}
                  style={[styles.characterOption, selected && styles.characterOptionSelected]}
                >
                  <SpriteStrip source={sprite.animations.idle.source} size={124} frame={0} frameCount={sprite.animations.idle.frameCount} />
                  <Text style={[styles.characterName, selected && styles.characterNameSelected]}>{profile.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </NeonCard>

        <NeonCard accent="magenta">
          <Text style={styles.sectionTitle}>HIGH SCORES</Text>
          {scores.slice(0, 10).map((entry, index) => (
            <View key={`${entry.name}-${entry.score}-${index}`} style={styles.scoreRow}>
              <Text style={styles.scoreText}>
                {`${index + 1}`.padStart(2, "0")} {entry.name}
              </Text>
              <Text style={styles.scoreText}>{`${entry.score}`.padStart(6, "0")}</Text>
            </View>
          ))}
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
  content: {
    padding: 18,
    gap: 14
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  hero: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 28,
    backgroundColor: "#19150f",
    borderWidth: 1,
    borderColor: "rgba(143, 169, 122, 0.3)"
  },
  kicker: {
    color: COLORS.magenta,
    fontFamily: MONO_FONT,
    fontSize: 12,
    letterSpacing: 1.8
  },
  title: {
    marginTop: 10,
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800"
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 18,
    color: "#d8ccb8",
    fontSize: 15,
    lineHeight: 22
  },
  heroLoadout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18
  },
  heroPreview: {
    width: 90,
    height: 90,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(199, 165, 106, 0.38)",
    backgroundColor: "rgba(31, 27, 21, 0.96)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroCopy: {
    flex: 1,
    gap: 4
  },
  heroLabel: {
    color: COLORS.gold,
    fontFamily: MONO_FONT,
    fontSize: 11,
    letterSpacing: 1.4
  },
  heroName: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 20,
    fontWeight: "800"
  },
  heroDescription: {
    color: "#d7c9b2",
    fontSize: 14,
    lineHeight: 20
  },
  sectionTitle: {
    marginBottom: 10,
    color: COLORS.gold,
    fontFamily: MONO_FONT,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.2
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  scoreText: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 15
  },
  characterGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  characterOption: {
    width: "31%",
    minHeight: 164,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(143, 169, 122, 0.22)",
    backgroundColor: "rgba(31, 27, 21, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 10
  },
  characterOptionSelected: {
    borderColor: "rgba(199, 165, 106, 0.76)",
    backgroundColor: "rgba(58, 46, 28, 0.88)"
  },
  characterName: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 12,
    textAlign: "center"
  },
  characterNameSelected: {
    color: COLORS.gold
  }
});
