import { getState } from "./state.js";
import { getProfiles, getActiveProfile, setActiveProfile } from "./profiles.js";
import {
  addTension,
  addTime,
  rollRisk,
  addTimeAndRisk,
  removeTension,
  breakPool,
  resetPool,
  rollPool,
  getRiskChance,
} from "./engine.js";

export function createAPI() {
  return Object.freeze({
    add: (amount = 1, options = {}) => addTension({ amount, ...options }),
    addTime,
    risk: rollRisk,
    timeAndRisk: addTimeAndRisk,
    remove: removeTension,
    roll: (options = {}) => rollPool(options),
    break: breakPool,
    reset: resetPool,
    getState,
    getProfile: getActiveProfile,
    getProfiles,
    setProfile: setActiveProfile,
    getRiskChance,
  });
}
