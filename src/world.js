/* ============ world.js — Campo de fútbol infinito y elementos interactivos ============
 * Generación procedural y determinista por coordenadas del mundo.
 * El campo no tiene límites: el jugador puede correr infinitamente en cualquier dirección.
 * Incluye césped con franjas cortadas, marcas reglamentarias de fútbol (líneas de cal,
 * círculos centrales, áreas de penalti, córners, porterías) y elementos interactivos:
 *   - Balones de fútbol: ¡se pueden chutar contra los enemigos!
 *   - Muñecos de entrenamiento: dianas rompibles que sueltan experiencia y tickets.
 *   - Botellines / Cajas de bebidas isotónicas: curan energía y dan velocidad.
 *   - Conos de entrenamiento: obstáculos rompibles que rebotan.
 */

export const FIELD_CONFIG = Object.freeze({
  pitchWidth: 1200,      // Ancho de cada campo de fútbol
  pitchHeight: 760,      // Alto de cada campo de fútbol
  marginTrackX: 200,     // Pista / pasillo entre campos horizontal
  marginTrackY: 180,     // Pista / pasillo entre campos vertical
  stripeWidth: 80,       // Ancho de las franjas de corte de césped
});

export const WORLD_SPACING_X = FIELD_CONFIG.pitchWidth + FIELD_CONFIG.marginTrackX;  // 1400
export const WORLD_SPACING_Y = FIELD_CONFIG.pitchHeight + FIELD_CONFIG.marginTrackY; // 940

/** Pseudo-random determinista con semilla */
function hash(x, y, seed = 1337) {
  let h = (x * 374761393 + y * 668265263 + seed * 3628273) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Obtiene o genera los props interactivos alrededor del jugador en una zona de chunks.
 */
export function getPropsInRegion(minX, minY, maxX, maxY) {
  const props = [];
  const minChunkX = Math.floor(minX / WORLD_SPACING_X) - 1;
  const maxChunkX = Math.floor(maxX / WORLD_SPACING_X) + 1;
  const minChunkY = Math.floor(minY / WORLD_SPACING_Y) - 1;
  const maxChunkY = Math.floor(maxY / WORLD_SPACING_Y) + 1;

  for (let cy = minChunkY; cy <= maxChunkY; cy++) {
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      const fieldCenterX = cx * WORLD_SPACING_X;
      const fieldCenterY = cy * WORLD_SPACING_Y;

      // Generar balón en el centro de cada campo
      const ballSeed = hash(cx, cy, 101);
      props.push({
        id: `ball_${cx}_${cy}`,
        type: 'ball',
        x: fieldCenterX + (ballSeed - 0.5) * 80,
        y: fieldCenterY + hash(cx, cy, 102 - 0.5) * 60,
        radius: 12,
        vx: 0,
        vy: 0,
        rolling: false,
        health: 1,
      });

      // Muñeco de entrenamiento (portería o área de práctica)
      if (hash(cx, cy, 201) > 0.35) {
        props.push({
          id: `dummy_${cx}_${cy}`,
          type: 'dummy',
          x: fieldCenterX + (hash(cx, cy, 202) > 0.5 ? 420 : -420),
          y: fieldCenterY + (hash(cx, cy, 203) - 0.5) * 160,
          radius: 18,
          health: 45,
          maxHealth: 45,
        });
      }

      // Bebida isotónica / Botiquín
      if (hash(cx, cy, 301) > 0.5) {
        props.push({
          id: `drink_${cx}_${cy}`,
          type: 'drink',
          x: fieldCenterX + (hash(cx, cy, 302) - 0.5) * 480,
          y: fieldCenterY + (hash(cx, cy, 303) - 0.5) * 320,
          radius: 12,
          heal: 25,
        });
      }

      // Conos de entrenamiento
      const coneCount = Math.floor(hash(cx, cy, 401) * 3) + 1;
      for (let k = 0; k < coneCount; k++) {
        props.push({
          id: `cone_${cx}_${cy}_${k}`,
          type: 'cone',
          x: fieldCenterX + (hash(cx * 7 + k, cy, 402) - 0.5) * 560,
          y: fieldCenterY + (hash(cx, cy * 7 + k, 403) - 0.5) * 380,
          radius: 10,
          vx: 0,
          vy: 0,
        });
      }
    }
  }

  return props;
}

/**
 * Renderiza el campo de fútbol infinito (césped, líneas, pistas y detalles)
 */
export function drawInfinitePitch(context, cameraX, cameraY, viewportW, viewportH) {
  const halfW = FIELD_CONFIG.pitchWidth / 2;
  const halfH = FIELD_CONFIG.pitchHeight / 2;
  const stripeW = FIELD_CONFIG.stripeWidth;

  const left = cameraX;
  const top = cameraY;
  const right = cameraX + viewportW;
  const bottom = cameraY + viewportH;

  // Fondo general: pista de atletismo exterior / césped base
  context.fillStyle = '#102b1e';
  context.fillRect(left, top, viewportW, viewportH);

  const startFieldX = Math.floor((left - halfW) / WORLD_SPACING_X) - 1;
  const endFieldX = Math.ceil((right + halfW) / WORLD_SPACING_X) + 1;
  const startFieldY = Math.floor((top - halfH) / WORLD_SPACING_Y) - 1;
  const endFieldY = Math.ceil((bottom + halfH) / WORLD_SPACING_Y) + 1;

  for (let fy = startFieldY; fy <= endFieldY; fy++) {
    for (let fx = startFieldX; fx <= endFieldX; fx++) {
      const centerX = fx * WORLD_SPACING_X;
      const centerY = fy * WORLD_SPACING_Y;
      const pitchLeft = centerX - halfW;
      const pitchTop = centerY - halfH;

      // Comprobar si este campo es visible en la cámara
      if (pitchLeft + FIELD_CONFIG.pitchWidth < left - 60 ||
          pitchLeft > right + 60 ||
          pitchTop + FIELD_CONFIG.pitchHeight < top - 60 ||
          pitchTop > bottom + 60) {
        continue;
      }

      // 1. Pista de atletismo / contorno exterior del campo
      context.fillStyle = '#6e2b20';
      context.fillRect(pitchLeft - 32, pitchTop - 32, FIELD_CONFIG.pitchWidth + 64, FIELD_CONFIG.pitchHeight + 64);

      // Líneas de calle de atletismo
      context.strokeStyle = 'rgba(255, 230, 200, 0.25)';
      context.lineWidth = 1.5;
      context.strokeRect(pitchLeft - 18, pitchTop - 18, FIELD_CONFIG.pitchWidth + 36, FIELD_CONFIG.pitchHeight + 36);

      // 2. Base del campo de césped
      context.fillStyle = '#1c5236';
      context.fillRect(pitchLeft, pitchTop, FIELD_CONFIG.pitchWidth, FIELD_CONFIG.pitchHeight);

      // Franjas de corte de césped verticales
      const stripeCount = Math.floor(FIELD_CONFIG.pitchWidth / stripeW);
      for (let s = 0; s < stripeCount; s++) {
        if (s % 2 === 0) {
          context.fillStyle = '#246342';
          context.fillRect(pitchLeft + s * stripeW, pitchTop, stripeW, FIELD_CONFIG.pitchHeight);
        }
      }

      // Textura sutil de briznas de césped (determinista)
      context.fillStyle = 'rgba(164, 222, 140, 0.12)';
      for (let i = 0; i < 18; i++) {
        const tuftX = pitchLeft + ((hash(fx * 13 + i, fy, 501) * FIELD_CONFIG.pitchWidth) | 0);
        const tuftY = pitchTop + ((hash(fx, fy * 13 + i, 502) * FIELD_CONFIG.pitchHeight) | 0);
        context.fillRect(tuftX, tuftY, 3, 2);
      }

      // 3. Líneas de cal reglamentarias de fútbol
      context.strokeStyle = 'rgba(245, 255, 240, 0.85)';
      context.lineWidth = 3;

      // Línea perimetral
      context.strokeRect(pitchLeft, pitchTop, FIELD_CONFIG.pitchWidth, FIELD_CONFIG.pitchHeight);

      // Línea de medio campo
      context.beginPath();
      context.moveTo(centerX, pitchTop);
      context.lineTo(centerX, pitchTop + FIELD_CONFIG.pitchHeight);
      context.stroke();

      // Círculo central (radio 80)
      context.beginPath();
      context.arc(centerX, centerY, 80, 0, Math.PI * 2);
      context.stroke();

      // Punto central
      context.fillStyle = 'rgba(245, 255, 240, 0.9)';
      context.beginPath();
      context.arc(centerX, centerY, 4.5, 0, Math.PI * 2);
      context.fill();

      // --- Área izquierda (Portería Izquierda) ---
      // Área grande (longitud 200, alto 340)
      context.strokeRect(pitchLeft, centerY - 170, 200, 340);
      // Área pequeña (longitud 80, alto 160)
      context.strokeRect(pitchLeft, centerY - 80, 80, 160);
      // Punto de penalti
      context.beginPath();
      context.arc(pitchLeft + 140, centerY, 4, 0, Math.PI * 2);
      context.fill();
      // Arco del área
      context.beginPath();
      context.arc(pitchLeft + 140, centerY, 60, -0.9, 0.9);
      context.stroke();

      // Red de portería izquierda (representación visual)
      context.fillStyle = 'rgba(255, 255, 255, 0.15)';
      context.fillRect(pitchLeft - 38, centerY - 65, 38, 130);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(pitchLeft - 38, centerY - 65, 38, 130);
      context.strokeStyle = 'rgba(245, 255, 240, 0.85)';
      context.lineWidth = 3;

      // --- Área derecha (Portería Derecha) ---
      // Área grande
      context.strokeRect(pitchLeft + FIELD_CONFIG.pitchWidth - 200, centerY - 170, 200, 340);
      // Área pequeña
      context.strokeRect(pitchLeft + FIELD_CONFIG.pitchWidth - 80, centerY - 80, 80, 160);
      // Punto de penalti
      context.beginPath();
      context.arc(pitchLeft + FIELD_CONFIG.pitchWidth - 140, centerY, 4, 0, Math.PI * 2);
      context.fill();
      // Arco del área
      context.beginPath();
      context.arc(pitchLeft + FIELD_CONFIG.pitchWidth - 140, centerY, 60, Math.PI - 0.9, Math.PI + 0.9);
      context.stroke();

      // Red de portería derecha
      context.fillStyle = 'rgba(255, 255, 255, 0.15)';
      context.fillRect(pitchLeft + FIELD_CONFIG.pitchWidth, centerY - 65, 38, 130);
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(pitchLeft + FIELD_CONFIG.pitchWidth, centerY - 65, 38, 130);
      context.strokeStyle = 'rgba(245, 255, 240, 0.85)';
      context.lineWidth = 3;

      // Córners (arcos en las 4 esquinas)
      const cornerR = 20;
      context.beginPath(); context.arc(pitchLeft, pitchTop, cornerR, 0, Math.PI / 2); context.stroke();
      context.beginPath(); context.arc(pitchLeft + FIELD_CONFIG.pitchWidth, pitchTop, cornerR, Math.PI / 2, Math.PI); context.stroke();
      context.beginPath(); context.arc(pitchLeft, pitchTop + FIELD_CONFIG.pitchHeight, cornerR, -Math.PI / 2, 0); context.stroke();
      context.beginPath(); context.arc(pitchLeft + FIELD_CONFIG.pitchWidth, pitchTop + FIELD_CONFIG.pitchHeight, cornerR, Math.PI, -Math.PI / 2); context.stroke();

      // Banderines de córner
      drawCornerFlag(context, pitchLeft, pitchTop);
      drawCornerFlag(context, pitchLeft + FIELD_CONFIG.pitchWidth, pitchTop);
      drawCornerFlag(context, pitchLeft, pitchTop + FIELD_CONFIG.pitchHeight);
      drawCornerFlag(context, pitchLeft + FIELD_CONFIG.pitchWidth, pitchTop + FIELD_CONFIG.pitchHeight);

      // Torre de iluminación / foco exterior del estadio (en las 4 esquinas exteriores)
      drawFloodlight(context, pitchLeft - 60, pitchTop - 50);
      drawFloodlight(context, pitchLeft + FIELD_CONFIG.pitchWidth + 60, pitchTop - 50);
    }
  }
}

function drawCornerFlag(context, x, y) {
  context.fillStyle = '#fce22a';
  context.beginPath();
  context.arc(x, y, 3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#e63946';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 5, y - 6);
  context.lineTo(x, y - 10);
  context.stroke();
}

function drawFloodlight(context, x, y) {
  context.fillStyle = 'rgba(10, 20, 16, 0.7)';
  context.fillRect(x - 5, y - 5, 10, 10);
  context.fillStyle = 'rgba(255, 255, 200, 0.2)';
  context.beginPath();
  context.arc(x, y, 16, 0, Math.PI * 2);
  context.fill();
}
