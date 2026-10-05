/* Daily habit: Today's 5, word and quote of the day, and a daily reminder. */
(function () {
  const E = MV.E, { h, toast } = MV.UI, DAY = E.DAY;
  const pad = n => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY);
  const pick = list => list && list.length ? list[dayNo() % list.length] : null;
  const word = () => pick(MV.DAILY && MV.DAILY.words), quote = () => pick(MV.DAILY && MV.DAILY.quotes);
  const fiveDone = () => !!(E.S.daily[dayKey()] && E.S.daily[dayKey()].five);
  function markFive() { (E.S.daily[dayKey()] || (E.S.daily[dayKey()] = {})).five = true; E.save(); }

  /* Today's 5: three new ideas, one you are about to forget, one quick check. */
  function fiveSteps() {
    const recs = E.recommend(40), kind = r => { const a = E.asset(r.id); return a.region ? "local" : a.pin ? "pin" : "world"; };
    const news = []; ["local", "pin", "world"].forEach(k => { const r = recs.find(x => kind(x) === k && !news.includes(x)); if (r) news.push(r); });
    recs.forEach(r => { if (news.length < 3 && !news.includes(r)) news.push(r); });
    const steps = news.map(r => ({ kind: "learn", id: r.id, label: "New idea", surprise: r.surprise, gap: r.gap }));
    const newIds = new Set(news.map(r => r.id));
    const risk = E.rescueList().find(r => !newIds.has(r.id));
    const weak = risk ? null : E.assets().filter(a => E.stateIdx(a.id) >= 1 && !newIds.has(a.id)).sort((a, b) => (E.mem(a.id)?.R ?? 1) - (E.mem(b.id)?.R ?? 1))[0];
    if (risk) steps.push({ kind: "rescue", id: risk.id, R: risk.R, label: "One you are about to forget" });
    else if (weak) steps.push({ kind: "recall", id: weak.id, label: "One from before" });
    const chk = news[0] || null;
    if (chk) steps.push({ kind: "recognize", id: chk.id, label: "Quick check" });
    return steps;
  }
  function startFive() {
    const steps = fiveSteps(); if (!steps.length) return toast("Nothing new to learn right now.");
    MV.Session.start({ title: "Today's 5", intent: "today5", minutes: 5, steps: steps.map(s => Object.assign({ est: E.EST[s.kind] || 1 }, s)), est: 5 });
  }

  /* Days of the last week on which you practised anything. */
  function week() {
    const days = new Set();
    Object.values(E.S.rev).forEach(l => l.forEach(r => days.add(dayKey(new Date(r.t)))));
    const out = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); out.push({ on: days.has(dayKey(d)), five: !!(E.S.daily[dayKey(d)] && E.S.daily[dayKey(d)].five), label: "SMTWTFS"[d.getDay()], today: i === 0 }); }
    return out;
  }
  const weekRow = () => h("div", { class: "week", "aria-label": "Your last 7 days" }, week().map(d => h("span", { class: "wd" + (d.on ? " on" : "") + (d.five ? " five" : "") + (d.today ? " today" : ""), title: d.five ? "Today's 5 done" : d.on ? "Practised" : "No practice" }, d.label)));

  /* Daily reminder. A web app cannot ring by itself when it is closed, so we use the phone's calendar. */
  const appUrl = () => location.origin + location.pathname;
  function calStart(time) { const [hh, mm] = time.split(":").map(Number), d = new Date(); d.setHours(hh, mm, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); return d; }
  const stamp = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  function googleUrl(time) {
    const s = calStart(time), e = new Date(s.getTime() + 10 * 6e4), tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "Asia/Kolkata";
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("MindVault: Today's 5") + "&details=" + encodeURIComponent("Five minutes for your mind.\n" + appUrl()) +
      "&dates=" + stamp(s) + "/" + stamp(e) + "&recur=" + encodeURIComponent("RRULE:FREQ=DAILY") + "&ctz=" + encodeURIComponent(tz);
  }
  function icsFile(time) {
    const s = calStart(time), e = new Date(s.getTime() + 10 * 6e4);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MindVault//EN", "BEGIN:VEVENT", "UID:mindvault-daily@" + location.hostname, "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(s), "DTEND:" + stamp(e), "RRULE:FREQ=DAILY",
      "SUMMARY:MindVault: Today's 5", "DESCRIPTION:Five minutes for your mind. " + appUrl(), "URL:" + appUrl(), "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:MindVault: Today's 5", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = h("a", { href: URL.createObjectURL(new Blob([ics], { type: "text/calendar" })), download: "mindvault-reminder.ics" }); a.click();
  }
  function reminderCard() {
    const time = h("input", { type: "time", value: E.S.prefs.remind || "08:00", style: "max-width:140px", "aria-label": "Reminder time", onchange: e => { E.S.prefs.remind = e.target.value; E.save(); } });
    return h("div", { class: "card" }, h("h3", {}, "Daily reminder"),
      h("p", { class: "small muted" }, "A web app cannot send a reminder when it is closed. So MindVault adds a repeating event to your phone's calendar. The calendar reminds you each day, and the event has a link that opens the app."),
      h("div", { class: "row" }, h("span", { class: "small" }, "Remind me at"), time),
      h("div", { class: "row mt" }, h("button", { class: "btn primary", onclick: () => window.open(googleUrl(time.value || "08:00"), "_blank", "noopener") }, "Add to Google Calendar"), h("button", { class: "btn", onclick: () => icsFile(time.value || "08:00") }, "Other calendar (.ics file)")),
      h("p", { class: "tiny muted mt" }, "To stop the reminders, delete the event from your calendar."));
  }

  MV.Daily = { dayKey, word, quote, fiveDone, markFive, fiveSteps, startFive, weekRow, reminderCard };
})();
