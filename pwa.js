// Installable Android app shell. API requests are always network-only.
let deferredInstall;
const installButton=document.getElementById('installApp');
const hint=document.getElementById('installHint');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;installButton.hidden=false;hint.textContent='Tap Install to add ZF Takeaway to your Android home screen.';});
installButton.addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installButton.hidden=true;});
window.addEventListener('appinstalled',()=>{hint.textContent='ZF Takeaway is installed on this device.';installButton.hidden=true;});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}
if(window.matchMedia('(display-mode: standalone)').matches){document.getElementById('installPanel').hidden=true;}
