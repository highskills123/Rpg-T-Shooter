import test from "node:test";
import assert from "node:assert/strict";

import {
  appendNameCharacter,
  buildScoreSubmission,
  createInitialState,
  createEnemy,
  getNextWeaponUnlock,
  normalizeArcadeName,
  startGame,
  updateGame
} from "../apps/mobile/src/lib/gameEngine.js";
import { getEnemyPoolForLevel } from "../apps/mobile/src/data/enemies.js";

test("normalizes arcade names to 3 alphanumeric chars", () => {
  assert.equal(normalizeArcadeName("a!b@c#d"), "ABC");
  assert.equal(normalizeArcadeName("7z"), "7Z");
});

test("milestones unlock the next missing weapon", () => {
  assert.deepEqual(getNextWeaponUnlock(12, ["plasma"]), { kills: 12, weaponKey: "spread" });
  assert.equal(getNextWeaponUnlock(12, ["plasma", "spread"]), undefined);
  assert.deepEqual(getNextWeaponUnlock(80, ["plasma", "spread", "laser", "rocket"]), {
    kills: 80,
    weaponKey: "chain"
  });
});

test("auto fire creates plasma bullets while playing", () => {
  const state = startGame({}, 0);
  const updated = updateGame(state, {
    now: 400,
    deltaMs: 33,
    input: { target: { x: 200, y: 600 } },
    random: () => 0.99
  });

  assert.equal(updated.screen, "playing");
  assert.equal(updated.bullets.length, 1);
  assert.equal(updated.player.weaponKey, "plasma");
});

test("archer shots use a tighter projectile hit radius", () => {
  const state = startGame(createInitialState(0, "archer"), 0);
  const updated = updateGame(state, {
    now: 400,
    deltaMs: 33,
    input: { target: { x: 200 } },
    random: () => 0.99
  });

  assert.equal(updated.bullets.length, 1);
  assert.equal(updated.bullets[0].radius, 2);
});

test("soldier shots use a reduced projectile hit radius", () => {
  const state = startGame(createInitialState(0, "soldier"), 0);
  const updated = updateGame(state, {
    now: 400,
    deltaMs: 33,
    input: { target: { x: 200 } },
    random: () => 0.99
  });

  assert.equal(updated.bullets.length, 1);
  assert.equal(updated.bullets[0].radius, 3);
});

test("wizard shots use a reduced projectile hit radius", () => {
  const state = startGame(createInitialState(0, "wizard"), 0);
  const updated = updateGame(state, {
    now: 400,
    deltaMs: 33,
    input: { target: { x: 200 } },
    random: () => 0.99
  });

  assert.equal(updated.bullets.length, 1);
  assert.equal(updated.bullets[0].radius, 3);
});

test("selected player character survives initial state and game start", () => {
  const menuState = createInitialState(0, "wizard");
  const playingState = startGame(menuState, 200);

  assert.equal(menuState.player.characterKey, "wizard");
  assert.equal(playingState.player.characterKey, "wizard");
});

test("enemy pool escalates through slime and skeleton tiers", () => {
  assert.deepEqual(getEnemyPoolForLevel(1), ["slime"]);
  assert.deepEqual(getEnemyPoolForLevel(2), ["slime", "skeleton", "skeletonArcher"]);
  assert.deepEqual(getEnemyPoolForLevel(3), ["slime", "skeleton", "skeletonArcher", "armoredSkeleton"]);
});

test("player stays on a fixed vertical lane while moving", () => {
  const state = startGame({}, 0);
  const updated = updateGame(state, {
    now: 400,
    deltaMs: 33,
    input: { target: { x: 280, y: 240 } },
    random: () => 0.99
  });

  assert.equal(updated.player.x, 280);
  assert.equal(updated.player.y, state.player.y);
});

test("enemies stop before moving past the player lane", () => {
  const state = {
    ...startGame({}, 0),
    enemies: [createEnemy("slime", 200, 590, 0, 1)],
    lastFireAt: 999999
  };

  const updated = updateGame(state, {
    now: 33,
    deltaMs: 33,
    random: () => 0.99
  });

  assert.ok(updated.enemies[0].y < updated.player.y);
});

test("enemies keep following the player horizontally near the stop line", () => {
  const state = {
    ...startGame({}, 0),
    enemies: [createEnemy("slime", 120, 590, 0, 1)],
    lastFireAt: 999999
  };

  const updated = updateGame(state, {
    now: 33,
    deltaMs: 33,
    random: () => 0.99
  });

  assert.ok(updated.enemies[0].x > 120);
  assert.ok(updated.enemies[0].y < updated.player.y);
});

test("close enemies attack on a cooldown instead of every frame", () => {
  const enemy = createEnemy("slime", 200, 627, 0, 1);
  const state = {
    ...startGame({}, 0),
    enemies: [{ ...enemy, nextMeleeAt: 0 }],
    lastFireAt: 999999
  };

  const firstHit = updateGame(state, {
    now: 1000,
    deltaMs: 33,
    random: () => 0.99
  });
  const secondTick = updateGame(firstHit, {
    now: 1033,
    deltaMs: 33,
    random: () => 0.99
  });

  assert.equal(firstHit.player.hp, 2);
  assert.equal(secondTick.player.hp, 2);
});

test("enemy bullets outside the tighter player hit radius do not deal damage", () => {
  const state = {
    ...startGame({}, 0),
    enemyBullets: [
      {
        id: 1,
        owner: "enemy",
        x: 222,
        y: 666,
        vx: 0,
        vy: 0,
        radius: 5,
        damage: 1
      }
    ],
    lastFireAt: 999999
  };

  const updated = updateGame(state, {
    now: 33,
    deltaMs: 33,
    random: () => 0.99
  });

  assert.equal(updated.player.hp, 3);
});

test("enemy kill at a milestone drops a weapon portal", () => {
  const state = {
    ...startGame({}, 0),
    kills: 11,
    enemies: [createEnemy("slime", 200, 200, 0, 1)],
    bullets: [
      {
        id: 2,
        owner: "player",
        x: 200,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 4,
        damage: 1,
        weaponKey: "plasma",
        pierce: 1,
        splashRadius: 0,
        chainRadius: 0,
        chainTargets: 0
      }
    ],
    lastFireAt: 999999
  };

  const updated = updateGame(state, {
    now: 1000,
    deltaMs: 33,
    random: () => 0.4
  });

  assert.equal(updated.kills, 12);
  assert.equal(updated.pickups.length, 1);
  assert.equal(updated.pickups[0].weaponKey, "spread");
});

test("game over score submission uses 3-char callsign", () => {
  const state = {
    ...startGame({}, 0),
    screen: "gameOver",
    score: 1200,
    level: 3,
    kills: 18,
    nameEntry: ""
  };
  const named = appendNameCharacter(appendNameCharacter(appendNameCharacter(state, "A"), "b"), "3");
  assert.deepEqual(buildScoreSubmission(named), {
    name: "AB3",
    score: 1200,
    level: 3,
    kills: 18,
    weaponKey: "plasma"
  });
});
