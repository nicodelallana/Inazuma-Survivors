const PALETTE = {
  '.': null,
  H: '#18332a',
  S: '#e8b99a',
  J: '#f0d95a',
  G: '#218363',
  W: '#f3f1dc',
  B: '#263c50',
  R: '#f07854',
  O: '#d94f38',
  Y: '#f3c64f',
  K: '#17221e',
};

const PIXEL_MAPS = {
  player: [
    '......HHHH......',
    '.....HHHHHH.....',
    '.....HSSSSH.....',
    '.....SSSSSS.....',
    '....GGWWGGG.....',
    '...GGGWWGGGG....',
    '..GGGJJJJGGG....',
    '..GGGJJJJGGG....',
    '...GGGGGGGG.....',
    '....BBBBBB......',
    '...BBBBBBBB.....',
    '...BB....BB.....',
    '..BBB....BBB....',
    '..BB......BB....',
    '..KK......KK....',
    '.KKK......KKK...',
  ],
  runner: [
    '......HHHH......',
    '.....HHRRHH.....',
    '.....HSSSSH.....',
    '.....SSSSSS.....',
    '....OOOOOOOO....',
    '...OOOYYYYOOO...',
    '..OOOYYYYYYOOO..',
    '..OOOOOOOOOOOO..',
    '...OOOOOOOOOO...',
    '....BBBBBB......',
    '...BBBBBBBB.....',
    '...BB....BB.....',
    '..BBB....BBB....',
    '..BB......BB....',
    '..KK......KK....',
    '.KKK......KKK...',
  ],
  shooter: [
    '.....HHHHHH.....',
    '....HHYYYYHH....',
    '....HYYYYYYH....',
    '.....SSSSSS.....',
    '....GGGGGGGG....',
    '...GGWWGGWWGG...',
    '..GGGWWGGWWGGG..',
    '..GGGGGGGGGGGG..',
    '...GGGGGGGGGG...',
    '....BBBBBB......',
    '...BBBBBBBB.....',
    '...BB....BB.....',
    '..BBB....BBB....',
    '..BB......BB....',
    '..KK......KK....',
    '.KKK......KKK...',
  ],
};

// Optional, rights-cleared sprite sheets can be supplied without changing the
// simulation. Each image replaces the procedural fallback when it loads.
export const SPRITE_MANIFEST = Object.freeze({
  player: { path: 'assets/inazuma/sprites/c00.png', row: 0, frameWidth: 48, frameHeight: 48, frames: 47, animations: { idle: [0, 1, 2, 3], run: [4, 5, 6, 7, 8, 9, 10, 11], hurt: [20, 21], technique: [25, 26, 27, 28, 29, 30, 31] } },
  runner: { path: 'assets/inazuma/sprites/c00.png', row: 1, frameWidth: 48, frameHeight: 48, frames: 47, animations: { idle: [0, 1, 2, 3], run: [4, 5, 6, 7, 8, 9, 10, 11], hurt: [20, 21] } },
  shooter: { path: 'assets/inazuma/sprites/c00.png', row: 2, frameWidth: 48, frameHeight: 48, frames: 47, animations: { idle: [0, 1, 2, 3], run: [4, 5, 6, 7, 8, 9, 10, 11], hurt: [20, 21] } },
});

function makeSprite(rows) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map((row) => row.length));
  canvas.height = rows.length;
  const context = canvas.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (PALETTE[pixel]) {
      context.fillStyle = PALETTE[pixel];
      context.fillRect(x, y, 1, 1);
    }
  }));
  return canvas;
}

export function createSprites(assetPaths = {}) {
  const sprites = Object.fromEntries(Object.entries(PIXEL_MAPS).map(([name, rows]) => [name, makeSprite(rows)]));
  for (const [name, configuredPath] of Object.entries(assetPaths)) {
    const path = configuredPath || SPRITE_MANIFEST[name]?.path;
    if (!SPRITE_MANIFEST[name] || !path) continue;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      sprites[name] = { image, ...SPRITE_MANIFEST[name] };
    };
    image.onerror = () => console.warn(`No se pudo cargar el sprite opcional: ${path}`);
    image.src = path;
  }
  return sprites;
}
