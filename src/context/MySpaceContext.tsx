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
import { dbService } from '../services/dbService';
import { getSupabase, isSupabaseConnected, saveStoredSupabaseConfig, getStoredSupabaseConfig } from '../lib/supabase';

interface MySpaceContextType {
  // Navigation & Page
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;

  // User
  user: UserProfile;
  updateUser: (profile: Partial<UserProfile>) => Promise<void>;

  // Supabase Auth & State
  isSupabaseConfigured: boolean;
  supabaseUser: any | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  signUpWithSupabase: (email: string, pass: string, name: string) => Promise<{ error?: string }>;
  signOutSupabase: () => Promise<void>;
  updateSupabaseCredentials: (url: string, key: string) => void;

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
  deleteCategory: (id: string) => Promise<void>;
  addLink: (link: Omit<BookmarkLink, 'id' | 'clickCount' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateLink: (id: string, updates: Partial<BookmarkLink>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  togglePinLink: (id: string) => Promise<void>;
  trackLinkClick: (id: string) => Promise<void>;
  reorderLinks: (categoryId: string, reorderedLinks: BookmarkLink[]) => Promise<void>;

  // Work List & Tasks
  dashboards: WorkDashboard[];
  activeDashboardId: string;
  setActiveDashboardId: (id: string) => void;
  addDashboard: (name: string, icon?: string) => Promise<void>;
  renameDashboard: (id: string, name: string) => Promise<void>;
  duplicateDashboard: (id: string) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
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

export const MySpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Page
  const [currentPage, setCurrentPage] = useState<NavPage>(() => {
    try {
      return (localStorage.getItem('myspace_current_page') as NavPage) || 'links';
    } catch {
      return 'links';
    }
  });

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('myspace_theme') as ThemeMode) || 'dark';
    } catch {
      return 'dark';
    }
  });

  // User Profile
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Supabase Auth & State
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(isSupabaseConnected());
  const [supabaseUser, setSupabaseUser] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global Search Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Links
  const [categories, setCategories] = useState<LinkCategory[]>(INITIAL_CATEGORIES);
  const [links, setLinks] = useState<BookmarkLink[]>(INITIAL_LINKS);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Work List
  const [dashboards, setDashboards] = useState<WorkDashboard[]>(INITIAL_DASHBOARDS);
  const [activeDashboardId, setActiveDashboardId] = useState<string>('dash-working');
  const [workListViewMode, setWorkListViewMode] = useState<WorkListViewMode>('board');
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  // Vault
  const [folders, setFolders] = useState<VaultFolder[]>(INITIAL_FOLDERS);
  const [files, setFiles] = useState<VaultFile[]>(INITIAL_FILES);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>('f-projects');
  const [vaultViewMode, setVaultViewMode] = useState<'grid' | 'list'>('grid');
  const [vaultSortBy, setVaultSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Toast Helper
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

  // Sync Theme to HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('myspace_theme', theme);
  }, [theme]);

  // Persist Page
  useEffect(() => {
    localStorage.setItem('myspace_current_page', currentPage);
  }, [currentPage]);

  // Global Keyboard Shortcut (Ctrl+K or Cmd+K)
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

  // Initial Asynchronous Load from Database (Supabase / local store)
  useEffect(() => {
    const initData = async () => {
      try {
        const client = getSupabase();
        if (client) {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            setSupabaseUser(session.user);
          }

          client.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null);
          });
        }

        const [loadedUser, loadedCats, loadedLinks, loadedDashboards, loadedTasks, loadedFolders, loadedFiles, loadedNotifs] =
          await Promise.all([
            dbService.loadUserProfile(),
            dbService.loadCategories(),
            dbService.loadLinks(),
            dbService.loadDashboards(),
            dbService.loadTasks(),
            dbService.loadFolders(),
            dbService.loadFiles(),
            dbService.loadNotifications(),
          ]);

        setUser(loadedUser);
        setCategories(loadedCats);
        setLinks(loadedLinks);
        setDashboards(loadedDashboards);
        if (loadedDashboards.length > 0 && !loadedDashboards.find(d => d.id === activeDashboardId)) {
          setActiveDashboardId(loadedDashboards[0].id);
        }
        setTasks(loadedTasks);
        setFolders(loadedFolders);
        setFiles(loadedFiles);
        setNotifications(loadedNotifs);
      } catch (err) {
        console.error('Initial database load error:', err);
      }
    };

    initData();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateUser = async (profile: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...profile }));
    await dbService.saveUserProfile(profile);
    showToast('Profile updated successfully');
  };

  // Supabase Auth Methods
  const signInWithSupabase = async (email: string, pass: string): Promise<{ error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Supabase client not configured. Please add URL & Anon Key.' };
    }
    const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
    if (error) {
      return { error: error.message };
    }
    setSupabaseUser(data.user);
    showToast('Signed in successfully with Supabase');
    setIsAuthModalOpen(false);
    return {};
  };

  const signUpWithSupabase = async (email: string, pass: string, name: string): Promise<{ error?: string }> => {
    const client = getSupabase();
    if (!client) {
      return { error: 'Supabase client not configured. Please add URL & Anon Key.' };
    }
    const { data, error } = await client.auth.signUp({
      email,
      password: pass,
      options: { data: { name } },
    });
    if (error) {
      return { error: error.message };
    }
    setSupabaseUser(data.user);
    showToast('Account created successfully');
    setIsAuthModalOpen(false);
    return {};
  };

  const signOutSupabase = async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
    }
    setSupabaseUser(null);
    showToast('Signed out', 'info');
  };

  const updateSupabaseCredentials = (url: string, key: string) => {
    saveStoredSupabaseConfig({ url: url.trim(), anonKey: key.trim() });
    setIsSupabaseConfigured(isSupabaseConnected());
    showToast('Supabase credentials saved');
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
    addNotification('Category Created', `Category "${name}" was created successfully.`, 'success');
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

  const deleteCategory = async (id: string) => {
    const targetCat = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setLinks(prev => prev.filter(l => l.categoryId !== id));
    await dbService.deleteCategory(id);
    if (selectedCategoryFilter === id) {
      setSelectedCategoryFilter('all');
    }
    showToast(`Category "${targetCat?.name || ''}" deleted`, 'info');
  };

  const addLink = async (
    linkData: Omit<BookmarkLink, 'id' | 'clickCount' | 'createdAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    const title = linkData.title.trim();
    let formattedUrl = linkData.url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Check for duplicate URLs
    const isDuplicate = links.some(
      l => l.url.toLowerCase() === formattedUrl.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Link "${formattedUrl}" already exists in your bookmarks!`, 'warning');
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
        // fallback
      }
    }

    const newLink: BookmarkLink = {
      ...linkData,
      url: formattedUrl,
      id: `link-${Date.now()}`,
      iconLetter,
      iconBg: linkData.iconBg || '#1e293b',
      favicon,
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };

    setLinks(prev => [newLink, ...prev]);
    await dbService.saveLink(newLink);
    showToast(`Saved bookmark "${newLink.title}"`);
    addNotification('Link Added', `"${newLink.title}" was saved to bookmarks.`, 'success');
    return { success: true };
  };

  const updateLink = async (id: string, updates: Partial<BookmarkLink>) => {
    setLinks(prev =>
      prev.map(l => {
        if (l.id === id) {
          const updated = { ...l, ...updates };
          dbService.saveLink(updated);
          return updated;
        }
        return l;
      })
    );
    showToast('Bookmark updated');
  };

  const deleteLink = async (id: string) => {
    const target = links.find(l => l.id === id);
    setLinks(prev => prev.filter(l => l.id !== id));
    await dbService.deleteLink(id);
    showToast(`Bookmark "${target?.title || ''}" removed`, 'info');
  };

  const togglePinLink = async (id: string) => {
    setLinks(prev =>
      prev.map(l => {
        if (l.id === id) {
          const updated = { ...l, pinned: !l.pinned };
          dbService.saveLink(updated);
          return updated;
        }
        return l;
      })
    );
  };

  const trackLinkClick = async (id: string) => {
    setLinks(prev =>
      prev.map(l => {
        if (l.id === id) {
          const updated = { ...l, clickCount: l.clickCount + 1 };
          dbService.saveLink(updated);
          return updated;
        }
        return l;
      })
    );
  };

  const reorderLinks = async (categoryId: string, reordered: BookmarkLink[]) => {
    setLinks(prev => {
      const otherLinks = prev.filter(l => l.categoryId !== categoryId);
      return [...otherLinks, ...reordered];
    });
    for (const link of reordered) {
      await dbService.saveLink(link);
    }
  };

  // Work List & Tasks Handlers
  const addDashboard = async (name: string, icon = 'FolderGit2') => {
    const newDash: WorkDashboard = {
      id: `dash-${Date.now()}`,
      name,
      icon,
    };
    setDashboards(prev => [...prev, newDash]);
    setActiveDashboardId(newDash.id);
    await dbService.saveDashboard(newDash);
    showToast(`Dashboard "${name}" created`);
    addNotification('Dashboard Created', `Dashboard "${name}" is now active.`, 'success');
  };

  const renameDashboard = async (id: string, name: string) => {
    setDashboards(prev =>
      prev.map(d => {
        if (d.id === id) {
          const updated = { ...d, name };
          dbService.saveDashboard(updated);
          return updated;
        }
        return d;
      })
    );
    showToast(`Dashboard renamed to "${name}"`);
  };

  const duplicateDashboard = async (id: string) => {
    const targetDash = dashboards.find(d => d.id === id);
    if (!targetDash) return;

    const newDashId = `dash-${Date.now()}`;
    const duplicatedDash: WorkDashboard = {
      id: newDashId,
      name: `${targetDash.name} (Copy)`,
      icon: targetDash.icon,
    };

    // Duplicate all tasks from target dashboard
    const sourceTasks = tasks.filter(t => t.dashboardId === id);
    const duplicatedTasks: TaskItem[] = sourceTasks.map(t => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dashboardId: newDashId,
      subtasks: t.subtasks.map(st => ({ ...st, id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })),
      comments: [...t.comments],
      attachments: [...t.attachments],
    }));

    setDashboards(prev => [...prev, duplicatedDash]);
    setTasks(prev => [...prev, ...duplicatedTasks]);
    setActiveDashboardId(newDashId);

    await dbService.saveDashboard(duplicatedDash);
    for (const t of duplicatedTasks) {
      await dbService.saveTask(t);
    }
    showToast(`Duplicated "${targetDash.name}" with ${duplicatedTasks.length} tasks`);
  };

  const deleteDashboard = async (id: string) => {
    if (dashboards.length <= 1) {
      showToast('Cannot delete the last remaining dashboard', 'warning');
      return;
    }
    const remaining = dashboards.filter(d => d.id !== id);
    setDashboards(remaining);
    setTasks(prev => prev.filter(t => t.dashboardId !== id));
    await dbService.deleteDashboard(id);

    if (activeDashboardId === id) {
      setActiveDashboardId(remaining[0].id);
    }
    showToast('Dashboard deleted', 'info');
  };

  const addTask = async (taskData: Omit<TaskItem, 'id' | 'order' | 'createdAt' | 'comments' | 'subtasks' | 'attachments'> & {
    subtasks?: string[];
    description?: string;
  }) => {
    const newSubtasks = (taskData.subtasks || []).map((st, i) => ({
      id: `st-${Date.now()}-${i}`,
      title: st,
      completed: false,
    }));

    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
      order: tasks.filter(t => t.status === taskData.status && t.dashboardId === taskData.dashboardId).length + 1,
      subtasks: newSubtasks,
      attachments: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);
    await dbService.saveTask(newTask);
    showToast(`Task "${newTask.title}" created`);
    addNotification('Task Created', `"${newTask.title}" added to ${taskData.status.replace('_', ' ')}.`, 'info');
  };

  const updateTask = async (id: string, updates: Partial<TaskItem>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };

        if (updates.status === 'done' && t.status !== 'done') {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#a855f7', '#6366f1', '#10b981', '#38bdf8']
            });
          } catch {
            // safely handle
          }
          updated.progress = 100;
        }

        dbService.saveTask(updated);
        return updated;
      })
    );
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await dbService.deleteTask(id);
    showToast('Task deleted', 'info');
  };

  const moveTask = async (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    const isFinishing = targetStatus === 'done' && oldStatus !== 'done';

    if (isFinishing) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b']
        });
      } catch {
        // ignore
      }
    }

    const updatedTask: TaskItem = {
      ...task,
      status: targetStatus,
      progress: isFinishing ? 100 : task.progress,
    };

    setTasks(prev => {
      const otherStatusTasks = prev.filter(t => t.id !== taskId && t.status !== targetStatus);
      const targetStatusTasks = prev.filter(t => t.id !== taskId && t.status === targetStatus);

      if (targetIndex !== undefined && targetIndex >= 0) {
        targetStatusTasks.splice(targetIndex, 0, updatedTask);
      } else {
        targetStatusTasks.push(updatedTask);
      }

      const reorderedTarget = targetStatusTasks.map((t, idx) => ({ ...t, order: idx + 1 }));
      return [...otherStatusTasks, ...reorderedTarget];
    });

    await dbService.saveTask(updatedTask);
    showToast(`Task moved to ${targetStatus.replace('_', ' ')}`);
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const completedCount = subtasks.filter(st => st.completed).length;
        const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : t.progress;
        const updated = { ...t, subtasks, progress };
        dbService.saveTask(updated);
        return updated;
      })
    );
  };

  const addSubtask = async (taskId: string, title: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const newSt = { id: `st-${Date.now()}`, title, completed: false };
        const subtasks = [...t.subtasks, newSt];
        const updated = { ...t, subtasks };
        dbService.saveTask(updated);
        return updated;
      })
    );
    showToast('Subtask checklist item added');
  };

  const addComment = async (taskId: string, text: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const comment = {
          id: `c-${Date.now()}`,
          userName: user.name,
          userInitials: user.initials,
          text,
          createdAt: 'Just now',
        };
        const updated = { ...t, comments: [...t.comments, comment] };
        dbService.saveTask(updated);
        return updated;
      })
    );
    showToast('Comment posted');
  };

  // MyVault Handlers
  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    const visibleFiles = files.filter(f => currentFolderId === null || f.folderId === currentFolderId);
    setSelectedFileIds(visibleFiles.map(f => f.id));
  };

  const clearSelectedFiles = () => {
    setSelectedFileIds([]);
  };

  const addFolder = async (name: string, parentId: string | null = currentFolderId, color = '#8b5cf6') => {
    const newFolder: VaultFolder = {
      id: `f-${Date.now()}`,
      name: name.trim(),
      parentId,
      color,
      createdAt: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
    await dbService.saveFolder(newFolder);
    showToast(`Folder "${name}" created`);
    addNotification('Folder Created', `Folder "${name}" was created in MyVault.`, 'success');
  };

  const renameFolder = async (id: string, newName: string) => {
    setFolders(prev =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, name: newName.trim() };
          dbService.saveFolder(updated);
          return updated;
        }
        return f;
      })
    );
    showToast('Folder renamed');
  };

  const deleteFolder = async (id: string) => {
    const findDescendants = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId).map(f => f.id);
      return [parentId, ...children.flatMap(findDescendants)];
    };
    const folderIdsToDelete = findDescendants(id);

    setFolders(prev => prev.filter(f => !folderIdsToDelete.includes(f.id)));
    setFiles(prev => prev.filter(f => !folderIdsToDelete.includes(f.folderId)));

    for (const fId of folderIdsToDelete) {
      await dbService.deleteFolder(fId);
    }

    if (currentFolderId && folderIdsToDelete.includes(currentFolderId)) {
      setCurrentFolderId(null);
    }
    showToast('Folder and contents removed', 'info');
  };

  const uploadFile = async (file: File, targetFolderId: string | null = currentFolderId): Promise<void> => {
    const effectiveFolderId = targetFolderId || 'f-projects';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    let fileType: VaultFile['fileType'] = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (['xlsx', 'xls', 'csv'].includes(ext)) fileType = 'spreadsheet';
    else if (['docx', 'doc', 'txt', 'md', 'rtf'].includes(ext)) fileType = 'doc';
    else if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) fileType = 'image';
    else if (['zip', 'tar', 'gz', 'rar'].includes(ext)) fileType = 'archive';
    else if (['js', 'ts', 'tsx', 'py', 'json', 'html', 'css'].includes(ext)) fileType = 'code';

    const bytes = file.size;
    let sizeFormatted = `${bytes} B`;
    if (bytes >= 1024 * 1024) {
      sizeFormatted = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      sizeFormatted = `${Math.round(bytes / 1024)} KB`;
    }

    let contentDataUrl: string | undefined;
    let textContent: string | undefined;

    if (fileType === 'image') {
      contentDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else if (['doc', 'code', 'spreadsheet'].includes(fileType) && bytes < 500000) {
      textContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string || '');
        reader.readAsText(file);
      });
    }

    const newVaultFile: VaultFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: file.name,
      folderId: effectiveFolderId,
      sizeBytes: bytes,
      sizeFormatted,
      fileType,
      extension: ext,
      mimeType: file.type,
      contentDataUrl,
      textContent,
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
    };

    setFiles(prev => [newVaultFile, ...prev]);
    await dbService.saveFile(newVaultFile, file);
    showToast(`Uploaded "${file.name}"`);
    addNotification('File Uploaded', `"${file.name}" saved to MyVault.`, 'success');
  };

  const createNoteFile = async (name: string, content: string, folderId: string | null = currentFolderId) => {
    const fileName = name.endsWith('.txt') || name.endsWith('.md') ? name : `${name}.txt`;
    const ext = fileName.split('.').pop() || 'txt';
    const bytes = new Blob([content]).size;
    const sizeFormatted = bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;

    const newFile: VaultFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      folderId: folderId || 'f-projects',
      sizeBytes: bytes,
      sizeFormatted,
      fileType: 'doc',
      extension: ext,
      textContent: content,
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
    };
    setFiles(prev => [newFile, ...prev]);
    await dbService.saveFile(newFile);
    showToast(`Note "${fileName}" created`);
  };

  const renameFile = async (id: string, newName: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, name: newName.trim(), updatedAt: 'Just now' };
          dbService.saveFile(updated);
          return updated;
        }
        return f;
      })
    );
    showToast('File renamed');
  };

  const deleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedFileIds(prev => prev.filter(selectedId => selectedId !== id));
    await dbService.deleteFile(id);
    showToast('File deleted', 'info');
  };

  const deleteSelectedFiles = async () => {
    if (selectedFileIds.length === 0) return;
    const count = selectedFileIds.length;
    setFiles(prev => prev.filter(f => !selectedFileIds.includes(f.id)));
    for (const fId of selectedFileIds) {
      await dbService.deleteFile(fId);
    }
    showToast(`Deleted ${count} files`, 'info');
    setSelectedFileIds([]);
  };

  const moveFile = async (fileId: string, targetFolderId: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId) {
          const updated = { ...f, folderId: targetFolderId, updatedAt: 'Just now' };
          dbService.saveFile(updated);
          return updated;
        }
        return f;
      })
    );
    showToast('File moved to folder');
  };

  // Reset to initial demo data
  const resetAllToDefault = async () => {
    setCategories(INITIAL_CATEGORIES);
    setLinks(INITIAL_LINKS);
    setDashboards(INITIAL_DASHBOARDS);
    setActiveDashboardId('dash-working');
    setTasks(INITIAL_TASKS);
    setFolders(INITIAL_FOLDERS);
    setFiles(INITIAL_FILES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUser(INITIAL_USER);
    setTheme('dark');
    setCurrentPage('links');

    localStorage.setItem('myspace_user', JSON.stringify(INITIAL_USER));
    localStorage.setItem('myspace_categories', JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem('myspace_links', JSON.stringify(INITIAL_LINKS));
    localStorage.setItem('myspace_dashboards', JSON.stringify(INITIAL_DASHBOARDS));
    localStorage.setItem('myspace_tasks', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('myspace_folders', JSON.stringify(INITIAL_FOLDERS));
    localStorage.setItem('myspace_files', JSON.stringify(INITIAL_FILES));

    showToast('Workspace reset to factory defaults', 'info');
    addNotification('Reset Complete', 'Default workspace data restored.', 'info');
  };

  const exportAllData = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      categories,
      links,
      dashboards,
      tasks,
      folders,
      files,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myspace-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded');
  };

  const importAllData = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.categories) {
        setCategories(data.categories);
        localStorage.setItem('myspace_categories', JSON.stringify(data.categories));
      }
      if (data.links) {
        setLinks(data.links);
        localStorage.setItem('myspace_links', JSON.stringify(data.links));
      }
      if (data.dashboards) {
        setDashboards(data.dashboards);
        localStorage.setItem('myspace_dashboards', JSON.stringify(data.dashboards));
      }
      if (data.tasks) {
        setTasks(data.tasks);
        localStorage.setItem('myspace_tasks', JSON.stringify(data.tasks));
      }
      if (data.folders) {
        setFolders(data.folders);
        localStorage.setItem('myspace_folders', JSON.stringify(data.folders));
      }
      if (data.files) {
        setFiles(data.files);
        localStorage.setItem('myspace_files', JSON.stringify(data.files));
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('myspace_user', JSON.stringify(data.user));
      }
      showToast('Workspace data imported successfully');
      return true;
    } catch (err) {
      console.error('Import error:', err);
      showToast('Invalid JSON backup file', 'error');
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
        isSupabaseConfigured,
        supabaseUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInWithSupabase,
        signUpWithSupabase,
        signOutSupabase,
        updateSupabaseCredentials,
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
        dashboards,
        activeDashboardId,
        setActiveDashboardId,
        addDashboard,
        renameDashboard,
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
