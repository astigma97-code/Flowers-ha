/* ════════════════════════════════════════════════════════════
   flora.js — la flor, el pasto y las luciérnagas
   Todo se genera en SVG (tallo, hojas, pétalos, pasto) y en divs
   con transform (luciérnagas), que son baratos para la GPU.
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $, TAU, mulberry } = window.Cielo;

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const f1 = n => Math.round(n * 10) / 10;

function construir() {
  const R = mulberry(2109);
  const CX = 300, CY = 1252, RAD = 700;                       // el planeta: círculo enorme, solo se ve su horizonte
  const groundY = x => CY - Math.sqrt(Math.max(0, RAD * RAD - (x - CX) * (x - CX)));

  /* hojas */
  const hojas = $('#hojas');
  [
    { b: [301, 474], t: [150, 476], w: 38, arch: .17, d: .00 },
    { b: [307, 398], t: [468, 404], w: 34, arch: .15, d: .55 },
    { b: [299, 530], t: [376, 508], w: 15, arch: .10, d: .20 },
    { b: [299, 516], t: [232, 496], w: 13, arch: .10, d: .35 }
  ].forEach(l => {
    const [bx, by] = l.b, [tx, ty] = l.t;
    const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
    let nx = -dy / L, ny = dx / L;
    if (ny > 0) { nx = -nx; ny = -ny; }                        // normal siempre hacia arriba
    const a = l.arch * L;
    const P = (k, m) => `${f1(bx + dx * k + nx * m)} ${f1(by + dy * k + ny * m)}`;
    const g = svg('g', { class: 'hoja' }, hojas);
    g.style.setProperty('--d', l.d + 's');
    g.style.transformOrigin = `${bx}px ${by}px`;
    svg('path', {
      d: `M${bx} ${by}C${P(.28, l.w + a)},${P(.74, l.w * .82 + a * 1.3)},${tx} ${ty}C${P(.74, -l.w * .5 + a * 1.3)},${P(.28, -l.w * .62 + a)},${bx} ${by}Z`,
      fill: 'url(#gHoja)'
    }, g);
    svg('path', { d: `M${bx} ${by}Q${P(.5, a * 1.7)} ${tx} ${ty}`, fill: 'none', stroke: '#e6fff0', 'stroke-opacity': '.32', 'stroke-width': '1.3', 'stroke-linecap': 'round' }, g);
  });

  /* pétalos: 5 capas de afuera hacia adentro */
  const gPet = $('#petalos');
  [
    { n: 13, L: 132, w: 35, g: 'url(#gP1)', off: 0,  dl: .00 },
    { n: 11, L: 110, w: 33, g: 'url(#gP2)', off: .5, dl: .14 },
    { n: 9,  L: 88,  w: 30, g: 'url(#gP3)', off: .25, dl: .28 },
    { n: 7,  L: 64,  w: 26, g: 'url(#gP4)', off: .6, dl: .42 },
    { n: 5,  L: 40,  w: 18, g: 'url(#gP5)', off: .1, dl: .56 }
  ].forEach(c => {
    for (let i = 0; i < c.n; i++) {
      const ang = ((i + c.off) / c.n) * 360 + (R() - .5) * 8;
      const L = c.L * (1 + (R() - .5) * .10), w = c.w * (1 + (R() - .5) * .12), sk = 1 + (R() - .5) * .16;
      const rot = svg('g', { transform: `rotate(${f1(ang)})` }, gPet);
      const p = svg('g', { class: 'p' }, rot);
      p.style.setProperty('--d', (c.dl + i * .04).toFixed(2) + 's');
      svg('path', {
        d: `M0 0C${f1(-w * 1.05 * sk)} ${f1(-L * .16)},${f1(-w)} ${f1(-L * .74)},0 ${f1(-L)}C${f1(w)} ${f1(-L * .74)},${f1(w * 1.05 / sk)} ${f1(-L * .16)},0 0Z`,
        fill: c.g, stroke: '#fff', 'stroke-opacity': '.26', 'stroke-width': '.8'
      }, p);
      svg('path', { d: `M0 ${f1(-L * .07)}L0 ${f1(-L * .8)}`, stroke: '#fff', 'stroke-opacity': '.2', 'stroke-width': '.9', fill: 'none' }, p);
    }
  });
  /* corazón dorado + estambres */
  const centro = svg('g', {}, gPet);
  svg('circle', { r: 14, fill: 'url(#gCentro)' }, centro);
  for (let i = 0; i < 22; i++) {
    const a = R() * TAU, r = 12 + R() * 34, x = Math.cos(a) * r, y = Math.sin(a) * r;
    svg('path', { d: `M0 0Q${f1(x * .4 + (R() - .5) * 8)} ${f1(y * .4 + (R() - .5) * 8)} ${f1(x)} ${f1(y)}`, fill: 'none', stroke: '#ffd88a', 'stroke-opacity': '.75', 'stroke-width': '.9' }, centro);
    svg('circle', { cx: f1(x), cy: f1(y), r: f1(1.6 + R() * 1.8), fill: '#fff3bd' }, centro);
  }

  /* pasto */
  const blades = (parent, n, x0, x1, hMin, hMax, cols, wMin, wMax, bendK) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * R(), y = groundY(x);
      const nx = (x - CX) / RAD, ny = (y - CY) / RAD, tx = -ny, ty = nx;   // normal (hacia afuera) y tangente
      const h = hMin + (hMax - hMin) * Math.pow(R(), 1.4), w = wMin + (wMax - wMin) * R();
      const bend = (R() - .5) * 2 * h * bendK;
      const bx = x - nx * 2, by = y - ny * 2;
      const ex = x + nx * h + tx * bend, ey = y + ny * h + ty * bend;
      const cx = x + nx * h * .55 + tx * bend * .25, cy = y + ny * h * .55 + ty * bend * .25;
      svg('path', {
        d: `M${f1(bx - tx * w)} ${f1(by - ty * w)}Q${f1(cx - tx * w * .5)} ${f1(cy - ty * w * .5)} ${f1(ex)} ${f1(ey)}Q${f1(cx + tx * w * .5)} ${f1(cy + ty * w * .5)} ${f1(bx + tx * w)} ${f1(by + ty * w)}Z`,
        fill: cols[(R() * cols.length) | 0]
      }, parent);
    }
  };
  const fondo = $('#pasto-fondo'), frente = $('#pasto-frente');
  blades(fondo, 260, -140, 740, 8, 22, ['#0a5a3f', '#0c6b48', '#0e7a52'], 1.6, 3, .5);
  blades(frente, 150, -110, 710, 10, 30, ['#17a862', '#20bf72', '#1a9f5f'], 1.8, 3.4, .5);
  blades(frente, 64, 258, 344, 22, 58, ['#3fe08d', '#5df0a6', '#2bce7c', '#9af8bf'], 1.6, 3.2, .35);
  blades(frente, 90, -100, 700, 6, 16, ['#5cf0a6', '#8bf7b8', '#3fe08d'], 1.4, 2.4, .5);
  const glow = ['#ffd1ec', '#a5fff0', '#ffe9a8', '#ffb3dd'];
  for (let i = 0; i < 16; i++) {
    const x = -80 + R() * 760, y = groundY(x) - (3 + R() * 10), col = glow[i % 4];
    svg('circle', { cx: f1(x), cy: f1(y), r: f1(5 + R() * 6), fill: col, 'fill-opacity': '.14' }, frente);
    svg('circle', { cx: f1(x), cy: f1(y), r: f1(1.2 + R() * 1.4), fill: col, 'fill-opacity': '.95' }, frente);
  }

  /* luciérnagas y polen (div + transform: baratos para la GPU) */
  const luces = $('#luces');
  for (let i = 0; i < 20; i++) {
    const polen = i >= 13, d = document.createElement('i');
    d.className = 'fly';
    d.style.cssText = `--x:${(8 + R() * 82).toFixed(1)}%;--y:${(14 + R() * 58).toFixed(1)}%;--s:${(polen ? 3 + R() * 3 : 6 + R() * 6).toFixed(1)}px;` +
      `--t:${(9 + R() * 10).toFixed(1)}s;--dl:${(-R() * 15).toFixed(1)}s;--dx:${((R() - .5) * 90).toFixed(0)}px;--dy:${(-40 - R() * 120).toFixed(0)}px`;
    luces.appendChild(d);
  }
  setTimeout(() => luces.classList.add('on'), 6500);
}

window.Cielo.Flora = { construir };
})();
