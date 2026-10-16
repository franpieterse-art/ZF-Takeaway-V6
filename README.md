# ZF Takeaway V12

Read **V12-UPDATE.md** for current photo behaviour, independent searches and Render deployment steps. Includes all V10/V11 features.

# ZF Takeaway V11

See **V11-UPDATE.md** for current features, deployment steps and verification limits. This is the V10-based update with photos, outlet names and 2-for-1 deal search.

## Previous setup notes

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

## V9 JSON response hotfix
Groq text analysis now requests JSON object output (`response_format`) and retries malformed/truncated responses. Keep `GROQ_MODEL=openai/gpt-oss-20b` in Render. If the model rejects JSON response formatting, consult the Groq model capabilities and change the model accordingly. Gemini backup requires an actually accessible model ID; do not assume availability.
