/* ============ gacha.js — Sistema de Fichajes y Animación de Sobre 2D ============
 * Inspirado en PokéSurvivor y los juegos oficiales de Inazuma Eleven.
 * Incluye apertura animada de sobre de cartas 2D con rasgado de envoltorio,
 * destello de rareza, cartas con sprites animados, estrellas, técnicas y selector de capitán.
 */

export const RARITIES = Object.freeze({
  1: { name: 'Común', stars: 1, color: '#94a3b8', border: '#cbd5e1', weight: 50 },
  2: { name: 'Infrecuente', stars: 2, color: '#4ade80', border: '#86efac', weight: 30 },
  3: { name: 'Raro', stars: 3, color: '#38bdf8', border: '#7dd3fc', weight: 14 },
  4: { name: 'Épico', stars: 4, color: '#c084fc', border: '#d8b4fe', weight: 5 },
  5: { name: 'Legendario', stars: 5, color: '#facc15', border: '#fef08a', weight: 1 },
});

export const BANNERS = [
  {
    id: 'raimon',
    name: 'Instituto Raimon Clásico',
    subtitle: 'El legendario equipo de Mark Evans y Axel Blaze',
    badge: 'assets/inazuma/ui/crest1.png',
    gradient: 'linear-gradient(135deg, #1e3a8a, #0284c7 60%, #eab308)',
    featured: [1, 10, 3, 140, 141],
    teamName: 'Raimon',
  },
  {
    id: 'royal',
    name: 'Royal Academy (Teikoku)',
    subtitle: 'La élite del comandante Ray Dark y Jude Sharp',
    badge: 'assets/inazuma/ui/crest2.png',
    gradient: 'linear-gradient(135deg, #831843, #be123c 60%, #fbbf24)',
    featured: [20, 21, 28, 27],
    teamName: 'Royal Academy',
  },
  {
    id: 'alius',
    name: 'Torneo Alius & Élite Mundial',
    subtitle: 'Jugadores con poderes que desafían los límites humanos',
    badge: 'assets/inazuma/ui/crest10.png',
    gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed 55%, #06b6d4)',
    featured: [30480, 30481, 200, 182],
    teamName: 'Zeus',
  },
];

export function rollRarity(guaranteedRarity = 1) {
  const rand = Math.random() * 100;
  if (guaranteedRarity >= 4) {
    return rand < 20 ? 5 : 4;
  }
  if (guaranteedRarity >= 3) {
    if (rand < 5) return 5;
    if (rand < 25) return 4;
    return 3;
  }
  if (rand < 1) return 5;
  if (rand < 6) return 4;
  if (rand < 20) return 3;
  if (rand < 50) return 2;
  return 1;
}

export function drawPackCards(catalogPlayers, count = 5, banner = BANNERS[0], pity = 0) {
  if (!catalogPlayers || catalogPlayers.length === 0) return [];

  const results = [];
  let bestRarity = 1;

  for (let i = 0; i < count; i++) {
    let guaranteed = 1;
    // La última carta de un sobre de 5 o 10 garantiza al menos rareza 3 o 4
    if (i === count - 1 && count >= 10) guaranteed = 4;
    else if (i === count - 1 && count >= 5) guaranteed = 3;

    let rarity = rollRarity(guaranteed);
    // Pity system: a las 20 tiradas garantiza un 5 estrellas
    if (pity + i + 1 >= 20 && rarity < 5) {
      rarity = 5;
    }

    if (rarity > bestRarity) bestRarity = rarity;

    // Filtrar o ponderar según el banner
    let pool = catalogPlayers;
    if (banner.teamName) {
      const teamPool = catalogPlayers.filter(p => p.teamName === banner.teamName || p.id <= 30);
      if (teamPool.length >= 5 && Math.random() < 0.6) {
        pool = teamPool;
      }
    }

    const selected = pool[Math.floor(Math.random() * pool.length)] || catalogPlayers[0];
    results.push({
      player: selected,
      rarity,
      isFoil: rarity >= 4 || Math.random() < 0.08,
      isNew: false, // se calcula con la colección activa
    });
  }

  return { cards: results, bestRarity };
}

/**
 * Controlador de la animación 2D de apertura de sobres.
 */
export class BoosterPackAnimator {
  constructor(containerElement, audioManager) {
    this.container = containerElement;
    this.audio = audioManager;
    this.isOpening = false;
    this.isSkipped = false;
  }

  async playPackOpening(packCards, bestRarity, onCardRevealed, onComplete) {
    this.isOpening = true;
    this.isSkipped = false;

    // Crear el sobre 2D interactivo
    this.container.innerHTML = `
      <div class="pack-stage" id="pack-stage">
        <div class="pack-rays" id="pack-rays"></div>
        <div class="pack-glow" id="pack-glow"></div>
        <div class="booster-pack-2d" id="booster-pack">
          <div class="foil-crimp top" id="pack-top-crimp"></div>
          <div class="tear-strip-guide" id="tear-line">
            <span>✂ ¡TOCA O HAZ CLIC PARA ABRIR!</span>
          </div>
          <div class="pack-body">
            <div class="pack-emblem-wrap">
              <span class="pack-brand-text">INAZUMA SURVIVORS</span>
              <img src="assets/inazuma/ui/crest1.png" class="pack-crest" alt="Inazuma Crest">
              <h3 class="pack-title">SOBRE OFICIAL</h3>
              <p class="pack-subtitle">COLECCIÓN DE FICHAJES FÚTBOL FRONTIER</p>
            </div>
            <div class="pack-rarity-badge">${bestRarity >= 4 ? '★ EDICIÓN ESPECIAL ★' : '★ 5 CARTAS ★'}</div>
            <div class="pack-foil-shine"></div>
          </div>
          <div class="foil-crimp bottom"></div>
        </div>

        <div class="pack-cards-container hidden" id="pack-cards-container"></div>

        <div class="pack-controls">
          <button type="button" class="btn-pack-skip hidden" id="pack-skip-btn">SALTAR ANIMACIÓN ⏭</button>
          <button type="button" class="btn-pack-finish hidden" id="pack-finish-btn">CONTINUAR ➔</button>
        </div>
      </div>
    `;

    const stage = this.container.querySelector('#pack-stage');
    const pack = this.container.querySelector('#booster-pack');
    const tearLine = this.container.querySelector('#tear-line');
    const topCrimp = this.container.querySelector('#pack-top-crimp');
    const rays = this.container.querySelector('#pack-rays');
    const glow = this.container.querySelector('#pack-glow');
    const cardsContainer = this.container.querySelector('#pack-cards-container');
    const skipBtn = this.container.querySelector('#pack-skip-btn');
    const finishBtn = this.container.querySelector('#pack-finish-btn');

    skipBtn.classList.remove('hidden');
    skipBtn.onclick = () => {
      this.isSkipped = true;
      skipBtn.classList.add('hidden');
    };

    // Esperar interacción del usuario para abrir o permitir clic directo
    const openPackPromise = new Promise((resolve) => {
      const trigger = () => {
        pack.removeEventListener('click', trigger);
        resolve();
      };
      pack.addEventListener('click', trigger);
      skipBtn.addEventListener('click', trigger, { once: true });
    });

    await openPackPromise;

    if (this.audio) {
      this.audio.playEffect('s201.mp3');
      if (this.audio.playSyntheticSfx) this.audio.playSyntheticSfx('foilTear');
    }

    // Efecto de rasgado del sobre
    pack.classList.add('is-tearing');
    topCrimp.classList.add('torn-off');
    tearLine.style.opacity = '0';

    // Determinar color del destello según la mejor rareza
    const rarityColor = RARITIES[bestRarity]?.color || '#facc15';
    glow.style.setProperty('--glow-color', rarityColor);
    glow.classList.add('active');
    rays.style.setProperty('--ray-color', rarityColor);
    rays.classList.add('spinning');

    if (bestRarity >= 5 && stage) {
      stage.classList.add('heavy-shake');
      setTimeout(() => stage.classList.remove('heavy-shake'), 600);
    }

    await this.wait(450);

    // Salen las cartas flotando del sobre
    pack.classList.add('cards-emerged');
    cardsContainer.classList.remove('hidden');

    // Generar cartas
    cardsContainer.innerHTML = '';
    const cardElements = [];

    for (let index = 0; index < packCards.length; index++) {
      const cardData = packCards[index];
      const player = cardData.player;
      const rarityInfo = RARITIES[cardData.rarity];

      const cardEl = document.createElement('div');
      cardEl.className = `gacha-reveal-card rarity-${cardData.rarity} ${cardData.isFoil ? 'foil' : ''}`;
      cardEl.style.setProperty('--card-color', rarityInfo.color);
      cardEl.style.setProperty('--card-border', rarityInfo.border);

      cardEl.innerHTML = `
        <div class="card-inner">
          <div class="card-back-face">
            <div class="card-back-emblem">⚡</div>
            <span>INAZUMA</span>
          </div>
          <div class="card-front-face">
            <div class="card-header-bar">
              <span class="card-role ${player.role?.toLowerCase() || 'del'}">${player.role || 'JUG'}</span>
              <span class="card-stars">${'★'.repeat(rarityInfo.stars)}</span>
              <span class="card-element ${player.element || 'fuego'}">${getElementIcon(player.element)}</span>
            </div>
            <div class="card-sprite-box" id="card-sprite-${index}"></div>
            <div class="card-player-info">
              <strong class="card-player-name">${player.name || 'Jugador'}</strong>
              <small class="card-team-name">${player.nick || player.name} · ${player.element || 'neutro'}</small>
            </div>
            <div class="card-status-badge ${cardData.isNew ? 'is-new' : 'is-dupe'}">
              ${cardData.isNew ? '¡NUEVO FICHAJE!' : 'Repetido (+50 Pts)'}
            </div>
            <button type="button" class="btn-equip-card" data-player-id="${player.id}">ELEGIR CAPITÁN</button>
          </div>
        </div>
      `;

      cardsContainer.appendChild(cardEl);
      cardElements.push(cardEl);

      // Renderizar sprite en canvas pequeño
      const spriteBox = cardEl.querySelector(`#card-sprite-${index}`);
      const spriteCanvas = createPlayerMiniCanvas(player);
      spriteBox.appendChild(spriteCanvas);
    }

    // Revelar cartas una a una o en cascada
    for (let i = 0; i < cardElements.length; i++) {
      const cardEl = cardElements[i];
      if (!this.isSkipped) {
        await this.wait(180);
      }
      cardEl.classList.add('revealed');
      if (this.audio) {
        if (packCards[i].rarity >= 4 && this.audio.playSyntheticSfx) {
          this.audio.playSyntheticSfx('cardLegendary');
        } else if (this.audio.playSyntheticSfx) {
          this.audio.playSyntheticSfx('cardFlip');
        }
      }
      if (onCardRevealed) onCardRevealed(packCards[i], i);
    }

    skipBtn.classList.add('hidden');
    finishBtn.classList.remove('hidden');

    finishBtn.onclick = () => {
      if (onComplete) onComplete(packCards);
    };
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

function getElementIcon(elem) {
  switch (elem?.toLowerCase()) {
    case 'fuego': return '🔥';
    case 'viento': return '⚡';
    case 'bosque': return '🍃';
    case 'montaña': return '⛰️';
    default: return '✦';
  }
}

/**
 * Crea un canvas del sprite del jugador escalado píxel art con tamaño personalizable
 */
export function createPlayerMiniCanvas(player, size = 80) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const sheetName = player.sprite?.sheet || 'c00.png';
  const rowIndex = player.sprite?.row ?? player.row ?? 0;
  const img = new Image();
  img.src = `assets/inazuma/sprites/${sheetName}`;

  img.onload = () => {
    // Dibujar sombra bajo el jugador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(size / 2, size - 10, size * 0.34, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar frame 0 (idle) de la fila correspondiente escalado con alta fidelidad
    const renderSize = size - 14;
    ctx.drawImage(img, 0, rowIndex * 48, 48, 48, 7, 6, renderSize, renderSize);
  };

  img.onerror = () => {
    // Fallback con círculo de elemento y texto
    ctx.fillStyle = '#223843';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fce22a';
    ctx.font = `bold ${Math.round(size * 0.35)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.name?.[0] || '★', size / 2, size / 2);
  };

  return canvas;
}
