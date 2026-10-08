// Integrate finished content packs: script tags, photos, offline file list.
const fs = require('fs'), vm = require('vm');
process.chdir('D:/Mind_Vault');
const PACKS = fs.readdirSync('js').filter(f => /^pack-.*\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).sort();
const hasDaily = fs.existsSync('js/data-daily.js');
let html = fs.readFileSync('index.html', 'utf8');
PACKS.forEach(p => { if (!html.includes(`js/${p}.js`)) html = html.replace('<script src="js/engine.js"></script>', `<script src="js/${p}.js"></script>\n<script src="js/engine.js"></script>`); });
if (hasDaily && !html.includes('js/data-daily.js')) html = html.replace('<script src="js/engine.js"></script>', '<script src="js/data-daily.js"></script>\n<script src="js/engine.js"></script>');
if (fs.existsSync('js/data-daily-2.js') && !html.includes('js/data-daily-2.js')) html = html.replace('<script src="js/data-daily.js"></script>', '<script src="js/data-daily.js"></script>\n<script src="js/data-daily-2.js"></script>');
fs.writeFileSync('index.html', html);

// load all data to find ideas that ask for a photo
const ctx = { console, localStorage: { getItem: () => null, setItem() {} } }; ctx.window = ctx; vm.createContext(ctx);
['data-assets', 'data-content', 'data-india', 'data-wisdom', ...PACKS].forEach(f => vm.runInContext(fs.readFileSync(`js/${f}.js`, 'utf8'), ctx));
let media = fs.readFileSync('js/media.js', 'utf8');
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const todo = ctx.MV.ASSETS.filter(a => a.wiki && !media.includes(JSON.stringify(a.id) + ':') && (!ONLY || ONLY.test(a.id)));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const rows = []; let ok = 0;
  for (const a of todo) {
    let row = null;
    for (let t = 0; t < 4 && !row; t++) {
      try {
        const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(a.wiki.replace(/ /g, '_')), { headers: { 'user-agent': 'MindVaultBuild/1.0 (personal learning app; vishald382 on GitHub)' } });
        if (r.status === 429) { await sleep(5000 * (t + 1)); continue; }
        if (!r.ok) { console.log('no page', a.id, a.wiki, r.status); break; }
        const j = await r.json(), o = j.originalimage, th = j.thumbnail;
        if (!o || !th) { console.log('no image', a.id, a.wiki); break; }
        const clean = u => u.split('?')[0]; let u = clean(o.source);
        if (!/\/wikipedia\/commons\//.test(u)) { console.log('not on Commons, skipped', a.id, a.wiki); break; }   // may not be freely licensed
        if (/\.gif$/i.test(u)) { console.log('gif skipped', a.id); break; }
        if (o.width > 1000 && /\/thumb\//.test(th.source)) u = clean(th.source).replace(/\/\d+px-/, '/960px-');
        const fit = /\.svg/i.test(u) || o.width < 450 || /map|logo|diagram|chart|flag|emblem|seal/i.test(decodeURIComponent(u)) ? 1 : 0;
        row = [a.emoji, u, j.content_urls.desktop.page, fit]; ok++;
      } catch (e) { await sleep(2000); }
    }
    if (row) rows.push('    ' + JSON.stringify(a.id) + ': ' + JSON.stringify(row));
    await sleep(1300);
  }
  if (rows.length) { media = media.replace('\n  };\n  const emoji', ',\n' + rows.join(',\n') + '\n  };\n  const emoji'); fs.writeFileSync('js/media.js', media); new Function(media); }
  console.log(`photos: ${ok} of ${todo.length} ideas that asked for one`);
  // offline file list = every local script in index.html
  let sw = fs.readFileSync('sw.js', 'utf8');
  const files = ['./', 'index.html', 'manifest.webmanifest', 'css/styles.css', ...new Set(html.match(/js\/[\w-]+\.js/g)), 'icons/icon-192.png', 'icons/icon-512.png'];
  const ver = +sw.match(/mindvault-v(\d+)/)[1] + 1;
  sw = sw.replace(/mindvault-v\d+/, 'mindvault-v' + ver).replace(/const FILES = \[.*?\];/, 'const FILES = ' + JSON.stringify(files) + ';');
  fs.writeFileSync('sw.js', sw);
  files.forEach(f => { if (f !== './' && !fs.existsSync(f)) console.log('MISSING FILE', f); });
  console.log('packs:', PACKS.join(', '), '| daily:', hasDaily, '| sw v' + ver, '| files', files.length, '| ideas', ctx.MV.ASSETS.length, 'links', ctx.MV.LINKS.length, 'stories', ctx.MV.STORIES.length);
})();
