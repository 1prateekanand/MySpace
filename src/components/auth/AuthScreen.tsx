import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Download,
  X,
} from 'lucide-react';
import { useMySpace } from '../../context/MySpaceContext';
import { MySpaceLogo } from '../common/MySpaceLogo';

const TRANSITION_MS = 700;
const PROMO_BG_IMAGE = '/assets/aistudio/Golden_Autumn_Forest_Creek_and_Footbridge_3ac7f984.png';

const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.23 1.18-3.25 0-6.01-2.19-7-5.15H.98v3.14C3.05 21.3 7.21 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5 14.02c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.16H.98C.35 7.42 0 8.83 0 11.66c0 2.83.35 4.24.98 5.5L5 14.02Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.05 2.7.98 6.84L5 9.98C5.99 7.02 8.75 4.75 12 4.75Z"
    />
  </svg>
);

const GitHubLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"
    />
  </svg>
);

export const AuthScreen: React.FC = () => {
  const {
    signInWithSupabase,
    signUpWithSupabase,
    signInWithOAuth,
    oauthError,
    clearOauthError,
    signInAsGuest,
    resetPasswordWithSupabase,
    legacyLocalAccounts,
    exportLegacyWorkspaceBackup,
  } = useMySpace();

  // Mode: false = Sign In (default), true = Create Account
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Double-slider animation & interactive drag state (0 = Sign In, 1 = Create Account)
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Create Account form state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password form state
  const [resetEmail, setResetEmail] = useState('');

  // Feedback & loading state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'github' | null>(null);

  // Legacy Local Account Migration Backup Modal State (shown only if legacy accounts exist)
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [selectedLegacyNs, setSelectedLegacyNs] = useState('');
  const [legacyPin, setLegacyPin] = useState('');
  const [legacyMsg, setLegacyMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [legacyExporting, setLegacyExporting] = useState(false);

  useEffect(() => {
    if (oauthError) {
      setErrorMsg(oauthError);
      clearOauthError();
    }
  }, [oauthError, clearOauthError]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const switchMode = useCallback(
    (targetSignUp: boolean) => {
      if (isAnimating || isLoading || isGuestLoading || oauthLoadingProvider) return;
      if (targetSignUp === isSignUp) return;

      setErrorMsg('');
      setSuccessMsg('');
      setIsForgotMode(false);
      setIsAnimating(true);
      setIsSignUp(targetSignUp);

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
      }, TRANSITION_MS);
    },
    [isAnimating, isLoading, isGuestLoading, oauthLoadingProvider, isSignUp]
  );

  // Interactive Pointer / Touch Drag for Desktop Promotional Overlay
  const handleDesktopOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating || isLoading || isGuestLoading || oauthLoadingProvider) return;
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    if (!containerRef.current) return;

    const startX = e.clientX;
    const startTime = Date.now();
    const startProgress = isSignUp ? 1 : 0;
    const halfWidth = Math.max(240, containerRef.current.offsetWidth * 0.5);
    let dragging = false;
    let latestProgress = startProgress;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      if (!dragging && Math.abs(dx) < 6) return;
      dragging = true;

      // Dragging left (dx < 0) moves from Sign In (0) -> Create Account (1)
      // Dragging right (dx > 0) moves from Create Account (1) -> Sign In (0)
      const deltaProgress = -dx / halfWidth;
      latestProgress = Math.max(0, Math.min(1, startProgress + deltaProgress));
      setDragProgress(latestProgress);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (!dragging) return;

      const dx = upEvent.clientX - startX;
      const elapsed = Math.max(1, Date.now() - startTime);
      const velocity = dx / elapsed; // px/ms

      let nextSignUp = isSignUp;
      if (startProgress === 0) {
        if (latestProgress > 0.25 || velocity < -0.35) {
          nextSignUp = true;
        }
      } else {
        if (latestProgress < 0.75 || velocity > 0.35) {
          nextSignUp = false;
        }
      }

      setDragProgress(null);
      if (nextSignUp !== isSignUp) {
        setErrorMsg('');
        setSuccessMsg('');
        setIsForgotMode(false);
        setIsSignUp(nextSignUp);
      }

      setIsAnimating(true);
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
      }, TRANSITION_MS);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Interactive Pointer / Touch Swipe for Mobile Card
  const handleMobilePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimating || isLoading || isGuestLoading || oauthLoadingProvider) return;
    if ((e.target as HTMLElement).closest('button, a, input, label')) return;
    if (!mobileContainerRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startTime = Date.now();
    const startProgress = isSignUp ? 1 : 0;
    const cardWidth = Math.max(260, mobileContainerRef.current.offsetWidth);
    let dragging = false;
    let cancelledForVerticalScroll = false;
    let latestProgress = startProgress;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (cancelledForVerticalScroll) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          cancelledForVerticalScroll = true;
          return;
        }
        if (Math.abs(dx) < 10) return;
        dragging = true;
      }

      const deltaProgress = -dx / cardWidth;
      latestProgress = Math.max(0, Math.min(1, startProgress + deltaProgress));
      setDragProgress(latestProgress);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (!dragging) return;

      const dx = upEvent.clientX - startX;
      const elapsed = Math.max(1, Date.now() - startTime);
      const velocity = dx / elapsed;

      let nextSignUp = isSignUp;
      if (startProgress === 0) {
        if (latestProgress > 0.22 || velocity < -0.3) nextSignUp = true;
      } else {
        if (latestProgress < 0.78 || velocity > 0.3) nextSignUp = false;
      }

      setDragProgress(null);
      if (nextSignUp !== isSignUp) {
        setErrorMsg('');
        setSuccessMsg('');
        setIsForgotMode(false);
        setIsSignUp(nextSignUp);
      }

      setIsAnimating(true);
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
      }, TRANSITION_MS);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = signInEmail.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithSupabase(cleanEmail, signInPassword);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to sign in right now.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Account Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = fullName.trim();
    const cleanEmail = signUpEmail.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter them.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithSupabase(cleanEmail, signUpPassword, cleanName);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Account created successfully! Setting up your workspace...');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to create your account right now.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = (resetEmail || signInEmail).trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address for password reset.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithSupabase(cleanEmail);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('A password reset link has been sent to your email address.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to dispatch password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Social OAuth Handler (Google / GitHub)
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (isLoading || isGuestLoading || oauthLoadingProvider) return;
    setErrorMsg('');
    setSuccessMsg('');
    setOauthLoadingProvider(provider);
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message || `Unable to sign in with ${provider === 'google' ? 'Google' : 'GitHub'}.`
      );
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  // Guest Account Handler
  const handleGuestLogin = async () => {
    if (isLoading || isGuestLoading || oauthLoadingProvider) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsGuestLoading(true);
    try {
      const res = await signInAsGuest();
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to start guest session.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  // Progress value (0 = Sign In, 1 = Create Account)
  const progress = dragProgress !== null ? dragProgress : isSignUp ? 1 : 0;
  const isDraggingNow = dragProgress !== null;

  const smoothSlideStyle: React.CSSProperties = isDraggingNow
    ? { transition: 'none' }
    : {
        transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.65, 0, 0.35, 1), opacity ${TRANSITION_MS - 100}ms ease`,
      };

  // Shared Brand Header inside forms
  const renderBrandHeader = () => (
    <div className="flex items-center justify-center gap-3 mb-3 select-none">
      <MySpaceLogo size="md" className="w-9 h-9 sm:w-10 sm:h-10 shadow-[0_0_20px_rgba(245,185,66,0.3)]" />
      <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-white">
        My<span className="text-[#F5B942]">Space</span>
      </span>
    </div>
  );

  // Shared Feedback Banner
  const renderFeedback = () => (
    <>
      {errorMsg && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="leading-snug">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}
    </>
  );

  // Shared Social Authentication Buttons (Google & GitHub)
  const renderSocialAuthButtons = () => {
    const anyBusy = isLoading || isGuestLoading || oauthLoadingProvider !== null;
    return (
      <div className="mt-2.5 space-y-2.5">
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          disabled={anyBusy}
          className="w-full py-2.5 px-5 rounded-full bg-[#0F0F13] hover:bg-[#19160E] border border-[#F5B942]/40 hover:border-[#F5B942] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_14px_rgba(245,185,66,0.06)]"
        >
          {oauthLoadingProvider === 'google' ? (
            <Loader2 className="w-4 h-4 text-[#F5B942] animate-spin" />
          ) : (
            <GoogleLogo className="w-4 h-4 shrink-0" />
          )}
          <span>
            {oauthLoadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin('github')}
          disabled={anyBusy}
          className="w-full py-2.5 px-5 rounded-full bg-[#0F0F13] hover:bg-[#19160E] border border-[#F5B942]/40 hover:border-[#F5B942] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_14px_rgba(245,185,66,0.06)]"
        >
          {oauthLoadingProvider === 'github' ? (
            <Loader2 className="w-4 h-4 text-[#F5B942] animate-spin" />
          ) : (
            <GitHubLogo className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>
            {oauthLoadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}
          </span>
        </button>
      </div>
    );
  };

  // Shared OR + Use Guest Account Footer
  const renderGuestSection = () => (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">OR</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={isLoading || isGuestLoading || oauthLoadingProvider !== null}
        className="w-full py-2.5 px-5 rounded-full bg-[#0F0F13] hover:bg-[#19160E] border border-[#F5B942]/65 hover:border-[#F5B942] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_16px_rgba(245,185,66,0.08)]"
      >
        {isGuestLoading ? (
          <Loader2 className="w-4 h-4 text-[#F5B942] animate-spin" />
        ) : (
          <User className="w-4 h-4 text-[#F5B942]" />
        )}
        <span>{isGuestLoading ? 'Opening Guest Workspace...' : 'Use Guest Account'}</span>
      </button>

      {legacyLocalAccounts.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setSelectedLegacyNs(legacyLocalAccounts[0].namespace);
            setLegacyPin('');
            setLegacyMsg(null);
            setIsLegacyModalOpen(true);
          }}
          className="w-full py-1.5 text-[11px] font-medium text-[#F5B942]/90 hover:text-[#FFD15C] hover:underline flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Migrate Existing Local Workspace (.myspace.enc)</span>
        </button>
      )}
    </div>
  );

  // Sign In / Forgot Password Form Content
  const renderSignInPanelContent = () => {
    if (isForgotMode) {
      return (
        <div className="w-full max-w-[330px] mx-auto flex flex-col justify-center">
          {renderBrandHeader()}
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight text-center">
            Reset Password
          </h2>
          <p className="text-xs text-zinc-400 text-center mt-1 mb-6">
            Enter your email to receive a password reset link.
          </p>

          {renderFeedback()}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email Address"
                aria-label="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#F9D06B] via-[#F5B942] to-[#E5A92D] text-[#0A0803] font-bold text-xs sm:text-sm shadow-[0_6px_22px_rgba(245,185,66,0.3)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-[#F5B942] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="w-full max-w-[330px] mx-auto flex flex-col justify-center">
        {renderBrandHeader()}
        <h2 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight text-center">
          Sign In
        </h2>
        <p className="text-xs text-zinc-400 text-center mt-1 mb-4">
          Welcome back! Sign in to your workspace
        </p>

        {renderFeedback()}

        <form onSubmit={handleSignInSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="Email Address"
              aria-label="Email Address"
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
            />
            <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <input
              type={showSignInPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
            />
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowSignInPassword((prev) => !prev)}
              aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
              className="p-1 text-zinc-400 hover:text-[#F5B942] absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
            >
              {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setResetEmail(signInEmail);
                setErrorMsg('');
                setSuccessMsg('');
                setIsForgotMode(true);
              }}
              className="text-xs font-medium text-[#F5B942] hover:text-[#FFD15C] hover:underline cursor-pointer transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGuestLoading || oauthLoadingProvider !== null}
            className="w-full py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F9D06B] via-[#F5B942] to-[#E5A92D] text-[#0A0803] font-bold text-xs sm:text-sm shadow-[0_6px_22px_rgba(245,185,66,0.3)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to MySpace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {renderSocialAuthButtons()}
        {renderGuestSection()}
      </div>
    );
  };

  // Create Account Form Content
  const renderSignUpPanelContent = () => (
    <div className="w-full max-w-[330px] mx-auto flex flex-col justify-center">
      {renderBrandHeader()}
      <h2 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight text-center">
        Create Account
      </h2>
      <p className="text-xs text-zinc-400 text-center mt-1 mb-3.5">
        Set up your personal workspace in minutes.
      </p>

      {renderFeedback()}

      <form onSubmit={handleSignUpSubmit} className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            aria-label="Full Name"
            className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
          />
          <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <input
            type="email"
            required
            autoComplete="email"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            placeholder="Email Address"
            aria-label="Email Address"
            className="w-full pl-10 pr-4 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
          />
          <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <input
            type={showSignUpPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className="w-full pl-10 pr-10 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
          />
          <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowSignUpPassword((prev) => !prev)}
            aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
            className="p-1 text-zinc-400 hover:text-[#F5B942] absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
          >
            {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            className="w-full pl-10 pr-10 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942]/40 transition-all"
          />
          <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            className="p-1 text-zinc-400 hover:text-[#F5B942] absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGuestLoading || oauthLoadingProvider !== null}
          className="w-full py-2.5 px-5 mt-1 rounded-full bg-gradient-to-r from-[#F9D06B] via-[#F5B942] to-[#E5A92D] text-[#0A0803] font-bold text-xs sm:text-sm shadow-[0_6px_22px_rgba(245,185,66,0.3)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create MySpace Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {renderSocialAuthButtons()}
      {renderGuestSection()}
    </div>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center bg-[#050507] text-zinc-100 p-4 sm:p-6 md:p-8 relative selection:bg-[#F5B942]/30 selection:text-[#F5B942]">
      {/* Subtle Background Golden Contour Wave Decorations (Top-Left & Bottom-Right) */}
      <svg
        viewBox="0 0 500 500"
        className="fixed top-0 left-0 w-72 sm:w-96 h-72 sm:h-96 opacity-25 pointer-events-none select-none"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={i}
            d={`M -40 ${40 + i * 16} Q ${140 + i * 8} ${120 - i * 4} ${260 - i * 10} -20`}
            fill="none"
            stroke="#D99A1C"
            strokeWidth="0.9"
            strokeOpacity={0.6 - i * 0.03}
          />
        ))}
      </svg>

      <svg
        viewBox="0 0 500 500"
        className="fixed bottom-0 right-0 w-72 sm:w-96 h-72 sm:h-96 opacity-25 pointer-events-none select-none"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <path
            key={i}
            d={`M ${220 + i * 10} 520 Q ${360 - i * 6} ${360 + i * 6} 540 ${280 + i * 14}`}
            fill="none"
            stroke="#D99A1C"
            strokeWidth="0.9"
            strokeOpacity={0.6 - i * 0.03}
          />
        ))}
      </svg>

      {/* Ambient Golden Backdrop Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[640px] h-[440px] rounded-full bg-[#F5B942]/10 blur-[130px]" />
      </div>

      {/* ================================================================= */}
      {/* DESKTOP & TABLET: True Double-Slider Split-Screen Interface (md+) */}
      {/* ================================================================= */}
      <div
        ref={containerRef}
        className="hidden md:block relative z-10 w-full max-w-[920px] min-h-[680px] rounded-[28px] bg-[#0B0B0E] border border-[#F5B942]/75 shadow-[0_0_60px_rgba(245,185,66,0.2)] overflow-hidden"
      >
        {/* 1. Sign In Form Panel (Starts at Left, slides & fades out right when switching to Create Account) */}
        <div
          style={{
            ...smoothSlideStyle,
            transform: `translateX(${progress * 100}%)`,
            opacity: Math.max(0, 1 - progress * 1.35),
            zIndex: isSignUp ? 10 : 20,
            pointerEvents: !isSignUp && !isDraggingNow ? 'auto' : 'none',
          }}
          aria-hidden={isSignUp}
          className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-center px-6 lg:px-10 py-8 bg-[#0B0B0E]"
        >
          {renderSignInPanelContent()}
        </div>

        {/* 2. Create Account Form Panel (Slides into Right slot & fades in when switching to Create Account) */}
        <div
          style={{
            ...smoothSlideStyle,
            transform: `translateX(${progress * 100}%)`,
            opacity: Math.max(0, (progress - 0.25) / 0.75),
            zIndex: isSignUp ? 20 : 10,
            pointerEvents: isSignUp && !isDraggingNow ? 'auto' : 'none',
          }}
          aria-hidden={!isSignUp}
          className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-center px-6 lg:px-10 py-6 bg-[#0B0B0E]"
        >
          {renderSignUpPanelContent()}
        </div>

        {/* 3. Interactive Promotional Sliding Overlay Panel (Draggable & Swipeable) */}
        <div
          onPointerDown={handleDesktopOverlayPointerDown}
          style={{
            ...smoothSlideStyle,
            transform: `translateX(${-progress * 100}%)`,
          }}
          title="Drag horizontally or click button to switch mode"
          className="absolute top-0 left-1/2 w-1/2 h-full overflow-hidden z-30 cursor-grab active:cursor-grabbing select-none touch-pan-y shadow-[-10px_0_35px_rgba(0,0,0,0.45)]"
        >
          {/* HD Autumn Forest & Flowing Stream Background (Consistent across both slider states) */}
          <img
            src={PROMO_BG_IMAGE}
            alt="Golden autumn forest and flowing stream"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            loading="eager"
            decoding="async"
          />

          {/* Subtle dark readability scrim (~18% with soft radial center contrast) */}
          <div
            className="absolute inset-0 bg-black/20 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at center, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.16) 75%, rgba(0,0,0,0.24) 100%)',
            }}
          />

          {/* 200%-wide counter-sliding text overlay inside the promotional viewport */}
          <div
            style={{
              ...smoothSlideStyle,
              transform: `translateX(${progress * 50}%)`,
            }}
            className="relative -left-full w-[200%] h-full flex"
          >
            {/* Left Half of Inner Overlay: Visible in Create Account Mode */}
            <div
              style={{
                ...smoothSlideStyle,
                transform: `translateX(${(1 - progress) * -18}%)`,
              }}
              className="relative z-10 w-1/2 h-full flex flex-col items-center justify-center px-8 lg:px-12 text-center"
            >
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
                Welcome Back!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-100 font-medium leading-relaxed max-w-[260px] mb-7 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                Already have an account? Sign in to access your workspace.
              </p>
              <button
                type="button"
                onClick={() => switchMode(false)}
                disabled={isAnimating}
                className="px-7 py-3 rounded-full bg-[#111114]/95 hover:bg-[#1A1A20] border border-[#F5B942]/55 text-white text-xs sm:text-sm font-semibold shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-80"
              >
                <span>Sign In to MySpace</span>
                <ArrowRight className="w-4 h-4 text-[#F5B942]" />
              </button>
            </div>

            {/* Right Half of Inner Overlay: Visible in Sign In Mode (Default) */}
            <div
              style={{
                ...smoothSlideStyle,
                transform: `translateX(${progress * 18}%)`,
              }}
              className="relative z-10 w-1/2 h-full flex flex-col items-center justify-center px-8 lg:px-12 text-center"
            >
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
                New to MySpace?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-100 font-medium leading-relaxed max-w-[260px] mb-7 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                Create your account and set up your personal workspace.
              </p>
              <button
                type="button"
                onClick={() => switchMode(true)}
                disabled={isAnimating}
                className="px-7 py-3 rounded-full bg-[#111114]/95 hover:bg-[#1A1A20] border border-[#F5B942]/55 text-white text-xs sm:text-sm font-semibold shadow-2xl hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-80"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 text-[#F5B942]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE: Compact Swipeable Double-Slider Interface (< md)          */}
      {/* ================================================================= */}
      <div
        ref={mobileContainerRef}
        onPointerDown={handleMobilePointerDown}
        className="md:hidden relative z-10 w-full max-w-md rounded-[26px] bg-[#0B0B0E] border border-[#F5B942]/75 shadow-[0_0_45px_rgba(245,185,66,0.18)] overflow-hidden touch-pan-y"
      >
        {/* Top Swipeable Promotional Banner */}
        <div className="relative overflow-hidden px-6 pt-7 pb-8 text-center select-none cursor-grab active:cursor-grabbing">
          <img
            src={PROMO_BG_IMAGE}
            alt="Golden autumn forest and flowing stream"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
              {isSignUp ? 'Welcome Back!' : 'New to MySpace?'}
            </h2>
            <p className="text-xs text-zinc-100 font-medium mt-1 mb-4 max-w-[250px] drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              {isSignUp
                ? 'Already have an account? Sign in to access your workspace.'
                : 'Create your account and set up your personal workspace.'}
            </p>
            <button
              type="button"
              onClick={() => switchMode(!isSignUp)}
              disabled={isAnimating}
              className="px-5 py-2.5 rounded-full bg-[#111114]/95 hover:bg-[#1A1A20] border border-[#F5B942]/55 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isSignUp ? 'Sign In to MySpace' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F5B942]" />
            </button>
          </div>
        </div>

        {/* Bottom Horizontal Sliding Forms Carousel */}
        <div className="overflow-hidden w-full">
          <div
            style={{
              ...smoothSlideStyle,
              transform: `translateX(${-progress * 50}%)`,
            }}
            className="w-[200%] flex items-start"
          >
            {/* Mobile Slide 1: Sign In */}
            <div className="w-1/2 px-5 py-6 shrink-0">{renderSignInPanelContent()}</div>

            {/* Mobile Slide 2: Create Account */}
            <div className="w-1/2 px-5 py-6 shrink-0">{renderSignUpPanelContent()}</div>
          </div>
        </div>
      </div>

      {/* Legacy Pre-Supabase Local Workspace Backup Modal (only shown when requested) */}
      {isLegacyModalOpen && legacyLocalAccounts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#111115] border border-[#F5B942]/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Export Legacy Local Workspace</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Unlock your previous browser workspace with its Vault PIN to download an encrypted <code className="text-[#F5B942]">.myspace.enc</code> backup before registering in Supabase Auth.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLegacyModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {legacyMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  legacyMsg.type === 'error'
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                }`}
              >
                <span>{legacyMsg.text}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const acct =
                  legacyLocalAccounts.find((a) => a.namespace === selectedLegacyNs) ||
                  legacyLocalAccounts[0];
                if (!acct || !legacyPin) return;
                setLegacyMsg(null);
                setLegacyExporting(true);
                try {
                  const res = await exportLegacyWorkspaceBackup(acct.namespace, acct.email, legacyPin);
                  if (res.success) {
                    setLegacyMsg({
                      type: 'success',
                      text: `Downloaded ${res.filename}. Next, create your Supabase account with ${acct.email}, set a Vault PIN, and import this backup.`,
                    });
                    setLegacyPin('');
                  } else {
                    setLegacyMsg({ type: 'error', text: res.error || 'Export failed.' });
                  }
                } finally {
                  setLegacyExporting(false);
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Detected Local Account
                </label>
                <select
                  value={selectedLegacyNs}
                  onChange={(e) => setSelectedLegacyNs(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-[#F5B942]"
                >
                  {legacyLocalAccounts.map((acct) => (
                    <option key={acct.namespace} value={acct.namespace}>
                      {acct.email} ({acct.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Legacy Vault PIN
                </label>
                <input
                  type="password"
                  required
                  value={legacyPin}
                  onChange={(e) => setLegacyPin(e.target.value)}
                  placeholder="Enter Vault PIN for this local workspace"
                  className="w-full px-3.5 py-2.5 bg-[#121216] border border-zinc-700/75 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-[#F5B942]"
                />
              </div>

              <button
                type="submit"
                disabled={legacyExporting || !legacyPin}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#F9D06B] via-[#F5B942] to-[#E5A92D] text-[#0A0803] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{legacyExporting ? 'Decrypting & Exporting...' : 'Export .myspace.enc Backup'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
