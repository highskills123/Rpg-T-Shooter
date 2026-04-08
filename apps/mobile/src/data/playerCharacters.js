export const DEFAULT_PLAYER_CHARACTER = "soldier";

export const PLAYER_CHARACTER_ORDER = ["archer", "soldier", "wizard"];

export const PLAYER_CHARACTERS = {
  archer: {
    key: "archer",
    name: "Archer",
    description: "Precise ranger with a light-footed stance and sharp ranged style.",
    accent: "#8fa97a"
  },
  soldier: {
    key: "soldier",
    name: "Soldier",
    description: "Balanced frontliner built for steady fire and survivability.",
    accent: "#c7a56a"
  },
  wizard: {
    key: "wizard",
    name: "Wizard",
    description: "Arcane specialist with a volatile silhouette and spellcaster feel.",
    accent: "#8a5c72"
  }
};

export function normalizePlayerCharacter(value) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PLAYER_CHARACTERS[candidate] ? candidate : DEFAULT_PLAYER_CHARACTER;
}
