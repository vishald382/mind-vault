/* Sync between devices, with no server of our own.
   Your learning history is kept in a private ("secret") GitHub gist in your own GitHub account.
   Each device needs the same sync key (a GitHub token that can only use gists). The key is stored
   only in this browser, never in the app's code. On every sync the two copies are merged, so
   progress made on either device is kept. */
(function () {
  const E = MV.E, { h, toast } = MV.UI;
  const KEY = "mindvault.sync", FILE = "mindvault-sync.json", API = "https://api.github.com";
  let cfg = {}; try { cfg = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };
  let busy = false, applying = false, timer = null, status = cfg.token ? "Waiting to sync" : "Off";
  const listeners = new Set(), setStatus = s => { status = s; listeners.forEach(f => f(s)); };
  const on = () => !!cfg.token;

  async function api(path, opts = {}) {
    const r = await fetch(API + path, Object.assign({}, opts, { headers: Object.assign({ Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json" }, opts.body ? { "Content-Type": "application/json" } : {}) }));
    if (r.status === 401 || r.status === 403) { const e = new Error("key"); e.code = r.status; throw e; }
    if (!r.ok) { const e = new Error("http " + r.status); e.code = r.status; throw e; }
    return r.json();
  }
  const sig = s => [Object.values(s.ev || {}).reduce((n, e) => n + Object.keys(e).length, 0), Object.values(s.rev || {}).reduce((n, l) => n + l.length, 0), (s.conns || []).length,
    Object.values(s.mlinks || {}).reduce((n, m) => n + Object.keys(m).length, 0), (s.apps || []).length, (s.attempts || []).length, (s.missions || []).filter(m => m.report).length + "/" + (s.missions || []).length,
    (s.events || []).length, Object.keys(s.daily || {}).length, s.resetAt || 0].join(".");

  async function findGist() {
    if (cfg.gistId) return cfg.gistId;
    const list = await api("/gists?per_page=100");
    const g = list.find(x => x.files && x.files[FILE]);
    if (g) cfg.gistId = g.id;
    else { const made = await api("/gists", { method: "POST", body: JSON.stringify({ description: "MindVault sync data. Made by the MindVault app. Please do not edit by hand.", public: false, files: { [FILE]: { content: E.syncPayload() } } }) }); cfg.gistId = made.id; }
    store(); return cfg.gistId;
  }
  async function pull() {
    const g = await api("/gists/" + await findGist()), f = g.files && g.files[FILE];
    if (!f) return null;
    const text = f.truncated ? await (await fetch(f.raw_url)).text() : f.content;
    try { const o = JSON.parse(text); return o && o.v === 1 ? o : null; } catch (e) { return null; }
  }
  async function sync(manual) {
    if (!on() || busy) return false;
    if (E.S.demo) { setStatus("Sync is paused while the sample history is loaded. Reset first."); return false; }
    if (!navigator.onLine) { setStatus("No internet. Will sync later."); return false; }
    busy = true; setStatus("Syncing…");
    try {
      const before = sig(E.S), remote = await pull();
      if (remote) { applying = true; try { E.mergeState(remote); } finally { applying = false; } }
      const after = sig(E.S);
      if (!remote || sig(remote) !== after) await api("/gists/" + cfg.gistId, { method: "PATCH", body: JSON.stringify({ files: { [FILE]: { content: E.syncPayload() } } }) });
      cfg.last = Date.now(); store(); setStatus("Synced " + new Date(cfg.last).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (after !== before) { toast("New progress from your other device was added."); if (!/^#\/session/.test(location.hash) && !/^#\/(feed)?$/.test(location.hash || "#/")) MV.App.render(); }
      else if (manual) toast("Sync done. Everything is up to date.");
      return true;
    } catch (e) {
      if (e.code === 404) { cfg.gistId = null; store(); setStatus("The saved copy was not found. Tap Sync now to make a new one."); }
      else setStatus(e.message === "key" ? "GitHub did not accept the sync key. It may be wrong or expired." : "Could not sync just now. Will try again.");
      if (manual) toast(status);
      return false;
    } finally { busy = false; }
  }
  async function turnOn(token) {
    cfg = { token: token.trim() }; store();
    try { await api("/user"); } catch (e) { cfg = {}; store(); setStatus("Off"); throw e; }
    return sync(true);
  }
  function turnOff() { cfg = {}; store(); setStatus("Off"); }

  // Sync soon after any change, when the app opens, and when you come back to it.
  MV.onSave = () => { if (!on() || applying) return; clearTimeout(timer); timer = setTimeout(() => sync(false), 15000); };
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(false); });
  window.addEventListener("online", () => sync(false));
  if (on()) setTimeout(() => sync(false), 1500);

  function card() {
    const st = h("span", { class: "small" }, status), upd = s => { st.textContent = s; };
    listeners.clear(); listeners.add(upd);
    if (on()) {
      return h("div", { class: "card" }, h("h3", {}, "Sync between devices"), h("p", { class: "small" }, h("b", {}, "Sync is on. "), st),
        h("p", { class: "small muted" }, "Your progress is saved in a private file in your GitHub account and merged on each device. To add another device, open MindVault there, go to Settings, and paste the same sync key."),
        h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => sync(true) }, "Sync now"),
          h("button", { class: "btn", onclick: () => { (navigator.clipboard ? navigator.clipboard.writeText(cfg.token) : Promise.reject()).then(() => toast("Sync key copied. Paste it on your other device."), () => window.prompt("Copy your sync key:", cfg.token)); } }, "Copy my sync key"),
          h("button", { class: "btn ghost", onclick: () => { if (confirm("Turn off sync on this device? Your progress stays on this device and in your GitHub account.")) { turnOff(); MV.App.render(); } } }, "Turn off")));
    }
    const inp = h("input", { type: "text", placeholder: "Paste your sync key here (starts with ghp_ or github_pat_)", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
    const go = h("button", { class: "btn primary", onclick: async () => {
      const t = inp.value.trim(); if (t.length < 20) return toast("Paste the full sync key first.");
      if (E.S.demo) return toast("Reset the sample history first (below), then turn on sync.");
      go.disabled = true; go.textContent = "Checking…";
      try { await turnOn(t); MV.App.render(); } catch (e) { toast(e.message === "key" ? "GitHub did not accept that key. Check that you copied all of it." : "Could not reach GitHub. Check your internet and try again."); go.disabled = false; go.textContent = "Turn on sync"; }
    } }, "Turn on sync");
    return h("div", { class: "card" }, h("h3", {}, "Sync between devices"),
      h("p", { class: "small muted" }, "Keep the same progress on your phone and your computer. MindVault has no server of its own, so your progress is saved in a private file in your own GitHub account. You set it up once on each device."),
      h("ol", { class: "small" },
        h("li", {}, h("a", { href: "https://github.com/settings/tokens/new?scopes=gist&description=MindVault%20sync", target: "_blank", rel: "noopener" }, "Open this GitHub page"), " and sign in."),
        h("li", {}, "Under “Expiration”, choose ", h("b", {}, "No expiration"), ". Leave only “gist” ticked."),
        h("li", {}, "Tap ", h("b", {}, "Generate token"), " at the bottom and copy the key it shows."),
        h("li", {}, "Paste the key below. Then paste the same key on your other device.")),
      inp, h("div", { class: "row mt" }, go, st),
      h("p", { class: "tiny muted mt" }, "Treat the key like a password. It is kept only in this browser. It lets this app read and write the gists in your GitHub account and nothing else. You can delete the key on GitHub at any time to stop sync."));
  }

  MV.Sync = { on, sync, turnOn, turnOff, card, sig };
})();
