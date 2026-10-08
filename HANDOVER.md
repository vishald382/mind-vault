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
   - `node tools/make-feed-test.js`, then the same; it scrolls 45 feed cards.
   - Headless Edge path: `/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. Use `--virtual-time-budget`. Delete `_test.html` afterwards (`_*.html` is git-ignored).
5. Publish: `git add -A && git commit && git push`. Pages rebuilds in about a minute. Check with `curl` that the new file returns 200 and `sw.js` shows the new version.

Machine notes: Windows, Git Bash. **Do not use `python`** (it hangs). Use `node` for scripts. Long bash scripts with heredocs and nested quotes have failed before; write a `.js` file and run it instead.

## Current state (8 October 2026)

- 1,156 ideas, 114 stories, 47 mental models, 2,474 links, 190 daily words and quotes.
- About 15% Mumbai/Maharashtra, 30% India, the rest world, Buffett/Munger, money, models and nature.
- 120 "right now" facts (as of 2026) that will need refreshing over time.

## Next work (approved by Vishal on 8 October 2026)

His wife liked the app and gave two pieces of feedback. Approved plan:

### 1. Her own topics and her own profile
She uses **her own phone**, so her progress is already separate. Build:
- A first-run **profile** step: her name, then "What interests you?"
- **Topic picker**: about 20 tiles (Mumbai, Maharashtra, India, Nature & animals, History, Science & space, Health, Money, Business, Psychology, Stories, Great thinkers, Right now 2026, and so on) **plus a free-text box** where she can type any interest.
- Typed interests are matched against the library (titles, facts, fields). The feed then uses about 85% chosen topics and 15% surprises (with a setting to turn surprises off). Topics she does not choose rarely appear but stay in the library.
- Topic chips at the top of the feed for a quick filter (for example "Nature only").
- "My topics" in Settings to change them later.
- If the library has few cards for a typed interest, say so honestly and save it as a **topic request** (shown in Settings, included in sync). **Option A only:** new content for requests is written in a later session using the pack method above. Do **not** add in-app AI generation.

### 2. Sharing a card
- A **Share** button on every card that opens the phone's share sheet (Web Share API, with a copy-to-clipboard fallback).
- Shares an **image of the card** (photo or emoji banner, title, the key fact) **with a short write-up below it** (title, one or two sentences, and a link).
- The link opens **that exact card** on the website (`#/asset/<id>` already exists), even for someone who has never used the app.
- Generate the image in the browser with a canvas. Wikimedia photos may block canvas export (CORS); test this, and fall back to the emoji banner design if the photo cannot be drawn.

### Also tell the user
Phone install steps: Android Chrome → menu → Add to Home screen → Install (choose "Create shortcut" if Play Protect objects). iPhone Safari → Share → Add to Home Screen.
