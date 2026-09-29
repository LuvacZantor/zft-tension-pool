import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAddPlan,
  calculateComplicationChance,
  countComplications,
  normalizeTriggerValues,
} from "../scripts/rules.js";

test("risk chance for one d6 with one trigger is 1/6", () => {
  assert.ok(Math.abs(calculateComplicationChance(1, 6, [1]) - (1 / 6)) < 1e-12);
});

test("risk chance for six d6 matches complement probability", () => {
  const expected = 1 - ((5 / 6) ** 6);
  assert.ok(Math.abs(calculateComplicationChance(6, 6, [1]) - expected) < 1e-12);
});

test("complications count configured trigger faces", () => {
  assert.equal(countComplications([1, 2, 1, 5], [1]), 2);
  assert.equal(countComplications([1, 2, 3, 2], [1, 2]), 3);
});

test("trigger normalization removes duplicates and invalid faces", () => {
  assert.deepEqual(normalizeTriggerValues([1, 1, 7, 2], 6), [1, 2]);
});

test("bulk add fills, clears, and continues", () => {
  assert.deepEqual(buildAddPlan(5, 8, 6), [
    { type: "fill", added: 1, count: 6 },
    { type: "fill", added: 6, count: 6 },
    { type: "set", added: 1, count: 1 },
  ]);
});
