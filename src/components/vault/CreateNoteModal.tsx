import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string | null;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  folderId,
}) => {
  const { createNoteFile } = useMySpace();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createNoteFile(name.trim(), content, folderId);
    setName('');
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-lg theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 border-b theme-divider flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942]" />
            <h3 className="text-base font-semibold theme-text-primary">Create Note / Text Doc</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              File Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Architecture_Notes.md"
              className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1">
              Content / Notes
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes, meeting minutes, architecture details or code snippets here..."
              className="w-full px-3.5 py-2.5 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-secondary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942] font-mono leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t theme-divider">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium theme-text-muted hover:theme-text-primary theme-bg-card-inner border theme-border-card rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold gold-btn rounded-xl shadow-md transition-all"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
