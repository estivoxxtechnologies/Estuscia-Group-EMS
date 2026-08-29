import React, { useState } from 'react';
import { EstusciaLogo } from './EstusciaLogo';
import {
  ShieldCheck,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Code,
  Headphones,
  ArrowRight,
  Lock,
  Mail,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { loginUser } from '../api/auth';

export const AuthView: React.FC = () => {
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  // Signup form state
  const [signupType, setSignupType] = useState<'employee' | 'company'>('employee');
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [designation, setDesignation] = useState('Investment Advisor');
  const [department, setDepartment] = useState('Private Client Advisory');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [plan, setPlan] = useState<'Growth' | 'Enterprise Pro'>('Enterprise Pro');
  const [currency, setCurrency] = useState('USD ($)');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await loginUser(email, password);

      localStorage.setItem(
        'accessToken',
        response.accessToken
      );

      localStorage.setItem(
        'refreshToken',
        response.refreshToken
      );

      localStorage.setItem(
        'user',
        JSON.stringify(response.user)
      );

      console.log('Logged in user:', response.user);

      // Temporary:
      // After we connect your routing/dashboard,
      // redirect will happen here.
      window.location.href = '/dashboard';

    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Login failed.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // const handleSignupSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (signupType === 'company') {
  //     signup(
  //       {
  //         name: name || 'Company Admin',
  //         email: signupEmail || 'admin@clientcorp.com',
  //         role: 'company_admin',
  //         designation: 'Managing Director & Platform Owner',
  //         department: 'Executive Leadership',
  //       },
  //       {
  //         name: companyName || 'Apex Capital Partners',
  //         domain: companyDomain || 'apexcapital.com',
  //         plan,
  //         currency,
  //         branches: ['Headquarters', 'Branch 1'],
  //         departments: ['Investment Advisory', 'Operations & HR', 'Technology', 'Risk'],
  //       }
  //     );
  //   } else {
  //     signup({
  //       name: name || 'New Team Member',
  //       email: signupEmail || 'member@estusciagroup.com',
  //       role: designation.toLowerCase().includes('developer')
  //         ? 'developer'
  //         : designation.toLowerCase().includes('hr')
  //           ? 'hr_ops'
  //           : 'staff',
  //       designation,
  //       department,
  //     });
  //   }
  // };
  //   {
  //     role: 'super_admin' as Role,
  //     label: 'Super Admin / Executive',
  //     name: 'Alexander Sterling',
  //     email: 'alexander.sterling@estusciagroup.com',
  //     badge: 'Full Executive Access',
  //     desc: 'Company progression, financial slabs, client onboarding & global controls',
  //     icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
  //     color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5',
  //   },
  //   {
  //     role: 'company_admin' as Role,
  //     label: 'Company Admin / COO',
  //     name: 'Elena Rostova',
  //     email: 'elena.rostova@estusciagroup.com',
  //     badge: 'Admin & Ops',
  //     desc: 'Operations oversight, designation permissions & attendance management',
  //     icon: <Building2 className="w-5 h-5 text-indigo-400" />,
  //     color: 'border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5',
  //   },
  //   {
  //     role: 'hr_ops' as Role,
  //     label: 'HR & Payroll Head',
  //     name: 'Priya Narang',
  //     email: 'priya.narang@estusciagroup.com',
  //     badge: 'HR / Biometric Upload',
  //     desc: 'Biometric Excel upload, payroll generation, employee onboarding',
  //     icon: <Users className="w-5 h-5 text-emerald-400" />,
  //     color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
  //   },
  //   {
  //     role: 'manager' as Role,
  //     label: 'Branch / Sales Manager',
  //     name: 'Marcus Vance',
  //     email: 'marcus.vance@estusciagroup.com',
  //     badge: 'Team Lead',
  //     desc: 'Review daily call logs, approve incentive deals & branch performance',
  //     icon: <Briefcase className="w-5 h-5 text-cyan-400" />,
  //     color: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5',
  //   },
  //   {
  //     role: 'staff' as Role,
  //     label: 'Sales Advisor / Staff',
  //     name: 'Sarah Chen',
  //     email: 'sarah.chen@estusciagroup.com',
  //     badge: 'Frontline Sales',
  //     desc: 'Daily call logger, customer deposit slips, targets & incentives (No company stats)',
  //     icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
  //     color: 'border-[#5C3FE0]/40 hover:border-[#5C3FE0]/80 bg-[#5C3FE0]/10',
  //   },
  //   {
  //     role: 'developer' as Role,
  //     label: 'Software Developer',
  //     name: 'Rohan Mehta',
  //     email: 'rohan.mehta@estusciagroup.com',
  //     badge: 'Engineering',
  //     desc: 'Daily task narrations, PR submissions, personal attendance & payslips',
  //     icon: <Code className="w-5 h-5 text-blue-400" />,
  //     color: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5',
  //   },
  // ];

  return (
    <div className="min-h-screen w-full bg-[#040312] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5C3FE0]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 lg:px-12 py-5 flex items-center justify-between border-b border-white/5 bg-[#040312]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <EstusciaLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">ESTUSCIA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30">
                EMS & Ops Platform
              </span>
            </div>
            <p className="text-xs text-gray-400">Enterprise Employee Management & Investment Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-Tenant Sovereign Architecture</span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">

          {/* Left Column: Quick Role Switcher / Showcase */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5C3FE0]/20 text-[#5C3FE0] border border-[#5C3FE0]/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Role-Based Designations & Access Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Select a Role or Sign In to Your Portal
              </h1>
              <p className="text-sm text-gray-400 max-w-xl">
                Modules are automatically restricted according to employee designations. Sales staff only see daily call logs, personal targets, and customer deposit slips. Developers see task narrations, while HR manages Excel attendance and payroll.
              </p>
            </div>

            {/* Interactive 1-Click Role Switcher Grid */}
            {/* <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium px-1">
                  <span>1-Click Instant Demo Login:</span>
                  <span className="text-[#5C3FE0]">Click any role below to test their portal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoRoles.map((demo) => (
                    <button
                      key={demo.role}
                      onClick={() => handleQuickLogin(demo.role, demo.email)}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden ${demo.color}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">
                            {demo.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                              {demo.label}
                            </p>
                            <p className="text-[11px] text-gray-400">{demo.name}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-gray-300 border border-white/10">
                          {demo.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{demo.desc}</p>
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                        <span>Click to log in as {demo.name.split(' ')[0]}</span>
                        <ArrowRight className="w-3 h-3 text-[#5C3FE0] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div> */}

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Excel Biometric Sync</span>
                </div>
                <p className="text-[11px] text-gray-400">Bulk upload employee attendance sheets effortlessly.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[#5C3FE0] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Customer Deposit Slips</span>
                </div>
                <p className="text-[11px] text-gray-400">Generate verified customer payment certificates.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>White-Label Ready</span>
                </div>
                <p className="text-[11px] text-gray-400">Sellable multi-tenant architecture for client firms.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Standard Auth Box */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl bg-[#09081E] border border-white/10 shadow-2xl shadow-purple-950/20 backdrop-blur-xl relative">

              {/* Tab Switcher: Login / Signup */}
              <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'login'
                    ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/25'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Account Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'signup'
                    ? 'bg-[#5C3FE0] text-white shadow-lg shadow-[#5C3FE0]/25'
                    : 'text-gray-400 hover:text-white'
                    }`}
                >
                  Register / Onboard
                </button>
              </div>

              {authMode === 'login' ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Employee Email or ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your.name@estusciagroup.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5C3FE0] focus:ring-1 focus:ring-[#5C3FE0]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-300">Password</label>
                      <button
                        type="button"
                        onClick={() => alert('Demo platform: Simply click any of the 1-click role buttons or submit with any password!')}
                        className="text-[11px] text-[#5C3FE0] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your security password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#5C3FE0] focus:ring-1 focus:ring-[#5C3FE0]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Login error message */}
                  {loginError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {loginError}
                    </div>
                  )}

                  {/*Submit Button*/}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5C3FE0] to-[#7C3AED] hover:from-[#6A4DF4] hover:to-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center justify-center gap-2 group"
                    >
                      <UserCheck className="w-4 h-4" />

                      <span>
                        {isLoggingIn ? 'Signing In...' : 'Access Sovereign Workspace'}
                      </span>

                      {!isLoggingIn && (
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Signup / Onboard Form */
                <form onSubmit={() => { }} className="space-y-3.5">
                  <div className="flex gap-2 p-1 rounded-lg bg-black/40 border border-white/10 mb-2">
                    <button
                      type="button"
                      onClick={() => setSignupType('employee')}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold ${signupType === 'employee'
                        ? 'bg-white/15 text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Join as Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupType('company')}
                      className={`flex-1 py-1.5 rounded-md text-[11px] font-bold ${signupType === 'company'
                        ? 'bg-[#5C3FE0] text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    >
                      Onboard New Client Company
                    </button>
                  </div>

                  {signupType === 'company' ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">Company / Firm Name</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Apex Wealth Management LLC"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-300 mb-1">Domain</label>
                          <input
                            type="text"
                            value={companyDomain}
                            onChange={(e) => setCompanyDomain(e.target.value)}
                            placeholder="apexwealth.com"
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-300 mb-1">Currency</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                          >
                            <option value="USD ($)">USD ($)</option>
                            <option value="EUR (€)">EUR (€)</option>
                            <option value="AED (AED)">AED (AED)</option>
                            <option value="GBP (£)">GBP (£)</option>
                            <option value="INR (₹)">INR (₹)</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tariq Mansoor"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="tariq@estusciagroup.com"
                      className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                    />
                  </div>

                  {signupType === 'employee' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">Designation</label>
                        <select
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                        >
                          <option value="Investment Advisor">Investment Advisor (Sales)</option>
                          <option value="Client Relationship Manager">Relationship Manager (Sales)</option>
                          <option value="Senior Full Stack Software Engineer">Software Developer (Tech)</option>
                          <option value="HR Operations Specialist">HR & Payroll Specialist</option>
                          <option value="Operations & Client Services">Operations Support</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-300 mb-1">Department</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-[#5C3FE0]"
                        >
                          <option value="Private Client Advisory">Private Client Advisory</option>
                          <option value="Engineering & Tech">Engineering & Tech</option>
                          <option value="Operations & HR">Operations & HR</option>
                          <option value="Investment & Wealth">Investment & Wealth</option>
                        </select>
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#5C3FE0] hover:bg-[#6A4DF4] text-white font-bold text-xs tracking-wide shadow-lg shadow-[#5C3FE0]/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {signupType === 'company' ? 'Register Client Company' : 'Complete Employee Profile'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Estuscia Group Holdings. Sovereign Employee Management & Investment System.</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Security SLA 99.99%</span>
          <span>•</span>
          <span>AES-256 Vault Encryption</span>
        </div>
      </footer>
    </div>
  );
};
