import { MODULE_ID } from "./constants.js";
import { getSetting, setSetting } from "./settings.js";
import { getState } from "./state.js";
import { getActiveProfile } from "./profiles.js";
import { addTime, rollRisk, addTimeAndRisk, addTension, removeTension, breakPool, getRiskChance } from "./engine.js";
import { TensionConfigApp } from "./tension-config-app.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function clampPosition(left, top, width, height) {
  const margin = 8;
  return {
    left: Math.min(Math.max(left, margin), Math.max(margin, window.innerWidth - width - margin)),
    top: Math.min(Math.max(top, margin), Math.max(margin, window.innerHeight - height - margin)),
  };
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
  #dragState = null;
  #boundResize = null;
  #previousDiceCount = -1;

  debouncedRender() {
    clearTimeout(this.#renderTimer);
    this.#renderTimer = setTimeout(() => this.render({ force: true }), 75);
  }

  async _prepareContext() {
    const state = getState();
    const profile = getActiveProfile();
    const collapsed = Boolean(getSetting("collapsed"));
    const riskChance = `${(getRiskChance() * 100).toFixed(1)}%`;

    const icons = state.diceCount === 0
      ? [{ class: "fa-regular fa-skull" }]
      : Array.from({ length: state.diceCount }, () => ({ class: "fa-solid fa-skull" }));

    return {
      isGM: game.user.isGM,
      collapsed,
      state,
      profile,
      icons,
      compactIcon: state.diceCount === 0 ? "fa-regular fa-skull" : "fa-solid fa-skull",
      poolTooltip: `${profile.name} · ${state.diceCount}/${profile.poolSize} d${profile.dieFaces} · Risk ${riskChance}`,
      toggleIcon: collapsed ? "fa-chevron-up" : "fa-chevron-down",
      toggleTooltip: collapsed ? "Expand Tension Pool" : "Compact Tension Pool",
    };
  }

  async _onRender() {
    const element = this.element;
    if (!element) return;

    element.style.position = "fixed";
    this.#applySavedPosition();

    const handle = element.querySelector("[data-drag-handle]");
    handle?.addEventListener("pointerdown", (event) => this.#startDrag(event));

    if (!this.#boundResize) {
      this.#boundResize = () => this.#applySavedPosition();
      window.addEventListener("resize", this.#boundResize);
    }

    const currentCount = getState().diceCount;
    if (this.#previousDiceCount >= 0 && this.#previousDiceCount !== currentCount) {
      const icons = element.querySelectorAll(".zft-tp-icons i");
      const animation = currentCount > this.#previousDiceCount ? "zft-tp-pulse" : "zft-tp-fade";
      icons.forEach((icon) => {
        icon.classList.add(animation);
        icon.addEventListener("animationend", () => icon.classList.remove(animation), { once: true });
      });
    }
    this.#previousDiceCount = currentCount;
  }

  #applySavedPosition() {
    const element = this.element;
    if (!element) return;

    const saved = getSetting("windowPosition");
    const width = element.offsetWidth || 180;
    const height = element.offsetHeight || 60;

    let left;
    let top;
    if (saved?.leftPct != null && saved?.topPct != null) {
      left = saved.leftPct * window.innerWidth;
      top = saved.topPct * window.innerHeight;
    } else {
      left = (window.innerWidth - width) / 2;
      top = 80;
    }

    const clamped = clampPosition(left, top, width, height);
    element.style.left = `${Math.round(clamped.left)}px`;
    element.style.top = `${Math.round(clamped.top)}px`;
  }

  #startDrag(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    const element = this.element;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    this.#dragState = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };

    const onMove = (moveEvent) => {
      if (!this.#dragState) return;
      element.style.left = `${this.#dragState.startLeft + moveEvent.clientX - this.#dragState.startX}px`;
      element.style.top = `${this.#dragState.startTop + moveEvent.clientY - this.#dragState.startY}px`;
    };

    const onUp = async () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);

      if (!this.#dragState) return;

      const rawLeft = parseFloat(element.style.left) || 0;
      const rawTop = parseFloat(element.style.top) || 0;
      const clamped = clampPosition(rawLeft, rawTop, element.offsetWidth, element.offsetHeight);

      element.style.left = `${Math.round(clamped.left)}px`;
      element.style.top = `${Math.round(clamped.top)}px`;

      await setSetting("windowPosition", {
        leftPct: clamped.left / Math.max(window.innerWidth, 1),
        topPct: clamped.top / Math.max(window.innerHeight, 1),
      });

      this.#dragState = null;
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
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
