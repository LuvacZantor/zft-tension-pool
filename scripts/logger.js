import { VERSION, MODULE_ID } from "./constants.js";

function debugEnabled() {
  try {
    return Boolean(game.settings.get(MODULE_ID, "debug"));
  } catch {
    return false;
  }
}

export function info(message, ...args) {
  console.log(`[ZFT] ℹ️ v${VERSION} | ${message}`, ...args);
}

export function debug(message, ...args) {
  if (!debugEnabled()) return;
  console.debug(`[ZFT] 🔍 v${VERSION} | ${message}`, ...args);
}

export function warn(message, ...args) {
  console.warn(`[ZFT] ⚠️ v${VERSION} | ${message}`, ...args);
}

export function error(message, ...args) {
  console.error(`[ZFT] ❌ v${VERSION} | ${message}`, ...args);
}
