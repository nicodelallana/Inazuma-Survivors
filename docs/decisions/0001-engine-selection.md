# ADR 0001: Browser Runtime for the First Playable

- Status: Accepted for the first vertical slice; revisit if asset formats or gameplay needs demonstrate a limitation.
- Date: 2026-10-28

## Context

The destination repository is empty apart from README and MIT license. PokéSurvivor uses vanilla JavaScript/Canvas 2D; Inazuma Rogue uses Phaser 3.80.1 via CDN and a Python concatenation build. The target is a small 2D horde-survival prototype with sprite animation, deterministic gameplay tests, and low setup friction.

## Options

1. Canvas 2D with browser JavaScript modules.
2. Phaser, matching Inazuma Rogue's renderer and scene/animation conveniences.
3. Combine/reference both projects' engines and code.

## Decision

Use browser JavaScript modules and Canvas 2D, served over local HTTP. Keep gameplay logic independent from the renderer, and integrate asset sheets through a small manifest/animation layer. Do not copy source code or combine engines.

## Consequences

- No framework dependency, package installation, or CDN is needed to run the initial game.
- The team owns a small amount of input, scene/state, and animation plumbing.
- Sprite-sheet layouts must be inspected and represented accurately in metadata; do not assume uniform grids.
- Pure gameplay modules can be tested using Node's built-in test runner.
- If asset complexity or future gameplay makes Canvas plumbing excessive, revisit this ADR with evidence rather than introducing a second engine.