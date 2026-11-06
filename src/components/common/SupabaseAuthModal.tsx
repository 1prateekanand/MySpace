import React, { useState } from 'react';
import { X, Database, Lock, Mail, Key, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { getStoredSupabaseConfig } from '../../lib/supabase';

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
  const initialConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(initialConfig.url || '');
  const [anonKey, setAnonKey] = useState(initialConfig.anonKey || '');

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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseCredentials(url, anonKey);
    setErrorMsg('');
    setActiveTab('auth');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#131929] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/70 flex items-center justify-between bg-[#161c2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Supabase Connection & Auth</h3>
              <p className="text-[11px] text-slate-400">
                {isSupabaseConfigured ? 'Connected to PostgreSQL & Storage' : 'Local Workspace Mode Active'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'auth'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            User Authentication
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
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
                  <h4 className="text-sm font-bold text-white">Signed in with Supabase</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{supabaseUser.email}</p>
                </div>
                <button
                  onClick={signOutSupabase}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Prateek Anand"
                      className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-8 pr-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
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
                    className="text-xs text-purple-400 hover:underline"
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
            <p className="text-xs text-slate-400 leading-relaxed">
              To connect your live PostgreSQL database and Supabase Storage bucket, enter your credentials. (Schema script is ready in <code className="text-purple-300">/supabase/schema.sql</code>).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Project URL
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Anon / Public API Key
              </label>
              <input
                type="password"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                className="w-full px-3 py-2 bg-[#0d121f] border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                {isSupabaseConfigured ? '✓ Config Active' : 'Offline / Demo Active'}
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Save & Connect
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
