// "Try it yourself": the real apps behind each window, so people can try them at home.
// One source for three places: the card at the end of each window, the "Try them at home" board after the finale
// (explore.js), and the printable take-home sheet (try.html).
//
// Fact base: limerick/FACTS5.json (checked 11 Nov 2026): app_examples, available_in_ireland_free and do_not_say.
// Keep to it: no numbers, no "always right", no "works offline" unless it is a downloaded pack (or Merlin's Sound ID:
// FACTS6.json merlin_sound_id).
// Each app name carries the app's own icon, small, beside it (ICONS below; Boxi, 13 Nov). Never inside the AI pictures.
// The apps are examples, not endorsements; there are others.

export const TRY = {
  kitchen: {
    apps: ['ChatGPT', 'Google Gemini', 'Microsoft Copilot'],
    first: 'Take a photo of what you have, and ask: "Can you show me how to make a stew, one step at a time, with pictures?"',
    terms: 'Free with a free sign-in · needs the internet · free plans limit how many photos you send and pictures it draws',
  },
  nature: {
    apps: ['Merlin Bird ID'],
    also: 'For a flower or a plant: Pl@ntNet or Google Lens',
    first: 'At home, download the Britain and Ireland bird pack for pictures of each bird. Outside, tap Sound ID and hold up the phone.',
    terms: 'Free · Sound ID works without a signal',   // without the pack too (FACTS6 merlin_sound_id)
  },
  library: {
    apps: ['ChatGPT', 'Google Gemini', 'Microsoft Copilot', 'Claude'],
    first: 'Ask your question. Then: "Explain that more simply", or "Give me an example".',
    terms: 'Free with a free sign-in · for the things that matter, check',
  },
  travel: {
    apps: ['Google Gemini', 'ChatGPT'],
    first: 'Take a photo of a menu or a sign and ask: "What does this say in English?"',
    terms: 'Free with a free sign-in · needs the internet: use the Wi-Fi, or check your data abroad',
  },
  photos: {
    apps: ['Google Photos', 'Apple Photos'],
    first: 'Tap Search and type what was in the picture: "dog beach", "birthday cake".',
    terms: 'Free · already on most phones · what it can find varies from phone to phone',
  },
  card: {
    apps: ['ChatGPT', 'Google Gemini'],
    also: 'If your eyes aren\'t what they were: Be My Eyes is free and made for this',
    first: 'Take a photo of the card and ask: "Can you read my card to me?"',
    terms: 'Free with a free sign-in · needs the internet · handwriting can come out wrong, so check anything important',
  },
  verse: {
    apps: ['ChatGPT', 'Google Gemini', 'Microsoft Copilot', 'Claude'],
    first: 'Ask for a few lines. Say what to change. Then add the last line yourself.',
    terms: 'Free with a free sign-in · needs the internet',
  },
  weather: {
    apps: [],
    none: 'Nothing to install',
    first: 'This AI works behind the scenes, at Europe\'s weather centre. Keep checking Met Éireann: met.ie or its app.',
    terms: 'Forecasters still make the call',
  },
};

/** Where the take-home page lives online (GitHub Pages, built by tools/publish.sh); the QR in limerick/assets/qr-try.svg points here. */
export const SITE = 'boxiyu.github.io/limerick-ai';

/** Free help to get started (FACTS5 "learning"); shown on the board and the take-home sheet. */
export const HELP = [
  ['AIReady.ie', 'free beginner courses, from the Government of Ireland and SOLAS'],
  ['Age-Friendly AI', 'free sessions coming to public libraries'],
  ['Ask at the library', 'Limerick Libraries lend tablets to older adults']
];

/** Before you start: the trust line of the talk, in four short rules. */
export const RULES = [
  'Share only what you\'d be happy to put on a postcard.',
  'It can be wrong, and still sound sure. Check what matters.',
  'Ask again, as often as you like.',
  'You decide.',
];

/** App name → its icon (limerick/assets/apps/<file>.png, 256 px square), the one place they are mapped. Apple Photos and
 *  Google Lens have none: their name stands alone. Paths are from the site root (limerick.html and try.html sit there). */
export const ICONS = { 'ChatGPT': 'chatgpt', 'Google Gemini': 'gemini', 'Microsoft Copilot': 'copilot', 'Claude': 'claude', 'Merlin Bird ID': 'merlin',
  'Google Photos': 'google-photos', 'Be My Eyes': 'be-my-eyes', 'Pl@ntNet': 'plantnet', 'Met Éireann': 'met-eireann' };
export const iconSrc = (name) => (ICONS[name] ? `limerick/assets/apps/${ICONS[name]}.png` : '');
const icon = (name, cls = 'app-ic') => (ICONS[name] ? `<img class="${cls}" src="${iconSrc(name)}" alt="">` : '');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Each app's own official page (checked 23 Nov 2026), so the home page can send people straight there. Apple Photos is
 *  already on every iPhone: Apple's own guide to searching it. Only try.html links the chips; the talk's board does not. */
export const LINKS = { 'ChatGPT': 'https://chatgpt.com/', 'Google Gemini': 'https://gemini.google.com/', 'Microsoft Copilot': 'https://copilot.microsoft.com/',
  'Claude': 'https://claude.ai/', 'Merlin Bird ID': 'https://merlin.allaboutbirds.org/', 'Google Photos': 'https://www.google.com/photos/about/',
  'Apple Photos': 'https://support.apple.com/guide/iphone/search-for-photos-and-videos-iph392d77d5f/ios', 'Be My Eyes': 'https://www.bemyeyes.com/',
  'Pl@ntNet': 'https://plantnet.org/', 'Google Lens': 'https://lens.google/', 'Met Éireann': 'https://www.met.ie/',
  'AIReady.ie': 'https://www.aiready.ie/', 'Age-Friendly AI': 'https://www.adaptcentre.ie/projects/age-friendly-ai/' };

/** The app names as chips; a window with nothing to install says so. With links, each chip opens the app's own page. */
export function chipsHTML(t, links = false) {
  if (!t.apps.length) return `<span class="app-chip none">${esc(t.none)}</span>`;
  return t.apps.map((a) => (links && LINKS[a]
    ? `<a class="app-chip" href="${LINKS[a]}" target="_blank" rel="noopener">${icon(a)}${esc(a)}<span class="ext" aria-hidden="true">↗</span></a>`
    : `<span class="app-chip">${icon(a)}${esc(a)}</span>`)).join('');
}

/** A line of text with the icon set just before each app name in it (the words stay as written). */
export function iconsIn(text) {
  let o = esc(text);
  for (const n of Object.keys(ICONS)) o = o.replace(esc(n), `${icon(n, 'app-ic in')}${esc(n)}`);
  return o;
}

/** The "Try it yourself" block on each window's card. */
export function tryHTML(t) {
  return `<p class="try-label">${t.apps.length ? 'Try it yourself' : 'Can I try it?'}</p>`
    + `<p class="try-apps">${chipsHTML(t)}</p>`
    + `<p class="try-first">${iconsIn(t.first)}</p>`
    + (t.also ? `<p class="try-terms">${iconsIn(t.also)}</p>` : '')
    + `<p class="try-terms">${esc(t.terms)}</p>`;
}

export const APPS_CSS = `
.how-go{display:inline-flex;align-items:center;gap:.5em;margin:.75em 0 0;padding:.45em 1em .45em .8em;border-radius:999px;border:0;background:var(--amber);color:#1a1206;
  font:800 clamp(15px,1.05vw,21px)/1 var(--sans);cursor:pointer}
.how-go::before{content:"";width:.65em;height:.7em;background:#1a1206;clip-path:polygon(0 0,100% 50%,0 100%)}
.how-go:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
#card .how-go{background:var(--amber);color:#1a1206;padding:.45em 1em .45em .8em;font:800 clamp(15px,1.25vw,28px)/1 var(--sans)}
.apps-tile .how-go{margin-top:auto;align-self:flex-start;font-size:clamp(13px,1.05vw,20px)}
.app-chip{display:inline-flex;align-items:center;padding:.28em .75em;border-radius:999px;border:1.5px solid var(--amber);color:var(--amber);
  background:rgba(255,198,90,.1);font:700 clamp(15px,1.25vw,28px)/1.1 var(--sans);white-space:nowrap}
/* the app's icon beside its name: rounded like a phone's, a thin edge so it sits on any background */
.app-ic{flex:none;width:1.25em;height:1.25em;border-radius:22%;border:1px solid rgba(244,239,227,.35);object-fit:cover}
.app-chip:has(.app-ic){gap:.4em;padding:.2em .75em .2em .3em}   /* the chip keeps its height */
.app-ic.in{display:inline-block;width:1.15em;height:1.15em;margin-right:.25em;vertical-align:-.22em}
.app-chip.none{border-style:dashed;border-color:rgba(244,239,227,.45);color:var(--soft);background:none}
#card .ui-try{margin:.9em 0 0;padding:.85em 0 0;border-top:1px solid rgba(244,239,227,.16)}
.try-label{margin:0 0 .45em;font:700 clamp(13px,1.25vw,26px)/1 var(--sans);letter-spacing:.16em;text-transform:uppercase;color:var(--amber)}
.try-apps{display:flex;flex-wrap:wrap;gap:8px;margin:0}
.try-first{margin:.6em 0 0;font:500 clamp(17px,1.35vw,30px)/1.35 var(--sans);color:var(--ink)}
.try-terms{margin:.35em 0 0;font:italic 500 clamp(14px,1.25vw,26px)/1.35 var(--serif);color:var(--soft)}

/* the board after the finale: every window, its apps and the first thing to try */
/* centred by auto margins (header and foot), which give way when the board is taller than the screen: it then scrolls from
   its top. A slim top and bottom, so a 720 or 768 px high screen still shows it whole, as before. */
#apps{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;overflow:auto;overscroll-behavior:contain;padding:max(10px,1.5vh) 4vw;
  background:radial-gradient(80% 70% at 50% 50%,rgba(3,6,14,.9),rgba(3,6,14,.72));opacity:0;pointer-events:none;transition:opacity .8s}
#apps.on{opacity:1;pointer-events:auto}
#apps:focus{outline:none}   /* a scrolling panel the browser may focus (the #apps link): no ring round the whole screen */
#apps header{display:flex;align-items:baseline;justify-content:space-between;gap:24px;margin:auto 0 2.2vh}
#apps h2{margin:0;font:600 clamp(34px,3.6vw,68px)/1 var(--serif);color:var(--ink)}
#apps h2 em{font-style:italic;color:var(--amber)}
#apps header p{margin:0;font:500 clamp(15px,1.25vw,24px)/1.3 var(--sans);color:var(--soft);text-align:right}
#apps header{align-items:center}
.apps-qr{display:flex;align-items:center;gap:clamp(10px,1vw,18px);margin:0;text-align:right}
.apps-qr img{flex:none;width:clamp(110px,15vh,240px);height:auto;padding:6px;background:#fff;border-radius:8px}
.apps-qr b{display:block;color:var(--ink);font:700 clamp(17px,1.25vw,25px)/1.2 var(--sans);overflow-wrap:anywhere}   /* the address may break: the QR beside it stays on a narrow screen */
.apps-qr b span{white-space:nowrap}   /* it breaks only after the "/", never at its hyphen (one might type it without) */
.apps-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(10px,1vw,18px)}
.apps-tile{background:rgba(8,12,22,.8);border:1px solid rgba(244,239,227,.16);border-radius:14px;padding:clamp(12px,1.1vw,20px);
  display:flex;flex-direction:column;gap:.55em;opacity:0;transform:translateY(12px);transition:opacity .6s,transform .6s}
#apps.on .apps-tile{opacity:1;transform:none}
.apps-tile h3{margin:0;display:flex;align-items:center;gap:.5em;font:700 clamp(17px,1.25vw,24px)/1.15 var(--sans);color:var(--soft);letter-spacing:.04em}
.apps-tile h3 b{display:grid;place-items:center;flex:none;width:1.7em;height:1.7em;border-radius:50%;border:1.5px solid var(--amber);color:var(--amber);font-size:.85em}
.apps-tile .try-apps{gap:6px}
.apps-tile .app-chip{font-size:clamp(17px,1.25vw,24px)}
/* icons make each chip wider: a tighter chip, and on wide screens slimmer side margins, keep two to a row as before */
.apps-tile .app-chip:has(.app-ic){padding:.15em .55em .15em .2em;gap:.3em}.apps-tile .app-ic{width:1.15em;height:1.15em}.apps-tile .try-apps{gap:5px}
@media (min-width:901px){#apps{padding-inline:3vw}.apps-tile{padding-inline:clamp(10px,.8vw,16px)}}
.apps-tile .try-first{margin:0;font-size:clamp(16px,1.25vw,24px)}
@media (max-height:760px){.apps-tile .try-first{display:none}}
.apps-foot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 32px;margin:2.4vh 0 auto;font:500 clamp(15px,1.25vw,24px)/1.35 var(--sans);color:var(--soft)}
.apps-foot b{color:var(--ink)}.apps-foot .rule{color:var(--amber);font:italic 600 clamp(17px,1.25vw,25px) var(--serif)}
@media (max-width:900px){.apps-grid{grid-template-columns:repeat(2,1fr)}#apps{padding-block:4vh}
  #apps header{flex-wrap:wrap}.apps-qr{flex:1 1 100%;min-width:0;justify-content:flex-start;text-align:left}}
@media (max-width:600px){.apps-grid{grid-template-columns:minmax(0,1fr)}.app-chip{white-space:normal}}
@media (prefers-reduced-motion:reduce){.apps-tile,#apps{transition:none}}
`;
