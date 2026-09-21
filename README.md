# 21 de septiembre

Una flor sobre un planeta verde a la izquierda, el universo entero de fondo (planetas en movimiento, estrellas fugaces, cometas, novas, lluvias de meteoros) y frases que cambian solas a la derecha, dirigidas a una persona. Sin barra de navegación: una sola escena.

## Estructura

```
index.html            HTML   · marcado de la escena
css/styles.css        CSS    · cámara, flor, frases, bandas de cine, grano, móviles
js/util.js            JS     · utilidades y espacio de nombres `Cielo`
js/config.js          JS     · nombre y tiempos (lo único que se toca en el código)
js/respaldo.js        JS     · copia de las frases (la genera server.py)
js/flora.js           JS     · flor, pasto y luciérnagas en SVG
js/espacio.js         JS     · motor del cielo en <canvas>
js/interaccion.js     JS     · parallax con el puntero y "pide un deseo"
js/frases.js          JS     · carga y animación de las frases
js/audio.js           JS     · música de fondo en bucle
js/main.js            JS     · arranque
data/frases.json      JSON   · las frases, la firma y la fecha
assets/favicon.svg    SVG    · ícono de la pestaña
assets/musica.mp3     MP3    · música de fondo
server.py             Python · servidor local y sincronizador del respaldo
.nojekyll                    · para GitHub Pages (sirve la carpeta tal cual)
```

## Abrirla

- **Doble clic en `index.html`.** Funciona, usando las frases de `js/respaldo.js`.
- **Con servidor** (lee `data/frases.json` en vivo):

  ```
  python3 server.py --para Valeria --abrir
  ```

  Con `--red` también se abre desde otro dispositivo de la misma Wi-Fi; el script imprime la dirección. Funciona igual en Termux (`pkg install python`).

## Personalizar

- **Nombre:** enlace `index.html?para=Valeria`, o `nombre` en `js/config.js`. Con nombre cambia la firma ("Para Valeria") y entran las frases que contienen `{nombre}`.
- **Frases:** edita `data/frases.json`. Van en orden y vuelven a empezar. Las que llevan `{nombre}` solo salen si hay nombre. Conviene no pasar de unas 85 letras.
- Después de editar el JSON, ejecuta `python3 server.py --sync` para que la versión de doble clic también se actualice. Al arrancar el servidor esto se hace solo.
- **Ritmo:** `primeraFraseMs`, `pausaMin` y `pausaMax` en `js/config.js`.
- **Música:** reemplaza `assets/musica.mp3` por otro archivo con el mismo nombre. El
  volumen (`volumen`, de 0 a 1) y la suavidad de entrada (`fundidoMs`) están en `js/config.js`.

## La música

`assets/musica.mp3` empieza sola al abrir la página y se repite en bucle.

Los navegadores no dejan que una página suene sin que la persona toque antes algo,
así que la pista arranca **en silencio** (el bucle ya va en hora) y se oye en cuanto
haya un toque, clic o tecla —el mismo toque que lanza una estrella fugaz—. En el
escritorio suele sonar de inmediato. El botón de abajo a la derecha la silencia.

## Publicarla

Sube la carpeta completa (no solo `index.html`) a Netlify Drop, GitHub Pages o cualquier
hosting estático. No necesita `server.py` ni compilar nada.

### GitHub Pages, paso a paso

1. Crea un repositorio nuevo (público) en GitHub.
2. Sube **todo el contenido de esta carpeta** manteniendo las subcarpetas
   (`css/`, `js/`, `data/`, `assets/`). Con «Add file → Upload files» puedes arrastrar
   la carpeta entera; GitHub conserva la estructura.
3. En el repositorio: **Settings → Pages → Source: Deploy from a branch**, rama `main`,
   carpeta `/ (root)`, y **Save**.
4. En uno o dos minutos la dirección queda en `https://TU-USUARIO.github.io/TU-REPO/`.
   Con nombre: `https://TU-USUARIO.github.io/TU-REPO/?para=Valeria`.

Detalles que ya están resueltos:

- Todas las rutas son relativas, así que funciona dentro de un subdirectorio
  (`/TU-REPO/`) sin tocar nada.
- `.nojekyll` evita que GitHub procese la carpeta con Jekyll.
- `data/frases.json` se lee en vivo por https; `js/respaldo.js` solo hace falta para el
  doble clic, pero conviene subirlo igual.
- El mp3 pesa ~11 MB: en la primera visita con datos móviles puede tardar. Si quieres
  que cargue antes, reemplázalo por una versión de menor bitrate con el mismo nombre.

## Detalles

- Respeta "reducir movimiento" del sistema: muestra un cuadro fijo y las frases con desvanecido simple.
- Si el equipo va lento, baja la calidad solo (menos estrellas y sin bokeh).
- Tocar el cielo lanza una estrella fugaz.
- La tipografía (Instrument Serif) viene de Google Fonts; sin conexión usa una serif del sistema.
