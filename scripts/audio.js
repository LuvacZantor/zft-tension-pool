import { DEFAULT_SOUNDS } from "./constants.js";
import { getSetting } from "./settings.js";
import { debug, warn } from "./logger.js";

export function getSoundPath(type) {
  switch (type) {
    case "add":
      return getSetting("addSound") || DEFAULT_SOUNDS.add;
    case "remove":
      return getSetting("removeSound") || DEFAULT_SOUNDS.remove;
    case "roll":
      return getSetting("rollSound") || DEFAULT_SOUNDS.roll;
    default:
      return "";
  }
}

export async function playSound(type) {
  if (!getSetting("soundEnabled")) return;

  const src = getSoundPath(type);
  if (!src) return;

  const helper = globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper;
  if (!helper?.play) {
    warn("Foundry AudioHelper is unavailable; tension sound was skipped.", { type, src });
    return;
  }

  try {
    await helper.play({ src, volume: 0.8, loop: false }, true);
    debug("Played tension sound", { type, src });
  } catch (err) {
    warn("Unable to play tension sound.", { type, src, err });
  }
}
