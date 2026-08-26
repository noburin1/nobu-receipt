const CACHE="nobu-receipt-v1";
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(["./","./index.html","./manifest.webmanifest"])));
});
self.addEventListener("fetch",e=>{
  if(e.request.url.includes("cdn.jsdelivr.net")) return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{
      const c=x.clone();
      caches.open(CACHE).then(k=>k.put(e.request,c));
      return x;
    }).catch(()=>caches.match("./index.html")))
  );
});