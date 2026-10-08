/* Topics: what each person wants to see. Each tile is a part of the library;
   typed interests are matched against titles, facts and fields.
   The feed shows about 85% chosen topics and 15% surprises. No DOM here.
   Saved in prefs: profile {name, at}, topics [tile keys], interests [typed words], surprise (false = off).
   Saved in S.requests: [{t, q, n, off}] topics with too few cards, for a later content pack. */
(function () {
  const E = MV.E, A = MV.ASSETS, ENOUGH = 8;
  const pre = (...p) => a => p.some(x => a.id.startsWith(x + "-"));
  const dom = (...d) => a => d.includes(a.domain);
  // [key, label, emoji, test]
  const TILES = [
    ["mumbai", "Mumbai", "🌆", a => a.region === "mumbai"],
    ["maharashtra", "Maharashtra", "🛕", a => a.region === "maharashtra"],
    ["india", "All of India", "🪔", a => !!a.region],
    ["nature", "Nature & animals", "🐅", a => a.domain === "nature" || pre("ig")(a)],
    ["history", "History", "🏺", dom("history")],
    ["science", "Science & space", "🔭", a => a.domain === "science" && !pre("hb", "tk", "nt")(a)],
    ["health", "Health & body", "🫀", pre("hb")],
    ["tech", "Technology", "💻", pre("tk", "nt")],
    ["money", "Everyday money", "💰", dom("money")],
    ["wisdom", "Buffett & Munger", "📈", dom("wisdom")],
    ["business", "Business", "🏢", dom("business")],
    ["economics", "Economics", "📊", dom("economics")],
    ["mind", "Mind & behaviour", "🧠", dom("psychology")],
    ["philosophy", "Philosophy", "🤔", dom("philosophy")],
    ["thinkers", "Great thinkers", "💡", dom("thinkers")],
    ["lives", "People's lives", "👤", a => pre("lv")(a) || a.type === "person"],
    ["culture", "Arts & culture", "🎨", a => pre("ar", "mhc", "ic")(a) || a.domain === "anthropology"],
    ["places", "Places & maps", "🗺️", a => a.domain === "geography" || a.type === "place" || pre("mp", "mhp")(a)],
    ["strategy", "Strategy & war", "♟️", dom("strategy")],
    ["design", "Buildings & design", "🏛️", dom("design")],
    ["words", "Words & language", "🔤", dom("language")],
    ["models", "Smart thinking tools", "🧩", a => a.type === "mental model" || pre("mm")(a)],
    ["stories", "True stories", "📖", a => !!a.story],
    ["now", "Right now · 2026", "📰", a => !!a.now]
  ];
  const TM = Object.fromEntries(TILES.map(t => [t[0], t]));
  const P = () => E.S.prefs;

  /* ---------- typed interests ---------- */
  const STOP = new Set("a an and or the of in on at for to about with from my me i we like love want more learn know things stuff thing all some any".split(" "));
  const words = q => String(q).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
  // "birds" also finds "bird", "stories" also finds "story".
  function wordRe(w) {
    let b = w;
    if (/ies$/.test(b) && b.length > 4) b = b.slice(0, -3) + "y"; else if (/[^su]s$/.test(b) && b.length > 3) b = b.slice(0, -1);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("\\b" + (/y$/.test(b) ? esc(b.slice(0, -1)) + "(y|ies)" : esc(b) + "(s|es)?") + "\\b", "i");
  }
  const hayMemo = new Map();
  const hay = a => { if (!hayMemo.has(a.id)) hayMemo.set(a.id, [a.title, a.fact, a.why, MV.DOMAINS[a.domain], a.region ? MV.REGIONS[a.region] + " india indian" : ""].join(" ")); return hayMemo.get(a.id); };
  const qMemo = new Map();
  // Every typed word must appear in the card's title, fact, why it matters, field or region.
  function interestTest(q) {
    const k = String(q).toLowerCase().trim();
    if (!qMemo.has(k)) { const res = words(k).map(wordRe); qMemo.set(k, res.length ? a => res.every(r => r.test(hay(a))) : () => false); }
    return qMemo.get(k);
  }
  // A typed word that is really one of the tiles ("nature", "history") picks that tile.
  function tileFor(q) {
    const w = words(q).join(" "); if (!w) return null;
    return TILES.find(t => t[0] === w || words(t[1]).join(" ") === w || words(t[1]).includes(w) && words(t[1]).length <= 2 && w.length > 3) || null;
  }
  function search(q) {
    const t = tileFor(q); if (t) return { q, tile: t[0], n: A.filter(t[3]).length };
    const test = interestTest(q), ids = A.filter(test).map(a => a.id);
    return { q, n: ids.length, ids };
  }

  /* ---------- what she chose ---------- */
  const topics = () => (P().topics || []).filter(k => TM[k]);
  const interests = () => P().interests || [];
  const hasTopics = () => topics().length + interests().length > 0;
  // A topic key is a tile key, or "q:" + a typed interest.
  function test(key) { return key.startsWith("q:") ? interestTest(key.slice(2)) : (TM[key] || [, , , () => false])[3]; }
  function label(key) { return key.startsWith("q:") ? key.slice(2).replace(/^./, c => c.toUpperCase()) : TM[key][1]; }
  function emoji(key) { return key.startsWith("q:") ? "🔎" : TM[key][2]; }
  const keys = () => [...topics(), ...interests().map(q => "q:" + q)];
  // The test for "in her topics", or for one chip. null means no topics are chosen, so everything is in.
  function filter(only) {
    const ks = only ? [only] : keys(); if (!ks.length) return null;
    const ts = ks.map(test); return a => ts.some(t => t(a));
  }
  const count = key => A.filter(test(key)).length;

  function toggle(k) { const l = topics(), i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); P().topics = l; E.save(); return i < 0; }
  // Adds a typed interest. Returns {q, n, tile?, request, msg}.
  function addInterest(raw) {
    const q = String(raw).trim().replace(/\s+/g, " ").slice(0, 60); if (!words(q).length) return { q, n: 0, msg: "Type a topic, for example “birds” or “cricket”." };
    const r = search(q), Q = "“" + q + "”";
    if (r.tile) { if (!topics().includes(r.tile)) toggle(r.tile); return Object.assign(r, { msg: `We picked the topic “${TM[r.tile][1]}” for you. It has ${r.n} cards.` }); }
    if (r.n > 0 && !interests().some(x => x.toLowerCase() === q.toLowerCase())) { P().interests = [...interests(), q]; }
    if (r.n < ENOUGH) { addRequest(q, r.n); r.request = true; }
    E.save();
    r.msg = r.n === 0 ? `We do not have cards about ${Q} yet. We saved your request. New cards will come in a later update.`
      : r.n < ENOUGH ? `We have only ${r.n} card${r.n > 1 ? "s" : ""} about ${Q} now. You will see ${r.n > 1 ? "them" : "it"}, and we saved your request for more.`
      : `Added ${Q}. We found ${r.n} cards.`;
    return r;
  }
  function removeInterest(q) { P().interests = interests().filter(x => x !== q); E.save(); }

  /* ---------- topic requests ---------- */
  const reqs = () => E.S.requests || (E.S.requests = []);
  const requests = () => reqs().filter(x => !x.off).sort((a, b) => b.t - a.t);
  function addRequest(q, n) {
    const k = q.toLowerCase(), old = reqs().find(x => String(x.q).toLowerCase() === k);
    if (old) { old.n = n; if (old.off) { delete old.off; old.t = E.now(); } } else reqs().push({ t: E.now(), q, n });
    E.save();
  }
  function removeRequest(q) { const r = reqs().find(x => x.q === q); if (r) { r.off = E.now(); E.save(); } }
  // Plain text to send to Vishal, so new cards can be written in a later session.
  function requestsText() {
    const l = requests(); if (!l.length) return "";
    return "MindVault topic requests" + (profile().name ? " from " + profile().name : "") + ":\n" + l.map(r => `- ${r.q} (${r.n} cards now, asked ${new Date(r.t).toISOString().slice(0, 10)})`).join("\n");
  }

  /* ---------- profile, surprises ---------- */
  const profile = () => P().profile || {};
  const needsSetup = () => !P().profile;
  function setProfile(name) { P().profile = Object.assign({}, P().profile, { name: String(name || "").trim().slice(0, 40), at: P().profile && P().profile.at || E.now() }); E.save(); }
  const surpriseOn = () => P().surprise !== false;
  function setSurprise(on) { P().surprise = !!on; E.save(); }
  // 3 of every 20 idea cards are surprises: 15%.
  const isSurpriseSlot = n => [3, 9, 16].includes(n % 20);
  function greeting(d = new Date()) { const hr = d.getHours(); return hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"; }

  MV.Topics = { TILES, ENOUGH, search, interestTest, tileFor, topics, interests, hasTopics, keys, test, label, emoji, filter, count, toggle, addInterest, removeInterest,
    requests, addRequest, removeRequest, requestsText, profile, needsSetup, setProfile, surpriseOn, setSurprise, isSurpriseSlot, greeting };
})();
