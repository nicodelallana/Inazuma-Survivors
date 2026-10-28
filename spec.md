# Product Specification

## 1. Vision and goals

Build a small, complete, browser-playable horde-survival game with football-inspired special techniques. The first milestone prioritizes a responsive core loop and maintainable gameplay code over a large roster or content volume.

Confirmed: the working title is Inazuma Survivors; the user wants PokéSurvivor to inform waves and gameplay systems and Inazuma Rogue to be the candidate sprite source; development is private and noncommercial for now.

## 2. Core gameplay loop

Start a run, move around an arena, attack enemies, collect experience, choose upgrades on level-up, and reach a victory or defeat state. Restart begins a fresh run.

## 3. Platform and controls

Confirmed target: desktop browser for the first slice.

Proposed controls: WASD or arrow keys to move, Space to activate the special technique, and Escape to pause. Basic attacks target the nearest eligible enemy automatically. These controls are defaults, not separately approved requirements.

## 4. Player movement and combat

The player has health, movement speed, a basic attack, and one special technique with a cooldown. Movement is bounded by the arena. Combat rules must be deterministic and independent of animation playback. Damage, health clamping, defeat, cooldown, and hit resolution must be testable without rendering.

## 5. Enemies and spawning

The first slice has at least two distinct behaviors: a close-range chaser and a ranged enemy that keeps distance and telegraphs its attack. Enemies spawn in bounded waves with a simple elapsed-time difficulty increase. Spawn pacing must not create unbounded work.

## 6. Special techniques

The first technique is manually activated, has a visible cooldown, and produces a gameplay effect even if its sprite/effect asset is unavailable. Use a data definition for its name, cooldown, damage, range, and effect asset identifier. A technique's name and art remain subject to asset/IP clearance.

## 7. Experience and upgrades

Defeated enemies award experience pickups. Reaching a threshold pauses or safely suspends the run and presents three choices. The first upgrade pool is small and deterministic in tests; examples include increased health, attack damage, or movement speed. Thresholds and values are proposed tuning defaults.

## 8. Characters and unlocks

One playable character is in scope. Roster expansion and persistent unlocks are out of scope for the first slice. Character identity, names, and franchise-specific artwork require separate rights review before distribution.

## 9. Visuals and animation

Use a clear top-down arena, readable enemy silhouettes, hit feedback, and a legible HUD. The user requests candidate sprites from Inazuma Rogue and reports noncommercial permission from its creator. Record the permission and its scope; do not assume it extends to assets extracted from third-party games. Use only assets with documented permission. Placeholders are acceptable while provenance is being checked.

Animation states should be limited to states available in cleared assets (for example idle, run, attack, hurt, and defeated). Gameplay state must not depend on a particular animation file.

## 10. UI and game flow

Minimum flow: start, active run, level-up choice, pause/resume, victory or defeat, and restart. The HUD shows health, experience/level, technique cooldown, and run time. UI must remain readable at common desktop viewport sizes.

## 11. Audio

Sound and music are optional for the first playable. Add only original or explicitly permitted audio; provide a mute control if audio is included.

## 12. Performance and accessibility

Target smooth play on a typical desktop browser without unnecessary dependencies. Use keyboard-accessible controls, visible cooldown/state feedback, sufficient contrast, and avoid conveying damage or state by color alone. Profile before adding pooling or complex optimization.

## 13. Saves and progression

No accounts, cloud save, or persistent progression in the first slice. A run resets on restart. Any later persistence must be documented and tested independently.

## 14. Functional acceptance criteria

- The game starts in a browser served over HTTP and can begin a run.
- The player can move and remains within the arena.
- The basic attack can damage and defeat enemies.
- Two enemy behaviors are visibly and mechanically distinct.
- The special technique activates, affects gameplay, and respects cooldown.
- Defeated enemies reward experience; level-up offers upgrades and applies a selected upgrade.
- The run reaches a clear victory or defeat state and can restart.
- Missing optional art produces a clear fallback/diagnostic rather than crashing.
- Automated tests cover core calculations and key state transitions; a manual browser smoke test is recorded.

Proposed run endpoint: survive for three minutes to win; reaching zero health is defeat. This needs validation during the first playable and may change.

## 15. Out of scope

5v5 football simulation, career mode, gacha, monetization, online accounts, multiplayer, large roster, multiple arenas, and public release are not part of the first playable.

## 16. Open questions and assumptions

- Which specific Inazuma Rogue sprites are covered by the creator's permission, and does the creator have authority to license each extracted asset?
- Exact character/technique choice, balance values, and run endpoint.
- Whether the game will remain private or later be distributed. Public distribution requires a separate rights review.
- Browser/mobile support beyond the initial desktop target.