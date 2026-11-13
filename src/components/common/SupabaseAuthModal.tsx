import React, { useState } from 'react';
import { X, Database, Lock, Mail, Key, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { getStoredSupabaseConfig, isProductionEnvConfigured } from '../../lib/supabase';
import { MySpaceLogo } from './MySpaceLogo';

export const SupabaseAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    isSupabaseConfigured,
    supabaseUser,
    signInWithSupabase,
    signUpWithSupabase,
    signOutSupabase,
    updateSupabaseCredentials,
  } = useMySpace();

  const [activeTab, setActiveTab] = useState<'auth' | 'config'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Config tab state
  const isProdLocked = isProductionEnvConfigured();
  const initialConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(initialConfig.url || '');
  const [anonKey, setAnonKey] = useState(initialConfig.anonKey || '');
  const [configLoading, setConfigLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (authMode === 'signin') {
      const res = await signInWithSupabase(email, password);
      if (res.error) setErrorMsg(res.error);
    } else {
      const res = await signUpWithSupabase(email, password, name || 'User');
      if (res.error) setErrorMsg(res.error);
    }

    setLoading(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setConfigLoading(true);

    try {
      const { testSupabaseConnection } = await import('../../lib/supabase');
      const test = await testSupabaseConnection({ url: url.trim(), anonKey: anonKey.trim() });
      if (!test.success) {
        setErrorMsg(`Connection test failed: ${test.error}`);
        setConfigLoading(false);
        return;
      }
      updateSupabaseCredentials(url.trim(), anonKey.trim());
      setErrorMsg('');
      setActiveTab('auth');
    } catch (err: any) {
      setErrorMsg(`Error: ${err?.message || 'Could not verify Supabase connection'}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleDisconnect = () => {
    updateSupabaseCredentials('', '');
    setUrl('');
    setAnonKey('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md theme-bg-card border theme-border-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 theme-text-primary">
        {/* Header */}
        <div className="px-5 py-4 border-b theme-divider flex items-center justify-between theme-bg-card-secondary">
          <div className="flex items-center gap-3">
            <MySpaceLogo size="sm" />
            <div>
              <h3 className="text-sm font-bold theme-text-primary">MySpace Authentication</h3>
              <p className="text-[11px] theme-text-muted">
                {isSupabaseConfigured ? 'Connected to Supabase Auth • Local Encrypted Workspace' : 'Authentication Service Disconnected'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-card-inner transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b theme-divider px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'auth'
                ? 'border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942]'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            User Authentication
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-[#F5B942] text-[#D99A1C] dark:text-[#F5B942]'
                : 'border-transparent theme-text-muted hover:theme-text-primary'
            }`}
          >
            Project Credentials
          </button>
        </div>

        {/* Tab 1: Auth */}
        {activeTab === 'auth' && (
          <div className="p-5 space-y-4">
            {supabaseUser ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold theme-text-primary">Signed in with Supabase</h4>
                  <p className="text-xs theme-text-muted mt-1 font-mono">{supabaseUser.email}</p>
                </div>
                <button
                  onClick={signOutSupabase}
                  className="px-4 py-2 theme-bg-card-inner hover:theme-bg-card-hover border theme-border-card theme-text-secondary text-xs font-semibold rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold theme-text-secondary mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Prateek Anand"
                      className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-8 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                    />
                    <Mail className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary focus:outline-none focus:border-[#F5B942]"
                    />
                    <Lock className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 gold-btn font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  {loading ? 'Authenticating...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                      setErrorMsg('');
                    }}
                    className="text-xs text-[#D99A1C] dark:text-[#F5B942] hover:underline"
                  >
                    {authMode === 'signin'
                      ? "Don't have an account? Sign up"
                      : 'Already registered? Sign in'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Config */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
            <p className="text-xs theme-text-muted leading-relaxed">
              {isProdLocked
                ? 'Production builds use your deployment environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). Browser overrides are disabled.'
                : 'Connect Supabase Authentication using your Project URL and Publishable / Anon public key. Workspace data remains encrypted locally in IndexedDB.'}
            </p>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Project URL
              </label>
              <input
                type="text"
                required
                readOnly={isProdLocked}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary font-mono focus:outline-none focus:border-[#F5B942] read-only:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold theme-text-secondary mb-1">
                Publishable / Anon Public Key
              </label>
              <input
                type="password"
                required
                readOnly={isProdLocked}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="sb_publishable_... or eyJhbGciOiJIUzI1NiIsInR5c..."
                className="w-full px-3 py-2 theme-bg-card-inner border theme-border-card rounded-xl text-xs theme-text-primary font-mono focus:outline-none focus:border-[#F5B942] read-only:opacity-60"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t theme-divider">
              <span className="text-[11px] theme-text-muted">
                {isSupabaseConfigured ? '✓ Auth Connected' : 'Not Configured'}
              </span>
              {!isProdLocked && (
                <button
                  type="submit"
                  disabled={configLoading}
                  className="px-4 py-2 gold-btn rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {configLoading ? 'Testing...' : 'Save & Connect'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
