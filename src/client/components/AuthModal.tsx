// src/client/components/AuthModal.tsx
// Authentication modal with customer sign-in, registration, password recovery, and 1-click demo logins

import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    quickLogin,
  } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSentToken, setResetSentToken] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authModalMode === 'signin') {
      await login(email, password);
    } else if (authModalMode === 'signup') {
      await register(name, email, password);
    } else if (authModalMode === 'forgot') {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.resetToken) {
          setResetSentToken(data.resetToken);
          showToast('Reset token generated for evaluation', 'info');
        } else {
          showToast(data.message || 'Check your inbox', 'info');
        }
      } catch {
        showToast('Password reset request failed', 'error');
      }
    }

    setIsSubmitting(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetSentToken || !password) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetSentToken, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setResetSentToken(null);
        setAuthModalMode('signin');
      } else {
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch {
      showToast('Error resetting password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {authModalMode === 'signin' && 'Welcome to MOO'}
              {authModalMode === 'signup' && 'Create Your MOO Account'}
              {authModalMode === 'forgot' && 'Reset Your Password'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {authModalMode === 'signin' && 'Sign in to access your orders and saved items'}
              {authModalMode === 'signup' && 'Join for expedited checkout and order tracking'}
              {authModalMode === 'forgot' && 'Enter your email address to recover your account'}
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Logins Banner */}
        {authModalMode === 'signin' && (
          <div className="px-6 pt-4 pb-2 bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-100 dark:border-neutral-800 space-y-2">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('customer')}
                className="py-2 px-3 text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-neutral-800 dark:text-neutral-200 shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>Demo Customer</span>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="py-2 px-3 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-amber-900 dark:text-amber-200 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Store Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Reset Password Form if token generated */}
        {authModalMode === 'forgot' && resetSentToken ? (
          <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
              Token verified: Enter your new password below.
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold rounded-xl transition-colors"
            >
              Update Password
            </button>
          </form>
        ) : (
          /* Main Auth Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {authModalMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            {authModalMode !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Password
                  </label>
                  {authModalMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('forgot')}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>
                {authModalMode === 'signin' && 'Sign In'}
                {authModalMode === 'signup' && 'Create Account'}
                {authModalMode === 'forgot' && 'Send Reset Instructions'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mode Toggle Footer */}
            <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
              {authModalMode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('signup')}
                    className="font-semibold text-neutral-900 dark:text-white hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('signin')}
                    className="font-semibold text-neutral-900 dark:text-white hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
