import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Trash2,
  Send,
  Plus,
  Clock,
  User,
  Sliders,
  Flag
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const {
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    addComment,
    user,
  } = useMySpace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryTag, setCategoryTag] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [progress, setProgress] = useState(0);

  // New subtask and comment inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setCategoryTag(task.categoryTag || '');
      setProjectCode(task.projectCode || '');
      setDueDate(task.dueDate || '');
      setStartDate(task.startDate || '');
      setProgress(task.progress || 0);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      categoryTag: categoryTag.trim(),
      projectCode: projectCode.trim(),
      dueDate: dueDate.trim(),
      startDate: startDate.trim(),
      progress,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] theme-bg-card border theme-border-card rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 theme-text-primary">
        {/* Header */}
        <div className="px-6 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                status === 'done'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : status === 'in_progress'
                  ? 'bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/30'
                  : status === 'on_hold'
                  ? 'bg-[#D6AD60]/15 text-[#D6AD60] border border-[#D6AD60]/30'
                  : 'theme-bg-card-inner theme-text-secondary border theme-border-card'
              }`}
            >
              {status.replace('_', ' ')}
            </span>
            <span className="text-xs theme-text-muted">
              Task #{task.id.slice(-4)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg theme-text-muted hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold theme-text-muted mb-1 uppercase tracking-wider">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold theme-bg-card-inner border theme-border-card rounded-xl px-4 py-2.5 theme-text-primary focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
              >
                <option value="todo" className="theme-bg-card theme-text-primary">To Do</option>
                <option value="in_progress" className="theme-bg-card theme-text-primary">In Progress</option>
                <option value="done" className="theme-bg-card theme-text-primary">Done</option>
                <option value="on_hold" className="theme-bg-card theme-text-primary">On Hold</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
              >
                <option value="high" className="theme-bg-card theme-text-primary">High</option>
                <option value="medium" className="theme-bg-card theme-text-primary">Medium</option>
                <option value="low" className="theme-bg-card theme-text-primary">Low</option>
              </select>
            </div>

            {/* Category / Project Tag */}
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">
                Tag / Category
              </label>
              <input
                type="text"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="e.g. Backend, Trading"
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">
                Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Nov 10"
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
              />
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold theme-text-secondary mb-1">
              <span>Completion Progress</span>
              <span className="font-mono text-[#D99A1C] dark:text-[#F5B942]">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 theme-bg-card-secondary rounded-lg appearance-none cursor-pointer accent-[#F5B942]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold theme-text-muted mb-1 uppercase tracking-wider">
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, architectural notes, or links..."
              className="w-full px-3.5 py-2.5 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold theme-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                Subtasks Checklist ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
              </label>
            </div>

            <div className="space-y-1.5">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2.5 p-2 rounded-lg theme-bg-card-secondary border theme-border-card hover:border-[#F5B942]/40 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}}
                    className="rounded theme-border-card text-[#F5B942] focus:ring-[#F5B942]"
                  />
                  <span
                    className={`text-xs ${
                      st.completed ? 'line-through theme-text-muted' : 'theme-text-primary'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
              ))}

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a checklist step..."
                  className="flex-1 px-3 py-1.5 theme-bg-card-inner border theme-border-card rounded-lg text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 theme-bg-card-secondary hover:theme-bg-card-hover theme-text-primary text-xs font-medium rounded-lg transition-colors flex items-center gap-1 border theme-border-card cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>
          </div>

          {/* Comments & Activity Stream */}
          <div>
            <label className="text-xs font-semibold theme-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
              Activity & Comments ({task.comments.length})
            </label>

            <div className="space-y-2 mb-3">
              {task.comments.length === 0 ? (
                <p className="text-xs theme-text-muted italic">No comments yet.</p>
              ) : (
                task.comments.map((comm) => (
                  <div key={comm.id} className="p-3 theme-bg-card-secondary border theme-border-card rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#D99A1C] dark:text-[#F5B942]">{comm.userName}</span>
                      <span className="theme-text-muted">{comm.createdAt}</span>
                    </div>
                    <p className="text-xs theme-text-secondary">{comm.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment or status update..."
                className="flex-1 px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
              />
              <button
                type="submit"
                className="gold-btn px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 theme-bg-card-secondary theme-divider border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs theme-text-muted">
            <User className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
            <span>Assigned to {task.assignee.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium theme-text-secondary hover:theme-text-primary theme-bg-card hover:theme-bg-card-hover rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="gold-btn px-5 py-2 text-xs font-semibold rounded-xl shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
