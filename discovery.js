'use strict';
function httpsUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!/^(localhost|127\.|10\.|192\.168\.|\[::1\])/.test(u.hostname)?u.href:null}catch{return null}}
function offerEvidence(text){return /\b(?:2\s*(?:for|4)\s*1|two\s+for\s+(?:one|1)|buy\s+(?:one|1)\s+get\s+(?:one|1)\s+free|buy\s+(?:one|1)\s+get\s+(?:one|1)|bogo(?:f)?)\b/i.test(text)}
function samePlatform(a,b){try{return new URL(a).hostname.replace(/^www\./,'')===new URL(b).hostname.replace(/^www\./,'')}catch{return false}}
function outletName(value,source){const name=String(value||'').trim().slice(0,150);return name.length>=3&&(`${source.title} ${source.snippet}`).toLowerCase().includes(name.toLowerCase())?name:null}
async function dishImage(meal,source,key){
 if(!key||!meal.outletName)return {imageUrl:null,imageSource:null};
 try{
  const r=await fetch('https://google.serper.dev/images',{method:'POST',headers:{'X-API-KEY':key,'Content-Type':'application/json'},body:JSON.stringify({q:`${meal.title} ${meal.outletName} site:${new URL(source.url).hostname}`,num:5,gl:'za'}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)return {imageUrl:null,imageSource:null};const j=await r.json();
  const tokens=meal.title.toLowerCase().match(/[a-z]{4,}/g)||[];
  const hit=(j.images||[]).find(i=>httpsUrl(i.imageUrl)&&samePlatform(i.link,source.url)&&String(i.title||'').toLowerCase().includes(meal.outletName.toLowerCase())&&tokens.some(t=>String(i.title||'').toLowerCase().includes(t)));
  return hit?{imageUrl:httpsUrl(hit.imageUrl),imageSource:hit.link}:{imageUrl:null,imageSource:null};
 }catch{return {imageUrl:null,imageSource:null}}
}
function eligibleDeal(item,source,budget,today){
 const evidence=String(item.offerEvidence||'');const priceEvidence=String(item.priceEvidence||'');
 const price=Number(item.dealPrice);const snippet=source.snippet||'';
 const quotedPrice=priceEvidence.match(/R\s*(\d{1,4}(?:[.,]\d{2})?)/i);
 if(!evidence||!snippet.includes(evidence)||!offerEvidence(evidence)||!priceEvidence||!snippet.includes(priceEvidence)||!quotedPrice||Number(quotedPrice[1].replace(',','.'))!==price||!Number.isFinite(price)||price<=0||price>budget)return false;
 if(item.expiresOn){if(!/^\d{4}-\d{2}-\d{2}$/.test(item.expiresOn)||!Number.isFinite(Date.parse(item.expiresOn))||item.expiresOn<today)return false}
 return true;
}
module.exports={httpsUrl,offerEvidence,outletName,dishImage,eligibleDeal};
