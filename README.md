# MindVault

An intellectual compounding engine. It tracks what you retain, understand, connect, explain and use, not what you consume.

## Run

Open `index.html` in Chrome or Edge. No build step, no server, no account. All data stays in this browser's local storage (export/import under Settings).

To see the product with history, choose "Explore with 6 months of sample history" on the Today screen.

## Layout

- `js/data-assets.js` – knowledge assets and the bridges between them
- `js/data-india.js` – Mumbai, Maharashtra and India content (tagged with `region`; shown first in the feed)
- `js/feed.js` – the scrolling feed
- `js/data-content.js` – mental models, Story DNA, missions, mastery states
- `js/engine.js` – mastery ladder, memory decay, graph, gap detection, serendipity, session builder, analytics, identity
- `js/coach.js` – storytelling / explanation / conversation analysis, voice input, optional Claude coaching
- `js/session.js` – the step-by-step session runner
- `js/views.js`, `js/app.js`, `js/ui-core.js` – screens, router, shared components

## Adding content

Add an object to `MV.ASSETS` (copy an existing one) and any bridges to `MV.LINKS`. `chain` lists the causal steps with keywords; it drives recall feedback and explanation scoring.
