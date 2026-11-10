import React from 'react';
import {
  X,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Archive,
  Calendar,
  HardDrive,
  Edit2,
  ExternalLink,
  Folder,
  FileCheck2
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { VaultFile } from '../../types';
import { openFile, getFileCategory, EXTENSION_MIME_MAP } from '../../lib/fileOpener';

interface FileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: VaultFile | null;
  onRename?: (file: VaultFile) => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  isOpen,
  onClose,
  file,
  onRename,
}) => {
  const { deleteFile, showToast, folders, isSupabaseConfigured } = useMySpace();

  if (!isOpen || !file) return null;

  const category = getFileCategory(file);
  const ext = (file.extension || file.name.split('.').pop() || '').toLowerCase();
  const mimeType = EXTENSION_MIME_MAP[ext] || file.mimeType || 'application/octet-stream';
  const folder = folders.find((f) => f.id === file.folderId);

  const handleOpen = () => {
    onClose();
    openFile(file, { mode: 'open', showToast });
  };

  const handleDownload = () => {
    onClose();
    openFile(file, { mode: 'download', showToast });
  };

  const handleDelete = () => {
    if (confirm(`Delete file "${file.name}"?`)) {
      deleteFile(file.id);
      onClose();
    }
  };

  const handleRename = () => {
    onClose();
    if (onRename) onRename(file);
  };

  const getFileIcon = () => {
    switch (category) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-400" />;
      case 'excel':
      case 'csv':
      case 'google_sheets':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
      case 'word':
      case 'google_docs':
        return <FileText className="w-6 h-6 text-blue-400" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-sky-400" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-purple-400" />;
      default:
        return <FileCode className="w-6 h-6 text-[#F5B942]" />;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'pdf': return 'PDF Document';
      case 'word': return 'Microsoft Word Document';
      case 'excel': return 'Microsoft Excel Spreadsheet';
      case 'powerpoint': return 'Microsoft PowerPoint Presentation';
      case 'csv': return 'CSV Comma-Separated Values';
      case 'google_sheets': return 'Google Sheets Document';
      case 'google_docs': return 'Google Docs Document';
      case 'google_slides': return 'Google Slides Presentation';
      case 'image': return 'Image Asset';
      case 'archive': return 'Compressed Archive (ZIP)';
      default: return `${ext.toUpperCase()} File`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-lg theme-bg-card border theme-border-card rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 theme-text-primary">
        {/* Header */}
        <div className="px-6 py-4 border-b theme-divider flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl theme-bg-card-inner border theme-border-card flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold theme-text-primary truncate" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs theme-text-muted">{getCategoryLabel()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Metadata Details List */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card">
              <span className="text-[11px] theme-text-muted block mb-1">File Size</span>
              <span className="font-semibold theme-text-primary font-mono">{file.sizeFormatted}</span>
            </div>

            <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card">
              <span className="text-[11px] theme-text-muted block mb-1">Format / Extension</span>
              <span className="font-semibold text-[#D99A1C] dark:text-[#F5B942] uppercase font-mono">
                .{ext}
              </span>
            </div>

            <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card">
              <span className="text-[11px] theme-text-muted block mb-1">Folder Location</span>
              <div className="flex items-center gap-1.5 font-medium theme-text-primary truncate">
                <Folder className="w-3.5 h-3.5 text-[#F5B942]" />
                <span className="truncate">{folder ? folder.name : 'MyVault (Root)'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card">
              <span className="text-[11px] theme-text-muted block mb-1">Storage Provider</span>
              <div className="flex items-center gap-1.5 font-medium theme-text-primary">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSupabaseConfigured && file.storagePath ? 'Supabase Storage' : 'Local Storage Cache'}</span>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="theme-text-muted">MIME Type:</span>
              <span className="font-mono theme-text-secondary truncate max-w-xs">{mimeType}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="theme-text-muted">Last Modified:</span>
              <span className="theme-text-secondary">{file.updatedAt}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="theme-text-muted">Created:</span>
              <span className="theme-text-secondary">{file.createdAt.split('T')[0]}</span>
            </div>
            {file.googleDocUrl && (
              <div className="pt-2 border-t theme-divider flex items-center justify-between text-[11px]">
                <span className="theme-text-muted">Workspace Link:</span>
                <a
                  href={file.googleDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D99A1C] dark:text-[#F5B942] hover:underline inline-flex items-center gap-1 truncate max-w-[200px]"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">Open in Workspace</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t theme-divider theme-bg-card-secondary flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRename}
              className="px-3 py-1.5 rounded-xl border theme-border-card theme-bg-card-inner hover:theme-bg-card-hover text-xs font-medium theme-text-secondary hover:theme-text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl border theme-border-card theme-bg-card-inner hover:theme-bg-card-hover text-xs font-medium theme-text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F5B942]" />
              <span>Download</span>
            </button>
            <button
              onClick={handleOpen}
              className="px-4 py-1.5 rounded-xl gold-btn text-xs font-semibold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Open File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
