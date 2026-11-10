import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  Copy,
  Check,
  LayoutGrid,
  Filter,
  Sparkles
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { BookmarkLink, LinkCategory } from '../../types';
import { LinkTile } from './LinkTile';
import { getCategoryIcon } from './CategoryCard';

interface CategoryDetailViewProps {
  category: LinkCategory;
  links: BookmarkLink[];
  onBackToAll: () => void;
  onAddLink: (categoryId: string) => void;
  onEditCategory: (category: LinkCategory) => void;
  onOpenLink: (link: BookmarkLink) => void;
  onTogglePinLink: (e: React.MouseEvent, id: string) => void;
  onCopyLinkUrl: (e: React.MouseEvent, link: BookmarkLink) => void;
  onEditLink: (e: React.MouseEvent, link: BookmarkLink) => void;
  onDeleteLink: (e: React.MouseEvent, link: BookmarkLink) => void;
  onReorderLinks: (categoryId: string, reorderedLinks: BookmarkLink[]) => void;
  copiedLinkId: string | null;
}

export const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
  category,
  links,
  onBackToAll,
  onAddLink,
  onEditCategory,
  onOpenLink,
  onTogglePinLink,
  onCopyLinkUrl,
  onEditLink,
  onDeleteLink,
  onReorderLinks,
  copiedLinkId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const filteredLinks = links.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.title.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  });

  const activeLink = links.find((l) => l.id === activeLinkId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLinkId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLinkId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updated = [...links];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      onReorderLinks(category.id, updated);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col space-y-4 animate-in fade-in-50 duration-200">
      {/* Top Navigation & Category Header Banner (Fixed) */}
      <div className="shrink-0 theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow with category accent */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: category.color || '#F5B942' }}
        />

        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToAll}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card text-xs font-semibold theme-text-secondary hover:theme-text-primary transition-all cursor-pointer shadow-xs group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Links</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditCategory(category)}
              className="px-3 py-1.5 rounded-xl theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card text-xs font-medium theme-text-muted hover:theme-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Category</span>
            </button>
            <button
              onClick={() => onAddLink(category.id)}
              className="gold-btn px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Category Identity Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] border theme-border-card theme-bg-card-secondary shadow-md shrink-0"
              style={{ borderColor: `${category.color || '#F5B942'}40` }}
            >
              {getCategoryIcon(category.icon, 'w-7 h-7')}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold theme-text-primary tracking-tight">
                  {category.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/30">
                  {links.length} {links.length === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </div>
              <p className="text-xs theme-text-muted mt-1">
                Drag tiles horizontally or vertically to reorder. Click any bookmark to visit.
              </p>
            </div>
          </div>

          {/* Search inside this category */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${category.name}...`}
              className="w-full pl-8 pr-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:border-[#F5B942] shadow-xs"
            />
            <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* Main Links Grid with Drag-and-Drop (Scrollable) */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin || closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 overflow-y-auto theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl custom-scrollbar">
          <SortableContext items={filteredLinks.map((l) => l.id)} strategy={rectSortingStrategy}>
            {filteredLinks.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl theme-bg-card-secondary border theme-border-card flex items-center justify-center text-theme-muted mb-3">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold theme-text-primary mb-1">
                  {searchQuery ? 'No bookmarks match your query' : `No bookmarks in ${category.name} yet`}
                </h3>
                <p className="text-xs theme-text-muted max-w-sm mb-4">
                  {searchQuery
                    ? 'Try searching with another keyword.'
                    : 'Add frequently accessed applications, developer tools, or websites.'}
                </p>
                <button
                  onClick={() => onAddLink(category.id)}
                  className="gold-btn px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Bookmark</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {filteredLinks.map((link) => (
                  <LinkTile
                    key={link.id}
                    link={link}
                    onOpen={onOpenLink}
                    onTogglePin={onTogglePinLink}
                    onCopyUrl={onCopyLinkUrl}
                    onEdit={onEditLink}
                    onDelete={onDeleteLink}
                    copied={copiedLinkId === link.id}
                    isCompact={false}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLink ? (
            <div className="w-24">
              <LinkTile
                link={activeLink}
                onOpen={() => {}}
                onTogglePin={() => {}}
                onCopyUrl={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                isOverlay={true}
                isCompact={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
