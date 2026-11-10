
/* =====================================================
   AD MELIORA — SERVICE WORKER
   Caché y funcionamiento sin conexión
   ===================================================== */

const CACHE_NAME = "ad-meliora-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/database.js"
];

/* =====================================================
   1. INSTALACIÓN
   ===================================================== */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

/* =====================================================
   2. ACTIVACIÓN
   ===================================================== */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith("ad-meliora-") &&
                name !== CACHE_NAME;
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* =====================================================
   3. PETICIONES Y MODO SIN CONEXIÓN
   ===================================================== */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Sólo gestionamos peticiones GET del mismo origen.
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  // Para la navegación, intentamos obtener la versión
  // más reciente y usamos la copia local si no hay red.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html") ||
            Response.error()
          );
        })
    );

    return;
  }

  // Para archivos de la aplicación, usamos primero
  // la copia guardada y después la red.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});

/* =====================================================
   FIN DEL SERVICE WORKER
   ===================================================== */
