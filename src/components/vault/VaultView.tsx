import React, { useState, useRef } from 'react';
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
  Eye,
  CornerDownRight,
  HardDrive
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { VaultFile, VaultFolder } from '../../types';
import { FilePreviewModal } from './FilePreviewModal';
import { NewFolderModal } from './NewFolderModal';
import { CreateNoteModal } from './CreateNoteModal';

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
  } = useMySpace();

  // Modals
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // Folder tree expansion states
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([
    'f-projects',
    'f-docs',
    'f-learning',
  ]);

  // Rename modal / prompt inline
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);

  // Drag over target for file upload
  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter by type
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
    while (curr) {
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
      // If browsing root (currentFolderId === null), show all files or top level
      if (currentFolderId !== null && file.folderId !== currentFolderId) return false;
      if (typeFilter !== 'all' && file.fileType !== typeFilter) return false;
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

  const getFileIcon = (file: VaultFile) => {
    switch (file.fileType) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-sky-400" />;
      case 'code':
        return <FileCode className="w-6 h-6 text-amber-400" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-purple-400" />;
      default:
        return <FileText className="w-6 h-6 text-blue-400" />;
    }
  };

  const totalVaultBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalVaultSizeFormatted = `${(totalVaultBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Vault Workspace Layout: Folders Sidebar on Left + Content View on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Folder Hierarchy Panel */}
        <div className="lg:col-span-3 bg-[#131929] border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Folder className="w-4 h-4 text-purple-400" />
              Folders
            </span>
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Add New Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Folder Tree */}
          <div className="space-y-1 text-xs">
            {/* Root MyVault Item */}
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                currentFolderId === null
                  ? 'bg-purple-950/70 text-purple-200 border border-purple-500/30'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold truncate">MyVault (All)</span>
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
                          ? 'bg-purple-950/70 text-purple-200 border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {subChildren.length > 0 ? (
                          <button
                            onClick={(e) => toggleFolderExpand(topFolder.id, e)}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4" />
                        )}
                        <Folder
                          className="w-4 h-4 shrink-0"
                          style={{ color: topFolder.color || '#eab308' }}
                        />
                        <span className="truncate font-medium">{topFolder.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {countFolderItems(topFolder.id)}
                      </span>
                    </div>

                    {/* Subfolders */}
                    {isExpanded && subChildren.length > 0 && (
                      <div className="pl-6 space-y-0.5 border-l border-slate-800/70 ml-3">
                        {subChildren.map((subFolder) => {
                          const isSubSelected = currentFolderId === subFolder.id;
                          return (
                            <div
                              key={subFolder.id}
                              onClick={() => setCurrentFolderId(subFolder.id)}
                              className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-all ${
                                isSubSelected
                                  ? 'bg-purple-900/50 text-purple-200 font-medium'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Folder
                                  className="w-3.5 h-3.5 shrink-0"
                                  style={{ color: subFolder.color || '#eab308' }}
                                />
                                <span className="truncate">{subFolder.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
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
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-purple-400" /> Storage
              </span>
              <span className="font-mono text-purple-300 font-medium">
                {totalVaultSizeFormatted} / 5 GB
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                style={{ width: '4%' }}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Main Content Viewport */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Vault Toolbar & Breadcrumbs */}
          <div className="bg-[#131929] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Breadcrumb Trail matching Screenshot 1 */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 overflow-x-auto">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.name}>
                  <button
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className="hover:text-purple-400 transition-colors whitespace-nowrap"
                  >
                    {crumb.name}
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Right Action Buttons matching Screenshot 1: Import, Export, + New */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Import Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c2e] hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Import</span>
              </button>

              {/* Export Button */}
              <button
                onClick={exportAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161c2e] hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export</span>
              </button>

              {/* + New Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-900/40 transition-all hover:scale-105"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ New ▾</span>
                </button>

                {isNewMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#1a2238] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in-50 zoom-in-95">
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsNewFolderOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      New Folder
                    </button>
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      Upload File
                    </button>
                    <button
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsCreateNoteOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      New Note / Doc
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub Toolbar: Select All, Search, View Mode, Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedFileIds.length === currentFiles.length && currentFiles.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) selectAllFiles();
                    else clearSelectedFiles();
                  }}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[11px]">Select All</span>
              </label>

              {selectedFileIds.length > 0 && (
                <button
                  onClick={deleteSelectedFiles}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2.5 py-0.5 rounded-lg"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete ({selectedFileIds.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Type filter */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-1 rounded-lg ${typeFilter === 'all' ? 'bg-purple-950/60 text-purple-200' : 'hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('pdf')}
                  className={`px-2 py-1 rounded-lg ${typeFilter === 'pdf' ? 'bg-purple-950/60 text-purple-200' : 'hover:text-white'}`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setTypeFilter('spreadsheet')}
                  className={`px-2 py-1 rounded-lg ${typeFilter === 'spreadsheet' ? 'bg-purple-950/60 text-purple-200' : 'hover:text-white'}`}
                >
                  Sheets
                </button>
                <button
                  onClick={() => setTypeFilter('image')}
                  className={`px-2 py-1 rounded-lg ${typeFilter === 'image' ? 'bg-purple-950/60 text-purple-200' : 'hover:text-white'}`}
                >
                  Images
                </button>
              </div>

              {/* Sort Selector */}
              <select
                value={vaultSortBy}
                onChange={(e) => setVaultSortBy(e.target.value as any)}
                className="px-2.5 py-1 bg-[#161c2e] border border-slate-700/60 rounded-lg text-xs text-slate-300 focus:outline-none"
              >
                <option value="name">Sort: Name</option>
                <option value="date">Sort: Date</option>
                <option value="size">Sort: Size</option>
              </select>

              {/* View Mode Toggle: Grid vs List */}
              <div className="flex items-center p-0.5 bg-[#161c2e] border border-slate-700/60 rounded-lg">
                <button
                  onClick={() => setVaultViewMode('grid')}
                  className={`p-1.5 rounded-md ${
                    vaultViewMode === 'grid'
                      ? 'bg-purple-600/30 text-purple-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setVaultViewMode('list')}
                  className={`p-1.5 rounded-md ${
                    vaultViewMode === 'list'
                      ? 'bg-purple-600/30 text-purple-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverDropzone(true);
            }}
            onDragLeave={() => setIsDragOverDropzone(false)}
            onDrop={handleDropFiles}
            className={`transition-all rounded-2xl ${
              isDragOverDropzone
                ? 'border-2 border-dashed border-purple-400 bg-purple-950/30 p-8 text-center'
                : ''
            }`}
          >
            {isDragOverDropzone && (
              <div className="py-6 text-center text-sm font-semibold text-purple-300">
                Drop files here to upload to current folder
              </div>
            )}

            {/* Folders Section (if any subfolders exist) */}
            {currentSubfolders.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Folders ({currentSubfolders.length})
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {currentSubfolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="group bg-[#161c2e] hover:bg-[#1a233a] border border-slate-800/90 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] relative"
                    >
                      <div className="flex items-start justify-between">
                        {/* Folder Yellow Icon */}
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                          <Folder className="w-6 h-6 fill-amber-400/80 text-amber-400" />
                        </div>

                        {/* More menu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFolderMenuId(
                              activeFolderMenuId === folder.id ? null : folder.id
                            );
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {activeFolderMenuId === folder.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-10 w-36 bg-[#1a2238] border border-slate-700 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in-50"
                        >
                          <button
                            onClick={() => {
                              setActiveFolderMenuId(null);
                              const newName = prompt('New folder name:', folder.name);
                              if (newName) renameFolder(folder.id, newName);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 rounded"
                          >
                            <Edit2 className="w-3 h-3" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              setActiveFolderMenuId(null);
                              if (confirm(`Delete folder "${folder.name}"?`)) {
                                deleteFolder(folder.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/40 rounded"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}

                      <div className="mt-3">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate block">
                          {folder.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {countFolderItems(folder.id)} items
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Files ({currentFiles.length})
              </h4>

              {currentFiles.length === 0 ? (
                <div className="py-14 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-[#131929]/50">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">No files in this folder</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Drag and drop files here, or click &ldquo;Import&rdquo; above.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-600/30 text-purple-200 text-xs font-medium border border-purple-500/30 hover:bg-purple-600/40 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                </div>
              ) : vaultViewMode === 'grid' ? (
                /* Grid View matching Screenshot 1 */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                  {currentFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);

                    return (
                      <div
                        key={file.id}
                        onClick={() => {
                          setPreviewFile(file);
                          setIsPreviewOpen(true);
                        }}
                        className={`group bg-[#161c2e] hover:bg-[#1a233a] border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] relative ${
                          isSelected
                            ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-950/20'
                            : 'border-slate-800/90 hover:border-slate-700'
                        }`}
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
                            className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                          />
                        </div>

                        {/* File Card Top: Icon preview */}
                        <div className="flex items-center justify-center pt-2 pb-4">
                          <div className="w-14 h-14 rounded-2xl bg-[#0d121f] border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                            {getFileIcon(file)}
                          </div>
                        </div>

                        {/* File Card Bottom: Name & Size */}
                        <div className="pt-2 border-t border-slate-800/60">
                          <div className="font-semibold text-xs text-slate-200 group-hover:text-purple-300 truncate">
                            {file.name}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                            <span>{file.sizeFormatted}</span>
                            <span className="uppercase text-purple-400/80 font-bold">
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
                <div className="bg-[#131929] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#161c2e] text-slate-400 uppercase text-[11px] border-b border-slate-800 font-semibold tracking-wider">
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
                            className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Modified</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentFiles.map((file) => (
                        <tr
                          key={file.id}
                          onClick={() => {
                            setPreviewFile(file);
                            setIsPreviewOpen(true);
                          }}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={() => toggleSelectFile(file.id)}
                              className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-200 group-hover:text-purple-300">
                            <div className="flex items-center gap-2">
                              {getFileIcon(file)}
                              <span className="truncate max-w-sm">{file.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 uppercase font-mono">
                            {file.extension}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono">
                            {file.sizeFormatted}
                          </td>
                          <td className="py-3 px-3 text-slate-400">{file.updatedAt}</td>
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
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
    </div>
  );
};
