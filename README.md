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


