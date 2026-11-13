import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Lock,
  ShieldCheck,
  AlertTriangle,
  FileArchive,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from './MySpaceLogo';

export const BackupRestoreModal: React.FC = () => {
  const {
    isBackupModalOpen,
    setIsBackupModalOpen,
    exportEncryptedBackupFile,
    importEncryptedBackupFile,
    hasExistingWorkspaceData,
    legacyLocalAccounts,
    clearObsoleteLegacyRecords,
  } = useMySpace();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportPin, setExportPin] = useState('');
  const [importPin, setImportPin] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackupModalOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPin || exportPin.length < 4) {
      setErrorMsg('Please enter a PIN (min 4 characters) to encrypt your backup.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await exportEncryptedBackupFile(exportPin);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Backup exported: ${res.filename}`);
      setExportPin('');
    } else {
      setErrorMsg(res.error || 'Failed to export backup.');
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a backup file (.myspace.enc or .json).');
      return;
    }
    if (!importPin) {
      setErrorMsg('Please enter the decryption PIN for this backup.');
      return;
    }
    if (hasExistingWorkspaceData && !confirmOverwrite) {
      setErrorMsg('Please confirm that you want to replace your current device workspace with this backup.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const res = await importEncryptedBackupFile(selectedFile, importPin);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Restored successfully! Recovered ${res.restored?.links || 0} links, ${res.restored?.tasks || 0} tasks, and ${res.restored?.files || 0} files.`);
      setSelectedFile(null);
      setImportPin('');
      setConfirmOverwrite(false);
    } else {
      setErrorMsg(res.error || 'Decryption or restore failed.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 theme-text-primary">
        {/* Header */}
        <div className="px-5 py-4 border-b theme-divider flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-3">
            <MySpaceLogo size="sm" />
            <div>
              <h3 className="text-sm font-bold theme-text-primary">Encrypted Backup & Portability</h3>
              <p className="text-[11px] theme-text-muted">
                Transfer your private device workspace securely
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(false)}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b theme-divider px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('export'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942]'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Encrypted Backup</span>
          </button>
          <button
            onClick={() => { setActiveTab('import'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942]'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'export' ? (
            <form onSubmit={handleExport} className="space-y-4">
              <p className="text-xs theme-text-muted leading-relaxed">
                Download an AES-256-GCM encrypted <code className="text-[#F5B942]">.myspace.enc</code> package containing your bookmarks, tasks, folders, and vault file binaries.
              </p>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Encryption PIN / Passphrase
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={exportPin}
                    onChange={(e) => setExportPin(e.target.value)}
                    placeholder="Enter PIN to protect backup"
                    className="w-full pl-8 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                  />
                  <Lock className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] theme-text-muted mt-1">
                  You will need this PIN when restoring this backup on any other device.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 gold-btn font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Encrypting & Generating...' : 'Download .myspace.enc Backup'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleImport} className="space-y-4">
              <p className="text-xs theme-text-muted leading-relaxed">
                Restore an encrypted backup from another computer or browser into this device's private workspace.
              </p>

              {/* File selector */}
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Select Backup File (.myspace.enc)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".enc,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed theme-border-card hover:border-[#F5B942]/60 rounded-xl flex items-center justify-center gap-2 text-xs theme-text-secondary cursor-pointer transition-colors"
                >
                  <FileArchive className="w-4 h-4 text-[#F5B942]" />
                  <span className="truncate">
                    {selectedFile ? selectedFile.name : 'Click to select .myspace.enc backup file'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Decryption PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={importPin}
                    onChange={(e) => setImportPin(e.target.value)}
                    placeholder="Enter PIN used to encrypt this file"
                    className="w-full pl-8 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                  />
                  <Lock className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-2.5" />
                </div>
              </div>

              {hasExistingWorkspaceData && (
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmOverwrite}
                    onChange={(e) => setConfirmOverwrite(e.target.checked)}
                    className="mt-0.5 accent-[#F5B942]"
                  />
                  <span>
                    I confirm replacing the current local workspace on this device with the backup contents. My <code className="text-[#F5B942]">.myspace.enc</code> file stays intact for rollback.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || !selectedFile || (hasExistingWorkspaceData && !confirmOverwrite)}
                className="w-full py-2.5 gold-btn font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Decrypting & Restoring...' : 'Verify PIN & Restore Workspace'}</span>
              </button>

              {legacyLocalAccounts.length > 0 && (
                <div className="pt-3 border-t theme-divider flex items-center justify-between gap-3 text-[11px]">
                  <span className="theme-text-muted">
                    Verified migrated workspace? Remove obsolete local password entries.
                  </span>
                  <button
                    type="button"
                    onClick={clearObsoleteLegacyRecords}
                    className="shrink-0 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold transition-colors"
                  >
                    Clean Legacy List
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
