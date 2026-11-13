import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Kanban,
  Table as TableIcon,
  BarChart3,
  Plus,
  Filter,
  Layers,
  MoreVertical,
  FolderGit2,
  BookOpen,
  User,
  Rocket,
  Target,
  Shield,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskPriority, TaskStatus, WorkDashboard } from '../../types';
import { KanbanBoard } from './KanbanBoard';
import { TaskTableView } from './TaskTableView';
import { TaskAnalyticsView } from './TaskAnalyticsView';
import { TaskDetailModal } from './TaskDetailModal';
import { DashboardModal } from './DashboardModal';
import { DeleteDashboardModal } from './DeleteDashboardModal';

export const WorkListView: React.FC = () => {
  const {
    dashboards,
    tasks,
    activeDashboardId,
    setActiveDashboardId,
    workListViewMode,
    setWorkListViewMode,
    addTask,
    user,
  } = useMySpace();

  // Task Details Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Task Modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Dashboard Management Modals & Context Menu
  const [isAddDashboardOpen, setIsAddDashboardOpen] = useState(false);
  const [dashboardToEdit, setDashboardToEdit] = useState<WorkDashboard | null>(null);
  const [dashboardToDelete, setDashboardToDelete] = useState<WorkDashboard | null>(null);
  const [activeDashboardMenuId, setActiveDashboardMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Close dashboard options menu on outside click, Escape key, or resize
  useEffect(() => {
    if (!activeDashboardMenuId) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.dashboard-menu-container') &&
        !target.closest('.dashboard-menu-portal')
      ) {
        setActiveDashboardMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDashboardMenuId(null);
      }
    };

    const handleResize = () => {
      setActiveDashboardMenuId(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeDashboardMenuId]);

  // Filter popup toggle
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const handleOpenTask = (task: TaskItem) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleOpenAddTask = (defaultStatus: TaskStatus = 'todo') => {
    setNewTaskStatus(defaultStatus);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskCategory('');
    setNewTaskDueDate('Nov 15');
    setNewTaskNotes('');
    setIsNewTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      dashboardId: activeDashboardId,
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      priority: newTaskPriority,
      categoryTag: newTaskCategory.trim() || 'General',
      projectCode: newTaskCategory.trim().toUpperCase().slice(0, 4) || 'TASK',
      assignee: {
        name: user.name,
        initials: user.initials,
      },
      dueDate: newTaskDueDate.trim() || 'Nov 15',
      progress: newTaskStatus === 'done' ? 100 : 0,
      description: newTaskNotes.trim() || undefined,
    });

    setIsNewTaskModalOpen(false);
  };

  const getDashboardIcon = (iconName?: string, id?: string) => {
    const iconKey = iconName || (id === 'dash-learnings' ? 'BookOpen' : id === 'dash-personal' ? 'User' : 'FolderGit2');
    switch (iconKey) {
      case 'BookOpen': return <BookOpen className="w-3.5 h-3.5" />;
      case 'User': return <User className="w-3.5 h-3.5" />;
      case 'Rocket': return <Rocket className="w-3.5 h-3.5" />;
      case 'Target': return <Target className="w-3.5 h-3.5" />;
      case 'Shield': return <Shield className="w-3.5 h-3.5" />;
      default: return <FolderGit2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden max-w-7xl w-full mx-auto">
      {/* Fixed Controls: Dashboard Tabs, KPI Summary Cards & View Navigation */}
      <div className="shrink-0 p-4 sm:p-6 lg:p-8 pb-3 space-y-4">
        {/* Dashboard Tabs Bar */}
        <div className="flex items-center">
          {/* Dashboard Pills with clean styling, horizontal scroll, and three-dot dropdown */}
          <div
            onScroll={() => activeDashboardMenuId && setActiveDashboardMenuId(null)}
            className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full"
          >
            {dashboards.map((dash) => {
              const isActive = activeDashboardId === dash.id;
              const isMenuOpen = activeDashboardMenuId === dash.id;

              return (
                <div
                  key={dash.id}
                  className={`relative shrink-0 flex items-center rounded-xl transition-all group dashboard-menu-container ${
                    isActive
                      ? 'gold-pill-active'
                      : 'theme-bg-card theme-text-secondary hover:theme-text-primary border theme-border-card hover:theme-bg-card-hover'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDashboardId(dash.id)}
                    className="flex items-center gap-2 pl-3.5 pr-1.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer rounded-l-xl focus:outline-none"
                  >
                    <span className={isActive ? 'text-inherit' : 'text-[#D99A1C] dark:text-[#F5B942]'}>
                      {getDashboardIcon(dash.icon, dash.id)}
                    </span>
                    <span>{dash.name}</span>
                  </button>

                  {/* Functional Three-Dot Options Trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMenuOpen) {
                        setActiveDashboardMenuId(null);
                        setMenuPosition(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const menuWidth = 184;
                        const menuHeight = 116;
                        const left = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12));
                        const top = Math.min(rect.bottom + 6, window.innerHeight - menuHeight - 12);
                        setMenuPosition({ top, left });
                        setActiveDashboardMenuId(dash.id);
                      }
                    }}
                    aria-label={`Options for ${dash.name}`}
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    className={`p-1.5 mr-1 rounded-lg transition-all cursor-pointer focus:outline-none ${
                      isMenuOpen
                        ? 'opacity-100 bg-black/15 dark:bg-white/15 text-inherit'
                        : isActive
                        ? 'opacity-70 hover:opacity-100 hover:bg-black/10'
                        : 'opacity-55 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                    title={`Options for ${dash.name}`}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setDashboardToEdit(null);
                setIsAddDashboardOpen(true);
              }}
              className="w-8 h-8 rounded-xl theme-bg-card border border-dashed theme-border-card hover:border-[#F5B942]/60 theme-text-muted hover:theme-text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Add Dashboard"
            >
              <Plus className="w-4 h-4 text-[#F5B942]" />
            </button>
          </div>
        </div>

        {/* KPI Summary Cards Row */}
        {(() => {
          const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);
          const total = currentTasks.length;
          const completed = currentTasks.filter((t) => t.status === 'done').length;
          const pending = currentTasks.filter((t) => t.status !== 'done').length;
          const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Tasks */}
              <div className="theme-bg-card border theme-border-card rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold theme-text-primary tracking-tight">
                    {total}
                  </div>
                  <div className="text-xs theme-text-muted">Total Tasks</div>
                </div>
              </div>

              {/* Progress */}
              <div className="theme-bg-card border theme-border-card rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-black/10 dark:text-white/10 stroke-current"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#D99A1C] dark:text-[#F5B942] stroke-current"
                      strokeDasharray={`${progressPct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-[#D99A1C] dark:text-[#F5B942]">
                    {progressPct}%
                  </span>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold theme-text-primary tracking-tight">
                    {progressPct}%
                  </div>
                  <div className="text-xs theme-text-muted">Progress</div>
                </div>
              </div>

              {/* Completed */}
              <div className="theme-bg-card border theme-border-card rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold theme-text-primary tracking-tight">
                    {completed}
                  </div>
                  <div className="text-xs theme-text-muted">Completed</div>
                </div>
              </div>

              {/* Pending */}
              <div className="theme-bg-card border theme-border-card rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold theme-text-primary tracking-tight">
                    {pending}
                  </div>
                  <div className="text-xs theme-text-muted">Pending</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* View Navigation Bar: Exactly 3 views (Board | Table | Analytics) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 theme-divider border-b">
          {/* View Switchers: Board, Table, Analytics (No List tab) */}
          <div className="flex items-center gap-1.5 p-1 theme-bg-card border theme-border-card rounded-xl w-fit shadow-xs">
            <button
              onClick={() => setWorkListViewMode('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                workListViewMode === 'board'
                  ? 'gold-pill-active'
                  : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => setWorkListViewMode('table')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                workListViewMode === 'table'
                  ? 'gold-pill-active'
                  : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setWorkListViewMode('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                workListViewMode === 'analytics'
                  ? 'gold-pill-active'
                  : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Right utility buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-card hover:theme-bg-card-hover theme-text-secondary hover:theme-text-primary text-xs font-medium border theme-border-card transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 theme-text-muted" />
              <span>Filter</span>
            </button>

            <button
              onClick={() => {
                setWorkListViewMode(workListViewMode === 'table' ? 'board' : 'table');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-card hover:theme-bg-card-hover theme-text-secondary hover:theme-text-primary text-xs font-medium border theme-border-card transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 theme-text-muted" />
              <span>Toggle View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area: Separated into exactly 3 clean views with independent scrolling */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 pb-6 flex flex-col overflow-hidden">
        {/* 1. Board View: Displays ONLY the Kanban Board */}
        {workListViewMode === 'board' && (
          <div className="h-full min-h-0">
            <KanbanBoard
              onSelectTask={handleOpenTask}
              onOpenAddTask={handleOpenAddTask}
            />
          </div>
        )}

        {/* 2. Table View: Displays ONLY the 6-column Task Table */}
        {workListViewMode === 'table' && (
          <div className="h-full min-h-0">
            <TaskTableView
              onSelectTask={handleOpenTask}
              onOpenAddTask={() => handleOpenAddTask('todo')}
            />
          </div>
        )}

        {/* 3. Analytics View: Displays ONLY the Task Analytics */}
        {workListViewMode === 'analytics' && (
          <div className="h-full min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
            <TaskAnalyticsView isCompact={false} />
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        task={selectedTask}
      />

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
              <h3 className="text-base font-semibold theme-text-primary">Create New Task</h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold theme-text-primary mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Build NSE Stock Scanner v3"
                  className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Initial Column
                  </label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942] capitalize"
                  >
                    <option value="todo" className="theme-bg-card theme-text-primary">To Do</option>
                    <option value="in_progress" className="theme-bg-card theme-text-primary">In Progress</option>
                    <option value="done" className="theme-bg-card theme-text-primary">Done</option>
                    <option value="on_hold" className="theme-bg-card theme-text-primary">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942] capitalize"
                  >
                    <option value="high" className="theme-bg-card theme-text-primary">High</option>
                    <option value="medium" className="theme-bg-card theme-text-primary">Medium</option>
                    <option value="low" className="theme-bg-card theme-text-primary">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Category Tag / Code
                  </label>
                  <input
                    type="text"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    placeholder="e.g. Trading, AI/ML"
                    className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="e.g. Nov 15"
                    className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-primary mb-1">
                  Initial Notes (Optional)
                </label>
                <textarea
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  placeholder="Task notes, links, or implementation reminders..."
                  rows={2}
                  className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 theme-divider border-t">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium theme-text-secondary hover:theme-text-primary theme-bg-card-secondary hover:theme-bg-card-hover rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Options Dropdown Portal (Prevents overflow clipping & stays inside screen boundaries) */}
      {activeDashboardMenuId &&
        menuPosition &&
        (() => {
          const targetDash = dashboards.find((d) => d.id === activeDashboardMenuId);
          if (!targetDash) return null;

          return createPortal(
            <div
              role="menu"
              aria-label={`Options for ${targetDash.name}`}
              style={{ top: menuPosition.top, left: menuPosition.left }}
              className="dashboard-menu-portal fixed z-[9999] min-w-[184px] theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1.5 animate-in fade-in-50 zoom-in-95 text-left"
            >
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider theme-text-muted border-b theme-divider mb-1 truncate">
                {targetDash.name}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveDashboardMenuId(null);
                  setMenuPosition(null);
                  setDashboardToEdit(targetDash);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-card-hover hover:text-[#D99A1C] dark:hover:text-[#F5B942] flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                <span>Edit Dashboard</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActiveDashboardMenuId(null);
                  setMenuPosition(null);
                  setDashboardToDelete(targetDash);
                }}
                disabled={dashboards.length <= 1}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                  dashboards.length <= 1
                    ? 'opacity-40 cursor-not-allowed theme-text-muted'
                    : 'text-rose-500 hover:bg-rose-500/10 cursor-pointer'
                }`}
                title={dashboards.length <= 1 ? 'Cannot delete the only dashboard' : undefined}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Dashboard</span>
              </button>
            </div>,
            document.body
          );
        })()}

      {/* Add / Edit Dashboard Modal */}
      <DashboardModal
        isOpen={isAddDashboardOpen || Boolean(dashboardToEdit)}
        onClose={() => {
          setIsAddDashboardOpen(false);
          setDashboardToEdit(null);
        }}
        dashboardToEdit={dashboardToEdit}
      />

      {/* Delete Dashboard Confirmation Modal with Task Protection */}
      <DeleteDashboardModal
        isOpen={Boolean(dashboardToDelete)}
        onClose={() => setDashboardToDelete(null)}
        dashboard={dashboardToDelete}
      />
    </div>
  );
};
