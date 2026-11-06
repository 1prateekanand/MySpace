import React, { useState } from 'react';
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
  Database
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

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
    setIsSearchOpen,
    isSupabaseConfigured,
    supabaseUser,
    setIsAuthModalOpen,
    notifications,
    unreadNotifsCount,
    markNotifAsRead,
    markAllNotifsAsRead,
    clearAllNotifs,
  } = useMySpace();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getPageMeta = () => {
    switch (currentPage) {
      case 'links':
        return {
          icon: <Link2 className="w-6 h-6 text-purple-400 stroke-[2.2]" />,
          title: 'Links',
          subtitle: 'All your important websites, organized by categories',
          placeholder: 'Search links...',
        };
      case 'work-list':
        return {
          icon: <CheckSquare className="w-6 h-6 text-purple-400 stroke-[2.2]" />,
          title: 'Work List',
          subtitle: 'Manage projects, tasks and track your progress',
          placeholder: 'Search tasks, projects...',
        };
      case 'vault':
        return {
          icon: <FolderLock className="w-6 h-6 text-purple-400 stroke-[2.2]" />,
          title: 'MyVault',
          subtitle: 'All your documents, notes, and important files in one place',
          placeholder: 'Search files & folders...',
        };
      case 'settings':
        return {
          icon: <Settings className="w-6 h-6 text-purple-400 stroke-[2.2]" />,
          title: 'Settings',
          subtitle: 'Configure your profile, appearance, and workspace backups',
          placeholder: 'Search settings...',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="sticky top-0 z-30 bg-[#0d121f]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile hamburger + Page Title & Subtitle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {meta.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Search bar & Utilities */}
      <div className="flex items-center gap-3">
        {/* Search Input Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#161c2e] hover:bg-[#1a2238] border border-slate-700/60 text-slate-400 text-xs transition-all w-60 md:w-72 justify-between group shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
            <span className="truncate">{meta.placeholder}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800/90 text-slate-400 rounded border border-slate-700/60 shadow-xs">
            Ctrl + K
          </kbd>
        </button>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden p-2 rounded-xl bg-[#161c2e] border border-slate-700/60 text-slate-400 hover:text-white"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Database Status Button */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isSupabaseConfigured
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-purple-950/40 border-purple-500/30 text-purple-300 hover:bg-purple-900/40'
          }`}
          title="Supabase PostgreSQL & Auth Status"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSupabaseConfigured ? 'Supabase' : 'Local DB'}</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSupabaseConfigured ? 'bg-emerald-400' : 'bg-purple-400'
            }`}
          />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-[#161c2e] hover:bg-[#1a2238] border border-slate-700/60 text-slate-300 hover:text-white transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0d121f] animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161c2e] border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
              <div className="p-3.5 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Notifications
                  </h3>
                  {unreadNotifsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadNotifsCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={markAllNotifsAsRead}
                      title="Mark all as read"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={clearAllNotifs}
                    title="Clear all"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
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
                      className={`p-3 hover:bg-slate-800/40 transition-colors cursor-pointer text-left flex gap-3 ${
                        !notif.read ? 'bg-purple-950/20' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.type === 'warning'
                            ? 'bg-amber-400'
                            : notif.type === 'success'
                            ? 'bg-emerald-400'
                            : 'bg-purple-400'
                        } ${!notif.read ? 'ring-2 ring-purple-400/30' : 'opacity-40'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
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
          className="p-2 rounded-xl bg-[#161c2e] hover:bg-[#1a2238] border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-purple-400" />
          )}
        </button>

        {/* User Avatar Circle */}
        <button
          onClick={() => setCurrentPage('settings')}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-purple-500/30 shadow-md shadow-purple-900/40 hover:scale-105 transition-transform"
          title={`Signed in as ${user.name}`}
        >
          {user.initials}
        </button>
      </div>
    </header>
  );
};
