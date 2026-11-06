import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { useApp } from '../context/AppContext';

/**
 * Put the logo in /public. The file you uploaded is "estuscia_logo.png";
 * rename it or change this path so they match.
 */
const LOGO_SRC = '/estuscia-logo.png';

const FEATURES = [
  {
    icon: ShieldCheck,
    color: 'text-violet-400',
    title: 'Secure access',
    text: 'Role-based, protected workspace',
  },
  {
    icon: Globe2,
    color: 'text-blue-400',
    title: 'Multi-company',
    text: 'Access scoped to your company',
  },
  {
    icon: Zap,
    color: 'text-purple-400',
    title: 'One workspace',
    text: 'People, processes and performance',
  },
];

/**
 * The supplied PNG is a 16:9 canvas with a lot of empty margin around the
 * artwork. This crops it to the artwork so the logo sizes predictably.
 * If you export a tightly-cropped logo, replace this with a plain <img>.
 */
const Logo: React.FC<{ onError: () => void }> = ({ onError }) => (
  <div className="relative aspect-[6/1] w-[175px] overflow-hidden sm:w-[230px] lg:w-[270px]">
    <img
      src={LOGO_SRC}
      alt="Estuscia – Building a Trusted Ecosystem"
      onError={onError}
      draggable={false}
      className="absolute left-1/2 top-1/2 w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
    />
  </div>
);

/** Soft wing-like waves echoing the logo mark */
const WaveBackdrop: React.FC = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 800 800"
    preserveAspectRatio="xMidYMax slice"
    className="pointer-events-none absolute inset-0 h-full w-full"
  >
    <path
      d="M-40 560 C 120 470, 230 520, 340 590 S 560 690, 700 560 S 820 470, 860 500 L 860 860 L -40 860 Z"
      fill="#8B5CF6"
      fillOpacity="0.07"
    />
    <path
      d="M-40 650 C 100 570, 220 620, 330 690 S 540 770, 680 650 S 800 590, 860 610 L 860 860 L -40 860 Z"
      fill="#5C3FE0"
      fillOpacity="0.12"
    />
    <path
      d="M-40 90 C 80 20, 190 60, 290 120 S 470 190, 580 100"
      fill="none"
      stroke="#A78BFA"
      strokeOpacity="0.18"
      strokeWidth="1.5"
    />
  </svg>
);

export const AuthView: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const success = await login(email.trim(), password);

      if (!success) {
        setLoginError('Email or password is incorrect. Check your details and try again.');
        return;
      }

      navigate('/', { replace: true });
    } catch (error: unknown) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'We could not sign you in. Please try again.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-11 text-base text-white outline-none transition placeholder:text-gray-600 hover:border-white/20 focus:border-purple-500/70 focus:ring-4 focus:ring-purple-500/15 sm:text-[15px] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0b0a1f] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:caret-white';

  return (
    // One screen on phones (no scroll). It only scrolls on very short screens,
    // such as a phone in landscape, so the button is never cut off.
    <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#040312] font-sans text-slate-100 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:overflow-hidden">
      {/* ───────── Form side ───────── */}
      <section className="relative flex h-full min-h-[540px] flex-col overflow-hidden bg-[#040312] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:min-h-0 sm:px-10 sm:pb-6 sm:pt-12 lg:order-2 lg:px-16 xl:px-24">
        {/* Background glows */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl" />

        {/* Mobile: logo at top with the form right under it. Desktop: logo top, form centered. */}
        <div className="relative flex min-h-0 flex-1 flex-col justify-start gap-6 sm:gap-0">
        <header className="relative flex justify-center lg:justify-start">
          {!logoFailed ? (
            <Logo onError={() => setLogoFailed(true)} />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5C3FE0]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">estuscia</span>
            </div>
          )}
        </header>

        <div className="relative mx-auto flex min-h-0 w-full max-w-[420px] flex-col justify-center sm:flex-1 sm:py-14">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-400 sm:mt-2 sm:text-[15px]">
            Sign in with your employee account to open your workspace.
          </p>

          <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4 sm:mt-8 sm:space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-gray-300 sm:mb-2"
              >
                Work email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  aria-invalid={!!loginError}
                  className={`${inputBase} pr-4`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-gray-300 sm:mb-2"
              >
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-invalid={!!loginError}
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm leading-relaxed text-red-300"
              >
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              aria-busy={isLoggingIn}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#753AED] px-4 text-[15px] font-semibold text-white shadow-lg shadow-purple-950/40 transition hover:from-[#6A4DF4] hover:to-[#8750F6] focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoggingIn ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security note: hidden on short phones so nothing scrolls */}
          <div className="mt-6 hidden items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 [@media(min-height:720px)]:flex sm:mt-8">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-gray-500">
              Your access depends on your role and company permissions. If you
              cannot sign in, contact your administrator.
            </p>
          </div>
        </div>

        {/* Brand message: mobile/tablet only, fills the space above the footer */}
        <div className="mx-auto my-auto w-full max-w-[420px] py-4 lg:hidden">
          <h2 className="text-[22px] font-bold leading-[1.15] tracking-tight text-white sm:text-3xl">
            Building businesses.
            <br />
            <span className="text-slate-300">Creating opportunities.</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Empowering the future.
            </span>
          </h2>
          <p className="mt-2 text-xs leading-5 text-gray-400 sm:text-sm sm:leading-6 [@media(max-height:640px)]:hidden">
            One workspace for employee management and business operations, so
            teams can manage people, processes and performance in one place.
          </p>
        </div>
        </div>

        {/* Footer: compact on mobile, one row on larger screens */}
        <footer className="relative flex shrink-0 flex-col items-center justify-between gap-0.5 pt-3 text-center text-[11px] leading-4 text-gray-500 sm:flex-row sm:text-xs">
          <p>© {new Date().getFullYear()} Estuscia Group. All rights reserved.</p>
          <p>Employee Management System</p>
        </footer>
      </section>

      {/* ───────── Brand side (desktop only) ───────── */}
      <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1B1058] via-[#0C0733] to-[#05030F] px-14 py-16 text-white lg:order-1 lg:flex lg:min-h-[100dvh] xl:px-20">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-purple-500/60 to-transparent" />
        <WaveBackdrop />

        <div className="relative max-w-xl">
          <h2 className="text-[44px] font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Building businesses.
            <br />
            <span className="text-slate-300">Creating opportunities.</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Empowering the future.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-gray-400">
            One workspace for employee management and business operations, so
            teams can manage people, processes and performance in one place.
          </p>
        </div>

        <ul className="relative mt-16 grid max-w-xl grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, color, title, text }) => (
            <li
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm"
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="mt-3 text-sm font-semibold text-gray-100">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default AuthView;
