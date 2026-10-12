# ZF Takeaway V6

Working Node.js web app with official ZF Takeaway logo, Rand/calorie limits, five food categories, indexed Uber Eats / Mr D listing search, AI food photo or description analysis with estimated ingredient weights and macros, editable portion grams, six browser-local adverts, and ordering links.

## Run locally

Requires Node.js 20+. From this folder run `npm start`, then open http://localhost:3000. No npm install required.

## Deploy on Render

1. Upload the contents of this folder to a GitHub repository (package.json, server.js, public/).
2. Render > New > Web Service > connect repository. Runtime: Node. Build command: `npm install`; Start command: `npm start`.
3. Environment: `SERPER_API_KEY` (Google-indexed restaurant listings), `OPENAI_API_KEY` (food photo and menu description analysis). Optional `OPENAI_MODEL` defaults to `gpt-4o-mini`.
4. Deploy. Never put API keys in browser files or GitHub.

## Important limitations

The app searches public Google-indexed Uber Eats and Mr D pages via Serper, **not their private live ordering systems**. Listings and prices can be stale or incomplete, and actual availability, radius and calorie suitability cannot be confirmed from search snippets. Search results with unknown prices are shown and labeled. Calorie filtering is applied only after a meal is analysed; the search results themselves do not have trustworthy calories. AI image-based ingredient weights, protein, carbs, fat and calories are rough estimates, not verified nutrition labels. User portion adjustments scale original estimated macros and calories linearly. The six ad slots are saved per browser using localStorage, not shared centrally. API keys incur third-party charges.
