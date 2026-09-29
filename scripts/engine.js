import { HOOKS } from "./constants.js";
import { getState, setState, makeHistoryEntry, pushHistory } from "./state.js";
import { getActiveProfile } from "./profiles.js";
import { buildAddPlan, clampInt, countComplications, calculateComplicationChance } from "./rules.js";
import { postRollMessage } from "./chat.js";
import { resolveComplications } from "./resolver.js";
import { debug, warn } from "./logger.js";
import { updateDiceSoNicePreset } from "./tension-die.js";

function requireGM() {
  if (game.user?.isGM) return true;
  ui.notifications?.warn("Only a GM can change the tension pool.");
  return false;
}

function rollResults(roll) {
  const dice = Array.from(roll.dice ?? []);
  return dice.flatMap((die) =>
    Array.from(die.results ?? [])
      .filter((result) => !result.discarded)
      .map((result) => Number(result.result))
      .filter(Number.isFinite)
  );
}

async function show3dDice(roll, visibility) {
  if (!game.modules.get("dice-so-nice")?.active || !game.dice3d) return;
  try {
    const whisper = visibility === "gmOnly"
      ? (game.users?.filter((user) => user.isGM).map((user) => user.id) ?? [])
      : [];
    await game.dice3d.showForRoll(roll, game.user, true, whisper, visibility === "gmOnly");
  } catch (err) {
    debug("Dice So Nice display failed; continuing with normal result", err);
  }
}

async function writeHistory(state, profile, type, data = {}) {
  pushHistory(state, makeHistoryEntry(type, data), profile.maxHistory);
  return setState(state);
}

export async function rollPool({ mode = "risk", reason = "", forceDiceCount = null } = {}) {
  if (!requireGM()) return null;
  const profile = getActiveProfile();
  let state = getState();
  const storedCount = Math.min(state.diceCount, profile.poolSize);
  const requested = forceDiceCount == null ? storedCount : clampInt(forceDiceCount, 0, 100, storedCount);
  const diceCount = Math.max(requested, 1);

  debug(`Rolling ${diceCount}d${profile.dieFaces} (${mode})`, { storedCount, reason });
  if (game.dice3d) updateDiceSoNicePreset(game.dice3d, profile);
  const roll = await new Roll(`${diceCount}dt`).evaluate();
  await show3dDice(roll, profile.rollVisibility);
  const results = rollResults(roll).sort((a, b) => a - b);
  const complicationCount = countComplications(results, profile.triggerValues);

  const rollResult = {
    mode,
    profileId: profile.id,
    diceCount,
    storedCount,
    dieFaces: profile.dieFaces,
    triggerValues: [...profile.triggerValues],
    results,
    complicationCount,
    hasComplication: complicationCount > 0,
    reason,
    at: Date.now(),
  };

  if (mode === "clear") state.diceCount = 0;
  state.lastRoll = rollResult;
  state = await writeHistory(state, profile, "roll", {
    mode,
    reason,
    diceCount,
    results,
    complicationCount,
    resultingCount: state.diceCount,
  });

  await postRollMessage({ profile, mode, diceCount, results, complicationCount, reason });
  Hooks.callAll(HOOKS.ROLLED, rollResult);

  let complication = null;
  if (complicationCount > 0) {
    complication = await resolveComplications({ profile, rollResult });
  }

  return { roll: rollResult, complication, state };
}

export async function addTension({ amount = 1, reason = "Time-consuming action", category = "time", rollAfter = false } = {}) {
  if (!requireGM()) return null;
  const profile = getActiveProfile();
  const state = getState();
  const addAmount = clampInt(amount, 1, 100, 1);
  const plan = buildAddPlan(state.diceCount, addAmount, profile.poolSize);
  const rolls = [];
  let autoClearedOnFinalStep = false;

  for (let index = 0; index < plan.length; index += 1) {
    const step = plan[index];
    autoClearedOnFinalStep = step.type === "fill" && index === plan.length - 1;
    let current = getState();
    current.diceCount = step.count;
    current = await writeHistory(current, profile, "add", {
      category,
      reason,
      amount: step.added,
      resultingCount: step.count,
    });

    if (step.type === "fill") {
      const result = await rollPool({ mode: "clear", reason: "The tension pool filled." });
      if (result) rolls.push(result);
    }
  }

  if (rollAfter && !autoClearedOnFinalStep) {
    const result = await rollPool({ mode: "risk", reason });
    if (result) rolls.push(result);
  }

  return { state: getState(), rolls };
}

export async function addTime(reason = "Time-consuming action") {
  return addTension({ amount: 1, reason, category: "time" });
}

export async function rollRisk(reason = "Reckless action") {
  return rollPool({ mode: "risk", reason });
}

export async function addTimeAndRisk(reason = "Time-consuming and reckless action") {
  return addTension({ amount: 1, reason, category: "time-risk", rollAfter: true });
}

export async function removeTension(amount = 1, reason = "GM adjustment") {
  if (!requireGM()) return null;
  const profile = getActiveProfile();
  let state = getState();
  const removeAmount = clampInt(amount, 1, 100, 1);
  const previous = state.diceCount;
  state.diceCount = Math.max(0, previous - removeAmount);
  state = await writeHistory(state, profile, "remove", {
    reason,
    amount: previous - state.diceCount,
    resultingCount: state.diceCount,
  });
  return state;
}

export async function breakPool(reason = "GM cleared the pool") {
  return rollPool({ mode: "clear", reason });
}

export async function resetPool(reason = "Administrative reset") {
  if (!requireGM()) return null;
  const profile = getActiveProfile();
  let state = getState();
  const previous = state.diceCount;
  state.diceCount = 0;
  state.lastRoll = null;
  state = await writeHistory(state, profile, "reset", { reason, previous, resultingCount: 0 });
  return state;
}

export function getRiskChance() {
  const profile = getActiveProfile();
  const state = getState();
  return calculateComplicationChance(Math.max(state.diceCount, 1), profile.dieFaces, profile.triggerValues);
}

export function validateState() {
  const profile = getActiveProfile();
  const state = getState();
  if (state.diceCount > profile.poolSize) {
    warn("Stored tension exceeds active profile size; clamping.", { state, profile });
    state.diceCount = profile.poolSize;
    return setState(state);
  }
  return Promise.resolve(state);
}
