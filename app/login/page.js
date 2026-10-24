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
    <div className="flex min-h-screen w-full bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white overflow-hidden relative">
      {/* Immersive Background Glows & Studio Lighting */}
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-red-600/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* Left Side: Creative Brand Showcase / Welcome Side */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-16 xl:p-20 bg-gradient-to-br from-transparent via-[#0d0407]/60 to-[#140509]/90 border-r border-white/[0.06]">
        {/* Center Content / Welcome Message */}
        <div className="relative z-10 max-w-lg my-auto">
          {/* Official CITEMAS Logo & Brand Presentation */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-600/20 to-black/40 p-2.5 shadow-lg shadow-red-950/60 backdrop-blur-md">
              <img
                src="/logo.png"
                alt="CITEMAS Official Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.6)]"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white">CITEMAS</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">Creative Guild Portal</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-6 backdrop-blur-md shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500"></span>
            <span>Welcome back to your creative ecosystem</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] text-white mb-6">
            Where Vision <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              Meets Execution.
            </span>
          </h2>

          <p className="text-slate-400 text-sm font-light leading-relaxed mb-8 max-w-md">
            Collaborate on multimedia projects, submit creative portfolios, register for workshops, and build extraordinary work with campus creators.
          </p>

          {/* Quick Studio Features */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center space-x-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md text-xs text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold">🎨</span>
              <span>6 Multimedia disciplines & student portfolios</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md text-xs text-slate-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">⚡</span>
              <span>Events, workshops, and creative exhibits</span>
            </div>
          </div>
        </div>

        {/* Bottom subtle indicator */}
        <div className="absolute bottom-12 left-16 xl:left-20 z-10 flex items-center space-x-3 text-xs text-slate-500">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Encrypted Gateway</span>
          <span>•</span>
          <span>CITEMAS Portal v2.6</span>
        </div>
      </div>

      {/* Right Side: Elevated Form Layout */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-gradient-to-bl from-transparent via-[#0b0305]/40 to-[#070305]">
        <div className="w-full max-w-md relative z-10 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-500">CITEMAS Sign In</span>
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 font-medium">
              <span>←</span>
              <span>Back Home</span>
            </Link>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white mb-1.5">Welcome Back</h1>
          <p className="text-xs text-slate-400 mb-6">Students and advisers use the same secure sign-in.</p>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-xs font-medium text-red-200 backdrop-blur-md flex items-center space-x-2 animate-shake">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                <input
                  name="email"
                  type="email"
                  placeholder="student@phinmaed.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-11 pr-4.5 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-11 pr-12 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-600 focus:border-red-500/80 focus:bg-white/[0.05] focus:ring-4 focus:ring-red-500/10 hover:border-white/20"
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
              className="w-full mt-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-white transition-all duration-300 hover:from-red-500 hover:to-orange-500 hover:shadow-lg hover:shadow-red-600/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-55 cursor-pointer shadow-md shadow-red-950/50"
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

          <p className="mt-6 text-center text-xs text-slate-400">
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
