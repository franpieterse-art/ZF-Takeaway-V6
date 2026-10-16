const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
test('search and specials routes preserve nutrition, show outlet/photos and enforce full deal price',async()=>{
 const port=34879;
 const script=`global.fetch=async(url)=>({ok:true,json:async()=>url.includes('serper.dev/images')?{images:[{title:'Burger House Chicken burger',imageUrl:'https://cdn.example/burger.jpg',link:'https://www.mrd.com/store/burger'}]}:url.includes('serper.dev/search')?{organic:[{title:'Burger House Pretoria',snippet:'Burger House Chicken burger R99.00. Buy one get one free for R99.00.',link:'https://www.mrd.com/store/burger'}]}:{choices:[{message:{content:JSON.stringify({items:[{sourceIndex:0,name:'Chicken burger',outletName:'Burger House',category:'Burgers',price:99,dealPrice:99,offerEvidence:'Buy one get one free',priceEvidence:'R99.00',expiresOn:null,calories:500,protein:30,carbs:40,fat:20,estimatedGrams:250,confidence:'low'}]})}}]}});require('./server');`;
 const child=spawn(process.execPath,['-e',script],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),SERPER_API_KEY:'test',GROQ_API_KEY:'test'},stdio:['ignore','pipe','pipe']});
 try{
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('early exit '+code)))});
 const post=async(route,data)=>{const r=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json()}};
 let r=await post('search',{budget:100,cal:600,categories:['Burgers'],minProtein:25});assert.equal(r.status,200);assert.equal(r.body.items[0].outletName,'Burger House');assert.equal(r.body.items[0].withinMacros,true);assert.equal(r.body.items[0].imageUrl,'https://cdn.example/burger.jpg');
 r=await post('specials',{budget:99,location:'Pretoria'});assert.equal(r.body.items.length,1);assert.equal(r.body.items[0].price,99);assert.equal(r.body.items[0].outletName,'Burger House');assert.equal(r.body.items[0].imageUrl,'https://cdn.example/burger.jpg');
 r=await post('specials',{budget:98});assert.equal(r.body.items.length,0);r=await post('specials',{budget:0});assert.equal(r.status,400);
 const sw=await (await fetch(`http://127.0.0.1:${port}/sw.js`)).text();assert.match(sw,/v14-1-fresh-assets/);assert.match(sw,/specials.js/);
 const client=await (await fetch(`http://127.0.0.1:${port}/specials.js`)).text();assert.match(client,/getElementById\('specialBudget'\)/);assert.match(client,/getElementById\('specialLocation'\)/);assert.doesNotMatch(client,/getElementById\('budget'\)/);
 const html=await (await fetch(`http://127.0.0.1:${port}/`)).text();assert.match(html,/id="specialBudget"/);assert.match(html,/id="cal"/);assert.match(html,/id="specialsPanel"/);
 assert.match(html,/specials\.js\?v=14\.1/);assert.match(html,/Version 14\.1/);assert.match(html,/header-salad/);assert.match(html,/flying-burger/);
 for(const [asset,type] of [['salad.jpg','image/jpeg'],['measuring-tape.svg','image/svg+xml']]){const r=await fetch(`http://127.0.0.1:${port}/assets/${asset}`);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),type);assert.ok((await r.arrayBuffer()).byteLength>100)}
 }finally{child.kill()}
});
