/* "Install app" button. Android Chrome gives us an install prompt we can trigger.
   iPhones and in-app browsers do not, so there we show the steps instead. */
(function () {
  const { h } = MV.UI;
  const ua = navigator.userAgent || "";
  const standalone = () => (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(ua);
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|; wv\)|Twitter|LinkedInApp|Snapchat/i.test(ua);
  const btns = () => document.querySelectorAll(".install-btn");
  let deferred = null;

  function show(on) { btns().forEach(b => { b.hidden = !on; }); }
  function help() {
    const steps = inApp ? ["You opened this link inside another app (such as WhatsApp or Instagram). Apps cannot be installed from there.", "Tap the menu (⋮ or …) and choose “Open in Chrome” or “Open in browser”.", "Then tap “Install app” again."]
      : isIOS ? ["Tap the Share button (the square with an arrow pointing up).", "Scroll down and tap “Add to Home Screen”.", "Tap “Add”. MindVault will appear on your home screen.", "If you do not see “Add to Home Screen”, open this page in Safari and try again."]
      : isAndroid ? ["Tap the menu (⋮) at the top right of Chrome.", "Tap “Add to Home screen” or “Install app”.", "Tap “Install”. MindVault will appear with your other apps.", "If you do not see it, make sure you are using Chrome and not a private (incognito) tab.", "If Google Play Protect says “Unsafe app blocked”: update Chrome from the Play Store and use Chrome, not another browser. Or tap “Add to Home screen” and choose “Create shortcut”. A shortcut works the same way and is not checked by Play Protect."]
      : ["In Chrome or Edge, look for the install icon at the right end of the address bar.", "Or open the browser menu and choose “Install MindVault” or “Apps → Install this site as an app”."];
    const close = () => ov.remove();
    const ov = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "How to install", onclick: e => { if (e.target === ov) close(); } },
      h("div", { class: "card" }, h("h2", {}, "Put MindVault on your phone"), h("p", { class: "muted small" }, "MindVault is a web app. It is not in the Play Store or App Store. You add it from your browser, and then it opens like any other app."),
        h("ol", {}, steps.map(s => h("li", {}, s))), h("div", { class: "row", style: "justify-content:flex-end" }, h("button", { class: "btn primary", onclick: close }, "OK"))));
    document.body.append(ov);
  }
  async function click() {
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (e) {} deferred = null; if (standalone()) show(false); return; }
    help();
  }

  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; show(true); });
  window.addEventListener("appinstalled", () => { deferred = null; show(false); MV.UI.toast("Installed. Look for MindVault on your home screen."); });
  btns().forEach(b => b.addEventListener("click", click));
  // On phones, always offer the button (with steps) unless the app is already installed and open.
  if (!standalone() && (isIOS || isAndroid)) show(true);
  MV.Install = { help };
})();
