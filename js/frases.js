/* ════════════════════════════════════════════════════════════
   frases.js — las palabras de la derecha
   · Lee data/frases.json. Si el navegador lo bloquea (archivo abierto con
     doble clic) usa js/respaldo.js, que server.py genera desde ese JSON.
   · Las frases con {nombre} solo salen cuando hay nombre.
   · "Rack focus": cada palabra pasa de borrosa a nítida.
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $, clamp, REDUCE } = window.Cielo;
const CFG = window.CIELO_CONFIG;
const inicio = performance.now();

const valido = d => d && Array.isArray(d.frases) && d.frases.length > 0 &&
  d.frases.every(f => typeof f === 'string' && f.trim()) &&
  ['firma', 'firmaConNombre', 'fecha'].every(k => typeof d[k] === 'string');

async function cargar() {
  if (location.protocol !== 'file:') {                          // con doble clic el navegador bloquea fetch: se va directo al respaldo
    try {
      const r = await fetch('data/frases.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      if (valido(d)) return d;
      console.warn('data/frases.json no tiene el formato esperado; se usa el respaldo.');
    } catch (e) { /* sin red o archivo ausente: se usa el respaldo */ }
  }
  return window.CIELO_RESPALDO;
}

async function iniciar(nombre) {
  const datos = await cargar();
  if (!valido(datos)) { console.error('No hay frases disponibles.'); return; }

  const firma = (nombre ? datos.firmaConNombre : datos.firma).split('{nombre}').join(nombre);
  $('#firma').textContent = firma;
  document.title = nombre ? firma + ' · ' + datos.fecha : datos.fecha;

  const frases = datos.frases
    .filter(t => nombre || !t.includes('{nombre}'))
    .map(t => t.split('{nombre}').join(nombre));

  const fraseEl = $('#frase'), srEl = $('#frase-sr');
  let idx = -1;

  function construir(text) {
    fraseEl.textContent = '';
    const words = text.split(/\s+/).filter(Boolean);
    words.forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w;
      fraseEl.appendChild(s); fraseEl.appendChild(document.createTextNode(' '));
    });
    return words.length;
  }
  function siguiente() {
    idx = (idx + 1) % frases.length;
    const text = frases[idx], n = construir(text);
    srEl.textContent = text;
    fraseEl.classList.remove('out'); void fraseEl.offsetWidth; fraseEl.classList.add('in');
    const entra = 1500 + n * 95, pausa = clamp(3800 + n * 330, CFG.pausaMin, CFG.pausaMax);
    if (!REDUCE && idx > 0 && Math.random() < .45) setTimeout(() => window.Cielo.Espacio.disparar(), 700);   // a veces cruza una estrella al cambiar
    setTimeout(sale, entra + pausa);
  }
  function sale() {
    fraseEl.classList.remove('in'); void fraseEl.offsetWidth; fraseEl.classList.add('out');
    setTimeout(siguiente, 1300);
  }

  setTimeout(siguiente, Math.max(0, CFG.primeraFraseMs - (performance.now() - inicio)));
}

window.Cielo.Frases = { iniciar };
})();
