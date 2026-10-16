'use strict';
function addMealPhoto(card,meal){
 const figure=document.createElement('figure');figure.className='dish-photo';
 const placeholder=document.createElement('div');placeholder.className='photo-unavailable';placeholder.textContent='Loading platform photo…';figure.append(placeholder);
 const caption=document.createElement('figcaption');figure.append(caption);
 function sourceLink(){try{const u=new URL(meal.imageSource||meal.url);if(u.protocol!=='https:')return;const a=document.createElement('a');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='View photos on '+(meal.platform||'source');figure.append(a)}catch{}}
 try{const url=new URL(meal.imageUrl);if(url.protocol!=='https:')throw Error();
  const img=document.createElement('img');img.alt=meal.imageKind==='outlet'?'Outlet image from '+meal.platform:meal.title+' at '+(meal.outletName||'the outlet');img.loading='lazy';
  img.onload=()=>placeholder.remove();img.onerror=()=>{img.remove();placeholder.textContent='Platform photo could not load';caption.textContent='Open the listing to view its photos.';};
  caption.textContent=meal.imageKind==='outlet'?'Outlet/listing photo - exact dish photo not exposed':'Dish image from '+(meal.platform||'source')+' - confirm portion';figure.insertBefore(img,caption);img.src=url.href;
 }catch{placeholder.textContent='Photo available on source listing';caption.textContent='A direct image could not be retrieved.'}
 sourceLink();card.append(figure);
}
document.addEventListener('DOMContentLoaded',()=>{
 const button=document.getElementById('specials');button.onclick=async()=>{
  const msg=document.getElementById('specialsMsg'),out=document.getElementById('specialResults');const budget=Number(document.getElementById('specialBudget').value);
  if(!Number.isFinite(budget)||budget<=0){msg.textContent='Enter a positive maximum price in Rand.';return}
  out.replaceChildren();button.disabled=true;msg.textContent='Looking for indexed 2-for-1 offers up to R'+budget.toFixed(2)+' for the full deal…';
  try{const r=await fetch('/api/specials',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({budget,location:document.getElementById('specialLocation').value})});const data=await r.json();if(!r.ok)throw Error(data.error||'Specials search failed');msg.textContent=data.notice;
   if(!data.items.length){const p=document.createElement('p');p.textContent='No clearly priced 2-for-1 deals found within this budget. Try a higher limit or another area.';out.append(p)}
   for(const deal of data.items){const card=document.createElement('article');card.className='result special-card';addMealPhoto(card,deal);
    function line(tag,value,cl){const el=document.createElement(tag);el.textContent=value;if(cl)el.className=cl;card.append(el);return el}
    line('span','2 FOR 1','deal-badge');line('h3',deal.title);line('p','Outlet: '+deal.outletName,'outlet');line('p','R'+deal.price.toFixed(2)+' total for the deal','price');line('p',deal.offerEvidence,'hint');if(deal.terms)line('p',deal.terms,'hint');if(deal.expiresOn)line('p','Listed expiry: '+deal.expiresOn,'hint');line('p','Indexed offer - availability not confirmed','hint');
    const a=line('a','Check offer on '+deal.platform+' ↗');a.href=deal.url;a.target='_blank';a.rel='noopener noreferrer';out.append(card);
   }
  }catch(e){msg.textContent=e.message}finally{button.disabled=false}
 };
});
