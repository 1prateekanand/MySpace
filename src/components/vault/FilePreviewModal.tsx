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
  HardDrive
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { VaultFile } from '../../types';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: VaultFile | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const { deleteFile } = useMySpace();

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    let url = file.contentDataUrl;
    if (!url && file.textContent) {
      const blob = new Blob([file.textContent], { type: 'text/plain' });
      url = URL.createObjectURL(blob);
    }
    if (!url) {
      const sampleBlob = new Blob([`MySpace Vault File: ${file.name}\nSize: ${file.sizeFormatted}`], {
        type: 'text/plain',
      });
      url = URL.createObjectURL(sampleBlob);
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleDelete = () => {
    if (confirm(`Delete file "${file.name}"?`)) {
      deleteFile(file.id);
      onClose();
    }
  };

  const getFileIcon = () => {
    switch (file.fileType) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-rose-400" />;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#131929] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between bg-[#161c2e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0d121f] border border-slate-700 flex items-center justify-center">
              {getFileIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {file.sizeFormatted} • Updated {file.updatedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Delete File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Preview Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[300px]">
          {file.fileType === 'image' && file.contentDataUrl ? (
            <div className="max-w-full max-h-[500px] overflow-hidden rounded-xl border border-slate-700">
              <img
                src={file.contentDataUrl}
                alt={file.name}
                className="max-h-[500px] object-contain w-auto mx-auto"
              />
            </div>
          ) : file.fileType === 'spreadsheet' && file.textContent ? (
            <div className="w-full overflow-x-auto bg-[#0d121f] p-4 rounded-xl border border-slate-800">
              <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4" /> Spreadsheet Preview
              </div>
              <table className="w-full text-xs text-left">
                <tbody>
                  {file.textContent.split('\n').map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? 'bg-slate-800/80 font-bold text-slate-200' : 'border-t border-slate-800/50'}
                    >
                      {row.split(',').map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-300 font-mono">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : file.textContent ? (
            <div className="w-full bg-[#0d121f] p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto">
              {file.textContent}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                {getFileIcon()}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{file.name}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Preview not rendered directly in browser. Download to view complete contents.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md inline-flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download File ({file.sizeFormatted})
              </button>
            </div>
          )}
        </div>

        {/* Modal Metadata Footer */}
        <div className="px-6 py-3.5 bg-[#161c2e] border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>{file.sizeFormatted}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Created {file.createdAt.split('T')[0]}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
