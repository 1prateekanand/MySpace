import React, { useState } from 'react';
import { MySpaceProvider, useMySpace } from './context/MySpaceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LinksView } from './components/links/LinksView';
import { WorkListView } from './components/worklist/WorkListView';
import { VaultView } from './components/vault/VaultView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ToastContainer } from './components/common/ToastContainer';
import { SupabaseAuthModal } from './components/common/SupabaseAuthModal';
import { BackupRestoreModal } from './components/common/BackupRestoreModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { UnlockScreen } from './components/auth/UnlockScreen';
import { MySpaceLogo } from './components/common/MySpaceLogo';

const PasswordRecoveryScreen: React.FC = () => {
  const { completePasswordRecovery, cancelPasswordRecovery, supabaseUser } = useMySpace();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await completePasswordRecovery(newPassword);
      if (res.error) setErrorMsg(res.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#070709] text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111115] border border-[#F5B942]/50 rounded-3xl p-7 shadow-2xl space-y-5">
        <div className="flex flex-col items-center text-center">
          <MySpaceLogo size="lg" />
          <h2 className="mt-3 text-xl font-extrabold text-white">Set New Password</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Updating password for <span className="text-[#F5B942] font-mono">{supabaseUser?.email}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min 6 characters)"
            className="w-full px-4 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-[#F5B942]"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className="w-full px-4 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-[#F5B942]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#F9D06B] via-[#F5B942] to-[#E5A92D] text-[#0A0803] font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
          <button
            type="button"
            onClick={cancelPasswordRecovery}
            className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const {
    currentPage,
    isAuthLoading,
    supabaseUser,
    isPasswordRecoveryMode,
    isWorkspaceLocked,
  } = useMySpace();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Initial Authentication & Security Loading State
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-[#070709] flex flex-col items-center justify-center text-zinc-300">
        <div className="relative mb-4 animate-pulse">
          <MySpaceLogo size="xl" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#F5B942]">
          <span className="w-2 h-2 rounded-full bg-[#F5B942] animate-ping" />
          <span>Initializing MySpace Secure Workspace...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Show Login / Registration Screen
  if (!supabaseUser) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  // 2.5 Password Recovery Mode (when returning via Supabase email reset link)
  if (isPasswordRecoveryMode) {
    return (
      <>
        <PasswordRecoveryScreen />
        <ToastContainer />
      </>
    );
  }

  // 3. Authenticated but Local Workspace Locked / First-time PIN setup
  if (isWorkspaceLocked) {
    return (
      <>
        <UnlockScreen />
        <ToastContainer />
      </>
    );
  }

  // 4. Authenticated & Unlocked: Full MySpace Experience
  return (
    <div className="h-[100dvh] w-screen overflow-hidden theme-bg-main theme-text-primary flex flex-col md:flex-row antialiased selection:bg-[#F5B942]/30 selection:text-[#F5B942] transition-colors duration-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden theme-bg-content">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Dynamic Page Component */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {currentPage === 'links' && <LinksView />}
          {currentPage === 'work-list' && <WorkListView />}
          {currentPage === 'vault' && <VaultView />}
          {currentPage === 'settings' && <SettingsView />}
          {!['links', 'work-list', 'vault', 'settings'].includes(currentPage) && <LinksView />}
        </main>
      </div>

      {/* Global Search Command Palette (Ctrl + K) */}
      <GlobalSearchModal />

      {/* Supabase Connection Modal (for credentials tuning) */}
      <SupabaseAuthModal />

      {/* Encrypted Backup & Restore Modal */}
      <BackupRestoreModal />

      {/* Global Toast Feedback */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MySpaceProvider>
      <MainAppContent />
    </MySpaceProvider>
  );
}
