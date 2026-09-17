const fs = require('fs');
const { JSDOM } = require('jsdom');

// Runtime tests for Where to?  Boots the real index.html in a DOM and drives it
// the way a person would: clicking, typing, importing files.
//   node test/app.test.js

const path = require('path');

const APP = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(APP, 'utf8');

let fails = 0, passes = 0;
function ok(name, cond, extra) {
  if (cond) { passes++; console.log('  PASS', name); }
  else { fails++; console.log('  FAIL', name, extra !== undefined ? '->' + JSON.stringify(extra) : ''); }
}

// minimal localStorage
function makeStore() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear(),
    _dump: () => JSON.parse(m.get('whereto.v1') || 'null'),
  };
}

function boot(seedState) {
  const store = makeStore();
  if (seedState) store.setItem('whereto.v1', JSON.stringify(seedState));
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(win) {
      Object.defineProperty(win, 'localStorage', { value: store, configurable: true });
      win.open = () => ({ focus() {} });         // pretend popups allowed
      win.URL.createObjectURL = () => 'blob:x';
      win.URL.revokeObjectURL = () => {};
    }
  });
  return { dom, win: dom.window, doc: dom.window.document, store };
}

console.log('\n1. Empty start');
{
  const { doc, store } = boot();
  ok('starts with no sites', store._dump() === null);
  ok('destination shows empty prompt', /Add a place/.test(doc.getElementById('destName').textContent));
  ok('pinned column empty-state visible', doc.getElementById('pinEmpty').style.display !== 'none');
  ok('page has an h1', !!doc.querySelector('h1'));
  ok('logo aspect attrs match', doc.querySelector('.logo').getAttribute('width') === '760' &&
     doc.querySelector('.logo').getAttribute('height') === '568');
}

console.log('\n2. Add a site through the UI');
{
  const { doc, store, win } = boot();
  doc.getElementById('addBtn').click();
  doc.getElementById('fUrl').value = 'example.com/puzzles';
  doc.getElementById('fName').value = 'Puzzles';
  doc.getElementById('addSave').click();
  const saved = store._dump();
  ok('site persisted', saved && saved.sites.length === 1, saved && saved.sites.length);
  ok('url normalised to https', saved.sites[0].url === 'https://example.com/puzzles', saved.sites[0].url);
  ok('default priority is 3', saved.sites[0].priority === 3);
  ok('settings persisted with boost on', saved.settings && saved.settings.boost === true);
  ok('dialog closed after save', !doc.getElementById('addOverlay').className.includes('open'));
  ok('destination now names the site', doc.getElementById('destName').textContent === 'Puzzles');
}

console.log('\n3. Duplicate + invalid input rejected');
{
  const { doc, store } = boot();
  const add = (u) => { doc.getElementById('addBtn').click(); doc.getElementById('fUrl').value = u; doc.getElementById('addSave').click(); };
  add('example.com');
  add('example.com');            // duplicate
  ok('duplicate rejected', store._dump().sites.length === 1, store._dump().sites.length);
  add('   ');                    // empty
  ok('blank url rejected', store._dump().sites.length === 1);
}

console.log('\n4. Visit recording, streaks, most-visited order');
{
  const today = new Date();
  const d = (off) => { const x = new Date(today); x.setDate(x.getDate() + off);
    return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); };
  const seed = { version:1, settings:{boost:true}, sites:[
    { id:'a', name:'Alpha', url:'https://a.test/', category:'', priority:3, pinned:false, pinRank:null, visits:5, streak:2, lastVisited:d(-1) },
    { id:'b', name:'Bravo', url:'https://b.test/', category:'', priority:3, pinned:false, pinRank:null, visits:9, streak:1, lastVisited:d(-9) },
  ]};
  const { doc, store } = boot(seed);
  const rows = doc.querySelectorAll('#freqList .freq-row');
  ok('most-visited sorted by visits desc', /Bravo/.test(rows[0].textContent) && /Alpha/.test(rows[1].textContent));
  rows[1].click();                                  // open Alpha (yesterday -> today)
  let a = store._dump().sites.find(s => s.id === 'a');
  ok('consecutive day increments streak', a.streak === 3, a.streak);
  ok('visit counted', a.visits === 6, a.visits);
  doc.querySelectorAll('#freqList .freq-row')[0].click();   // Bravo, 9 days stale
  let b = store._dump().sites.find(s => s.id === 'b');
  ok('broken streak resets to 1', b.streak === 1, b.streak);
  // same-day second visit must not double the streak
  const before = store._dump().sites.find(s => s.id === 'a').streak;
  doc.querySelectorAll('#freqList .freq-row').forEach(r => { if (/Alpha/.test(r.textContent)) r.click(); });
  a = store._dump().sites.find(s => s.id === 'a');
  ok('same-day revisit keeps streak', a.streak === before, a.streak);
  ok('same-day revisit still counts a visit', a.visits === 7, a.visits);
}

console.log('\n5. Priority weighting + visit boost');
{
  const seed = { version:1, settings:{boost:true}, sites:[
    { id:'lo', name:'Low',  url:'https://lo.test/',  category:'', priority:1, pinned:false, pinRank:null, visits:0, streak:0, lastVisited:null },
    { id:'hi', name:'High', url:'https://hi.test/',  category:'', priority:5, pinned:false, pinRank:null, visits:0, streak:0, lastVisited:null },
  ]};
  const { doc, win } = boot(seed);
  // sample the queued destination across many rerolls (Space rerolls)
  const counts = {};
  for (let i = 0; i < 4000; i++) {
    const ev = new win.KeyboardEvent('keydown', { key: ' ', bubbles: true });
    doc.dispatchEvent(ev);
    const n = doc.getElementById('destName').textContent;
    counts[n] = (counts[n] || 0) + 1;
  }
  // with 2 sites the previous pick is excluded only after a real visit; here prev is null
  const ratio = counts['High'] / counts['Low'];
  ok('priority 5 beats priority 1 roughly 5:1', ratio > 3.6 && ratio < 6.8, { ratio: +ratio.toFixed(2), counts });
}

console.log('\n6. Boost maths and toggle');
{
  const mk = (id, visits) => ({ id, name:id, url:`https://${id}.test/`, category:'', priority:3, pinned:false, pinRank:null, visits, streak:0, lastVisited:null });
  const seed = { version:1, settings:{boost:true}, sites:[mk('q',0), mk('r',63)] };
  const { doc, store } = boot(seed);
  doc.getElementById('openDirectory').click();
  const txt = doc.getElementById('dirList').textContent;
  ok('boost tag shown for visited site', /\+5/.test(txt), txt.slice(0,160));
  ok('no boost tag for unvisited site', (txt.match(/\+/g) || []).length === 1);
  doc.getElementById('boostToggle').click();
  ok('toggle persists off', store._dump().settings.boost === false);
  ok('toggle label reads Off', doc.getElementById('boostLabel').textContent === 'Off');
  ok('boost shown as disabled', /off/i.test(doc.getElementById('dirList').textContent));
  doc.getElementById('boostToggle').click();
  ok('toggle back on', store._dump().settings.boost === true);
}

console.log('\n7. Pinning and reordering');
{
  const mk = (id, rank) => ({ id, name:id.toUpperCase(), url:`https://${id}.test/`, category:'', priority:3, pinned:true, pinRank:rank, visits:0, streak:0, lastVisited:null });
  const seed = { version:1, settings:{boost:true}, sites:[mk('one',1), mk('two',2), mk('three',3)] };
  const { doc, store } = boot(seed);
  const names = () => Array.from(doc.querySelectorAll('#pinList .pin-open')).map(b => b.textContent);
  ok('pinned render in rank order', JSON.stringify(names()) === JSON.stringify(['ONE','TWO','THREE']), names());
  doc.querySelectorAll('#pinList .pin-row')[2].querySelector('.up').click();   // move THREE up
  ok('move up reorders', JSON.stringify(names()) === JSON.stringify(['ONE','THREE','TWO']), names());
  ok('ranks persisted 1..n', JSON.stringify(store._dump().sites.map(s=>s.pinRank).sort()) === '[1,2,3]');
  doc.querySelectorAll('#pinList .pin-row')[0].querySelector('.up').click();   // already first: no-op
  ok('move up at top is a no-op', JSON.stringify(names()) === JSON.stringify(['ONE','THREE','TWO']), names());
  doc.querySelectorAll('#pinList .pin-row')[2].querySelector('.down').click(); // already last: no-op
  ok('move down at bottom is a no-op', JSON.stringify(names()) === JSON.stringify(['ONE','THREE','TWO']), names());
  // unpin via directory, ranks should stay contiguous
  doc.getElementById('openDirectory').click();
  doc.querySelector('#dirList .sq.pin').click();
  const ranks = store._dump().sites.filter(s=>s.pinned).map(s=>s.pinRank).sort();
  ok('ranks stay contiguous after unpin', JSON.stringify(ranks) === '[1,2]', ranks);
}

console.log('\n8. Drag handlers do not stack across re-renders');
{
  const mk = (id, rank) => ({ id, name:id, url:`https://${id}.test/`, category:'', priority:3, pinned:true, pinRank:rank, visits:0, streak:0, lastVisited:null });
  const seed = { version:1, settings:{boost:true}, sites:[mk('p1',1), mk('p2',2)] };
  const { doc, win } = boot(seed);
  const list = doc.getElementById('pinList');
  let added = 0;
  const orig = list.addEventListener.bind(list);
  list.addEventListener = function (t, f, o) { if (t === 'dragover') added++; return orig(t, f, o); };
  for (let i = 0; i < 12; i++) doc.querySelectorAll('#pinList .mini.up')[1].click();  // force many re-renders
  ok('no new dragover listeners on re-render', added === 0, added);
}

console.log('\n9. Import merge + export shape');
module.exports = (function () {
  const { doc, win, store } = boot();
  doc.getElementById('addBtn').click();
  doc.getElementById('fUrl').value = 'https://dup.test/';
  doc.getElementById('addSave').click();
  const payload = JSON.stringify({ version:1, settings:{boost:false}, sites:[
    { url:'https://dup.test/', name:'Dup', priority:5, visits:12, streak:4, pinned:true },
    { url:'new.test/path', name:'New', priority:2 },
    { url:'', name:'Broken' },
    { name:'NoUrl' },
  ]});
  // drive the FileReader path exactly as the change handler does
  const file = new win.File([payload], 'c.json', { type:'application/json' });
  const input = doc.getElementById('fileInput');
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new win.Event('change'));
  return new Promise(res => setTimeout(() => {
    const d = store._dump();
    ok('merged, not duplicated', d.sites.length === 2, d.sites.map(s=>s.url));
    const dup = d.sites.find(s => s.url === 'https://dup.test/');
    ok('incoming priority applied on merge', dup.priority === 5, dup.priority);
    ok('higher visits kept on merge', dup.visits === 12, dup.visits);
    ok('pinned applied on merge', dup.pinned === true);
    ok('relative url normalised on import', !!d.sites.find(s => s.url === 'https://new.test/path'));
    ok('entries without a url skipped', !d.sites.some(s => !s.url));
    ok('settings honoured from import', d.settings.boost === false);
    res();
  }, 60));
})();

function summary() {
  console.log('\n' + '-'.repeat(46));
  console.log(`  ${passes} passed, ${fails} failed`);
  if (fails) { process.exitCode = 1; console.log('  FAILED'); }
  else console.log('  OK');
}

// section 9 returns a promise; wait for it before reporting
const pending = module.exports;
Promise.resolve(pending).then(summary, err => { console.error(err); process.exitCode = 1; });
