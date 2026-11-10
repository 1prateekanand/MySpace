import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { safeStorage } from '../../lib/storage';
import { MySpaceLogo } from './MySpaceLogo';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MySpace uncaught rendering error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    try {
      (window as any).__lastReactError = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
    } catch {
      // ignore
    }
  }

  private handleReset = () => {
    try {
      safeStorage.clear();
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center p-6 antialiased">
          <div className="w-full max-w-lg bg-[#131929] border border-rose-500/30 rounded-2xl p-6 shadow-2xl shadow-rose-950/20 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
              <div className="flex items-center gap-2.5">
                <MySpaceLogo size="sm" />
                <span className="font-bold text-sm tracking-tight text-white">MySpace Recovery</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                Safe Mode
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {this.props.fallbackTitle || 'Something interrupted the workspace'}
                </h2>
                <p className="text-xs text-slate-400">
                  The dashboard caught an unexpected issue and kept your workspace safe.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-[#0c101c] border border-slate-800 rounded-xl p-3 font-mono text-xs text-rose-300 overflow-x-auto max-h-40">
                <p className="font-semibold text-rose-400">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleTryAgain}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl gold-btn text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry View</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl theme-bg-card-inner hover:theme-bg-card-hover theme-text-secondary text-xs font-semibold border theme-border-card transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
