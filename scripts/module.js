import { MODULE_ID, VERSION, HOOKS } from "./constants.js";
import { registerSettings } from "./settings.js";
import { createAPI } from "./api.js";
import { TensionPoolApp } from "./tension-pool-app.js";
import { validateState } from "./engine.js";
import { debug, error } from "./logger.js";
import { registerTensionDie, registerDiceSoNice } from "./tension-die.js";

console.log(`[ZFT] 🛠️ v${VERSION} | ZFT Tension Pool initializing`);

let poolApp = null;

Hooks.once("diceSoNiceReady", (dice3d) => {
  registerDiceSoNice(dice3d);
});

Hooks.once("init", () => {
  registerTensionDie();
  registerSettings();
});

Hooks.once("ready", async () => {
  try {
    if (game.user.isGM) await validateState();

    const api = createAPI();
    const module = game.modules.get(MODULE_ID);
    if (module) module.api = api;

    poolApp = new TensionPoolApp();
    poolApp.render({ force: true });

    Hooks.on(HOOKS.STATE_CHANGED, () => poolApp?.debouncedRender());
    Hooks.on(HOOKS.PROFILES_CHANGED, () => poolApp?.debouncedRender());
    Hooks.on(HOOKS.UI_CHANGED, () => poolApp?.debouncedRender());

    Hooks.callAll(HOOKS.READY, api);
    debug("Module ready", { api });
  } catch (err) {
    error("Module failed during ready hook", err);
    ui.notifications?.error("ZFT Tension Pool failed to initialize. See console.");
  }
});
