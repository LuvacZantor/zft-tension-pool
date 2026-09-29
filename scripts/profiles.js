import { DEFAULT_PROFILE, clone } from "./constants.js";
import { getSetting, setSetting } from "./settings.js";
import { getState, setState } from "./state.js";
import { VALID_DIE_FACES, clampInt, normalizeTriggerValues } from "./rules.js";

export function normalizeProfile(raw, fallbackId = "default") {
  const source = raw && typeof raw === "object" ? clone(raw) : {};
  const dieFaces = VALID_DIE_FACES.includes(Number(source.dieFaces)) ? Number(source.dieFaces) : 6;
  return {
    ...clone(DEFAULT_PROFILE),
    ...source,
    id: String(source.id || fallbackId),
    name: String(source.name || "Tension Profile").trim() || "Tension Profile",
    poolSize: clampInt(source.poolSize, 1, 20, 6),
    dieFaces,
    triggerValues: normalizeTriggerValues(source.triggerValues, dieFaces),
    normalTableUuid: String(source.normalTableUuid || "").trim(),
    severeTableUuid: String(source.severeTableUuid || "").trim(),
    severeThreshold: clampInt(source.severeThreshold, 2, 20, 3),
    rollVisibility: source.rollVisibility === "gmOnly" ? "gmOnly" : "public",
    complicationVisibility: source.complicationVisibility === "gmOnly" ? "gmOnly" : "public",
    publicSecretNotice: source.publicSecretNotice !== false,
    showReasonsToPlayers: source.showReasonsToPlayers !== false,
    maxHistory: clampInt(source.maxHistory, 5, 100, 25),
  };
}

export function getProfiles() {
  const raw = getSetting("profiles") ?? {};
  const result = {};
  for (const [id, profile] of Object.entries(raw)) {
    result[id] = normalizeProfile(profile, id);
  }
  if (!Object.keys(result).length) result.default = normalizeProfile(DEFAULT_PROFILE, "default");
  return result;
}

export async function setProfiles(profiles) {
  const normalized = {};
  for (const [id, profile] of Object.entries(profiles)) {
    normalized[id] = normalizeProfile(profile, id);
  }
  if (!Object.keys(normalized).length) normalized.default = normalizeProfile(DEFAULT_PROFILE, "default");
  await setSetting("profiles", normalized);
  return normalized;
}

export function getActiveProfile() {
  const profiles = getProfiles();
  const state = getState();
  return profiles[state.activeProfileId] ?? Object.values(profiles)[0];
}

export async function setActiveProfile(profileId) {
  const profiles = getProfiles();
  if (!profiles[profileId]) throw new Error(`Unknown tension profile: ${profileId}`);
  const state = getState();
  state.activeProfileId = profileId;
  state.diceCount = Math.min(state.diceCount, profiles[profileId].poolSize);
  await setState(state);
  return profiles[profileId];
}

export async function saveProfile(profile) {
  const profiles = getProfiles();
  const normalized = normalizeProfile(profile, profile.id);
  profiles[normalized.id] = normalized;
  await setProfiles(profiles);
  return normalized;
}

export async function createProfile(name) {
  const profiles = getProfiles();
  let base = String(name || "New Profile")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "profile";
  let id = base;
  let suffix = 2;
  while (profiles[id]) id = `${base}-${suffix++}`;
  const profile = normalizeProfile({ ...clone(DEFAULT_PROFILE), id, name: String(name || "New Profile").trim() || "New Profile" }, id);
  profiles[id] = profile;
  await setProfiles(profiles);
  await setActiveProfile(id);
  return profile;
}

export async function deleteProfile(profileId) {
  const profiles = getProfiles();
  if (!profiles[profileId]) return false;
  if (Object.keys(profiles).length <= 1) throw new Error("At least one tension profile must remain.");
  delete profiles[profileId];
  await setProfiles(profiles);

  const state = getState();
  if (state.activeProfileId === profileId) {
    state.activeProfileId = Object.keys(profiles)[0];
    state.diceCount = Math.min(state.diceCount, profiles[state.activeProfileId].poolSize);
    await setState(state);
  }
  return true;
}
