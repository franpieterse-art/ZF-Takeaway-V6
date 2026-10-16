# ZF Takeaway V11 - Dish photos, outlet names and 2-for-1 specials

Built from ZF-Takeaway-Android-V10-Macro-Targets.zip. Retains Android/PWA installation, calorie and macro filters, photo analysis, ingredient adjustments and six advert spaces.

## New features

- Meal cards show the restaurant/outlet name extracted from the source text.
- Source-matched dish images are retrieved through Serper image search. Unavailable images show a clear placeholder; unrelated stock photos are never substituted.
- Find 2-for-1 specials within my budget searches indexed Uber Eats and Mr D offers for the selected area.
- The maximum price applies to the FULL two-meal deal, before any delivery/service fees. Unknown-price and explicitly expired deals are excluded. Offers must include explicit 2-for-1 wording and supporting price text in the indexed snippet.
- Specials show dish photo where found, outlet, total deal price, source wording, available terms and a source link. Calories/macros are not applied to specials and are not claimed for the full deal.
- PWA cache version changes so installed users receive the new client assets after updating/reopening.

## Update your existing Render service

1. Back up the deployed source. Upload/commit ALL files in this folder to the existing service's repository, including discovery.js, public/specials.js and the updated service worker.
2. Keep existing environment variables. Required: SERPER_API_KEY and at least one of GROQ_API_KEY or GEMINI_API_KEY. Retain any existing model overrides. No keys belong in public files.
3. Runtime: Node 20 or newer. Start command: npm start. No extra packages or build step required.
4. Deploy the latest commit on the existing Render service. Close and reopen the installed PWA after deployment.
5. Test with your keys and area. Serper image queries use additional provider quota. Photo lookup failures do not block meal results.

## Verification and limits

Run npm run check for syntax plus unit/integration tests. Integration tests use mocked upstream responses and real local HTTP routes. Live Serper/AI calls could not be exercised without your environment keys. Browser visual checks were not available in this environment.

Indexed listings and images may be old or unavailable. A matching image-search title/source does not guarantee the exact served portion. No live availability, distance, final checkout price or verified nutrition is asserted. Confirm offers at the outlet/platform before ordering.

This archive is a new source version. It does not itself replace the running Render deployment.
