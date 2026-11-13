import React, { useState, useEffect } from 'react';
import { X, FolderGit2, BookOpen, User, Rocket, Shield, Target } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { WorkDashboard } from '../../types';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardToEdit?: WorkDashboard | null;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  dashboardToEdit,
}) => {
  const { dashboards, addDashboard, updateDashboard, setActiveDashboardId } = useMySpace();

  const isEditing = Boolean(dashboardToEdit);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FolderGit2');
  const [errorMessage, setErrorMessage] = useState('');

  const icons = [
    { name: 'FolderGit2', icon: FolderGit2, label: 'Projects' },
    { name: 'BookOpen', icon: BookOpen, label: 'Learnings' },
    { name: 'User', icon: User, label: 'Personal' },
    { name: 'Rocket', icon: Rocket, label: 'Launches' },
    { name: 'Target', icon: Target, label: 'Goals' },
    { name: 'Shield', icon: Shield, label: 'Security' },
  ];

  useEffect(() => {
    if (isOpen) {
      if (dashboardToEdit) {
        setName(dashboardToEdit.name);
        setSelectedIcon(dashboardToEdit.icon || 'FolderGit2');
      } else {
        setName('');
        setSelectedIcon('FolderGit2');
      }
      setErrorMessage('');
    }
  }, [isOpen, dashboardToEdit]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setErrorMessage('Please enter a dashboard name.');
      return;
    }

    // Check for duplicate names (case-insensitive)
    const isDuplicate = dashboards.some(
      (d) =>
        d.id !== dashboardToEdit?.id &&
        d.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(`A dashboard named "${trimmed}" already exists.`);
      return;
    }

    if (isEditing && dashboardToEdit) {
      await updateDashboard(dashboardToEdit.id, {
        name: trimmed,
        icon: selectedIcon,
      });
      setActiveDashboardId(dashboardToEdit.id);
    } else {
      await addDashboard(trimmed, selectedIcon);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
          <h3 className="text-base font-semibold theme-text-primary">
            {isEditing ? 'Edit Dashboard' : 'Create New Dashboard'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1">
              Dashboard Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. Client Projects, Research Lab, Personal"
              className="w-full px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
            {errorMessage && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                {errorMessage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1.5">
              Dashboard Icon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {icons.map(({ name: iconKey, icon: IconComp, label }) => {
                const isSelected = selectedIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F5B942]/15 border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942] ring-1 ring-[#F5B942]/30 shadow-xs'
                        : 'theme-bg-card-inner theme-border-card theme-text-muted hover:theme-text-primary hover:border-[#F5B942]/40'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 theme-divider border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium theme-text-secondary hover:theme-text-primary theme-bg-card-secondary hover:theme-bg-card-hover rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-btn px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
