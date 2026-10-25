'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import CitemasLoader from '@/components/CitemasLoader';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 280);
    return () => clearTimeout(timer);
  }, []);

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

  if (!pageReady || authLoading || loading) {
    return (
      <CitemasLoader
        label={loading ? 'Signing in to CITEMAS Studio...' : 'Loading authentication portal...'}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full bg-[var(--background)] text-[var(--foreground)] selection:bg-red-500 selection:text-white flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-hidden transition-colors duration-300">
      {/* Ambient Red Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Left 50%: Massive Editorial Brand & Headline */}
      <div className="w-full lg:w-1/2 lg:h-full relative p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black/10 dark:border-white/10 bg-[var(--card-bg)]/80 dark:bg-[#090a0b]/60 backdrop-blur-3xl z-10 transition-colors duration-300">
        {/* Technical Top Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            SYSTEM ACCESS // 01
          </span>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            ← RETURN HOME
          </Link>
        </div>

        {/* Massive Editorial Headline */}
        <div className="my-auto py-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 text-[10px] font-mono tracking-widest uppercase">
            STUDIO PROTOCOL
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-[0.88] text-slate-900 dark:text-white">
            WELCOME <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white lowercase tracking-normal">
              back.
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md font-light leading-relaxed">
            Collaborate on multimedia productions, submit creative portfolios, and access the active CITEMAS creative org directory.
          </p>
        </div>

        {/* Technical Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase border-t border-black/10 dark:border-white/10 pt-4">
          <span>PHINMA UNIVERSITY OF ILOILO</span>
          <span>EST. 2014 // CITE ORG</span>
        </div>
      </div>

      {/* Right 50%: Clean Editorial Form with Bottom-Border Inputs */}
      <div className="w-full lg:w-1/2 lg:h-full flex items-center justify-center p-6 sm:p-10 lg:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold">AUTHENTICATION</div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
              Sign In To Studio
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
              Students and advisers use their verified accounts.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-mono text-red-600 dark:text-red-300 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input: Border-b only, transparent background */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-semibold">
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  placeholder="name.phinmaed.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b border-black/20 dark:border-white/20 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none rounded-none transition-colors focus:border-red-500 font-sans"
                />
              </div>
            </div>

            {/* Password Input: Border-b only, transparent background */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-semibold">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[10px] font-mono uppercase tracking-wider text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors">
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
                  className="w-full bg-transparent border-b border-black/20 dark:border-white/20 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none rounded-none transition-colors focus:border-red-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1 cursor-pointer"
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
              className="w-full rounded-full bg-gradient-to-r from-red-600 to-orange-600 py-3.5 px-8 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-950/30 dark:shadow-red-950/60 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
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

          <div className="pt-4 border-t border-black/10 dark:border-white/10 text-center text-xs font-mono text-slate-600 dark:text-slate-400">
            DON&apos;T HAVE AN ACCOUNT YET?{' '}
            <Link href="/register" className="font-bold text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-4 ml-1">
              JOIN THE ORG →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
