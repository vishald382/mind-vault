/* Coaching: offline heuristic analysis of retellings/explanations/conversation replies,
   optional Claude enhancement (user-supplied key), and voice input. */
(function () {
  const STOP = new Set("the a an and or but if then of to in on at for with by from as is are was were be been it its this that these those he she they them his her their you your we our i me my not no so do does did had has have will would could should can may might into out up down over under about than too very just also only who whom which what when where why how there here one two".split(" "));
  const FILLERS = ["um", "uh", "er", "erm", "like", "basically", "actually", "literally", "you know", "sort of", "kind of", "i mean", "so yeah", "right", "okay so", "anyway"];
  const TENSION = "danger fear afraid threat desperate trapped attack shot killed died death war crisis panic exhausted heat stifling bomb fire chaos failed disaster doom dread shock suddenly nervous tense risk deadly fatal lost".split(" ");
  const RELEASE = "finally saved survived stopped ended solved realised realized learned lesson means shows meaning therefore turned won peace calm relief changed answer surfaced cancelled".split(" ");
  const CONTRAST = "but until then suddenly instead yet however except unexpectedly meanwhile".split(" ");
  const BEAT_LABELS = { hook: "hook", setting: "setting", character: "characters", conflict: "conflict", surprise: "surprise", turning: "turning point", payoff: "payoff", meaning: "meaning" };

  const words = t => (t.toLowerCase().match(/[a-z0-9'’$%-]+/g) || []);
  const sents = t => t.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const content = t => [...new Set(words(t).filter(w => w.length > 4 && !STOP.has(w)))];
  const clamp = x => Math.max(0, Math.min(100, Math.round(x)));
  const overlap = (keys, set) => keys.filter(k => set.has(k) || [...set].some(w => w.length > 5 && k.length > 5 && (w.startsWith(k.slice(0, 6)) || k.startsWith(w.slice(0, 6))))).length;
  function fillers(text) {
    const low = " " + text.toLowerCase().replace(/[^a-z' ]+/g, " ") + " "; const found = {}; let n = 0;
    FILLERS.forEach(f => { const m = low.split(" " + f + " ").length - 1; if (m > 0) { if (f === "like" || f === "right" || f === "actually") { const c = Math.floor(m / 2); if (!c) return; found[f] = c; n += c; } else { found[f] = m; n += m; } } });
    return { n, found };
  }
  const first = (lbl, arr) => arr && arr.length ? arr : null;
  function clarityScore(ss, ws) {
    if (!ss.length) return 0; const avg = ws / ss.length;
    const long = ss.filter(s => words(s).length > 35).length;
    return clamp(100 - Math.max(0, Math.abs(avg - 15) - 6) * 4 - long * 12);
  }

  function analyzeStory(text, story, { target = "90s", secs = null } = {}) {
    const ws = words(text), n = ws.length, ss = sents(text), set = new Set(ws);
    const tgtWords = { "30s": 75, "90s": 225, "3min": 450 }[target];
    const beats = target === "30s" ? ["hook", "surprise", "payoff", "meaning"] : Object.keys(BEAT_LABELS);
    // hook
    const head = new Set(words(ss[0] || "").concat(ws.slice(0, 28)));
    const hookKeys = content(story.hook + " " + story.surprise), settKeys = content(story.setting + " " + story.character);
    const hh = overlap(hookKeys, head), sh = overlap(settKeys, head);
    const bgFirst = sh >= 3 && hh < 2, startsFiller = /^(so|um|uh|well|okay|ok|alright|let me|basically|yeah)\b/i.test(text.trim());
    const hook = clamp(30 + (hh >= 3 ? 45 : hh >= 1 ? 28 : 0) + ((ss[0] ? words(ss[0]).length : 99) <= 25 ? 15 : 0) - (startsFiller ? 15 : 0) - (bgFirst ? 15 : 0));
    // structure
    const present = [], pos = {};
    beats.forEach(b => { const k = content(story[b]).slice(0, 8); const hit = overlap(k, set); if (k.length && hit / Math.min(6, k.length) >= 0.3) { present.push(b); const p = ws.findIndex(w => k.some(x => w.startsWith(x.slice(0, 6)))); pos[b] = p; } });
    let ordered = 0, pairs = 0, prev = -1; present.forEach(b => { if (pos[b] >= 0) { pairs++; if (pos[b] >= prev) ordered++; prev = Math.max(prev, pos[b]); } });
    const missingBeats = beats.filter(b => !present.includes(b));
    const structure = clamp(present.length / beats.length * 68 + (pairs ? ordered / pairs : 0) * 32);
    // accuracy
    const low = text.toLowerCase(); const missFacts = story.facts.filter(alts => !alts.some(a => low.includes(a)));
    const accuracy = clamp((1 - missFacts.length / story.facts.length) * 100);
    // clarity / pacing / filler
    const clarity = clarityScore(ss, n);
    const wpm = secs && secs > 3 ? Math.round(n / secs * 60) : null;
    let pacing; if (wpm) pacing = clamp(100 - Math.max(0, Math.max(110 - wpm, wpm - 170)) * 1.6); else { const r = n / tgtWords; pacing = clamp(100 - Math.max(0, Math.max(0.7 - r, r - 1.3)) * 120); }
    const fl = fillers(text), rate = n ? fl.n / n * 100 : 0, filler = clamp(100 - rate * 14);
    // vocabulary, engagement, emotion, ending
    const vh = story.vocab.filter(v => low.includes(v.toLowerCase().slice(0, 6))).length, ttr = n ? new Set(ws).size / n : 0;
    const vocabulary = clamp(35 + (vh / story.vocab.length) * 35 + Math.min(30, Math.max(0, ttr - 0.45) * 90));
    const contrast = ws.filter(w => CONTRAST.includes(w)).length, qs = (text.match(/\?/g) || []).length, digits = (text.match(/\b\d[\d,.]*\b/g) || []).length;
    const names = (text.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}/g) || []).length;
    const engagement = clamp(25 + Math.min(2, contrast) * 14 + Math.min(2, qs) * 12 + Math.min(3, names) * 7 + Math.min(2, digits) * 8);
    const third = Math.max(1, Math.floor(n / 3)), mid = ws.slice(third, 2 * third), last = ws.slice(2 * third), early = ws.slice(0, third);
    const cnt = (arr, lex) => arr.filter(w => lex.some(l => w.startsWith(l.slice(0, 5)))).length;
    const tm = cnt(mid, TENSION), te = cnt(early, TENSION), rl = cnt(last, RELEASE);
    const emotion = clamp(25 + (tm + te > 0 ? 30 : 0) + (tm >= te ? 10 : 0) + (rl > 0 ? 30 : 0) + (cnt(last, TENSION) > rl ? -10 : 5));
    const tail = ss.slice(-2).join(" ").toLowerCase(), mk = content(story.meaning);
    const lessonMark = /\b(shows|means|lesson|reminds|teaches|why|because|the point|moral|takeaway)\b/.test(tail);
    const weakEnd = /(yeah|that's it|that's all|anyway|i guess|or something)[.!\s]*$/i.test(text.trim());
    const ending = clamp(25 + Math.min(45, overlap(mk, new Set(words(tail))) * 22) + (lessonMark ? 25 : 0) - (weakEnd ? 20 : 0));
    const scores = { hook, structure, accuracy, clarity, pacing, filler, vocabulary, engagement, emotion, ending };
    const W = { accuracy: .2, structure: .15, hook: .15, clarity: .1, pacing: .08, filler: .07, vocabulary: .05, engagement: .08, emotion: .05, ending: .07 };
    const overall = clamp(Object.entries(W).reduce((s, [k, w]) => s + scores[k] * w, 0));
    // coaching
    const tips = {
      hook: bgFirst ? `You started with too much background. Start with the surprising event: “${story.hook}”` : `Your opening is not strong enough yet. Start with the hook: “${story.hook}”`,
      structure: missingBeats.length ? `You left out the ${missingBeats.slice(0, 3).map(b => BEAT_LABELS[b]).join(", ")}. A full story has these parts: hook, setting, character, conflict, surprise, turning point, payoff, meaning.` : "Keep the parts in order: hook, setting, character, conflict, surprise, turning point, payoff, meaning.",
      accuracy: missFacts.length ? `Check the facts. You did not mention ${missFacts.slice(0, 3).map(f => "“" + f[0] + "”").join(", ")}.` : "Make the facts more exact.",
      clarity: `Your sentences are long (about ${(n / Math.max(1, ss.length)).toFixed(0)} words each). Break them into shorter ones.`,
      pacing: wpm ? (wpm > 170 ? `You spoke at ${wpm} words a minute. That is fast. Slow down before the surprise.` : `You spoke at ${wpm} words a minute. That is slow. Say each sentence with confidence.`) : (n < tgtWords * 0.7 ? `That is too short for the ${target} version (aim for about ${tgtWords} words). Add details that help the listener see the story.` : `That is too long for the ${target} version (aim for about ${tgtWords} words). Remove the least important details.`),
      filler: `I counted ${fl.n} filler words${Object.keys(fl.found).length ? " (" + Object.entries(fl.found).map(([k, v]) => `${k} ×${v}`).join(", ") + ")" : ""}. Take a short silent pause instead.`,
      vocabulary: `Use one or two stronger words. Try “${story.vocab[0]}”.`,
      engagement: "Add a contrast (“but…”, “until…”) and a clear detail (a name, a number). This keeps the listener interested.",
      emotion: "Build up the tension first. Describe the danger before you tell how it ended.",
      ending: `Finish clearly with the meaning of the story: “${story.meaning}”`
    };
    const order = Object.keys(scores).sort((a, b) => (100 - scores[b]) * (W[b] + .03) - (100 - scores[a]) * (W[a] + .03));
    const weak = order.filter(k => scores[k] < 70).slice(0, 2);
    const best = Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
    const open = accuracy >= 70 ? "You know the story." : scores[best] >= 70 ? `Good ${best}.` : "A good start.";
    const coaching = [open, ...(weak.length ? weak.map(k => tips[k]) : ["You told it well. Now try the 30-second version."])].join(" ");
    return { kind: "story", target, scores, overall, coaching, wpm, fillers: fl, missing: { beats: missingBeats.map(b => BEAT_LABELS[b]), facts: missFacts.map(f => f[0]) }, words: n };
  }

  function analyzeExplain(text, asset, level = "2min", secs = null) {
    const ws = words(text), n = ws.length, ss = sents(text), low = text.toLowerCase();
    const chain = asset.chain || [];
    const hits = chain.filter(([, keys]) => keys.some(k => low.includes(k))), missing = chain.filter(c => !hits.includes(c)).map(c => c[0]);
    const miscon = (asset.mis || []).filter(m => new RegExp(m.re, "i").test(text));
    const accuracy = clamp((chain.length ? hits.length / chain.length : 0.7) * 100 - miscon.length * 18);
    const causalN = (low.match(/\b(because|so|therefore|which means|that means|leads? to|led to|as a result|since|causes?|caused|results? in|resulting|thus|if)\b/g) || []).length;
    const causal = clamp(ss.length < 2 && n < 18 ? 20 : 25 + Math.min(5, causalN) * 15);
    const clarity = clarityScore(ss, n);
    const unexplained = (asset.jargon || []).filter(j => { const i = low.indexOf(j.toLowerCase()); if (i < 0) return false; if (level === "10yo") return true; return !/(which is|meaning|means|that is|i\.e|in other words|called|\(|—|,\s*or\b)/.test(low.slice(i + j.length, i + j.length + 70)); });
    const longRatio = n ? ws.filter(w => w.length >= 10).length / n : 0;
    const jargon = clamp(100 - unexplained.length * 28 - Math.max(0, longRatio - 0.08) * 220);
    const range = { "30s": [30, 110], "2min": [90, 340], "10yo": [35, 130] }[level] || [50, 340];
    const lenFit = n < range[0] ? 100 - (range[0] - n) * 1.5 : n > range[1] ? 100 - (n - range[1]) * 0.6 : 100;
    const avgWl = n ? ws.join("").length / n : 5, analogy = /\b(like|imagine|pretend|picture|think of|as if|it's a bit like)\b/.test(low);
    const simplify = clamp(level === "10yo" ? lenFit * 0.5 + (avgWl <= 4.8 ? 30 : Math.max(0, 30 - (avgWl - 4.8) * 40)) + (analogy ? 20 : 0) : lenFit);
    const scores = { accuracy, causal, clarity, jargon, simplify };
    const overall = clamp(accuracy * .35 + causal * .2 + clarity * .15 + jargon * .15 + simplify * .15);
    const tips = [];
    if (missing.length) tips.push(`Missing point${missing.length > 1 ? "s" : ""}: ${missing.slice(0, 2).join("; ")}.`);
    if (miscon.length) tips.push(miscon[0].msg);
    if (causal < 55) tips.push("Join the steps with “because” and “so”. Show how it works, not only the facts.");
    if (unexplained.length) tips.push(`Explain the difficult word “${unexplained[0]}” in simple words.`);
    if (level === "10yo" && !analogy) tips.push("For a 10-year-old, use a simple comparison (“imagine…”).");
    if (n < range[0]) tips.push("Too short. Say a little more.");
    if (n > range[1]) tips.push("Too long for this level. Keep only the most important steps.");
    const pass = overall >= 60 && accuracy >= 50;
    const coaching = (pass ? "Good, clear explanation. " : "Not yet. ") + (tips.slice(0, 3).join(" ") || "Try the next level.");
    return { kind: "explain", level, scores, overall, coaching, pass, missing, words: n, wpm: secs && secs > 3 ? Math.round(n / secs * 60) : null };
  }

  function analyzeUse(text, asset) {
    const w = asset.word, n = words(text).length, used = new RegExp("\\b" + w.slice(0, Math.max(5, w.length - 2)), "i").test(text);
    const overall = clamp((used ? 62 : 5) + (n >= 8 ? 18 : 0) + (/(because|,|but|although)/i.test(text) ? 12 : 0) + (n >= 12 ? 8 : 0));
    return { kind: "explain", level: "use", scores: { accuracy: overall }, overall, pass: used && n >= 6, coaching: !used ? `Use the word “${w}” in your sentence.` : n < 6 ? "Make the sentence a little longer, so it shows what the word means." : "Natural and correct. Try using it in conversation this week." };
  }

  function analyzeConvo(text, asset) {
    const ws = words(text), n = ws.length, low = text.toLowerCase();
    const listen = /\b(that reminds|reminds me|speaking of|funny you|that's interesting|that's true|good point|on that|i was (just )?(reading|thinking)|i heard you|sounds like|makes me think)\b/.test(low);
    const connect = listen || /\b(similar|same|like|connects?|reminds|parallel|version of)\b/.test(low);
    const contribute = (asset.chain || []).some(([, k]) => k.some(x => low.includes(x))) && n >= 12 && n <= 85;
    const ask = /\?/.test(text);
    const dump = n > 95 || /^(did you know|actually|fun fact|well, actually)/i.test(text.trim());
    const ticks = { listen: listen, connect: connect, contribute, ask };
    const overall = clamp(Object.values(ticks).filter(Boolean).length * 25 - (dump ? 15 : 0));
    const tips = [];
    if (dump) tips.push("You are listing facts without listening. Make it shorter, and start with what they said.");
    if (!listen) tips.push("First show that you heard them (“That reminds me of…”). LISTEN before you CONTRIBUTE.");
    if (!contribute && !dump) tips.push(n < 12 ? "Share one clear fact or story, so they have something to think about." : "Include the main fact, in about 20 to 60 words.");
    if (!ask) tips.push("End with a question, so they can speak next.");
    return { kind: "convo", scores: ticks, overall, pass: overall >= 70 && !dump, coaching: tips.length ? tips.join(" ") : "Well done. You did all four: LISTEN, CONNECT, CONTRIBUTE, ASK. You shared your idea and still let them speak." };
  }

  /* Optional Claude enhancement */
  const AI = {
    available: () => !!(MV.E.S.prefs && MV.E.S.prefs.apiKey),
    async evaluate(kind, text, ref) {
      const key = MV.E.S.prefs.apiKey; if (!key) return null;
      const sys = "You are a warm, precise coach for an app that helps people truly understand and tell what they learn. Reply with ONLY compact JSON: {\"scores\":{...0-100 ints},\"overall\":int,\"coaching\":\"2-3 sentences, concrete, kind but honest\"}.";
      const rubric = kind === "story" ? "Score: hook, structure, accuracy, clarity, pacing, filler, vocabulary, engagement, emotion, ending. Reference story beats: " + JSON.stringify(ref) :
        "Score: accuracy, causal, clarity, jargon, simplify (fit for the stated audience). Reference concept: " + JSON.stringify(ref);
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 700, system: sys, messages: [{ role: "user", content: rubric + "\n\nUser's attempt:\n" + text }] }) });
      if (!res.ok) throw new Error("API " + res.status);
      const j = await res.json(); const t = (j.content || []).map(c => c.text || "").join(""); const m = t.match(/\{[\s\S]*\}/); return JSON.parse(m[0]);
    }
  };

  /* Voice input */
  const Mic = {
    supported: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    attach(textarea, btn, status) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const h = { start: null, secs: null, rec: null };
      if (!SR) { btn.disabled = true; btn.title = "Voice input needs Chrome or Edge. You can type instead."; return h; }
      let on = false, base = "";
      btn.onclick = () => {
        if (on) { h.rec.stop(); return; }
        const r = h.rec = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-US"; base = textarea.value ? textarea.value + " " : "";
        r.onresult = e => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; textarea.value = base + t; textarea.dispatchEvent(new Event("input")); };
        r.onend = () => { on = false; btn.classList.remove("rec"); btn.textContent = "🎙 Speak"; if (h.start) h.secs = (h.secs || 0) + (Date.now() - h.start) / 1000; h.start = null; if (status) status.textContent = ""; };
        r.onerror = () => { if (status) status.textContent = "The mic is not working. Please type instead."; };
        r.start(); on = true; h.start = Date.now(); btn.classList.add("rec"); btn.textContent = "■ Stop"; if (status) status.textContent = "Listening…";
      };
      return h;
    }
  };

  MV.Coach = { analyzeStory, analyzeExplain, analyzeUse, analyzeConvo, fillers, words, BEAT_LABELS };
  MV.AI = AI; MV.Mic = Mic;
})();
