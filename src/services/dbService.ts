import { getSupabase } from '../lib/supabase';
import {
  UserProfile,
  LinkCategory,
  BookmarkLink,
  WorkDashboard,
  TaskItem,
  TaskStatus,
  TaskPriority,
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

import { safeStorage } from '../lib/storage';

// Local storage backup keys
const KEYS = {
  USER: 'myspace_user',
  THEME: 'myspace_theme',
  CATEGORIES: 'myspace_categories',
  LINKS: 'myspace_links',
  DASHBOARDS: 'myspace_dashboards',
  TASKS: 'myspace_tasks',
  FOLDERS: 'myspace_folders',
  FILES: 'myspace_files',
  NOTIFS: 'myspace_notifs',
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const val = safeStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  try {
    safeStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export const dbService = {
  // ==================== USER PROFILE ====================
  async loadUserProfile(): Promise<UserProfile> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            return {
              name: data.name || user.email?.split('@')[0] || 'User',
              initials: data.initials || 'U',
              email: data.email || user.email || '',
              role: data.role || 'Member',
              avatarUrl: data.avatar_url,
            };
          }
        }
      } catch (err) {
        console.warn('Supabase profile load fallback:', err);
      }
    }
    return readLocal<UserProfile>(KEYS.USER, INITIAL_USER);
  },

  async saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const current = readLocal<UserProfile>(KEYS.USER, INITIAL_USER);
    const updated = { ...current, ...profile };
    writeLocal(KEYS.USER, updated);

    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          await client.from('profiles').upsert({
            id: user.id,
            name: updated.name,
            email: updated.email,
            initials: updated.initials,
            role: updated.role,
            avatar_url: updated.avatarUrl,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase profile save error:', err);
      }
    }
  },

  // ==================== LINK CATEGORIES ====================
  async loadCategories(): Promise<LinkCategory[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('link_categories')
          .select('*')
          .order('order_index', { ascending: true });

        if (!error && Array.isArray(data)) {
          const loaded = data.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            order: c.order_index !== undefined ? c.order_index : 0,
          })).sort((a, b) => a.order - b.order);
          // Sync to local cache so offline mode has latest data
          writeLocal(KEYS.CATEGORIES, loaded);
          return loaded;
        }
      } catch (err) {
        console.warn('Supabase categories fetch error:', err);
      }
    }
    const local = readLocal<LinkCategory[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
    return [...local].sort((a, b) => a.order - b.order);
  },

  async saveCategory(category: LinkCategory): Promise<void> {
    // 1. Always persist to local storage first
    const currentCats = readLocal<LinkCategory[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const existingIdx = currentCats.findIndex((c) => c.id === category.id);
    let updatedCats: LinkCategory[];
    if (existingIdx >= 0) {
      updatedCats = [...currentCats];
      updatedCats[existingIdx] = category;
    } else {
      updatedCats = [...currentCats, category];
    }
    writeLocal(KEYS.CATEGORIES, updatedCats);

    // 2. Synchronize to Supabase if connected
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        const { error } = await client.from('link_categories').upsert({
          id: category.id,
          user_id: user?.id || null,
          name: category.name,
          icon: category.icon,
          color: category.color,
          order_index: category.order,
        });
        if (error) {
          console.error('Supabase save category error:', error);
          throw new Error(error.message);
        }
      } catch (err) {
        console.warn('Supabase save category error:', err);
        throw err;
      }
    }
  },

  async saveAllCategories(categories: LinkCategory[]): Promise<void> {
    const ordered = categories.map((c, idx) => ({ ...c, order: idx + 1 }));
    writeLocal(KEYS.CATEGORIES, ordered);

    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        const payload = ordered.map((c) => ({
          id: c.id,
          user_id: user?.id || null,
          name: c.name,
          icon: c.icon,
          color: c.color,
          order_index: c.order,
        }));
        await client.from('link_categories').upsert(payload);
      } catch (err) {
        console.warn('Supabase saveAllCategories error:', err);
      }
    }
  },

  async deleteCategory(categoryId: string, moveLinksToCategoryId?: string): Promise<void> {
    // 1. Always update local storage
    const currentCats = readLocal<LinkCategory[]>(KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const updatedCats = currentCats.filter((c) => c.id !== categoryId);
    writeLocal(KEYS.CATEGORIES, updatedCats);

    const currentLinks = readLocal<BookmarkLink[]>(KEYS.LINKS, INITIAL_LINKS);
    let updatedLinks: BookmarkLink[];
    if (moveLinksToCategoryId) {
      updatedLinks = currentLinks.map((l) =>
        l.categoryId === categoryId ? { ...l, categoryId: moveLinksToCategoryId } : l
      );
    } else {
      updatedLinks = currentLinks.filter((l) => l.categoryId !== categoryId);
    }
    writeLocal(KEYS.LINKS, updatedLinks);

    // 2. Synchronize with Supabase
    const client = getSupabase();
    if (client) {
      try {
        if (moveLinksToCategoryId) {
          await client
            .from('saved_links')
            .update({ category_id: moveLinksToCategoryId })
            .eq('category_id', categoryId);
        }
        const { error } = await client.from('link_categories').delete().eq('id', categoryId);
        if (error) {
          console.error('Supabase delete category error:', error);
          throw new Error(error.message);
        }
      } catch (err) {
        console.warn('Supabase delete category error:', err);
        throw err;
      }
    }
  },

  // ==================== SAVED LINKS ====================
  async loadLinks(): Promise<BookmarkLink[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('saved_links')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const loaded = data.map((l) => ({
            id: l.id,
            categoryId: l.category_id,
            title: l.title,
            url: l.url,
            favicon: l.favicon,
            iconLetter: l.icon_letter,
            iconBg: l.icon_bg,
            pinned: l.pinned,
            notes: l.notes,
            order: l.order_index !== undefined ? l.order_index : (l.order !== undefined ? l.order : 0),
            clickCount: l.click_count || 0,
            createdAt: l.created_at,
          }));
          writeLocal(KEYS.LINKS, loaded);
          return loaded;
        }
      } catch (err) {
        console.warn('Supabase links fetch error:', err);
      }
    }
    return readLocal<BookmarkLink[]>(KEYS.LINKS, INITIAL_LINKS);
  },

  async saveLink(link: BookmarkLink): Promise<void> {
    // 1. Always update local storage
    const currentLinks = readLocal<BookmarkLink[]>(KEYS.LINKS, INITIAL_LINKS);
    const existingIdx = currentLinks.findIndex((l) => l.id === link.id);
    let updatedLinks: BookmarkLink[];
    if (existingIdx >= 0) {
      updatedLinks = [...currentLinks];
      updatedLinks[existingIdx] = link;
    } else {
      updatedLinks = [link, ...currentLinks];
    }
    writeLocal(KEYS.LINKS, updatedLinks);

    // 2. Synchronize to Supabase if connected
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        const payload: any = {
          id: link.id,
          category_id: link.categoryId,
          user_id: user?.id || null,
          title: link.title,
          url: link.url,
          favicon: link.favicon,
          icon_letter: link.iconLetter,
          icon_bg: link.iconBg,
          pinned: link.pinned,
          notes: link.notes,
          order_index: link.order || 0,
          click_count: link.clickCount,
          created_at: link.createdAt,
        };
        const { error } = await client.from('saved_links').upsert(payload);
        if (error) {
          if (error.message && error.message.includes('order_index')) {
            const { order_index, ...fallbackPayload } = payload;
            await client.from('saved_links').upsert(fallbackPayload);
          } else {
            console.error('Supabase save link error:', error);
            throw new Error(error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase save link error:', err);
        throw err;
      }
    }
  },

  async saveAllLinks(links: BookmarkLink[]): Promise<void> {
    writeLocal(KEYS.LINKS, links);

    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        const payload = links.map((link, idx) => ({
          id: link.id,
          category_id: link.categoryId,
          user_id: user?.id || null,
          title: link.title,
          url: link.url,
          favicon: link.favicon,
          icon_letter: link.iconLetter,
          icon_bg: link.iconBg,
          pinned: link.pinned,
          notes: link.notes,
          order_index: link.order !== undefined ? link.order : idx + 1,
          click_count: link.clickCount,
          created_at: link.createdAt,
        }));
        const { error } = await client.from('saved_links').upsert(payload);
        if (error && error.message && error.message.includes('order_index')) {
          const fallbackPayload = payload.map(({ order_index, ...rest }) => rest);
          await client.from('saved_links').upsert(fallbackPayload);
        }
      } catch (err) {
        console.warn('Supabase saveAllLinks error:', err);
      }
    }
  },

  async deleteLink(linkId: string): Promise<void> {
    // 1. Always update local storage
    const currentLinks = readLocal<BookmarkLink[]>(KEYS.LINKS, INITIAL_LINKS);
    const updatedLinks = currentLinks.filter((l) => l.id !== linkId);
    writeLocal(KEYS.LINKS, updatedLinks);

    // 2. Synchronize to Supabase if connected
    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from('saved_links').delete().eq('id', linkId);
        if (error) {
          console.error('Supabase delete link error:', error);
          throw new Error(error.message);
        }
      } catch (err) {
        console.warn('Supabase delete link error:', err);
        throw err;
      }
    }
  },

  // ==================== DASHBOARDS ====================
  async loadDashboards(): Promise<WorkDashboard[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('dashboards')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            name: d.name,
            icon: d.icon,
            isDefault: d.is_default,
            isArchived: d.is_archived,
          }));
        }
      } catch (err) {
        console.warn('Supabase dashboards fetch error:', err);
      }
    }
    return readLocal<WorkDashboard[]>(KEYS.DASHBOARDS, INITIAL_DASHBOARDS);
  },

  async saveDashboard(dash: WorkDashboard): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        await client.from('dashboards').upsert({
          id: dash.id,
          user_id: user?.id || null,
          name: dash.name,
          icon: dash.icon,
          is_default: dash.isDefault,
          is_archived: dash.isArchived,
        });
      } catch (err) {
        console.warn('Supabase save dashboard error:', err);
      }
    }
  },

  async deleteDashboard(dashboardId: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('dashboards').delete().eq('id', dashboardId);
      } catch (err) {
        console.warn('Supabase delete dashboard error:', err);
      }
    }
  },

  // ==================== TASKS ====================
  async loadTasks(): Promise<TaskItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: taskData, error: taskError } = await client
          .from('tasks')
          .select('*, task_subtasks(*), task_comments(*), task_attachments(*)')
          .order('order_index', { ascending: true });

        if (!taskError && taskData && taskData.length > 0) {
          return taskData.map((t) => ({
            id: t.id,
            dashboardId: t.dashboard_id,
            title: t.title,
            description: t.description,
            notes: t.notes !== undefined ? t.notes : '',
            status: t.status as TaskStatus,
            priority: t.priority as TaskPriority,
            categoryTag: t.category_tag,
            projectCode: t.project_code,
            assignee: {
              name: t.assignee_name || 'Prateek Anand',
              initials: t.assignee_initials || 'PA',
            },
            startDate: t.start_date,
            dueDate: t.due_date,
            progress: t.progress || 0,
            order: t.order_index || 0,
            createdAt: t.created_at,
            subtasks: (t.task_subtasks || []).map((st: any) => ({
              id: st.id,
              title: st.title,
              completed: st.completed,
            })),
            comments: (t.task_comments || []).map((c: any) => ({
              id: c.id,
              userName: c.user_name,
              userInitials: c.user_initials,
              text: c.text,
              createdAt: c.created_at,
            })),
            attachments: (t.task_attachments || []).map((att: any) => ({
              id: att.id,
              name: att.name,
              size: att.size,
              type: att.type,
              url: att.url,
            })),
          }));
        }
      } catch (err) {
        console.warn('Supabase tasks fetch error:', err);
      }
    }
    return readLocal<TaskItem[]>(KEYS.TASKS, INITIAL_TASKS);
  },

  async saveTask(task: TaskItem): Promise<void> {
    // 1. Always update local storage
    const currentTasks = readLocal<TaskItem[]>(KEYS.TASKS, INITIAL_TASKS);
    const existingIdx = currentTasks.findIndex((t) => t.id === task.id);
    let updatedTasks: TaskItem[];
    if (existingIdx >= 0) {
      updatedTasks = [...currentTasks];
      updatedTasks[existingIdx] = task;
    } else {
      updatedTasks = [task, ...currentTasks];
    }
    writeLocal(KEYS.TASKS, updatedTasks);

    // 2. Synchronize to Supabase if connected
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        const payload: any = {
          id: task.id,
          dashboard_id: task.dashboardId,
          user_id: user?.id || null,
          title: task.title,
          description: task.description,
          notes: task.notes || null,
          status: task.status,
          priority: task.priority,
          category_tag: task.categoryTag,
          project_code: task.projectCode,
          assignee_name: task.assignee.name,
          assignee_initials: task.assignee.initials,
          start_date: task.startDate,
          due_date: task.dueDate,
          progress: task.progress,
          order_index: task.order,
          updated_at: new Date().toISOString(),
        };

        const { error } = await client.from('tasks').upsert(payload);
        if (error) {
          // If notes column does not exist on remote schema, safely fallback without notes
          if (error.message && error.message.includes('notes')) {
            console.warn('tasks table missing notes column, falling back without notes for remote:', error.message);
            const { notes, ...fallbackPayload } = payload;
            await client.from('tasks').upsert(fallbackPayload);
          } else {
            console.warn('Supabase save task error:', error);
          }
        }
      } catch (err) {
        console.warn('Supabase save task error:', err);
      }
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.warn('Supabase delete task error:', err);
      }
    }
  },

  // ==================== VAULT FOLDERS ====================
  async loadFolders(): Promise<VaultFolder[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('folders')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((f) => ({
            id: f.id,
            name: f.name,
            parentId: f.parent_id,
            color: f.color,
            createdAt: f.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase folders fetch error:', err);
      }
    }
    return readLocal<VaultFolder[]>(KEYS.FOLDERS, INITIAL_FOLDERS);
  },

  async saveFolder(folder: VaultFolder): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        await client.from('folders').upsert({
          id: folder.id,
          user_id: user?.id || null,
          name: folder.name,
          parent_id: folder.parentId,
          color: folder.color,
        });
      } catch (err) {
        console.warn('Supabase save folder error:', err);
      }
    }
  },

  async deleteFolder(folderId: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('folders').delete().eq('id', folderId);
      } catch (err) {
        console.warn('Supabase delete folder error:', err);
      }
    }
  },

  // ==================== VAULT FILES & STORAGE ====================
  async loadFiles(): Promise<VaultFile[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('files')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((f) => ({
            id: f.id,
            name: f.name,
            folderId: f.folder_id,
            sizeBytes: Number(f.size_bytes),
            sizeFormatted: f.size_formatted,
            fileType: f.file_type as any,
            extension: f.extension,
            contentDataUrl: f.content_data_url,
            textContent: f.text_content,
            storagePath: f.storage_path,
            googleDocUrl: f.google_doc_url,
            updatedAt: f.updated_at || 'Recently',
            createdAt: f.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase files fetch error:', err);
      }
    }
    return readLocal<VaultFile[]>(KEYS.FILES, INITIAL_FILES);
  },

  async getFileBlob(file: VaultFile): Promise<Blob | null> {
    const client = getSupabase();
    if (client && file.storagePath) {
      try {
        const { data, error } = await client.storage
          .from('vault-files')
          .download(file.storagePath);
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase storage download error:', err);
      }
    }
    return null;
  },

  async saveFile(file: VaultFile, rawFile?: File): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        let storagePath = file.storagePath || file.id;

        // If a real raw file is provided, upload to Supabase Storage bucket 'vault-files'
        if (rawFile) {
          const path = `${user?.id || 'public'}/${file.id}_${rawFile.name}`;
          const { data: uploadData, error: uploadErr } = await client.storage
            .from('vault-files')
            .upload(path, rawFile, { upsert: true });

          if (!uploadErr && uploadData) {
            storagePath = uploadData.path;
          }
        }

        await client.from('files').upsert({
          id: file.id,
          folder_id: file.folderId,
          user_id: user?.id || null,
          name: file.name,
          size_bytes: file.sizeBytes,
          size_formatted: file.sizeFormatted,
          file_type: file.fileType,
          extension: file.extension,
          storage_path: storagePath,
          content_data_url: file.contentDataUrl,
          text_content: file.textContent,
          google_doc_url: file.googleDocUrl,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase save file error:', err);
      }
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('files').delete().eq('id', fileId);
      } catch (err) {
        console.warn('Supabase delete file error:', err);
      }
    }
  },

  // ==================== NOTIFICATIONS ====================
  async loadNotifications(): Promise<AppNotification[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type as any,
            read: n.read,
            timestamp: 'Recent',
            actionLink: n.action_page
              ? { page: n.action_page as any, targetId: n.action_target_id }
              : undefined,
          }));
        }
      } catch (err) {
        console.warn('Supabase notifications fetch error:', err);
      }
    }
    return readLocal<AppNotification[]>(KEYS.NOTIFS, INITIAL_NOTIFICATIONS);
  },

  async saveNotification(notif: AppNotification): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        await client.from('notifications').upsert({
          id: notif.id,
          user_id: user?.id || null,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read,
          action_page: notif.actionLink?.page,
          action_target_id: notif.actionLink?.targetId,
        });
      } catch (err) {
        console.warn('Supabase save notification error:', err);
      }
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('Supabase mark read error:', err);
      }
    }
  },

  async clearAllNotifications(): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          await client.from('notifications').delete().eq('user_id', user.id);
        }
      } catch (err) {
        console.warn('Supabase clear notifications error:', err);
      }
    }
  },
};
