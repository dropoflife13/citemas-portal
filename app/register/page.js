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

const ACCOUNT_TYPES = [
  { value: 'student', label: 'Student', detail: 'PHINMA email and student number required' },
  { value: 'adviser', label: 'Adviser', detail: 'Institution-issued staff ID required' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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
    setError('');
    setNotice('');
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
        return;
      }

      if (!isStudent) {
        setNotice('Your staff registration was received. An administrator must verify your ID before staff access is activated.');
        setTimeout(() => router.push('/login'), 2200);
        return;
      }

      login(data.token, data.user);
      router.push('/dashboard');
    } catch {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#070305] px-4 py-16 text-slate-100 selection:bg-red-500 selection:text-white sm:px-6">
      <div className="pointer-events-none absolute left-[10%] top-[-5%] h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-5%] right-[10%] h-[500px] w-[500px] rounded-full bg-orange-600/8 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))]" />

      <div className="relative z-10 mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
        <div className="mb-8 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 font-black text-white shadow-lg shadow-red-600/30">C</div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-wider text-white">CITEMAS</span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-red-400">Studio Registry</span>
          </div>
        </div>

        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Join the Community</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Create Account</h1>
          <p className="mt-1.5 text-xs text-slate-400">Register as a student or adviser.</p>
        </div>

        {error && <StatusMessage type="error" text={error} />}
        {notice && <StatusMessage type="success" text={notice} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset>
            <legend className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">Account type</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCOUNT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`cursor-pointer rounded-2xl border p-3 transition-colors ${
                    form.accountType === type.value
                      ? 'border-red-500/70 bg-red-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  }`}
                >
                  <input className="sr-only" type="radio" name="accountType" value={type.value} checked={form.accountType === type.value} onChange={handleChange} />
                  <span className="block text-xs font-black uppercase tracking-wider text-white">{type.label}</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">{type.detail}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {!isStudent && (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
              Adviser registrations are reviewed before staff permissions are enabled.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First Name"><input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className={inputClass} /></Field>
            <Field label="Last Name"><input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className={inputClass} /></Field>
          </div>

          <Field label="Email Address">
            <input name="email" type="email" placeholder={isStudent ? 'name@phinmaed.com' : 'name@school.edu'} value={form.email} onChange={handleChange} required className={inputClass} />
            {isStudent && <p className="mt-1.5 text-[10px] text-slate-500">Student accounts only accept an email ending in @phinmaed.com.</p>}
          </Field>

          <Field label="Password">
            <div className="relative">
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={form.password} onChange={handleChange} minLength={8} required className={`${inputClass} pr-12`} />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-xs text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          {isStudent ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Student ID">
                <input name="studentId" placeholder="04-2122-033338" value={form.studentId} onChange={handleChange} pattern="04-[0-9]{4}-[0-9]{6}" title="Use the format 04-2122-033338" required className={inputClass} />
              </Field>
              <Field label="Year Level">
                <select name="yearLevel" value={form.yearLevel} onChange={handleChange} required className={selectClass}>
                  <option value="" disabled>Select year</option>
                  {YEAR_LEVELS.map((year) => <option key={year} value={year}>{year} Year</option>)}
                </select>
              </Field>
            </div>
          ) : (
            <Field label="Adviser ID">
              <input name="staffId" placeholder="Institution-issued staff ID" value={form.staffId} onChange={handleChange} required className={inputClass} />
              <p className="mt-1.5 text-[10px] text-slate-500">Use the ID issued by the university. Student IDs are not accepted here.</p>
            </Field>
          )}

          <Field label="Department">
            <select name="department" value={form.department} onChange={handleChange} required className={selectClass}>
              <option value="" disabled>Select department</option>
              {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </Field>

          {isStudent && (
            <Field label="Specialization">
              <select name="specialization" value={form.specialization} onChange={handleChange} required className={selectClass}>
                <option value="" disabled>Select specialization</option>
                {SPECIALIZATIONS.map((specialization) => <option key={specialization.value} value={specialization.value}>{specialization.label}</option>)}
              </select>
            </Field>
          )}

          <button type="submit" disabled={loading || Boolean(notice)} className="mt-2 w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-md shadow-red-950/50 transition-all hover:from-red-500 hover:to-orange-500 hover:shadow-lg hover:shadow-red-600/30 disabled:cursor-not-allowed disabled:opacity-55">
            {loading ? 'Creating Account...' : `Create ${isStudent ? 'Student' : 'Staff'} Account`}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">Already have an account? <Link href="/login" className="font-semibold text-red-400 underline decoration-red-500/30 underline-offset-4 transition-colors hover:text-red-300">Sign in</Link></p>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/20 focus:border-red-500/80 focus:bg-white/[0.04] focus:ring-4 focus:ring-red-500/10';
const selectClass = 'w-full cursor-pointer rounded-2xl border border-white/10 bg-[#0c0507] px-4 py-3.5 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10';

function Field({ label, children }) {
  return <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">{label}</label>{children}</div>;
}

function StatusMessage({ type, text }) {
  const isError = type === 'error';
  return <div className={`mb-6 rounded-2xl border px-4 py-3.5 text-xs font-medium ${isError ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>{text}</div>;
}
