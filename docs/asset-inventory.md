# Asset Inventory

No external assets have been copied into this repository. An asset is not approved merely because it is publicly downloadable or included in a reference repository.

| ID | Source / path | Type / format | Intended use | Permission status | Attribution / conditions | Conversion | Integration |
|---|---|---|---|---|---|---|---|
| IR-CHARACTERS | User-provided `Inazuma-Rogue-main.zip`, `juego/sprites/*.png` | 349 PNG sheets (`c*`, `f*`, `q*`, `r*`, `fhw.png`); character sheets include 48×48 frames | Full local sprite catalog; current run uses `c00.png` rows 0–2 | Supplied directly by the user; underlying repository README states the resources are extracted from original games. Keep provenance and private-use scope explicit; do not redistribute without clearance | Canvas crops selected rows/frames; no source code imported | None | Integrated locally in `assets/inazuma/sprites/`; catalog listed in `assets/inazuma/sprites/index.json` |
| IR-UI-AUDIO | User-provided `Inazuma-Rogue-main.zip`, `juego/ui/`, `juego/audio/` | 93 UI resources (PNG/TTF) and 56 MP3 | Team collection, shields, backgrounds, music and mute control | Supplied directly by the user; underlying repository has extraction/provenance restrictions and no root license | Keep private-use scope and provenance; do not redistribute without clearance | None | Integrated locally in `assets/inazuma/ui/` and `assets/inazuma/audio/` |
| PS-CANDIDATE | `JPTER78/pokesurvivor`, `assets/` | PNG sprite sheets | Not currently planned for integration | Source art is SpriteCollab CC BY-NC 4.0; code is under a separate license | Artist attribution required if ever used; separate franchise restrictions | Not applicable | Not imported |
| PLACEHOLDER | Original project-generated shapes | Canvas drawing | Temporary entities, effects, and UI | Original | None | None | Planned for gameplay before licensed art |

## Datos de jugadores y técnicas

- `content/players.json` conserva los nombres, roles, elementos y filas de los 16 jugadores que aparecen en `c00.png`.
- `content/techniques.json` conserva el catálogo de técnicas entregado por el usuario.
- Las animaciones de técnicas se generan en Canvas por efecto/tipo; no se ha asumido que `q*` o `f*` sean animaciones de técnicas, porque son hojas de retratos.
- `assets/inazuma/audio/` contiene las 56 pistas proporcionadas; `src/audio.js` usa música de menú, partida y resultado, con control de silencio.
- `assets/inazuma/ui/` contiene 93 recursos proporcionados; los escudos se usan en la colección de equipos.
- `content/player-catalog.json` contiene 2.531 nombres de jugadores y las plantillas de equipos para marcar jugadores obtenidos y faltantes.
