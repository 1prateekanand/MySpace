import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  KeyRound,
  Eye,
  EyeOff,
  HardDrive,
  Cpu
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from '../common/MySpaceLogo';
import { getStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';

export const AuthScreen: React.FC = () => {
  const {
    signInWithSupabase,
    signUpWithSupabase,
    resetPasswordWithSupabase,
    updateSupabaseCredentials,
    isSupabaseConfigured,
  } = useMySpace();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | 'config'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Project configuration state
  const initialConfig = getStoredSupabaseConfig();
  const [cfgUrl, setCfgUrl] = useState(initialConfig.url || '');
  const [cfgKey, setCfgKey] = useState(initialConfig.anonKey || '');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (activeTab === 'signin') {
        const res = await signInWithSupabase(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        }
      } else if (activeTab === 'signup') {
        const res = await signUpWithSupabase(email, password, name);
        if (res.error) {
          setErrorMsg(res.error);
        }
      } else if (activeTab === 'forgot') {
        const res = await resetPasswordWithSupabase(email);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('A password reset link has been dispatched to your email address.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsConfiguring(true);

    try {
      const test = await testSupabaseConnection({ url: cfgUrl.trim(), anonKey: cfgKey.trim() });
      if (!test.success) {
        setErrorMsg(`Supabase connection failed: ${test.error}`);
        setIsConfiguring(false);
        return;
      }
      updateSupabaseCredentials(cfgUrl.trim(), cfgKey.trim());
      setSuccessMsg('Supabase connected successfully!');
      setActiveTab('signin');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed connecting to Supabase.');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('demo@myspace.local');
    setPassword('DemoPass123!');
    setActiveTab('signin');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#070709] text-zinc-100 p-4 sm:p-6 relative overflow-hidden selection:bg-[#F5B942]/30 selection:text-[#F5B942]">
      {/* Background ambient gold glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-[#F5B942]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-[#D99A1C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#18181B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header with 3D Golden Maze Cube */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#D99A1C]/40 to-[#F5B942]/40 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
            <div className="relative">
              <MySpaceLogo size="xl" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#FFF] via-[#F5E6BE] to-[#F5B942] bg-clip-text text-transparent">
            MySpace
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs font-medium">
            Multi-User Workspace with Device-Isolated Local Encryption
          </p>
        </div>

        {/* Card Box */}
        <div className="w-full bg-[#111115]/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
          {/* Top Mode Navigation Tabs */}
          <div className="grid grid-cols-3 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800/60 mb-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'forgot'
                  ? 'bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Reset
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Tab Form */}
          {activeTab !== 'config' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/30 transition-all"
                    />
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/30 transition-all"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>

              {activeTab !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Password
                    </label>
                    {activeTab === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('forgot')}
                        className="text-[11px] text-[#F5B942] hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-zinc-900/80 border border-zinc-700/60 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/30 transition-all"
                    />
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 absolute right-2.5 top-2.5"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold text-xs rounded-xl shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {activeTab === 'signin'
                        ? 'Sign In to Workspace'
                        : activeTab === 'signup'
                        ? 'Create Private Account'
                        : 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Quick Demo Credentials shortcut */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80">
                <span>Want to test quickly?</span>
                <button
                  type="button"
                  onClick={handleUseDemoAccount}
                  className="text-[#F5B942] hover:underline font-semibold"
                >
                  Use Demo Login
                </button>
              </div>
            </form>
          ) : (
            /* Supabase Config Mode */
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#F5B942] font-semibold">
                <Database className="w-4 h-4" />
                <span>Custom Supabase Project Configuration</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Connect your personal Supabase project for real email authentication. (Local workspaces remain device-isolated and encrypted with AES-256-GCM).
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  required
                  value={cfgUrl}
                  onChange={(e) => setCfgUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#F5B942]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Anon / Public Key
                </label>
                <input
                  type="password"
                  required
                  value={cfgKey}
                  onChange={(e) => setCfgKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-[#F5B942]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConfiguring}
                  className="px-4 py-2 bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold text-xs rounded-xl shadow-md hover:brightness-105"
                >
                  {isConfiguring ? 'Connecting...' : 'Connect Supabase'}
                </button>
              </div>
            </form>
          )}

          {/* Footer Config toggle */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'config' ? 'signin' : 'config')}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-[#F5B942] transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              <span>{activeTab === 'config' ? 'Back to Login' : 'Supabase Settings'}</span>
            </button>

            <span className="flex items-center gap-1 text-zinc-500 font-mono text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isSupabaseConfigured ? 'Supabase Auth' : 'Local Auth Ready'}
            </span>
          </div>
        </div>

        {/* Security & Device Isolation Badges */}
        <div className="grid grid-cols-2 gap-3 w-full mt-5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <Cpu className="w-4 h-4 text-[#F5B942] shrink-0" />
            <span className="leading-tight">AES-256-GCM local encrypted storage</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60">
            <HardDrive className="w-4 h-4 text-[#F5B942] shrink-0" />
            <span className="leading-tight">Device-isolated (no cloud data sync)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
