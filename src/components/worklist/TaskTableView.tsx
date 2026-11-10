import React, { useState } from 'react';
import {
  ArrowUpDown,
  Search,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Edit3,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';
import { TaskNotesModal } from './TaskNotesModal';

interface TaskTableViewProps {
  onSelectTask: (task: TaskItem) => void;
  onOpenAddTask: () => void;
}

type SortField = 'projectName' | 'priority' | 'status' | 'date' | 'progress';

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  onSelectTask,
  onOpenAddTask,
}) => {
  const { tasks, activeDashboardId, updateTask, deleteTask } = useMySpace();

  const [sortField, setSortField] = useState<SortField>('projectName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchFilter, setSearchFilter] = useState('');

  // Notes Modal state
  const [editingNotesTask, setEditingNotesTask] = useState<TaskItem | null>(null);

  const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const priorityWeight: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const statusWeight: Record<TaskStatus, number> = {
    todo: 1,
    in_progress: 2,
    on_hold: 3,
    done: 4,
  };

  const filteredTasks = currentTasks
    .filter((t) => {
      const q = searchFilter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.projectCode && t.projectCode.toLowerCase().includes(q)) ||
        (t.categoryTag && t.categoryTag.toLowerCase().includes(q)) ||
        t.priority.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        (t.dueDate && t.dueDate.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'projectName': {
          const nameA = `${a.projectCode || ''} ${a.title}`.trim().toLowerCase();
          const nameB = `${b.projectCode || ''} ${b.title}`.trim().toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'priority': {
          comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
          break;
        }
        case 'status': {
          comparison = statusWeight[a.status] - statusWeight[b.status];
          break;
        }
        case 'date': {
          comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
          break;
        }
        case 'progress': {
          comparison = a.progress - b.progress;
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSaveNotes = (taskId: string, notes: string) => {
    updateTask(taskId, { notes });
  };

  return (
    <div className="theme-bg-card border theme-border-card rounded-2xl shadow-xl overflow-hidden flex flex-col h-full min-h-0">
      {/* Table Toolbar */}
      <div className="p-4 theme-divider border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 theme-bg-card-secondary shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by project, status, priority, notes..."
              className="pl-8 pr-3 py-1.5 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942] w-64 sm:w-80"
            />
            <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-2.5" />
          </div>
          <span className="text-xs theme-text-muted font-mono whitespace-nowrap">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <button
          onClick={onOpenAddTask}
          className="gold-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Spreadsheet Table with EXACTLY 6 Columns - Sticky Header & Independent Vertical Scroll */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse table-fixed min-w-[760px]">
          <thead className="sticky top-0 z-10 shadow-xs">
            <tr className="theme-bg-card-secondary theme-divider border-b theme-text-muted font-semibold uppercase text-[11px] tracking-wider select-none">
              {/* 1. Project Name */}
              <th
                onClick={() => handleSort('projectName')}
                className="py-3 px-4 w-[28%] cursor-pointer hover:theme-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Project Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* 2. Priority */}
              <th
                onClick={() => handleSort('priority')}
                className="py-3 px-3 w-[14%] cursor-pointer hover:theme-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* 3. Status */}
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 w-[15%] cursor-pointer hover:theme-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* 4. Date */}
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 w-[13%] cursor-pointer hover:theme-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* 5. Progress */}
              <th
                onClick={() => handleSort('progress')}
                className="py-3 px-3 w-[14%] cursor-pointer hover:theme-text-primary transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Progress</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* 6. Notes */}
              <th className="py-3 px-4 w-[16%]">
                <div className="flex items-center gap-1.5">
                  <span>Notes</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center theme-text-muted text-xs">
                  No tasks found matching your search.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:theme-bg-card-hover transition-colors group h-12"
                >
                  {/* 1. Project Name */}
                  <td className="py-2.5 px-4 font-medium theme-text-primary max-w-0">
                    <div className="flex items-center gap-2">
                      {task.projectCode ? (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#F5B942]/10 border border-[#F5B942]/30 text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                          {task.projectCode}
                        </span>
                      ) : task.categoryTag ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded theme-bg-card-inner border theme-border-card theme-text-secondary shrink-0">
                          {task.categoryTag}
                        </span>
                      ) : null}

                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, { title: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:theme-border-card focus:border-[#F5B942] focus:outline-none w-full theme-text-primary focus:theme-bg-card-inner px-1 py-0.5 rounded text-xs truncate"
                        title="Click to edit task/project name"
                      />

                      <button
                        onClick={() => onSelectTask(task)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-theme-muted hover:text-[#F5B942] hover:theme-bg-card-inner transition-opacity shrink-0"
                        title="Open full task detail"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* 2. Priority */}
                  <td className="py-2.5 px-3">
                    <div className="relative inline-block">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                        className={`appearance-none rounded-lg px-2.5 py-1 text-[11px] font-semibold border capitalize cursor-pointer focus:outline-none pr-5 ${
                          task.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : task.priority === 'medium'
                            ? 'bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border-[#F5B942]/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <option value="high" className="theme-bg-card theme-text-primary">High</option>
                        <option value="medium" className="theme-bg-card theme-text-primary">Medium</option>
                        <option value="low" className="theme-bg-card theme-text-primary">Low</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  {/* 3. Status */}
                  <td className="py-2.5 px-3">
                    <div className="relative inline-block">
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                        className={`appearance-none rounded-lg px-2.5 py-1 text-[11px] font-semibold border cursor-pointer focus:outline-none pr-5 ${
                          task.status === 'done'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : task.status === 'in_progress'
                            ? 'bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border-[#F5B942]/35'
                            : task.status === 'on_hold'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'theme-bg-card-inner theme-text-secondary border-theme-border-card'
                        }`}
                      >
                        <option value="todo" className="theme-bg-card theme-text-primary">To Do</option>
                        <option value="in_progress" className="theme-bg-card theme-text-primary">In Progress</option>
                        <option value="done" className="theme-bg-card theme-text-primary">Done</option>
                        <option value="on_hold" className="theme-bg-card theme-text-primary">On Hold</option>
                      </select>
                      <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none opacity-60" />
                    </div>
                  </td>

                  {/* 4. Date */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 theme-text-muted shrink-0" />
                      <input
                        type="text"
                        value={task.dueDate || ''}
                        onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                        placeholder="Due date"
                        className="bg-transparent border-b border-transparent hover:theme-border-card focus:border-[#F5B942] focus:outline-none w-24 theme-text-primary text-xs px-1 py-0.5 rounded"
                      />
                    </div>
                  </td>

                  {/* 5. Progress */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 theme-bg-card-secondary h-1.5 rounded-full overflow-hidden shrink-0">
                        <div
                          className="bg-[#F5B942] h-full rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                          updateTask(task.id, { progress: val });
                        }}
                        className="w-11 px-1 py-0.5 text-[11px] font-mono theme-text-muted hover:theme-text-primary focus:theme-text-primary bg-transparent border-b border-transparent hover:theme-border-card focus:border-[#F5B942] focus:outline-none rounded text-right"
                      />
                      <span className="text-[10px] font-mono theme-text-muted -ml-1">%</span>
                    </div>
                  </td>

                  {/* 6. Notes (Constrained width, never expands row or distorts layout) */}
                  <td className="py-2.5 px-4 max-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <div
                        onClick={() => setEditingNotesTask(task)}
                        className="truncate cursor-pointer text-xs theme-text-secondary hover:text-[#F5B942] transition-colors flex-1"
                        title={task.notes ? task.notes : 'Click to add notes'}
                      >
                        {task.notes && task.notes.trim() ? (
                          <span className="truncate block">{task.notes.split('\n')[0]}</span>
                        ) : (
                          <span className="theme-text-muted/60">—</span>
                        )}
                      </div>

                      <button
                        onClick={() => setEditingNotesTask(task)}
                        className="p-1 rounded-md text-theme-muted hover:text-[#F5B942] hover:theme-bg-card-inner transition-colors shrink-0"
                        title="View & Edit Notes"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded theme-text-muted hover:text-rose-400 hover:bg-rose-950/20 transition-opacity shrink-0 cursor-pointer ml-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task Notes Multiline Modal */}
      <TaskNotesModal
        isOpen={Boolean(editingNotesTask)}
        onClose={() => setEditingNotesTask(null)}
        task={editingNotesTask}
        onSaveNotes={handleSaveNotes}
      />
    </div>
  );
};
