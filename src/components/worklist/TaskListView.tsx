import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  PauseCircle,
  MoreVertical,
  Filter,
  CheckSquare
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskStatus, TaskPriority } from '../../types';

interface TaskListViewProps {
  onSelectTask: (task: TaskItem) => void;
  isCompact?: boolean; // if true, renders bottom-left list view card matching screenshot 2
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  onSelectTask,
  isCompact = false,
}) => {
  const { tasks, activeDashboardId, updateTask } = useMySpace();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);

  // Filter tasks
  const filteredTasks = currentTasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const displayedTasks = isCompact ? filteredTasks.slice(0, 5) : filteredTasks;

  const toggleSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'low':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'in_progress':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'on_hold':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'todo':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleStatusToggle = (e: React.MouseEvent, task: TaskItem) => {
    e.stopPropagation();
    const nextStatus: TaskStatus =
      task.status === 'todo'
        ? 'in_progress'
        : task.status === 'in_progress'
        ? 'done'
        : task.status === 'done'
        ? 'on_hold'
        : 'todo';
    updateTask(task.id, { status: nextStatus });
  };

  return (
    <div className="bg-[#131929] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* List Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">List View</h3>
        </div>

        {!isCompact && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#161c2e] border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="on_hold">On Hold</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#161c2e] border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800/60 text-[11px] uppercase tracking-wider">
              <th className="py-2 px-2 w-8">
                <input
                  type="checkbox"
                  checked={
                    selectedTaskIds.length === displayedTasks.length && displayedTasks.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) setSelectedTaskIds(displayedTasks.map((t) => t.id));
                    else setSelectedTaskIds([]);
                  }}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th className="py-2 px-3 font-semibold">Task</th>
              <th className="py-2 px-3 font-semibold">Project</th>
              <th className="py-2 px-3 font-semibold">Priority</th>
              <th className="py-2 px-3 font-semibold">Due Date</th>
              <th className="py-2 px-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {displayedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                  No tasks found.
                </td>
              </tr>
            ) : (
              displayedTasks.map((task) => {
                const isChecked = selectedTaskIds.includes(task.id);

                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(task.id)}
                        className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 group-hover:text-purple-300 transition-colors truncate max-w-xs">
                        {task.title}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Bookmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="font-mono text-xs text-slate-300">
                          {task.projectCode || task.categoryTag || 'TASK'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{task.dueDate || 'No date'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={(e) => handleStatusToggle(e, task)}
                        title="Click to advance status"
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border transition-transform hover:scale-105 ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status.replace('_', ' ')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
