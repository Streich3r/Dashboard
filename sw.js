/* IVY Dashboard V38 – verified, atomic offline-first shell. */
'use strict';
const BUILD='38';
const CACHE_NAME='ivy-dashboard-shell-natural-v38';
const CACHE_PREFIX='ivy-dashboard-shell-';
const SHELL_FILES=['./index.html','./ivy-shell-v38.css','./ivy-app-v38.js','./version.json','./manifest.json','./favicon-32x32.png','./icon-192.png','./icon-512.png'];
const base=new URL(self.registration.scope);
const indexURL=new URL('./index.html',base).href;
const homeURL=new URL('./',base).href;
const requiredAssets=new Set(SHELL_FILES.slice(1).map(p=>new URL(p,base).href));
async function sha(text){const value=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(value),v=>v.toString(16).padStart(2,'0')).join('')}
async function fresh(url){const res=await fetch(url,{cache:'no-store'});if(!res.ok||res.type!=='basic')throw new Error('Shell-Datei fehlt: '+url);return res;}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  // Never activate an incomplete deployment: first verify every file and the HTML fingerprint.
  const resources=await Promise.all(SHELL_FILES.map(async path=>[new URL(path,base).href,await fresh(new URL(path,base).href)]));
  const byURL=new Map(resources);
  const index=await byURL.get(indexURL).clone().text();
  const metadata=await byURL.get(new URL('./version.json',base).href).clone().json();
  if(metadata.build!==BUILD||metadata.hash!==await sha(index))throw new Error('Version oder HTML-Hash inkonsistent');
  const style=await byURL.get(new URL('./ivy-shell-v38.css',base).href).clone().text();
  const script=await byURL.get(new URL('./ivy-app-v38.js',base).href).clone().text();
  if(!index.includes('ivy-shell-v38.css')||!index.includes('ivy-app-v38.js')||!script.includes("const CLIENT_SIGNATURE='"+metadata.hash+"';")||!style.length)throw new Error('Unvollständiger App-Build');
  const cache=await caches.open(CACHE_NAME);
  try{await Promise.all(resources.map(([url,res])=>cache.put(url,res)))}catch(error){await caches.delete(CACHE_NAME);throw error}
  // Do not skipWaiting: user confirmation is required on an existing installation.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const u=new URL(req.url);if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return;
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
