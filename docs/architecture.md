# Architecture

## High-level design

Use browser JavaScript ES modules with Canvas 2D for the first slice. Keep simulation and rendering separate so gameplay remains testable without a browser canvas. Serve the project over local HTTP; no bundler or framework is planned initially.

## Module responsibilities

- `core/`: startup, fixed-step/update loop, elapsed time, run state, configuration.
- `input/`: keyboard state and semantic actions; no gameplay mutation from DOM event handlers.
- `entities/`: player, enemy, projectile, and experience pickup state/lifecycle.
- `combat/`: health, damage, hit resolution, basic attack, technique/cooldown rules.
- `progression/`: experience thresholds, level changes, upgrade definitions/application.
- `systems/`: spawning, collision queries, run-end conditions.
- `render/`: Canvas drawing, camera/arena presentation, animation playback.
- `assets/`: asset manifest, image loading/cache, animation metadata, fallback placeholders.
- `ui/`: HUD, start/pause, upgrade selection, result/restart screens.
- `content/`: validated character, enemy, technique, upgrade, and spawn configuration.

Keep the initial implementation small; split modules only where they own a distinct responsibility. Do not introduce a general event bus or entity-component framework without a demonstrated need.

## Data and frame flow

1. Input maps keys to actions.
2. The game loop advances the simulation with elapsed time and a bounded timestep.
3. Spawn, movement, collision, combat, pickup, progression, and run-state rules update entities.
4. State transitions notify UI through explicit callbacks or returned results.
5. Rendering reads current state and draws sprites or placeholders; it does not determine damage or hit outcomes.

## Combat and techniques

Pure functions or small modules calculate damage, range, cooldown, and defeat. A technique definition contains an ID, display name, cooldown, damage/effect parameters, and optional animation/effect asset IDs. Activation returns a gameplay result independently of asset availability.

## Entity lifecycle

Entities are created by the run/spawn system, updated while active, and marked defeated/collected by simulation rules. Cleanup occurs at a stable point in the frame update. Avoid unbounded spawning and cap active entities based on observed need.

## Asset loading

Use a manifest keyed by stable IDs rather than scattered paths. Load selected sprite sheets and metadata through one loader, validate required files, and provide placeholders with diagnostics when optional art is absent. Animation metadata must describe actual frame size/layout/duration; do not assume all sheets are uniform grids. Track provenance and permission in `docs/asset-inventory.md`.

## Content, persistence, and errors

Validate data at startup and report unknown IDs or missing required fields. First slice has no persistence. Surface asset/config errors in development; missing optional visuals should not stop combat. Avoid silent exception swallowing.

## Dependency boundaries

Gameplay modules should not depend on Canvas, DOM, or file paths. Rendering may depend on the browser platform and the asset registry. Tests exercise pure rules in Node; browser smoke tests cover input, rendering, and full game flow.