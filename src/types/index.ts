export type NavPage = 'links' | 'work-list' | 'vault' | 'settings';

export type ThemeMode = 'dark' | 'light';

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

// ============ LINKS MANAGER TYPES ============
export interface LinkCategory {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color token
  order: number;
}

export interface BookmarkLink {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  favicon?: string;
  iconLetter?: string;
  iconBg?: string;
  pinned?: boolean;
  notes?: string;
  clickCount: number;
  createdAt: string;
}

// ============ WORK LIST & TASK TYPES ============
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'on_hold';
export type TaskPriority = 'low' | 'medium' | 'high';
export type WorkListViewMode = 'board' | 'list' | 'table' | 'analytics';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface TaskComment {
  id: string;
  userName: string;
  userInitials: string;
  text: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  dashboardId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryTag?: string; // e.g. "Trading", "Backend", "AI/ML", "DevOps", "Frontend"
  projectCode?: string; // e.g. "BMAD-5", "BMAD-3"
  assignee: {
    name: string;
    initials: string;
    avatarUrl?: string;
  };
  startDate?: string;
  dueDate: string; // e.g. "Nov 10" or "2026-11-10"
  progress: number; // 0 - 100
  subtasks: TaskSubtask[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  order: number;
  createdAt: string;
}

export interface WorkDashboard {
  id: string;
  name: string;
  icon?: string;
  isDefault?: boolean;
  isArchived?: boolean;
}

// ============ MYVAULT TYPES ============
export interface VaultFolder {
  id: string;
  name: string;
  parentId: string | null; // null for top-level folders
  color?: string;
  createdAt: string;
}

export interface VaultFile {
  id: string;
  name: string;
  folderId: string; // points to VaultFolder.id
  sizeBytes: number;
  sizeFormatted: string; // e.g. "24.5 MB"
  fileType: 'pdf' | 'spreadsheet' | 'doc' | 'image' | 'archive' | 'code' | 'other';
  extension: string; // e.g. "pdf", "xlsx", "docx", "png"
  mimeType?: string;
  contentDataUrl?: string; // for uploaded images / text files
  textContent?: string;
  tags?: string[];
  updatedAt: string;
  createdAt: string;
}

// ============ GLOBAL NOTIFICATION TYPES ============
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  timestamp: string;
  actionLink?: {
    page: NavPage;
    targetId?: string;
  };
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
