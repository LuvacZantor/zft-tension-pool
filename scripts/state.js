import { DEFAULT_STATE, clone } from "./constants.js";
import { getSetting, setSetting } from "./settings.js";

function normalizeState(raw) {
  const state = {
    ...clone(DEFAULT_STATE),
    ...(raw && typeof raw === "object" ? clone(raw) : {}),
  };
  state.schema = 1;
  state.diceCount = Math.max(0, Math.floor(Number(state.diceCount) || 0));
  state.activeProfileId = String(state.activeProfileId || "default");
  state.history = Array.isArray(state.history) ? state.history : [];
  return state;
}

export function getState() {
  return normalizeState(getSetting("state"));
}

export async function setState(state) {
  const normalized = normalizeState(state);
  await setSetting("state", normalized);
  return normalized;
}

export async function updateState(mutator) {
  const state = getState();
  const result = await mutator(state);
  return setState(result ?? state);
}

export function makeHistoryEntry(type, data = {}) {
  return {
    id: foundry.utils.randomID(),
    at: Date.now(),
    type,
    userId: game.user?.id ?? null,
    ...data,
  };
}

export function pushHistory(state, entry, maxHistory = 25) {
  const limit = Math.min(Math.max(Number(maxHistory) || 25, 5), 100);
  state.history = [...(state.history ?? []), entry].slice(-limit);
  return state;
}
