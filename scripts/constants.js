export const MODULE_ID = "zft-tension-pool";
export const MODULE_TITLE = "ZFT Tension Pool";
export const VERSION = "0.1.2";

export const HOOKS = Object.freeze({
  READY: "zftTensionPoolReady",
  STATE_CHANGED: "zftTensionPoolStateChanged",
  PROFILES_CHANGED: "zftTensionPoolProfilesChanged",
  UI_CHANGED: "zftTensionPoolUIChanged",
  ROLLED: "zftTensionPoolRolled",
  COMPLICATION: "zftTensionPoolComplication",
});

export const DEFAULT_SOUNDS = Object.freeze({
  add: `modules/${MODULE_ID}/assets/sounds/freesound_community-pearl-mlx-16-floor-tom-104999.mp3`,
  remove: `modules/${MODULE_ID}/assets/sounds/diogodasilvasimoes-magical-notification-tone-soft-fantasy-digital-alert-438278.mp3`,
  roll: `modules/${MODULE_ID}/assets/sounds/soundreality-evil-bell-343686.mp3`,
});

export const DEFAULT_PROFILE = Object.freeze({
  id: "default",
  name: "Standard Tension Pool",
  poolSize: 6,
  dieFaces: 6,
  triggerValues: [1],
  normalTableUuid: "",
  severeTableUuid: "",
  severeThreshold: 3,
  rollVisibility: "public",
  complicationVisibility: "public",
  publicSecretNotice: true,
  showReasonsToPlayers: true,
  maxHistory: 25,
});

export const DEFAULT_STATE = Object.freeze({
  schema: 1,
  diceCount: 0,
  activeProfileId: "default",
  history: [],
  lastRoll: null,
});

export function clone(value) {
  if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value);
  return JSON.parse(JSON.stringify(value));
}
