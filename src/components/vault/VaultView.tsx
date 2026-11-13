import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Search,
  MoreVertical,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Archive,
  Trash2,
  Edit2,
  HardDrive,
  Loader2,
  Presentation,
  Info,
  ExternalLink,
  FileCheck2
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { VaultFile, VaultFolder } from '../../types';
import { FileDetailsModal } from './FileDetailsModal';
import { NewFolderModal } from './NewFolderModal';
import { CreateNoteModal } from './CreateNoteModal';
import { LinkGoogleDocModal } from './LinkGoogleDocModal';
import { openFile, getFileCategory } from '../../lib/fileOpener';

export const VaultView: React.FC = () => {
  const {
    folders,
    files,
    currentFolderId,
    setCurrentFolderId,
    vaultViewMode,
    setVaultViewMode,
    vaultSortBy,
    setVaultSortBy,
    vaultSearchQuery,
    setVaultSearchQuery,
    selectedFileIds,
    toggleSelectFile,
    selectAllFiles,
    clearSelectedFiles,
    deleteSelectedFiles,
    renameFolder,
    deleteFolder,
    uploadFile,
    renameFile,
    deleteFile,
    exportAllData,
    showToast,
  } = useMySpace();

  // Modals state
  const [detailsFile, setDetailsFile] = useState<VaultFile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isLinkGoogleDocOpen, setIsLinkGoogleDocOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // File opening loading indicator state
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);

  // Folder tree expansion states
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([
    'f-projects',
    'f-docs',
    'f-learning',
  ]);

  // Section-level expand/collapse states (Folders & Files operate independently)
  const [isFoldersExpanded, setIsFoldersExpanded] = useState<boolean>(true);
  const [foldersOverflowVisible, setFoldersOverflowVisible] = useState<boolean>(true);
  const [isFilesExpanded, setIsFilesExpanded] = useState<boolean>(true);
  const [filesOverflowVisible, setFilesOverflowVisible] = useState<boolean>(true);

  const toggleFoldersSection = () => {
    if (isFoldersExpanded) {
      setFoldersOverflowVisible(false);
      setIsFoldersExpanded(false);
    } else {
      setIsFoldersExpanded(true);
    }
  };

  const toggleFilesSection = () => {
    if (isFilesExpanded) {
      setFilesOverflowVisible(false);
      setIsFilesExpanded(false);
    } else {
      setIsFilesExpanded(true);
    }
  };

  // Rename modal / prompt inline
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);

  // Drag over target for file upload
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter by type
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dismiss context menus when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveFileMenuId(null);
      setActiveFolderMenuId(null);
      setIsNewMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  // Find breadcrumb path
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'MyVault' }];
    if (!currentFolderId) return crumbs;

    let curr: VaultFolder | undefined = folders.find((f) => f.id === currentFolderId);
    const path: { id: string; name: string }[] = [];
    const visited = new Set<string>();
    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      path.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
    }
    return [...crumbs, ...path];
  };

  // Folders to show in current view
  const currentSubfolders = folders.filter((f) => f.parentId === currentFolderId);

  // Files in current view with search and filter
  const currentFiles = files
    .filter((file) => {
      if (currentFolderId !== null && file.folderId !== currentFolderId) return false;
      if (typeFilter !== 'all') {
        const cat = getFileCategory(file);
        if (typeFilter === 'pdf' && cat !== 'pdf') return false;
        if (typeFilter === 'spreadsheet' && cat !== 'excel' && cat !== 'csv' && cat !== 'google_sheets') return false;
        if (typeFilter === 'image' && cat !== 'image') return false;
        if (typeFilter === 'doc' && cat !== 'word' && cat !== 'google_docs') return false;
      }
      if (
        vaultSearchQuery &&
        !file.name.toLowerCase().includes(vaultSearchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (vaultSortBy === 'name') return a.name.localeCompare(b.name);
      if (vaultSortBy === 'size') return b.sizeBytes - a.sizeBytes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Calculate items in folder for badge
  const countFolderItems = (folderId: string) => {
    const directFiles = files.filter((f) => f.folderId === folderId).length;
    const subF = folders.filter((f) => f.parentId === folderId).length;
    return directFiles + subF;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    for (let i = 0; i < uploadedFiles.length; i++) {
      await uploadFile(uploadedFiles[i], currentFolderId);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDropzone(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        await uploadFile(e.dataTransfer.files[i], currentFolderId);
      }
    }
  };

  /**
   * Native File Opening Workflow:
   * Direct opening according to file type with loading feedback & toast
   */
  const handleOpenFile = async (file: VaultFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveFileMenuId(null);
    setOpeningFileId(file.id);

    try {
      await openFile(file, {
        mode: 'open',
        showToast,
        onLoadingChange: (loading) => {
          if (!loading) setOpeningFileId(null);
        },
      });
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleDownloadFile = async (file: VaultFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveFileMenuId(null);
    setOpeningFileId(file.id);

    try {
      await openFile(file, {
        mode: 'download',
        showToast,
        onLoadingChange: (loading) => {
          if (!loading) setOpeningFileId(null);
        },
      });
    } finally {
      setOpeningFileId(null);
    }
  };

  const handleGetDetails = (file: VaultFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveFileMenuId(null);
    setDetailsFile(file);
    setIsDetailsOpen(true);
  };

  const handleRenamePrompt = (file: VaultFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveFileMenuId(null);
    const newName = prompt('New file name:', file.name);
    if (newName && newName.trim() && newName.trim() !== file.name) {
      renameFile(file.id, newName.trim());
    }
  };

  const getFileIcon = (file: VaultFile) => {
    const category = getFileCategory(file);
    switch (category) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-500" />;
      case 'excel':
      case 'csv':
      case 'google_sheets':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case 'word':
      case 'google_docs':
        return <FileText className="w-6 h-6 text-blue-400" />;
      case 'powerpoint':
      case 'google_slides':
        return <Presentation className="w-6 h-6 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-sky-400" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-purple-400" />;
      case 'text':
        return <FileCode className="w-6 h-6 text-[#F5B942]" />;
      default:
        return <FileText className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942]" />;
    }
  };

  const totalVaultBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalVaultSizeFormatted = `${(totalVaultBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Vault Workspace Layout: Folders Sidebar on Left (275px) + Content View on Right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 items-stretch overflow-hidden">
        {/* Left Side: Folder Hierarchy Panel (275px fixed width, independent internal scrolling) */}
        <div className="w-full lg:w-[275px] shrink-0 h-full flex flex-col min-h-0 theme-bg-card border theme-border-card rounded-2xl p-4 shadow-xl overflow-hidden">
          <div className="shrink-0 flex items-center justify-between pb-3 mb-3 theme-divider border-b">
            <span className="text-xs font-bold theme-text-primary uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942]" />
              Folders
            </span>
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="p-1 rounded-md theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors cursor-pointer"
              title="Add New Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Folder Tree (Scrollable independently) */}
          <div className="flex-1 min-h-0 space-y-1 text-xs overflow-y-auto pr-1 custom-scrollbar">
            {/* Root MyVault Item */}
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                currentFolderId === null
                  ? 'bg-[#F5B942]/15 dark:bg-[#241D12] text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/40 font-semibold'
                  : 'theme-text-secondary hover:theme-bg-card-hover hover:theme-text-primary'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FolderOpen className="w-4 h-4 text-[#D99A1C] dark:text-[#F5B942] shrink-0" />
                <span className="font-semibold whitespace-nowrap">MyVault (All)</span>
              </div>
              <span className="text-[10px] theme-text-muted font-mono shrink-0 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-black/30 border theme-border-card">
                {files.length}
              </span>
            </button>

            {/* Top Level Folders */}
            {folders
              .filter((f) => f.parentId === null)
              .map((topFolder) => {
                const subChildren = folders.filter((child) => child.parentId === topFolder.id);
                const isExpanded = expandedFolderIds.includes(topFolder.id);
                const isSelected = currentFolderId === topFolder.id;

                return (
                  <div key={topFolder.id} className="space-y-0.5">
                    <div
                      onClick={() => setCurrentFolderId(topFolder.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#F5B942]/15 dark:bg-[#241D12] text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/40 font-semibold'
                          : 'theme-text-secondary hover:theme-bg-card-hover hover:theme-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        {subChildren.length > 0 ? (
                          <button
                            onClick={(e) => toggleFolderExpand(topFolder.id, e)}
                            className="p-0.5 theme-text-muted hover:theme-text-primary shrink-0 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 shrink-0" />
                        )}
                        <Folder
                          className="w-4 h-4 shrink-0 text-[#D99A1C] dark:text-[#F5B942] fill-current/20"
                        />
                        <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                          {topFolder.name}
                        </span>
                      </div>
                      <span className="text-[10px] theme-text-muted font-mono shrink-0 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-black/30 border theme-border-card">
                        {countFolderItems(topFolder.id)}
                      </span>
                    </div>

                    {/* Subfolders */}
                    {isExpanded && subChildren.length > 0 && (
                      <div className="pl-6 space-y-0.5 border-l theme-border-card ml-3">
                        {subChildren.map((subFolder) => {
                          const isSubSelected = currentFolderId === subFolder.id;
                          return (
                            <div
                              key={subFolder.id}
                              onClick={() => setCurrentFolderId(subFolder.id)}
                              className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                isSubSelected
                                  ? 'bg-[#F5B942]/15 dark:bg-[#241D12] text-[#D99A1C] dark:text-[#F5B942] font-semibold'
                                  : 'theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                <Folder
                                  className="w-3.5 h-3.5 shrink-0 text-[#D99A1C] dark:text-[#F5B942] fill-current/20"
                                />
                                <span className="whitespace-nowrap font-normal">{subFolder.name}</span>
                              </div>
                              <span className="text-[10px] theme-text-muted font-mono shrink-0 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-black/30 border theme-border-card">
                                {countFolderItems(subFolder.id)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Storage Meter at bottom */}
          <div className="mt-6 pt-4 theme-divider border-t">
            <div className="flex items-center justify-between text-[11px] theme-text-muted mb-1.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-[#D99A1C] dark:text-[#F5B942]" /> Storage
              </span>
              <span className="font-mono text-[#D99A1C] dark:text-[#F5B942] font-medium">
                {totalVaultSizeFormatted} / 5 GB
              </span>
            </div>
            <div className="w-full theme-bg-card-inner h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#D6AD60] to-[#F5B942] h-full rounded-full"
                style={{ width: '4%' }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Main Content Viewport */}
        <div className="flex-1 min-w-0 h-full flex flex-col min-h-0 overflow-hidden space-y-3">
          {/* Top Vault Toolbar & Breadcrumbs - Fixed */}
          <div className="shrink-0 theme-bg-card border theme-border-card rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs font-semibold theme-text-primary overflow-x-auto">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.name}>
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className="hover:text-[#F5B942] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {crumb.name}
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 theme-text-muted shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Right Action Buttons: Upload, Export & + New */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card theme-text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#F5B942]" />
                <span>Upload</span>
              </button>

              {/* Export Button */}
              <button
                onClick={exportAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card theme-text-secondary hover:theme-text-primary text-xs font-medium transition-colors cursor-pointer"
                title="Export MyVault Backup JSON"
              >
                <Download className="w-3.5 h-3.5 theme-text-muted" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* + New Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNewMenuOpen(!isNewMenuOpen);
                  }}
                  aria-expanded={isNewMenuOpen}
                  aria-haspopup="menu"
                  className="gold-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5] text-[#120E06] shrink-0" />
                  <span>New</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 stroke-[2.25] text-[#120E06] shrink-0 transition-transform duration-150 ${
                      isNewMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isNewMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-48 theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in-50 zoom-in-95"
                  >
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsNewFolderOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-card-hover transition-colors text-left cursor-pointer"
                    >
                      <Folder className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                      New Folder
                    </button>
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-card-hover transition-colors text-left cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                      Upload File
                    </button>
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsCreateNoteOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-card-hover transition-colors text-left cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#D99A1C] dark:text-[#F5B942]" />
                      New Note / Doc
                    </button>
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsLinkGoogleDocOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs theme-text-primary hover:theme-bg-card-hover transition-colors text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      Link Google Doc / Sheet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub Toolbar: Select All, Search, View Mode, Sort - Fixed */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs theme-text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    selectedFileIds.length === currentFiles.length && currentFiles.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) selectAllFiles();
                    else clearSelectedFiles();
                  }}
                  className="rounded border-[var(--border-card)] bg-[var(--bg-card-inner)] accent-[#F5B942]"
                />
                <span className="text-[11px]">Select All</span>
              </label>

              {selectedFileIds.length > 0 && (
                <button
                  onClick={deleteSelectedFiles}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2.5 py-0.5 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete ({selectedFileIds.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Type filter */}
              <div className="flex items-center gap-1 text-xs">
                {(['all', 'pdf', 'spreadsheet', 'doc', 'image'] as const).map((t) => {
                  const isActive = typeFilter === t;
                  const label = t === 'all' ? 'All' : t === 'pdf' ? 'PDF' : t === 'spreadsheet' ? 'Sheets' : t === 'doc' ? 'Docs' : 'Images';
                  return (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#F5B942]/15 text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/35'
                          : 'theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Selector */}
              <select
                value={vaultSortBy}
                onChange={(e) => setVaultSortBy(e.target.value as any)}
                className="px-2.5 py-1 theme-bg-card-secondary border theme-border-card rounded-lg text-xs theme-text-secondary focus:outline-none focus:border-[#F5B942] cursor-pointer"
              >
                <option value="name">Sort: Name</option>
                <option value="date">Sort: Date</option>
                <option value="size">Sort: Size</option>
              </select>

              {/* View Mode Toggle: Grid vs List */}
              <div className="flex items-center p-0.5 theme-bg-card-secondary border theme-border-card rounded-lg">
                <button
                  onClick={() => setVaultViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    vaultViewMode === 'grid'
                      ? 'bg-[#F5B942]/20 text-[#D99A1C] dark:text-[#F5B942]'
                      : 'theme-text-muted hover:theme-text-primary'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setVaultViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    vaultViewMode === 'list'
                      ? 'bg-[#F5B942]/20 text-[#D99A1C] dark:text-[#F5B942]'
                      : 'theme-text-muted hover:theme-text-primary'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Files & Folders Scrollable Region */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
            {/* Drag & Drop Area container */}
            <div
              onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverDropzone(true);
            }}
            onDragLeave={() => setIsDragOverDropzone(false)}
            onDrop={handleDropFiles}
            className={`space-y-6 transition-all rounded-2xl ${
              isDragOverDropzone
                ? 'ring-2 ring-dashed ring-[#F5B942] bg-[#F5B942]/5 p-4'
                : ''
            }`}
          >
            {/* Subfolders Section */}
            {currentSubfolders.length > 0 && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={toggleFoldersSection}
                  aria-expanded={isFoldersExpanded}
                  aria-controls="vault-folders-content"
                  className="group/section inline-flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-lg text-xs font-semibold theme-text-muted hover:text-[#D99A1C] dark:hover:text-[#F5B942] hover:bg-[#F5B942]/10 active:bg-[#F5B942]/15 uppercase tracking-wider transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F5B942]"
                  title={isFoldersExpanded ? 'Collapse Folders' : 'Expand Folders'}
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isFoldersExpanded
                        ? 'rotate-90 text-[#D99A1C] dark:text-[#F5B942]'
                        : 'theme-text-muted group-hover/section:text-[#D99A1C] dark:group-hover/section:text-[#F5B942]'
                    }`}
                  />
                  <span>Folders ({currentSubfolders.length})</span>
                </button>

                <div
                  id="vault-folders-content"
                  aria-hidden={!isFoldersExpanded}
                  onTransitionEnd={(e) => {
                    if (e.target === e.currentTarget && isFoldersExpanded) {
                      setFoldersOverflowVisible(true);
                    }
                  }}
                  className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out ${
                    isFoldersExpanded
                      ? 'grid-rows-[1fr] opacity-100 visible'
                      : 'grid-rows-[0fr] opacity-0 invisible pointer-events-none'
                  }`}
                >
                  <div className={foldersOverflowVisible && isFoldersExpanded ? 'overflow-visible' : 'overflow-hidden'}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                      {currentSubfolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="group theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card hover:border-[#F5B942]/60 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative"
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/25 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942] group-hover:scale-110 transition-transform">
                              <Folder className="w-6 h-6 fill-[#F5B942]/80 text-[#D99A1C] dark:text-[#F5B942]" />
                            </div>

                            {/* More menu */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveFolderMenuId(
                                  activeFolderMenuId === folder.id ? null : folder.id
                                );
                              }}
                              className="p-1 rounded-md theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {activeFolderMenuId === folder.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-2 top-10 w-36 theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1 z-30 animate-in fade-in-50"
                            >
                              <button
                                onClick={() => {
                                  setActiveFolderMenuId(null);
                                  const newName = prompt('New folder name:', folder.name);
                                  if (newName) renameFolder(folder.id, newName);
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1 text-xs theme-text-primary hover:theme-bg-card-hover rounded cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-[#D99A1C] dark:text-[#F5B942]" /> Rename
                              </button>
                              <button
                                onClick={() => {
                                  setActiveFolderMenuId(null);
                                  if (confirm(`Delete folder "${folder.name}"?`)) {
                                    deleteFolder(folder.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/40 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          )}

                          <div className="mt-3">
                            <span className="font-bold text-xs theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] truncate block">
                              {folder.name}
                            </span>
                            <span className="text-[11px] theme-text-muted">
                              {countFolderItems(folder.id)} items
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Files Section */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={toggleFilesSection}
                aria-expanded={isFilesExpanded}
                aria-controls="vault-files-content"
                className="group/section inline-flex items-center gap-1.5 px-1.5 py-1 -ml-1.5 rounded-lg text-xs font-semibold theme-text-muted hover:text-[#D99A1C] dark:hover:text-[#F5B942] hover:bg-[#F5B942]/10 active:bg-[#F5B942]/15 uppercase tracking-wider transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F5B942]"
                title={isFilesExpanded ? 'Collapse Files' : 'Expand Files'}
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                    isFilesExpanded
                      ? 'rotate-90 text-[#D99A1C] dark:text-[#F5B942]'
                      : 'theme-text-muted group-hover/section:text-[#D99A1C] dark:group-hover/section:text-[#F5B942]'
                  }`}
                />
                <span>Files ({currentFiles.length})</span>
              </button>

              <div
                id="vault-files-content"
                aria-hidden={!isFilesExpanded}
                onTransitionEnd={(e) => {
                  if (e.target === e.currentTarget && isFilesExpanded) {
                    setFilesOverflowVisible(true);
                  }
                }}
                className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out ${
                  isFilesExpanded
                    ? 'grid-rows-[1fr] opacity-100 visible'
                    : 'grid-rows-[0fr] opacity-0 invisible pointer-events-none'
                }`}
              >
                <div className={filesOverflowVisible && isFilesExpanded ? 'overflow-visible' : 'overflow-hidden'}>
                  {currentFiles.length === 0 ? (
                <div className="py-14 text-center border-2 border-dashed theme-border-card rounded-2xl theme-bg-card-inner">
                  <Upload className="w-8 h-8 text-[#D99A1C] dark:text-[#F5B942] mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold theme-text-primary">No files in this folder</p>
                  <p className="text-[11px] theme-text-muted mt-0.5">
                    Drag and drop files here, or click &ldquo;Upload&rdquo; above.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-3.5 py-1.5 rounded-xl gold-btn text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                </div>
              ) : vaultViewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {currentFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);
                    const isOpening = openingFileId === file.id;

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleOpenFile(file)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setActiveFileMenuId(file.id);
                        }}
                        className={`group theme-bg-card-secondary hover:theme-bg-card-hover border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] relative ${
                          isSelected
                            ? 'border-[#F5B942] ring-2 ring-[#F5B942]/30 bg-[#F5B942]/5'
                            : 'theme-border-card hover:border-[#F5B942]/60'
                        } ${isOpening ? 'ring-2 ring-[#F5B942] bg-[#F5B942]/10' : ''}`}
                      >
                        {/* Select Checkbox */}
                        <div
                          className="absolute top-2.5 left-2.5 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFile(file.id)}
                            className="rounded border-[var(--border-card)] bg-[var(--bg-card-inner)] accent-[#F5B942] cursor-pointer"
                          />
                        </div>

                        {/* File Options / Context Menu Trigger */}
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFileMenuId(activeFileMenuId === file.id ? null : file.id);
                            }}
                            className="p-1 rounded-md theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors cursor-pointer"
                            title="File Options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeFileMenuId === file.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-7 w-44 theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1 z-30 animate-in fade-in-50 zoom-in-95"
                            >
                              <button
                                onClick={(e) => handleOpenFile(file, e)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#D99A1C] dark:text-[#F5B942] hover:theme-bg-card-hover rounded-lg text-left cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open File
                              </button>
                              <button
                                onClick={(e) => handleDownloadFile(file, e)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg text-left cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </button>
                              <button
                                onClick={(e) => handleRenamePrompt(file, e)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg text-left cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Rename
                              </button>
                              <button
                                onClick={(e) => handleGetDetails(file, e)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg text-left cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" /> Get Details
                              </button>
                              <div className="border-t theme-divider my-0.5" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFileMenuId(null);
                                  if (confirm(`Delete file "${file.name}"?`)) {
                                    deleteFile(file.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* File Card Top: Icon preview or Loading Indicator */}
                        <div className="flex items-center justify-center pt-2 pb-4">
                          <div className="w-14 h-14 rounded-2xl theme-bg-card-inner border theme-border-card flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner relative">
                            {isOpening ? (
                              <Loader2 className="w-7 h-7 text-[#F5B942] animate-spin" />
                            ) : (
                              getFileIcon(file)
                            )}
                          </div>
                        </div>

                        {/* File Card Bottom: Name & Size */}
                        <div className="pt-2 border-t theme-divider">
                          <div
                            className="font-semibold text-xs theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] truncate"
                            title={file.name}
                          >
                            {file.name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] theme-text-muted mt-1 font-mono">
                            {isOpening ? (
                              <span className="text-[#F5B942] font-semibold flex items-center gap-1">
                                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Opening...
                              </span>
                            ) : (
                              <span>{file.sizeFormatted}</span>
                            )}
                            <span className="uppercase text-[#D99A1C] dark:text-[#F5B942] font-bold">
                              {file.extension}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View for Vault */
                <div className="theme-bg-card border theme-border-card rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="theme-bg-card-secondary theme-text-muted uppercase text-[11px] border-b theme-divider font-semibold tracking-wider">
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedFileIds.length === currentFiles.length &&
                              currentFiles.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) selectAllFiles();
                              else clearSelectedFiles();
                            }}
                            className="rounded border-[var(--border-card)] bg-[var(--bg-card-inner)] accent-[#F5B942] cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Modified</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-divider">
                      {currentFiles.map((file) => {
                        const isOpening = openingFileId === file.id;

                        return (
                          <tr
                            key={file.id}
                            onClick={() => handleOpenFile(file)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setActiveFileMenuId(file.id);
                            }}
                            className={`hover:theme-bg-card-hover cursor-pointer transition-colors group ${
                              isOpening ? 'bg-[#F5B942]/10' : ''
                            }`}
                          >
                            <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedFileIds.includes(file.id)}
                                onChange={() => toggleSelectFile(file.id)}
                                className="rounded border-[var(--border-card)] bg-[var(--bg-card-inner)] accent-[#F5B942] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 font-medium theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942]">
                              <div className="flex items-center gap-2.5">
                                {isOpening ? (
                                  <Loader2 className="w-4 h-4 text-[#F5B942] animate-spin shrink-0" />
                                ) : (
                                  <div className="shrink-0">{getFileIcon(file)}</div>
                                )}
                                <span className="truncate max-w-sm" title={file.name}>
                                  {file.name}
                                </span>
                                {isOpening && (
                                  <span className="text-[10px] text-[#F5B942] font-semibold animate-pulse">
                                    Opening...
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 theme-text-muted uppercase font-mono">
                              {file.extension}
                            </td>
                            <td className="py-3 px-3 theme-text-secondary font-mono">
                              {file.sizeFormatted}
                            </td>
                            <td className="py-3 px-3 theme-text-muted">{file.updatedAt}</td>
                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-flex items-center gap-1">
                                <button
                                  onClick={(e) => handleOpenFile(file, e)}
                                  className="p-1 rounded text-[#D99A1C] dark:text-[#F5B942] hover:theme-bg-card-inner"
                                  title="Open File"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDownloadFile(file, e)}
                                  className="p-1 rounded theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveFileMenuId(
                                      activeFileMenuId === file.id ? null : file.id
                                    );
                                  }}
                                  className="p-1 rounded theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner"
                                  title="More options"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {activeFileMenuId === file.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-8 w-44 theme-bg-card border theme-border-card rounded-xl shadow-2xl p-1 z-30 animate-in fade-in-50 zoom-in-95 text-left"
                                  >
                                    <button
                                      onClick={(e) => handleOpenFile(file, e)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-[#D99A1C] dark:text-[#F5B942] hover:theme-bg-card-hover rounded-lg cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Open File
                                    </button>
                                    <button
                                      onClick={(e) => handleDownloadFile(file, e)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </button>
                                    <button
                                      onClick={(e) => handleRenamePrompt(file, e)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" /> Rename
                                    </button>
                                    <button
                                      onClick={(e) => handleGetDetails(file, e)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs theme-text-primary hover:theme-bg-card-hover rounded-lg cursor-pointer"
                                    >
                                      <Info className="w-3.5 h-3.5" /> Get Details
                                    </button>
                                    <div className="border-t theme-divider my-0.5" />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveFileMenuId(null);
                                        if (confirm(`Delete file "${file.name}"?`)) {
                                          deleteFile(file.id);
                                        }
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Details & Creation Modals */}
      <FileDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        file={detailsFile}
        onRename={(file) => handleRenamePrompt(file)}
      />

      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
      />

      <CreateNoteModal
        isOpen={isCreateNoteOpen}
        onClose={() => setIsCreateNoteOpen(false)}
        folderId={currentFolderId}
      />

      <LinkGoogleDocModal
        isOpen={isLinkGoogleDocOpen}
        onClose={() => setIsLinkGoogleDocOpen(false)}
        folderId={currentFolderId}
      />
    </div>
  );
};
