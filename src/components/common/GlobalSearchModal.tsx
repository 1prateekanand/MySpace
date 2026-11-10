import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Link2, CheckSquare, Folder, FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from './MySpaceLogo';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    links,
    tasks,
    folders,
    files,
    setCurrentPage,
    setCurrentFolderId,
    setActiveDashboardId,
    trackLinkClick,
  } = useMySpace();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  // Filter items
  const cleanQuery = query.toLowerCase().trim();

  const matchedLinks = cleanQuery
    ? links.filter(l => l.title.toLowerCase().includes(cleanQuery) || l.url.toLowerCase().includes(cleanQuery))
    : links.slice(0, 4);

  const matchedTasks = cleanQuery
    ? tasks.filter(t => t.title.toLowerCase().includes(cleanQuery) || (t.categoryTag && t.categoryTag.toLowerCase().includes(cleanQuery)))
    : tasks.slice(0, 3);

  const matchedFiles = cleanQuery
    ? files.filter(f => f.name.toLowerCase().includes(cleanQuery) || (f.textContent && f.textContent.toLowerCase().includes(cleanQuery)))
    : files.slice(0, 3);

  const totalResultsCount = matchedLinks.length + matchedTasks.length + matchedFiles.length;

  const handleSelectLink = (url: string, id: string) => {
    trackLinkClick(id);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsSearchOpen(false);
  };

  const handleSelectTask = (dashboardId: string) => {
    setActiveDashboardId(dashboardId);
    setCurrentPage('work-list');
    setIsSearchOpen(false);
  };

  const handleSelectFile = (folderId: string) => {
    setCurrentFolderId(folderId);
    setCurrentPage('vault');
    setIsSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in-50">
      <div
        className="w-full max-w-2xl theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden flex flex-col theme-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b theme-divider theme-bg-card-secondary">
          <Search className="w-5 h-5 text-[#D99A1C] dark:text-[#F5B942] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type to search links, tasks, docs, and folders..."
            className="w-full bg-transparent text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 theme-text-muted hover:theme-text-primary rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-0.5 text-xs theme-text-muted hover:theme-text-primary theme-bg-card-inner rounded border theme-border-card"
          >
            Esc
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {totalResultsCount === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center theme-text-muted text-sm space-y-3">
              <MySpaceLogo size="md" />
              <div>
                <p className="font-semibold theme-text-primary text-xs">
                  No matches found for &ldquo;<span className="text-[#D99A1C] dark:text-[#F5B942]">{query}</span>&rdquo;
                </p>
                <p className="text-[11px] theme-text-muted mt-1">
                  Search across your bookmarks, Kanban tasks, and MyVault files
                </p>
              </div>
            </div>
          )}

          {/* Links Section */}
          {matchedLinks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#D99A1C] dark:text-[#F5B942] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Bookmarks & Links ({matchedLinks.length})
              </div>
              <div className="space-y-1">
                {matchedLinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => handleSelectLink(link.url, link.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:theme-bg-card-hover transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg theme-bg-card-inner border theme-border-card flex items-center justify-center text-xs font-bold theme-text-primary shrink-0 overflow-hidden">
                        {link.favicon ? (
                          <img
                            src={link.favicon}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{link.iconLetter || 'LK'}</span>
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] flex items-center gap-1.5">
                          {link.title}
                          {link.pinned && (
                            <span className="text-[10px] text-[#F5B942]">★</span>
                          )}
                        </div>
                        <div className="text-[11px] theme-text-muted truncate">
                          {link.url}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 theme-text-muted group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          {matchedTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#D99A1C] dark:text-[#F5B942] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Tasks ({matchedTasks.length})
              </div>
              <div className="space-y-1">
                {matchedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleSelectTask(task.dashboardId)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:theme-bg-card-hover transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          task.status === 'done'
                            ? 'bg-emerald-400'
                            : task.status === 'in_progress'
                            ? 'bg-[#F5B942]'
                            : task.status === 'on_hold'
                            ? 'bg-amber-400'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <div className="truncate">
                        <div className="text-xs font-medium theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942]">
                          {task.title}
                        </div>
                        <div className="text-[11px] theme-text-muted flex items-center gap-2">
                          <span className="capitalize">{task.status.replace('_', ' ')}</span>
                          {task.categoryTag && <span>• {task.categoryTag}</span>}
                          {task.dueDate && <span>• Due {task.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 theme-text-muted group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {matchedFiles.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#D99A1C] dark:text-[#F5B942] uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Vault Files & Documents ({matchedFiles.length})
              </div>
              <div className="space-y-1">
                {matchedFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file.folderId)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:theme-bg-card-hover transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded theme-bg-card-inner border theme-border-card flex items-center justify-center text-xs font-mono uppercase text-[#D99A1C] dark:text-[#F5B942] shrink-0">
                        {file.extension.slice(0, 3)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium theme-text-primary group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942]">
                          {file.name}
                        </div>
                        <div className="text-[11px] theme-text-muted">
                          {file.sizeFormatted} • Updated {file.updatedAt}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 theme-text-muted group-hover:text-[#D99A1C] dark:group-hover:text-[#F5B942] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 theme-bg-card-secondary border-t theme-divider text-[11px] theme-text-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MySpaceLogo size="xs" withContainer={false} className="w-4 h-4 opacity-80" />
            <span>MySpace Command Palette • Click any item to jump</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded theme-bg-card-inner border theme-border-card text-[10px]">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
