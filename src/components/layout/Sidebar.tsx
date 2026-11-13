import React, { useState, useEffect } from 'react';
import {
  Link2,
  CheckSquare,
  FolderLock,
  Settings,
  FolderGit2,
  BookOpen,
  User,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  Rocket,
  Target,
  Shield
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { NavPage } from '../../types';
import { NewDashboardModal } from '../worklist/NewDashboardModal';
import { MySpaceLogo } from '../common/MySpaceLogo';

interface SidebarProps {
  onOpenNewDashboard?: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewDashboard,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const {
    currentPage,
    setCurrentPage,
    setSelectedCategoryFilter,
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    setCurrentFolderId,
    user,
    theme,
    toggleTheme,
  } = useMySpace();

  // Work List dropdown expansion state (persisted in localStorage)
  const [isWorkListExpanded, setIsWorkListExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('myspace_sidebar_worklist_expanded');
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  // Automatically expand dropdown when user is viewing any Work List subpage
  useEffect(() => {
    if (currentPage === 'work-list') {
      setIsWorkListExpanded(true);
    }
  }, [currentPage]);

  // Sync Work List expansion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('myspace_sidebar_worklist_expanded', JSON.stringify(isWorkListExpanded));
    } catch {}
  }, [isWorkListExpanded]);

  // Modals & popovers state
  const [isNewDashboardOpen, setIsNewDashboardOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleNavClick = (page: NavPage) => {
    setCurrentPage(page);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  // Dashboard Icon helper
  const getDashboardIcon = (iconName?: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className={className} />;
      case 'User': return <User className={className} />;
      case 'Rocket': return <Rocket className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Shield': return <Shield className={className} />;
      default: return <FolderGit2 className={className} />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-full w-64 shrink-0 theme-bg-sidebar theme-border-main border-r z-50 flex flex-col justify-between select-none transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Scrollable Nav Hierarchy */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo & Workspace selector */}
          <div className="p-4 pb-2 relative shrink-0">
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-[#1A1711] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <MySpaceLogo size="lg" className="group-hover:scale-105 transition-transform shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold theme-text-primary text-base sm:text-lg tracking-tight group-hover:text-[#F5B942] transition-colors">
                    MySpace
                  </span>
                  <ChevronDown className="w-4 h-4 theme-text-muted group-hover:theme-text-primary transition-colors" />
                </div>
              </div>
            </button>

            {/* Workspace dropdown */}
            {isWorkspaceMenuOpen && (
              <div className="absolute top-14 left-4 right-4 theme-bg-card theme-border-card border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="text-[10px] font-semibold theme-text-muted uppercase tracking-wider px-2 py-1">
                  Active Workspace
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F5B942]/15 dark:bg-[#F5B942]/20 text-[#D99A1C] dark:text-[#F5B942] text-xs font-medium border border-[#F5B942]/30">
                  <MySpaceLogo size="xs" withContainer={false} className="w-4 h-4 shrink-0" />
                  <span>Personal Workspace</span>
                </div>
                <div className="theme-divider border-t my-1" />
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    handleNavClick('settings');
                  }}
                  className="w-full text-left text-xs theme-text-secondary hover:theme-bg-card-hover p-2 rounded-lg transition-colors cursor-pointer"
                >
                  Workspace Settings
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Navigation Tree Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pr-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted px-3.5 pb-2">
                Main Navigation
              </div>

              <div className="space-y-1">
                {/* ======================================================== */}
                {/* 1. LINKS – Standalone Navigation Item                    */}
                {/* ======================================================== */}
                <div>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter('all');
                      handleNavClick('links');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer relative text-left ${
                      currentPage === 'links'
                        ? 'gold-nav-active'
                        : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Link2
                        className={`w-5 h-5 shrink-0 ${
                          currentPage === 'links' ? 'text-[#D99A1C] dark:text-[#F5B942]' : 'theme-text-muted'
                        }`}
                      />
                      <span className={currentPage === 'links' ? 'font-semibold' : ''}>Links</span>
                    </div>
                    {currentPage === 'links' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F5B942] animate-pulse" />
                    )}
                  </button>
                </div>

                {/* ======================================================== */}
                {/* 2. WORK LIST – Expandable Dropdown                       */}
                {/* ======================================================== */}
                <div className="space-y-1">
                  <div
                    onClick={() => {
                      if (currentPage === 'work-list') {
                        setIsWorkListExpanded(!isWorkListExpanded);
                      } else {
                        handleNavClick('work-list');
                        setIsWorkListExpanded(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer relative ${
                      currentPage === 'work-list'
                        ? 'gold-nav-active'
                        : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckSquare
                        className={`w-5 h-5 shrink-0 ${
                          currentPage === 'work-list'
                            ? 'text-[#D99A1C] dark:text-[#F5B942]'
                            : 'theme-text-muted'
                        }`}
                      />
                      <span className={currentPage === 'work-list' ? 'font-semibold' : ''}>
                        Work List
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsWorkListExpanded(!isWorkListExpanded);
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 theme-text-muted hover:theme-text-primary transition-colors cursor-pointer"
                      title={isWorkListExpanded ? 'Collapse Work List' : 'Expand Work List'}
                    >
                      {isWorkListExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Submenu: Dashboards (Working Projects, My Learnings, Personal) */}
                  {isWorkListExpanded && (
                    <div className="pl-4 pr-1 space-y-0.5 pt-1 animate-in fade-in-50 duration-150">
                      {dashboards.map((dash) => {
                        const isActive =
                          currentPage === 'work-list' && activeDashboardId === dash.id;

                        return (
                          <button
                            key={dash.id}
                            onClick={() => {
                              setActiveDashboardId(dash.id);
                              handleNavClick('work-list');
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                              isActive
                                ? 'bg-[#F5B942]/15 dark:bg-[#241D12] text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/40 font-semibold shadow-xs'
                                : 'theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover'
                            }`}
                          >
                            <span
                              className={
                                isActive
                                  ? 'text-[#D99A1C] dark:text-[#F5B942]'
                                  : 'theme-text-muted'
                              }
                            >
                              {getDashboardIcon(dash.icon, 'w-4 h-4')}
                            </span>
                            <span className="truncate">{dash.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* 3. MYVAULT – Standalone Navigation Item                  */}
                {/* ======================================================== */}
                <div>
                  <button
                    onClick={() => {
                      setCurrentFolderId(null);
                      handleNavClick('vault');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer relative text-left ${
                      currentPage === 'vault'
                        ? 'gold-nav-active'
                        : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderLock
                        className={`w-5 h-5 shrink-0 ${
                          currentPage === 'vault'
                            ? 'text-[#D99A1C] dark:text-[#F5B942]'
                            : 'theme-text-muted'
                        }`}
                      />
                      <span className={currentPage === 'vault' ? 'font-semibold' : ''}>
                        MyVault
                      </span>
                    </div>
                    {currentPage === 'vault' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F5B942] animate-pulse" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="p-3 theme-divider border-t space-y-2 theme-bg-sidebar shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider theme-text-muted px-3.5 pt-1">
            Settings
          </div>

          {/* Settings Nav Item */}
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
              currentPage === 'settings'
                ? 'gold-nav-active'
                : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover'
            }`}
          >
            <Settings
              className={`w-4 h-4 ${
                currentPage === 'settings'
                  ? 'text-[#D99A1C] dark:text-[#F5B942]'
                  : 'theme-text-muted'
              }`}
            />
            <span>Settings</span>
          </button>

          {/* User Profile Bar */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:theme-bg-card-hover transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D6AD60] to-[#F5B942] text-[#0A0A0A] font-bold text-xs flex items-center justify-center ring-2 ring-[#F5B942]/30 shadow-sm">
                  {user?.initials || 'PA'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold theme-text-primary truncate">
                    {user?.name || 'Prateek Anand'}
                  </div>
                  <div className="text-[10px] theme-text-muted truncate">
                    {user?.email || 'prateekanand02@gmail.com'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 theme-text-muted shrink-0" />
            </button>

            {/* Profile Popover Menu */}
            {isProfileMenuOpen && (
              <div className="absolute bottom-14 left-0 right-0 theme-bg-card theme-border-card border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1.5 theme-divider border-b">
                  <p className="text-xs font-medium theme-text-primary">{user.name}</p>
                  <p className="text-[10px] theme-text-muted truncate">{user.role}</p>
                </div>

                <button
                  onClick={() => {
                    toggleTheme();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs theme-text-secondary hover:theme-bg-card-hover transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-[#F5B942]" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-[#E9A817]" />
                    )}
                    Theme
                  </span>
                  <span className="text-[10px] theme-text-muted capitalize">
                    {theme === 'dark' ? 'Black & Gold' : 'White & Gold'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleNavClick('settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs theme-text-secondary hover:theme-bg-card-hover transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 theme-text-muted" />
                  Account Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Creation Modal */}
      <NewDashboardModal
        isOpen={isNewDashboardOpen}
        onClose={() => setIsNewDashboardOpen(false)}
      />
    </>
  );
};
