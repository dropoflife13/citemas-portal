'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
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
    } catch (err) {
      setError('Could not connect to the server');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-16 text-[#FDFBF7] sm:px-6">
      <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Portal Access</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">Log In</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#FDFBF7]/70">
          Don’t have an account?{' '}
          <Link href="/register" className="font-bold text-red-300 hover:text-red-200">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}