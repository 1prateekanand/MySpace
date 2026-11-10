/**
 * IndexedDB Storage Layer for MySpace Isolated Multi-User Workspaces
 * 
 * Provides robust client-side storage for:
 * 1. Encrypted workspace payloads (AES-256-GCM encrypted JSON)
 * 2. Auth metadata (verifier salt & hash for PIN validation)
 * 3. File Blobs for MyVault
 */

const DB_NAME = 'MySpaceLocalDB_v2';
const DB_VERSION = 2;

const STORES = {
  WORKSPACES: 'workspaces',
  AUTH_META: 'auth_metadata',
  VAULT_BLOBS: 'vault_blobs',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

// In-memory fallback if IndexedDB is blocked
const memoryStore = new Map<string, any>();

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

export function openWorkspaceDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store 1: Encrypted workspace data by namespace
      if (!db.objectStoreNames.contains(STORES.WORKSPACES)) {
        db.createObjectStore(STORES.WORKSPACES, { keyPath: 'namespace' });
      }

      // Store 2: User device auth metadata (verifier salt & hash)
      if (!db.objectStoreNames.contains(STORES.AUTH_META)) {
        db.createObjectStore(STORES.AUTH_META, { keyPath: 'namespace' });
      }

      // Store 3: Binary Vault blobs
      if (!db.objectStoreNames.contains(STORES.VAULT_BLOBS)) {
        const blobStore = db.createObjectStore(STORES.VAULT_BLOBS, { keyPath: 'id' });
        blobStore.createIndex('namespace', 'namespace', { unique: false });
        blobStore.createIndex('fileId', 'fileId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export interface StoredEncryptedWorkspace {
  namespace: string;
  ciphertext: string;
  iv: string;
  salt: string;
  updatedAt: string;
}

export interface StoredAuthMetadata {
  namespace: string;
  verifierSalt: string;
  verifierHash: string;
  createdAt: string;
  lastUnlockedAt?: string;
}

export interface StoredVaultBlob {
  id: string; // `${namespace}::${fileId}`
  namespace: string;
  fileId: string;
  blob: Blob;
  name?: string;
  mimeType?: string;
  updatedAt: string;
}

export const workspaceDb = {
  // ==================== AUTH METADATA ====================
  async saveAuthMetadata(meta: StoredAuthMetadata): Promise<void> {
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.AUTH_META, 'readwrite');
        const store = tx.objectStore(STORES.AUTH_META);
        const req = store.put(meta);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      memoryStore.set(`auth_${meta.namespace}`, meta);
    }
  },

  async loadAuthMetadata(namespace: string): Promise<StoredAuthMetadata | null> {
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.AUTH_META, 'readonly');
        const store = tx.objectStore(STORES.AUTH_META);
        const req = store.get(namespace);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryStore.get(`auth_${namespace}`) || null;
    }
  },

  // ==================== ENCRYPTED WORKSPACE ====================
  async saveEncryptedWorkspace(data: StoredEncryptedWorkspace): Promise<void> {
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.WORKSPACES, 'readwrite');
        const store = tx.objectStore(STORES.WORKSPACES);
        const req = store.put(data);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      memoryStore.set(`workspace_${data.namespace}`, data);
    }
  },

  async loadEncryptedWorkspace(namespace: string): Promise<StoredEncryptedWorkspace | null> {
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.WORKSPACES, 'readonly');
        const store = tx.objectStore(STORES.WORKSPACES);
        const req = store.get(namespace);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return memoryStore.get(`workspace_${namespace}`) || null;
    }
  },

  // ==================== VAULT BLOBS ====================
  async saveVaultBlob(namespace: string, fileId: string, blob: Blob, name?: string, mimeType?: string): Promise<void> {
    const id = `${namespace}::${fileId}`;
    const record: StoredVaultBlob = {
      id,
      namespace,
      fileId,
      blob,
      name,
      mimeType,
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.VAULT_BLOBS, 'readwrite');
        const store = tx.objectStore(STORES.VAULT_BLOBS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryStore.set(`blob_${id}`, record);
    }
  },

  async getVaultBlob(namespace: string, fileId: string): Promise<Blob | null> {
    const id = `${namespace}::${fileId}`;
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.VAULT_BLOBS, 'readonly');
        const store = tx.objectStore(STORES.VAULT_BLOBS);
        const req = store.get(id);
        req.onsuccess = () => {
          const res = req.result as StoredVaultBlob | undefined;
          resolve(res ? res.blob : null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const mem = memoryStore.get(`blob_${id}`);
      return mem ? mem.blob : null;
    }
  },

  async deleteVaultBlob(namespace: string, fileId: string): Promise<void> {
    const id = `${namespace}::${fileId}`;
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.VAULT_BLOBS, 'readwrite');
        const store = tx.objectStore(STORES.VAULT_BLOBS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      memoryStore.delete(`blob_${id}`);
    }
  },

  async getAllVaultBlobsForNamespace(namespace: string): Promise<Array<{ fileId: string; blob: Blob; name?: string }>> {
    try {
      const db = await openWorkspaceDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.VAULT_BLOBS, 'readonly');
        const store = tx.objectStore(STORES.VAULT_BLOBS);
        const index = store.index('namespace');
        const req = index.getAll(namespace);
        req.onsuccess = () => {
          const items = (req.result || []) as StoredVaultBlob[];
          resolve(items.map(item => ({ fileId: item.fileId, blob: item.blob, name: item.name })));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      const result: Array<{ fileId: string; blob: Blob; name?: string }> = [];
      memoryStore.forEach((val, key) => {
        if (key.startsWith(`blob_${namespace}::`)) {
          result.push({ fileId: val.fileId, blob: val.blob, name: val.name });
        }
      });
      return result;
    }
  },

  async clearWorkspace(namespace: string): Promise<void> {
    try {
      const db = await openWorkspaceDB();
      const tx = db.transaction([STORES.WORKSPACES, STORES.AUTH_META, STORES.VAULT_BLOBS], 'readwrite');
      tx.objectStore(STORES.WORKSPACES).delete(namespace);
      tx.objectStore(STORES.AUTH_META).delete(namespace);

      const blobStore = tx.objectStore(STORES.VAULT_BLOBS);
      const index = blobStore.index('namespace');
      const req = index.getAllKeys(namespace);
      req.onsuccess = () => {
        const keys = req.result;
        keys.forEach(k => blobStore.delete(k));
      };
    } catch {
      memoryStore.delete(`auth_${namespace}`);
      memoryStore.delete(`workspace_${namespace}`);
    }
  },
};
