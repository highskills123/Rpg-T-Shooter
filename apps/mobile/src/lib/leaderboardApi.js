const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
const REQUEST_TIMEOUT_MS = 1500;

export const FALLBACK_HIGH_SCORES = [
  { name: "ACE", score: 42000, level: 7, kills: 61, weapon_key: "laser" },
  { name: "ION", score: 30150, level: 6, kills: 47, weapon_key: "spread" },
  { name: "N7N", score: 26880, level: 5, kills: 39, weapon_key: "plasma" },
  { name: "RAY", score: 21900, level: 4, kills: 31, weapon_key: "rocket" }
];

async function safeJson(response) {
  if (!response.ok) {
    throw new Error(`High score request failed with ${response.status}`);
  }
  return response.json();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchHighScores() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/highscores`);
    const payload = await safeJson(response);
    return payload.scores ?? FALLBACK_HIGH_SCORES;
  } catch (error) {
    return FALLBACK_HIGH_SCORES;
  }
}

export async function submitHighScore(entry) {
  try {
    const payload = {
      name: entry.name,
      score: entry.score,
      level: entry.level,
      kills: entry.kills,
      weapon_key: entry.weapon_key ?? entry.weaponKey ?? "plasma"
    };
    const response = await fetchWithTimeout(`${API_URL}/api/highscores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await safeJson(response);
  } catch (error) {
    return {
      ok: false,
      offline: true,
      message: "High score server unavailable"
    };
  }
}
