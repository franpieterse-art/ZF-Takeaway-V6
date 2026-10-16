'use strict';
function httpsUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(u.hostname)?u.href:null}catch{return null}}
function offerEvidence(text){return /\b(?:2\s*(?:for|4)\s*1|two\s+for\s+(?:one|1)|buy\s+(?:one|1)\s+get\s+(?:one|1)\s+free|buy\s+(?:one|1)\s+get\s+(?:one|1)|bogo(?:f)?)\b/i.test(text)}
function samePlatform(a,b){try{return new URL(a).hostname.replace(/^www\./,'')===new URL(b).hostname.replace(/^www\./,'')}catch{return false}}
function outletName(value,source){const name=String(value||'').trim().slice(0,150);return name.length>=3&&(`${source.title} ${source.snippet}`).toLowerCase().includes(name.toLowerCase())?name:null}
const pageCache=new Map();
function decode(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(0x10ffff,Number(n))))}
function clean(s){return decode(s).toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim()}
function attrsOf(tag){const attrs={};for(const a of tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[a[1].toLowerCase()]=decode(a[3]);return attrs}
// Read a JSON object embedded in a script assignment without executing website code.
function assignedJSON(script){
 const match=script.match(/(?:window\.)?(?:__PRELOADED_STATE__|__INITIAL_STATE__|__APOLLO_STATE__|__REACT_QUERY_STATE__)\s*=\s*/);if(!match)return null;
 const tail=script.slice(match.index+match[0].length).trim();if(!['{','['].includes(tail[0]))return null;
 let depth=0,quoted=false,escape=false;
 for(let i=0;i<tail.length;i++){const ch=tail[i];if(quoted){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')quoted=false;continue}if(ch==='"'){quoted=true;continue}if(ch==='{'||ch==='[')depth++;if(ch==='}'||ch===']')depth--;if(depth===0){try{return JSON.parse(tail.slice(0,i+1))}catch{return null}}}
 return null;
}
function platformUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['ubereats.com','mrd.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}}
function imageValue(value){
 if(typeof value==='string')return httpsUrl(value.replace(/&amp;/g,'&'));
 if(Array.isArray(value)){for(const x of value){const u=imageValue(x);if(u)return u}}
 if(value&&typeof value==='object')return imageValue(value.url||value.contentUrl||value.imageUrl||value.src);
 return null;
}
function matchDish(a,b){const x=clean(a),y=clean(b);return x.length>=4&&y.length>=4&&(x===y||x.includes(y)||y.includes(x))}
function parsePageJSON(raw){
 try{return JSON.parse(raw)}catch{}
 // Uber serialises hydration quotes as literal Unicode escapes and backslashes as %5C.
 if(!/^\s*[\[{]\s*\\u0022/i.test(raw))return null;
 try{return JSON.parse(raw.replace(/%5C/gi,'\\').replace(/\\u([0-9a-f]{4})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))))}catch{return null}
}
function extractPageImage(html,meal,url){
 let dish=null;
 const walk=(node,depth=0)=>{if(!node||typeof node!=='object'||depth>45||dish)return;
  if(!Array.isArray(node)){
   const name=node.name||node.title||node.displayName;const image=imageValue(node.image||node.images||node.imageUrl||node.photoUrl||node.picture||node.imageData);
   if(typeof name==='string'&&clean(name)===clean(meal.title)&&image){dish={imageUrl:image,imageSource:url,imageKind:'dish'};return}
  }
  for(const v of Object.values(node))if(v&&typeof v==='object')walk(v,depth+1);
 };
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const attrs=attrsOf(match[1]);
  if(/application\/(?:ld\+)?json/i.test(attrs.type||'')||attrs.id==='__NEXT_DATA__')walk(parsePageJSON(match[2]));
  else walk(assignedJSON(match[2]));
 }
 if(dish)return dish;
 // Some restaurant pages expose the dish photo directly in image alt/title text.
 for(const tag of html.matchAll(/<img\b[^>]*>/gi)){
  const attrs=attrsOf(tag[0]);if(clean(attrs.alt||attrs.title)!==clean(meal.title))continue;
  const image=imageValue(attrs['data-src']||attrs.src);
  if(image)return {imageUrl:image,imageSource:url,imageKind:'dish'};
 }
 // Open Graph pictures describe the outlet/listing, not necessarily the meal.
 for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){
  const attrs={};for(const a of tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[a[1].toLowerCase()]=a[3];
  if(['og:image','twitter:image'].includes(attrs.property||attrs.name)){
   const image=imageValue(attrs.content);if(image)return {imageUrl:image,imageSource:url,imageKind:'outlet'};
  }
 }
 return null;
}
async function publicPage(url){
 if(!platformUrl(url))return '';
 const cached=pageCache.get(url);if(cached&&Date.now()-cached.time<300000)return cached.value;
 const pending=(async()=>{try{
  let current=url,r;
  const signal=AbortSignal.timeout(12000);
  for(let hop=0;hop<5;hop++){
   r=await fetch(current,{redirect:'manual',headers:{Accept:'text/html'},signal});
   if(![301,302,303,307,308].includes(r.status))break;
   const target=new URL(r.headers.get('location'),current).href;
   if(!platformUrl(target))return '';current=target;
  }
  if(!r.ok||!r.headers?.get('content-type')?.includes('text/html'))return '';
  const reader=r.body.getReader();let size=0,chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();return ''}chunks.push(Buffer.from(value))}
  return Buffer.concat(chunks).toString('utf8');
 }catch{return ''}})();
 if(pageCache.size>150)pageCache.clear();pageCache.set(url,{time:Date.now(),value:pending});return pending;
}
async function dishImage(meal,source,key){
 const empty={imageUrl:null,imageSource:null,imageKind:null};
 if(!source||!platformUrl(source.url))return empty;
 const direct=extractPageImage(await publicPage(source.url),meal,source.url);
 if(direct?.imageKind==='dish')return direct;
 if(!key)return direct||empty;
 try{
  const r=await fetch('https://google.serper.dev/images',{method:'POST',headers:{'X-API-KEY':key,'Content-Type':'application/json'},body:JSON.stringify({q:`${meal.title} ${meal.outletName} site:${new URL(source.url).hostname}`,num:5,gl:'za'}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)return direct||empty;const j=await r.json();
  const hit=(j.images||[]).find(i=>httpsUrl(i.imageUrl)&&samePlatform(i.link,source.url)&&matchDish(i.title,meal.title)&&(
   clean(meal.title).split(' ').length>=2&&i.link.replace(/\/$/,'')===source.url.replace(/\/$/,'')||meal.outletName&&clean(i.title).includes(clean(meal.outletName))));
  return hit?{imageUrl:httpsUrl(hit.imageUrl),imageSource:hit.link,imageKind:'dish'}:direct||empty;
 }catch{return direct||empty}
}
function eligibleDeal(item,source,budget,today){
 const evidence=String(item.offerEvidence||'');const priceEvidence=String(item.priceEvidence||'');
 const price=Number(item.dealPrice);const snippet=source.snippet||'';
 const quotedPrice=priceEvidence.match(/R\s*(\d{1,4}(?:[.,]\d{2})?)/i);
 if(!evidence||!snippet.includes(evidence)||!offerEvidence(evidence)||!priceEvidence||!snippet.includes(priceEvidence)||!quotedPrice||Number(quotedPrice[1].replace(',','.'))!==price||!Number.isFinite(price)||price<=0||price>budget)return false;
 if(item.expiresOn){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.expiresOn)||!Number.isFinite(Date.parse(item.expiresOn))||item.expiresOn<today)return false}
 return true;
}
module.exports={httpsUrl,offerEvidence,outletName,dishImage,eligibleDeal,extractPageImage,assignedJSON,publicPage,parsePageJSON};
