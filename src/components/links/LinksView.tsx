import React, { useState } from 'react';
import {
  Plus,
  LayoutGrid,
  TrendingUp,
  Newspaper,
  Cpu,
  Code2,
  BookOpen,
  Youtube,
  Folder,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  GripVertical
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { BookmarkLink, LinkCategory } from '../../types';
import { AddEditLinkModal } from './AddEditLinkModal';
import { AddEditCategoryModal } from './AddEditCategoryModal';

export const LinksView: React.FC = () => {
  const {
    categories,
    links,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    deleteLink,
    togglePinLink,
    trackLinkClick,
    deleteCategory,
    updateLink,
  } = useMySpace();

  // Modals state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<BookmarkLink | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<LinkCategory | null>(null);

  const [activeCategoryMenuId, setActiveCategoryMenuId] = useState<string | null>(null);

  // Drag and drop state for links
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);

  const getCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Newspaper': return <Newspaper className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Code2': return <Code2 className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Youtube': return <Youtube className={className} />;
      default: return <Folder className={className} />;
    }
  };

  // Filter categories to display
  const displayedCategories = selectedCategoryFilter === 'all'
    ? categories
    : categories.filter(c => c.id === selectedCategoryFilter);

  const handleOpenAddLink = (catId?: string) => {
    setTargetCategoryId(catId || (categories[0]?.id ?? ''));
    setLinkToEdit(null);
    setIsAddLinkOpen(true);
  };

  const handleOpenEditLink = (e: React.MouseEvent, link: BookmarkLink) => {
    e.stopPropagation();
    setLinkToEdit(link);
    setIsAddLinkOpen(true);
  };

  const handleDeleteLink = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this bookmark?')) {
      deleteLink(id);
    }
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    togglePinLink(id);
  };

  const handleLinkClick = (link: BookmarkLink) => {
    trackLinkClick(link.id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    setDraggedLinkId(linkId);
    e.dataTransfer.setData('text/plain', linkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnCategory = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    const linkId = e.dataTransfer.getData('text/plain') || draggedLinkId;
    if (linkId) {
      updateLink(linkId, { categoryId });
      setDraggedLinkId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Category Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'all'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-500/40'
                : 'bg-[#161c2e] text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Links</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-500/40'
                    : 'bg-[#161c2e] text-slate-400 hover:text-slate-200 border border-slate-700/60 hover:bg-slate-800/60'
                }`}
              >
                <span style={{ color: isSelected ? '#ffffff' : cat.color }}>
                  {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setCategoryToEdit(null);
              setIsAddCategoryOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-[#161c2e]/60 hover:bg-[#161c2e] border border-dashed border-slate-700 hover:border-slate-500 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Primary Add Link Button */}
        <button
          onClick={() => handleOpenAddLink()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Link</span>
        </button>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedCategories.map((category) => {
          const categoryLinks = links.filter((l) => l.categoryId === category.id);
          const isMenuOpen = activeCategoryMenuId === category.id;

          return (
            <div
              key={category.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnCategory(e, category.id)}
              className="bg-[#131929] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Category Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/10"
                      style={{ backgroundColor: `${category.color}25`, color: category.color }}
                    >
                      {getCategoryIcon(category.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {category.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {categoryLinks.length} {categoryLinks.length === 1 ? 'link' : 'links'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveCategoryMenuId(isMenuOpen ? null : category.id)
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-[#1a2238] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 animate-in fade-in-50 zoom-in-95">
                        <button
                          onClick={() => {
                            setActiveCategoryMenuId(null);
                            handleOpenAddLink(category.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-400" />
                          Add Link Here
                        </button>
                        <button
                          onClick={() => {
                            setActiveCategoryMenuId(null);
                            setCategoryToEdit(category);
                            setIsAddCategoryOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          Edit Category
                        </button>
                        <button
                          onClick={() => {
                            setActiveCategoryMenuId(null);
                            if (confirm(`Delete category "${category.name}" and all its links?`)) {
                              deleteCategory(category.id);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          Delete Category
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bookmark Tiles Grid */}
                <div className="pt-4 grid grid-cols-4 gap-2.5 min-h-[140px] content-start">
                  {categoryLinks.length === 0 ? (
                    <div className="col-span-4 py-8 text-center text-xs text-slate-500">
                      No links in this category yet.
                      <div className="mt-2">
                        <button
                          onClick={() => handleOpenAddLink(category.id)}
                          className="text-purple-400 hover:underline text-xs inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add first link
                        </button>
                      </div>
                    </div>
                  ) : (
                    categoryLinks.map((link) => (
                      <div
                        key={link.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, link.id)}
                        onClick={() => handleLinkClick(link)}
                        className="relative group/tile flex flex-col items-center p-2 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-700/60 text-center"
                      >
                        {/* Hover Quick Action Buttons */}
                        <div className="absolute -top-1.5 -right-1.5 hidden group-hover/tile:flex items-center gap-0.5 z-20 bg-slate-900 border border-slate-700 rounded-md p-0.5 shadow-lg">
                          <button
                            onClick={(e) => handleTogglePin(e, link.id)}
                            title={link.pinned ? 'Unpin' : 'Pin'}
                            className="p-1 hover:text-amber-400 text-slate-400"
                          >
                            <Star
                              className={`w-3 h-3 ${link.pinned ? 'text-amber-400 fill-amber-400' : ''}`}
                            />
                          </button>
                          <button
                            onClick={(e) => handleOpenEditLink(e, link)}
                            title="Edit"
                            className="p-1 hover:text-blue-400 text-slate-400"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteLink(e, link.id)}
                            title="Delete"
                            className="p-1 hover:text-rose-400 text-slate-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Favicon / Tile Logo Box */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md ring-1 ring-white/10 transition-transform group-hover/tile:scale-105 overflow-hidden"
                          style={{ backgroundColor: link.iconBg || '#1e293b' }}
                        >
                          {link.favicon ? (
                            <img
                              src={link.favicon}
                              alt={link.title}
                              className="w-7 h-7 object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="tracking-tight">{link.iconLetter || link.title.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>

                        {/* Website Name */}
                        <span className="mt-2 text-xs font-medium text-slate-300 group-hover/tile:text-purple-300 truncate w-full">
                          {link.title}
                        </span>

                        {/* Pinned Indicator */}
                        {link.pinned && (
                          <div className="absolute top-1 left-1 text-[9px] text-amber-400 group-hover/tile:hidden">
                            ★
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Link Footer inside Card */}
              <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">Drag to organize</span>
                <button
                  onClick={() => handleOpenAddLink(category.id)}
                  className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 text-[11px] font-medium"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddEditLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        linkToEdit={linkToEdit}
        defaultCategoryId={targetCategoryId}
      />

      <AddEditCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
};
