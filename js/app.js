/* Router and shell */
(function () {
  const E = MV.E, { h, $ } = MV.UI;
  const NAV = [["feed", "Feed", "▶"], ["today", "Sessions", "☀"], ["portfolio", "Portfolio", "◔"], ["graph", "Knowledge graph", "✳"], ["library", "Knowledge assets", "▤"], ["models", "Mental models", "◆"], ["stories", "Stories", "❝"],
    ["conversation", "Conversation capital", "☍"], ["gaps", "Knowledge gaps", "◌"], ["missions", "Missions", "⚑"], ["ask", "Ask your mind", "?"], ["settings", "Settings", "⚙"]];
  function render() {
    const [route, param] = (location.hash.replace(/^#\//, "") || "feed").split("/");
    let view = MV.Views[route] || MV.Views.feed; const root = $("#view");
    // First open: ask her name and topics before the feed. A shared link (#/asset/…) opens straight away.
    if ((view === MV.Views.feed || route === "today") && MV.Topics.needsSetup()) view = MV.Views.welcome;
    root.className = "view" + (view === MV.Views.feed ? " feed" : "");
    const rescue = E.rescueList().length, gaps = E.gaps().length;
    const nav = $("#nav"); nav.innerHTML = "";
    NAV.forEach(([k, l, ic]) => nav.append(h("a", { href: "#/" + k, class: (k === route || (k === "library" && route === "asset") || (k === "today" && route === "session")) ? "on" : "" }, h("span", { class: "ic", "aria-hidden": "true" }, ic), l,
      k === "today" && rescue ? h("span", { class: "dot", title: "Ideas to rescue" }, rescue) : null)));
    $("#toptitle").textContent = view === MV.Views.welcome ? "Welcome" : (NAV.find(n => n[0] === route) || [0, "MindVault"])[1];
    $("#side").classList.remove("open");
    root.innerHTML = "";
    try { view(root, param ? decodeURIComponent(param) : undefined); }
    catch (e) { console.error(e); root.append(h("div", { class: "card" }, h("h2", {}, "Something went wrong"), h("p", { class: "muted" }, String(e.message || e)), h("a", { class: "btn", href: "#/today" }, "Back to Sessions"))); }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  $("#menu").addEventListener("click", () => $("#side").classList.toggle("open"));
  MV.App = { render };
  render();
})();
