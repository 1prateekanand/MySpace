import React, { useState, useRef } from 'react';
import {
  User,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Check,
  Save,
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from '../common/MySpaceLogo';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUser,
    theme,
    toggleTheme,
    resetAllToDefault,
    exportAllData,
    importAllData,
    addNotification,
  } = useMySpace();

  const [name, setName] = useState(user?.name || 'Prateek Anand');
  const [email, setEmail] = useState(user?.email || 'prateekanand02@gmail.com');
  const [role, setRole] = useState(user?.role || 'Product Engineer');
  const [initials, setInitials] = useState(user?.initials || 'PA');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      initials: initials.trim() || name.slice(0, 2).toUpperCase(),
    });
    setSavedSuccess(true);
    addNotification('Profile Updated', 'Your profile settings have been saved.', 'success');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importAllData(content);
      }
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Hidden file input for restore */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* User Profile Card */}
      <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b theme-divider">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/25 flex items-center justify-center text-[#D99A1C] dark:text-[#F5B942]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold theme-text-primary">Profile Information</h3>
              <p className="text-xs theme-text-muted">
                Update your personal info and display credentials
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D99A1C] to-[#F5B942] text-black font-bold text-sm flex items-center justify-center ring-2 ring-[#F5B942]/40 shadow-sm">
            {initials}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  const parts = e.target.value.trim().split(' ');
                  if (parts.length >= 2) {
                    setInitials(`${parts[0][0]}${parts[1][0]}`.toUpperCase());
                  } else if (parts[0]) {
                    setInitials(parts[0].slice(0, 2).toUpperCase());
                  }
                }}
                className="w-full px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Initials Badge
              </label>
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary font-mono focus:outline-none focus:border-[#F5B942]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Workspace Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Product Lead / Engineer"
                className="w-full px-3.5 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 gold-btn font-semibold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Theme & Appearance Showcase Card */}
      <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b theme-divider">
          <div>
            <h3 className="text-base font-bold theme-text-primary">Theme & Appearance</h3>
            <p className="text-xs theme-text-muted">
              Choose between Black & Gold (Dark) or White & Gold (Light) visual appearance
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card rounded-xl text-xs font-semibold theme-text-primary flex items-center gap-2 transition-colors shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#F5B942]" />
                <span>Switch to Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#D99A1C]" />
                <span>Switch to Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Visual Selectable Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Black & Gold Card */}
          <div
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
              theme === 'dark'
                ? 'border-[#F5B942] bg-[#14120E] shadow-xl shadow-[#F5B942]/10 ring-2 ring-[#F5B942]/20'
                : 'border-slate-300 dark:border-slate-800 bg-[#0A0A0A] hover:border-[#F5B942]/50 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F5B942]/20 border border-[#F5B942]/40 flex items-center justify-center text-[#F5B942]">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#F5F1E7] block">
                      Black & Gold
                    </span>
                    <span className="text-[10px] text-[#F5B942] font-semibold uppercase tracking-wider">
                      Dark Mode (Recommended)
                    </span>
                  </div>
                </div>

                {theme === 'dark' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F5B942] text-black font-bold text-[10px] flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" /> Active
                  </span>
                )}
              </div>

              {/* Visual Preview Swatch */}
              <div className="rounded-xl border border-[#3A2D19] bg-[#0A0A0A] p-3 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F5B942]" />
                    <div className="w-12 h-2 rounded bg-[#2A2318]" />
                  </div>
                  <div className="w-8 h-2 rounded bg-[#F5B942]/40" />
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="h-7 rounded-lg bg-[#14120E] border border-[#3A2D19]" />
                  <div className="h-7 rounded-lg bg-[#1A1711] border border-[#3A2D19]" />
                  <div className="h-7 rounded-lg bg-[#14120E] border border-[#F5B942]/40" />
                </div>
              </div>

              <p className="text-[11px] text-[#B8B0A0] leading-relaxed">
                Deep midnight carbon background with rich champagne gold highlights and warm typography.
              </p>
            </div>
          </div>

          {/* White & Gold Card */}
          <div
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
              theme === 'light'
                ? 'border-[#E9A817] bg-[#FFFFFF] shadow-xl shadow-[#E9A817]/10 ring-2 ring-[#E9A817]/20 text-[#171717]'
                : 'border-slate-300 dark:border-slate-800 bg-white hover:border-[#E9A817]/50 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E9A817]/20 border border-[#E9A817]/40 flex items-center justify-center text-[#E9A817]">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171717] block">
                      White & Gold
                    </span>
                    <span className="text-[10px] text-[#E9A817] font-semibold uppercase tracking-wider">
                      Light Mode
                    </span>
                  </div>
                </div>

                {theme === 'light' && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E9A817] text-black font-bold text-[10px] flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" /> Active
                  </span>
                )}
              </div>

              {/* Visual Preview Swatch */}
              <div className="rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-3 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E9A817]" />
                    <div className="w-12 h-2 rounded bg-[#E5E5E5]" />
                  </div>
                  <div className="w-8 h-2 rounded bg-[#E9A817]/40" />
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="h-7 rounded-lg bg-[#FFFFFF] border border-[#E5E5E5]" />
                  <div className="h-7 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5]" />
                  <div className="h-7 rounded-lg bg-[#FFFFFF] border border-[#E9A817]/40" />
                </div>
              </div>

              <p className="text-[11px] text-[#666666] leading-relaxed">
                Crisp white and warm champagne surfaces with gold accents for a clean, daytime workspace.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standard JSON Data Management */}
      <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl space-y-4">
        <div className="pb-3 border-b theme-divider">
          <h3 className="text-base font-bold theme-text-primary">Data & Backups</h3>
          <p className="text-xs theme-text-muted">
            Export or restore workspace entities as standard JSON
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={exportAllData}
            className="p-4 theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group cursor-pointer"
          >
            <Download className="w-5 h-5 text-[#D99A1C] dark:text-[#F5B942] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold theme-text-primary">Export JSON</span>
            <span className="text-[10px] theme-text-muted">Download raw JSON file</span>
          </button>

          <button
            onClick={() => importFileRef.current?.click()}
            className="p-4 theme-bg-card-secondary hover:theme-bg-card-hover border theme-border-card rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group cursor-pointer"
          >
            <Upload className="w-5 h-5 text-[#D99A1C] dark:text-[#F5B942] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold theme-text-primary">Restore JSON</span>
            <span className="text-[10px] theme-text-muted">Import from raw JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all workspace data to original factory defaults?')) {
                resetAllToDefault();
              }
            }}
            className="p-4 theme-bg-card-secondary hover:bg-rose-950/20 border theme-border-card hover:border-rose-500/40 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-rose-300">Reset Demo Data</span>
            <span className="text-[10px] theme-text-muted">Restore initial reference data</span>
          </button>
        </div>
      </div>

      {/* About MySpace Official Branding Card */}
      <div className="theme-bg-card border theme-border-card rounded-2xl p-6 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <MySpaceLogo size="lg" />
          <div>
            <h3 className="text-base font-bold theme-text-primary tracking-tight">
              MySpace Personal Suite
            </h3>
            <p className="text-xs theme-text-muted mt-0.5">
              3D Golden & Black Maze Edition • Centralized Bookmarks, Kanban Work List & Document Vault
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F5B942]/10 border border-[#F5B942]/30 text-[#D99A1C] dark:text-[#F5B942]">
          v2.4.0
        </span>
      </div>
    </div>
  );
};
