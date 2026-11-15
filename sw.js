/* IVY Dashboard – automatic online updates + offline app shell.
   Save this file as sw.js in the same directory as index.html.
   After this one-time migration, changing index.html does not require
   changing a cache version number. */

const CACHE_NAME = 'ivy-dashboard-shell-auto-v2';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './favicon-32x32.png',
  './icon-192.png',
  './icon-512.png'
];
const scopeURL = new URL(self.registration.scope);
const indexURL = new URL('./index.html', scopeURL).href;
const shellURLs = new Set(SHELL_FILES.map(path => new URL(path, scopeURL).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Only index.html is essential; optional missing icons must not fail install.
    const indexResponse = await fetch(indexURL, { cache: 'no-store' });
    if (!indexResponse.ok) throw new Error('index.html could not be fetched');
    await cache.put(indexURL, indexResponse);
    await Promise.allSettled(SHELL_FILES
      .filter(path => path !== './index.html')
      .map(async path => {
        const url = new URL(path, scopeURL).href;
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) await cache.put(url, response);
      }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(name => name.startsWith('ivy-dashboard-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.href.startsWith(scopeURL.href)) return;

  const isNavigation = request.mode === 'navigate';
  const isShellFile = shellURLs.has(url.href);
  // Ignore APIs, user content and all third-party requests.
  if (!isNavigation && !isShellFile) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Always ask the network first, bypassing HTTP cache where possible.
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok && response.type === 'basic') {
        // Never overwrite the offline home page with another route.
        const home = url.pathname === scopeURL.pathname || url.pathname === new URL(indexURL).pathname;
        event.waitUntil((async () => {
          await cache.put(request, response.clone());
          if (isNavigation && home) await cache.put(indexURL, response.clone());
        })());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: isNavigation });
      if (cached) return cached;
      if (isNavigation) {
        const home = await cache.match(indexURL);
        if (home) return home;
      }
      return Response.error();
    }
  })());
});


/* IVY V31: report only a real difference between the currently cached HTML
   and the live server document, identified by a content hash. The page
   remembers the exact version the user accepted, avoiding repeat prompts. */
self.addEventListener('message', event => {
  if (event.data?.type !== 'IVY_DASHBOARD_CHECK_UPDATE') return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(indexURL);
      if (!cached) return;
      const response = await fetch(indexURL, { cache: 'no-store' });
      if (!response.ok || response.type !== 'basic') return;
      const [before, after] = await Promise.all([cached.text(), response.text()]);
      if (before === after) return;
      const bytes=new TextEncoder().encode(after);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      // Notify only the tab that requested the update check.
      event.source?.postMessage({type:'IVY_DASHBOARD_UPDATE_AVAILABLE',hash});
    } catch (error) {
      // No notification on failure or offline.
    }
  })());
});
