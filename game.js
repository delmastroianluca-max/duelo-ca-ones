// ============================================================
//  DUELO DE CAÑONES — v2.0 (botones abajo, no tapan el juego)
// ============================================================

// ---------- LIMPIAR VERSIONES VIEJAS ----------
if (localStorage.getItem('duelo-prefs-v5') !== 'ok') {
  localStorage.removeItem('duelo-prefs');
  localStorage.setItem('duelo-prefs-v2', 'ok');
  localStorage.setItem('duelo-prefs-v3', 'ok');
  localStorage.setItem('duelo-prefs-v4', 'ok');
  localStorage.setItem('duelo-prefs-v5', 'ok');
}

// ---------- CONFIG ----------
const W = 900, H = 560;
const GROUND_Y = H - 60;

const GRAVITY      = 600;
const MAX_SPEED    = 900;
const MIN_SPEED    = 250;
const CHARGE_TIME  = 1.2;
const COOLDOWN     = 1.5;
const DISPERSION   = 5;

const MAX_HP = 250;
const DMG    = 20;
const DMG_SUDDEN = 50;

const SUDDEN_TIME = 60;
const TURNO_TIME  = 30;
const MAX_GLOBOS = 2;
const GLOBO_RADIO = 18;
const GLOBO_INTERVALO_MIN = 6;
const GLOBO_INTERVALO_MAX = 9;
const DURACIONES = [3, 5, 6, 10];

const MOVE_SPEED = 220;
const JUMP_SPEED = -450;
const JUMP_CEILING = 100;

const PLAT_LEFT_MIN  = 60;
const PLAT_LEFT_MAX  = 200;
const PLAT_RIGHT_MIN = W - 200;
const PLAT_RIGHT_MAX = W - 60;

const ANGLE_MIN_P1 = -85;
const ANGLE_MAX_P1 = -10;
const ANGLE_MIN_P2 = -170;
const ANGLE_MAX_P2 = -95;

const ES_TACTIL = (
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0 ||
  window.matchMedia('(pointer: coarse)').matches ||
  window.matchMedia('(any-pointer: coarse)').matches ||
  /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
);

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const SKINS = {
  canon:  { emoji: '🎯', name: 'Cañón' },
  robot:  { emoji: '🤖', name: 'Robot' },
  alien:  { emoji: '👽', name: 'Alien' },
  cohete: { emoji: '🚀', name: 'Cohete' },
  tanque: { emoji: '🎖️', name: 'Tanque' },
  barco:  { emoji: '🚢', name: 'Barco' }
};

const COLORES = [
  '#00ffcc', '#ff3366', '#ffcc33', '#55aaff', '#bb66ff',
  '#66ff66', '#ff9933', '#ff66cc', '#ffffff', '#8899aa'
];

const FONDOS = {
  oscuro:   { name: '🌑 Oscuro',   sky1: '#1a2238', sky2: '#0a0e1a', ground: '#0f1526', line: '#2a3555' },
  claro:    { name: '☀️ Claro',    sky1: '#cce4ff', sky2: '#88b0e0', ground: '#88aa88', line: '#556655' },
  infierno: { name: '🔥 Infierno', sky1: '#3a0a0a', sky2: '#180505', ground: '#2a0a0a', line: '#ff4400' },
  guerra:   { name: '🏚️ Guerra',   sky1: '#3a3a3a', sky2: '#1a1a1a', ground: '#2a2a2a', line: '#666' },
  paisaje:  { name: '🏔️ Paisaje',  sky1: '#88ccff', sky2: '#ddeeff', ground: '#4a7a3a', line: '#2a4a1a' },
  espacio:  { name: '🌌 Espacio',  sky1: '#0a0520', sky2: '#000010', ground: '#1a1030', line: '#5533aa' },
  oceano:   { name: '🌊 Océano',   sky1: '#88ccff', sky2: '#ffddaa', ground: '#2a5a8a', line: '#1a3a5a' }
};

const BUFFS = {
  heal:      { icon: '❤️', name: 'Curación',     rareza: 'comun',      color: '#66ff66', dur: 0   },
  regen:     { icon: '✨', name: 'Regeneración',  rareza: 'comun',      color: '#66ff66', dur: 2   },
  dmg2:      { icon: '💥', name: 'Daño doble',    rareza: 'pococomun',  color: '#55aaff', dur: 10  },
  vision:    { icon: '👁️', name: 'Visión',        rareza: 'pococomun',  color: '#55aaff', dur: 10  },
  metralleta:{ icon: '🔫', name: 'Metralleta',    rareza: 'rara',       color: '#bb66ff', dur: 10  },
  rebote:    { icon: '🏀', name: 'Rebote',        rareza: 'rara',       color: '#bb66ff', dur: 10  },
  escudo:    { icon: '🛡️', name: 'Escudo',        rareza: 'muyrara',    color: '#ff9933', dur: 10  },
  freeze:    { icon: '❄️', name: 'Congelar',      rareza: 'muyrara',    color: '#ff9933', dur: 4   },
  inmunidad: { icon: '⭐', name: 'Inmunidad',     rareza: 'legendaria', color: '#ff3333', dur: 5   }
};

const COLOR_RAREZA = { comun: '#66ff66', pococomun: '#55aaff', rara: '#bb66ff', muyrara: '#ff9933', legendaria: '#ff3333' };
const PESOS_RAREZA = { comun: 50, pococomun: 30, rara: 15, muyrara: 4, legendaria: 1 };
const BUFFS_POR_RAREZA = {
  comun: ['heal', 'regen'], pococomun: ['dmg2', 'vision'],
  rara: ['metralleta', 'rebote'], muyrara: ['escudo', 'freeze'],
  legendaria: ['inmunidad']
};

// ============================================================
//   POSICIONES DE BOTONES TÁCTILES
// ============================================================
// Se adaptan a la orientación (vertical/horizontal) en buildTouchControls.
// Posiciones por defecto en una sola fila pegada al fondo.
const TOUCH_DEFAULT = {
  jump:       { fromLeft: 20,  fromBottom: 30, icono: '⤒', label: 'SALTAR',  cls: 'jump-btn' },
  aimUp:      { fromLeft: 100, fromBottom: 30, icono: '▲', label: 'ARRIBA',  cls: 'aim-btn' },
  moveLeft:   { fromLeft: 180, fromBottom: 30, icono: '◀', label: 'IZQ',     cls: '' },
  aimDown:    { fromLeft: 260, fromBottom: 30, icono: '▼', label: 'ABAJO',   cls: 'aim-btn' },
  moveRight:  { fromLeft: 340, fromBottom: 30, icono: '▶', label: 'DER',     cls: '' },
  shoot:      { fromRight: 20, fromBottom: 30, icono: '🔥', label: 'DISPARAR', cls: 'shoot-btn' }
};

const DEFAULT_PREFS = {
  keys: {
    p1: { left: 'a', right: 'd', aimUp: 'w', aimDown: 's', jump: 'q', shoot: ' ' },
    p2: { left: 'ArrowLeft', right: 'ArrowRight', aimUp: 'ArrowUp', aimDown: 'ArrowDown', jump: '0', shoot: 'Enter' }
  },
  skins: {
    p1: { skin: 'canon', color: '#00ffcc' },
    p2: { skin: 'canon', color: '#ff3366' }
  },
  fondo: 'oscuro',
  duracion: 6,
  botlevel: 'casual',
  touch: JSON.parse(JSON.stringify(TOUCH_DEFAULT))
};

let prefs = loadPrefs();

function loadPrefs() {
  try {
    const raw = localStorage.getItem('duelo-prefs');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_PREFS));
    const p = JSON.parse(raw);
    const merged = JSON.parse(JSON.stringify(DEFAULT_PREFS));

    if (p.keys) {
      if (p.keys.p1) Object.assign(merged.keys.p1, p.keys.p1);
      if (p.keys.p2) Object.assign(merged.keys.p2, p.keys.p2);
    }
    for (const pid of ['p1', 'p2']) {
      for (const action of ['left', 'right', 'aimUp', 'aimDown', 'jump', 'shoot']) {
        if (!merged.keys[pid][action]) merged.keys[pid][action] = DEFAULT_PREFS.keys[pid][action];
      }
    }
    if (p.skins) {
      Object.assign(merged.skins.p1, p.skins.p1 || {});
      Object.assign(merged.skins.p2, p.skins.p2 || {});
    }
    if (p.fondo) merged.fondo = p.fondo;
    if (p.duracion) merged.duracion = p.duracion;
    if (p.botlevel) merged.botlevel = p.botlevel;
    if (p.touch) {
      for (const key of Object.keys(TOUCH_DEFAULT)) {
        if (p.touch[key]) merged.touch[key] = p.touch[key];
      }
    }
    return merged;
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_PREFS));
  }
}
function savePrefs() { localStorage.setItem('duelo-prefs', JSON.stringify(prefs)); }

function makePlayer(id, x, angle) {
  return {
    id, x, y: GROUND_Y, angle,
    vy: 0,
    enAire: false,
    charging: false, charge: 0,
    lastShot: -999,
    hp: MAX_HP,
    buffs: {},
    frozenUntil: 0,
    regenAcum: 0,
    danioTotal: 0,
    esBot: false,
    botLevel: null,
    botThink: 0,
    botTargetX: x,
    botJumpCooldown: 0,
    botWaitUntil: 0,
    botTurnoStart: 0
  };
}

const players = {
  1: makePlayer(1, 120, -45),
  2: makePlayer(2, W - 120, -135)
};

function colorDe(id) { return prefs.skins['p' + id].color; }
function skinDe(id)  { return prefs.skins['p' + id].skin; }
function fondo()     { return FONDOS[prefs.fondo] || FONDOS.oscuro; }
function nameDe(id)  { return players[id].esBot ? 'CPU' : 'J' + id; }

const bullets = [];
const particles = [];
const globos = [];

let now = 0;
let gameOver = false;
let nextGloboSpawn = 3;
let modoActual = 'local';
let faseActual = 'normal';
let tiempoRestante = 360;
let suddenStartTime = 0;
let turnoActual = 1;
let tiempoTurno = TURNO_TIME;

const AMBIENTE = { particulas: [], fondoActual: null };

function initAmbiente(nombreFondo, cantidadMax, w, h) {
  AMBIENTE.fondoActual = nombreFondo;
  AMBIENTE.particulas = [];
  if (nombreFondo === 'oscuro') {
    for (let i = 0; i < 15; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*8, vy: -10-Math.random()*20, r: 1+Math.random()*2, life: 1, color: '#66ffcc' });
  } else if (nombreFondo === 'claro') {
    for (let i = 0; i < 6; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: 60+Math.random()*(h-200), vx: 15+Math.random()*25, vy: (Math.random()-0.5)*10, phase: Math.random()*Math.PI*2, r: 2+Math.random()*2, color: Math.random()<0.5 ? '#ffee44' : '#ff88aa' });
  } else if (nombreFondo === 'infierno') {
    for (let i = 0; i < 18; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: h-Math.random()*200, vx: (Math.random()-0.5)*20, vy: -30-Math.random()*40, r: 1+Math.random()*2.5, life: 1, color: Math.random()<0.6 ? '#ff6600' : '#ffcc00' });
  } else if (nombreFondo === 'guerra') {
    for (let i = 0; i < 12; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*15, vy: -5-Math.random()*15, r: 1+Math.random()*2, life: 1, color: Math.random()<0.5 ? '#888' : '#ff8844' });
  } else if (nombreFondo === 'paisaje') {
    for (let i = 0; i < 8; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: 100+Math.random()*(h-250), vx: 20+Math.random()*30, vy: (Math.random()-0.5)*20, phase: Math.random()*Math.PI*2, r: 3+Math.random()*3, color: Math.random()<0.5 ? '#88ff88' : '#ffffff' });
  } else if (nombreFondo === 'espacio') {
    for (let i = 0; i < 15; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, r: 0.5+Math.random()*1.5, life: 1, color: Math.random()<0.6 ? '#ffffff' : '#aaccff' });
  } else if (nombreFondo === 'oceano') {
    for (let i = 0; i < 10; i++) AMBIENTE.particulas.push({ x: Math.random()*w, y: 100+Math.random()*(h-200), vx: 30+Math.random()*40, vy: (Math.random()-0.5)*15, phase: Math.random()*Math.PI*2, r: 2+Math.random()*2, color: '#ffffff' });
  }
}

function updateAmbiente(dt, w, h) {
  const arr = AMBIENTE.particulas;
  const nombre = AMBIENTE.fondoActual;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (nombre === 'oscuro' || nombre === 'infierno' || nombre === 'guerra') {
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
    }
    if (nombre === 'claro' || nombre === 'paisaje' || nombre === 'oceano') {
      if (p.phase !== undefined) p.phase += dt * 4;
      if (p.x > w + 20) { p.x = -20; p.y = 100 + Math.random() * (h - 250); }
    }
    if (nombre === 'espacio') {
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;
      if (p.y < -5) p.y = h + 5;
      if (p.y > h + 5) p.y = -5;
    }
  }
}

function drawAmbiente(c, w, h) {
  const arr = AMBIENTE.particulas;
  const nombre = AMBIENTE.fondoActual;
  for (const p of arr) {
    c.globalAlpha = 0.7;
    c.fillStyle = p.color;
    if (nombre === 'claro' || nombre === 'paisaje' || nombre === 'oceano') {
      const flap = Math.abs(Math.sin(p.phase || 0));
      c.beginPath();
      c.ellipse(p.x, p.y, p.r*1.5, p.r*(0.5+flap*0.6), 0, 0, Math.PI*2);
      c.fill();
    } else {
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI*2);
      c.fill();
    }
  }
  c.globalAlpha = 1;
}

function drawCielo(c, w, h, nombre) {
  const f = FONDOS[nombre];
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, f.sky1);
  grad.addColorStop(1, f.sky2);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
}

function drawFondo(c, w, h, nombre, tiempo, esJuego) {
  const f = FONDOS[nombre];
  const groundY = esJuego ? GROUND_Y : h - 40;
  drawCielo(c, w, h, nombre);

  if (nombre === 'oscuro') {
    c.fillStyle = '#fff';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 79.3) % (groundY - 40);
      const tw = 0.5 + 0.5 * Math.sin(tiempo * 2 + i);
      c.globalAlpha = 0.4 + tw * 0.6;
      c.beginPath(); c.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    c.shadowColor = '#ddeeff'; c.shadowBlur = 40;
    c.fillStyle = '#eef6ff';
    c.beginPath(); c.arc(w - 120, 80, 26, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
  } else if (nombre === 'claro') {
    c.fillStyle = '#7aa86a';
    c.beginPath();
    c.moveTo(0, groundY);
    c.quadraticCurveTo(w * 0.2, groundY - 90, w * 0.4, groundY - 30);
    c.quadraticCurveTo(w * 0.6, groundY - 140, w * 0.8, groundY - 50);
    c.quadraticCurveTo(w * 0.9, groundY - 20, w, groundY - 60);
    c.lineTo(w, groundY); c.fill();
  } else if (nombre === 'infierno') {
    c.fillStyle = '#1a0505';
    c.beginPath();
    c.moveTo(0, groundY); c.lineTo(80, groundY - 140); c.lineTo(180, groundY - 80);
    c.lineTo(300, groundY - 200); c.lineTo(430, groundY - 100); c.lineTo(560, groundY - 180);
    c.lineTo(700, groundY - 90); c.lineTo(820, groundY - 150); c.lineTo(w, groundY - 60);
    c.lineTo(w, groundY); c.fill();
  } else if (nombre === 'guerra') {
    c.fillStyle = '#1a1a1a';
    const bh = [70, 110, 90, 140, 80];
    bh.forEach((hh, i) => {
      const x = i * (w / bh.length);
      c.fillRect(x, groundY - hh, w / bh.length - 4, hh);
    });
  } else if (nombre === 'paisaje') {
    c.fillStyle = '#7a9aba';
    c.beginPath();
    c.moveTo(0, groundY); c.lineTo(120, groundY - 180); c.lineTo(280, groundY - 80);
    c.lineTo(430, groundY - 220); c.lineTo(600, groundY - 100); c.lineTo(780, groundY - 190);
    c.lineTo(w, groundY - 70); c.lineTo(w, groundY); c.fill();
  } else if (nombre === 'espacio') {
    for (let i = 0; i < 50; i++) {
      const sx = (i * 131.7) % w;
      const sy = (i * 87.3) % groundY;
      const tw = 0.4 + 0.6 * Math.sin(tiempo * 2 + i * 0.7);
      c.fillStyle = '#fff'; c.globalAlpha = tw;
      c.beginPath(); c.arc(sx, sy, (i % 3) * 0.5 + 0.5, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  } else if (nombre === 'oceano') {
    const seaTop = groundY - 90;
    const sg = c.createLinearGradient(0, seaTop, 0, groundY);
    sg.addColorStop(0, '#3a7aaa'); sg.addColorStop(1, '#1a4a7a');
    c.fillStyle = sg; c.fillRect(0, seaTop, w, groundY - seaTop);
  }

  if (nombre !== 'oceano') {
    c.fillStyle = f.ground;
    c.fillRect(0, groundY, w, h - groundY);
    c.strokeStyle = f.line; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, groundY); c.lineTo(w, groundY); c.stroke();
  } else {
    const wg = c.createLinearGradient(0, groundY, 0, h);
    wg.addColorStop(0, '#1a4a7a'); wg.addColorStop(1, '#0a2540');
    c.fillStyle = wg; c.fillRect(0, groundY, w, h - groundY);
  }
  drawAmbiente(c, w, h);
}

let inGame = false;
let currentScreen = 'menu';

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
  currentScreen = name;
  inGame = (name === 'game');
  document.getElementById('bg-canvas').style.display = inGame ? 'none' : 'block';

  if (inGame) {
    initAmbiente(prefs.fondo, 20, W, H);
    if (ES_TACTIL) showTouchControls(true);
  } else {
    showTouchControls(false);
  }
  if (name === 'skins') {
    initAspectos();
    initAmbiente(prefs.fondo, 12, previewCanvas.width, previewCanvas.height);
    drawPreview();
  }
  if (name === 'settings') initAjustes();
  if (name === 'duracion') initDuracion();
  if (name === 'touch-edit') initTouchEditor();
}

document.querySelectorAll('[data-go]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.getAttribute('data-go')));
});

document.getElementById('btn-vsbot').addEventListener('click', () => showScreen('botlevel'));
document.getElementById('btn-local').addEventListener('click', () => {
  modoActual = 'local';
  players[1].esBot = false;
  players[2].esBot = false;
  showScreen('duracion');
});
document.getElementById('btn-online').addEventListener('click', () => showToast('Modo online próximamente 🚧'));
document.getElementById('btn-back').addEventListener('click', () => showScreen('menu'));

document.querySelectorAll('[data-botlevel]').forEach(btn => {
  btn.addEventListener('click', () => {
    const nivel = btn.getAttribute('data-botlevel');
    prefs.botlevel = nivel;
    savePrefs();
    modoActual = 'bot';
    players[1].esBot = false;
    players[2].esBot = true;
    players[2].botLevel = nivel;
    if (nivel === 'basico') { prefs.skins.p2.skin = 'canon'; prefs.skins.p2.color = '#66ff66'; }
    if (nivel === 'casual') { prefs.skins.p2.skin = 'robot'; prefs.skins.p2.color = '#ffcc33'; }
    if (nivel === 'profesional') { prefs.skins.p2.skin = 'tanque'; prefs.skins.p2.color = '#ff3333'; }
    savePrefs();
    showScreen('duracion');
  });
});

document.getElementById('btn-empezar').addEventListener('click', () => {
  startGame();
  showScreen('game');
});
document.getElementById('btn-dur-volver').addEventListener('click', () => showScreen('mode'));

let toastTimeout = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 2200);
}

function initDuracion() {
  const cont = document.getElementById('dur-grid');
  cont.innerHTML = '';
  DURACIONES.forEach(min => {
    const btn = document.createElement('button');
    btn.className = 'dur-btn' + (prefs.duracion === min ? ' active' : '');
    btn.textContent = min + ' min';
    btn.onclick = () => { prefs.duracion = min; savePrefs(); initDuracion(); };
    cont.appendChild(btn);
  });
}

let listeningKey = null;

function teclaTexto(k) {
  if (k === ' ') return 'ESPACIO';
  if (k === 'Enter') return 'ENTER';
  if (k === 'ArrowLeft') return '←';
  if (k === 'ArrowRight') return '→';
  if (k === 'ArrowUp') return '↑';
  if (k === 'ArrowDown') return '↓';
  if (k.length === 1) return k.toUpperCase();
  return k;
}

function initAjustes() {
  document.querySelectorAll('.key-btn').forEach(btn => {
    const p = btn.getAttribute('data-player');
    const a = btn.getAttribute('data-action');
    btn.textContent = teclaTexto(prefs.keys['p' + p][a]);
    btn.classList.remove('listening');
    btn.onclick = () => {
      if (listeningKey) listeningKey.btn.classList.remove('listening');
      listeningKey = { player: p, action: a, btn };
      btn.classList.add('listening');
      btn.textContent = 'PULSA TECLA…';
    };
  });
}

document.addEventListener('keydown', e => {
  if (listeningKey) {
    e.preventDefault();
    if (e.key === 'Escape') {
      const { player, action, btn } = listeningKey;
      btn.classList.remove('listening');
      btn.textContent = teclaTexto(prefs.keys['p' + player][action]);
      listeningKey = null;
      return;
    }
    const { player, action, btn } = listeningKey;
    prefs.keys['p' + player][action] = e.key;
    savePrefs();
    btn.classList.remove('listening');
    btn.textContent = teclaTexto(e.key);
    listeningKey = null;
  }
});

document.getElementById('btn-reset-keys').addEventListener('click', () => {
  prefs.keys = JSON.parse(JSON.stringify(DEFAULT_PREFS.keys));
  savePrefs();
  initAjustes();
  showToast('Teclas restauradas');
});

document.getElementById('btn-edit-touch').addEventListener('click', () => showScreen('touch-edit'));

document.getElementById('btn-reset-touch').addEventListener('click', () => {
  prefs.touch = JSON.parse(JSON.stringify(TOUCH_DEFAULT));
  savePrefs();
  showToast('Posiciones restauradas');
});

function initTouchEditor() {
  const area = document.getElementById('touch-edit-area');
  area.innerHTML = '';
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;

  const botones = [
    { id: 'moveLeft',  icono: '◀' },
    { id: 'moveRight', icono: '▶' },
    { id: 'aimUp',     icono: '▲' },
    { id: 'aimDown',   icono: '▼' },
    { id: 'jump',      icono: '⤒' },
    { id: 'shoot',     icono: '🔥' }
  ];

  botones.forEach(b => {
    const pos = prefs.touch[b.id];
    const btn = document.createElement('div');
    btn.className = 'touch-btn';
    btn.dataset.id = b.id;
    btn.innerHTML = b.icono;

    const size = b.id === 'shoot' ? 90 : 68;
    btn.style.width = size + 'px';
    btn.style.height = size + 'px';

    let x, y;
    if (pos.fromRight !== undefined) {
      x = areaW - pos.fromRight - size;
    } else {
      x = pos.fromLeft || 16;
    }
    if (pos.fromTop !== undefined) {
      y = pos.fromTop;
    } else {
      y = areaH - (pos.fromBottom || 16) - size;
    }
    x = Math.max(0, Math.min(areaW - size, x));
    y = Math.max(0, Math.min(areaH - size, y));

    btn.style.left = x + 'px';
    btn.style.top = y + 'px';

    makeDraggable(btn, area);
    area.appendChild(btn);
  });
}

function makeDraggable(el, area) {
  let startX = 0, startY = 0, iniX = 0, iniY = 0;
  let dragging = false;

  const onDown = (e) => {
    const ev = e.touches ? e.touches[0] : e;
    dragging = true;
    startX = ev.clientX;
    startY = ev.clientY;
    iniX = parseFloat(el.style.left);
    iniY = parseFloat(el.style.top);
    el.classList.add('dragging');
    e.preventDefault();
  };
  const onMove = (e) => {
    if (!dragging) return;
    const ev = e.touches ? e.touches[0] : e;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    const areaRect = area.getBoundingClientRect();
    let nx = iniX + dx;
    let ny = iniY + dy;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    nx = Math.max(0, Math.min(areaRect.width - w, nx));
    ny = Math.max(0, Math.min(areaRect.height - h, ny));
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
    e.preventDefault();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('dragging');
  };

  el.addEventListener('touchstart', onDown, { passive: false });
  el.addEventListener('mousedown', onDown);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchend', onUp);
  document.addEventListener('mouseup', onUp);
}

document.getElementById('btn-touch-save').addEventListener('click', () => {
  const area = document.getElementById('touch-edit-area');
  const botones = area.querySelectorAll('.touch-btn');
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;

  botones.forEach(btn => {
    const id = btn.dataset.id;
    const x = parseFloat(btn.style.left);
    const y = parseFloat(btn.style.top);
    const w = btn.offsetWidth;
    const h = btn.offsetHeight;

    const nuevo = { ...TOUCH_DEFAULT[id] };
    if (y < areaH / 2) {
      delete nuevo.fromBottom;
      nuevo.fromTop = y;
    } else {
      delete nuevo.fromTop;
      nuevo.fromBottom = areaH - y - h;
    }
    if (x + w / 2 > areaW / 2) {
      delete nuevo.fromLeft;
      nuevo.fromRight = areaW - x - w;
    } else {
      delete nuevo.fromRight;
      nuevo.fromLeft = x;
    }
    prefs.touch[id] = nuevo;
  });
  savePrefs();
  showToast('Posiciones guardadas');
  showScreen('settings');
});

document.getElementById('btn-touch-cancel').addEventListener('click', () => showScreen('settings'));

const touchState = {
  moveLeft: false, moveRight: false,
  aimUp: false, aimDown: false,
  jump: false, shoot: false,
  jumpPressedThisFrame: false
};

function showTouchControls(active) {
  const cont = document.getElementById('touch-controls');
  if (!ES_TACTIL) {
    cont.classList.remove('active');
    return;
  }
  if (active) {
    buildTouchControls();
    cont.classList.add('active');
  } else {
    cont.classList.remove('active');
  }
}

function getJugadorActual() {
  if (!ES_TACTIL) return 1;
  if (modoActual === 'bot') return 1;
  if (modoActual === 'local') return turnoActual;
  return 1;
}

// ============================================================
//   CONSTRUIR BOTONES TÁCTILES (con layout adaptativo)
// ============================================================
function buildTouchControls() {
  const cont = document.getElementById('touch-controls');
  cont.innerHTML = '';
  const pw = window.innerWidth;
  const ph = window.innerHeight;
  const esVertical = ph > pw;

  const btnSize = esVertical ? 62 : 54;
  const bigSize = esVertical ? 84 : 76;

  const botones = [
    { id: 'jump',      icono: '⤒', cls: 'jump-btn',  size: btnSize },
    { id: 'aimUp',     icono: '▲', cls: 'aim-btn',   size: btnSize },
    { id: 'moveLeft',  icono: '◀', cls: '',          size: btnSize },
    { id: 'aimDown',   icono: '▼', cls: 'aim-btn',   size: btnSize },
    { id: 'moveRight', icono: '▶', cls: '',          size: btnSize },
    { id: 'shoot',     icono: '🔥', cls: 'shoot-btn', size: bigSize }
  ];

  // Ancho total de la fila de botones de la izquierda
  const filaBotones = ['jump', 'aimUp', 'moveLeft', 'aimDown', 'moveRight'];
  const sep = 8;
  const anchoIzqTotal = filaBotones.length * btnSize + (filaBotones.length - 1) * sep;
  const anchoShoot = bigSize;
  const margen = 14;

  // Si no entra todo en una fila (móvil angosto), usar 2 filas
  const noEntraEnUnaFila = (anchoIzqTotal + anchoShoot + margen * 3) > pw;

  botones.forEach(b => {
    const btn = document.createElement('div');
    btn.className = 'touch-btn ' + b.cls;
    btn.dataset.id = b.id;
    btn.innerHTML = b.icono;
    btn.style.width = b.size + 'px';
    btn.style.height = b.size + 'px';

    let x, y;

    if (b.id === 'shoot') {
      // SIEMPRE abajo a la derecha
      x = pw - margen - b.size;
      y = ph - margen - b.size;
    } else if (!noEntraEnUnaFila) {
      // Una sola fila pegada abajo
      const idx = filaBotones.indexOf(b.id);
      x = margen + idx * (btnSize + sep);
      y = ph - margen - b.size;
    } else {
      // Dos filas (móvil angosto):
      // Fila de arriba: jump, aimUp, moveLeft
      // Fila de abajo: aimDown, moveRight
      if (b.id === 'jump' || b.id === 'aimUp' || b.id === 'moveLeft') {
        const idx = ['jump', 'aimUp', 'moveLeft'].indexOf(b.id);
        x = margen + idx * (btnSize + sep);
        y = ph - margen - b.size - (btnSize + sep);
      } else {
        // aimDown, moveRight
        const idx = ['aimDown', 'moveRight'].indexOf(b.id);
        x = margen + idx * (btnSize + sep);
        y = ph - margen - b.size;
      }
    }

    x = Math.max(4, Math.min(pw - b.size - 4, x));
    y = Math.max(4, Math.min(ph - b.size - 4, y));

    btn.style.left = x + 'px';
    btn.style.top  = y + 'px';

    let jugadorCargando = null;

    const onDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');

      const action = b.id;
      const jugadorActual = getJugadorActual();

      if (action === 'jump') {
        touchState.jump = true;
        touchState.jumpPressedThisFrame = true;
        if (jugadorActual && !players[jugadorActual].esBot) tryJump(jugadorActual);
      } else if (action === 'shoot') {
        touchState.shoot = true;
        if (jugadorActual && !players[jugadorActual].esBot) {
          jugadorCargando = jugadorActual;
          tryStartCharge(jugadorActual);
        }
      } else {
        touchState[action] = true;
      }
    };

    const onUp = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      btn.classList.remove('pressed');

      const action = b.id;
      if (action === 'jump') {
        touchState.jump = false;
      } else if (action === 'shoot') {
        touchState.shoot = false;
        if (jugadorCargando && !players[jugadorCargando].esBot) {
          tryRelease(jugadorCargando);
        }
        jugadorCargando = null;
      } else {
        touchState[action] = false;
      }
    };

    btn.addEventListener('touchstart', onDown, { passive: false });
    btn.addEventListener('touchend', onUp);
    btn.addEventListener('touchcancel', onUp);
    btn.addEventListener('mousedown', onDown);
    btn.addEventListener('mouseup', onUp);
    btn.addEventListener('mouseleave', onUp);

    cont.appendChild(btn);
  });
}

window.addEventListener('resize', () => {
  if (ES_TACTIL && inGame) buildTouchControls();
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => { if (ES_TACTIL && inGame) buildTouchControls(); }, 200);
});

let currentTab = 'p1';

function initAspectos() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === currentTab);
    tab.onclick = () => {
      currentTab = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + currentTab).classList.add('active');
    };
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + currentTab).classList.add('active');

  ['p1', 'p2'].forEach(pid => {
    const cont = document.getElementById('skins-' + pid);
    cont.innerHTML = '';
    Object.entries(SKINS).forEach(([key, s]) => {
      const btn = document.createElement('button');
      btn.className = 'skin-btn' + (prefs.skins[pid].skin === key ? ' active' : '');
      btn.innerHTML = `<span class="skin-emoji">${s.emoji}</span>${s.name}`;
      btn.onclick = () => { prefs.skins[pid].skin = key; savePrefs(); initAspectos(); drawPreview(); };
      cont.appendChild(btn);
    });
  });

  ['p1', 'p2'].forEach(pid => {
    const cont = document.getElementById('colors-' + pid);
    cont.innerHTML = '';
    COLORES.forEach(col => {
      const btn = document.createElement('button');
      btn.className = 'color-btn' + (prefs.skins[pid].color === col ? ' active' : '');
      btn.style.background = col;
      btn.style.color = col;
      btn.onclick = () => { prefs.skins[pid].color = col; savePrefs(); initAspectos(); drawPreview(); };
      cont.appendChild(btn);
    });
  });

  const bgCont = document.getElementById('fondos-grid');
  bgCont.innerHTML = '';
  Object.entries(FONDOS).forEach(([key, f]) => {
    const btn = document.createElement('button');
    btn.className = 'fondo-btn' + (prefs.fondo === key ? ' active' : '');
    btn.innerHTML = `<div class="fondo-preview" style="background: linear-gradient(180deg, ${f.sky1}, ${f.sky2});"></div>${f.name}`;
    btn.onclick = () => {
      prefs.fondo = key; savePrefs(); initAspectos();
      initAmbiente(key, 12, previewCanvas.width, previewCanvas.height);
      drawPreview();
    };
    bgCont.appendChild(btn);
  });
}

const previewCanvas = document.getElementById('preview');
const previewCtx = previewCanvas.getContext('2d');

function drawPreview() {
  const pw = previewCanvas.width, ph = previewCanvas.height;
  const groundY = ph - 40;
  const t = performance.now() / 1000;
  drawFondo(previewCtx, pw, ph, prefs.fondo, t, false);
  drawCannonSkin(previewCtx, 1, 90, groundY - 20, -45, 30);
  drawCannonSkin(previewCtx, 2, pw - 90, groundY - 20, -135, 30);
}

function previewLoop() {
  if (currentScreen === 'skins') {
    updateAmbiente(1/60, previewCanvas.width, previewCanvas.height);
    drawPreview();
  }
  requestAnimationFrame(previewLoop);
}
requestAnimationFrame(previewLoop);

function drawCannonSkin(c, id, x, y, angle, barrelLen) {
  const color = colorDe(id);
  const skin = skinDe(id);
  const rad = angle * Math.PI / 180;
  c.shadowColor = color; c.shadowBlur = 12;

  if (skin === 'robot') {
    c.fillStyle = '#2a3555';
    c.fillRect(x - 16, y - 16, 32, 32);
    c.strokeStyle = color; c.lineWidth = 3;
    c.strokeRect(x - 16, y - 16, 32, 32);
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
  } else if (skin === 'alien') {
    c.fillStyle = '#2a3555';
    c.beginPath();
    c.moveTo(x, y - 20); c.lineTo(x - 18, y + 14); c.lineTo(x + 18, y + 14); c.closePath();
    c.fill();
    c.strokeStyle = color; c.lineWidth = 3; c.stroke();
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
  } else if (skin === 'cohete') {
    c.fillStyle = '#2a3555';
    c.beginPath();
    c.moveTo(x, y - 22);
    c.quadraticCurveTo(x + 16, y - 4, x + 12, y + 14);
    c.lineTo(x - 12, y + 14);
    c.quadraticCurveTo(x - 16, y - 4, x, y - 22);
    c.fill();
    c.strokeStyle = color; c.lineWidth = 3; c.stroke();
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
  } else if (skin === 'tanque') {
    c.fillStyle = '#2a3555';
    c.fillRect(x - 22, y - 8, 44, 22);
    c.strokeStyle = color; c.lineWidth = 3;
    c.strokeRect(x - 22, y - 8, 44, 22);
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y + 3, 5, 0, Math.PI * 2); c.fill();
  } else if (skin === 'barco') {
    c.fillStyle = '#5a3a2a';
    c.beginPath();
    c.moveTo(x - 22, y - 4); c.lineTo(x + 22, y - 4); c.lineTo(x + 16, y + 14); c.lineTo(x - 16, y + 14); c.closePath();
    c.fill();
    c.strokeStyle = '#3a2215'; c.lineWidth = 2; c.stroke();
  } else {
    c.fillStyle = '#2a3555';
    c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill();
    c.strokeStyle = color; c.lineWidth = 3; c.stroke();
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
  }
  c.shadowBlur = 0;
  if (skin !== 'barco') {
    c.strokeStyle = color; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(rad) * barrelLen, y + Math.sin(rad) * barrelLen); c.stroke();
  }
}

const keys = {};
function normKey(k) {
  if (k === ' ') return ' ';
  if (k === 'Spacebar') return ' ';
  if (k.length === 1) return k.toLowerCase();
  return k;
}
function teclaPulsada(configurada) {
  if (!configurada) return false;
  return !!keys[normKey(configurada)];
}
function teclaEs(k, esperada) {
  return normKey(k) === normKey(esperada);
}

document.addEventListener('keydown', e => {
  if (!inGame || listeningKey) return;
  if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();

  const norm = normKey(e.key);
  const yaEstaba = !!keys[norm];
  keys[norm] = true;

  const bloqueadoPorTurno = ES_TACTIL && (modoActual === 'local' || modoActual === 'bot');
  const puedeActuar = (id) => !bloqueadoPorTurno || turnoActual === id;

  if (!yaEstaba) {
    if (teclaEs(e.key, prefs.keys.p1.jump) && puedeActuar(1)) tryJump(1);
    if (teclaEs(e.key, prefs.keys.p2.jump) && !players[2].esBot && puedeActuar(2)) tryJump(2);
  }
  if (teclaEs(e.key, prefs.keys.p1.shoot) && puedeActuar(1)) tryStartCharge(1);
  if (teclaEs(e.key, prefs.keys.p2.shoot) && !players[2].esBot && puedeActuar(2)) tryStartCharge(2);

  if (e.key === 'Escape') showScreen('menu');
});

document.addEventListener('keyup', e => {
  if (!inGame || listeningKey) return;
  keys[normKey(e.key)] = false;
  if (teclaEs(e.key, prefs.keys.p1.shoot)) tryRelease(1);
  if (teclaEs(e.key, prefs.keys.p2.shoot) && !players[2].esBot) tryRelease(2);
});

function tryStartCharge(id) {
  const p = players[id];
  if (gameOver) return;
  if (now < p.frozenUntil) return;
  if (now - p.lastShot < cooldownDe(p)) return;
  if (p.charging) return;
  p.charging = true;
  p.charge = 0;
}

function tryRelease(id) {
  const p = players[id];
  if (!p.charging) return;
  p.charging = false;
  shoot(id, p.charge);
  p.charge = 0;

  if (ES_TACTIL && (modoActual === 'local' || modoActual === 'bot')) {
    cambiarTurno();
  }
}

function tryJump(id) {
  const p = players[id];
  if (p.enAire) return;
  if (now < p.frozenUntil) return;
  p.vy = JUMP_SPEED;
  p.enAire = true;
  for (let k = 0; k < 8; k++) {
    particles.push({
      x: p.x + (Math.random() - 0.5) * 20,
      y: GROUND_Y,
      vx: (Math.random() - 0.5) * 80,
      vy: -30 - Math.random() * 60,
      life: 0.4, maxLife: 0.4,
      color: '#aabbcc'
    });
  }
}

function tieneBuff(p, tipo) { return p.buffs[tipo] && p.buffs[tipo].t > 0; }
function aplicarBuff(p, tipo) {
  const def = BUFFS[tipo];
  if (tipo === 'heal') { p.hp = Math.min(MAX_HP, p.hp + 30); updateHUD(); return; }
  p.buffs[tipo] = { t: def.dur, dur: def.dur };
}
function cooldownDe(p) { return tieneBuff(p, 'metralleta') ? 0.3 : COOLDOWN; }
function danioDe(p) {
  const base = (faseActual === 'sudden') ? DMG_SUDDEN : DMG;
  return tieneBuff(p, 'dmg2') ? base * 2 : base;
}

function sortearRareza() {
  const total = Object.values(PESOS_RAREZA).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [rareza, peso] of Object.entries(PESOS_RAREZA)) {
    r -= peso;
    if (r <= 0) return rareza;
  }
  return 'comun';
}
function sortearBuff() {
  const rareza = sortearRareza();
  const lista = BUFFS_POR_RAREZA[rareza];
  const tipo = lista[Math.floor(Math.random() * lista.length)];
  return { tipo, rareza, def: BUFFS[tipo] };
}

function shoot(id, chargeRatio) {
  const p = players[id];
  if (now - p.lastShot < cooldownDe(p)) return;
  const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.min(1, Math.max(0, chargeRatio));
  const disp = tieneBuff(p, 'vision') ? 0 : (Math.random() * 2 - 1) * DISPERSION;
  const finalAngle = p.angle + disp;
  const rad = finalAngle * Math.PI / 180;
  const barrelLen = 34;
  const bx = p.x + Math.cos(rad) * barrelLen;
  const by = (p.y - 20) + Math.sin(rad) * barrelLen;
  bullets.push({
    x: bx, y: by,
    vx: Math.cos(rad) * speed,
    vy: Math.sin(rad) * speed,
    owner: id, trail: [],
    rebote: tieneBuff(p, 'rebote'), rebotes: 0
  });
  for (let i = 0; i < 14; i++) {
    const a = rad + (Math.random() - 0.5) * 0.6;
    const s = 150 + Math.random() * 250;
    particles.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, maxLife: 0.4, color: colorDe(id) });
  }
  p.lastShot = now;
}

function cambiarTurno() {
  turnoActual = (turnoActual === 1) ? 2 : 1;
  tiempoTurno = TURNO_TIME;
  if (players[turnoActual].esBot) {
    players[turnoActual].botTurnoStart = now;
  }
}

const BOT_CONFIG = {
  basico:      { errorAngulo: 15, errorPotencia: 0.25, salto: 0.3 },
  casual:      { errorAngulo: 8,  errorPotencia: 0.12, salto: 0.6 },
  profesional: { errorAngulo: 3,  errorPotencia: 0.03, salto: 0.9 }
};

function updateBot(dt) {
  const bot = players[2];
  if (!bot.esBot) return;

  const cfg = BOT_CONFIG[bot.botLevel] || BOT_CONFIG.casual;
  const rival = players[1];

  bot.botJumpCooldown -= dt;
  if (bot.botJumpCooldown <= 0 && !bot.enAire) {
    for (const b of bullets) {
      if (b.owner !== 2) {
        const dist = Math.hypot(b.x - bot.x, b.y - (bot.y - 20));
        if (dist < 220 && Math.random() < cfg.salto * 0.15) {
          tryJump(2);
          bot.botJumpCooldown = 2;
          break;
        }
      }
    }
  }

  bot.botThink -= dt;
  if (bot.botThink <= 0) {
    bot.botThink = 1 + Math.random() * 2;
    bot.botTargetX = PLAT_RIGHT_MIN + Math.random() * (PLAT_RIGHT_MAX - PLAT_RIGHT_MIN);
  }
  if (Math.abs(bot.x - bot.botTargetX) > 5) {
    if (bot.x < bot.botTargetX) bot.x = Math.min(PLAT_RIGHT_MAX, bot.x + MOVE_SPEED * 0.7 * dt);
    else bot.x = Math.max(PLAT_RIGHT_MIN, bot.x - MOVE_SPEED * 0.7 * dt);
  }

  const agresivo = (rival.hp <= 100 || bot.hp <= 100);

  if (bot.charging) {
    bot.charge = Math.min(1, bot.charge + dt / CHARGE_TIME);
    if (bot.charge >= 1) {
      bot.charging = false;
      botShoot();
      bot.charge = 0;
      bot.botWaitUntil = now + (agresivo ? 0.6 : 1.2) + Math.random() * 0.8;
    }
    return;
  }

  if (now < bot.botWaitUntil) return;
  const cd = cooldownDe(bot) * (agresivo ? 0.5 : 1);
  if (now - bot.lastShot < cd) return;

  bot.charging = true;
  bot.charge = 0;
}

function botShoot() {
  const bot = players[2];
  const cfg = BOT_CONFIG[bot.botLevel] || BOT_CONFIG.casual;
  const rival = players[1];
  const agresivo = (rival.hp <= 100 || bot.hp <= 100);

  let objetivoX = rival.x;
  let objetivoY = rival.y - 20;

  const dx = objetivoX - bot.x;
  const dy = objetivoY - (bot.y - 20);
  const dist = Math.hypot(dx, dy);

  let angleIdeal = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angleIdeal > 0) angleIdeal -= 360;
  angleIdeal = clamp(angleIdeal, ANGLE_MIN_P2, ANGLE_MAX_P2);

  let potenciaIdeal = clamp(250 + dist * 1.3, MIN_SPEED, MAX_SPEED);

  let errorA = (Math.random() * 2 - 1) * cfg.errorAngulo;
  if (agresivo) errorA *= 1.5;
  if (dist > 400) errorA *= 1.3;
  const angleFinal = clamp(angleIdeal + errorA, ANGLE_MIN_P2, ANGLE_MAX_P2);

  const errorP = (Math.random() * 2 - 1) * cfg.errorPotencia;
  const potenciaFinal = potenciaIdeal * (1 + errorP);

  bot.angle = angleFinal;
  const chargeRatio = clamp((potenciaFinal - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 0, 1);

  const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * chargeRatio;
  const rad = bot.angle * Math.PI / 180;
  const barrelLen = 34;
  const bx = bot.x + Math.cos(rad) * barrelLen;
  const by = (bot.y - 20) + Math.sin(rad) * barrelLen;
  bullets.push({
    x: bx, y: by,
    vx: Math.cos(rad) * speed,
    vy: Math.sin(rad) * speed,
    owner: 2, trail: [],
    rebote: tieneBuff(bot, 'rebote'), rebotes: 0
  });
  for (let i = 0; i < 14; i++) {
    const a = rad + (Math.random() - 0.5) * 0.6;
    const s = 150 + Math.random() * 250;
    particles.push({ x: bx, y: by, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4, maxLife: 0.4, color: colorDe(2) });
  }
  bot.lastShot = now;
  bot.botTargetX = PLAT_RIGHT_MIN + Math.random() * (PLAT_RIGHT_MAX - PLAT_RIGHT_MIN);
}

function update(dt) {
  now += dt;

  if (!gameOver && faseActual !== 'over') {
    tiempoRestante -= dt;
    if (faseActual === 'normal' && tiempoRestante <= 0) {
      faseActual = 'sudden';
      tiempoRestante = SUDDEN_TIME;
      suddenStartTime = now;
    } else if (faseActual === 'sudden' && tiempoRestante <= 0) {
      terminarPorTiempo();
      return;
    }
  }

  if (ES_TACTIL && (modoActual === 'local' || modoActual === 'bot') && !gameOver) {
    const p = players[turnoActual];

    if (p.esBot) {
      if (now - p.botTurnoStart > 1.2 + Math.random() * 1) {
        botShoot();
        cambiarTurno();
      }
    } else {
      tiempoTurno -= dt;
      if (tiempoTurno <= 0) {
        if (p.charging) {
          tryRelease(turnoActual);
        } else {
          shoot(turnoActual, 0.5);
          cambiarTurno();
        }
      }
    }
  }

  for (const id of [1, 2]) {
    const p = players[id];
    if (p.esBot) continue;
    if (now < p.frozenUntil) continue;

    const bloqueado = ES_TACTIL && (modoActual === 'local' || modoActual === 'bot') && turnoActual !== id;
    if (bloqueado) continue;

    let dirIzq = teclaPulsada(prefs.keys['p' + id].left);
    let dirDer = teclaPulsada(prefs.keys['p' + id].right);
    let aimArriba = teclaPulsada(prefs.keys['p' + id].aimUp);
    let aimAbajo = teclaPulsada(prefs.keys['p' + id].aimDown);

    if (ES_TACTIL) {
      const esMiTurno = (modoActual === 'bot') ? (id === 1 && turnoActual === 1) : (turnoActual === id);
      if (esMiTurno) {
        if (touchState.moveLeft) dirIzq = true;
        if (touchState.moveRight) dirDer = true;
        if (touchState.aimUp) aimArriba = true;
        if (touchState.aimDown) aimAbajo = true;
      }
    }

    const rotSpeed = 70 * dt;
    if (aimArriba) p.angle -= rotSpeed;
    if (aimAbajo)  p.angle += rotSpeed;

    if (id === 1) p.angle = clamp(p.angle, ANGLE_MIN_P1, ANGLE_MAX_P1);
    else          p.angle = clamp(p.angle, ANGLE_MIN_P2, ANGLE_MAX_P2);

    const platMin = id === 1 ? PLAT_LEFT_MIN : PLAT_RIGHT_MIN;
    const platMax = id === 1 ? PLAT_LEFT_MAX : PLAT_RIGHT_MAX;
    if (dirIzq) p.x = Math.max(platMin, p.x - MOVE_SPEED * dt);
    if (dirDer) p.x = Math.min(platMax, p.x + MOVE_SPEED * dt);
  }

  touchState.jumpPressedThisFrame = false;

  if (players[2].esBot && !ES_TACTIL) {
    updateBot(dt);
  }
  if (players[2].esBot && ES_TACTIL) {
    const bot = players[2];
    bot.botThink -= dt;
    if (bot.botThink <= 0) {
      bot.botThink = 1 + Math.random() * 2;
      bot.botTargetX = PLAT_RIGHT_MIN + Math.random() * (PLAT_RIGHT_MAX - PLAT_RIGHT_MIN);
    }
    if (Math.abs(bot.x - bot.botTargetX) > 5) {
      if (bot.x < bot.botTargetX) bot.x = Math.min(PLAT_RIGHT_MAX, bot.x + MOVE_SPEED * 0.5 * dt);
      else bot.x = Math.max(PLAT_RIGHT_MIN, bot.x - MOVE_SPEED * 0.5 * dt);
    }
  }

  for (const id of [1, 2]) {
    const p = players[id];
    if (p.enAire) {
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= GROUND_Y) {
        p.y = GROUND_Y;
        p.vy = 0;
        p.enAire = false;
        for (let k = 0; k < 10; k++) {
          particles.push({
            x: p.x + (Math.random() - 0.5) * 24,
            y: GROUND_Y,
            vx: (Math.random() - 0.5) * 120,
            vy: -20 - Math.random() * 50,
            life: 0.5, maxLife: 0.5,
            color: '#aabbcc'
          });
        }
      }
      if (p.y < JUMP_CEILING) { p.y = JUMP_CEILING; p.vy = 0; }
    }
  }

  for (const id of [1, 2]) {
    const p = players[id];
    if (p.charging && !p.esBot) {
      if (now < p.frozenUntil) { p.charging = false; p.charge = 0; }
      else p.charge = Math.min(1, p.charge + dt / CHARGE_TIME);
    }
  }

  for (const id of [1, 2]) {
    const p = players[id];
    for (const tipo of Object.keys(p.buffs)) {
      p.buffs[tipo].t -= dt;
      if (p.buffs[tipo].t <= 0) delete p.buffs[tipo];
    }
    if (tieneBuff(p, 'regen')) {
      p.regenAcum += dt;
      while (p.regenAcum >= 0.10) {
        p.regenAcum -= 0.10;
        p.hp = Math.min(MAX_HP, p.hp + 1);
        updateHUD();
      }
    } else p.regenAcum = 0;
  }

  updateAmbiente(dt, W, H);

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 14) b.trail.shift();

    let explotado = false;
    for (let j = globos.length - 1; j >= 0; j--) {
      const g = globos[j];
      if (Math.hypot(b.x - g.x, b.y - g.y) < GLOBO_RADIO + 6) {
        aplicarBuff(players[b.owner], g.tipo);
        for (let k = 0; k < 26; k++) {
          const a = Math.random() * Math.PI * 2;
          const s = 100 + Math.random() * 300;
          particles.push({ x: g.x, y: g.y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5, maxLife: 0.5, color: g.color });
        }
        globos.splice(j, 1);
        bullets.splice(i, 1);
        explotado = true;
        break;
      }
    }
    if (explotado) continue;

    let hit = false;
    for (const id of [1, 2]) {
      if (id === b.owner) continue;
      const p = players[id];
      const dx = b.x - p.x;
      const dy = b.y - (p.y - 20);
      if (Math.hypot(dx, dy) < 24) {
        if (tieneBuff(p, 'inmunidad')) {
          for (let k = 0; k < 12; k++) {
            const a = Math.random() * Math.PI * 2;
            particles.push({ x: b.x, y: b.y, vx: Math.cos(a)*200, vy: Math.sin(a)*200, life: 0.4, maxLife: 0.4, color: '#ffffff' });
          }
        } else if (tieneBuff(p, 'escudo')) {
          delete p.buffs['escudo'];
          for (let k = 0; k < 20; k++) {
            const a = Math.random() * Math.PI * 2;
            particles.push({ x: b.x, y: b.y, vx: Math.cos(a)*250, vy: Math.sin(a)*250, life: 0.5, maxLife: 0.5, color: '#ffcc33' });
          }
        } else {
          const dmg = danioDe(players[b.owner]);
          p.hp = Math.max(0, p.hp - dmg);
          players[b.owner].danioTotal += dmg;
          updateHUD();
          for (let k = 0; k < 24; k++) {
            const a = Math.random() * Math.PI * 2;
            const s = 100 + Math.random() * 300;
            particles.push({ x: b.x, y: b.y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5, maxLife: 0.5, color: colorDe(id) });
          }
        }
        bullets.splice(i, 1);
        hit = true;
        break;
      }
    }
    if (hit) continue;

    if (b.y >= GROUND_Y) {
      if (b.rebote && b.rebotes < 1) {
        b.y = GROUND_Y - 1;
        b.vy = -Math.abs(b.vy) * 0.7;
        b.vx *= 0.85;
        b.rebotes++;
      } else {
        for (let k = 0; k < 12; k++) particles.push({ x: b.x, y: GROUND_Y, vx: (Math.random()-0.5)*300, vy: -Math.random()*250, life: 0.3, maxLife: 0.3, color: '#ffaa44' });
        bullets.splice(i, 1);
        continue;
      }
    }
    if (b.x < -60 || b.x > W + 60 || b.y > H + 60) bullets.splice(i, 1);
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 400 * dt;
    pt.life -= dt;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  nextGloboSpawn -= dt;
  if (nextGloboSpawn <= 0 && globos.length < MAX_GLOBOS) {
    const sorteo = sortearBuff();
    globos.push({
      x: 150 + Math.random() * (W - 300),
      y: H - 150 - Math.random() * 150,
      vy: -18, phase: Math.random() * Math.PI * 2,
      tipo: sorteo.tipo, rareza: sorteo.rareza, def: sorteo.def,
      color: COLOR_RAREZA[sorteo.rareza]
    });
    nextGloboSpawn = GLOBO_INTERVALO_MIN + Math.random() * (GLOBO_INTERVALO_MAX - GLOBO_INTERVALO_MIN);
  }
  for (let i = globos.length - 1; i >= 0; i--) {
    const g = globos[i];
    g.phase += 1.5 * dt;
    g.x += Math.sin(g.phase) * 25 * dt;
    g.y += g.vy * dt;
    if (g.y < -50) globos.splice(i, 1);
  }

  if (!gameOver && (players[1].hp <= 0 || players[2].hp <= 0)) {
    gameOver = true;
    faseActual = 'over';
    const winnerId = players[1].hp <= 0 ? 2 : 1;
    mostrarVictoria(winnerId, 'Vida reducida a 0');
    return;
  }

  updateBuffBar();
  updateDebug();
  updateTimer();
  updateTurnBanner();
}

function updateTimer() {
  const min = Math.floor(Math.max(0, tiempoRestante) / 60);
  const sec = Math.floor(Math.max(0, tiempoRestante) % 60);
  const timerEl = document.getElementById('timer');
  const phaseEl = document.getElementById('timer-phase');
  timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  if (faseActual === 'sudden') {
    timerEl.classList.add('sudden'); phaseEl.classList.add('sudden');
    phaseEl.textContent = '💀 MUERTE SÚBITA 💀';
  } else {
    timerEl.classList.remove('sudden'); phaseEl.classList.remove('sudden');
    phaseEl.textContent = 'PARTIDA NORMAL';
  }
}

function updateTurnBanner() {
  const banner = document.getElementById('turn-banner');
  if (!ES_TACTIL || gameOver) {
    banner.classList.remove('show');
    return;
  }
  banner.classList.add('show');
  const color = colorDe(turnoActual);
  banner.style.color = color;
  banner.style.borderColor = color;
  const seg = Math.max(0, Math.floor(tiempoTurno));
  const nombre = nameDe(turnoActual);
  banner.textContent = `TURNO DE ${nombre} · ${seg}s`;
}

function updateBuffBar() {
  for (const id of [1, 2]) {
    const p = players[id];
    const cont = document.getElementById('buffs' + id);
    const html = [];
    for (const tipo of Object.keys(p.buffs)) {
      const def = BUFFS[tipo];
      const info = p.buffs[tipo];
      const pct = Math.max(0, (info.t / info.dur) * 100);
      html.push(`<div class="buff" style="--p:${pct}%">${def.icon}</div>`);
    }
    cont.innerHTML = html.join('');
  }
}

function updateDebug() {
  document.getElementById('cd1').textContent = Math.max(0, cooldownDe(players[1]) - (now - players[1].lastShot)).toFixed(1) + 's';
  document.getElementById('cd2').textContent = Math.max(0, cooldownDe(players[2]) - (now - players[2].lastShot)).toFixed(1) + 's';
  document.getElementById('dmg1').textContent = players[1].danioTotal;
  document.getElementById('dmg2').textContent = players[2].danioTotal;
  document.getElementById('name-p1').textContent = nameDe(1);
  document.getElementById('name-p2').textContent = nameDe(2);
}

function draw() {
  drawFondo(ctx, W, H, prefs.fondo, now, true);

  ctx.fillStyle = '#1e2a4488';
  ctx.fillRect(PLAT_LEFT_MIN, GROUND_Y - 12, PLAT_LEFT_MAX - PLAT_LEFT_MIN, 12);
  ctx.fillRect(PLAT_RIGHT_MIN, GROUND_Y - 12, PLAT_RIGHT_MAX - PLAT_RIGHT_MIN, 12);
  ctx.strokeStyle = fondo().line;
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAT_LEFT_MIN, GROUND_Y - 12, PLAT_LEFT_MAX - PLAT_LEFT_MIN, 12);
  ctx.strokeRect(PLAT_RIGHT_MIN, GROUND_Y - 12, PLAT_RIGHT_MAX - PLAT_RIGHT_MIN, 12);

  for (const id of [1, 2]) {
    const p = players[id];
    if (tieneBuff(p, 'vision')) {
      const rad = p.angle * Math.PI / 180;
      const bx = p.x, by = p.y - 20;
      const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * p.charge;
      let sx = bx + Math.cos(rad) * 34;
      let sy = by + Math.sin(rad) * 34;
      let svx = Math.cos(rad) * speed;
      let svy = Math.sin(rad) * speed;
      ctx.strokeStyle = colorDe(id) + '88';
      ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      for (let k = 0; k < 60; k++) {
        svy += GRAVITY * 0.03;
        sx += svx * 0.03;
        sy += svy * 0.03;
        if (sy > GROUND_Y) break;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
  }

  for (const g of globos) {
    ctx.shadowColor = g.color; ctx.shadowBlur = 20;
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.arc(g.x, g.y, GLOBO_RADIO, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff44';
    ctx.beginPath(); ctx.arc(g.x - 5, g.y - 5, GLOBO_RADIO * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(g.def.icon, g.x, g.y + 1);
  }

  for (const id of [1, 2]) drawCannonGame(id);

  for (const b of bullets) {
    for (let i = 0; i < b.trail.length; i++) {
      const tr = b.trail[i];
      const alpha = i / b.trail.length;
      ctx.fillStyle = `rgba(255,220,80,${alpha * 0.6})`;
      ctx.beginPath(); ctx.arc(tr.x, tr.y, 2 + alpha * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = b.rebote ? '#66ffcc' : '#ffcc33';
    ctx.shadowColor = b.rebote ? '#66ffcc' : '#ffcc33';
    ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = hexAlpha(pt.color, alpha);
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  for (const id of [1, 2]) {
    const p = players[id];
    if (p.charging && p.charge > 0) {
      const bx = p.x - 30;
      const by = p.y - 70;
      ctx.fillStyle = '#0008'; ctx.fillRect(bx, by, 60, 8);
      const r = Math.floor(p.charge * 255);
      const g = Math.floor((1 - p.charge) * 255);
      ctx.fillStyle = `rgb(${r},${g},80)`;
      ctx.fillRect(bx, by, 60 * p.charge, 8);
    }
  }

  if (faseActual === 'sudden' && suddenStartTime > 0 && now - suddenStartTime < 3) {
    const alpha = 0.5 + 0.5 * Math.sin(now * 8);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0033';
    ctx.font = 'bold 72px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0033'; ctx.shadowBlur = 30;
    ctx.fillText('MUERTE SÚBITA', W / 2, H / 2 - 40);
    ctx.font = 'bold 26px system-ui';
    ctx.fillText('Cada impacto quita 50 HP', W / 2, H / 2 + 30);
    ctx.restore();
  }
}

function drawCannonGame(id) {
  const p = players[id];
  const inmunidad = tieneBuff(p, 'inmunidad');
  const escudo    = tieneBuff(p, 'escudo');
  const congelado = now < p.frozenUntil;

  const sinTurno = ES_TACTIL &&
    ((modoActual === 'local' && turnoActual !== id) ||
     (modoActual === 'bot' && id !== 1 && turnoActual !== id));

  if (sinTurno) {
    ctx.save();
    ctx.globalAlpha = 0.35;
  }

  if (p.enAire) {
    ctx.save();
    ctx.globalAlpha = 0.3 * (sinTurno ? 0.35 : 1);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(p.x, GROUND_Y + 4, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (inmunidad) {
    const pulse = 0.7 + 0.3 * Math.sin(now * 10);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 30 * pulse;
  }

  if (congelado) {
    const originalColor = prefs.skins['p' + id].color;
    prefs.skins['p' + id].color = '#88ccff';
    drawCannonSkin(ctx, id, p.x, p.y - 20, p.angle, 34);
    prefs.skins['p' + id].color = originalColor;
  } else {
    drawCannonSkin(ctx, id, p.x, p.y - 20, p.angle, 34);
  }

  ctx.shadowBlur = 0;

  if (escudo) {
    ctx.strokeStyle = '#ffcc33'; ctx.lineWidth = 3;
    ctx.shadowColor = '#ffcc33'; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(p.x, p.y - 20, 32, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (congelado) {
    ctx.font = '20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('❄️', p.x, p.y - 54);
  }

  if (sinTurno) {
    ctx.restore();
    ctx.font = '18px system-ui';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6;
    ctx.fillText('⏳', p.x, p.y - 54);
    ctx.globalAlpha = 1;
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hexAlpha(hex, alpha) {
  if (hex.startsWith('#')) {
    const a = Math.floor(alpha * 255).toString(16).padStart(2, '0');
    return hex + a;
  }
  return hex;
}

function updateHUD() {
  document.getElementById('hp1').textContent = Math.round(players[1].hp);
  document.getElementById('hp2').textContent = Math.round(players[2].hp);
  document.getElementById('bar1').style.width = (players[1].hp / MAX_HP * 100) + '%';
  document.getElementById('bar2').style.width = (players[2].hp / MAX_HP * 100) + '%';
  document.getElementById('bar1').style.background = colorDe(1);
  document.getElementById('bar2').style.background = colorDe(2);
}

function resetGame() {
  for (const id of [1, 2]) {
    const p = players[id];
    p.hp = MAX_HP;
    p.x = id === 1 ? 120 : W - 120;
    p.y = GROUND_Y;
    p.vy = 0;
    p.enAire = false;
    p.angle = id === 1 ? -45 : -135;
    p.charging = false; p.charge = 0;
    p.lastShot = -999;
    p.buffs = {};
    p.frozenUntil = 0;
    p.regenAcum = 0;
    p.danioTotal = 0;
    p.botThink = 0; p.botTargetX = p.x; p.botJumpCooldown = 0;
    p.botWaitUntil = 0;
    p.botTurnoStart = 0;
  }
  bullets.length = 0;
  particles.length = 0;
  globos.length = 0;
  nextGloboSpawn = 3;
  gameOver = false;
  faseActual = 'normal';
  tiempoRestante = prefs.duracion * 60;
  suddenStartTime = 0;
  turnoActual = 1;
  tiempoTurno = TURNO_TIME;
  document.getElementById('victory-overlay').classList.remove('show');
  updateHUD();
  updateBuffBar();
  updateTimer();
}

function startGame() { resetGame(); }

function terminarPorTiempo() {
  const d1 = players[1].danioTotal;
  const d2 = players[2].danioTotal;
  if (d1 > d2) mostrarVictoria(1, 'Más daño infligido');
  else if (d2 > d1) mostrarVictoria(2, 'Más daño infligido');
  else if (players[1].hp > players[2].hp) mostrarVictoria(1, 'Más vida restante');
  else if (players[2].hp > players[1].hp) mostrarVictoria(2, 'Más vida restante');
  else mostrarVictoria(0, 'Empate técnico');
}

function mostrarVictoria(winnerId, motivo) {
  gameOver = true;
  faseActual = 'over';
  showTouchControls(false);
  const overlay = document.getElementById('victory-overlay');
  const title = document.getElementById('victory-title');
  const reason = document.getElementById('victory-reason');

  if (winnerId === 0) {
    title.textContent = 'EMPATE';
    title.style.color = '#aaa';
    title.style.textShadow = '0 0 30px #aaa';
  } else {
    title.textContent = '¡GANÓ ' + nameDe(winnerId) + '!';
    title.style.color = colorDe(winnerId);
    title.style.textShadow = `0 0 30px ${colorDe(winnerId)}`;
  }
  reason.textContent = motivo;

  document.getElementById('v-name1').textContent = nameDe(1);
  document.getElementById('v-name2').textContent = nameDe(2);
  document.getElementById('v-dmg1').textContent = players[1].danioTotal;
  document.getElementById('v-dmg2').textContent = players[2].danioTotal;
  document.getElementById('v-hp1').textContent = Math.round(players[1].hp);
  document.getElementById('v-hp2').textContent = Math.round(players[2].hp);
  document.getElementById('stat-p1').style.borderColor = colorDe(1);
  document.getElementById('stat-p2').style.borderColor = colorDe(2);

  overlay.classList.add('show');
}

document.getElementById('btn-revancha').addEventListener('click', resetGame);
document.getElementById('btn-victory-menu').addEventListener('click', () => {
  document.getElementById('victory-overlay').classList.remove('show');
  showScreen('menu');
});

let lastT = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (inGame && !gameOver && faseActual !== 'over') update(dt);
  if (inGame) draw();
  requestAnimationFrame(loop);
}

const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
function resizeBg() { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; }
resizeBg();
window.addEventListener('resize', resizeBg);

const bgParticles = [];
for (let i = 0; i < 40; i++) bgParticles.push({
  x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
  r: 1 + Math.random() * 2.5, vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
  color: Math.random() < 0.5 ? '#00ffcc' : '#55aaff'
});

const bgCannons = { 1: { x: 80, angle: -45, lastShot: 0 }, 2: { x: window.innerWidth - 80, angle: -135, lastShot: 0 } };
const bgBullets = [];
const bgParticlesBoom = [];

function updateBg(dt) {
  const w = bgCanvas.width, h = bgCanvas.height;
  for (const p of bgParticles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
  }
  for (const id of [1, 2]) {
    const c = bgCannons[id];
    c.lastShot += dt;
    if (c.lastShot > 5 + Math.random() * 3) {
      c.lastShot = 0;
      const baseAngle = id === 1 ? -45 : -135;
      const ang = (baseAngle + (Math.random() * 30 - 15)) * Math.PI / 180;
      const speed = 300 + Math.random() * 200;
      const yBase = h - 60;
      bgBullets.push({ x: c.x + Math.cos(ang) * 30, y: yBase + Math.sin(ang) * 30, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, owner: id });
    }
  }
  for (let i = bgBullets.length - 1; i >= 0; i--) {
    const b = bgBullets[i];
    b.vy += 400 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y > h - 60 || b.x < -30 || b.x > w + 30) {
      for (let k = 0; k < 8; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 40 + Math.random() * 150;
        bgParticlesBoom.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.6, maxLife: 0.6, color: Math.random() < 0.5 ? '#00ffcc' : '#ff3366' });
      }
      bgBullets.splice(i, 1);
    }
  }
  for (let i = bgParticlesBoom.length - 1; i >= 0; i--) {
    const pt = bgParticlesBoom[i];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 200 * dt; pt.life -= dt;
    if (pt.life <= 0) bgParticlesBoom.splice(i, 1);
  }
}
function drawBg() {
  const w = bgCanvas.width, h = bgCanvas.height;
  const grad = bgCtx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#121a30'); grad.addColorStop(1, '#0a0f1c');
  bgCtx.fillStyle = grad; bgCtx.fillRect(0, 0, w, h);
  for (const p of bgParticles) {
    bgCtx.globalAlpha = 0.5;
    bgCtx.fillStyle = p.color;
    bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
  }
  bgCtx.globalAlpha = 1;
  bgCtx.fillStyle = '#0d1220'; bgCtx.fillRect(0, h - 60, w, 60);
  for (const id of [1, 2]) {
    const c = bgCannons[id];
    const color = id === 1 ? '#00ffcc66' : '#ff336666';
    const rad = c.angle * Math.PI / 180;
    const by = h - 80;
    bgCtx.globalAlpha = 0.6;
    bgCtx.fillStyle = '#1a2238';
    bgCtx.beginPath(); bgCtx.arc(c.x, by, 22, 0, Math.PI * 2); bgCtx.fill();
    bgCtx.strokeStyle = color; bgCtx.lineWidth = 3; bgCtx.stroke();
    bgCtx.strokeStyle = color; bgCtx.lineWidth = 12; bgCtx.lineCap = 'round';
    bgCtx.beginPath(); bgCtx.moveTo(c.x, by); bgCtx.lineTo(c.x + Math.cos(rad) * 40, by + Math.sin(rad) * 40); bgCtx.stroke();
    bgCtx.globalAlpha = 1;
  }
  for (const b of bgBullets) {
    bgCtx.fillStyle = '#ffcc33';
    bgCtx.shadowColor = '#ffcc33'; bgCtx.shadowBlur = 15;
    bgCtx.beginPath(); bgCtx.arc(b.x, b.y, 5, 0, Math.PI * 2); bgCtx.fill();
    bgCtx.shadowBlur = 0;
  }
  for (const pt of bgParticlesBoom) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    bgCtx.globalAlpha = alpha * 0.7;
    bgCtx.fillStyle = pt.color;
    bgCtx.beginPath(); bgCtx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); bgCtx.fill();
  }
  bgCtx.globalAlpha = 1;
}
let lastBgT = performance.now();
function bgLoop(t) {
  const dt = Math.min(0.05, (t - lastBgT) / 1000);
  lastBgT = t;
  if (!inGame) { updateBg(dt); drawBg(); }
  requestAnimationFrame(bgLoop);
}

showScreen('menu');
updateHUD();
updateBuffBar();
requestAnimationFrame(loop);
requestAnimationFrame(bgLoop);
