'use strict';
function httpsUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(u.hostname)?u.href:null}catch{return null}}
function offerEvidence(text){return /\b(?:2\s*(?:for|4)\s*1|two\s+for\s+(?:one|1)|buy\s+(?:one|1)\s+get\s+(?:one|1)\s+free|buy\s+(?:one|1)\s+get\s+(?:one|1)|bogo(?:f)?)\b/i.test(text)}
function samePlatform(a,b){try{return new URL(a).hostname.replace(/^www\./,'')===new URL(b).hostname.replace(/^www\./,'')}catch{return false}}
function outletName(value,source){const name=String(value||'').trim().slice(0,150);return name.length>=3&&(`${source.title} ${source.snippet}`).toLowerCase().includes(name.toLowerCase())?name:null}
const pageCache=new Map();
function clean(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function platformUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['ubereats.com','mrd.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}}
function imageValue(value){
 if(typeof value==='string')return httpsUrl(value.replace(/&amp;/g,'&'));
 if(Array.isArray(value)){for(const x of value){const u=imageValue(x);if(u)return u}}
 if(value&&typeof value==='object')return imageValue(value.url||value.contentUrl||value.imageUrl||value.src);
 return null;
}
function matchDish(a,b){const x=clean(a),y=clean(b);return x.length>=4&&y.length>=4&&(x===y||x.includes(y)||y.includes(x))}
function extractPageImage(html,meal,url){
 let dish=null;
 const walk=(node,depth=0)=>{if(!node||typeof node!=='object'||depth>45||dish)return;
  if(!Array.isArray(node)){
   const name=node.name||node.title||node.displayName;const image=imageValue(node.image||node.images||node.imageUrl||node.photoUrl||node.picture||node.imageData);
   if(typeof name==='string'&&matchDish(name,meal.title)&&image){dish={imageUrl:image,imageSource:url,imageKind:'dish'};return}
  }
  for(const v of Object.values(node))if(v&&typeof v==='object')walk(v,depth+1);
 };
 for(const match of html.matchAll(/<script\b[^>]*(?:type\s*=\s*["']application\/(?:ld\+)?json["']|id\s*=\s*["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/gi)){
  try{walk(JSON.parse(match[1]))}catch{}
 }
 if(dish)return dish;
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
  const r=await fetch(url,{redirect:'error',headers:{Accept:'text/html'},signal:AbortSignal.timeout(9000)});
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
module.exports={httpsUrl,offerEvidence,outletName,dishImage,eligibleDeal,extractPageImage};
