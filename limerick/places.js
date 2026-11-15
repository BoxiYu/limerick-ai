// The eight lit windows of "AI for All": one ordinary evening in Limerick, one window per part of life.
// Shared by the window houses (landmarks/windows.js, built before the city fill) and the talk (explore.js).
//
// Each place is a house on a quay with one large lit ground-floor window that shows the place's still picture.
// The still is also the first frame of its Google Flow video, so the window can grow into the video without a seam.
// bank 'e' = east quay (window faces the river, -x), 'w' = west quay (faces +x). z runs north (-) to south (+).
// The library is the exception: its window is the tall arched reading-room window of the library landmark.
//
// Fact base for every line: limerick/FACTS5.json (checked 11 Nov 2026). No statistics on screen.
// Who lives where (keep the pictures and the words in step): kitchen Mary · robin Tom · library Anne · travel John and
// Kathleen · photos Seán and his mother · card Peggy (granddaughter Aoife) · verse Breda (daughter in Australia) ·
// weather a young family.

export const QUAY = 39;            // the quay rows' front line, |x|
export const WIN = { w: 7.2, h: 4.05, y: 3.5 };   // a 16:9 window, the same shape as the video

export const PLACES = [
  {
    id: 'kitchen', bank: 'e', z: -98, kind: 'render', label: 'Kitchen',
    kicker: 'Five o\'clock · the kitchen',
    line: 'Show it what you have. It shows you how, one step at a time.',
    src: 'Illustrative scene · any AI assistant that takes photos',
    focus: '41% 45%',   // where a cropped screen centres the still: an upright phone keeps her face, her phone and Mam's pot
  },
  {
    id: 'nature', bank: 'w', z: -128, kind: 'render', label: 'The robin',
    kicker: 'Seven o\'clock · at the window',
    line: 'Open the window, hold up your phone. It names the bird that\'s singing.',
    src: 'Illustrative scene · Merlin Bird ID (free)',
  },
  {
    id: 'library', bank: 'e', z: 34, label: 'City Library', library: true,
    kicker: 'Half seven · the library',
    line: 'Ask, and ask again. It never sighs.',
    src: 'Illustrative scene · any AI assistant',
  },
  {
    id: 'travel', bank: 'w', z: -24, kind: 'georgian', label: 'Planning a trip',
    kicker: 'Eight o\'clock · planning a trip',
    line: 'Take a photo of a menu, and read it in English.',
    src: 'Illustrative scene · Google Gemini or ChatGPT, with a photo',
  },
  {
    id: 'photos', bank: 'w', z: 66, kind: 'render', label: 'Old photos',
    kicker: 'Half eight · by the fire',
    line: 'Type what was in the photo. The old ones come back.',
    src: 'Illustrative scene · Google Photos or Apple Photos search',
  },
  {
    id: 'card', bank: 'e', z: 152, kind: 'georgian', label: 'A Christmas card',
    kicker: 'Nine o\'clock · a card arrives',
    line: 'It reads the card aloud, so she can enjoy it herself.',
    src: 'Illustrative scene · ChatGPT or Google Gemini, with a photo',
  },
  {
    id: 'verse', bank: 'w', z: 150, kind: 'georgian', label: 'A few lines',
    kicker: 'Half nine · a card for far away',
    line: 'It helps with the words. The best line is yours.',
    src: 'Illustrative scene · any AI assistant',
  },
  {
    id: 'weather', bank: 'e', z: 214, kind: 'georgian', label: 'Tomorrow\'s weather',
    kicker: 'Last thing · the forecast',
    line: 'Behind the forecast, scientists now run an AI forecast too.',
    src: 'Illustrative scene · ECMWF, Europe\'s weather centre, runs an AI forecast alongside its usual one',
  },
];

/** Window geometry and camera for a quay place (the library defines its own in explore.js). */
export function quayWindow(p) {
  const s = p.bank === 'e' ? 1 : -1, x = s * (QUAY - 0.16);
  return {
    c: { x, y: WIN.y, z: p.z }, w: WIN.w, h: WIN.h, face: -s,           // face: the window's normal along x
    near: { pos: { x: x - s * 15.5, y: WIN.y + 0.9, z: p.z }, at: { x, y: WIN.y, z: p.z } },
    spot: { x: s * (QUAY + 2), y: 19.5, z: p.z },
  };
}
