import { applyMetaUpgrades, applyUpgrade, createRun, updateGame, GAME_CONFIG, TECHNIQUES } from './simulation.js';
import { renderGame } from './render.js';
import { createSprites } from './sprites.js';
import { createAudioManager } from './audio.js';
import { loadCatalog } from './catalog.js';
import { BANNERS, BoosterPackAnimator, createPlayerMiniCanvas, drawPackCards } from './gacha.js';

// Elementos del DOM
const appRoot = document.querySelector('#app-root');
const appSidebar = document.querySelector('#app-sidebar');
const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const inGameHud = document.querySelector('#in-game-hud');
const screensOverlay = document.querySelector('#screens-overlay');
const packModalLayer = document.querySelector('#pack-opening-modal-layer');

const panels = {
  menu: document.querySelector('#scr-menu'),
  gacha: document.querySelector('#scr-gacha'),
  album: document.querySelector('#scr-album'),
  upgrades: document.querySelector('#scr-upgrades'),
  guide: document.querySelector('#scr-guide'),
  levelup: document.querySelector('#scr-levelup'),
  pause: document.querySelector('#scr-pause'),
  result: document.querySelector('#scr-result'),
};

// Sprites y Audio
const sprites = createSprites({
  player: 'assets/inazuma/sprites/c00.png',
  runner: 'assets/inazuma/sprites/c00.png',
  shooter: 'assets/inazuma/sprites/c00.png',
});
const audio = createAudioManager();
const packAnimator = new BoosterPackAnimator(packModalLayer, audio);

// Estado persistente
let catalog = { players: [], teams: [] };
const ownedPlayerIds = new Set([1, 10, 3]); // Mark Evans, Axel Blaze, Jack Wallside
let activeCaptainId = 1;
let tickets = 5;
let coins = 300;
let metaUpgrades = { power: 0, pace: 0, vitality: 0, haste: 0, magnet: 0 };
let pityCounters = { raimon: 0, royal: 0, alius: 0 };
let selectedBannerId = 'raimon';
let selectedTeamId = 1;

// Cargar almacenamiento local
try {
  const savedOwned = JSON.parse(localStorage.getItem('inazuma-owned-players') || 'null');
  if (savedOwned) {
    savedOwned.forEach(id => ownedPlayerIds.add(Number(id)));
  }
  const savedCap = Number(localStorage.getItem('inazuma-active-captain'));
  if (savedCap && ownedPlayerIds.has(savedCap)) activeCaptainId = savedCap;

  const savedCur = JSON.parse(localStorage.getItem('inazuma-currencies') || 'null');
  if (savedCur) {
    if (typeof savedCur.tickets === 'number') tickets = savedCur.tickets;
    if (typeof savedCur.coins === 'number') coins = savedCur.coins;
  }
  metaUpgrades = { ...metaUpgrades, ...JSON.parse(localStorage.getItem('inazuma-meta-upgrades') || '{}') };
  pityCounters = { ...pityCounters, ...JSON.parse(localStorage.getItem('inazuma-pity') || '{}') };
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem('inazuma-owned-players', JSON.stringify([...ownedPlayerIds]));
    localStorage.setItem('inazuma-active-captain', String(activeCaptainId));
    localStorage.setItem('inazuma-currencies', JSON.stringify({ tickets, coins }));
    localStorage.setItem('inazuma-meta-upgrades', JSON.stringify(metaUpgrades));
    localStorage.setItem('inazuma-pity', JSON.stringify(pityCounters));
  } catch (_) {}
  updateSidebarCurrencies();
}

// Estado del bucle de juego
const pressedKeys = new Set();
let state = createRun();
state.phase = 'menu';
let currentScreen = 'menu';
let techniquePressed = false;
let previousPhase = state.phase;
let lastFrame = 0;
let lastHudUpdate = 0;

// Cargar catálogo de jugadores
loadCatalog().then((loaded) => {
  catalog = loaded;
  renderCaptainSpotlight();
  renderSidebarQuickPlayers();
  renderAlbum();
  renderGacha();
  renderMetaUpgrades();
}).catch((error) => console.warn('Error cargando catálogo:', error.message));

function getActiveCaptain() {
  if (catalog.players.length > 0) {
    return catalog.players.find(p => p.id === activeCaptainId) || catalog.players[0];
  }
  return { id: 1, name: 'Mark Evans', nick: 'Mark', role: 'POR', element: 'montaña', row: 0 };
}

function updateSidebarCurrencies() {
  const tEl = document.querySelector('#sidebar-tickets');
  const cEl = document.querySelector('#sidebar-coins');
  if (tEl) tEl.textContent = tickets;
  if (cEl) cEl.textContent = coins;
}

function showScreen(screenName) {
  currentScreen = screenName;

  // Actualizar botones de navegación del menú lateral
  document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.screen === screenName);
  });

  if (state.phase === 'running') {
    // Si estamos en partido, ocultar sidebar y pantallas overlay
    appRoot.classList.add('in-game');
    appSidebar.classList.add('match-hidden');
    screensOverlay.hidden = true;
    inGameHud.hidden = false;
  } else {
    // Fuera de partida, restaurar menú lateral
    appRoot.classList.remove('in-game');
    appSidebar.classList.remove('match-hidden');
    inGameHud.hidden = true;

    // Mostrar el panel seleccionado dentro del área principal
    screensOverlay.hidden = screenName === 'menu';
    for (const [name, panel] of Object.entries(panels)) {
      if (['levelup', 'pause', 'result'].includes(name)) continue;
      panel.hidden = name !== screenName;
    }
  }

  resizeCanvas();

  if (screenName === 'album') renderAlbum();
  if (screenName === 'gacha') renderGacha();
  if (screenName === 'upgrades') renderMetaUpgrades();
  if (screenName === 'menu') {
    renderCaptainSpotlight();
    renderSidebarQuickPlayers();
  }
}

/**
 * Renderiza la tarjeta destacada del capitán en la parte superior del menú lateral
 */
function renderCaptainSpotlight() {
  const captain = getActiveCaptain();
  const avatarBox = document.querySelector('#sidebar-captain-avatar');
  if (avatarBox) {
    avatarBox.innerHTML = '';
    avatarBox.appendChild(createPlayerMiniCanvas(captain, 96));
  }

  document.querySelector('#sidebar-captain-name').textContent = captain.name;
  document.querySelector('#sidebar-captain-role').textContent = captain.role || 'JUG';
  document.querySelector('#sidebar-captain-elem').textContent = `Elemento ${captain.element || 'neutro'}`;

  // Stats
  const hpBase = captain.role === 'POR' ? 120 : captain.role === 'DEF' ? 140 : 100;
  const speedBase = captain.role === 'DEL' ? 220 : 210;
  document.querySelector('#sidebar-stat-hp').textContent = `${hpBase} HP`;
  document.querySelector('#sidebar-stat-speed').textContent = `${speedBase}`;

  // Técnica inicial
  let techName = 'Chut Granada';
  if (captain.id === 10) techName = 'Tornado de Fuego';
  else if (captain.id === 1) techName = 'Mano Celestial';
  else if (captain.id === 3) techName = 'El Muro';
  document.querySelector('#sidebar-stat-tech').textContent = techName;
}

/**
 * Renderiza la lista rápida de jugadores desbloqueados en el menú lateral
 */
function renderSidebarQuickPlayers() {
  const container = document.querySelector('#sidebar-quick-players');
  if (!container || !catalog.players) return;

  const unlockedPlayers = catalog.players.filter(p => ownedPlayerIds.has(p.id));
  document.querySelector('#sidebar-unlocked-count').textContent = `${unlockedPlayers.length} disponibles`;

  container.innerHTML = '';
  unlockedPlayers.forEach(player => {
    const isCurrent = player.id === activeCaptainId;
    const chip = document.createElement('div');
    chip.className = `sidebar-player-chip ${isCurrent ? 'is-active' : ''}`;
    chip.title = `${player.name} (${player.role || 'JUG'})`;

    const canvas = createPlayerMiniCanvas(player, 54);
    chip.appendChild(canvas);

    const nameEl = document.createElement('strong');
    nameEl.textContent = player.nick || player.name;
    chip.appendChild(nameEl);

    const roleEl = document.createElement('small');
    roleEl.textContent = `${player.role || 'JUG'} · ${player.element || ''}`;
    chip.appendChild(roleEl);

    chip.onclick = () => {
      activeCaptainId = player.id;
      saveProgress();
      renderCaptainSpotlight();
      renderSidebarQuickPlayers();
      if (currentScreen === 'album') renderAlbum();
      if (audio.playSyntheticSfx) audio.playSyntheticSfx('cardFlip');
    };

    container.appendChild(chip);
  });
}

/* ==================== GACHA / SOBRES ==================== */
function renderGacha() {
  const tabsContainer = document.querySelector('#gacha-banner-tabs');
  if (!tabsContainer) return;
  tabsContainer.innerHTML = '';

  BANNERS.forEach(banner => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `gen-tab ${banner.id === selectedBannerId ? 'on' : ''}`;
    tab.textContent = banner.name;
    tab.onclick = () => {
      selectedBannerId = banner.id;
      renderGacha();
    };
    tabsContainer.appendChild(tab);
  });

  const activeBanner = BANNERS.find(b => b.id === selectedBannerId) || BANNERS[0];
  document.querySelector('#banner-title-text').textContent = activeBanner.name;
  document.querySelector('#banner-sub-text').textContent = activeBanner.subtitle;
  document.querySelector('#banner-crest-img').src = activeBanner.badge;

  const currentPity = pityCounters[selectedBannerId] || 0;
  document.querySelector('#gacha-pity-text').textContent = `Tiradas para carta 5★ Legendaria garantizada en este sobre: ${currentPity} / 20`;
}

async function triggerPackOpening(cardCount, costTickets, costCoins) {
  if (tickets < costTickets && coins < costCoins) {
    alert('¡No tienes suficientes Tickets ni Puntos Inazuma! Juega partidos para ganar más.');
    return;
  }

  if (tickets >= costTickets) {
    tickets -= costTickets;
  } else {
    coins -= costCoins;
  }

  const activeBanner = BANNERS.find(b => b.id === selectedBannerId) || BANNERS[0];
  const pity = pityCounters[selectedBannerId] || 0;

  const { cards, bestRarity } = drawPackCards(catalog.players, cardCount, activeBanner, pity);

  cards.forEach(c => {
    if (!ownedPlayerIds.has(c.player.id)) {
      c.isNew = true;
      ownedPlayerIds.add(c.player.id);
    } else {
      c.isNew = false;
      coins += 50;
    }
  });

  if (bestRarity >= 5) {
    pityCounters[selectedBannerId] = 0;
  } else {
    pityCounters[selectedBannerId] = (pityCounters[selectedBannerId] || 0) + cardCount;
  }

  saveProgress();
  packModalLayer.classList.remove('hidden');

  await packAnimator.playPackOpening(
    cards,
    bestRarity,
    null,
    () => {
      packModalLayer.classList.add('hidden');
      renderCaptainSpotlight();
      renderSidebarQuickPlayers();
      renderGacha();
      if (currentScreen === 'album') renderAlbum();
    }
  );

  packModalLayer.querySelectorAll('.btn-equip-card').forEach(btn => {
    btn.onclick = (e) => {
      const pid = Number(e.currentTarget.dataset.playerId);
      if (pid && ownedPlayerIds.has(pid)) {
        activeCaptainId = pid;
        saveProgress();
        renderCaptainSpotlight();
        renderSidebarQuickPlayers();
        e.currentTarget.textContent = '¡EQUIPADO!';
        e.currentTarget.style.background = '#22c55e';
        e.currentTarget.style.color = '#fff';
      }
    };
  });
}

/* ==================== ÁLBUM / COLECCIÓN (TARJETAS GRANDES) ==================== */
function renderAlbum() {
  const filtersContainer = document.querySelector('#album-team-filters');
  const gridContainer = document.querySelector('#album-players-grid');
  if (!filtersContainer || !gridContainer) return;

  const ownedCount = catalog.players.filter(p => ownedPlayerIds.has(p.id)).length;
  document.querySelector('#album-counter-text').textContent = `${ownedCount} de ${catalog.players.length} jugadores conseguidos`;

  filtersContainer.innerHTML = '';
  catalog.teams.slice(0, 15).forEach((team) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `team-filter-btn ${team.crest === selectedTeamId ? 'active' : ''}`;
    btn.innerHTML = `<img src="assets/inazuma/ui/crest${team.crest}.png" alt=""><span>${team.name}</span>`;
    btn.onclick = () => {
      selectedTeamId = team.crest;
      renderAlbum();
    };
    filtersContainer.appendChild(btn);
  });

  gridContainer.innerHTML = '';
  const currentTeam = catalog.teams.find(t => t.crest === selectedTeamId) || catalog.teams[0];
  const teamPlayerIds = new Set((currentTeam?.players || []).map(p => p.id));
  const teamPlayers = catalog.players.filter(p => teamPlayerIds.has(p.id));

  const displayList = teamPlayers.length >= 4 ? teamPlayers : catalog.players.slice(0, 16);

  displayList.forEach(player => {
    const isOwned = ownedPlayerIds.has(player.id);
    const isCaptain = player.id === activeCaptainId;

    const card = document.createElement('div');
    card.className = `album-player-card ${isOwned ? 'is-owned' : 'is-locked'} ${isCaptain ? 'is-active-captain' : ''}`;

    const roleClass = (player.role || 'del').toLowerCase();
    const elemIcon = player.element === 'fuego' ? '🔥' : player.element === 'viento' ? '⚡' : player.element === 'bosque' ? '🍃' : '⛰️';

    card.innerHTML = `
      ${isCaptain ? '<span class="album-captain-tag">CAPITÁN</span>' : ''}
      <div class="album-card-header">
        <span class="card-role-pill ${roleClass}">${player.role || 'JUG'}</span>
        <span class="card-elem-badge">${elemIcon}</span>
      </div>
      <div class="album-avatar-box" id="album-avatar-${player.id}"></div>
      <strong>${player.name}</strong>
      <small>${currentTeam?.name || 'Equipo'} · ${player.element || 'neutro'}</small>
      <div class="album-stars-row">★★★★</div>
      ${isOwned
        ? `<button type="button" class="btn-select-as-captain ${isCaptain ? 'active-btn' : ''}" data-pid="${player.id}">
             ${isCaptain ? '★ CAPITÁN ACTIVO ★' : 'ELEGIR CAPITÁN'}
           </button>`
        : '<small style="margin-top:10px;color:#64748b;font-weight:800">EN SOBRES DE FICHAJES</small>'
      }
    `;

    gridContainer.appendChild(card);

    const avatarBox = card.querySelector(`#album-avatar-${player.id}`);
    if (avatarBox) avatarBox.appendChild(createPlayerMiniCanvas(player, 88));
  });

  gridContainer.querySelectorAll('.btn-select-as-captain').forEach(btn => {
    btn.onclick = (e) => {
      const pid = Number(e.currentTarget.dataset.pid);
      if (pid && ownedPlayerIds.has(pid)) {
        activeCaptainId = pid;
        saveProgress();
        renderCaptainSpotlight();
        renderSidebarQuickPlayers();
        renderAlbum();
        if (audio.playSyntheticSfx) audio.playSyntheticSfx('cardFlip');
      }
    };
  });
}

/* ==================== DOJO / MEJORAS PERMANENTES ==================== */
function renderMetaUpgrades() {
  const container = document.querySelector('#meta-upgrades-container');
  if (!container) return;
  container.innerHTML = '';

  const options = [
    ['power', '⚡ Potencia de Chut', 'Aumenta el daño de ataque en +12% por nivel.', 100],
    ['pace', '👟 Velocidad y Ritmo', 'Velocidad de movimiento en el campo +8% por nivel.', 80],
    ['vitality', '♥ Resistencia y Vitalidad', 'Energía máxima del capitán +12 HP por nivel.', 90],
    ['haste', '⏱ Concentración Mental', 'Reduce el tiempo de recarga de supertécnicas en -8% por nivel.', 120],
    ['magnet', '🧲 Magnetismo del Balón', 'Aumenta el radio de atracción de experiencia en +25%.', 75],
  ];

  options.forEach(([id, title, desc, baseCost]) => {
    const lvl = metaUpgrades[id] || 0;
    const cost = Math.round(baseCost * (1 + lvl * 0.6));

    const row = document.createElement('div');
    row.className = 'meta-upgrade-row';
    row.innerHTML = `
      <div class="meta-upgrade-info">
        <strong>${title} · Nivel ${lvl}</strong>
        <small>${desc}</small>
      </div>
      <button type="button" class="btn-buy-meta" data-upgrade-id="${id}" ${coins < cost ? 'disabled' : ''}>
        MEJORAR · 🪙 ${cost}
      </button>
    `;

    container.appendChild(row);
  });

  container.querySelectorAll('.btn-buy-meta').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.upgradeId;
      const opt = options.find(o => o[0] === id);
      if (!opt) return;
      const lvl = metaUpgrades[id] || 0;
      const cost = Math.round(opt[3] * (1 + lvl * 0.6));

      if (coins >= cost) {
        coins -= cost;
        metaUpgrades[id] = lvl + 1;
        saveProgress();
        renderMetaUpgrades();
        if (audio.playSyntheticSfx) audio.playSyntheticSfx('levelUp');
      }
    };
  });
}

/* ==================== PARTIDO Y JUEGO ==================== */
function beginRun() {
  const captain = getActiveCaptain();
  state = applyMetaUpgrades(createRun(captain), metaUpgrades);
  previousPhase = 'running';

  // Ocultar completamente menú lateral y overlays
  appRoot.classList.add('in-game');
  appSidebar.classList.add('match-hidden');
  screensOverlay.hidden = true;
  for (const panel of Object.values(panels)) {
    panel.hidden = true;
  }
  inGameHud.hidden = false;

  // Actualizar HUD con info del capitán
  document.querySelector('#hud-captain-name').textContent = captain.name.toUpperCase();
  document.querySelector('#hud-captain-role').textContent = captain.role || 'DEL';
  const hudAvatar = document.querySelector('#hud-avatar-box');
  if (hudAvatar) {
    hudAvatar.innerHTML = '';
    hudAvatar.appendChild(createPlayerMiniCanvas(captain, 48));
  }

  resizeCanvas();
  updateHud();
  audio.playTrack('run');
  if (audio.playSyntheticSfx) audio.playSyntheticSfx('kick');
}

function updateHud() {
  const player = state.player;

  // Barra de experiencia superior
  const xpPct = Math.min(100, (player.xp / player.nextXp) * 100);
  document.querySelector('#hud-xp-fill').style.width = `${xpPct}%`;
  document.querySelector('#hud-level-val').textContent = player.level.toString().padStart(2, '0');
  document.querySelector('#hud-xp-text').textContent = `${player.xp} / ${player.nextXp} XP`;

  // Barra de energía (salud)
  const hpFrac = Math.max(0, player.health / player.maxHealth);
  document.querySelector('#hud-health-fill').style.width = `${hpFrac * 100}%`;
  document.querySelector('#hud-health-lag').style.width = `${hpFrac * 100}%`;
  document.querySelector('#hud-health-text').textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

  // Cronómetro
  const timeLeft = Math.max(0, (GAME_CONFIG.runDuration || 90) - state.elapsed);
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
  document.querySelector('#hud-clock-val').textContent = `${minutes}:${seconds}`;

  // Métricas
  document.querySelector('#hud-kills-val').textContent = `⚽ ${state.kills.toString().padStart(2, '0')}`;
  document.querySelector('#hud-wave-val').textContent = state.wave.toString().padStart(2, '0');
  document.querySelector('#hud-loot-val').textContent = `🪙 ${state.coinsEarned || 0}`;

  // Supertécnica
  const tech = TECHNIQUES.find(t => t.id === player.activeTechnique) || TECHNIQUES[0];
  document.querySelector('#tech-special-name').textContent = tech.name.toUpperCase();
  const ready = player.techniqueCooldown <= 0;
  document.querySelector('#tech-special-status').textContent = ready ? 'LISTA' : `${player.techniqueCooldown.toFixed(1)}s`;
  document.querySelector('#tech-special-status').style.color = ready ? 'var(--inazuma-lime)' : 'var(--inazuma-orange)';

  const cdFrac = ready ? 0 : player.techniqueCooldown / (tech.cooldown * (player.cooldownMultiplier || 1));
  document.querySelector('#tech-cooldown-overlay').style.transform = `scaleY(${cdFrac})`;
}

function showLevelUpChoices() {
  screensOverlay.hidden = false;
  panels.levelup.hidden = false;
  document.querySelector('#levelup-title-num').textContent = `NIVEL ${state.player.level}`;

  const grid = document.querySelector('#levelup-choices-grid');
  grid.innerHTML = '';

  state.upgradeChoices.forEach((upgrade, index) => {
    const card = document.createElement('div');
    card.className = 'levelup-choice-card';
    card.innerHTML = `
      <span class="levelup-key-badge">${index + 1}</span>
      <div class="levelup-symbol">${upgrade.symbol || '⚡'}</div>
      <strong>${upgrade.name}</strong>
      <p>${upgrade.description}</p>
    `;

    card.onclick = () => {
      state = applyUpgrade(state, upgrade.id);
      panels.levelup.hidden = true;
      screensOverlay.hidden = true;
      if (audio.playSyntheticSfx) audio.playSyntheticSfx('levelUp');
    };

    grid.appendChild(card);
  });
}

function togglePause() {
  if (state.phase === 'running') {
    state.phase = 'paused';
    screensOverlay.hidden = false;
    panels.pause.hidden = false;
  } else if (state.phase === 'paused') {
    state.phase = 'running';
    screensOverlay.hidden = true;
    panels.pause.hidden = true;
  }
}

function showMatchResult() {
  screensOverlay.hidden = false;
  panels.result.hidden = false;
  inGameHud.hidden = true;

  const won = state.phase === 'victory';
  document.querySelector('#result-kicker-tag').textContent = won ? '¡VICTORIA DEL EQUIPO!' : 'FIN DEL PARTIDO';
  document.querySelector('#result-title-text').textContent = won ? '¡CAMPEONES!' : 'BUEN INTENTO';
  document.querySelector('#result-subtitle-text').textContent = won ? 'Has dominado el campo hasta el pitido final.' : 'Los rivales han superado a tu capitán.';

  coins += (state.coinsEarned || 0) + (won ? 150 : 50);
  tickets += (state.ticketsEarned || 0) + (won ? 2 : 0);
  saveProgress();

  const statsContainer = document.querySelector('#match-summary-stats');
  statsContainer.innerHTML = `
    <div class="summary-stat-box">
      <span>TIEMPO</span>
      <strong>${Math.floor(state.elapsed)}s</strong>
    </div>
    <div class="summary-stat-box">
      <span>REMATES</span>
      <strong>⚽ ${state.kills}</strong>
    </div>
    <div class="summary-stat-box">
      <span>NIVEL</span>
      <strong>Nv. ${state.player.level}</strong>
    </div>
    <div class="summary-stat-box">
      <span>BOTÍN TOTAL</span>
      <strong>🪙 +${state.coinsEarned || 0} · 🎫 +${state.ticketsEarned || 0}</strong>
    </div>
  `;

  audio.playTrack('result');
}

function syncGamePhase() {
  if (state.phase === previousPhase) return;
  previousPhase = state.phase;

  if (state.phase === 'levelup') {
    showLevelUpChoices();
    if (audio.playSyntheticSfx) audio.playSyntheticSfx('levelUp');
  } else if (state.phase === 'victory' || state.phase === 'defeat') {
    showMatchResult();
  }
}

/* ==================== RESIZE & BUCLE ==================== */
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  context.setTransform(canvas.width / GAME_CONFIG.width, 0, 0, canvas.height / GAME_CONFIG.height, 0, 0);
  context.imageSmoothingEnabled = false;
}

function readInput() {
  return {
    moveX: Number(pressedKeys.has('ArrowRight') || pressedKeys.has('d') || pressedKeys.has('D')) -
           Number(pressedKeys.has('ArrowLeft') || pressedKeys.has('a') || pressedKeys.has('A')),
    moveY: Number(pressedKeys.has('ArrowDown') || pressedKeys.has('s') || pressedKeys.has('S')) -
           Number(pressedKeys.has('ArrowUp') || pressedKeys.has('w') || pressedKeys.has('W')),
    techniquePressed,
  };
}

function gameLoop(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const delta = Math.min((timestamp - lastFrame) / 1000, 0.05);
  lastFrame = timestamp;

  if (state.phase === 'running') {
    updateGame(state, readInput(), delta);
  }
  techniquePressed = false;

  renderGame(context, state, sprites, timestamp);
  syncGamePhase();

  if (state.phase === 'running' && timestamp - lastHudUpdate > 75) {
    updateHud();
    lastHudUpdate = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

/* ==================== EVENT LISTENERS ==================== */
// Navegación en el menú lateral
document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
  btn.onclick = () => {
    if (state.phase === 'running') return;
    showScreen(btn.dataset.screen);
  };
});

document.querySelectorAll('[data-back-to-menu]').forEach(btn => {
  btn.onclick = () => showScreen('menu');
});

// Botones de inicio de partida
document.querySelector('#btn-sidebar-play').onclick = beginRun;
const btnHeroPlay = document.querySelector('#btn-hero-play');
if (btnHeroPlay) btnHeroPlay.onclick = beginRun;

// Botones de Gacha
document.querySelector('#btn-pull-1').onclick = () => triggerPackOpening(3, 1, 100);
document.querySelector('#btn-pull-5').onclick = () => triggerPackOpening(5, 5, 450);
document.querySelector('#btn-pull-10').onclick = () => triggerPackOpening(10, 10, 900);
document.querySelector('#pack-preview-click').onclick = () => triggerPackOpening(5, 5, 450);

// Botones de Pausa y Resultados
document.querySelector('#btn-resume-run').onclick = togglePause;
document.querySelector('#btn-abandon-run').onclick = () => {
  state.phase = 'menu';
  showScreen('menu');
  audio.playTrack('menu');
};
document.querySelector('#btn-restart-run').onclick = beginRun;
document.querySelector('#btn-result-to-gacha').onclick = () => {
  panels.result.hidden = true;
  showScreen('gacha');
};
document.querySelector('#btn-result-to-menu').onclick = () => {
  panels.result.hidden = true;
  showScreen('menu');
  audio.playTrack('menu');
};

// Control de sonido en el menú lateral
document.querySelector('#sidebar-sound-btn').onclick = () => {
  const isMuted = audio.toggleMute();
  document.querySelector('#sidebar-sound-icon').textContent = isMuted ? '✕' : '♫';
};

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'Escape') {
    togglePause();
    return;
  }
  if (e.code === 'Space' && !e.repeat) {
    techniquePressed = true;
  }
  if (state.phase === 'levelup' && ['1', '2', '3'].includes(e.key)) {
    const idx = Number(e.key) - 1;
    if (state.upgradeChoices[idx]) {
      state = applyUpgrade(state, state.upgradeChoices[idx].id);
      panels.levelup.hidden = true;
      screensOverlay.hidden = true;
    }
  }
  pressedKeys.add(e.key);
});

document.addEventListener('keyup', (e) => pressedKeys.delete(e.key));
window.addEventListener('blur', () => pressedKeys.clear());
window.addEventListener('resize', resizeCanvas);
new ResizeObserver(resizeCanvas).observe(canvas);

// Inicialización
updateSidebarCurrencies();
showScreen('menu');
resizeCanvas();
audio.playTrack('menu');
requestAnimationFrame(gameLoop);
