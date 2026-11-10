/* =========================================================
   AD MELIORA — APLICACIÓN PRINCIPAL
   Archivo: src/main.js
   Portada, carrusel, menú y navegación inferior
   ========================================================= */

import { openDatabase, checkDatabase } from "./database.js";

const APP_NAME = "AD MELIORA";
const SHIELD_PATH = "./assets/ad-meliora-escudo.jpeg";

const MODULES = [
  { id: "training", title: "ENTRENAMIENTOS", shortTitle: "Entrenamientos", description: "Disciplina, planificación y progreso.", icon: "✦", number: "01", category: "CUERPO" },
  { id: "finance", title: "FINANZAS", shortTitle: "Finanzas", description: "Control de ingresos, gastos y objetivos.", icon: "◈", number: "02", category: "CONTROL" },
  { id: "movies", title: "CARTELERA", shortTitle: "Cartelera", description: "Películas, series y documentales.", icon: "▷", number: "03", category: "HISTORIAS" },
  { id: "cocktails", title: "COCTELERÍA", shortTitle: "Coctelería", description: "Tu recetario personal de cócteles.", icon: "◇", number: "04", category: "SABORES" },
  { id: "sports", title: "DEPORTES", shortTitle: "Deportes", description: "Competiciones, equipos y resultados.", icon: "⚽", number: "05", category: "COMPETICIÓN" },
  { id: "reading", title: "BIBLIOTECA", shortTitle: "Lectura", description: "Libros, lecturas y seguimiento.", icon: "▤", number: "06", category: "CONOCIMIENTO" },
  { id: "travel", title: "EL ATLAS", shortTitle: "Viajes", description: "Viajes, destinos y experiencias.", icon: "⌖", number: "07", category: "DESCUBRIR" },
  { id: "notes", title: "EL CUADERNO", shortTitle: "Notas", description: "Ideas, pensamientos y notas.", icon: "✎", number: "08", category: "IDEAS" }
];

const appHeader = document.getElementById("app-header");
const appContent = document.getElementById("app-content");
const appLoading = document.getElementById("app-loading");
const appNavigation = document.getElementById("app-navigation");
const notificationRoot = document.getElementById("notification-root");

const menu = document.getElementById("app-menu");
const menuBackdrop = document.getElementById("menu-backdrop");
const menuOpenButton = document.getElementById("menu-open-button");
const menuCloseButton = document.getElementById("menu-close-button");
const notificationsPanel = document.getElementById("notifications-panel");
const notificationsButton = document.getElementById("notifications-button");
const notificationsCloseButton = document.getElementById("notifications-close-button");

let currentView = "home";
let currentModule = null;
let activeCardIndex = 0;
let carouselPointerStart = null;
let databaseReady = false;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function getCurrentDate() {
  const value = new Intl.DateTimeFormat("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date());
  return value.charAt(0).toLocaleUpperCase("es-ES") + value.slice(1);
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit", minute: "2-digit"
  }).format(new Date());
}

function getModule(moduleId) {
  return MODULES.find((module) => module.id === moduleId);
}

function updateClock() {
  const clock = document.getElementById("header-time");
  if (clock) clock.textContent = getCurrentTime();

  const homeTime = document.getElementById("home-time");
  if (homeTime) homeTime.textContent = getCurrentTime();

  const homeDate = document.getElementById("home-date");
  if (homeDate) homeDate.textContent = getCurrentDate();
}

/* La cabecera ya está declarada en index.html. No se reemplaza aquí,
   para conservar el menú, las notificaciones y el escudo del INDEX. */

function renderHome() {
  currentView = "home";
  currentModule = null;

  appContent.innerHTML = `
    <section class="home-screen">
      <header class="home-introduction">
        <div class="eyebrow">BIENVENIDO A TU ESPACIO PERSONAL</div>
        <h1 class="home-heading">Construye tu mejor <em>versión.</em></h1>
        <p class="section-subtitle">Cada día, un paso hacia algo mejor.</p>
        <div class="home-date">
          <span id="home-date">${escapeHTML(getCurrentDate())}</span>
          <span class="home-date-separator">·</span>
          <time id="home-time">${getCurrentTime()}</time>
        </div>
      </header>

      <section class="carousel-section" aria-label="Cartas de AD MELIORA">
        <div class="carousel-heading">
          <div>
            <div class="eyebrow">TU UNIVERSO PERSONAL</div>
            <h2>Mis cartas</h2>
          </div>
          <span class="carousel-count" id="carousel-count">01 / 08</span>
        </div>

        <div class="carousel-stage" id="modules-carousel" tabindex="0" aria-label="Carrusel de ocho módulos">
          <button class="carousel-arrow carousel-arrow-prev" type="button" aria-label="Carta anterior">‹</button>
          <div class="carousel-viewport">
            <div class="carousel-track" id="carousel-track">
              ${MODULES.map((module, index) => `
                <article class="module-card ${index === activeCardIndex ? "is-active" : ""}"
                  data-card-index="${index}" data-module="${escapeHTML(module.id)}"
                  role="group" aria-label="${escapeHTML(module.shortTitle)}">
                  <div class="module-card-glow"></div>
                  <div class="module-card-top">
                    <span class="module-card-number">${module.number} <i>/ 08</i></span>
                    <span class="module-card-category">${escapeHTML(module.category)}</span>
                  </div>
                  <div class="module-card-emblem ${module.id === "training" ? "has-shield" : ""}">
                    ${module.id === "training"
                      ? `<img class="module-shield" src="${SHIELD_PATH}" alt="Escudo original de AD MELIORA" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span class="shield-fallback" hidden>AM</span>`
                      : `<span class="module-symbol" aria-hidden="true">${module.icon}</span>`}
                  </div>
                  <div class="module-card-bottom">
                    <div class="module-card-copy">
                      <h3>${escapeHTML(module.title)}</h3>
                      <p>${escapeHTML(module.description)}</p>
                    </div>
                    <button class="module-open-button" type="button" data-open-module="${escapeHTML(module.id)}">
                      ABRIR CARTA <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </article>
              `).join("")}
            </div>
          </div>
          <button class="carousel-arrow carousel-arrow-next" type="button" aria-label="Carta siguiente">›</button>
        </div>

        <div class="carousel-footer">
          <div class="carousel-indicators" id="carousel-indicators" aria-label="Seleccionar carta">
            ${MODULES.map((module, index) => `
              <button type="button" class="carousel-indicator ${index === activeCardIndex ? "active" : ""}"
                data-indicator="${index}" aria-label="Mostrar ${escapeHTML(module.shortTitle)}"
                aria-current="${index === activeCardIndex ? "true" : "false"}"></button>
            `).join("")}
          </div>
          <div class="carousel-hint">DESLIZA PARA DESCUBRIR</div>
        </div>
      </section>

      <section class="home-motto" aria-label="Lema AD MELIORA">
        <div class="motto-line"></div>
        <p class="motto-latin">PER ASPERA AD MELIORA</p>
        <p class="motto-translation">A través de las dificultades, hacia algo mejor.</p>
        <div class="motto-line"></div>
      </section>

      <a class="spotify-access" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer" aria-label="Abrir Spotify">
        <span class="spotify-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1ED760"/><path d="M5.1 9.1c4.4-1.35 9.9-.95 13.9 1.45M6.1 12.2c3.7-1.05 8.2-.68 11.5 1.3M7 15.1c3.05-.78 6.45-.48 9.05 1.05" fill="none" stroke="#07140b" stroke-width="1.6" stroke-linecap="round"/></svg>
        </span>
        <span><strong>SPOTIFY</strong><small>Tu música, a un toque</small></span>
        <span class="spotify-external" aria-hidden="true">↗</span>
      </a>
    </section>
  `;

  appContent.hidden = false;
  if (appLoading) appLoading.hidden = true;
  setupCarousel();
  updateClock();
  updateNavigationState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupCarousel() {
  const track = document.getElementById("carousel-track");
  const stage = document.getElementById("modules-carousel");
  if (!track || !stage) return;

  const cards = Array.from(track.querySelectorAll(".module-card"));
  const indicators = Array.from(document.querySelectorAll("[data-indicator]"));
  const count = document.getElementById("carousel-count");

  function setActive(index) {
    activeCardIndex = (index + MODULES.length) % MODULES.length;

    cards.forEach((card, i) => {
      const active = i === activeCardIndex;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-hidden", active ? "false" : "true");
      card.inert = !active;
    });

    indicators.forEach((indicator, i) => {
      const active = i === activeCardIndex;
      indicator.classList.toggle("active", active);
      indicator.setAttribute("aria-current", active ? "true" : "false");
    });

    if (count) {
      count.textContent = `${String(activeCardIndex + 1).padStart(2, "0")} / ${String(MODULES.length).padStart(2, "0")}`;
    }

    track.style.transform = `translate3d(${-activeCardIndex * 100}%,0,0)`;
  }

  stage.querySelector(".carousel-arrow-next")?.addEventListener("click", () => setActive(activeCardIndex + 1));
  stage.querySelector(".carousel-arrow-prev")?.addEventListener("click", () => setActive(activeCardIndex - 1));

  indicators.forEach((indicator) => {
    indicator.addEventListener("click", () => setActive(Number(indicator.dataset.indicator)));
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button,a")) return;
    carouselPointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });

  stage.addEventListener("pointerup", (event) => {
    if (!carouselPointerStart || carouselPointerStart.id !== event.pointerId) return;
    const dx = event.clientX - carouselPointerStart.x;
    const dy = event.clientY - carouselPointerStart.y;
    carouselPointerStart = null;

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      setActive(activeCardIndex + (dx < 0 ? 1 : -1));
    }
  });

  stage.addEventListener("pointercancel", () => { carouselPointerStart = null; });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); setActive(activeCardIndex + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); setActive(activeCardIndex - 1); }
  });

  setActive(activeCardIndex);
}

function openModule(moduleId) {
  const module = getModule(moduleId);
  if (!module) {
    showNotification("No se ha encontrado este módulo.", "error");
    return;
  }

  currentView = "module";
  currentModule = moduleId;

  appContent.innerHTML = `
    <section class="module-screen">
      <header class="module-screen-heading">
        <div class="module-screen-emblem">
          ${module.id === "training"
            ? `<img src="${SHIELD_PATH}" alt="Escudo AD MELIORA" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span hidden>AM</span>`
            : `<span>${module.icon}</span>`}
        </div>
        <div class="eyebrow">AD MELIORA · ${escapeHTML(module.category)}</div>
        <h1>${escapeHTML(module.title)}</h1>
        <p>${escapeHTML(module.description)}</p>
      </header>
      <div class="divider"></div>
      <section class="card module-placeholder">
        <div class="eyebrow">ESTRUCTURA VISUAL PREPARADA</div>
        <h2>${escapeHTML(module.shortTitle)}</h2>
        <p>Este módulo todavía necesita desarrollar sus herramientas y funciones. No se considera terminado hasta que sus funciones estén implementadas y probadas.</p>
        <button class="btn btn-secondary" id="module-back-button" type="button">VOLVER AL MENÚ INICIAL</button>
      </section>
    </section>
  `;

  updateNavigationState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavigationState() {
  const homeButton = document.getElementById("navigation-home");
  const backButton = document.getElementById("navigation-back");
  if (homeButton) homeButton.classList.toggle("active", currentView === "home");
  if (backButton) backButton.disabled = currentView === "home";
}

function goHome() {
  renderHome();
}

function goBack() {
  if (currentView !== "home") {
    goHome();
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
  } else {
    showNotification("Ya estás en el menú inicial.");
  }
}

function openMenu() {
  if (!menu || !menuBackdrop) return;
  closeNotifications();
  menu.hidden = false;
  menu.inert = false;
  menu.setAttribute("aria-hidden", "false");
  menu.classList.add("is-open");
  menuBackdrop.hidden = false;
  menuOpenButton?.setAttribute("aria-expanded", "true");
  menuCloseButton?.focus();
}

function closeMenu() {
  if (!menu || !menuBackdrop) return;
  menu.classList.remove("is-open");
  menu.inert = true;
  menu.setAttribute("aria-hidden", "true");
  menuBackdrop.hidden = true;
  menuOpenButton?.setAttribute("aria-expanded", "false");
}

function openNotifications() {
  if (!notificationsPanel) return;
  closeMenu();
  notificationsPanel.hidden = false;
  notificationsButton?.setAttribute("aria-expanded", "true");
}

function closeNotifications() {
  if (!notificationsPanel) return;
  notificationsPanel.hidden = true;
  notificationsButton?.setAttribute("aria-expanded", "false");
}

function showNotification(message, type = "info") {
  if (!notificationRoot) return;
  const notification = document.createElement("div");
  notification.className = `notification ${type === "error" ? "notification-error" : ""}`;
  notification.setAttribute("role", "status");
  notification.textContent = message;
  notificationRoot.appendChild(notification);
  window.setTimeout(() => notification.remove(), 3500);
}

function setupEvents() {
  menuOpenButton?.addEventListener("click", openMenu);
  menuCloseButton?.addEventListener("click", closeMenu);
  menuBackdrop?.addEventListener("click", closeMenu);

  notificationsButton?.addEventListener("click", () => {
    if (notificationsPanel?.hidden) openNotifications();
    else closeNotifications();
  });
  notificationsCloseButton?.addEventListener("click", closeNotifications);

  appNavigation?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    if (button.dataset.action === "home") goHome();
    if (button.dataset.action === "back") goBack();
  });

  appContent?.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-module]");
    if (openButton) {
      openModule(openButton.dataset.openModule);
      return;
    }
    if (event.target.closest("#module-back-button")) goHome();
  });

  menu?.addEventListener("click", (event) => {
    const moduleLink = event.target.closest("[data-menu-module]");
    const settingsLink = event.target.closest('[data-menu-action="settings"]');

    if (moduleLink) {
      event.preventDefault();
      closeMenu();
      openModule(moduleLink.dataset.menuModule);
      return;
    }

    if (settingsLink) {
      event.preventDefault();
      closeMenu();
      showNotification("Los ajustes se desarrollarán en su fase correspondiente.");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeNotifications();
    }
  });

  document.addEventListener("click", (event) => {
    if (!notificationsPanel || notificationsPanel.hidden) return;
    if (notificationsPanel.contains(event.target) || notificationsButton?.contains(event.target)) return;
    closeNotifications();
  });
}

/* Los avisos se muestran como panel preparado. Los avisos reales de
   entrenamientos, objetivos y recordatorios se conectarán cuando esos
   módulos tengan datos y reglas funcionales. No se generan avisos falsos. */
function initializeNotifications() {
  const list = document.getElementById("notifications-list");
  if (list) {
    list.innerHTML = '<p class="notifications-empty">Todavía no hay avisos. Aquí aparecerán los recordatorios y avisos de tus módulos cuando estén configurados.</p>';
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

  try {
    // El archivo actual está en /src/sw.js. Se registra con su ruta real.
    // Su alcance por defecto será /src/; la configuración del alcance raíz
    // se revisará al corregir el propio Service Worker.
    const registration = await navigator.serviceWorker.register("./src/sw.js");
    console.log(`${APP_NAME}: Service Worker registrado.`, registration.scope);
  } catch (error) {
    console.error("No se pudo registrar el Service Worker:", error);
  }
}

async function initializeApp() {
  try {
    if (appLoading) appLoading.hidden = false;
    if (appContent) appContent.hidden = true;

    setupEvents();
    initializeNotifications();

    await openDatabase();
    const status = await checkDatabase();
    if (!status.available) throw new Error("No se pudo comprobar la base de datos.");

    databaseReady = true;
    activeCardIndex = 0;
    renderHome();
    if (appLoading) appLoading.hidden = true;
    if (appContent) {
      appContent.hidden = false;
      appContent.setAttribute("aria-busy", "false");
    }
  } catch (error) {
    console.error("Error al iniciar AD MELIORA:", error);

    if (appLoading) {
      appLoading.hidden = false;
      appLoading.innerHTML = `
        <div class="card text-center">
          <h2 class="card-title">NO SE HA PODIDO INICIAR</h2>
          <p class="card-description">Ha ocurrido un problema al preparar la aplicación. Tus datos no se han eliminado.</p>
          <button class="btn btn-primary mt-20" id="retry-app-button" type="button">VOLVER A INTENTAR</button>
        </div>`;
      appLoading.querySelector("#retry-app-button")?.addEventListener("click", initializeApp, { once: true });
    }
    if (appContent) appContent.hidden = true;
  }
}

initializeApp();
registerServiceWorker();
window.setInterval(updateClock, 60000);

/* FIN DE AD MELIORA — MAIN.JS */
