# MindVault handover

Read this first in any new session. It explains how the app works, how content is made, how to publish, and what to build next.

## The owner and how to work with him

- Vishal lives in Mumbai. He wants **simple, easy English** (short sentences, common words) in all content and on-screen text.
- Content should put **Mumbai, Maharashtra and India first**, alongside world facts.
- **Plan first, then build.** For any sizeable change, write the plan in chat and wait for his approval before building or publishing.
- He tests on an Android phone and shows the app to his wife.

## What the app is

A free web app (no server, no build step) that works like an Instagram/TikTok feed of short "idea cards". Each idea climbs a mastery ladder from "Encountered" to "Mastered" through quick checks, recall, explaining, connecting ideas, conversation practice and storytelling.

- Live site: https://vishald382.github.io/mind-vault/ (GitHub Pages, from `main`)
- Repository: https://github.com/vishald382/mind-vault. **It must stay public**, otherwise GitHub Pages switches off and the site shows 404.
- Installable on phones (manifest + offline service worker).
- All user progress is stored in the browser (localStorage). Optional sync between devices uses a private GitHub gist with a token the user pastes into Settings.

## Files

| Path | What it is |
|---|---|
| `index.html` | Loads every script in order. New content files must be added here (tools/integrate.js does it). |
| `css/styles.css` | All styles. Dark and light themes. |
| `js/data-assets.js` | The first 37 world ideas and their links (`MV.ASSETS`, `MV.LINKS`). |
| `js/data-content.js` | Mental models, the first stories, missions, mastery states. |
| `js/data-india.js` | First Mumbai/Maharashtra/India ideas, `MV.REGIONS`. |
| `js/data-wisdom.js` | Buffett and Munger ideas and 10 Munger models. |
| `js/pack-*.js` | Content packs (36 so far, about 30 ideas each). |
| `js/data-daily.js`, `js/data-daily-2.js` | 190 words and 190 quotes of the day. |
| `js/topics.js` | Topic tiles (`MV.Topics.TILES`), typed-interest matching, the 85/15 mix rule, topic requests, profile name. No DOM. |
| `js/profile.js` | First-open welcome (name, then topics), the topic picker, "My topics" card in Settings. |
| `js/share.js` | Share button, card image (canvas, 1080×1350 JPEG), write-up text and link. `SITE` is the one place the web address is set. |
| `js/engine.js` | The brain: mastery ladder, memory decay, recommendations, sessions, graph, gaps, analytics, sync merge. |
| `js/coach.js` | Scoring of explanations, stories and conversation replies; voice input. |
| `js/feed.js` | The scrolling feed, the Today card, Listen mode. |
| `js/session.js` | Step-by-step practice sessions. |
| `js/views.js` | All other screens (Sessions, Portfolio, Graph, Library, Idea page, Models, Stories, Conversation, Gaps, Missions, Ask, Settings). |
| `js/media.js` | Photo/emoji for each idea (`MV.MEDIA`). Photos are Wikimedia Commons links. |
| `js/daily.js` | Today's 5, week dots, calendar reminder. |
| `js/sync.js` | Gist sync. |
| `js/install.js` | Install button and phone install help. |
| `js/app.js` | Router and side menu. |
| `sw.js` | Offline cache. Its version number (`mindvault-vN`) must go up on every publish (tools/integrate.js does it). |
| `tools/` | Content brief, validator, integration and test scripts (see below). |

## Shape of an idea

See `tools/pack-brief.md` for the full rules. Key points: `id`, `domain` (field), optional `region` (`mumbai` / `maharashtra` / `india`), optional `pin: true` (favoured in feed), optional `now: true` (present-day fact, shows a "Right now · 2026" badge), `fact`, `why`, `mech`, `q`, `a`, `chain` (causal steps with lowercase keywords), `mcq` (correct answer first), `bring`, `follow`, `deeper`, `emoji`, `wiki` (Wikipedia title used to find a photo). Stories live in `MV.STORIES`; links in `MV.LINKS`.

Fields currently in use: history, geography, economics, business, psychology, science, philosophy, strategy, design, anthropology, language, wisdom (Buffett & Munger), money, thinkers, nature.

## How new content is made (the method that has worked)

1. Write a short task for each pack (topic list, id prefix, region, things to avoid) and give it to a helper agent with the instruction to read `tools/pack-brief.md` first. Run several packs in parallel, each writing **one new file** `js/pack-<name>.js`.
2. Each pack must pass `node tools/validate.js js/pack-<name>.js` (prints `ALL GOOD`). The validator loads every other pack too, so it catches duplicate ids and titles.
3. Integrate: `node tools/integrate.js` adds script tags to `index.html`, fetches photos from Wikipedia for ideas with a `wiki` title (slowly, to avoid being blocked; can take 10+ minutes; restrict with `ONLY='^(prefix)-' node tools/integrate.js`), and bumps the service worker version.
4. Test (from the project folder):
   - `node tools/smoke-engine.js` (engine runs with all content)
   - `node tools/make-screens-test.js`, then open `_test.html` in headless Edge with `--dump-dom`; every line should start with OK.
   - `node tools/make-feed-test.js`, then the same; it scrolls 45 feed cards. `TOPICS="nature,mumbai,q:birds" node tools/make-feed-test.js` chooses topics first and reports how many idea cards were on topic and how many were surprises (expect about 15%).
   - `node tools/make-share-test.js`, then open `http://localhost:8765/_test.html` (start `node tools/serve.js` first) so Wikipedia photos load; every line should start with OK and say `photo=true` for cards with photos.
   - Headless Edge never goes narrower than about 500px. For a true phone-width screenshot, put the page in a 390px-wide `<iframe>` and screenshot that.
   - Headless Edge path: `/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. Use `--virtual-time-budget`. Delete `_test.html` afterwards (`_*.html` is git-ignored).
5. Publish: `git add -A && git commit && git push`. Pages rebuilds in about a minute. Check with `curl` that the new file returns 200 and `sw.js` shows the new version.

Machine notes: Windows, Git Bash. **Do not use `python`** (it hangs). Use `node` for scripts. Long bash scripts with heredocs and nested quotes have failed before; write a `.js` file and run it instead.

## Current state (8 October 2026)

- 1,156 ideas, 114 stories, 47 mental models, 2,474 links, 190 daily words and quotes.
- About 15% Mumbai/Maharashtra, 30% India, the rest world, Buffett/Munger, money, models and nature.
- 120 "right now" facts (as of 2026) that will need refreshing over time.
- Service worker at `mindvault-v10` (topics and sharing).

## Topics and sharing (built 8 October 2026)

**Her own topics.** On first open (feed or Today), the app asks for a name, then "What interests you?" with 24 tiles and a box to type any interest. A shared link (`#/asset/<id>`) is never blocked by this.
- Saved in `S.prefs`: `profile {name, at}`, `topics` (tile keys), `interests` (typed words), `surprise` (false = off). Saved in `S.requests`: `[{t, q, n, off}]`. Both sync; a removed request stays removed on every device.
- A typed interest is matched as whole words (plurals too) against title, fact, why, field and region. A word that is really a tile ("nature", "history") picks the tile. 8 or more matches: it becomes her own topic. Fewer: she is told honestly and it is saved as a **topic request**.
- Feed: 3 of every 20 idea cards are surprises from other topics (15%); the rest come from her topics. When her topics run out, other topics carry on as surprises. Stories only come from her topics. With no topics chosen, the feed works as before.
- Chips above the feed filter to one topic (no Today card, no surprises, an end card when that topic runs out).
- Settings → My topics: name, tiles, typed interests, surprise switch, and the request list with a "Copy the list" button.
- Loading the sample history keeps the name, topics and requests. "Reset everything" asks for them again.

**Turning topic requests into content (Option A, no in-app AI).** Ask her to tap Settings → My topics → "Copy the list" and send it to Vishal. Then write packs for those topics with the pack method above, and make sure the words she typed appear in titles or facts, so her saved interest finds the new cards with no change on her phone.

**Sharing.** Every idea, story and mental-model card, and the idea page, has "↗ Share". It opens a sheet with the image of the card, the write-up (title, one or two sentences, link) and Share / Copy text / Save image. The image is made first and Share is a second tap, because phones only open the share sheet straight after a tap. Wikimedia sends `Access-Control-Allow-Origin: *`, so photos can be drawn (tested); if one fails, the emoji design is used. The idea page now shows the full idea even before it is "seen", with a "Someone shared this card with you" note for people who have never used the app.

## Later stage: Play Store (discussed 8 October 2026, not started)

The screens would stay the same; the foundations would change. Before a public launch: Google sign-in and online saving (Firebase or Supabase) instead of browser storage and gist sync; topic requests sent to one shared list; your own domain (needed for a Play Store app, and for per-card share pages with WhatsApp previews; then change `SITE` in `js/share.js`); privacy policy, data safety form, account deletion; wrap the web app with PWABuilder (Trusted Web Activity); $25 developer account and, for new personal accounts, a closed test with 12 testers for 14 days. Vishal's plan: let his wife and a few friends use it for some weeks first.

## Phone install steps (tell new users)

Android Chrome → menu → Add to Home screen → Install (choose "Create shortcut" if Play Protect objects). iPhone Safari → Share → Add to Home Screen.
