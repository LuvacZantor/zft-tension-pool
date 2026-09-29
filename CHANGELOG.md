# Changelog

## 0.1.1 - 2026-09-28

- Rebuilt the floating pool as a compact two-row icon control patterned after Tension Pool 2.
- Fixed drag persistence so the widget saves its new position instead of snapping back to the prior position.
- Replaced empty slot circles with Tension Pool 2-style skull pool indicators.
- Removed profile, status, and history text from the floating widget; details now live in tooltips/configuration.
- Added a custom `dt` tension die and Dice So Nice preset patterned after Tension Pool 2, with marked complication faces and dark tension colors.

## 0.1.0 - 2026-09-28

- Initial ZFT Tension Pool implementation.
- Foundry VTT V13 Build 351 and V14 target compatibility.
- Persistent world state and read-only player display.
- Time, Risk, Time + Risk, custom add, remove, break, and administrative reset actions.
- Correct core risk behavior: risk rolls preserve the pool; full-pool rolls clear it.
- Named profiles with configurable pool size, die size, trigger faces, visibility, and history.
- Normal and Severe complication RollTable resolution.
- Public API and hooks.
- Optional Dice So Nice integration with secret-roll recipient handling.
- Automated core rules tests and tag-based GitHub release workflow.
