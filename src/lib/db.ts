// ─── IndexedDB Storage Manager ─────────────────
// High-performance, asynchronous non-blocking storage engine using browser IndexedDB.
// Zero third-party dependencies, transactional safety, and unlimited client capacity.

import type { Task } from "@/types";

const DB_NAME = "trilist_db";
const DB_VERSION = 1;
const STORE_TASKS = "tasks";
const STORE_SETTINGS = "settings";

let dbPromise: Promise<IDBDatabase> | null = null;

export function initDB(): Promise<IDBDatabase> {
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

export async function getAllTasks(): Promise<Task[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, "readonly");
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as Task[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB getAllTasks error:", err);
    return [];
  }
}

export async function addTaskToDB(task: Task): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, "readwrite");
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB addTaskToDB error:", err);
  }
}

export async function updateTaskInDB(task: Task): Promise<void> {
  return addTaskToDB(task);
}

export async function deleteTaskFromDB(id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_TASKS, "readwrite");
      const store = transaction.objectStore(STORE_TASKS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteTaskFromDB error:", err);
  }
}

// ─── Data Export & Import ───────────────────────

export async function exportAllDataJSON(): Promise<string> {
  const tasks = await getAllTasks();
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2);
}

export async function importDataJSON(jsonStr: string): Promise<void> {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid backup format: missing 'tasks' array.");
  }
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_TASKS, "readwrite");
    const store = transaction.objectStore(STORE_TASKS);
    store.clear().onsuccess = () => {
      for (const t of parsed.tasks) {
        store.put(t);
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
