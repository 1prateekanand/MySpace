import React, { useState } from 'react';
import { X, Folder, Palette } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: string | null;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  parentId,
}) => {
  const { addFolder, currentFolderId } = useMySpace();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');

  if (!isOpen) return null;

  const colorOptions = [
    '#eab308', // yellow / gold folder default
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#10b981', // emerald
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addFolder(name.trim(), parentId !== undefined ? parentId : currentFolderId, color);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 border-b theme-divider flex items-center justify-between theme-bg-card-secondary">
          <h3 className="text-base font-semibold theme-text-primary">Create New Folder</h3>
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
              Folder Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. System Design, Research, Finance"
              className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-secondary mb-1.5">
              Folder Color Tag
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-[#F5B942] shadow-md' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
