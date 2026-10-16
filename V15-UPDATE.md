ZF Takeaway V15 — Restaurant website meal photos

Meal results retain their delivery ordering links, indexed prices and nutrition estimates.
For each named restaurant, the app now searches for its own website, then searches that domain for the meal. It reads matching dish images from structured menu data or matching image labels. Generic outlet images are not used as meal photos. A restaurant website link is included when found.

Deploy: replace the existing project files with this ZIP's contents, including restaurant-images.js and the public folder. Keep existing environment keys. Start command: npm start. Confirm Version 15 appears after deployment.

Requires the existing SERPER_API_KEY and an existing GROQ_API_KEY or GEMINI_API_KEY. Websites without an indexed menu, accessible HTML or a matching dish photo can still show Photo unavailable. Initial restaurant/meal discovery and price data remain indexed delivery listings; restaurant websites supply photos. Prices are not replaced with restaurant prices. This update has not been deployed to the live Render app.

Validation: all 11 automated checks passed, including simulated restaurant discovery, dish matching, missing website fallback, nutrition filters and specials budgets. Live external restaurant retrieval has not been verified in this environment.
