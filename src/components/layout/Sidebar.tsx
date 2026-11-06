import React, { useState } from 'react';
import {
  Link2,
  CheckSquare,
  FolderLock,
  Settings,
  FolderGit2,
  BookOpen,
  User,
  Plus,
  Box,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { NavPage } from '../../types';

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
    dashboards,
    activeDashboardId,
    setActiveDashboardId,
    user,
    theme,
    toggleTheme,
    resetAllToDefault,
  } = useMySpace();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
    { id: 'links', label: 'Links', icon: <Link2 className="w-5 h-5" /> },
    { id: 'work-list', label: 'Work List', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'vault', label: 'MyVault', icon: <FolderLock className="w-5 h-5" /> },
  ];

  const handleNavClick = (page: NavPage) => {
    setCurrentPage(page);
    if (setIsMobileOpen) setIsMobileOpen(false);
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
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0d121f] border-r border-slate-800/80 z-50 flex flex-col justify-between select-none transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
          {/* Logo & Workspace selector */}
          <div className="relative">
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/30">
                  <Box className="w-5 h-5 text-white stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-base tracking-tight group-hover:text-purple-300 transition-colors">
                      MySpace
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                  </div>
                  <span className="text-[11px] text-slate-400 tracking-wide">Personal Suite</span>
                </div>
              </div>
            </button>

            {/* Workspace dropdown */}
            {isWorkspaceMenuOpen && (
              <div className="absolute top-14 left-2 right-2 bg-[#161c2e] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Active Workspace
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-600/20 text-purple-200 text-xs font-medium">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  Personal Workspace
                </div>
                <div className="border-t border-slate-700/50 my-1" />
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    handleNavClick('settings');
                  }}
                  className="w-full text-left text-xs text-slate-300 hover:bg-slate-800/60 p-2 rounded-lg transition-colors"
                >
                  Workspace Settings
                </button>
              </div>
            )}
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left relative ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-purple-700/80 to-indigo-600/80 shadow-lg shadow-purple-900/30 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-purple-300 shadow-sm shadow-purple-300 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dashboards Section (when on Work List or always visible for quick access) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dashboards
              </span>
              <button
                onClick={() => {
                  if (onOpenNewDashboard) onOpenNewDashboard();
                  else handleNavClick('work-list');
                }}
                title="Create New Dashboard"
                className="w-5 h-5 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {dashboards.map((dash) => {
                const isActive = currentPage === 'work-list' && activeDashboardId === dash.id;
                const getDashIcon = () => {
                  if (dash.id === 'dash-learnings') return <BookOpen className="w-4 h-4" />;
                  if (dash.id === 'dash-personal') return <User className="w-4 h-4" />;
                  return <FolderGit2 className="w-4 h-4" />;
                };

                return (
                  <button
                    key={dash.id}
                    onClick={() => {
                      setActiveDashboardId(dash.id);
                      if (currentPage !== 'work-list') {
                        handleNavClick('work-list');
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-purple-950/60 text-purple-200 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <span className={`${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                      {getDashIcon()}
                    </span>
                    <span className="truncate">{dash.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#0c101c]">
          {/* Settings Nav Item */}
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              currentPage === 'settings'
                ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {/* User Profile Bar */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-purple-500/20 shadow-sm">
                  {user.initials}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Profile Popover Menu */}
            {isProfileMenuOpen && (
              <div className="absolute bottom-14 left-0 right-0 bg-[#161c2e] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1.5 border-b border-slate-700/50">
                  <p className="text-xs font-medium text-slate-200">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                </div>

                <button
                  onClick={() => {
                    toggleTheme();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-purple-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                    Theme
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">{theme}</span>
                </button>

                <button
                  onClick={() => {
                    handleNavClick('settings');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Account Preferences
                </button>

                <button
                  onClick={() => {
                    if (confirm('Reset workspace to default demo data?')) {
                      resetAllToDefault();
                    }
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  Reset to Default
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
