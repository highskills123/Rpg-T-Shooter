export const ENEMY_TYPES = {
  slime: {
    key: "slime",
    name: "Slime",
    color: "#7df46a",
    size: 18,
    hitRadius: 14,
    hp: 1,
    speed: 1.8,
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
    speed: 2,
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
    speed: 1.9,
    score: 220,
    fireRateMs: 1700
  },
  armoredSkeleton: {
    key: "armoredSkeleton",
    name: "Armored Skeleton",
    color: "#a1b8d8",
    size: 24,
    hitRadius: 18,
    hp: 4,
    speed: 1.55,
    score: 420,
    fireRateMs: 0
  },
  boss: {
    key: "boss",
    name: "Greatsword Skeleton",
    color: "#c7a56a",
    size: 44,
    hitRadius: 30,
    hp: 24,
    speed: 0.8,
    score: 2500,
    fireRateMs: 1250
  }
};

export function getEnemyPoolForLevel(level) {
  if (level >= 3) {
    return ["slime", "skeleton", "skeletonArcher", "armoredSkeleton"];
  }
  if (level >= 2) {
    return ["slime", "skeleton", "skeletonArcher"];
  }
  return ["slime"];
}
