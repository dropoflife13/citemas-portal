'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      login(data.token, data.user);
      router.push('/dashboard');
    } catch {
      setError('Could not connect to the server');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white overflow-hidden relative">
      {/* Immersive Background Glows & Studio Lighting */}
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-red-600/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Left Side: Creative Brand Showcase / Welcome Side */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-16 xl:p-20 bg-gradient-to-br from-transparent via-[#0d0407]/60 to-[#140509]/90 border-r border-white/[0.06]">
        {/* Top Brand Logo */}
        <div className="absolute top-12 left-16 xl:left-20 z-10 flex items-center space-x-3.5 group cursor-pointer">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-red-600/30 transition-transform duration-300 group-hover:scale-105">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider text-white">CITEMAS</span>
            <span className="text-[9px] uppercase tracking-widest text-red-400 font-semibold">Studio Portal</span>
          </div>
        </div>

        {/* Center Content / Welcome Message */}
        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-8 backdrop-blur-md shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500"></span>
            <span>Welcome back to your creative ecosystem</span>
          </div>
          <h2 className="text-4xl xl:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6">
            Where Vision <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              Meets Execution.
            </span>
          </h2>
          <p className="text-slate-400 text-base font-light leading-relaxed">
            Collaborate seamlessly on multimedia projects, track organization milestones, and build extraordinary work with your campus peers.
          </p>
        </div>

        {/* Bottom subtle indicator */}
        <div className="absolute bottom-12 left-16 xl:left-20 z-10 flex items-center space-x-3 text-xs text-slate-500">
          <span>Secure AES Encrypted Gateway</span>
          <span>•</span>
          <span>v2.6 Studio Edition</span>
        </div>
      </div>

      {/* Right Side: Natural Form Layout */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative bg-gradient-to-bl from-transparent via-[#0b0305]/40 to-[#070305]">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo Branding */}
          <div className="flex lg:hidden items-center space-x-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center font-black text-white shadow-lg shadow-red-600/30">
              C
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">CITEMAS</span>
          </div>

          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">CITEMAS Authentication</span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Welcome Back</h1>
            <p className="mt-1.5 text-xs text-slate-400">Students and advisers use the same secure sign-in.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-xs font-medium text-red-200 backdrop-blur-md flex items-center space-x-2 animate-shake">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Email Address</label>
              <div className="relative group">
                <input
                  name="email"
                  type="email"
                  placeholder="name@phinmaed.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.04] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4.5 py-4 pr-12 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.04] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:from-red-500 hover:to-orange-500 hover:shadow-lg hover:shadow-red-600/30 active:scale-[0.98] disabled:opacity-55 cursor-pointer shadow-md shadow-red-950/50"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                'Sign In to Studio'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Don’t have a studio account yet?{' '}
            <Link href="/register" className="font-semibold text-red-400 hover:text-red-300 transition-colors underline underline-offset-4 decoration-red-500/30">
              Register for access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
