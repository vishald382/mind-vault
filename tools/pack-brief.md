# How to write a MindVault content pack

MindVault (D:\Mind_Vault, plain JavaScript, no build step) is a learning app for one user who lives in Mumbai, India. He reads short "ideas" in a scrolling feed, then is tested on them, explains them, connects them and uses them in conversation. You are writing one new content pack as ONE NEW FILE. Do not edit any existing file.

## Before you write

Read these to see the exact shape and the voice (they are the template):
- `D:\Mind_Vault\js\data-india.js` (best template: ideas, stories and links, in the simple English we want)
- `D:\Mind_Vault\js\data-wisdom.js` (shows how a pack adds a new field/domain)
- Skim the `id` and `title` of every existing idea in `js/data-assets.js`, `js/data-india.js`, `js/data-wisdom.js` and every `js/pack-*.js` file (use grep for `title:` to list them quickly) so you do not repeat a topic that already exists, and so you can link to existing ideas.
- `MV.MODELS` in `js/data-content.js` and `js/data-wisdom.js` for the list of mental model ids you may use in `models`.

## The reader and the voice

- An intelligent adult in Mumbai for whom English is a second language. About Class 7 to 8 reading level.
- Short sentences (under 20 words where you can, never over 30). Common words. Active voice. One idea per sentence.
- No idioms, no clever phrasing, no em dashes, no emojis inside the text fields.
- If a technical word is the thing being taught, keep it and explain it in plain words the first time.
- Use rupees and Indian examples where an example is needed. Use "crore" and "lakh" naturally for Indian amounts.
- Warm and interesting, never childish. Each idea should make the reader think "I did not know that" or "now I understand why".

## Accuracy rules (very important)

- Every fact, number, date, name and quote must be correct. If you are not fully sure, CHECK IT with a web search before you use it. If you cannot confirm it, leave it out or say plainly that it is uncertain ("is said to", "is often estimated").
- Prefer well-established facts over surprising claims you cannot confirm. Popular myths must be either avoided or clearly called a legend.
- Direct quotes only when the wording and the speaker are well attested. Otherwise describe the idea in your own words.
- Be respectful and neutral on religion, caste, politics and living people. Use the honorifics people normally use (for example "Chhatrapati Shivaji Maharaj", "Dr B. R. Ambedkar", "Sant Tukaram"). No party politics.
- No medical, legal or personal investment advice. Explain how things work; do not tell the reader what to buy.

## Shape of one idea

```js
{ id: "prefix-short-name",            // lowercase, hyphens, must start with your pack's prefix
  type: "fact",                        // one of: fact, concept, mental model, person, event, place, historical story,
                                       // scientific principle, business concept, psychological concept, insight
  domain: "history",                   // an existing field key, or the new field your pack defines (see your task)
  region: "mumbai",                    // ONLY for local ideas: "mumbai", "maharashtra" or "india". Leave out for world ideas.
  title: "Short clear title", value: 4, // value 2..5 = how much this is worth knowing
  cue: "when a conversation turns to …",   // finishes the sentence "when the talk turns to ___"
  emoji: "🏰",                         // ONE emoji that pictures the idea
  wiki: "Raigad Fort",                 // exact title of an English Wikipedia article whose main picture would suit the card, or null
  fact: "The idea in 2 to 3 short sentences, with the key number or date.",
  why: "Why it matters or why it is interesting. 1 to 2 sentences.",
  mech: "How it works / why it happened. 3 to 5 short sentences. Cause and effect.",
  models: ["incentives"],              // 0 to 3 mental model ids that this idea shows (must exist)
  q: "A question that asks the reader to recall and explain it?",
  a: "A model answer in 1 to 3 sentences that covers every step in `chain`.",
  chain: [["Step in plain words", ["keyword", "other keyword"]], ...],   // 3 or 4 steps
  mcq: { q: "A check question?", o: ["Correct answer FIRST", "wrong", "wrong", "wrong"] },
  bring: "When X comes up: “A natural line you could say in conversation.”",
  follow: "A question to ask the other person afterwards?",
  deeper: "One or two extra facts for the curious.",
  story: null, jargon: [], mis: [] }
```

Notes on fields the code depends on:
- `chain`: the causal steps of the idea. Each step is `[label, [keywords]]`. Keywords are lowercase word-stems; the app looks for them in what the user types to see if they covered that step. At least one keyword of every step must appear in your own `fact`/`mech`/`a` text, and your model answer `a` must touch nearly every step.
- `mcq.o[0]` is always the correct answer (the app shuffles them). Wrong options must be clearly wrong but not silly.
- `mis` (optional): common wrong beliefs as `{ re: "regex", msg: "plain correction" }`. Use rarely.
- The wrong options, `bring` and `follow` should sound like something a real person in Mumbai would say or be asked.

## Links (required)

Add notes that connect ideas, in `MV.LINKS.push([idA, idB, "one plain sentence saying what the two share"], ...)`.
- Every new idea needs at least one link. Aim for about 1.5 links per idea.
- At least a third of your links should go to ideas that ALREADY exist in the other files (for example `dabbawalas`, `shivaji-forts`, `buffett-compounding`, `bm-incentives`, `comparative-advantage`, `monsoon-economy`). Cross-field links are the most valuable.
- A link note must be true and specific, not vague ("both are important" is not acceptable).

## Stories (3 per pack)

Pick the 3 ideas with the best real story. Set `type: "historical story"` and `story: "storyid"` on the idea, and add to `MV.STORIES.push({...})`:
`id, assetId, title, hook, setting, character, conflict, surprise, turning, payoff, meaning` (each 1 to 2 short sentences), `extra: [3 extra lines]`, `facts: [[alt, alt], ...]` (5 to 7 groups of lowercase strings; at least one string of each group must appear in the beats; these are the key facts a retelling must include), `vocab: [3 useful words]`.

## File layout

```js
/* <Pack name>. Same shape as data-india.js. */
(function () {
  // (only if your task says so) MV.DOMAINS.xxx = "Name"; MV.DOMAIN_COLORS.xxx = "#hex";
  const P = list => list.map(a => Object.assign({ story: null, jargon: [], mis: [] }, a));
  MV.ASSETS.push(...P([ /* ideas */ ]));
  MV.STORIES.push( /* stories */ );
  MV.LINKS.push( /* links */ );
})();
```
Use double-quoted JS strings. Inside text use curly quotes “ ” ‘ ’ so you never break the string.

## Check your work (required)

Bash here is Git Bash on Windows. Do NOT use python (it hangs on this machine); use node.
Run the validator and fix everything until it prints `ALL GOOD`:

    node "tools/validate.js" js/<your-file>.js

(run it from `D:\Mind_Vault`, i.e. `cd /d/Mind_Vault` first). The validator loads every other pack automatically, so it will catch duplicate ids and titles. Other people are writing other packs at the same time; if a half-written file fails to load, wait a minute and rerun.

## Report back

Briefly: the file you wrote, how many ideas/links/stories, the validator's last two lines, which facts you checked on the web, and a list of any facts you are still not fully sure about (with the idea id) so they can be reviewed.

## Size

Each pack has 30 ideas and 3 stories unless your task says otherwise. Spend your effort on getting facts right and on clear cause-and-effect explanations; a plain true idea beats a dazzling doubtful one.
