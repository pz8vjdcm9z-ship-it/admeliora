
/* =====================================================
   AD MELIORA — APLICACIÓN PRINCIPAL
   Archivo: src/main.js
   ===================================================== */

import {
  openDatabase,
  checkDatabase
} from "./database.js";

/* =====================================================
   1. CONFIGURACIÓN DE LA APLICACIÓN
   ===================================================== */

const APP_NAME = "AD MELIORA";

const MODULES = [
  {
    id: "training",
    title: "ENTRENAMIENTOS",
    description: "Disciplina, planificación y progreso.",
    icon: "🏋️"
  },
  {
    id: "finance",
    title: "FINANZAS",
    description: "Control de ingresos, gastos y objetivos.",
    icon: "€"
  },
  {
    id: "movies",
    title: "CARTELERA",
    description: "Películas, series y documentales.",
    icon: "🎬"
  },
  {
    id: "cocktails",
    title: "COCTELERÍA",
    description: "Tu recetario personal de cócteles.",
    icon: "🍸"
  },
  {
    id: "sports",
    title: "DEPORTES",
    description: "Competiciones, equipos y resultados.",
    icon: "🏆"
  },
  {
    id: "reading",
    title: "BIBLIOTECA",
    description: "Libros, lecturas y seguimiento.",
    icon: "📚"
  },
  {
    id: "travel",
    title: "EL ATLAS",
    description: "Viajes, destinos y experiencias.",
    icon: "🌍"
  },
  {
    id: "notes",
    title: "EL CUADERNO",
    description: "Ideas, pensamientos y notas.",
    icon: "✍️"
  },
  {
    id: "settings",
    title: "AJUSTES",
    description: "Personalización y gestión de la aplicación.",
    icon: "⚙️"
  }
];

/* =====================================================
   2. ELEMENTOS PRINCIPALES
   ===================================================== */

const appHeader = document.getElementById("app-header");
const mainContent = document.getElementById("main-content");
const appContent = document.getElementById("app-content");
const appLoading = document.getElementById("app-loading");
const appNavigation = document.getElementById("app-navigation");
const modalRoot = document.getElementById("modal-root");
const notificationRoot = document.getElementById("notification-root");

let currentView = "home";
let currentModule = null;
let databaseReady = false;

/* =====================================================
   3. UTILIDADES
   ===================================================== */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
}

function getCurrentDate() {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function getCurrentTime() {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

function getModule(moduleId) {
  return MODULES.find((module) => module.id === moduleId);
}

/* =====================================================
   4. CABECERA
   ===================================================== */

function renderHeader() {
  appHeader.innerHTML = `
    <div class="header-brand">
      <div>
        <div class="eyebrow">LAS CARTAS DE MI VIDA</div>
        <div class="app-title">${APP_NAME}</div>
      </div>
    </div>

    <div class="header-clock">
      <span id="header-time">${getCurrentTime()}</span>
    </div>
  `;
}

function updateClock() {
  const clock = document.getElementById("header-time");

  if (clock) {
    clock.textContent = getCurrentTime();
  }
}

/* =====================================================
   5. PANTALLA DE INICIO
   ===================================================== */

function renderHome() {
  currentView = "home";
  currentModule = null;

  appContent.innerHTML = `
    <section class="home-screen">

      <header class="home-introduction text-center">
        <div class="eyebrow">BIENVENIDO A TU ESPACIO PERSONAL</div>

        <h1 class="section-title">
          AD MELIORA
        </h1>

        <p class="section-subtitle">
          Cada día, un paso hacia una mejor versión de ti.
        </p>

        <div class="home-date">
          <div class="text-gold" id="home-date">
            ${escapeHTML(getCurrentDate())}
          </div>

          <div class="text-muted" id="home-time">
            ${getCurrentTime()}
          </div>
        </div>
      </header>

      <div class="divider"></div>

      <section class="modules-section">

        <div class="flex-between mb-20">
          <h2 class="section-title">
            MIS CARTAS
          </h2>

          <span class="eyebrow">
            ${MODULES.length} MÓDULOS
          </span>
        </div>

        <div class="cards-carousel" id="modules-carousel">

          ${MODULES.map((module) => `
            <article
              class="module-card"
              data-module="${escapeHTML(module.id)}"
              tabindex="0"
              role="button"
              aria-label="Abrir ${escapeHTML(module.title)}"
            >

              <div class="module-card-icon">
                ${escapeHTML(module.icon)}
              </div>

              <div>
                <h2>${escapeHTML(module.title)}</h2>
                <p>${escapeHTML(module.description)}</p>
              </div>

              <div class="eyebrow">
                ABRIR CARTA →
              </div>

            </article>
          `).join("")}

        </div>

        <div
          class="carousel-indicators"
          id="carousel-indicators"
          aria-label="Posición del carrusel"
        >
          ${MODULES.map((module, index) => `
            <span
              class="carousel-indicator ${index === 0 ? "active" : ""}"
              data-indicator="${index}"
            ></span>
          `).join("")}
        </div>

      </section>

      <div class="divider"></div>

      <section class="home-footer text-center">
        <p class="text-gold">
          PER ASPERA AD MELIORA
        </p>

        <p class="text-muted">
          A través de las dificultades, hacia algo mejor.
        </p>
      </section>

    </section>
  `;

  appContent.hidden = false;

  renderNavigation();
  setupCarousel();
}

/* =====================================================
   6. CARRUSEL
   ===================================================== */

function setupCarousel() {
  const carousel = document.getElementById("modules-carousel");
  const indicators = document.querySelectorAll("[data-indicator]");

  if (!carousel) return;

  function updateIndicators() {
    const cards = carousel.querySelectorAll(".module-card");

    if (!cards.length) return;

    const carouselCenter =
      carousel.getBoundingClientRect().left +
      carousel.clientWidth / 2;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter =
        card.getBoundingClientRect().left +
        card.offsetWidth / 2;

      const distance = Math.abs(carouselCenter - cardCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle(
        "active",
        index === nearestIndex
      );
    });
  }

  carousel.addEventListener("scroll", updateIndicators, {
    passive: true
  });

  indicators.forEach((indicator) => {
    indicator.addEventListener("click", () => {
      const index = Number(indicator.dataset.indicator);
      const cards = carousel.querySelectorAll(".module-card");
      const card = cards[index];

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    });
  });

  updateIndicators();
}

/* =====================================================
   7. ABRIR MÓDULOS
   ===================================================== */

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

      <button
        class="btn btn-secondary"
        id="back-home-button"
        type="button"
      >
        ← VOLVER AL INICIO
      </button>

      <header class="text-center mt-20">
        <div class="module-card-icon" style="margin: 0 auto 16px;">
          ${escapeHTML(module.icon)}
        </div>

        <div class="eyebrow">AD MELIORA</div>

        <h1 class="section-title">
          ${escapeHTML(module.title)}
        </h1>

        <p class="section-subtitle">
          ${escapeHTML(module.description)}
        </p>
      </header>

      <div class="divider"></div>

      <div class="card text-center">

        <h2 class="card-title">
          MÓDULO EN PREPARACIÓN
        </h2>

        <p class="card-description">
          La estructura de esta sección está creada.
          Sus herramientas se incorporarán progresivamente.
        </p>

      </div>

    </section>
  `;

  renderNavigation();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =====================================================
   8. NAVEGACIÓN INFERIOR
   ===================================================== */

function renderNavigation() {
  appNavigation.innerHTML = `
    <button
      class="navigation-button ${currentView === "home" ? "active" : ""}"
      type="button"
      data-action="home"
      aria-label="Inicio"
    >
      <span class="navigation-icon">⌂</span>
      <span>INICIO</span>
    </button>

    <button
      class="navigation-button"
      type="button"
      data-action="shield"
      aria-label="Entrenamientos"
    >
      <span class="navigation-shield">AM</span>
    </button>

    <button
      class="navigation-button"
      type="button"
      data-action="back"
      aria-label="Volver"
    >
      <span class="navigation-icon">←</span>
      <span>ATRÁS</span>
    </button>
  `;
}

/* =====================================================
   9. ACCIONES DE NAVEGACIÓN
   ===================================================== */

function goHome() {
  renderHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  if (currentView !== "home") {
    goHome();
    return;
  }

  showNotification("Ya estás en el inicio.");
}

function openTraining() {
  openModule("training");
}

/* =====================================================
   10. NOTIFICACIONES
   ===================================================== */

function showNotification(message, type = "info") {
  if (!notificationRoot) return;

  const notification = document.createElement("div");

  notification.className = "notification";
  notification.setAttribute("role", "status");

  if (type === "error") {
    notification.style.borderColor = "rgba(212, 91, 91, 0.7)";
  }

  notification.textContent = message;

  notificationRoot.appendChild(notification);

  window.setTimeout(() => {
    notification.remove();
  }, 3500);
}

/* =====================================================
   11. EVENTOS GENERALES
   ===================================================== */

function setupEvents() {

  // Abrir una carta del carrusel.
  appContent.addEventListener("click", (event) => {
    const card = event.target.closest("[data-module]");

    if (card) {
      openModule(card.dataset.module);
      return;
    }

    if (event.target.closest("#back-home-button")) {
      goHome();
    }
  });

  // Permitir abrir cartas con teclado.
  appContent.addEventListener("keydown", (event) => {
    const card = event.target.closest(".module-card");

    if (!card) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openModule(card.dataset.module);
    }
  });

  // Navegación inferior.
  appNavigation.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    if (action === "home") {
      goHome();
    }

    if (action === "shield") {
      openTraining();
    }

    if (action === "back") {
      goBack();
    }
  });
}

/* =====================================================
   12. INICIALIZACIÓN
   ===================================================== */

async function initializeApp() {
  try {
    renderHeader();
    setupEvents();

    // Abrir la base de datos local.
    await openDatabase();

    const databaseStatus = await checkDatabase();

    if (!databaseStatus.available) {
      throw new Error("No se pudo comprobar la base de datos.");
    }

    databaseReady = true;

    renderHome();

    if (appLoading) {
      appLoading.hidden = true;
    }

    appContent.hidden = false;

    showNotification("AD MELIORA está preparada.");

  } catch (error) {
    console.error("Error al iniciar AD MELIORA:", error);

    if (appLoading) {
      appLoading.innerHTML = `
        <div class="card text-center">
          <h2 class="card-title">
            NO SE HA PODIDO INICIAR
          </h2>

          <p class="card-description">
            Ha ocurrido un problema al preparar la aplicación.
          </p>

          <button
            class="btn btn-primary mt-20"
            id="retry-app-button"
            type="button"
          >
            VOLVER A INTENTAR
          </button>
        </div>
      `;
    }

    appContent.hidden = true;

    const retryButton = document.getElementById("retry-app-button");

    if (retryButton) {
      retryButton.addEventListener("click", initializeApp);
    }
  }
}

/* =====================================================
   13. ARRANQUE
   ===================================================== */

initializeApp();

/* =====================================================
   FIN DE MAIN.JS
   ===================================================== */
