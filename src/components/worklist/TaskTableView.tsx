import React, { useState } from 'react';
import {
  ArrowUpDown,
  Search,
  CheckCircle2,
  Calendar,
  Sliders,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';

interface TaskTableViewProps {
  onSelectTask: (task: TaskItem) => void;
  onOpenAddTask: () => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  onSelectTask,
  onOpenAddTask,
}) => {
  const { tasks, activeDashboardId, updateTask, deleteTask } = useMySpace();

  const [sortField, setSortField] = useState<keyof TaskItem>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchFilter, setSearchFilter] = useState('');

  const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);

  const handleSort = (field: keyof TaskItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredTasks = currentTasks
    .filter((t) => {
      const q = searchFilter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.categoryTag && t.categoryTag.toLowerCase().includes(q)) ||
        (t.projectCode && t.projectCode.toLowerCase().includes(q)) ||
        t.status.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const valA = (a[sortField] || '') as string;
      const valB = (b[sortField] || '') as string;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="bg-[#131929] border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161c2e]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search table rows..."
              className="pl-8 pr-3 py-1.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-56 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredTasks.length} tasks
          </span>
        </div>

        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-900/30 hover:scale-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Row
        </button>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0e1320] border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px] tracking-wider select-none">
              <th
                onClick={() => handleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Task Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('projectCode')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Project</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('priority')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Assignee</th>
              <th
                onClick={() => handleSort('startDate')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Start Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('dueDate')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 w-32">Progress</th>
              <th className="py-3 px-3 w-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                  No records match your query.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Task Name */}
                  <td className="py-2.5 px-4 font-medium text-slate-200">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, { title: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none w-full text-slate-200 focus:bg-[#0d121f] px-1 py-0.5 rounded"
                    />
                  </td>

                  {/* Project Code / Tag */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={task.projectCode || task.categoryTag || ''}
                      onChange={(e) => updateTask(task.id, { projectCode: e.target.value })}
                      placeholder="TAG"
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none font-mono text-xs text-purple-300 w-24 px-1 py-0.5 rounded"
                    />
                  </td>

                  {/* Priority Select */}
                  <td className="py-2.5 px-3">
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                      className="bg-[#0d121f] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none capitalize"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>

                  {/* Assignee */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-200 text-[10px] font-bold flex items-center justify-center">
                        {task.assignee.initials}
                      </div>
                      <span className="truncate max-w-[90px]">{task.assignee.name}</span>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td className="py-2.5 px-3 text-slate-400">
                    <input
                      type="text"
                      value={task.startDate || ''}
                      onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                      placeholder="Start"
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none w-20 text-slate-400 text-xs px-1 py-0.5 rounded"
                    />
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-3 text-slate-400">
                    <input
                      type="text"
                      value={task.dueDate || ''}
                      onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                      placeholder="Due"
                      className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none w-20 text-slate-400 text-xs px-1 py-0.5 rounded"
                    />
                  </td>

                  {/* Status Select */}
                  <td className="py-2.5 px-3">
                    <select
                      value={task.status}
                      onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                      className="bg-[#0d121f] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none capitalize"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </td>

                  {/* Progress Bar & Slider */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 w-8">
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Delete / Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
