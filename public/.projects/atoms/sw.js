const cache = await caches.open("atoms-v1");
self.addEventListener("install", async function(ev){
    ev.waitUntil(await cache.addAll([
        "/",
        "/atoms.html",
        "/atoms.js",
        "/logo192x192.png",
        "/manifest.json",
        "/shaders/circle-shaders.wgsl",
        "/shaders/normal-shaders.wgsl"
    ]));
});

self.addEventListener("fetch", async function(ev){
    ev.respondWith(await getResource(ev.request));
});

async function getResource(req, ev){
    const cacheResponse = await caches.match(ev.request);
    if(cacheResponse){
        return cacheResponse;
    }

    const fetchResponse = await fetch(req);
    ev.waitUntil(cache.put(req, fetchResponse.clone()));
    return fetchResponse;
}