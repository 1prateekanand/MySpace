import React, { useState, useMemo } from 'react';
import {
  Plus,
  LayoutGrid,
  TrendingUp,
  Newspaper,
  Cpu,
  Code2,
  BookOpen,
  Youtube,
  Folder
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
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useMySpace } from '../../context/MySpaceContext';
import { BookmarkLink, LinkCategory } from '../../types';
import { AddEditLinkModal } from './AddEditLinkModal';
import { AddEditCategoryModal } from './AddEditCategoryModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { GoogleSearchBar } from './GoogleSearchBar';
import { CategoryCard, getCategoryIcon } from './CategoryCard';
import { CategoryDetailView } from './CategoryDetailView';
import { LinkTile } from './LinkTile';

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
    reorderCategories,
    reorderLinks,
    moveLink,
    showToast,
  } = useMySpace();

  // Modals state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<BookmarkLink | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | undefined>(undefined);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<LinkCategory | null>(null);

  // Delete Link Confirm Modal state
  const [linkToDelete, setLinkToDelete] = useState<BookmarkLink | null>(null);
  const [isDeleteLinkModalOpen, setIsDeleteLinkModalOpen] = useState(false);
  const [isDeletingLink, setIsDeletingLink] = useState(false);

  // Delete Category Confirm Modal state
  const [categoryToDelete, setCategoryToDelete] = useState<LinkCategory | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [migrateCategoryId, setMigrateCategoryId] = useState<string>('delete_all');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Copy Feedback state
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Drag and drop state
  const [activeDragType, setActiveDragType] = useState<'category' | 'link' | null>(null);
  const [activeCategory, setActiveCategory] = useState<LinkCategory | null>(null);
  const [activeLink, setActiveLink] = useState<BookmarkLink | null>(null);
  const [overCategoryId, setOverCategoryId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Selected category object for dedicated page
  const selectedCategoryObj = useMemo(() => {
    if (selectedCategoryFilter === 'all') return null;
    return categories.find((c) => c.id === selectedCategoryFilter) || null;
  }, [categories, selectedCategoryFilter]);

  const handleOpenAddLink = (catId?: string) => {
    setTargetCategoryId(catId || (categories[0]?.id ?? ''));
    setLinkToEdit(null);
    setIsAddLinkOpen(true);
  };

  const handleOpenEditLink = (e: React.MouseEvent, link: BookmarkLink) => {
    e.stopPropagation();
    e.preventDefault();
    setLinkToEdit(link);
    setIsAddLinkOpen(true);
  };

  // Trigger Delete Link Modal
  const handleRequestDeleteLink = (e: React.MouseEvent, link: BookmarkLink) => {
    e.stopPropagation();
    e.preventDefault();
    setLinkToDelete(link);
    setIsDeleteLinkModalOpen(true);
  };

  // Execute Delete Link
  const handleConfirmDeleteLink = async () => {
    if (!linkToDelete || isDeletingLink) return;
    setIsDeletingLink(true);
    try {
      const success = await deleteLink(linkToDelete.id);
      if (success) {
        setIsDeleteLinkModalOpen(false);
        setLinkToDelete(null);
      }
    } finally {
      setIsDeletingLink(false);
    }
  };

  // Trigger Delete Category Modal
  const handleRequestDeleteCategory = (category: LinkCategory) => {
    setCategoryToDelete(category);
    const otherCategories = categories.filter((c) => c.id !== category.id);
    setMigrateCategoryId(otherCategories[0]?.id || 'delete_all');
    setIsDeleteCategoryModalOpen(true);
  };

  // Execute Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete || isDeletingCategory) return;
    setIsDeletingCategory(true);
    try {
      const targetMove = migrateCategoryId !== 'delete_all' ? migrateCategoryId : undefined;
      const success = await deleteCategory(categoryToDelete.id, targetMove);
      if (success) {
        setIsDeleteCategoryModalOpen(false);
        setCategoryToDelete(null);
        if (selectedCategoryFilter === categoryToDelete.id) {
          setSelectedCategoryFilter('all');
        }
      }
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    togglePinLink(id);
  };

  const handleCopyUrl = async (e: React.MouseEvent, link: BookmarkLink) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      showToast(`Copied URL: ${link.url}`, 'info');
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch {
      showToast('Could not copy to clipboard', 'warning');
    }
  };

  const handleLinkClick = (link: BookmarkLink) => {
    trackLinkClick(link.id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // =================== DRAG AND DROP HANDLERS ===================
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'category') {
      setActiveDragType('category');
      setActiveCategory(activeData.category);
    } else if (activeData?.type === 'link') {
      setActiveDragType('link');
      setActiveLink(activeData.link);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverCategoryId(null);
      return;
    }

    const overData = over.data.current;
    if (overData?.type === 'category') {
      setOverCategoryId(overData.category.id);
    } else if (overData?.type === 'category-drop-target') {
      setOverCategoryId(overData.categoryId);
    } else if (overData?.type === 'link') {
      setOverCategoryId(overData.categoryId);
    } else {
      const overIdStr = String(over.id);
      const matchedCat = categories.find((c) => c.id === overIdStr);
      if (matchedCat) {
        setOverCategoryId(matchedCat.id);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const dragType = activeDragType;

    setActiveDragType(null);
    setActiveCategory(null);
    setActiveLink(null);
    setOverCategoryId(null);

    if (!over) return;

    // 1. REORDERING CATEGORY BOARDS
    if (dragType === 'category') {
      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) return;

      const oldIndex = categories.findIndex((c) => c.id === activeId);
      const newIndex = categories.findIndex((c) => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = [...categories];
        const [moved] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, moved);
        await reorderCategories(updated);
        showToast('Category boards rearranged', 'info');
      }
      return;
    }

    // 2. REORDERING OR MOVING LINKS
    if (dragType === 'link') {
      const activeLinkId = String(active.id);
      const draggedLink = links.find((l) => l.id === activeLinkId);
      if (!draggedLink) return;

      const sourceCategoryId = draggedLink.categoryId;
      const overData = over.data.current;

      let targetCatId: string | null = null;
      let targetIndex: number | undefined = undefined;

      if (overData?.type === 'link') {
        const overLink = overData.link as BookmarkLink;
        targetCatId = overLink.categoryId;
        const targetLinks = links.filter((l) => l.categoryId === targetCatId);
        targetIndex = targetLinks.findIndex((l) => l.id === overLink.id);
      } else if (overData?.type === 'category-drop-target') {
        targetCatId = overData.categoryId;
      } else if (overData?.type === 'category') {
        targetCatId = overData.category.id;
      } else {
        const overIdStr = String(over.id);
        const matched = categories.find((c) => c.id === overIdStr);
        if (matched) targetCatId = matched.id;
      }

      if (!targetCatId) return;

      // Case A: Reordering within the SAME category
      if (sourceCategoryId === targetCatId) {
        if (overData?.type === 'link' && active.id !== over.id) {
          const categoryLinks = links
            .filter((l) => l.categoryId === sourceCategoryId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const oldIdx = categoryLinks.findIndex((l) => l.id === activeLinkId);
          const newIdx = categoryLinks.findIndex((l) => l.id === over.id);

          if (oldIdx !== -1 && newIdx !== -1) {
            const reordered = [...categoryLinks];
            const [moved] = reordered.splice(oldIdx, 1);
            reordered.splice(newIdx, 0, moved);
            await reorderLinks(sourceCategoryId, reordered);
            showToast('Bookmarks reordered', 'info');
          }
        }
      } else {
        // Case B: Moving to a DIFFERENT category
        await moveLink(activeLinkId, targetCatId, targetIndex);
      }
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden max-w-7xl w-full mx-auto">
      {/* Fixed Header Elements: Category Tabs, Action Buttons & Google Search Bar */}
      <div className="shrink-0 p-4 sm:p-6 lg:p-8 pb-3 space-y-4">
        {/* Category Tabs & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'gold-pill-active'
                  : 'theme-bg-card theme-text-secondary hover:theme-text-primary border theme-border-card hover:theme-bg-card-hover'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>All Links</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-black/20 dark:bg-black/30'
                    : 'theme-bg-card-secondary theme-text-muted border theme-border-card'
                }`}
              >
                {links.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              const count = links.filter((l) => l.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'gold-pill-active'
                      : 'theme-bg-card theme-text-secondary hover:theme-text-primary border theme-border-card hover:theme-bg-card-hover'
                  }`}
                >
                  <span className={isSelected ? 'text-inherit' : 'text-[#D99A1C] dark:text-[#F5B942]'}>
                    {getCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                  </span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-black/20 dark:bg-black/30'
                        : 'theme-bg-card-secondary theme-text-muted border theme-border-card'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setCategoryToEdit(null);
                setIsAddCategoryOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium theme-text-muted hover:theme-text-primary theme-bg-card hover:theme-bg-card-hover border border-dashed theme-border-card hover:border-[#F5B942]/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#F5B942]" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Right: Add Link CTA */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => handleOpenAddLink(selectedCategoryFilter !== 'all' ? selectedCategoryFilter : undefined)}
              className="gold-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Google Search Bar - Fixed and always visible */}
        <GoogleSearchBar />
      </div>

      {/* Scrollable Main Area: Category Boards Grid OR Dedicated Category Links Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 custom-scrollbar">
        {selectedCategoryObj ? (
          /* Dedicated Full-Page Category View */
          <CategoryDetailView
            category={selectedCategoryObj}
            links={links
              .filter((l) => l.categoryId === selectedCategoryObj.id)
              .sort((a, b) => (a.order || 0) - (b.order || 0))}
            onBackToAll={() => setSelectedCategoryFilter('all')}
            onAddLink={(catId) => handleOpenAddLink(catId)}
            onEditCategory={(cat) => {
              setCategoryToEdit(cat);
              setIsAddCategoryOpen(true);
            }}
            onOpenLink={handleLinkClick}
            onTogglePinLink={handleTogglePin}
            onCopyLinkUrl={handleCopyUrl}
            onEditLink={handleOpenEditLink}
            onDeleteLink={handleRequestDeleteLink}
            onReorderLinks={reorderLinks}
            copiedLinkId={copiedLinkId}
          />
        ) : (
          /* All Links Dashboard with Draggable Fixed-Height Category Boards */
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin || closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
          {/* Draggable Category Cards Grid (Horizontal and Vertical Reordering) */}
          <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {categories.map((category) => {
                const categoryLinks = links
                  .filter((l) => l.categoryId === category.id)
                  .sort((a, b) => (a.order || 0) - (b.order || 0));

                const isHighlighted = overCategoryId === category.id;

                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    links={categoryLinks}
                    isHighlighted={isHighlighted}
                    onOpenCategory={(catId) => setSelectedCategoryFilter(catId)}
                    onAddLink={handleOpenAddLink}
                    onEditCategory={(cat) => {
                      setCategoryToEdit(cat);
                      setIsAddCategoryOpen(true);
                    }}
                    onDeleteCategory={handleRequestDeleteCategory}
                    onOpenLink={handleLinkClick}
                    onTogglePinLink={handleTogglePin}
                    onCopyLinkUrl={handleCopyUrl}
                    onEditLink={handleOpenEditLink}
                    onDeleteLink={handleRequestDeleteLink}
                    copiedLinkId={copiedLinkId}
                  />
                );
              })}
            </div>
          </SortableContext>

          {/* Drag Overlay for both Categories and Links */}
          <DragOverlay dropAnimation={null}>
            {activeDragType === 'category' && activeCategory ? (
              <div className="w-80">
                <CategoryCard
                  category={activeCategory}
                  links={links
                    .filter((l) => l.categoryId === activeCategory.id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))}
                  onOpenCategory={() => {}}
                  onAddLink={() => {}}
                  onEditCategory={() => {}}
                  onDeleteCategory={() => {}}
                  onOpenLink={() => {}}
                  onTogglePinLink={() => {}}
                  onCopyLinkUrl={() => {}}
                  onEditLink={() => {}}
                  onDeleteLink={() => {}}
                  copiedLinkId={null}
                  isOverlay={true}
                />
              </div>
            ) : activeDragType === 'link' && activeLink ? (
              <div className="w-20">
                <LinkTile
                  link={activeLink}
                  onOpen={() => {}}
                  onTogglePin={() => {}}
                  onCopyUrl={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isOverlay={true}
                  isCompact={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
      </div>

      {/* Add / Edit Link Modal */}
      <AddEditLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        linkToEdit={linkToEdit}
        defaultCategoryId={targetCategoryId}
      />

      {/* Add / Edit Category Modal */}
      <AddEditCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        categoryToEdit={categoryToEdit}
      />

      {/* React Confirmation Modal for Deleting Link */}
      <ConfirmModal
        isOpen={isDeleteLinkModalOpen}
        onClose={() => {
          if (!isDeletingLink) {
            setIsDeleteLinkModalOpen(false);
            setLinkToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteLink}
        title="Delete Bookmark"
        message="Are you sure you want to delete this bookmark? It will be permanently removed from your dashboard."
        confirmLabel="Delete Bookmark"
        variant="danger"
        isLoading={isDeletingLink}
        itemDetails={
          linkToDelete
            ? {
                title: linkToDelete.title,
                subtitle: linkToDelete.url,
                icon: (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: linkToDelete.iconBg || '#1e293b' }}
                  >
                    {linkToDelete.iconLetter || linkToDelete.title.slice(0, 2).toUpperCase()}
                  </div>
                ),
              }
            : undefined
        }
      />

      {/* React Confirmation Modal for Deleting Category */}
      <ConfirmModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => {
          if (!isDeletingCategory) {
            setIsDeleteCategoryModalOpen(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteCategory}
        title={`Delete Category "${categoryToDelete?.name || ''}"`}
        message={`You are about to delete the category "${categoryToDelete?.name || ''}". Choose what to do with the links currently in this category:`}
        confirmLabel="Confirm Delete"
        variant="danger"
        isLoading={isDeletingCategory}
      >
        {categoryToDelete && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-medium theme-text-secondary">
              Select destination for existing links:
            </label>
            <select
              value={migrateCategoryId}
              onChange={(e) => setMigrateCategoryId(e.target.value)}
              className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942] cursor-pointer"
            >
              {categories
                .filter((c) => c.id !== categoryToDelete.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Move links to "{c.name}"
                  </option>
                ))}
              <option value="delete_all">Delete all links inside this category</option>
            </select>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
};
