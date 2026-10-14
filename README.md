# ZF Takeaway V9 — Groq primary, Gemini fallback

## Deploy
Upload the contents of this ZIP to the ROOT of the existing GitHub repository (server.js, package.json, README.md, and public/). Commit changes. Render will deploy the new commit using npm start.

## Render Environment variables
- `SERPER_API_KEY` — required for publicly indexed Uber Eats and Mr D search results.
- `GROQ_API_KEY` — primary AI provider (required for Groq). Never put this key in GitHub.
- `GEMINI_API_KEY` — optional backup AI provider.
- `GROQ_MODEL` — optional; defaults to `llama-3.3-70b-versatile` for text. Choose an available Groq model.
- `GROQ_VISION_MODEL` — optional; defaults to `meta-llama/llama-4-scout-17b-16e-instruct` for image analysis; change if unavailable to your account.
- `GEMINI_MODEL`, `GEMINI_BACKUP_MODEL` — optional backup model IDs; set to models available to your Google account.

The app automatically tries Groq first, retries transient errors, and uses Gemini if Groq fails. The server never exposes API keys to the browser. Free tiers have limits; fallback is not guaranteed to succeed.

## Important limitations
Results come from public Google-indexed snippets, not verified live platform APIs. Prices and availability may be stale; radius cannot be verified. Calories and ingredient weights are rough AI estimates.

## Test
`npm start`, then open http://localhost:3000. GET /api/status returns only configured status, not secret values. Search and photo analysis need working API keys and network connectivity.
