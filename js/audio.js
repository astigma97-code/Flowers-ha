/* ════════════════════════════════════════════════════════════
   audio.js — la música de fondo
   · Suena desde que abre la página y se repite en bucle sin cortes.
   · Los navegadores bloquean el sonido automático. Si eso pasa, la
     pista arranca en silencio (así el bucle ya va en hora) y se
     desmutea sola en el primer toque, clic o tecla de la persona.
   · El botón de abajo a la derecha permite silenciarla.
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $, clamp } = window.Cielo;
const CFG = window.CIELO_CONFIG || {};

const GESTOS = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'];

function iniciar() {
  const el = $('#musica'), btn = $('#sonido');
  if (!el) return;

  const VOL = clamp(typeof CFG.volumen === 'number' ? CFG.volumen : .65, 0, 1);
  const FADE = Math.max(0, typeof CFG.fundidoMs === 'number' ? CFG.fundidoMs : 2600);
  el.loop = true;
  el.volume = 0;

  let quiere = true;        // la persona quiere oírla
  let fadeId = 0;

  /* subida/bajada suave de volumen (evita el golpe seco al entrar).
     Con temporizador y no con requestAnimationFrame: si la pestaña arranca
     en segundo plano, rAF no corre y el volumen se quedaría en 0. */
  function fundir(destino, ms) {
    clearInterval(fadeId);
    const desde = el.volume, t0 = Date.now();
    if (!ms) { el.volume = clamp(destino, 0, 1); return; }
    fadeId = setInterval(() => {
      const k = clamp((Date.now() - t0) / ms, 0, 1);
      el.volume = clamp(desde + (destino - desde) * k, 0, 1);
      if (k >= 1) clearInterval(fadeId);
    }, 40);
  }

  function pintar() {
    if (!btn) return;
    const sonando = quiere && !el.muted;
    btn.classList.toggle('off', !sonando);
    btn.setAttribute('aria-pressed', String(sonando));
    btn.setAttribute('aria-label', sonando ? 'Silenciar la música' : 'Activar la música');
    btn.title = sonando ? 'Silenciar la música' : 'Activar la música';
  }

  const reproducir = () => Promise.resolve(el.play()).then(() => true, () => false);

  /* 1 · intento normal; 2 · si el navegador lo bloquea, en silencio; 3 · al primer gesto, sonido */
  async function arrancar() {
    el.muted = false;
    if (await reproducir()) { fundir(VOL, FADE); pintar(); return; }
    el.muted = true;
    await reproducir();                       // en silencio casi siempre se permite
    pintar();
    esperarGesto();
  }

  function esperarGesto() {
    const soltar = () => GESTOS.forEach(ev => window.removeEventListener(ev, alGesto, true));
    async function alGesto() {
      soltar();
      if (!quiere) return;
      el.muted = false;
      if (await reproducir()) fundir(VOL, 1200);
      else { el.muted = true; esperarGesto(); }   // aún bloqueado: se reintenta en el siguiente gesto
      pintar();
    }
    GESTOS.forEach(ev => window.addEventListener(ev, alGesto, { capture: true, passive: true }));
  }

  /* bucle a prueba de fallos: `loop` ya lo hace, esto cubre navegadores que igual disparan `ended` */
  el.addEventListener('ended', () => { el.currentTime = 0; if (quiere) el.play().catch(() => {}); });

  /* si el sistema la pausa (llamada, otra app, volver de otra pestaña), se retoma */
  const retomar = () => { if (quiere && el.paused && !document.hidden) el.play().catch(() => {}); };
  document.addEventListener('visibilitychange', retomar);
  window.addEventListener('focus', retomar);
  window.addEventListener('pageshow', retomar);

  if (btn) btn.addEventListener('click', e => {
    e.stopPropagation();
    quiere = !quiere;
    if (quiere) { el.muted = false; reproducir().then(ok => { if (ok) fundir(VOL, 600); pintar(); }); }
    else { fundir(0, 400); el.muted = true; pintar(); }
    pintar();
  });

  pintar();
  arrancar();
}

window.Cielo.Audio = { iniciar };
})();
