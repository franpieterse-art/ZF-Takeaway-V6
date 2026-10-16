# ZF Takeaway V12

## Photo changes

The app first reads the public Uber Eats or Mr D listing and looks for a named dish with its image in structured menu data. If found, it uses that platform-provided image URL. An indexed image search is a fallback. The earlier requirement that the image-search title contain the entire outlet name is no longer the only route to a photo.

When a platform exposes only an outlet/listing image, that image is clearly labelled as an outlet image. The app never labels it as the exact dish. A source-photo link appears on every card, including when a platform blocks direct loading. Some platforms do not expose public dish images, so a photograph cannot be guaranteed for every result.

## Separate searches

1. **Find meals by calories & nutrition** retains its own calorie, price, fat, carbohydrate, protein, category and area controls.
2. **Find 2-for-1 specials** now has an independent maximum deal-price field and independent area field. Changing this price does not change the regular meal budget. This search checks the full deal price, not half the deal price. It does not apply calorie or macro limits.
3. **AI photo & nutrition breakdown** remains available separately.

## Update Render

Replace the app source with ALL files from this archive. The main folder contains server.js, discovery.js, package.json, public and tests. public/specials.js must be inside public. Keep existing Render environment keys. Deploy the latest commit, then close and reopen the app. The service worker has a new cache version.

Node 20+; start command: npm start. Checks: npm run check. No new dependencies or API keys. Uses existing Serper and Gemini/Groq settings. The old live URL will show V12 only after deployment.

## Verification

Automated tests cover direct dish-image extraction, outlet-image labelling, unrelated-image rejection, image search failure, offer price boundaries, expired offers, source evidence, regular nutrition filtering and independent specials inputs. External search/AI integration tests use mocked provider responses; live account keys were not available. The live Render service has not been modified by creating this archive.
