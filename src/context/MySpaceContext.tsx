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
  provider?: 'email' | 'google' | 'github' | 'guest';
  isGuest?: boolean;
  createdAt?: string;
  lastSignInAt?: string;
}

export interface LegacyLocalAccount {
  id: string;
  email: string;
  name: string;
  namespace: string;
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
  isPasswordRecoveryMode: boolean;
  completePasswordRecovery: (newPassword: string) => Promise<{ error?: string }>;
  cancelPasswordRecovery: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithSupabase: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  oauthError: string | null;
  clearOauthError: () => void;
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

  // Backup, Portability & Legacy Local Migration
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  exportEncryptedBackupFile: (pin: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  importEncryptedBackupFile: (file: File, pin: string) => Promise<{ success: boolean; error?: string; restored?: any }>;
  hasExistingWorkspaceData: boolean;
  legacyLocalAccounts: LegacyLocalAccount[];
  exportLegacyWorkspaceBackup: (namespace: string, email: string, pin: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  clearObsoleteLegacyRecords: () => void;

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

const LEGACY_SESSION_KEY = 'myspace_auth_user_session';
const LEGACY_USERS_KEY = 'myspace_registered_users';
const GUEST_SESSION_KEY = 'myspace_guest_session_active';

const GUEST_USER: MySpaceUser = {
  id: 'user-demo-01',
  email: 'demo@myspace.local',
  name: 'Guest User',
  provider: 'guest',
  isGuest: true,
};

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
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState<boolean>(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const clearOauthError = useCallback(() => setOauthError(null), []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [legacyLocalAccounts, setLegacyLocalAccounts] = useState<LegacyLocalAccount[]>([]);

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

  // Detect legacy local registered-user accounts/workspaces (read-only, never used for auth, never deletes IndexedDB)
  const refreshLegacyLocalAccounts = useCallback(async () => {
    try {
      const detected: LegacyLocalAccount[] = [];
      const seenNamespaces = new Set<string>();

      const rawUsers = safeStorage.getItem(LEGACY_USERS_KEY);
      if (rawUsers) {
        try {
          const parsed = JSON.parse(rawUsers);
          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (!entry || !entry.id || !entry.email) continue;
              if (entry.email.toLowerCase() === 'demo@myspace.local' || entry.id === 'user-demo-01') continue;
              const ns = getWorkspaceNamespace(entry.id);
              const meta = await workspaceDb.loadAuthMetadata(ns);
              if (meta) {
                seenNamespaces.add(ns);
                detected.push({
                  id: entry.id,
                  email: entry.email,
                  name: entry.name || entry.email.split('@')[0],
                  namespace: ns,
                });
              }
            }
          }
        } catch {
          // ignore malformed legacy json
        }
      }

      // Also check IndexedDB auth_metadata for any legacy local `usr-*` namespaces
      const allNamespaces = await workspaceDb.listAuthNamespaces();
      for (const ns of allNamespaces) {
        if (seenNamespaces.has(ns)) continue;
        // Legacy local ids generated prior to Supabase Auth started with `usr_` or `usr-`
        if (ns.startsWith('myspace:usr_')) {
          detected.push({
            id: ns.split(':')[1] || ns,
            email: 'Legacy Local Workspace',
            name: 'Local Account',
            namespace: ns,
          });
        }
      }

      setLegacyLocalAccounts(detected);
    } catch {
      // non-blocking
    }
  }, []);

  // Helper: Normalize Supabase user metadata across Email, Google & GitHub providers
  const extractSupabaseUser = (supaUser: any): MySpaceUser => {
    const meta = supaUser?.user_metadata || {};
    const appMeta = supaUser?.app_metadata || {};
    const email = supaUser?.email || meta.email || '';
    const name =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      (email ? email.split('@')[0] : 'User');
    const avatarUrl = meta.avatar_url || meta.picture || undefined;
    const rawProvider = (appMeta.provider || 'email').toLowerCase();
    const provider: MySpaceUser['provider'] =
      rawProvider === 'google' || rawProvider === 'github' ? rawProvider : 'email';

    return {
      id: supaUser.id,
      email,
      name,
      avatarUrl,
      provider,
      isGuest: false,
      createdAt: supaUser.created_at,
      lastSignInAt: supaUser.last_sign_in_at,
    };
  };

  useEffect(() => {
    refreshLegacyLocalAccounts();
  }, [refreshLegacyLocalAccounts]);

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    let activeUserIdRef: string | null = null;

    const initAuth = async () => {
      setIsAuthLoading(true);

      try {
        // Never trust legacy localStorage registered-user objects as authentication proof
        safeStorage.removeItem(LEGACY_SESSION_KEY);

        // Parse any OAuth cancellation or error params returned from redirect
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hasOAuthCallbackParams =
          searchParams.has('code') ||
          hashParams.has('access_token') ||
          searchParams.has('error') ||
          hashParams.has('error');
        const returnedError =
          searchParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        let friendlyOAuthError: string | null = null;
        if (returnedError) {
          const decoded = decodeURIComponent(returnedError).replace(/\+/g, ' ');
          friendlyOAuthError = decoded.toLowerCase().includes('access_denied')
            ? 'Sign-in was cancelled. Please try again.'
            : decoded;
          setOauthError(friendlyOAuthError);
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery') {
          setIsPasswordRecoveryMode(true);
        }

        const client = getSupabase();
        setIsSupabaseConfigured(Boolean(client));
        let userFound: MySpaceUser | null = null;

        if (client) {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            userFound = extractSupabaseUser(session.user);
            activeUserIdRef = userFound.id;
            // Clear any prior guest session marker when authoritative Supabase user is active
            safeStorage.removeItem(GUEST_SESSION_KEY);
            // Clean up OAuth code/hash params after session exchange
            if (
              window.location.search.includes('code=') ||
              window.location.hash.includes('access_token=')
            ) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }

          // If running inside an OAuth popup opened from iframe preview, notify parent & close
          if (hasOAuthCallbackParams && window.opener && window.opener !== window) {
            try {
              window.opener.postMessage(
                { type: 'MYSPACE_OAUTH_COMPLETE', error: friendlyOAuthError },
                '*'
              );
              window.close();
            } catch {
              // ignore cross-window restriction
            }
          }

          const { data } = client.auth.onAuthStateChange(async (event, nextSession) => {
            if (event === 'PASSWORD_RECOVERY') {
              setIsPasswordRecoveryMode(true);
            }

            if (nextSession?.user) {
              const u = extractSupabaseUser(nextSession.user);
              const isNewUser = activeUserIdRef !== u.id;
              activeUserIdRef = u.id;
              safeStorage.removeItem(GUEST_SESSION_KEY);
              setSupabaseUser(u);

              if (isNewUser) {
                dbService.clearActiveWorkspace();
                await checkWorkspaceSecurity(u);
              }
              if (
                window.location.search.includes('code=') ||
                window.location.hash.includes('access_token=')
              ) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } else if (event === 'SIGNED_OUT') {
              activeUserIdRef = null;
              safeStorage.removeItem(LEGACY_SESSION_KEY);
              safeStorage.removeItem(GUEST_SESSION_KEY);
              setSupabaseUser(null);
              setIsPasswordRecoveryMode(false);
              setIsWorkspaceLocked(true);
              setIsPinSetupNeeded(false);
              setActiveNamespace('');
              dbService.clearActiveWorkspace();
            }
          });
          authSubscription = data.subscription;
        }

        // Guest session is strictly isolated and only restored if no registered Supabase session exists
        if (!userFound && safeStorage.getItem(GUEST_SESSION_KEY) === 'true') {
          userFound = { ...GUEST_USER };
          activeUserIdRef = userFound.id;
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

    return () => {
      authSubscription?.unsubscribe();
    };
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
      } else {
        // Always anchor workspace account email to authoritative Supabase Auth / Guest identity
        state = {
          ...state,
          user: {
            ...state.user,
            email: supabaseUser.email,
            name: state.user?.name || supabaseUser.name || supabaseUser.email.split('@')[0],
          },
        };
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

  // Supabase Auth Methods (No local registered-user fallback)
  const formatSupabaseAuthError = (rawMessage: string, fallback: string): string => {
    const msg = (rawMessage || '').trim();
    const lower = msg.toLowerCase();
    if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed')) {
      return 'Unable to reach the authentication service. Please check your internet connection and try again.';
    }
    if (lower.includes('invalid login credentials')) {
      return 'Invalid email address or password. Please verify your credentials and try again.';
    }
    if (lower.includes('user already registered') || lower.includes('already been registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Email confirmation is enabled on this Supabase project. Please confirm your email or disable "Confirm email" in Supabase Auth settings.';
    }
    return msg || fallback;
  };

  const signInWithSupabase = async (email: string, pass: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabase();

    if (!client) {
      return {
        error:
          'Authentication service is unavailable. Registered accounts require a configured Supabase Auth connection (or choose Use Guest Account for local preview).',
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });
      if (error) {
        return { error: formatSupabaseAuthError(error.message, 'Unable to sign in.') };
      }
      if (!data.user || !data.session) {
        return { error: 'Authentication did not return an active session. Please try again.' };
      }

      const u = extractSupabaseUser(data.user);
      safeStorage.removeItem(GUEST_SESSION_KEY);
      safeStorage.removeItem(LEGACY_SESSION_KEY);
      setSupabaseUser(u);
      await checkWorkspaceSecurity(u);
      setIsAuthModalOpen(false);
      showToast(`Welcome back, ${u.name}!`);
      return {};
    } catch (err: any) {
      return { error: formatSupabaseAuthError(err?.message, 'Authentication service request failed.') };
    }
  };

  const signUpWithSupabase = async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const client = getSupabase();

    if (!client) {
      return {
        error:
          'Authentication service is unavailable. Account registration requires a configured Supabase Auth connection.',
      };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            name: cleanName,
            full_name: cleanName,
          },
        },
      });

      if (error) {
        return { error: formatSupabaseAuthError(error.message, 'Unable to create account.') };
      }

      // Supabase obfuscates existing emails when confirmation is enabled by returning empty identities
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { error: 'An account with this email already exists. Please sign in instead.' };
      }

      if (!data.session || !data.user) {
        return {
          error:
            'Account created, but email confirmation is still enabled in Supabase Auth. Please disable "Confirm email" in Supabase Auth → Providers → Email for immediate workspace access.',
        };
      }

      const u = extractSupabaseUser(data.user);
      safeStorage.removeItem(GUEST_SESSION_KEY);
      safeStorage.removeItem(LEGACY_SESSION_KEY);
      setSupabaseUser(u);
      await checkWorkspaceSecurity(u);
      setIsAuthModalOpen(false);
      showToast('Account registered successfully!');
      return {};
    } catch (err: any) {
      return { error: formatSupabaseAuthError(err?.message, 'Account registration failed.') };
    }
  };

  const signInWithOAuth = async (
    provider: 'google' | 'github'
  ): Promise<{ error?: string }> => {
    setOauthError(null);
    const client = getSupabase();
    if (!client) {
      return {
        error: `Authentication service is unavailable. Connect Supabase Auth to enable ${
          provider === 'google' ? 'Google' : 'GitHub'
        } sign-in.`,
      };
    }

    try {
      const redirectTo = window.location.origin;
      const isInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (!isInIframe) {
        const { error } = await client.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
          },
        });
        if (error) {
          return { error: formatSupabaseAuthError(error.message, 'OAuth login failed.') };
        }
        return {};
      }

      // Inside iframe preview: open provider URL in popup so X-Frame-Options doesn't block Google/GitHub
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
        },
      });

      if (error) {
        return { error: formatSupabaseAuthError(error.message, 'OAuth login failed.') };
      }

      if (!data?.url) {
        return { error: 'Could not initialize OAuth redirect URL.' };
      }

      const popup = window.open(
        data.url,
        `myspace_${provider}_oauth`,
        'width=540,height=680,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        return {
          error:
            'Popup was blocked by your browser. Please allow popups for this site and try again.',
        };
      }

      // Listen for completion message from OAuth popup and also poll session as fallback
      const handlePopupMessage = async (event: MessageEvent) => {
        if (event.data?.type !== 'MYSPACE_OAUTH_COMPLETE') return;
        window.removeEventListener('message', handlePopupMessage);
        window.clearInterval(pollInterval);
        if (event.data.error) {
          setOauthError(event.data.error);
          return;
        }
        try {
          const { data: sessionData } = await client.auth.getSession();
          if (sessionData?.session?.user) {
            const u = extractSupabaseUser(sessionData.session.user);
            safeStorage.removeItem(GUEST_SESSION_KEY);
            safeStorage.removeItem(LEGACY_SESSION_KEY);
            setSupabaseUser(u);
            await checkWorkspaceSecurity(u);
          }
        } catch {
          // ignore
        }
      };
      window.addEventListener('message', handlePopupMessage);

      const pollInterval = window.setInterval(async () => {
        try {
          const { data: sessionData } = await client.auth.getSession();
          if (sessionData?.session?.user) {
            window.clearInterval(pollInterval);
            window.removeEventListener('message', handlePopupMessage);
            if (!popup.closed) popup.close();
            const u = extractSupabaseUser(sessionData.session.user);
            safeStorage.removeItem(GUEST_SESSION_KEY);
            safeStorage.removeItem(LEGACY_SESSION_KEY);
            setSupabaseUser(u);
            await checkWorkspaceSecurity(u);
            return;
          }
          if (popup.closed) {
            window.clearInterval(pollInterval);
            window.removeEventListener('message', handlePopupMessage);
          }
        } catch {
          if (popup.closed) {
            window.clearInterval(pollInterval);
            window.removeEventListener('message', handlePopupMessage);
          }
        }
      }, 800);

      return {};
    } catch (err: any) {
      return {
        error: formatSupabaseAuthError(err?.message, `Failed to start ${provider} authentication.`),
      };
    }
  };

  // Strictly isolated local-only Guest Account (never registered in Supabase Auth)
  const signInAsGuest = async (): Promise<{ error?: string }> => {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          await client.auth.signOut();
        }
      } catch {
        // ignore
      }
    }

    dbService.clearActiveWorkspace();
    const guestUser: MySpaceUser = { ...GUEST_USER };
    safeStorage.setItem(GUEST_SESSION_KEY, 'true');
    setSupabaseUser(guestUser);
    await checkWorkspaceSecurity(guestUser);
    setIsAuthModalOpen(false);
    showToast('Signed in with Guest Account', 'info');
    return {};
  };

  const resetPasswordWithSupabase = async (email: string): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const client = getSupabase();
    if (!client) {
      return {
        error: 'Authentication service is unavailable. Password reset requires a configured Supabase Auth connection.',
      };
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: formatSupabaseAuthError(error.message, 'Unable to send password reset email.') };
      }
      showToast(`Password reset link sent to ${cleanEmail}`, 'info');
      return {};
    } catch (err: any) {
      return {
        error: formatSupabaseAuthError(err?.message, 'Unable to send password reset email.'),
      };
    }
  };

  const completePasswordRecovery = async (newPassword: string): Promise<{ error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Authentication service is unavailable.' };
    }
    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        return { error: formatSupabaseAuthError(error.message, 'Failed to update password.') };
      }
      setIsPasswordRecoveryMode(false);
      showToast('Password updated successfully!', 'success');
      return {};
    } catch (err: any) {
      return { error: formatSupabaseAuthError(err?.message, 'Failed to update password.') };
    }
  };

  const cancelPasswordRecovery = () => {
    setIsPasswordRecoveryMode(false);
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
    safeStorage.removeItem(LEGACY_SESSION_KEY);
    safeStorage.removeItem(GUEST_SESSION_KEY);
    dbService.clearActiveWorkspace();
    setSupabaseUser(null);
    setIsPasswordRecoveryMode(false);
    setIsWorkspaceLocked(true);
    setIsPinSetupNeeded(false);
    setActiveNamespace('');
    showToast('Signed out of MySpace', 'info');
  };

  const updateSupabaseCredentials = (url: string, key: string) => {
    try {
      saveStoredSupabaseConfig({ url: url.trim(), anonKey: key.trim() });
      setIsSupabaseConfigured(isSupabaseConnected());
      showToast('Supabase configuration updated');
    } catch (err: any) {
      showToast(err?.message || 'Invalid Supabase credentials', 'error');
    }
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
        // Reload workspace from dbService while preserving authoritative account email
        const rawRestored = dbService.getRawWorkspaceState();
        const anchoredState: WorkspaceState = {
          ...rawRestored,
          user: {
            ...rawRestored.user,
            email: supabaseUser.email,
            name: rawRestored.user?.name || supabaseUser.name || supabaseUser.email.split('@')[0],
          },
        };
        await dbService.saveRawWorkspaceState(anchoredState);
        setUser(anchoredState.user);
        setCategories(anchoredState.categories);
        setLinks(anchoredState.links);
        setDashboards(anchoredState.dashboards);
        setTasks(anchoredState.tasks);
        setFolders(anchoredState.folders);
        setFiles(anchoredState.files);
        setNotifications(anchoredState.notifications);

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

  // Safe migration export for pre-Supabase local accounts (verifies Vault PIN without deleting IndexedDB)
  const exportLegacyWorkspaceBackup = async (
    namespace: string,
    email: string,
    pin: string
  ): Promise<{ success: boolean; filename?: string; error?: string }> => {
    try {
      const meta = await workspaceDb.loadAuthMetadata(namespace);
      if (!meta) {
        return { success: false, error: 'Legacy workspace security metadata not found.' };
      }
      const isMatch = await verifyPin(pin, meta.verifierSalt, meta.verifierHash);
      if (!isMatch) {
        return { success: false, error: 'Incorrect Vault PIN for this legacy workspace.' };
      }
      const salt = base64ToUint8Array(meta.verifierSalt);
      const cryptoKey = await deriveKeyFromPin(pin, salt);
      const legacyState = await dbService.loadEncryptedWorkspaceFromDB(namespace, cryptoKey);
      if (!legacyState) {
        return { success: false, error: 'No encrypted workspace data found for this legacy account.' };
      }
      const res = await exportEncryptedBackup(pin, email, namespace, legacyState);
      showToast(`Exported legacy encrypted backup: ${res.filename}`, 'success');
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to export legacy backup.' };
    }
  };

  const clearObsoleteLegacyRecords = () => {
    safeStorage.removeItem(LEGACY_USERS_KEY);
    safeStorage.removeItem(LEGACY_SESSION_KEY);
    setLegacyLocalAccounts([]);
    showToast('Obsolete local password records removed. IndexedDB backups remain untouched.', 'info');
  };

  const hasExistingWorkspaceData =
    links.length > INITIAL_LINKS.length ||
    tasks.length > INITIAL_TASKS.length ||
    files.length > INITIAL_FILES.length;

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateUser = async (profile: Partial<UserProfile>) => {
    // Do not allow modifying authentication identity (email) locally
    const { email: _ignoredEmail, ...safeUpdates } = profile;
    const nextUser: UserProfile = {
      ...user,
      ...safeUpdates,
      email: supabaseUser?.email || user.email,
    };

    if (supabaseUser && !supabaseUser.isGuest && safeUpdates.name) {
      const client = getSupabase();
      if (client) {
        const { error } = await client.auth.updateUser({
          data: {
            name: safeUpdates.name,
            full_name: safeUpdates.name,
          },
        });
        if (error) {
          showToast(error.message || 'Could not update Supabase account metadata', 'error');
          return;
        }
      }
      setSupabaseUser(prev => (prev ? { ...prev, name: safeUpdates.name } : prev));
    }

    setUser(nextUser);
    await dbService.saveUserProfile({
      name: nextUser.name,
      initials: nextUser.initials,
      role: nextUser.role,
    });
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
      if (data.user) {
        setUser({
          ...data.user,
          email: supabaseUser?.email || data.user.email,
        });
      }
      dbService.saveRawWorkspaceState({
        ...data,
        user: {
          ...(data.user || user),
          email: supabaseUser?.email || data.user?.email || user.email,
        },
      });
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
        isPasswordRecoveryMode,
        completePasswordRecovery,
        cancelPasswordRecovery,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithSupabase,
        signUpWithSupabase,
        signInWithOAuth,
        oauthError,
        clearOauthError,
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
        hasExistingWorkspaceData,
        legacyLocalAccounts,
        exportLegacyWorkspaceBackup,
        clearObsoleteLegacyRecords,
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
