/* Session runner: every step records evidence on the mastery ladder. */
(function () {
  const E = MV.E, { h, toast, stateBadge, ladder, scoreBars, bar, nav, dom } = MV.UI, C = MV.Coach;
  const WILD = [["mention", "I talked about it in a conversation"], ["taught", "I taught it to someone"], ["connected", "I connected it to something else"], ["noticed", "I noticed it in real life"], ["decision", "I used it to make a decision"], ["none", "I have not used it yet"]];
  const ses = { plan: null, i: 0, changes: null, conn0: 0, started: 0, results: [] };
  MV.session = ses;

  function start(plan) {
    ses.plan = plan; ses.ended = false; ses.i = 0; ses.results = []; ses.started = Date.now(); ses.conn0 = E.S.conns.length;
    ses.changes = E.trackChanges(true); E.logEvent({ k: "session", intent: plan.intent, minutes: plan.minutes, steps: plan.steps.length });
    const same = location.hash === "#/session"; nav("#/session"); if (same) window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  function startSteps(steps, title) { start({ title: title || "Practice", intent: "custom", minutes: 0, steps: steps.map(s => Object.assign({ est: E.EST[s.kind] || 2, label: s.label || "Practice" }, s)), est: 0 }); }

  function render(root) {
    if (!ses.plan) { root.append(h("div", { class: "card center" }, h("h2", {}, "No session is running"), h("a", { class: "btn primary", href: "#/today" }, "Start a session"))); return; }
    const { plan } = ses; const total = plan.steps.length;
    if (ses.i >= total) return renderSummary(root);
    const step = plan.steps[ses.i], a = E.asset(step.id);
    const wrap = h("div", { class: "stage" });
    wrap.append(h("div", { class: "row between small muted mb" }, h("span", {}, plan.title), h("span", {}, `Step ${ses.i + 1} of ${total} · about ${Math.max(1, Math.round(plan.steps.slice(ses.i).reduce((s, x) => s + x.est, 0)))} min left`)),
      h("div", { class: "stepper" }, plan.steps.map((_, k) => h("i", { class: k < ses.i ? "done" : k === ses.i ? "cur" : "" }))));
    const card = h("div", { class: "card" }); wrap.append(card);
    const next = () => { ses.i++; rerender(); };
    const R = { learn, recognize, recall, rescue: recall, explain, explain10: explain, connect, story, convo, apply, challenge }[step.kind];
    card.append(h("div", { class: "row between" }, h("div", { class: "eyebrow" }, labelFor(step)), h("div", { class: "row" }, step.surprise ? h("span", { class: "badge sur" }, "Surprise") : null, step.gap ? h("span", { class: "badge gap" }, "Gap") : null)));
    R(card, step, a, next);
    wrap.append(h("div", { class: "row between mt" }, h("button", { class: "btn ghost sm", onclick: () => { if (confirm("End this session?")) { ses.ended = true; ses.i = total; rerender(); } } }, "End session"), h("button", { class: "btn ghost sm", onclick: next }, "Skip this step →")));
    root.append(wrap);
  }
  function labelFor(step) {
    return ({ learn: "LEARN · UNDERSTAND", recognize: "QUICK CHECK", recall: "REMEMBER IT", rescue: "RESCUE THIS IDEA", explain: "EXPLAIN IT", explain10: "EXPLAIN IT SIMPLY", connect: "CONNECT", story: "STORYTELLING COACH", convo: "CONVERSATION CAPITAL", apply: "USING IDEAS IN REAL LIFE", challenge: "TEST YOUR THINKING" })[step.kind] || step.label;
  }
  function rerender() { const v = MV.UI.$("#view"); v.innerHTML = ""; render(v); v.scrollTo?.(0, 0); window.scrollTo(0, 0); }
  const cont = (card, next, label = "Continue →") => card.append(h("div", { class: "row mt", style: "justify-content:flex-end" }, h("button", { class: "btn primary", onclick: next }, label)));

  /* ----- steps ----- */
  function learn(card, step, a, next) {
    const br = E.bridgeFor(a.id);
    card.append(h("h2", {}, a.title), h("div", { class: "row small muted mb" }, dom(a.domain), "·", a.type));
    card.append(h("div", { class: "field" }, h("div", { class: "k" }, "The idea"), h("p", { class: "lede" }, a.fact)),
      h("div", { class: "field" }, h("div", { class: "k" }, "Why it matters"), h("p", {}, a.why)),
      h("div", { class: "field" }, h("div", { class: "k" }, "How it works"), h("p", {}, a.mech)));
    if (a.models.length) card.append(h("div", { class: "row small mb" }, h("span", { class: "muted" }, "Thinking tool in this idea:"), a.models.map(m => h("span", { class: "chip static" }, E.model(m).name))));
    if (br) card.append(h("div", { class: "callout teal mb" }, h("b", {}, "You already know something that helps explain this. "), h("br"), h("span", {}, `“${E.asset(br.other).title}”: ${br.note}`)));
    else if (step.surprise) card.append(h("div", { class: "callout violet mb" }, "Which idea from a different field could help to explain this? Keep this question in mind. You will connect the ideas next."));
    const q = a.type === "vocabulary item" ? "" : "Before you go on: can you say in one sentence, in your own words, why this happened?";
    if (q) card.append(h("p", { class: "muted small" }, q));
    cont(card, () => {
      const first = !E.has(a.id, "seen"); E.mark(a.id, "seen"); E.touch(a.id, 1, "seen");
      if (first) E.logEvent({ k: "learn", id: a.id, surprise: !!step.surprise });
      next();
    }, "I understand. Test me →");
  }

  function recognize(card, step, a, next) {
    const opts = E.shuffle(a.mcq.o.map((t, i) => ({ t, ok: i === 0 })));
    card.append(h("h3", {}, a.mcq.q), h("div", { class: "muted small mb" }, a.title));
    const fb = h("div"); let done = false;
    const btns = opts.map(o => h("button", { class: "opt", onclick: () => {
      if (done) return; done = true;
      btns.forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add("right"); else if (b === btns[opts.indexOf(o)]) b.classList.add("wrong"); });
      if (o.ok) { E.mark(a.id, "recognized"); E.touch(a.id, 2, "recognize"); fb.append(h("p", { class: "sl-ok" }, "Correct. You know this one."));
      } else { E.touch(a.id, 0, "recognize"); fb.append(h("p", { class: "sl-bad" }, "Not correct. You will see it again soon.")); }
      cont(fb, next);
    } }, o.t));
    card.append(btns, fb);
  }

  function recall(card, step, a, next) {
    const rescue = step.kind === "rescue", m = E.mem(a.id);
    if (rescue) card.append(h("div", { class: "callout coral mb" }, h("b", {}, "Chance of forgetting: " + Math.round((1 - (m ? m.R : 1)) * 100) + "%. "), `You spent time learning “${a.title}”. Bring it back before you forget it.`));
    card.append(h("h3", {}, a.q), h("div", { class: "muted small mb" }, a.title + " · say or type your answer before you see the correct one"));
    const ta = h("textarea", { placeholder: "What do you remember? (You can skip this, but typing helps you remember)", style: "min-height:90px" });
    const out = h("div");
    const reveal = h("button", { class: "btn primary", onclick: () => {
      reveal.remove(); ta.readOnly = true;
      const low = ta.value.toLowerCase(), chain = a.chain, hit = chain.filter(([, k]) => k.some(x => low.includes(x)));
      out.append(h("div", { class: "callout mb" }, h("b", {}, "Answer: "), a.a));
      if (ta.value.trim().length > 8) out.append(h("p", { class: "small muted" }, `You covered ${hit.length} of ${chain.length} key points` + (hit.length < chain.length ? ". You missed: " + chain.filter(c => !hit.includes(c)).map(c => c[0]).join(", ") : ". Well done.")));
      out.append(h("p", { class: "small" }, "How did you do?"), h("div", { class: "row" }, [[0, "Forgot it", ""], [1, "Almost", ""], [2, "Got it", "primary"]].map(([g, l, c]) => h("button", { class: "btn " + c, onclick: () => {
        E.touch(a.id, g, rescue ? "rescue" : "recall");
        if (g === 2) { E.mark(a.id, "recognized"); E.mark(a.id, "recalled"); }
        toast(g === 2 ? "Your memory is stronger. The next practice will come later." : g === 1 ? "Noted. You will see it again sooner." : "You will practise this again soon. Seeing it again helps you remember.");
        next();
      } }, l))));
    } }, "Show answer");
    card.append(ta, h("div", { class: "row mt" }, reveal), out);
  }

  function explain(card, step, a, next) {
    const vocab = a.type === "vocabulary item"; let level = vocab ? "use" : (step.level || "2min"); let attempt = 0;
    const body = h("div"); card.append(body);
    const LV = { "30s": ["In 30 seconds", "Say the main point and how it works. No long introduction."], "2min": ["In 2 minutes", "Explain the cause and the effect, step by step. Why does it happen?"], "10yo": ["To a 10-year-old", "No difficult words. Use a picture or a comparison."], use: ["In a sentence", "Use the word in a natural sentence that makes its meaning clear."] };
    function draw() {
      body.innerHTML = ""; attempt++;
      body.append(h("h2", {}, vocab ? `Use “${a.title}”` : a.title));
      if (!vocab) body.append(h("p", { class: "lede" }, a.q), h("div", { class: "tabs" }, ["30s", "2min", "10yo"].map(l => h("button", { class: "chip" + (l === level ? " on" : ""), onclick: () => { level = l; draw(); } }, LV[l][0]))));
      body.append(h("p", { class: "muted small" }, LV[level][1]));
      const ta = h("textarea", { placeholder: "Type here, or tap Speak and explain out loud.", "aria-label": "Your explanation" }), st = h("span", { class: "tiny muted" });
      const mic = h("button", { class: "btn sm", type: "button" }, "🎙 Speak"); const mh = MV.Mic.attach(ta, mic, st);
      const res = h("div", { class: "mt" }); const wc = h("span", { class: "tiny muted" });
      ta.addEventListener("input", () => wc.textContent = C.words(ta.value).length + " words");
      const go = h("button", { class: "btn primary", onclick: async () => {
        if (C.words(ta.value).length < 4) return toast("Write or say a little more first.");
        go.disabled = true; go.textContent = "Reading it carefully…";
        let r = vocab ? C.analyzeUse(ta.value, a) : C.analyzeExplain(ta.value, a, level, mh.secs);
        let enh = false;
        if (!vocab && MV.AI.available()) { try { const j = await MV.AI.evaluate("explain", ta.value + "\n(Audience: " + LV[level][0] + ")", { title: a.title, mechanism: a.mech, chain: a.chain.map(c => c[0]) }); if (j && j.coaching) { r = Object.assign(r, { scores: j.scores || r.scores, overall: j.overall ?? r.overall, coaching: j.coaching, pass: (j.overall ?? r.overall) >= 60 }); enh = true; } } catch (e) { /* fall back */ } }
        go.disabled = false; go.textContent = "Check again";
        E.S.attempts.push({ id: a.id, t: Date.now(), kind: "explain", level: level === "use" ? "use" : level, overall: r.overall, pass: r.pass, scores: r.scores, text: ta.value.slice(0, 1500) }); E.save();
        evidence(a, r, level);
        res.innerHTML = ""; res.append(h("div", { class: "card", style: "background:var(--panel2)" },
          h("div", { class: "row between" }, h("h3", {}, r.pass ? "Well done. You understand it and can explain it." : "Not yet. Fix the missing parts."), h("span", { class: "num sm " + (r.pass ? "sl-ok" : "gold") }, r.overall)),
          scoreBars(r.scores, { accuracy: "Correct facts", causal: "Cause and effect", clarity: "Clear sentences", jargon: "Simple words", simplify: "Short and simple" }),
          r.missing && r.missing.length ? h("p", { class: "small" }, h("b", {}, "Missing points: "), r.missing.join(" · ")) : null,
          h("p", {}, r.coaching), enh ? h("span", { class: "tiny gold" }, "With extra feedback from Claude") : null,
          h("div", { class: "row mt" }, !vocab && r.pass && level !== "10yo" ? h("button", { class: "btn", onclick: () => { level = "10yo"; draw(); } }, "Make it harder: explain it to a 10-year-old") : null,
            !vocab && r.pass && level === "10yo" ? h("button", { class: "btn", onclick: () => { level = "30s"; draw(); } }, "Now try the 30-second version") : null,
            h("button", { class: "btn primary", onclick: next }, "Continue →"))));
      } }, "Check");
      body.append(ta, h("div", { class: "row between mt" }, h("div", { class: "row" }, mic, st), h("div", { class: "row" }, wc, go)), res);
      if (attempt === 1) ta.focus();
    }
    draw();
  }
  function evidence(a, r, level) {
    if (!r.pass) { E.touch(a.id, 0, "explain"); return; }
    E.touch(a.id, 2, "explain"); E.mark(a.id, "recognized"); E.mark(a.id, "recalled"); E.mark(a.id, "explained");
    const atts = E.S.attempts.filter(x => x.id === a.id && x.kind === "explain" && x.pass);
    if (a.type === "vocabulary item") { E.mark(a.id, "expressed"); return; }
    if (level === "10yo" && E.has(a.id, "explained") || atts.some(x => x.level === "10yo") && atts.some(x => x.level !== "10yo")) E.mark(a.id, "expressed");
  }

  function connect(card, step, a, next) {
    const body = h("div"); card.append(body);
    const corr = a.models, wrong = E.shuffle(MV.MODELS.filter(m => !corr.includes(m.id))), pick = E.shuffle(corr)[0];
    const opts = E.shuffle(pick ? [pick, ...wrong.slice(0, 3).map(m => m.id)] : []);
    const bridge = E.bridgeFor(a.id) || (() => { const n = E.neighbors(a.id)[0]; return n ? { other: n.id, note: n.note, kind: "link", unseen: true } : null; })();
    function phase2() {
      body.innerHTML = "";
      if (!bridge) { E.mark(a.id, "connected"); body.append(h("p", {}, "You connected it to its mental model. As you learn more, links to other ideas will appear.")); cont(body, next); return; }
      const o = E.asset(bridge.other);
      body.append(h("div", { class: "callout teal mb" }, h("b", {}, "You already know something that helps explain this."), h("br"), bridge.unseen ? `A related idea: ` : "", h("b", {}, o.title), ": ", o.fact),
        h("h3", {}, `How can “${o.title}” help to explain “${a.title}”?`), h("p", { class: "muted small" }, "Write one or two sentences. What is the same in both: how they work, why people act that way, or a pattern?"));
      const ta = h("textarea", { style: "min-height:90px", placeholder: "They both…" }), out = h("div", { class: "mt" });
      const go = h("button", { class: "btn primary", onclick: () => {
        if (C.words(ta.value).length < 6) return toast("Write a little more. What is the same in both?");
        go.remove(); ta.readOnly = true;
        out.append(h("div", { class: "callout mb" }, h("b", {}, "One known link: "), bridge.note));
        const ok = E.addConnection(a.id, o.id, ta.value.trim(), "user");
        out.append(h("p", { class: "sl-ok" }, ok ? "Connection saved to your knowledge graph." : "You already made this connection. Explaining it again makes it stronger."));
        if (!ok) { E.mark(a.id, "connected"); E.mark(o.id, "connected"); }
        if (MV.E.assets().find(x => x.id === o.id).domain !== a.domain) out.append(h("p", { class: "small gold" }, "This connects two different fields. Connections like this make your thinking wider."));
        cont(out, next);
      } }, "Make the connection");
      body.append(ta, h("div", { class: "row mt", style: "justify-content:flex-end" }, go), out);
    }
    if (!opts.length) return phase2();
    body.append(h("h2", {}, a.title), h("h3", {}, "Which mental model does this idea show?"), h("p", { class: "muted small" }, a.fact));
    const fb = h("div"); let done = false;
    const btns = opts.map(id => h("button", { class: "opt", onclick: () => {
      if (done) return; done = true;
      btns.forEach((b, i) => { b.disabled = true; if (corr.includes(opts[i])) b.classList.add("right"); else if (opts[i] === id) b.classList.add("wrong"); });
      if (corr.includes(id)) { E.tagModel(a.id, id); fb.append(h("p", { class: "sl-ok" }, `Yes: ${E.model(id).name}. ${E.model(id).line}`)); } else fb.append(h("p", { class: "sl-bad" }, "Not this one. The correct answer is highlighted: " + corr.map(m => E.model(m).name).join(", ") + "."));
      cont(fb, phase2);
    } }, h("b", {}, E.model(id).name), h("span", { class: "small muted" }, " · " + E.model(id).line)));
    body.append(btns, fb);
  }

  function story(card, step, a, next) {
    const st = E.storyOfAsset(a.id); if (!st) { card.append(h("p", {}, "This idea has no story.")); cont(card, next); return; }
    let target = "90s", peeked = false, n = 0;
    const body = h("div"); card.append(body);
    const secsT = { "30s": 30, "90s": 90, "3min": 180 };
    function draw() {
      body.innerHTML = ""; n++;
      const hist = E.S.attempts.filter(x => x.kind === "story" && x.id === st.id);
      body.append(h("h2", {}, `“${st.title}”`), h("p", { class: "lede" }, "Tell me the story without looking."),
        h("div", { class: "tabs" }, ["30s", "90s", "3min"].map(l => h("button", { class: "chip" + (l === target ? " on" : ""), onclick: () => { target = l; draw(); } }, l === "3min" ? "3-minute version" : l + " version"))),
        h("details", { class: "mb" }, h("summary", { onclick: () => peeked = true }, "Look at the Story DNA (then this attempt counts only as practice)"), dna(st)));
      const ta = h("textarea", { style: "min-height:150px", placeholder: "Start with the hook. Say it aloud (this is best) or type it." }), status = h("span", { class: "tiny muted" });
      const mic = h("button", { class: "btn sm", type: "button" }, "🎙 Speak"); const mh = MV.Mic.attach(ta, mic, status), res = h("div", { class: "mt" });
      const go = h("button", { class: "btn primary", onclick: async () => {
        if (C.words(ta.value).length < 10) return toast("Tell a little more of the story first.");
        go.disabled = true; go.textContent = "Checking your story…";
        let r = C.analyzeStory(ta.value, st, { target, secs: mh.secs }); let enh = false;
        if (MV.AI.available()) { try { const j = await MV.AI.evaluate("story", ta.value + `\n(Target: ${target} version)`, st); if (j && j.coaching) { r = Object.assign(r, { scores: Object.assign({}, r.scores, j.scores || {}), overall: j.overall ?? r.overall, coaching: j.coaching }); enh = true; } } catch (e) { /* fallback */ } }
        go.disabled = false; go.textContent = "Check again";
        const prev = hist.length ? hist[hist.length - 1].overall : null;
        E.S.attempts.push({ id: st.id, t: Date.now(), kind: "story", level: target, overall: r.overall, scores: r.scores, pass: r.overall >= 70 && r.scores.accuracy >= 60, text: ta.value.slice(0, 2500) }); E.save();
        if (r.overall >= 70 && r.scores.accuracy >= 60 && !peeked) { ["recognized", "recalled"].forEach(k => E.mark(a.id, k)); E.mark(a.id, "story"); }
        const hh2 = E.S.attempts.filter(x => x.kind === "story" && x.id === st.id).map(x => x.overall);
        res.innerHTML = ""; res.append(h("div", { class: "card", style: "background:var(--panel2)" },
          h("div", { class: "row between" }, h("h3", {}, r.overall >= 70 ? "Story ready." : "Good start. Now make it better."), h("span", { class: "num sm gold" }, r.overall)),
          prev != null ? h("p", { class: "small " + (r.overall >= prev ? "sl-ok" : "muted") }, r.overall >= prev ? `▲ ${r.overall - prev} points better than your last attempt` : `▼ ${prev - r.overall} points lower than your last attempt. Keep going.`) : null,
          scoreBars(r.scores, { hook: "Hook", structure: "Order of parts", accuracy: "Correct facts", clarity: "Clear sentences", pacing: "Speed", filler: "Few filler words", vocabulary: "Word choice", engagement: "Holds interest", emotion: "Feeling", ending: "Ending" }),
          h("div", { class: "callout mb" }, r.coaching), enh ? h("span", { class: "tiny gold" }, "With extra feedback from Claude") : null,
          hh2.length > 1 ? h("div", {}, h("div", { class: "tiny muted" }, "Your attempts"), MV.UI.spark(hh2, "var(--gold)")) : null,
          peeked ? h("p", { class: "tiny muted" }, "You looked at the Story DNA, so this attempt will not count for Story Ready. Try once more without looking.") : null,
          h("div", { class: "row mt" }, h("button", { class: "btn", onclick: () => { peeked = false; draw(); } }, "TRY AGAIN"), h("button", { class: "btn primary", onclick: next }, "Continue →"))));
      } }, "Check");
      body.append(ta, h("div", { class: "row between mt" }, h("div", { class: "row" }, mic, status, h("span", { class: "tiny muted" }, `Aim for about ${secsT[target]} seconds`)), go), res);
    }
    draw();
  }
  const dna = st => h("div", { class: "grid g2" }, [["HOOK", "hook"], ["SETTING", "setting"], ["CHARACTER", "character"], ["CONFLICT", "conflict"], ["SURPRISE", "surprise"], ["TURNING POINT", "turning"], ["PAYOFF", "payoff"], ["MEANING", "meaning"]].map(([k, f]) => h("div", { class: "field" }, h("div", { class: "k" }, k), h("div", { class: "small" }, st[f]))));

  function convo(card, step, a, next) {
    card.append(h("h2", {}, a.title), h("div", { class: "callout mb" }, h("b", {}, "DO NOT JUST LIST FACTS. "), "LISTEN → CONNECT → CONTRIBUTE → ASK."));
    card.append(convoCard(a, true));
    card.append(h("hr"), h("h3", {}, "Your turn"), h("p", {}, `Someone talks about ${a.cue}. They say: “…and honestly, I have been thinking about that a lot these days.” Write a reply. Show that you heard them, connect to what they said, share your idea in a few words, and ask them a question.`));
    const ta = h("textarea", { style: "min-height:110px", placeholder: "Write your reply the way you would really say it…" }), res = h("div", { class: "mt" });
    const go = h("button", { class: "btn primary", onclick: () => {
      if (C.words(ta.value).length < 6) return toast("Write the reply you would really say.");
      const r = C.analyzeConvo(ta.value, a);
      E.S.attempts.push({ id: a.id, t: Date.now(), kind: "convo", overall: r.overall, pass: r.pass, scores: r.scores, text: ta.value.slice(0, 800) }); E.save();
      if (r.pass) { ["recognized", "recalled"].forEach(k => E.mark(a.id, k)); E.mark(a.id, "convo"); }
      res.innerHTML = ""; res.append(h("div", { class: "card", style: "background:var(--panel2)" }, h("h3", {}, r.pass ? "Conversation ready." : "Interesting, but it does not sound natural yet."),
        scoreBars(r.scores, { listen: "LISTEN: show you heard them", connect: "CONNECT: link to what they said", contribute: "CONTRIBUTE: one idea, in a few words", ask: "ASK: end with a question" }), h("p", {}, r.coaching), h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: next }, "Continue →"))));
    } }, "Check my reply");
    card.append(ta, h("div", { class: "row mt", style: "justify-content:flex-end" }, go), res);
  }
  function convoCard(a, open) {
    const st = E.storyOfAsset(a.id), rel = E.neighbors(a.id)[0];
    const F = (k, v) => h("div", { class: "field" }, h("div", { class: "k" }, k), h("div", {}, v));
    return h("div", {}, F("Fact", a.fact), F("Why it is interesting", a.why), F("How to bring it into a conversation", a.bring), F("A question to ask next", a.follow),
      F("Related story", st ? `“${st.title}”: ${st.hook}` : rel ? `${E.asset(rel.id).title}: ${rel.note}` : "None yet"), F("More detail", a.deeper));
  }
  MV.convoCard = convoCard;

  function apply(card, step, a, next) {
    card.append(h("h2", {}, "Did you use this?"), h("p", { class: "lede" }, a.title), h("p", { class: "muted small" }, a.fact));
    const note = h("input", { type: "text", placeholder: "Optional: what happened?" });
    card.append(WILD.map(([k, l]) => h("button", { class: "opt", onclick: () => { E.addApp(a.id, k, note.value, a.models[0]); toast(k === "none" ? "That's okay. Try it this week." : "Saved. You used this idea in real life."); next(); } }, l)), h("div", { class: "mt" }, note));
  }

  function challenge(card, step, a, next) {
    const m = E.model(step.model || "inversion");
    card.append(h("h2", {}, `Look at “${a.title}” using ${m.name}`), h("div", { class: "callout violet mb" }, h("b", {}, m.name + ": "), m.line),
      h("p", { class: "lede" }, m.ask), h("p", { class: "muted small" }, "Which idea from a different field could help to explain this? Test the idea: where does it stop working?"));
    const ta = h("textarea", { style: "min-height:110px" }), res = h("div", { class: "mt" });
    const go = h("button", { class: "btn primary", onclick: () => {
      if (C.words(ta.value).length < 12) return toast("Think a little more. Write at least 12 words.");
      E.tagModel(a.id, m.id); E.logEvent({ k: "challenge", id: a.id, model: m.id }); go.remove(); ta.readOnly = true;
      res.append(h("div", { class: "callout mb" }, h("b", {}, "An example of this model: "), m.ex), h("p", { class: "sl-ok" }, `You have now used ${m.name} on a real idea. This is how you make a model your own.`)); cont(res, next);
    } }, "Done");
    card.append(ta, h("div", { class: "row mt", style: "justify-content:flex-end" }, go), res);
  }

  /* ----- summary ----- */
  function renderSummary(root) {
    const ch = ses.changes || [], conns = E.S.conns.length - ses.conn0, c = E.counts();
    E.trackChanges(false);
    if (ses.plan && ses.plan.intent === "today5" && !ses.ended) MV.Daily.markFive();
    root.append(h("div", { class: "stage" }, h("div", { class: "card hl" }, h("div", { class: "eyebrow" }, "Session complete"), h("h2", {}, ch.length || conns ? "You moved ideas up the ladder." : "Time well spent. Knowledge grows when you practise again and again."),
      ch.length ? h("ul", { class: "list" }, ch.map(x => h("li", {}, h("b", {}, E.asset(x.id).title), " ", stateBadge(x.from), " → ", stateBadge(x.to)))) : h("p", { class: "muted" }, "No idea moved up a level this time. But practice still makes your memory stronger, even when the level stays the same."),
      conns ? h("p", {}, h("b", { class: "gold" }, conns + (conns > 1 ? " new connections" : " new connection")), " added to your knowledge graph.") : null,
      h("hr"), h("p", { class: "lede" }, `Your ${c.assets} knowledge assets have created ${c.conns} meaningful connections.`),
      h("div", { class: "row mt" }, h("a", { class: "btn primary", href: "#/portfolio" }, "See your portfolio"), h("a", { class: "btn", href: "#/today" }, "Back to Sessions")))));
    ses.plan = null;
  }

  MV.Session = { start, startSteps, render, WILD, dna };
})();
