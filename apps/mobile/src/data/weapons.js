export const WEAPON_ORDER = [
  "plasma",
  "spread",
  "laser",
  "rocket",
  "chain"
];

export const WEAPON_UNLOCK_MILESTONES = [
  { kills: 12, weaponKey: "spread" },
  { kills: 28, weaponKey: "laser" },
  { kills: 50, weaponKey: "rocket" },
  { kills: 80, weaponKey: "chain" }
];

export const WEAPONS = {
  plasma: {
    key: "plasma",
    name: "Plasma Blaster",
    color: "#8fa97a",
    fireRateMs: 280,
    damage: 1,
    projectileSpeed: 13,
    projectileRadius: 4
  },
  spread: {
    key: "spread",
    name: "Spread Shot",
    color: "#8a5c72",
    fireRateMs: 320,
    damage: 1,
    projectileSpeed: 12,
    projectileRadius: 4,
    spreadAngles: [-0.34, 0, 0.34]
  },
  laser: {
    key: "laser",
    name: "Laser Beam",
    color: "#b2c79a",
    fireRateMs: 150,
    damage: 1,
    projectileSpeed: 18,
    projectileRadius: 3,
    pierce: 4
  },
  rocket: {
    key: "rocket",
    name: "Rocket Launcher",
    color: "#b66c4d",
    fireRateMs: 420,
    damage: 4,
    projectileSpeed: 9,
    projectileRadius: 6,
    splashRadius: 70
  },
  chain: {
    key: "chain",
    name: "Chain Lightning",
    color: "#9d86b5",
    fireRateMs: 250,
    damage: 1,
    projectileSpeed: 14,
    projectileRadius: 4,
    chainRadius: 120,
    chainTargets: 2
  }
};
