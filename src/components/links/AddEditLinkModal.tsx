import React, { useState, useEffect } from 'react';
import { X, Link2, Globe, Tag, Star } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { BookmarkLink } from '../../types';

interface AddEditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit?: BookmarkLink | null;
  defaultCategoryId?: string;
}

export const AddEditLinkModal: React.FC<AddEditLinkModalProps> = ({
  isOpen,
  onClose,
  linkToEdit,
  defaultCategoryId,
}) => {
  const { categories, addLink, updateLink } = useMySpace();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pinned, setPinned] = useState(false);
  const [notes, setNotes] = useState('');
  const [customIconBg, setCustomIconBg] = useState('#1e293b');

  useEffect(() => {
    if (linkToEdit) {
      setTitle(linkToEdit.title);
      setUrl(linkToEdit.url);
      setCategoryId(linkToEdit.categoryId);
      setPinned(!!linkToEdit.pinned);
      setNotes(linkToEdit.notes || '');
      setCustomIconBg(linkToEdit.iconBg || '#1e293b');
    } else {
      setTitle('');
      setUrl('');
      setCategoryId(defaultCategoryId || (categories[0]?.id ?? ''));
      setPinned(false);
      setNotes('');
      setCustomIconBg('#1e293b');
    }
  }, [linkToEdit, defaultCategoryId, categories, isOpen]);

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !categoryId) return;
    setErrorMessage('');

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (linkToEdit) {
      const ok = await updateLink(linkToEdit.id, {
        title: title.trim(),
        url: formattedUrl,
        categoryId,
        pinned,
        notes: notes.trim(),
        iconBg: customIconBg,
      });
      if (!ok) {
        setErrorMessage('Failed to update bookmark or URL already exists.');
        return;
      }
      onClose();
    } else {
      const res = await addLink({
        title: title.trim(),
        url: formattedUrl,
        categoryId,
        pinned,
        notes: notes.trim(),
        iconBg: customIconBg,
      });

      if (!res.success && res.error) {
        setErrorMessage(res.error);
        return;
      }
      onClose();
    }
  };

  const bgOptions = ['#1e293b', '#0f172a', '#1e1b4b', '#022c22', '#311025', '#172554'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942]">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold theme-text-primary">
              {linkToEdit ? 'Edit Bookmark Link' : 'Add New Bookmark Link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1">
              Website Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TradingView, GitHub, ChatGPT"
              className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1">
              Destination URL *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-9 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942]"
              />
              <Globe className="w-4 h-4 theme-text-muted absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1">
              Category *
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-sm theme-text-primary focus:outline-none focus:border-[#F5B942]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="theme-bg-card theme-text-primary">
                    {c.name}
                  </option>
                ))}
              </select>
              <Tag className="w-4 h-4 theme-text-muted absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold theme-text-primary mb-1.5">
              Tile Badge Accent
            </label>
            <div className="flex items-center gap-2">
              {['#14120E', '#1A1711', '#241D12', '#3A2D19', '#F5B942', '#1e293b'].map((bg) => (
                <button
                  type="button"
                  key={bg}
                  onClick={() => setCustomIconBg(bg)}
                  style={{ backgroundColor: bg }}
                  className={`w-7 h-7 rounded-lg border transition-all ${
                    customIconBg === bg
                      ? 'border-[#F5B942] ring-2 ring-[#F5B942]/40 scale-110'
                      : 'border-white/10 hover:border-[#F5B942]/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium theme-text-secondary">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded theme-border-card text-[#F5B942] focus:ring-[#F5B942]"
              />
              <span className="flex items-center gap-1.5">
                <Star className={`w-3.5 h-3.5 ${pinned ? 'text-[#F5B942] fill-[#F5B942]' : 'theme-text-muted'}`} />
                Pin to Favourites
              </span>
            </label>
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
              className="gold-btn px-4 py-2 text-xs font-semibold rounded-xl shadow-md cursor-pointer"
            >
              {linkToEdit ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
