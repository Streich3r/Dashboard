/* IVY Dashboard V53 – atomic offline-first shell; one active build cache. */
'use strict';
const BUILD='53';
const CACHE_NAME='ivy-dashboard-shell-natural-v53';
const CACHE_PREFIX='ivy-dashboard-shell-';
const SHELL_FILES=["./index.html","./app.css","./particles.js","./app.js","./weather.js","./version.json","./manifest.json","./icons/favicon.ico","./icons/favicon-16x16.png","./icons/favicon-32x32.png","./icons/favicon-48x48.png","./icons/favicon-64x64.png","./icons/apple-touch-icon.png","./icons/apple-touch-icon-167x167.png","./icons/apple-touch-icon-152x152.png","./icons/icon-128.png","./icons/icon-192.png","./icons/icon-256.png","./icons/icon-512.png"];
const base=new URL(self.registration.scope);
const indexURL=new URL('./index.html',base).href;
const homeURL=new URL('./',base).href;
const requiredAssets=new Set(SHELL_FILES.slice(1).map(p=>new URL(p,base).href));
async function sha(text){const value=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(value),v=>v.toString(16).padStart(2,'0')).join('')}
async function fresh(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);try{const res=await fetch(url,{cache:'no-store',signal:c.signal});if(!res.ok||res.type!=='basic')throw new Error('Shell-Datei fehlt: '+url);return res}finally{clearTimeout(t)}}
const ICON_CACHE='ivy-dashboard-favicons-v1';
const imageInflight=new Map();
function imageKey(url){const u=new URL(url);if(u.hostname==='www.google.com'&&u.pathname==='/s2/favicons'){let domain=u.searchParams.get('domain')||u.searchParams.get('domain_url')||'';try{domain=new URL(domain.includes('://')?domain:'https://'+domain).hostname.toLowerCase().replace(/^www\./,'')}catch(_){}return new URL('__ivy_icons__/google/'+encodeURIComponent(domain)+'/'+(u.searchParams.get('sz')||'64'),base).href}return u.href}
async function imageResponse(req){const cache=await caches.open(ICON_CACHE),key=imageKey(req.url);const hit=await cache.match(key)||await cache.match(req);if(hit)return hit;
 if(imageInflight.has(key))return (await imageInflight.get(key)).clone();
 const work=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);try{const res=await fetch(req,{signal:controller.signal});if(res.ok||res.type==='opaque'){try{await cache.put(key,res.clone())}catch(_){/* Browser storage may be full; rendering still succeeds. */}return res}throw Error('icon unavailable')}finally{clearTimeout(timer)}})();imageInflight.set(key,work);
 try{return (await work).clone()}catch(_){return Response.error()}finally{imageInflight.delete(key)}
}

self.addEventListener('install',event=>event.waitUntil((async()=>{
  // Never activate an incomplete deployment: first verify every file and the HTML fingerprint.
  const resources=await Promise.all(SHELL_FILES.map(async path=>[new URL(path,base).href,await fresh(new URL(path,base).href)]));
  const byURL=new Map(resources);
  const index=await byURL.get(indexURL).clone().text();
  const metadata=await byURL.get(new URL('./version.json',base).href).clone().json();
  if(metadata.build!==BUILD||metadata.hash!==await sha(index))throw new Error('Version oder HTML-Hash inkonsistent');
  for(const [path,expected] of Object.entries(metadata.assets||{})){const response=byURL.get(new URL('./'+path,base).href);if(!response)throw Error('Missing build asset: '+path);const raw=await response.clone().arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',raw);const actual=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');if(actual!==expected)throw Error('Build asset mismatch: '+path)}
  const style=await byURL.get(new URL('./app.css',base).href).clone().text();
  const particles=await byURL.get(new URL('./particles.js',base).href).clone().text();
  const script=await byURL.get(new URL('./app.js',base).href).clone().text();

  if(!index.includes('app.css')||!index.includes('particles.js')||!index.includes('app.js')||!script.includes("const CLIENT_SIGNATURE='"+metadata.hash+"';")||!style.length||!particles.includes('IVY_PARTICLES'))throw new Error('Unvollständiger App-Build');
  const cache=await caches.open(CACHE_NAME);
  try{await Promise.all(resources.map(([url,res])=>cache.put(url,res)))}catch(error){await caches.delete(CACHE_NAME);throw error}
  // Do not skipWaiting: user confirmation is required on an existing installation.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  // Once the fully verified active worker is active, retain exactly ONE app shell.
  // Do not touch persistent user data, independent favicon caches, or saved weather previews.
  const stale=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
  await Promise.all(stale.map(name=>caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);
 // Cache every remote website/provider/custom image. Hits never go upstream.
 if(req.destination==='image'&&/^https?:$/.test(u.protocol)&&!requiredAssets.has(u.href)){
   event.respondWith(imageResponse(req));return;
 }
 if(u.origin!==base.origin)return;
 if(!u.pathname.startsWith(base.pathname))return;
 if(u.searchParams.has('ivy_update_probe')||u.searchParams.has('ivy_update_apply'))return;
 const nav=req.mode==='navigate';
 if(nav&&u.pathname!==base.pathname&&u.pathname!==new URL(indexURL).pathname)return;
 if(!nav&&!requiredAssets.has(u.href))return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE_NAME);
   const key=nav?indexURL:u.href;
   const old=await cache.match(key);
   if(old)return old;
   try{
      // Only first/uncached assets may come from network; never silently replace a cached document.
      const result=await fetch(req);
      if(result.ok&&!nav)await cache.put(key,result.clone());
      return result;
   }catch(_){return nav?(await cache.match(indexURL)||Response.error()):Response.error()}
 })());
});
function reply(event,data){try{event.ports?.[0]?.postMessage(data)}catch(_){}}
self.addEventListener('message',event=>{
 if(event.data?.type==='IVY_DASHBOARD_GET_BUILD'){
  event.waitUntil((async()=>{try{
    const cache=await caches.open(CACHE_NAME);const resp=await cache.match(indexURL);
    const html=resp?await resp.text():null;
    reply(event,{ok:!!html,build:BUILD,hash:html?await sha(html):''});
  }catch(_){reply(event,{ok:false,build:BUILD})}})());return;
 }
 if(event.data?.type==='IVY_DASHBOARD_ACTIVATE_UPDATE'){
  event.waitUntil((async()=>{reply(event,{ok:true,build:BUILD});await self.skipWaiting()})());return;
 }
 // Deliberately no APPLY_SHELL: mixed generations must never be assembled in place.
});
