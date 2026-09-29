export const VALID_DIE_FACES = Object.freeze([4, 6, 8, 10, 12, 20]);

export function clampInt(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

export function normalizeTriggerValues(values, dieFaces = 6) {
  const source = Array.isArray(values) ? values : [values];
  const normalized = [...new Set(
    source
      .map(Number)
      .filter(Number.isFinite)
      .map(Math.floor)
      .filter((value) => value >= 1 && value <= dieFaces)
  )].sort((a, b) => a - b);
  return normalized.length ? normalized : [1];
}

export function countComplications(results, triggerValues = [1]) {
  const triggers = new Set(triggerValues);
  return results.filter((result) => triggers.has(Number(result))).length;
}

export function calculateComplicationChance(diceCount, dieFaces = 6, triggerValues = [1]) {
  const dice = Math.max(0, Math.floor(Number(diceCount) || 0));
  if (!dice) return 0;
  const faces = VALID_DIE_FACES.includes(Number(dieFaces)) ? Number(dieFaces) : 6;
  const triggers = normalizeTriggerValues(triggerValues, faces).length;
  const missChance = (faces - triggers) / faces;
  return 1 - (missChance ** dice);
}

export function buildAddPlan(currentCount, amount, poolSize) {
  let current = clampInt(currentCount, 0, 999, 0);
  let remaining = clampInt(amount, 0, 100, 0);
  const max = clampInt(poolSize, 1, 20, 6);
  const steps = [];

  while (remaining > 0) {
    const space = max - current;
    if (space <= 0) {
      steps.push({ type: "fill", added: 0, count: max });
      current = 0;
      continue;
    }

    const added = Math.min(space, remaining);
    current += added;
    remaining -= added;

    if (current >= max) {
      steps.push({ type: "fill", added, count: max });
      current = 0;
    } else {
      steps.push({ type: "set", added, count: current });
    }
  }

  return steps;
}
