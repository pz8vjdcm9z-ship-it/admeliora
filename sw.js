const CACHE_NAME = "ad-meliora-v3";

/*
  Este archivo debe estar en la RAÍZ del repositorio,
  al mismo nivel que index.html, styles.css y manifest.webmanifest.
*/

const APP_BASE = new URL("./", self.registration.scope);

const APP_FILES = [
  new URL("./", APP_BASE).href,
  new URL("index.html", APP_BASE).href,
  new URL("styles.css", APP_BASE).href,
  new URL("manifest.webmanifest", APP_BASE).href,
  new URL("src/main.js", APP_BASE).href,
  new URL("src/database.js", APP_BASE).href
];

async function precacheAppFiles() {
  const cache = await caches.open(CACHE_NAME);

  // Se cachean los archivos principales. Un recurso ausente no debe
  // impedir que se instale el Service Worker completo.
  const results = await Promise.allSettled(
    APP_FILES.map(async (fileUrl) => {
      const response = await fetch(fileUrl, { cache: "reload" });

      if (!response.ok) {
        throw new Error(`No se pudo precargar: ${fileUrl} (${response.status})`);
      }

      await cache.put(fileUrl, response);
    })
  );

  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length > 0) {
    console.warn(
      "AD MELIORA: algunos archivos no se han podido precargar.",
      failures
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppFiles());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("ad-meliora-") && name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // No interceptar recursos de otros dominios, como Google Fonts.
  if (requestUrl.origin !== self.location.origin) return;

  // No interceptar rutas fuera de la carpeta de esta aplicación.
  if (!requestUrl.href.startsWith(APP_BASE.href)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(
              new URL("index.html", APP_BASE).href,
              response.clone()
            );
          }

          return response;
        } catch (error) {
          const cachedPage = await caches.match(
            new URL("index.html", APP_BASE).href
          );

          return cachedPage || Response.error();
        }
      })()
    );

    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) return cachedResponse;

      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        return Response.error();
      }
    })()
  );
});
