import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
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
  Pause,
  AlertCircle
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
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'medium':
      return 'bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border-[#F5B942]/30';
    case 'low':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
};

const getCategoryTagStyle = () => {
  return 'theme-bg-card-inner theme-text-secondary border theme-border-card';
};

// Pure Task Card View for standard display & drag overlay
interface TaskCardViewProps {
  task: TaskItem;
  onSelectTask?: (task: TaskItem) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
  dragHandleProps?: Record<string, any>;
}

const TaskCardView: React.FC<TaskCardViewProps> = ({
  task,
  onSelectTask,
  isOverlay = false,
  isDragging = false,
  dragHandleProps = {},
}) => {
  return (
    <div
      onClick={() => onSelectTask && onSelectTask(task)}
      className={`group theme-bg-card-secondary hover:theme-bg-card-inner border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer relative select-none ${
        isOverlay
          ? 'border-[#F5B942] ring-2 ring-[#F5B942]/60 shadow-2xl scale-102 rotate-1 theme-bg-card z-50 cursor-grabbing'
          : isDragging
          ? 'opacity-25 border-dashed border-[#F5B942]/70'
          : 'theme-border-card hover:border-[#F5B942]/60 hover:shadow-md'
      }`}
    >
      {/* Top Row: Title & Drag Handle */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-start gap-2">
          {task.status === 'done' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : task.priority === 'high' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          ) : null}
          <h4 className="text-xs font-bold theme-text-primary group-hover:text-[#F5B942] leading-snug">
            {task.title}
          </h4>
        </div>
        <button
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className="theme-text-muted hover:text-[#F5B942] cursor-grab active:cursor-grabbing p-1 rounded-md hover:theme-bg-card-hover shrink-0 focus:outline-none transition-colors"
          title="Drag to move"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Optional short description snippet */}
      {task.description && (
        <p className="text-[11px] theme-text-muted line-clamp-2 mb-2.5 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks mini checklist progress if any */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[10px] theme-text-muted mb-1">
            <span>Checklist</span>
            <span className="font-mono">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div className="w-full theme-bg-card h-1 rounded-full overflow-hidden">
            <div
              className="bg-[#F5B942] h-full rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Row: Tags & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-2 theme-divider border-t text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full font-semibold capitalize border ${getPriorityStyle(
              task.priority
            )}`}
          >
            {task.priority}
          </span>

          {task.projectCode && (
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-[#F5B942]/10 border border-[#F5B942]/30 text-[#D99A1C] dark:text-[#F5B942]">
              {task.projectCode}
            </span>
          )}

          {task.categoryTag && !task.projectCode && (
            <span
              className={`px-2 py-0.5 rounded-full font-medium border ${getCategoryTagStyle()}`}
            >
              {task.categoryTag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {task.dueDate && (
            <div className="flex items-center gap-1 theme-text-muted text-[10px] whitespace-nowrap">
              <Calendar className="w-3 h-3 theme-text-muted" />
              <span>{task.dueDate}</span>
            </div>
          )}

          {task.status === 'on_hold' && (
            <div
              className="w-4 h-4 rounded-full bg-[#F5B942]/15 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942]"
              title="On Hold"
            >
              <Pause className="w-2 h-2 fill-current" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sortable Task Card Component using useSortable
interface SortableTaskCardProps {
  task: TaskItem;
  onSelectTask: (task: TaskItem) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onSelectTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCardView
        task={task}
        onSelectTask={onSelectTask}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

// Droppable Column Component with Fixed Height & Independent Vertical Scrolling
interface DroppableColumnProps {
  id: TaskStatus;
  title: string;
  icon: React.ReactNode;
  headerColor: string;
  columnBorderColor: string;
  tasks: TaskItem[];
  isHighlighted: boolean;
  onSelectTask: (task: TaskItem) => void;
  onOpenAddTask: (status: TaskStatus) => void;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  id,
  title,
  icon,
  headerColor,
  columnBorderColor,
  tasks,
  isHighlighted,
  onSelectTask,
  onOpenAddTask,
}) => {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`theme-bg-card border rounded-2xl flex flex-col h-full min-h-0 shadow-sm transition-all duration-150 ${columnBorderColor} ${
        isHighlighted
          ? 'ring-2 ring-[#F5B942] bg-[#F5B942]/10 border-[#F5B942] shadow-lg shadow-[#F5B942]/15 scale-[1.01]'
          : ''
      }`}
    >
      {/* 1. Column Header (Fixed at top, never scrolls away) */}
      <div className="shrink-0 p-4 pb-3 theme-divider border-b flex items-center justify-between theme-bg-card-secondary rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className={`text-sm font-bold tracking-tight ${headerColor}`}>{title}</h3>
          <span className="text-xs font-mono font-semibold theme-text-primary px-2 py-0.5 rounded-full theme-bg-card border theme-border-card shadow-xs">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onOpenAddTask(id)}
          className="p-1 rounded-lg theme-text-muted hover:text-[#F5B942] hover:theme-bg-card transition-colors cursor-pointer"
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Task Cards Container (Independent Vertical Scrolling) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="h-full min-h-[140px] border-2 border-dashed theme-border-card rounded-xl flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xs font-medium theme-text-muted mb-1">No tasks in {title}</span>
              <span className="text-[11px] theme-text-muted/70">Drag tasks here or click + below</span>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onSelectTask={onSelectTask} />
            ))
          )}
        </SortableContext>
      </div>

      {/* 3. Column Footer (Fixed at bottom, always accessible) */}
      <div className="shrink-0 p-3 pt-2.5 theme-divider border-t theme-bg-card-secondary rounded-b-2xl">
        <button
          onClick={() => onOpenAddTask(id)}
          className="w-full py-2 px-3 rounded-xl border border-dashed theme-border-card hover:border-[#F5B942]/70 theme-text-muted hover:text-[#D99A1C] dark:hover:text-[#F5B942] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all theme-bg-card hover:theme-bg-card-hover cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onSelectTask,
  onOpenAddTask,
}) => {
  const { tasks, activeDashboardId, moveTask } = useMySpace();
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
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
  }[] = [
    {
      id: 'todo',
      title: 'To Do',
      icon: <Circle className="w-4 h-4 text-slate-400 stroke-[2.2]" />,
      headerColor: 'theme-text-primary',
      columnBorderColor: 'theme-border-card',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: (
        <div className="w-4 h-4 rounded-full border-2 border-[#D99A1C] dark:border-[#F5B942] border-t-transparent animate-spin duration-1000" />
      ),
      headerColor: 'theme-text-primary',
      columnBorderColor: 'border-[#F5B942]/35',
    },
    {
      id: 'done',
      title: 'Done',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.2]" />,
      headerColor: 'theme-text-primary',
      columnBorderColor: 'border-emerald-500/30',
    },
    {
      id: 'on_hold',
      title: 'On Hold',
      icon: <PauseCircle className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
      headerColor: 'theme-text-primary',
      columnBorderColor: 'border-[#F5B942]/30',
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = currentTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setOverStatus(task.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverStatus(null);
      return;
    }

    const overId = String(over.id);

    // Direct column hit
    const isColumn = columns.some((c) => c.id === overId);
    if (isColumn) {
      setOverStatus(overId as TaskStatus);
      return;
    }

    // Over a task in a column
    const overTask = currentTasks.find((t) => t.id === overId);
    if (overTask) {
      setOverStatus(overTask.status);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverStatus(null);

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
      collisionDetection={pointerWithin || closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch h-full min-h-0">
        {columns.map((column) => {
          const columnTasks = currentTasks
            .filter((t) => t.status === column.id)
            .sort((a, b) => a.order - b.order);

          const isHighlighted = Boolean(
            activeTask && overStatus === column.id
          );

          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              headerColor={column.headerColor}
              columnBorderColor={column.columnBorderColor}
              tasks={columnTasks}
              isHighlighted={isHighlighted}
              onSelectTask={onSelectTask}
              onOpenAddTask={onOpenAddTask}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="w-72">
            <TaskCardView task={activeTask} isOverlay={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
