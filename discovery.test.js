const {test}=require('node:test');const assert=require('node:assert/strict');
const {eligibleDeal,outletName,offerEvidence,dishImage}=require('../discovery');
const {extractPageImage}=require('../discovery');
test('direct platform menu image takes precedence over outlet artwork',()=>{
 const html='<meta property="og:image" content="https://cdn.example/outlet.jpg"><script type="application/ld+json">'+JSON.stringify({'@type':'Menu',hasMenuSection:{hasMenuItem:[{name:'Chicken Burger',image:{url:'https://cdn.example/chicken.jpg'}}]}})+'</script>';
 const image=extractPageImage(html,{title:'Chicken Burger'},src.url);assert.equal(image.imageUrl,'https://cdn.example/chicken.jpg');assert.equal(image.imageKind,'dish');
});
test('unrelated menu item is never labelled as requested dish; outlet photo is explicitly labelled',()=>{
 const html='<meta content="https://cdn.example/outlet.jpg" property="og:image"><script type="application/json">'+JSON.stringify({items:[{title:'Fish and chips',imageUrl:'https://cdn.example/fish.jpg'}]})+'</script>';
 const image=extractPageImage(html,{title:'Chicken Burger'},src.url);assert.equal(image.imageKind,'outlet');assert.equal(image.imageUrl,'https://cdn.example/outlet.jpg');
});
const src={title:'Order Burger House Pretoria',snippet:'Burger House: buy one get one free burger for R99.00 today.',url:'https://www.mrd.com/store/burger'};
const deal={offerEvidence:'buy one get one free',priceEvidence:'R99.00',dealPrice:99,expiresOn:null};
test('full-deal budget boundary, missing and fabricated price evidence',()=>{
 assert.equal(eligibleDeal(deal,src,99,'2026-10-16'),true);
 assert.equal(eligibleDeal(deal,src,98,'2026-10-16'),false);
 assert.equal(eligibleDeal({...deal,dealPrice:49.5},src,99,'2026-10-16'),false);
 assert.equal(eligibleDeal({...deal,priceEvidence:'R49.50'},src,99,'2026-10-16'),false);
 assert.equal(eligibleDeal({...deal,offerEvidence:'2 for 1'},src,99,'2026-10-16'),false);
 assert.equal(eligibleDeal({...deal,expiresOn:'2026-10-15'},src,99,'2026-10-16'),false);
 assert.equal(eligibleDeal({...deal,expiresOn:'2026-10-16'},src,99,'2026-10-16'),true);
});
test('outlet must be supported by source and ordinary discounts are not 2-for-1',()=>{
 assert.equal(outletName('Burger House',src),'Burger House');assert.equal(outletName('Invented Cafe',src),null);assert.equal(offerEvidence('20% discount'),false);
});
test('photo matching rejects unrelated image and accepts matching dish/outlet/source',async()=>{
 const original=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({images:[{title:'Different restaurant burger',imageUrl:'https://img.example/a.jpg',link:src.url},{title:'Burger House burger',imageUrl:'https://img.example/b.jpg',link:src.url}]})});
 try{const r=await dishImage({title:'burger',outletName:'Burger House'},src,'fake');assert.equal(r.imageUrl,'https://img.example/b.jpg')}finally{global.fetch=original}
});
test('image search failure gives honest unavailable result',async()=>{const original=global.fetch;global.fetch=async()=>{throw Error('offline')};try{assert.equal((await dishImage({title:'burger',outletName:'Burger House'},src,'fake')).imageUrl,null)}finally{global.fetch=original}});
