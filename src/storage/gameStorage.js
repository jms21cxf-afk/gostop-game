const STORAGE_KEY = 'gostop-game-save';
const SETTINGS_KEY = 'gostop-game-settings';

export function saveGame(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch {
    return false;
  }
}

import { normalizeGameState } from '../data/cards';

export function loadGame() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return normalizeGameState(JSON.parse(data));
  } catch {
    return null;
  }
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedGame() {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return { playerName: '나', targetScore: 7, difficulty: 'normal' };
    }
    return JSON.parse(data);
  } catch {
    return { playerName: '나', targetScore: 7, difficulty: 'normal' };
  }
}
