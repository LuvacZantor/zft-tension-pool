import { MODULE_ID } from "./constants.js";
import { getSetting, setSetting } from "./settings.js";
import { getState } from "./state.js";
import { getProfiles, getActiveProfile, setActiveProfile } from "./profiles.js";
import { addTime, rollRisk, addTimeAndRisk, addTension, removeTension, breakPool, getRiskChance } from "./engine.js";
import { TensionConfigApp } from "./tension-config-app.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function formatHistory(entry, showReason) {
  const when = new Date(entry.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const reason = showReason && entry.reason ? ` · ${entry.reason}` : "";
  switch (entry.type) {
    case "add": return `${when} · +${entry.amount} tension${reason}`;
    case "remove": return `${when} · -${entry.amount} tension${reason}`;
    case "roll": return `${when} · ${entry.mode === "clear" ? "Pool break" : "Risk roll"} · ${entry.complicationCount} complication(s)${reason}`;
    case "reset": return `${when} · Pool reset${reason}`;
    default: return `${when} · ${entry.type}${reason}`;
  }
}

export class TensionPoolApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "zft-tension-pool",
    classes: ["zft-tension-pool"],
    window: { frame: false, positioned: false },
    nonDismissible: true,
    actions: {
      toggle: TensionPoolApp._onToggle,
      addTime: TensionPoolApp._onAddTime,
      risk: TensionPoolApp._onRisk,
      timeRisk: TensionPoolApp._onTimeRisk,
      custom: TensionPoolApp._onCustom,
      remove: TensionPoolApp._onRemove,
      breakPool: TensionPoolApp._onBreak,
      configure: TensionPoolApp._onConfigure,
    },
  };

  static PARTS = {
    pool: { template: `modules/${MODULE_ID}/templates/pool.hbs` },
  };

  #renderTimer = null;
  #drag = null;
  #boundResize = null;

  debouncedRender() {
    clearTimeout(this.#renderTimer);
    this.#renderTimer = setTimeout(() => this.render({ force: true }), 75);
  }

  async _prepareContext() {
    const state = getState();
    const profile = getActiveProfile();
    const profiles = getProfiles();
    const collapsed = Boolean(getSetting("collapsed"));
    const chance = getRiskChance();
    const showReasons = game.user.isGM || profile.showReasonsToPlayers;
    const history = [...state.history].slice(-5).reverse().map((entry) => ({
      text: formatHistory(entry, showReasons),
    }));

    const slots = Array.from({ length: profile.poolSize }, (_, index) => ({
      filled: index < state.diceCount,
    }));

    return {
      isGM: game.user.isGM,
      collapsed,
      state,
      profile,
      profiles: Object.values(profiles).map((item) => ({ ...item, selected: item.id === profile.id })),
      slots,
      history,
      riskChance: `${(chance * 100).toFixed(1)}%`,
      dieLabel: `d${profile.dieFaces}`,
    };
  }

  async _onRender() {
    const element = this.element;
    if (!element) return;
    element.style.position = "fixed";
    this.#restorePosition();

    const handle = element.querySelector("[data-drag-handle]");
    handle?.addEventListener("pointerdown", (event) => this.#startDrag(event));

    const profileSelect = element.querySelector('[name="profile"]');
    profileSelect?.addEventListener("change", async (event) => {
      if (!game.user.isGM) return;
      await setActiveProfile(event.currentTarget.value);
    });

    if (!this.#boundResize) {
      this.#boundResize = () => this.#restorePosition(true);
      window.addEventListener("resize", this.#boundResize);
    }
  }

  #restorePosition(clampOnly = false) {
    const element = this.element;
    if (!element) return;
    const saved = getSetting("windowPosition");
    const width = element.offsetWidth || 360;
    const height = element.offsetHeight || 120;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);

    let left;
    let top;
    if (saved?.leftPct != null && saved?.topPct != null) {
      left = Math.round(saved.leftPct * window.innerWidth);
      top = Math.round(saved.topPct * window.innerHeight);
    } else if (!clampOnly) {
      left = Math.round((window.innerWidth - width) / 2);
      top = 80;
    } else {
      left = parseInt(element.style.left, 10) || 8;
      top = parseInt(element.style.top, 10) || 8;
    }

    left = Math.min(Math.max(left, 8), maxLeft);
    top = Math.min(Math.max(top, 8), maxTop);
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }

  #startDrag(event) {
    if (event.button !== 0 || event.target.closest("button, select, input")) return;
    const element = this.element;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    this.#drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };

    const move = (moveEvent) => {
      if (!this.#drag) return;
      element.style.left = `${this.#drag.left + (moveEvent.clientX - this.#drag.x)}px`;
      element.style.top = `${this.#drag.top + (moveEvent.clientY - this.#drag.y)}px`;
    };

    const up = async () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      this.#restorePosition(true);
      const left = parseInt(element.style.left, 10) || 0;
      const top = parseInt(element.style.top, 10) || 0;
      await setSetting("windowPosition", {
        leftPct: left / Math.max(window.innerWidth, 1),
        topPct: top / Math.max(window.innerHeight, 1),
      });
      this.#drag = null;
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  static async _onToggle() {
    await setSetting("collapsed", !getSetting("collapsed"));
  }

  static async _onAddTime() {
    await addTime();
  }

  static async _onRisk() {
    await rollRisk();
  }

  static async _onTimeRisk() {
    await addTimeAndRisk();
  }

  static async _onRemove() {
    await removeTension(1);
  }

  static async _onBreak() {
    await breakPool();
  }

  static async _onConfigure() {
    new TensionConfigApp().render({ force: true });
  }

  static async _onCustom() {
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: "Add Custom Tension" },
      content: `<form>
        <div class="form-group"><label>Dice</label><input name="amount" type="number" value="1" min="1" max="100"></div>
        <div class="form-group"><label>Reason</label><input name="reason" type="text" value="GM action"></div>
      </form>`,
      ok: {
        label: "Add",
        callback: (_event, button) => ({
          amount: Number(button.form.elements.amount.value),
          reason: String(button.form.elements.reason.value || "GM action"),
        }),
      },
    });
    if (!result) return;
    await addTension({ amount: result.amount, reason: result.reason, category: "custom" });
  }
}
