const {test}=require('node:test');const assert=require('node:assert/strict');const {extractPageImage,publicPage}=require('../discovery');
test('Uber encoded hydration gives exact photos for similarly named dishes',()=>{
 const state={queries:[{state:{data:{metaJson:'{"name":"Bangor Kota Shop"}',catalogItems:[{title:'Beef Burger & Chips',imageUrl:'https://tb-static.uber.com/chips.jpeg'},{title:'Beef Burger',imageUrl:'https://tb-static.uber.com/burger.jpeg'}]}}}]};
 const encoded=JSON.stringify(state).replace(/\\/g,'%5C').replace(/"/g,'\\u0022');
 const html='<script type="application/json" id="__REACT_QUERY_STATE__">'+encoded+'</script>';
 assert.equal(extractPageImage(html,{title:'Beef Burger'},'https://www.ubereats.com/za/store/bangor/id').imageUrl,'https://tb-static.uber.com/burger.jpeg');
 assert.equal(extractPageImage(html,{title:'Beef Burger &amp; Chips'},'https://www.ubereats.com/za/store/bangor/id').imageUrl,'https://tb-static.uber.com/chips.jpeg');
});
test('ordinary platform redirects work; redirects outside platforms are rejected',async()=>{
 const original=global.fetch;let calls=0;
 global.fetch=async u=>{calls++;if(u.endsWith('/test-redirect'))return new Response(null,{status:302,headers:{location:'/za/store/test-final'}});return new Response('<html>restaurant</html>',{headers:{'content-type':'text/html'}})};
 try{assert.equal(await publicPage('https://www.ubereats.com/test-redirect'),'<html>restaurant</html>');assert.equal(calls,2);
 global.fetch=async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});assert.equal(await publicPage('https://www.ubereats.com/test-blocked'),'');}finally{global.fetch=original}
});
