'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/AuthContext';
import CitemasLoader from '@/components/CitemasLoader';

const YEAR_LEVELS = ['1st', '2nd', '3rd', '4th', 'Graduate'];
const SPECIALIZATIONS = [
  { value: 'traditional_arts', label: 'Traditional Arts' },
  { value: 'digital_arts', label: 'Digital Arts' },
  { value: 'voice_acting', label: 'Voice Acting' },
  { value: 'animation', label: 'Animation' },
  { value: 'videography', label: 'Videography' },
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

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student', detail: 'PHINMA email & student ID' },
  { value: 'adviser', label: 'Adviser', detail: 'Institution-issued staff ID' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    accountType: 'student',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentId: '',
    staffId: '',
    yearLevel: '',
    department: '',
    specialization: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const isStudent = form.accountType === 'student';

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 280);
    return () => clearTimeout(timer);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'accountType') {
      setForm((current) => ({
        ...current,
        accountType: value,
        studentId: '',
        staffId: '',
        yearLevel: value === 'student' ? current.yearLevel : '',
        specialization: value === 'student' ? current.specialization : '',
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Something went wrong', 'error');
        return;
      }

      if (!isStudent) {
        showToast('Your staff registration was received. An administrator must verify your ID before staff access is activated.', 'success');
        setTimeout(() => router.push('/login'), 2200);
        return;
      }

      login(data.token, data.user);
      router.push('/dashboard');
    } catch {
      showToast('Could not connect to the server', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!pageReady || loading) {
    return (
      <CitemasLoader
        label={loading ? 'Creating studio account...' : 'Loading registration portal...'}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] min-h-[calc(100vh-4rem)] w-full bg-[var(--background)] text-[var(--foreground)] selection:bg-red-500 selection:text-white grid grid-cols-1 lg:grid-cols-2 relative overflow-y-auto lg:overflow-hidden transition-colors duration-300">
      {/* Ambient Red/Orange Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Left Side (Branding): Landscape Column */}
      <div className="relative lg:h-full p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black/10 dark:border-white/10 bg-[var(--card-bg)]/80 dark:bg-[#090a0b]/60 backdrop-blur-3xl z-10 transition-colors duration-300">
        {/* Technical Top Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            INITIATION // 02
          </span>
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            ← RETURN HOME
          </Link>
        </div>

        {/* Massive Editorial Headline */}
        <div className="my-auto py-4 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 text-[10px] font-mono tracking-widest uppercase">
            CREATIVE ORG
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-slate-900 dark:text-white">
            JOIN THE <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white lowercase tracking-normal">
              studio.
            </span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm font-light leading-relaxed">
            Register as a student creator or faculty adviser. Uniting digital artists, animators, videographers, photographers, and traditional painters.
          </p>
        </div>

        {/* Technical Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase border-t border-black/10 dark:border-white/10 pt-4">
          <span>6 CREATIVE DISCIPLINES</span>
          <span>CAMPUS ORG // PHINMA</span>
        </div>
      </div>

      {/* Right Side (Form): Form sits directly on page background */}
      <div className="relative lg:h-full flex items-center justify-center px-6 py-4 sm:px-10 lg:px-12 lg:py-4 z-10 w-full overflow-y-auto">
        <div className="w-full max-w-xl relative my-auto">
          {/* Subtle Red/Orange Glow behind Header */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-red-600/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Form Header (Moved Up & Compact) */}
          <div className="relative z-10 mb-3.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              ACCOUNT CREATION
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-0.5">
              Create Org Account
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-mono">
              Register with your institutional credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
            {/* Account Type Selector: Radio Toggle */}
            <fieldset className="space-y-1">
              <legend className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-semibold">Account Type</legend>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                      form.accountType === type.value
                        ? 'border-red-500/70 bg-red-500/15 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'border-black/15 bg-black/[0.02] hover:border-black/25 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <input className="sr-only" type="radio" name="accountType" value={type.value} checked={form.accountType === type.value} onChange={handleChange} />
                    <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">{type.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-slate-600 dark:text-slate-400">{type.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {!isStudent && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-[11px] font-mono leading-relaxed text-amber-800 dark:text-amber-200">
                Notice: Adviser registrations are verified by administrators before elevated permissions are granted.
              </div>
            )}

            {/* Row 1: First / Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              <Field label="First Name">
                <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className={inputClass} />
              </Field>

              <Field label="Last Name">
                <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className={inputClass} />
              </Field>
            </div>

            {/* Row 2: Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
              <Field label="Email Address">
                <input name="email" type="email" placeholder={isStudent ? 'name@phinmaed.com' : 'name@school.edu'} value={form.email} onChange={handleChange} required className={inputClass} />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={handleChange} minLength={8} required className={`${inputClass} pr-14`} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </Field>
            </div>

            {/* Row 3: Institutional Details & Dropdowns */}
            {isStudent ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  <Field label="Student ID">
                    <input name="studentId" placeholder="e.g. 04-1617-05471 or 04-2122-033338" value={form.studentId} onChange={handleChange} pattern="04-[0-9]{4}-[0-9]{4,7}" title="Use your PHINMA Student ID format (e.g., 04-1617-05471 or 04-2122-033338)" required className={inputClass} />
                  </Field>

                  <Field label="Year Level">
                    <select name="yearLevel" value={form.yearLevel} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">Select year</option>
                      {YEAR_LEVELS.map((year) => <option key={year} value={year} className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">{year} Year</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  <Field label="Department">
                    <select name="department" value={form.department} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">Select department</option>
                      {DEPARTMENTS.map((dept) => <option key={dept} value={dept} className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">{dept}</option>)}
                    </select>
                  </Field>

                  <Field label="Specialization">
                    <select name="specialization" value={form.specialization} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">Select discipline</option>
                      {SPECIALIZATIONS.map((spec) => <option key={spec.value} value={spec.value} className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">{spec.label}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                <Field label="Adviser ID">
                  <input name="staffId" placeholder="Staff ID" value={form.staffId} onChange={handleChange} required className={inputClass} />
                </Field>

                <Field label="Department">
                  <select name="department" value={form.department} onChange={handleChange} required className={selectClass}>
                    <option value="" disabled className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">Select department</option>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept} className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">{dept}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* Submit Pill Button with brand gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 py-3 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-950/30 dark:shadow-red-950/60 hover:shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 mt-2 border border-red-500/40"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create {isStudent ? 'Student' : 'Staff'} Account</span>
                  <span className="text-sm font-bold">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 text-center text-xs font-mono text-slate-600 dark:text-slate-400">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link href="/login" className="font-bold text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-4 ml-1">
              SIGN IN →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/15 dark:border-white/10 focus:border-red-500/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none transition-all font-sans focus:bg-black/[0.05] dark:focus:bg-white/[0.06] focus:ring-1 focus:ring-red-500/50';
const selectClass = 'w-full cursor-pointer bg-black/[0.03] dark:bg-white/[0.03] border border-black/15 dark:border-white/10 focus:border-red-500/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none transition-all font-sans focus:bg-black/[0.05] dark:focus:bg-white/[0.06] focus:ring-1 focus:ring-red-500/50';

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-semibold">{label}</label>
      {children}
    </div>
  );
}
