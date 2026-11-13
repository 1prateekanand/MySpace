import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  NavPage,
  ThemeMode,
  UserProfile,
  LinkCategory,
  BookmarkLink,
  WorkDashboard,
  TaskItem,
  TaskStatus,
  WorkListViewMode,
  VaultFolder,
  VaultFile,
  AppNotification,
  ToastItem
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
import { dbService, getDefaultWorkspaceState, WorkspaceState } from '../services/dbService';
import { getSupabase, isSupabaseConnected, saveStoredSupabaseConfig, getStoredSupabaseConfig } from '../lib/supabase';
import { safeStorage } from '../lib/storage';
import { cacheFile } from '../lib/fileOpener';
import { getDeviceId, getWorkspaceNamespace } from '../lib/deviceId';
import {
  deriveKeyFromPin,
  createPinVerifier,
  verifyPin,
  base64ToUint8Array,
  generateSalt
} from '../lib/crypto';
import { workspaceDb } from '../lib/workspaceDb';
import { exportEncryptedBackup, importEncryptedBackup } from '../lib/backup';

export interface MySpaceUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface MySpaceContextType {
  // Navigation & Page
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;

  // User Profile (within workspace)
  user: UserProfile;
  updateUser: (profile: Partial<UserProfile>) => Promise<void>;

  // Multi-User Auth & State
  isAuthLoading: boolean;
  isSupabaseConfigured: boolean;
  supabaseUser: MySpaceUser | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithSupabase: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signInAsGuest: () => Promise<{ error?: string }>;
  resetPasswordWithSupabase: (email: string) => Promise<{ error?: string }>;
  signOutSupabase: () => Promise<void>;
  updateSupabaseCredentials: (url: string, key: string) => void;

  // Device-Isolated Workspace & PIN Lock
  deviceId: string;
  workspaceNamespace: string;
  isWorkspaceLocked: boolean;
  isPinSetupNeeded: boolean;
  setupVaultPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWorkspaceWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lockWorkspace: () => void;
  resetLocalWorkspace: () => Promise<void>;

  // Backup & Restore
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  exportEncryptedBackupFile: (pin: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  importEncryptedBackupFile: (file: File, pin: string) => Promise<{ success: boolean; error?: string; restored?: any }>;

  // Global Search Modal
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Toasts
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;

  // Notifications
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotifAsRead: (id: string) => void;
  markAllNotifsAsRead: () => void;
  clearAllNotifs: () => void;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning', actionLink?: AppNotification['actionLink']) => void;

  // Links Manager
  categories: LinkCategory[];
  links: BookmarkLink[];
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (catId: string) => void;
  addCategory: (name: string, icon: string, color: string) => Promise<void>;
  updateCategory: (id: string, name: string, icon: string, color: string) => Promise<void>;
  deleteCategory: (id: string, moveLinksToCategoryId?: string) => Promise<boolean>;
  addLink: (link: Omit<BookmarkLink, 'id' | 'clickCount' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateLink: (id: string, updates: Partial<BookmarkLink>) => Promise<boolean>;
  deleteLink: (id: string) => Promise<boolean>;
  togglePinLink: (id: string) => Promise<void>;
  trackLinkClick: (id: string) => Promise<void>;
  reorderLinks: (categoryId: string, reorderedLinks: BookmarkLink[]) => Promise<void>;
  reorderCategories: (reorderedCategories: LinkCategory[]) => Promise<void>;
  moveLink: (linkId: string, targetCategoryId: string, targetIndex?: number) => Promise<void>;

  dashboards: WorkDashboard[];
  activeDashboardId: string;
  setActiveDashboardId: (id: string) => void;
  addDashboard: (name: string, icon?: string) => Promise<void>;
  renameDashboard: (id: string, name: string) => Promise<void>;
  updateDashboard: (id: string, updates: { name: string; icon?: string }) => Promise<void>;
  duplicateDashboard: (id: string) => Promise<void>;
  deleteDashboard: (id: string, moveTasksToDashboardId?: string) => Promise<void>;
  workListViewMode: WorkListViewMode;
  setWorkListViewMode: (mode: WorkListViewMode) => void;
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id' | 'order' | 'createdAt' | 'comments' | 'subtasks' | 'attachments'> & {
    subtasks?: string[];
    description?: string;
  }) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;

  // MyVault
  folders: VaultFolder[];
  files: VaultFile[];
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  vaultViewMode: 'grid' | 'list';
  setVaultViewMode: (mode: 'grid' | 'list') => void;
  vaultSortBy: 'name' | 'date' | 'size';
  setVaultSortBy: (sort: 'name' | 'date' | 'size') => void;
  vaultSearchQuery: string;
  setVaultSearchQuery: (q: string) => void;
  selectedFileIds: string[];
  setSelectedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectFile: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelectedFiles: () => void;
  addFolder: (name: string, parentId?: string | null, color?: string) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  uploadFile: (file: File, folderId?: string | null) => Promise<void>;
  createNoteFile: (name: string, content: string, folderId?: string | null) => Promise<void>;
  addVaultFile: (file: VaultFile) => Promise<void>;
  renameFile: (id: string, newName: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  deleteSelectedFiles: () => Promise<void>;
  moveFile: (fileId: string, targetFolderId: string) => Promise<void>;

  // Global Actions
  resetAllToDefault: () => void;
  exportAllData: () => void;
  importAllData: (jsonData: string) => boolean;
}

const MySpaceContext = createContext<MySpaceContextType | undefined>(undefined);

const LOCAL_SESSION_KEY = 'myspace_auth_user_session';

export const MySpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceId = getDeviceId();

  // Navigation & Page
  const [currentPage, setCurrentPage] = useState<NavPage>(() => {
    try {
      const saved = safeStorage.getItem('myspace_current_page');
      if (saved === 'links' || saved === 'work-list' || saved === 'vault' || saved === 'settings') {
        return saved;
      }
      return 'links';
    } catch {
      return 'links';
    }
  });

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = safeStorage.getItem('myspace_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  // Auth & Multi-User State
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(isSupabaseConnected());
  const [supabaseUser, setSupabaseUser] = useState<MySpaceUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Device-Isolated Workspace Security State
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState<boolean>(true);
  const [isPinSetupNeeded, setIsPinSetupNeeded] = useState<boolean>(false);
  const [activeNamespace, setActiveNamespace] = useState<string>('');

  // Workspace In-Memory Entities
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [categories, setCategories] = useState<LinkCategory[]>(INITIAL_CATEGORIES);
  const [links, setLinks] = useState<BookmarkLink[]>(INITIAL_LINKS);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [dashboards, setDashboards] = useState<WorkDashboard[]>(INITIAL_DASHBOARDS);
  const [activeDashboardId, setActiveDashboardId] = useState<string>('dash-working');
  const [workListViewMode, setWorkListViewMode] = useState<WorkListViewMode>('board');
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [folders, setFolders] = useState<VaultFolder[]>(INITIAL_FOLDERS);
  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>('f-projects');
  const [vaultViewMode, setVaultViewMode] = useState<'grid' | 'list'>('grid');
  const [vaultSortBy, setVaultSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Global Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync Theme
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
      safeStorage.setItem('myspace_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Persist Page
  useEffect(() => {
    try {
      safeStorage.setItem('myspace_current_page', currentPage);
    } catch {
      // ignore
    }
  }, [currentPage]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check Auth State on Startup
  const checkWorkspaceSecurity = useCallback(async (activeUser: MySpaceUser) => {
    const namespace = getWorkspaceNamespace(activeUser.id);
    setActiveNamespace(namespace);

    const isGuestAccount =
      activeUser.id === 'user-demo-01' ||
      activeUser.email.toLowerCase() === 'demo@myspace.local';

    try {
      const meta = await workspaceDb.loadAuthMetadata(namespace);
      if (!meta) {
        if (isGuestAccount) {
          // Initialize Guest workspace encrypted with default PIN "1234"
          const { verifierSalt, verifierHash } = await createPinVerifier('1234');
          await workspaceDb.saveAuthMetadata({
            namespace,
            verifierSalt,
            verifierHash,
            createdAt: new Date().toISOString(),
            lastUnlockedAt: new Date().toISOString(),
          });
          const salt = base64ToUint8Array(verifierSalt);
          const cryptoKey = await deriveKeyFromPin('1234', salt);
          const initialState = getDefaultWorkspaceState(
            activeUser.email,
            activeUser.name || 'Guest'
          );
          dbService.setActiveWorkspace(namespace, cryptoKey, initialState);
          await dbService.saveRawWorkspaceState(initialState);
          dbService.clearActiveWorkspace();

          setIsPinSetupNeeded(false);
          setIsWorkspaceLocked(true);
        } else {
          // Regular user has not set up a PIN for this device yet
          setIsPinSetupNeeded(true);
          setIsWorkspaceLocked(true);
        }
      } else {
        // PIN exists, workspace is locked until PIN is entered
        setIsPinSetupNeeded(false);
        setIsWorkspaceLocked(true);
      }
    } catch (err) {
      console.error('Failed reading workspace auth metadata:', err);
      setIsPinSetupNeeded(true);
      setIsWorkspaceLocked(true);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);

      try {
        const client = getSupabase();
        let userFound: MySpaceUser | null = null;

        if (client) {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            userFound = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
              avatarUrl: session.user.user_metadata?.avatar_url,
            };
          }

          client.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const u: MySpaceUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
                avatarUrl: session.user.user_metadata?.avatar_url,
              };
              setSupabaseUser(u);
              await checkWorkspaceSecurity(u);
            } else {
              setSupabaseUser(null);
              setIsWorkspaceLocked(true);
              dbService.clearActiveWorkspace();
            }
          });
        }

        // Check local storage session fallback
        if (!userFound) {
          const savedSession = safeStorage.getItem(LOCAL_SESSION_KEY);
          if (savedSession) {
            try {
              userFound = JSON.parse(savedSession);
            } catch {
              // ignore
            }
          }
        }

        if (userFound) {
          setSupabaseUser(userFound);
          await checkWorkspaceSecurity(userFound);
        } else {
          setSupabaseUser(null);
          setIsWorkspaceLocked(true);
        }
      } catch (err) {
        console.error('Error in initial auth check:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, [checkWorkspaceSecurity]);

  // Unlock Workspace with PIN
  const unlockWorkspaceWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseUser || !activeNamespace) {
      return { success: false, error: 'No authenticated user session.' };
    }

    try {
      const meta = await workspaceDb.loadAuthMetadata(activeNamespace);
      if (!meta) {
        return { success: false, error: 'No Vault PIN configured for this device.' };
      }

      // Verify PIN
      const isMatch = await verifyPin(pin, meta.verifierSalt, meta.verifierHash);
      if (!isMatch) {
        return { success: false, error: 'Incorrect Vault PIN. Please try again.' };
      }

      // Derive AES-256 CryptoKey
      const salt = base64ToUint8Array(meta.verifierSalt);
      const cryptoKey = await deriveKeyFromPin(pin, salt);

      // Load and decrypt local workspace from IndexedDB
      let state: WorkspaceState | null = null;
      try {
        state = await dbService.loadEncryptedWorkspaceFromDB(activeNamespace, cryptoKey);
      } catch {
        return { success: false, error: 'Failed to decrypt workspace data with this PIN.' };
      }

      if (!state) {
        // Fallback default state if first time unlocking empty DB
        state = getDefaultWorkspaceState(supabaseUser.email, supabaseUser.name);
      }

      // Activate workspace in dbService & React state
      dbService.setActiveWorkspace(activeNamespace, cryptoKey, state);
      setUser(state.user || INITIAL_USER);
      setCategories(state.categories || INITIAL_CATEGORIES);
      setLinks(state.links || INITIAL_LINKS);
      setDashboards(state.dashboards || INITIAL_DASHBOARDS);
      setTasks(state.tasks || INITIAL_TASKS);
      setFolders(state.folders || INITIAL_FOLDERS);
      setFiles(state.files || INITIAL_FILES);
      setNotifications(state.notifications || INITIAL_NOTIFICATIONS);

      if (state.dashboards && state.dashboards.length > 0) {
        setActiveDashboardId(state.dashboards[0].id);
      }

      setIsWorkspaceLocked(false);
      setIsPinSetupNeeded(false);
      showToast('Workspace unlocked successfully', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Unlock error:', err);
      return { success: false, error: err?.message || 'Failed to unlock workspace.' };
    }
  };

  // Setup Vault PIN for new user/device
  const setupVaultPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabaseUser || !activeNamespace) {
      return { success: false, error: 'No active user session to bind PIN.' };
    }
    if (pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits.' };
    }

    try {
      // 1. Create verification tokens
      const { verifierSalt, verifierHash } = await createPinVerifier(pin);

      await workspaceDb.saveAuthMetadata({
        namespace: activeNamespace,
        verifierSalt,
        verifierHash,
        createdAt: new Date().toISOString(),
        lastUnlockedAt: new Date().toISOString(),
      });

      // 2. Derive encryption key
      const salt = base64ToUint8Array(verifierSalt);
      const cryptoKey = await deriveKeyFromPin(pin, salt);

      // 3. Initialize fresh default workspace for this user
      const initialState = getDefaultWorkspaceState(supabaseUser.email, supabaseUser.name);
      dbService.setActiveWorkspace(activeNamespace, cryptoKey, initialState);

      setUser(initialState.user);
      setCategories(initialState.categories);
      setLinks(initialState.links);
      setDashboards(initialState.dashboards);
      setTasks(initialState.tasks);
      setFolders(initialState.folders);
      setFiles(initialState.files);
      setNotifications(initialState.notifications);

      // Persist encrypted initial state immediately to IndexedDB
      await dbService.saveRawWorkspaceState(initialState);

      setIsPinSetupNeeded(false);
      setIsWorkspaceLocked(false);

      showToast('Vault PIN set up & workspace encrypted!', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Setup PIN error:', err);
      return { success: false, error: err?.message || 'Failed to setup Vault PIN.' };
    }
  };

  // Lock Workspace (manually or on inactivity)
  const lockWorkspace = () => {
    dbService.clearActiveWorkspace();
    setIsWorkspaceLocked(true);
    showToast('Workspace locked', 'info');
  };

  // Reset Local Workspace (if PIN forgotten)
  const resetLocalWorkspace = async () => {
    if (!activeNamespace) return;
    await workspaceDb.clearWorkspace(activeNamespace);
    dbService.clearActiveWorkspace();

    const isGuestAccount =
      supabaseUser &&
      (supabaseUser.id === 'user-demo-01' ||
        supabaseUser.email.toLowerCase() === 'demo@myspace.local');

    if (isGuestAccount && supabaseUser) {
      await checkWorkspaceSecurity(supabaseUser);
      showToast('Guest workspace reset. Default PIN is 1234.', 'warning');
      return;
    }

    setIsPinSetupNeeded(true);
    setIsWorkspaceLocked(true);
    showToast('Device workspace reset. Please set a new Vault PIN.', 'warning');
  };

  // Supabase Auth Methods
  const signInWithSupabase = async (email: string, pass: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabase();

    if (client) {
      const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error) {
        return { error: error.message };
      }
      const u: MySpaceUser = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
      };
      setSupabaseUser(u);
      safeStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
      await checkWorkspaceSecurity(u);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${u.name}!`);
      return {};
    }

    // Local account fallback (if no live Supabase server configured)
    const localUsersRaw = safeStorage.getItem('myspace_registered_users');
    let localUsers: Array<{ id: string; email: string; pass: string; name: string }> = [];
    try {
      if (localUsersRaw) localUsers = JSON.parse(localUsersRaw);
    } catch {
      localUsers = [];
    }

    const matched = localUsers.find(u => u.email === cleanEmail && u.pass === pass);
    if (!matched && cleanEmail !== 'demo@myspace.local') {
      return { error: 'Invalid credentials or user not found. (Use any password with demo@myspace.local or create an account).' };
    }

    const u: MySpaceUser = {
      id: matched ? matched.id : 'user-demo-01',
      email: cleanEmail,
      name: matched ? matched.name : 'Demo User',
    };
    setSupabaseUser(u);
    safeStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    await checkWorkspaceSecurity(u);
    setIsAuthModalOpen(false);
    showToast(`Welcome back, ${u.name}!`);
    return {};
  };

  const signUpWithSupabase = async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const client = getSupabase();

    if (client) {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { name: cleanName } },
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        const u: MySpaceUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanName,
        };
        setSupabaseUser(u);
        safeStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
        await checkWorkspaceSecurity(u);
        setIsAuthModalOpen(false);
        showToast('Account registered successfully!');
        return {};
      }
    }

    // Local account registration fallback
    const localUsersRaw = safeStorage.getItem('myspace_registered_users');
    let localUsers: Array<{ id: string; email: string; pass: string; name: string }> = [];
    try {
      if (localUsersRaw) localUsers = JSON.parse(localUsersRaw);
    } catch {
      localUsers = [];
    }

    if (localUsers.some(u => u.email === cleanEmail)) {
      return { error: 'An account with this email already exists.' };
    }

    const newLocalUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      pass,
      name: cleanName,
    };
    localUsers.push(newLocalUser);
    safeStorage.setItem('myspace_registered_users', JSON.stringify(localUsers));

    const u: MySpaceUser = {
      id: newLocalUser.id,
      email: newLocalUser.email,
      name: newLocalUser.name,
    };
    setSupabaseUser(u);
    safeStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u));
    await checkWorkspaceSecurity(u);
    setIsAuthModalOpen(false);
    showToast('Account registered locally!');
    return {};
  };

  const signInAsGuest = async (): Promise<{ error?: string }> => {
    const guestUser: MySpaceUser = {
      id: 'user-demo-01',
      email: 'demo@myspace.local',
      name: 'Guest User',
    };
    setSupabaseUser(guestUser);
    safeStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(guestUser));
    await checkWorkspaceSecurity(guestUser);
    setIsAuthModalOpen(false);
    showToast('Signed in with Guest Account', 'info');
    return {};
  };

  const resetPasswordWithSupabase = async (email: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabase();
    if (client) {
      const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return { error: error.message };
      }
    }
    showToast(`Password reset link sent to ${cleanEmail}`, 'info');
    return {};
  };

  const signOutSupabase = async () => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
    }
    safeStorage.removeItem(LOCAL_SESSION_KEY);
    dbService.clearActiveWorkspace();
    setSupabaseUser(null);
    setIsWorkspaceLocked(true);
    setIsPinSetupNeeded(false);
    showToast('Signed out of MySpace', 'info');
  };

  const updateSupabaseCredentials = (url: string, key: string) => {
    saveStoredSupabaseConfig({ url: url.trim(), anonKey: key.trim() });
    setIsSupabaseConfigured(isSupabaseConnected());
    showToast('Supabase configuration updated');
  };

  // Encrypted Backup & Restore
  const exportEncryptedBackupFile = async (pin: string): Promise<{ success: boolean; filename?: string; error?: string }> => {
    if (!supabaseUser || !activeNamespace) {
      return { success: false, error: 'No active workspace to export.' };
    }
    try {
      const res = await exportEncryptedBackup(pin, supabaseUser.email, activeNamespace);
      showToast(`Exported encrypted backup: ${res.filename}`, 'success');
      return res;
    } catch (err: any) {
      showToast(`Backup export failed: ${err?.message}`, 'error');
      return { success: false, error: err?.message };
    }
  };

  const importEncryptedBackupFile = async (file: File, pin: string): Promise<{ success: boolean; error?: string; restored?: any }> => {
    if (!supabaseUser || !activeNamespace) {
      return { success: false, error: 'No active workspace to restore into.' };
    }
    try {
      const res = await importEncryptedBackup(file, pin, activeNamespace);
      if (res.success) {
        // Reload workspace from dbService
        const restoredState = dbService.getRawWorkspaceState();
        setUser(restoredState.user);
        setCategories(restoredState.categories);
        setLinks(restoredState.links);
        setDashboards(restoredState.dashboards);
        setTasks(restoredState.tasks);
        setFolders(restoredState.folders);
        setFiles(restoredState.files);
        setNotifications(restoredState.notifications);

        showToast(`Backup restored! ${res.restoredItems?.links || 0} links, ${res.restoredItems?.tasks || 0} tasks`, 'success');
        return { success: true, restored: res.restoredItems };
      } else {
        showToast(res.error || 'Restore failed', 'error');
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      showToast(err?.message || 'Restore failed', 'error');
      return { success: false, error: err?.message };
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateUser = async (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
    await dbService.saveUserProfile(profile);
    showToast('Profile updated');
  };

  // Notifications logic
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markNotifAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    await dbService.markNotificationRead(id);
  };

  const markAllNotifsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    for (const notif of notifications) {
      await dbService.markNotificationRead(notif.id);
    }
    showToast('All notifications marked as read');
  };

  const clearAllNotifs = async () => {
    setNotifications([]);
    await dbService.clearAllNotifications();
    showToast('Notifications cleared', 'info');
  };

  const addNotification = async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' = 'info',
    actionLink?: AppNotification['actionLink']
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      timestamp: 'Just now',
      actionLink,
    };
    setNotifications(prev => [newNotif, ...prev]);
    await dbService.saveNotification(newNotif);
  };

  // Links Handlers
  const addCategory = async (name: string, icon: string, color: string) => {
    const newCat: LinkCategory = {
      id: `cat-${Date.now()}`,
      name,
      icon: icon || 'Folder',
      color: color || '#8b5cf6',
      order: categories.length + 1,
    };
    setCategories(prev => [...prev, newCat]);
    await dbService.saveCategory(newCat);
    showToast(`Category "${name}" created`);
  };

  const updateCategory = async (id: string, name: string, icon: string, color: string) => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id === id) {
          const updated = { ...cat, name, icon, color };
          dbService.saveCategory(updated);
          return updated;
        }
        return cat;
      })
    );
    showToast(`Category "${name}" updated`);
  };

  const deleteCategory = async (id: string, moveLinksToCategoryId?: string): Promise<boolean> => {
    const targetCat = categories.find(c => c.id === id);
    if (!targetCat) return false;

    setCategories(prev => prev.filter(c => c.id !== id));
    if (moveLinksToCategoryId) {
      setLinks(prev =>
        prev.map(l => (l.categoryId === id ? { ...l, categoryId: moveLinksToCategoryId } : l))
      );
    } else {
      setLinks(prev => prev.filter(l => l.categoryId !== id));
    }

    await dbService.deleteCategory(id, moveLinksToCategoryId);
    if (selectedCategoryFilter === id) {
      setSelectedCategoryFilter('all');
    }
    showToast(`Category "${targetCat.name}" deleted`, 'info');
    return true;
  };

  const addLink = async (
    linkData: Omit<BookmarkLink, 'id' | 'clickCount' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    const title = linkData.title.trim();
    let formattedUrl = linkData.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const isDuplicate = links.some(
      l => l.url.toLowerCase() === formattedUrl.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Link "${formattedUrl}" already exists!`, 'warning');
      return { success: false, error: 'A bookmark with this exact URL already exists.' };
    }

    const iconLetter =
      linkData.iconLetter ||
      (title.length > 2 ? title.slice(0, 2).toUpperCase() : title.toUpperCase());

    let favicon = linkData.favicon;
    if (!favicon && formattedUrl) {
      try {
        const domain = new URL(formattedUrl).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      } catch {
        // ignore
      }
    }

    const newLink: BookmarkLink = {
      ...linkData,
      id: `link-${Date.now()}`,
      url: formattedUrl,
      iconLetter,
      favicon,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      order: links.filter(l => l.categoryId === linkData.categoryId).length + 1,
    };

    setLinks(prev => [newLink, ...prev]);
    await dbService.saveLink(newLink);
    showToast(`Link "${title}" added`);
    return { success: true };
  };

  const updateLink = async (id: string, updates: Partial<BookmarkLink>): Promise<boolean> => {
    setLinks(prev =>
      prev.map(link => {
        if (link.id === id) {
          const updated = { ...link, ...updates };
          dbService.saveLink(updated);
          return updated;
        }
        return link;
      })
    );
    showToast('Link updated');
    return true;
  };

  const deleteLink = async (id: string): Promise<boolean> => {
    setLinks(prev => prev.filter(l => l.id !== id));
    await dbService.deleteLink(id);
    showToast('Link removed', 'info');
    return true;
  };

  const togglePinLink = async (id: string) => {
    setLinks(prev =>
      prev.map(link => {
        if (link.id === id) {
          const updated = { ...link, pinned: !link.pinned };
          dbService.saveLink(updated);
          return updated;
        }
        return link;
      })
    );
  };

  const trackLinkClick = async (id: string) => {
    setLinks(prev =>
      prev.map(link => {
        if (link.id === id) {
          const updated = { ...link, clickCount: link.clickCount + 1 };
          dbService.saveLink(updated);
          return updated;
        }
        return link;
      })
    );
  };

  const reorderLinks = async (_categoryId: string, reorderedLinks: BookmarkLink[]) => {
    const reorderedIds = new Set(reorderedLinks.map(l => l.id));
    setLinks(prev => {
      const rest = prev.filter(l => !reorderedIds.has(l.id));
      const combined = [...reorderedLinks, ...rest];
      dbService.saveAllLinks(combined);
      return combined;
    });
  };

  const reorderCategories = async (reorderedCategories: LinkCategory[]) => {
    setCategories(reorderedCategories);
    await dbService.saveAllCategories(reorderedCategories);
  };

  const moveLink = async (linkId: string, targetCategoryId: string, targetIndex?: number) => {
    setLinks(prev => {
      const linkToMove = prev.find(l => l.id === linkId);
      if (!linkToMove) return prev;

      const updated = { ...linkToMove, categoryId: targetCategoryId };
      const filtered = prev.filter(l => l.id !== linkId);

      if (targetIndex !== undefined) {
        filtered.splice(targetIndex, 0, updated);
      } else {
        filtered.push(updated);
      }

      dbService.saveAllLinks(filtered);
      return filtered;
    });
  };

  // Work List & Tasks
  const addDashboard = async (name: string, icon: string = 'Layout') => {
    const newDash: WorkDashboard = {
      id: `dash-${Date.now()}`,
      name,
      icon,
    };
    setDashboards(prev => [...prev, newDash]);
    await dbService.saveDashboard(newDash);
    setActiveDashboardId(newDash.id);
    showToast(`Dashboard "${name}" created`);
  };

  const renameDashboard = async (id: string, name: string) => {
    await updateDashboard(id, { name });
  };

  const updateDashboard = async (id: string, updates: { name: string; icon?: string }) => {
    const existing = dashboards.find(d => d.id === id);
    if (!existing) return;

    const updated: WorkDashboard = { ...existing, ...updates };
    setDashboards(prev => prev.map(d => (d.id === id ? updated : d)));
    await dbService.saveDashboard(updated);
    showToast(`Dashboard updated successfully`);
  };

  const duplicateDashboard = async (id: string) => {
    const source = dashboards.find(d => d.id === id);
    if (!source) return;

    const newDash: WorkDashboard = {
      id: `dash-${Date.now()}`,
      name: `${source.name} (Copy)`,
      icon: source.icon,
    };

    const sourceTasks = tasks.filter(t => t.dashboardId === id);
    const newTasks = sourceTasks.map(t => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dashboardId: newDash.id,
    }));

    setDashboards(prev => [...prev, newDash]);
    setTasks(prev => [...prev, ...newTasks]);

    await dbService.saveDashboard(newDash);
    for (const t of newTasks) {
      await dbService.saveTask(t);
    }

    setActiveDashboardId(newDash.id);
    showToast(`Dashboard duplicated as "${newDash.name}"`);
  };

  const deleteDashboard = async (id: string, moveTasksToDashboardId?: string) => {
    if (dashboards.length <= 1) {
      showToast('Cannot delete the only remaining dashboard', 'warning');
      return;
    }

    const remaining = dashboards.filter(d => d.id !== id);
    setDashboards(remaining);

    if (moveTasksToDashboardId) {
      setTasks(prev =>
        prev.map(t => (t.dashboardId === id ? { ...t, dashboardId: moveTasksToDashboardId } : t))
      );
    } else {
      setTasks(prev => prev.filter(t => t.dashboardId !== id));
    }

    await dbService.deleteDashboard(id, moveTasksToDashboardId);

    if (activeDashboardId === id) {
      setActiveDashboardId(moveTasksToDashboardId || remaining[0].id);
    }
    showToast('Dashboard deleted', 'info');
  };

  const addTask = async (
    taskData: Omit<TaskItem, 'id' | 'order' | 'createdAt' | 'comments' | 'subtasks' | 'attachments'> & {
      subtasks?: string[];
      description?: string;
    }
  ) => {
    const existingInCol = tasks.filter(
      t => t.dashboardId === taskData.dashboardId && t.status === taskData.status
    );

    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      order: existingInCol.length + 1,
      createdAt: new Date().toISOString(),
      subtasks: (taskData.subtasks || []).map((title, i) => ({
        id: `st-${Date.now()}-${i}`,
        title,
        completed: false,
      })),
      comments: [],
      attachments: [],
      notes: '',
    };

    setTasks(prev => [...prev, newTask]);
    await dbService.saveTask(newTask);
    showToast(`Task "${newTask.title}" created`);
  };

  const updateTask = async (id: string, updates: Partial<TaskItem>) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...updates };
          dbService.saveTask(updated);
          return updated;
        }
        return task;
      })
    );
    showToast('Task updated');
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await dbService.deleteTask(id);
    showToast('Task deleted', 'info');
  };

  const moveTask = async (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      const isCompleted = targetStatus === 'done' && task.status !== 'done';
      if (isCompleted) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F5B942', '#D99A1C', '#FFFFFF'],
        });
      }

      const updatedTask = {
        ...task,
        status: targetStatus,
        progress: targetStatus === 'done' ? 100 : task.progress,
      };

      const remaining = prev.filter(t => t.id !== taskId);
      let newTasks: TaskItem[];

      if (targetIndex !== undefined) {
        const targetColTasks = remaining.filter(
          t => t.dashboardId === task.dashboardId && t.status === targetStatus
        );
        targetColTasks.splice(targetIndex, 0, updatedTask);
        const otherTasks = remaining.filter(
          t => !(t.dashboardId === task.dashboardId && t.status === targetStatus)
        );
        newTasks = [...otherTasks, ...targetColTasks];
      } else {
        newTasks = [...remaining, updatedTask];
      }

      dbService.saveTask(updatedTask);
      return newTasks;
    });
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          const completedCount = updatedSubtasks.filter(st => st.completed).length;
          const progress = updatedSubtasks.length > 0
            ? Math.round((completedCount / updatedSubtasks.length) * 100)
            : task.progress;

          const updated = {
            ...task,
            subtasks: updatedSubtasks,
            progress,
            status: progress === 100 ? ('done' as TaskStatus) : task.status,
          };
          dbService.saveTask(updated);
          return updated;
        }
        return task;
      })
    );
  };

  const addSubtask = async (taskId: string, title: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newSubtask = {
            id: `st-${Date.now()}`,
            title,
            completed: false,
          };
          const updatedSubtasks = [...task.subtasks, newSubtask];
          const updated = { ...task, subtasks: updatedSubtasks };
          dbService.saveTask(updated);
          return updated;
        }
        return task;
      })
    );
  };

  const addComment = async (taskId: string, text: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newComment = {
            id: `cmt-${Date.now()}`,
            userName: user.name,
            userInitials: user.initials,
            text,
            createdAt: new Date().toISOString(),
          };
          const updated = { ...task, comments: [...task.comments, newComment] };
          dbService.saveTask(updated);
          return updated;
        }
        return task;
      })
    );
  };

  // MyVault
  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    const visibleFiles = currentFolderId
      ? files.filter(f => f.folderId === currentFolderId)
      : files;
    setSelectedFileIds(visibleFiles.map(f => f.id));
  };

  const clearSelectedFiles = () => {
    setSelectedFileIds([]);
  };

  const addFolder = async (name: string, parentId: string | null = null, color: string = '#F5B942') => {
    const newFolder: VaultFolder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      color,
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
    await dbService.saveFolder(newFolder);
    showToast(`Folder "${name}" created`);
  };

  const renameFolder = async (id: string, newName: string) => {
    setFolders(prev =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, name: newName };
          dbService.saveFolder(updated);
          return updated;
        }
        return f;
      })
    );
    showToast(`Folder renamed to "${newName}"`);
  };

  const deleteFolder = async (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setFiles(prev => prev.filter(f => f.folderId !== id));
    await dbService.deleteFolder(id);
    if (currentFolderId === id) {
      setCurrentFolderId(null);
    }
    showToast('Folder and its files deleted', 'info');
  };

  const uploadFile = async (file: File, folderId: string | null = null) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType: VaultFile['fileType'] = 'other';

    if (['pdf'].includes(ext)) fileType = 'pdf';
    else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) fileType = 'doc';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'spreadsheet';
    else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) fileType = 'image';
    else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) fileType = 'archive';
    else if (['js', 'ts', 'py', 'html', 'css', 'json'].includes(ext)) fileType = 'code';

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    let dataUrl: string | undefined;
    if (fileType === 'image' && file.size < 5 * 1024 * 1024) {
      try {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } catch {
        // ignore
      }
    }

    const newVaultFile: VaultFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      folderId: folderId || currentFolderId || 'f-projects',
      sizeBytes: file.size,
      sizeFormatted: formatSize(file.size),
      fileType,
      extension: ext,
      contentDataUrl: dataUrl,
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
      mimeType: file.type,
    };

    cacheFile(newVaultFile.id, file);
    setFiles(prev => [newVaultFile, ...prev]);
    await dbService.saveFile(newVaultFile, file);
    showToast(`File "${file.name}" uploaded to private vault`);
  };

  const createNoteFile = async (name: string, content: string, folderId: string | null = null) => {
    const filename = name.endsWith('.txt') ? name : `${name}.txt`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    const newFile: VaultFile = {
      id: `file-note-${Date.now()}`,
      name: filename,
      folderId: folderId || currentFolderId || 'f-projects',
      sizeBytes: blob.size,
      sizeFormatted: `${blob.size} B`,
      fileType: 'doc',
      extension: 'txt',
      textContent: content,
      createdAt: new Date().toISOString(),
      updatedAt: 'Just now',
      mimeType: 'text/plain',
    };

    cacheFile(newFile.id, blob);
    setFiles(prev => [newFile, ...prev]);
    await dbService.saveFile(newFile, blob);
    showToast(`Note "${filename}" saved in vault`);
  };

  const addVaultFile = async (file: VaultFile) => {
    setFiles(prev => [file, ...prev]);
    await dbService.saveFile(file);
    showToast(`File "${file.name}" linked`);
  };

  const renameFile = async (id: string, newName: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, name: newName };
          dbService.saveFile(updated);
          return updated;
        }
        return f;
      })
    );
    showToast(`File renamed to "${newName}"`);
  };

  const deleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedFileIds(prev => prev.filter(fid => fid !== id));
    await dbService.deleteFile(id);
    showToast('File deleted', 'info');
  };

  const deleteSelectedFiles = async () => {
    if (selectedFileIds.length === 0) return;
    const count = selectedFileIds.length;
    setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
    for (const fid of selectedFileIds) {
      await dbService.deleteFile(fid);
    }
    setSelectedFileIds([]);
    showToast(`Deleted ${count} files`, 'info');
  };

  const moveFile = async (fileId: string, targetFolderId: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          const updated = { ...f, folderId: targetFolderId };
          dbService.saveFile(updated);
          return updated;
        }
        return f;
      })
    );
    showToast('File moved');
  };

  // Global actions
  const resetAllToDefault = () => {
    if (supabaseUser) {
      const def = getDefaultWorkspaceState(supabaseUser.email, supabaseUser.name);
      setCategories(def.categories);
      setLinks(def.links);
      setDashboards(def.dashboards);
      setTasks(def.tasks);
      setFolders(def.folders);
      setFiles(def.files);
      setNotifications(def.notifications);
      dbService.saveRawWorkspaceState(def);
      showToast('Workspace reset to defaults');
    }
  };

  const exportAllData = () => {
    const raw = dbService.getRawWorkspaceState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(raw, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `myspace-export-${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    showToast('Export downloaded');
  };

  const importAllData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.categories) setCategories(data.categories);
      if (data.links) setLinks(data.links);
      if (data.dashboards) setDashboards(data.dashboards);
      if (data.tasks) setTasks(data.tasks);
      if (data.folders) setFolders(data.folders);
      if (data.files) setFiles(data.files);
      if (data.user) setUser(data.user);
      dbService.saveRawWorkspaceState(data);
      showToast('Workspace data imported successfully');
      return true;
    } catch {
      showToast('Invalid JSON file', 'error');
      return false;
    }
  };

  return (
    <MySpaceContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        theme,
        toggleTheme,
        user,
        updateUser,
        isAuthLoading,
        isSupabaseConfigured,
        supabaseUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithSupabase,
        signUpWithSupabase,
        signInAsGuest,
        resetPasswordWithSupabase,
        signOutSupabase,
        updateSupabaseCredentials,
        deviceId,
        workspaceNamespace: activeNamespace,
        isWorkspaceLocked,
        isPinSetupNeeded,
        setupVaultPin,
        unlockWorkspaceWithPin,
        lockWorkspace,
        resetLocalWorkspace,
        isBackupModalOpen,
        setIsBackupModalOpen,
        exportEncryptedBackupFile,
        importEncryptedBackupFile,
        isSearchOpen,
        setIsSearchOpen,
        searchQuery,
        setSearchQuery,
        toasts,
        showToast,
        dismissToast,
        notifications,
        unreadNotifsCount,
        markNotifAsRead,
        markAllNotifsAsRead,
        clearAllNotifs,
        addNotification,
        categories,
        links,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        addCategory,
        updateCategory,
        deleteCategory,
        addLink,
        updateLink,
        deleteLink,
        togglePinLink,
        trackLinkClick,
        reorderLinks,
        reorderCategories,
        moveLink,
        dashboards,
        activeDashboardId,
        setActiveDashboardId,
        addDashboard,
        renameDashboard,
        updateDashboard,
        duplicateDashboard,
        deleteDashboard,
        workListViewMode,
        setWorkListViewMode,
        tasks,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        toggleSubtask,
        addSubtask,
        addComment,
        folders,
        files,
        currentFolderId,
        setCurrentFolderId,
        vaultViewMode,
        setVaultViewMode,
        vaultSortBy,
        setVaultSortBy,
        vaultSearchQuery,
        setVaultSearchQuery,
        selectedFileIds,
        setSelectedFileIds,
        toggleSelectFile,
        selectAllFiles,
        clearSelectedFiles,
        addFolder,
        renameFolder,
        deleteFolder,
        uploadFile,
        createNoteFile,
        addVaultFile,
        renameFile,
        deleteFile,
        deleteSelectedFiles,
        moveFile,
        resetAllToDefault,
        exportAllData,
        importAllData,
      }}
    >
      {children}
    </MySpaceContext.Provider>
  );
};

export const useMySpace = () => {
  const context = useContext(MySpaceContext);
  if (!context) {
    throw new Error('useMySpace must be used within a MySpaceProvider');
  }
  return context;
};
