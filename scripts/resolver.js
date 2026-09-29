import { HOOKS } from "./constants.js";
import { warn, debug } from "./logger.js";
import { postComplicationMessage } from "./chat.js";

async function resolveTable(uuid) {
  if (!uuid) return null;
  try {
    const document = await fromUuid(uuid);
    if (!document || document.documentName !== "RollTable") {
      warn(`Configured UUID is not a RollTable: ${uuid}`);
      return null;
    }
    return document;
  } catch (err) {
    warn(`Unable to resolve RollTable UUID: ${uuid}`, err);
    return null;
  }
}

async function resultText(result) {
  try {
    if (typeof result?.getChatText === "function") {
      const value = await result.getChatText();
      if (value) return value;
    }
  } catch {
  }
  return result?.description ?? result?.text ?? result?.name ?? "Complication";
}

async function drawEntries(table, count) {
  if (!table || count <= 0) return [];
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    const draw = await table.draw({ displayChat: false });
    const results = Array.from(draw?.results ?? []);
    for (const result of results) entries.push(await resultText(result));
  }
  return entries;
}

export async function resolveComplications({ profile, rollResult }) {
  const count = rollResult.complicationCount;
  if (count <= 0) return { severe: false, entries: [] };

  const useSevere = Boolean(profile.severeTableUuid) && count >= profile.severeThreshold;
  const table = await resolveTable(useSevere ? profile.severeTableUuid : profile.normalTableUuid);
  const draws = useSevere ? 1 : count;
  const entries = await drawEntries(table, draws);

  const result = { severe: useSevere, entries, complicationCount: count, rollResult };
  debug("Complication resolved", result);
  await postComplicationMessage({ profile, complicationCount: count, entries, severe: useSevere });
  Hooks.callAll(HOOKS.COMPLICATION, result);
  return result;
}
