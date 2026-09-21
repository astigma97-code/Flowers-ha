/* ════════════════════════════════════════════════════════════
   espacio.js — el cielo: nebulosa, estrellas, planetas y eventos
   Motor en <canvas>. Expone Cielo.Espacio:
     iniciar()          arranca el bucle de animación
     disparar(opciones) lanza una estrella fugaz (sin opciones: aleatoria)
     mirar(nx, ny)      mueve la cámara con el puntero (-1 a 1)
     alFotograma        función opcional (mx, my) que se llama en cada fotograma
   ════════════════════════════════════════════════════════════ */
(() => {
'use strict';
const { $, TAU, rand, clamp, lerp, pick, mulberry, gauss, REDUCE } = window.Cielo;

/* ════════════════════════════════════════════════════════════
   ESPACIO — canvas: nebulosa, estrellas, planetas y eventos
   ════════════════════════════════════════════════════════════ */
const cv = $('#space');
const ctx = cv.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1, U = 1, portrait = false;
let T = 0, mx = 0, my = 0, tx = 0, ty = 0, lastPtr = -99;
let nebula = null, stars = [], bokeh = [], planets = [];
const perf = { ema: 16.7, dprMax: 2, low: false };
const SUN = { x: 0, y: 0 };
const LX = -.58, LY = -.68;                                   // la luz viene de arriba a la izquierda
const K = () => Math.max(.7, U / 1000);

/* — nebulosa (se pinta una vez en un buffer) — */
function puff(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
  g.addColorStop(.5, `rgba(${col[0]},${col[1]},${col[2]},${a * .4})`);
  g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function buildNebula() {
  const s = .5, w = Math.ceil(W * 1.3), h = Math.ceil(H * 1.3), M = Math.max(w, h), R = mulberry(7);
  nebula = document.createElement('canvas');
  nebula.width = Math.ceil(w * s); nebula.height = Math.ceil(h * s);
  const c = nebula.getContext('2d'); c.scale(s, s);
  c.globalCompositeOperation = 'lighter';
  [
    [.16, .34, .50, [128, 46, 190], .34],
    [.72, .20, .46, [34, 92, 205], .30],
    [.52, .74, .56, [205, 46, 138], .24],
    [.10, .90, .42, [22, 178, 160], .26],
    [.90, .66, .40, [96, 58, 214], .22],
    [.40, .06, .30, [255, 140, 90], .10]
  ].forEach(([bx, by, br, col, a]) => {
    puff(c, bx * w, by * h, br * M, col, a * .55);
    for (let i = 0; i < 46; i++) {
      const ang = R() * TAU, d = Math.pow(R(), .6) * br * M * .85;
      puff(c, bx * w + Math.cos(ang) * d, by * h + Math.sin(ang) * d * .8, (.08 + R() * .22) * br * M, col, a * (.05 + R() * .14));
    }
  });
  c.globalCompositeOperation = 'source-over';                  // vetas de polvo oscuro
  for (let i = 0; i < 14; i++) puff(c, R() * w, R() * h, (.05 + R() * .12) * M, [2, 1, 10], .10 + R() * .12);
}

/* — estrellas (tres capas de profundidad + banda de Vía Láctea) — */
const STAR_COLS = ['255,255,255', '196,214,255', '255,233,205', '255,205,232', '214,238,255'];
const LAYERS = [
  { r: [.35, .85], a: [.22, .6], d: .18, spd: .9 },
  { r: [.7, 1.3], a: [.4, .85], d: .5, spd: 2 },
  { r: [1.1, 2.1], a: [.7, 1], d: 1, spd: 3.8 }
];
function buildStars() {
  const R = mulberry(1234);
  const n = Math.round(clamp(W * H / 2200, 240, 1000));
  const ca = Math.cos(-.42), sa = Math.sin(-.42), sig = Math.min(W, H) * .17, diag = Math.hypot(W, H);
  stars = [];
  for (let i = 0; i < n; i++) {
    const q = R(), layer = q < .62 ? 0 : q < .9 ? 1 : 2;
    let x, y;
    if (layer < 2 && R() < .45) {
      const along = (R() - .5) * diag * 1.05, off = gauss(R) * sig;
      x = W / 2 + ca * along - sa * off; y = H / 2 + sa * along + ca * off;
      if (x < 0 || x > W || y < 0 || y > H) { x = R() * W; y = R() * H; }
    } else { x = R() * W; y = R() * H; }
    const L = LAYERS[layer];
    stars.push({
      x, y, r: lerp(L.r[0], L.r[1], R()), a: lerp(L.a[0], L.a[1], R()), d: L.d, spd: L.spd * (.7 + R() * .6),
      tw: .6 + R() * 2.4, ph: R() * TAU, fill: 'rgb(' + STAR_COLS[(R() * STAR_COLS.length) | 0] + ')', spike: layer === 2 && R() < .4
    });
  }
}
function drawStars() {
  const PAR = W * .02;
  for (let i = 0; i < stars.length; i++) {
    if (perf.low && (i & 1)) continue;
    const s = stars[i];
    let x = (s.x - T * s.spd - mx * PAR * s.d) % W; if (x < 0) x += W;
    let y = (s.y - T * s.spd * .12 - my * PAR * s.d * .6) % H; if (y < 0) y += H;
    const a = s.a * (.7 + .3 * Math.sin(T * s.tw + s.ph));
    ctx.fillStyle = s.fill; ctx.globalAlpha = a;
    if (s.r < 1.05) ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
    else {
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = a * .16; ctx.beginPath(); ctx.arc(x, y, s.r * 3.4, 0, TAU); ctx.fill();
      if (s.spike) { ctx.globalAlpha = a * .5; ctx.fillRect(x - s.r * 9, y - .35, s.r * 18, .7); ctx.fillRect(x - .35, y - s.r * 9, .7, s.r * 18); }
    }
  }
  ctx.globalAlpha = 1;
}

/* — bokeh de primer plano (profundidad de campo) — */
function buildBokeh() {
  const R = mulberry(99), cols = [[255, 170, 210], [150, 190, 255], [255, 210, 150], [170, 255, 230]];
  bokeh = Array.from({ length: portrait ? 7 : 13 }, () => ({
    x: R() * W, y: R() * H, r: (24 + R() * 70) * K(), a: .02 + R() * .04, col: cols[(R() * 4) | 0], sp: .5 + R() * 1.5, ph: R() * TAU, d: 1.6 + R()
  }));
}
function drawBokeh() {
  if (perf.low) return;
  const PAR = W * .02;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of bokeh) {
    let x = (b.x - T * b.sp * 4 - mx * PAR * b.d) % (W + 200); if (x < -100) x += W + 200;
    const y = b.y - my * PAR * b.d * .6, a = b.a * (.7 + .3 * Math.sin(T * .3 + b.ph)), c = b.col;
    ctx.fillStyle = radial(ctx, x, y, b.r, c, a);
    ctx.beginPath(); ctx.arc(x, y, b.r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function radial(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r), k = col.join(',');
  g.addColorStop(0, `rgba(${k},${a * .5})`); g.addColorStop(.82, `rgba(${k},${a * .9})`);
  g.addColorStop(.95, `rgba(${k},${a * 1.5})`); g.addColorStop(1, `rgba(${k},0)`);
  return g;
}

/* — rayos de luz solar (volumétricos) — */
const RAYS = [
  { ang: .52, wd: .10, a: .050, sp: .13, ph: 0 },
  { ang: .74, wd: .20, a: .035, sp: .09, ph: 2 },
  { ang: .34, wd: .06, a: .045, sp: .17, ph: 4 },
  { ang: .95, wd: .13, a: .030, sp: .11, ph: 1 }
];
function drawRays() {
  const L = Math.hypot(W, H) * 1.3;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const r of RAYS) {
    const al = r.a * (.7 + .3 * Math.sin(T * r.sp + r.ph));
    const g = ctx.createLinearGradient(SUN.x, SUN.y, SUN.x + Math.cos(r.ang) * L, SUN.y + Math.sin(r.ang) * L);
    g.addColorStop(0, `rgba(255,190,130,${al})`); g.addColorStop(.5, `rgba(255,170,150,${al * .35})`); g.addColorStop(1, 'rgba(255,170,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(SUN.x, SUN.y);
    ctx.lineTo(SUN.x + Math.cos(r.ang - r.wd / 2) * L, SUN.y + Math.sin(r.ang - r.wd / 2) * L);
    ctx.lineTo(SUN.x + Math.cos(r.ang + r.wd / 2) * L, SUN.y + Math.sin(r.ang + r.wd / 2) * L);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* — planetas — */
const PLAN_DEFS = [
  { id: 'lejano', z: 0, soft: true, alpha: .5, p: [.92, 1.04], r: .23, pp: [1.02, .56], rp: .17, depth: .25, amp: [.006, .004], sp: [.03, .04], ph: 1.1,
    pal: ['#8aa0ee', '#4c62b6', '#243482', '#0a1032'], bands: 5, bandCols: ['#a9b8ff', '#3a4c9c', '#6a7fd0'] },
  { id: 'gigante', z: 3, p: [.47, .19], r: .095, pp: [.74, .43], rp: .115, depth: .6, amp: [.014, .009], sp: [.06, .05], ph: .4, spin: .06, tilt: -.32,
    pal: ['#ffe6bf', '#f2ab76', '#c6664f', '#4d2040'], atm: '255,190,140', atmA: .35,
    bands: 10, bandCols: ['#fff1d6', '#e8935e', '#b0524b', '#ffd8a0', '#8c3d49'], spots: 3, spotCol: '#fff0d8',
    ring: { tilt: -.32, sq: .27, bands: [[1.32, 1.52, .34, '236,206,170'], [1.56, 1.88, .5, '240,216,184'], [1.94, 2.08, .28, '222,192,162'], [2.14, 2.32, .16, '210,180,150']] },
    moons: [{ d: 2.75, r: .15, sp: .42, ph: .8 }] },
  { id: 'oxido', z: 2, p: [.895, .125], r: .046, pp: [.14, .36], rp: .055, depth: .9, amp: [.008, .01], sp: [.08, .07], ph: 2.2, spin: .16,
    pal: ['#ffb58e', '#d9603f', '#8f2c30', '#2b0e1e'], atm: '255,140,110', atmA: .3, spots: 9, spotCol: '#5b1a26',
    moons: [{ d: 1.9, r: .18, sp: .9, ph: 0 }, { d: 2.6, r: .11, sp: .55, ph: 2.4 }] },
  { id: 'hielo', z: 2, p: [.64, .74], r: .031, pp: [.84, .53], rp: .04, depth: 1, amp: [.01, .008], sp: [.07, .09], ph: 3.1, spin: .2,
    pal: ['#eaffff', '#93e0f2', '#3f8fc2', '#10285a'], atm: '150,225,255', atmA: .4, bands: 4, bandCols: ['#ffffff', '#7fc8e6'], spots: 4, spotCol: '#ffffff' },
  { id: 'luna', z: 1, p: [.965, .665], r: .017, pp: [.9, .335], rp: .022, depth: 1.1, amp: [.004, .006], sp: [.1, .08], ph: .6, spin: .1,
    pal: ['#f5f2ff', '#bdb8d6', '#726d94', '#221f3a'], spots: 8, spotCol: '#5e5a7c' },
  { id: 'lila', z: 1, p: [.075, .44], r: .023, pp: [.1, .5], rp: .03, depth: 1, amp: [.006, .009], sp: [.09, .06], ph: 4.2, spin: .12,
    pal: ['#f6dcff', '#c48fea', '#7c50b8', '#26144a'], atm: '220,170,255', atmA: .3, bands: 4, bandCols: ['#fff0ff', '#a26ad8'] },
  { id: 'dorado', z: 1, p: [.33, .085], r: .012, pp: [.5, .315], rp: .016, depth: .8, amp: [.004, .004], sp: [.05, .06], ph: 5, spin: .1,
    pal: ['#fff7d6', '#ffd97e', '#d29a3d', '#4a2f12'] },
  { id: 'oscuro', z: 9, soft: true, alpha: .92, p: [-.012, -.01], r: .25, pp: [.02, 0], rp: .3, depth: 1.5, amp: [.006, .005], sp: [.035, .03], ph: .9,
    pal: ['#6b46b0', '#3a2278', '#1a0f40', '#060316'], bands: 6, bandCols: ['#8a63d0', '#2a1a60', '#4b30a0'] }
];

function drawBody(c, P, x, y, r, t) {
  c.save();
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip();
  let g = c.createRadialGradient(x + LX * r * .5, y + LY * r * .5, r * .03, x + LX * r * .5, y + LY * r * .5, r * 1.45);
  g.addColorStop(0, P.pal[0]); g.addColorStop(.4, P.pal[1]); g.addColorStop(.75, P.pal[2]); g.addColorStop(1, P.pal[3]);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  if (P.bandsL.length) {                                        // bandas (gigantes gaseosos)
    c.save(); c.translate(x, y); c.rotate(P.tilt || 0);
    for (const b of P.bandsL) { c.globalAlpha = b.a; c.fillStyle = b.c; c.fillRect(-r * 1.2, b.y * r - b.h * r / 2, r * 2.4, b.h * r); }
    c.restore();
  }
  const rot = t * (P.spin || 0);                                // manchas que giran con el planeta
  for (const s of P.spotsL) {
    const lon = s.lon + rot, cl = Math.cos(lon);
    if (cl <= .05) continue;
    const ry = Math.max(.6, s.s * r * Math.max(.35, Math.cos(s.lat))), rx = Math.max(.6, ry * cl);
    c.globalAlpha = s.a * cl; c.fillStyle = P.spotCol;
    c.beginPath(); c.ellipse(x + Math.cos(s.lat) * Math.sin(lon) * r, y + Math.sin(s.lat) * r, rx, ry, 0, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  g = c.createRadialGradient(x + LX * r * .45, y + LY * r * .45, r * .05, x + LX * r * .45, y + LY * r * .45, r * 1.5);   // sombra del terminador
  g.addColorStop(0, 'rgba(2,0,12,0)'); g.addColorStop(.5, 'rgba(2,0,12,.04)'); g.addColorStop(.72, 'rgba(2,0,12,.5)');
  g.addColorStop(.92, 'rgba(2,0,12,.9)'); g.addColorStop(1, 'rgba(2,0,12,.96)');
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}
function makeSoft(P) {                                          // planetas fuera de foco: sprite con borde difuso
  const r = P.rr * U, S = Math.ceil((r + Math.ceil(r * .2)) * 2);
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  drawBody(g, P, S / 2, S / 2, r, 0);
  g.globalCompositeOperation = 'destination-in';
  const f = g.createRadialGradient(S / 2, S / 2, r * .78, S / 2, S / 2, r);
  f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = f; g.fillRect(0, 0, S, S);
  P.sprite = c;
}
function layoutPlanets() {
  const R = mulberry(77);
  planets = PLAN_DEFS.map(d => {
    const P = Object.assign({}, d), pos = portrait ? d.pp : d.p;
    P.bx = pos[0]; P.by = pos[1]; P.rr = portrait ? d.rp : d.r; P.bandsL = []; P.spotsL = [];
    for (let i = 0; i < (d.bands || 0); i++) P.bandsL.push({ y: R() * 2 - 1, h: .05 + R() * .16, c: d.bandCols[(R() * d.bandCols.length) | 0], a: .14 + R() * .22 });
    for (let i = 0; i < (d.spots || 0); i++) P.spotsL.push({ lon: R() * TAU, lat: R() * 2 - 1, s: .07 + R() * .15, a: .22 + R() * .3 });
    if (d.soft) makeSoft(P);
    return P;
  }).sort((a, b) => a.z - b.z);
}
function drawAtm(P, x, y, r) {
  if (!P.atm) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x + LX * r * .10, y + LY * r * .10, r * .97, x + LX * r * .14, y + LY * r * .14, r * 1.22);
  g.addColorStop(0, `rgba(${P.atm},0)`); g.addColorStop(.2, `rgba(${P.atm},${P.atmA})`); g.addColorStop(1, `rgba(${P.atm},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, TAU); ctx.fill(); ctx.restore();
}
function drawRing(P, x, y, r, front) {
  const R = P.ring;
  ctx.save(); ctx.translate(x, y); ctx.rotate(R.tilt); ctx.scale(1, R.sq);
  for (const [a, b, al, col] of R.bands) {
    ctx.beginPath();
    if (front) { ctx.arc(0, 0, b * r, 0, Math.PI); ctx.arc(0, 0, a * r, Math.PI, 0, true); }
    else { ctx.arc(0, 0, b * r, Math.PI, TAU); ctx.arc(0, 0, a * r, TAU, Math.PI, true); }
    ctx.closePath(); ctx.fillStyle = `rgba(${col},${al})`; ctx.fill();
  }
  ctx.restore();
}
function sphere(x, y, r) {
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .05, x - r * .15, y - r * .15, r * 1.25);
  g.addColorStop(0, '#f6f2ff'); g.addColorStop(.4, '#aaa4c6'); g.addColorStop(.8, '#4b466a'); g.addColorStop(1, '#0c0a1c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Math.max(.8, r), 0, TAU); ctx.fill();
}
function drawPlanet(P, x, y, r) {
  if (P.soft) { ctx.globalAlpha = P.alpha; ctx.drawImage(P.sprite, x - P.sprite.width / 2, y - P.sprite.height / 2); ctx.globalAlpha = 1; return; }
  const sq = P.ring ? P.ring.sq : .3, tl = P.ring ? P.ring.tilt : -.2;
  const moons = (P.moons || []).map(m => {
    const a = T * m.sp + m.ph, ox = Math.cos(a) * m.d * r, oy = Math.sin(a) * m.d * r * sq;
    return { x: x + ox * Math.cos(tl) - oy * Math.sin(tl), y: y + ox * Math.sin(tl) + oy * Math.cos(tl), r: m.r * r, front: Math.sin(a) > 0 };
  });
  if (P.ring) drawRing(P, x, y, r, false);
  moons.forEach(m => { if (!m.front) sphere(m.x, m.y, m.r); });
  drawBody(ctx, P, x, y, r, T);
  drawAtm(P, x, y, r);
  if (P.ring) drawRing(P, x, y, r, true);
  moons.forEach(m => { if (m.front) sphere(m.x, m.y, m.r); });
}
function drawPlanets() {
  const PAR = W * .02;
  for (const P of planets) {
    const amp = REDUCE ? 0 : 1;
    const x = P.bx * W + Math.cos(T * P.sp[0] + P.ph) * P.amp[0] * U * amp - mx * PAR * P.depth;
    const y = P.by * H + Math.sin(T * P.sp[1] + P.ph * 1.3) * P.amp[1] * U * amp - my * PAR * P.depth * .6;
    const r = P.rr * U;
    if (x + r * 2.4 < 0 || x - r * 2.4 > W || y + r * 2.4 < 0 || y - r * 2.4 > H) continue;
    drawPlanet(P, x, y, r);
  }
}

/* — eventos: estrellas fugaces, cometas, novas, lluvia de meteoros — */
const fx = { shoot: [], comets: [], novas: [], parts: [], queue: [] };
let nextShoot = 7.5, nextComet = 16, nextNova = 24, nextShower = 48;

function spawnShoot(o = {}) {
  const dir = o.dir !== undefined ? o.dir : (Math.random() < .5 ? -1 : 1), ang = o.ang !== undefined ? o.ang : rand(.32, .7);
  const sp = (o.speed !== undefined ? o.speed : rand(950, 1500)) * K();
  fx.shoot.push({
    x: o.x !== undefined ? o.x : rand(dir > 0 ? -.05 : .35, dir > 0 ? .65 : 1.05) * W,
    y: o.y !== undefined ? o.y : rand(-.05, .42) * H,
    vx: dir * Math.cos(ang) * sp, vy: Math.sin(ang) * sp, age: 0,
    life: o.life !== undefined ? o.life : rand(.65, 1.05), len: (o.len !== undefined ? o.len : rand(140, 300)) * K(),
    w: o.w !== undefined ? o.w : rand(1.3, 2.4), hue: Math.random() < .7 ? '255,255,255' : pick(['190,225,255', '255,215,180'])
  });
}
function spawnShower() {
  const dir = Math.random() < .5 ? 1 : -1, ang = rand(.42, .62), n = 9 + ((Math.random() * 5) | 0);
  for (let i = 0; i < n; i++) {
    fx.queue.push({ t: T + rand(0, 3.2), o: {
      dir, ang: ang + rand(-.04, .04), x: rand(dir > 0 ? -.05 : .3, dir > 0 ? .7 : 1.05) * W, y: rand(-.08, .25) * H,
      speed: rand(1000, 1700), len: rand(120, 260), life: rand(.55, .95), w: rand(1, 2.2)
    } });
  }
}
function spawnComet() {
  const fromLeft = Math.random() < .5, sp = rand(95, 150) * K(), ang = rand(.10, .32);
  const c = { x: fromLeft ? -120 : W + 120, y: rand(.10, .55) * H, vx: (fromLeft ? 1 : -1) * Math.cos(ang) * sp, vy: Math.sin(ang) * sp, age: 0, r: rand(3.2, 5.2) * K(), acc: 0 };
  c.life = (W + 300) / Math.abs(c.vx);
  fx.comets.push(c);
}
function spawnNova() {
  fx.novas.push({ x: rand(.08, .92) * W, y: rand(.06, .6) * H, age: 0, life: 5.2, size: rand(.7, 1.1) * K() });
}
const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

function stepFx(dt) {
  if (REDUCE) return;
  if (T > nextShoot) { spawnShoot(); nextShoot = T + rand(3.6, 8.5); }
  if (T > nextComet) { spawnComet(); nextComet = T + rand(38, 70); }
  if (T > nextNova) { spawnNova(); nextNova = T + rand(28, 48); }
  if (T > nextShower) { spawnShower(); nextShower = T + rand(70, 110); }
  for (let i = fx.queue.length - 1; i >= 0; i--) if (T >= fx.queue[i].t) { spawnShoot(fx.queue[i].o); fx.queue.splice(i, 1); }
  for (let i = fx.shoot.length - 1; i >= 0; i--) {
    const s = fx.shoot[i]; s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.age > s.life) fx.shoot.splice(i, 1);
  }
  for (let i = fx.novas.length - 1; i >= 0; i--) { const n = fx.novas[i]; n.age += dt; if (n.age > n.life) fx.novas.splice(i, 1); }
  for (let i = fx.comets.length - 1; i >= 0; i--) {
    const c = fx.comets[i]; c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt;
    const back = norm(-c.vx, -c.vy), away = norm(c.x - SUN.x, c.y - SUN.y), d = norm(back[0] + away[0] * .25, back[1] + away[1] * .25);
    c.acc += dt * 90;
    while (c.acc >= 1) {
      c.acc -= 1;
      if (fx.parts.length < 320) fx.parts.push({
        x: c.x + rand(-.5, .5) * c.r, y: c.y + rand(-.5, .5) * c.r, vx: d[0] * rand(10, 45) + rand(-8, 8), vy: d[1] * rand(10, 45) + rand(-8, 8),
        age: 0, life: rand(1.4, 2.8), s: rand(.6, 1.7), col: pick(['160,220,255', '255,220,170', '255,255,255'])
      });
    }
    if (c.age > c.life) fx.comets.splice(i, 1);
  }
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.age > p.life) fx.parts.splice(i, 1);
  }
}
function tail(x, y, d, len, w, col, a, curve) {
  const px = -d[1], py = d[0], ex = x + d[0] * len + px * curve * len, ey = y + d[1] * len + py * curve * len;
  const cx = x + d[0] * len * .55, cy = y + d[1] * len * .55;
  const g = ctx.createLinearGradient(x, y, ex, ey);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.35, `rgba(${col},${a * .4})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + px * w, y + py * w);
  ctx.quadraticCurveTo(cx + px * w * 2.2, cy + py * w * 2.2, ex, ey);
  ctx.quadraticCurveTo(cx - px * w * 2.2, cy - py * w * 2.2, x - px * w, y - py * w);
  ctx.closePath(); ctx.fill();
}
function drawFx() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const n of fx.novas) {                                   // nova: destello anamórfico
    const k = n.age / n.life, env = Math.pow(Math.sin(k * Math.PI), 2), s = n.size, x = n.x, y = n.y;
    const rad = 80 * s * env + 3, Lh = 340 * s * env, Lv = 120 * s * env;
    let g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,255,255,${env})`); g.addColorStop(.25, `rgba(190,215,255,${.55 * env})`); g.addColorStop(1, 'rgba(120,150,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
    g = ctx.createLinearGradient(x - Lh, 0, x + Lh, 0);
    g.addColorStop(0, 'rgba(160,200,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.9 * env})`); g.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - Lh, y - 1.2 * env - .3, Lh * 2, 2.4 * env + .6);
    g = ctx.createLinearGradient(0, y - Lv, 0, y + Lv);
    g.addColorStop(0, 'rgba(160,200,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.7 * env})`); g.addColorStop(1, 'rgba(160,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - .9 * env - .3, y - Lv, 1.8 * env + .6, Lv * 2);
    ctx.strokeStyle = `rgba(200,220,255,${.35 * (1 - k) * env})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, k * 190 * s, 0, TAU); ctx.stroke();
    g = ctx.createLinearGradient(x - W * .45, 0, x + W * .45, 0);
    g.addColorStop(0, 'rgba(120,190,255,0)'); g.addColorStop(.5, `rgba(120,190,255,${.07 * env})`); g.addColorStop(1, 'rgba(120,190,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - W * .45, y - 1, W * .9, 2);
  }
  for (const c of fx.comets) {                                  // cometa: cola de iones (azul) + cola de polvo (dorada)
    const env = Math.min(1, c.age / 1.5, (c.life - c.age) / 1.5), k = K();
    const back = norm(-c.vx, -c.vy), away = norm(c.x - SUN.x, c.y - SUN.y);
    const ion = norm(back[0] + away[0] * .25, back[1] + away[1] * .25), dust = norm(back[0] + away[0] * .05, back[1] + away[1] * .05);
    tail(c.x, c.y, ion, 430 * k, c.r * 1.5, '140,205,255', .5 * env, 0);
    tail(c.x, c.y, dust, 300 * k, c.r * 2.6, '255,214,160', .36 * env, c.vx > 0 ? .16 : -.16);
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 8);
    g.addColorStop(0, `rgba(255,255,255,${env})`); g.addColorStop(.18, `rgba(200,235,255,${.7 * env})`); g.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.r * 8, 0, TAU); ctx.fill();
  }
  for (const p of fx.parts) {
    const a = (1 - p.age / p.life) * .8;
    ctx.fillStyle = `rgba(${p.col},${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
  }
  ctx.lineCap = 'round';
  for (const s of fx.shoot) {                                   // estrellas fugaces
    const kk = clamp(s.age / s.life, 0, 1), env = Math.pow(Math.sin(kk * Math.PI), .7);
    const sp = Math.hypot(s.vx, s.vy), ux = s.vx / sp, uy = s.vy / sp, L = s.len * env, gx = s.x - ux * L, gy = s.y - uy * L;
    let g = ctx.createLinearGradient(gx, gy, s.x, s.y);
    g.addColorStop(0, `rgba(${s.hue},0)`); g.addColorStop(.7, `rgba(${s.hue},${.35 * env})`); g.addColorStop(1, `rgba(255,255,255,${env})`);
    ctx.strokeStyle = g; ctx.lineWidth = s.w * (.6 + .4 * env);
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(s.x, s.y); ctx.stroke();
    g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.w * 5);
    g.addColorStop(0, `rgba(255,255,255,${env})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.w * 5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

/* — composición del fotograma — */
function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#02010b'); g.addColorStop(.55, '#070419'); g.addColorStop(1, '#0a1030');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const PAR = W * .02;
  ctx.drawImage(nebula, -W * .15 - mx * PAR * .3 + Math.sin(T * .02) * W * .02, -H * .15 - my * PAR * .2, W * 1.3, H * 1.3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';         // luz ambiental: ámbar arriba-izq, verde azulado abajo-izq
  g = ctx.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, Math.max(W, H) * .6);
  g.addColorStop(0, 'rgba(255,170,100,.17)'); g.addColorStop(1, 'rgba(255,170,100,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * .2, H * 1.05, 0, W * .2, H * 1.05, W * .55);
  g.addColorStop(0, 'rgba(50,220,180,.15)'); g.addColorStop(1, 'rgba(50,220,180,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawRays(); drawStars(); drawPlanets(); drawFx(); drawBokeh();
}

/* — tamaño / calidad — */
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, perf.dprMax);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  portrait = W / H < .8;
  U = portrait ? W * 1.05 : Math.min(W, H * 1.25);
  SUN.x = -.08 * W; SUN.y = -.12 * H;
  buildNebula(); buildStars(); buildBokeh(); layoutPlanets();
  if (REDUCE) draw();
}

/* — bucle principal — */
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  perf.ema = perf.ema * .96 + dt * 1000 * .04;
  if (!perf.low && T > 10 && perf.ema > 27) { perf.low = true; perf.dprMax = 1; resize(); }   // equipos lentos: bajar calidad
  const auto = T - lastPtr > 5;
  const gx = auto ? Math.sin(T * .09) * .6 : tx, gy = auto ? Math.cos(T * .07) * .4 : ty, k = 1 - Math.exp(-dt * 2.2);
  mx += (gx - mx) * k; my += (gy - my) * k;
  stepFx(dt); draw(); if (API.alFotograma) API.alFotograma(mx, my);
  requestAnimationFrame(frame);
}

/* — API pública — */
function mirar(nx, ny) { tx = nx; ty = ny; lastPtr = T; }
const API = { iniciar, disparar: spawnShoot, mirar, alFotograma: null };

function iniciar() {
  if (REDUCE) T = 9;                                            // sin movimiento: un fotograma ya "avanzado"
  resize();
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  last = performance.now();
  if (!REDUCE) requestAnimationFrame(frame);
}
let rt;

window.Cielo.Espacio = API;
})();
