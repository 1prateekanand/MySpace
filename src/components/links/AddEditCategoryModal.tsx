import React, { useState, useEffect } from 'react';
import { X, Folder, TrendingUp, Newspaper, Cpu, Code2, BookOpen, Youtube, Sparkles, Music, Film, Gamepad2, ShoppingBag } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { LinkCategory } from '../../types';

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: LinkCategory | null;
}

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { addCategory, updateCategory } = useMySpace();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setSelectedIcon(categoryToEdit.icon);
      setSelectedColor(categoryToEdit.color);
    } else {
      setName('');
      setSelectedIcon('Folder');
      setSelectedColor('#8b5cf6');
    }
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const iconOptions = [
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Newspaper', icon: Newspaper },
    { name: 'Cpu', icon: Cpu },
    { name: 'Code2', icon: Code2 },
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Youtube', icon: Youtube },
    { name: 'Sparkles', icon: Sparkles },
    { name: 'Music', icon: Music },
    { name: 'Film', icon: Film },
    { name: 'Gamepad2', icon: Gamepad2 },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Folder', icon: Folder },
  ];

  const colorOptions = [
    '#10b981', // emerald
    '#ef4444', // red
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, name.trim(), selectedIcon, selectedColor);
    } else {
      addCategory(name.trim(), selectedIcon, selectedColor);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
          <h3 className="text-base font-semibold theme-text-primary">
            {categoryToEdit ? 'Edit Category' : 'Create Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Systems, Crypto, Gaming"
              className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1.5">
              Icon Symbol
            </label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map(({ name: iconName, icon: IconComponent }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    selectedIcon === iconName
                      ? 'bg-[#F5B942]/20 border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942] ring-2 ring-[#F5B942]/30'
                      : 'theme-bg-card-inner theme-border-card theme-text-muted hover:theme-text-primary hover:border-[#F5B942]/40'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    selectedColor === color
                      ? 'scale-125 ring-2 ring-[#F5B942] shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
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
              {categoryToEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
