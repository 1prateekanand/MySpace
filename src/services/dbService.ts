import {
  UserProfile,
  LinkCategory,
  BookmarkLink,
  WorkDashboard,
  TaskItem,
  VaultFolder,
  VaultFile,
  AppNotification
} from '../types';
import {
  INITIAL_USER,
  INITIAL_CATEGORIES,
  INITIAL_LINKS,
  INITIAL_DASHBOARDS,
  INITIAL_TASKS,
  INITIAL_FOLDERS,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS
} from '../mock/initialData';
import { encryptData, decryptData } from '../lib/crypto';
import { workspaceDb, StoredEncryptedWorkspace } from '../lib/workspaceDb';

export interface WorkspaceState {
  user: UserProfile;
  categories: LinkCategory[];
  links: BookmarkLink[];
  dashboards: WorkDashboard[];
  tasks: TaskItem[];
  folders: VaultFolder[];
  files: VaultFile[];
  notifications: AppNotification[];
  updatedAt: string;
}

export function getDefaultWorkspaceState(userEmail?: string, userName?: string): WorkspaceState {
  const customUser: UserProfile = {
    ...INITIAL_USER,
    name: userName || (userEmail ? userEmail.split('@')[0] : 'Workspace Member'),
    email: userEmail || 'user@myspace.local',
    initials: (userName || (userEmail ? userEmail.slice(0, 2) : 'ME')).slice(0, 2).toUpperCase(),
  };

  return {
    user: customUser,
    categories: INITIAL_CATEGORIES,
    links: INITIAL_LINKS,
    dashboards: INITIAL_DASHBOARDS,
    tasks: INITIAL_TASKS,
    folders: INITIAL_FOLDERS,
    files: INITIAL_FILES,
    notifications: INITIAL_NOTIFICATIONS,
    updatedAt: new Date().toISOString(),
  };
}

let activeNamespace: string | null = null;
let activeCryptoKey: CryptoKey | null = null;
let activeState: WorkspaceState = getDefaultWorkspaceState();
let saveDebounceTimer: any = null;

async function persistWorkspaceNow(): Promise<void> {
  if (!activeNamespace || !activeCryptoKey) {
    return;
  }

  try {
    activeState.updatedAt = new Date().toISOString();
    const encrypted = await encryptData(activeState, activeCryptoKey);
    const stored: StoredEncryptedWorkspace = {
      namespace: activeNamespace,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      salt: encrypted.salt,
      updatedAt: activeState.updatedAt,
    };
    await workspaceDb.saveEncryptedWorkspace(stored);
  } catch (err) {
    console.error('Failed to encrypt and persist workspace:', err);
  }
}

function schedulePersist(): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(() => {
    persistWorkspaceNow();
  }, 150);
}

export const dbService = {
  // ==================== WORKSPACE SESSION MANAGEMENT ====================
  getActiveNamespace(): string | null {
    return activeNamespace;
  },

  setActiveWorkspace(namespace: string, key: CryptoKey, initialState?: WorkspaceState) {
    activeNamespace = namespace;
    activeCryptoKey = key;
    if (initialState) {
      activeState = initialState;
    }
  },

  clearActiveWorkspace() {
    activeNamespace = null;
    activeCryptoKey = null;
    activeState = getDefaultWorkspaceState();
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
  },

  async loadEncryptedWorkspaceFromDB(namespace: string, key: CryptoKey): Promise<WorkspaceState | null> {
    try {
      const stored = await workspaceDb.loadEncryptedWorkspace(namespace);
      if (!stored) return null;

      const decrypted = await decryptData<WorkspaceState>(
        { ciphertext: stored.ciphertext, iv: stored.iv },
        key
      );

      return decrypted;
    } catch (err) {
      console.error('Error decrypting workspace from DB:', err);
      throw new Error('Decryption failed. Please verify your Vault PIN.');
    }
  },

  async saveRawWorkspaceState(state: WorkspaceState): Promise<void> {
    activeState = { ...state, updatedAt: new Date().toISOString() };
    await persistWorkspaceNow();
  },

  getRawWorkspaceState(): WorkspaceState {
    return JSON.parse(JSON.stringify(activeState));
  },

  // ==================== USER PROFILE ====================
  async loadUserProfile(): Promise<UserProfile> {
    return activeState.user || INITIAL_USER;
  },

  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    activeState.user = { ...activeState.user, ...profile };
    schedulePersist();
  },

  // ==================== LINK CATEGORIES ====================
  async loadCategories(): Promise<LinkCategory[]> {
    return [...(activeState.categories || [])].sort((a, b) => a.order - b.order);
  },

  async saveCategory(category: LinkCategory): Promise<void> {
    const list = [...(activeState.categories || [])];
    const idx = list.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    activeState.categories = list.sort((a, b) => a.order - b.order);
    schedulePersist();
  },

  async saveAllCategories(categories: LinkCategory[]): Promise<void> {
    const ordered = categories.map((c, idx) => ({ ...c, order: idx + 1 }));
    activeState.categories = ordered;
    schedulePersist();
  },

  async deleteCategory(categoryId: string, moveLinksToCategoryId?: string): Promise<void> {
    activeState.categories = (activeState.categories || []).filter(c => c.id !== categoryId);
    if (moveLinksToCategoryId) {
      activeState.links = (activeState.links || []).map(l =>
        l.categoryId === categoryId ? { ...l, categoryId: moveLinksToCategoryId } : l
      );
    } else {
      activeState.links = (activeState.links || []).filter(l => l.categoryId !== categoryId);
    }
    schedulePersist();
  },

  // ==================== SAVED LINKS ====================
  async loadLinks(): Promise<BookmarkLink[]> {
    return [...(activeState.links || [])];
  },

  async saveLink(link: BookmarkLink): Promise<void> {
    const list = [...(activeState.links || [])];
    const idx = list.findIndex(l => l.id === link.id);
    if (idx >= 0) {
      list[idx] = link;
    } else {
      list.unshift(link);
    }
    activeState.links = list;
    schedulePersist();
  },

  async saveAllLinks(links: BookmarkLink[]): Promise<void> {
    activeState.links = [...links];
    schedulePersist();
  },

  async deleteLink(linkId: string): Promise<void> {
    activeState.links = (activeState.links || []).filter(l => l.id !== linkId);
    schedulePersist();
  },

  // ==================== DASHBOARDS ====================
  async loadDashboards(): Promise<WorkDashboard[]> {
    return [...(activeState.dashboards || [])];
  },

  async saveDashboard(dash: WorkDashboard): Promise<void> {
    const list = [...(activeState.dashboards || [])];
    const idx = list.findIndex(d => d.id === dash.id);
    if (idx >= 0) {
      list[idx] = dash;
    } else {
      list.push(dash);
    }
    activeState.dashboards = list;
    schedulePersist();
  },

  async deleteDashboard(dashboardId: string): Promise<void> {
    activeState.dashboards = (activeState.dashboards || []).filter(d => d.id !== dashboardId);
    activeState.tasks = (activeState.tasks || []).filter(t => t.dashboardId !== dashboardId);
    schedulePersist();
  },

  // ==================== TASKS ====================
  async loadTasks(): Promise<TaskItem[]> {
    return [...(activeState.tasks || [])];
  },

  async saveTask(task: TaskItem): Promise<void> {
    const list = [...(activeState.tasks || [])];
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.push(task);
    }
    activeState.tasks = list;
    schedulePersist();
  },

  async deleteTask(taskId: string): Promise<void> {
    activeState.tasks = (activeState.tasks || []).filter(t => t.id !== taskId);
    schedulePersist();
  },

  // ==================== VAULT FOLDERS ====================
  async loadFolders(): Promise<VaultFolder[]> {
    return [...(activeState.folders || [])];
  },

  async saveFolder(folder: VaultFolder): Promise<void> {
    const list = [...(activeState.folders || [])];
    const idx = list.findIndex(f => f.id === folder.id);
    if (idx >= 0) {
      list[idx] = folder;
    } else {
      list.push(folder);
    }
    activeState.folders = list;
    schedulePersist();
  },

  async deleteFolder(folderId: string): Promise<void> {
    activeState.folders = (activeState.folders || []).filter(f => f.id !== folderId);
    activeState.files = (activeState.files || []).filter(f => f.folderId !== folderId);
    schedulePersist();
  },

  // ==================== VAULT FILES & BLOBS ====================
  async loadFiles(): Promise<VaultFile[]> {
    return [...(activeState.files || [])];
  },

  async getFileBlob(file: VaultFile): Promise<Blob | null> {
    if (!activeNamespace) return null;
    return await workspaceDb.getVaultBlob(activeNamespace, file.id);
  },

  async saveFile(file: VaultFile, rawFile?: File | Blob): Promise<void> {
    const list = [...(activeState.files || [])];
    const idx = list.findIndex(f => f.id === file.id);
    if (idx >= 0) {
      list[idx] = file;
    } else {
      list.unshift(file);
    }
    activeState.files = list;
    schedulePersist();

    // Persist binary Blob into local IndexedDB under this device namespace
    if (rawFile && activeNamespace) {
      await workspaceDb.saveVaultBlob(
        activeNamespace,
        file.id,
        rawFile,
        file.name,
        file.mimeType
      );
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    activeState.files = (activeState.files || []).filter(f => f.id !== fileId);
    schedulePersist();

    if (activeNamespace) {
      await workspaceDb.deleteVaultBlob(activeNamespace, fileId);
    }
  },

  // ==================== NOTIFICATIONS ====================
  async loadNotifications(): Promise<AppNotification[]> {
    return [...(activeState.notifications || [])];
  },

  async saveNotification(notif: AppNotification): Promise<void> {
    const list = [...(activeState.notifications || [])];
    const idx = list.findIndex(n => n.id === notif.id);
    if (idx >= 0) {
      list[idx] = notif;
    } else {
      list.unshift(notif);
    }
    activeState.notifications = list;
    schedulePersist();
  },

  async markNotificationRead(id: string): Promise<void> {
    activeState.notifications = (activeState.notifications || []).map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    schedulePersist();
  },

  async clearAllNotifications(): Promise<void> {
    activeState.notifications = [];
    schedulePersist();
  },
};
