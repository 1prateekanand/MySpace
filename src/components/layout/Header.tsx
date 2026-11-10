import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Link2,
  CheckSquare,
  FolderLock,
  Settings,
  Check,
  Trash2,
  ExternalLink,
  Lock,
  LogOut,
  HardDrive,
  Download,
  Shield,
  Laptop
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from '../common/MySpaceLogo';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentPage,
    setCurrentPage,
    theme,
    toggleTheme,
    user,
    supabaseUser,
    workspaceNamespace,
    lockWorkspace,
    signOutSupabase,
    setIsBackupModalOpen,
    setIsSearchOpen,
    notifications,
    unreadNotifsCount,
    markNotifAsRead,
    markAllNotifsAsRead,
    clearAllNotifs,
  } = useMySpace();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageMeta = () => {
    switch (currentPage) {
      case 'links':
        return {
          icon: <Link2 className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
          title: 'Links',
          placeholder: 'Search links...',
        };
      case 'work-list':
        return {
          icon: <CheckSquare className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
          title: 'Work List',
          placeholder: 'Search tasks, projects...',
        };
      case 'vault':
        return {
          icon: <FolderLock className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
          title: 'MyVault',
          placeholder: 'Search files & folders...',
        };
      case 'settings':
        return {
          icon: <Settings className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
          title: 'Settings',
          placeholder: 'Search settings...',
        };
      default:
        return {
          icon: <Link2 className="w-6 h-6 text-[#D99A1C] dark:text-[#F5B942] stroke-[2.2]" />,
          title: 'Links',
          placeholder: 'Search links...',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="sticky top-0 z-30 shrink-0 theme-bg-main/90 backdrop-blur-md theme-border-main border-b px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile MySpace Logo */}
        <div className="md:hidden">
          <MySpaceLogo size="sm" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center shrink-0">
            {meta.icon}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight theme-text-primary flex items-center">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Search bar & Utilities */}
      <div className="flex items-center gap-3">
        {/* Search Input Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl theme-bg-card hover:theme-bg-card-hover border theme-border-card theme-text-secondary text-xs transition-all w-60 md:w-72 justify-between group shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 theme-text-muted group-hover:text-[#F5B942] transition-colors" />
            <span className="truncate">{meta.placeholder}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono theme-bg-card-secondary theme-text-muted rounded theme-border-card border shadow-xs">
            Ctrl + K
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 rounded-xl theme-bg-card border theme-border-card theme-text-muted hover:theme-text-primary"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl theme-bg-card hover:theme-bg-card-hover border theme-border-card theme-text-secondary hover:theme-text-primary transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5B942] ring-2 ring-black/40 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 theme-bg-card border theme-border-card rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="p-3.5 theme-divider border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider theme-text-primary">
                    Notifications
                  </h3>
                  {unreadNotifsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F5B942]/20 text-[#D99A1C] dark:text-[#F5B942] border border-[#F5B942]/40">
                      {unreadNotifsCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={markAllNotifsAsRead}
                      title="Mark all as read"
                      className="p-1 rounded-md theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={clearAllNotifs}
                    title="Clear all"
                    className="p-1 rounded-md theme-text-muted hover:text-rose-400 hover:theme-bg-card-hover transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs theme-text-muted">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotifAsRead(notif.id);
                        if (notif.actionLink) {
                          setCurrentPage(notif.actionLink.page);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3 hover:theme-bg-card-hover transition-colors cursor-pointer text-left flex gap-3 ${
                        !notif.read ? 'bg-[#F5B942]/5' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.type === 'warning'
                            ? 'bg-amber-400'
                            : notif.type === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-[#F5B942]'
                        } ${!notif.read ? 'ring-2 ring-[#F5B942]/40' : 'opacity-40'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold theme-text-primary truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] theme-text-muted shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs theme-text-secondary line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-xl theme-bg-card hover:theme-bg-card-hover border theme-border-card text-[#D99A1C] dark:text-[#F5B942] transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* User Profile Menu with Lock & Backup */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D6AD60] to-[#F5B942] text-[#0A0A0A] font-bold text-xs flex items-center justify-center ring-2 ring-[#F5B942]/40 shadow-md shadow-[#F5B942]/10 hover:scale-105 transition-transform cursor-pointer"
            title={`Account: ${user.name}`}
            aria-label="User Account Menu"
          >
            {user.initials}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl theme-bg-card border theme-border-card shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs">
              {/* User Identity info */}
              <div className="p-3 rounded-xl theme-bg-card-secondary mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D6AD60] to-[#F5B942] text-black font-bold text-xs flex items-center justify-center shrink-0">
                    {user.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold theme-text-primary truncate">{user.name}</p>
                    <p className="text-[11px] theme-text-muted truncate">{supabaseUser?.email || user.email}</p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t theme-divider flex items-center gap-1.5 text-[10px] theme-text-muted font-mono">
                  <Laptop className="w-3 h-3 text-[#F5B942] shrink-0" />
                  <span className="truncate" title={workspaceNamespace}>
                    {workspaceNamespace
                      ? workspaceNamespace.replace('myspace:', '').slice(0, 22) + '...'
                      : 'local-device'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    lockWorkspace();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left theme-text-primary hover:theme-bg-card-hover flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#F5B942]" />
                    <span className="font-semibold">Lock Workspace</span>
                  </div>
                  <span className="text-[10px] theme-text-muted">PIN Lock</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsBackupModalOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left theme-text-primary hover:theme-bg-card-hover flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-[#F5B942]" />
                    <span className="font-semibold">Encrypted Backup & Portability</span>
                  </div>
                  <span className="text-[10px] theme-text-muted">.enc</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setCurrentPage('settings');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left theme-text-primary hover:theme-bg-card-hover flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Account & Preferences</span>
                </button>

                <div className="my-1 border-t theme-divider" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOutSupabase();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
