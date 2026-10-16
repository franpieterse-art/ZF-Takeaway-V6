# ZF Takeaway V13 - Flying burgers and salad header

- Six decorative mini burgers float above the app name.
- A yellow measuring tape and curved tape pattern decorate the top of the header.
- A bundled salad photograph sits beside the app name. It loads from your own app rather than a third-party image host.
- Header adjusts for narrow phone screens. Motion stops when the device requests reduced motion.
- Existing logo, independent specials price search, calorie/macro search and photo analysis remain.

## Deploy

Upload ALL contents of this archive into the existing app repository and deploy on Render. Include the new public/assets folder, updated server.js and public/sw.js. Keep existing environment variables. Start command: npm start. Close and reopen the installed app after deployment so its new cache activates.

These are decorative header images. They are not photographs of meals returned in searches. Restaurant-result photos still depend on accessible Uber Eats or Mr D source images; a link to the source listing remains available when a photo cannot be loaded.

## Image credit

Salad photo: Unsplash, https://images.unsplash.com/photo-1546069901-ba9599a7e63c (image asset photo-1546069901-ba9599a7e63c). Measuring tape: original SVG decoration. Mini burgers: device-rendered emoji.

## Verification

Automated checks verify search behaviour plus header markup and that both image assets are served with the correct content types. Live app search requires the deployment's API keys. This source archive has not itself deployed V13 to Render.
