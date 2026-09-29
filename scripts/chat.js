import { MODULE_TITLE } from "./constants.js";

function gmWhisperIds() {
  return game.users?.filter((user) => user.isGM).map((user) => user.id) ?? [];
}

function messageVisibility(visibility) {
  return visibility === "gmOnly" ? { whisper: gmWhisperIds() } : {};
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

export async function postRollMessage({ profile, mode, diceCount, results, complicationCount, reason }) {
  const triggers = new Set(profile.triggerValues);
  const diceHtml = results.map((result) => {
    const hit = triggers.has(result);
    return `<span class="zft-tp-result-die ${hit ? "is-hit" : ""}">${result}</span>`;
  }).join("");

  const modeLabel = mode === "risk" ? "Risk Roll" : mode === "clear" ? "Pool Break" : "Tension Roll";
  const outcome = complicationCount > 0
    ? `<strong class="zft-tp-danger">${complicationCount} complication${complicationCount === 1 ? "" : "s"}</strong>`
    : `<strong class="zft-tp-safe">Safe... for now.</strong>`;

  await ChatMessage.create({
    speaker: { alias: MODULE_TITLE },
    content: `
      <section class="zft-tp-chat-card">
        <header>${escapeHtml(profile.name)} · ${modeLabel}</header>
        ${reason ? `<div class="zft-tp-chat-reason">${escapeHtml(reason)}</div>` : ""}
        <div class="zft-tp-chat-dice">${diceHtml}</div>
        <footer>${outcome}</footer>
      </section>
    `,
    ...messageVisibility(profile.rollVisibility),
  });

  if (profile.rollVisibility === "gmOnly" && profile.publicSecretNotice) {
    await ChatMessage.create({
      speaker: { alias: MODULE_TITLE },
      content: `<section class="zft-tp-chat-card is-secret"><i class="fa-solid fa-eye-slash"></i> The tension pool was rolled in secret.</section>`,
    });
  }
}

export async function postComplicationMessage({ profile, complicationCount, entries, severe }) {
  const list = entries.length
    ? `<ol>${entries.map((entry) => `<li>${entry}</li>`).join("")}</ol>`
    : `<p>No complication RollTable is configured. Resolve ${complicationCount} complication${complicationCount === 1 ? "" : "s"} manually.</p>`;

  await ChatMessage.create({
    speaker: { alias: MODULE_TITLE },
    content: `
      <section class="zft-tp-chat-card is-complication">
        <header>${severe ? "Severe Complication" : "Complication"}</header>
        <div>${list}</div>
      </section>
    `,
    ...messageVisibility(profile.complicationVisibility),
  });

  if (profile.complicationVisibility === "gmOnly" && profile.publicSecretNotice) {
    await ChatMessage.create({
      speaker: { alias: MODULE_TITLE },
      content: `<section class="zft-tp-chat-card is-secret"><i class="fa-solid fa-skull"></i> A complication has occurred.</section>`,
    });
  }
}
