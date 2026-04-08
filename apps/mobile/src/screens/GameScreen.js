import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, SafeAreaView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NeonButton } from "../components/NeonButton.js";
import { SpriteStrip } from "../components/SpriteStrip.js";
import { ENEMY_SPRITES, PLAYER_SKILL_EFFECTS, PLAYER_SPRITES } from "../data/gameSprites.js";
import { PLAYER_CHARACTERS, normalizePlayerCharacter } from "../data/playerCharacters.js";
import { POWER_UPS } from "../data/powerUps.js";
import { WEAPONS } from "../data/weapons.js";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  appendNameCharacter,
  buildScoreSubmission,
  createInitialState,
  cycleWeapon,
  deleteNameCharacter,
  pauseGame,
  resumeGame,
  startGame,
  updateGame
} from "../lib/gameEngine.js";
import { submitHighScore } from "../lib/leaderboardApi.js";
import { COLORS, MONO_FONT } from "../lib/theme.js";

const AMBIENT_LAYERS = createAmbientLayers();
const NAME_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
const NAME_KEYS_2 = ["P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3"];
const NAME_KEYS_3 = ["4", "5", "6", "7", "8", "9"];

function createAmbientLayers() {
  return [
    Array.from({ length: 7 }, (_, index) => ({
      id: `mist-${index}`,
      x: 20 + ((index * 73) % 320),
      y: 40 + ((index * 91) % 620),
      size: 150 + (index % 3) * 70,
      color: index % 2 === 0 ? "rgba(175, 187, 151, 0.09)" : "rgba(119, 137, 102, 0.08)",
      driftX: 0.08 + (index % 3) * 0.03,
      driftY: 0.025 + (index % 2) * 0.02
    })),
    Array.from({ length: 12 }, (_, index) => ({
      id: `spore-${index}`,
      x: 24 + ((index * 47) % 340),
      y: (index * 57) % 760,
      size: 8 + (index % 4) * 5,
      color: index % 3 === 0 ? "rgba(209, 186, 136, 0.2)" : "rgba(171, 195, 145, 0.16)",
      driftX: 0.11 + (index % 2) * 0.04,
      driftY: 0.05 + (index % 3) * 0.02
    })),
    Array.from({ length: 10 }, (_, index) => ({
      id: `glow-${index}`,
      x: 28 + ((index * 61) % 330),
      y: (index * 81) % 760,
      size: index % 2 === 0 ? 4 : 3,
      color: index % 2 === 0 ? "rgba(214, 194, 144, 0.7)" : "rgba(191, 214, 164, 0.52)",
      driftX: 0.22 + (index % 3) * 0.04,
      driftY: 0.12 + (index % 2) * 0.05
    }))
  ];
}

function formatScore(value) {
  return `${value}`.padStart(6, "0");
}

function renderAmbient(now) {
  return AMBIENT_LAYERS.flatMap((layer) =>
    layer.map((element) => ({
      ...element,
      drawX: ((element.x + now * element.driftX * 0.01) % (GAME_WIDTH + element.size)) - element.size * 0.3,
      drawY: ((element.y + now * element.driftY * 0.03) % (GAME_HEIGHT + element.size)) - element.size * 0.2
    }))
  );
}

function getLoopingFrame(now, speedMs, frameCount, offset = 0) {
  return Math.floor((now + offset) / speedMs) % frameCount;
}

function getProgressFrame(elapsedMs, durationMs, frameCount) {
  return Math.min(frameCount - 1, Math.floor((Math.max(0, elapsedMs) / durationMs) * frameCount));
}

function Overlay({ children }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>{children}</View>
    </View>
  );
}

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const selectedCharacter = normalizePlayerCharacter(params.character);
  const [gameState, setGameState] = useState(() => createInitialState(Date.now(), selectedCharacter));
  const [clock, setClock] = useState(Date.now());
  const touchTargetRef = useRef(null);
  const frameTimeRef = useRef(Date.now());
  const [savedScore, setSavedScore] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  useEffect(() => {
    setGameState((current) => {
      if (current.player.characterKey === selectedCharacter) {
        return current;
      }
      return {
        ...current,
        player: {
          ...current.player,
          characterKey: selectedCharacter
        }
      };
    });
  }, [selectedCharacter]);

  useEffect(() => {
    if (gameState.screen !== "playing") {
      return undefined;
    }
    frameTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setClock(now);
      setGameState((current) =>
        updateGame(current, {
          now,
          deltaMs: now - frameTimeRef.current,
          input: touchTargetRef.current ?? {}
        })
      );
      frameTimeRef.current = now;
    }, 33);
    return () => clearInterval(interval);
  }, [gameState.screen]);

  useEffect(() => {
    if (!gameState.events.length) {
      return;
    }
    gameState.events.forEach((event) => {
      if (event.type === "player_hit" || event.type === "boss_spawn" || event.type === "game_over") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      if (event.type === "weapon_unlock" || event.type === "powerup" || event.type === "level_up") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      if (event.type === "impact" || event.type === "shield_block" || event.type === "boss_down") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    });
  }, [gameState.events]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gameState.screen === "playing" && Math.abs(gestureState.dx) > 3 && Math.abs(gestureState.dx) >= Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          if (gameState.screen !== "playing") {
            return;
          }
          touchTargetRef.current = {
            target: {
              x: gestureState.moveX
            }
          };
        }
      }),
    [gameState.screen]
  );

  async function handleSubmitScore() {
    if (savedScore || isSubmittingScore) {
      return;
    }
    const submission = buildScoreSubmission(gameState);
    if (submission.name.length !== 3) {
      setGameState((current) => ({
        ...current,
        message: "ENTER 3 CHARS",
        messageUntil: Date.now() + 1400
      }));
      return;
    }
    setIsSubmittingScore(true);
    try {
      const result = await submitHighScore(submission);
      setSavedScore(!result.offline);
      setGameState((current) => ({
        ...current,
        message: result.offline ? "OFFLINE: SCORE NOT SYNCED" : "HIGH SCORE SAVED",
        messageUntil: Date.now() + 1800
      }));
    } finally {
      setIsSubmittingScore(false);
    }
  }

  async function handleShareScore() {
    if (!gameState.shareText) {
      return;
    }
    await Share.share({
      message: gameState.shareText
    });
  }

  function startRun() {
    setSavedScore(false);
    setIsSubmittingScore(false);
    setGameState((current) => startGame(current, Date.now()));
  }

  const ambientElements = renderAmbient(clock);
  const weaponBarBottom = Math.max(18, insets.bottom + 18);
  const playerProfile = PLAYER_CHARACTERS[gameState.player.characterKey];
  const playerSprite = PLAYER_SPRITES[gameState.player.characterKey];
  const playerSkillEffect = PLAYER_SKILL_EFFECTS[gameState.player.characterKey];
  const attackWindowMs = Math.min(280, (WEAPONS[gameState.player.weaponKey]?.fireRateMs ?? 280) + 40);
  const hurtWindowMs = 320;
  const walkWindowMs = 140;
  const deathWindowMs = 640;
  const attackElapsed = Math.max(0, clock - gameState.lastFireAt);
  const hurtElapsed = Math.max(0, clock - (gameState.lastPlayerHitAt ?? 0));
  const walkElapsed = Math.max(0, clock - (gameState.player.lastMoveAt ?? 0));
  const deathElapsed = Math.max(0, clock - (gameState.playerDeathAt ?? 0));
  let playerAnimation = "idle";
  if (gameState.screen === "gameOver") {
    playerAnimation = "death";
  } else if (gameState.screen === "playing" && hurtElapsed < hurtWindowMs) {
    playerAnimation = "hurt";
  } else if (gameState.screen === "playing" && attackElapsed < attackWindowMs) {
    playerAnimation = "attack";
  } else if (gameState.screen === "playing" && walkElapsed < walkWindowMs) {
    playerAnimation = "walk";
  }
  const playerAnimationStrip = playerSprite.animations[playerAnimation];
  const playerFrame =
    playerAnimation === "attack"
      ? getProgressFrame(attackElapsed, attackWindowMs, playerAnimationStrip.frameCount)
      : playerAnimation === "hurt"
        ? getProgressFrame(hurtElapsed, hurtWindowMs, playerAnimationStrip.frameCount)
        : playerAnimation === "death"
          ? getProgressFrame(deathElapsed, deathWindowMs, playerAnimationStrip.frameCount)
          : getLoopingFrame(clock, playerAnimation === "walk" ? 90 : 140, playerAnimationStrip.frameCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.gameSurface} {...panResponder.panHandlers}>
          <View style={styles.canopyShadow} />
          <View style={styles.forestGlow} />
          <View style={styles.groveBloom} />
          <View style={styles.groundMistA} />
          <View style={styles.groundMistB} />
          <View style={styles.backgroundGlowA} />
          <View style={styles.backgroundGlowB} />
          {ambientElements.map((element) => (
            <View
              key={element.id}
              style={[
                styles.star,
                {
                  left: element.drawX,
                  top: element.drawY,
                  width: element.size,
                  height: element.size,
                  backgroundColor: element.color
                }
              ]}
            />
          ))}

          {gameState.screen !== "menu" && (
            <>
              <View style={styles.hud}>
                <View>
                  <Text style={styles.hudLabel}>SCORE</Text>
                  <Text style={styles.hudValue}>{formatScore(gameState.score)}</Text>
                </View>
                <View>
                  <Text style={styles.hudLabel}>LEVEL</Text>
                  <Text style={styles.hudValue}>{gameState.level}</Text>
                </View>
                <View>
                  <Text style={styles.hudLabel}>HP</Text>
                  <Text style={styles.hudValue}>{Math.max(gameState.player.hp, 0)}</Text>
                </View>
              </View>

              {gameState.message ? <Text style={styles.messageBanner}>{gameState.message}</Text> : null}

              {gameState.bullets.map((bullet) => (
                <View
                  key={bullet.id}
                  style={[
                    styles.projectileSkill,
                    {
                      left: bullet.x - playerSkillEffect.size / 2,
                      top: bullet.y - playerSkillEffect.size / 2,
                      width: playerSkillEffect.size,
                      height: playerSkillEffect.size,
                      transform: [{ rotate: playerSkillEffect.rotation }]
                    }
                  ]}
                >
                  <SpriteStrip
                    source={playerSkillEffect.source}
                    size={playerSkillEffect.size}
                    frame={Math.floor((clock + bullet.id * 35) / 70) % playerSkillEffect.frameCount}
                    frameCount={playerSkillEffect.frameCount}
                  />
                </View>
              ))}
              {gameState.enemyBullets.map((bullet) => (
                <View
                  key={bullet.id}
                  style={[
                    styles.enemyProjectile,
                    {
                      left: bullet.x - bullet.radius,
                      top: bullet.y - bullet.radius,
                      width: bullet.radius * 2,
                      height: bullet.radius * 2
                    }
                  ]}
                />
              ))}
              {gameState.pickups.map((pickup) => (
                <View
                  key={pickup.id}
                  style={[
                    styles.pickup,
                    {
                      left: pickup.x - pickup.size,
                      top: pickup.y - pickup.size,
                      width: pickup.size * 2,
                      height: pickup.size * 2,
                      borderColor:
                        pickup.kind === "portal" ? WEAPONS[pickup.weaponKey].color : POWER_UPS[pickup.powerKey].color
                    }
                  ]}
                >
                  <Text style={styles.pickupText}>{pickup.kind === "portal" ? "P" : pickup.powerKey[0].toUpperCase()}</Text>
                </View>
              ))}
              {gameState.enemies.map((enemy) => {
                const sprite = ENEMY_SPRITES[enemy.type];
                const hurtElapsedEnemy = Math.max(0, clock - (enemy.lastHitAt ?? 0));
                const attackElapsedEnemy = Math.max(0, clock - (enemy.lastAttackAt ?? 0));
                const enemyAnimation =
                  hurtElapsedEnemy < 280 ? "hurt" : attackElapsedEnemy < 320 ? "attack" : "walk";
                const strip = sprite.animations[enemyAnimation];
                const frame =
                  enemyAnimation === "hurt"
                    ? getProgressFrame(hurtElapsedEnemy, 280, strip.frameCount)
                    : enemyAnimation === "attack"
                      ? getProgressFrame(attackElapsedEnemy, 320, strip.frameCount)
                      : getLoopingFrame(clock, 120, strip.frameCount, enemy.id * 80);
                return (
                  <View
                    key={enemy.id}
                    style={[
                      styles.enemySpriteWrap,
                      enemy.type === "boss" && styles.enemyBossWrap,
                      {
                        left: enemy.x - sprite.size / 2,
                        top: enemy.y - sprite.size / 2,
                        width: sprite.size,
                        height: sprite.size
                      }
                    ]}
                  >
                    <SpriteStrip source={strip.source} size={sprite.size} frame={frame} frameCount={strip.frameCount} />
                  </View>
                );
              })}
              {gameState.defeatedEnemies.map((enemy) => {
                const sprite = ENEMY_SPRITES[enemy.type];
                const strip = sprite.animations.death;
                const frame = getProgressFrame(clock - enemy.defeatedAt, 520, strip.frameCount);
                return (
                  <View
                    key={`defeated-${enemy.id}-${enemy.defeatedAt}`}
                    style={[
                      styles.enemySpriteWrap,
                      enemy.type === "boss" && styles.enemyBossWrap,
                      {
                        left: enemy.x - sprite.size / 2,
                        top: enemy.y - sprite.size / 2,
                        width: sprite.size,
                        height: sprite.size
                      }
                    ]}
                  >
                    <SpriteStrip source={strip.source} size={sprite.size} frame={frame} frameCount={strip.frameCount} />
                  </View>
                );
              })}
              {gameState.player.shieldUntil > Date.now() && (
                <View
                  style={[
                    styles.playerShieldAura,
                    {
                      left: gameState.player.x - playerSprite.size * 0.55,
                      top: gameState.player.y - playerSprite.size * 0.55,
                      width: playerSprite.size * 1.1,
                      height: playerSprite.size * 1.1
                    }
                  ]}
                />
              )}
              <View
                style={[
                  styles.playerSpriteWrap,
                  {
                    left: gameState.player.x - playerSprite.size / 2,
                    top: gameState.player.y - playerSprite.size / 2,
                    width: playerSprite.size,
                    height: playerSprite.size
                  }
                ]}
              >
                <SpriteStrip
                  source={playerAnimationStrip.source}
                  size={playerSprite.size}
                  frame={playerFrame}
                  frameCount={playerAnimationStrip.frameCount}
                />
              </View>
              <View style={[styles.weaponBar, { bottom: weaponBarBottom }]}>
                {gameState.availableWeapons.map((weaponKey) => (
                  <NeonButton
                    key={weaponKey}
                    compact
                    label={weaponKey.slice(0, 3).toUpperCase()}
                    variant={gameState.player.weaponKey === weaponKey ? "magenta" : "cyan"}
                    onPress={() => setGameState((current) => cycleWeapon(current, weaponKey))}
                  />
                ))}
                {gameState.screen === "playing" && (
                  <NeonButton compact label="II" variant="gold" onPress={() => setGameState((current) => pauseGame(current))} />
                )}
              </View>
            </>
          )}

          {gameState.screen === "menu" && (
            <Overlay>
              <Text style={styles.overlayTitle}>READY</Text>
              <View style={styles.readyHeroPreview}>
                <SpriteStrip
                  source={playerSprite.animations.idle.source}
                  size={playerSprite.previewSize}
                  frame={0}
                  frameCount={playerSprite.animations.idle.frameCount}
                />
              </View>
              <Text style={styles.readyHeroName}>{playerProfile.name}</Text>
              <Text style={styles.overlayBody}>
                {playerProfile.name} is locked in. Slide left and right, auto-fire never stops, and every 5th level drops a
                Greatsword Skeleton mini-boss.
              </Text>
              <View style={styles.buttonRow}>
                <NeonButton label="LAUNCH" onPress={startRun} />
                <NeonButton label="MENU" variant="magenta" onPress={() => router.replace("/")} />
              </View>
            </Overlay>
          )}

          {gameState.screen === "paused" && (
            <Overlay>
              <Text style={styles.overlayTitle}>PAUSED</Text>
              <Text style={styles.overlayBody}>Combat is frozen. Resume the run or quit back to the main menu.</Text>
              <View style={styles.buttonRow}>
                <NeonButton label="RESUME" onPress={() => setGameState((current) => resumeGame(current, Date.now()))} />
                <NeonButton label="QUIT" variant="magenta" onPress={() => router.replace("/")} />
              </View>
            </Overlay>
          )}

          {gameState.screen === "gameOver" && (
            <Overlay>
              <Text style={styles.overlayTitle}>GAME OVER</Text>
              <Text style={styles.overlayBody}>
                Score {formatScore(gameState.score)} // Level {gameState.level} // Kills {gameState.kills}
              </Text>
              <Text style={styles.overlayCaption}>Enter your 3-character pilot tag</Text>
              <Text style={styles.nameEntry}>{gameState.nameEntry.padEnd(3, "_")}</Text>
              <NamePad
                onPress={(key) => {
                  setGameState((current) => appendNameCharacter(current, key));
                }}
              />
              <View style={styles.buttonRow}>
                <NeonButton label="DEL" variant="magenta" onPress={() => setGameState((current) => deleteNameCharacter(current))} />
                <NeonButton
                  label={savedScore ? "SAVED" : isSubmittingScore ? "SAVING" : "ENTER"}
                  variant="gold"
                  disabled={savedScore || isSubmittingScore || gameState.nameEntry.length !== 3}
                  onPress={handleSubmitScore}
                />
              </View>
              <View style={styles.buttonRow}>
                <NeonButton label="SHARE" variant="gold" onPress={handleShareScore} />
                <NeonButton label="MENU" variant="magenta" onPress={() => router.replace("/")} />
              </View>
            </Overlay>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function NamePad({ onPress }) {
  return (
    <View style={styles.namePad}>
      {[NAME_KEYS, NAME_KEYS_2, NAME_KEYS_3].map((row, index) => (
        <View key={`row-${index}`} style={styles.namePadRow}>
          {row.map((key) => (
            <NeonButton key={key} compact label={key} variant="cyan" onPress={() => onPress(key)} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background
  },
  gameSurface: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    overflow: "hidden",
    backgroundColor: "#151912",
    borderWidth: 1,
    borderColor: "rgba(143, 169, 122, 0.28)",
    borderRadius: 28
  },
  backgroundGlowA: {
    position: "absolute",
    width: 320,
    height: 220,
    borderRadius: 220,
    top: -40,
    left: -40,
    backgroundColor: "rgba(166, 178, 140, 0.08)"
  },
  backgroundGlowB: {
    position: "absolute",
    width: 290,
    height: 240,
    borderRadius: 240,
    right: -50,
    bottom: 70,
    backgroundColor: "rgba(127, 102, 116, 0.08)"
  },
  canopyShadow: {
    position: "absolute",
    top: -120,
    left: -50,
    right: -50,
    height: 230,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
    backgroundColor: "rgba(31, 40, 27, 0.22)"
  },
  forestGlow: {
    position: "absolute",
    width: 420,
    height: 220,
    borderRadius: 220,
    left: -30,
    top: 110,
    backgroundColor: "rgba(127, 144, 110, 0.09)"
  },
  groveBloom: {
    position: "absolute",
    width: 260,
    height: 180,
    borderRadius: 180,
    right: 20,
    top: 210,
    backgroundColor: "rgba(142, 114, 126, 0.08)"
  },
  groundMistA: {
    position: "absolute",
    left: -40,
    right: -20,
    bottom: 80,
    height: 140,
    borderRadius: 120,
    backgroundColor: "rgba(189, 197, 173, 0.08)"
  },
  groundMistB: {
    position: "absolute",
    left: 20,
    right: 10,
    bottom: 10,
    height: 120,
    borderRadius: 120,
    backgroundColor: "rgba(120, 135, 106, 0.1)"
  },
  star: {
    position: "absolute",
    borderRadius: 4
  },
  hud: {
    position: "absolute",
    top: 16,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 5
  },
  hudLabel: {
    color: "#aea18d",
    fontSize: 11,
    fontFamily: MONO_FONT,
    letterSpacing: 1.1
  },
  hudValue: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: MONO_FONT,
    fontWeight: "800"
  },
  messageBanner: {
    position: "absolute",
    top: 84,
    alignSelf: "center",
    color: COLORS.text,
    fontFamily: MONO_FONT,
    letterSpacing: 1.2,
    textAlign: "center",
    backgroundColor: "rgba(31, 27, 21, 0.82)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  player: {
    position: "absolute",
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.cyan,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    shadowColor: COLORS.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    backgroundColor: "rgba(38, 32, 25, 0.88)"
  },
  playerShielded: {
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold
  },
  playerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.magenta
  },
  enemy: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(33, 28, 22, 0.92)"
  },
  enemyCore: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  playerSpriteWrap: {
    position: "absolute",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  playerShieldAura: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(199, 165, 106, 0.88)",
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 }
  },
  enemySpriteWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  enemyBossWrap: {
    shadowColor: COLORS.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 }
  },
  projectileSkill: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  enemyProjectile: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: COLORS.gold
  },
  pickup: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 25, 19, 0.88)"
  },
  pickupText: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontWeight: "900",
    fontSize: 11
  },
  weaponBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 9, 6, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  overlayCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(143, 169, 122, 0.34)",
    backgroundColor: "rgba(27, 24, 18, 0.96)",
    padding: 18,
    gap: 14
  },
  overlayTitle: {
    color: COLORS.text,
    fontFamily: MONO_FONT,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  overlayBody: {
    color: "#d8ccb8",
    textAlign: "center",
    lineHeight: 20
  },
  overlayCaption: {
    color: "#a5967f",
    textAlign: "center"
  },
  readyHeroPreview: {
    alignSelf: "center",
    width: 108,
    height: 108,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(199, 165, 106, 0.34)",
    backgroundColor: "rgba(34, 29, 22, 0.95)",
    alignItems: "center",
    justifyContent: "center"
  },
  readyHeroName: {
    color: COLORS.gold,
    fontFamily: MONO_FONT,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center"
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  nameEntry: {
    color: COLORS.gold,
    fontFamily: MONO_FONT,
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 12,
    marginLeft: 12
  },
  namePad: {
    gap: 8
  },
  namePadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap"
  }
});
