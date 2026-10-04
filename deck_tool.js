// Edit the slide data inside index.html (story scenes, slide order, notes).
// Slide numbers are 1-based, as shown on the chapter cards.
//
//   node deck_tool.js list
//   node deck_tool.js add-scene <slide> <image> [--at N] [--motion zoom|walk|none] [--alt text] [--notes text]
//   node deck_tool.js remove-scene <slide> <scene>
//   node deck_tool.js notes <slide> [scene] <text>
//   node deck_tool.js move <slide> --after <slide>
//
// A slide with scenes plays them full screen before its own page. A slide with
// kind "story" is scenes only: after its last scene, Next goes to the next slide.
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'index.html');

function load() {
  const src = fs.readFileSync(FILE, 'utf8');
  const a = src.indexOf('const slides='), b = src.indexOf('\n', a);
  if (a < 0) throw new Error('slides data not found');
  const { slides, groups } = new Function(src.slice(a, b) + ';return {slides,groups}')();
  return { src, a, b, slides, groups };
}

function save(d) {
  const line = 'const slides=' + JSON.stringify(d.slides) + ',groups=' + JSON.stringify(d.groups) + ',thumbs={};';
  fs.writeFileSync(FILE, d.src.slice(0, d.a) + line + d.src.slice(d.b));
}

// Rebuild the array so its order is the presentation order, then remap every index.
function normalize(d) {
  const last = d.slides.length - 1;
  const order = [0, 1, ...d.groups.flatMap(g => g.ids), last];
  if (new Set(order).size !== d.slides.length) throw new Error('every slide must appear once');
  const map = new Map(order.map((old, i) => [old, i]));
  d.slides = order.map(i => d.slides[i]);
  d.groups.forEach(g => { g.ids = g.ids.map(i => map.get(i)); });
  d.slides.forEach((s, i) => {
    if (i >= 2) s.page = i + 1;
    s.nodes.forEach(n => { if (typeof n.target === 'number') n.target = map.get(n.target); });
  });
}

function slideAt(d, no) {
  const s = d.slides[Number(no) - 1];
  if (!s) throw new Error('no slide ' + no);
  return s;
}

function opts(args) {
  const o = { _: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) o[args[i].slice(2)] = args[++i];
    else o._.push(args[i]);
  }
  return o;
}

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

const [cmd, ...rest] = process.argv.slice(2);
const o = opts(rest), d = load();

if (cmd === 'list') {
  d.slides.forEach((s, i) => {
    const g = d.groups.findIndex(g => g.ids.includes(i));
    const sc = s.scenes?.length ? `  [${s.scenes.length} ฉาก]` : '';
    console.log(String(i + 1).padStart(2), (g >= 0 ? 'บท' + (g + 1) : '   ').padEnd(5), s.kind.padEnd(8), s.title + sc);
  });
} else if (cmd === 'add-scene') {
  const [no, img] = o._;
  const s = slideAt(d, no), mime = MIME[path.extname(img).toLowerCase()];
  if (!mime) throw new Error('image must be webp, png or jpg');
  const scene = {
    image: `data:${mime};base64,` + fs.readFileSync(img).toString('base64'),
    alt: o.alt || '', motion: o.motion || 'zoom', notes: o.notes || '',
  };
  s.scenes = s.scenes || [];
  const at = o.at ? Number(o.at) - 1 : s.scenes.length;
  s.scenes.splice(at, 0, scene);
  save(d);
  console.log(`added scene ${at + 1}/${s.scenes.length} to ${no} ${s.title}`);
} else if (cmd === 'remove-scene') {
  const [no, sc] = o._, s = slideAt(d, no);
  if (!s.scenes?.[sc - 1]) throw new Error('no scene ' + sc);
  s.scenes.splice(sc - 1, 1);
  if (!s.scenes.length) delete s.scenes;
  save(d);
  console.log(`removed scene ${sc} from ${no} ${s.title}`);
} else if (cmd === 'notes') {
  const s = slideAt(d, o._[0]);
  if (o._.length === 3) s.scenes[o._[1] - 1].notes = o._[2];
  else s.notes = o._[1];
  save(d);
} else if (cmd === 'move') {
  const from = Number(o._[0]) - 1, to = Number(o.after) - 1;
  if (from < 2 || to < 1 || from === to) throw new Error('cannot move that slide');
  d.groups.forEach(g => { g.ids = g.ids.filter(i => i !== from); });
  const g = to === 1 ? d.groups[0] : d.groups.find(g => g.ids.includes(to));
  if (!g) throw new Error('slide ' + o.after + ' is not in a chapter');
  g.ids.splice(to === 1 ? 0 : g.ids.indexOf(to) + 1, 0, from);
  normalize(d);
  save(d);
  console.log('moved; run list to check the new numbers');
} else {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(0, 11).join('\n'));
}
