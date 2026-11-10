import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Presentation, Link } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { VaultFile } from '../../types';
import { dbService } from '../../services/dbService';

interface LinkGoogleDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
}

export const LinkGoogleDocModal: React.FC<LinkGoogleDocModalProps> = ({
  isOpen,
  onClose,
  folderId,
}) => {
  const { addVaultFile, showToast } = useMySpace();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'sheet' | 'doc' | 'slide'>('sheet');
  const [docUrl, setDocUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let defaultUrl = docUrl.trim();
    if (!defaultUrl) {
      if (docType === 'sheet') defaultUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
      else if (docType === 'doc') defaultUrl = 'https://docs.google.com/document/d/195j9eQD3raSHPyjbLVC8Xx2PT_LWW_nptYvC_qXkXh4/edit';
      else defaultUrl = 'https://docs.google.com/presentation/u/0/';
    }

    const ext = docType === 'sheet' ? 'gsheet' : docType === 'doc' ? 'gdoc' : 'gslides';
    const cleanName = title.trim().endsWith(`.${ext}`) ? title.trim() : `${title.trim()}.${ext}`;

    const newFile: VaultFile = {
      id: `file-gdoc-${Date.now()}`,
      name: cleanName,
      folderId: folderId || 'f-projects',
      sizeBytes: 0,
      sizeFormatted: docType === 'sheet' ? 'Google Sheet' : docType === 'doc' ? 'Google Doc' : 'Google Slide',
      fileType: docType === 'sheet' ? 'spreadsheet' : 'doc',
      extension: ext,
      googleDocUrl: defaultUrl,
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
    };

    await addVaultFile(newFile);
    showToast(`Linked "${cleanName}"`);
    setTitle('');
    setDocUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-bold theme-text-primary mb-1">
          Link Google Workspace Document
        </h3>
        <p className="text-xs theme-text-muted mb-4">
          Add Google Sheets, Docs, or Slides with native one-click opening.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDocType('sheet')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                docType === 'sheet'
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'theme-border-card theme-bg-card-inner theme-text-muted hover:theme-text-primary'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Google Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('doc')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                docType === 'doc'
                  ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                  : 'theme-border-card theme-bg-card-inner theme-text-muted hover:theme-text-primary'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Google Doc</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType('slide')}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                docType === 'slide'
                  ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                  : 'theme-border-card theme-bg-card-inner theme-text-muted hover:theme-text-primary'
              }`}
            >
              <Presentation className="w-5 h-5" />
              <span>Google Slide</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold theme-text-secondary block mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Growth Metrics"
              className="w-full px-3.5 py-2.5 rounded-xl theme-bg-card-inner border theme-border-card theme-text-primary text-xs focus:outline-none focus:border-[#F5B942]"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold theme-text-secondary block mb-1.5">
              Google Workspace URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl theme-bg-card-inner border theme-border-card theme-text-primary text-xs focus:outline-none focus:border-[#F5B942]"
              />
              <Link className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs theme-text-muted hover:theme-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl gold-btn text-xs font-semibold shadow-md"
            >
              Link Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
