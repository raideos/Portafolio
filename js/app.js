/* ============================================================
   Portafolio interactivo — Exploración tipo "libro pop-up"
   - Mundo 3D isométrico sobre las páginas de un libro.
   - Los elementos son recortes de papel que se levantan cuando
     el personaje se acerca y se vuelven a acostar al alejarse.
   - Ambiente: hojas que caen, viento, pájaros y sombras de nubes;
     de noche: luna, luciérnagas y un farol que lleva el personaje.
   - Todo el contenido sigue saliendo de data/content.json.
   ============================================================ */
import * as THREE from 'three';

/* ---------- textos propios del prototipo ---------- */
const TXT = {
  es: { hint: 'WASD / flechas para caminar · clic para moverte · E para ver',
        hintTouch: 'Toca el suelo para caminar · toca una tarjeta para verla',
        list: 'Ver en lista', tap: 'Toca para ver', theme: 'Modo claro/oscuro', close: 'Cerrar' },
  en: { hint: 'WASD / arrow keys to walk · click to move · E to view',
        hintTouch: 'Tap the ground to walk · tap a card to open it',
        list: 'List view', tap: 'Tap to view', theme: 'Light/dark mode', close: 'Close' }
};

function loadSaved(key, fallback){ try { return localStorage.getItem(key) || fallback; } catch(e){ return fallback; } }
function saveSetting(key, v){ try { localStorage.setItem(key, v); } catch(e){} }

let lang = loadSaved('portafolio-lang', 'es');
let theme = loadSaved('portafolio-theme', 'light');
document.documentElement.setAttribute('data-theme', theme);
const isTouch = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

/* ---------- aleatorio con semilla: el mundo siempre se ve igual ---------- */
function rng(seed){
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const rand = rng(11);
const R = (a, b) => a + (b - a) * rand();
const pick = arr => arr[Math.floor(rand() * arr.length)];
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;

/* ============================================================
   1. DIBUJO EN "PAPEL" (canvas 2D → textura)
   ============================================================ */
const GRAIN = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4){
    const v = Math.random() * 255;
    id.data[i] = id.data[i+1] = id.data[i+2] = v; id.data[i+3] = Math.random() * 26;
  }
  g.putImageData(id, 0, 0); return c;
})();

function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
function rr(g, x, y, w, h, r){ g.beginPath(); g.roundRect(x, y, w, h, r); }

/* Dibuja el arte y le agrega el borde blanco de "recorte de papel" + grano.
   res > 1 dibuja a mayor resolución (para textos e imágenes nítidas). */
function paper(w, h, draw, border = 9, res = 1){
  const pad = border + 4;
  const art = makeCanvas((w + pad*2) * res, (h + pad*2) * res);
  const a = art.getContext('2d'); a.scale(res, res); a.translate(pad, pad); draw(a, w, h);
  const sil = makeCanvas(art.width, art.height); const s = sil.getContext('2d');
  s.drawImage(art, 0, 0); s.globalCompositeOperation = 'source-in';
  s.fillStyle = '#FFFAF0'; s.fillRect(0, 0, sil.width, sil.height);
  const out = makeCanvas(art.width, art.height); const o = out.getContext('2d');
  for (let i = 0; i < 20; i++){ const an = i / 20 * Math.PI * 2; o.drawImage(sil, Math.cos(an)*border*res, Math.sin(an)*border*res); }
  o.drawImage(art, 0, 0);
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = o.createPattern(GRAIN, 'repeat'); o.fillRect(0, 0, out.width, out.height);
  return out;
}

const INK = '#4A3426';
const FONT = (wgt, px) => `${wgt} ${px}px Quicksand, Nunito, sans-serif`;
const EMOJI_FONT = px => `${px}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;

function wrapText(g, text, x, y, maxW, lineH, maxLines){
  const words = text.split(' '); let line = ''; let lines = [];
  for (const w of words){
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line){ lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines){ lines = lines.slice(0, maxLines); lines[maxLines-1] = lines[maxLines-1].replace(/\s*\S*$/, '…'); }
  lines.forEach((l, i) => g.fillText(l, x, y + i * lineH));
  return lines.length;
}

/* ---------- naturaleza ---------- */
function drawPine(g, w, h){
  const cx = w/2;
  g.fillStyle = '#7A4A2C'; g.fillRect(cx - w*0.06, h*0.78, w*0.12, h*0.22);
  const greens = [['#4A6B40','#37532F'], ['#5A7D4B','#43623A']];
  for (let i = 0; i < 4; i++){
    const top = h * (0.02 + i * 0.17), bottom = h * (0.36 + i * 0.15);
    const half = w * (0.22 + i * 0.09);
    const [c1, c2] = greens[i % 2];
    g.fillStyle = c1; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx + half, bottom);
    const teeth = 6;
    for (let k = 1; k <= teeth; k++){ const x = cx + half - (2*half) * (k/teeth); g.lineTo(x + half/teeth, bottom - h*0.035); g.lineTo(x, bottom); }
    g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx + half, bottom); g.lineTo(cx, bottom); g.closePath(); g.globalAlpha = .5; g.fill(); g.globalAlpha = 1;
  }
}
function drawTree(g, w, h){
  const pal = pick([['#8DA85E','#6C8747','#B5C46A'], ['#D8914A','#B66F33','#EDB06A'], ['#B8B552','#94933F','#D6D07A']]);
  const cx = w/2;
  g.fillStyle = '#7A4A2C'; g.beginPath(); g.moveTo(cx - w*0.07, h); g.lineTo(cx - w*0.04, h*0.45); g.lineTo(cx + w*0.04, h*0.45); g.lineTo(cx + w*0.07, h); g.fill();
  g.strokeStyle = '#7A4A2C'; g.lineWidth = w*0.03; g.beginPath(); g.moveTo(cx, h*0.6); g.lineTo(cx + w*0.18, h*0.42); g.stroke();
  const blobs = [[0.5,0.32,0.36],[0.3,0.42,0.24],[0.7,0.42,0.24],[0.5,0.18,0.24],[0.38,0.25,0.2],[0.64,0.26,0.2]];
  blobs.forEach(([bx, by, br], i) => { g.fillStyle = i % 2 ? pal[0] : pal[2]; g.beginPath(); g.arc(w*bx, h*by, w*br, 0, Math.PI*2); g.fill(); });
  g.fillStyle = pal[1]; g.globalAlpha = .4; g.beginPath(); g.arc(w*0.62, h*0.38, w*0.28, -0.4, Math.PI*0.9); g.fill(); g.globalAlpha = 1;
  g.fillStyle = pal[1];
  for (let i = 0; i < 16; i++){ g.beginPath(); g.ellipse(w*R(.22,.78), h*R(.1,.55), w*0.025, w*0.045, R(0,3), 0, Math.PI*2); g.fill(); }
}
function drawBush(g, w, h){
  const pal = pick([['#4F9A8F','#3B7C72'], ['#7FA35C','#638745'], ['#5E8F68','#4A7453']]);
  const lumps = [[0.25,0.7,0.26],[0.5,0.55,0.32],[0.75,0.7,0.25]];
  lumps.forEach(([x, y, r], i) => { g.fillStyle = i === 1 ? pal[0] : pal[1]; g.beginPath(); g.arc(w*x, h*y, w*r, Math.PI, 0); g.lineTo(w*(x+r), h); g.lineTo(w*(x-r), h); g.fill(); });
  g.fillStyle = 'rgba(255,255,255,.25)';
  for (let i = 0; i < 6; i++){ g.beginPath(); g.arc(w*R(.2,.8), h*R(.4,.85), w*0.02, 0, Math.PI*2); g.fill(); }
  const fc = pick(['#F6CF5B','#FFF6E6','#F2A65A']);
  for (let i = 0; i < 5; i++){ const x = w*R(.2,.8), y = h*R(.35,.8); g.fillStyle = fc; g.beginPath(); g.arc(x, y, w*0.035, 0, Math.PI*2); g.fill(); g.fillStyle = '#B5651D'; g.beginPath(); g.arc(x, y, w*0.012, 0, Math.PI*2); g.fill(); }
}
function drawMushroom(g, w, h){
  g.fillStyle = '#F6EAD2'; rr(g, w*0.38, h*0.45, w*0.24, h*0.55, w*0.08); g.fill();
  g.fillStyle = '#D9583A'; g.beginPath(); g.ellipse(w/2, h*0.48, w*0.48, h*0.42, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#B5432A'; g.beginPath(); g.ellipse(w*0.62, h*0.48, w*0.32, h*0.3, 0, Math.PI*1.4, 0); g.fill();
  g.fillStyle = '#FFF6E6';
  [[.3,.3,.06],[.5,.15,.05],[.68,.32,.07],[.42,.4,.04],[.8,.42,.04]].forEach(([x,y,r]) => { g.beginPath(); g.arc(w*x, h*y, w*r, 0, Math.PI*2); g.fill(); });
}
function drawRock(g, w, h){
  g.fillStyle = '#A8AA9E'; g.beginPath(); g.moveTo(0, h); g.lineTo(w*0.08, h*0.45); g.lineTo(w*0.35, h*0.1); g.lineTo(w*0.7, h*0.05); g.lineTo(w*0.95, h*0.5); g.lineTo(w, h); g.fill();
  g.fillStyle = '#C8C9BC'; g.beginPath(); g.moveTo(w*0.08, h*0.45); g.lineTo(w*0.35, h*0.1); g.lineTo(w*0.5, h*0.5); g.lineTo(w*0.2, h*0.8); g.fill();
  g.fillStyle = '#878A80'; g.beginPath(); g.moveTo(w*0.7, h*0.05); g.lineTo(w*0.95, h*0.5); g.lineTo(w, h); g.lineTo(w*0.65, h); g.lineTo(w*0.6, h*0.45); g.fill();
}
function drawFlowers(g, w, h){
  g.strokeStyle = '#5A7D4B'; g.lineWidth = w*0.03; g.lineCap = 'round';
  const c = pick(['#F6CF5B','#F2A65A','#FFF6E6','#E8A0B4']);
  for (let i = 0; i < 5; i++){
    const x = w*(0.15 + i*0.17), top = h*R(.1,.4);
    g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + w*0.05, (h+top)/2, x, top); g.stroke();
    g.fillStyle = '#7FA35C'; g.beginPath(); g.ellipse(x + w*0.05, h*0.75, w*0.06, w*0.025, -0.6, 0, Math.PI*2); g.fill();
    g.fillStyle = c; for (let p = 0; p < 5; p++){ const an = p/5*Math.PI*2; g.beginPath(); g.arc(x + Math.cos(an)*w*0.04, top + Math.sin(an)*w*0.04, w*0.035, 0, Math.PI*2); g.fill(); }
    g.fillStyle = '#B5651D'; g.beginPath(); g.arc(x, top, w*0.025, 0, Math.PI*2); g.fill();
  }
}
function drawDog(g, w, h){
  g.fillStyle = '#E8A25E';
  g.fillRect(w*0.22, h*0.62, w*0.07, h*0.38); g.fillRect(w*0.58, h*0.62, w*0.07, h*0.38);
  g.beginPath(); g.ellipse(w*0.42, h*0.58, w*0.3, h*0.2, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#FFF6E6'; g.beginPath(); g.ellipse(w*0.45, h*0.68, w*0.18, h*0.09, 0, 0, Math.PI*2); g.fill();
  g.strokeStyle = '#E8A25E'; g.lineWidth = w*0.05; g.lineCap = 'round';
  g.beginPath(); g.moveTo(w*0.14, h*0.52); g.quadraticCurveTo(w*0.02, h*0.4, w*0.08, h*0.22); g.stroke();
  g.fillStyle = '#FFF6E6'; g.beginPath(); g.arc(w*0.74, h*0.36, w*0.17, 0, Math.PI*2); g.fill();
  g.fillStyle = '#E8A25E'; g.beginPath(); g.arc(w*0.7, h*0.3, w*0.12, Math.PI*0.9, Math.PI*1.9); g.fill();
  g.fillStyle = '#B86A33'; g.beginPath(); g.ellipse(w*0.62, h*0.42, w*0.06, h*0.16, 0.3, 0, Math.PI*2); g.fill();
  g.fillStyle = INK; g.beginPath(); g.arc(w*0.8, h*0.33, w*0.022, 0, Math.PI*2); g.fill();
  g.beginPath(); g.arc(w*0.9, h*0.4, w*0.03, 0, Math.PI*2); g.fill();
}

/* ---------- paradas de información (grandes y legibles) ---------- */
function drawHouse(label){
  const w = 440, h = 470;
  return paper(w, h, (g) => {
    const top = 70;  // espacio para el letrero
    g.fillStyle = '#8A4B3A'; g.fillRect(w*0.66, top + 30, w*0.1, 90);
    g.fillStyle = '#F6E6C8'; g.fillRect(w*0.12, top + 160, w*0.76, h - top - 160);
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(w*0.62, top + 160, w*0.26, h - top - 160);
    g.fillStyle = '#D9653F'; g.beginPath(); g.moveTo(w*0.03, top + 180); g.lineTo(w/2, top + 20); g.lineTo(w*0.97, top + 180); g.fill();
    g.strokeStyle = 'rgba(120,40,20,.3)'; g.lineWidth = 3;
    for (let i = 1; i < 5; i++){ const y = top + 20 + i*32; const dx = (y - top - 20) / 160 * w*0.47; g.beginPath(); g.moveTo(w/2 - dx, y); g.lineTo(w/2 + dx, y); g.stroke(); }
    g.fillStyle = '#FFD56B'; rr(g, w*0.2, top + 205, w*0.2, 70, 6); g.fill();
    g.strokeStyle = '#8B5A3C'; g.lineWidth = 5; g.strokeRect(w*0.2, top + 205, w*0.2, 70);
    g.beginPath(); g.moveTo(w*0.3, top + 205); g.lineTo(w*0.3, top + 275); g.moveTo(w*0.2, top + 240); g.lineTo(w*0.4, top + 240); g.stroke();
    g.fillStyle = '#8B5A3C'; rr(g, w*0.55, h - 150, w*0.17, 150, [w*0.08, w*0.08, 0, 0]); g.fill();
    g.fillStyle = '#FFD56B'; g.beginPath(); g.arc(w*0.69, h - 70, 5, 0, Math.PI*2); g.fill();
    // letrero colgante con el nombre de la parada
    g.font = FONT(700, 38); const tw = Math.min(w - 20, g.measureText(label).width + 48);
    g.fillStyle = '#FFFAF0'; rr(g, (w - tw)/2, 0, tw, 62, 18); g.fill();
    g.strokeStyle = '#F2A65A'; g.lineWidth = 5; rr(g, (w - tw)/2 + 4, 4, tw - 8, 54, 15); g.stroke();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, w/2, 33, tw - 30);
  }, 9, 2);
}
function drawSign(text){
  const tmp = makeCanvas(10, 10).getContext('2d'); tmp.font = FONT(700, 46);
  const w = Math.max(260, tmp.measureText(text).width + 80), h = 250;
  return paper(w, h, (g) => {
    g.fillStyle = '#7A5233'; g.fillRect(w/2 - 12, 70, 24, h - 70);
    g.fillStyle = '#D9A56A'; rr(g, 0, 10, w, 104, 18); g.fill();
    g.strokeStyle = '#AD7A44'; g.lineWidth = 5; rr(g, 7, 17, w - 14, 90, 13); g.stroke();
    g.fillStyle = '#3A2414'; g.font = FONT(700, 46); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w/2, 64);
  }, 9, 2);
}
function drawIconCard(emoji, label, color){
  const w = 380, h = 470, ch = 370;
  return paper(w, h, (g) => {
    g.fillStyle = '#7A5233'; g.fillRect(w/2 - 13, ch - 10, 26, h - ch + 10);
    g.fillStyle = '#FFFAF0'; rr(g, 0, 0, w, ch, 30); g.fill();
    g.fillStyle = color; rr(g, 0, 0, w, 190, [30, 30, 0, 0]); g.fill();
    g.font = EMOJI_FONT(130); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, w/2, 100);
    g.fillStyle = INK; g.font = FONT(700, 40); g.textBaseline = 'alphabetic';
    const n = (() => { const t = makeCanvas(1,1).getContext('2d'); t.font = FONT(700, 40); return t.measureText(label).width > w - 40 ? 2 : 1; })();
    wrapText(g, label, w/2, n === 1 ? 292 : 262, w - 40, 46, 2);
  }, 10, 2);
}
function drawProjectCard(img, year, title){
  const w = 460, h = 590, iw = w - 32, ih = iw * 9/16, ch = h - 100;
  return paper(w, h, (g) => {
    g.fillStyle = '#7A5233'; g.fillRect(w*0.25 - 10, ch - 10, 20, h - ch + 10); g.fillRect(w*0.75 - 10, ch - 10, 20, h - ch + 10);
    g.fillStyle = '#FFFAF0'; rr(g, 0, 0, w, ch, 26); g.fill();
    g.save(); rr(g, 16, 16, iw, ih, 16); g.clip();
    if (img){
      const s = Math.max(iw / img.width, ih / img.height), dw = img.width * s, dh = img.height * s;
      g.drawImage(img, 16 + (iw - dw)/2, 16 + (ih - dh)/2, dw, dh);
    } else { g.fillStyle = '#F3E3CC'; g.fillRect(16, 16, iw, ih); }
    g.restore();
    g.fillStyle = '#F2A65A'; rr(g, 16, 30 + ih, 120, 48, 24); g.fill();
    g.fillStyle = '#3A2414'; g.font = FONT(700, 30); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(year), 76, 55 + ih);
    g.fillStyle = INK; g.font = FONT(700, 36); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    wrapText(g, title, 22, 126 + ih, w - 44, 42, 2);
  }, 10, 1.7);
}
/* Personaje: el dragoncito naranja del sitio, como recorte de papel */
function drawPlayerArt(){
  return paper(130, 200, (g) => {
    g.translate(65, 108); g.scale(2.2, 2.2);
    g.fillStyle = '#FF9F5B'; rr(g, -24, -32, 48, 56, 24); g.fill();
    g.fillStyle = '#FFF1E0'; g.beginPath(); g.ellipse(0, 8, 14, 16, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#E8823D'; g.beginPath(); g.moveTo(14,-16); g.quadraticCurveTo(34,-24,20,4); g.quadraticCurveTo(10,-6,14,-16); g.fill();
    g.fillStyle = '#FFD9A0'; g.beginPath(); g.moveTo(-14,-30); g.quadraticCurveTo(-10,-42,-4,-30); g.fill();
    g.beginPath(); g.moveTo(2,-32); g.quadraticCurveTo(6,-44,12,-32); g.fill();
    g.fillStyle = INK; g.beginPath(); g.arc(6,-14,3,0,Math.PI*2); g.fill();
    g.fillStyle = 'rgba(255,111,89,.55)'; g.beginPath(); g.arc(-2,-6,5,0,Math.PI*2); g.fill();
  }, 7, 2);
}

/* ============================================================
   2. ESCENA, CÁMARA Y LUCES
   ============================================================ */
const container = document.getElementById('world');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
// Cámara baja (30°): así se nota la diferencia entre un recorte acostado y uno de pie
const YAW = THREE.MathUtils.degToRad(35), PITCH = THREE.MathUtils.degToRad(30);
const CAM_DIR = new THREE.Vector3(Math.sin(YAW), 0, Math.cos(YAW));
const CAM_OFF = new THREE.Vector3(Math.sin(YAW)*Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW)*Math.cos(PITCH)).multiplyScalar(60);
const FWD = new THREE.Vector3(-Math.sin(YAW), 0, -Math.cos(YAW));   // "arriba" en pantalla
const RIGHT = new THREE.Vector3(Math.cos(YAW), 0, -Math.sin(YAW));  // "derecha" en pantalla
let zoom = 1;

function resize(){
  const w = container.clientWidth, h = container.clientHeight, asp = w / h;
  renderer.setSize(w, h);
  const viewH = clamp(34 / asp, 16, 26) * zoom;
  camera.left = -viewH * asp / 2; camera.right = viewH * asp / 2;
  camera.top = viewH / 2; camera.bottom = -viewH / 2;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault(); zoom = clamp(zoom * (e.deltaY > 0 ? 1.08 : 0.92), 0.6, 1.6); resize();
}, { passive: false });

// Luz cálida que llega desde el lado de la cámara: ilumina el frente de los recortes
const hemi = new THREE.HemisphereLight(0xFFF3E2, 0x8A7560, 2.1);
const sun = new THREE.DirectionalLight(0xFFE7C4, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
const SUN_OFF = new THREE.Vector3(6, 30, 22);
// De noche, el personaje lleva un farol
const lantern = new THREE.PointLight(0xFFB062, 0, 14, 1.5);
scene.add(hemi, sun, sun.target, lantern);

const LIGHTS = {
  day:   { sky: new THREE.Color(0xFFF3E2), ground: new THREE.Color(0x8A7560), hemi: 2.1, sun: new THREE.Color(0xFFE7C4), sunI: 2.3 },
  night: { sky: new THREE.Color(0x5A6AA8), ground: new THREE.Color(0x1C1828), hemi: 0.32, sun: new THREE.Color(0x9DB2FF), sunI: 0.38 }
};
const PAGE_DAY = new THREE.Color(0xFFFFFF), PAGE_NIGHT = new THREE.Color(0x8D93B8);
let pageMat = null;
let night = theme === 'dark' ? 1 : 0;

/* ---------- el libro ---------- */
const PW = 66, PD = 42;
const BOUNDS = { x: PW/2 - 2, z: PD/2 - 2 };

function buildBook(pathPts, pond){
  const PPU = 32, cw = PW * PPU, ch = PD * PPU;
  const c = makeCanvas(cw, ch), g = c.getContext('2d');
  const px = (x, z) => [(x + PW/2) * PPU, (z + PD/2) * PPU];
  g.fillStyle = '#F4EBD6'; g.fillRect(0, 0, cw, ch);

  const m = 1.3 * PPU; g.save(); g.beginPath();
  const edge = (x0, y0, x1, y1) => { const n = 40; for (let i = 0; i <= n; i++){ const t = i/n; g.lineTo(x0 + (x1-x0)*t + R(-5,5), y0 + (y1-y0)*t + R(-5,5)); } };
  g.moveTo(m, m); edge(m, m, cw - m, m); edge(cw - m, m, cw - m, ch - m); edge(cw - m, ch - m, m, ch - m); edge(m, ch - m, m, m);
  g.closePath(); g.fillStyle = '#B4C394'; g.fill(); g.clip();
  for (let i = 0; i < 70; i++){
    const [x, y] = px(R(-PW/2, PW/2), R(-PD/2, PD/2)); const r = R(2, 6) * PPU;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const col = pick(['196,208,160', '164,183,134', '186,200,146', '214,214,166']);
    grad.addColorStop(0, `rgba(${col},.55)`); grad.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grad; g.fillRect(x - r, y - r, r*2, r*2);
  }
  for (let x = -PW/2; x <= PW/2; x += 6){ const [X] = px(x, 0); g.fillStyle = 'rgba(70,80,50,.09)'; g.fillRect(X, 0, 2, ch); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(X + 2, 0, 2, ch); }
  for (let z = -PD/2; z <= PD/2; z += 6){ const [, Y] = px(0, z); g.fillStyle = 'rgba(70,80,50,.09)'; g.fillRect(0, Y, cw, 2); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, Y + 2, cw, 2); }
  { const [x, y] = px(pond.x, pond.z);
    g.fillStyle = '#6A9C96'; g.beginPath(); g.ellipse(x, y, pond.rx*PPU + 8, pond.rz*PPU + 8, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#93C4BE'; g.beginPath(); g.ellipse(x, y, pond.rx*PPU, pond.rz*PPU, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4;
    for (let i = 0; i < 4; i++){ g.beginPath(); g.ellipse(x + R(-30,30), y + R(-15,15), R(20,50), R(6,12), 0, 0, Math.PI); g.stroke(); } }
  g.lineCap = g.lineJoin = 'round';
  const stroke = (wid, col, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = wid * PPU; g.beginPath(); pathPts.forEach((p, i) => { const [x, y] = px(p.x, p.z); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
  stroke(3.1, 'rgba(110,90,55,.25)'); stroke(2.6, '#F3E7C8'); stroke(1.1, 'rgba(255,252,240,.6)', [30, 50]); g.setLineDash([]);
  for (let i = 0; i < 260; i++){ const p = pick(pathPts); const [x, y] = px(p.x + R(-1.1, 1.1), p.z + R(-1.1, 1.1)); g.fillStyle = 'rgba(160,140,100,.3)'; g.beginPath(); g.arc(x, y, R(2, 5), 0, Math.PI*2); g.fill(); }
  g.restore();
  const [cx] = px(0, 0); const sp = g.createLinearGradient(cx - 3*PPU, 0, cx + 3*PPU, 0);
  sp.addColorStop(0, 'rgba(60,40,20,0)'); sp.addColorStop(.5, 'rgba(60,40,20,.28)'); sp.addColorStop(1, 'rgba(60,40,20,0)');
  g.fillStyle = sp; g.fillRect(cx - 3*PPU, 0, 6*PPU, ch);
  g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, cw, ch);

  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  pageMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), pageMat);
  page.rotation.x = -Math.PI/2; page.receiveShadow = true; scene.add(page);
  const stack = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.8, PD), new THREE.MeshStandardMaterial({ color: 0xEFE3CA, roughness: 1 }));
  stack.position.y = -0.41; stack.receiveShadow = true; scene.add(stack);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(PW + 2.4, 0.5, PD + 2.4), new THREE.MeshStandardMaterial({ color: 0x7A3B2A, roughness: .8 }));
  cover.position.y = -1.0; cover.receiveShadow = true; cover.castShadow = true; scene.add(cover);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: .35 }));
  desk.rotation.x = -Math.PI/2; desk.position.y = -1.26; desk.receiveShadow = true; scene.add(desk);
}

/* ---------- recortes que se levantan ---------- */
const texCache = new Map();
function cutout(canvas, height, cacheKey){
  let entry = cacheKey && texCache.get(cacheKey);
  if (!entry){
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    entry = {
      tex, aspect: canvas.width / canvas.height,
      // emissiveMap = la misma textura: permite que el papel "brille" un poco al levantarse
      mat: new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0, alphaTest: 0.5, side: THREE.DoubleSide, roughness: .95 }),
      depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 })
    };
    if (cacheKey) texCache.set(cacheKey, entry);
  }
  const w = height * entry.aspect;
  const geo = new THREE.PlaneGeometry(w, height); geo.translate(0, height/2, 0);
  const mesh = new THREE.Mesh(geo, entry.mat.clone());
  mesh.castShadow = true; mesh.customDepthMaterial = entry.depth;
  const pivot = new THREE.Group(); pivot.rotation.order = 'YXZ'; pivot.rotation.y = YAW; pivot.add(mesh);
  return { pivot, mesh, width: w, height };
}

const popups = [], hotspots = [], colliders = [];
function addPopup(obj, x, z, reveal, extra = {}){
  obj.pivot.position.set(x, 0.02 + rand() * 0.03, z);
  obj.pivot.rotation.x = -Math.PI/2;
  scene.add(obj.pivot);
  const p = { ...obj, x, z, reveal, t: 0, v: 0, delay: rand() * 0.12, sway: 0, swaySeed: rand() * 10, ...extra };
  popups.push(p); return p;
}

/* ============================================================
   3. AMBIENTE: hojas, nubes, pájaros, luciérnagas
   ============================================================ */
const ambient = (() => {
  // --- hojas que caen con el viento ---
  const leafC = makeCanvas(64, 44), lg = leafC.getContext('2d');
  lg.fillStyle = '#fff'; lg.beginPath(); lg.moveTo(4, 22); lg.quadraticCurveTo(32, -6, 60, 22); lg.quadraticCurveTo(32, 50, 4, 22); lg.fill();
  lg.strokeStyle = 'rgba(0,0,0,.25)'; lg.lineWidth = 2; lg.beginPath(); lg.moveTo(6, 22); lg.lineTo(58, 22); lg.stroke();
  const leafTex = new THREE.CanvasTexture(leafC); leafTex.colorSpace = THREE.SRGBColorSpace;
  const N = 46;
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.46, 0.32),
    new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), N);
  leaves.castShadow = true; leaves.frustumCulled = false;
  const pal = ['#E9A55A', '#D9803F', '#B9C46A', '#F2C46B', '#C96A3A'].map(c => new THREE.Color(c));
  const L = [];
  for (let i = 0; i < N; i++){ leaves.setColorAt(i, pal[i % pal.length]); L.push({ p: new THREE.Vector3(), rest: 0, spin: new THREE.Vector3(R(-3,3), R(-3,3), R(-3,3)), rot: new THREE.Euler(), fall: R(0.7, 1.2), age: R(0, 6), s: 0 }); }
  scene.add(leaves);
  const spawn = (l, center, anywhere) => {
    l.p.set(center.x + R(-24, 20), anywhere ? R(0.5, 12) : R(8, 12), center.z + R(-20, 14));
    l.rest = 0; l.s = anywhere ? 1 : 0;
  };

  // --- sombras de nubes que se deslizan sobre la página ---
  const cc = makeCanvas(512, 512), cg = cc.getContext('2d');
  for (let i = 0; i < 9; i++){ const x = R(0, 512), y = R(0, 512), r = R(60, 130);
    for (const [ox, oy] of [[0,0],[512,0],[0,512],[512,512],[-512,0],[0,-512]]){
      const gr = cg.createRadialGradient(x+ox, y+oy, 0, x+ox, y+oy, r); gr.addColorStop(0, 'rgba(40,30,20,.9)'); gr.addColorStop(1, 'rgba(40,30,20,0)');
      cg.fillStyle = gr; cg.fillRect(x + ox - r, y + oy - r, r*2, r*2); } }
  const cloudTex = new THREE.CanvasTexture(cc); cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping; cloudTex.repeat.set(1.6, 1);
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.13, depthWrite: false }));
  clouds.rotation.x = -Math.PI/2; clouds.position.y = 0.08; scene.add(clouds);

  // --- pájaros de papel que cruzan el cielo (con su sombra sobre la página) ---
  const birdMat = new THREE.MeshStandardMaterial({ color: 0x5A4334, side: THREE.DoubleSide, roughness: 1 });
  const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.lineTo(0.9, 0.18); wingShape.lineTo(0.35, -0.22); wingShape.lineTo(0, -0.12);
  const wingGeo = new THREE.ShapeGeometry(wingShape); wingGeo.rotateX(-Math.PI/2);
  const birds = [];
  for (let i = 0; i < 4; i++){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 4), birdMat); body.rotation.x = Math.PI/2; body.castShadow = true;
    const lw = new THREE.Mesh(wingGeo, birdMat), rw = new THREE.Mesh(wingGeo, birdMat);
    rw.scale.x = -1; lw.castShadow = rw.castShadow = true;
    g.add(body, lw, rw); g.visible = false; scene.add(g);
    birds.push({ g, lw, rw, off: new THREE.Vector3(), phase: R(0, 6) });
  }
  let flock = null, nextFlock = 4;

  // --- luciérnagas (solo de noche) ---
  const fc = makeCanvas(64, 64), fg = fc.getContext('2d');
  const fgr = fg.createRadialGradient(32, 32, 0, 32, 32, 32); fgr.addColorStop(0, 'rgba(255,230,150,1)'); fgr.addColorStop(.3, 'rgba(255,200,90,.6)'); fgr.addColorStop(1, 'rgba(255,180,60,0)');
  fg.fillStyle = fgr; fg.fillRect(0, 0, 64, 64);
  const FN = 46, fPos = new Float32Array(FN * 3), fBase = [];
  for (let i = 0; i < FN; i++) fBase.push({ x: R(-BOUNDS.x, BOUNDS.x), z: R(-BOUNDS.z, BOUNDS.z), y: R(0.6, 3), s: R(0, 10) });
  const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
  const fireflies = new THREE.Points(fGeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(fc), size: 18, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  fireflies.frustumCulled = false; scene.add(fireflies);

  const dummy = new THREE.Object3D();
  let ready = false;
  return {
    update(dt, time, center){
      if (!ready){ L.forEach(l => spawn(l, center, true)); ready = true; }
      const gust = 1.2 + Math.sin(time * 0.6) * 0.5 + Math.sin(time * 1.7) * 0.25;
      const day = 1 - night;
      // hojas
      L.forEach((l, i) => {
        if (l.p.y > 0.05){
          l.p.x += (gust * 1.1 + Math.sin(time * 2 + i) * 0.4) * dt;
          l.p.z += (gust * 0.35 + Math.cos(time * 1.6 + i) * 0.3) * dt;
          l.p.y -= l.fall * dt * (0.8 + Math.sin(time * 3 + i) * 0.3);
          l.rot.x += l.spin.x * dt; l.rot.y += l.spin.y * dt; l.rot.z += l.spin.z * dt;
          if (l.p.y <= 0.05){ l.p.y = 0.05; l.rot.set(-Math.PI/2, 0, l.rot.z); }
        } else { l.rest += dt; if (l.rest > 4) spawn(l, center, false); }
        l.s = Math.min(1, l.s + dt * 2);
        if (Math.abs(l.p.x - center.x) > 34 || Math.abs(l.p.z - center.z) > 26) spawn(l, center, false);
        dummy.position.copy(l.p); dummy.rotation.copy(l.rot);
        const fade = l.rest > 3 ? 1 - (l.rest - 3) : 1;
        dummy.scale.setScalar(l.s * fade * day + 0.0001);
        dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
      });
      leaves.instanceMatrix.needsUpdate = true;
      // nubes
      cloudTex.offset.x += dt * 0.006 * gust; cloudTex.offset.y += dt * 0.002;
      clouds.material.opacity = 0.13 * day;
      // pájaros
      nextFlock -= dt;
      if (!flock && nextFlock <= 0 && day > 0.5){
        const ang = R(-0.5, 0.5) + Math.PI * (rand() < 0.5 ? 0 : 1);
        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang) * 0.6).normalize();
        const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const start = center.clone().addScaledVector(dir, -38).addScaledVector(side, R(-8, 8)); start.y = R(9, 12);
        const count = 2 + Math.floor(rand() * 3);
        flock = { dir, pos: start, dist: 0, count };
        birds.forEach((b, i) => { b.g.visible = i < count; b.off.set(0, R(-0.4, 0.4), 0).addScaledVector(dir, -i * 1.4).addScaledVector(side, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.2); });
      }
      if (flock){
        flock.pos.addScaledVector(flock.dir, 7 * dt); flock.dist += 7 * dt;
        birds.forEach(b => {
          if (!b.g.visible) return;
          b.g.position.copy(flock.pos).add(b.off);
          b.g.position.y += Math.sin(time * 2 + b.phase) * 0.2;
          b.g.lookAt(b.g.position.clone().add(flock.dir));
          const flap = Math.sin(time * 11 + b.phase) * 0.55;
          b.lw.rotation.z = flap; b.rw.rotation.z = -flap;
        });
        if (flock.dist > 80){ birds.forEach(b => b.g.visible = false); flock = null; nextFlock = R(8, 15); }
      }
      // luciérnagas
      fireflies.material.opacity = night * (0.75 + Math.sin(time * 3) * 0.15);
      fBase.forEach((f, i) => {
        fPos[i*3] = f.x + Math.sin(time * 0.5 + f.s) * 1.2;
        fPos[i*3+1] = f.y + Math.sin(time * 1.3 + f.s * 2) * 0.4;
        fPos[i*3+2] = f.z + Math.cos(time * 0.4 + f.s) * 1.2;
      });
      fGeo.attributes.position.needsUpdate = true;
      return gust;
    }
  };
})();

/* ============================================================
   4. PERSONAJE + CONTROLES
   ============================================================ */
const playerArt = cutout(drawPlayerArt(), 2.3);
playerArt.pivot.rotation.x = 0;
playerArt.mesh.material.emissiveIntensity = 0.12;
const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), new THREE.MeshBasicMaterial({ color: 0x2A2018, transparent: true, opacity: .28 }));
shadowBlob.rotation.x = -Math.PI/2;
scene.add(playerArt.pivot, shadowBlob);
const player = { pos: new THREE.Vector3(-16, 0, -6), facing: 1, phase: 0, target: null, pending: null };
const camTarget = player.pos.clone();

const keys = new Set();
window.addEventListener('keydown', e => {
  if (overlayOpen()){ if (e.key === 'Escape') closePanel(); return; }
  const k = e.key.toLowerCase(); keys.add(k);
  if (k === 'e' || k === ' ' || k === 'enter'){ e.preventDefault(); if (activeHotspot) openHotspot(activeHotspot); }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function pointerToNdc(e){ const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); raycaster.setFromCamera(ndc, camera); }
function hotspotUnderPointer(){ const hit = raycaster.intersectObjects(hotspots.map(h => h.mesh))[0]; return hit && hotspots.find(h => h.mesh === hit.object); }

renderer.domElement.addEventListener('pointerdown', e => {
  pointerToNdc(e);
  const hs = hotspotUnderPointer();
  if (hs){ player.target = hs.approach.clone(); player.pending = hs; return; }
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, p)){
    p.x = clamp(p.x, -BOUNDS.x, BOUNDS.x); p.z = clamp(p.z, -BOUNDS.z, BOUNDS.z);
    player.target = p; player.pending = null;
  }
});
renderer.domElement.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  pointerToNdc(e); renderer.domElement.style.cursor = hotspotUnderPointer() ? 'pointer' : 'default';
});

/* ============================================================
   5. PANELES Y VISTA EN LISTA (mismo contenido de content.json)
   ============================================================ */
let DATA, UI;
const overlay = document.getElementById('overlay');
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panelBody');
const overlayOpen = () => overlay.style.display === 'flex';
function openPanel(html, wide = false){
  panelBody.innerHTML = html; panel.classList.toggle('wide', wide);
  overlay.style.display = 'flex'; panel.scrollTop = 0; keys.clear();
}
function closePanel(){ overlay.style.display = 'none'; panelBody.innerHTML = ''; }
document.getElementById('closePanel').onclick = closePanel;
overlay.addEventListener('click', e => { if (e.target === overlay) closePanel(); });

const L = o => o[lang] ?? o.es;
const linkAttrs = url => url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"';
// Texto corto bajo cada red: el correo, o "@usuario" sacado del link
function contactHandle(url){
  if (url.startsWith('mailto:')) return url.slice(7);
  try {
    const u = new URL(url), parts = u.pathname.split('/').filter(Boolean);
    const user = parts[parts.length - 1];
    return user ? '@' + user : u.hostname.replace(/^www\./, '');
  } catch(e){ return url; }
}

const PANELS = {
  historia(){ const h = DATA.sobreMi.historia, foto = DATA.sobreMi.foto;
    return `<h2>${UI[lang].miHistoria}</h2><div class="historia">
      ${foto ? `<img class="historia-photo" src="${foto}" alt="${L(h.nombre)}">` : ''}
      <div><div class="profile-name">${L(h.nombre)}</div><ul class="bullet-list">${h.bullets.map(b => `<li>${L(b)}</li>`).join('')}</ul></div></div>`; },
  gustos(){ return `<h2>${UI[lang].misGustos}</h2><div class="game-grid">${DATA.sobreMi.gustos.map(g => `
      <div class="game-card">${g.image ? `<img src="${g.image}" alt="${L(g.name)}" loading="lazy">` : ''}
      <div class="game-name">${L(g.name)}</div><div class="game-desc">${L(g.description)}</div></div>`).join('')}</div>`; },
  videojuegos(){ return `<h2>${UI[lang].videojuegosFavoritos}</h2><div class="game-grid">${DATA.sobreMi.videojuegosFavoritos.map(g => `
      <div class="game-card">${g.image ? `<img src="${g.image}" alt="${L(g.name)}" loading="lazy">` : ''}<div class="game-name">${L(g.name)}</div></div>`).join('')}</div>`; },
  musica(){ return `<h2>${UI[lang].musicaTitle}</h2><p class="music-disclaimer">${UI[lang].musicaDisclaimer}</p>` + DATA.sobreMi.musica.map(m => {
      let e = m.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/), src, cls;
      if (e){ src = `https://www.youtube.com/embed/${e[1]}`; cls = 'yt-embed'; }
      else if ((e = m.url.match(/open\.spotify\.com\/(track|album|playlist)\/(\w+)/))){ src = `https://open.spotify.com/embed/${e[1]}/${e[2]}`; cls = 'spotify-embed'; }
      return `<div class="entry"><div class="entry-title">${L(m.title)}</div>${src ? `<iframe class="${cls}" src="${src}" allow="autoplay; encrypted-media" loading="lazy"></iframe>` : ''}</div>`;
    }).join(''); },
  proyecto(p, inList = false){
    const title = inList ? `<h3 class="entry-title">${L(p.title)}</h3>` : `<h2>${L(p.title)}</h2>`;
    return `<div class="entry proj-detail${inList ? '' : ' single'}">
      ${p.image ? `<div class="project-thumb-wrap"><img class="project-thumb img-base" src="${p.image}" alt="${L(p.title)}" loading="lazy">
      ${p.imageHover ? `<img class="project-thumb img-hover" src="${p.imageHover}" alt="${L(p.title)}" loading="lazy">` : ''}</div>` : ''}
      <div class="project-text"><span class="entry-year">${p.year}</span>${(p.tags[lang] || []).map(t => `<span class="tag">${t}</span>`).join('')}
      ${title}<div class="entry-desc">${L(p.description)}</div>
      ${p.link ? `<a class="entry-link" href="${p.link}" target="_blank" rel="noopener">${UI[lang].verProyecto}</a>` : ''}</div></div>`; },
  reconocimientos(){ return `<h2>${UI[lang].reconocimientosTitle}</h2>` + [...DATA.reconocimientos].sort((a, b) => b.year - a.year).map(r => `
      <div class="entry"><span class="entry-year">${r.year}</span><span class="tag">${L(r.role)}</span>
      <div class="entry-title">${L(r.title)}</div><div class="entry-desc">${L(r.description)}</div></div>`).join(''); },
  // una tarjeta por red, en grilla 2x2; toda la tarjeta es el link
  contacto(){ return `<h2>${UI[lang].contactoTitle}</h2><div class="contact-grid">` + DATA.contacto.map(c => `
      <a class="contact-card" href="${c.url}"${linkAttrs(c.url)}>
        <span class="contact-icon">${c.icon}</span>
        <span class="contact-label">${L(c.label)}</span>
        <span class="contact-handle">${contactHandle(c.url)}</span>
        <span class="contact-cta">${UI[lang].abrir}</span>
      </a>`).join('') + `</div>`; }
};

/* "Ver todo en lista": todo el portafolio en un solo panel, sin caminar */
function openListView(){
  const t = UI[lang];
  const projects = [...DATA.proyectos].sort((a, b) => b.year - a.year);
  const sections = [
    ['sec-sobre', t.rooms[0], PANELS.historia() + PANELS.gustos() + PANELS.videojuegos() + PANELS.musica()],
    ['sec-proy', t.rooms[1], projects.map(p => PANELS.proyecto(p, true)).join('')],
    ['sec-rec', t.rooms[2], PANELS.reconocimientos()],
    ['sec-con', t.rooms[3], PANELS.contacto()]
  ];
  openPanel(`<nav class="list-tabs">${sections.map(([id, name]) => `<button data-go="${id}">${name}</button>`).join('')}</nav>` +
    sections.map(([id, name, html]) => `<section class="list-section" id="${id}"><div class="section-title">${name}</div>${html}</section>`).join(''), true);
  panelBody.querySelectorAll('[data-go]').forEach(b => b.onclick = () => document.getElementById(b.dataset.go).scrollIntoView({ behavior: 'smooth' }));
}

/* ============================================================
   6. CONSTRUIR EL MUNDO A PARTIR DE content.json
   ============================================================ */
const ZONES = [ { x: -16, z: -6 }, { x: -3, z: -8 }, { x: 24, z: 8 }, { x: -15, z: 10 } ];
let activeHotspot = null;
const loadImg = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

async function build(){
  const json = await (await fetch('data/content.json')).json();
  DATA = json.data; UI = json.ui;
  await Promise.all([document.fonts.load(FONT(700, 30)), document.fonts.load(FONT(600, 30))]).catch(() => {});
  const projects = [...DATA.proyectos].sort((a, b) => a.year - b.year);
  const covers = await Promise.all(projects.map(p => loadImg(p.image)));

  const spots = [
    { x: -24, z: -1, kind: 'icon', emoji: '🎮', color: '#FFD3A1', label: UI[lang].videojuegosFavoritos, panel: PANELS.videojuegos },
    { x: -22, z: -12, kind: 'house', label: UI[lang].miHistoria, panel: PANELS.historia },
    { x: -12, z: -13, kind: 'icon', emoji: '📚', color: '#F9C98F', label: UI[lang].misGustos, panel: PANELS.gustos },
    { x: -10, z: -3, kind: 'icon', emoji: '🎵', color: '#FFE2BE', label: UI[lang].musicaTitle, panel: PANELS.musica },
  ];
  const grid = [[0,-12],[7,-12],[14,-12],[21,-12],[25,-2],[18,-2],[11,-2],[4,-2],[3,8],[10,8],[17,8],[24,8]];
  projects.forEach((p, i) => {
    const [x, z] = grid[i] || [R(-5, 25), R(-12, 10)];
    spots.push({ x, z, kind: 'project', project: p, img: covers[i], label: L(p.title), panel: () => PANELS.proyecto(p) });
  });
  spots.push({ x: 27, z: 14, kind: 'icon', emoji: '🏆', color: '#F6B26B', label: UI[lang].reconocimientosTitle, panel: PANELS.reconocimientos });
  spots.push({ x: -18, z: 13, kind: 'icon', emoji: '✉️', color: '#F9C98F', label: UI[lang].contactoTitle, panel: PANELS.contacto });

  const toCam = CAM_DIR.clone().multiplyScalar(2.6);
  spots.forEach(s => s.approach = new THREE.Vector3(s.x, 0, s.z).add(toCam));
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-16, 0, -6), ...spots.map(s => s.approach)], false, 'centripetal');
  const pathPts = curve.getSpacedPoints(900);
  const pond = { x: 9, z: -17.5, rx: 3.2, rz: 1.5 };
  buildBook(pathPts, pond);
  const distToPath = (x, z) => { let d = Infinity; for (const p of pathPts){ const dd = (p.x - x)**2 + (p.z - z)**2; if (dd < d) d = dd; } return Math.sqrt(d); };

  spots.forEach(s => {
    let obj, col = 1.0;
    if (s.kind === 'house'){ obj = cutout(drawHouse(s.label), 6.2); col = 2.4; }
    else if (s.kind === 'project') obj = cutout(drawProjectCard(s.img, s.project.year, s.label), 5.4);
    else obj = cutout(drawIconCard(s.emoji, s.label, s.color), 4.6);
    const p = addPopup(obj, s.x, s.z, 11.5, { info: true });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 48), new THREE.MeshBasicMaterial({ color: 0xF29A4A, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI/2; ring.position.set(s.approach.x, 0.09, s.approach.z); scene.add(ring);
    hotspots.push({ ...s, mesh: obj.mesh, popup: p, ring, top: obj.height });
    colliders.push({ x: s.x, z: s.z, r: col });
  });

  const signs = [
    { x: -18, z: -7, text: UI[lang].rooms[0] }, { x: -4, z: -10.5, text: UI[lang].rooms[1] },
    { x: 30, z: 9, text: UI[lang].rooms[2] }, { x: -24, z: 9, text: UI[lang].rooms[3] }
  ];
  signs.forEach(s => { addPopup(cutout(drawSign(s.text), 2.8), s.x, s.z, 14); colliders.push({ x: s.x, z: s.z, r: 0.5 }); });
  addPopup(cutout(paper(260, 200, drawDog), 1.4), -17.5, -15, 8, { sway: 0.01 });

  const kinds = [
    { n: 'pine', w: 160, h: 300, draw: drawPine, hgt: [3.2, 4.6], weight: 4, sway: 0.025 },
    { n: 'tree', w: 260, h: 300, draw: drawTree, hgt: [3, 4], weight: 3, sway: 0.03 },
    { n: 'bush', w: 260, h: 140, draw: drawBush, hgt: [1.1, 1.6], weight: 4, sway: 0.035 },
    { n: 'mush', w: 140, h: 150, draw: drawMushroom, hgt: [0.9, 1.5], weight: 2, sway: 0.01 },
    { n: 'rock', w: 200, h: 120, draw: drawRock, hgt: [0.7, 1.2], weight: 2, sway: 0 },
    { n: 'flow', w: 200, h: 160, draw: drawFlowers, hgt: [0.8, 1.1], weight: 3, sway: 0.07 }
  ];
  const variants = {};
  kinds.forEach(k => variants[k.n] = [0, 1, 2].map(() => paper(k.w, k.h, k.draw)));
  const bag = kinds.flatMap(k => Array(k.weight).fill(k));
  const blockers = [...spots.map(s => ({ x: s.x, z: s.z, r: s.kind === 'house' ? 4.5 : 3.6 })), ...signs.map(s => ({ x: s.x, z: s.z, r: 2.2 })), { x: -17.5, z: -15, r: 2 }];
  let placed = 0;
  for (let tries = 0; tries < 2000 && placed < 180; tries++){
    const x = R(-BOUNDS.x + 0.5, BOUNDS.x - 0.5), z = R(-BOUNDS.z + 0.5, BOUNDS.z - 0.5);
    if (distToPath(x, z) < 2.4) continue;
    if (blockers.some(b => (b.x - x)**2 + (b.z - z)**2 < b.r**2)) continue;
    if (((x - pond.x) / (pond.rx + 1))**2 + ((z - pond.z) / (pond.rz + 1))**2 < 1) continue;
    const k = pick(bag), v = Math.floor(rand() * 3);
    const big = k.n === 'pine' || k.n === 'tree';
    addPopup(cutout(variants[k.n][v], R(...k.hgt), k.n + v), x, z, big ? 9 : 7.5, { sway: k.sway });
    if (big) colliders.push({ x, z, r: 0.6 });
    blockers.push({ x, z, r: big ? 1.6 : 0.9 });
    placed++;
  }

  // --- interfaz ---
  const T = TXT[lang] || TXT.es;
  document.getElementById('pageTitle').textContent = UI[lang].title;
  document.getElementById('hint').textContent = isTouch ? T.hintTouch : T.hint;
  const langBtn = document.getElementById('langBtn');
  langBtn.textContent = UI[lang].langBtn;
  langBtn.onclick = () => { saveSetting('portafolio-lang', lang === 'es' ? 'en' : 'es'); location.reload(); };
  const themeBtn = document.getElementById('themeBtn');
  themeBtn.title = T.theme; themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.onclick = () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    saveSetting('portafolio-theme', theme);
  };
  const listBtn = document.getElementById('listBtn');
  listBtn.title = T.list; listBtn.querySelector('.lbl').textContent = T.list;
  listBtn.onclick = openListView;
  document.getElementById('closePanel').setAttribute('aria-label', T.close);
  const nav = document.getElementById('nav');
  UI[lang].rooms.forEach((name, i) => {
    const b = document.createElement('button'); b.className = 'nav-btn'; b.textContent = name;
    b.onclick = () => { player.pos.set(ZONES[i].x, 0, ZONES[i].z); camTarget.copy(player.pos); player.target = null; };
    nav.appendChild(b);
  });
  document.getElementById('prompt').addEventListener('click', () => activeHotspot && openHotspot(activeHotspot));
  document.getElementById('loadingMsg').remove();
  requestAnimationFrame(loop);
}

function openHotspot(hs){ openPanel(hs.panel()); }
window.__mundo = { player, popups, hotspots, openHotspot };   // útil para depurar desde la consola

/* ============================================================
   7. BUCLE PRINCIPAL
   ============================================================ */
const clock = new THREE.Clock();
const promptEl = document.getElementById('prompt');
const tmpV = new THREE.Vector3();

function update(dt){
  const time = clock.elapsedTime;

  // --- día / noche (transición suave) ---
  night = lerp(night, theme === 'dark' ? 1 : 0, 1 - Math.exp(-dt * 2.5));
  hemi.color.lerpColors(LIGHTS.day.sky, LIGHTS.night.sky, night);
  hemi.groundColor.lerpColors(LIGHTS.day.ground, LIGHTS.night.ground, night);
  hemi.intensity = lerp(LIGHTS.day.hemi, LIGHTS.night.hemi, night);
  sun.color.lerpColors(LIGHTS.day.sun, LIGHTS.night.sun, night);
  sun.intensity = lerp(LIGHTS.day.sunI, LIGHTS.night.sunI, night);
  lantern.intensity = night * 16;   // suave: si es muy fuerte, las tarjetas cercanas se queman
  if (pageMat) pageMat.color.lerpColors(PAGE_DAY, PAGE_NIGHT, night);

  // --- movimiento ---
  let ix = 0, iz = 0;
  if (!overlayOpen()){
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (keys.has('w') || keys.has('arrowup')) iz += 1;
    if (keys.has('s') || keys.has('arrowdown')) iz -= 1;
  }
  const move = new THREE.Vector3();
  if (ix || iz){ move.addScaledVector(RIGHT, ix).addScaledVector(FWD, iz).normalize(); player.target = null; player.pending = null; }
  else if (player.target){
    move.subVectors(player.target, player.pos); move.y = 0;
    if (move.length() < 0.2){
      move.set(0, 0, 0); player.target = null;
      if (player.pending){ const hs = player.pending; player.pending = null; openHotspot(hs); }
    } else move.normalize();
  }
  const moving = move.lengthSq() > 0;
  if (moving){
    player.pos.addScaledVector(move, 9 * dt);
    for (const c of colliders){
      const dx = player.pos.x - c.x, dz = player.pos.z - c.z, d = Math.hypot(dx, dz);
      if (d < c.r && d > 0.0001){
        const nx = dx / d, nz = dz / d;
        player.pos.x = c.x + nx * c.r; player.pos.z = c.z + nz * c.r;
        const tx = -nz, tz = nx, s = (move.x * tx + move.z * tz) >= 0 ? 1 : -1;   // rodear el obstáculo
        player.pos.x += tx * s * 6 * dt; player.pos.z += tz * s * 6 * dt;
      }
    }
    if (player.target){   // destino inalcanzable: se rinde tras un momento
      const left = player.pos.distanceTo(player.target);
      player.stuck = left > (player.lastLeft ?? Infinity) - 0.01 ? (player.stuck || 0) + dt : 0;
      player.lastLeft = left;
      if (player.stuck > 1.2){ player.target = null; player.pending = null; player.stuck = 0; }
    }
    player.pos.x = clamp(player.pos.x, -BOUNDS.x, BOUNDS.x);
    player.pos.z = clamp(player.pos.z, -BOUNDS.z, BOUNDS.z);
    const side = move.dot(RIGHT); if (Math.abs(side) > 0.15) player.facing = side > 0 ? 1 : -1;
    player.phase += dt * 13;
  } else player.phase = 0;
  const hop = Math.abs(Math.sin(player.phase)) * 0.22;
  const idle = moving ? 0 : Math.sin(time * 2.2) * 0.03;   // respira un poco aunque esté quieto
  playerArt.pivot.position.set(player.pos.x, hop, player.pos.z);
  playerArt.mesh.scale.set(lerp(playerArt.mesh.scale.x, player.facing, 1 - Math.exp(-dt * 18)), 1 + idle, 1);
  playerArt.mesh.rotation.z = moving ? Math.sin(player.phase) * 0.07 : 0;
  playerArt.mesh.material.emissiveIntensity = 0.12 - night * 0.08;
  shadowBlob.position.set(player.pos.x, 0.04, player.pos.z);
  shadowBlob.scale.setScalar(1 - hop * 0.8);
  lantern.position.set(player.pos.x + 1.2, 3.2, player.pos.z + 1.2);

  // --- ambiente ---
  const gust = ambient.update(dt, time, camTarget);

  // --- recortes que se levantan (resorte con rebote, como papel) ---
  const dim = lerp(1, 0.55, night);
  for (const p of popups){
    const d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z);
    const target = d < p.reveal ? 1 : 0;
    p.wait = target ? (p.wait ?? 0) + dt : 0;
    const goal = target && p.wait > p.delay ? 1 : 0;
    p.v += (110 * (goal - p.t) - 12 * p.v) * dt; p.t += p.v * dt;
    p.pivot.rotation.x = -Math.PI/2 * (1 - clamp(p.t, -0.05, 1.12));
    const k = clamp(p.t, 0, 1);
    // acostado = ilustración "impresa" (más pálida); de pie = cobra vida y gana luz
    const base = p.info ? lerp(1, 0.8, night) : dim;
    p.mesh.material.color.setRGB((0.82 + 0.18*k) * base, (0.80 + 0.2*k) * base, (0.74 + 0.26*k) * base);
    p.mesh.material.emissiveIntensity = p.info ? k * lerp(0.32, 0.2, night) : k * lerp(0.16, 0.04, night);
    p.pivot.scale.setScalar(0.88 + 0.12*k);
    // viento: los que están de pie se mecen suavemente aunque el personaje esté quieto
    if (p.sway) p.mesh.rotation.z = Math.sin(time * 1.5 + p.swaySeed + p.x * 0.15) * p.sway * gust * k;
  }

  // --- parada más cercana ---
  activeHotspot = null; let best = 3.6;
  for (const h of hotspots){
    const d = Math.hypot(h.approach.x - player.pos.x, h.approach.z - player.pos.z);
    if (d < best && h.popup.t > 0.6){ best = d; activeHotspot = h; }
  }
  hotspots.forEach(h => {
    const on = h === activeHotspot;
    h.ring.material.opacity = lerp(h.ring.material.opacity, on ? 0.95 : h.popup.t > 0.5 ? 0.45 : 0, 1 - Math.exp(-dt * 8));
    h.ring.scale.setScalar(on ? 1 + Math.sin(time * 5) * 0.08 : 1);
    if (on) h.mesh.material.emissiveIntensity += lerp(0.12, 0.04, night);   // la parada activa resalta
  });
  if (activeHotspot && !overlayOpen()){
    tmpV.set(activeHotspot.x, activeHotspot.top + 0.3, activeHotspot.z).project(camera);
    promptEl.style.left = ((tmpV.x + 1) / 2 * container.clientWidth) + 'px';
    promptEl.style.top = ((1 - tmpV.y) / 2 * container.clientHeight) + 'px';
    promptEl.innerHTML = isTouch ? `${TXT[lang].tap}: ${activeHotspot.label}` : `<kbd>E</kbd>${UI[lang].ver}: ${activeHotspot.label}`;
    promptEl.style.display = 'block';
  } else promptEl.style.display = 'none';

  let zi = 0, zd = Infinity;
  ZONES.forEach((z, i) => { const d = Math.hypot(z.x - player.pos.x, z.z - player.pos.z); if (d < zd){ zd = d; zi = i; } });
  [...document.getElementById('nav').children].forEach((b, i) => b.classList.toggle('active', i === zi));

  camTarget.lerp(player.pos, 1 - Math.exp(-dt * 4));
  // mira un poco por delante del personaje: así la barra superior no tapa lo que está arriba
  tmpV.copy(camTarget).addScaledVector(FWD, 2.4);
  camera.position.copy(tmpV).add(CAM_OFF); camera.lookAt(tmpV);
  sun.position.copy(camTarget).add(SUN_OFF); sun.target.position.copy(camTarget);
}

function loop(){
  const dt = Math.min(clock.getDelta(), 0.05);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

build().catch(err => {
  console.error(err);
  document.getElementById('loadingMsg').innerHTML = 'No se pudo cargar el mundo. Revisa la consola y que estés usando un servidor local.';
});
