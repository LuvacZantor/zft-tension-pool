import { MODULE_ID } from "./constants.js";
import { getActiveProfile } from "./profiles.js";
import { debug } from "./logger.js";

const TENSION_DENOMINATION = "t";
const TENSION_SYMBOL = "☠";

export class TensionDie extends foundry.dice.terms.Die {
  constructor(termData = {}) {
    const profile = getActiveProfile();
    termData.faces = Number(profile?.dieFaces) || 6;
    super(termData);
  }

  static DENOMINATION = TENSION_DENOMINATION;

  get total() {
    const profile = getActiveProfile();
    const triggers = new Set(profile?.triggerValues ?? [1]);
    return this.results.filter((result) => !result.discarded && triggers.has(result.result)).length;
  }
}

export function registerTensionDie() {
  CONFIG.Dice.terms[TENSION_DENOMINATION] = TensionDie;
}

export function registerDiceSoNice(dice3d) {
  if (!dice3d) return;

  dice3d.addSystem({ id: MODULE_ID, name: "ZFT Tension Pool" }, "default");
  dice3d.addColorset({
    name: "zft-tension-pool",
    description: "ZFT Tension Pool",
    category: "ZFT Tension Pool",
    foreground: "#ffff00",
    background: "#1a1a1a",
    outline: "#000000",
    edge: "#1a1a1a",
    texture: "none",
    material: "plastic",
    visibility: "visible",
  }, "default");

  updateDiceSoNicePreset(dice3d, getActiveProfile());
}

export function updateDiceSoNicePreset(dice3d, profile = getActiveProfile()) {
  if (!dice3d || !profile) return;

  const faces = Number(profile.dieFaces) || 6;
  const triggers = new Set(profile.triggerValues ?? [1]);
  const labels = Array.from({ length: faces }, (_, index) => triggers.has(index + 1) ? TENSION_SYMBOL : "");

  try {
    dice3d.addDicePreset({
      type: `d${TENSION_DENOMINATION}`,
      labels,
      system: MODULE_ID,
      fontScale: 1.5,
      colorset: "zft-tension-pool",
    }, `d${faces}`);
  } catch (err) {
    debug("Unable to refresh Dice So Nice tension preset", err);
  }
}
