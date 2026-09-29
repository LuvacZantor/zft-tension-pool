import {
  MODULE_ID,
  DEFAULT_PROFILE,
  DEFAULT_STATE,
  HOOKS,
  clone,
} from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "profiles", {
    scope: "world",
    config: false,
    type: Object,
    default: { default: clone(DEFAULT_PROFILE) },
    onChange: (value) => Hooks.callAll(HOOKS.PROFILES_CHANGED, value),
  });

  game.settings.register(MODULE_ID, "state", {
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULT_STATE),
    onChange: (value) => Hooks.callAll(HOOKS.STATE_CHANGED, value),
  });

  game.settings.register(MODULE_ID, "windowPosition", {
    scope: "client",
    config: false,
    type: Object,
    default: null,
  });

  game.settings.register(MODULE_ID, "collapsed", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
    onChange: (value) => Hooks.callAll(HOOKS.UI_CHANGED, { collapsed: value }),
  });

  game.settings.register(MODULE_ID, "debug", {
    name: "ZFT_TENSION.Settings.Debug.Name",
    hint: "ZFT_TENSION.Settings.Debug.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

export function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}
