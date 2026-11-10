
/* =====================================================
   AD MELIORA — DATABASE
   Almacenamiento local mediante IndexedDB
   Versión inicial: 1
   ===================================================== */

const DB_NAME = "ad-meliora-database";
const DB_VERSION = 1;

const STORES = {
  RECORDS: "records",
  SESSIONS: "trainingSessions",
  SETTINGS: "settings"
};

let databasePromise = null;

/* =====================================================
   1. ABRIR Y CREAR LA BASE DE DATOS
   ===================================================== */

export function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(
      new Error("Este navegador no permite almacenamiento IndexedDB.")
    );
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Registros generales de los módulos.
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        const records = db.createObjectStore(STORES.RECORDS, {
          keyPath: "id"
        });

        records.createIndex("module", "module", {
          unique: false
        });

        records.createIndex("updatedAt", "updatedAt", {
          unique: false
        });

        records.createIndex("createdAt", "createdAt", {
          unique: false
        });
      }

      // Historial de entrenamientos.
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessions = db.createObjectStore(STORES.SESSIONS, {
          keyPath: "id"
        });

        sessions.createIndex("date", "date", {
          unique: false
        });

        sessions.createIndex("routineId", "routineId", {
          unique: false
        });

        sessions.createIndex("createdAt", "createdAt", {
          unique: false
        });
      }

      // Configuración general de la aplicación.
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, {
          keyPath: "key"
        });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        databasePromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      databasePromise = null;

      reject(
        request.error ||
        new Error("No se pudo abrir la base de datos.")
      );
    };

    request.onblocked = () => {
      console.warn(
        "La actualización de la base de datos está bloqueada. Cierra otras pestañas de AD MELIORA."
      );
    };
  });

  return databasePromise;
}

/* =====================================================
   2. FUNCIÓN INTERNA PARA TRANSACCIONES
   ===================================================== */

async function executeTransaction(storeName, mode, action) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    let transaction;

    try {
      transaction = db.transaction(storeName, mode);
    } catch (error) {
      reject(error);
      return;
    }

    const store = transaction.objectStore(storeName);

    let result;
    let actionError = null;

    try {
      result = action(store);
    } catch (error) {
      actionError = error;

      try {
        transaction.abort();
      } catch {
        reject(error);
        return;
      }
    }

    transaction.oncomplete = () => {
      if (actionError) {
        reject(actionError);
      } else {
        resolve(result);
      }
    };

    transaction.onerror = () => {
      reject(
        transaction.error ||
        actionError ||
        new Error("Error en la transacción.")
      );
    };

    transaction.onabort = () => {
      reject(
        transaction.error ||
        actionError ||
        new Error("La operación ha sido cancelada.")
      );
    };
  });
}

/* =====================================================
   3. REGISTROS GENERALES
   ===================================================== */

/**
 * Guarda un registro de cualquier módulo.
 *
 * Ejemplo:
 * saveRecord({
 *   id: "nota-001",
 *   module: "notes",
 *   title: "Mi nota",
 *   content: "Contenido"
 * });
 */

export async function saveRecord(record) {
  if (!record || typeof record !== "object") {
    throw new Error("El registro no es válido.");
  }

  if (typeof record.id !== "string" || !record.id.trim()) {
    throw new Error("El registro necesita un identificador.");
  }

  if (typeof record.module !== "string" || !record.module.trim()) {
    throw new Error("El registro necesita indicar su módulo.");
  }

  const now = new Date().toISOString();

  const savedRecord = {
    ...record,
    id: record.id,
    module: record.module,
    createdAt: record.createdAt || now,
    updatedAt: now
  };

  await executeTransaction(
    STORES.RECORDS,
    "readwrite",
    (store) => store.put(savedRecord)
  );

  return savedRecord;
}

/**
 * Obtiene un registro por su identificador.
 */

export async function getRecord(id) {
  if (!id) {
    throw new Error("Falta el identificador del registro.");
  }

  return executeTransaction(
    STORES.RECORDS,
    "readonly",
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
  ).then((result) => result);
}

/**
 * Obtiene todos los registros de un módulo.
 *
 * Ejemplos de módulos:
 * training, finance, movies, cocktails,
 * sports, reading, travel, notes.
 */

export async function getRecords(module) {
  if (!module) {
    throw new Error("Debes indicar el módulo.");
  }

  return executeTransaction(
    STORES.RECORDS,
    "readonly",
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store
          .index("module")
          .getAll(module);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    }
  ).then((result) => result);
}

/**
 * Elimina un registro por su identificador.
 */

export async function deleteRecord(id) {
  if (!id) {
    throw new Error("Falta el identificador del registro.");
  }

  return executeTransaction(
    STORES.RECORDS,
    "readwrite",
    (store) => store.delete(id)
  );
}

/* =====================================================
   4. HISTORIAL DE ENTRENAMIENTOS
   ===================================================== */

/**
 * Guarda una sesión de entrenamiento.
 *
 * Cada sesión debe tener un ID único.
 * No se deben reutilizar IDs de sesiones anteriores.
 */

export async function saveTrainingSession(session) {
  if (!session || typeof session !== "object") {
    throw new Error("La sesión no es válida.");
  }

  if (typeof session.id !== "string" || !session.id.trim()) {
    throw new Error("La sesión necesita un identificador único.");
  }

  if (!session.date) {
    throw new Error("La sesión necesita una fecha.");
  }

  const now = new Date().toISOString();

  const savedSession = {
    ...session,
    id: session.id,
    createdAt: session.createdAt || now,
    updatedAt: now
  };

  await executeTransaction(
    STORES.SESSIONS,
    "readwrite",
    (store) => store.put(savedSession)
  );

  return savedSession;
}

/**
 * Recupera una sesión por su identificador.
 */

export async function getTrainingSession(id) {
  if (!id) {
    throw new Error("Falta el identificador de la sesión.");
  }

  return executeTransaction(
    STORES.SESSIONS,
    "readonly",
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }
  ).then((result) => result);
}

/**
 * Recupera todas las sesiones del historial.
 */

export async function getTrainingHistory() {
  return executeTransaction(
    STORES.SESSIONS,
    "readonly",
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onsuccess = () => {
          const sessions = request.result || [];

          sessions.sort((a, b) => {
            return String(b.date).localeCompare(String(a.date));
          });

          resolve(sessions);
        };

        request.onerror = () => reject(request.error);
      });
    }
  ).then((result) => result);
}

/**
 * Elimina una sesión concreta.
 */

export async function deleteTrainingSession(id) {
  if (!id) {
    throw new Error("Falta el identificador de la sesión.");
  }

  return executeTransaction(
    STORES.SESSIONS,
    "readwrite",
    (store) => store.delete(id)
  );
}

/* =====================================================
   5. CONFIGURACIÓN GENERAL
   ===================================================== */

/**
 * Guarda una preferencia o configuración.
 */

export async function saveSetting(key, value) {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("La configuración necesita una clave.");
  }

  const setting = {
    key,
    value,
    updatedAt: new Date().toISOString()
  };

  await executeTransaction(
    STORES.SETTINGS,
    "readwrite",
    (store) => store.put(setting)
  );

  return setting;
}

/**
 * Recupera una configuración.
 */

export async function getSetting(key) {
  if (!key) {
    throw new Error("Falta la clave de configuración.");
  }

  return executeTransaction(
    STORES.SETTINGS,
    "readonly",
    (store) => {
      return new Promise((resolve, reject) => {
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(
            request.result
              ? request.result.value
              : null
          );
        };

        request.onerror = () => reject(request.error);
      });
    }
  ).then((result) => result);
}

/* =====================================================
   6. COMPROBAR EL ESTADO DE LA BASE DE DATOS
   ===================================================== */

export async function checkDatabase() {
  try {
    const db = await openDatabase();

    return {
      available: true,
      name: db.name,
      version: db.version,
      stores: Array.from(db.objectStoreNames)
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/* =====================================================
   FIN DEL ARCHIVO DATABASE
   ===================================================== */
