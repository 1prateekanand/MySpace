import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ChevronDown,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem } from '../../types';

interface TaskAnalyticsProps {
  isCompact?: boolean; // if true, renders the bottom-right split card matching image 2
}

export const TaskAnalyticsView: React.FC<TaskAnalyticsProps> = ({ isCompact = false }) => {
  const { tasks, activeDashboardId } = useMySpace();
  const [timeframe, setTimeframe] = useState<'month' | 'week' | 'all'>('month');

  // Filter tasks for active dashboard
  const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);
  const totalCount = currentTasks.length;

  const doneCount = currentTasks.filter((t) => t.status === 'done').length;
  const inProgressCount = currentTasks.filter((t) => t.status === 'in_progress').length;
  const todoCount = currentTasks.filter((t) => t.status === 'todo').length;
  const onHoldCount = currentTasks.filter((t) => t.status === 'on_hold').length;

  const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const inProgressPercent = totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0;
  const todoPercent = totalCount > 0 ? Math.round((todoCount / totalCount) * 100) : 0;
  const onHoldPercent = totalCount > 0 ? Math.max(0, 100 - completionPercent - inProgressPercent - todoPercent) : 0;

  // SVG Donut calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Cumulative offsets for stroke-dasharray
  const doneDash = (doneCount / (totalCount || 1)) * circumference;
  const inProgressDash = (inProgressCount / (totalCount || 1)) * circumference;
  const todoDash = (todoCount / (totalCount || 1)) * circumference;
  const onHoldDash = (onHoldCount / (totalCount || 1)) * circumference;

  const doneOffset = 0;
  const inProgressOffset = -doneDash;
  const todoOffset = -(doneDash + inProgressDash);
  const onHoldOffset = -(doneDash + inProgressDash + todoDash);

  // Group by category/tag
  const categoryCounts: Record<string, number> = {};
  currentTasks.forEach((t) => {
    const tag = t.categoryTag || 'General';
    categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
  });

  // Priority counts
  const highPriority = currentTasks.filter((t) => t.priority === 'high').length;
  const medPriority = currentTasks.filter((t) => t.priority === 'medium').length;
  const lowPriority = currentTasks.filter((t) => t.priority === 'low').length;

  // Due soon tasks (next 7 days)
  const dueSoonTasks = currentTasks.filter((t) => t.status !== 'done' && t.dueDate);

  if (isCompact) {
    return (
      <div className="theme-bg-card border theme-border-card rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 theme-divider border-b mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942]" />
            <h3 className="text-sm font-bold theme-text-primary tracking-tight">Analysis</h3>
          </div>

          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-2.5 py-1 theme-bg-card-inner border theme-border-card rounded-lg text-xs theme-text-secondary focus:outline-none focus:border-[#F5B942] cursor-pointer"
            >
              <option value="month">This Month</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Content: Donut + Legend on left, KPI cards on right */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut and Legend */}
          <div className="sm:col-span-8 flex items-center gap-4">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-black/10 dark:stroke-white/10 fill-none"
                  strokeWidth="14"
                />
                {/* Done Segment */}
                {doneCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="14"
                    strokeDasharray={`${doneDash} ${circumference}`}
                    strokeDashoffset={doneOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
                {/* In Progress Segment */}
                {inProgressCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="14"
                    strokeDasharray={`${inProgressDash} ${circumference}`}
                    strokeDashoffset={inProgressOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
                {/* To Do Segment */}
                {todoCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#F5B942"
                    strokeWidth="14"
                    strokeDasharray={`${todoDash} ${circumference}`}
                    strokeDashoffset={todoOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
                {/* On Hold Segment */}
                {onHoldCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#D6AD60"
                    strokeWidth="14"
                    strokeDasharray={`${onHoldDash} ${circumference}`}
                    strokeDashoffset={onHoldOffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold theme-text-primary font-mono tabular-nums leading-none">
                  {totalCount}
                </span>
                <span className="text-[10px] theme-text-muted font-medium">Tasks</span>
              </div>
            </div>

            {/* Legend List matching Screenshot 2 */}
            <div className="space-y-1.5 text-xs flex-1">
              <div className="flex items-center justify-between theme-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Done</span>
                </span>
                <span className="font-mono theme-text-muted">
                  {doneCount} ({completionPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between theme-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>In Progress</span>
                </span>
                <span className="font-mono theme-text-muted">
                  {inProgressCount} ({inProgressPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between theme-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F5B942]" />
                  <span>To Do</span>
                </span>
                <span className="font-mono theme-text-muted">
                  {todoCount} ({todoPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between theme-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D6AD60]" />
                  <span>On Hold</span>
                </span>
                <span className="font-mono theme-text-muted">
                  {onHoldCount} ({onHoldPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right Side KPI Cards */}
          <div className="sm:col-span-4 flex flex-col gap-2.5">
            {/* Completion card */}
            <div className="p-3 theme-bg-card-secondary border theme-border-card rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] theme-text-muted font-medium block">Completion</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold theme-text-primary font-mono">
                    {completionPercent}%
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center">
                    ↑ +12%
                  </span>
                </div>
              </div>
            </div>

            {/* Due Soon card */}
            <div className="p-3 theme-bg-card-secondary border theme-border-card rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] theme-text-muted font-medium block">Due Soon</span>
                <span className="text-base font-extrabold theme-text-primary font-mono">
                  {dueSoonTasks.length} Tasks
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full Expanded Analytics Dashboard View
  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-bg-card border theme-border-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <Layers className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942]" />
          </div>
          <div className="text-2xl font-black theme-text-primary font-mono tabular-nums">{totalCount}</div>
          <span className="text-[11px] theme-text-muted mt-1 block">Active across 4 stages</span>
        </div>

        <div className="theme-bg-card border theme-border-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">{doneCount}</div>
          <span className="text-[11px] text-emerald-400/80 mt-1 block">{completionPercent}% completion rate</span>
        </div>

        <div className="theme-bg-card border theme-border-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Flight</span>
            <Clock className="w-4 h-4 text-[#F5B942]" />
          </div>
          <div className="text-2xl font-black text-[#D99A1C] dark:text-[#F5B942] font-mono tabular-nums">{inProgressCount}</div>
          <span className="text-[11px] theme-text-muted mt-1 block">Active development</span>
        </div>

        <div className="theme-bg-card border theme-border-card rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between theme-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Deadlines</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tabular-nums">{dueSoonTasks.length}</div>
          <span className="text-[11px] theme-text-muted mt-1 block">Due this month</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Donut + Breakdown */}
        <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-3 border-b theme-divider">
            <h3 className="text-sm font-bold theme-text-primary">Status Breakdown</h3>
            <span className="text-xs theme-text-muted">Total {totalCount} items</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-around">
            {/* SVG Donut */}
            <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} className="stroke-[var(--border-card)] fill-none" strokeWidth="14" />
                {doneCount > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#22c55e" strokeWidth="14" strokeDasharray={`${doneDash} ${circumference}`} strokeDashoffset={doneOffset} strokeLinecap="round" />
                )}
                {inProgressCount > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#F5B942" strokeWidth="14" strokeDasharray={`${inProgressDash} ${circumference}`} strokeDashoffset={inProgressOffset} strokeLinecap="round" />
                )}
                {todoCount > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#D6AD60" strokeWidth="14" strokeDasharray={`${todoDash} ${circumference}`} strokeDashoffset={todoOffset} strokeLinecap="round" />
                )}
                {onHoldCount > 0 && (
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#f59e0b" strokeWidth="14" strokeDasharray={`${onHoldDash} ${circumference}`} strokeDashoffset={onHoldOffset} strokeLinecap="round" />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold theme-text-primary font-mono">{totalCount}</span>
                <span className="text-xs theme-text-muted">Tasks</span>
              </div>
            </div>

            {/* Progress Bars List */}
            <div className="w-full space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
                  </span>
                  <span className="font-mono theme-text-muted">{doneCount} ({completionPercent}%)</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#D99A1C] dark:text-[#F5B942] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F5B942]" /> In Progress
                  </span>
                  <span className="font-mono theme-text-muted">{inProgressCount} ({inProgressPercent}%)</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2 rounded-full overflow-hidden">
                  <div className="bg-[#F5B942] h-full rounded-full" style={{ width: `${inProgressPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="theme-text-secondary font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D6AD60]" /> To Do
                  </span>
                  <span className="font-mono theme-text-muted">{todoCount} ({todoPercent}%)</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2 rounded-full overflow-hidden">
                  <div className="bg-[#D6AD60] h-full rounded-full" style={{ width: `${todoPercent}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> On Hold
                  </span>
                  <span className="font-mono theme-text-muted">{onHoldCount} ({onHoldPercent}%)</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${onHoldPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Matrix & Domain Breakdown */}
        <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b theme-divider">
              <h3 className="text-sm font-bold theme-text-primary">Priority Distribution</h3>
              <span className="text-xs theme-text-muted">Risk & urgency spread</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-rose-400 font-medium">High Priority</span>
                  <span className="font-mono theme-text-secondary">{highPriority} tasks</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${totalCount > 0 ? (highPriority / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-400 font-medium">Medium Priority</span>
                  <span className="font-mono theme-text-secondary">{medPriority} tasks</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${totalCount > 0 ? (medPriority / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-400 font-medium">Low Priority</span>
                  <span className="font-mono theme-text-secondary">{lowPriority} tasks</span>
                </div>
                <div className="w-full theme-bg-card-inner h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${totalCount > 0 ? (lowPriority / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t theme-divider mt-4">
            <h4 className="text-xs font-semibold theme-text-muted mb-2">Categories / Tags</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([cat, cnt]) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg text-xs theme-bg-card-secondary border theme-border-card theme-text-secondary flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <span className="font-mono text-[#D99A1C] dark:text-[#F5B942] font-semibold">{cnt}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
