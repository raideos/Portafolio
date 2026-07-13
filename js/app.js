/* ============================================================
   Este archivo NO contiene tu información personal.
   Todo el contenido y las imágenes viven en:
     - data/content.json   (textos, links de música, rutas de imagen)
     - images/              (los archivos de imagen en sí)
   Edita esos dos lugares para actualizar el portafolio.
   ============================================================ */

let DATA, UI;

fetch('data/content.json')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo leer content.json');
    return res.json();
  })
  .then(json => {
    DATA = json.data;
    UI = json.ui;
    document.getElementById('loadingMsg').remove();
    initGame();
  })
  .catch(err => {
    console.error(err);
    document.getElementById('loadingMsg').innerHTML =
      'No se pudo cargar <code>data/content.json</code>.<br>' +
      'Si abriste este archivo con doble clic, necesitas un servidor local ' +
      '(revisa el README.md) o subirlo a GitHub Pages.';
  });

function initGame(){

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 960, H = 540;

function setupCanvasResolution(){
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupCanvasResolution();
window.addEventListener('resize', setupCanvasResolution);

// Recupera preferencias guardadas de una visita anterior (si el navegador lo permite)
function loadSaved(key, fallback){
  try {
    const v = localStorage.getItem(key);
    return v ? v : fallback;
  } catch(e) { return fallback; } // ej: almacenamiento bloqueado en vista previa embebida
}
function saveSetting(key, value){
  try { localStorage.setItem(key, value); } catch(e) { /* no disponible, se ignora */ }
}

let currentTheme = loadSaved('portafolio-theme', 'light');
let currentLang = loadSaved('portafolio-lang', 'es');
document.documentElement.setAttribute('data-theme', currentTheme);
document.getElementById('themeBtn').textContent = currentTheme === 'light' ? '🌙' : '☀️';

const CANVAS_THEME = {
  light: {
    text:'#3D3B54', cardBg:'rgba(255,255,255,.6)',
    hotspotBg:'#FFFFFF', hotspotActiveBg:'#FFD9A0',
    doorBg:'rgba(61,59,84,.10)', rug:'rgba(255,255,255,.35)',
    rooms:{
      'sobre-mi':{wall:'#F7E9E4', floor:'#F1DAD1'},
      'proyectos':{wall:'#E4ECFA', floor:'#D7E3F5'},
      'otras-experiencias':{wall:'#FDF3D9', floor:'#F8E8BE'},
      'contacto':{wall:'#E1F5EA', floor:'#CDEBD9'}
    }
  },
  dark: {
    text:'#F2EEFB', cardBg:'rgba(0,0,0,.35)',
    hotspotBg:'#3A3552', hotspotActiveBg:'#FFCB80',
    doorBg:'rgba(0,0,0,.3)', rug:'rgba(255,255,255,.05)',
    rooms:{
      'sobre-mi':{wall:'#3A2E38', floor:'#2E2430'},
      'proyectos':{wall:'#242C42', floor:'#1B2233'},
      'otras-experiencias':{wall:'#3B331F', floor:'#2C2618'},
      'contacto':{wall:'#213A2F', floor:'#182B22'}
    }
  }
};

const ROOMS = [
  { id:'sobre-mi', hotspots:[
      {x:180, y:360, icon:'📚', labelKey:'misGustos', panel:()=>renderGustosPanel()},
      {x:390, y:360, icon:'🎮', labelKey:'videojuegosFavoritos', panel:()=>renderVideojuegosPanel()},
      {x:600, y:360, icon:'🎵', labelKey:'musicaTitle', panel:()=>renderMusicaPanel()},
      {x:810, y:360, icon:'📝', labelKey:'miHistoria', panel:()=>renderHistoriaPanel()},
  ]},
  { id:'proyectos', hotspots:[
      {x:480, y:360, icon:'🗂️', labelKey:'lineaTiempo', panel:()=>renderProjectsPanel()},
  ]},
  { id:'otras-experiencias', hotspots:[
      {x:480, y:360, icon:'🏆', labelKey:'reconocimientosTitle', panel:()=>renderRecognitionsPanel()},
  ]},
  { id:'contacto', hotspots:[
      {x:480, y:360, icon:'💻', labelKey:'contactoTitle', panel:()=>renderContactPanel()},
  ]}
];

let currentRoom = 0;
const player = { x: 90, y: 360, speed: 3.4, facing: 1, animT: 0 };
const keyVector = { x:0, y:0 };
const touchVector = { x:0, y:0 };
let activeHotspot = null;

const navEl = document.getElementById('nav');
function buildNav(){
  navEl.innerHTML = '';
  UI[currentLang].rooms.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = name;
    btn.onclick = () => goToRoom(i);
    navEl.appendChild(btn);
  });
  refreshNav();
}
function refreshNav(){ [...navEl.children].forEach((b,i)=> b.classList.toggle('active', i===currentRoom)); }
function goToRoom(i){ currentRoom = i; player.x = 90; refreshNav(); }
buildNav();

function updateStaticTexts(){
  document.getElementById('pageTitle').textContent = UI[currentLang].title;
  document.getElementById('subtitle').textContent = UI[currentLang].subtitle;
  document.getElementById('langBtn').textContent = UI[currentLang].langBtn;
  buildNav();
}
updateStaticTexts();

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keyVector.x = -1;
  if (k === 'arrowright' || k === 'd') keyVector.x = 1;
  if (k === 'arrowup' || k === 'w') keyVector.y = -1;
  if (k === 'arrowdown' || k === 's') keyVector.y = 1;
  if (k === 'e' || e.key === ' ') tryInteract();
  if (e.key === 'Escape') closePanel();
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if ((k === 'arrowleft' || k === 'a') && keyVector.x < 0) keyVector.x = 0;
  if ((k === 'arrowright' || k === 'd') && keyVector.x > 0) keyVector.x = 0;
  if ((k === 'arrowup' || k === 'w') && keyVector.y < 0) keyVector.y = 0;
  if ((k === 'arrowdown' || k === 's') && keyVector.y > 0) keyVector.y = 0;
});

const joystick = document.getElementById('joystick');
const knob = document.getElementById('joystickKnob');
let joyPointerId = null, joyCenter = {x:0,y:0};
const JOY_RADIUS = 34;
joystick.addEventListener('pointerdown', e => {
  joyPointerId = e.pointerId;
  const rect = joystick.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  joystick.setPointerCapture(e.pointerId);
});
joystick.addEventListener('pointermove', e => {
  if (e.pointerId !== joyPointerId) return;
  let dx = e.clientX - joyCenter.x, dy = e.clientY - joyCenter.y;
  const dist = Math.min(Math.hypot(dx,dy), JOY_RADIUS);
  const angle = Math.atan2(dy,dx);
  const kx = Math.cos(angle) * dist, ky = Math.sin(angle) * dist;
  knob.style.transform = `translate(${kx}px, ${ky}px)`;
  touchVector.x = kx / JOY_RADIUS; touchVector.y = ky / JOY_RADIUS;
});
function resetJoystick(e){
  if (e.pointerId !== joyPointerId) return;
  joyPointerId = null; touchVector.x = 0; touchVector.y = 0;
  knob.style.transform = 'translate(0,0)';
}
joystick.addEventListener('pointerup', resetJoystick);
joystick.addEventListener('pointercancel', resetJoystick);

function tryInteract(){ if (activeHotspot) openPanel(activeHotspot.panel()); }
document.getElementById('prompt').addEventListener('click', tryInteract);

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width, scaleY = H / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  const room = ROOMS[currentRoom];
  for (const hs of room.hotspots) {
    if (Math.hypot(mx - hs.x, my - (hs.y - 18)) < 34) openPanel(hs.panel());
  }
});

document.getElementById('themeBtn').addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  document.getElementById('themeBtn').textContent = currentTheme === 'light' ? '🌙' : '☀️';
  saveSetting('portafolio-theme', currentTheme);
});
document.getElementById('langBtn').addEventListener('click', () => {
  currentLang = currentLang === 'es' ? 'en' : 'es';
  updateStaticTexts();
  saveSetting('portafolio-lang', currentLang);
  if (overlay.style.display === 'flex' && activeHotspot) openPanel(activeHotspot.panel());
});

function update(){
  const room = ROOMS[currentRoom];
  const dx = (touchVector.x !== 0 || touchVector.y !== 0) ? touchVector.x : keyVector.x;
  const dy = (touchVector.x !== 0 || touchVector.y !== 0) ? touchVector.y : keyVector.y;
  if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    player.x += (dx/len) * player.speed;
    player.y += (dy/len) * player.speed * 0.55;
    player.animT += 0.2;
  }
  player.x = Math.max(40, Math.min(W - 40, player.x));
  player.y = Math.max(300, Math.min(420, player.y));

  if (player.x <= 45 && currentRoom > 0) { currentRoom--; player.x = W - 90; refreshNav(); }
  if (player.x >= W - 45 && currentRoom < ROOMS.length - 1) { currentRoom++; player.x = 90; refreshNav(); }

  activeHotspot = null;
  const prompt = document.getElementById('prompt');
  for (const hs of room.hotspots) {
    if (Math.hypot(player.x - hs.x, player.y - hs.y) < 70) { activeHotspot = hs; break; }
  }
  if (activeHotspot) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / W, scaleY = rect.height / H;
    prompt.style.left = (activeHotspot.x * scaleX) + 'px';
    prompt.style.top = ((activeHotspot.y - 80) * scaleY) + 'px';
    prompt.textContent = UI[currentLang].ver + ': ' + UI[currentLang][activeHotspot.labelKey];
    prompt.style.display = 'block';
  } else { prompt.style.display = 'none'; }
}

function draw(){
  const room = ROOMS[currentRoom];
  const theme = CANVAS_THEME[currentTheme];
  const pal = theme.rooms[room.id];

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = pal.wall; roundRectPath(0,0,W,270,0); ctx.fill();
  ctx.fillStyle = pal.floor; roundRectPath(0,270,W,H-270,0); ctx.fill();

  ctx.fillStyle = theme.rug;
  ctx.beginPath(); ctx.ellipse(W/2, 400, 220, 60, 0, 0, Math.PI*2); ctx.fill();

  if (currentRoom > 0) drawDoor(20, theme);
  if (currentRoom < ROOMS.length - 1) drawDoor(W - 60, theme);

  const roomName = UI[currentLang].rooms[currentRoom];
  ctx.fillStyle = theme.cardBg;
  roundRectPath(24, 24, roomName.length * 11 + 40, 40, 20); ctx.fill();
  ctx.fillStyle = theme.text;
  ctx.font = '600 18px Quicksand, sans-serif';
  ctx.fillText(roomName, 44, 50);

  room.hotspots.forEach(hs => {
    const isActive = hs === activeHotspot;
    const r = isActive ? 34 : 30;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = isActive ? theme.hotspotActiveBg : theme.hotspotBg;
    ctx.beginPath(); ctx.arc(hs.x, hs.y - 18, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.font = (isActive ? 30 : 26) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hs.icon, hs.x, hs.y - 16);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  });

  drawPlayer();
}

function drawDoor(x, theme){
  ctx.fillStyle = theme.doorBg;
  roundRectPath(x, 150, 40, 260, 16); ctx.fill();
  ctx.fillStyle = '#FFD9A0';
  ctx.beginPath(); ctx.arc(x + (x < W/2 ? 32 : 8), 280, 4, 0, Math.PI*2); ctx.fill();
}

// Dragoncito en tonos naranja (color favorito)
function drawPlayer(){
  const bob = Math.sin(player.animT) * 4;
  const x = player.x, y = player.y + bob;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(player.facing, 1);

  ctx.fillStyle = 'rgba(61,59,84,.15)';
  ctx.beginPath(); ctx.ellipse(0, 44, 26, 8, 0, 0, Math.PI*2); ctx.fill();

  ctx.save();
  ctx.shadowColor = 'rgba(61,59,84,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FF9F5B';
  roundRectPath(-24, -32, 48, 56, 24); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#FFF1E0';
  ctx.beginPath(); ctx.ellipse(0, 8, 14, 16, 0, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle = '#E8823D';
  ctx.beginPath();
  ctx.moveTo(14,-16); ctx.quadraticCurveTo(34,-24, 20,4); ctx.quadraticCurveTo(10,-6,14,-16); ctx.fill();

  ctx.fillStyle = '#FFD9A0';
  ctx.beginPath(); ctx.moveTo(-14,-30); ctx.quadraticCurveTo(-10,-42,-4,-30); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2,-32); ctx.quadraticCurveTo(6,-44,12,-32); ctx.fill();

  ctx.fillStyle = '#3D3B54';
  ctx.beginPath(); ctx.arc(6,-14,3,0,Math.PI*2); ctx.fill();

  ctx.fillStyle = 'rgba(255,111,89,.55)';
  ctx.beginPath(); ctx.arc(-2,-6,5,0,Math.PI*2); ctx.fill();

  ctx.restore();
}

function roundRectPath(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();

/* ============================================================
   PANELES DE INFORMACIÓN
   ============================================================ */

const overlay = document.getElementById('overlay');
const panelBody = document.getElementById('panelBody');
document.getElementById('closePanel').onclick = closePanel;
overlay.addEventListener('click', e => { if (e.target === overlay) closePanel(); });
function openPanel(html){ panelBody.innerHTML = html; overlay.style.display = 'flex'; }
function closePanel(){ overlay.style.display = 'none'; }

function renderHistoriaPanel(){
  const t = UI[currentLang];
  const h = DATA.sobreMi.historia;
  const foto = DATA.sobreMi.foto;
  return `<h2>${t.miHistoria}</h2>
    ${foto ? `<img class="profile-photo" src="${foto}" alt="foto">` : ''}
    <div class="profile-name">${h.nombre[currentLang]}</div>
    <ul class="bullet-list">${h.bullets.map(b=>`<li>${b[currentLang]}</li>`).join('')}</ul>`;
}
function renderGustosPanel(){
  const t = UI[currentLang];
  const items = DATA.sobreMi.gustos;
  return `<h2>${t.misGustos}</h2><div class="game-grid">${items.map(g => `
    <div class="game-card">
      ${g.image ? `<img src="${g.image}" alt="${g.name[currentLang]}">` : ''}
      <div class="game-name">${g.name[currentLang]}</div>
      <div class="game-desc">${g.description[currentLang]}</div>
    </div>`).join('')}</div>`;
}
function renderVideojuegosPanel(){
  const t = UI[currentLang];
  const items = DATA.sobreMi.videojuegosFavoritos;
  return `<h2>${t.videojuegosFavoritos}</h2><div class="game-grid">${items.map(g => `
    <div class="game-card">
      ${g.image ? `<img src="${g.image}" alt="${g.name[currentLang]}">` : ''}
      <div class="game-name">${g.name[currentLang]}</div>
    </div>`).join('')}</div>`;
}
function getEmbedUrl(url){
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return { type:'youtube', src:`https://www.youtube.com/embed/${m[1]}` };
  m = url.match(/open\.spotify\.com\/(track|album|playlist)\/([\w]+)/);
  if (m) return { type:'spotify', src:`https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  return null;
}
function renderMusicaPanel(){
  const t = UI[currentLang];
  const items = DATA.sobreMi.musica;
  return `<h2>${t.musicaTitle}</h2><p class="music-disclaimer">${t.musicaDisclaimer}</p>` + items.map(m => {
    const embed = getEmbedUrl(m.url);
    const title = m.title[currentLang];
    if (!embed) return `<div class="entry"><div class="entry-title">${title}</div></div>`;
    const cls = embed.type === 'youtube' ? 'yt-embed' : 'spotify-embed';
    return `<div class="entry">
      <div class="entry-title">${title}</div>
      <iframe class="${cls}" src="${embed.src}" allow="autoplay; encrypted-media" loading="lazy"></iframe>
    </div>`;
  }).join('');
}
function renderProjectsPanel(){
  const t = UI[currentLang];
  const sorted = [...DATA.proyectos].sort((a,b)=>b.year-a.year);
  return `<h2>${t.lineaTiempo}</h2>` + sorted.map(p => `
    <div class="entry project-entry">
      ${p.image ? `
      <div class="project-thumb-wrap">
        <img class="project-thumb img-base" src="${p.image}" alt="${p.title[currentLang]}">
        ${p.imageHover ? `<img class="project-thumb img-hover" src="${p.imageHover}" alt="${p.title[currentLang]}">` : ''}
      </div>` : ''}
      <div class="project-text">
        <span class="entry-year">${p.year}</span>${(p.tags[currentLang]||[]).map(tg=>`<span class="tag">${tg}</span>`).join('')}
        <div class="entry-title">${p.title[currentLang]}</div>
        <div class="entry-desc">${p.description[currentLang]}</div>
        ${p.link ? `<a class="entry-link" href="${p.link}" target="_blank" rel="noopener">${t.verProyecto}</a>` : ''}
      </div>
    </div>`).join('');
}
function renderRecognitionsPanel(){
  const t = UI[currentLang];
  const sorted = [...DATA.reconocimientos].sort((a,b)=>b.year-a.year);
  return `<h2>${t.reconocimientosTitle}</h2>` + sorted.map(r => `
    <div class="entry">
      <span class="entry-year">${r.year}</span><span class="tag">${r.role[currentLang]}</span>
      <div class="entry-title">${r.title[currentLang]}</div>
      <div class="entry-desc">${r.description[currentLang]}</div>
    </div>`).join('');
}
function renderContactPanel(){
  const t = UI[currentLang];
  return `<h2>${t.contactoTitle}</h2>` + DATA.contacto.map(c => `
    <div class="entry">
      <div class="entry-title">${c.icon} ${c.label[currentLang]}</div>
      <a class="entry-link" href="${c.url}" target="_blank" rel="noopener">${t.abrir}</a>
    </div>`).join('');
}

} // fin de initGame()
