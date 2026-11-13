import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { WorkDashboard } from '../../types';

interface DeleteDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: WorkDashboard | null;
}

export const DeleteDashboardModal: React.FC<DeleteDashboardModalProps> = ({
  isOpen,
  onClose,
  dashboard,
}) => {
  const { dashboards, tasks, deleteDashboard } = useMySpace();

  const isOnlyDashboard = dashboards.length <= 1;
  const otherDashboards = dashboard ? dashboards.filter((d) => d.id !== dashboard.id) : [];
  const tasksInDashboard = dashboard ? tasks.filter((t) => t.dashboardId === dashboard.id) : [];
  const taskCount = tasksInDashboard.length;

  const [taskHandling, setTaskHandling] = useState<'move' | 'delete'>('move');
  const [targetDashboardId, setTargetDashboardId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (isOpen && dashboard) {
      setTaskHandling('move');
      const remaining = dashboards.filter((d) => d.id !== dashboard.id);
      setTargetDashboardId(remaining[0]?.id || '');
      setIsDeleting(false);
    }
  }, [isOpen, dashboard?.id]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !dashboard) return null;

  const handleConfirmDelete = async () => {
    if (isOnlyDashboard) return;

    setIsDeleting(true);
    try {
      if (taskCount > 0 && taskHandling === 'move' && targetDashboardId) {
        await deleteDashboard(dashboard.id, targetDashboardId);
      } else {
        await deleteDashboard(dashboard.id);
      }
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 theme-divider border-b flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-2.5 text-rose-500">
            <Trash2 className="w-4 h-4 shrink-0" />
            <h3 className="text-base font-semibold theme-text-primary">Delete Dashboard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isOnlyDashboard ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1">
                <p className="font-semibold theme-text-primary">Cannot Delete Only Dashboard</p>
                <p className="theme-text-secondary leading-relaxed">
                  Your workspace requires at least one dashboard. Create another dashboard before deleting <strong className="theme-text-primary">"{dashboard.name}"</strong>.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs theme-text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="theme-text-primary">"{dashboard.name}"</strong>? This action cannot be undone.
              </p>

              {taskCount > 0 ? (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span>This dashboard contains {taskCount} task{taskCount === 1 ? '' : 's'}</span>
                  </div>

                  <p className="text-[11px] theme-text-muted">
                    Choose what happens to the tasks inside this dashboard:
                  </p>

                  <div className="space-y-2 text-xs">
                    {/* Move Tasks Option */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      taskHandling === 'move'
                        ? 'border-[#F5B942]/60 bg-[#F5B942]/10 theme-text-primary'
                        : 'border-transparent theme-bg-card-inner theme-text-muted hover:theme-text-primary'
                    }`}>
                      <input
                        type="radio"
                        name="taskHandling"
                        value="move"
                        checked={taskHandling === 'move'}
                        onChange={() => setTaskHandling('move')}
                        className="mt-0.5 accent-[#F5B942]"
                      />
                      <div className="flex-1">
                        <span className="font-semibold block">Move tasks to another dashboard (Recommended)</span>
                        <span className="text-[10px] theme-text-muted block mt-0.5">
                          Preserves all task statuses, checklists, notes, and details.
                        </span>

                        {taskHandling === 'move' && otherDashboards.length > 0 && (
                          <div className="mt-2">
                            <label className="text-[10px] uppercase font-bold theme-text-muted block mb-1">
                              Destination Dashboard:
                            </label>
                            <select
                              value={targetDashboardId}
                              onChange={(e) => setTargetDashboardId(e.target.value)}
                              className="w-full px-2.5 py-1.5 theme-bg-card border theme-border-card rounded-lg text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                            >
                              {otherDashboards.map((d) => (
                                <option key={d.id} value={d.id} className="theme-bg-card theme-text-primary">
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Delete Tasks Option */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      taskHandling === 'delete'
                        ? 'border-rose-500/60 bg-rose-500/15 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        : 'border-transparent theme-bg-card-inner theme-text-muted hover:theme-text-primary'
                    }`}>
                      <input
                        type="radio"
                        name="taskHandling"
                        value="delete"
                        checked={taskHandling === 'delete'}
                        onChange={() => setTaskHandling('delete')}
                        className="mt-0.5 accent-rose-500"
                      />
                      <div>
                        <span className="font-semibold block">Delete all {taskCount} tasks permanently</span>
                        <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5">
                          Tasks will be completely removed and cannot be recovered.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl theme-bg-card-inner border theme-border-card text-xs theme-text-muted">
                  This dashboard currently has no tasks.
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 theme-divider border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-medium theme-text-secondary hover:theme-text-primary theme-bg-card-secondary hover:theme-bg-card-hover rounded-xl transition-colors cursor-pointer"
            >
              {isOnlyDashboard ? 'Close' : 'Cancel'}
            </button>

            {!isOnlyDashboard && (
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {taskCount > 0 && taskHandling === 'move'
                        ? 'Move Tasks & Delete'
                        : 'Delete Dashboard'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
