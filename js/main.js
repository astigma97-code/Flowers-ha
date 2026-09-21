/* ════════════════════════════════════════════════════════════
   main.js — arranque
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $ } = window.Cielo;

/* nombre: por enlace (?para=Valeria) o por config.js */
const nombre = (new URLSearchParams(location.search).get('para') || window.CIELO_CONFIG.nombre || '').trim().slice(0, 40);

/* grano de película: se pinta una vez en un canvas pequeño y se repite como fondo */
function grano() {
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const g = c.getContext('2d'), id = g.createImageData(180, 180);
  for (let i = 0; i < id.data.length; i += 4) {
    id.data[i] = id.data[i + 1] = id.data[i + 2] = (Math.random() * 255) | 0;
    id.data[i + 3] = (Math.random() * 46) | 0;
  }
  g.putImageData(id, 0, 0);
  $('#grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
}

grano();
window.Cielo.Flora.construir();
window.Cielo.Espacio.iniciar();
window.Cielo.Interaccion.iniciar();
window.Cielo.Frases.iniciar(nombre);
window.Cielo.Audio.iniciar();
})();
