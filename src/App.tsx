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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-purple-600/30 selection:text-purple-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Dynamic Page Component */}
        <main className="flex-1 pb-16">
          {currentPage === 'links' && <LinksView />}
          {currentPage === 'work-list' && <WorkListView />}
          {currentPage === 'vault' && <VaultView />}
          {currentPage === 'settings' && <SettingsView />}
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
