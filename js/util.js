/* ════════════════════════════════════════════════════════════
   util.js — utilidades compartidas
   Crea el espacio de nombres global `Cielo`, donde cada archivo
   registra su parte (Flora, Espacio, Interaccion, Frases).
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const pick = arr => arr[(Math.random() * arr.length) | 0];

/* generador pseudoaleatorio con semilla: la flor y las estrellas salen siempre iguales */
const mulberry = seed => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = R => Math.sqrt(-2 * Math.log(R() + 1e-9)) * Math.cos(TAU * R());

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.Cielo = { $, TAU, rand, clamp, lerp, pick, mulberry, gauss, REDUCE };
})();
