/* Views. Each takes (root, param) and appends DOM. */
(function () {
  const E = MV.E, U = MV.UI, { h, toast, stateBadge, dom, bar, ladder, nav } = U, DAY = E.DAY;
  const A = () => E.assets(), seen = () => A().filter(a => E.stateIdx(a.id) >= 0);
  const page = (eyebrow, title, sub) => h("header", { class: "pg" }, h("div", { class: "eyebrow" }, eyebrow), h("h1", {}, title), sub ? h("p", { class: "sub" }, sub) : null);
  const tile = (n, lbl, href) => h(href ? "a" : "div", { class: "tile" + (href ? " acard" : ""), href }, h("div", { class: "num" }, n), h("div", { class: "lbl" }, lbl));
  const ago = t => { const d = Math.floor((E.now() - t) / DAY); return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 60 ? d + " days ago" : Math.round(d / 30) + " months ago"; };
  const empty = (msg) => h("div", { class: "card center" }, h("p", { class: "muted" }, msg || "Nothing here yet. Do your first session to get started."), h("a", { class: "btn primary", href: "#/today" }, "Start a session"));
  function stepsFor(id) {
    const need = E.nextNeed(id);
    return ({ learn: [{ kind: "learn", id }, { kind: "recognize", id }], recognize: [{ kind: "recognize", id }], recall: [{ kind: "recall", id }], explain: [{ kind: "explain", id, level: "2min" }], connect: [{ kind: "connect", id }],
      explain10: [{ kind: "explain10", id, level: "10yo" }], convo: [{ kind: "convo", id }], story: [{ kind: "story", id }], apply: [{ kind: "apply", id }], done: [{ kind: "recall", id }] })[need];
  }
  const NEED_LABEL = { learn: "Learn it", recognize: "Check that you know it", recall: "Remember it without help", explain: "Explain how it works", connect: "Connect it to another idea", explain10: "Explain it to a 10-year-old", convo: "Get ready to talk about it", story: "Tell its story", apply: "Use it, then teach it", done: "Mastered. Keep it fresh" };
  function assetCard(a, extra) {
    const i = E.stateIdx(a.id);
    return h("a", { class: "card acard", href: "#/asset/" + a.id }, h("div", { class: "row between small muted" }, h("span", {}, dom(a.domain), a.region ? " · " + MV.REGIONS[a.region] : ""), stateBadge(i)), h("h3", { style: "margin-top:8px" }, a.title), h("p", { class: "small muted", style: "margin:0" }, extra || (a.fact.length > 120 ? a.fact.slice(0, 118) + "…" : a.fact)));
  }

  /* ================= TODAY ================= */
  const pick = { minutes: 10, intent: "balanced" };
  function today(root) {
    const c = E.counts(), fresh = c.assets === 0;
    if (!fresh && E.missionDue() && c.assets >= 3) E.newMission();
    root.append(h("div", { class: "hero" }, h("div", { class: "eyebrow" }, "Knowledge that keeps growing"),
      h("h1", {}, fresh ? "Build a better mind." : `Your ${c.assets} knowledge assets have created ${c.conns} meaningful connections.`),
      h("p", { class: "sub" }, fresh ? "MindVault does not count how much you read. It tracks what you remember, understand, connect, explain and use. Every idea moves up a ladder, step by step, from “I saw this” to “I can teach this”." :
        `${c.retained} remembered · ${c.models} mental models learned · ${c.used} ideas used in real life. One idea + one connection + one application = compounding knowledge.`),
      fresh ? h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: () => MV.Session.start(E.buildSession({ minutes: 5, intent: "balanced" })) }, "Start your first 5 minutes"),
        h("button", { class: "btn", onclick: () => { E.seedDemo(); toast("Sample history of 6 months loaded."); MV.App.render(); } }, "Try it with 6 months of sample history")) : null));

    // session mode
    const plan = h("div");
    const sm = h("div", { class: "card mb" }, h("h2", {}, "What would you like to do today?"));
    const chips1 = h("div", { class: "row mb" }), chips2 = h("div", { class: "row mb" });
    const INT = [["balanced", "Choose the best session for me"], ["surprise", "I want to learn something surprising"], ["storytelling", "I want to get better at telling stories"], ["general", "I want to improve my general knowledge"], ["dinner", "I want to get ready for a dinner conversation"], ["challenge", "I want to test my thinking"], ["forgetting", "I want to revise things I am forgetting"]];
    function draw() {
      chips1.innerHTML = ""; chips2.innerHTML = ""; plan.innerHTML = "";
      [5, 10, 30].forEach(m => chips1.append(h("button", { class: "chip" + (pick.minutes === m ? " on" : ""), onclick: () => { pick.minutes = m; draw(); } }, `I have ${m} minutes`)));
      INT.forEach(([k, l]) => chips2.append(h("button", { class: "chip" + (pick.intent === k ? " on" : ""), onclick: () => { pick.intent = k; draw(); } }, l)));
      const p = E.buildSession(pick);
      plan.append(h("div", { class: "callout" }, h("div", { class: "row between" }, h("b", {}, `${p.title}: ${p.steps.length} steps, about ${Math.max(1, Math.round(p.est))} min`), h("button", { class: "btn primary", disabled: !p.steps.length, onclick: () => MV.Session.start(p) }, "Start →")),
        h("ol", { class: "small", style: "margin:.6rem 0 0;padding-left:1.2rem" }, p.steps.map(s => h("li", {}, h("span", { class: "muted" }, s.label + ": "), E.asset(s.id).title, s.surprise ? h("span", { class: "badge sur", style: "margin-left:6px" }, "surprise") : null, s.gap ? h("span", { class: "badge gap", style: "margin-left:6px" }, "gap") : null)))));
    }
    draw(); sm.append(chips1, chips2, plan); root.append(sm);

    const g = h("div", { class: "grid g2" }); root.append(g);
    // rescue
    const rl = E.rescueList();
    if (rl.length) g.append(h("div", { class: "card" }, h("div", { class: "eyebrow", style: "color:var(--coral)" }, "Rescue this idea"), h("h3", {}, `You are about to forget ${rl.length} idea${rl.length > 1 ? "s" : ""}`),
      h("p", { class: "small muted" }, "The most important ideas you are most likely to forget come first. One minute of practice now will help you keep them."),
      h("ul", { class: "list small" }, rl.slice(0, 4).map(r => h("li", { class: "row between" }, h("a", { href: "#/asset/" + r.id }, E.asset(r.id).title), h("span", { class: "badge risk" }, Math.round(r.risk * 100) + "% chance of forgetting")))),
      h("button", { class: "btn mt", onclick: () => MV.Session.startSteps(rl.slice(0, 6).map(r => ({ kind: "rescue", id: r.id, R: r.R })), "Rescue session") }, "Rescue them now")));
    // bridge
    const rec = E.recommend(4), withBridge = rec.map(r => ({ r, b: E.bridgeFor(r.id) })).find(x => x.b);
    if (withBridge) { const a = E.asset(withBridge.r.id), o = E.asset(withBridge.b.other);
      g.append(h("div", { class: "card hl" }, h("div", { class: "eyebrow" }, "You already know something that helps to explain this"), h("h3", {}, `${o.title} → ${a.title}`), h("p", { class: "small" }, withBridge.b.note),
        h("button", { class: "btn mt", onclick: () => MV.Session.startSteps([{ kind: "learn", id: a.id }, { kind: "recognize", id: a.id }, { kind: "connect", id: a.id }], "Follow the link") }, `Learn “${a.title}”`))); }
    // mission
    const m = E.activeMission();
    if (m) g.append(h("div", { class: "card" }, h("div", { class: "eyebrow", style: "color:var(--teal)" }, "This week's mission in real life"), h("p", { class: "lede", style: "font-size:1.1rem" }, m.text), h("a", { class: "btn", href: "#/missions" }, "Tell what happened")));
    // wild
    const w = E.promptWild();
    if (w) { const a = E.asset(w), box = h("div", { class: "card" }, h("div", { class: "eyebrow" }, "Using ideas in real life"), h("h3", {}, `Did you use “${a.title}”?`));
      box.append(h("div", { class: "row" }, MV.Session.WILD.map(([k, l]) => h("button", { class: "chip", onclick: () => { E.addApp(a.id, k, "", a.models[0]); toast(k === "none" ? "No problem. Look for a chance this week." : "Saved. You used this idea in real life."); MV.App.render(); } }, l)))); g.append(box); }
    // gap
    const gp = E.gaps()[0];
    if (gp && !fresh) g.append(h("div", { class: "card" }, h("div", { class: "eyebrow", style: "color:var(--teal)" }, "Fill the gap"), h("h3", {}, E.asset(gp.id).title), h("p", { class: "small muted" }, gapWhy(gp)), h("button", { class: "btn", onclick: () => fillGap(gp.id) }, "Learn it in 8 minutes")));

    if (rec.length) root.append(h("h2", { class: "mt" }, "Good ideas to learn next"), h("div", { class: "grid g3" }, rec.slice(0, 3).map(r => { const a = E.asset(r.id), cd = assetCard(a); cd.prepend(h("div", { class: "tiny mb " + (r.surprise ? "" : "muted"), style: r.surprise ? "color:var(--violet)" : "" }, r.why)); return cd; })));
  }
  const gapWhy = g => { const k = [...g.down, ...g.linked].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4).map(x => E.asset(x).title); return `You know ${E.listJoin(k)}, but you have not learned the idea that ${g.down.length ? "they are built on" : "connects them"}.`; };
  const fillGap = id => MV.Session.startSteps([{ kind: "learn", id, gap: true }, { kind: "recognize", id }, { kind: "connect", id }, { kind: "recall", id }, { kind: "explain", id, level: "2min" }], "Fill the gap");

  /* ================= PORTFOLIO ================= */
  let range = 90;
  function portfolio(root) {
    const c = E.counts(), m = E.metricsAt();
    root.append(page("Your knowledge portfolio", "How your knowledge is growing", "This is not about how much you read. It shows what you know, how your ideas connect, and how you have used them in real life."));
    if (!c.assets) return root.append(empty());
    const sr = E.series(26), col = k => sr.map(p => p[k]);
    root.append(h("div", { class: "cascade mb" },
      h("div", { class: "casc" }, h("div", { class: "num" }, c.assets), h("div", { class: "small" }, "knowledge assets"), U.area(col("assets"), { color: "var(--teal)" })),
      h("div", { class: "casc" }, h("div", { class: "num" }, c.conns), h("div", { class: "small" }, "meaningful connections"), U.area(col("conns"), { color: "var(--gold)" })),
      h("div", { class: "casc" }, h("div", { class: "num" }, c.models), h("div", { class: "small" }, "mental models you can use again"), U.area(col("models"), { color: "var(--violet)" })),
      h("div", { class: "casc" }, h("div", { class: "num" }, c.used), h("div", { class: "small" }, "ideas used in real life"), U.area(col("used"), { color: "var(--coral)" }))));
    root.append(h("div", { class: "card hl mb" },
      h("p", { class: "lede" }, `Your ${c.assets} knowledge assets have created ${c.conns} meaningful connections.`),
      h("p", { class: "lede" }, `Those connections have produced ${c.models} mental model${c.models === 1 ? "" : "s"} you can use again.`),
      h("p", { class: "lede", style: "margin:0" }, `You have successfully used ${c.conv} of these ideas in real conversations.`)));
    root.append(h("div", { class: "grid g4 mb" }, tile(c.assets, "Total knowledge assets", "#/library"), tile(c.retained, "Assets you remember"), tile(c.mastered, "Mastered assets"), tile(c.stories, "Stories mastered", "#/stories"), tile(c.models, "Mental models", "#/models"),
      tile(c.crossConns, "Connections between different fields", "#/graph"), tile(c.vocab, "Vocabulary"), tile(c.convoReady, "Ideas ready for conversation", "#/conversation"), tile(c.apps, "Times used in real life"), tile(E.gaps().length, "Knowledge gaps", "#/gaps")));

    // analytics with range
    const an = h("div", { class: "card mb" }); root.append(an);
    function drawAn() {
      an.innerHTML = ""; const T0 = E.now() - range * DAY, m0 = E.metricsAt(T0);
      an.append(h("div", { class: "row between mb" }, h("h2", { style: "margin:0" }, "Your progress in numbers"), h("div", { class: "row" }, [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]].map(([d, l]) => h("button", { class: "chip" + (range === d ? " on" : ""), onclick: () => { range = d; drawAn(); } }, l)))));
      const N = 12, pts = []; for (let i = N - 1; i >= 0; i--) pts.push(E.counts(E.now() - i * range / (N - 1) * DAY));
      an.append(U.lineChart([{ label: "Assets", color: "var(--teal)", values: pts.map(p => p.assets) }, { label: "Connections", color: "var(--gold)", values: pts.map(p => p.conns) }, { label: "Models", color: "var(--violet)", values: pts.map(p => p.models) }, { label: "Used", color: "var(--coral)", values: pts.map(p => p.used) }]), h("hr"));
      Object.keys(E.METRIC_LABELS).forEach(k => { const d = Math.round(m[k] - m0[k]);
        an.append(h("div", { class: "mrow", title: E.METRIC_HELP[k] }, h("div", { class: "nm" }, E.METRIC_LABELS[k], h("div", { class: "tiny muted" }, E.METRIC_HELP[k])), bar(m[k]), h("div", { class: "num sm", style: "font-size:1.15rem;text-align:right" }, Math.round(m[k])), h("div", { class: "delta " + (d > 0 ? "up" : d < 0 ? "dn" : "muted") }, (d > 0 ? "▲ +" : d < 0 ? "▼ " : "– ") + (d || "0") + ` / ${range}d`))); });
    }
    drawAn();

    const dist = MV.STATES.map((s, i) => seen().filter(a => E.stateIdx(a.id) === i).length), mx = Math.max(1, ...dist);
    root.append(h("div", { class: "grid g2" },
      h("div", { class: "card" }, h("h3", {}, "Where your knowledge assets are on the ladder"), h("p", { class: "small muted" }, "The goal is to move each one up the ladder. Do not leave it at “I saw this”."),
        MV.STATES.map((s, i) => h("div", { class: "scorebars" }, h("div", { class: "sr" }, h("span", {}, s.label), bar(dist[i] / mx * 100, U.sc(i)), h("span", { class: "tiny" }, dist[i]))))),
      h("div", { class: "col" },
        h("div", { class: "card" }, h("h3", {}, "How often you use ideas in real life"), h("div", { class: "row" }, h("div", { class: "num" }, U.pct(c.appRate * 100)), h("div", { class: "small muted" }, c.asked ? `We asked you about ${c.asked} ideas. You used ${c.used} of them in real life.` : "Answer a few “Did you use this?” questions to start measuring this.")), bar(c.appRate * 100, "var(--coral)")),
        h("div", { class: "card" }, h("h3", {}, "The kind of thinker you are becoming"), E.identity().map(x => h("p", { class: "small" }, x.text)), h("a", { class: "btn sm", href: "#/ask" }, "Ask your mind more")))));
  }

  /* ================= GRAPH ================= */
  const gopt = { unseen: true, models: false, from: "roman-roads", to: "m:network-effects" };
  function graphView(root) {
    root.append(page("Your knowledge graph", "Ideas that explain each other", "Solid gold lines are connections you made yourself. Light dotted lines are connections you have not found yet. Empty circles are ideas you have not seen yet."));
    // path finder
    const pf = h("div", { class: "card mb" }), out = h("div", { class: "path mt" });
    const optList = sel => [h("optgroup", { label: "Ideas" }, A().map(a => h("option", { value: a.id, selected: sel === a.id }, a.title))), h("optgroup", { label: "Mental models" }, MV.MODELS.map(m => h("option", { value: "m:" + m.id, selected: sel === "m:" + m.id }, m.name)))];
    const s1 = h("select", { "aria-label": "From", style: "max-width:260px" }, optList(gopt.from)), s2 = h("select", { "aria-label": "To", style: "max-width:260px" }, optList(gopt.to));
    const find = () => { gopt.from = s1.value; gopt.to = s2.value; out.innerHTML = ""; const p = E.pathBetween(s1.value, s2.value);
      if (!p) return out.append(h("span", { class: "muted" }, "There is no link between these two yet. This is a new area to explore."));
      p.forEach((k, i) => { if (i) out.append(h("span", { class: "arr" }, "→")); out.append(h("span", { class: "n" + (k.startsWith("m:") ? " m" : "") }, E.nodeLabel(k))); }); };
    s1.onchange = s2.onchange = find;
    pf.append(h("h3", {}, "Find the link between two ideas"), h("div", { class: "row" }, s1, h("span", { class: "gold" }, "→"), s2), out); find(); root.append(pf);
    const holder = h("div");
    const tog = h("div", { class: "row mb" }, h("button", { class: "chip" + (gopt.unseen ? " on" : ""), onclick: e => { gopt.unseen = !gopt.unseen; e.target.classList.toggle("on"); draw(); } }, "Show ideas not seen yet"), h("button", { class: "chip" + (gopt.models ? " on" : ""), onclick: e => { gopt.models = !gopt.models; e.target.classList.toggle("on"); draw(); } }, "Show mental models"),
      h("span", { class: "row small muted", style: "margin-left:auto" }, Object.keys(MV.DOMAINS).map(d => h("span", { class: "row", style: "gap:4px" }, h("span", { class: "dotc", style: `background:${MV.DOMAIN_COLORS[d]}` }), MV.DOMAINS[d]))));
    root.append(tog, holder);
    function draw() {
      holder.innerHTML = ""; const W = 1000, H = 620, s = U.s;
      const nodes = [], idx = {}; const doms = Object.keys(MV.DOMAINS);
      A().forEach(a => { const st = E.stateIdx(a.id); if (st < 0 && !gopt.unseen) return; const ang = doms.indexOf(a.domain) / doms.length * Math.PI * 2, r = E.rng(a.id.length * 131 + a.title.length)(); idx["a:" + a.id] = nodes.length; nodes.push({ k: "a:" + a.id, a, st, x: W / 2 + Math.cos(ang) * (200 + r * 60), y: H / 2 + Math.sin(ang) * (170 + r * 60) }); });
      if (gopt.models) MV.MODELS.forEach((m, i) => { idx["m:" + m.id] = nodes.length; nodes.push({ k: "m:" + m.id, m, x: W / 2 + Math.cos(i) * 60, y: H / 2 + Math.sin(i) * 60 }); });
      const edges = [], seenE = new Set();
      E.edges().slice().reverse().forEach(e => { const i = idx["a:" + e.a], j = idx["a:" + e.b], key = [e.a, e.b].sort().join("|"); if (i == null || j == null || seenE.has(key)) return; seenE.add(key); edges.push({ i, j, user: e.src === "user" }); });
      if (gopt.models) A().forEach(a => a.models.forEach(m => { const i = idx["a:" + a.id], j = idx["m:" + m]; if (i != null && j != null) edges.push({ i, j, model: true }); }));
      for (let it = 0; it < 260; it++) { const k = 1 - it / 260;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 1; const f = 15000 / d2, d = Math.sqrt(d2); dx /= d; dy /= d; a.x += dx * f * k; a.y += dy * f * k; b.x -= dx * f * k; b.y -= dy * f * k; }
        edges.forEach(e => { const a = nodes[e.i], b = nodes[e.j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + .01, f = (d - (e.model ? 140 : 130)) * 0.02 * k; a.x += dx / d * f; a.y += dy / d * f; b.x -= dx / d * f; b.y -= dy / d * f; });
        nodes.forEach(n => { n.x += (W / 2 - n.x) * 0.005 * k; n.y += (H / 2 - n.y) * 0.008 * k; n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(24, Math.min(H - 24, n.y)); }); }
      const svg = s("svg", { class: "gsvg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Knowledge graph" });
      edges.forEach(e => { const a = nodes[e.i], b = nodes[e.j]; svg.append(s("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: e.user ? "var(--gold)" : e.model ? "var(--violet)" : "var(--muted)", "stroke-width": e.user ? 2.2 : 1, opacity: e.user ? .95 : e.model ? .25 : .3, "stroke-dasharray": e.user ? null : "3 4" })); });
      nodes.forEach(n => { const g = s("g", { class: "gnode", tabindex: 0 });
        if (n.m) { const lv = E.acquired(n.m.id).level; g.append(s("rect", { x: n.x - 6, y: n.y - 6, width: 12, height: 12, transform: `rotate(45 ${n.x} ${n.y})`, fill: lv >= 2 ? "var(--violet)" : "var(--panel)", stroke: "var(--violet)", "stroke-width": 1.5 }), s("text", { x: n.x, y: n.y + 20, "text-anchor": "middle", style: "fill:var(--violet)" }, n.m.name)); g.addEventListener("click", () => nav("#/models")); }
        else { const col = MV.DOMAIN_COLORS[n.a.domain], r = n.st < 0 ? 5 : 6 + n.st * 0.9; g.append(s("circle", { cx: n.x, cy: n.y, r, fill: n.st < 0 ? "var(--panel)" : col, stroke: col, "stroke-width": n.st === 8 ? 3 : 1.5, opacity: n.st < 0 ? .55 : .55 + n.st * .055 }), s("text", { x: n.x, y: n.y + r + 12, "text-anchor": "middle", opacity: n.st < 0 ? .5 : 1 }, n.a.title.length > 24 ? n.a.title.slice(0, 23) + "…" : n.a.title), s("title", {}, n.a.title + (n.st < 0 ? " (not seen yet)" : " · " + MV.STATES[n.st].label))); const go = () => nav("#/asset/" + n.a.id); g.addEventListener("click", go); g.addEventListener("keydown", ev => ev.key === "Enter" && go()); }
        svg.append(g); });
      holder.append(svg);
    }
    draw();
  }

  /* ================= LIBRARY + ASSET ================= */
  const lf = { dom: "all", st: "all", reg: "all" };
  function library(root) {
    root.append(page("Knowledge assets", "Your library", "Each fact, idea, model, story and word is tracked separately, from the first time you see it until you master it."));
    const grid = h("div", { class: "grid g3" }), f0 = h("div", { class: "row mb" }), f1 = h("div", { class: "row mb" }), f2 = h("div", { class: "row mb" });
    const draw = () => { f0.innerHTML = ""; f1.innerHTML = ""; f2.innerHTML = ""; grid.innerHTML = "";
      [["all", "All places"], ...Object.entries(MV.REGIONS), ["world", "World"]].forEach(([k, l]) => f0.append(h("button", { class: "chip" + (lf.reg === k ? " on" : ""), onclick: () => { lf.reg = k; draw(); } }, l)));
      [["all", "All fields"], ...Object.entries(MV.DOMAINS)].forEach(([k, l]) => f1.append(h("button", { class: "chip" + (lf.dom === k ? " on" : ""), onclick: () => { lf.dom = k; draw(); } }, l)));
      [["all", "All levels"], ["met", "Seen"], ["unmet", "Not seen yet"], ["risk", "About to forget"], ["mastered", "Mastered"]].forEach(([k, l]) => f2.append(h("button", { class: "chip" + (lf.st === k ? " on" : ""), onclick: () => { lf.st = k; draw(); } }, l)));
      const risk = new Set(E.rescueList().map(r => r.id));
      const list = A().filter(a => (lf.dom === "all" || a.domain === lf.dom) && (lf.reg === "all" || (a.region || "world") === lf.reg) && ({ all: true, met: E.stateIdx(a.id) >= 0, unmet: E.stateIdx(a.id) < 0, risk: risk.has(a.id), mastered: E.stateIdx(a.id) === 8 })[lf.st]).sort((a, b) => E.stateIdx(b.id) - E.stateIdx(a.id));
      list.forEach(a => grid.append(assetCard(a))); if (!list.length) grid.append(h("p", { class: "muted" }, "No ideas match these filters.")); };
    draw(); root.append(f0, f1, f2, grid);
  }
  function asset(root, id) {
    const a = E.asset(id); if (!a) return root.append(empty("We could not find that idea."));
    const i = E.stateIdx(id), need = E.nextNeed(id), m = E.mem(id), st = E.storyOfAsset(id);
    root.append(h("header", { class: "pg" }, h("a", { class: "small", href: "#/library" }, "← Library"), h("div", { class: "row small muted mt" }, dom(a.domain), "·", a.type, "·", stateBadge(i)), h("h1", {}, a.title)));
    root.append(h("div", { class: "card mb" }, ladder(id), h("div", { class: "row between mt" }, h("div", {}, h("div", { class: "tiny muted" }, "NEXT STEP"), h("b", {}, NEED_LABEL[need])), h("button", { class: "btn primary", onclick: () => MV.Session.startSteps(stepsFor(id), a.title) }, need === "learn" ? "Learn it →" : "Do it now →"))));
    if (i < 0) { root.append(h("div", { class: "card" }, h("p", { class: "muted" }, "You have not seen this idea yet. To learn it well, you must test yourself, not only read it."), (() => { const b = E.bridgeFor(id); return b ? h("div", { class: "callout teal" }, h("b", {}, "You already know something that helps to explain this: "), E.asset(b.other).title) : null; })())); return; }
    const F = (k, v) => h("div", { class: "field" }, h("div", { class: "k" }, k), h("div", {}, v));
    const left = h("div", { class: "card" }, F("The idea", h("span", { class: "lede" }, a.fact)), F("Why it matters", a.why), F("How it works", a.mech),
      a.models.length ? F("Mental models", h("div", { class: "row" }, a.models.map(x => h("a", { class: "chip", href: "#/models" }, E.model(x).name)))) : null,
      st ? F("Story", h("a", { href: "#/stories" }, `“${st.title}”`)) : null);
    const due = m ? m.last + m.S * 1.5425 * DAY : 0;
    const memCard = h("div", { class: "card" }, h("h3", {}, "Memory"), m ? [h("div", { class: "row" }, h("div", { class: "num" }, U.pct(m.R * 100)), h("div", { class: "small muted" }, "how likely you are to remember this right now")), bar(m.R * 100, m.R < .7 ? "var(--coral)" : m.R < .85 ? "var(--gold)" : "var(--ok)"),
      h("p", { class: "small muted mt" }, `Practised ${m.n} times, last ${ago(m.last)}. Memory strength: about ${m.S.toFixed(1)} days. ` + (due <= E.now() ? "Practise it now, or you may forget it." : `Practise it again in about ${Math.max(1, Math.round((due - E.now()) / DAY))} days.`))] : h("p", { class: "muted" }, "You have not practised this yet."),
      h("div", { class: "row" }, h("button", { class: "btn sm", onclick: () => MV.Session.startSteps([{ kind: m && m.R < .85 ? "rescue" : "recall", id }], "Memory test") }, "Test my memory"), h("button", { class: "btn sm", onclick: () => MV.Session.startSteps([{ kind: "explain", id, level: "2min" }], "Explain it") }, "Explain it"),
        st ? h("button", { class: "btn sm", onclick: () => MV.Session.startSteps([{ kind: "story", id }], "Storytelling") }, "Tell the story") : null, h("button", { class: "btn sm", onclick: () => MV.Session.startSteps([{ kind: "apply", id }], "In real life") }, "I used this")));
    const mine = E.S.conns.filter(c => c.a === id || c.b === id), mineIds = new Set(mine.map(c => c.a === id ? c.b : c.a));
    const open = E.neighbors(id).filter(n => n.src === "seed" && !mineIds.has(n.id));
    const conn = h("div", { class: "card" }, h("h3", {}, "Connections"), mine.length ? h("ul", { class: "list small" }, mine.map(c => { const o = c.a === id ? c.b : c.a; return h("li", {}, h("a", { href: "#/asset/" + o }, h("b", {}, E.asset(o).title)), h("div", { class: "muted" }, c.note)); })) : h("p", { class: "small muted" }, "You have not connected this to any other idea yet."),
      open.length ? [h("div", { class: "tiny muted mt" }, "CONNECTIONS YOU CAN MAKE"), h("div", { class: "row mt" }, open.map(n => h("a", { class: "chip", href: "#/asset/" + n.id, title: E.stateIdx(n.id) < 0 ? "Not seen yet" : "" }, (E.stateIdx(n.id) < 0 ? "○ " : "") + E.asset(n.id).title))), h("button", { class: "btn sm mt", onclick: () => MV.Session.startSteps([{ kind: "connect", id }], "Connect") }, "Make a connection")] : null);
    const apps = E.S.apps.filter(x => x.assetId === id && x.kind !== "none");
    const lab = Object.fromEntries(MV.Session.WILD);
    root.append(h("div", { class: "grid g2 mb" }, left, h("div", { class: "col" }, memCard, conn, apps.length ? h("div", { class: "card" }, h("h3", {}, "Used in real life"), h("ul", { class: "list small" }, apps.map(x => h("li", {}, lab[x.kind], h("span", { class: "muted" }, " · " + ago(x.t)), x.note ? h("div", { class: "muted" }, x.note) : null)))) : null)));
    if (a.type !== "vocabulary item") root.append(h("div", { class: "card" }, h("h3", {}, "Conversation capital"), MV.convoCard(a)));
  }

  /* ================= MODELS ================= */
  function models(root) {
    root.append(page("Mental model library", "Thinking tools you can use again and again", "You have learned a model when you have seen it in more than one idea and used it on something real. This is where knowledge becomes a tool."));
    const LV = ["Not seen yet", "Seen", "Practising", "Learned"];
    root.append(h("div", { class: "grid g2" }, MV.MODELS.map(m => { const ac = E.acquired(m.id), ex = A().filter(a => a.models.includes(m.id) && E.stateIdx(a.id) >= 0), known = ex.filter(a => E.stateIdx(a.id) >= 1);
      const b = h("span", { class: "badge" }, LV[ac.level]); if (ac.level) { b.style.color = U.sc(ac.level * 2 + 2); b.style.borderColor = U.sc(ac.level * 2 + 2); }
      return h("div", { class: "card" }, h("div", { class: "row between" }, h("h3", { style: "margin:0" }, m.name), b), h("p", { class: "mt" }, m.line), h("p", { class: "small muted" }, h("b", {}, "Ask: "), m.ask), h("p", { class: "small muted" }, h("b", {}, "Example: "), m.ex),
        ex.length ? h("div", { class: "row small" }, h("span", { class: "muted" }, "In your portfolio:"), ex.map(a => h("a", { class: "chip", href: "#/asset/" + a.id }, a.title))) : h("p", { class: "tiny muted" }, "You will see this model as you learn more."),
        known.length ? h("button", { class: "btn sm mt", onclick: () => MV.Session.startSteps([{ kind: "challenge", id: E.shuffle(known)[0].id, model: m.id }], "Use " + m.name) }, "Use this model on an idea") : null); })));
  }

  /* ================= STORIES ================= */
  function stories(root) {
    root.append(page("Story DNA", "Stories you can tell", "Every story has the same eight parts: hook (a strong opening), setting (where and when), character (who), conflict (the problem), surprise, turning point (when things change), payoff (how it ends) and meaning (what it teaches). Learn the story, then tell it without looking."));
    MV.STORIES.forEach(st => { const i = E.stateIdx(st.assetId), at = E.S.attempts.filter(x => x.kind === "story" && x.id === st.id), best = at.length ? Math.max(...at.map(x => x.overall)) : null;
      const ver = { "30-second": [st.hook, st.surprise, st.payoff, st.meaning], "90-second": [st.hook, st.setting, st.character, st.conflict, st.surprise, st.turning, st.payoff, st.meaning], "3-minute": [st.hook, st.setting, st.character, st.conflict, st.extra[0], st.surprise, st.turning, st.extra[1], st.payoff, st.extra[2], st.meaning] };
      const body = h("div"); let tab = "dna";
      const draw = () => { body.innerHTML = ""; body.append(h("div", { class: "tabs" }, [["dna", "Story DNA"], ...Object.keys(ver).map(k => [k, k + " version"])].map(([k, l]) => h("button", { class: "chip" + (tab === k ? " on" : ""), onclick: () => { tab = k; draw(); } }, l))), tab === "dna" ? MV.Session.dna(st) : h("p", { style: "font:1.05rem/1.7 var(--serif)" }, ver[tab].join(" "))); };
      draw();
      root.append(h("div", { class: "card mb" }, h("div", { class: "row between" }, h("h2", { style: "margin:0" }, st.title), h("div", { class: "row" }, best != null ? h("span", { class: "badge" }, `Best score ${best} · ${at.length} attempt${at.length > 1 ? "s" : ""}`) : null, i >= 7 ? stateBadge(7) : stateBadge(i))),
        h("p", { class: "lede mt" }, st.hook), i < 0 ? h("p", { class: "small muted" }, "You have not seen this story yet. Learn it first, so you can tell it in your own way.") : h("details", {}, h("summary", {}, "Study the story"), body),
        h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: () => MV.Session.startSteps(i < 0 ? [{ kind: "learn", id: st.assetId }, { kind: "recognize", id: st.assetId }, { kind: "story", id: st.assetId }] : [{ kind: "story", id: st.assetId }], "Storytelling coach") }, i < 0 ? "Learn it, then tell it" : "Tell it without looking"), at.length > 1 ? h("div", { style: "width:110px" }, U.spark(at.map(x => x.overall), "var(--gold)")) : null))); });
  }

  /* ================= CONVERSATION ================= */
  function conversation(root) {
    root.append(page("Conversation capital", "Be interesting. Do not show off.", "Ideas you can bring into a conversation in a natural way. The goal is to be curious and thoughtful, not to show how much you know."));
    root.append(h("div", { class: "card hl mb" }, h("h2", {}, "Do not just list facts. Listen first."), h("div", { class: "path" }, ["LISTEN", "CONNECT", "CONTRIBUTE", "ASK"].map((x, i) => [i ? h("span", { class: "arr" }, "→") : null, h("span", { class: "n" }, x)])), h("p", { class: "small muted mt" }, "Listen to what the other person really said. Find a true link to something you know. Share one idea in a few words. Then ask a question, so they can speak again.")));
    const list = seen().filter(a => a.type !== "vocabulary item" && E.stateIdx(a.id) >= 1).sort((a, b) => E.stateIdx(b.id) - E.stateIdx(a.id));
    if (!list.length) return root.append(empty("Ideas will appear here after you pass a quick check on them."));
    list.forEach(a => root.append(h("details", { class: "card mb" }, h("summary", { class: "row between", style: "color:var(--text)" }, h("span", {}, h("b", {}, a.title), h("span", { class: "muted small" }, " · when people talk about " + a.cue)), E.has(a.id, "convo") ? stateBadge(6) : h("span", { class: "badge" }, "Not practised yet")),
      MV.convoCard(a), h("button", { class: "btn primary", onclick: () => MV.Session.startSteps([{ kind: "convo", id: a.id }], "Conversation practice") }, "Practise talking about it"))));
  }

  /* ================= GAPS ================= */
  function gapsView(root) {
    root.append(page("Knowledge gaps", "Ideas missing from your map", "We find gaps by looking at what you already know. A gap is an idea that your other ideas depend on or connect to, but that you have not learned yet."));
    const gs = E.gaps(); if (!gs.length) return root.append(empty(seen().length ? "No gaps found right now. Keep learning, and new ones will show up." : null));
    root.append(h("div", { class: "grid g2" }, gs.slice(0, 8).map(g => { const a = E.asset(g.id);
      return h("div", { class: "card" }, h("div", { class: "row between small muted" }, dom(a.domain), g.down.length ? h("span", { class: "badge gap" }, "Basic idea missing") : h("span", { class: "badge" }, "Missing link")), h("h3", { class: "mt" }, a.title), h("p", { class: "small" }, gapWhy(g)),
        h("div", { class: "path small mb" }, [...new Set([...g.down, ...g.linked])].slice(0, 3).map(x => [h("span", { class: "n" }, E.asset(x).title), " "]), h("span", { class: "arr" }, "←"), h("span", { class: "n", style: "border-style:dashed" }, "?")),
        h("button", { class: "btn primary", onclick: () => fillGap(g.id) }, "Fill the gap · 8 minutes")); })));
    const dw = E.domainWeights(), thin = Object.keys(MV.DOMAINS).filter(d => !(dw.w[d] > 0) && A().some(a => a.domain === d));
    if (thin.length) root.append(h("div", { class: "card mt" }, h("h3", {}, "Fields you have not explored"), h("p", { class: "small muted" }, "You have not started these fields yet. A wide mind needs a few surprises."), h("div", { class: "row" }, thin.map(d => h("span", { class: "chip static" }, dom(d))))));
  }

  /* ================= MISSIONS ================= */
  function missions(root) {
    root.append(page("Real-life missions", "Use it in real life", "Learn it → notice it → use it → remember it. One mission every week. Then tell what happened in your own words."));
    let m = E.activeMission();
    if (!m && (E.missionDue() || !E.S.missions.length)) m = E.newMission();
    if (m) { const ta = h("textarea", { placeholder: "What happened? What did you notice?" }), sel = h("select", {}, h("option", { value: "" }, "Link to an idea (optional)"), seen().map(a => h("option", { value: a.id }, a.title)));
      root.append(h("div", { class: "card hl mb" }, h("div", { class: "eyebrow" }, "This week's mission · given " + ago(m.t)), h("p", { class: "lede" }, m.text), m.model ? h("p", { class: "small muted" }, "Thinking tool: " + E.model(m.model).name) : null, ta, h("div", { class: "row mt" }, h("div", { style: "flex:1;min-width:200px" }, sel),
        h("button", { class: "btn primary", onclick: () => { if (ta.value.trim().length < 10) return toast("Write one or two sentences about what happened."); E.reportMission(m.id, ta.value.trim(), sel.value); toast("Mission saved. You used an idea in real life."); MV.App.render(); } }, "Report"),
        h("button", { class: "btn ghost", onclick: () => { E.S.missions.pop(); E.save(); E.newMission(); MV.App.render(); } }, "Give me a different one")))); }
    else root.append(h("div", { class: "card mb" }, h("p", {}, "You finished this week's mission. A new one will come in a few days."), h("button", { class: "btn", onclick: () => { E.newMission(); MV.App.render(); } }, "I want another one now")));
    const done = E.S.missions.filter(x => x.report).reverse();
    if (done.length) root.append(h("h2", {}, "Your past missions"), h("div", { class: "col" }, done.map(x => h("div", { class: "card" }, h("div", { class: "small muted" }, x.text), h("p", { class: "mt", style: "margin-bottom:0" }, "“" + x.report + "”"), h("div", { class: "tiny muted mt" }, ago(x.rt))))));
  }

  /* ================= ASK ================= */
  const QS = [["learned", "What have I learned so far?"], ["best", "What do I remember best?"], ["forgetting", "What am I forgetting?"], ["strong", "What are my strongest areas?"], ["gaps", "What are my biggest knowledge gaps?"], ["models", "What mental models have I learned?"], ["stories", "What are my best stories?"], ["used", "What knowledge have I used in real life?"], ["connect", "Which ideas connect the things I have learned?"], ["next", "What should I learn next?"], ["thinker", "What kind of thinker am I becoming?"]];
  const MATCH = [["forget|fading|losing|decay", "forgetting"], ["remember|retain|best", "best"], ["strong|area|domain|field|subject", "strong"], ["gap|missing|weak|blind", "gaps"], ["model", "models"], ["stor", "stories"], ["used|use|appl|real", "used"], ["connect|link|bridge|relat", "connect"], ["next|should", "next"], ["thinker|becoming|kind of|who am", "thinker"], ["learn", "learned"]];
  const li = (a, extra) => h("li", { class: "row between" }, h("a", { href: "#/asset/" + a.id }, a.title), extra);
  const ANS = {
    learned() { const c = E.counts(), by = {}; seen().forEach(a => (by[a.domain] = by[a.domain] || []).push(a));
      return [h("p", { class: "lede" }, `You have ${c.assets} knowledge assets. You remember ${c.retained}, you can explain ${c.understood}, and you have mastered ${c.mastered}.`), h("p", {}, `They have created ${c.conns} connections (${c.crossConns} between different fields). You have learned ${c.models} mental models and used ${c.used} ideas in real life.`),
        Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([d, l]) => h("p", { class: "small" }, h("b", {}, MV.DOMAINS[d] + ": "), l.map(a => a.title).join(", ")))]; },
    best() { const l = seen().map(a => ({ a, m: E.mem(a.id) })).filter(x => x.m && E.stateIdx(x.a.id) >= 2).sort((x, y) => y.m.R * Math.log(1 + y.m.S) - x.m.R * Math.log(1 + x.m.S)).slice(0, 6);
      return l.length ? [h("p", {}, "The ideas you remember most strongly come first, not the ones you saw most recently:"), h("ul", { class: "list" }, l.map(x => li(x.a, h("span", { class: "small muted" }, `${U.pct(x.m.R * 100)} chance to remember · strength ${x.m.S.toFixed(0)} days`))))] : [h("p", { class: "muted" }, "You have not remembered anything without help yet.")]; },
    forgetting() { const l = E.rescueList().slice(0, 6);
      return l.length ? [h("p", {}, "The most important ideas you are most likely to forget come first:"), h("ul", { class: "list" }, l.map(r => li(E.asset(r.id), h("span", { class: "badge risk" }, Math.round(r.risk * 100) + "% risk")))), h("button", { class: "btn primary mt", onclick: () => MV.Session.startSteps(l.map(r => ({ kind: "rescue", id: r.id, R: r.R })), "Rescue session") }, "Rescue these now")] : [h("p", {}, "You are not about to forget anything. Your knowledge is safe for now.")]; },
    strong() { const dw = E.domainWeights(), mx = Math.max(1, ...Object.values(dw.w));
      return [h("div", { class: "scorebars" }, dw.top.map(d => h("div", { class: "sr", style: "grid-template-columns:150px 1fr 34px" }, dom(d), bar(dw.w[d] / mx * 100, MV.DOMAIN_COLORS[d]), h("span", { class: "tiny" }, A().filter(a => a.domain === d && E.stateIdx(a.id) >= 0).length)))), h("p", { class: "small muted mt" }, "This is based on how well you know the ideas, not on how many you have seen.")]; },
    gaps() { const g = E.gaps().slice(0, 5); return g.length ? [h("ul", { class: "list" }, g.map(x => h("li", {}, h("a", { href: "#/asset/" + x.id }, h("b", {}, E.asset(x.id).title)), h("div", { class: "small muted" }, gapWhy(x))))), h("a", { class: "btn mt", href: "#/gaps" }, "See all knowledge gaps")] : [h("p", {}, "No gaps found yet.")]; },
    models() { const l = MV.MODELS.map(m => ({ m, ac: E.acquired(m.id) })).filter(x => x.ac.level >= 2).sort((a, b) => b.ac.pts - a.ac.pts);
      return l.length ? [h("ul", { class: "list" }, l.map(x => h("li", {}, h("b", {}, x.m.name), h("span", { class: "badge", style: "margin-left:8px" }, x.ac.level === 3 ? "Learned" : "Practising"), h("div", { class: "small muted" }, x.m.line))))] : [h("p", { class: "muted" }, "You have not learned any yet. You learn a model by connecting it to ideas and using it.")]; },
    stories() { const l = MV.STORIES.map(s => ({ s, at: E.S.attempts.filter(x => x.kind === "story" && x.id === s.id) })).filter(x => x.at.length).map(x => ({ s: x.s, best: Math.max(...x.at.map(y => y.overall)), n: x.at.length, first: x.at[0].overall })).sort((a, b) => b.best - a.best);
      return l.length ? [h("ul", { class: "list" }, l.map(x => h("li", { class: "row between" }, h("span", {}, h("b", {}, x.s.title), h("div", { class: "small muted" }, x.s.hook)), h("span", { class: "small" }, `best score ${x.best}` + (x.n > 1 ? ` (first score ${x.first}, ${x.n} attempts)` : "")))))] : [h("p", { class: "muted" }, "You have not told a story yet."), h("a", { class: "btn", href: "#/stories" }, "Practise one")]; },
    used() { const lab = Object.fromEntries(MV.Session.WILD), l = E.S.apps.filter(x => x.kind !== "none").slice().reverse(), c = E.counts();
      return [h("p", { class: "lede" }, `You used ${U.pct(c.appRate * 100)} of the ideas we asked you about in real life.`), l.length ? h("ul", { class: "list" }, l.slice(0, 10).map(x => h("li", {}, h("a", { href: "#/asset/" + x.assetId }, h("b", {}, E.asset(x.assetId).title)), h("span", { class: "muted small" }, ` · ${lab[x.kind]} · ${ago(x.t)}`), x.note ? h("div", { class: "small muted" }, x.note) : null))) : h("p", { class: "muted" }, "Nothing saved yet.")]; },
    connect() { const deg = {}; E.S.conns.forEach(c => { deg[c.a] = (deg[c.a] || 0) + 1; deg[c.b] = (deg[c.b] || 0) + 1; }); const hubs = Object.entries(deg).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const mc = MV.MODELS.map(m => ({ m, l: seen().filter(a => a.models.includes(m.id)) })).filter(x => x.l.length >= 2).sort((a, b) => b.l.length - a.l.length).slice(0, 3);
      const out = []; if (hubs.length) out.push(h("p", {}, h("b", {}, "Your most connected ideas: "), hubs.map(([id, n]) => `${E.asset(id).title} (${n})`).join(", ") + "."));
      mc.forEach(x => out.push(h("p", { class: "small" }, h("b", { style: "color:var(--violet)" }, x.m.name), " appears in " + E.listJoin(x.l.slice(0, 5).map(a => a.title)) + ".")));
      const s = seen(); if (s.length >= 2) { const p = E.pathBetween(s[0].id, s[s.length - 1].id); if (p && p.length > 2) out.push(h("div", { class: "path small" }, p.map((k, i) => [i ? h("span", { class: "arr" }, "→") : null, h("span", { class: "n" + (k.startsWith("m:") ? " m" : "") }, E.nodeLabel(k))]))); }
      out.push(h("a", { class: "btn mt", href: "#/graph" }, "Open the graph")); return out.length > 1 ? out : [h("p", { class: "muted" }, "Make a few connections first.")]; },
    next() { return [h("ul", { class: "list" }, E.recommend(4).map(r => h("li", {}, h("a", { href: "#/asset/" + r.id }, h("b", {}, E.asset(r.id).title)), r.surprise ? h("span", { class: "badge sur", style: "margin-left:8px" }, "surprise") : null, h("div", { class: "small muted" }, r.why))))]; },
    thinker() { return E.identity().map(x => h("p", { class: x.kind === "domains" ? "lede" : "" }, x.text)); }
  };
  function ask(root) {
    root.append(page("Ask your mind", "Answers from your own learning history", "These answers are only about you. Each one comes from what you have learned, remembered, connected, told and used."));
    const out = h("div", { class: "card mt" }), inp = h("input", { type: "text", placeholder: "Ask anything about your learning…", "aria-label": "Question" });
    const answer = k => { out.innerHTML = ""; out.append(h("div", { class: "eyebrow" }, Object.fromEntries(QS)[k])); if (!seen().length) return out.append(h("p", { class: "muted" }, "There is nothing to answer from yet. Do a session first, then ask again.")); out.append(...[].concat(ANS[k]()).flat(Infinity).filter(Boolean)); };
    const go = () => { const q = inp.value.toLowerCase(); const hit = MATCH.find(([re]) => new RegExp(re).test(q)); if (hit) answer(hit[1]); else { out.innerHTML = ""; out.append(h("p", { class: "muted" }, "I can answer questions about what you have learned, what you remember, what you are forgetting, how your ideas connect, what you have used, and what to learn next. Try one of the questions above.")); } };
    inp.addEventListener("keydown", e => e.key === "Enter" && go());
    root.append(h("div", { class: "row mb" }, QS.map(([k, l]) => h("button", { class: "chip", onclick: () => answer(k) }, l))), h("div", { class: "row" }, h("div", { style: "flex:1" }, inp), h("button", { class: "btn primary", onclick: go }, "Ask")), out);
    answer("thinker");
  }

  /* ================= SETTINGS ================= */
  function settings(root) {
    root.append(page("Settings", "Your data, your mind", "Everything is saved only in this browser. Export it to keep a backup copy or to move to another device."));
    const key = h("input", { type: "text", placeholder: "sk-ant-…", value: E.S.prefs.apiKey || "", autocomplete: "off" });
    const file = h("input", { type: "file", accept: "application/json", style: "display:none", onchange: e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { E.importData(t); toast("Import done."); MV.App.render(); } catch (er) { toast("That file is not a MindVault export file."); } }); } });
    root.append(h("div", { class: "grid g2" },
      h("div", { class: "card" }, h("h3", {}, "Data"), h("div", { class: "row" }, h("button", { class: "btn", onclick: () => { const b = new Blob([E.exportData()], { type: "application/json" }), a = h("a", { href: URL.createObjectURL(b), download: "mindvault-export.json" }); a.click(); } }, "Export"), h("button", { class: "btn", onclick: () => file.click() }, "Import"), file),
        h("hr"), h("div", { class: "row" }, h("button", { class: "btn", onclick: () => { if (seen().length && !E.S.demo && !confirm("Replace your current history with sample data?")) return; E.seedDemo(); toast("Sample history loaded."); MV.App.render(); } }, "Load 6-month sample history"), h("button", { class: "btn", onclick: () => { if (confirm("Delete all your learning history in this browser? You cannot undo this.")) { E.reset(); toast("Everything is reset."); nav("#/today"); MV.App.render(); } } }, "Reset everything")),
        E.S.demo ? h("p", { class: "tiny muted mt" }, "You are looking at sample history. Reset to start your own.") : null),
      h("div", { class: "card" }, h("h3", {}, "Better coaching with Claude (optional)"), h("p", { class: "small muted" }, "Coaching works offline with built-in checks. Add an Anthropic API key to get more detailed feedback on your stories and explanations. The key is saved in this browser, and your answers are sent directly to Anthropic's API. Do not use this on a shared computer."), key,
        h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: () => { E.S.prefs.apiKey = key.value.trim(); E.save(); toast(key.value.trim() ? "Key saved." : "Key removed."); } }, "Save"), h("span", { class: "tiny muted" }, MV.Mic.supported() ? "Voice input is available" : "Voice input needs Chrome or Edge")))));
  }

  MV.Views = { today, portfolio, graph: graphView, library, asset, models, stories, conversation, gaps: gapsView, missions, ask, settings, session: r => MV.Session.render(r) };
})();
