// AI for All · A Winter's Night in Limerick.
// The city is the talk. Eight lit windows, one ordinary evening (see places.js). The presenter presses → to fly into the
// next window; the window grows to full screen while a narrator tells what is happening (assets/voice/<id>.mp3). Inside,
// a short conversation between a person and AI plays out in four beats (tryit.js): You ask → AI looks/listens →
// AI answers → You decide; → moves it on. A card gives the line to remember; → goes back to the city, where the
// window stays lit. After all eight, → shows what is behind them (journey.js: phone, network, data centre, chips,
// power, home), then the finale.
// Reuses the world (core.js + world.js); it does not load the old chapters.
//
// Keys: → / Enter / Space / PageDown next · ← / Esc / PageUp back · 1–8 a window · J the journey · A the apps board · S show me how (on a card) · 0 overview · V narration on/off · C captions
//       N speaker notes · F full screen · B black screen · H hide text · Home restart.
// Test hooks: ?still adds window.__tick(n), __open(id), __back(), __finale(), __state(); ?shot settles the scene and
// reads the hash: #intro, #city, #lit, #<id> (in front of the window), #<id>-full (first ring), #<id>-done, #<id>-card,
// #journey0 (then → steps), #finale, #apps (the try-at-home board), #how-<id> (the show-me-how phone).
// ?check runs the whole talk fast and prints a JSON report into <pre id="check-out">.
import { THREE, scene, camera, renderer, composer, diffuse, grade, reduced, $, V } from './core.js';
import { world } from './world.js';
import { PLACES as BASE, quayWindow } from './places.js';
import { startTry, TRY_CSS } from './tryit.js';
import { startJourney, JOURNEY_CSS } from './journey.js';
import { TRY, HELP, RULES, SITE, APPS_CSS, chipsHTML, tryHTML, iconsIn } from './apps.js';
import { HOW, HOW_CSS, playHow } from './howto.js';
import { NOTES } from './notes.js';
import { STEW, TABLE } from './stew.js';
document.head.append(Object.assign(document.createElement('style'), { textContent: TRY_CSS + JOURNEY_CSS + APPS_CSS + HOW_CSS }));

const Q = new URLSearchParams(location.search);
const CHECK = Q.has('check'), STILL = Q.has('still') || Q.has('shot') || CHECK;
const FAST = CHECK ? 0.02 : 1;                     // the self-check runs every timing at 2%
const errors = [];
addEventListener('error', (e) => errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => errors.push(String(e.reason?.message || e.reason)));

// ---------- places ----------
const v3 = (o) => V(o.x, o.y, o.z);
const LIB = { c: V(56.9, 16.2, 34), w: 3.4, h: 8.4, arch: true, near: { pos: V(28, 16.6, 34), at: V(57, 16.2, 34) }, spot: V(57, 31, 34), focus: '38% 45%' };
const PLACES = BASE.map((p, i) => {
  const q = p.library ? LIB : quayWindow(p);
  return {
    ...p, key: String(i + 1),
    still: `limerick/assets/video/${p.id}-start.jpg`, video: null, voice: `limerick/assets/voice/${p.id}.mp3`,
    focus: q.focus || p.focus || '50% 50%',
    win: { c: v3(q.c), w: q.w, h: q.h, arch: !!q.arch },
    near: { pos: v3(q.near.pos), at: v3(q.near.at) },
    spot: v3(q.spot),
  };
});
const OVERVIEW = { pos: V(-150, 128, 330), at: V(8, 0, 48) };
const FINALE = { pos: V(-170, 165, 360), at: V(10, 0, 40) };
const winLM = world.lm.windows;

// ---------- camera (eased flights, a gentle drift at rest) ----------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const cam = { pos: OVERVIEW.pos.clone(), at: OVERVIEW.at.clone(), from: null, to: null, atFrom: null, atTo: null, t: 1, dur: 1, onDone: null };
function fly(shot, dur, onDone) {
  cam.from = cam.pos.clone(); cam.to = shot.pos.clone(); cam.atFrom = cam.at.clone(); cam.atTo = shot.at.clone();
  cam.t = reduced ? 1 : 0; cam.dur = dur * FAST; cam.onDone = onDone || null;
  if (reduced) { cam.pos.copy(cam.to); cam.at.copy(cam.atTo); const f = cam.onDone; cam.onDone = null; f?.(); }
}
function jump(shot) { cam.t = 1; cam.onDone = null; cam.pos.copy(shot.pos); cam.at.copy(shot.at); }

// ---------- hotspots ----------
const spotsEl = $('#spots');
for (const p of PLACES) {
  const b = document.createElement('button');
  b.className = 'spot'; b.type = 'button';
  b.innerHTML = `<i aria-hidden="true"></i><span class="ui-chip human"><small>${p.key}</small> ${p.label}</span>`;
  b.setAttribute('aria-label', `${p.label}: open`);
  b.addEventListener('click', (e) => { e.stopPropagation(); open(p); });
  spotsEl.append(b); p.el = b;
}
const pv = new THREE.Vector3();
function toScreen(p) { pv.copy(p).project(camera); return { x: (pv.x + 1) / 2 * innerWidth, y: (1 - pv.y) / 2 * innerHeight, behind: pv.z > 1 }; }
const touchNext = $('#touch-next');
const TOUCH = matchMedia('(hover:none) and (pointer:coarse)').matches;
const PRESS = TOUCH ? 'Tap Next' : 'Press →';   // the hints, said the way this screen works
touchNext?.addEventListener('click', (e) => { e.stopPropagation(); next(); });
// Labels: each hangs under its ring; if that would cover another ring or label it slides along, or goes above or beside,
// always on screen. While the camera rests a label stays where it is unless something covers it (no hopping in the drift);
// it goes back to its first choice during a flight, after a resize, or when its spot comes back into view.
// A new place keeps well clear of other rings (.8 of a ring's radius), so no label looks like it belongs to the wrong ring.
// A label glides to a new place; the pull back inside the screen is at once, so it never pokes past the edge.
let chipSize = null;                                // label and ring sizes, measured again whenever one changes (screen size, fonts)
const sized = new ResizeObserver(() => { chipSize = null; });
for (const { el } of PLACES) { sized.observe(el.firstElementChild); sized.observe(el.lastElementChild); }
const box = (x, y, w, h, m = 0) => ({ l: x - w / 2 - m, r: x + w / 2 + m, t: y - h / 2 - m, b: y + h / 2 + m });
const hit = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const gapTo = (c, q) => Math.hypot(Math.max(c.l - q.x, 0, q.x - c.r), Math.max(c.t - q.y, 0, q.y - c.b)) - q.r;   // label box to a ring's edge
const inside = ({ x, y, z: { w, h } }, o) => [clamp(x + o[0], w / 2 + 8, innerWidth - w / 2 - 8), clamp(y + o[1], h / 2 + 8, innerHeight - h / 2 - 8)];
function placeSpots(dt = 0) {
  touchNext?.classList.toggle('on', ['city', 'playing', 'journey', 'finale'].includes(state) && !board.classList.contains('on') && !howRun && !notes.open);
  touchNext?.classList.toggle('wait', state === 'playing' && !!tryRun && !tryEl.querySelector('.tp-ring'));   // the AI's turn: nothing to tap until the next ring
  const W = innerWidth, H = innerHeight, hero = PLACES.find((q) => !visited.has(q.id)), on = [], rest = chipSize && cam.t >= 1;   // hero: the window → opens next
  if (!chipSize) for (const p of PLACES) p.side = null;   // new sizes: every label chooses afresh
  chipSize ||= PLACES.map(({ el }) => { const c = el.lastElementChild; return { w: c.offsetWidth, h: c.offsetHeight, top: c.offsetTop, ring: el.firstElementChild.offsetWidth }; });
  PLACES.forEach((p, k) => {
    const s = toScreen(p.spot), z = chipSize[k];
    p.at = { x: s.x, y: s.y - (z.top + z.h - z.ring) / 2, z };          // the ring sits half a label above the spot, as before
    const show = state === 'city' && !s.behind && p.at.x >= 0 && p.at.x <= W && p.at.y >= 0 && p.at.y <= H;   // no stray label for a window out of the picture
    if (show && p.el.classList.contains('off')) p.side = p.glide = null;
    p.el.classList.toggle('off', !show); p.el.classList.toggle('next', p === hero);
    if (show) on.push(p);
  });
  // small screens: rings that would touch step apart a little, and each stays whole on screen
  for (let n = 0; n < 4; n++) for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) {
    const a = on[i].at, b = on[j].at, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, push = ((a.z.ring + b.z.ring) / 2 + 6 - d) / 2;
    if (push > 0) { a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
  }
  const rings = on.map((p) => { const a = p.at; a.x = clamp(a.x, a.z.ring / 2 + 2, W - a.z.ring / 2 - 2); a.y = clamp(a.y, a.z.ring / 2 + 2, H - a.z.ring / 2 - 2); return { p, x: a.x, y: a.y, r: a.z.ring / 2 }; }), labels = [];
  for (const p of on) {
    const { z: { w, h, top, ring } } = p.at, down = top + h / 2 - ring / 2, slide = Math.max((w - ring) / 2, ring / 2), side = top - ring / 2 + w / 2;
    const offs = [[0, down], [-slide, down], [slide, down], [0, -down], [-slide, -down], [slide, -down], [side, 0], [-side, 0]];   // under, above, beside
    const at = (j) => {                             // a place's cost: how much it covers of other labels, and of other rings and the room round them
      const [cx, cy] = inside(p.at, offs[j]), c = box(cx, cy, w, h), keep = j === p.side;   // a new place needs more room than the one it has
      return { j, c, cost: labels.reduce((s, q) => s + hit(box(cx, cy, w, h, keep ? 0 : 10), q), 0)
        + rings.reduce((s, q) => s + Math.max(0, (q.p === p ? 0 : keep ? .65 : .8) * q.r - gapTo(c, q)) * h, 0) };
    };
    let best = rest && p.side != null ? at(p.side) : null;
    if (!best || best.cost) for (let j = 0; j < offs.length; j++) { const c = at(j); if (!best || c.cost < best.cost) best = c; if (!c.cost) break; }
    p.side = best.j; labels.push(best.c); p.aim = offs[best.j]; p.glide ||= [...p.aim];
  }
  const f = reduced || STILL ? 1 : 1 - Math.exp(-dt / 0.1);   // the glide: most of the way in about .3 s
  for (const p of PLACES) {
    const a = p.at; p.el.style.left = `${a.x}px`; p.el.style.top = `${a.y}px`;
    if (!p.aim) continue;
    p.glide[0] += (p.aim[0] - p.glide[0]) * f; p.glide[1] += (p.aim[1] - p.glide[1]) * f;
    const [cx, cy] = inside(a, p.glide), dx = `${Math.round(cx - a.x)}px`, dy = `${Math.round(cy - a.y - (a.z.top + a.z.h / 2 - a.z.ring / 2))}px`;
    if (p.dx !== dx || p.dy !== dy) { p.el.style.setProperty('--dx', p.dx = dx); p.el.style.setProperty('--dy', p.dy = dy); }
  }
}
/** The window's rectangle on screen, from its four corners (every window lies in a plane x = const). */
function windowRect(p) {
  const { c, w, h } = p.win, pts = [];
  for (const dy of [-h / 2, h / 2]) for (const dz of [-w / 2, w / 2]) pts.push(toScreen(V(c.x, c.y + dy, c.z + dz)));
  const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// ---------- narration ----------
// One <audio> for the narrator. While it speaks, the video's own sound is lowered so the words stay clear.
const voice = new Audio(); voice.preload = 'auto';
window.__voice = voice;                          // for checking playback from the console
let voiceOn = !Q.has('mute');
const cap = $('#cap');
// Captions in step with the voice: assets/voice/captions.json (tools/align.py) holds each clip's phrases and the second
// each one starts. While a clip plays, the caption shows the phrase being spoken and fades shortly after the narrator
// stops. Without timings that match the text (or with the narrator off, or no sound allowed) it shows the whole text.
const CAPS = {};
fetch('limerick/assets/voice/captions.json').then((r) => r.json()).then((d) => Object.assign(CAPS, d)).catch(() => {});
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const phrasesFor = (id, text) => (CAPS[id] && norm(CAPS[id].map((p) => p[2]).join(' ')) === norm(text) ? CAPS[id] : null);
let capRaf = 0, capHide = 0;
function showCap(t) {
  if (cap.textContent !== t) cap.textContent = t;   // a plain cut, as subtitles do: never a blur on words to be read
  cap.classList.toggle('on', !!t && !document.body.classList.contains('nocap'));
}
function say(src, text) {
  cancelAnimationFrame(capRaf); clearTimeout(capHide);
  const parts = voiceOn && !CHECK ? phrasesFor((src.match(/(\w+)\.mp3$/) || [])[1], text) : null;
  cap.classList.toggle('city', state === 'city');   // the opening, over the city: a phone shows it up in the sky, off the labels
  showCap(parts ? parts[0][2] : text || '');      // the first phrase straight away; the whole text if it can't follow
  if (!voiceOn || CHECK) return Promise.resolve(false);
  voice.src = src; voice.currentTime = 0;
  const follow = () => {                         // the phrase whose start has passed (a tenth early, as subtitles do)
    let k = 0; while (k + 1 < parts.length && parts[k + 1][0] - 0.1 <= voice.currentTime) k++;
    showCap(parts[k][2]); swell(parts[k][2]);
  };
  // every frame, and on the clip's own time updates too (those keep coming when frames are throttled)
  const loop = () => { follow(); capRaf = requestAnimationFrame(loop); };
  return new Promise((res) => {
    const end = (ok) => {
      voice.onended = voice.onerror = voice.ontimeupdate = null; cancelAnimationFrame(capRaf);
      if (!ok) showCap(text || '');                // the clip failed: leave the whole text to read
      else if (parts) capHide = setTimeout(() => cap.classList.remove('on'), 1200);
      res(ok);
    };
    voice.onended = () => end(true); voice.onerror = () => end(false);
    voice.play().then(() => { if (parts && voice.onended) { voice.ontimeupdate = follow; loop(); } }).catch(() => end(false));
  });
}
// A window's one slow, warm swell as the narrator says its words (the weather: the TV's sun at "looks bright", measured).
// Once per visit, only with the narrator; not under reduced motion, nor on upright screens (they crop it out).
const SWELL = { weather: ['looks bright', [6, 42, 9, 14]] };
let swelled = 0;
function swell(t) {
  const s = SWELL[current?.id];
  if (!s || reduced || state !== 'playing' || swelled === token || !t?.includes(s[0]) || matchMedia('(max-aspect-ratio:1/1)').matches) return;
  swelled = token;
  const r = coverRect(current.focus), [x, y, w, hh] = s[1], e = document.createElement('div');
  e.className = 'swell'; e.onanimationend = () => e.remove();
  Object.assign(e.style, { left: `${r.x + r.w * x / 100}px`, top: `${r.y + r.h * y / 100}px`, width: `${r.w * w / 100}px`, height: `${r.h * hh / 100}px` });
  document.body.append(e);
}
function hush() { voice.pause(); voice.onended?.(); cancelAnimationFrame(capRaf); cap.classList.remove('on'); ambLevel = 0; }

// ---------- room tone: a soft data-centre hum under the journey (WebAudio, made here: no file) ----------
// Airflow (noise, 120-600 Hz) + a quiet 100/200 Hz plant tone, breathing slowly. The journey sets a level with amb();
// it is ducked while the narrator speaks and fades on black. Off with the narrator (V, ?mute), in ?still/?check, ?noamb.
const AMB_VOL = 1;                                // one knob for the whole bed: tune it in the hall
const AMB_OK = !STILL && !Q.has('noamb'), AMB_DUCK = 0.07;
let ac = null, ambOut = null, ambLevel = 0, ambNow = -1, ambOff = 0;
function amb(level) {                             // level: the gain once the narrator stops (0 = fade out)
  ambLevel = AMB_OK ? level : 0;
  if (!ambLevel || ac) return;
  try {
    ac = new AudioContext(); ambOut = ac.createGain(); ambOut.gain.value = 0; ambOut.connect(ac.destination);
    const n = ac.sampleRate * 4, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;   // white noise loops without a seam; the filters shape it
    const src = ac.createBufferSource(); src.buffer = b; src.loop = true;
    const lp = ac.createBiquadFilter(), lp2 = ac.createBiquadFilter(), hp = ac.createBiquadFilter(), air = ac.createGain();
    lp.type = lp2.type = 'lowpass'; lp.frequency.value = lp2.frequency.value = 600; hp.type = 'highpass'; hp.frequency.value = 120;
    air.gain.value = 1;
    const lfo = ac.createOscillator(), depth = ac.createGain(); lfo.frequency.value = 0.07; depth.gain.value = 0.1;   // ±10%
    lfo.connect(depth).connect(air.gain);
    src.connect(lp).connect(lp2).connect(hp).connect(air).connect(ambOut);
    for (const [f, g] of [[100, 0.045], [200, 0.027]]) { const o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = f; og.gain.value = g; o.connect(og).connect(ambOut); o.start(); }
    src.start(); lfo.start();
  } catch { ac = null; ambLevel = 0; }               // no sound is fine
}
function ambTick() {                              // every frame: follow the narrator, the V key and the black screen
  if (!ac) return;
  const speaking = !voice.paused && !voice.ended;
  const want = !voiceOn || document.body.classList.contains('blackout') ? 0 : AMB_VOL * (speaking ? Math.min(ambLevel, AMB_DUCK) : ambLevel);
  if (want === ambNow) return;
  try {
    if (want > 0 && ac.state === 'suspended') ac.resume().catch(() => {});
    ambOut.gain.setTargetAtTime(want, ac.currentTime, want > ambNow ? (ambNow > 0 ? 0.3 : 0.6) : 0.15);   // in gently; down quickly
    clearTimeout(ambOff); if (!want) ambOff = setTimeout(() => { if (!ambNow) ac.suspend().catch(() => {}); }, 1500);
  } catch { /* stay silent */ }
  ambNow = want;
}
window.__amb = () => ({ level: ambLevel, target: ambNow, gain: ambOut?.gain.value ?? null, state: ac?.state ?? 'none' });   // for checking
const NARRATION = {};   // id -> text, loaded from NARRATION.md so the captions always match the recording
fetch('limerick/NARRATION.md').then((r) => r.text()).then((md) => {
  for (const [, id, txt] of md.matchAll(/^## (\w+)\n([\s\S]+?)(?=\n## |$)/gm)) NARRATION[id] = txt.trim();
}).catch(() => {});

// ---------- portal ----------
const portal = $('#portal'), img = portal.querySelector('img'), video = portal.querySelector('video');
const card = $('#card'), hint = $('#hint'), title = $('#title'), closing = $('#closing');
let state = 'intro', current = null;           // intro | city | flying | opening | playing | card | closing | finale
const visited = new Set();
let token = 0;                                  // bumps on every open/back so stale timers do nothing

function setRect(r, radius) {
  Object.assign(portal.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`, borderRadius: radius });
}
const archRadius = (r) => `${r.w / 2}px ${r.w / 2}px 2px 2px / ${r.w / 2}px ${r.w / 2}px 2px 2px`;
const after = (ms) => new Promise((res) => setTimeout(res, reduced ? 0 : ms * FAST));
/** Run fn(k) for k 0→1 over ms (eased); timer-driven so it also runs in headless checks. */
const animate = (ms, fn) => new Promise((res) => {
  const dur = reduced ? 0 : ms * FAST, t0 = performance.now();
  const step = () => { const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1; fn(ease(k)); if (k < 1) setTimeout(step, 16); else res(); };
  step();
});
const tryEl = $('#try');
let tryRun = null, reading = null;               // reading: a touch screen waits for Next before the conversation (no narrator)
/** The picture's rectangle on screen (object-fit: cover, 16:9, with the place's focus point). */
function coverRect(focus = '50% 50%') {
  const W = innerWidth, H = innerHeight, w = Math.max(W, H * 16 / 9), hh = w * 9 / 16;
  const [fx, fy] = focus.split(' ').map((v) => parseFloat(v) / 100);
  return { x: (W - w) * fx, y: (H - hh) * fy, w, h: hh };
}
function placeTry() { const r = coverRect(current?.focus); Object.assign(tryEl.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` }); }
const fx2 = new Audio();
function playFx(src) {
  hush();                                         // the narrator steps aside for the phone's own voice
  if (CHECK || !voiceOn) return Promise.resolve(false);
  fx2.src = src; fx2.currentTime = 0;
  return new Promise((res) => { fx2.onended = () => res(true); fx2.onerror = () => res(false); fx2.play().catch(() => res(false)); });
}
function stopTry() { $('.swell')?.remove(); tryRun?.stop(); tryRun = null; fx2.pause(); tryEl.classList.remove('carded', 'on'); }
const videoReady = (src) => new Promise((res) => {
  if (CHECK) return res(false);
  const ok = () => { clear(); res(true); }, bad = () => { clear(); res(false); };
  const clear = () => { video.removeEventListener('loadeddata', ok); video.removeEventListener('error', bad); };
  video.addEventListener('loadeddata', ok); video.addEventListener('error', bad);
  video.src = src; video.load();
  setTimeout(bad, 4000);
});

async function open(p) {
  if (!['city', 'intro'].includes(state)) return;
  const my = ++token; reading = null;
  hideIntro(); hush(); showBoard(false); howRun?.close();
  state = 'flying'; current = p; hint.classList.add('out');
  img.src = p.still; portal.style.setProperty('--focus', p.focus);
  const hasVideo = p.video ? videoReady(p.video) : Promise.resolve(false);
  fly(p.near, 2.4, async () => {
    if (my !== token) return;
    // 1. the lit window: its picture appears inside the window shape
    state = 'opening';
    const r = windowRect(p);
    portal.classList.remove('grow', 'full', 'playing', 'kb'); setRect(r, p.win.arch ? archRadius(r) : '2px');
    portal.style.opacity = '0'; portal.getBoundingClientRect();
    portal.classList.add('grow'); portal.style.opacity = '1';
    await after(650); if (my !== token) return;
    // 2. it grows to fill the screen while the camera keeps leaning in
    fly({ pos: p.near.pos.clone().lerp(p.near.at, 0.55), at: p.near.at }, 1.5);
    setRect({ x: 0, y: 0, w: innerWidth, h: innerHeight }, '0px'); portal.classList.add('full');
    await after(1550); if (my !== token) return;
    // 3. inside: the video (its first frame is the same picture) and the narrator together
    state = 'playing';
    const vid = p.video ? await hasVideo : false; if (my !== token) return;
    let played = false;
    if (vid) {
      try { video.currentTime = 0; video.volume = 1; await video.play(); played = true; } catch { /* the still stays */ }
      if (my !== token) { video.pause(); return; }
      if (played) portal.classList.add('playing');
    }
    if (voiceOn) video.volume = 0.35;                             // duck any clip under the narrator…
    // the narrator sets the scene first; the conversation appears when she has finished (→ skips her)
    const spoke = await say(p.voice, NARRATION[p.id]); if (my !== token) return;
    // a touch screen with no narrator: the scene's text stays until Next, then gives way to the conversation (it would hide the first ring)
    if (!spoke && TOUCH) { await new Promise((res) => { reading = res; }); if (my !== token) return; cap.classList.remove('on'); }
    video.volume = 1;                                             // …and restore it after
    // the conversation: You ask → AI looks/listens → AI answers → You decide. → moves it on; then the card.
    placeTry(); tryEl.classList.add('on');
    tryRun = startTry(tryEl, p.id, { wait: after, animate, play: playFx, now: () => fx2.currentTime, still: p.still,
      onDone: () => { if (my === token && state === 'playing') showCard(); } });
  });
}
function showCard() {
  const p = current; state = 'card'; tryEl.classList.add('carded');
  cap.classList.remove('on');
  card.querySelector('.ui-kicker').textContent = p.kicker;
  card.querySelector('.ui-line').textContent = p.line;
  card.querySelector('.ui-try').innerHTML = TRY[p.id] ? tryHTML(TRY[p.id]) : '';
  card.querySelector('.card-how').innerHTML = HOW[p.id] ? `<button type="button" class="how-go" data-how="${p.id}">Show me how, step by step<span class="key-only"> · S</span></button>` : '';   // the key is for the presenter, not a touch screen
  card.querySelector('.ui-src span').textContent = 'Illustrative scene · prepared in advance, not live AI';
  card.classList.add('on'); requestAnimationFrame(placeCard);
}
/** The card sits centred, unless that puts it over the conversation: then it moves into the space to the left.
 *  One so tall that "Back to the city" would not show whole scrolls under its end, which keeps "Show me how" and
 *  "Back to the city" in view (.scrolls). Only its bottom padding out of sight does not count. */
function placeCard() {
  card.style.removeProperty('--card-x'); card.style.removeProperty('max-width');
  besideChat();
  card.classList.remove('scrolls');                               // measured unpinned, from the card's top
  const bk = card.querySelector('#back'), b = bk.getBoundingClientRect(), c = card.getBoundingClientRect();
  const end = b.bottom - parseFloat(getComputedStyle(bk).paddingBottom) - c.top - card.clientTop + card.scrollTop;   // its words, not its finger-sized padding
  card.classList.toggle('scrolls', end > card.clientHeight + 1);
}
function besideChat() {
  const chat = tryEl.querySelector('.tp-chat');
  if (!card.classList.contains('on') || !chat || +getComputedStyle(chat).opacity < 0.1) return;
  const c = chat.getBoundingClientRect(), r = card.getBoundingClientRect();
  if (r.right <= c.left - 16 || r.left >= c.right || r.bottom <= c.top || r.top >= c.bottom) return;
  const left = 12, right = c.left - 16;
  card.style.maxWidth = `${right - left}px`; card.style.setProperty('--card-x', `${(left + right) / 2}px`);
}
async function back() {
  if (unblack()) return;
  if (!current || !['playing', 'card', 'opening'].includes(state)) return;
  const my = ++token;
  const p = current; state = 'closing';
  card.classList.remove('on'); video.pause(); hush(); stopTry(); howRun?.close();
  // shrink the picture back into the window, then let the city return
  fly(p.near, 1.5);
  await after(80); if (my !== token) return;
  const r = nearRect(p);
  setRect(r, p.win.arch ? archRadius(r) : '2px'); portal.classList.remove('full');
  await after(1500); if (my !== token) return;
  portal.style.opacity = '0';
  visited.add(p.id); p.el.classList.add('visited'); winLM?.setLit(p.id, 1.35);
  await after(500); if (my !== token) return;
  portal.classList.remove('grow', 'playing', 'kb');
  fly(OVERVIEW, 2.6, () => {
    if (my !== token) return;
    state = 'city'; current = null;
    if (visited.size === PLACES.length) showHint(journeyDone ? `${PRESS} for the last word.` : `Every window is lit. ${PRESS} to see what is behind them.`);
  });
}
/** Where the window will be on screen once the camera is back at `near` (computed with a temporary camera). */
function nearRect(p) {
  const saved = { pos: camera.position.clone(), q: camera.quaternion.clone() };
  camera.position.copy(p.near.pos); camera.lookAt(p.near.at); camera.updateMatrixWorld();
  const r = windowRect(p);
  camera.position.copy(saved.pos); camera.quaternion.copy(saved.q); camera.updateMatrixWorld();
  return r;
}
card.querySelector('#back').addEventListener('click', back);

// ---------- intro and finale ----------
function hideIntro() { title.classList.add('out'); }
/** The hint line. On a phone on its side, over the city, it sits up in the sky: the window labels fill the bottom.
 *  At the end, on a touch phone, it sits just above Next, under the closing words (limerick.html, #hint.end). */
function showHint(t) { hint.textContent = t; hint.classList.toggle('city', state === 'city'); hint.classList.toggle('end', state === 'finale'); hint.classList.remove('out'); }
async function intro() {
  // first press: the title gives way, the narrator sets the scene over the city
  if (state !== 'intro') return;
  hideIntro(); state = 'city';
  fly({ pos: V(-120, 92, 250), at: V(10, 4, 40) }, 9);
  const my = token;
  const spoke = await say('limerick/assets/voice/intro.mp3', NARRATION.intro);
  if (!spoke && my === token) await after(6000);            // no narrator: leave the caption up long enough to read
  if (my !== token || state !== 'city') return;
  cap.classList.remove('on');
  showHint(`${PRESS} to look inside the first window.`);
}
async function finale() {
  const my = ++token;
  state = 'finale'; hint.classList.add('out');
  for (const p of PLACES) winLM?.setLit(p.id, 1.6);
  glowTo(1.35, 5);
  fly(FINALE, 6);
  await after(2500); if (my !== token) return;
  closing.classList.add('on');
  const spoke = await say('limerick/assets/voice/finale.mp3', NARRATION.finale);
  if (!spoke) await after(9000);                            // no narrator: leave the closing words up to read
  if (my !== token) return;
  cap.classList.remove('on');
  if (state === 'finale' && !board.classList.contains('on')) showHint(`${PRESS} for the apps from tonight, to try at home.`);
}
// ---------- try them at home: every window's real apps on one board (apps.js) ----------
const board = $('#apps');
board.innerHTML = `<header><h2>Try them <em>at home</em></h2><div class="apps-qr"><p>Scan for this page, with every<br>"Show me how", to watch at home<b>${SITE.replace(/\/(.*)/, '/<wbr><span>$1</span>')}</b>Free to start · a printed sheet is at the desk</p><img src="limerick/assets/qr-try.svg" alt="QR code for ${SITE}"></div></header>`
  + `<div class="apps-grid">${PLACES.map((p, i) => { const t = TRY[p.id]; return `<article class="apps-tile" style="transition-delay:${0.15 + i * 0.07}s"><h3><b>${p.key}</b>${p.label}</h3><p class="try-apps">${chipsHTML(t)}</p><p class="try-first">${iconsIn(t.first)}</p>${HOW[p.id] ? `<button type="button" class="how-go" data-how="${p.id}">Show me how</button>` : ''}</article>`; }).join('')}</div>`
  + `<p class="apps-foot"><span class="rule">${RULES[0]} ${RULES[3]}</span><span>${HELP.map(([n, d]) => `<b>${n}</b> · ${d}`).join('<br>')}</span></p>`;
// ---------- show me how: an animated phone, tap by tap (howto.js); opened from a card or a board tile ----------
const howEl = $('#howto');
let howRun = null;
function showHow(id) { howRun?.close(); howRun = playHow(howEl, id, { auto: 0, onClose: () => { howRun = null; } }); }   // the clicker moves each step
document.addEventListener('click', (e) => { const b = e.target.closest?.('[data-how]'); if (b) { e.stopPropagation(); showHow(b.dataset.how); } });
let hintWas = false;
function showBoard(on) {
  if (on === board.classList.contains('on')) return;           // only a real change touches the closing words and the hint
  board.classList.toggle('on', on);
  if (on) { hintWas = !hint.classList.contains('out'); hint.classList.add('out'); closing.classList.remove('on'); cap.classList.remove('on'); }
  else if (state === 'finale') closing.classList.add('on');
  else if (hintWas) hint.classList.remove('out');
}
// ---------- behind every window: the question's journey (journey.js) ----------
let jr = null, journeyDone = false;
function journey() {
  if (state !== 'city') return;
  ++token; hush(); state = 'journey'; hint.classList.add('out');
  jr = startJourney($('#journey'), { world, fly, after, animate, say, amb, NARRATION, setLit: (id, k) => winLM?.setLit(id, k),
    onDone: () => { jr = null; journeyDone = true; hush(); state = 'city'; finale(); } });
}
/** J: go straight to the journey from anywhere (title, inside a window, its card, the finale), tidying up first. */
function jumpToJourney() {
  if (state === 'journey') return;
  ++token; hush(); video.pause(); stopTry(); jr?.stop(); jr = null;
  if (current) { visited.add(current.id); current.el.classList.add('visited'); winLM?.setLit(current.id, 1.35); }
  showBoard(false); howRun?.close(); card.classList.remove('on'); closing.classList.remove('on'); cap.classList.remove('on');
  portal.classList.remove('grow', 'full', 'playing', 'kb'); portal.style.opacity = '0';
  hideIntro(); current = null; state = 'city';
  journey();
}
let glow = { from: 1, to: 1, t: 1, dur: 1 };
function glowTo(v, dur) { glow = { from: world.cityGlow.value, to: v, t: 0, dur: dur * FAST }; }
function restart() {
  ++token; hush(); video.pause(); stopTry(); jr?.stop(); jr = null; journeyDone = false;
  visited.clear(); for (const p of PLACES) { p.el.classList.remove('visited'); winLM?.setLit(p.id, winLM.rest); }
  showBoard(false); howRun?.close(); card.classList.remove('on'); closing.classList.remove('on'); portal.classList.remove('grow', 'full', 'playing', 'kb'); portal.style.opacity = '0';
  title.classList.remove('out'); hint.classList.add('out'); hint.textContent = '';
  glowTo(1, 1); state = 'intro'; current = null; fly(OVERVIEW, 2);
}

// ---------- speaker notes ----------
const notes = $('#notes');
function renderNotes() {
  const p = current || PLACES.find((q) => !visited.has(q.id));
  if (state === 'journey') { const j = `journey${Math.max(0, jr?.step ?? 0)}`; $('#notes-h').textContent = `Behind every window · step ${(jr?.step ?? 0) + 1}/6`; $('#notes-body').innerHTML = `<p>${NOTES.journey || 'Speaker notes are not included in the online version.'}</p><p class="next"><b>Narrator says:</b> ${NARRATION[j] || ''}</p>`; return; }
  const k = state === 'intro' ? 'intro' : state === 'finale' || !p ? 'finale' : p.id;
  const label = k === 'intro' ? 'Opening' : k === 'finale' ? 'Close' : `${p.key}. ${p.label}`;
  const extra = NOTES[k] || 'Speaker notes are not included in the online version.';
  $('#notes-h').textContent = `${label} · ${visited.size}/${PLACES.length} windows lit`;
  $('#notes-body').innerHTML = `<p>${extra}</p><p class="next"><b>Narrator says:</b> ${NARRATION[k] || '(narration not loaded)'}</p>`;
}
document.querySelector('#notes [data-close]').onclick = () => notes.close();

// ---------- keys (clicker friendly) ----------
const NEXT = ['ArrowRight', 'PageDown', 'Enter', ' '], BACK = ['ArrowLeft', 'PageUp', 'Escape', 'Backspace'];
// after a black screen (B or .), the next press only brings the picture back; it does not move the talk on behind the black
const unblack = () => document.body.classList.contains('blackout') && (document.body.classList.remove('blackout'), true);
function next() {
  if (unblack()) return;
  if (howRun) { howRun.next(); return; }
  if (board.classList.contains('on')) { if (state !== 'finale') showBoard(false); return; }   // the board is the last page
  if (state === 'intro') intro();
  else if (state === 'city') {
    const p = PLACES.find((q) => !visited.has(q.id));
    if (p) open(p); else if (!journeyDone) journey(); else finale();
  } else if (state === 'journey') jr?.next(); else if (state === 'playing') { if (tryRun) tryRun.next(); else if (reading) { const go = reading; reading = null; go(); } else hush(); }
  else if (state === 'card') back();
  else if (state === 'finale' && !board.classList.contains('on')) showBoard(true);
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }
addEventListener('keydown', (e) => {
  const k = e.key;
  if (e.target?.id === 'start' && (k === 'Enter' || k === ' ')) return;     // the button's own click handles these
  if (e.target?.tagName === 'INPUT') {
    // the verse's "last line" box has focus, but a presenter's clicker must still work: it sends PageDown / PageUp
    // (some send arrows). Those move the talk on; an arrow only when the cursor is already at that end of the text,
    // so it can still move along a typed line. Every other key types.
    const t = e.target, atEnd = t.selectionStart === t.value.length && t.selectionEnd === t.value.length, atStart = t.selectionEnd === 0;
    if (k === 'Enter' || k === 'PageDown' || (k === 'ArrowRight' && atEnd)) { e.preventDefault(); t.blur(); next(); }
    else if (k === 'PageUp' || (k === 'ArrowLeft' && atStart)) { e.preventDefault(); t.blur(); back(); }
    else if (k === 'Escape') t.blur();
    return;
  }
  if (notes.open && !/^[nN]$/.test(k)) return;
  if ((NEXT.includes(k) || BACK.includes(k)) && unblack()) { e.preventDefault(); return; }   // any clicker press first restores the picture
  if (NEXT.includes(k)) { e.preventDefault(); next(); }
  else if (howRun && (k === 'Escape' || k === 's' || k === 'S' || e.code === 'KeyS')) howRun.close();
  else if (howRun && BACK.includes(k)) { e.preventDefault(); howRun.prev(); }
  else if (BACK.includes(k)) { e.preventDefault(); if (board.classList.contains('on')) showBoard(false); else back(); }
  else if ((k === 's' || k === 'S' || e.code === 'KeyS') && state === 'card' && HOW[current?.id]) showHow(current.id);
  else if (k === 'a' || k === 'A' || e.code === 'KeyA') { if (['city', 'finale'].includes(state)) showBoard(!board.classList.contains('on')); }
  else if (k === '0' && state === 'city') fly(OVERVIEW, 2.2);
  else if (k === 'j' || k === 'J' || e.code === 'KeyJ') jumpToJourney();   // e.code: still works with a Chinese input method on
  else if (k === 'Home') restart();
  else if (k === 'v' || k === 'V') {
    voiceOn = !voiceOn; if (!voiceOn) { hush(); video.volume = 1; }   // hush() also lets a waiting card appear
    toast(voiceOn ? 'Narration on' : 'Narration off');
  } else if (k === 'n' || k === 'N') { if (notes.open) notes.close(); else { renderNotes(); notes.showModal(); } }
  else if (k === 'f' || k === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
  else if (k === 'b' || k === 'B' || k === '.') document.body.classList.toggle('blackout');   // '.': a PowerPoint clicker's black-screen button
  else if (k === 'h' || k === 'H') document.body.classList.toggle('hide-ui');
  else if (k === 'c' || k === 'C') { document.body.classList.toggle('nocap'); toast(document.body.classList.contains('nocap') ? 'Captions off' : 'Captions on'); }
  else { const p = PLACES.find((q) => q.key === k); if (p) { if (state === 'intro') hideIntro(), state = 'city'; open(p); } }
});
canvasClick();
function canvasClick() { $('#gl').addEventListener('click', () => { if (state === 'intro') next(); }); }
// the start button: full screen (where the browser allows it), then the narrator's opening
$('#start')?.addEventListener('click', (e) => {
  e.stopPropagation();
  try { document.documentElement.requestFullscreen?.()?.catch?.(() => {}); } catch { /* not allowed here: fine */ }
  if (state === 'intro') next();
});
if (!STILL) requestAnimationFrame(() => $('#start')?.focus({ preventScroll: true }));

// ---------- loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.max(0.75, Math.min(devicePixelRatio, 1.5, 2200 / w)));
  composer.setPixelRatio(renderer.getPixelRatio());
  renderer.setSize(w, h, false); composer.setSize(w, h);
  // upright screens: widen the view until the city (all eight windows) fits across, as it does on a wide screen
  camera.aspect = w / h; camera.fov = w / h < 1 ? Math.max(62, Math.min(100, 2 * Math.atan(Math.tan(0.506) / (w / h)) * 180 / Math.PI)) : 42; camera.updateProjectionMatrix();
  diffuse.uniforms.uRes.value.set(w, h);
  if (state === 'playing' || state === 'card' || (state === 'opening' && portal.classList.contains('full'))) setRect({ x: 0, y: 0, w, h }, '0px');
  if (tryRun) placeTry();
  placeCard();
}
addEventListener('resize', resize);
diffuse.enabled = false; grade.enabled = false;
scene.fog.density = 0.0021;
const clock = new THREE.Clock();
let T = 0, sway = 0;
function tick(dt, render = true) {
  T += dt;
  if (cam.t < 1) {
    cam.t = Math.min(1, cam.t + dt / cam.dur); const k = ease(cam.t);
    cam.pos.lerpVectors(cam.from, cam.to, k); cam.at.lerpVectors(cam.atFrom, cam.atTo, k);
    if (cam.t >= 1 && cam.onDone) { const f = cam.onDone; cam.onDone = null; f(); }
  }
  if (glow.t < 1) { glow.t = Math.min(1, glow.t + dt / glow.dur); world.cityGlow.value = glow.from + (glow.to - glow.from) * ease(glow.t); }
  // the journey's far shots breathe a little more, in proportion to the distance (the city, intro and finale keep 1.2)
  const dd = reduced || !['city', 'intro', 'finale', 'journey'].includes(state) || cam.t < 1 ? 0 : state === 'journey' ? Math.max(1.2, cam.pos.distanceTo(cam.at) * 0.012) : 1.2;
  sway = reduced || STILL ? dd : sway + (dd - sway) * Math.min(1, dt * 1.5); const d = sway;   // eased, so a bigger sway never jumps in
  camera.position.set(cam.pos.x + Math.sin(T * 0.07) * d, cam.pos.y + Math.sin(T * 0.11) * d * 0.2, cam.pos.z + Math.cos(T * 0.06) * d * 0.6);
  camera.lookAt(cam.at);
  world.update(dt, T, camera);
  jr?.update(dt); ambTick();
  placeSpots(dt);
  if (render && !(state === 'playing' || state === 'card')) composer.render(dt);
}
function frame() { tick(Math.min(clock.getDelta(), 0.05)); requestAnimationFrame(frame); }

// ---------- boot, deep links for screenshots, self-check ----------
resize();
Object.assign(window, { __state: () => state });
if (STILL) {
  document.body.classList.add('still');
  Object.assign(window, { __tick: (n = 60, dt = 0.05) => { for (let i = 0; i < n; i++) tick(dt); return state; }, __open: (id) => open(PLACES.find((p) => p.id === id)), __back: back, __finale: finale });
}
if (Q.has('shot')) {
  const h = location.hash.slice(1) || 'intro', [id, mode] = h.split('-'), p = PLACES.find((q) => q.id === id);
  if (h === 'city') { hideIntro(); state = 'city'; }
  if (h === 'lit') { hideIntro(); state = 'city'; for (const q of PLACES) { visited.add(q.id); q.el.classList.add('visited'); winLM?.setLit(q.id, 1.35); } }
  if (/^journey\d$/.test(h)) { hideIntro(); state = 'city'; for (const q of PLACES) { visited.add(q.id); q.el.classList.add('visited'); winLM?.setLit(q.id, 1.35); }
    journey(); const want = +h.slice(7); (async () => { for (let n = 0; n < want; n++) { await new Promise((r) => setTimeout(r, 9000)); jr?.next(); } })(); }
  if (h.startsWith('how-')) { hideIntro(); state = 'city'; showHow(h.slice(4)); }
  if (h === 'apps') { hideIntro(); state = 'finale'; for (const q of PLACES) winLM?.setLit(q.id, 1.6); world.cityGlow.value = 1.35; jump(FINALE); showBoard(true); }
  if (h === 'finale') { hideIntro(); state = 'finale'; for (const q of PLACES) winLM?.setLit(q.id, 1.6); world.cityGlow.value = 1.35; jump(FINALE); closing.classList.add('on'); }
  if (p) {
    hideIntro(); state = 'city'; jump(p.near);
    if (['full', 'done', 'card'].includes(mode)) {
      current = p; state = 'card'; img.src = p.still; portal.style.setProperty('--focus', p.focus);
      portal.classList.add('full'); portal.style.opacity = '1'; setRect({ x: 0, y: 0, w: innerWidth, h: innerHeight }, '0px');
      state = 'playing'; placeTry(); tryEl.classList.add('on');
      tryRun = startTry(tryEl, p.id, { wait: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 5))), animate: (ms, f) => { f(1); return Promise.resolve(); }, play: () => Promise.resolve(), now: () => fx2.currentTime, still: p.still, onDone: () => { if (mode === 'card') showCard(); } });
      if (mode === 'done' || mode === 'card') (async () => { for (let n = 0; n < 8; n++) { tryRun?.next(); await new Promise((r) => setTimeout(r, 1200)); } })();
    }
  }
  for (let i = 0; i < 160; i++) tick(0.05, false);
}
window.__booted = true;
requestAnimationFrame(() => { $('#loading').classList.add('gone'); clock.getDelta(); frame(); });

if (CHECK) (async () => {
  setInterval(() => tick(0.05, false), 20);     // headless Chrome may not run animation frames: keep the flights moving
  const log = [];
  const until = async (pred, ms = 20000) => { const t0 = performance.now(); while (!pred()) { if (performance.now() - t0 > ms) return false; await new Promise((r) => setTimeout(r, 30)); } return true; };
  const missing = [];
  for (const p of PLACES) for (const u of [p.still, p.voice]) { const r = await fetch(u, { method: 'HEAD' }).catch(() => null); if (!r?.ok) missing.push(u); }
  for (const u of ['limerick/assets/voice/intro.mp3', 'limerick/assets/voice/finale.mp3', ...STEW.map((s) => s.img), TABLE]) { const r = await fetch(u, { method: 'HEAD' }).catch(() => null); if (!r?.ok) missing.push(u); }
  const videos = [];
  for (const p of PLACES) { const r = await fetch(p.video, { method: 'HEAD' }).catch(() => null); if (r?.ok) videos.push(p.id); }
  next(); await until(() => state === 'city');
  for (const p of PLACES) {
    next(); await until(() => state === 'playing');
    for (let n = 0; n < 12 && state === 'playing'; n++) { next(); await new Promise((r) => setTimeout(r, 400)); }
    const inside = await until(() => state === 'card');
    next(); const out = await until(() => state === 'city');
    log.push({ id: p.id, inside, out, lit: visited.has(p.id) });
  }
  next(); await until(() => state === 'journey');
  const journeySteps = [];
  for (let n = 0; n < 10 && state === 'journey'; n++) { journeySteps.push(jr?.step); next(); await new Promise((r) => setTimeout(r, 900)); }
  await until(() => closing.classList.contains('on'));
  const pre = document.createElement('pre'); pre.id = 'check-out';
  const capsOff = Object.keys(NARRATION).filter((id) => !phrasesFor(id, NARRATION[id]));   // re-run tools/align.py for these
  pre.textContent = JSON.stringify({ errors, missing, videos, places: log, journey: journeySteps, finale: state === 'finale', narration: Object.keys(NARRATION).length, captions: capsOff.length ? { notInStep: capsOff } : 'in step' }, null, 1);
  document.body.append(pre);
})();
