import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useMySpace();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            case 'warning':
              return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
            case 'error':
              return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-purple-400 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-500/30 bg-[#121f1e] text-emerald-200';
            case 'warning':
              return 'border-amber-500/30 bg-[#241a10] text-amber-200';
            case 'error':
              return 'border-rose-500/30 bg-[#251016] text-rose-200';
            default:
              return 'border-purple-500/30 bg-[#17152b] text-purple-200';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 fade-in-50 duration-200 ${getBorder()}`}
          >
            <div className="flex items-center gap-2.5">
              {getIcon()}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
