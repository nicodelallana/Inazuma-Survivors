import test from 'node:test';
import assert from 'node:assert/strict';
import { applyUpgrade, createRun, GAME_CONFIG, TECHNIQUES, updateGame } from '../src/simulation.js';

test('movement is normalized and stays within the arena', () => {
  const state = createRun();
  const startX = state.player.x;
  const startY = state.player.y;
  updateGame(state, { moveX: 1, moveY: 1 }, 0.05);
  assert.ok(Math.abs((state.player.x - startX) - (state.player.y - startY)) < 0.001);

  state.player.x = GAME_CONFIG.worldWidth - 1;
  updateGame(state, { moveX: 1 }, 0.05);
  assert.equal(state.player.x, GAME_CONFIG.worldWidth - 28);
});

test('spawner creates two distinct enemy behaviors', () => {
  const state = createRun();
  state.spawnTimer = 0;
  updateGame(state, {}, 0.01);
  state.spawnTimer = 0;
  updateGame(state, {}, 0.01);
  state.spawnTimer = 0;
  updateGame(state, {}, 0.01);
  assert.deepEqual(new Set(state.enemies.map((enemy) => enemy.type)), new Set(['runner', 'shooter']));
});

test('special technique damages nearby enemies and starts cooldown', () => {
  const state = createRun();
  state.enemies.push({ x: state.player.x + 40, y: state.player.y, radius: 10, type: 'runner', health: 50, maxHealth: 50, speed: 0, attackTimer: 0 });
  updateGame(state, { techniquePressed: true }, 0.02);
  assert.equal(state.player.techniqueCooldown, GAME_CONFIG.techniqueCooldown);
  assert.ok(state.enemies[0].health < 50);
});

test('player attack projectile defeats an enemy and drops experience', () => {
  const state = createRun();
  state.player.attackCooldown = 0;
  state.enemies.push({ x: state.player.x + 35, y: state.player.y, radius: 10, type: 'runner', health: 10, maxHealth: 10, speed: 0, attackTimer: 0, hitFlash: 0 });
  updateGame(state, {}, 0.01);
  for (let index = 0; index < 12; index += 1) updateGame(state, {}, 0.05);
  assert.equal(state.kills, 1);
  assert.equal(state.player.xp, 1);
  assert.equal(state.pickups.length, 0);
});

test('experience pickup triggers a level choice and upgrade applies', () => {
  const state = createRun();
  state.player.xp = state.player.nextXp - 1;
  state.pickups.push({ x: state.player.x, y: state.player.y, radius: 7, value: 1, age: 0 });
  updateGame(state, {}, 0.01);
  assert.equal(state.phase, 'levelup');
  assert.equal(state.player.level, 2);
  applyUpgrade(state, 'power');
  assert.equal(state.phase, 'running');
  assert.equal(state.player.damageMultiplier, 1.25);
});

test('level-up can unlock and equip a new supertechnique', () => {
  const state = createRun();
  state.player.xp = state.player.nextXp;
  state.pickups.push({ x: state.player.x, y: state.player.y, radius: 7, value: 1, age: 0 });
  updateGame(state, {}, 0.01);
  const technique = state.upgradeChoices.find((choice) => choice.id === TECHNIQUES[1].id);
  assert.ok(technique);
  applyUpgrade(state, technique.id);
  assert.equal(state.player.activeTechnique, technique.id);
  assert.deepEqual(state.player.techniques, ['146', technique.id]);
});

test('run reaches victory after its duration and defeat at zero health', () => {
  const victory = createRun();
  victory.elapsed = GAME_CONFIG.runDuration - 0.01;
  updateGame(victory, {}, 0.02);
  assert.equal(victory.phase, 'victory');

  const defeat = createRun();
  defeat.player.health = 1;
  defeat.player.invulnerable = 0;
  defeat.enemies.push({ x: defeat.player.x + 12, y: defeat.player.y, radius: 12, type: 'runner', health: 32, maxHealth: 32, speed: 0, attackTimer: 0, hitFlash: 0 });
  updateGame(defeat, {}, 0.01);
  assert.equal(defeat.phase, 'defeat');
});
