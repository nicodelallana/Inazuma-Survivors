# Reference Repository Audit

Read-only audit for implementation planning. Revisions and repository state are observations from 2026-10-28; remote heads may change. The references were not cloned into or modified in the destination repository.

## Destination

- Repository: `https://github.com/nicodelallana/Inazuma-Survivors`
- Base commit: `264d6028f4f4754b120654bb70d666347b9ef4a7` (`main` and `origin/main` at inspection).
- Initial contents: `README.md` and an MIT `LICENSE`; no package manifest, game source, assets, or tests.
- Environment checked: Node.js `v22.23.1`; Python `3.14.8`.

## Repository A: PokéSurvivor

- URL: `https://github.com/JPTER78/pokesurvivor`
- Inspected revision: `5c97df2e764a11f7a99b46c2104413a073f117ad`.
- Stack: vanilla HTML, CSS, JavaScript, Canvas 2D; no required runtime framework.
- Structure: `js/core`, `js/data`, `js/world`, `js/entities`, `js/systems`, `js/ui`, `game.js`, `tools/`, plus `assets/`.
- Relevant systems: input/movement, player/enemy/projectile/pickup entities, combat, spawning, level-up, world collision, HUD and run flow. README describes auto-attacks, enemy personalities, timed environmental effects, XP, upgrades, bosses, and persistent/social features.
- Assets: PNG sprite sheets; README describes directional rows and per-animation frame sizes/anchors. Audio is implemented with Web Audio and music data.
- Run/build/test: README says open `index.html`; `node tools/build.js` builds publication output; Python 3 + Pillow and network are used by sprite/data generation tools. Tests use Node's built-in test framework in `tests/*.test.cjs`; README does not give a single test command.
- Licensing: current code license is PolyForm Noncommercial 1.0.0 since 2026-10-14; MIT applies only through `b297089`. SpriteCollab art is CC BY-NC 4.0 with attribution; font and data have separate conditions; Pokémon IP is not licensed by these project licenses.
- Reuse decision: use broad system ideas only. Do not copy code or assets into this project.

## Repository B: Inazuma Rogue

- URL: `https://github.com/franmndezzzz/Inazuma-Rogue`
- Inspected revision: `eae7ae4c4b53ca902d090368a920644128d380b1`.
- Stack: HTML/JavaScript/Python; Phaser 3.80.1 is loaded from a CDN. `build.py` combines ordered source modules and `juego/gamedata.json` into `juego/index.html`.
- Structure documented in README: `src/` contains gameplay/UI modules; `juego/` contains the playable HTML, sprites, music, and crests; `test/` contains Node tests.
- The inspected tree contains large numbered PNG groups under `juego/sprites/` (including `c*.png`, `f*.png`, `q*.png`, and `r*.png`), numerous MP3 files under `juego/audio/`, and illustrations/crests under `juego/ui/`. It also contains sprite-processing/extraction tools such as `tools/ie3_sprites.py`.
- Game systems: real-time 5v5 football, techniques, teams, career, roguelite progression, gacha, and cloud save. This is not a survivor-game implementation.
- Run/build/test: README says serve `juego/` with `python3 -m http.server 8000`; build with `python3 build.py`; tests are Node-based but no top-level test command is documented in the README. Phaser's CDN introduces a network dependency.
- Licensing/provenance: README explicitly says `juego/` includes resources taken from original games and asks users to keep the repository private. No root license was found during inspection. User reports the repository creator permitted noncommercial use; that report is not evidence that third-party game assets are licensable by the creator.
- Asset policy: repository-wide sprite groups are not approved for import because the README says resources were taken from original games. The user's reported creator permission is recorded, but does not establish third-party rights. Do not import these groups; use original/placeholders unless specific assets are shown to be creator-owned or otherwise cleared.

## Risks and recommendation

- The source projects use different implementation styles, and neither should be merged into this project.
- Inazuma Rogue's Phaser CDN and build pipeline are unnecessary coupling for a new horde arena; Canvas 2D avoids runtime dependencies and is enough for the planned 2D slice.
- Both projects include franchise material; noncommercial/private intent and repository-creator permission do not automatically resolve every third-party right.
- Recommended first milestone: one player and arena, basic auto-target attack, one activated technique, two enemy behaviors, XP/level-up choices, a finite run outcome, and restart. Keep pure simulation logic separate from rendering and asset loading.