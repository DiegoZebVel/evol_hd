// Evol Reuma — service worker. Sube la versión al actualizar la app.
const PREFIX='evol-reuma-',CACHE=PREFIX+'v13';
const SHELL=['./','./index.html','./app.js','./labs.js','./oa-template.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const LIB=['./lib/pdf.min.js','./lib/pdf.worker.min.js','./lib/tesseract.min.js','./lib/worker.min.js','./lib/core/tesseract-core-simd-lstm.wasm.js','./lib/core/tesseract-core-lstm.wasm.js','./lib/lang/spa.traineddata.gz'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).then(()=>{c.addAll(LIB).catch(()=>{})})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreSearch:true})).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r})
      .catch(()=>hit||(e.request.mode==='navigate'?caches.open(CACHE).then(c=>c.match('./index.html')):undefined));
    return hit||net;
  }));
});
