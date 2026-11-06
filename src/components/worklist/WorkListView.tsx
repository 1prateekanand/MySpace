import React, { useState } from 'react';
import {
  Kanban,
  List,
  Table as TableIcon,
  BarChart3,
  Plus,
  Filter,
  Layers,
  MoreHorizontal,
  FolderGit2,
  BookOpen,
  User,
  X
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskPriority, TaskStatus, WorkListViewMode } from '../../types';
import { KanbanBoard } from './KanbanBoard';
import { TaskListView } from './TaskListView';
import { TaskTableView } from './TaskTableView';
import { TaskAnalyticsView } from './TaskAnalyticsView';
import { TaskDetailModal } from './TaskDetailModal';
import { NewDashboardModal } from './NewDashboardModal';

export const WorkListView: React.FC = () => {
  const {
    dashboards,
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

  // New Dashboard Modal
  const [isNewDashboardOpen, setIsNewDashboardOpen] = useState(false);
  const [activeDashboardMenuId, setActiveDashboardMenuId] = useState<string | null>(null);

  // Filter popup toggle
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const { renameDashboard, duplicateDashboard, deleteDashboard } = useMySpace();

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
      progress: 0,
    });

    setIsNewTaskModalOpen(false);
  };

  const getDashboardIcon = (id: string) => {
    if (id === 'dash-learnings') return <BookOpen className="w-3.5 h-3.5" />;
    if (id === 'dash-personal') return <User className="w-3.5 h-3.5" />;
    return <FolderGit2 className="w-3.5 h-3.5" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Tabs & + New Task Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Dashboard Pills with context menu */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {dashboards.map((dash) => {
            const isActive = activeDashboardId === dash.id;
            const isMenuOpen = activeDashboardMenuId === dash.id;

            return (
              <div key={dash.id} className="relative shrink-0 flex items-center">
                <button
                  onClick={() => setActiveDashboardId(dash.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-900/40 border border-purple-500/40'
                      : 'bg-[#161c2e] text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{getDashboardIcon(dash.id)}</span>
                  <span>{dash.name}</span>
                </button>

                {/* Dashboard Options Dropdown trigger */}
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDashboardMenuId(isMenuOpen ? null : dash.id);
                    }}
                    className="p-1 -ml-2 mr-1 rounded text-purple-200 hover:text-white hover:bg-purple-800/40"
                    title="Dashboard settings"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}

                {isMenuOpen && (
                  <div className="absolute top-10 left-0 w-44 bg-[#1a2238] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in-50 text-left">
                    <button
                      onClick={() => {
                        setActiveDashboardMenuId(null);
                        const newName = prompt('New name for dashboard:', dash.name);
                        if (newName && newName.trim()) renameDashboard(dash.id, newName.trim());
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      Rename Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setActiveDashboardMenuId(null);
                        duplicateDashboard(dash.id);
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                    >
                      Duplicate Dashboard
                    </button>
                    {dashboards.length > 1 && (
                      <button
                        onClick={() => {
                          setActiveDashboardMenuId(null);
                          if (confirm(`Delete dashboard "${dash.name}" and its tasks?`)) {
                            deleteDashboard(dash.id);
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                      >
                        Delete Dashboard
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setIsNewDashboardOpen(true)}
            className="w-8 h-8 rounded-xl bg-[#161c2e] border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Create Dashboard"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Task CTA */}
        <button
          onClick={() => handleOpenAddTask('todo')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* View Navigation Bar (Board, List, List Table, Analytics) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        {/* View Switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-[#131929] border border-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setWorkListViewMode('board')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              workListViewMode === 'board'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setWorkListViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              workListViewMode === 'list'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => setWorkListViewMode('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              workListViewMode === 'table'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>List (Table)</span>
          </button>

          <button
            onClick={() => setWorkListViewMode('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              workListViewMode === 'analytics'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c2e] hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

          <button
            onClick={() => {
              // Toggle sorting or grouping
              setWorkListViewMode(workListViewMode === 'table' ? 'board' : 'table');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c2e] hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Group</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {workListViewMode === 'board' && (
        <div className="space-y-6">
          {/* Top: 4 Kanban Columns */}
          <KanbanBoard
            onSelectTask={handleOpenTask}
            onOpenAddTask={handleOpenAddTask}
          />

          {/* Bottom Split Row matching Screenshot 2: List View & Analysis Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            <TaskListView
              onSelectTask={handleOpenTask}
              isCompact={true}
            />
            <TaskAnalyticsView isCompact={true} />
          </div>
        </div>
      )}

      {workListViewMode === 'list' && (
        <TaskListView
          onSelectTask={handleOpenTask}
          isCompact={false}
        />
      )}

      {workListViewMode === 'table' && (
        <TaskTableView
          onSelectTask={handleOpenTask}
          onOpenAddTask={() => handleOpenAddTask('todo')}
        />
      )}

      {workListViewMode === 'analytics' && (
        <TaskAnalyticsView isCompact={false} />
      )}

      {/* Task Details Modal */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        task={selectedTask}
      />

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#131929] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-700/70 flex items-center justify-between bg-[#161c2e]">
              <h3 className="text-base font-semibold text-white">Create New Task</h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Build NSE Stock Scanner v3"
                  className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Column
                  </label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 capitalize"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 capitalize"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    placeholder="e.g. Trading, AI/ML"
                    className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="e.g. Nov 15"
                    className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Dashboard Modal */}
      <NewDashboardModal
        isOpen={isNewDashboardOpen}
        onClose={() => setIsNewDashboardOpen(false)}
      />
    </div>
  );
};
