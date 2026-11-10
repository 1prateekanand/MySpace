import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, Copy, Edit2, Trash2, Check, GripVertical } from 'lucide-react';
import { BookmarkLink } from '../../types';

interface LinkTileProps {
  link: BookmarkLink;
  onOpen: (link: BookmarkLink) => void;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onCopyUrl: (e: React.MouseEvent, link: BookmarkLink) => void;
  onEdit: (e: React.MouseEvent, link: BookmarkLink) => void;
  onDelete: (e: React.MouseEvent, link: BookmarkLink) => void;
  isOverlay?: boolean;
  copied?: boolean;
  isCompact?: boolean;
}

export const LinkTile: React.FC<LinkTileProps> = ({
  link,
  onOpen,
  onTogglePin,
  onCopyUrl,
  onEdit,
  onDelete,
  isOverlay = false,
  copied = false,
  isCompact = true,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    data: {
      type: 'link',
      link,
      categoryId: link.categoryId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTileClick = () => {
    if (!isDragging) {
      onOpen(link);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/tile flex flex-col items-center p-2 rounded-xl transition-all select-none border ${
        isOverlay
          ? 'border-[#F5B942] ring-2 ring-[#F5B942]/70 shadow-2xl scale-105 rotate-1 theme-bg-card z-50 cursor-grabbing'
          : isDragging
          ? 'opacity-25 border-dashed border-[#F5B942]/60'
          : 'hover:theme-bg-card-hover border-transparent hover:theme-border-card hover:shadow-sm cursor-pointer'
      }`}
      onClick={handleTileClick}
    >
      {/* Top right quick actions on hover */}
      {!isOverlay && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-1.5 -right-1.5 hidden group-hover/tile:flex items-center gap-0.5 z-20 theme-bg-card border theme-border-card rounded-lg p-0.5 shadow-xl"
        >
          {/* Drag Handle Grip */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 hover:text-[#F5B942] theme-text-muted rounded cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to move"
          >
            <GripVertical className="w-3 h-3" />
          </div>

          <button
            type="button"
            onClick={(e) => onTogglePin(e, link.id)}
            title={link.pinned ? 'Unpin' : 'Pin'}
            className="p-1 hover:text-[#F5B942] theme-text-muted rounded transition-colors"
          >
            <Star
              className={`w-3 h-3 ${link.pinned ? 'text-[#F5B942] fill-[#F5B942]' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => onCopyUrl(e, link)}
            title="Copy URL"
            className="p-1 hover:text-emerald-400 theme-text-muted rounded transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => onEdit(e, link)}
            title="Edit"
            className="p-1 hover:text-[#F5B942] theme-text-muted rounded transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(e, link)}
            title="Delete"
            className="p-1 hover:text-rose-400 theme-text-muted rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Favicon / Tile Logo Box */}
      <div
        className={`${
          isCompact ? 'w-12 h-12' : 'w-14 h-14'
        } rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm theme-border-card border transition-transform group-hover/tile:scale-105 overflow-hidden shrink-0`}
        style={{ backgroundColor: link.iconBg || '#1A1711' }}
      >
        {link.favicon ? (
          <img
            src={link.favicon}
            alt={link.title}
            className={`${isCompact ? 'w-7 h-7' : 'w-8 h-8'} object-contain rounded`}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="tracking-tight text-[#F5F1E7] font-semibold">
            {link.iconLetter || link.title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Website Name */}
      <span className="mt-2 text-xs font-medium theme-text-secondary group-hover/tile:text-[#F5B942] truncate w-full text-center">
        {link.title}
      </span>

      {/* Pinned Indicator when not hovering */}
      {link.pinned && (
        <div className="absolute top-1 left-1 text-[9px] text-[#F5B942] group-hover/tile:hidden">
          ★
        </div>
      )}
    </div>
  );
};
