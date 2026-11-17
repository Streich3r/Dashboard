/* IVY Dashboard V34: cached shell for fast repeat visits, content-hash update checks.
   No third-party/API responses, weather data, or private settings are cached here. */
'use strict';
const BUILD='34';
const CACHE_NAME='ivy-dashboard-shell-natural-v34';
const SHELL_FILES=['./','./index.html','./manifest.json','./favicon-32x32.png','./icon-192.png','./icon-512.png'];
const scopeURL=new URL(self.registration.scope);
const indexURL=new URL('./index.html',scopeURL).href;
const shellURLs=new Set(SHELL_FILES.map(path=>new URL(path,scopeURL).href));

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const response=await fetch(indexURL,{cache:'no-store'});
    if(!response.ok)throw new Error('IVY Dashboard: index.html unavailable');
    await cache.put(indexURL,response);
    await Promise.allSettled(SHELL_FILES.filter(path=>path!=='./index.html').map(async path=>{
      const url=new URL(path,scopeURL).href;
      const res=await fetch(url,{cache:'no-store'});
      if(res.ok)await cache.put(url,res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('ivy-dashboard-shell-')&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(scopeURL.href))return;
  const navigation=req.mode==='navigate';
  const home=url.pathname===scopeURL.pathname||url.pathname===new URL(indexURL).pathname;
  if(navigation&&!home)return;
  if(!navigation&&!shellURLs.has(url.href))return;
  const forceFresh=navigation&&url.searchParams.has('ivy_refresh');
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const key=navigation?indexURL:req;
    const cached=await cache.match(key);
    // Explicit accepted-update navigation bypasses the cached HTML once.
    if(!forceFresh&&cached)return cached;
    try{
      const res=await fetch(req,{cache:'no-store'});
      if(res.ok&&res.type==='basic'){
        event.waitUntil(cache.put(key,res.clone()));
      }
      return res;
    }catch(_){
      return cached||(navigation?await cache.match(indexURL):null)||Response.error();
    }
  })());
});

// A fresh request is made only on the deferred explicit update check, not during navigation.
// Comparison of the requesting page's build prevents false negatives immediately after
// an updated worker installs and fills its new cache.
self.addEventListener('message',event=>{
  if(event.data?.type!=='IVY_DASHBOARD_CHECK_UPDATE')return;
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match(indexURL);
      const response=await fetch(indexURL,{cache:'no-store'});
      if(!response.ok||response.type!=='basic')return;
      const latest=await response.text();
      const previous=cached?await cached.text():'';
      const clientBuild=String(event.data.clientBuild||'');
      if(latest===previous&&(!clientBuild||clientBuild===BUILD))return;
      const bytes=new TextEncoder().encode(latest);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      event.source?.postMessage({type:'IVY_DASHBOARD_UPDATE_AVAILABLE',hash,build:BUILD});
    }catch(_){/* No update prompt on network errors/offline */}
  })());
});
