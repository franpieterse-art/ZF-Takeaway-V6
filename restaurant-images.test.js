const {test}=require('node:test');const assert=require('node:assert/strict');
const {restaurantImage,officialCandidate}=require('../restaurant-images');
test('find restaurant then meal on its domain, preserving exact dish match',async()=>{
 const dns=require('node:dns').promises,oldLookup=dns.lookup,oldFetch=global.fetch;const queries=[];
 dns.lookup=async()=>[{address:'93.184.216.34',family:4}];
 global.fetch=async(url,options)=>{if(url.includes('serper.dev')){const q=JSON.parse(options.body).q;queries.push(q);return {ok:true,json:async()=>({organic:q.includes('site:burger.example')?[{title:'Chicken burger',link:'https://burger.example/menu'}]:[{title:'Burger House official',snippet:'Pretoria',link:'https://burger.example/'}]})}}return new Response('<script type="application/ld+json">{"name":"Chicken burger","image":"https://burger.example/chicken.jpg"}</script>',{headers:{'content-type':'text/html'}})};
 try{const r=await restaurantImage({title:'Chicken burger',outletName:'Burger House'},'Pretoria','test');assert.equal(r.imageUrl,'https://burger.example/chicken.jpg');assert.match(queries[1],/site:burger.example/);assert.equal(r.imageProvider,'Restaurant website')}finally{global.fetch=oldFetch;dns.lookup=oldLookup}
});
test('reject delivery sites and local hosts as restaurant sources',()=>{for(const u of ['https://www.ubereats.com/za','https://mrd.com','https://127.0.0.1','https://localhost','http://restaurant.example'])assert.equal(officialCandidate(u),false)});
