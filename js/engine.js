/* MindVault engine: state model, memory decay, knowledge graph, gaps, serendipity,
   session builder, portfolio analytics, identity. No DOM here. */
(function () {
  const DAY = 864e5;
  const KEY = "mindvault.v1";
  const A = MV.ASSETS, AM = Object.fromEntries(A.map(a => [a.id, a]));
  const MM = Object.fromEntries(MV.MODELS.map(m => [m.id, m]));
  const SM = Object.fromEntries(MV.STORIES.map(s => [s.id, s]));
  const assetOfStory = Object.fromEntries(MV.STORIES.map(s => [s.assetId, s]));
  const SYSTEMS = ["feedback-loops", "bottlenecks", "network-effects", "compounding", "second-order-thinking", "incentives"];
  const EPISTEMIC = ["confirmation-bias", "survivorship-bias", "bayesian-thinking", "map-vs-territory", "goodharts-law"];
  const STRATEGIC = ["game-theory", "inversion", "opportunity-cost", "margin-of-safety"];

  let S = load();
  function blank() {
    return { v: 1, created: Date.now(), ev: {}, rev: {}, conns: [], mlinks: {}, apps: [], attempts: [], missions: [], events: [], prefs: {}, daily: {}, requests: [], resetAt: 0, demo: false };
  }
  function load() {
    try { const r = localStorage.getItem(KEY); if (r) return Object.assign(blank(), JSON.parse(r)); } catch (e) {}
    return blank();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (MV.onSave) MV.onSave(); }
  const now = () => Date.now();
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const dayRng = () => rng(Math.floor(Date.now() / DAY) + 7);
  const shuffle = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------- evidence → state ---------- */
  const CHAIN = ["recognized", "recalled", "explained", "connected", "expressed", "convo"];
  function has(id, k, T = Infinity) { const e = S.ev[id]; return !!(e && e[k] != null && e[k] <= T); }
  function stateIdx(id, T = Infinity) {
    if (!has(id, "seen", T)) return -1;
    let i = 0;
    for (const k of CHAIN) { if (has(id, k, T)) i++; else return i; }
    if (AM[id].story) { if (has(id, "story", T)) i = 7; else return 6; }
    if (has(id, "applied", T) && has(id, "taught", T)) return 8;
    return i;
  }
  function nextNeed(id) {
    if (!has(id, "seen")) return "learn";
    if (!has(id, "recognized")) return "recognize";
    if (!has(id, "recalled")) return "recall";
    if (!has(id, "explained")) return "explain";
    if (!has(id, "connected")) return "connect";
    if (!has(id, "expressed")) return "explain10";
    if (!has(id, "convo")) return "convo";
    if (AM[id].story && !has(id, "story")) return "story";
    if (!has(id, "applied") || !has(id, "taught")) return "apply";
    return "done";
  }
  let changes = null;
  function trackChanges(on) { changes = on ? [] : null; return changes; }
  function mark(id, key, extra) {
    const before = stateIdx(id);
    const e = S.ev[id] || (S.ev[id] = {});
    if (e[key] == null) e[key] = now();
    if (extra) Object.assign(e, extra);
    save();
    const after = stateIdx(id);
    if (after > before && changes) changes.push({ id, from: before, to: after });
    return { before, after };
  }
  function touch(id, g, kind) { (S.rev[id] || (S.rev[id] = [])).push({ t: now(), g, k: kind }); save(); }
  function logEvent(o) { S.events.push(Object.assign({ t: now() }, o)); save(); }

  /* ---------- memory decay ---------- */
  function mem(id, T = now()) {
    const rs = (S.rev[id] || []).filter(r => r.t <= T);
    if (!rs.length) return null;
    let st = 1, last = rs[0].t;
    for (let i = 1; i < rs.length; i++) {
      const r = rs[i], R = Math.pow(0.9, (r.t - last) / DAY / st);
      if (r.g === 2) st *= 1.6 + 2.2 * (1 - R);
      else if (r.g === 1) st *= 1.15;
      else st = Math.max(0.6, st * 0.4);
      st = Math.min(st, 365); last = r.t;
    }
    return { S: st, R: Math.pow(0.9, (T - last) / DAY / st), last, n: rs.length };
  }
  const forgetP = (id, T) => { const m = mem(id, T); return m ? 1 - m.R : 0; };
  function assetValue(id) {
    const a = AM[id];
    const c = S.conns.filter(x => x.a === id || x.b === id).length;
    const ap = S.apps.some(x => x.assetId === id && x.kind !== "none") ? 0.5 : 0;
    return a.value + Math.min(3, c) * 0.3 + ap;
  }
  function rescueList(T = now(), thr = 0.85) {
    return A.filter(a => stateIdx(a.id, T) >= 0).map(a => ({ id: a.id, m: mem(a.id, T) })).filter(x => x.m && x.m.R < thr)
      .map(x => ({ id: x.id, R: x.m.R, risk: 1 - x.m.R, prio: assetValue(x.id) * (1 - x.m.R) }))
      .sort((a, b) => b.prio - a.prio);
  }

  /* ---------- graph ---------- */
  // With hundreds of ideas this is called very often, so the list is cached and the
  // neighbours of each idea are indexed. The cache is rebuilt when a connection is added.
  let edgeCache = null, nbCache = null, edgeKey = "";
  function edges() {
    const key = MV.LINKS.length + ":" + S.conns.length + ":" + (S.conns.length ? S.conns[S.conns.length - 1].id : "");
    if (edgeCache && edgeKey === key) return edgeCache;
    const out = MV.LINKS.map(([a, b, note]) => ({ a, b, note, src: "seed" }));
    S.conns.forEach(c => out.push({ a: c.a, b: c.b, note: c.note, src: "user", t: c.t }));
    nbCache = new Map();
    out.forEach(e => { (nbCache.get(e.a) || nbCache.set(e.a, []).get(e.a)).push({ id: e.b, note: e.note, src: e.src }); (nbCache.get(e.b) || nbCache.set(e.b, []).get(e.b)).push({ id: e.a, note: e.note, src: e.src }); });
    edgeCache = out; edgeKey = key; return out;
  }
  function neighbors(id) { edges(); return nbCache.get(id) || []; }
  function bridgeFor(id) {
    const known = x => stateIdx(x) >= 1 && x !== id;
    const nb = neighbors(id).filter(n => known(n.id)).sort((p, q) => stateIdx(q.id) - stateIdx(p.id));
    if (nb.length) return { other: nb[0].id, note: nb[0].note, kind: "link" };
    const a = AM[id];
    for (const mid of a.models) {
      const o = A.find(x => x.id !== id && known(x.id) && x.models.includes(mid));
      if (o) return { other: o.id, note: `Both are examples of “${MM[mid].name}”: ${MM[mid].line}`, kind: "model", model: mid };
    }
    return null;
  }
  function graph() {
    const adj = new Map(); const add = (a, b) => { (adj.get(a) || adj.set(a, new Set()).get(a)).add(b); (adj.get(b) || adj.set(b, new Set()).get(b)).add(a); };
    edges().forEach(e => add("a:" + e.a, "a:" + e.b));
    A.forEach(a => a.models.forEach(m => add("a:" + a.id, "m:" + m)));
    return adj;
  }
  function pathBetween(x, y) {
    const adj = graph(), s = x.includes(":") ? x : "a:" + x, t = y.includes(":") ? y : "a:" + y;
    if (s === t) return [s];
    const prev = new Map([[s, null]]), q = [s];
    while (q.length) {
      const u = q.shift();
      if (u === t) break;
      for (const v of adj.get(u) || []) if (!prev.has(v)) { prev.set(v, u); q.push(v); }
    }
    if (!prev.has(t)) return null;
    const p = []; for (let u = t; u; u = prev.get(u)) p.unshift(u); return p;
  }
  const nodeLabel = k => k.startsWith("a:") ? AM[k.slice(2)].title : MM[k.slice(2)].name;

  /* ---------- gaps ---------- */
  function downstream(id, seen = new Set()) {
    A.forEach(a => { if ((a.requires || []).includes(id) && !seen.has(a.id)) { seen.add(a.id); downstream(a.id, seen); } });
    return seen;
  }
  function gaps() {
    const out = [];
    A.forEach(u => {
      if (stateIdx(u.id) >= 1) return;
      const down = [...downstream(u.id)].filter(d => stateIdx(d) >= 1);
      const linked = neighbors(u.id).filter(n => stateIdx(n.id) >= 1).map(n => n.id);
      const score = down.length * 2 + linked.length * 0.7 + u.value * 0.3;
      if (down.length || linked.length >= 2) out.push({ id: u.id, down, linked, score });
    });
    return out.sort((a, b) => b.score - a.score);
  }

  /* ---------- recommendations + serendipity ---------- */
  function domainWeights() {
    const w = {}; let tot = 0;
    A.forEach(a => { const i = stateIdx(a.id); if (i >= 0) { w[a.domain] = (w[a.domain] || 0) + i + 1; tot += i + 1; } });
    return { w, tot, top: Object.entries(w).sort((a, b) => b[1] - a[1]).map(x => x[0]) };
  }
  function bridgeScore(id) {
    let s = 0;
    neighbors(id).forEach(n => { if (stateIdx(n.id) >= 0) s += 0.8; });
    AM[id].models.forEach(m => A.forEach(o => { if (o.id !== id && stateIdx(o.id) >= 0 && o.models.includes(m)) s += 0.15; }));
    return s;
  }
  function recommend(n = 3, o = {}) {
    const r = dayRng(), dw = domainWeights(), top2 = dw.top.slice(0, 2), gs = gaps(), gapIds = new Set(gs.map(g => g.id));
    const unseen = A.filter(a => stateIdx(a.id) < 0 && (!o.filter || o.filter(a)));
    const unmetPrereq = a => (a.requires || []).some(q => stateIdx(q) < 0);
    const bsMemo = new Map(), bs = id => { if (!bsMemo.has(id)) bsMemo.set(id, bridgeScore(id)); return bsMemo.get(id); };
    const scored = unseen.map(a => {
      let sc = a.value + (a.region || a.pin ? 1.5 : 0) + (a.now ? 1 : 0) + bs(a.id) + (dw.tot ? (dw.w[a.domain] || 0) / dw.tot * 2 : 0) + r() * 0.6;
      if (gapIds.has(a.id)) sc += 3;
      if (unmetPrereq(a) && !gapIds.has(a.id)) sc -= 2;
      return { a, sc };
    }).sort((x, y) => y.sc - x.sc);
    let nSur = o.surprise ? n : (n >= 5 ? Math.max(1, Math.round(n * 0.15)) : (r() < 0.18 ? 1 : 0));
    if (o.noSurprise) nSur = 0;
    const sur = scored.filter(x => !top2.includes(x.a.domain) && bs(x.a.id) > 0 && !unmetPrereq(x.a))
      .sort((x, y) => (bs(y.a.id) + r() * 0.4) - (bs(x.a.id) + r() * 0.4)).slice(0, nSur);
    const surIds = new Set(sur.map(x => x.a.id));
    const main = scored.filter(x => !surIds.has(x.a.id) && (!unmetPrereq(x.a) || gapIds.has(x.a.id))).slice(0, Math.max(0, n - sur.length));
    const res = main.map(x => ({ id: x.a.id, gap: gapIds.has(x.a.id), surprise: false, why: gapIds.has(x.a.id) ? "Fills a gap in what you know" : (bs(x.a.id) > 0.7 ? "Connects to what you already know" : "A good idea to learn next") }));
    sur.forEach((x, i) => res.splice(Math.min(res.length, 1 + i * 2), 0, { id: x.a.id, gap: false, surprise: true, why: "A surprise from another field" + (dw.top[0] ? ": " + MV.DOMAINS[x.a.domain] + ". You mostly learn " + MV.DOMAINS[dw.top[0]] + "." : "") }));
    return res.slice(0, n);
  }
  function surpriseShare(days = 30) {
    const ev = S.events.filter(e => e.k === "learn" && e.t > now() - days * DAY);
    return ev.length ? ev.filter(e => e.surprise).length / ev.length : 0;
  }

  /* ---------- session builder ---------- */
  const EST = { learn: 2, recognize: 0.5, recall: 0.7, rescue: 0.7, connect: 1.8, explain: 2.5, explain10: 2, story: 3.5, convo: 2, apply: 0.4, challenge: 2, mission: 1 };
  function progressPool() {
    return A.filter(a => { const i = stateIdx(a.id); return i >= 0 && i < 8 && nextNeed(a.id) !== "done"; })
      .map(a => ({ id: a.id, need: nextNeed(a.id), p: assetValue(a.id) + stateIdx(a.id) * 0.3 }))
      .sort((x, y) => y.p - x.p);
  }
  function buildSession({ minutes = 10, intent = "balanced" } = {}) {
    let budget = minutes; const steps = []; const used = new Set(); const title = {
      balanced: `${minutes}-minute session`, surprise: "Something surprising", storytelling: "Storytelling practice", general: "General knowledge", dinner: "Get ready for a dinner conversation",
      challenge: "Test your thinking", forgetting: "Rescue what you are forgetting", gap: "Fill the gap"
    }[intent] || "Session";
    const add = (kind, id, label, extra) => { const e = EST[kind]; if (budget - e < -0.6 || (kind !== "mission" && used.has(kind + id))) return false; used.add(kind + id); steps.push(Object.assign({ kind, id, label, est: e }, extra)); budget -= e; return true; };
    const learnPair = rec => { if (budget < 2.2) return false; const ok = add("learn", rec.id, rec.surprise ? "A surprise from another field" : rec.gap ? "Fill a gap" : "Learn something new", { surprise: rec.surprise, gap: rec.gap }); if (ok) add("recognize", rec.id, "Check you understood"); return ok; };
    let applyN = 0;
    const progressStep = p => {
      if (p.need === "apply" && applyN++ >= 1) { used.add("apply" + p.id); return true; }
      const map = { recognize: "recognize", recall: "recall", explain: "explain", connect: "connect", explain10: "explain10", convo: "convo", story: "story", apply: "apply" };
      const labels = { recognize: "Quick check", recall: "Remember it", explain: "Understand it", connect: "Connect it", explain10: "Explain it simply", convo: "Get ready to talk about it", story: "Tell the story", apply: "Did you use this?" };
      return add(map[p.need], p.id, labels[p.need], p.need === "explain10" ? { level: "10yo" } : p.need === "explain" ? { level: "2min" } : {});
    };
    const rescue = rescueList();
    const seenCount = A.filter(a => stateIdx(a.id) >= 0).length;
    const fillWith = (poolFn) => { let guard = 0; while (budget > 0.8 && guard++ < 30) { if (!poolFn()) break; } };

    if (intent === "forgetting") {
      let list = rescue.length ? rescue : A.filter(a => stateIdx(a.id) >= 0).map(a => ({ id: a.id, R: mem(a.id)?.R ?? 1 })).sort((a, b) => a.R - b.R);
      list.forEach(r => add("rescue", r.id, "Rescue this idea", { R: r.R }));
    } else if (intent === "gap") {
      const g = gaps()[0];
      const target = g ? g.id : (recommend(1)[0] || {}).id;
      if (target) {
        add("learn", target, "Fill the gap", { gap: true }); add("recognize", target, "Check you understood");
        add("connect", target, "Make the link"); add("recall", target, "Remember it"); add("explain", target, "Explain the link", { level: "2min" });
      }
    } else if (intent === "surprise") {
      recommend(Math.max(2, Math.ceil(minutes / 4)), { surprise: true }).forEach(r => { if (learnPair(r)) add("connect", r.id, "Which idea you know helps to explain this?"); });
    } else if (intent === "storytelling") {
      const rank = i => i < 0 ? 2 : i >= 7 ? 1 : 0;
      const stories = MV.STORIES.map(s => ({ s, i: stateIdx(s.assetId) })).sort((a, b) => rank(a.i) - rank(b.i) || b.i - a.i);
      for (const { s, i } of stories) { if (i < 0) add("learn", s.assetId, "Learn the story"); if (budget >= 3.5) add("story", s.assetId, "Tell it without looking"); if (budget < 3.5) break; }
    } else if (intent === "general") {
      recommend(Math.ceil(minutes / 3)).forEach(learnPair);
      fillWith(() => { const p = progressPool().find(p => !used.has(p.need + p.id) && ["recognize", "recall"].includes(p.need)); return p ? progressStep(p) : false; });
    } else if (intent === "dinner") {
      const ready = A.filter(a => stateIdx(a.id) >= 1 && a.type !== "vocabulary item").sort((a, b) => (stateIdx(b.id) - stateIdx(a.id)) || (b.value - a.value));
      ready.slice(0, 3).forEach(a => add("convo", a.id, "Get ready to talk about it"));
      const st = MV.STORIES.find(s => stateIdx(s.assetId) >= 0); if (st) add("story", st.assetId, "Practise a story to tell");
      if (!steps.length) recommend(2).forEach(learnPair);
      fillWith(() => { const a = A.filter(x => stateIdx(x.id) >= 0 && !used.has("convo" + x.id))[0]; return a ? add("convo", a.id, "Get ready to talk about it") : false; });
    } else if (intent === "challenge") {
      const pool = A.filter(a => stateIdx(a.id) >= 1).sort((a, b) => b.value - a.value);
      shuffle(pool, dayRng()).slice(0, Math.max(1, Math.ceil(minutes / 4.5))).forEach(a => { add("explain", a.id, "Explain how it works", { level: "2min" }); add("challenge", a.id, "Test the idea", { model: shuffle(a.models.length ? a.models : ["inversion"], dayRng())[0] }); });
      if (!steps.length) recommend(2).forEach(learnPair);
    } else {
      // balanced: ~25% rescue, ~30% discovery, rest progress
      const rb = minutes * 0.25; rescue.slice(0, 6).forEach(r => { if (rb - (minutes - budget) > 0.5) add("rescue", r.id, "Rescue this idea", { R: r.R }); });
      const recs = recommend(Math.max(1, Math.round(minutes / 4)));
      let learned = 0; const lb = minutes * 0.32;
      recs.forEach(r => { if (learned < lb && learnPair(r)) learned += 2.5; });
      if (seenCount === 0 && !steps.length) recommend(2).forEach(learnPair);
      fillWith(() => { const p = progressPool().find(p => !used.has(p.need + p.id) && !used.has("learn" + p.id)); return p ? progressStep(p) && (used.add(p.need + p.id), true) : false; });
      if (budget > 2.2) recommend(2).forEach(learnPair);
    }
    if (!steps.length) { const r = recommend(1)[0]; if (r) learnPair(r); }
    const t = steps.reduce((s, x) => s + x.est, 0);
    return { title, intent, minutes, steps, est: Math.round(t * 10) / 10 };
  }

  /* ---------- metrics / portfolio ---------- */
  const ids = () => A.map(a => a.id);
  const D = Object.keys(MV.DOMAINS);
  function acquired(mid, T = now()) {
    let pts = 0, distinct = 0;
    A.forEach(a => {
      if (!a.models.includes(mid)) return;
      const i = stateIdx(a.id, T);
      if (i < 0) return;
      pts += 0.5; if (i >= 3) { pts += 1; distinct++; }
    });
    let tagged = 0;
    Object.entries(S.mlinks).forEach(([aid, m]) => { if (m[mid] != null && m[mid] <= T) { pts += 1; tagged++; } });
    S.apps.forEach(x => { if (x.model === mid && x.t <= T && x.kind !== "none") pts += 1.5; });
    return { pts, level: pts >= 6 && (distinct + tagged) >= 2 ? 3 : pts >= 2 ? 2 : pts > 0 ? 1 : 0 };
  }
  function bestBy(kind, T) {
    const m = {};
    S.attempts.filter(a => a.t <= T && (Array.isArray(kind) ? kind.includes(a.kind) : a.kind === kind)).forEach(a => { m[a.id] = Math.max(m[a.id] || 0, a.overall); });
    return m;
  }
  function counts(T = now()) {
    const seen = A.filter(a => stateIdx(a.id, T) >= 0);
    const retained = seen.filter(a => stateIdx(a.id, T) >= 2 && (mem(a.id, T)?.R ?? 0) >= 0.7);
    const used = new Set(S.apps.filter(x => x.t <= T && x.kind !== "none").map(x => x.assetId));
    const asked = new Set(S.apps.filter(x => x.t <= T).map(x => x.assetId));
    const conv = new Set(S.apps.filter(x => x.t <= T && (x.kind === "mention" || x.kind === "taught")).map(x => x.assetId));
    const cs = S.conns.filter(c => c.t <= T);
    return {
      assets: seen.length, retained: retained.length, mastered: seen.filter(a => stateIdx(a.id, T) === 8).length,
      stories: MV.STORIES.filter(s => stateIdx(s.assetId, T) >= 7).length,
      models: MV.MODELS.filter(m => acquired(m.id, T).level === 3).length,
      conns: cs.length, crossConns: cs.filter(c => AM[c.a].domain !== AM[c.b].domain).length,
      vocab: seen.filter(a => a.type === "vocabulary item" && stateIdx(a.id, T) >= 2).length,
      convoReady: seen.filter(a => stateIdx(a.id, T) >= 6).length,
      apps: S.apps.filter(x => x.t <= T && x.kind !== "none").length, used: used.size, asked: asked.size, conv: conv.size,
      appRate: asked.size ? used.size / asked.size : 0,
      understood: seen.filter(a => stateIdx(a.id, T) >= 3).length
    };
  }
  function metricsAt(T = now()) {
    const c = counts(T), seen = A.filter(a => stateIdx(a.id, T) >= 0), cl = x => Math.max(0, Math.min(100, x));
    const doms = new Set(seen.filter(a => stateIdx(a.id, T) >= 1).map(a => a.domain));
    const breadth = cl(doms.size / D.length * 60 + seen.length / A.length * 40);
    const depth = seen.length ? cl(seen.reduce((s, a) => s + stateIdx(a.id, T), 0) / seen.length / 8 * 100) : 0;
    const rem = seen.filter(a => stateIdx(a.id, T) >= 1);
    const retention = rem.length ? cl(rem.reduce((s, a) => s + (mem(a.id, T)?.R ?? 0), 0) / rem.length * 100) : 0;
    let rs = 0, rn = 0;
    Object.values(S.rev).forEach(list => list.forEach(r => { if (r.t <= T && r.t > T - 30 * DAY && (r.k === "recall" || r.k === "rescue")) { rn++; rs += r.g === 2 ? 1 : r.g === 1 ? 0.5 : 0; } }));
    const recall = rn ? cl(rs / rn * 100) : 0;
    const models = cl(c.models / MV.MODELS.length * 100);
    const connections = cl(c.assets ? (c.conns + Object.keys(S.mlinks).length * 0.5) / Math.max(1, c.assets) * 100 : 0);
    const sb = Object.values(bestBy("story", T)), storyAvg = sb.length ? sb.reduce((a, b) => a + b, 0) / sb.length : 0;
    const storytelling = cl(storyAvg * (0.5 + 0.5 * Math.min(1, sb.length / 3)));
    const eb = Object.values(bestBy(["explain", "convo"], T)), exAvg = eb.length ? eb.reduce((a, b) => a + b, 0) / eb.length : 0;
    const communication = cl(exAvg * (0.5 + 0.5 * Math.min(1, eb.length / 4)));
    const application = cl(c.understood ? c.used / Math.max(1, c.understood) * 100 : 0);
    let ent = 0; const dc = {}; seen.forEach(a => dc[a.domain] = (dc[a.domain] || 0) + 1);
    Object.values(dc).forEach(n => { const p = n / seen.length; ent -= p * Math.log(p); });
    const ls = S.events.filter(e => e.k === "learn" && e.t <= T), sur = ls.length ? ls.filter(e => e.surprise).length / ls.length : 0;
    const curiosity = cl((seen.length > 1 ? ent / Math.log(D.length) : 0) * 60 + Math.min(1, sur / 0.2) * 40);
    return { breadth, depth, retention, recall, models, connections, storytelling, communication, application, curiosity, c };
  }
  const METRIC_LABELS = {
    breadth: "Width of knowledge", depth: "Depth of knowledge", retention: "Memory", recall: "Recall without help", models: "Mental models", connections: "Connections",
    storytelling: "Storytelling", communication: "Clear explaining", application: "Use in real life", curiosity: "Curiosity"
  };
  const METRIC_HELP = {
    breadth: "How many fields you have started, and how much of the library you have seen.",
    depth: "How far up the mastery ladder your ideas are, on average.",
    retention: "How likely you are to remember what you learned, right now.",
    recall: "How often you remembered ideas without help in the last 30 days.",
    models: "How many of the mental models you have really learned.",
    connections: "How many connections you have made for each idea you know.",
    storytelling: "Your best scores for the stories you have practised telling.",
    communication: "How clear your explanations and conversation replies are.",
    application: "How much of what you understand you have used in real life.",
    curiosity: "How many different fields you learn from, and how often you try surprises from other fields."
  };
  function series(weeks = 26) {
    const first = Math.min(...[...Object.values(S.ev).map(e => e.seen).filter(Boolean), now()]);
    const w = Math.max(2, Math.min(weeks, Math.ceil((now() - first) / (7 * DAY)) + 1));
    const pts = [];
    for (let i = w - 1; i >= 0; i--) { const T = now() - i * 7 * DAY; const c = counts(T); pts.push({ T, assets: c.assets, conns: c.conns, models: c.models, used: c.conv + (c.used - c.conv) }); }
    return pts;
  }

  /* ---------- identity ---------- */
  function identity() {
    const out = [], c = counts(), dw = domainWeights();
    if (c.assets < 6) return [{ kind: "start", text: "We can see a pattern after about six ideas. Keep going. The picture of your mind gets clearer as you learn, connect and use ideas." }];
    const topD = dw.top.slice(0, 3).map(d => MV.DOMAINS[d]);
    out.push({ kind: "domains", text: `You are getting strong in ${listJoin(topD)}.` });
    const mp = MV.MODELS.map(m => ({ m, p: acquired(m.id).pts })).filter(x => x.p > 0).sort((a, b) => b.p - a.p).slice(0, 3);
    if (mp.length >= 2) {
      const mids = mp.map(x => x.m.id);
      const style = mids.every(i => SYSTEMS.includes(i)) ? "thinking in systems" : mids.every(i => EPISTEMIC.includes(i)) ? "careful thinking about evidence" : mids.every(i => STRATEGIC.includes(i)) ? "thinking about strategy" : null;
      out.push({ kind: "models", text: style ? `More and more, you connect ideas through ${style}. You often use ${listJoin(mp.map(x => x.m.name.toLowerCase()))}.` : `Your favourite thinking tools are ${listJoin(mp.map(x => x.m.name.toLowerCase()))}.` });
    }
    const present = D.filter(d => A.some(a => a.domain === d));
    const scores = present.map(d => ({ d, v: A.filter(a => a.domain === d).reduce((s, a) => s + Math.max(0, stateIdx(a.id) + 1), 0) })).sort((a, b) => a.v - b.v);
    const weak = scores[0], strong = dw.top[0];
    if (weak && strong && weak.d !== strong) {
      const link = MV.LINKS.find(([a, b]) => (AM[a].domain === weak.d && AM[b].domain === strong) || (AM[b].domain === weak.d && AM[a].domain === strong));
      out.push({ kind: "weak", text: `Your weakest area is ${MV.DOMAINS[weak.d].toLowerCase()}${link ? `, but it can make your ${MV.DOMAINS[strong].toLowerCase()} stronger: “${link[2]}”` : ". Learning more here will help everything else you know."}` });
    }
    const sb = Object.values(bestBy("story", now()));
    if (sb.length && Math.max(...sb) >= 70) out.push({ kind: "story", text: "You tell stories well. They are in good order, clear, and start with a strong hook." });
    else if (sb.length) out.push({ kind: "story", text: "You know your stories. Next, work on how you tell them: start with the surprise and cut the background." });
    if (c.asked >= 3) out.push({ kind: "apply", text: c.appRate >= 0.5 ? "You do not only collect ideas. You use them." : "You collect ideas well. The next step is to use them in real conversations and decisions." });
    if (surpriseShare(90) >= 0.1) out.push({ kind: "curious", text: "You look for surprises in many different fields. This is how people with wide knowledge learn." });
    return out;
  }
  const listJoin = a => a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];

  /* ---------- connections, applications ---------- */
  function addConnection(a, b, note, src = "user") {
    if (S.conns.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a))) return false;
    S.conns.push({ id: uid(), a, b, note, t: now(), src }); mark(a, "connected"); mark(b, "connected"); save(); return true;
  }
  function tagModel(assetId, modelId) { (S.mlinks[assetId] || (S.mlinks[assetId] = {}))[modelId] = now(); save(); }
  function addApp(assetId, kind, note, model) {
    S.apps.push({ id: uid(), assetId, kind, note: note || "", t: now(), model: model || null });
    if (kind !== "none") mark(assetId, "applied");
    if (kind === "taught") mark(assetId, "taught");
    if (kind === "mention") mark(assetId, "convo");
    if (kind === "connected") mark(assetId, "connected");
    save();
  }
  function promptWild() {
    const c = A.filter(a => stateIdx(a.id) >= 2 && now() - (S.ev[a.id].recalled || 0) > 2 * DAY && !S.apps.some(x => x.assetId === a.id && now() - x.t < 14 * DAY))
      .sort((a, b) => b.value - a.value);
    return c[0] ? c[0].id : null;
  }

  /* ---------- missions ---------- */
  function activeMission() { const m = S.missions[S.missions.length - 1]; return m && !m.report ? m : null; }
  function missionDue() { const m = S.missions[S.missions.length - 1]; return !m || (m.report && now() - m.t > 6 * DAY); }
  function newMission() {
    const done = new Set(S.missions.map(m => m.mid));
    const relevant = MV.MISSIONS.filter(m => !done.has(m.id) && (!m.model || A.some(a => stateIdx(a.id) >= 1 && a.models.includes(m.model))));
    const pool = relevant.length ? relevant : MV.MISSIONS.filter(m => !done.has(m.id));
    const pick = (pool.length ? pool : MV.MISSIONS)[Math.floor(Math.random() * (pool.length ? pool.length : MV.MISSIONS.length))];
    const m = { id: uid(), mid: pick.id, text: pick.text, model: pick.model, t: now() };
    S.missions.push(m); save(); return m;
  }
  function reportMission(id, report, assetId) {
    const m = S.missions.find(x => x.id === id); if (!m) return;
    m.report = report; m.rt = now(); m.assetId = assetId || null; save();
    if (assetId) addApp(assetId, "noticed", report, m.model);
    else if (m.model) { S.apps.push({ id: uid(), assetId: (A.find(a => a.models.includes(m.model) && stateIdx(a.id) >= 0) || {}).id || A[0].id, kind: "noticed", note: report, t: now(), model: m.model }); save(); }
  }

  /* ---------- demo history ---------- */
  function seedDemo() {
    const keep = S.prefs, asked = S.requests; S = blank(); S.prefs = keep; S.requests = asked || []; S.demo = true;
    const r = rng(42), t0 = now() - 190 * DAY;
    const skip = new Set(["sarajevo-1914", "semmelweis", "v-sanguine", "flying-buttress"]);
    const order = ["wwii-origins", "cold-war-mad", "nato-article5", "cuban-submarine", "comparative-advantage", "container-shipping", "roman-roads", "amazon-flywheel", "hanoi-rats", "wason-246", "anchoring", "loss-aversion", "buffett-compounding", "margin-of-safety", "weimar-hyperinflation", "wald-bombers", "east-india-company", "hormuz", "russia-ports", "sun-tzu", "ooda-loop", "map-territory", "stoic-control", "dunbar", "v-laconic", "v-equanimity", "v-perspicacious", "thermopylae", "red-queen", "veil-ignorance", "pantheon-dome", "v-obsequious", "v-ephemeral"];
    const depthPlan = { "hanoi-rats": 8, "cuban-submarine": 7, "wwii-origins": 5, "cold-war-mad": 6, "wald-bombers": 7, "container-shipping": 7, "roman-roads": 6, "wason-246": 5, "comparative-advantage": 4, "amazon-flywheel": 5, "nato-article5": 3, "buffett-compounding": 4, "anchoring": 3, "loss-aversion": 3, "margin-of-safety": 4, "weimar-hyperinflation": 3 };
    const keys = ["seen", "recognized", "recalled", "explained", "connected", "expressed", "convo", "story", "applied"];
    order.forEach((id, n) => {
      if (skip.has(id)) return;
      const a = AM[id], base = t0 + n * 5.1 * DAY + r() * 2 * DAY;
      const depth = depthPlan[id] ?? Math.floor(r() * 3);
      const e = S.ev[id] = {};
      const target = Math.min(8, depth);
      const ladder = ["seen", "recognized", "recalled", "explained", "connected", "expressed", "convo"];
      let t = base;
      ladder.forEach((k, i) => { if (i <= target) { e[k] = t; t += (0.5 + r() * 6) * DAY; } });
      if (a.story && target >= 7) e.story = t;
      if (target >= 7 || (target >= 6 && !a.story && r() > 0.5)) { e.applied = t + DAY; if (target >= 8) e.taught = t + 2 * DAY; }
      if (target >= 8) { e.story = e.story || t; e.applied = t + DAY; e.taught = t + 2 * DAY; }
      // reviews
      const rv = S.rev[id] = [{ t: base, g: 1, k: "seen" }];
      let tt = base, st = 1; const reps = 40;
      for (let i = 0; i < reps; i++) {
        tt += st * (0.6 + r() * 1.1) * DAY; if (tt > now() - 0.1 * DAY) break;
        const g = r() < 0.12 ? 0 : r() < 0.35 ? 1 : 2; rv.push({ t: tt, g, k: i % 3 === 2 ? "rescue" : "recall" });
        st = g === 2 ? st * 2.4 : g === 1 ? st * 1.15 : Math.max(0.6, st * 0.4);
      }
      S.events.push({ t: base, k: "learn", id, surprise: r() < 0.16 });
    });
    // lapse: let a few high-value items go stale
    ["roman-roads", "nato-article5", "loss-aversion", "weimar-hyperinflation", "margin-of-safety"].forEach(id => { const rv = S.rev[id]; if (rv && rv.length) { const last = rv[rv.length - 1]; last.t = Math.min(last.t, now() - (9 + r() * 14) * DAY); } });
    // connections (a subset of seed links the user "discovered")
    MV.LINKS.forEach(([a, b, note], i) => { if (stateIdx(a) >= 2 && stateIdx(b) >= 2 && (r() < 0.9)) S.conns.push({ id: uid(), a, b, note, t: Math.max(S.ev[a].connected || t0, S.ev[b].connected || t0) || t0, src: "user" }); });
    ["hanoi-rats", "wald-bombers", "cuban-submarine", "container-shipping", "wason-246", "roman-roads"].forEach((id, i) => { const m = AM[id].models; m.forEach(mid => { (S.mlinks[id] || (S.mlinks[id] = {}))[mid] = t0 + (30 + i * 15 + r() * 8) * DAY; }); });
    // applications
    [["hanoi-rats", "mention", 60], ["wason-246", "noticed", 80], ["cuban-submarine", "taught", 95], ["wald-bombers", "mention", 110], ["container-shipping", "decision", 120], ["comparative-advantage", "connected", 130], ["roman-roads", "none", 140], ["anchoring", "none", 150], ["amazon-flywheel", "noticed", 150], ["cold-war-mad", "mention", 160], ["buffett-compounding", "none", 165]].forEach(([id, k, d]) => {
      if (!S.ev[id]) return; S.apps.push({ id: uid(), assetId: id, kind: k, note: "", t: t0 + d * DAY, model: AM[id].models[0] || null });
      if (k !== "none") { S.ev[id].applied = S.ev[id].applied || t0 + d * DAY; }
      if (k === "mention") S.ev[id].convo = S.ev[id].convo || t0 + d * DAY;
    });
    // attempts
    [["story", "hanoi", [48, 61, 74, 82]], ["story", "arkhipov", [52, 66, 78]], ["story", "wald", [58, 71]], ["story", "container", [63, 77]], ["explain", "cold-war-mad", [55, 68]], ["explain", "hanoi-rats", [60, 72, 85]], ["explain", "wason-246", [62, 74]], ["explain", "cuban-submarine", [70]], ["convo", "wald-bombers", [66, 80]], ["explain", "roman-roads", [58, 70]]].forEach(([kind, id, scs], i) => scs.forEach((s, j) => S.attempts.push({ id: uid(), t: t0 + (60 + i * 8 + j * 9) * DAY, kind, ref: id, id, overall: s, level: kind === "explain" ? ["30s", "2min", "10yo"][j % 3] : kind === "story" ? "90s" : null, scores: {}, text: "", secs: null })));
    S.missions.push({ id: uid(), mid: "m-confirm", text: MV.MISSIONS[0].text, model: "confirmation-bias", t: t0 + 100 * DAY, report: "Noticed my coworker only quoted articles that backed his plan. I asked what evidence would change his mind.", rt: t0 + 102 * DAY });
    save();
  }

  function exportData() { return JSON.stringify(S, null, 2); }
  function importData(txt) { const o = JSON.parse(txt); if (!o || o.v !== 1) throw new Error("Not a MindVault export"); S = Object.assign(blank(), o); save(); }
  function reset() { S = blank(); S.resetAt = now(); save(); }

  /* ---------- sync: merge another device's copy into this one ---------- */
  // Nothing is lost: evidence keeps its earliest time, lists are joined without repeats.
  // Anything older than the latest "reset everything" is dropped on every device.
  function mergeState(R) {
    const L = S, out = blank(), cut = Math.max(L.resetAt || 0, R.resetAt || 0), live = t => (t || 0) > cut;
    out.created = Math.min(L.created || now(), R.created || now()); out.resetAt = cut;
    for (const src of [L, R]) {
      for (const id in src.ev || {}) for (const k in src.ev[id]) { const t = src.ev[id][k]; if (typeof t !== "number" || !live(t)) continue; const e = out.ev[id] || (out.ev[id] = {}); e[k] = e[k] == null ? t : Math.min(e[k], t); }
      for (const id in src.mlinks || {}) for (const m in src.mlinks[id]) { const t = src.mlinks[id][m]; if (!live(t)) continue; const e = out.mlinks[id] || (out.mlinks[id] = {}); e[m] = e[m] == null ? t : Math.min(e[m], t); }
      for (const d in src.daily || {}) out.daily[d] = Object.assign({}, out.daily[d], src.daily[d]);
    }
    const uni = (key, lists, keep) => { const m = new Map(); lists.forEach(l => (l || []).forEach(x => { if (!x || !live(x.t)) return; const k = key(x), old = m.get(k); m.set(k, old ? (keep ? keep(old, x) : old) : x); })); return [...m.values()].sort((a, b) => a.t - b.t); };
    new Set([...Object.keys(L.rev || {}), ...Object.keys(R.rev || {})]).forEach(id => { const l = uni(r => r.t + "|" + r.k + "|" + r.g, [(L.rev || {})[id], (R.rev || {})[id]]); if (l.length) out.rev[id] = l; });
    out.conns = uni(c => [c.a, c.b].sort().join("|"), [L.conns, R.conns], (a, b) => a.t <= b.t ? a : b).filter(c => AM[c.a] && AM[c.b]);
    out.apps = uni(x => x.id, [L.apps, R.apps]).filter(x => AM[x.assetId]);
    out.attempts = uni(x => x.kind + "|" + x.id + "|" + x.t, [L.attempts, R.attempts]);
    out.missions = uni(x => x.id, [L.missions, R.missions], (a, b) => a.report ? a : b);
    // Topic requests: one per topic; a request removed on any device stays removed.
    out.requests = uni(x => String(x.q).toLowerCase(), [L.requests, R.requests], (a, b) => (a.off || b.off) ? Object.assign({}, a, { off: a.off || b.off }) : a);
    out.events = uni(x => x.t + "|" + x.k + "|" + (x.id || ""), [L.events, R.events]).slice(-4000);
    out.prefs = Object.assign({}, R.prefs, L.prefs); out.demo = false;
    S = out; save();
  }
  // What is uploaded. The Claude API key never leaves this device.
  function syncPayload() { const c = Object.assign({}, S, { prefs: Object.assign({}, S.prefs) }); delete c.prefs.apiKey; return JSON.stringify(c); }

  MV.E = {
    DAY, get S() { return S; }, save, now, uid, rng, shuffle, dayRng,
    asset: id => AM[id], model: id => MM[id], story: id => SM[id], storyOfAsset: id => assetOfStory[id], assets: () => A,
    has, stateIdx, nextNeed, mark, touch, logEvent, trackChanges, mem, forgetP, assetValue, rescueList,
    edges, neighbors, bridgeFor, graph, pathBetween, nodeLabel, gaps, downstream, recommend, surpriseShare, domainWeights,
    buildSession, EST, acquired, counts, metricsAt, METRIC_LABELS, METRIC_HELP, series, identity, listJoin,
    addConnection, tagModel, addApp, promptWild, activeMission, missionDue, newMission, reportMission,
    seedDemo, exportData, importData, reset, bestBy, mergeState, syncPayload
  };
})();
