import { GAME_CONFIG } from './simulation.js';
import { drawInfinitePitch } from './world.js';

function drawShadow(context, x, y, width = 24) {
  context.fillStyle = 'rgba(6, 18, 12, 0.42)';
  context.beginPath();
  context.ellipse(x, y + 8, width * 0.52, 6, 0, 0, Math.PI * 2);
  context.fill();
}

function drawBall(context, prop, timestamp) {
  drawShadow(context, prop.x, prop.y, 18);
  const rot = prop.rolling ? (timestamp / 50) : 0;

  context.save();
  context.translate(prop.x, prop.y);
  context.rotate(rot);

  // Balón de fútbol blanco y negro
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(0, 0, prop.radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#1b2d20';
  context.lineWidth = 1.5;
  context.stroke();

  // Pentágono central
  context.fillStyle = '#1e293b';
  context.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const px = Math.cos(angle) * (prop.radius * 0.42);
    const py = Math.sin(angle) * (prop.radius * 0.42);
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();

  // Brillo
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.fillRect(-prop.radius * 0.4, -prop.radius * 0.4, 2, 2);

  context.restore();
}

function drawDummy(context, prop) {
  drawShadow(context, prop.x, prop.y, 28);

  // Base y poste
  context.fillStyle = '#475569';
  context.fillRect(prop.x - 3, prop.y - 30, 6, 30);

  // Silueta de muñeco / diana
  context.fillStyle = '#dc2626';
  context.beginPath();
  context.arc(prop.x, prop.y - 28, 14, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(prop.x, prop.y - 28, 9, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#dc2626';
  context.beginPath();
  context.arc(prop.x, prop.y - 28, 4, 0, Math.PI * 2);
  context.fill();

  // Barra de salud del muñeco
  if (prop.health < prop.maxHealth) {
    const bw = 28;
    const by = prop.y - 48;
    context.fillStyle = 'rgba(0,0,0,0.6)';
    context.fillRect(prop.x - bw / 2, by, bw, 3);
    context.fillStyle = '#fce22a';
    context.fillRect(prop.x - bw / 2, by, bw * Math.max(0, prop.health / prop.maxHealth), 3);
  }
}

function drawDrink(context, prop, timestamp) {
  drawShadow(context, prop.x, prop.y, 14);
  const bob = Math.sin(timestamp / 120 + prop.x) * 2;

  // Botella energética
  context.fillStyle = '#38bdf8';
  context.fillRect(prop.x - 5, prop.y - 18 + bob, 10, 16);
  context.fillStyle = '#fce22a';
  context.fillRect(prop.x - 3, prop.y - 22 + bob, 6, 4);

  // Brillo
  context.fillStyle = 'rgba(255, 255, 255, 0.8)';
  context.fillRect(prop.x - 3, prop.y - 15 + bob, 2, 8);
}

function drawCone(context, prop) {
  drawShadow(context, prop.x, prop.y, 16);
  // Cono de entrenamiento naranja
  context.fillStyle = '#ea580c';
  context.beginPath();
  context.moveTo(prop.x, prop.y - 16);
  context.lineTo(prop.x + 8, prop.y + 2);
  context.lineTo(prop.x - 8, prop.y + 2);
  context.closePath();
  context.fill();

  // Franja blanca
  context.fillStyle = '#ffffff';
  context.fillRect(prop.x - 5, prop.y - 7, 10, 3);
}

function drawActor(context, sprites, actor, kind, timestamp, scale = 2.5) {
  const sprite = sprites[kind] || sprites.player;
  const spriteWidth = sprite.frameWidth || sprite.width || 48;
  const spriteHeight = sprite.frameHeight || sprite.height || 48;
  const isBoss = !!actor.isBoss;
  const actorScale = isBoss ? 2.6 : sprite.image ? 1.85 : scale;

  drawShadow(context, actor.x, actor.y, spriteWidth * actorScale * (isBoss ? 1.2 : 0.85));

  // Aura de jefe
  if (isBoss) {
    const pulse = 1 + Math.sin(timestamp / 90) * 0.15;
    context.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(actor.x, actor.y, 22 * pulse, 0, Math.PI * 2);
    context.stroke();
  }

  const bob = kind === 'player' ? Math.sin(timestamp / 100) * 1.5 : 0;
  context.imageSmoothingEnabled = false;

  const destinationX = actor.x - (spriteWidth * actorScale) / 2;
  const destinationY = actor.y - spriteHeight * actorScale + 6 + bob;

  if (sprite.image) {
    const animation = actor.animation || (actor.moving ? 'run' : 'idle');
    const frames = sprite.animations?.[animation] || sprite.animations?.idle || [0];
    const frameSpeed = animation === 'run' ? 95 : 135;
    const frame = frames[Math.floor(timestamp / frameSpeed) % frames.length];
    const sourceY = (actor.spriteRow ?? sprite.row ?? 0) * sprite.frameHeight;

    context.drawImage(
      sprite.image,
      frame * sprite.frameWidth,
      sourceY,
      sprite.frameWidth,
      sprite.frameHeight,
      destinationX,
      destinationY,
      spriteWidth * actorScale,
      spriteHeight * actorScale
    );
  } else {
    context.drawImage(sprite, destinationX, destinationY, spriteWidth * actorScale, spriteHeight * actorScale);
  }

  // Barra de salud sobre los personajes dañados
  if (actor.health < actor.maxHealth) {
    const width = isBoss ? 48 : kind === 'player' ? 36 : 24;
    const y = actor.y - spriteHeight * actorScale - 5;
    context.fillStyle = 'rgba(6, 14, 10, 0.8)';
    context.fillRect(actor.x - width / 2, y, width, 4);

    context.fillStyle = isBoss ? '#ef4444' : kind === 'player' ? '#d7ed62' : '#ff7757';
    context.fillRect(actor.x - width / 2, y, width * Math.max(0, actor.health / actor.maxHealth), 4);
  }
}

export function renderGame(context, state, sprites, timestamp = 0) {
  context.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

  const cameraX = state.player.x - GAME_CONFIG.width / 2;
  const cameraY = state.player.y - GAME_CONFIG.height / 2;

  context.save();
  // Aplicar sacudida de pantalla si hay shockwave
  const shakeAmt = state.shockwave > 0 ? (state.shockwave / 0.45) * 6 : 0;
  const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
  const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;

  context.translate(-cameraX + sx, -cameraY + sy);

  // 1. Dibujar el campo de fútbol infinito
  drawInfinitePitch(context, cameraX, cameraY, GAME_CONFIG.width, GAME_CONFIG.height);

  // 2. Props del mundo (balones, muñecos, bebidas, conos)
  if (state.props) {
    for (const prop of state.props) {
      if (prop.type === 'ball') drawBall(context, prop, timestamp);
      else if (prop.type === 'dummy') drawDummy(context, prop);
      else if (prop.type === 'drink') drawDrink(context, prop, timestamp);
      else if (prop.type === 'cone') drawCone(context, prop);
    }
  }

  // 3. Orbes de experiencia / pickups
  for (const pickup of state.pickups) {
    const pulse = 1 + Math.sin(timestamp / 80 + pickup.age * 4) * 0.16;
    context.save();
    context.translate(pickup.x, pickup.y);
    context.rotate(Math.PI / 4 + timestamp / 600);

    // Orbe de energía futbolística
    context.fillStyle = '#fce22a';
    context.fillRect(-5 * pulse, -5 * pulse, 10 * pulse, 10 * pulse);
    context.fillStyle = '#ffffff';
    context.fillRect(-2, -2, 4, 4);
    context.restore();
  }

  // 4. Proyectiles
  for (const projectile of state.projectiles) {
    context.save();
    if (projectile.owner === 'player') {
      // Disparo de fútbol con estela
      context.fillStyle = '#fde047';
      context.beginPath();
      context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      context.beginPath();
      context.arc(projectile.x, projectile.y, projectile.radius * 0.5, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillStyle = '#ff6b4a';
      context.beginPath();
      context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  // 5. Entidades (Jugador y enemigos, ordenados por Y para oclusión correcta)
  state.player.animation = state.techniqueEffect
    ? 'technique'
    : state.player.invulnerable > 0
    ? 'hurt'
    : state.player.moving
    ? 'run'
    : 'idle';

  const actors = state.enemies.map((enemy) => {
    enemy.animation = enemy.hitFlash > 0 ? 'hurt' : enemy.type === 'runner' ? 'run' : 'idle';
    return { actor: enemy, kind: enemy.type === 'runner' ? 'runner' : 'shooter' };
  });
  actors.push({ actor: state.player, kind: 'player' });
  actors.sort((left, right) => left.actor.y - right.actor.y);

  for (const { actor, kind } of actors) {
    if (actor.hitFlash > 0) context.filter = 'brightness(2.2)';
    if (kind === 'player' && actor.invulnerable > 0 && Math.floor(timestamp / 70) % 2 === 0) {
      context.globalAlpha = 0.35;
    }
    drawActor(context, sprites, actor, kind, timestamp);
    context.filter = 'none';
    context.globalAlpha = 1;
  }

  // 6. Efectos visuales de supertécnicas
  if (state.techniqueEffect) {
    drawTechniqueEffect(context, state, timestamp);
  }

  // 7. Onda expansiva genérica
  if (state.shockwave > 0) {
    const progress = 1 - state.shockwave / 0.45;
    context.strokeStyle = `rgba(252, 226, 42, ${Math.max(0, 0.85 - progress)})`;
    context.lineWidth = 6 - progress * 4;
    context.beginPath();
    context.arc(state.player.x, state.player.y, 28 + progress * 155, 0, Math.PI * 2);
    context.stroke();
  }

  // 8. Textos flotantes de combate
  if (state.floatingTexts) {
    for (const ft of state.floatingTexts) {
      context.font = `900 ${ft.size || 11}px "InaPixel", "Pixelify", monospace`;
      context.fillStyle = ft.color || '#ffffff';
      context.textAlign = 'center';
      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.fillText(ft.text, ft.x, ft.y);
      context.shadowBlur = 0;
    }
  }

  context.restore();

  // 9. Radar de proximidad: indicadores en los bordes de la pantalla hacia jefes o aglomeraciones
  drawEdgeRadar(context, state, cameraX, cameraY);
}

function drawTechniqueEffect(context, state, timestamp) {
  const effect = state.techniqueEffect;
  const progress = Math.min(1, effect.age / effect.duration);
  const x = state.player.x;
  const y = state.player.y - 14;

  context.save();
  context.globalCompositeOperation = 'lighter';

  if (effect.effect === 'firetornado') {
    // Tornado de fuego: vórtice de llamas ascendente
    const flameCount = 12;
    for (let i = 0; i < flameCount; i++) {
      const angle = (i * Math.PI * 2) / flameCount + progress * 12;
      const r = 24 + progress * 70;
      const fx = x + Math.cos(angle) * r;
      const fy = y + Math.sin(angle) * r * 0.6 - progress * 30;

      context.fillStyle = `rgba(255, 110, 30, ${1 - progress * 0.7})`;
      context.beginPath();
      context.arc(fx, fy, 14 - progress * 8, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(255, 235, 60, ${1 - progress})`;
      context.beginPath();
      context.arc(fx, fy, 7 - progress * 4, 0, Math.PI * 2);
      context.fill();
    }
  } else if (effect.effect === 'godhand') {
    // Mano celestial: mano gigante dorada con haz de luz
    context.fillStyle = `rgba(255, 215, 0, ${0.85 - progress * 0.5})`;
    context.beginPath();
    context.arc(x, y - 45, 48 * (1 + progress * 0.3), 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
    context.lineWidth = 8 - progress * 5;
    context.beginPath();
    context.arc(x, y - 45, 64 * (1 + progress * 0.4), 0, Math.PI * 2);
    context.stroke();
  } else if (effect.effect === 'firebird') {
    // Pájaro de fuego: 3 estelas fénix
    for (let index = 0; index < 3; index += 1) {
      const angle = index * ((Math.PI * 2) / 3) + progress * 6;
      const length = 48 + progress * 130;
      context.strokeStyle = `rgba(255, 222, 90, ${1 - progress * 0.65})`;
      context.lineWidth = 14 - progress * 8;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
  } else if (effect.effect === 'wall') {
    // El muro: bloques de roca y polvo
    const radius = 32 + progress * 65;
    context.strokeStyle = `rgba(180, 140, 90, ${1 - progress * 0.7})`;
    context.lineWidth = 16 - progress * 10;
    context.strokeRect(x - radius, y - radius, radius * 2, radius * 2);
  } else {
    // Chut granada o genérico
    const radius = 22 + progress * 85;
    context.strokeStyle = `rgba(255, 140, 40, ${1 - progress})`;
    context.lineWidth = 10 - progress * 7;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = `rgba(255, 220, 60, ${1 - progress})`;
    context.beginPath();
    context.arc(x, y, 14 + progress * 20, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function drawEdgeRadar(context, state, cameraX, cameraY) {
  const margin = 26;
  const cw = GAME_CONFIG.width;
  const ch = GAME_CONFIG.height;

  // Buscar jefes fuera de pantalla
  for (const enemy of state.enemies) {
    if (!enemy.isBoss) continue;

    const screenX = enemy.x - cameraX;
    const screenY = enemy.y - cameraY;

    if (screenX < 0 || screenX > cw || screenY < 0 || screenY > ch) {
      const angle = Math.atan2(screenY - ch / 2, screenX - cw / 2);
      const edgeX = Math.max(margin, Math.min(cw - margin, cw / 2 + Math.cos(angle) * (cw / 2 - margin)));
      const edgeY = Math.max(margin, Math.min(ch - margin, ch / 2 + Math.sin(angle) * (ch / 2 - margin)));

      context.save();
      context.translate(edgeX, edgeY);
      context.rotate(angle);

      // Flecha indicadora de amenaza
      context.fillStyle = '#ef4444';
      context.beginPath();
      context.moveTo(12, 0);
      context.lineTo(-8, -8);
      context.lineTo(-4, 0);
      context.lineTo(-8, 8);
      context.closePath();
      context.fill();

      context.restore();
    }
  }
}
