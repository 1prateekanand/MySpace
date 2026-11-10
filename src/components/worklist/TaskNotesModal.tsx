import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Copy } from 'lucide-react';
import { TaskItem } from '../../types';

interface TaskNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSaveNotes: (taskId: string, notes: string) => void;
}

export const TaskNotesModal: React.FC<TaskNotesModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveNotes,
}) => {
  const [notesContent, setNotesContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (task) {
      setNotesContent(task.notes || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveNotes(task.id, notesContent);
    onClose();
  };

  const handleCopy = () => {
    if (notesContent) {
      navigator.clipboard.writeText(notesContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-lg theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B942]/15 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary">
                Task Notes
              </h3>
              <p className="text-xs theme-text-muted truncate max-w-[280px]">
                {task.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {notesContent && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card transition-colors text-xs flex items-center gap-1"
                title="Copy notes"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body with Multiline Editor */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 p-5 space-y-4">
          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-xs font-semibold theme-text-secondary block mb-1.5">
              Detailed Notes & Documentation
            </label>
            <textarea
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              placeholder="Write multiline notes, checklist items, research findings, or implementation details..."
              rows={10}
              className="w-full flex-1 p-3.5 rounded-xl theme-bg-card-inner border theme-border-card theme-text-primary text-xs leading-relaxed focus:outline-none focus:border-[#F5B942] resize-none whitespace-pre-wrap font-sans"
              autoFocus
            />
            <div className="flex items-center justify-between text-[11px] theme-text-muted pt-2 px-1">
              <span>Supports line breaks & multiline text</span>
              <span>{notesContent.length} characters</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 theme-divider border-t shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs theme-text-muted hover:theme-text-primary theme-bg-card-secondary hover:theme-bg-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl gold-btn text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Save Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
