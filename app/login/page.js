'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

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
    <div className="flex min-h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-4.5rem)] w-full bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white overflow-hidden relative items-center">
      {/* Immersive Background Glows & Studio Lighting */}
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-red-600/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Left Side: Creative Brand Showcase / Welcome Side */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative flex-col justify-center py-8 px-12 xl:px-16 bg-gradient-to-br from-transparent via-[#0d0407]/60 to-[#140509]/90 border-r border-white/[0.06]">
        {/* Center Content / Welcome Message */}
        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center space-x-2 text-red-400 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500"></span>
            <span>Welcome back to your creative ecosystem</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <img
              src="/logo.png"
              alt="CITEMAS Logo"
              className="h-14 w-14 xl:h-16 xl:w-16 object-contain shrink-0 filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.4)]"
            />
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-[1.15] text-white">
              Where Vision <br />
              <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                Meets Execution.
              </span>
            </h2>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed mb-6 max-w-md">
            Collaborate on multimedia projects, submit creative portfolios, register for workshops, and build extraordinary work with campus creators.
          </p>

          {/* Quick Studio Features */}
          <div className="space-y-2.5 max-w-md">
            <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/[0.02] backdrop-blur-md text-xs text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/10 text-red-400 font-bold">🎨</span>
              <span>6 Multimedia disciplines & student portfolios</span>
            </div>
            <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/[0.02] backdrop-blur-md text-xs text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 font-bold">⚡</span>
              <span>Events, workshops, and creative exhibits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Elevated Form Layout */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-8 relative bg-gradient-to-bl from-transparent via-[#0b0305]/40 to-[#070305]">
        <div className="w-full max-w-md relative z-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">CITEMAS Sign In</span>
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 font-medium">
              <span>←</span>
              <span>Back Home</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Welcome Back</h1>
          <p className="text-xs text-slate-400 mb-5">Students and advisers use the same secure sign-in.</p>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-200 backdrop-blur-md flex items-center space-x-2 animate-shake">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-300">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  name="email"
                  type="email"
                  placeholder="student@phinmaed.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-11 pr-4.5 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-11 pr-12 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:from-red-500 hover:to-orange-500 hover:shadow-lg hover:shadow-red-600/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-55 cursor-pointer shadow-md shadow-red-950/50"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </span>
              ) : (
                'Sign In to Studio'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Don’t have a studio account yet?{' '}
            <Link href="/register" className="font-bold text-red-400 hover:text-red-300 transition-colors underline underline-offset-4 decoration-red-500/40">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
