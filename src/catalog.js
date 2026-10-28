const FALLBACK_PLAYERS = [
  { id: 1, name: 'Mark Evans', nick: 'Mark', role: 'POR', element: 'montaña', row: 0, sprite: { sheet: 'c00.png', row: 0 } },
  { id: 3, name: 'Jack Wallside', nick: 'Jack', role: 'DEF', element: 'montaña', row: 1, sprite: { sheet: 'c00.png', row: 1 } },
  { id: 10, name: 'Axel Blaze', nick: 'Axel', role: 'DEL', element: 'fuego', row: 2, sprite: { sheet: 'c00.png', row: 2 } },
  { id: 12, name: 'William Glass', nick: 'Willy', role: 'DEL', element: 'bosque', row: 3, sprite: { sheet: 'c00.png', row: 3 } },
  { id: 13, name: 'Nelly Raimon', nick: 'Nelly', role: 'DEL', element: 'fuego', row: 4, sprite: { sheet: 'c00.png', row: 4 } },
  { id: 14, name: 'Celia Hills', nick: 'Celia', role: 'MED', element: 'viento', row: 5, sprite: { sheet: 'c00.png', row: 5 } },
  { id: 15, name: 'Silvia Woods', nick: 'Silvia', role: 'POR', element: 'montaña', row: 6, sprite: { sheet: 'c00.png', row: 6 } },
  { id: 20, name: 'Joseph King', nick: 'King', role: 'POR', element: 'fuego', row: 7, sprite: { sheet: 'c00.png', row: 7 } },
  { id: 21, name: 'Peter Drent', nick: 'Drent', role: 'DEF', element: 'montaña', row: 8, sprite: { sheet: 'c00.png', row: 8 } },
  { id: 22, name: 'Ben Simmons', nick: 'Simmons', role: 'DEF', element: 'bosque', row: 9, sprite: { sheet: 'c00.png', row: 9 } },
  { id: 23, name: 'Alan Master', nick: 'Master', role: 'MED', element: 'viento', row: 10, sprite: { sheet: 'c00.png', row: 10 } },
  { id: 24, name: 'Gus Martin', nick: 'Martin', role: 'DEF', element: 'bosque', row: 11, sprite: { sheet: 'c00.png', row: 11 } },
  { id: 25, name: 'Herman Waldon', nick: 'Waldon', role: 'MED', element: 'viento', row: 12, sprite: { sheet: 'c00.png', row: 12 } },
  { id: 26, name: 'John Bloom', nick: 'Bloom', role: 'MED', element: 'fuego', row: 13, sprite: { sheet: 'c00.png', row: 13 } },
  { id: 27, name: 'Derek Swing', nick: 'Swing', role: 'MED', element: 'viento', row: 14, sprite: { sheet: 'c00.png', row: 14 } },
  { id: 28, name: 'Daniel Hatch', nick: 'Hatch', role: 'DEL', element: 'bosque', row: 15, sprite: { sheet: 'c00.png', row: 15 } },
];

const FALLBACK_TEAMS = [
  { id: 1, name: 'Instituto Raimon', crest: 1, players: FALLBACK_PLAYERS.slice(0, 7) },
  { id: 2, name: 'Royal Academy', crest: 2, players: FALLBACK_PLAYERS.slice(7, 16) },
  { id: 3, name: 'Zeus', crest: 10, players: FALLBACK_PLAYERS.slice(0, 5) },
];

export async function loadCatalog() {
  try {
    const response = await fetch('content/player-catalog.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Cargando catálogo de respaldo local...', err);
  }
  return { players: FALLBACK_PLAYERS, teams: FALLBACK_TEAMS };
}
