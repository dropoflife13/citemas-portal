'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

const YEAR_LEVELS = ['1st', '2nd', '3rd', '4th', 'Graduate'];
const SPECIALIZATIONS = [
  { value: 'traditional_arts', label: 'Traditional Arts' },
  { value: 'digital_arts', label: 'Digital Arts' },
  { value: 'voice_acting', label: 'Voice Acting' },
  { value: 'video_editing', label: 'Video Editing' },
  { value: 'photography', label: 'Photography' },
];
const DEPARTMENTS = [
  'College of Arts & Sciences (CAS)',
  'College of Accountancy',
  'College of Allied Health Sciences (CAHS)',
  'College of Criminal Justice Education (CCJE)',
  'College of Education (CoEd)',
  'College of Engineering',
  'College of Information Technology Education (CITE)',
  'College of Management (COM)',
  'College of Maritime Education (COME)',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentId: '',
    yearLevel: '',
    department: '',
    specialization: '',
  });
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
      const res = await fetch('/api/auth/register', {
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
      <div className="mx-auto max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Join the Community</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">Create Account</h1>
          <p className="mt-2 text-sm text-[#FDFBF7]/70">Join the CITEMAS creative community.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">First Name</label>
              <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Last Name</label>
              <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Email</label>
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Password</label>
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Student ID</label>
              <input name="studentId" placeholder="Student ID" value={form.studentId} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Year Level</label>
              <select name="yearLevel" value={form.yearLevel} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500">
                <option value="">Year Level</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y} value={y}>{y} Year</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Department</label>
            <select name="department" value={form.department} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500">
              <option value="">Select Department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#FDFBF7]/60">Specialization</label>
            <select name="specialization" value={form.specialization} onChange={handleChange} required className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500">
              <option value="">Select Specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#FDFBF7]/70">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-red-300 hover:text-red-200">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}