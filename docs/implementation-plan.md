# Implementation Plan

Statuses are updated as work is verified. Branches are created from the latest appropriate base; no feature work is done directly on `main`.

| ID | Objective | Depends on | Branch | Acceptance criteria | Tests / verification | Status | Blockers |
|---|---|---|---|---|---|---|---|
| DOC-01 | Audit references and specify first slice | None | `docs/project-foundation` | README/spec/audit/architecture/asset inventory/testing/ADR exist and describe verified evidence and open rights questions | `git diff --check`; review paths, links, license claims | In progress | None |
| GAME-01 | Create browser shell, run state, input, and arena | DOC-01 | `feat/initial-survival-loop` | Starts over HTTP; player moves inside arena; restart resets run | Node tests for state/input helpers; browser smoke test | Planned | None |
| GAME-02 | Add combat and two enemy behaviors | GAME-01 | `feat/enemy-combat` | Basic attack and special technique work; both enemies damage/threaten player distinctly | Unit/integration tests; browser combat check | Planned | Sprite clearance for placeholder gameplay is not needed |
| GAME-03 | Add XP, upgrades, and run outcome | GAME-02 | `feat/progression-run-flow` | XP levels up; choice applies; win/loss and restart work | Progression/state tests; complete browser run | Planned | Run duration/balance provisional |
| ART-01 | Integrate individually cleared sprites | DOC-01 | `feat/character-sprites` | Each file has recorded source, format, permission, and attribution; animation validated in game | Asset/content validation; browser animation check | Blocked pending verification | Repository creator's reported permission may not cover original-game extracts |
| QA-01 | Complete regression and handoff | GAME-01, GAME-02, GAME-03 | `test/vertical-slice-regression` | Tests/build/run instructions are reproducible; diff/provenance reviewed | Automated tests and manual smoke checklist | Planned | Gameplay features |

## Git workflow

Use focused branches named `feat/`, `fix/`, `refactor/`, `test/`, `docs/`, or `chore/`. Inspect `git status` before switching. Commit logical verified units with Conventional Commit messages. Merge only after relevant checks pass; do not force-push or rewrite shared history. Use a pull request if remote access allows, otherwise perform a reviewed local merge.