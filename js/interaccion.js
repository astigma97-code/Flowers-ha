/* ════════════════════════════════════════════════════════════
   interaccion.js — parallax con el puntero y "pide un deseo"
   · mover el puntero desplaza suavemente flor, frases y cielo
   · tocar el cielo lanza una estrella fugaz
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $, rand, REDUCE } = window.Cielo;

function iniciar() {
  const E = window.Cielo.Espacio;
  const floraEl = $('#flora'), versoEl = $('#verso'), hintEl = $('#hint');

  window.addEventListener('pointermove', e => {
    E.mirar((e.clientX / window.innerWidth - .5) * 2, (e.clientY / window.innerHeight - .5) * 2);
  }, { passive: true });

  let hintOff = false;
  function ocultarAviso() {
    if (hintOff) return; hintOff = true;
    const o = getComputedStyle(hintEl).opacity;
    hintEl.style.animation = 'none'; hintEl.style.opacity = o; void hintEl.offsetWidth;
    hintEl.style.transition = 'opacity .9s ease'; hintEl.style.opacity = '0';
  }

  window.addEventListener('pointerdown', e => {
    if (REDUCE) return;
    const dir = Math.random() < .5 ? 1 : -1;
    E.disparar({ x: e.clientX - dir * 60, y: e.clientY - 40, dir, ang: rand(.4, .6), speed: rand(1100, 1500), life: .95, len: 260, w: 2.2 });
    ocultarAviso();
  }, { passive: true });

  /* parallax: la flor y las frases se mueven en sentidos opuestos al cielo */
  let lpx = 0, lpy = 0;
  E.alFotograma = (mx, my) => {
    if (Math.abs(mx - lpx) < .0008 && Math.abs(my - lpy) < .0008) return;
    lpx = mx; lpy = my;
    floraEl.style.transform = `translate3d(${(-mx * 9).toFixed(2)}px,${(-my * 5).toFixed(2)}px,0)`;
    versoEl.style.setProperty('--px', (mx * 7).toFixed(2) + 'px');
    versoEl.style.setProperty('--py', (my * 4).toFixed(2) + 'px');
  };
}

window.Cielo.Interaccion = { iniciar };
})();
