// Usage: node validate.js js/pack-xyz.js [more packs...]
// Loads the app's data files, then the given pack(s), and checks every new idea.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = 'D:/Mind_Vault';
const ctx = { console, localStorage: { getItem: () => null, setItem() {} } };
ctx.window = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.isAbsolute(f) ? f : path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const targets = process.argv.slice(2).map(f => path.basename(f));
['js/data-assets.js', 'js/data-content.js', 'js/data-india.js', 'js/data-wisdom.js', ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^pack-.*.js$/.test(f) && !targets.includes(f)).map(f => 'js/' + f)].forEach(run);
const MV = ctx.MV, before = new Set(MV.ASSETS.map(a => a.id)), linksBefore = MV.LINKS.length, storiesBefore = MV.STORIES.length;
let bad = 0; const B = (...a) => { bad++; console.log('BAD', ...a); };
for (const f of process.argv.slice(2)) { try { run(f); } catch (e) { B('cannot load', f, e.message); } }
const ids = MV.ASSETS.map(a => a.id), idSet = new Set(ids), mids = new Set(MV.MODELS.map(m => m.id));
ids.filter((x, i) => ids.indexOf(x) !== i).forEach(x => B('duplicate id', x));
const fresh = MV.ASSETS.filter(a => !before.has(a.id));
const titles = {}; MV.ASSETS.forEach(a => { const t = a.title.toLowerCase(); if (titles[t]) B('duplicate title', a.id, titles[t]); titles[t] = a.id; });
fresh.forEach(a => {
  ['title', 'type', 'domain', 'cue', 'fact', 'why', 'mech', 'q', 'a', 'bring', 'follow', 'deeper'].forEach(k => { if (typeof a[k] !== 'string' || !a[k].trim()) B(a.id, 'missing', k); });
  if (!/^[a-z0-9-]+$/.test(a.id)) B(a.id, 'id must be lowercase letters, digits, hyphens');
  if (!MV.DOMAINS[a.domain]) B(a.id, 'unknown domain', a.domain);
  if (a.region && !['mumbai', 'maharashtra', 'india'].includes(a.region)) B(a.id, 'bad region', a.region);
  if (!(a.value >= 2 && a.value <= 5)) B(a.id, 'value must be 2..5');
  if (!Array.isArray(a.models)) B(a.id, 'models must be an array'); else a.models.forEach(m => mids.has(m) || B(a.id, 'unknown model', m));
  if (!a.mcq || typeof a.mcq.q !== 'string' || !Array.isArray(a.mcq.o) || a.mcq.o.length !== 4 || new Set(a.mcq.o).size !== 4) B(a.id, 'mcq needs q and 4 different options (first is correct)');
  if (!Array.isArray(a.chain) || a.chain.length < 3 || a.chain.length > 4) B(a.id, 'chain needs 3 or 4 steps');
  else {
    const text = (a.a + ' ' + a.mech + ' ' + a.fact).toLowerCase();
    a.chain.forEach(c => {
      if (!Array.isArray(c) || typeof c[0] !== 'string' || !Array.isArray(c[1]) || !c[1].length) return B(a.id, 'bad chain step', JSON.stringify(c).slice(0, 60));
      if (c[1].some(k => k !== k.toLowerCase())) B(a.id, 'chain keywords must be lowercase', c[0]);
      if (!c[1].some(k => text.includes(k))) B(a.id, 'no chain keyword appears in fact/mech/a for step:', c[0]);
    });
    const ans = a.a.toLowerCase(); const hit = a.chain.filter(c => c[1].some(k => ans.includes(k))).length;
    if (hit < a.chain.length - 1) B(a.id, 'the model answer `a` should itself touch nearly every chain step (touches ' + hit + ' of ' + a.chain.length + ')');
  }
  if (!Array.isArray(a.jargon) || !Array.isArray(a.mis)) B(a.id, 'jargon and mis must be arrays');
  (a.mis || []).forEach(m => { try { new RegExp(m.re, 'i'); } catch (e) { B(a.id, 'bad mis regex'); } });
  if (typeof a.emoji !== 'string' || !a.emoji) B(a.id, 'missing emoji');
  if (!('wiki' in a)) B(a.id, 'missing wiki (use an English Wikipedia article title, or null)');
  if (a.story && !MV.STORIES.find(s => s.id === a.story && s.assetId === a.id)) B(a.id, 'story id has no matching story');
  const longest = Math.max(...[a.fact, a.why, a.mech].join(' ').split(/(?<=[.!?])\s+/).map(s => s.split(/\s+/).length));
  if (longest > 32) B(a.id, 'a sentence is too long (' + longest + ' words). Keep sentences short.');
  if (/—/.test(JSON.stringify(a))) B(a.id, 'do not use em dashes');
  if (a.fact.split(/\s+/).length > 70) B(a.id, 'fact is too long (max about 60 words)');
});
MV.LINKS.slice(linksBefore).forEach(l => { if (!idSet.has(l[0]) || !idSet.has(l[1])) B('link to unknown id', l[0], l[1]); if (!l[2]) B('link has no note', l[0], l[1]); if (l[0] === l[1]) B('self link', l[0]); });
const linked = new Set(); MV.LINKS.forEach(l => { linked.add(l[0]); linked.add(l[1]); });
fresh.forEach(a => { if (!linked.has(a.id)) B(a.id, 'has no link to any other idea'); });
MV.STORIES.slice(storiesBefore).forEach(s => {
  const beats = ['hook', 'setting', 'character', 'conflict', 'surprise', 'turning', 'payoff', 'meaning'];
  beats.forEach(b => { if (typeof s[b] !== 'string' || !s[b]) B('story', s.id, 'missing', b); });
  if (!idSet.has(s.assetId)) B('story', s.id, 'unknown assetId');
  if (!Array.isArray(s.extra) || s.extra.length !== 3) B('story', s.id, 'needs 3 extra lines');
  if (!Array.isArray(s.vocab) || s.vocab.length !== 3) B('story', s.id, 'needs 3 vocab words');
  const t = beats.map(b => s[b]).join(' ').toLowerCase();
  (s.facts || []).forEach(f => { if (!f.some(x => t.includes(x))) B('story', s.id, 'fact not found in beats:', f[0]); });
  if (!Array.isArray(s.facts) || s.facts.length < 5) B('story', s.id, 'needs at least 5 facts groups');
});
const byDom = {}; fresh.forEach(a => byDom[a.domain] = (byDom[a.domain] || 0) + 1);
console.log(`new ideas: ${fresh.length}, new links: ${MV.LINKS.length - linksBefore}, new stories: ${MV.STORIES.length - storiesBefore}, by field: ${JSON.stringify(byDom)}`);
console.log(bad ? `FAILED with ${bad} problem(s)` : 'ALL GOOD');
process.exit(bad ? 1 : 0);
