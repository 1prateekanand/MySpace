import React, { useState } from 'react';
import { X, FolderGit2, BookOpen, User, Rocket, Shield, Target } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

interface NewDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDashboardModal: React.FC<NewDashboardModalProps> = ({ isOpen, onClose }) => {
  const { addDashboard } = useMySpace();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FolderGit2');

  if (!isOpen) return null;

  const icons = [
    { name: 'FolderGit2', icon: FolderGit2, label: 'Projects' },
    { name: 'BookOpen', icon: BookOpen, label: 'Learnings' },
    { name: 'User', icon: User, label: 'Personal' },
    { name: 'Rocket', icon: Rocket, label: 'Launches' },
    { name: 'Target', icon: Target, label: 'Goals' },
    { name: 'Shield', icon: Shield, label: 'Security' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addDashboard(name.trim(), selectedIcon);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#131929] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 border-b border-slate-700/70 flex items-center justify-between bg-[#161c2e]">
          <h3 className="text-base font-semibold text-white">Create New Dashboard</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dashboard Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client Projects, Research, Trading Lab"
              className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dashboard Icon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {icons.map(({ name: iconKey, icon: IconComp, label }) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setSelectedIcon(iconKey)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedIcon === iconKey
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                      : 'bg-[#0d121f] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-all"
            >
              Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
