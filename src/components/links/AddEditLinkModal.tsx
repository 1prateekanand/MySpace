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

  if (!isOpen) return null;

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !categoryId) return;
    setErrorMessage('');

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (linkToEdit) {
      await updateLink(linkToEdit.id, {
        title: title.trim(),
        url: formattedUrl,
        categoryId,
        pinned,
        notes: notes.trim(),
        iconBg: customIconBg,
      });
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
      <div className="w-full max-w-md bg-[#131929] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="px-5 py-4 border-b border-slate-700/70 flex items-center justify-between bg-[#161c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {linkToEdit ? 'Edit Bookmark Link' : 'Add New Bookmark Link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Website Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TradingView, GitHub, ChatGPT"
              className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Destination URL *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full pl-9 pr-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Category *
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tile Badge Accent
            </label>
            <div className="flex items-center gap-2">
              {bgOptions.map((bg) => (
                <button
                  type="button"
                  key={bg}
                  onClick={() => setCustomIconBg(bg)}
                  style={{ backgroundColor: bg }}
                  className={`w-7 h-7 rounded-lg border transition-all ${
                    customIconBg === bg
                      ? 'border-purple-400 ring-2 ring-purple-500/40 scale-110'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
              />
              <span className="flex items-center gap-1.5">
                <Star className={`w-3.5 h-3.5 ${pinned ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                Pin to Favourites
              </span>
            </label>
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
              {linkToEdit ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
