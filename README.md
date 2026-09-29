# ZFT Tension Pool

A system-driven Tension Pool module for Foundry Virtual Tabletop.

Version: 0.1.2

## Compatibility

- Foundry VTT V13 Build 351
- Foundry VTT V14
- System agnostic
- Optional Dice So Nice support

## Core mechanic

The default profile follows the published Tension Pool procedure:

- Time-Consuming action: add one die.
- Reckless action: roll the current pool and return the dice to the pool.
- Time-Consuming + Reckless: add one die, then roll the pool.
- When adding a die fills the pool, roll and clear it instead of making an additional risk roll.
- If a risk roll occurs while the pool is empty, roll one temporary die without adding it to the pool.
- Any configured trigger face causes a Complication. The standard profile uses a 1 on a d6.

## Features

- Persistent world-level tension state.
- Read-only player display and GM controls.
- Compact, draggable/collapsible ApplicationV2 icon widget patterned after Tension Pool 2.
- Time, Risk, Both, Custom Add, Remove, and Break controls.
- Accurate displayed complication probability for the current risk roll.
- Multiple named profiles.
- Configurable pool size, die size, and trigger faces.
- Normal and Severe complication RollTable UUIDs.
- Multiple complications from multiple trigger results.
- Separate roll-result and complication visibility.
- Optional public notice when secret rolls/complications occur.
- Persistent recent event history.
- Optional Dice So Nice integration using a custom tension die with marked complication faces.
- Configurable sound effects for adding tension, removing tension, and rolling/breaking the pool.
- Public module API and custom hooks.
- Focused `[ZFT]` debug logging.

## Sound effects

Sound effects are enabled by default and can be disabled or replaced in Foundry module settings.

Default mapping:

- Add tension: Metal Hit
- Remove tension: Magical Notification Tone - Soft Fantasy Digital Alert
- Roll / break: Evil Bell

The included audio files are Pixabay Content License assets and are not covered by the module's MIT source-code license. See `THIRD_PARTY_ASSETS.md`.

## Complication resolution

A profile may configure two RollTables:

- Normal RollTable: one draw for each complication result.
- Severe RollTable: when the complication count reaches the configured Severe Threshold, draw once from the Severe table instead.

If no appropriate table is configured, the chat card reports the number of complications and leaves resolution to the GM.

## API

```js
const api = game.modules.get("zft-tension-pool")?.api;
```

Examples:

```js
await api.addTime("Search the library");
await api.risk("Kick down the locked door");
await api.timeAndRisk("Force the mechanism while alarms are active");
await api.add(3, { reason: "Three hours pass", category: "time" });
await api.remove(1, "GM correction");
await api.break("End of exploration phase");

console.log(api.getState());
console.log(api.getProfile());
console.log(api.getRiskChance());
```

## Attribution

The module was designed after reviewing `sagarc03/tension-pool-2`, an MIT-licensed Foundry module. See `THIRD_PARTY_NOTICES.md`.

The included audio assets remain under the Pixabay Content License. See `THIRD_PARTY_ASSETS.md`.

The Tension Pool game mechanic is associated with The Angry GM. This project is not affiliated with or endorsed by The Angry GM.
