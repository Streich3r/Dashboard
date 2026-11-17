/* IVY Dashboard V36 – offline-first shell; updates only after user confirms.
   Weather/API traffic and personal settings are never stored in this cache. */
'use strict';
const BUILD='37';
const CACHE_NAME='ivy-dashboard-shell-natural-v37';
const CACHE_PREFIX='ivy-dashboard-shell-';
const SHELL_FILES=['./index.html','./manifest.json','./favicon-32x32.png','./icon-192.png','./icon-512.png'];
const scopeURL=new URL(self.registration.scope);
const indexURL=new URL('./index.html',scopeURL).href;
const indexPath=new URL(indexURL).pathname;
const assetURLs=new Set(SHELL_FILES.slice(1).map(path=>new URL(path,scopeURL).href));

async function fetchFresh(url){
 const res=await fetch(url,{cache:'no-store'});
 if(!res.ok||res.type!=='basic')throw new Error('IVY: aktuelle Datei nicht erreichbar');
 return res;
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  // Preload the complete new shell. An existing installation stays active until
  // the user chooses to apply the update (NO unconditional skipWaiting).
  const html=await fetchFresh(indexURL);
  const cache=await caches.open(CACHE_NAME);
  await cache.put(indexURL,html);
  await Promise.allSettled(SHELL_FILES.slice(1).map(async file=>{
   const url=new URL(file,scopeURL).href;
   const res=await fetchFresh(url);
   await cache.put(url,res);
  }));
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  // Only the newly activated worker discards superseded app-shell caches.
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)
   .map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.href.startsWith(scopeURL.href))return;
 if(url.searchParams.has('ivy_update_probe')||url.searchParams.has('ivy_update_apply'))return;
 const navigation=req.mode==='navigate';
 const home=url.pathname===scopeURL.pathname||url.pathname===indexPath;
 if(navigation&&!home)return;
 if(!navigation&&!assetURLs.has(url.href))return;
 const forceFresh=navigation&&url.searchParams.has('ivy_refresh');
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const key=navigation?indexURL:url.href;
  const cached=await cache.match(key);
  // Every ordinary visit opens the local app instantly. Online/offline are equal.
  if(cached&&!forceFresh)return cached;
  try{
   const res=await fetchFresh(req);
   // Only an explicit accepted update/recovery replaces cached index.html.
   // If this write fails, the previously cached copy remains available.
   await cache.put(key,res.clone());
   return res;
  }catch(_){return cached||(navigation?await cache.match(indexURL):null)||Response.error()}
 })());
});

async function normalizedHash(html){
 const normalized=html.replace(/const CLIENT_SIGNATURE='[a-f0-9]{64}';/,
  "const CLIENT_SIGNATURE='"+'0'.repeat(64)+"';");
 const bytes=new TextEncoder().encode(normalized);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function reply(event,data){
 try{event.ports?.[0]?.postMessage(data)}catch(_){}
}
self.addEventListener('message',event=>{
 if(event.data?.type==='IVY_DASHBOARD_GET_BUILD'){
  event.waitUntil((async()=>{
   try{
    const cache=await caches.open(CACHE_NAME);
    const html=await (await cache.match(indexURL))?.text();
    reply(event,{ok:true,build:BUILD,hash:html?await normalizedHash(html):''});
   }catch(_){reply(event,{ok:false,build:BUILD})}
  })());
  return;
 }
 if(event.data?.type==='IVY_DASHBOARD_ACTIVATE_UPDATE'){
  // Caller is an already loaded V36 page or a user-confirmed update.
  event.waitUntil((async()=>{
   reply(event,{ok:true,build:BUILD});
   await self.skipWaiting();
  })());
  return;
 }
 if(event.data?.type==='IVY_DASHBOARD_APPLY_SHELL'){
  event.waitUntil((async()=>{
   try{
    const requestedHash=String(event.data.hash||'');
    if(!/^[a-f0-9]{64}$/.test(requestedHash))throw new Error('Ungültiger Fingerabdruck');
    const freshURL=new URL(indexURL);
    freshURL.searchParams.set('ivy_update_apply',String(Date.now()));
    const fresh=await fetchFresh(freshURL.href);
    const html=await fresh.clone().text();
    if(!/<!doctype html/i.test(html.slice(0,100))||
       await normalizedHash(html)!==requestedHash)throw new Error('Veröffentlichung nicht identisch; bitte erneut prüfen');
    // Atomic cache entry replacement, only on user approval.
    const cache=await caches.open(CACHE_NAME);
    await cache.put(indexURL,fresh);
    // Refresh local shell assets too; API/weather data stay excluded.
    await Promise.allSettled(SHELL_FILES.slice(1).map(async file=>{
      const url=new URL(file,scopeURL).href;
      const asset=await fetchFresh(url);
      await cache.put(url,asset);
    }));
    reply(event,{ok:true,hash:requestedHash});
   }catch(err){reply(event,{ok:false,error:String(err.message||err)})}
  })());
 }
});
