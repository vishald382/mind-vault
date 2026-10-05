/* Feed: an endless, swipeable stream of ideas. Scrolling past an idea only makes it
   ENCOUNTERED; the checks, rescues and bridges mixed into the stream move it further. */
(function () {
  const E = MV.E, { h, toast, stateBadge, dom } = MV.UI;
  const DWELL = 1200;

  function feed(root) {
    const scroller = h("div", { class: "feed-scroll", tabindex: 0, "aria-label": "Idea feed" });
    root.append(scroller);
    const shown = { idea: new Set(), check: new Set(), rescue: new Set(), bridge: new Set(), model: new Set(), story: new Set() };
    const ideaLog = []; let n = 0, ideaN = 0;

    /* ---------- card builders ---------- */
    const shell = (color, ...kids) => { const c = h("section", { class: "fcard" }, h("div", { class: "in" }, kids)); c.style.setProperty("--dc", color || "var(--gold)"); return c; };
    const actions = (...kids) => h("div", { class: "row factions" }, kids);

    function mcq(a, done) {
      const opts = E.shuffle(a.mcq.o.map((t, i) => ({ t, ok: i === 0 }))), fb = h("div"); let answered = false;
      const btns = opts.map((o, k) => h("button", { class: "opt", onclick: () => {
        if (answered) return; answered = true;
        btns.forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add("right"); else if (i === k) b.classList.add("wrong"); });
        if (o.ok) { E.mark(a.id, "seen"); E.mark(a.id, "recognized"); E.touch(a.id, 2, "recognize"); fb.append(h("p", { class: "sl-ok" }, "Correct. You are remembering this one.")); }
        else { E.touch(a.id, 0, "recognize"); fb.append(h("p", { class: "sl-bad" }, "Not correct. You will see it again.")); }
        if (done) done(o.ok);
      } }, o.t));
      return h("div", {}, h("h3", {}, a.mcq.q), btns, fb);
    }

    function ideaCard(rec) {
      const a = E.asset(rec.id), br = E.bridgeFor(a.id), status = h("span", { class: "tiny muted" });
      const quiz = h("div", { class: "mt" });
      const card = shell(MV.DOMAIN_COLORS[a.domain],
        h("div", { class: "row between mb" }, h("span", { class: "small muted" }, dom(a.domain), " · ", a.region ? MV.REGIONS[a.region] + " · " : "", a.type), h("span", { class: "row" }, rec.surprise ? h("span", { class: "badge sur" }, "Surprise") : null, rec.gap ? h("span", { class: "badge gap" }, "Fills a gap") : null)),
        h("h2", {}, a.title), h("p", { class: "lede" }, a.fact), h("p", {}, a.why),
        br ? h("div", { class: "callout teal mb" }, h("b", {}, "You already know something that helps to explain this. "), `${E.asset(br.other).title}: ${br.note}`) : null,
        h("details", { class: "mb" }, h("summary", {}, "How it works"), h("p", {}, a.mech), a.models.length ? h("div", { class: "row small" }, a.models.map(m => h("span", { class: "chip static" }, E.model(m).name))) : null),
        actions(h("button", { class: "btn", onclick: e => { e.target.remove(); quiz.append(mcq(a)); } }, "Quick check"), h("a", { class: "btn ghost", href: "#/asset/" + a.id }, "Learn more →"), status), quiz);
      card._dwell = () => {
        if (E.has(a.id, "seen")) return;
        E.mark(a.id, "seen"); E.touch(a.id, 1, "seen"); E.logEvent({ k: "learn", id: a.id, surprise: !!rec.surprise, via: "feed" });
        ideaLog.push(a.id); status.textContent = "Encountered ✓";
      };
      return card;
    }

    function checkCard(id) {
      const a = E.asset(id);
      return shell("var(--teal)", h("div", { class: "eyebrow", style: "color:var(--teal)" }, "Quick check · " + a.title), mcq(a), h("p", { class: "tiny muted mt" }, "Seeing an idea is not the same as knowing it. Checks like this move it up the ladder."));
    }

    function rescueCard(id) {
      const a = E.asset(id), m = E.mem(id), out = h("div", { class: "mt" });
      const reveal = h("button", { class: "btn primary", onclick: () => {
        reveal.remove();
        out.append(h("div", { class: "callout mb" }, a.a), h("div", { class: "row" }, [[0, "Forgot it", ""], [1, "Almost", ""], [2, "Got it", "primary"]].map(([g, l, c]) => h("button", { class: "btn " + c, onclick: ev => {
          E.touch(id, g, "rescue"); if (g === 2) { E.mark(id, "recognized"); E.mark(id, "recalled"); }
          ev.target.parentNode.replaceWith(h("p", { class: g === 2 ? "sl-ok" : "muted" }, g === 2 ? "Rescued. The next practice will come later." : "Noted. You will see it again sooner."));
        } }, l))));
      } }, "Show answer");
      return shell("var(--coral)", h("div", { class: "eyebrow", style: "color:var(--coral)" }, "Rescue this idea" + (m ? ` · ${Math.round((1 - m.R) * 100)}% chance of forgetting` : "")),
        h("h2", {}, a.q), h("p", { class: "muted" }, a.title + ". Answer in your mind, then see the answer."), reveal, out);
    }

    function bridgeCard(e) {
      const a = E.asset(e.a), b = E.asset(e.b), cross = a.domain !== b.domain;
      return shell("var(--gold)", h("div", { class: "eyebrow" }, cross ? "A link between two different fields" : "A link between two things you know"),
        h("h2", {}, a.title, h("span", { class: "gold" }, " ↔ "), b.title), h("p", { class: "lede" }, e.note),
        actions(h("button", { class: "btn primary", onclick: ev => { E.addConnection(e.a, e.b, e.note, "feed"); ev.target.replaceWith(h("span", { class: "sl-ok" }, "Added to your knowledge graph.")); } }, "I see the link. Add it to my graph"), h("a", { class: "btn ghost", href: "#/graph" }, "Open graph")));
    }

    function modelCard(m) {
      const ex = E.assets().filter(a => a.models.includes(m.id) && E.stateIdx(a.id) >= 0).slice(0, 3);
      return shell("var(--violet)", h("div", { class: "eyebrow", style: "color:var(--violet)" }, "Mental model"), h("h2", {}, m.name), h("p", { class: "lede" }, m.line),
        h("p", {}, h("b", {}, "Ask: "), m.ask), h("p", { class: "muted" }, h("b", {}, "Example: "), m.ex),
        ex.length ? h("div", { class: "row small" }, h("span", { class: "muted" }, "You have seen it in:"), ex.map(a => h("a", { class: "chip", href: "#/asset/" + a.id }, a.title))) : null);
    }

    function storyCard(st) {
      const full = h("p", { style: "font:1.08rem/1.7 var(--serif)" }, [st.setting, st.conflict, st.surprise, st.turning, st.payoff].join(" "));
      const more = h("div"), a = E.asset(st.assetId);
      const card = shell(MV.DOMAIN_COLORS[a.domain], h("div", { class: "eyebrow" }, "Story"), h("h2", {}, st.title), h("p", { class: "lede" }, st.hook), more,
        actions(h("button", { class: "btn", onclick: e => { e.target.remove(); more.append(full, h("div", { class: "callout mb" }, h("b", {}, "Meaning: "), st.meaning)); card._read = true; card._dwell(); } }, "Read the story"),
          h("button", { class: "btn ghost", onclick: () => MV.Session.startSteps([{ kind: "story", id: st.assetId }], "Storytelling coach") }, "Practise telling it")));
      card._dwell = () => { if (!card._read || E.has(a.id, "seen")) return; E.mark(a.id, "seen"); E.touch(a.id, 1, "seen"); E.logEvent({ k: "learn", id: a.id, via: "feed" }); ideaLog.push(a.id); };
      return card;
    }

    /* ---------- stream ---------- */
    const fresh = (set, list, key = x => x) => { let l = list.filter(x => !set.has(key(x))); if (!l.length && list.length) { set.clear(); l = list; } return l; };
    function nextIdea() {
      // Two local ideas (Mumbai, Maharashtra, India) for every global one, while both last.
      const recs = E.recommend(120).filter(x => !shown.idea.has(x.id)), wantLocal = ideaN++ % 3 !== 2;
      const r = recs.find(x => !!E.asset(x.id).region === wantLocal) || recs[0];
      if (!r) return null; shown.idea.add(r.id); return ideaCard(r);
    }
    function nextCheck() {
      const pool = [...new Set([...ideaLog, ...E.assets().filter(a => E.stateIdx(a.id) === 0).map(a => a.id)])].filter(id => !E.has(id, "recognized"));
      const l = fresh(shown.check, pool.length ? pool : E.assets().filter(a => E.stateIdx(a.id) >= 0).map(a => a.id));
      if (!l.length) return null; shown.check.add(l[0]); return checkCard(l[0]);
    }
    function nextRescue(any) {
      let pool = E.rescueList().map(r => r.id);
      if (!pool.length && any) pool = E.assets().filter(a => E.stateIdx(a.id) >= 1).sort((a, b) => (E.mem(a.id)?.R ?? 1) - (E.mem(b.id)?.R ?? 1)).map(a => a.id);
      const l = fresh(shown.rescue, pool); if (!l.length) return null; shown.rescue.add(l[0]); return rescueCard(l[0]);
    }
    function nextBridge() {
      const mine = new Set(E.S.conns.map(c => [c.a, c.b].sort().join("|"))), key = e => [e.a, e.b].sort().join("|");
      const l = E.edges().filter(e => e.src === "seed" && E.stateIdx(e.a) >= 0 && E.stateIdx(e.b) >= 0 && !mine.has(key(e)) && !shown.bridge.has(key(e)));
      if (!l.length) return null; shown.bridge.add(key(l[0])); return bridgeCard(l[0]);
    }
    function nextModel() {
      const met = MV.MODELS.filter(m => E.assets().some(a => a.models.includes(m.id) && E.stateIdx(a.id) >= 0));
      const l = fresh(shown.model, met.length ? met : [], m => m.id); if (!l.length) return null; shown.model.add(l[0].id); return modelCard(l[0]);
    }
    function nextStory() {
      const l = MV.STORIES.filter(s => !shown.story.has(s.id) && !shown.idea.has(s.assetId) && E.stateIdx(s.assetId) < 0);
      if (!l.length) return null; shown.story.add(l[0].id); shown.idea.add(l[0].assetId); return storyCard(l[0]);
    }
    // Mostly new ideas, with something active every third card.
    const PATTERN = ["idea", "idea", "check", "idea", "bridge", "idea", "rescue", "story", "idea", "check", "model", "idea", "rescue"];
    const MAKE = { idea: nextIdea, check: nextCheck, rescue: () => nextRescue(false), bridge: nextBridge, model: nextModel, story: nextStory };
    function nextCard() {
      for (let tries = 0; tries < PATTERN.length; tries++) { const c = MAKE[PATTERN[n++ % PATTERN.length]](); if (c) return c; }
      return nextRescue(true) || nextCheck();
    }

    const top = () => { if (scroller.scrollTop + scroller.clientHeight * 3 >= scroller.scrollHeight) more(3); };
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      const c = en.target;
      if (en.isIntersecting) { if (c._dwell) c._t = setTimeout(c._dwell, DWELL); top(); }
      else clearTimeout(c._t);
    }), { root: scroller, rootMargin: "-45% 0px -45% 0px" });
    scroller.addEventListener("scroll", top, { passive: true });
    function more(k) { for (let i = 0; i < k; i++) { const c = nextCard(); if (!c) break; scroller.append(c); io.observe(c); } }

    more(4);
    if (!scroller.children.length) scroller.append(shell(null, h("h2", {}, "Nothing to show yet"), h("a", { class: "btn primary", href: "#/today" }, "Start a session")));
    else scroller.firstElementChild.append(h("div", { class: "fhint", "aria-hidden": "true" }, "Scroll ↓"));
    const step = d => scroller.scrollBy({ top: d * scroller.clientHeight, behavior: "smooth" });
    scroller.addEventListener("keydown", e => {
      if (/^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowDown" || e.key === "j") { e.preventDefault(); step(1); } else if (e.key === "ArrowUp" || e.key === "k") { e.preventDefault(); step(-1); }
    });
    scroller.focus({ preventScroll: true });
  }

  MV.Views.feed = feed;
})();
