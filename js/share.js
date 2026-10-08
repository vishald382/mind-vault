/* Share a card: an image of the card (made here with a canvas), a short write-up and a link
   that opens that card on the website. Wikipedia photos allow this; if a photo cannot be
   drawn, the emoji design is used instead. */
(function () {
  const E = MV.E, { h, toast } = MV.UI;
  // The one place to change when MindVault gets its own web address.
  const SITE = "https://vishald382.github.io/mind-vault/";
  const link = path => SITE + "#/" + path;
  const W = 1080, H = 1350, TOP = 640, PAD = 72;
  const SERIF = '"Palatino Linotype", Palatino, Georgia, "Noto Serif", serif', SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

  // What to show for {asset}, {story} or {model}.
  function what(t) {
    if (t.model) {
      const m = E.model(t.model);
      return { key: "model-" + m.id, title: m.name, eyebrow: "Mental model", body: m.line, emoji: "🧠", color: "#b392d6", url: link("models") };
    }
    const st = t.story ? E.story(t.story) : null, a = E.asset(st ? st.assetId : t.asset), m = MV.MEDIA[a.id] || [a.emoji || "💡"];
    return { key: st ? "story-" + st.id : a.id, title: st ? st.title : a.title, body: st ? st.hook : a.fact, emoji: m[0], photo: m[1], fit: !!m[3], color: MV.DOMAIN_COLORS[a.domain] || "#e0b04c",
      eyebrow: st ? "A true story" : MV.DOMAINS[a.domain] + (a.region ? " · " + MV.REGIONS[a.region] : ""), url: link("asset/" + a.id) };
  }
  // The first one or two sentences, kept short.
  function short(text, max = 220) {
    const ss = String(text).split(/(?<=[.!?])\s+/); let out = ss[0];
    if (ss[1] && (out + " " + ss[1]).length <= max) out += " " + ss[1];
    return out.length > max ? out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : out;
  }
  const writeUp = w => `${w.title}\n\n${short(w.body)}\n\nRead more on MindVault: ${w.url}`;

  /* ---------- the image ---------- */
  function loadImg(src, ms = 8000) {
    return new Promise(res => {
      const im = new Image(); let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      im.crossOrigin = "anonymous"; im.onload = () => fin(im); im.onerror = () => fin(null); setTimeout(() => fin(null), ms); im.src = src;
    });
  }
  function lines(c, text, width, max) {
    const ws = String(text).split(/\s+/), out = []; let cur = "";
    for (let i = 0; i < ws.length; i++) {
      const t = cur ? cur + " " + ws[i] : ws[i];
      if (c.measureText(t).width <= width || !cur) { cur = t; continue; }
      out.push(cur); cur = ws[i];
      if (out.length === max) { let last = out[max - 1]; while (last && c.measureText(last + "…").width > width) last = last.replace(/\s*\S+$/, ""); out[max - 1] = last + "…"; return out; }
    }
    if (cur) out.push(cur);
    return out;
  }
  function draw(w, img) {
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.fillStyle = "#0e1013"; c.fillRect(0, 0, W, H);
    // top: photo, or the emoji on the field's colour
    if (img && w.fit) {
      c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, W, TOP);
      const s = Math.min((W - 60) / img.width, (TOP - 60) / img.height); c.drawImage(img, (W - img.width * s) / 2, (TOP - img.height * s) / 2, img.width * s, img.height * s);
    } else if (img) {
      const s = Math.max(W / img.width, TOP / img.height), sw = W / s, sh = TOP / s;
      c.drawImage(img, (img.width - sw) / 2, Math.max(0, (img.height - sh) * 0.3), sw, sh, 0, 0, W, TOP);
    } else {
      const g = c.createLinearGradient(0, 0, W, TOP); g.addColorStop(0, w.color); g.addColorStop(1, "#1c2128");
      c.fillStyle = g; c.fillRect(0, 0, W, TOP);
      c.font = `250px ${EMOJI}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(w.emoji, W / 2, TOP / 2 + 10); c.textAlign = "left";
    }
    const fade = c.createLinearGradient(0, TOP - 90, 0, TOP); fade.addColorStop(0, "rgba(14,16,19,0)"); fade.addColorStop(1, "rgba(14,16,19,1)");
    c.fillStyle = fade; c.fillRect(0, TOP - 90, W, 90);
    if (img) { c.font = `500 24px ${SANS}`; c.textBaseline = "middle"; const cr = "Photo: Wikipedia", cw = c.measureText(cr).width + 28; c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(W - cw - 24, TOP - 70, cw, 38); c.fillStyle = "#fff"; c.fillText(cr, W - cw - 10, TOP - 51); }
    c.fillStyle = w.color; c.fillRect(0, TOP, W, 8);
    // text
    let y = TOP + 78; c.textBaseline = "alphabetic";
    c.fillStyle = w.color; c.font = `700 28px ${SANS}`; c.fillText(w.eyebrow.toUpperCase(), PAD, y); y += 76;
    c.fillStyle = "#ece8de"; c.font = `600 62px ${SERIF}`;
    const tl = lines(c, w.title, W - PAD * 2, 3); tl.forEach(l => { c.fillText(l, PAD, y); y += 74; }); y += 14;
    c.fillStyle = "#c9c4b8"; c.font = `38px ${SERIF}`;
    const room = Math.max(1, Math.floor((H - 150 - y) / 54) + 1); // the last line sits above the footer
    lines(c, w.body, W - PAD * 2, room).forEach(l => { c.fillText(l, PAD, y); y += 54; });
    // footer
    c.fillStyle = "#2a313a"; c.fillRect(PAD, H - 120, W - PAD * 2, 2);
    c.fillStyle = "#e0b04c"; c.font = `600 40px ${SERIF}`; c.fillText("MindVault", PAD, H - 56);
    c.fillStyle = "#98a2ad"; c.font = `26px ${SANS}`; c.textAlign = "right"; c.fillText("vishald382.github.io/mind-vault", W - PAD, H - 60); c.textAlign = "left";
    return cv;
  }
  const blobOf = cv => new Promise((res, rej) => { try { cv.toBlob(b => b ? res(b) : rej(new Error("no image")), "image/jpeg", 0.9); } catch (e) { rej(e); } });
  // Returns {blob, photo}. If the photo cannot be used, the emoji design is made instead.
  async function image(t) {
    const w = what(t), img = w.photo ? await loadImg(w.photo) : null;
    if (img) { try { return { blob: await blobOf(draw(w, img)), photo: true }; } catch (e) { /* photo blocked: use the emoji design */ } }
    return { blob: await blobOf(draw(w, null)), photo: false };
  }

  /* ---------- the share sheet ---------- */
  function copy(text) { return (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => true, () => { window.prompt("Copy this:", text); return false; }); }
  function save(blob, name) { const u = URL.createObjectURL(blob), a = h("a", { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  // The image is made first, then the person taps Share. Phones only open the share sheet straight after a tap.
  function open(t) {
    const w = what(t), text = writeUp(w), name = "mindvault-" + w.key + ".jpg";
    const pic = h("div", { class: "share-pic" }, h("p", { class: "muted small" }, "Making the image…"));
    const shareBtn = h("button", { class: "btn primary", disabled: true }, "Share");
    const close = () => ov.remove();
    const ov = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Share this card", onclick: e => { if (e.target === ov) close(); } },
      h("div", { class: "card share-card" }, h("div", { class: "row between" }, h("h3", { style: "margin:0" }, "Share this card"), h("button", { class: "btn ghost sm", "aria-label": "Close", onclick: close }, "✕")),
        pic, h("p", { class: "small share-text" }, text),
        h("div", { class: "row" }, shareBtn, h("button", { class: "btn", onclick: () => copy(text).then(ok => ok && toast("Text and link copied.")) }, "Copy text"),
          h("button", { class: "btn ghost", onclick: () => file && save(file, name) }, "Save image"))));
    document.body.append(ov);
    let file = null;
    image(t).then(r => {
      file = r.blob; const u = URL.createObjectURL(r.blob);
      pic.innerHTML = ""; pic.append(h("img", { src: u, alt: "Image of the card: " + w.title }));
      shareBtn.disabled = false;
    }).catch(() => { pic.innerHTML = ""; pic.append(h("p", { class: "muted small" }, "Could not make the image. You can still share the text and link.")); shareBtn.disabled = false; });
    shareBtn.onclick = async () => {
      const f = file && typeof File === "function" ? new File([file], name, { type: "image/jpeg" }) : null;
      try {
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: w.title, text });
        else if (navigator.share) await navigator.share({ title: w.title, text });
        else { if (file) save(file, name); if (await copy(text)) toast("Image saved and text copied. Paste the text with the image."); }
      } catch (e) { if (e && e.name !== "AbortError") { if (await copy(text)) toast("Could not open sharing. The text and link are copied."); } }
    };
  }
  const button = t => h("button", { class: "btn ghost share-btn", title: "Share this card", "aria-label": "Share this card", onclick: e => { e.stopPropagation(); open(t); } }, "↗ Share");

  MV.Share = { SITE, link, what, short, writeUp, image, draw, open, button };
})();
