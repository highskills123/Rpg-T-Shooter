export const ENEMY_TYPES = {
  slime: {
    key: "slime",
    name: "Slime",
    color: "#7df46a",
    size: 18,
    hitRadius: 14,
    hp: 1,
    speed: 2.05,
    score: 100,
    fireRateMs: 0
  },
  skeleton: {
    key: "skeleton",
    name: "Skeleton",
    color: "#f0f1f7",
    size: 20,
    hitRadius: 15,
    hp: 2,
    speed: 2.25,
    score: 180,
    fireRateMs: 0
  },
  skeletonArcher: {
    key: "skeletonArcher",
    name: "Skeleton Archer",
    color: "#c7f47d",
    size: 20,
    hitRadius: 15,
    hp: 2,
    speed: 2.15,
    score: 220,
    fireRateMs: 2250
  },
  orc: {
    key: "orc",
    name: "Orc",
    color: "#8a9f64",
    size: 22,
    hitRadius: 17,
    hp: 3,
    speed: 2.1,
    score: 260,
    fireRateMs: 0
  },
  armoredSkeleton: {
    key: "armoredSkeleton",
    name: "Armored Skeleton",
    color: "#a1b8d8",
    size: 24,
    hitRadius: 18,
    hp: 4,
    speed: 1.82,
    score: 420,
    fireRateMs: 0
  },
  priest: {
    key: "priest",
    name: "Priest",
    color: "#d6c7a5",
    size: 23,
    hitRadius: 17,
    hp: 4,
    speed: 1.9,
    score: 460,
    fireRateMs: 2500
  },
  armoredOrc: {
    key: "armoredOrc",
    name: "Armored Orc",
    color: "#6d7a5a",
    size: 26,
    hitRadius: 20,
    hp: 5,
    speed: 1.85,
    score: 520,
    fireRateMs: 0
  },
  boss: {
    key: "boss",
    name: "Greatsword Skeleton",
    color: "#c7a56a",
    size: 44,
    hitRadius: 30,
    hp: 24,
    speed: 0.98,
    score: 2500,
    fireRateMs: 1700
  }
};

export function getEnemyPoolForLevel(level) {
  const tier = ((level - 1) % 5) + 1;
  if (tier === 4) {
    return ["skeletonArcher", "armoredSkeleton", "orc", "priest", "armoredOrc"];
  }
  if (tier === 3) {
    return ["skeleton", "skeletonArcher", "orc", "armoredSkeleton"];
  }
  if (tier === 2) {
    return ["slime", "skeleton", "skeletonArcher"];
  }
  return ["slime"];
}
