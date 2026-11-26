import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const ToastViewport: React.FC = () => {
  const { toasts, dismissToast } = useAuction();
  const navigate = useNavigate();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-16 sm:top-5 right-3 left-3 sm:left-auto sm:right-5 z-50 flex flex-col gap-2 sm:w-96 pt-safe"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const icon =
          toast.variant === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : toast.variant === 'warning' || toast.variant === 'danger' ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-indigo-500" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md p-3.5 shadow-lg"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {toast.message}
                </p>
              )}
              {toast.actionLabel && toast.actionLotId && (
                <button
                  type="button"
                  onClick={() => {
                    dismissToast(toast.id);
                    navigate(`/asset/${toast.actionLotId}`);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
