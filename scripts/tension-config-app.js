import { MODULE_ID } from "./constants.js";
import { getProfiles, getActiveProfile, setActiveProfile, saveProfile, createProfile, deleteProfile } from "./profiles.js";
import { resetPool } from "./engine.js";
import { normalizeTriggerValues } from "./rules.js";
import { error } from "./logger.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TensionConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "zft-tension-config",
    classes: ["zft-tension-config"],
    tag: "form",
    window: {
      title: "ZFT Tension Pool Configuration",
      resizable: true,
    },
    position: {
      width: 560,
      height: "auto",
    },
    actions: {
      save: TensionConfigApp._onSave,
      newProfile: TensionConfigApp._onNewProfile,
      deleteProfile: TensionConfigApp._onDeleteProfile,
      resetPool: TensionConfigApp._onResetPool,
    },
  };

  static PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/config.hbs` },
  };

  async _prepareContext() {
    const profiles = getProfiles();
    const active = getActiveProfile();
    return {
      profile: active,
      profiles: Object.values(profiles).map((profile) => ({
        ...profile,
        selected: profile.id === active.id,
      })),
      isOnlyProfile: Object.keys(profiles).length <= 1,
      dieOptions: [4, 6, 8, 10, 12, 20].map((faces) => ({
        faces,
        selected: faces === active.dieFaces,
      })),
      rollVisibilityOptions: [
        { value: "public", label: "Public", selected: active.rollVisibility === "public" },
        { value: "gmOnly", label: "GM Only", selected: active.rollVisibility === "gmOnly" },
      ],
      complicationVisibilityOptions: [
        { value: "public", label: "Public", selected: active.complicationVisibility === "public" },
        { value: "gmOnly", label: "GM Only", selected: active.complicationVisibility === "gmOnly" },
      ],
    };
  }

  async _onRender() {
    const select = this.element?.querySelector('[name="activeProfile"]');
    select?.addEventListener("change", async (event) => {
      await setActiveProfile(event.currentTarget.value);
      this.render({ force: true });
    }, { once: true });
  }

  static _readForm(app) {
    const form = app.element;
    const data = new FormData(form);
    const active = getActiveProfile();
    return {
      ...active,
      name: String(data.get("name") || active.name),
      poolSize: Number(data.get("poolSize")),
      dieFaces: Number(data.get("dieFaces")),
      triggerValues: normalizeTriggerValues(
        String(data.get("triggerValues") || "1").split(",").map((value) => value.trim()),
        Number(data.get("dieFaces"))
      ),
      normalTableUuid: String(data.get("normalTableUuid") || "").trim(),
      severeTableUuid: String(data.get("severeTableUuid") || "").trim(),
      severeThreshold: Number(data.get("severeThreshold")),
      rollVisibility: String(data.get("rollVisibility") || "public"),
      complicationVisibility: String(data.get("complicationVisibility") || "public"),
      publicSecretNotice: data.get("publicSecretNotice") === "on",
      showReasonsToPlayers: data.get("showReasonsToPlayers") === "on",
      maxHistory: Number(data.get("maxHistory")),
    };
  }

  static async _onSave(event) {
    event?.preventDefault?.();
    const app = this;
    try {
      const profile = TensionConfigApp._readForm(app);
      await saveProfile(profile);
      ui.notifications?.info(`Saved tension profile: ${profile.name}`);
      app.render({ force: true });
    } catch (err) {
      error("Failed to save tension profile", err);
      ui.notifications?.error("Failed to save the tension profile. See console.");
    }
  }

  static async _onNewProfile() {
    const app = this;
    const name = await foundry.applications.api.DialogV2.prompt({
      window: { title: "New Tension Profile" },
      content: '<form><div class="form-group"><label>Profile Name</label><input type="text" name="name" value="New Profile" autofocus></div></form>',
      ok: {
        label: "Create",
        callback: (_event, button) => String(button.form.elements.name.value || "New Profile"),
      },
    });
    if (!name) return;
    await createProfile(name);
    app.render({ force: true });
  }

  static async _onDeleteProfile() {
    const app = this;
    const profile = getActiveProfile();
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Delete Tension Profile" },
      content: `<p>Delete <strong>${profile.name}</strong>?</p>`,
    });
    if (!confirmed) return;
    try {
      await deleteProfile(profile.id);
      app.render({ force: true });
    } catch (err) {
      ui.notifications?.warn(err.message ?? String(err));
    }
  }

  static async _onResetPool() {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Reset Tension Pool" },
      content: "<p>Reset the current pool to zero without rolling? This is an administrative reset, not a normal Tension Pool clear.</p>",
    });
    if (!confirmed) return;
    await resetPool("Administrative reset from configuration");
  }
}
