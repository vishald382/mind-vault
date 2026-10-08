/* Profile and topics on screen: the first-open welcome, the topic picker
   (tiles plus a box to type any interest), and "My topics" in Settings. */
(function () {
  const E = MV.E, T = MV.Topics, { h, toast } = MV.UI;

  // Tiles and the typed-interest box. Every tap is saved at once.
  function picker() {
    const wrap = h("div", { class: "picker" }), msg = h("p", { class: "small", role: "status", "aria-live": "polite" });
    const inp = h("input", { type: "text", placeholder: "For example: birds, cricket, temples", maxlength: 60, autocomplete: "off",
      onkeydown: e => { if (e.key === "Enter") { e.preventDefault(); add(); } } });
    const tiles = h("div", { class: "ttiles" }), mine = h("div", { class: "row" });
    function add() {
      const parts = inp.value.split(",").map(x => x.trim()).filter(Boolean); if (!parts.length) return;
      msg.textContent = parts.map(p => T.addInterest(p).msg).join(" ");
      inp.value = ""; draw();
    }
    function draw() {
      tiles.innerHTML = "";
      T.TILES.forEach(([k, l, em]) => {
        const on = T.topics().includes(k);
        tiles.append(h("button", { class: "ttile" + (on ? " on" : ""), "aria-pressed": String(on), onclick: () => { T.toggle(k); draw(); } },
          h("span", { class: "te", "aria-hidden": "true" }, em), h("span", { class: "tl" }, l), h("span", { class: "tn" }, T.count(k) + " cards")));
      });
      mine.innerHTML = "";
      T.interests().forEach(q => mine.append(h("span", { class: "chip on" }, "🔎 " + q + " · " + T.count("q:" + q),
        h("button", { class: "x", "aria-label": "Remove " + q, onclick: () => { T.removeInterest(q); draw(); } }, "×"))));
    }
    draw();
    wrap.append(tiles, h("div", { class: "mt" }, h("b", {}, "Something else? Type any interest"), h("div", { class: "row mt", style: "flex-wrap:nowrap" }, inp, h("button", { class: "btn primary", onclick: add }, "Add")), msg, mine));
    return wrap;
  }

  function surpriseSwitch() {
    const box = h("input", { type: "checkbox", checked: T.surpriseOn(), onchange: e => { T.setSurprise(e.target.checked); toast(e.target.checked ? "Surprises are on." : "Surprises are off. You will see only your topics."); } });
    return h("label", { class: "row small", style: "cursor:pointer;flex-wrap:nowrap;align-items:flex-start" }, box,
      h("span", {}, h("b", {}, "Surprise me sometimes. "), h("span", { class: "muted" }, "About 15 of every 100 cards come from other topics. Good ideas often come from unexpected places.")));
  }

  /* ---------- first open ---------- */
  function welcome(root) {
    let step = 1;
    const box = h("div", { class: "stage" }); root.append(box);
    const done = () => { if (!E.S.prefs.profile) T.setProfile(""); location.hash = "#/feed"; MV.App.render(); };
    function draw() {
      box.innerHTML = "";
      if (step === 1) {
        const name = h("input", { type: "text", placeholder: "Your name", maxlength: 40, autocomplete: "given-name", value: T.profile().name || "",
          onkeydown: e => { if (e.key === "Enter") next(); } });
        const next = () => { T.setProfile(name.value); step = 2; draw(); };
        box.append(h("div", { class: "card" }, h("div", { class: "eyebrow" }, "Welcome to MindVault"), h("h1", {}, "Learn a little every day, and remember it."),
          h("p", { class: "muted" }, "Short cards about Mumbai, India and the world. Quick checks help you remember them."),
          h("label", { class: "small" }, h("b", {}, "What is your name?")), name,
          h("div", { class: "row between mt" }, h("button", { class: "btn ghost", onclick: done }, "Skip"), h("button", { class: "btn primary", onclick: next }, "Next →"))));
        setTimeout(() => name.focus(), 50);
      } else {
        const n = T.profile().name;
        box.append(h("div", { class: "card" }, h("div", { class: "eyebrow" }, "Step 2 of 2"), h("h1", {}, (n ? n + ", what" : "What") + " interests you?"),
          h("p", { class: "muted" }, "Tap as many as you like. Most of your feed will come from these. You can change them any time in Settings."),
          picker(), h("hr"), surpriseSwitch(),
          h("div", { class: "row between mt" }, h("button", { class: "btn ghost", onclick: () => { step = 1; draw(); } }, "← Back"),
            h("button", { class: "btn primary", onclick: () => { if (!T.hasTopics() && !confirm("You have not chosen any topics. Show cards from every topic?")) return; done(); } }, "Start my feed →"))));
      }
      window.scrollTo(0, 0);
    }
    draw();
  }

  /* ---------- Settings: My topics ---------- */
  function card() {
    const name = h("input", { type: "text", placeholder: "Your name", maxlength: 40, value: T.profile().name || "" });
    const reqs = T.requests();
    return h("div", { class: "card", style: "grid-column:1/-1" }, h("h3", {}, "My topics"),
      h("div", { class: "row", style: "flex-wrap:nowrap" }, name, h("button", { class: "btn", onclick: () => { T.setProfile(name.value); toast("Name saved."); } }, "Save name")),
      h("p", { class: "small muted mt" }, "Most of your feed comes from the topics you choose. Other topics stay in the Library."),
      picker(), h("hr"), surpriseSwitch(),
      h("hr"), h("h3", {}, "Topics you asked for"),
      reqs.length ? [h("p", { class: "small muted" }, "We do not have enough cards on these yet. New cards will be added in a later update. Send this list to Vishal so he knows what to add."),
        h("ul", { class: "list small" }, reqs.map(r => h("li", { class: "row between" }, h("span", {}, h("b", {}, r.q), h("span", { class: "muted" }, ` · ${r.n} card${r.n === 1 ? "" : "s"} now · asked ${new Date(r.t).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`)),
          h("button", { class: "btn sm ghost", onclick: e => { T.removeRequest(r.q); e.target.closest("li").remove(); } }, "Remove")))),
        h("button", { class: "btn", onclick: () => copy(T.requestsText()) }, "Copy the list")]
        : h("p", { class: "small muted" }, "None yet. If you type a topic above and we have few cards on it, it is saved here."));
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Copied. Paste it in WhatsApp or a message."), () => window.prompt("Copy this:", text));
  }

  MV.Profile = { picker, welcome, card };
  MV.Views.welcome = welcome;
})();
