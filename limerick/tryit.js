// "Try it": inside each window, one short conversation between a person and AI, always in the same four beats:
//   1 You ask (amber, a person's bubble and an action: a photo, holding up the phone, typing)
//   2 AI looks / listens / reads / searches (the picture switches to the AI's view: a cyan scan, outlines, boxes)
//   3 AI answers (a cyan bubble, typed)
//   4 You decide (amber again: the person has the last word)
// A strip at the top shows which beat we are on. Everything is prepared in advance and runs offline; nothing calls a
// live AI model. The presenter presses → (or clicks the glowing ring) to move on; the AI beats run by themselves.
// Positions are percent of the window still (assets/video/<id>-start.jpg), measured on the pictures.
import { STEW } from './stew.js';
const A = 'limerick/assets/';
const h = (tag, cls, html, style) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (style) e.style.cssText = style; return e; };
const pos = (x, y, w, hh) => `left:${x}%;top:${y}%;${w != null ? `width:${w}%;` : ''}${hh != null ? `height:${hh}%;` : ''}`;

let ac;
function shutter() {
  try {
    ac ||= new AudioContext();
    const n = ac.sampleRate * 0.09, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n / 6));
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'bandpass'; f.frequency.value = 2400; g.gain.value = 0.5;
    s.buffer = b; s.connect(f).connect(g).connect(ac.destination); s.start();
  } catch { /* silence is fine */ }
}

// ---------------------------------------------------------------- the eight conversations
// beat: { who: 'you', text, ring: [x, y, label], act?: 'photo' | 'listen', snap?: [x, y] (the photo's glow, if not at the ring),
//         input?: true, quiet?: true (only a ring, no bubble: the presenter paces the AI's steps),
//         upright?: [x, y] (the ring on upright screens, where the conversation along the bottom would push it onto a face),
//         marks?: [phrase…] (as she asks, these words of the AI's last answer get her amber underline),
//         glow?: [x, y, w, h] (as she asks, what she is thinking of warms in amber: the shot's one hero glow until the answer is in),
//         outline?: [x, y, w, h] (as their line types, what they decided on gets a soft amber outline for about 3 s; landscape only),
//         slip?: [text, x, y, w] (after her bubble has typed, she writes it down: a cream slip on the picture; in the chat on upright screens),
//         keep?: true (the AI's view stays on screen through this beat), pick?: k (the menu's dish k gets his amber underline, and the lens goes to it;
//         in the photo search, the photo named k grows in an amber frame: the person's pick among the machine's finds) }
//       { who: 'ai', sense?: fn(ctx) (the AI's view on the picture), text?: string | string[], attach?: fn(ctx, bubble), note?,
//         step?: k (STEW[k] in the one lesson bubble: its picture and words change with each step) }
// A window may set chat: 'narrow' (a narrower conversation on wide screens, so what sits under its left edge shows).
// The four beats are taught in full once (the kitchen). The other windows keep the same colours and always end on the
// person's beat, but each one shows the AI working the way that tool really works:
//   robin: it listens (a real recording plays) · travel: a photo of the menu, read into English ·
//   photos: no chat, the search simply finds them · card: no boxes, the phone's own voice reads it ·
//   verse: asked twice, then her own line · weather: no AI on screen at all (the AI is behind the forecast).
// The narrator sets the scene and stops; the answer arrives here. The presenter reads each bubble aloud.
const PHONE = [37, 49];   // Mary's phone on the kitchen still (measured; her chin ends at 42% down, so the glow sits lower)
const SCRIPTS = {
  kitchen: { verb: 'looks', chat: 'narrow', beats: [   // narrow: Mam's pot (47–66% across) shows beside the conversation
    { who: 'you', ring: [...PHONE, 'Take a photo'], snap: [37, 56], act: 'photo', text: 'Mam used to make a Connemara stew. Can you show me how, one step at a time, with pictures?' },
    { who: 'ai', sense: (c) => c.see([['potatoes', 2, 65, 16, 15], ['lamb', 21, 69, 16, 9], ['onions', 37, 70, 9, 11], ['carrots', 44, 74, 13, 9]]),
      text: 'I see what looks like lamb, with onions, carrots and potatoes. Here\'s a simple Irish lamb stew, one step at a time.',
      note: 'It can misread a photo, so check what it says.' },
    ...STEW.flatMap((s, k) => [
      { who: 'you', quiet: true, ring: [...PHONE, k ? 'Next step' : 'First step'], upright: [52, 30] },   // upright: right of her head
      { who: 'ai', step: k, note: k === 0 ? 'Every family makes it a bit differently. Some leave out the carrots.' : undefined },
    ]),
    { who: 'you', ring: [80, 76, 'She decides'], text: 'Carrots and all, the way Mam made it. In her old pot, too.' },
  ] },
  nature: { verb: 'listens', beats: [
    { who: 'you', ring: [44, 49, 'Hold up the phone'], act: 'listen', text: 'Who\'s that singing out there?' },
    { who: 'ai', sense: (c) => c.listen([23, 42], [43, 50]), text: 'That sounds like a robin.', note: 'Probably. It can be wrong when it\'s noisy.' },   // rings: the robin's beak → Tom's phone
    { who: 'you', ring: [80, 76, 'He decides'], text: 'A robin, at this hour! I\'ll leave something out for him.' },
  ] },
  library: { verb: 'explains', beats: [
    { who: 'you', ring: [80, 30, 'Ask'], text: 'My grandson says my photos are "in the cloud". What does that mean?' },
    { who: 'ai', text: 'They are stored on remote servers in data centres, and your phone reaches them over the internet, instead of keeping them only on the device itself.' },
    { who: 'you', ring: [80, 55, 'Ask again'], text: 'Can you explain that more simply?', marks: ['remote servers', 'data centres', 'the device itself'] },
    { who: 'ai', text: 'Your photos are kept on big computers somewhere else, and you reach them through the internet.' },
    { who: 'you', ring: [80, 70, 'Ask again'], text: 'Give me an example.' },
    { who: 'ai', text: 'It\'s like keeping your good china at your sister\'s house instead of in your own press. It isn\'t in your house, but you can have it back whenever you like.' },
    { who: 'you', ring: [80, 80, 'She decides'], text: 'Ah, now I have it. I\'ll write that down.', slip: ['The cloud: like my good china at my sister\'s.', 3, 57, 21], note: 'Ask as often as you like. For the things that matter, check.' },
  ] },
  travel: { verb: 'reads', beats: [   // rings: Kathleen's phone, then John; the menu sits on the guidebook, off both faces
    { who: 'you', ring: [48, 63, 'Take a photo'], act: 'photo', text: 'Let\'s try it on the menu in the guidebook. What does this say in English?' },
    { who: 'ai', sense: (c) => c.menu(), text: 'Here it is in English.', note: 'A dish or two comes out a bit odd: ask about anything you\'re not sure of. It needs the internet.' },
    { who: 'you', ring: [23, 58, 'Ask'], upright: [62, 36], keep: true, pick: 3, text: 'Jumps in the mouth? What\'s that when it\'s at home?' },
    { who: 'ai', text: 'Saltimbocca: thin veal with ham and sage. The name means "jumps in the mouth".' },
    { who: 'you', ring: [80, 80, 'They decide'], text: 'The mushroom risotto for me. And John can try the "jumps in the mouth"!' },
  ] },
  photos: { verb: 'searches', chat: 'narrow', beats: [   // narrow: his mother's face (54–64% across) shows beside the conversation
    { who: 'you', ring: [44, 59, 'Type'], text: 'dog beach', typed: true },     // on the phone in Seán's hands
    { who: 'ai', sense: (c) => c.dim(), attach: (c, b) => c.grid(b) },
    { who: 'you', ring: [80, 82, 'They decide'], pick: 'dog2', text: 'Ah, would you look at her. Kilkee, the year we had the caravan. That\'s the one for the frame.' },
  ] },
  card: { verb: 'reads', beats: [
    { who: 'you', ring: [53, 61, 'Take a photo'], act: 'photo', text: 'Can you read my card to me?' },   // her phone, held flat over the open card
    { who: 'ai', voice: `${A}voice/cardread.mp3`, hand: true,   // hand: Aoife's quoted words on a little cream card, in a hand
      text: 'A Christmas card with a painting of a robin on a holly branch. Inside, in neat handwriting: "Happy Christmas, Nana! We miss you, and we can\'t wait to see you. Love, Aoife."' },
    { who: 'you', ring: [59, 67, 'She decides'], text: 'Read it again, slowly. And then I\'ll ring her.' },   // on her hand on the phone, off the teapot
  ] },
  verse: { verb: 'writes', beats: [
    { who: 'you', ring: [80, 30, 'Ask'], text: 'A few lines for a Christmas card to my daughter in Australia. Nothing too soppy.' },
    { who: 'ai', text: 'Here is one idea:', attach: (c, b) => c.verse(b, VERSE[0]) },
    { who: 'you', ring: [80, 55, 'Ask again'], glow: [11, 32.5, 11.5, 18.5],   // glow: her daughter's photo on the dresser (measured)
      text: 'That\'s a bit soppy. Put in the frost on the Shannon, and that it\'s summer where she is.' },
    { who: 'ai', text: 'How about this:', attach: (c, b) => c.verse(b, VERSE[1], ['frost on the Shannon', 'summer out there']) },   // her details: rust underlines
    { who: 'you', ring: [80, 80, 'Your own last line'], input: true, text: 'And mind yourself in that sun, love. Mam xx' },
  ] },
  weather: { verb: 'forecasts', steps: false, beats: [
    { who: 'you', ring: [80, 76, 'They decide'], outline: [66, 66, 18, 14],   // outline: the wellies' tops by the door (measured; ends at 80% down)
      text: 'Right. Wellies in the morning, and we\'re off to Curraghchase.' },
  ] },
};

// the verse, asked for twice: first the stock greeting-card version, then the one with her own details in it
const VERSE = [
  ['From frosty Limerick, warm and bright,', 'we send you love this Christmas night.', 'Though oceans keep us far apart,', 'you\'re always close, here in my heart.'],
  ['There\'s frost on the Shannon, a fire in the grate,', 'the cards are all written, a few of them late.', 'It\'s summer out there now, or so I am told,', 'so think of us here, wrapped up from the cold.'],
];
// a real translation app gets the odd dish wrong: "saltimbocca" literally means "jumps in the mouth"
const MENU = [['Zuppa del giorno', 'Soup of the day'], ['Risotto ai funghi porcini', 'Risotto with porcini mushrooms'],
  ['Saltimbocca alla romana', 'Jumps in the mouth, Roman style'], ['Tiramisù della casa', 'House tiramisu']];
const PHOTOS = ['cake', 'dog2', 'wedding', 'garden', 'xmas', 'dog1', 'hurling', 'hills', 'baby', 'dog3', 'caravan', 'swan'];
// the robin's clip (assets/sound/robin.mp3): its length and its phrases in seconds, as tools/spec.py measures them
const SONG = 6.11, PHRASES = [[0.21, 0.74], [2.02, 3.27], [3.9, 5.58]];

// ---------------------------------------------------------------- the engine
/**
 * Mount one window's conversation into `root` (a box exactly over the picture).
 * api: { wait(ms), animate(ms, fn(k)), play(src) → Promise, now() → the playing clip's time (s), still (img src), onDone() }
 *   (the photo flash is local: snap)
 * Returns { next(), stop(), done } ; next() is what → does.
 */
export function startTry(root, id, api) {
  const S = SCRIPTS[id]; if (!S) { api.onDone(); return { next() {}, stop() {} }; }
  const { wait, animate } = api;
  root.innerHTML = ''; root.classList.toggle('narrow', S.chat === 'narrow');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;     // reduced motion: the lesson's picture swaps without a fade
  for (const b of S.beats) if (b.step != null) new Image().src = STEW[b.step].img;   // the lesson's pictures, ready before they are needed
  let stopped = false, busy = false, i = 0, waitingRing = null, raf = 0, outlined = false;
  const steps = h('ol', 'tp-steps', ['You ask', `AI ${S.verb}`, 'AI answers', 'You decide'].map((t, k) => `<li data-k="${k}"><b>${k + 1}</b>${t}</li>`).join(''));
  if (S.steps === false) steps.hidden = true;           // a window with no AI on screen has no strip
  const chat = h('div', 'tp-chat', '<div class="tp-msgs"></div>');
  const msgs = chat.querySelector('.tp-msgs');
  const fx = h('div', 'tp-fx');                         // the AI's view sits here, over the picture
  root.append(fx, chat, steps);
  const mark = (k) => steps.querySelectorAll('li').forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('past', j < k); });
  const scroll = () => { msgs.scrollTop = msgs.scrollHeight; };
  // once the chat has scrolled and its top edge slices a line of words, that line fades out: a soft edge down to where the
  // letters of the next whole line begin (the top 15% of a line is empty space), so a whole line keeps full strength
  const edge = () => {
    const top = msgs.getBoundingClientRect().top, rg = document.createRange(), tw = document.createTreeWalker(msgs, NodeFilter.SHOW_TEXT);
    let cut = false, f = 99;
    if (msgs.scrollTop > 1) for (let n; (n = tw.nextNode());) { rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.height && r.bottom > top + 1) { const e = r.top + r.height * 0.15 - top; if (e < 0) cut = true; else f = Math.min(f, e); } }
    f = cut ? f : 0; msgs.classList.toggle('cut', f > 0); msgs.style.setProperty('--cut', `${Math.round(f)}px`);
  };
  msgs.addEventListener('scroll', edge, { passive: true });

  async function typeInto(el, text, cps = 45) {
    el.textContent = '';
    for (let k = 0; k < text.length; k++) { if (stopped) return; el.textContent += text[k]; if (k % 2) await wait(2000 / cps); scroll(); }
  }
  const bubble = (who) => {
    const b = h('div', `tp-msg ${who}`, `<span class="tp-who">${who === 'you' ? '' : '✦'}</span><div class="tp-body"><p class="tp-text"></p></div>`);
    msgs.append(b); chat.classList.add('has');           // the conversation box appears with its first bubble, not before
    requestAnimationFrame(() => b.classList.add('on')); scroll(); return b;
  };
  /** The camera's flash, seen from across the room: a soft glow where the phone is, not a white screen (DESIGN.md);
   *  nothing under reduced motion. */
  const snap = ([x, y]) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const f = h('div', 'tp-snap', null, pos(x, y)); root.append(f); setTimeout(() => f.remove(), 800);
  };
  /** The lesson (the kitchen): one AI bubble whose picture, "Step k of n" and words change with each step, so the
   *  conversation never grows past one bubble. The first step's note keeps its room after it, so nothing jumps. */
  let lesson = null;
  async function runStep(b) {
    mark(2); fx.classList.add('settle');
    const s = STEW[b.step];
    if (!lesson) {
      lesson = bubble('ai');
      const top = h('div', 'tp-lesson'), img = h('img'); img.src = s.img; img.alt = s.text;
      top.append(img, h('p', 'tp-k')); lesson.querySelector('.tp-body').prepend(top);
      if (b.note) lesson.querySelector('.tp-body').append(h('p', 'tp-small', b.note));
    } else {
      const img = lesson.querySelector('.tp-lesson img');
      if (!calm) { img.classList.add('out'); await wait(300); if (stopped) return; }   // fade out, swap, fade back in
      img.src = s.img; img.alt = s.text; await img.decode().catch(() => {}); if (stopped) return;
      img.classList.remove('out');
      const note = lesson.querySelector('.tp-small'); if (note) note.style.visibility = 'hidden';
    }
    lesson.querySelector('.tp-k').textContent = `Step ${b.step + 1} of ${STEW.length}`;
    await typeInto(lesson.querySelector('.tp-text'), s.text);
    scroll();
  }

  // ---- the AI's view (the old talk's "machine view", in a small form) ----
  const ctx = {
    /** Scan line sweeps down; behind it the painting turns into cyan outlines; then boxes with names. */
    async see(boxes) {
      const cv = edges(api.still); fx.append(cv); const scan = h('div', 'tp-scan'); fx.append(scan);
      fx.classList.add('on');
      await animate(1400, (k) => { cv.style.clipPath = `inset(0 0 ${100 - k * 100}% 0)`; scan.style.top = `${k * 100}%`; });
      scan.remove();
      for (const [name, x, y, w, hh] of boxes) { fx.append(h('div', 'tp-box', `<b>${name}</b>`, pos(x, y, w, hh))); await wait(220); }
      await wait(500);
      cv.classList.add('fade');                         // the outlines fade; the boxes stay as what it "saw"
    },
    /** The real song, seen: its spectrogram (tools/spec.py) is revealed left to right in step with the clip, and
     *  "European Robin" lights up while each phrase sings, as Merlin's Sound ID does. Then (not under reduced motion)
     *  three thin rings of sound travel from the bird's beak to the phone: it hears the bird, it doesn't see it. */
    async listen(beak, phone) {
      const b = msgs.lastElementChild?.classList.contains('ai') ? msgs.lastElementChild : null;
      const panel = h('div', 'tp-specwrap', `<p class="tp-small">Listening…</p><div class="tp-specbox"><img class="tp-spec" src="${A}sound/robin-spec.png" alt=""></div><p class="tp-name">European Robin</p>`);
      (b ? b.querySelector('.tp-body') : msgs).append(panel); scroll();
      const spec = panel.querySelector('.tp-spec'), name = panel.querySelector('.tp-name');
      let shown = 0, heard = false;
      const reveal = (k) => {
        shown = Math.max(shown, Math.min(1, k)); spec.style.clipPath = `inset(0 ${100 - shown * 100}% 0 0)`;
        const s = shown * SONG, lit = PHRASES.some(([a, e]) => s >= a && s <= e + 0.15);
        if (s >= PHRASES[0][0] && !heard) { heard = true; name.classList.add('on'); if (!calm) for (let n = 0; n < 3; n++) fx.append(h('div', 'tp-wave', null, `--x0:${beak[0]}%;--y0:${beak[1]}%;--x1:${phone[0]}%;--y1:${phone[1]}%;animation-delay:${n * 1.1}s`)); }
        name.classList.toggle('lit', lit || s >= PHRASES.at(-1)[0]);   // from the last phrase on it stays lit: its answer
      };
      reveal(0); fx.classList.add('on');
      // the real song (assets/sound/robin.mp3): the picture follows the clip's own clock; with the sound off, a 6.1 s timer
      const song = api.play(`${A}sound/robin.mp3`);
      let playing = !!api.now; song.then(() => { playing = false; });
      const follow = () => { if (!playing || stopped) return; reveal(api.now() / SONG); raf = requestAnimationFrame(follow); };
      raf = requestAnimationFrame(follow);            // a frame later: a sound that is off has said so by then
      await Promise.race([song, wait(7000)]); playing = false;
      if (shown < 1) { const from = shown; await animate(SONG * 1000 * (1 - from), (k) => reveal(from + k * (1 - from))); }
      reveal(1); panel.querySelector('.tp-small').classList.add('gone');   // the name takes over from "Listening…"
      setTimeout(() => fx.querySelectorAll('.tp-wave').forEach((w) => w.remove()), 4000);
      await wait(500);
    },
    async menu() {
      const sheet = (en) => `<p class="tp-menu-h">${en ? 'Menu' : 'Menù'}</p>${MENU.map(([it, e]) => `<p>${en ? e : it}</p>`).join('')}`;
      const m = h('div', 'tp-menu', `<div class="tp-menu-it">${sheet(false)}</div><div class="tp-menu-en">${sheet(true)}</div><div class="tp-lens"><span>English</span></div>`, pos(26, 44, 32, 36));
      const en = m.querySelector('.tp-menu-en'), lens = m.querySelector('.tp-lens');
      let at = 0;
      const place = (fy) => { const top = at = Math.max(0, Math.min(84, fy)); lens.style.top = `${top}%`; en.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - 26)}% 0)`; };
      let drag = false;
      lens.addEventListener('pointerdown', (e) => { drag = true; lens.setPointerCapture(e.pointerId); });
      lens.addEventListener('pointermove', (e) => { if (!drag) return; const r = m.getBoundingClientRect(); place(((e.clientY - r.top) / r.height) * 100 - 13); });
      lens.addEventListener('pointerup', () => { drag = false; });
      fx.append(m); place(-30); fx.classList.add('on'); await wait(60); m.classList.add('on'); await wait(600);
      const row = (k) => { const p = en.children[k]; return ((p.offsetTop + p.offsetHeight / 2) / m.offsetHeight) * 100 - 15; };   // the lens on line k, a little low so its tag clears the words (measured: fits any size)
      const a = row(1), z = row(4), r = row(2);
      await animate(3800, (k) => place(a + k * (z - a)));      // down the four dishes
      await animate(1200, (k) => place(z - k * (z - r)));      // back up to the risotto
      ctx.pick = async (n) => {                                 // his pick: underlined in amber, and the lens glides to it
        m.querySelectorAll(`p:nth-child(${n + 1})`).forEach((p) => p.classList.add('tp-pick'));
        const from = at, to = row(n); await animate(700, (k) => place(from + k * (to - from)));
      };
    },
    async dim() { fx.classList.add('on', 'dark'); await wait(700); },
    async grid(b) {
      const g = h('div', 'tp-grid', PHOTOS.map((n) => `<img data-n="${n}" src="${A}photos/${n}.jpg" alt="">`).join(''));
      b.querySelector('.tp-body').append(g); scroll(); await wait(900);
      g.classList.add('found'); g.querySelectorAll('img').forEach((im) => im.classList.toggle('hit', /^dog/.test(im.dataset.n)));
      await wait(900);
      // their pick (dog2: the terrier with the stick, Kilkee): it grows from its cell to the grid's height in an amber frame,
      // the other finds fade to 40%; under reduced motion it simply appears
      ctx.pick = async (n) => {
        const cell = g.querySelector(`img[data-n="${n}"]`), G = g.getBoundingClientRect(), c = cell.getBoundingClientRect();
        const big = h('img', 'tp-big'); big.src = cell.src; big.alt = '';
        const x = Math.max(0, Math.min(G.width - G.height, c.left + c.width / 2 - G.height / 2 - G.left));   // centred on its cell, inside the grid
        big.style.left = `${(x / G.width) * 100}%`;
        if (!calm) big.style.cssText += `;transition:none;transform:translate(${c.left - G.left - x}px,${c.top - G.top}px) scale(${c.width / G.height})`;
        g.append(big); big.getBoundingClientRect();
        big.style.transition = ''; big.style.transform = ''; g.classList.add('picked'); cell.classList.add('tp-chosen');
        await wait(2000);
      };
    },
    /** The verse on a cream card; the phrases in `mine` (her own details) are underlined in her rust ink as they type. */
    async verse(b, lines, mine = []) {
      const p = h('p', 'tp-hand'); b.querySelector('.tp-body').append(p);
      for (const line of lines) {
        const s = h('span'); p.append(s, h('br'));
        const w = mine.find((m) => line.includes(m)), k = w ? line.indexOf(w) : line.length;
        for (const [part, el] of [[line.slice(0, k), document.createTextNode('')], [w, w && h('mark', 'tp-rust')], [w && line.slice(k + w.length), document.createTextNode('')]]) {
          if (!part || stopped) continue; s.append(el); await typeInto(el, part, 32);
        }
      }
    },
  };

  // ---- the card for the verse: the AI's lines plus the room's own last line ----
  let input = null;
  function showRing(b) {
    const [x, y, label] = b.upright && matchMedia('(max-aspect-ratio:1/1)').matches ? [...b.upright, b.ring[2]] : b.ring;
    const r = h('button', 'tp-ring', `<i></i><span>${label}</span>`, pos(x, y)); r.type = 'button';
    r.addEventListener('click', (e) => { e.stopPropagation(); next(); });
    root.append(r); waitingRing = r; keepInView(r);
    if (b.input) {
      const card = [...msgs.querySelectorAll('.tp-hand')].pop();   // under the latest verse
      const line = h('p', 'tp-hand tp-own');
      input = h('input', 'tp-input'); input.type = 'text'; input.maxLength = 60; input.placeholder = 'Type the room\'s last line…';
      line.append(input); card?.after(line); scroll();
      setTimeout(() => input?.focus(), 50);
    }
  }
  /** Moves a ring back onto the screen if the picture's crop left it outside, or under the conversation
   *  (again whenever the conversation changes size: a photo in it can finish loading after the ring appears). */
  function keepInView(el) {
    if (!el?.isConnected) return;
    const r = el.getBoundingClientRect(), W = innerWidth, H = innerHeight, m = 12, c = chat.getBoundingClientRect();
    let dx = 0, dy = 0;
    if (r.left < m) dx = m - r.left; else if (r.right > W - m) dx = W - m - r.right;
    if (r.bottom > H - m) dy = H - m - r.bottom; if (r.top + dy < m) dy = m - r.top;
    const x0 = r.left + dx, x1 = r.right + dx, y0 = r.top + dy, y1 = r.bottom + dy;
    if (c.height && x1 > c.left - m && x0 < c.right + m && y1 > c.top - m && y0 < c.bottom + m) {   // on the conversation: step beside it
      if (c.left > W / 2 && c.left - m - (x1 - x0) >= m) dx += c.left - m - x1;        // conversation on the right: to its left
      else if (c.top - m - (y1 - y0) >= m) {                                           // conversation along the bottom: above it.
        dy += c.top - m - y1;                                                          // Pushed against a side, the ring sits at that edge and
        el.style.alignItems = x1 >= W - m - 1 ? 'flex-end' : x0 <= m + 1 ? 'flex-start' : '';   // its label hangs inwards: less over the picture (the menu)
      }
    }
    const mn = fx.querySelector('.tp-menu.on')?.getBoundingClientRect();              // on the travel menu (a phone on its side): step to its right, if there is room
    if (mn && r.right + dx > mn.left && r.left + dx < mn.right && r.bottom + dy > mn.top && r.top + dy < mn.bottom && mn.right + m + r.width <= W - m) dx = mn.right + m - r.left;
    const n = document.getElementById('touch-next')?.getBoundingClientRect();   // a touch screen's Next button (limerick.html): above it too
    if (n?.height && r.right + dx > n.left - m && r.left + dx < n.right + m && r.bottom + dy > n.top - m) dy += n.top - m - (r.bottom + dy);
    if (!dx && !dy) return;
    const R = root.getBoundingClientRect();
    el.style.left = `${parseFloat(el.style.left) + (dx / R.width) * 100}%`; el.style.top = `${parseFloat(el.style.top) + (dy / R.height) * 100}%`;
  }
  const fit = new ResizeObserver(() => keepInView(waitingRing)); fit.observe(chat);
  async function runAI(b) {
    if (b.step != null) return runStep(b);
    mark(1);
    const bub = bubble('ai'); bub.querySelector('.tp-text').innerHTML = '<span class="tp-dots"><i></i><i></i><i></i></span>';
    if (b.sense) await b.sense(ctx);
    if (stopped) return;
    mark(2);
    fx.classList.add('settle');                         // what it noticed fades: the answer is in the chat, not on the camera
    const voice = b.voice ? api.play(b.voice) : null;
    const lines = [].concat(b.text || []);
    const t = bub.querySelector('.tp-text'); t.textContent = '';
    if (!lines.length) t.remove();                      // an answer that is only pictures (the photo search)
    const cps = b.voice ? 17 : 45;
    for (const [k, line] of lines.entries()) {
      const s = h('span', k ? 'tp-line' : ''); t.append(s);
      const q = b.hand ? line.indexOf(' "') : -1;      // the card's own words go onto a small cream card; the description stays in the sans
      if (q < 0) { await typeInto(s, line, cps); continue; }
      await typeInto(s, line.slice(0, q), cps); if (stopped) return;
      const c = h('p', 'tp-hand tp-read'); t.after(c); await typeInto(c, line.slice(q + 1), cps);
    }
    if (b.attach) await b.attach(ctx, bub);
    if (b.note) bub.querySelector('.tp-body').append(h('p', 'tp-small', b.note));
    scroll();
    if (voice) await voice;
  }
  async function runYou(b) {
    mark(b.quiet ? 2 : i === S.beats.length - 1 ? 3 : 0);
    if (b.quiet) return;                                // only the ring: the presenter moves the lesson on
    if (i > 0 && !b.keep) fx.classList.add('done');     // the person's turn again: the AI's view steps back, faces show
    if (b.pick) await ctx.pick?.(b.pick);
    if (b.act === 'photo') { snap(b.snap || b.ring); shutter(); await wait(300); }
    if (b.marks) underline(b.marks);
    if (b.glow) root.append(h('div', 'tp-glow', null, pos(...b.glow)));
    if (b.outline && !matchMedia('(max-aspect-ratio:1/1)').matches) {   // upright screens crop it out
      const o = h('div', 'tp-outline', null, pos(...b.outline)); root.append(o); setTimeout(() => o.remove(), 4000); outlined = true;
    }
    const bub = bubble('you'); const t = bub.querySelector('.tp-text');
    if (b.input) {
      const text = input?.value.trim() || b.text;
      input?.parentElement && (input.parentElement.textContent = text); input = null;
      t.textContent = 'That\'s the last line, in my own words.';
      scroll(); return;
    }
    await typeInto(t, b.text, b.typed ? 9 : 50);
    if (b.slip && !stopped) await writeSlip(b.slip, bub);
  }
  /** Her puzzlement, in her colour: the hard words of the AI's last answer, underlined (not a word changes). */
  function underline(words) {
    const t = [...msgs.querySelectorAll('.tp-msg.ai .tp-text span')].pop(); if (!t) return;
    for (const w of words) {
      const n = [...t.childNodes].find((c) => c.nodeType === 3 && c.data.includes(w)); if (!n) continue;
      const rest = n.splitText(n.data.indexOf(w)); rest.splitText(w.length);
      const m = h('mark', 'tp-mark'); rest.replaceWith(m); m.append(rest);
    }
  }
  /** She writes it down, once her bubble has finished: on the empty table, or under her bubble where the picture is cropped. */
  async function writeSlip([text, x, y, w], bub) {
    const up = matchMedia('(max-aspect-ratio:1/1)').matches;
    const slip = h('p', 'tp-hand tp-slip', null, up ? '' : pos(x, y, w));
    if (up) bub.after(slip); else root.append(slip);
    requestAnimationFrame(() => slip.classList.add('on')); scroll();
    await wait(500); if (!stopped) await typeInto(slip, text, 24);
  }
  // advance: run the waiting "you" beat, then every AI beat after it, then show the next ring (or finish)
  async function next() {
    if (busy || stopped) return;
    const b = S.beats[i]; if (!b) return;
    busy = true; waitingRing?.remove(); waitingRing = null;
    await runYou(b); i++;
    while (!stopped && S.beats[i]?.who === 'ai') { await runAI(S.beats[i]); i++; }
    root.querySelectorAll('.tp-glow').forEach((g) => { g.classList.add('out'); setTimeout(() => g.remove(), 1600); });   // the answer is in: the glow fades
    busy = false;
    if (stopped) return;
    if (S.beats[i]) { mark(S.beats[i].quiet ? 2 : i === S.beats.length - 1 ? 3 : 0); showRing(S.beats[i]); }
    else { mark(3); steps.classList.add('done'); await wait(outlined ? 3400 : 1400); if (!stopped) api.onDone(); }   // an outline: seen before the card
  }
  mark(0); showRing(S.beats[0]);
  return {
    next, get typing() { return document.activeElement === input; },
    stop() { stopped = true; cancelAnimationFrame(raf); fit.disconnect(); root.innerHTML = ''; root.classList.remove('narrow'); },
    finish: async () => { while (!stopped && i < S.beats.length) { await next(); } },   // the self-check runs it all
  };
}

/** The AI's view of a picture: a Sobel edge map drawn as thin cyan lines on dark blue (like the old talk's machine view). */
function edges(src) {
  const img = new Image(); img.src = src;
  const W = 640, H = 360, cv = h('canvas', 'tp-edges'); cv.width = W; cv.height = H;
  const draw = () => {
    const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, W, H);
    const d = g.getImageData(0, 0, W, H), p = d.data, L = new Float32Array(W * H);
    for (let k = 0; k < W * H; k++) L[k] = p[k * 4] * 0.3 + p[k * 4 + 1] * 0.59 + p[k * 4 + 2] * 0.11;
    const out = g.createImageData(W, H), o = out.data;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x;
      const gx = -L[k - W - 1] - 2 * L[k - 1] - L[k + W - 1] + L[k - W + 1] + 2 * L[k + 1] + L[k + W + 1];
      const gy = -L[k - W - 1] - 2 * L[k - W] - L[k - W + 1] + L[k + W - 1] + 2 * L[k + W] + L[k + W + 1];
      const m = Math.min(1, Math.hypot(gx, gy) / 260);
      o[k * 4] = 10 + 133 * m; o[k * 4 + 1] = 18 + 215 * m; o[k * 4 + 2] = 34 + 221 * m; o[k * 4 + 3] = 235;
    }
    g.putImageData(out, 0, 0);
  };
  if (img.complete) draw(); else img.onload = draw;
  return cv;
}

export const TRY_CSS = `
#try{position:fixed;z-index:3;pointer-events:none}
#try>*{position:absolute}
#try .tp-ring,#try .tp-chat,#try .tp-menu{pointer-events:auto}
.tp-fx{inset:0;pointer-events:none}
.tp-fx.dark::before{content:"";position:absolute;inset:0;background:rgba(3,8,18,.55);transition:opacity .6s}
.tp-edges{position:absolute;inset:0;width:100%;height:100%;transition:opacity 1.6s;mix-blend-mode:normal}
.tp-edges.fade{opacity:.0}
.tp-scan{position:absolute;left:0;right:0;height:3px;background:var(--cyan);box-shadow:0 0 22px 6px rgba(143,233,255,.7)}
.tp-ring{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:0;cursor:pointer;color:var(--amber);font:inherit;padding:0;z-index:2}
.tp-ring i{width:58px;height:58px;border-radius:50%;border:3px solid var(--amber);box-shadow:0 0 24px rgba(255,198,90,.6),inset 0 0 18px rgba(255,198,90,.35);position:relative}
.tp-ring i::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:3px solid var(--amber);animation:ping 1.8s ease-out infinite}
.tp-ring span{font:700 clamp(16px,1.25vw,28px) var(--sans);background:rgba(8,12,22,.82);border:1px solid rgba(255,198,90,.5);padding:.3em .8em;border-radius:999px;white-space:nowrap}
@keyframes ping{from{transform:scale(1);opacity:.8}to{transform:scale(2.1);opacity:0}}
.tp-snap{position:absolute;width:26vmin;height:26vmin;border-radius:50%;pointer-events:none;z-index:2;opacity:0;
  background:radial-gradient(closest-side,rgba(255,255,255,.8),rgba(255,246,224,.3) 45%,transparent);animation:tpsnap .7s ease-out}
@keyframes tpsnap{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}14%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}
#try>.tp-chat:not(.has){opacity:0;pointer-events:none}
#try>.tp-chat{transition:opacity .4s}
.tp-box{position:absolute;border:3px solid var(--cyan);border-radius:6px;box-shadow:0 0 16px rgba(143,233,255,.55),inset 0 0 14px rgba(143,233,255,.18);animation:tpin .35s ease-out}
.tp-box b{position:absolute;left:-3px;bottom:100%;background:var(--cyan);color:#04131a;font:700 clamp(16px,1.25vw,28px)/1 var(--sans);padding:5px 8px;border-radius:5px 5px 0 0;white-space:nowrap}
@keyframes tpin{from{opacity:0;transform:scale(1.15)}to{opacity:1;transform:none}}
.tp-fx.settle .tp-box{opacity:0;transition:opacity 1.4s ease 2.4s}
.tp-steps[hidden],#try>.tp-steps[hidden]{display:none}   /* the second: beats #try>.tp-steps{display:flex} below (the weather) */
.tp-fx.done .tp-menu{opacity:0;transition:opacity 1s}

/* the steps strip: You ask → AI … → AI answers → You decide (24 px at 1080p; the beats still to come at .65, readable from the back) */
#try>.tp-steps{position:fixed;left:50%;top:max(10px,3vh);transform:translateX(-50%);display:flex;gap:6px;margin:0;padding:6px;list-style:none;background:rgba(8,12,22,.78);border-radius:999px;
  border:1px solid rgba(244,239,227,.18);white-space:nowrap}
.tp-steps li{display:flex;align-items:center;gap:.45em;padding:.35em .9em;border-radius:999px;font:600 clamp(16px,1.25vw,28px) var(--sans);color:rgba(244,239,227,.65);transition:all .4s}
.tp-steps li b{display:grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;border:1.5px solid currentColor;font-size:.8em}
.tp-steps li:nth-child(1).on,.tp-steps li:nth-child(4).on{background:rgba(255,198,90,.16);color:var(--amber)}
.tp-steps li:nth-child(2).on,.tp-steps li:nth-child(3).on{background:rgba(143,233,255,.14);color:var(--cyan)}
.tp-steps li.past{color:rgba(244,239,227,.85)}

/* the conversation: the person's bubbles amber on the right, the AI's cyan on the left; about 30 px at 1080p, wide enough for ~35 characters a line */
#try>.tp-chat{position:fixed;right:2.5vw;top:12vh;width:39vw;max-height:66vh;display:flex;flex-direction:column;background:rgba(8,12,22,.8);border:1px solid rgba(244,239,227,.16);
  border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:14px}
.tp-msgs{overflow:auto;display:flex;flex-direction:column;gap:12px;scrollbar-width:none}
.tp-msgs.cut{--f:min(var(--cut,0px),clamp(22px,2.2vw,44px));-webkit-mask-image:linear-gradient(transparent,#000 var(--f));mask-image:linear-gradient(transparent,#000 var(--f))}   /* scrolled: a sliced top line fades out (edge() sets --cut) */
.tp-msg{display:flex;gap:10px;align-items:flex-start;opacity:0;transform:translateY(10px);transition:opacity .45s,transform .45s}
.tp-msg.on{opacity:1;transform:none}
.tp-msg.you{flex-direction:row-reverse}
.tp-who{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font:700 18px var(--sans)}
.tp-msg.you .tp-who{background:rgba(255,198,90,.2);border:2px solid var(--amber)}
.tp-msg.you .tp-who::before{content:"";width:12px;height:12px;border-radius:50%;background:var(--amber);box-shadow:0 10px 0 -1px var(--amber)}
.tp-msg.ai .tp-who{background:rgba(143,233,255,.14);border:2px solid var(--cyan);color:var(--cyan)}
.tp-body{max-width:86%;padding:.55em .85em;border-radius:14px}
.tp-msg.you .tp-body{background:rgba(255,198,90,.15);border:1px solid rgba(255,198,90,.45);border-top-right-radius:4px}
.tp-msg.ai .tp-body{background:rgba(143,233,255,.09);border:1px solid rgba(143,233,255,.4);border-top-left-radius:4px}
.tp-text{margin:0;font:500 clamp(17px,1.55vw,34px)/1.38 var(--sans)}
.tp-msg.you .tp-text{color:#ffe2a8}.tp-msg.ai .tp-text{color:#d9f6ff}
.tp-line{display:block}
.tp-small{font:italic 500 clamp(14px,1.25vw,28px)/1.35 var(--serif);color:var(--soft);margin:.5em 0 0}
.tp-dots{display:inline-flex;gap:5px}.tp-dots i{width:8px;height:8px;border-radius:50%;background:var(--cyan);animation:dots 1s infinite}
.tp-dots i:nth-child(2){animation-delay:.15s}.tp-dots i:nth-child(3){animation-delay:.3s}
@keyframes dots{0%,100%{opacity:.25}50%{opacity:1}}
.tp-specwrap{margin-top:10px}.tp-specbox{border-radius:10px;background:#081018;overflow:hidden}.tp-spec{width:100%;height:auto;aspect-ratio:16/5;display:block}
.tp-specwrap .tp-small{margin:0 0 .3em;max-height:2em;transition:opacity .5s,max-height .5s .3s,margin .5s .3s}.tp-specwrap .tp-small.gone{opacity:0;max-height:0;margin:0}
/* the name Merlin suggests: cyan (the AI's colour), lit while a phrase sings, an outline between */
.tp-name{display:inline-block;margin:.45em 0 0;padding:.2em .6em;border-radius:8px;border:2px solid var(--cyan);color:var(--cyan);font:700 clamp(16px,1.4vw,30px)/1.2 var(--sans);opacity:0;transition:opacity .4s,background .25s,color .25s,box-shadow .25s}
.tp-name.on{opacity:1}.tp-name.lit{background:var(--cyan);color:#04131a;box-shadow:0 0 14px rgba(143,233,255,.5)}
/* rings of sound: thin, slow, from the bird's beak to the phone, fading on the way; three at most, none under reduced motion */
.tp-wave{position:absolute;width:2.5%;aspect-ratio:1;border:2px solid var(--cyan);border-radius:50%;opacity:0;transform:translate(-50%,-50%);animation:tpwave 3s ease-out both}
@keyframes tpwave{0%{left:var(--x0);top:var(--y0);width:2%;opacity:0}12%{opacity:.85}100%{left:var(--x1);top:var(--y1);width:9%;opacity:0}}
.tp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:.5em}
.tp-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:5px;transition:all .8s cubic-bezier(.65,0,.35,1)}
.tp-grid.found img{opacity:.12;filter:grayscale(1);transform:scale(.88)}
.tp-grid.found img.hit{opacity:1;filter:none;transform:scale(1.06);box-shadow:0 0 0 3px var(--cyan)}   /* the machine's finds: cyan */
.tp-grid{position:relative}.tp-grid.picked img.hit{opacity:.4}.tp-grid.picked img.tp-chosen{opacity:0}   /* its own cell, under the big one, goes */
.tp-grid.found img.tp-big{position:absolute;top:0;height:100%;width:auto;opacity:1;filter:none;transform:none;transform-origin:0 0;border-radius:8px;box-shadow:0 0 0 4px var(--amber),0 12px 34px rgba(0,0,0,.55)}   /* the person's pick: amber */
/* the verse in a hand that reads from the back row: Apple Chancery where there is one, else the warm italic serif (never a slant faked on the hand) */
.tp-hand{margin:.5em 0 0;padding:.5em .7em;background:#fbf6ea;color:#24324a;border-radius:4px;
  font:italic 400 clamp(16px,1.45vw,30px)/1.35 "Apple Chancery",var(--serif);font-synthesis:none}
.tp-hand.tp-own,.tp-slip{color:#7a2e1a}
.tp-hand.tp-read{width:fit-content;max-width:100%;margin-top:.6em;box-shadow:0 4px 14px rgba(0,0,0,.35);transform:rotate(-1deg)}   /* Aoife's words, as her card has them */
/* the library: her hard words underlined in amber as she asks (bright for 2 s, then faint); the slip she writes in rust */
.tp-mark{background:none;color:inherit;text-decoration-line:underline;text-decoration-color:rgba(255,198,90,.5);text-decoration-thickness:.12em;text-underline-offset:.18em;animation:tpmark 2.6s ease-out}
@keyframes tpmark{0%,75%{text-decoration-color:var(--amber);background:rgba(255,198,90,.14)}}
#try>.tp-slip{position:absolute;margin:0;box-shadow:0 10px 30px rgba(0,0,0,.45);transform:rotate(-2deg)}
.tp-slip{line-height:1.4;opacity:0;transition:opacity .6s;background:linear-gradient(transparent calc(1.4em - 1px),rgba(36,50,74,.16) 0) 0 .5em/100% 1.4em #fbf6ea}   /* a notebook's ruled lines */
.tp-slip.on{opacity:1}.tp-msgs>.tp-slip{align-self:flex-end;max-width:86%;margin:0 38px 0 0}
#try.carded>.tp-slip{opacity:0}
.tp-hand.tp-own{margin-top:2px;border-top:1px dashed rgba(122,46,26,.3)}
/* her details in the better verse: underlined in her own rust ink (amber would not show on the cream card) */
.tp-hand mark.tp-rust{background:none;color:inherit;text-decoration:underline 2px #7a2e1a;text-underline-offset:.16em;text-decoration-skip-ink:none}
/* what she is thinking of (the verse: her daughter's photo) warms in amber while she asks and the answer types, then fades */
#try>.tp-glow{pointer-events:none;border-radius:6px;box-shadow:0 0 0 4px var(--amber),0 0 56px 18px rgba(255,198,90,.55),inset 0 0 36px rgba(255,198,90,.35);
  background:rgba(255,198,90,.1);backdrop-filter:brightness(1.15);-webkit-backdrop-filter:brightness(1.15);animation:tpglow 1.4s ease-out;transition:opacity 1.4s ease}
#try>.tp-glow.out{opacity:0}
/* what they decided on (the wellies): a soft amber outline, in, held about 3 s, out; still under reduced motion */
#try>.tp-outline{pointer-events:none;border-radius:12px;border:3px solid var(--amber);box-shadow:0 0 22px rgba(255,198,90,.45),inset 0 0 16px rgba(255,198,90,.2);opacity:0;animation:tpoutline 4s ease both}
@keyframes tpoutline{15%,75%{opacity:1}}
#try.carded>.tp-outline{display:none}   /* reduced motion: the card comes at once, so it goes with it */
@keyframes tpglow{from{opacity:0}}
.tp-body:has(.tp-hand){max-width:none}   /* the verse gets the bubble's full width, so its lines stay whole */
/* the kitchen's lesson: the step's picture (16:9, shrinks with the chat), "Step k of 5", then its words */
.tp-body:has(.tp-lesson){max-width:none}
.tp-lesson img{display:block;width:min(100%,48vh);height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:8px;border:1px solid rgba(143,233,255,.4);transition:opacity .3s}
.tp-lesson img.out{opacity:0}
.tp-lesson .tp-k{margin:.5em 0 .2em;font:600 clamp(16px,1.25vw,24px) var(--sans);color:var(--soft)}
/* a narrower conversation on wide screens (the kitchen: Mam's pot; the photos: his mother's face); phones keep their own rules */
@media (min-aspect-ratio:1/1) and (min-height:561px){#try.narrow>.tp-chat{width:32vw}}
.tp-hand span{display:block;padding-left:1em;text-indent:-1em}.tp-hand br{display:none}   /* a line too long still wraps as poems do, indented */
.tp-input{width:100%;font:inherit;color:#7a2e1a;background:transparent;border:0;outline:none}
.tp-menu{position:absolute;background:#f5ecd9;color:#3a2a1a;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.6);transform:rotate(-1.5deg);opacity:0;transition:opacity .8s;overflow:hidden}
.tp-menu.on{opacity:1}
.tp-menu>div{position:absolute;inset:0;padding:5% 9%}
.tp-menu p{font:400 clamp(20px,1.7vw,34px)/1.2 var(--serif);margin:0 0 .9em;text-align:center}
.tp-menu .tp-menu-h{font:italic 700 clamp(30px,2.6vw,52px) var(--serif);color:#7a2e1a;margin-bottom:.6em}
.tp-menu p.tp-pick{text-decoration:underline var(--amber) .16em;text-underline-offset:.2em;text-decoration-skip-ink:none}   /* John's pick, in his colour */
.tp-menu-en{background:#eaf7ff;color:#0b3550;clip-path:inset(100% 0 0 0)}
.tp-menu-en p{font-family:var(--sans);font-weight:600}
.tp-lens{position:absolute;left:4%;right:4%;height:26%;border:4px solid var(--cyan);border-radius:22px;box-shadow:0 0 22px rgba(143,233,255,.6);cursor:grab;touch-action:none}
.tp-lens span{position:absolute;right:10px;top:-.9em;background:var(--cyan);color:#04131a;font:700 clamp(14px,1.25vw,24px) var(--sans);padding:3px 8px;border-radius:6px}
/* upright screens (phones, a tablet held upright): the conversation along the bottom, the strip as numbers, the menu centred */
@media (max-aspect-ratio:1/1){
  #try>.tp-steps{top:10px;gap:2px;padding:4px;max-width:calc(100vw - 16px)}
  #try>.tp-steps li{padding:.3em .6em;font-size:14px}#try>.tp-steps li:not(.on){font-size:0;gap:0;padding:.3em .35em}
  #try>.tp-steps li b{font-size:12px;width:22px;height:22px}
  #try>.tp-chat{left:10px;right:10px;width:auto;top:auto;bottom:10px;max-height:42vh;padding:10px;border-radius:14px}
  #try.carded>.tp-chat{opacity:0;pointer-events:none;transition:opacity .4s}
  .tp-msgs{gap:8px}.tp-text{font-size:16px}.tp-who{width:28px;height:28px;font-size:15px}.tp-lesson img{width:min(100%,30vh)}
  #try .tp-menu{position:fixed;left:50%!important;top:54px!important;height:36vh!important;width:min(38vh,calc(100vw - 24px))!important;transform:translateX(-50%) rotate(-1.5deg)}
  .tp-menu p{font-size:clamp(13px,2.3vh,20px)}.tp-menu .tp-menu-h{font-size:clamp(20px,3.4vh,30px)}
}
/* the narrowest phones: the menu to the left, so a ring pushed to the right edge (They decide) hangs its label beside the words, not on them */
@media (max-aspect-ratio:1/1) and (max-width:360px){#try .tp-menu{left:12px!important;transform:rotate(-1.5deg)}}
/* touch screens held upright: the Next button (limerick.html) sits at the bottom centre, the conversation just above it */
@media (hover:none) and (pointer:coarse) and (max-aspect-ratio:1/1){#try>.tp-chat{bottom:calc(max(14px,env(safe-area-inset-bottom)) + 58px)}}
/* a phone on its side: smaller words in the conversation, so it keeps its narrower box (room for the card beside it) */
@media (max-height:560px) and (min-aspect-ratio:1/1){#try>.tp-chat{top:max(54px,12vh);width:33vw;max-height:calc(100vh - 66px);padding:10px}.tp-text{font-size:15px}.tp-small{font-size:13px}
  #try>.tp-steps li{font-size:13px;padding:.25em .7em}
  #try .tp-menu{position:fixed;left:2vw!important;top:54px!important;width:34vw!important;height:min(250px,calc(100vh - 66px))!important}   /* the menu at the left, its own height: a 36% sheet is too short here */
  .tp-menu p{font-size:17px}.tp-menu .tp-menu-h{font-size:22px}}
@media (prefers-reduced-motion:reduce){.tp-mark{animation-timing-function:step-end}.tp-ring i::after,.tp-dots i,.tp-box,.tp-wave,#try>.tp-glow{animation:none}#try>.tp-outline{animation:none;opacity:1}.tp-wave{display:none}#try>.tp-glow{transition:none}.tp-lesson img,.tp-grid img,.tp-name,.tp-specwrap .tp-small{transition:none}.tp-msg{transition:opacity .45s}}
`;
