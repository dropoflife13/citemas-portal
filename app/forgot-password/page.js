'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SCHOOL_EMAIL_PATTERN = /^[^\s@]+@phinmaed\.com$/i;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function requestCode(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!SCHOOL_EMAIL_PATTERN.test(email.trim())) {
      setMessage({ type: 'error', text: 'Use your PHINMA email ending in @phinmaed.com.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send a verification code.');
      setStep('confirm');
      setMessage({ type: 'success', text: data.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to send a verification code.' });
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (!/^\d{6}$/.test(code.trim())) {
      setMessage({ type: 'error', text: 'Enter the 6-digit verification code from your school email.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Choose a password with at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'The passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reset password.');
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => router.push('/login'), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to reset password.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070305] px-4 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Account recovery</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          We’ll send a 6-digit verification code to your PHINMA school Gmail account.
        </p>

        <div className="mt-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 'request' ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-200'}`}>1</span>
          <span>School email</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 'confirm' ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'}`}>2</span>
          <span>Verify</span>
        </div>

        {message.text && <StatusMessage type={message.type} text={message.text} />}

        {step === 'request' ? (
          <form className="mt-7 space-y-5" onSubmit={requestCode}>
            <Field label="PHINMA school email">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nice.deasis.ui@phinmaed.com" autoComplete="email" required className={inputClass} />
            </Field>
            <button type="submit" disabled={loading} className={buttonClass}>{loading ? 'Sending code...' : 'Send verification code'}</button>
          </form>
        ) : (
          <form className="mt-7 space-y-5" onSubmit={resetPassword}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-slate-300">
              Code sent to <span className="font-bold text-white">{email.trim().toLowerCase()}</span>. It expires in 10 minutes.
            </div>
            <Field label="Verification code">
              <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="123456" autoComplete="one-time-code" required className={`${inputClass} text-center text-lg font-black tracking-[0.5em]`} />
            </Field>
            <Field label="New password">
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" autoComplete="new-password" required className={inputClass} />
            </Field>
            <Field label="Confirm new password">
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} placeholder="Repeat your new password" autoComplete="new-password" required className={inputClass} />
            </Field>
            <button type="submit" disabled={loading} className={buttonClass}>{loading ? 'Resetting password...' : 'Verify code and reset password'}</button>
            <button type="button" onClick={() => { setStep('request'); setCode(''); setMessage({ type: '', text: '' }); }} className="w-full text-xs font-semibold text-red-300 transition hover:text-red-200">Use a different email or resend a code</button>
          </form>
        )}

        <p className="mt-7 text-center text-xs text-slate-400">Remembered it? <Link href="/login" className="font-semibold text-red-400 underline underline-offset-4 hover:text-red-300">Back to sign in</Link></p>
      </section>
    </main>
  );
}

const inputClass = 'mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10';
const buttonClass = 'w-full rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-red-950/40 transition hover:from-red-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-55';

function Field({ label, children }) {
  return <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">{label}{children}</label>;
}

function StatusMessage({ type, text }) {
  const isError = type === 'error';
  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-xs leading-relaxed ${isError ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>{text}</div>;
}
