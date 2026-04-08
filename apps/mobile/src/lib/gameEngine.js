import { ENEMY_TYPES, getEnemyPoolForLevel } from "../data/enemies.js";
import { ENEMY_SKILL_PROFILES } from "../data/enemySkillProfiles.js";
import { DEFAULT_PLAYER_CHARACTER, normalizePlayerCharacter } from "../data/playerCharacters.js";
import { PLAYER_SKILL_PROFILES } from "../data/playerSkillProfiles.js";
import { POWER_UPS, POWER_UP_DROP_KEYS } from "../data/powerUps.js";
import { WEAPONS, WEAPON_ORDER, WEAPON_UNLOCK_MILESTONES } from "../data/weapons.js";

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 760;
const PLAYER_BOUNDS_PADDING = 26;
const PLAYER_START_Y = GAME_HEIGHT - 94;
const PLAYER_BODY_RADIUS = 22;
const PLAYER_HIT_RADIUS = 14;
const MAX_ENEMIES = 18;
const ENEMY_MELEE_GAP = 10;
const ENEMY_MELEE_COOLDOWN_MS = 920;
const ENEMY_DEATH_ANIMATION_MS = 520;
const ENEMY_AGGRO_RANGE = 160;
const BOSS_DEFEATS_TO_ADVANCE = 3;
const LEVEL_KILL_TARGETS = [8, 11, 15, 19];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function pushEvent(events, type, payload = {}) {
  events.push({
    type,
    ...payload
  });
}

export function normalizeArcadeName(value) {
  return `${value ?? ""}`
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
}

export function getNextWeaponUnlock(kills, availableWeapons) {
  return WEAPON_UNLOCK_MILESTONES.find(
    (milestone) => kills >= milestone.kills && !availableWeapons.includes(milestone.weaponKey)
  );
}

export function getWeaponLabel(weaponKey) {
  return WEAPONS[weaponKey]?.name ?? weaponKey;
}

function createPlayer(characterKey = DEFAULT_PLAYER_CHARACTER) {
  return {
    x: GAME_WIDTH / 2,
    y: PLAYER_START_Y,
    size: PLAYER_BODY_RADIUS,
    hitRadius: PLAYER_HIT_RADIUS,
    hp: 3,
    characterKey: normalizePlayerCharacter(characterKey),
    lastMoveAt: 0,
    weaponKey: "plasma",
    shieldUntil: 0,
    rapidUntil: 0
  };
}

function getTierLevel(level) {
  return ((level - 1) % 5) + 1;
}

function getDifficultyLoop(level) {
  return Math.floor((level - 1) / 5);
}

function getKillGoalForLevel(level) {
  const tierLevel = getTierLevel(level);
  if (tierLevel === 5) {
    return BOSS_DEFEATS_TO_ADVANCE;
  }
  return LEVEL_KILL_TARGETS[tierLevel - 1] + getDifficultyLoop(level) * 4;
}

function createBaseState(now = 0, characterKey = DEFAULT_PLAYER_CHARACTER) {
  return {
    screen: "menu",
    player: createPlayer(characterKey),
    bullets: [],
    enemyBullets: [],
    enemies: [],
    defeatedEnemies: [],
    pickups: [],
    availableWeapons: ["plasma"],
    pendingUnlocks: [],
    leaderboard: {
      all: [],
      weekly: [],
      monthly: []
    },
    score: 0,
    kills: 0,
    level: 1,
    levelProgressKills: 0,
    bossDefeatsOnLevel: 0,
    lastTickAt: now,
    lastFireAt: now,
    spawnBudgetMs: 0,
    nextId: 1,
    activeBossLevel: null,
    message: "RPG T SHOOTER",
    messageUntil: now + 3000,
    nameEntry: "",
    shareText: "",
    lastPlayerHitAt: 0,
    playerDeathAt: 0,
    events: []
  };
}

export function createInitialState(now = 0, characterKey = DEFAULT_PLAYER_CHARACTER) {
  return createBaseState(now, characterKey);
}

export function startGame(state, now = Date.now()) {
  const characterKey = state?.player?.characterKey ?? DEFAULT_PLAYER_CHARACTER;
  return {
    ...createBaseState(now, characterKey),
    screen: "playing",
    message: "MOVE LEFT / RIGHT // AUTO FIRE",
    messageUntil: now + 2600
  };
}

export function pauseGame(state) {
  if (state.screen !== "playing") {
    return state;
  }
  return {
    ...state,
    screen: "paused",
    events: [{ type: "pause" }]
  };
}

export function resumeGame(state, now = Date.now()) {
  if (state.screen !== "paused") {
    return state;
  }
  return {
    ...state,
    screen: "playing",
    lastTickAt: now,
    message: "RESUMED",
    messageUntil: now + 1200,
    events: [{ type: "resume" }]
  };
}

export function quitToMenu(state) {
  return {
    ...createBaseState(Date.now()),
    leaderboard: state.leaderboard
  };
}

export function setLeaderboard(state, leaderboard) {
  return {
    ...state,
    leaderboard: leaderboard ?? state.leaderboard
  };
}

export function cycleWeapon(state, weaponKey) {
  if (!state.availableWeapons.includes(weaponKey)) {
    return state;
  }
  return {
    ...state,
    player: {
      ...state.player,
      weaponKey
    },
    message: getWeaponLabel(weaponKey).toUpperCase(),
    messageUntil: Date.now() + 1000
  };
}

export function appendNameCharacter(state, character) {
  if (state.screen !== "gameOver") {
    return state;
  }
  const nextName = normalizeArcadeName(`${state.nameEntry}${character}`);
  return {
    ...state,
    nameEntry: nextName
  };
}

export function deleteNameCharacter(state) {
  if (state.screen !== "gameOver") {
    return state;
  }
  return {
    ...state,
    nameEntry: state.nameEntry.slice(0, -1)
  };
}

export function createEnemy(typeKey, x, y, now, id) {
  const definition = ENEMY_TYPES[typeKey];
  const level = arguments[5] ?? 1;
  const loop = getDifficultyLoop(level);
  const isBoss = definition.key === "boss";
  return {
    id,
    type: definition.key,
    x,
    y,
    size: definition.size,
    hitRadius: definition.hitRadius ?? definition.size,
    hp: definition.hp + loop * (isBoss ? 10 : 1),
    maxHp: definition.hp + loop * (isBoss ? 10 : 1),
    speed: definition.speed + loop * (isBoss ? 0.08 : 0.18),
    score: definition.score + loop * Math.round(definition.score * 0.35),
    fireRateMs: definition.fireRateMs ? Math.max(1050, definition.fireRateMs - loop * 160) : 0,
    nextShotAt: now + (definition.fireRateMs ? Math.max(1050, definition.fireRateMs - loop * 160) : 0),
    nextMeleeAt: now + ENEMY_MELEE_COOLDOWN_MS,
    lastHitAt: 0,
    lastAttackAt: 0,
    vx: definition.key === "boss" ? 1.2 : 0,
    laneX: x
  };
}

function createPlayerProjectile(id, player, weapon, angle = 0) {
  const skillProfile = PLAYER_SKILL_PROFILES[player.characterKey];
  return {
    id,
    owner: "player",
    x: player.x,
    y: player.y - player.size,
    vx: Math.sin(angle) * weapon.projectileSpeed,
    vy: -Math.cos(angle) * weapon.projectileSpeed,
    radius: skillProfile?.hitRadius ?? weapon.projectileRadius,
    damage: weapon.damage,
    weaponKey: weapon.key,
    pierce: weapon.pierce ?? 1,
    splashRadius: weapon.splashRadius ?? 0,
    chainRadius: weapon.chainRadius ?? 0,
    chainTargets: weapon.chainTargets ?? 0
  };
}

function createEnemyProjectile(id, enemy, angle = 0) {
  const profile = ENEMY_SKILL_PROFILES[enemy.type];
  const rotationDeg = profile?.rotateWithAngle ? `${90 + Math.round((angle * 180) / Math.PI)}deg` : "0deg";
  return {
    id,
    owner: "enemy",
    x: enemy.x,
    y: enemy.y + enemy.size,
    vx: Math.sin(angle) * (profile?.projectileSpeed ?? 4),
    vy: Math.cos(angle) * (profile?.projectileSpeed ?? 4.6),
    radius: profile?.hitRadius ?? (enemy.type === "boss" ? 7 : 5),
    damage: profile?.damage ?? (enemy.type === "boss" ? 2 : 1),
    visualKey: profile?.visualKey ?? null,
    visualSize: profile?.size ?? 0,
    visualFrameCount: profile?.frameCount ?? 1,
    rotationDeg
  };
}

function getSpawnInterval(level) {
  return Math.max(280, 1280 - getTierLevel(level) * 95 - getDifficultyLoop(level) * 140);
}

function applyWeaponFire(state, now, nextId, events) {
  const weapon = WEAPONS[state.player.weaponKey];
  const rapidBoost = state.player.rapidUntil > now ? 2 : 1;
  const fireRate = weapon.fireRateMs / rapidBoost;
  if (now - state.lastFireAt < fireRate) {
    return {
      bullets: state.bullets,
      nextId,
      lastFireAt: state.lastFireAt
    };
  }

  const bullets = [...state.bullets];
  if (weapon.spreadAngles) {
    for (const angle of weapon.spreadAngles) {
      bullets.push(createPlayerProjectile(nextId, state.player, weapon, angle));
      nextId += 1;
    }
  } else {
    bullets.push(createPlayerProjectile(nextId, state.player, weapon));
    nextId += 1;
  }

  pushEvent(events, "fire");
  return {
    bullets,
    nextId,
    lastFireAt: now
  };
}

function maybeSpawnEnemy(state, now, random, nextId, enemies, events) {
  const bossAlreadyActive = enemies.some((enemy) => enemy.type === "boss");
  if (state.level % 5 === 0 && !bossAlreadyActive && state.activeBossLevel !== state.level) {
    enemies.push(createEnemy("boss", GAME_WIDTH / 2, 92, now, nextId, state.level));
    pushEvent(events, "boss_spawn");
    return {
      nextId: nextId + 1,
      activeBossLevel: state.level
    };
  }

  if (bossAlreadyActive || enemies.length >= MAX_ENEMIES) {
    return {
      nextId,
      activeBossLevel: state.activeBossLevel
    };
  }

  const pool = getEnemyPoolForLevel(state.level);
  const typeKey = pool[Math.floor(random() * pool.length)];
  const spawnX = 40 + random() * (GAME_WIDTH - 80);
  enemies.push(createEnemy(typeKey, spawnX, -24, now, nextId, state.level));
  return {
    nextId: nextId + 1,
    activeBossLevel: state.activeBossLevel
  };
}

function moveEntities(state, player, bullets, enemyBullets, enemies, pickups) {
  const movedBullets = bullets
    .map((bullet) => ({
      ...bullet,
      x: bullet.x + bullet.vx,
      y: bullet.y + bullet.vy
    }))
    .filter((bullet) => bullet.y > -30 && bullet.y < GAME_HEIGHT + 30 && bullet.x > -30 && bullet.x < GAME_WIDTH + 30);

  const movedEnemyBullets = enemyBullets
    .map((bullet) => ({
      ...bullet,
      x: bullet.x + bullet.vx,
      y: bullet.y + bullet.vy
    }))
    .filter((bullet) => bullet.y > -30 && bullet.y < GAME_HEIGHT + 30);

  const movedEnemies = enemies
    .map((enemy) => {
      const stopY = player.y - (player.hitRadius ?? player.size) - (enemy.hitRadius ?? enemy.size) - ENEMY_MELEE_GAP;
      if (enemy.type === "boss") {
        let vx = enemy.vx;
        let x = enemy.x + vx;
        if (x < 70 || x > GAME_WIDTH - 70) {
          vx *= -1;
          x = clamp(x, 70, GAME_WIDTH - 70);
        }
        return {
          ...enemy,
          x,
          y: Math.min(enemy.y + 0.12, stopY),
          vx
        };
      }
      const distSq = distanceSquared(enemy, player);
      const inAggro = distSq <= ENEMY_AGGRO_RANGE * ENEMY_AGGRO_RANGE;
      if (inAggro) {
        const horizontalDelta = player.x - enemy.x;
        const horizontalStep = clamp(horizontalDelta, -enemy.speed * 0.9, enemy.speed * 0.9);
        return {
          ...enemy,
          x: clamp(enemy.x + horizontalStep, enemy.size, GAME_WIDTH - enemy.size),
          y: Math.min(enemy.y + enemy.speed, stopY)
        };
      }
      const laneDelta = enemy.laneX - enemy.x;
      const laneStep = clamp(laneDelta, -enemy.speed * 0.4, enemy.speed * 0.4);
      return {
        ...enemy,
        x: clamp(enemy.x + laneStep, enemy.size, GAME_WIDTH - enemy.size),
        y: Math.min(enemy.y + enemy.speed, stopY)
      };
    })
    .filter((enemy) => enemy.y < GAME_HEIGHT + 90);

  const movedPickups = pickups
    .map((pickup) => ({
      ...pickup,
      y: pickup.y + 1.6
    }))
    .filter((pickup) => pickup.y < GAME_HEIGHT + 50);

  const clampedPlayer = {
    ...player,
    x: clamp(player.x, PLAYER_BOUNDS_PADDING, GAME_WIDTH - PLAYER_BOUNDS_PADDING),
    y: PLAYER_START_Y
  };

  return {
    player: clampedPlayer,
    bullets: movedBullets,
    enemyBullets: movedEnemyBullets,
    enemies: movedEnemies,
    pickups: movedPickups
  };
}

function handleEnemyShooting(enemies, now, nextId, enemyBullets) {
  const nextEnemies = enemies.map((enemy) => ({ ...enemy }));
  for (const enemy of nextEnemies) {
    if (!enemy.fireRateMs || now < enemy.nextShotAt) {
      continue;
    }
    if (enemy.type === "boss") {
      for (const angle of [-0.28, 0, 0.28]) {
        enemyBullets.push(createEnemyProjectile(nextId, enemy, angle));
        nextId += 1;
      }
    } else {
      enemyBullets.push(createEnemyProjectile(nextId, enemy));
      nextId += 1;
    }
    enemy.nextShotAt = now + enemy.fireRateMs;
    enemy.lastAttackAt = now;
  }
  return {
    enemies: nextEnemies,
    enemyBullets,
    nextId
  };
}

function dropPickupForKill(enemy, kills, random, nextId, pickups, availableWeapons, events) {
  const milestone = getNextWeaponUnlock(kills, availableWeapons);
  if (milestone) {
    pickups.push({
      id: nextId,
      kind: "portal",
      weaponKey: milestone.weaponKey,
      x: enemy.x,
      y: enemy.y,
      size: 16
    });
    pushEvent(events, "portal_drop", { weaponKey: milestone.weaponKey });
    return nextId + 1;
  }

  if (random() < 0.16) {
    const key = POWER_UP_DROP_KEYS[Math.floor(random() * POWER_UP_DROP_KEYS.length)];
    pickups.push({
      id: nextId,
      kind: "powerup",
      powerKey: key,
      x: enemy.x,
      y: enemy.y,
      size: 14
    });
    return nextId + 1;
  }

  return nextId;
}

function explodeRocket(enemy, enemies, splashRadius, damage) {
  if (!splashRadius) {
    return enemies;
  }
  return enemies.map((other) => {
    if (other.id === enemy.id) {
      return other;
    }
    const distance = Math.sqrt(distanceSquared(enemy, other));
    if (distance > splashRadius) {
      return other;
    }
    return {
      ...other,
      hp: other.hp - Math.max(1, damage - 1)
    };
  });
}

function applyChainDamage(hitEnemy, enemies, bullet) {
  if (!bullet.chainRadius || !bullet.chainTargets) {
    return enemies;
  }
  let remaining = bullet.chainTargets;
  return enemies.map((enemy) => {
    if (enemy.id === hitEnemy.id || remaining <= 0) {
      return enemy;
    }
    const distance = Math.sqrt(distanceSquared(hitEnemy, enemy));
    if (distance > bullet.chainRadius) {
      return enemy;
    }
    remaining -= 1;
    return {
      ...enemy,
      hp: enemy.hp - 1
    };
  });
}

function handleCombat(state, now, random, nextId, player, bullets, enemyBullets, enemies, pickups, events) {
  let score = state.score;
  let kills = state.kills;
  let availableWeapons = [...state.availableWeapons];
  let activeBossLevel = state.activeBossLevel;
  const defeatedEnemies = [...state.defeatedEnemies];
  let lastPlayerHitAt = state.lastPlayerHitAt;
  let levelProgressKills = state.levelProgressKills;
  let bossDefeatsOnLevel = state.bossDefeatsOnLevel;

  const survivingBullets = [];
  let mutableEnemies = enemies.map((enemy) => ({ ...enemy }));

  for (const bullet of bullets) {
    let remainingPierce = bullet.pierce ?? 1;
    let hit = false;

    mutableEnemies = mutableEnemies.map((enemy) => {
      if (remainingPierce <= 0 || enemy.hp <= 0) {
        return enemy;
      }
      const collisionDistance = (enemy.hitRadius ?? enemy.size) + bullet.radius + 2;
      if (distanceSquared(enemy, bullet) > collisionDistance * collisionDistance) {
        return enemy;
      }

      hit = true;
      remainingPierce -= 1;
      return {
        ...enemy,
        hp: enemy.hp - bullet.damage,
        lastHitAt: now
      };
    });

    if (hit && bullet.splashRadius) {
      const focalEnemy = mutableEnemies.find((enemy) => enemy.hp <= 0);
      if (focalEnemy) {
        mutableEnemies = explodeRocket(focalEnemy, mutableEnemies, bullet.splashRadius, bullet.damage);
      }
    }

    if (hit) {
      const targetEnemy = mutableEnemies.find((enemy) => enemy.hp <= 0) ?? mutableEnemies.find((enemy) => enemy.hp < enemy.maxHp);
      if (targetEnemy) {
        mutableEnemies = applyChainDamage(targetEnemy, mutableEnemies, bullet);
      }
      pushEvent(events, "impact");
    }

    if (!hit || remainingPierce > 0) {
      survivingBullets.push({
        ...bullet,
        pierce: remainingPierce
      });
    }
  }

  const survivingEnemies = [];
  for (const enemy of mutableEnemies) {
    if (enemy.hp > 0) {
      survivingEnemies.push(enemy);
      continue;
    }
    defeatedEnemies.push({
      ...enemy,
      hp: 0,
      defeatedAt: now
    });
    score += enemy.score;
    kills += 1;
    if (enemy.type === "boss") {
      activeBossLevel = null;
      bossDefeatsOnLevel += 1;
      pushEvent(events, "boss_down");
    } else {
      levelProgressKills += 1;
      pushEvent(events, "enemy_down");
    }
    nextId = dropPickupForKill(enemy, kills, random, nextId, pickups, availableWeapons, events);
  }

  let playerHp = player.hp;
  const survivingEnemyBullets = [];
  for (const bullet of enemyBullets) {
    const hitRadius = (player.hitRadius ?? player.size) + bullet.radius + 2;
    if (distanceSquared(player, bullet) <= hitRadius * hitRadius) {
      if (player.shieldUntil > now) {
        pushEvent(events, "shield_block");
      } else {
        playerHp -= bullet.damage;
        lastPlayerHitAt = now;
        pushEvent(events, "player_hit");
      }
      continue;
    }
    survivingEnemyBullets.push(bullet);
  }

  const nextPickups = [];
  let weaponKey = player.weaponKey;
  let shieldUntil = player.shieldUntil;
  let rapidUntil = player.rapidUntil;
  let bonusMessage = state.message;
  let bonusMessageUntil = state.messageUntil;

  for (const pickup of pickups) {
    const pickupRadius = player.size + pickup.size + 4;
    if (distanceSquared(player, pickup) > pickupRadius * pickupRadius) {
      nextPickups.push(pickup);
      continue;
    }

    if (pickup.kind === "portal") {
      if (!availableWeapons.includes(pickup.weaponKey)) {
        availableWeapons = [...availableWeapons, pickup.weaponKey].sort(
          (left, right) => WEAPON_ORDER.indexOf(left) - WEAPON_ORDER.indexOf(right)
        );
      }
      weaponKey = pickup.weaponKey;
      bonusMessage = `${getWeaponLabel(pickup.weaponKey).toUpperCase()} ONLINE`;
      bonusMessageUntil = now + 1800;
      pushEvent(events, "weapon_unlock");
      continue;
    }

    if (pickup.kind === "powerup") {
      if (pickup.powerKey === "shield") {
        shieldUntil = now + POWER_UPS.shield.durationMs;
      }
      if (pickup.powerKey === "rapid") {
        rapidUntil = now + POWER_UPS.rapid.durationMs;
      }
      if (pickup.powerKey === "bomb") {
        score += survivingEnemies.reduce((sum, enemy) => sum + enemy.score, 0);
        kills += survivingEnemies.length;
        survivingEnemies.length = 0;
      }
      bonusMessage = `${POWER_UPS[pickup.powerKey].name.toUpperCase()} READY`;
      bonusMessageUntil = now + 1500;
      pushEvent(events, "powerup");
      continue;
    }
  }

  const enemiesAfterMelee = survivingEnemies.map((enemy) => {
    const meleeDistance = (enemy.hitRadius ?? enemy.size) + (player.hitRadius ?? player.size) + ENEMY_MELEE_GAP;
    if (distanceSquared(enemy, player) > meleeDistance * meleeDistance) {
      return enemy;
    }
    if (enemy.nextMeleeAt > now) {
      return enemy;
    }
    if (shieldUntil > now) {
      pushEvent(events, "shield_block");
    } else {
      playerHp -= enemy.type === "boss" ? 2 : 1;
      lastPlayerHitAt = now;
      pushEvent(events, "player_hit");
    }
    return {
      ...enemy,
      nextMeleeAt: now + ENEMY_MELEE_COOLDOWN_MS,
      lastAttackAt: now
    };
  });

  return {
    score,
    kills,
    availableWeapons,
    activeBossLevel,
    levelProgressKills,
    bossDefeatsOnLevel,
    bullets: survivingBullets,
    enemyBullets: survivingEnemyBullets,
    enemies: enemiesAfterMelee,
    defeatedEnemies,
    pickups: nextPickups,
    player: {
      ...player,
      hp: playerHp,
      lastMoveAt: player.lastMoveAt,
      weaponKey,
      shieldUntil,
      rapidUntil
    },
    lastPlayerHitAt,
    message: bonusMessage,
    messageUntil: bonusMessageUntil,
    nextId
  };
}

export function updateGame(state, options = {}) {
  if (state.screen !== "playing") {
    return {
      ...state,
      events: []
    };
  }

  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;
  const deltaMs = Math.max(16, Math.min(64, options.deltaMs ?? now - state.lastTickAt));
  const input = options.input ?? {};
  const events = [];

  const player = {
    ...state.player,
    x: input.target?.x ?? state.player.x,
    y: PLAYER_START_Y,
    lastMoveAt:
      Math.abs((input.target?.x ?? state.player.x) - state.player.x) > 0.4 ? now : state.player.lastMoveAt
  };

  let nextId = state.nextId;
  const fireResult = applyWeaponFire(state, now, nextId, events);
  nextId = fireResult.nextId;

  let spawnBudgetMs = state.spawnBudgetMs + deltaMs;
  let enemies = [...state.enemies];
  let activeBossLevel = state.activeBossLevel;
  while (spawnBudgetMs >= getSpawnInterval(state.level)) {
    const spawnResult = maybeSpawnEnemy(state, now, random, nextId, enemies, events);
    nextId = spawnResult.nextId;
    activeBossLevel = spawnResult.activeBossLevel;
    spawnBudgetMs -= getSpawnInterval(state.level);
    if (enemies.some((enemy) => enemy.type === "boss")) {
      break;
    }
  }

  const shootingResult = handleEnemyShooting(enemies, now, nextId, [...state.enemyBullets]);
  nextId = shootingResult.nextId;

  const moved = moveEntities(
    state,
    player,
    fireResult.bullets,
    shootingResult.enemyBullets,
    shootingResult.enemies,
    [...state.pickups]
  );

  const combat = handleCombat(
    {
      ...state,
      activeBossLevel
    },
    now,
    random,
    nextId,
    moved.player,
    moved.bullets,
    moved.enemyBullets,
    moved.enemies,
    moved.pickups,
    events
  );

  let level = state.level;
  let levelProgressKills = combat.levelProgressKills;
  let bossDefeatsOnLevel = combat.bossDefeatsOnLevel;
  let message = combat.message;
  let messageUntil = combat.messageUntil;
  const defeatedEnemies = combat.defeatedEnemies.filter((enemy) => now - enemy.defeatedAt < ENEMY_DEATH_ANIMATION_MS);
  const isBossLevel = getTierLevel(state.level) === 5;
  if (isBossLevel) {
    if (bossDefeatsOnLevel >= BOSS_DEFEATS_TO_ADVANCE) {
      level += 1;
      levelProgressKills = 0;
      bossDefeatsOnLevel = 0;
      message = `LEVEL ${level}`;
      messageUntil = now + 1600;
      pushEvent(events, "level_up");
    } else if (combat.bossDefeatsOnLevel > state.bossDefeatsOnLevel) {
      message = `BOSS ${bossDefeatsOnLevel}/${BOSS_DEFEATS_TO_ADVANCE}`;
      messageUntil = now + 1600;
    }
  } else if (levelProgressKills >= getKillGoalForLevel(state.level)) {
    level += 1;
    levelProgressKills = 0;
    bossDefeatsOnLevel = 0;
    message = `LEVEL ${level}`;
    messageUntil = now + 1600;
    pushEvent(events, "level_up");
  }

  if (combat.player.hp <= 0) {
    pushEvent(events, "game_over");
    return {
      ...state,
      screen: "gameOver",
      player: combat.player,
      bullets: combat.bullets,
      enemyBullets: combat.enemyBullets,
      enemies: combat.enemies,
      defeatedEnemies,
      pickups: combat.pickups,
      availableWeapons: combat.availableWeapons,
      score: combat.score,
      kills: combat.kills,
      level,
      levelProgressKills,
      bossDefeatsOnLevel,
      lastTickAt: now,
      lastFireAt: fireResult.lastFireAt,
      spawnBudgetMs,
      nextId: combat.nextId,
      activeBossLevel: combat.activeBossLevel,
      lastPlayerHitAt: combat.lastPlayerHitAt,
      playerDeathAt: now,
      message: "ENTER YOUR CALLSIGN",
      messageUntil: now + 100000,
      shareText: `I scored ${combat.score} in Rpg T Shooter on level ${level}.`,
      events
    };
  }

  return {
    ...state,
    screen: "playing",
    player: combat.player,
    bullets: combat.bullets,
    enemyBullets: combat.enemyBullets,
    enemies: combat.enemies,
    defeatedEnemies,
    pickups: combat.pickups,
    availableWeapons: combat.availableWeapons,
    score: combat.score,
    kills: combat.kills,
    level,
    levelProgressKills,
    bossDefeatsOnLevel,
    lastTickAt: now,
    lastFireAt: fireResult.lastFireAt,
    spawnBudgetMs,
    nextId: combat.nextId,
    activeBossLevel: combat.activeBossLevel,
    lastPlayerHitAt: combat.lastPlayerHitAt,
    message: messageUntil > now ? message : "",
    messageUntil,
    events
  };
}

export function buildScoreSubmission(state) {
  return {
    name: normalizeArcadeName(state.nameEntry),
    score: state.score,
    level: state.level,
    kills: state.kills,
    weaponKey: state.player.weaponKey
  };
}
