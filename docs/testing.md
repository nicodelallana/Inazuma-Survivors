# Testing and Verification

## Current state

The repository currently has no game source, package manifest, build, or test suite. Node.js `v22.23.1` and Python `3.14.8` were available during foundation work.

## Planned automated tests

Use Node's built-in `node:test` for browser-independent modules. Add tests for:

- Health limits, damage, defeat, and cooldown timing.
- Technique effect/range and no activation while cooling down.
- XP thresholds, level-up, deterministic upgrade application.
- Spawn bounds/timing and enemy behavior decisions.
- Run state transitions, victory/defeat, and restart reset.

Add integration tests for attack-to-defeat-to-XP flow and level-up selection. Document exact `npm test` or `node --test` commands only after the project manifest/test layout is created.

## Build and launch checks

No build is planned initially. Once `index.html` is implemented, serve the repository root with:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` and check browser console/network errors. This is a planned smoke procedure; it cannot pass until a playable entry point exists.

## Manual gameplay smoke test

1. Start a new run and verify the arena/HUD render.
2. Move in all directions and verify arena bounds.
3. Observe both enemy behaviors and use the basic attack.
4. Activate the special technique; confirm its effect and cooldown.
5. Defeat enemies, collect XP, level up, and apply an upgrade.
6. Reach victory and defeat conditions in separate runs.
7. Restart and confirm health, enemies, timer, XP, and cooldown reset.
8. Verify missing optional sprite files fall back visibly without breaking simulation.

Record which checks were automated and which were performed manually. Do not claim visual verification from unit tests alone.