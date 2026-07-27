// ─── IndexedDB Storage Manager ─────────────────
// High-performance, asynchronous non-blocking storage engine using browser IndexedDB.
// Zero third-party dependencies, transactional safety, and unlimited client capacity.

const DB_NAME = "trilist_db";
const DB_VERSION = 1;
const STORE_TASKS = "tasks";
const STORE_SETTINGS = "settings";

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        db.createObjectStore(STORE_TASKS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ─── Task Operations ────────────────────────────

export async function getStoredTasks<T>(): Promise<T[] | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, "readonly");
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB getStoredTasks fallback:", err);
    return null;
  }
}

export async function saveStoredTasks<T extends { id: string }>(tasks: T[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, "readwrite");
      const store = transaction.objectStore(STORE_TASKS);
      
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        for (const task of tasks) {
          store.put(task);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn("IndexedDB saveStoredTasks fallback:", err);
  }
}

// ─── Settings / Theme Operations ───────────────

export async function getStoredSetting<T>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, "readonly");
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB getStoredSetting fallback:", err);
    return null;
  }
}

export async function saveStoredSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, "readwrite");
      const store = transaction.objectStore(STORE_SETTINGS);
      store.put(value, key);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn("IndexedDB saveStoredSetting fallback:", err);
  }
}
