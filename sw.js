/* IVY Dashboard V35 – online: fresh document, offline: last known good shell.
   Static icons remain cache-first. Weather/API/private data are never cached. */
'use strict';
const BUILD='35';
const CACHE_NAME='ivy-dashboard-shell-natural-v35';
const SHELL_FILES=['./index.html','./manifest.json','./favicon-32x32.png','./icon-192.png','./icon-512.png'];
const scopeURL=new URL(self.registration.scope);
const indexURL=new URL('./index.html',scopeURL).href;
const homePath=new URL(indexURL).pathname;
const staticURLs=new Set(SHELL_FILES.slice(1).map(path=>new URL(path,scopeURL).href));

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const response=await fetch(indexURL,{cache:'no-store'});
  if(!response.ok||response.type!=='basic')throw new Error('IVY: index.html konnte nicht zwischengespeichert werden');
  await cache.put(indexURL,response);
  await Promise.allSettled(SHELL_FILES.slice(1).map(async path=>{
   const url=new URL(path,scopeURL).href;
   const res=await fetch(url,{cache:'no-store'});
   if(res.ok&&res.type==='basic')await cache.put(url,res);
  }));
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('ivy-dashboard-shell-')&&name!==CACHE_NAME)
   .map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.href.startsWith(scopeURL.href))return;
 const navigation=req.mode==='navigate';
 const isHome=url.pathname===scopeURL.pathname||url.pathname===homePath;
 if(navigation&&!isHome)return;
 if(!navigation&&!staticURLs.has(url.href))return;

 if(navigation){
  // Never paint an old cached page while online. Cache is strictly the offline fallback.
  event.respondWith((async()=>{
   try{
    const res=await fetch(req,{cache:'no-store'});
    if(!res.ok||res.type!=='basic')throw new Error('IVY: Dokument offline oder nicht verfügbar');
    const copy=res.clone();
    // Response waits for the small local cache write so the offline fallback is reliable.
    try{const cache=await caches.open(CACHE_NAME);await cache.put(indexURL,copy)}catch(_){/* cache optional */}
    return res;
   }catch(_){
    const cache=await caches.open(CACHE_NAME);
    return await cache.match(indexURL)||Response.error();
   }
  })());
  return;
 }
 // Icons/manifest: fast local copy, refreshed with each versioned SW install.
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const saved=await cache.match(req);
  if(saved)return saved;
  try{
   const res=await fetch(req,{cache:'no-store'});
   if(res.ok&&res.type==='basic')await cache.put(req,res.clone());
   return res;
  }catch(_){return Response.error()}
 })());
});

// Backward compatibility: an already-open V33/V34 tab may still ask its worker
// for an update. V35 itself checks a cache-busting index.html URL independently.
self.addEventListener('message',event=>{
 if(event.data?.type!=='IVY_DASHBOARD_CHECK_UPDATE')return;
 event.waitUntil((async()=>{
  try{
   const cache=await caches.open(CACHE_NAME);
   const cached=await cache.match(indexURL);
   const res=await fetch(indexURL,{cache:'no-store'});
   if(!res.ok||res.type!=='basic')return;
   const latest=await res.text();
   const previous=cached?await cached.text():'';
   const clientBuild=String(event.data.clientBuild||'');
   if(latest===previous&&clientBuild===BUILD)return;
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(latest));
   const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   event.source?.postMessage({type:'IVY_DASHBOARD_UPDATE_AVAILABLE',hash,build:BUILD});
  }catch(_){/* stay quiet while offline */}
 })());
});
