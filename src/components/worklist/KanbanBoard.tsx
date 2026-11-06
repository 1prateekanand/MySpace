import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Circle,
  CheckCircle2,
  PauseCircle,
  Plus,
  GripVertical,
  Calendar,
  Pause
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskStatus } from '../../types';

interface KanbanBoardProps {
  onSelectTask: (task: TaskItem) => void;
  onOpenAddTask: (defaultStatus: TaskStatus) => void;
}

const getPriorityStyle = (priority: TaskItem['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
    case 'medium':
      return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    case 'low':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
  }
};

const getCategoryTagStyle = (tag?: string) => {
  switch (tag?.toLowerCase()) {
    case 'trading':
      return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40';
    case 'backend':
      return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
    case 'frontend':
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    case 'devops':
      return 'bg-sky-950/80 text-sky-300 border-sky-500/40';
    case 'ai/ml':
      return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
    case 'data':
      return 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

// Sortable Task Card Component
interface SortableTaskCardProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
  isOverlay?: boolean;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onSelectTask,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectTask(task)}
      className={`group bg-[#161c2e] hover:bg-[#1a233a] border rounded-xl p-3.5 shadow-md transition-all cursor-pointer relative select-none ${
        isOverlay
          ? 'border-purple-400 ring-2 ring-purple-500/50 shadow-2xl shadow-purple-900/50 scale-105 rotate-1 bg-[#1c2238] z-50'
          : isDragging
          ? 'opacity-30 border-purple-500/40'
          : 'border-slate-800/90 hover:border-purple-500/50 hover:shadow-purple-900/20'
      }`}
    >
      {/* Top Row: Title & Drag Handle */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {task.status === 'done' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 leading-snug">
            {task.title}
          </h4>
        </div>
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="text-slate-500 group-hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0 focus:outline-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtasks mini progress if any */}
      {task.subtasks.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Checklist</span>
            <span className="font-mono">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Row: Tags & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full font-semibold capitalize border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>

          {task.categoryTag && (
            <span
              className={`px-2 py-0.5 rounded-full font-medium border ${getCategoryTagStyle(
                task.categoryTag
              )}`}
            >
              {task.categoryTag}
            </span>
          )}
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-slate-400 text-[10px] whitespace-nowrap shrink-0">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{task.dueDate}</span>
          </div>
        )}

        {task.status === 'on_hold' && (
          <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Pause className="w-2.5 h-2.5 fill-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
};

// Droppable Column Component
interface DroppableColumnProps {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  headerColor: string;
  columnBorderColor: string;
  columnGlow: string;
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
  onOpenAddTask: (status: TaskStatus) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  title,
  icon,
  headerColor,
  columnBorderColor,
  columnGlow,
  tasks,
  onSelectTask,
  onOpenAddTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-[#131929] border rounded-2xl p-4 flex flex-col min-h-[460px] transition-all duration-150 ${columnBorderColor} ${columnGlow} ${
        isOver ? 'ring-2 ring-purple-500 bg-purple-950/20 scale-[1.01]' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className={`text-sm font-bold tracking-tight ${headerColor}`}>{title}</h3>
          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/60">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onOpenAddTask(id)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Add task to column"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Container */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[120px]">
          {tasks.length === 0 ? (
            <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-500">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onSelectTask={onSelectTask} />
            ))
          )}
        </div>
      </SortableContext>

      {/* Bottom Add Task Button */}
      <button
        onClick={() => onOpenAddTask(id)}
        className="mt-3 w-full py-2 px-3 rounded-xl border border-dashed border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-purple-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors bg-slate-900/40 hover:bg-slate-800/40"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectTask,
  onOpenAddTask,
}) => {
  const { tasks, activeDashboardId, moveTask } = useMySpace();
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const currentTasks = tasks.filter((t) => t.dashboardId === activeDashboardId);

  const columns: {
    id: TaskStatus;
    title: string;
    icon: React.ReactNode;
    headerColor: string;
    columnBorderColor: string;
    columnGlow: string;
  }[] = [
    {
      id: 'todo',
      title: 'To Do',
      icon: <Circle className="w-4 h-4 text-slate-400 stroke-[2.2]" />,
      headerColor: 'text-slate-300',
      columnBorderColor: 'border-slate-800/90',
      columnGlow: 'hover:border-slate-700',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: (
        <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin duration-1000" />
      ),
      headerColor: 'text-blue-300',
      columnBorderColor: 'border-blue-900/40 bg-blue-950/10',
      columnGlow: 'hover:border-blue-600/60 ring-1 ring-blue-500/20',
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.2]" />,
      headerColor: 'text-emerald-300',
      columnBorderColor: 'border-emerald-900/40 bg-emerald-950/10',
      columnGlow: 'hover:border-emerald-600/60 ring-1 ring-emerald-500/20',
    },
    {
      id: 'on_hold',
      title: 'On Hold',
      icon: <PauseCircle className="w-4 h-4 text-amber-400 stroke-[2.2]" />,
      headerColor: 'text-amber-300',
      columnBorderColor: 'border-amber-900/40 bg-amber-950/10',
      columnGlow: 'hover:border-amber-600/60 ring-1 ring-amber-500/20',
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = currentTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const task = currentTasks.find((t) => t.id === activeId);
    if (!task) return;

    // Check if dropped directly onto a column container
    const isColumn = columns.some((c) => c.id === overId);
    if (isColumn) {
      const targetStatus = overId as TaskStatus;
      if (task.status !== targetStatus) {
        moveTask(activeId, targetStatus);
      }
      return;
    }

    // Otherwise dropped over another task
    const overTask = currentTasks.find((t) => t.id === overId);
    if (overTask) {
      const targetStatus = overTask.status;
      const targetTasks = currentTasks
        .filter((t) => t.status === targetStatus)
        .sort((a, b) => a.order - b.order);
      const targetIndex = targetTasks.findIndex((t) => t.id === overId);
      moveTask(activeId, targetStatus, targetIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((column) => {
          const columnTasks = currentTasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.order - b.order);

          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              headerColor={column.headerColor}
              columnBorderColor={column.columnBorderColor}
              columnGlow={column.columnGlow}
              tasks={columnTasks}
              onSelectTask={onSelectTask}
              onOpenAddTask={onOpenAddTask}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <SortableTaskCard task={activeTask} onSelectTask={() => {}} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
