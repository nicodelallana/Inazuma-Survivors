# Sprites

El juego incluye todas las hojas PNG de `juego/sprites/` del ZIP
`Inazuma-Rogue-main.zip` proporcionado por el usuario: 349 archivos (`c*`,
`f*`, `q*`, `r*` y `fhw.png`). El catálogo está en
`inazuma/sprites/index.json`. Las hojas de personajes usan frames de 48×48;
cada fila representa un personaje y se recorta en Canvas sin copiar el código
del proyecto de origen.

Los nombres y filas de los 16 jugadores de `c00.png` están en
`content/players.json`. Las animaciones de las supertécnicas no vienen como
una hoja por técnica: el catálogo contiene nombre, tipo, elemento y potencia,
y el juego genera el efecto visual según la técnica.

`audio/` contiene las 56 pistas del ZIP y `ui/` contiene sus 93 recursos
visuales, incluidos escudos, fondos, ilustraciones y la fuente pixel. El audio
se controla desde `src/audio.js`; el catálogo de jugadores/equipos se carga
desde `content/player-catalog.json`.

El menú principal incluye gacha de jugadores y mejoras persistentes de potencia,
velocidad y vitalidad. Se guardan localmente en el navegador.

Para añadir otro sprite autorizado, coloca una hoja PNG horizontal en esta
carpeta y pásala a `createSprites` desde `src/main.js`:

```js
createSprites({ player: 'assets/player.png' });
```

Registra siempre en `docs/asset-inventory.md` la fuente, autor, permiso,
licencia, atribución, tamaño de frame, fila y número de frames. El ZIP ha sido
proporcionado para este proyecto, pero la procedencia original de los recursos
debe conservarse documentada.
