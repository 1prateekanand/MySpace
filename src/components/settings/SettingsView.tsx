import React, { useState, useRef } from 'react';
import {
  User,
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Keyboard,
  Shield,
  Bell,
  Sparkles,
  Check,
  Save,
  Database
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

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
    isSupabaseConfigured,
    supabaseUser,
    setIsAuthModalOpen,
  } = useMySpace();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [initials, setInitials] = useState(user.initials);
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Hidden file input for restore */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* User Profile Card */}
      <div className="bg-[#131929] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Profile Information</h3>
              <p className="text-xs text-slate-400">
                Update your personal info and display credentials
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center ring-2 ring-purple-500/30">
            {initials}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                className="w-full px-3.5 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initials Badge
              </label>
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workspace Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Product Lead / Engineer"
                className="w-full px-3.5 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-1.5 transition-all hover:scale-105"
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

      {/* Supabase Database & Storage Integration Card */}
      <div className="bg-[#131929] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database & Supabase Storage</h3>
              <p className="text-xs text-slate-400">
                PostgreSQL database connection, user authentication, and cloud document storage
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
              isSupabaseConfigured
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-950/60 text-purple-300 border-purple-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
            />
            {isSupabaseConfigured ? 'Supabase Connected' : 'Local Persistence Mode'}
          </span>
        </div>

        <div className="p-4 bg-[#161c2e] border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              {supabaseUser
                ? `Logged in as: ${supabaseUser.email}`
                : isSupabaseConfigured
                ? 'Connected to your Supabase project'
                : 'Offline/Local workspace active with full persistence'}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Row Level Security (RLS) ensures full data privacy and user separation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/supabase/schema.sql';
                link.download = 'myspace-supabase-schema.sql';
                link.click();
              }}
              className="px-3 py-1.5 bg-[#0d121f] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>SQL Schema</span>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Configure Connection
            </button>
          </div>
        </div>
      </div>
      <div className="bg-[#131929] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Theme & Appearance</h3>
            <p className="text-xs text-slate-400">
              Customize contrast and dark midnight styling
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-[#161c2e] border border-slate-700/60 rounded-xl">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-purple-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                {theme === 'dark' ? 'Midnight Navy Dark Theme' : 'Light Theme'}
              </span>
              <span className="text-[11px] text-slate-400">
                {theme === 'dark'
                  ? 'Optimized for high-contrast low-glare productivity'
                  : 'Crisp high-readability daytime mode'}
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-[#0d121f] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition-colors"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Data Management & Backups */}
      <div className="bg-[#131929] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Data & Backups</h3>
          <p className="text-xs text-slate-400">
            Export or restore all bookmarks, tasks, and document metadata as JSON
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={exportAllData}
            className="p-4 bg-[#161c2e] hover:bg-[#1a233a] border border-slate-700/60 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
          >
            <Download className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200">Export Backup</span>
            <span className="text-[10px] text-slate-400">Download complete workspace JSON</span>
          </button>

          <button
            onClick={() => importFileRef.current?.click()}
            className="p-4 bg-[#161c2e] hover:bg-[#1a233a] border border-slate-700/60 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
          >
            <Upload className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200">Restore Backup</span>
            <span className="text-[10px] text-slate-400">Import from a JSON file</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all workspace data to original factory defaults?')) {
                resetAllToDefault();
              }
            }}
            className="p-4 bg-[#161c2e] hover:bg-rose-950/20 border border-slate-700/60 hover:border-rose-500/40 rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
          >
            <RotateCcw className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-rose-300">Reset Demo Data</span>
            <span className="text-[10px] text-slate-400">Restore initial reference data</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-[#131929] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Keyboard className="w-4 h-4 text-purple-400" />
          <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-[#161c2e] rounded-xl border border-slate-800">
            <span className="text-slate-300">Global Search & Command Palette</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 font-mono text-purple-300 border border-slate-700">
              Ctrl + K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#161c2e] rounded-xl border border-slate-800">
            <span className="text-slate-300">Close Open Modal / Dialog</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-400 border border-slate-700">
              Esc
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#161c2e] rounded-xl border border-slate-800">
            <span className="text-slate-300">Drag Task to Move Status</span>
            <span className="text-slate-400 font-mono text-[11px]">Click & Drag</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#161c2e] rounded-xl border border-slate-800">
            <span className="text-slate-300">Open Links in New Tab</span>
            <span className="text-slate-400 font-mono text-[11px]">Direct Click</span>
          </div>
        </div>
      </div>
    </div>
  );
};
