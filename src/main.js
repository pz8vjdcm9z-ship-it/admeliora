/* =====================================================
   AD MELIORA — APLICACIÓN PRINCIPAL
   Archivo: src/main.js
   Portada premium con carrusel de una sola ficha
   ===================================================== */

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

let currentView = "home";
let currentModule = null;
let activeCardIndex = 0;
let carouselPointerStart = null;
let carouselScrollTimer = null;

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

function renderHeader() {
  if (!appHeader) return;
  appHeader.innerHTML = `
    <div class="header-brand">
      <div class="header-crest" aria-hidden="true">
        <img src="${SHIELD_PATH}" alt="" onerror="this.style.display='none';this.nextElementSibling.hidden=false">
        <span hidden>AM</span>
      </div>
      <div class="header-brand-copy">
        <div class="eyebrow">LAS CARTAS DE MI VIDA</div>
        <div class="app-title">${APP_NAME}</div>
      </div>
    </div>
    <div class="header-clock" id="header-time">${getCurrentTime()}</div>
  `;
}

function updateClock() {
  const clock = document.getElementById("header-time");
  if (clock) clock.textContent = getCurrentTime();
  const homeTime = document.getElementById("home-time");
  if (homeTime) homeTime.textContent = getCurrentTime();
  const homeDate = document.getElementById("home-date");
  if (homeDate) homeDate.textContent = getCurrentDate();
}

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

        <div class="carousel-stage" id="modules-carousel">
          <button class="carousel-arrow carousel-arrow-prev" type="button" aria-label="Carta anterior">‹</button>
          <div class="carousel-viewport">
            <div class="carousel-track" id="carousel-track">
              ${MODULES.map((module, index) => `
                <article class="module-card ${index === 0 ? "is-active" : ""}"
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
              <button type="button" class="carousel-indicator ${index === 0 ? "active" : ""}"
                data-indicator="${index}" aria-label="Mostrar ${escapeHTML(module.shortTitle)}"
                aria-current="${index === 0 ? "true" : "false"}"></button>
            `).join("")}
          </div>
          <div class="carousel-hint">DESLIZA PARA DESCUBRIR</div>
        </div>
      </section>

      <section class="home-motto">
        <div class="motto-line"></div>
        <p class="motto-latin">PER ASPERA AD MELIORA</p>
        <p class="motto-translation">A través de las dificultades, hacia algo mejor.</p>
        <div class="motto-line"></div>
      </section>

      <a class="spotify-access" href="https://open.spotify.com/" target="_blank" rel="noopener noreferrer">
        <span class="spotify-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1ED760"/><path d="M5.1 9.1c4.4-1.35 9.9-.95 13.9 1.45M6.1 12.2c3.7-1.05 8.2-.68 11.5 1.3M7 15.1c3.05-.78 6.45-.48 9.05 1.05" fill="none" stroke="#07140b" stroke-width="1.6" stroke-linecap="round"/></svg>
        </span>
        <span><strong>SPOTIFY</strong><small>Tu música, a un toque</small></span>
        <span class="spotify-external" aria-hidden="true">↗</span>
      </a>
    </section>
  `;

  appContent.hidden = false;
  renderNavigation();
  setupCarousel();
}

function setupCarousel() {
  const track = document.getElementById("carousel-track");
  const stage = document.getElementById("modules-carousel");
  if (!track || !stage) return;

  const cards = Array.from(track.querySelectorAll(".module-card"));
  const indicators = Array.from(document.querySelectorAll("[data-indicator]"));
  const count = document.getElementById("carousel-count");

  function setActive(index, scroll = true) {
    activeCardIndex = Math.max(0, Math.min(MODULES.length - 1, index));
    cards.forEach((card, i) => {
      card.classList.toggle("is-active", i === activeCardIndex);
      card.setAttribute("aria-hidden", i === activeCardIndex ? "false" : "true");
      card.inert = i !== activeCardIndex;
    });
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === activeCardIndex);
      indicator.setAttribute("aria-current", i === activeCardIndex ? "true" : "false");
    });
    if (count) count.textContent = `${String(activeCardIndex + 1).padStart(2, "0")} / ${String(MODULES.length).padStart(2, "0")}`;
    if (scroll) track.style.transform = `translate3d(${-activeCardIndex * 100}%,0,0)`;
  }

  function next() { setActive(activeCardIndex + 1); }
  function previous() { setActive(activeCardIndex - 1); }

  stage.querySelector(".carousel-arrow-next")?.addEventListener("click", next);
  stage.querySelector(".carousel-arrow-prev")?.addEventListener("click", previous);
  indicators.forEach((indicator) => {
    indicator.addEventListener("click", () => setActive(Number(indicator.dataset.indicator)));
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    carouselPointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  stage.addEventListener("pointerup", (event) => {
    if (!carouselPointerStart || carouselPointerStart.id !== event.pointerId) return;
    const dx = event.clientX - carouselPointerStart.x;
    const dy = event.clientY - carouselPointerStart.y;
    carouselPointerStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      dx < 0 ? next() : previous();
    }
  });
  stage.addEventListener("pointercancel", () => { carouselPointerStart = null; });

  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); next(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
  });

  setActive(activeCardIndex, false);
  track.style.transform = `translate3d(${-activeCardIndex * 100}%,0,0)`;
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
      <button class="btn btn-secondary" id="back-home-button" type="button">← VOLVER A MIS CARTAS</button>
      <header class="module-screen-heading">
        <div class="module-screen-emblem">${module.id === "training"
          ? `<img src="${SHIELD_PATH}" alt="Escudo AD MELIORA" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span hidden>AM</span>`
          : `<span>${module.icon}</span>`}</div>
        <div class="eyebrow">AD MELIORA · ${escapeHTML(module.category)}</div>
        <h1>${escapeHTML(module.title)}</h1>
        <p>${escapeHTML(module.description)}</p>
      </header>
      <div class="divider"></div>
      <section class="card module-placeholder">
        <div class="eyebrow">SIGUIENTE FASE DE DESARROLLO</div>
        <h2>${escapeHTML(module.shortTitle)}</h2>
        <p>La identidad visual y la entrada de este módulo están preparadas. Sus herramientas se desarrollarán y probarán antes de considerarlo terminado.</p>
      </section>
    </section>
  `;

  renderNavigation();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderNavigation() {
  if (!appNavigation) return;
  appNavigation.innerHTML = `
    <button class="navigation-button ${currentView === "home" ? "active" : ""}" type="button" data-action="home" aria-label="Inicio">
      <span class="navigation-icon">⌂</span><span>INICIO</span>
    </button>
    <button class="navigation-button" type="button" data-action="training" aria-label="Entrenamientos">
      <span class="navigation-icon">✦</span><span>ENTRENA</span>
    </button>
    <button class="navigation-button navigation-center" type="button" data-action="shield" aria-label="AD MELIORA">
      <span class="navigation-shield"><img src="${SHIELD_PATH}" alt="" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><span hidden>AM</span></span>
    </button>
    <button class="navigation-button" type="button" data-action="calendar" aria-label="Calendario">
      <span class="navigation-icon">▦</span><span>AGENDA</span>
    </button>
    <button class="navigation-button ${currentModule === "settings" ? "active" : ""}" type="button" data-action="settings" aria-label="Ajustes">
      <span class="navigation-icon">⚙</span><span>AJUSTES</span>
    </button>
  `;
}

function goHome() {
  renderHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  appContent.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-open-module]");
    if (openButton) {
      event.preventDefault();
      openModule(openButton.dataset.openModule);
      return;
    }
    if (event.target.closest("#back-home-button")) goHome();
  });

  appNavigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    switch (button.dataset.action) {
      case "home": goHome(); break;
      case "training": openModule("training"); break;
      case "shield": goHome(); break;
      case "calendar": showNotification("El calendario se incorporará en la fase de módulos."); break;
      case "settings": showNotification("Los ajustes se incorporarán en su fase de desarrollo."); break;
      default: break;
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    console.log("AD MELIORA: Service Worker registrado.", registration.scope);
  } catch (error) {
    console.error("No se pudo registrar el Service Worker:", error);
  }
}

async function initializeApp() {
  try {
    renderHeader();
    setupEvents();
    await openDatabase();
    const status = await checkDatabase();
    if (!status.available) throw new Error("No se pudo comprobar la base de datos.");
    activeCardIndex = 0;
    renderHome();
    if (appLoading) appLoading.hidden = true;
    appContent.hidden = false;
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
      appLoading.querySelector("#retry-app-button")?.addEventListener("click", initializeApp);
    }
    if (appContent) appContent.hidden = true;
  }
}

initializeApp();
registerServiceWorker();
window.setInterval(updateClock, 60000);

/* FIN DE AD MELIORA — MAIN.JS */
