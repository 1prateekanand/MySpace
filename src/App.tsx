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

const MainAppContent: React.FC = () => {
  const { currentPage } = useMySpace();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      {/* Supabase Connection & Auth Modal */}
      <SupabaseAuthModal />

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
