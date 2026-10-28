import { getPropsInRegion } from './world.js';

export const GAME_CONFIG = Object.freeze({
  width: 960,
  height: 600,
  maxEnemies: 54,
  techniqueCooldown: 8,
  runDuration: 90,
});

export const TECHNIQUES = Object.freeze([
  { id: '146', symbol: '✦', name: 'Chut granada', type: 'tiro', power: 27, elem: 'fuego', effect: 'grenade', description: 'Disparo explosivo de fuego que golpea en área.', cooldown: 8, damage: 46, range: 165 },
  { id: '206', symbol: '↯', name: 'Pájaro de fuego', type: 'tiro', power: 91, elem: 'fuego', effect: 'firebird', description: 'Proyectiles de fuego fénix que buscan enemigos.', cooldown: 7, damage: 36, range: 410 },
  { id: '30480', symbol: '◆', name: 'Vórtice de fuego', type: 'tiro', power: 110, elem: 'fuego', effect: 'vortex', description: 'Una barrera ardiente que gira y quema todo a su paso.', cooldown: 10, damage: 80, range: 145 },
  { id: '143', symbol: '🔥', name: 'Tornado de fuego', type: 'tiro', power: 57, elem: 'fuego', effect: 'firetornado', description: 'Remate ígneo en espiral que arrasa con los rivales.', cooldown: 8, damage: 62, range: 190 },
  { id: '162', symbol: '✋', name: 'Mano celestial', type: 'parada', power: 36, elem: 'montaña', effect: 'godhand', description: 'Mano gigante dorada que aplasta a los rivales y protege.', cooldown: 9, damage: 75, range: 160 },
  { id: '120', symbol: '🧱', name: 'El muro', type: 'bloqueo', power: 36, elem: 'montaña', effect: 'wall', description: 'Levanta un muro de piedra que aturde y daña en círculo.', cooldown: 8.5, damage: 55, range: 150 },
  { id: '30481', symbol: '🐺', name: 'Leyenda del lobo', type: 'tiro', power: 110, elem: 'viento', effect: 'wolf', description: 'Disparo helado legendario con la furia del lobo.', cooldown: 9.5, damage: 85, range: 380 },
]);

export const UPGRADES = Object.freeze([
  { id: 'power', symbol: '⚡', name: 'Disparo pesado', description: 'Potencia de tiro +25%' },
  { id: 'pace', symbol: '»', name: 'Cambio de ritmo', description: 'Velocidad de movimiento +20%' },
  { id: 'vitality', symbol: '♥', name: 'Segundo aire', description: 'Energía máxima +20 y cura +35 HP' },
  { id: 'haste', symbol: '⏱', name: 'Concentración', description: 'Recarga de supertécnicas -20%' },
  { id: 'magnet', symbol: '🧲', name: 'Imán de balón', description: 'Radio de atracción de experiencia +60%' },
]);

export function applyMetaUpgrades(state, meta = {}) {
  const vitality = Number(meta.vitality) || 0;
  const power = Number(meta.power) || 0;
  const pace = Number(meta.pace) || 0;
  const haste = Number(meta.haste) || 0;
  const magnet = Number(meta.magnet) || 0;

  state.player.maxHealth += vitality * 12;
  state.player.health = state.player.maxHealth;
  state.player.damageMultiplier *= (1 + power * 0.12);
  state.player.speed *= (1 + pace * 0.08);
  state.player.cooldownMultiplier = Math.max(0.5, 1 - haste * 0.08);
  state.player.pickupRadius = 90 * (1 + magnet * 0.25);
  return state;
}

export function createRun(captain = null) {
  const capId = captain?.id || 1;
  const capName = captain?.name || 'Mark Evans';
  const capRole = captain?.role || 'POR';
  const capRow = captain?.sprite?.row ?? captain?.row ?? 0;
  const capElem = captain?.element || 'montaña';

  // Determinar técnica inicial según el capitán
  let startTech = '146';
  if (captain) {
    if (capId === 10) startTech = '143'; // Axel -> Tornado de fuego
    else if (capId === 3) startTech = '120'; // Jack -> El muro
  }

  return {
    phase: 'running',
    elapsed: 0,
    spawnTimer: 1.0,
    spawnCount: 0,
    wave: 1,
    kills: 0,
    coinsEarned: 0,
    ticketsEarned: 0,
    player: {
      characterId: capId,
      name: capName,
      role: capRole,
      element: capElem,
      spriteRow: capRow,
      x: 0,
      y: 0,
      radius: 12,
      speed: 210,
      health: 100,
      maxHealth: 100,
      xp: 0,
      level: 1,
      nextXp: 5,
      damageMultiplier: 1,
      cooldownMultiplier: 1,
      pickupRadius: 95,
      attackCooldown: 0.25,
      techniqueCooldown: 0,
      techniques: [startTech],
      activeTechnique: startTech,
      invulnerable: 0,
      moving: false,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    props: getPropsInRegion(-1400, -1000, 1400, 1000),
    propsRefreshTimer: 2.0,
    floatingTexts: [],
    shockwave: 0,
    techniqueEffect: null,
    upgradeChoices: [],
  };
}

function spawnEnemy(state) {
  if (state.enemies.length >= GAME_CONFIG.maxEnemies) return;

  const index = state.spawnCount++;
  const side = index % 4;
  const offset = ((index * 97) % (side % 2 === 0 ? GAME_CONFIG.height : GAME_CONFIG.width)) -
    (side % 2 === 0 ? GAME_CONFIG.height : GAME_CONFIG.width) / 2;
  const spawnMargin = 85;
  const position = [
    { x: state.player.x - GAME_CONFIG.width / 2 - spawnMargin, y: state.player.y + offset },
    { x: state.player.x + GAME_CONFIG.width / 2 + spawnMargin, y: state.player.y + offset },
    { x: state.player.x + offset, y: state.player.y - GAME_CONFIG.height / 2 - spawnMargin },
    { x: state.player.x + offset, y: state.player.y + GAME_CONFIG.height / 2 + spawnMargin },
  ][side];

  const isBoss = index > 0 && index % 28 === 0;
  const type = isBoss ? 'boss' : index % 3 === 2 ? 'shooter' : 'runner';

  let character;
  if (isBoss) {
    character = { id: 28, name: 'Capitán Rival (Boss)', row: 15, scale: 2.4, hp: 320, speed: 52 };
  } else if (type === 'shooter') {
    character = { id: 10, name: 'Axel Blaze', row: 2, scale: 1, hp: 28, speed: 46 };
  } else {
    character = { id: 3, name: 'Jack Wallside', row: 1, scale: 1, hp: 36, speed: 72 };
  }

  const waveScale = 1 + Math.floor((state.wave - 1) / 4) * 0.15;

  state.enemies.push({
    ...position,
    type: type === 'boss' ? 'runner' : type,
    isBoss,
    characterId: character.id,
    name: character.name,
    spriteRow: character.row,
    radius: isBoss ? 20 : type === 'shooter' ? 13 : 11,
    speed: character.speed,
    health: (character.hp || 30) * waveScale,
    maxHealth: (character.hp || 30) * waveScale,
    attackTimer: type === 'shooter' ? 1.0 : 0,
    hitFlash: 0,
  });
}

function damageEnemy(state, enemy, damage, isCrit = false) {
  enemy.health -= damage;
  enemy.hitFlash = 0.15;

  // Texto flotante de daño
  state.floatingTexts.push({
    x: enemy.x + (Math.random() - 0.5) * 12,
    y: enemy.y - 18,
    text: `${Math.round(damage)}${isCrit ? '!' : ''}`,
    color: isCrit ? '#fce22a' : '#ffffff',
    size: isCrit ? 14 : 10,
    life: 0.55,
  });

  if (enemy.health > 0) return;

  state.kills += 1;
  const xpCount = enemy.isBoss ? 8 : 1;
  for (let k = 0; k < xpCount; k++) {
    state.pickups.push({
      x: enemy.x + (k > 0 ? (Math.random() - 0.5) * 24 : 0),
      y: enemy.y + (k > 0 ? (Math.random() - 0.5) * 24 : 0),
      radius: 7,
      value: enemy.isBoss ? 3 : 1,
      age: 0,
    });
  }

  // Monedas y tickets
  const coinGain = enemy.isBoss ? 45 : Math.random() < 0.35 ? 5 : 0;
  if (coinGain > 0) state.coinsEarned += coinGain;

  if (enemy.isBoss || Math.random() < 0.04) {
    state.ticketsEarned += 1;
    state.floatingTexts.push({
      x: enemy.x,
      y: enemy.y - 32,
      text: '¡+1 TICKET! 🎫',
      color: '#ffd23f',
      size: 13,
      life: 0.9,
    });
  }

  state.enemies.splice(state.enemies.indexOf(enemy), 1);
}

function checkLevelUp(state) {
  const { player } = state;
  if (player.xp < player.nextXp) return;

  player.xp -= player.nextXp;
  player.level += 1;
  player.nextXp = 5 + player.level * 4;
  state.phase = 'levelup';

  const owned = new Set(player.techniques);
  const nextTechnique = TECHNIQUES.find((technique) => !owned.has(technique.id));

  // Ofrecer técnicas nuevas y mejoras
  const availableUpgrades = [...UPGRADES];
  state.upgradeChoices = nextTechnique
    ? [availableUpgrades[(player.level - 2) % availableUpgrades.length], nextTechnique, availableUpgrades[(player.level - 1) % availableUpgrades.length]]
    : availableUpgrades.slice(0, 3);
}

function distanceToSegment(pointX, pointY, startX, startY, endX, endY) {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / lengthSquared));
  return Math.hypot(pointX - startX - projection * deltaX, pointY - startY - projection * deltaY);
}

export function applyUpgrade(state, upgradeId) {
  if (state.phase !== 'levelup') return state;

  const { player } = state;
  const technique = TECHNIQUES.find((entry) => entry.id === upgradeId);
  if (technique && !player.techniques.includes(technique.id)) {
    player.techniques.push(technique.id);
    player.activeTechnique = technique.id;
  } else if (upgradeId === 'power') {
    player.damageMultiplier *= 1.25;
  } else if (upgradeId === 'pace') {
    player.speed *= 1.2;
  } else if (upgradeId === 'vitality') {
    player.maxHealth += 20;
    player.health = Math.min(player.maxHealth, player.health + 35);
  } else if (upgradeId === 'haste') {
    player.cooldownMultiplier *= 0.82;
  } else if (upgradeId === 'magnet') {
    player.pickupRadius *= 1.5;
  } else {
    return state;
  }

  state.upgradeChoices = [];
  state.phase = 'running';
  checkLevelUp(state);
  return state;
}

export function updateGame(state, input = {}, delta = 0) {
  if (state.phase !== 'running' || delta <= 0) return state;

  const dt = Math.min(delta, 0.05);
  const { player } = state;
  state.elapsed += dt;

  // Comprobar victoria por tiempo de partido
  if (state.elapsed >= (GAME_CONFIG.runDuration || 90)) {
    state.phase = 'victory';
    return state;
  }

  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.techniqueCooldown = Math.max(0, player.techniqueCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  state.shockwave = Math.max(0, state.shockwave - dt);

  if (state.techniqueEffect) {
    state.techniqueEffect.age += dt;
    if (state.techniqueEffect.age >= state.techniqueEffect.duration) state.techniqueEffect = null;
  }

  // Actualizar textos flotantes
  for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
    const ft = state.floatingTexts[i];
    ft.life -= dt;
    ft.y -= 24 * dt;
    if (ft.life <= 0) state.floatingTexts.splice(i, 1);
  }

  // Movimiento del jugador (¡infinito sin límites de caja!)
  const moveX = Number(input.moveX) || 0;
  const moveY = Number(input.moveY) || 0;
  player.moving = moveX !== 0 || moveY !== 0;
  const magnitude = Math.hypot(moveX, moveY) || 1;
  player.x += (moveX / magnitude) * player.speed * dt;
  player.y += (moveY / magnitude) * player.speed * dt;

  // Activar supertécnica
  if (input.techniquePressed && player.techniqueCooldown === 0) {
    const technique = TECHNIQUES.find((entry) => entry.id === player.activeTechnique) || TECHNIQUES[0];
    const actualCd = technique.cooldown * (player.cooldownMultiplier || 1);
    player.techniqueCooldown = actualCd;
    state.shockwave = 0.45;
    state.techniqueEffect = {
      id: technique.id,
      effect: technique.effect,
      age: 0,
      duration: technique.effect === 'firebird' ? 0.9 : 0.65,
      radius: technique.range,
    };

    for (const enemy of [...state.enemies]) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) <= technique.range) {
        damageEnemy(state, enemy, technique.damage * player.damageMultiplier, true);
      }
    }
  }

  // Disparo automático (tiro básico con balón)
  if (player.attackCooldown === 0) {
    let target = null;
    let targetDistance = 420;
    for (const enemy of state.enemies) {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < targetDistance) {
        target = enemy;
        targetDistance = distance;
      }
    }
    if (target) {
      const distance = Math.max(targetDistance, 1);
      state.projectiles.push({
        x: player.x,
        y: player.y - 7,
        vx: ((target.x - player.x) / distance) * 480,
        vy: ((target.y - player.y) / distance) * 480,
        radius: 6,
        damage: 18 * player.damageMultiplier,
        owner: 'player',
        life: 1.3,
      });
      player.attackCooldown = 0.58;
    }
  }

  // Generador de enemigos
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnEnemy(state);
    state.spawnTimer = Math.max(0.32, 2.0 - state.elapsed / 65);
    if (state.spawnCount % 12 === 0) state.wave += 1;
  }

  // Movimiento y combate de enemigos
  for (const enemy of [...state.enemies]) {
    // Si se alejan demasiado de la cámara infinita, recolocar o eliminar
    if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > 950) {
      state.enemies.splice(state.enemies.indexOf(enemy), 1);
      continue;
    }

    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (enemy.type === 'runner' || distance > 220) {
      enemy.x += (dx / distance) * enemy.speed * dt;
      enemy.y += (dy / distance) * enemy.speed * dt;
    }

    if (enemy.type === 'shooter') {
      enemy.attackTimer -= dt;
      if (distance <= 310 && enemy.attackTimer <= 0) {
        state.projectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: (dx / distance) * 190,
          vy: (dy / distance) * 190,
          radius: 6,
          damage: 10,
          owner: 'enemy',
          life: 2.2,
        });
        enemy.attackTimer = 2.1;
      }
    }

    // Colisión de contacto con el jugador
    if (distance < player.radius + enemy.radius && player.invulnerable === 0) {
      player.health = Math.max(0, player.health - (enemy.isBoss ? 18 : 9));
      player.invulnerable = 0.75;
      enemy.x -= (dx / distance) * 20;
      enemy.y -= (dy / distance) * 20;

      state.floatingTexts.push({
        x: player.x,
        y: player.y - 20,
        text: `-${enemy.isBoss ? 18 : 9}`,
        color: '#ff4d4d',
        size: 12,
        life: 0.5,
      });
    }
  }

  // Proyectiles
  for (const projectile of [...state.projectiles]) {
    const previousX = projectile.x;
    const previousY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    let hit = false;

    if (projectile.owner === 'player') {
      const target = state.enemies.find((enemy) =>
        distanceToSegment(enemy.x, enemy.y, previousX, previousY, projectile.x, projectile.y) < enemy.radius + projectile.radius
      );
      if (target) {
        damageEnemy(state, target, projectile.damage);
        hit = true;
      }

      // También puede golpear props (como balones para chutarlos o dianas)
      for (const prop of state.props) {
        if (Math.hypot(prop.x - projectile.x, prop.y - projectile.y) < prop.radius + projectile.radius) {
          if (prop.type === 'ball') {
            prop.vx = projectile.vx * 1.2;
            prop.vy = projectile.vy * 1.2;
            prop.rolling = true;
            hit = true;
          } else if (prop.type === 'dummy') {
            prop.health -= projectile.damage;
            hit = true;
          }
        }
      }
    } else if (
      distanceToSegment(player.x, player.y, previousX, previousY, projectile.x, projectile.y) < player.radius + projectile.radius &&
      player.invulnerable === 0
    ) {
      player.health = Math.max(0, player.health - projectile.damage);
      player.invulnerable = 0.72;
      hit = true;
    }

    if (hit || projectile.life <= 0 || Math.hypot(projectile.x - player.x, projectile.y - player.y) > 1100) {
      state.projectiles.splice(state.projectiles.indexOf(projectile), 1);
    }
  }

  // Actualizar y gestionar props interactivos (balones chutables, muñecos, bebidas)
  state.propsRefreshTimer -= dt;
  if (state.propsRefreshTimer <= 0) {
    state.propsRefreshTimer = 3.0;
    // Cargar props alrededor de la posición actual del jugador
    const nearbyProps = getPropsInRegion(player.x - 1200, player.y - 900, player.x + 1200, player.y + 900);
    const existingIds = new Set(state.props.map(p => p.id));
    for (const p of nearbyProps) {
      if (!existingIds.has(p.id)) state.props.push(p);
    }
    // Eliminar props que quedaron extremadamente lejos
    state.props = state.props.filter(p => Math.hypot(p.x - player.x, p.y - player.y) < 2200);
  }

  for (let i = state.props.length - 1; i >= 0; i--) {
    const prop = state.props[i];

    if (prop.type === 'ball') {
      // Si el jugador chuta el balón corriendo hacia él
      const distToPlayer = Math.hypot(prop.x - player.x, prop.y - player.y);
      if (distToPlayer < player.radius + prop.radius + 4 && player.moving) {
        const kx = (player.moving ? input.moveX : 1) || 1;
        const ky = (player.moving ? input.moveY : 0) || 0;
        const kmag = Math.hypot(kx, ky) || 1;
        prop.vx = (kx / kmag) * 580;
        prop.vy = (ky / kmag) * 580;
        prop.rolling = true;
      }

      // Física de rodar el balón
      if (prop.rolling) {
        prop.x += prop.vx * dt;
        prop.y += prop.vy * dt;
        prop.vx *= Math.pow(0.2, dt);
        prop.vy *= Math.pow(0.2, dt);
        if (Math.hypot(prop.vx, prop.vy) < 20) prop.rolling = false;

        // Si el balón golpea enemigos
        for (const enemy of state.enemies) {
          if (Math.hypot(enemy.x - prop.x, enemy.y - prop.y) < enemy.radius + prop.radius) {
            damageEnemy(state, enemy, 42 * player.damageMultiplier, true);
            prop.vx *= -0.5;
            prop.vy *= -0.5;
            state.floatingTexts.push({
              x: prop.x,
              y: prop.y - 12,
              text: '¡CHUT! ⚽',
              color: '#fce22a',
              size: 13,
              life: 0.6,
            });
            break;
          }
        }
      }
    } else if (prop.type === 'drink') {
      // Recoger bebida isotónica
      if (Math.hypot(prop.x - player.x, prop.y - player.y) < player.radius + prop.radius + 6) {
        player.health = Math.min(player.maxHealth, player.health + prop.heal);
        state.floatingTexts.push({
          x: player.x,
          y: player.y - 24,
          text: `+${prop.heal} ENERGÍA 🥤`,
          color: '#4ade80',
          size: 13,
          life: 0.8,
        });
        state.props.splice(i, 1);
      }
    } else if (prop.type === 'dummy') {
      // Destruir muñeco de entrenamiento
      if (prop.health <= 0) {
        state.pickups.push({ x: prop.x, y: prop.y, radius: 7, value: 4, age: 0 });
        state.floatingTexts.push({
          x: prop.x,
          y: prop.y - 20,
          text: '¡DIANA DESTROZADA! ⭐',
          color: '#ffd23f',
          size: 12,
          life: 0.8,
        });
        state.props.splice(i, 1);
      }
    }
  }

  // Recogida de orbes de experiencia (con radio de imán)
  const magnetRadius = player.pickupRadius || 95;
  for (const pickup of [...state.pickups]) {
    if (Math.hypot(pickup.x - player.x, pickup.y - player.y) > 950) {
      state.pickups.splice(state.pickups.indexOf(pickup), 1);
      continue;
    }

    pickup.age += dt;
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (distance < magnetRadius) {
      pickup.x += (dx / distance) * 290 * dt;
      pickup.y += (dy / distance) * 290 * dt;
    }

    if (distance < player.radius + pickup.radius + 5) {
      player.xp += pickup.value;
      state.pickups.splice(state.pickups.indexOf(pickup), 1);
      checkLevelUp(state);
    }
  }

  if (player.health <= 0) {
    state.phase = 'defeat';
  }

  return state;
}
