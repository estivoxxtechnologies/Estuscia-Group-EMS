
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Globe2,
  Zap,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

export const AuthView: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLoginSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const success = await login(email.trim(), password);

      if (!success) {
        setLoginError('Invalid email or password.');
        return;
      }

      navigate('/', { replace: true });
    } catch (error: unknown) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] overflow-x-hidden bg-[#040312] font-sans text-slate-100 lg:h-[100svh] lg:overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-purple-500/60 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-4 py-1 sm:px-8 sm:py-5 lg:h-full lg:min-h-0 lg:px-12 lg:py-7">
        {/* Main content */}
        <div className="grid flex-1 grid-cols-1 content-center items-center gap-3 py-0 sm:gap-6 sm:py-4 lg:min-h-0 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-3">
          {/* Branding section */}
          <section className="flex min-w-0 flex-col justify-center gap-2 lg:gap-0">
            {/* Estuscia software logo */}
            <div className="mb-1 flex h-7 items-center sm:mb-5 sm:h-12 lg:mb-10 lg:h-auto lg:min-h-[110px]">
              {!logoFailed ? (
                <img
                  src="/estuscia-logo.png"
                  alt="Estuscia"
                  onError={() => setLogoFailed(true)}
                  className="max-h-full w-auto max-w-[145px] object-contain object-left sm:max-w-[190px] lg:max-h-35 lg:max-w-full"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-500/10 sm:h-11 sm:w-11">
                    <ShieldCheck className="h-5 w-5 text-purple-300" />
                  </div>
                  <span className="text-sm font-semibold text-white sm:text-base">
                    Estuscia
                  </span>
                </div>
              )}
            </div>

            {/* Corporate label: desktop only */}
            <div className="mb-5 hidden w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/[0.07] px-3 py-2 lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-200">
                Estuscia Group · Corporate Ecosystem
              </span>
            </div>

            {/* Main heading */}
            <h1 className="max-w-2xl text-[25px] font-bold leading-[1.1] tracking-tight text-white sm:text-4xl sm:leading-[1.12] lg:text-5xl xl:text-6xl">
              Building Businesses.
              <br />
              <span className="text-slate-300">
                Creating Opportunities.
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Empowering the Future.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-1 max-w-xl text-xs leading-4 text-gray-400 sm:mt-4 sm:text-sm sm:leading-6 lg:mt-5 lg:text-base lg:leading-7">
              A unified workspace for employee management and business
              operations, helping teams manage people, processes, and
              performance in one place.
            </p>

            {/* Feature cards: desktop only */}
            <div className="mt-8 hidden max-w-xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3 lg:grid">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-violet-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-200">
                    Secure Access
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Protected workspace
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <Globe2 className="h-5 w-5 shrink-0 text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-200">
                    Multi-Tenant
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Company-based access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <Zap className="h-5 w-5 shrink-0 text-purple-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-200">
                    One Workspace
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Streamlined operations
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Login card */}
          <section className="flex w-full items-center justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#09081E]/90 p-3.5 shadow-2xl shadow-purple-950/20 backdrop-blur-xl sm:p-7 lg:p-8">
              <div className="mb-4 sm:mb-7">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/10 sm:mb-3 sm:h-11 sm:w-11">
                  <LockKeyhole className="h-5 w-5 text-purple-300" />
                </div>

                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  Welcome back
                </h2>

                <p className="mt-1.5 text-xs leading-5 text-gray-400 sm:mt-2 sm:text-sm sm:leading-relaxed">
                  Sign in with your employee account to access your workspace.
                </p>
              </div>

              <form
                onSubmit={handleLoginSubmit}
                className="space-y-3 sm:space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-semibold text-gray-300 sm:mb-2"
                  >
                    Employee Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your.name@company.com"
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-base text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/10 sm:py-3 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-xs font-semibold text-gray-300 sm:mb-2"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-11 text-base text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/10 sm:py-3 sm:text-sm"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      aria-pressed={showPassword}
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login error */}
                {loginError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-3.5 py-2.5 text-xs leading-relaxed text-red-300"
                  >
                    {loginError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#753AED] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:from-[#6A4DF4] hover:to-[#8750F6] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:py-3.5"
                >
                  <span>
                    {isLoggingIn
                      ? 'Signing in...'
                      : 'Sign in to your workspace'}
                  </span>

                  {!isLoggingIn && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}

                  {isLoggingIn && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-2.5 border-t border-white/[0.07] pt-2.5 sm:mt-5 sm:pt-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-[10px] leading-4 text-gray-500 sm:text-[11px] sm:leading-relaxed">
                    Access is provided according to your account role and
                    assigned company permissions. Contact your administrator
                    if you need assistance signing in.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer: desktop only */}
        <footer className="hidden items-center justify-between border-t border-white/[0.07] py-4 text-xs text-gray-500 lg:flex">
          <p>
            © {new Date().getFullYear()} Estuscia Group. All rights reserved.
          </p>
          <p>Employee Management System</p>
        </footer>
      </div>
    </main>
  );
};

export default AuthView;
