'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/lib/AuthContext';

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
  const isStudent = form.accountType === 'student';

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

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden py-4 sm:py-8">
      {/* Ambient Red/Orange Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Left Side (Branding): Landscape Column */}
      <div className="relative p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-[#090a0b]/60 backdrop-blur-3xl z-10">
        {/* Technical Top Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            INITIATION // 02
          </span>
          <Link href="/" className="hover:text-white transition-colors">
            ← RETURN HOME
          </Link>
        </div>

        {/* Massive Editorial Headline */}
        <div className="my-auto py-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-mono tracking-widest uppercase">
            CREATIVE ORG
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.88] text-white">
            JOIN THE <br />
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-white lowercase tracking-normal">
              studio.
            </span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-sm font-light leading-relaxed">
            Register as a student creator or faculty adviser. Uniting digital artists, animators, videographers, photographers, and traditional painters.
          </p>
        </div>

        {/* Technical Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase border-t border-white/10 pt-4">
          <span>6 CREATIVE DISCIPLINES</span>
          <span>CAMPUS ORG // PHINMA</span>
        </div>
      </div>

      {/* Right Side (Form): Form sits directly on page background */}
      <div className="relative flex items-center justify-center p-4 sm:p-8 lg:p-10 z-10 w-full">
        <div className="w-full max-w-xl relative my-auto">
          {/* Subtle Red/Orange Glow behind Header */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-red-600/25 via-orange-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Form Header (Moved Up) */}
          <div className="relative z-10 mb-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              ACCOUNT CREATION
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
              Create Org Account
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Register with your institutional credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Account Type Selector: Radio Toggle */}
            <fieldset className="space-y-1.5">
              <legend className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Account Type</legend>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                      form.accountType === type.value
                        ? 'border-red-500/70 bg-red-500/15 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <input className="sr-only" type="radio" name="accountType" value={type.value} checked={form.accountType === type.value} onChange={handleChange} />
                    <span className="block text-xs font-mono font-bold uppercase tracking-wider text-white">{type.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-slate-400">{type.detail}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {!isStudent && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 text-[11px] font-mono leading-relaxed text-amber-200">
                Notice: Adviser registrations are verified by administrators before elevated permissions are granted.
              </div>
            )}

            {/* Row 1: First / Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label="First Name">
                <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className={inputClass} />
              </Field>

              <Field label="Last Name">
                <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className={inputClass} />
              </Field>
            </div>

            {/* Row 2: Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Field label="Email Address">
                <input name="email" type="email" placeholder={isStudent ? 'name@phinmaed.com' : 'name@school.edu'} value={form.email} onChange={handleChange} required className={inputClass} />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={handleChange} minLength={8} required className={`${inputClass} pr-14`} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </Field>
            </div>

            {/* Row 3: Institutional Details & Dropdowns */}
            {isStudent ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Field label="Student ID">
                    <input name="studentId" placeholder="04-2122-033338" value={form.studentId} onChange={handleChange} pattern="04-[0-9]{4}-[0-9]{6}" title="Use the format 04-2122-033338" required className={inputClass} />
                  </Field>

                  <Field label="Year Level">
                    <select name="yearLevel" value={form.yearLevel} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-[#0a0a0a]">Select year</option>
                      {YEAR_LEVELS.map((year) => <option key={year} value={year} className="bg-[#0a0a0a]">{year} Year</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Field label="Department">
                    <select name="department" value={form.department} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-[#0a0a0a]">Select department</option>
                      {DEPARTMENTS.map((dept) => <option key={dept} value={dept} className="bg-[#0a0a0a]">{dept}</option>)}
                    </select>
                  </Field>

                  <Field label="Specialization">
                    <select name="specialization" value={form.specialization} onChange={handleChange} required className={selectClass}>
                      <option value="" disabled className="bg-[#0a0a0a]">Select discipline</option>
                      {SPECIALIZATIONS.map((spec) => <option key={spec.value} value={spec.value} className="bg-[#0a0a0a]">{spec.label}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Field label="Adviser ID">
                  <input name="staffId" placeholder="Staff ID" value={form.staffId} onChange={handleChange} required className={inputClass} />
                </Field>

                <Field label="Department">
                  <select name="department" value={form.department} onChange={handleChange} required className={selectClass}>
                    <option value="" disabled className="bg-[#0a0a0a]">Select department</option>
                    {DEPARTMENTS.map((dept) => <option key={dept} value={dept} className="bg-[#0a0a0a]">{dept}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* Submit Pill Button with brand gradient integrated into the card */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 py-3.5 px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-950/60 hover:shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 mt-3 border border-red-500/40"
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

          <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs font-mono text-slate-400">
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link href="/login" className="font-bold text-red-400 hover:text-red-300 underline underline-offset-4 ml-1">
              SIGN IN →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'w-full bg-white/[0.03] border border-white/10 focus:border-red-500/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none transition-all font-sans focus:bg-white/[0.06] focus:ring-1 focus:ring-red-500/50';
const selectClass = 'w-full cursor-pointer bg-white/[0.03] border border-white/10 focus:border-red-500/80 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-sans focus:bg-white/[0.06] focus:ring-1 focus:ring-red-500/50';

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">{label}</label>
      {children}
    </div>
  );
}
