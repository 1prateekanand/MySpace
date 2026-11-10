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

const MainAppContent: React.FC = () => {
  const {
    currentPage,
    isAuthLoading,
    supabaseUser,
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
