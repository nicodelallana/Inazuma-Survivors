# Inazuma Survivors

Browser-based, single-player horde-survival prototype inspired by football-themed special techniques. The intended loop is to move around an arena, defeat waves of enemies, collect experience, choose upgrades, and survive to the run's end.

## Status

Project foundation and first playable slice are in progress. The current repository does not yet contain a playable build.

## Planned first playable

- One controllable character and one arena.
- Automatic basic attack and one activated special technique.
- Two enemy behaviors, health, damage, collisions, and spawning.
- Experience, level-ups, and a small set of upgrades.
- A clear run outcome and restart flow.

The exact balance and controls are documented as proposed defaults in [spec.md](spec.md).

## Technology

The initial slice is planned with JavaScript ES modules and Canvas 2D, served over local HTTP. No framework or runtime dependency is currently installed. The decision and trade-offs are in [docs/decisions/0001-engine-selection.md](docs/decisions/0001-engine-selection.md).

## Run locally

Once the playable entry point is implemented, from the project root run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. This is a planned launch command; the current documentation-only repository is not playable yet.

## Development and tests

No automated test suite or build command exists yet. The implementation plan calls for deterministic gameplay tests using Node's built-in test runner, plus a manual browser smoke test. See [docs/testing.md](docs/testing.md) for current and planned verification.

## References and asset provenance

- [PokéSurvivor](https://github.com/JPTER78/pokesurvivor) is a read-only reference for survivor-game systems. Its code and assets are not copied into this project.
- [Inazuma Rogue](https://github.com/franmndezzzz/Inazuma-Rogue) is the requested candidate source for character sprites. The user reports noncommercial permission from its creator. That permission is recorded as user-reported and does not automatically cover material extracted from third-party commercial games. Each imported asset must have its rights and conditions recorded in [docs/asset-inventory.md](docs/asset-inventory.md).
- The destination repository's MIT license covers only original project material that the project authors can license; it does not grant rights to Inazuma Eleven or any third-party resources.

The project is intended to remain private and noncommercial during development. Public distribution is out of scope until relevant rights are reviewed.

## Documentation

- [Product specification](spec.md)
- [Repository audit](docs/repository-audit.md)
- [Architecture](docs/architecture.md)
- [Implementation roadmap](docs/implementation-plan.md)
- [Asset inventory](docs/asset-inventory.md)
- [Testing guide](docs/testing.md)