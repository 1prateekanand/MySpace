import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  LogOut,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Laptop
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from '../common/MySpaceLogo';

export const UnlockScreen: React.FC = () => {
  const {
    supabaseUser,
    isPinSetupNeeded,
    setupVaultPin,
    unlockWorkspaceWithPin,
    signOutSupabase,
    resetLocalWorkspace,
    workspaceNamespace,
  } = useMySpace();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setErrorMsg('');
    setLoading(true);

    try {
      if (isPinSetupNeeded) {
        if (pin.length < 4) {
          setErrorMsg('PIN must be at least 4 characters/digits.');
          setLoading(false);
          return;
        }
        if (pin !== confirmPin) {
          setErrorMsg('PINs do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await setupVaultPin(pin);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to setup Vault PIN.');
        }
      } else {
        const res = await unlockWorkspaceWithPin(pin);
        if (!res.success) {
          setErrorMsg(res.error || 'Incorrect Vault PIN.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWorkspace = async () => {
    setShowResetConfirm(false);
    setErrorMsg('');
    await resetLocalWorkspace();
  };

  // Truncate namespace for clean display
  const shortNamespace = workspaceNamespace
    ? workspaceNamespace.replace('myspace:', '').replace(/-/g, '').slice(0, 24) + '...'
    : 'device-local';

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#070709] text-zinc-100 p-4 sm:p-6 relative overflow-hidden selection:bg-[#F5B942]/30 selection:text-[#F5B942]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 -left-40 w-80 h-80 bg-[#F5B942]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-40 w-80 h-80 bg-[#D99A1C]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#D99A1C]/30 to-[#F5B942]/30 rounded-2xl blur-md opacity-70" />
            <div className="relative">
              <MySpaceLogo size="lg" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#FFF] via-[#F5E6BE] to-[#F5B942] bg-clip-text text-transparent">
            {isPinSetupNeeded ? 'Create Vault PIN' : 'Unlock Workspace'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {isPinSetupNeeded
              ? 'Choose a 4-6 digit PIN to encrypt your personal workspace on this device.'
              : 'Enter your Vault PIN to decrypt and access your local device data.'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#111115]/95 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* User & Device Identity pill */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#F5B942]/10 border border-[#F5B942]/30 flex items-center justify-center text-[#F5B942] shrink-0 font-bold text-xs">
                {supabaseUser?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {supabaseUser?.email}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <Laptop className="w-3 h-3 text-[#F5B942]" />
                  <span className="truncate">id: {shortNamespace}</span>
                </div>
              </div>
            </div>

            <button
              onClick={signOutSupabase}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                {isPinSetupNeeded ? 'New Vault PIN' : 'Vault PIN'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={12}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-center tracking-[0.5em] text-sm font-mono text-zinc-100 placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
            </div>

            {isPinSetupNeeded && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Confirm Vault PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    maxLength={12}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-center tracking-[0.5em] text-sm font-mono text-zinc-100 placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-[#D99A1C] to-[#F5B942] text-black font-bold text-xs rounded-xl shadow-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>{isPinSetupNeeded ? 'Encrypting Workspace...' : 'Decrypting...'}</span>
              ) : (
                <>
                  <span>{isPinSetupNeeded ? 'Initialize & Encrypt Workspace' : 'Unlock Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Forgot PIN or Switch user controls */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <button
              type="button"
              onClick={signOutSupabase}
              className="hover:text-zinc-200 transition-colors"
            >
              Switch Account
            </button>

            {!isPinSetupNeeded && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-amber-400/80 hover:text-amber-300 transition-colors"
              >
                Forgot PIN?
              </button>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-[11px] text-zinc-500 max-w-sm">
          Protected by <span className="text-[#F5B942] font-semibold">AES-256-GCM</span>. Your PIN derives an in-memory key via PBKDF2 (100,000 iterations). Your raw PIN is never stored.
        </div>
      </div>

      {/* Forgot PIN / Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#121216] border border-rose-500/30 rounded-2xl p-5 shadow-2xl text-zinc-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-zinc-100">Reset Local Workspace?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Because your workspace is encrypted client-side with AES-256-GCM, your data cannot be recovered without your PIN. Resetting will clear the local encrypted workspace on this device so you can set a new PIN.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetWorkspace}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Reset & Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
