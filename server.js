const {restaurantImage}=require('./restaurant-images');
'use strict';
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const {outletName,dishImage,eligibleDeal}=require('./discovery');
const PORT=Number(process.env.PORT)||3000;const ROOT=path.join(__dirname,'public');
function send(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
function safeUrl(s){try{let u=new URL(s);return u.protocol==='https:'&&['ubereats.com','www.ubereats.com','mrd.com','www.mrd.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))?u.href:null}catch{return null}}
async function body(req,max=7e6){let chunks=[],n=0;for await(const c of req){n+=c.length;if(n>max)throw Error('Upload too large (maximum 7 MB).');chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Error('Invalid JSON request')}}
function norm(x){return String(x||'').trim().slice(0,300)}
async function serper(query){let r=await fetch('https://google.serper.dev/search',{method:'POST',headers:{'X-API-KEY':process.env.SERPER_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({q:query,num:10,gl:'za',hl:'en'}),signal:AbortSignal.timeout(14000)});if(!r.ok)throw Error('Search service returned '+r.status);return r.json()}
function priceFrom(s){let m=String(s).match(/(?:R\s?)(\d{1,4})(?:[.,](\d{2}))?/i);return m?Number(m[1]+'.'+(m[2]||'00')):null}
async function geminiJSON(prompt,image){
if(!process.env.GEMINI_API_KEY)throw Error('GEMINI_API_KEY is not configured in Render Environment.');
const parts=[{text:prompt}];
if(image){const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);if(!m||image.length>6e6)throw Error('Use JPG, PNG or WebP smaller than approximately 4 MB.');parts.push({inline_data:{mime_type:'image/'+m[1],data:m[2]}})}
const models=[process.env.GEMINI_MODEL||'gemini-2.5-flash',process.env.GEMINI_BACKUP_MODEL||'gemini-2.5-flash'].filter((m,i,arr)=>m&&arr.indexOf(m)===i);
let lastError='Gemini is unavailable';
for(const model of models){
  for(let attempt=0;attempt<3;attempt++){
    try{
      const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:0.1}}),signal:AbortSignal.timeout(35000)});
      const j=await r.json();
      if(r.ok){const txt=(j.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');try{return JSON.parse(txt)}catch{throw Error('Gemini did not return valid JSON')}}
      lastError=j.error?.message||'Gemini request failed ('+r.status+')';
      const temporary=[429,500,502,503,504].includes(r.status)||/high demand|overloaded|unavailable|resource exhausted/i.test(lastError);
      if(!temporary)break;
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(2**attempt)));
    }catch(e){lastError=e.message||String(e);if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(2**attempt)));}
  }
}
throw Error('AI models are unavailable. '+lastError+' Try later or change GEMINI_MODEL / GEMINI_BACKUP_MODEL in Render.');
}
async function groqJSON(prompt,image){
if(!process.env.GROQ_API_KEY)throw Error('GROQ_API_KEY is not configured in Render Environment.');
const model=image?(process.env.GROQ_VISION_MODEL||'meta-llama/llama-4-scout-17b-16e-instruct'):(process.env.GROQ_MODEL||'openai/gpt-oss-20b');
const content=image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:image}}]:prompt;
if(image){if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>6e6)throw Error('Use JPG, PNG or WebP smaller than approximately 4 MB.');}
let last='Groq request failed';
for(let attempt=0;attempt<3;attempt++){
try{
 const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.GROQ_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:'You are a cautious South African takeaway nutrition estimation assistant. Return a valid JSON object only. Never invent exact restaurant prices or verified nutrition.'},{role:'user',content}],temperature:0,max_tokens:5000,response_format:{type:'json_object'}}),signal:AbortSignal.timeout(35000)});
 const j=await r.json();
 if(r.ok){let txt=j.choices?.[0]?.message?.content||'';txt=txt.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();try{return JSON.parse(txt)}catch(e){last='Groq returned malformed or incomplete JSON';if(attempt<2){await new Promise(resolve=>setTimeout(resolve,600*(attempt+1)));continue;}break;}}
 last=j.error?.message||'Groq HTTP '+r.status;
 if(![429,500,502,503,504].includes(r.status))break;
 if(attempt<2)await new Promise(resolve=>setTimeout(resolve,800*(2**attempt)));
}catch(e){last=e.message||String(e);if(attempt<2)await new Promise(resolve=>setTimeout(resolve,800*(2**attempt)));}
}
throw Error('Groq: '+last);
}
async function aiJSON(prompt,image){
 let failures=[];
 if(process.env.GROQ_API_KEY){try{return await groqJSON(prompt,image)}catch(e){failures.push(e.message)}}
 if(process.env.GEMINI_API_KEY){try{return await geminiJSON(prompt,image)}catch(e){failures.push(e.message)}}
 throw Error(failures.length?'Both AI providers failed: '+failures.join(' | '):'Set GROQ_API_KEY or GEMINI_API_KEY in Render Environment.');
}
async function geminiEstimate({image,description,ingredients}){
if(!image&&!norm(description))throw Error('Add a meal description or upload a food photo.');
const prompt='Estimate nutrition for this restaurant meal. Treat image as uncertain; do not claim exact weights. Return STRICT JSON object only with keys: name (string), confidence ("low"|"medium"), disclaimer (string), ingredients (array of {name:string, grams:number, calories:number, protein:number, carbs:number, fat:number}). Include oil, sauces, bread or sides if plausible. Macro units grams, calories kcal. Estimate from visible portion and/or description. All numbers >=0, ingredient weights reasonable. Do not invent exact brand nutrition. Meal description: '+norm(description)+'; user adjustments: '+JSON.stringify(ingredients||[]).slice(0,3500);
let v=await aiJSON(prompt,image);if(!Array.isArray(v.ingredients))throw Error('AI returned an unexpected response');v.ingredients=v.ingredients.slice(0,25).map(i=>({name:norm(i.name)||'Ingredient',...Object.fromEntries(['grams','calories','protein','carbs','fat'].map(k=>[k,Math.max(0,Math.min(10000,Number(i[k])||0))]))}));return v
}
const server=http.createServer(async(req,res)=>{try{let url=new URL(req.url,'http://localhost');if(req.method==='GET'&&url.pathname==='/api/status')return send(res,200,{search:!!process.env.SERPER_API_KEY,ai:!!(process.env.GROQ_API_KEY||process.env.GEMINI_API_KEY),primary:process.env.GROQ_API_KEY?'groq':(process.env.GEMINI_API_KEY?'gemini':'none')});if(req.method==='POST'&&url.pathname==='/api/specials'){
 if(!process.env.SERPER_API_KEY)return send(res,503,{error:'Add SERPER_API_KEY in Render Environment.'});
 if(!process.env.GROQ_API_KEY&&!process.env.GEMINI_API_KEY)return send(res,503,{error:'Add GROQ_API_KEY or GEMINI_API_KEY in Render Environment.'});
 const b=await body(req,15000),budget=Number(b.budget),location=norm(b.location)||'Pretoria';
 if(!Number.isFinite(budget)||budget<=0)return send(res,400,{error:'Enter a positive maximum deal price in Rand.'});
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Johannesburg'});
 const searches=await Promise.allSettled(['site:ubereats.com/za','site:mrd.com'].map(site=>serper(`${location} ("2 for 1" OR "two for one" OR "buy one get one free") ${site} specials meal price`)));
 const raw=searches.flatMap(r=>r.status==='fulfilled'?(r.value.organic||[]):[]);
 if(searches.every(r=>r.status==='rejected'))throw Error('Specials search is unavailable. Please try again.');
 const listings=[...new Map(raw.map(x=>[x.link,{title:norm(x.title),snippet:String(x.snippet||'').slice(0,1400),url:safeUrl(x.link),platform:String(x.link||'').includes('ubereats')?'Uber Eats':'Mr D'}])).values()].filter(x=>x.url).slice(0,16);
 if(!listings.length)return send(res,200,{items:[],notice:'No publicly indexed 2-for-1 listings found. Try another area.'});
 const prompt=`Extract only explicit TWO-FOR-ONE meal offers from these indexed snippets. Today in South Africa is ${today}. Never infer a deal from two unrelated prices or from a generic promotion. Never invent dish names, outlet names, prices, terms or dates. Price must be the FULL amount paid for BOTH meals, not per-person or half the price. Omit offers where total deal price is unclear. Omit visibly expired promotions. Return {items:[{sourceIndex:integer,name:string,outletName:string|null,dealPrice:number,offerEvidence:string,priceEvidence:string,terms:string,expiresOn:string|null}]}. offerEvidence and priceEvidence must be exact substrings of the source snippet. priceEvidence must include the Rand price for the full offer. expiresOn must be YYYY-MM-DD only if explicit in source, else null. Restaurant name must be copied exactly from title or snippet, else null. Max 12 offers. Sources: ${JSON.stringify(listings)}`;
 const data=await aiJSON(prompt),seen=new Set(),items=[];
 for(const x of (Array.isArray(data.items)?data.items:[]).slice(0,24)){
  const src=listings[x.sourceIndex];if(!Number.isInteger(x.sourceIndex)||!src||!norm(x.name)||!eligibleDeal(x,src,budget,today))continue;
  const outlet=outletName(x.outletName,src);if(!outlet)continue;
  const key=outlet.toLowerCase()+'|'+norm(x.name).toLowerCase()+'|'+x.dealPrice;if(seen.has(key))continue;seen.add(key);
  items.push({title:norm(x.name),outletName:outlet,price:Number(x.dealPrice),offerEvidence:norm(x.offerEvidence),terms:norm(x.terms),expiresOn:x.expiresOn||null,platform:src.platform,url:src.url,checkedAt:new Date().toISOString(),imageUrl:null,imageSource:null});
 }
 for(let i=0;i<items.length;i+=4)await Promise.all(items.slice(i,i+4).map(async item=>Object.assign(item,await restaurantImage(item,location,process.env.SERPER_API_KEY))));
 items.sort((a,b)=>a.price-b.price);
 return send(res,200,{items,notice:'Indexed 2-for-1 offers within your total deal budget. Confirm current price, outlet, portions and terms on the source. Delivery and service fees may be extra. Nutrition targets do not apply to this specials search. Meal photos are searched on restaurant websites. A matching photo may be unavailable.'});
}
if(req.method==='POST'&&url.pathname==='/api/search'){
if(!process.env.SERPER_API_KEY)return send(res,503,{error:'Add SERPER_API_KEY in Render Environment.'});
if(!process.env.GROQ_API_KEY&&!process.env.GEMINI_API_KEY)return send(res,503,{error:'Add GROQ_API_KEY or GEMINI_API_KEY in Render Environment to estimate calories.'});
let b=await body(req,15000),location=norm(b.location)||'Pretoria',categories=(Array.isArray(b.categories)?b.categories:[]).filter(x=>['Chicken','Beef','Burgers','Pizza','Other'].includes(x));
let terms=categories.length===5||!categories.length?'takeaway meal':categories.join(' OR ');
let q=`${terms} ${location} menu price site:ubereats.com/za OR site:mrd.com`;
let j=await serper(q);
let listings=(j.organic||[]).map(x=>({title:norm(x.title),snippet:String(x.snippet||'').slice(0,900),url:safeUrl(x.link),platform:String(x.link||'').includes('ubereats')?'Uber Eats':'Mr D'})).filter(x=>x.url).slice(0,8);
if(!listings.length)return send(res,200,{items:[],notice:'No publicly indexed menu listings found.'});
let instruction=`You extract DISTINCT individual orderable meals from short Google search result snippets for South African takeaway sites, then estimate approximate nutrition based on a typical serving. Do not treat a restaurant name, menu category, family combo, or several dishes as one individual meal. Never invent menu items not mentioned. If a snippet has multiple dishes and prices, make separate items ONLY when a price clearly belongs to that dish. When unsure, set price=null. Return JSON object {items:[{sourceIndex: integer, name: string, outletName: string|null (restaurant or outlet name copied exactly from the source text; never the delivery platform), category: "Chicken"|"Beef"|"Burgers"|"Pizza"|"Other", price: number|null, calories: number, protein: number, carbs: number, fat: number, estimatedGrams: number, confidence:"low"|"medium", reasoning: string}]}. Max 3 distinct dishes per source and 16 total. Calories kcal, macros grams. Nutrition is an approximate estimate from TEXT, not a food photo. Use conservative realistic portions including sauces/oils where plausible; don't pretend estimates are exact. If no individual meal can be identified from a source, omit it. Do not make up prices or ingredients as facts. Source indices are zero based. Input listings: ${JSON.stringify(listings.map((x,i)=>({sourceIndex:i,title:x.title,snippet:x.snippet})))}`;
let extracted=(await aiJSON(instruction)).items||[];
let valid=extracted.slice(0,24).filter(x=>Number.isInteger(x.sourceIndex)&&listings[x.sourceIndex]&&norm(x.name)).map(x=>{let src=listings[x.sourceIndex];let num=k=>Math.max(0,Math.min(10000,Number(x[k])||0));return {title:norm(x.name),outletName:outletName(x.outletName,src),category:['Chicken','Beef','Burgers','Pizza','Other'].includes(x.category)?x.category:'Other',price:x.price===null||x.price===undefined?null:(Number.isFinite(Number(x.price))&&Number(x.price)>0?Number(x.price):null),calories:num('calories'),protein:num('protein'),carbs:num('carbs'),fat:num('fat'),estimatedGrams:num('estimatedGrams'),confidence:x.confidence==='medium'?'medium':'low',reasoning:norm(x.reasoning),platform:src.platform,url:src.url,sourceTitle:src.title}}).filter(x=>x.calories>0);
for(let i=0;i<valid.length;i+=4){await Promise.all(valid.slice(i,i+4).map(async meal=>{let source=listings.find(s=>s.url===meal.url);Object.assign(meal,await restaurantImage(meal,location,process.env.SERPER_API_KEY))}))}
let chosen=categories.length?valid.filter(x=>categories.includes(x.category)):valid;
let maxCal=Number(b.cal)||0,maxPrice=Number(b.budget)||0;
const macroLimit=k=>b[k]===null||b[k]===undefined||b[k]===''?null:(Number.isFinite(Number(b[k]))&&Number(b[k])>=0?Number(b[k]):null);
let maxFat=macroLimit('maxFat'),maxCarbs=macroLimit('maxCarbs'),minProtein=macroLimit('minProtein');
chosen=chosen.map(x=>({...x,withinCalories:!maxCal||x.calories<=maxCal,withinBudget:x.price!==null&&(!maxPrice||x.price<=maxPrice),withinMacros:(maxFat===null||x.fat<=maxFat)&&(maxCarbs===null||x.carbs<=maxCarbs)&&(minProtein===null||x.protein>=minProtein)}));
chosen.sort((a,b)=>Number(b.withinCalories&&b.withinBudget&&b.withinMacros)-Number(a.withinCalories&&a.withinBudget&&a.withinMacros));
return send(res,200,{items:chosen,notice:'AI estimates from publicly indexed TEXT snippets, not actual meal photographs. Prices may be old or missing. No live menu, distance or stock verification. Unknown prices are not confirmed within budget.'});
}if(req.method==='POST'&&url.pathname==='/api/analyze'){let b=await body(req);return send(res,200,await geminiEstimate(b))}if(req.method==='GET'){let p=url.pathname==='/'?'/index.html':url.pathname;let f=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!f.startsWith(ROOT+path.sep))return send(res,403,{error:'Forbidden'});let ext=path.extname(f);if(!['.html','.js','.css','.png','.ico','.json','.webmanifest','.jpg','.svg'].includes(ext))return send(res,404,{error:'Not found'});return fs.readFile(f,(e,data)=>{if(e)return send(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':({'.jpg':'image/jpeg','.svg':'image/svg+xml','.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream','Cache-Control':(['.html','.js','.css'].includes(ext)||p==='/manifest.webmanifest')?'no-cache':'public, max-age=3600'});res.end(data)})}send(res,405,{error:'Method not allowed'})}catch(e){send(res,400,{error:e.message||'Unexpected error'})}});server.listen(PORT,'0.0.0.0',()=>console.log('ZF Takeaway V15 Restaurant Website Photos listening on '+PORT));
