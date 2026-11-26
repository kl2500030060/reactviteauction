import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import type { UserRole } from '../types/auction';
import { AssetIllustration } from '../components/AssetIllustration';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface FormErrors {
  identifier?: string;
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const AuthPage: React.FC = () => {
  const { login, register, theme, toggleTheme } = useAuction();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setErrors({});
  };

  const validateLogin = (): FormErrors => {
    const next: FormErrors = {};
    if (!identifier.trim()) next.identifier = 'Enter your username or email address.';
    if (!password) next.password = 'Enter your password.';
    return next;
  };

  const validateSignup = (): FormErrors => {
    const next: FormErrors = {};
    if (name.trim().length < 2) next.name = 'Full name must be at least 2 characters.';
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
      next.username = 'Use 3–24 letters, numbers, or underscores.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = mode === 'login' ? validateLogin() : validateSignup();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const res =
      mode === 'login'
        ? await login(identifier.trim(), password)
        : await register({
            name: name.trim(),
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            password,
            role,
          });
    setSubmitting(false);

    if (!res.ok) {
      setErrors({ general: res.error || 'Authentication failed.' });
      return;
    }

    if (mode === 'signup') {
      if (role === 'admin') navigate('/admin');
      else if (role === 'seller') navigate('/seller');
      else navigate('/markets');
    } else {
      navigate('/markets');
    }
  };

  const quickLogin = async (demoUser: string) => {
    setMode('login');
    setIdentifier(demoUser);
    setPassword('demo123');
    setErrors({});
    setSubmitting(true);
    const res = await login(demoUser, 'demo123');
    setSubmitting(false);
    if (!res.ok) {
      setErrors({ general: res.error });
      return;
    }
    if (demoUser === 'admin') navigate('/admin');
    else if (demoUser === 'seller1') navigate('/seller');
    else navigate('/markets');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col pt-safe pb-safe">
      {/* Clean Top Bar */}
      <header className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          Auto<span className="text-indigo-600 dark:text-indigo-400">Auction</span>
        </span>
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-12 items-center max-w-6xl w-full mx-auto px-5 py-8 sm:px-8 gap-10">
        {/* Left Editorial Showcase (Desktop) */}
        <section className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Indian Asset Auction Exchange
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Real-time bidding for verified vehicles, real estate, and bank assets.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Instant cross-tab order flow, live escrow protection, smooth bid trajectory analytics, Auto-Pilot proxy bidding, and full seller and admin moderation powered by browser LocalStorage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <AssetIllustration assetType="suv" size="md" />
            <AssetIllustration assetType="villa" size="md" />
            <AssetIllustration assetType="gold" size="md" />
            <AssetIllustration assetType="tractor" size="md" />
          </div>
        </section>

        {/* Right Auth Panel */}
        <section className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mode === 'login' ? 'Sign in to terminal' : 'Create your account'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'login'
                  ? 'Your session persists safely across reloads and syncs live.'
                  : 'Register as a Bidder, Seller, or System Admin.'}
              </p>
            </div>

            {/* Segmented Mode Toggle */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`min-h-[42px] rounded-lg text-sm font-semibold transition ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`min-h-[42px] rounded-lg text-sm font-semibold transition ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errors.general && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {mode === 'login' ? (
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Username or Email
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="rahul99 or rahul.sharma@autoauction.in"
                    className={`mt-1.5 min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none ${
                      errors.identifier
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                  {errors.identifier && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.identifier}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Full Name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Karthik Verma"
                      className={`mt-1.5 min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none ${
                        errors.name
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="signup-username"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Username
                      </label>
                      <input
                        id="signup-username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="karthik_v"
                        className={`mt-1.5 min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none ${
                          errors.username
                            ? 'border-red-500'
                            : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                        }`}
                      />
                      {errors.username && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.username}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="signup-role"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        Account Role
                      </label>
                      <select
                        id="signup-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="user">Bidder (User)</option>
                        <option value="seller">Seller (List Assets)</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Email Address
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="karthik@example.com"
                      className={`mt-1.5 min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none ${
                        errors.email
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? 'Enter password' : 'Minimum 6 characters'}
                    className={`min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 pl-3.5 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none ${
                      errors.password
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="signup-confirm"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`mt-1.5 min-h-[48px] w-full rounded-xl border bg-slate-50 dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-white focus:outline-none ${
                      errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] w-full rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>
            </form>

            {/* Quick 1-Tap Role Access for Live Reviews */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Quick demo sign-in (password: <span className="font-mono">demo123</span>)
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void quickLogin('rahul99')}
                  className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:border-indigo-500"
                >
                  Bidder
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void quickLogin('seller1')}
                  className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:border-indigo-500"
                >
                  Seller
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void quickLogin('admin')}
                  className="min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:border-indigo-500"
                >
                  Admin
                </button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Salted Web Crypto credentials with refresh-safe LocalStorage persistence.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
