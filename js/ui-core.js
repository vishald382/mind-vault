/* UI helpers and shared components */
(function () {
  const E = MV.E;
  const $ = (s, r = document) => r.querySelector(s);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, ""); else e.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const svgNS = "http://www.w3.org/2000/svg";
  function s(tag, attrs, ...kids) {
    const e = document.createElementNS(svgNS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); }

  const STATE_COLORS = ["#6f7f8f", "#6aa0b8", "#6fb7a8", "#8fc07a", "#b9c46b", "#e0c04c", "#e0a04c", "#e08a4c", "#f0c040"];
  const sc = i => STATE_COLORS[Math.max(0, Math.min(8, i))];
  function stateBadge(i) {
    if (i < 0) return h("span", { class: "badge" }, "Not seen yet");
    const st = MV.STATES[i]; const b = h("span", { class: "badge", title: st.desc }, st.label); b.style.color = sc(i); b.style.borderColor = sc(i); return b;
  }
  const dom = d => h("span", { class: "row", style: "gap:6px;display:inline-flex" }, h("span", { class: "dotc", style: `background:${MV.DOMAIN_COLORS[d]}` }), MV.DOMAINS[d]);
  const pct = x => Math.round(x) + "%";

  function ladder(id) {
    const idx = E.stateIdx(id), a = E.asset(id), e = E.S.ev[id] || {};
    const need = E.nextNeed(id);
    const evidence = ["seen", "recognized", "recalled", "explained", "connected", "expressed", "convo", "story", "mastered"];
    return h("div", { class: "ladder", role: "list" }, MV.STATES.map((st, i) => {
      const skipped = i === 7 && !a.story;
      const done = i <= idx && !skipped;
      const r = h("div", { class: "rung" + (done ? " done" : "") + (i === idx ? " cur" : ""), role: "listitem", title: st.desc + (skipped ? " (no story attached)" : "") },
        h("b", {}, st.short), skipped ? "n/a" : st.desc.replace(/^You (can )?/, ""));
      r.style.setProperty("--c", sc(i)); if (skipped) r.style.opacity = .4; return r;
    }));
  }
  function bar(v, color) { const b = h("div", { class: "bar" }, h("i", { style: `width:${Math.max(0, Math.min(100, v))}%` })); if (color) b.firstChild.style.background = color; return b; }

  function area(values, { w = 200, hh = 54, color = "var(--gold)" } = {}) {
    const max = Math.max(1, ...values), n = values.length;
    const pts = values.map((v, i) => [n === 1 ? w : i / (n - 1) * w, hh - 4 - v / max * (hh - 10)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    return s("svg", { viewBox: `0 0 ${w} ${hh}`, width: "100%", height: hh, role: "img", "aria-label": "trend" },
      s("path", { d: line + ` L${w} ${hh} L0 ${hh} Z`, fill: color, opacity: .16 }), s("path", { d: line, fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round" }),
      s("circle", { cx: pts[n - 1][0], cy: pts[n - 1][1], r: 3, fill: color }));
  }
  function spark(values, color = "var(--teal)") { return area(values, { w: 90, hh: 24, color }); }

  function lineChart(series, { w = 560, hh = 190 } = {}) {
    const all = series.flatMap(x => x.values), max = Math.max(1, ...all), n = series[0].values.length, pad = { l: 28, r: 118, t: 10, b: 20 };
    const X = i => pad.l + (n === 1 ? 0 : i / (n - 1)) * (w - pad.l - pad.r), Y = v => hh - pad.b - v / max * (hh - pad.t - pad.b);
    const g = s("svg", { viewBox: `0 0 ${w} ${hh}`, width: "100%", role: "img" });
    for (let k = 0; k <= 3; k++) { const v = max * k / 3; g.append(s("line", { x1: pad.l, x2: w - pad.r, y1: Y(v), y2: Y(v), stroke: "var(--line)", "stroke-dasharray": "3 4" }), s("text", { x: pad.l - 5, y: Y(v) + 3, "text-anchor": "end", "font-size": 9, fill: "var(--muted)" }, Math.round(v))); }
    const ly = series.map((sr, i) => ({ i, y: Y(sr.values[n - 1]) })).sort((a, b) => a.y - b.y), lab = {};
    ly.forEach((o, k) => { if (k && o.y - ly[k - 1].y < 13) o.y = ly[k - 1].y + 13; lab[o.i] = o.y; });
    series.forEach((sr, si) => {
      g.append(s("path", { d: sr.values.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" "), fill: "none", stroke: sr.color, "stroke-width": 2.2, "stroke-linejoin": "round" }));
      g.append(s("circle", { cx: X(n - 1), cy: Y(sr.values[n - 1]), r: 3.5, fill: sr.color }), s("text", { x: X(n - 1) + 8, y: lab[si] + 3, "font-size": 10.5, fill: sr.color }, sr.label + " " + sr.values[n - 1]));
    });
    return g;
  }

  /* Coach result block shared by explain/story/convo */
  function scoreBars(scores, labels) {
    return h("div", { class: "scorebars" }, Object.entries(scores).map(([k, v]) => typeof v === "boolean" ?
      h("div", { class: "sr" }, h("span", {}, (labels && labels[k]) || k), h("span", { class: v ? "sl-ok" : "sl-bad" }, v ? "✓ yes" : "✗ missing"), h("span")) :
      h("div", { class: "sr" }, h("span", {}, (labels && labels[k]) || k), bar(v, v >= 70 ? "var(--ok)" : v >= 50 ? "var(--gold)" : "var(--coral)"), h("span", { class: "tiny" }, v))));
  }
  const nav = href => { location.hash = href; };

  MV.UI = { $, h, s, toast, sc, stateBadge, dom, pct, ladder, bar, area, spark, lineChart, scoreBars, nav, STATE_COLORS };
})();
