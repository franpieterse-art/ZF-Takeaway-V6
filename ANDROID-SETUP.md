# ZF Takeaway Android — installable PWA

This is an Android-installable progressive web app, NOT an APK. It uses your existing Node/Render service and keeps the V9 Groq-primary/Gemini-backup server logic.

## Publish
1. Extract ZIP and upload its root files and public/ folder to your existing GitHub repository, replacing matching files. Do not upload the ZIP itself as a single file.
2. Commit the changes. Render will redeploy the existing web service.
3. Keep SERPER_API_KEY, GROQ_API_KEY, and optionally GEMINI_API_KEY in Render Environment. GROQ_MODEL should be a model that works with your account (e.g. openai/gpt-oss-20b if verified).
4. On Android open https://zf-takeaway-v6.onrender.com in Chrome. Tap the Install button when offered; otherwise Chrome menu (three dots) > Add to Home screen > Install.
5. Open the new ZF Takeaway icon on your home screen.

## Limitations
- Online connection is required for menu search, AI analysis and restaurant ordering. The static app shell is cached for offline loading.
- AI output can be malformed or temporarily unavailable; PWA installation does not fix provider-side API errors.
- Publicly indexed menus are not verified live listings. Radius is a preference, not a distance filter.
- This package is not an Android APK or Play Store submission. To publish on Play Store later, wrap the deployed PWA as a Trusted Web Activity (TWA), which requires domain verification and Android signing.
- Restaurant adverts are saved in the current device's localStorage, not shared between devices.
