# ZF Takeaway V7 — Automatic AI meal calories

Upload **the contents of this folder** to your existing GitHub ZF-Takeaway-V6 repository (overwrite files), then Render redeploys automatically. Keep package.json and server.js at repository root.

Build: `npm install` · Start: `npm start` · Environment: `SERPER_API_KEY`, `OPENAI_API_KEY`. Never commit keys.

Search now sends publicly indexed Uber Eats and Mr D snippets to AI, extracts distinct meal names and estimates calories/protein/carbs/fat per meal automatically. Results that match both budget and calories show first. Unknown prices and meals exceeding limits appear separately. The search does not retrieve live ordering menus, verify location radius, identify real food photos on listings, or guarantee menu-item-to-price matching. Macro estimates from descriptions are rough. Photo analysis remains available separately.

To see results, ensure OpenAI API billing is active. API costs apply per search.
