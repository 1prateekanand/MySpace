import React from 'react';
import { AlertTriangle, Trash2, X, ArrowRight } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  itemDetails?: {
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
  };
  // Extra slot for choices (e.g. move links before deleting category)
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  itemDetails,
  children,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLoading) return;
    await onConfirm();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 theme-text-primary"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 theme-divider border-b theme-bg-card-secondary">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                variant === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text-primary tracking-tight">{title}</h3>
              <p className="text-[11px] theme-text-muted">Confirm action to proceed</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-hover transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs theme-text-secondary leading-relaxed">{message}</p>

          {/* Item Preview Card if provided */}
          {itemDetails && (
            <div className="flex items-center gap-3 p-3 rounded-xl theme-bg-card-inner border theme-border-card text-left">
              {itemDetails.icon}
              <div className="truncate flex-1">
                <div className="text-xs font-semibold theme-text-primary truncate">
                  {itemDetails.title}
                </div>
                {itemDetails.subtitle && (
                  <div className="text-[11px] theme-text-muted truncate">
                    {itemDetails.subtitle}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional custom content slot (e.g. migrate links dropdown) */}
          {children}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 theme-divider border-t theme-bg-card-secondary">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium theme-text-secondary hover:theme-text-primary hover:theme-bg-card-hover border theme-border-card transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 hover:scale-[1.02]'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40 hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
