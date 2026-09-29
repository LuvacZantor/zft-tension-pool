import {
  MODULE_ID,
  DEFAULT_PROFILE,
  DEFAULT_STATE,
  DEFAULT_SOUNDS,
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

  game.settings.register(MODULE_ID, "soundEnabled", {
    name: "ZFT_TENSION.Settings.SoundEnabled.Name",
    hint: "ZFT_TENSION.Settings.SoundEnabled.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "addSound", {
    name: "ZFT_TENSION.Settings.AddSound.Name",
    hint: "ZFT_TENSION.Settings.AddSound.Hint",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: DEFAULT_SOUNDS.add,
  });

  game.settings.register(MODULE_ID, "removeSound", {
    name: "ZFT_TENSION.Settings.RemoveSound.Name",
    hint: "ZFT_TENSION.Settings.RemoveSound.Hint",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: DEFAULT_SOUNDS.remove,
  });

  game.settings.register(MODULE_ID, "rollSound", {
    name: "ZFT_TENSION.Settings.RollSound.Name",
    hint: "ZFT_TENSION.Settings.RollSound.Hint",
    scope: "world",
    config: true,
    type: String,
    filePicker: "audio",
    default: DEFAULT_SOUNDS.roll,
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
