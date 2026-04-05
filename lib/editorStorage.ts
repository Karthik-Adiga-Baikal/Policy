export interface EditorSnapshot {
  version: number;
  policyId: string;
  title: string;
  html: string;
  updatedAt: string;
}

const SNAPSHOT_VERSION = 1;

function localStorageKey(policyId: string) {
  return `editor:snapshot:${policyId}`;
}

export function saveSnapshotToLocalStorage(snapshot: Omit<EditorSnapshot, "version">) {
  if (typeof window === "undefined") return;
  const payload: EditorSnapshot = {
    version: SNAPSHOT_VERSION,
    ...snapshot,
  };
  window.localStorage.setItem(localStorageKey(snapshot.policyId), JSON.stringify(payload));
}

export function loadSnapshotFromLocalStorage(policyId: string): EditorSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(localStorageKey(policyId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as EditorSnapshot;
    if (!parsed?.html || parsed.version !== SNAPSHOT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

const DB_NAME = "policy_editor_db";
const DB_VERSION = 1;
const STORE = "snapshots";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "policyId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSnapshotToIndexedDb(snapshot: Omit<EditorSnapshot, "version">) {
  if (typeof window === "undefined" || !window.indexedDB) return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ version: SNAPSHOT_VERSION, ...snapshot });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadSnapshotFromIndexedDb(policyId: string): Promise<EditorSnapshot | null> {
  if (typeof window === "undefined" || !window.indexedDB) return null;

  const db = await openDb();
  const result = await new Promise<EditorSnapshot | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const request = store.get(policyId);

    request.onsuccess = () => {
      const value = request.result as EditorSnapshot | undefined;
      if (!value || value.version !== SNAPSHOT_VERSION) {
        resolve(null);
        return;
      }
      resolve(value);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return result;
}
