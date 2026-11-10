import React, { useState } from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  Newspaper,
  Cpu,
  Code2,
  BookOpen,
  Youtube,
  Folder,
  ArrowRight
} from 'lucide-react';
import { BookmarkLink, LinkCategory } from '../../types';
import { LinkTile } from './LinkTile';

interface CategoryCardProps {
  category: LinkCategory;
  links: BookmarkLink[];
  isHighlighted?: boolean;
  onOpenCategory: (categoryId: string) => void;
  onAddLink: (categoryId: string) => void;
  onEditCategory: (category: LinkCategory) => void;
  onDeleteCategory: (category: LinkCategory) => void;
  onOpenLink: (link: BookmarkLink) => void;
  onTogglePinLink: (e: React.MouseEvent, id: string) => void;
  onCopyLinkUrl: (e: React.MouseEvent, link: BookmarkLink) => void;
  onEditLink: (e: React.MouseEvent, link: BookmarkLink) => void;
  onDeleteLink: (e: React.MouseEvent, link: BookmarkLink) => void;
  copiedLinkId: string | null;
  isOverlay?: boolean;
}

export const getCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
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

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  links,
  isHighlighted = false,
  onOpenCategory,
  onAddLink,
  onEditCategory,
  onDeleteCategory,
  onOpenLink,
  onTogglePinLink,
  onCopyLinkUrl,
  onEditLink,
  onDeleteLink,
  copiedLinkId,
  isOverlay = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Category card sortable
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isCardDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
      category,
    },
    disabled: isOverlay,
  });

  // Category droppable for accepting links
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `category-droppable-${category.id}`,
    data: {
      type: 'category-drop-target',
      categoryId: category.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const setCombinedRef = (node: HTMLElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`theme-bg-card border rounded-2xl shadow-xl transition-all flex flex-col h-[370px] select-none relative overflow-hidden ${
        isOverlay
          ? 'border-[#F5B942] ring-2 ring-[#F5B942]/60 shadow-2xl scale-102 rotate-1 theme-bg-card z-50 cursor-grabbing'
          : isCardDragging
          ? 'opacity-25 border-dashed border-[#F5B942]/70'
          : isOver || isHighlighted
          ? 'border-[#F5B942] ring-2 ring-[#F5B942]/50 bg-[#F5B942]/5 shadow-lg shadow-[#F5B942]/10 scale-[1.01]'
          : 'theme-border-card hover:border-[#F5B942]/40 hover:shadow-2xl'
      }`}
    >
      {/* 1. Category Header (Fixed at top, never scrolls) */}
      <div className="shrink-0 p-4 pb-3 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Dedicated Category Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded-md theme-text-muted hover:text-[#F5B942] cursor-grab active:cursor-grabbing hover:theme-bg-card transition-colors shrink-0 focus:outline-none"
            title="Drag to rearrange category"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {/* Category Icon */}
          <div
            onClick={() => onOpenCategory(category.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] shadow-xs theme-border-card border theme-bg-card shrink-0 cursor-pointer hover:border-[#F5B942]/50 transition-colors"
            title={`Open ${category.name} full page`}
          >
            {getCategoryIcon(category.icon, 'w-4 h-4')}
          </div>

          {/* Title & Count (Clickable -> Opens full page) */}
          <div
            onClick={() => onOpenCategory(category.id)}
            className="cursor-pointer min-w-0 group/title"
            title={`Open ${category.name} full page`}
          >
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold theme-text-primary tracking-tight truncate group-hover/title:text-[#F5B942] transition-colors">
                {category.name}
              </h3>
              <ArrowRight className="w-3 h-3 theme-text-muted opacity-0 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all shrink-0" />
            </div>
            <span className="text-[11px] theme-text-muted">
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </span>
          </div>
        </div>

        {/* Right header buttons: Open Page & Menu */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            onClick={() => onOpenCategory(category.id)}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card transition-colors text-xs flex items-center gap-1"
            title="Open dedicated category page"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Three Dots Menu */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card transition-colors"
            aria-label="Category options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 w-48 theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in-50 zoom-in-95 text-left">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenCategory(category.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-secondary hover:theme-bg-card-hover hover:theme-text-primary transition-colors text-left"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#F5B942]" />
                Open Dedicated Page
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onAddLink(category.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-secondary hover:theme-bg-card-hover hover:theme-text-primary transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 text-[#F5B942]" />
                Add Link Here
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onEditCategory(category);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-secondary hover:theme-bg-card-hover hover:theme-text-primary transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                Edit Category
              </button>
              <div className="theme-divider border-t my-1" />
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onDeleteCategory(category);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/20 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Delete Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Scrollable Bookmark Tiles Container (Internal Scrolling for >8 links) */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3.5 custom-scrollbar">
        <SortableContext items={links.map((l) => l.id)} strategy={rectSortingStrategy}>
          {links.length === 0 ? (
            <div className="h-full min-h-[140px] border-2 border-dashed theme-border-card rounded-xl flex flex-col items-center justify-center p-4 text-center">
              <span className="text-xs theme-text-muted mb-1">No links in {category.name}</span>
              <button
                onClick={() => onAddLink(category.id)}
                className="text-xs font-semibold text-[#D99A1C] dark:text-[#F5B942] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add first bookmark
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 content-start">
              {links.map((link) => (
                <LinkTile
                  key={link.id}
                  link={link}
                  onOpen={onOpenLink}
                  onTogglePin={onTogglePinLink}
                  onCopyUrl={onCopyLinkUrl}
                  onEdit={onEditLink}
                  onDelete={onDeleteLink}
                  copied={copiedLinkId === link.id}
                  isCompact={true}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>

      {/* 3. Category Footer (Fixed at bottom, never scrolls away) */}
      <div className="shrink-0 p-3 pt-2.5 theme-divider border-t theme-bg-card-secondary flex items-center justify-between text-xs theme-text-muted">
        <button
          onClick={() => onOpenCategory(category.id)}
          className="text-[11px] theme-text-muted hover:theme-text-primary flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all ({links.length})</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </button>

        <button
          onClick={() => onAddLink(category.id)}
          className="text-[#D99A1C] dark:text-[#F5B942] hover:underline flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Link
        </button>
      </div>
    </div>
  );
};
