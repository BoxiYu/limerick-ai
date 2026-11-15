// "Show me how": an animated phone that walks through each window's app, tap by tap, so people can do it themselves:
// open the app → tap + → take a photo → type → send → read the answer → you decide.
// Used by the talk (each window's card, and the board after the finale) and by the take-home page (try.html).
//
// The phone is deliberately generic: no copied screens, only the app's own icon (apps.js ICONS) and name. The buttons are
// described the way the apps label them (checked against their help pages, FACTS5.json); every app looks a little
// different and changes over time, so the overlay says "simplified".
// Everything is prepared in advance and runs offline; nothing calls a live AI model.

import { STEW, TABLE } from './stew.js';
import { iconSrc } from './apps.js';
const A = 'limerick/assets/';
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- the walkthroughs
// A step is what the screen shows, where the finger taps (tap: a data-t name) and the caption.
// Screen parts: home (the phone's home screen) · buttons [label…] · cam: photo src (+ shutter) · menu (the camera's
// translated menu) · msgs [[who, text, img?]…] · input: text in the message box (type: true types it) · search: text ·
// grid: photo names (hits: a regex) · spec: listening picture · found: the name it suggests.
const you = (t, img) => ['you', t, img], ai = (t, img) => ['ai', t, img];
const KIT = TABLE;                                  // Mary's own photo of her table, from above (assets/stew/table.jpg)
const CARD = `${A}card/card-photo.jpg`;              // Peggy's own photo of the open card, from above (STILLS.md ## cardphoto)
// the kitchen's words (Mary's ask is the talk's own bubble; the AI's steps as a chat app would put them)
const STEW_ASK = 'Mam used to make a Connemara stew. Can you show me how, one step at a time, with pictures?', STEW_NEXT = 'Next step, with a picture, please.';
const STEW_1 = 'Here\'s a simple Irish lamb stew. Step 1: slice the onions and carrots. Then cut the lamb into big pieces.';
const STEW_2 = 'Step 2: layer them in the pot with salt and pepper. Just cover with water.';
const PICS = ['cake', 'dog2', 'wedding', 'garden', 'xmas', 'dog1', 'hurling', 'hills', 'baby', 'dog3', 'caravan', 'swan'];

export const HOW = {
  kitchen: { app: 'ChatGPT', alt: 'Google Gemini and Microsoft Copilot work much the same way.', steps: [
    { cap: 'Open the ChatGPT app.', home: true, tap: 'app' },
    { cap: 'Tap + beside the message box, then Camera.', msgs: [], input: '', tap: 'plus' },
    { cap: 'Take a photo of what you have.', cam: KIT, tap: 'shutter' },
    { cap: 'Ask for it one step at a time, with pictures.', msgs: [], input: STEW_ASK, type: true, photo: KIT, tap: 'send' },
    { cap: 'It starts with the first step.', msgs: [you(STEW_ASK), ai(STEW_1, STEW[0].img)], input: '' },
    { cap: 'Ready? Ask for the next step.', msgs: [you(STEW_ASK), ai(STEW_1, STEW[0].img)], input: STEW_NEXT, type: true, tap: 'send' },
    { cap: 'Each picture takes a little while, and free plans limit how many.', msgs: [you(STEW_NEXT), ai(STEW_2, STEW[1].img)], input: '' },
    { cap: 'Every family makes it differently. You decide.', msgs: [you(STEW_NEXT), ai(STEW_2, STEW[1].img)], input: '', done: 'Carrots and all, the way Mam made it.' },
  ] },
  nature: { app: 'Merlin Bird ID', alt: 'Free, from the Cornell Lab of Ornithology.', steps: [
    { cap: 'Open the Merlin Bird ID app.', home: true, tap: 'app' },
    { cap: 'At home, once: download the Britain and Ireland bird pack, for pictures of each bird.', buttons: ['Britain and Ireland  ↓', 'Download'], tap: 'b1' },
    { cap: 'Outside, or at an open window: tap Sound ID.', buttons: ['Sound ID', 'Photo ID', 'Step by Step'], tap: 'b0' },
    { cap: 'Tap the microphone and hold up the phone.', spec: true, mic: true, tap: 'mic' },
    { cap: 'Names light up while the bird sings.', spec: true, found: 'European Robin' },
    { cap: 'It suggests. You decide. It can be wrong when it\'s noisy.', spec: true, found: 'European Robin', done: 'A robin, at this hour!' },
  ] },
  library: { app: 'Google Gemini', alt: 'ChatGPT, Microsoft Copilot and Claude work much the same way.', steps: [
    { cap: 'Open the Gemini app.', home: true, tap: 'app' },
    { cap: 'Type your question, in your own words.', msgs: [], input: 'What does "in the cloud" mean?', type: true, tap: 'input' },
    { cap: 'Tap send.', msgs: [], input: 'What does "in the cloud" mean?', tap: 'send' },
    { cap: 'It answers.', msgs: [you('What does "in the cloud" mean?'), ai('Your photos are stored on remote servers in data centres, and your phone reaches them over the internet.')], input: '' },
    { cap: 'Not clear? Ask again. It never sighs.', msgs: [you('What does "in the cloud" mean?'), ai('Your photos are stored on remote servers in data centres, and your phone reaches them over the internet.')], input: 'Explain it more simply, with an example.', type: true, tap: 'send' },
    { cap: 'Ask as often as you like. For the things that matter, check.', msgs: [you('Explain it more simply, with an example.'), ai('It\'s like keeping your good china at your sister\'s house. It isn\'t in your house, but you can have it back whenever you like.')], input: '' },
  ] },
  travel: { app: 'Google Gemini', alt: 'ChatGPT works much the same way. Abroad, use the Wi-Fi or check your data.', steps: [
    { cap: 'Open the Gemini app.', home: true, tap: 'app' },
    { cap: 'Tap + beside the message box, then Camera.', msgs: [], input: '', tap: 'plus' },
    { cap: 'Take a photo of the menu.', menu: false, shut: true, tap: 'shutter' },
    { cap: 'Ask your question.', msgs: [], input: 'What does this say in English?', type: true, photo: 'menu', tap: 'send' },
    { cap: 'It reads the menu and puts it in English.', msgs: [you('What does this say in English?', 'menu'), ai('Soup of the day · Mushroom risotto · Saltimbocca: veal with ham and sage (the name means "jumps in the mouth") · Tiramisu')], input: '' },
    { cap: 'Ask about a dish if you\'re not sure. Then you choose.', msgs: [you('What does this say in English?', 'menu'), ai('Soup of the day · Mushroom risotto · Saltimbocca: veal with ham and sage (the name means "jumps in the mouth") · Tiramisu')], input: '', done: 'The risotto for me!' },
  ] },
  photos: { app: 'Google Photos', alt: 'On an iPhone, Apple Photos has a Search button too.', steps: [
    { cap: 'Open your Photos app.', home: true, tap: 'app' },
    { cap: 'Tap Search, or the magnifying glass.', grid: PICS, search: '', tap: 'search' },
    { cap: 'Type what was in the picture.', grid: PICS, search: 'dog beach', type: true },
    { cap: 'It finds them. No chat, nothing else to ask.', grid: PICS, search: 'dog beach', hits: /^dog/ },
    { cap: 'You choose the one for the frame.', grid: PICS, search: 'dog beach', hits: /^dog/, done: 'That\'s the one.' },
  ] },
  card: { app: 'ChatGPT', alt: 'Google Gemini works much the same way. If your eyes aren\'t what they were, Be My Eyes is free and made for this.', steps: [
    { cap: 'Open the ChatGPT app.', home: true, tap: 'app' },
    { cap: 'Tap + beside the message box, then Camera.', msgs: [], input: '', tap: 'plus' },
    { cap: 'Take a photo of the card.', cam: CARD, tap: 'shutter' },
    { cap: 'Ask it to read the card to you.', msgs: [], input: 'Can you read my card to me?', type: true, photo: CARD, tap: 'send' },
    { cap: 'It tells you what the picture shows and what the card says. It can read it out loud too.', msgs: [you('Can you read my card to me?', CARD), ai('A Christmas card with a robin on a holly branch. Inside: "Happy Christmas, Nana! We miss you, and we can\'t wait to see you. Love, Aoife."')], input: '', speak: true },
    { cap: 'Not sure of a word? Ask about it.', msgs: [you('Can you read my card to me?', CARD), ai('A Christmas card with a robin on a holly branch. Inside: "Happy Christmas, Nana! We miss you, and we can\'t wait to see you. Love, Aoife."')], input: 'What does the handwriting say, word for word?', type: true, tap: 'send' },
    { cap: 'Handwriting can come out wrong. If it matters, check with family.', msgs: [you('What does the handwriting say, word for word?'), ai('It says: "Happy Christmas, Nana! We miss you, and we can\'t wait to see you. Love, Aoife."')], input: '', done: 'I\'ll ring her.' },
  ] },
  verse: { app: 'Claude', alt: 'ChatGPT, Google Gemini and Microsoft Copilot work much the same way.', steps: [
    { cap: 'Open the Claude app.', home: true, tap: 'app' },
    { cap: 'Say what you need, and who it\'s for.', msgs: [], input: 'A few lines for a Christmas card to my daughter in Australia.', type: true, tap: 'send' },
    { cap: 'Here is a first try.', msgs: [you('A few lines for a Christmas card to my daughter in Australia.'), ai('From frosty Limerick, warm and bright, we send you love this Christmas night…')], input: '' },
    { cap: 'Too soppy? Tell it what to change.', msgs: [you('A few lines for a Christmas card to my daughter in Australia.'), ai('From frosty Limerick, warm and bright, we send you love this Christmas night…')], input: 'Less soppy. Put in the frost on the Shannon.', type: true, tap: 'send' },
    { cap: 'Better. Copy what you like.', msgs: [you('Less soppy. Put in the frost on the Shannon.'), ai('There\'s frost on the Shannon, a fire in the grate, the cards are all written, a few of them late…')], input: '' },
    { cap: 'Then write the last line yourself.', msgs: [you('Less soppy. Put in the frost on the Shannon.'), ai('There\'s frost on the Shannon, a fire in the grate, the cards are all written, a few of them late…')], input: '', done: 'Mind yourself in that sun, love. Mam xx' },
  ] },
};

const HOME = ['Phone', 'Messages', 'Camera', 'Clock', 'Maps', 'Settings', 'Calendar', 'Mail', 'Music', 'Notes', 'Weather'];
const MENU = [['Zuppa del giorno', 'Soup of the day'], ['Risotto ai funghi', 'Mushroom risotto'], ['Saltimbocca alla romana', 'Jumps in the mouth, Roman style'], ['Tiramisù', 'Tiramisu']];

// ---------------------------------------------------------------- one screen
const menuHTML = () => `<p class="ph-mh">Menù</p>${MENU.map(([it, en]) => `<p><s>${esc(it)}</s><b>${esc(en)}</b></p>`).join('')}`;
function screen(s, app, base) {
  const src = (u) => base + u;
  const ic = iconSrc(app) ? `<img class="ph-logo" src="${src(iconSrc(app))}" alt="">` : '';   // the app's own icon, if it has one
  const pic = (img) => (img === 'menu' ? `<div class="ph-mini">${menuHTML()}</div>` : `<img src="${src(img)}" alt="">`);
  if (s.home) {
    const icons = HOME.slice(0, 9).concat([app]).concat(HOME.slice(9));
    return `<div class="ph-home"><p class="ph-time">18:00</p><div class="ph-icons">${icons.map((n) => n === app
      ? `<div class="ph-ic me" data-t="app"><i>${ic || esc(n[0])}</i><span>${esc(n)}</span></div>`
      : `<div class="ph-ic"><i></i><span>${esc(n)}</span></div>`).join('')}</div></div>`;
  }
  let o = `<div class="ph-head">${ic}${esc(app)}</div>`;
  if (s.search != null) o += `<div class="ph-search" data-t="search"><span>⌕</span><b class="ph-typed">${esc(s.type ? '' : s.search)}</b>${s.search || s.type ? '' : '<em>Search your photos</em>'}</div>`;
  const shutter = '<div class="ph-camb"><div class="ph-shut" data-t="shutter"></div></div>';
  if (s.cam) o += `<div class="ph-cam" style="background-image:url('${src(s.cam)}')"><i class="ph-frame"></i></div>${shutter}`;
  else if (s.menu != null) o += `<div class="ph-cam ph-table"><div class="ph-menu${s.menu ? ' en' : ''}">${menuHTML()}</div><i class="ph-frame"></i></div>${s.shut ? shutter : ''}`;
  else if (s.buttons) o += `<div class="ph-btns">${s.buttons.map((b, k) => `<div class="ph-btn" data-t="b${k}">${esc(b)}</div>`).join('')}</div>`;
  else if (s.spec) o += `<div class="ph-listen"><canvas class="ph-spec" width="300" height="160"></canvas>${s.found ? `<div class="ph-found">${esc(s.found)}</div>` : '<p class="ph-wait">Listening…</p>'}<div class="ph-mic${s.mic ? '' : ' on'}" data-t="mic">●</div></div>`;
  else if (s.grid) o += `<div class="ph-grid${s.hits ? ' found' : ''}">${s.grid.map((n) => `<img src="${src(`${A}photos/${n}.jpg`)}" alt="" class="${s.hits?.test(n) ? 'hit' : ''}">`).join('')}</div>`;
  else {
    const m = (s.msgs || []).map(([who, t, img]) => `<div class="ph-msg ${who}">${img ? pic(img) : ''}${t ? `<p>${esc(t)}</p>` : ''}</div>`).join('');
    o += `<div class="ph-msgs">${m || '<p class="ph-empty">How can I help?</p>'}${s.speak ? '<p class="ph-speak">🔊 can read aloud</p>' : ''}</div>`;
    if (s.buttonsBelow) o += `<div class="ph-below">${s.buttonsBelow.map((b, k) => `<div class="ph-btn" data-t="b${k}">${esc(b)}</div>`).join('')}</div>`;
  }
  if (s.photo) o += `<div class="ph-att">${pic(s.photo)}</div>`;
  if (s.input != null) o += `<div class="ph-in"><span class="ph-plus" data-t="plus">+</span><span class="ph-field" data-t="input"><b class="ph-typed">${esc(s.type ? '' : s.input)}</b>${s.input || s.type ? '' : '<em>Message</em>'}</span><span class="ph-send" data-t="send">↑</span></div>`;
  if (s.done) o += `<div class="ph-done">${esc(s.done)}</div>`;
  return o;
}

// ---------------------------------------------------------------- the player
/**
 * Show the walkthrough for `id` in `root` (a full-screen layer). opts: { base: path prefix for assets, onClose, auto: ms per step }.
 * Returns { next(), prev(), close() } or null when that window has no app to try.
 */
export function playHow(root, id, opts = {}) {
  const H = HOW[id]; if (!H) return null;
  const base = opts.base || '', per = opts.auto ?? 4200, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = -1, timer = 0, raf = 0, gen = 0, closed = false, manual = false;   // once someone steps by hand, it stops moving on by itself
  root.innerHTML = `<div class="how-box" role="dialog" aria-modal="true" aria-label="How to use ${esc(H.app)}">
    <div class="ph"><div class="ph-screen"></div><div class="ph-finger" aria-hidden="true"></div></div>
    <div class="how-side"><p class="how-kicker">Show me how</p><h2>${esc(H.app)}</h2>
      <p class="how-count"></p>
      <ol class="how-steps">${H.steps.map((s, k) => `<li data-k="${k}"><b>${k + 1}</b><span>${esc(s.cap)}</span></li>`).join('')}</ol>
      <p class="how-alt">${esc(H.alt)} Simplified: every app looks a little different, and they change.</p>
      <p class="how-ctl"><button type="button" data-a="prev">← Back</button><button type="button" data-a="next" class="pri">Next →</button><button type="button" data-a="close">Close ✕</button></p>
    </div></div>`;
  const count = root.querySelector('.how-count');
  const scr = root.querySelector('.ph-screen'), finger = root.querySelector('.ph-finger'), phone = root.querySelector('.ph');
  root.querySelector('.how-ctl').addEventListener('click', (e) => { const a = e.target.closest('button')?.dataset.a; if (a) api[a](); });
  root.querySelectorAll('.how-steps li').forEach((li) => li.addEventListener('click', () => { manual = true; go(+li.dataset.k); }));
  root.classList.add('on'); root.scrollTop = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  async function go(k) {
    if (closed) return;
    i = Math.max(0, Math.min(H.steps.length - 1, k)); const my = ++gen, s = H.steps[i];
    clearTimeout(timer); cancelAnimationFrame(raf);
    root.querySelectorAll('.how-steps li').forEach((li, j) => { li.classList.toggle('on', j === i); li.classList.toggle('past', j < i); });
    count.textContent = `Step ${i + 1} of ${H.steps.length}`;
    scr.innerHTML = screen(s, H.app, base); scr.classList.remove('in'); void scr.offsetWidth; scr.classList.add('in');
    const ms = scr.querySelector('.ph-msgs');          // a chat taller than a small phone: its top fades, as a scrolled chat does
    if (ms) { const cut = () => ms.classList.toggle('cut', ms.scrollHeight > ms.clientHeight + 1); cut(); ms.querySelectorAll('img').forEach((im) => im.addEventListener('load', cut)); new ResizeObserver(cut).observe(ms); }
    finger.classList.remove('show', 'tap');
    if (s.spec) spectrogram(scr.querySelector('.ph-spec'), () => my !== gen || !!s.mic);   // silent until the mic is on
    if (s.menu) { const m = scr.querySelector('.ph-menu'); m.classList.remove('en'); await wait(500); if (my === gen) m.classList.add('en'); }
    await wait(500); if (my !== gen) return;
    // the finger goes to the button, taps it; typing happens after the tap on the box (or before the tap on send)
    const typed = scr.querySelector('.ph-typed'), text = s.type ? (s.search ?? s.input) : '';
    const target = s.tap && scr.querySelector(`[data-t="${s.tap}"]`);
    const typeIt = async () => { for (let n = 1; n <= text.length; n++) { if (my !== gen) return; typed.textContent = text.slice(0, n); await wait(38); } };
    if (s.type && s.tap !== 'input' && s.tap !== 'search') { await typeIt(); if (my !== gen) return; }
    if (target) {
      const p = phone.getBoundingClientRect(), r = target.getBoundingClientRect();
      finger.style.left = `${r.left - p.left + r.width / 2}px`; finger.style.top = `${r.top - p.top + r.height / 2}px`;
      finger.classList.add('show'); await wait(750); if (my !== gen) return;
      finger.classList.add('tap'); target.classList.add('pressed'); await wait(350);
    }
    if (s.type && (s.tap === 'input' || s.tap === 'search' || !s.tap)) await typeIt();
    if (my !== gen) return;
    if (per && !manual && i < H.steps.length - 1) timer = setTimeout(() => go(i + 1), per);
  }
  function spectrogram(cv, quiet) {
    if (!cv) return; const g = cv.getContext('2d'); let t = 0;
    const draw = () => {
      t++; const x = (t * 2) % cv.width; if (x < 2) g.clearRect(0, 0, cv.width, cv.height);
      if (!quiet() && Math.sin(t * 0.05) > -0.25) for (let k = 0; k < 3; k++) {
        const y = 20 + 120 * (0.5 + 0.45 * Math.sin(t * (0.2 + k * 0.07) + k * 2));
        g.fillStyle = `rgba(143,233,255,${0.55 + 0.45 * Math.random()})`; g.fillRect(x, y, 3, 6 + Math.random() * 12);
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
  }
  const api = {
    get step() { return i; }, get last() { return i >= H.steps.length - 1; },
    next() { manual = true; if (i >= H.steps.length - 1) api.close(); else go(i + 1); },
    prev() { manual = true; if (i > 0) go(i - 1); },
    close() { if (closed) return; closed = true; gen++; clearTimeout(timer); cancelAnimationFrame(raf); root.classList.remove('on'); setTimeout(() => { if (!root.classList.contains('on')) root.innerHTML = ''; }, 500); opts.onClose?.(); },
  };
  go(0);
  return api;
}

// The overlay keeps its own night palette, so it looks the same in the talk and on the (light) take-home page.
export const HOW_CSS = `
.how{position:fixed;inset:0;z-index:8;display:grid;place-items:center;padding:3vh 3vw;background:rgba(3,6,14,.96);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .45s;
  --h-ink:#f4efe3;--h-soft:#b9c2d0;--h-amber:#ffc65a;--h-cyan:#8fe9ff;--h-sans:"Avenir Next","Segoe UI",system-ui,sans-serif;--h-serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  color:var(--h-ink);font-family:var(--h-sans)}
.how.on{opacity:1;pointer-events:auto}
.how-box{display:flex;align-items:center;gap:clamp(20px,4vw,72px);max-width:1500px;width:100%;justify-content:center}
.ph{position:relative;flex:none;height:min(84vh,860px);aspect-ratio:9/18.5;border-radius:clamp(26px,3.4vh,44px);background:#0b0f18;padding:clamp(8px,1.1vh,13px);
  box-shadow:0 0 0 2px #2b3445,0 30px 80px rgba(0,0,0,.7),0 0 60px rgba(143,233,255,.08)}
.ph-screen{position:relative;height:100%;border-radius:clamp(20px,2.6vh,34px);overflow:hidden;background:#f6f3ec;color:#1d2530;display:flex;flex-direction:column;
  font:500 clamp(13px,1.75vh,19px)/1.35 var(--h-sans)}
.ph-screen.in>*{animation:phin .45s ease-out}
@keyframes phin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ph-head{flex:none;padding:2.6em 1em .7em;text-align:center;font-weight:800;border-bottom:1px solid #e3ddcf;background:#fff}
.ph-home{flex:1;padding:3.5em 1.1em 1em;background:linear-gradient(160deg,#2c3e63,#18213a 60%,#3a2c4a);color:#fff}
.ph-time{margin:0 0 1.2em;text-align:center;font:300 3.2em/1 var(--h-sans)}
.ph-icons{display:grid;grid-template-columns:repeat(3,1fr);gap:1.2em .6em}
.ph-ic{display:flex;flex-direction:column;align-items:center;gap:.35em;font-size:.82em;opacity:.75;text-align:center}
.ph-ic i{width:3.6em;height:3.6em;border-radius:1em;background:rgba(255,255,255,.18)}
.ph-ic.me{opacity:1;font-weight:800}
.ph-ic.me i:has(.ph-logo){overflow:hidden;background:none;border-radius:22%}.ph-ic.me .ph-logo{width:100%;height:100%;display:block;object-fit:cover}
.ph-head{display:flex;align-items:center;justify-content:center;gap:.45em}
.ph-head .ph-logo{flex:none;width:1.35em;height:1.35em;border-radius:22%;border:1px solid #e3ddcf}
.ph-ic.me i{display:grid;place-items:center;font:800 1.7em var(--h-sans);font-style:normal;width:2.1em;height:2.1em;border-radius:.6em;background:#fff;color:#1d2530;box-shadow:0 0 0 3px var(--h-amber),0 0 24px rgba(255,198,90,.7)}
.ph-msgs{flex:1;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:.6em;padding:.8em}
.ph-msgs.cut{-webkit-mask-image:linear-gradient(transparent .3em,#000 2.4em);mask-image:linear-gradient(transparent .3em,#000 2.4em)}
.ph-empty{margin:auto;color:#6b7383;font-size:1.25em}
.ph-msg{max-width:86%;border-radius:1em;padding:.55em .8em}
.ph-msg p{margin:0}
.ph-msg img{display:block;width:100%;max-height:7.5em;object-fit:cover;border-radius:.6em;margin-bottom:.35em}
.ph-msg.you{align-self:flex-end;background:#ffe7b3;border-bottom-right-radius:.3em}
.ph-msg.ai{align-self:flex-start;background:#fff;border:1px solid #e3ddcf;border-bottom-left-radius:.3em}
.ph-speak{align-self:flex-start;margin:0;color:#0f6b85;font-weight:700;animation:phblink 1.2s infinite}
@keyframes phblink{0%,100%{opacity:.35}50%{opacity:1}}
.ph-att{flex:none;padding:0 .8em .4em}.ph-att img{width:32%;border-radius:.5em;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.ph-in{flex:none;display:flex;align-items:center;gap:.5em;padding:.6em .7em 1.6em;background:#fff;border-top:1px solid #e3ddcf}
.ph-plus,.ph-send{flex:none;display:grid;place-items:center;width:2.2em;height:2.2em;border-radius:50%;font:800 1.15em/1 var(--h-sans);background:#eee7d8}
.ph-send{background:#1d2530;color:#fff}
.ph-field{flex:1;min-height:2.2em;display:flex;align-items:center;padding:.3em .8em;border-radius:1.2em;background:#f1ece1;overflow:hidden}
.ph-field em,.ph-search em{color:#8a909b;font-style:normal}
.ph-typed{font-weight:600}
.ph-search{flex:none;display:flex;align-items:center;gap:.5em;margin:.7em;padding:.55em .9em;border-radius:1.2em;background:#ece6d9}
.ph-cam{flex:1;position:relative;background:#111 center/cover no-repeat}
.ph-frame{position:absolute;inset:12%;border:2px solid rgba(255,255,255,.85);border-radius:.6em}
.ph-camb{flex:none;display:grid;place-items:center;padding:1em 0 1.8em;background:#000}
.ph-shut{width:3.6em;height:3.6em;border-radius:50%;background:#fff;box-shadow:0 0 0 4px #000,0 0 0 7px #fff}
.ph-table{background:linear-gradient(#5a4632,#3a2c1f);display:grid;place-items:center}
.ph-menu{width:76%;background:#f5ecd9;color:#3a2a1a;border-radius:.4em;padding:1.2em 1em;transform:rotate(-2deg);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.ph-menu p{position:relative;margin:0 0 1em;text-align:center;font:400 1em/1.25 var(--h-serif)}
.ph-menu s{text-decoration:none;transition:opacity .6s}
.ph-menu b{position:absolute;inset:-.15em -.3em;display:grid;place-items:center;background:#eaf7ff;color:#0b3550;border-radius:.3em;font:700 .95em/1.15 var(--h-sans);opacity:0;transition:opacity .6s}
.ph-menu.en b{opacity:1}
.ph-mh{font:italic 700 1.3em var(--h-serif)!important;color:#7a2e1a}
.ph-mini{width:100%;max-height:7.5em;overflow:hidden;background:#f5ecd9;color:#3a2a1a;border-radius:.5em;padding:.5em;margin-bottom:.35em;font-size:.62em}
.ph-mini p{margin:0 0 .3em;text-align:center;font-family:var(--h-serif)}.ph-mini b{display:none}
.ph-att .ph-mini{width:32%;display:inline-block;font-size:.4em}
.ph-btns{flex:1;display:flex;flex-direction:column;justify-content:center;gap:.9em;padding:1.2em}
.ph-btn{padding:1.05em;border-radius:1em;background:#fff;border:1px solid #e3ddcf;text-align:center;font-weight:800;font-size:1.1em;box-shadow:0 2px 6px rgba(0,0,0,.06)}
.ph-below{flex:none;padding:.6em .8em 1.6em;background:#fff;border-top:1px solid #e3ddcf}
.ph-listen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1em;padding:1em;background:#0d1524;color:#fff}
.ph-spec{width:100%;border-radius:.6em;background:#081018}
.ph-wait{margin:0;color:var(--h-cyan)}
.ph-found{padding:.6em 1.1em;border-radius:.8em;background:var(--h-cyan);color:#04131a;font-weight:800;font-size:1.2em;animation:phin .5s ease-out}
.ph-mic{display:grid;place-items:center;width:3.4em;height:3.4em;border-radius:50%;background:#fff;color:#d33;font-size:1.3em}
.ph-mic.on{background:#d33;color:#fff}
.ph-grid{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:3px;align-content:start;padding:3px}
.ph-grid img{width:100%;aspect-ratio:1;object-fit:cover;transition:all .8s}
.ph-grid.found img{opacity:.15;filter:grayscale(1)}.ph-grid.found img.hit{opacity:1;filter:none;box-shadow:0 0 0 3px var(--h-cyan)}   /* the machine's finds: cyan (amber is the person's pick) */
.ph-done{position:absolute;left:8%;right:8%;top:5.2em;padding:.7em 1em;border-radius:1em;background:var(--h-amber);color:#1a1206;font:800 1.1em/1.3 var(--h-sans);text-align:center;
  box-shadow:0 10px 30px rgba(0,0,0,.35);animation:phin .5s ease-out .3s both}
.pressed{filter:brightness(.88)}
.ph-finger{position:absolute;left:50%;top:70%;width:clamp(34px,4.6vh,52px);height:clamp(34px,4.6vh,52px);margin:calc(clamp(34px,4.6vh,52px)/-2) 0 0 calc(clamp(34px,4.6vh,52px)/-2);border-radius:50%;
  background:rgba(255,198,90,.35);border:3px solid var(--h-amber);box-shadow:0 0 22px rgba(255,198,90,.7);opacity:0;pointer-events:none;
  transition:left .7s cubic-bezier(.65,0,.35,1),top .7s cubic-bezier(.65,0,.35,1),opacity .3s,transform .15s}
.ph-finger.show{opacity:1}.ph-finger.tap{transform:scale(.72);background:rgba(255,198,90,.75)}
.how-side{max-width:640px;min-width:0}
.how-kicker{margin:0;font:700 clamp(13px,1vw,19px) var(--h-sans);letter-spacing:.2em;text-transform:uppercase;color:var(--h-amber)}
.how-side h2{display:block;color:var(--h-ink);letter-spacing:0;margin:.15em 0 .6em;font:600 clamp(34px,3.6vw,68px)/1.05 var(--h-serif)}
.how-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.35em}
.how-steps li{display:flex;gap:.7em;align-items:flex-start;padding:.45em .7em;border-radius:12px;cursor:pointer;color:rgba(244,239,227,.5);
  font:600 clamp(17px,1.35vw,28px)/1.3 var(--h-sans);transition:all .35s}
.how-steps li b{flex:none;display:grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;border:1.5px solid currentColor;font-size:.75em;margin-top:.12em}
.how-steps li.past{color:rgba(244,239,227,.78)}
.how-steps li.on{color:var(--h-ink);background:rgba(255,198,90,.14);box-shadow:inset 3px 0 0 var(--h-amber)}
.how-steps li.on b{background:var(--h-amber);border-color:var(--h-amber);color:#1a1206}
.how-alt{margin:1em 0 0;font:italic 500 clamp(15px,1.05vw,21px)/1.4 var(--h-serif);color:var(--h-soft)}
.how-ctl{display:flex;gap:10px;margin:1.2em 0 0}
.how-ctl button{padding:.55em 1.1em;border-radius:999px;border:1.5px solid rgba(244,239,227,.35);background:none;color:var(--h-ink);font:700 clamp(15px,1vw,19px) var(--h-sans);cursor:pointer}
.how-ctl button.pri{background:var(--h-amber);border-color:var(--h-amber);color:#1a1206}
.how-ctl button:focus-visible{outline:2px solid var(--h-amber);outline-offset:3px}
.how-count{display:none;margin:0 0 .35em;font:700 13px var(--h-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--h-soft)}
@media (pointer:coarse){.how-ctl button{min-height:46px}}
/* small screens: only the step being shown, so its words sit right by the phone; a shorter home screen so every app fits */
@media (max-width:760px),(max-height:560px){.how-steps li:not(.on){display:none}.how-count{display:block}.how-steps li.on{cursor:default}
  .ph-home{padding-top:2.2em}.ph-time{font-size:2.6em;margin-bottom:.8em}.ph-icons{gap:.9em .6em}}
/* upright phones: the buttons straight under the step, the app note after them (never under the bar); on a short screen a
   shorter phone, so the longest step and its buttons fit (268px: the words under the phone) */
@media (max-width:760px){.how{overflow:auto;place-items:start center;padding:12px 16px 0}.how-box{flex-direction:column;gap:14px}.ph{height:min(60vh,540px,100vh - 268px)}
  .ph-screen{font-size:clamp(11px,1.9vh,17px)}.how-side h2{font-size:30px;margin-bottom:.3em}.how-steps li{font-size:17px}
  .how-ctl{position:sticky;bottom:0;margin:0;padding:10px 0 14px;background:rgba(3,6,14,.96)}
  .how-side{display:flex;flex-direction:column}.how-alt{order:1;margin-bottom:14px}}
/* the shortest upright phones (320×568): a tighter heading and bar under the phone */
@media (max-width:760px) and (max-height:620px){.how-box{gap:10px}.how-side h2{font-size:26px;margin:.1em 0 .25em}.how-ctl{padding:8px 0}}
/* a phone drawn about 300px tall (those, and small phones on their side): a tighter home screen and chat, so all the apps,
   the latest message and most of the one before it still fit, the 'you decide' pill covers no more than it did on the
   taller phone, and the menu photo stays inside the camera view */
@media (max-width:760px) and (max-height:620px),(max-height:370px){.ph-home{padding:1.4em 1.1em .6em}.ph-time{font-size:2.2em;margin-bottom:.5em}
  .ph-icons{gap:.55em .6em}.ph-ic i{width:3.3em;height:3.3em}.ph-ic.me i{width:1.95em;height:1.95em}.ph-head{padding:1.8em 1em .5em}.ph-msgs{padding:.5em .8em;gap:.45em}
  .ph-msg{padding:.45em .7em}.ph-msg img,.ph-mini{max-height:6em}.ph-in{padding:.5em .6em 1em}.ph-below{padding-bottom:1em}.ph-done{top:3.75em;padding:.4em .75em}
  .ph-camb{padding:.7em 0 1.2em}.ph-menu{width:84%;padding:.8em .7em}.ph-menu p{margin-bottom:.6em}}
/* a phone on its side (a small one too): phone and words side by side, everything on one screen */
@media (max-height:560px) and (min-aspect-ratio:1/1){.how{overflow:auto;place-items:center;padding:2vh 3vw}.how-box{flex-direction:row;gap:24px}.ph{height:94vh}.ph-screen{font-size:clamp(11px,2.6vh,15px)}
  .how-side h2{font-size:28px;margin:.05em 0 .3em}.how-steps li{font-size:17px}.how-alt{order:0;font-size:14px;margin:.7em 0 0}.how-ctl{position:static;margin-top:.8em;padding:0;background:none}}
@media (prefers-reduced-motion:reduce){.ph-screen.in>*,.ph-found,.ph-done,.ph-speak{animation:none}.ph-finger{transition:opacity .2s}.ph-grid img{transition:none}}
`;
