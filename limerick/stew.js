// Mary's stew (the kitchen window): a simple Irish lamb stew in five steps, each with the small picture she asked for.
// Shared by the talk's conversation (tryit.js) and "Show me how" (howto.js). Facts: limerick/FACTS6.json (stew).
// The pictures are AI drawings made for the talk (STILLS.md ## stew1–5), in a clean light style with a plain cream pot,
// so they read as the AI's drawings, not her kitchen or Mam's old blue pot.
const A = 'limerick/assets/stew/';

export const STEW = [
  { img: `${A}stew1.jpg`, text: 'Slice the onions and carrots. Then cut the lamb into big pieces.' },
  { img: `${A}stew2.jpg`, text: 'Layer them in the pot with salt and pepper. Just cover with water.' },
  { img: `${A}stew3.jpg`, text: 'Bring it to the boil. Then lid on, lowest heat, for an hour.' },
  { img: `${A}stew4.jpg`, text: 'Peeled potatoes on top. Another half hour, till a fork slides through.' },
  { img: `${A}stew5.jpg`, text: 'Taste, and add salt if it needs it. Parsley on top, and a cut of brown bread.' },
];
// Mary's own photo of her table (STILLS.md ## kitchenphoto), for "Show me how"
export const TABLE = `${A}table.jpg`;
