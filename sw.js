const CACHE='zf-takeaway-android-v1';
const SHELL=['/','/index.html','/style.css','/app.js','/pwa.js','/logo.png','/icon-192.png','/icon-512.png','/manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const req=e.request;const u=new URL(req.url);if(req.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/'))return;
if(req.mode==='navigate'){e.respondWith(fetch(req).catch(()=>caches.match('/index.html')));return;}
e.respondWith(caches.match(req).then(hit=>hit||fetch(req)));});
