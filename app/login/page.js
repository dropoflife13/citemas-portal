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
    <div className="min-h-screen w-full bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white flex flex-col lg:flex-row relative overflow-hidden">
      {/* Ambient Red Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Left 50%: Massive Editorial Brand & Headline */}
      <div className="w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen relative p-8 sm:p-14 lg:p-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-[#090a0b]/60 backdrop-blur-3xl z-10">
        {/* Technical Top Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            SYSTEM ACCESS // 01
          </span>
          <Link href="/" className="hover:text-white transition-colors">
            ← RETURN HOME
          </Link>
        </div>

        {/* Massive Editorial Headline */}
        <div className="my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-mono tracking-widest uppercase">
            STUDIO PROTOCOL
          </div>

          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.88] text-white">
            WELCOME <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-white lowercase tracking-normal">
              back.
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-slate-400 max-w-md font-light leading-relaxed">
            Collaborate on multimedia productions, submit creative portfolios, and access the active CITEMAS creative guild directory.
          </p>
        </div>

        {/* Technical Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase border-t border-white/10 pt-4">
          <span>PHINMA UNIVERSITY OF ILOILO</span>
          <span>EST. 2014 // CITE GUILD</span>
        </div>
      </div>

      {/* Right 50%: Clean Editorial Form with Bottom-Border Inputs */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-8 sm:p-14 lg:p-20 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-500">AUTHENTICATION</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mt-1">
              Sign In To Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Students and advisers use their verified accounts.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-mono text-red-300 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Email Input: Border-b only, transparent background */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  placeholder="student@phinmaed.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-white/20 py-3 text-sm text-white placeholder:text-slate-600 outline-none rounded-none transition-colors focus:border-red-500 font-sans"
                />
              </div>
            </div>

            {/* Password Input: Border-b only, transparent background */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-white/20 py-3 pr-10 text-sm text-white placeholder:text-slate-600 outline-none rounded-none transition-colors focus:border-red-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Massive Full-Width Pill Submit Button with Arrow Icon */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-red-600 to-orange-600 py-4 px-8 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-950/60 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Enter Studio Dashboard</span>
                  <span className="text-sm font-bold">→</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs font-mono text-slate-400">
            DON&apos;T HAVE AN ACCOUNT YET?{' '}
            <Link href="/register" className="font-bold text-red-400 hover:text-red-300 underline underline-offset-4 ml-1">
              JOIN GUILD →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
