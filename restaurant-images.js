'use strict';
const dns=require('node:dns').promises;
const net=require('node:net');
const {extractPageImage}=require('./discovery');
const blocked=new net.BlockList();
for(const [a,p] of [['0.0.0.0',8],['10.0.0.0',8],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['100.64.0.0',10],['224.0.0.0',4],['240.0.0.0',4]])blocked.addSubnet(a,p,'ipv4');
for(const [a,p] of [['::',96],['fc00::',7],['fe80::',10],['ff00::',8]])blocked.addSubnet(a,p,'ipv6');
function officialCandidate(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&!/(^|\.)(ubereats\.com|mrd\.com|facebook\.com|instagram\.com|tripadvisor\.[a-z.]+|restaurantguru\.com|youtube\.com|tiktok\.com)$/.test(u.hostname)&&!net.isIP(u.hostname.replace(/[\[\]]/g,''))&&!/localhost|\.local$/.test(u.hostname)}catch{return false}}
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function restaurantMatch(hit,name){const words=normalize(name).split(' ').filter(w=>w.length>1&&!['the','and','restaurant','takeaway','takeaways','shop'].includes(w));const text=normalize(hit.title+' '+hit.snippet+' '+new URL(hit.link).hostname);return words.length>0&&words.every(w=>text.includes(w))}
async function search(q,key,type='search') {const r=await fetch('https://google.serper.dev/'+type,{method:'POST',headers:{'X-API-KEY':key,'Content-Type':'application/json'},body:JSON.stringify({q,num:5,gl:'za',hl:'en'}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Search unavailable');return r.json()}
async function page(url,host){try{for(let i=0;i<4;i++) {const u=new URL(url);if(!officialCandidate(url)||u.hostname!==host)return '';const ips=await dns.lookup(host,{all:true});if(!ips.length||ips.some(x=>blocked.check(x.address,x.family===6?'ipv6':'ipv4')))return '';const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(8000)});if([301,302,303,307,308].includes(r.status)){url=new URL(r.headers.get('location'),url).href;continue}if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))return '';let size=0,chunks=[];for await(const b of r.body){size+=b.length;if(size>2000000)return '';chunks.push(Buffer.from(b))}return Buffer.concat(chunks).toString('utf8')} }catch{}return ''}
async function restaurantImage(meal,location,key){const empty={imageUrl:null,imageSource:null,imageKind:null,restaurantUrl:null};if(!key||!meal.outletName)return empty;
try {const found=await search(`"${meal.outletName}" ${location} official restaurant menu -site:ubereats.com -site:mrd.com`,key);const candidate=(found.organic||[]).find(x=>officialCandidate(x.link)&&restaurantMatch(x,meal.outletName));if(!candidate)return empty;
const host=new URL(candidate.link).hostname;const result={...empty,restaurantUrl:candidate.link};
const menu=await search(`site:${host} "${meal.title}"`,key);const urls=[...new Set((menu.organic||[]).map(x=>x.link).filter(x=>officialCandidate(x)&&new URL(x).hostname===host).concat(candidate.link))].slice(0,3);
for(const url of urls){let html=await page(url,host);html=html.replace(/(<img\b[^>]*\b(?:src|data-src)=)(["'])([^"']+)\2/gi,(all,p,q,v)=>{try{return p+q+new URL(v,url).href+q}catch{return all}});const image=extractPageImage(html,meal,url);if(image?.imageKind==='dish')return {...result,...image,imageProvider:'Restaurant website'};}
return result;
}catch{return empty}}
module.exports={restaurantImage,officialCandidate,restaurantMatch};
