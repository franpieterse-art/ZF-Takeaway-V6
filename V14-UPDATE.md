# V14 - Automatic restaurant-page photos

Fixed Uber encoded application/json menu hydration, including escaped quotes and backslashes. The app uses the restaurant URLs returned by searches automatically, so users do not need to provide each URL. Exact dish-name matching distinguishes similarly named dishes such as Beef Burger and Beef Burger & Chips. Added support for named image tags and JSON script assignments. Normal HTTPS platform redirects are handled; access blocks are not bypassed.

Verified live public-page retrieval and image extraction against Bangor Kota Shop:
https://www.ubereats.com/za/store/bangor-kota-shop/V905SXIMUSasoINxdD8Dtw
Both named burgers returned distinct Uber-hosted dish image URLs. Nine automated tests passed. Other restaurants and Mr D still depend on the public menu data they expose. No guarantee of a photo for every meal or outlet.

Preserves V13 burger animation, tape pattern, bundled salad, independent specials-price controls, calorie/macro filters, ingredient analysis and Android PWA installation.

Deploy ALL files, especially discovery.js, server.js and public/sw.js. Keep Render environment keys. Start: npm start. Test: npm run check. Deploy latest commit, then close/reopen the app or refresh. The PWA cache has been bumped to V14. The existing URL stays the same.

Full live AI search was not verified successfully: a test of the deployed app encountered upstream AI-provider errors. The dish-photo retrieval fix was independently verified against the supplied restaurant page. Existing model settings and API access still need to be valid for AI meal extraction. This archive does not deploy itself.
