# ZFT Tension Pool

A system-driven Tension Pool module for Foundry Virtual Tabletop.

Version: 0.1.0

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
- Draggable/collapsible ApplicationV2 widget.
- Time, Risk, Both, Custom Add, Remove, and Break controls.
- Accurate displayed complication probability for the current risk roll.
- Multiple named profiles.
- Configurable pool size, die size, and trigger faces.
- Normal and Severe complication RollTable UUIDs.
- Multiple complications from multiple trigger results.
- Separate roll-result and complication visibility.
- Optional public notice when secret rolls/complications occur.
- Persistent recent event history.
- Optional Dice So Nice animation using ordinary Foundry dice.
- Public module API and custom hooks.
- Focused `[ZFT]` debug logging.

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

### Hooks

```js
Hooks.on("zftTensionPoolReady", (api) => {});
Hooks.on("zftTensionPoolStateChanged", (state) => {});
Hooks.on("zftTensionPoolProfilesChanged", (profiles) => {});
Hooks.on("zftTensionPoolRolled", (rollResult) => {});
Hooks.on("zftTensionPoolComplication", (complicationResult) => {});
```

## Installation for development

Copy the `zft-tension-pool` directory into Foundry's `Data/modules/` directory, restart Foundry, enable the module in a test world, and refresh the browser.

## Initial validation

1. Enable the module in a V13 Build 351 or V14 test world.
2. Confirm the floating widget appears for GM and players.
3. Click `Time` five times. Expected: pool shows 5/6.
4. Click `Risk`. Expected: 5d6 rolls and the pool remains 5/6.
5. Click `Time`. Expected: the sixth die causes a 6d6 roll and the pool becomes 0/6.
6. With an empty pool, click `Risk`. Expected: 1d6 rolls and the pool remains empty.
7. Configure a Normal RollTable UUID and force a complication. Expected: complication result is posted according to configured visibility.
8. Configure a Severe RollTable and threshold, then generate enough trigger faces. Expected: the Severe table is used once.
9. Switch profiles. Expected: profile UI, pool limit, die size, and risk percentage update on all clients.
10. Enable debug logging and confirm diagnostic messages begin with `[ZFT]`.

## Attribution

The module was designed after reviewing `sagarc03/tension-pool-2`, an MIT-licensed Foundry module. See `THIRD_PARTY_NOTICES.md`.

The Tension Pool game mechanic is associated with The Angry GM. This project is not affiliated with or endorsed by The Angry GM.
