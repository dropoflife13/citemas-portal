'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, Clock3, ArrowRight, UserPlus, LogIn, Home } from 'lucide-react';

export default function AccessDenied({
  title = 'Restricted Community Access',
  resourceName = 'this section',
  message = 'This section is available to approved CITEMAS members.',
}) {
  const { user, token, loading: authLoading } = useAuth();
  const [appStatus, setAppStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    let isMounted = true;
    setCheckingStatus(true);

    fetch('/api/applications/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setAppStatus(data.status || (user.role === 'applicant' ? 'pending' : 'not_applied'));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppStatus(user.role === 'applicant' ? 'pending' : 'not_applied');
        }
      })
      .finally(() => {
        if (isMounted) setCheckingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  if (authLoading || checkingStatus) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-medium tracking-wider text-red-200/70">Checking membership credentials...</p>
        </div>
      </div>
    );
  }

  // Case 1: Logged out
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-[#FDFBF7]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6">
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-red-600/20 blur-3xl" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
            <p className="text-sm text-[#FDFBF7]/70 max-w-lg mx-auto leading-relaxed">
              {message} Please log in to your account or create a new student account to get started.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:brightness-110 active:scale-95"
            >
              <LogIn size={15} />
              Log In
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10 active:scale-95"
            >
              <UserPlus size={15} />
              Register Account
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-3 text-xs font-semibold text-white/60 hover:text-white transition"
            >
              <Home size={15} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Logged in, application pending
  const isPending = appStatus === 'pending' || user.role === 'applicant';
  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-[#FDFBF7]">
        <div className="relative overflow-hidden rounded-[32px] border border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-white/[0.02] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6">
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse">
            <Clock3 size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
              Application Under Review
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Your membership application is pending review.
            </h2>
            <p className="text-sm text-[#FDFBF7]/70 max-w-lg mx-auto leading-relaxed">
              Our executive officers and advisers are evaluating your application for CITEMAS membership. Once approved, you will have immediate access to {resourceName}, the member directory, and student portfolios.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-900/40 transition hover:brightness-110 active:scale-95"
            >
              View Application Status
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10 active:scale-95"
            >
              <Home size={15} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Logged in, rejected applicant
  const isRejected = appStatus === 'rejected';
  if (isRejected) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-[#FDFBF7]">
        <div className="relative overflow-hidden rounded-[32px] border border-red-500/30 bg-gradient-to-b from-red-500/[0.08] to-white/[0.02] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6">
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-red-600/20 blur-3xl" />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full border border-red-500/40 bg-red-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-200">
              Application Not Approved
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Application was not approved.
            </h2>
            <p className="text-sm text-[#FDFBF7]/70 max-w-lg mx-auto leading-relaxed">
              Your previous membership application was not approved. You are welcome to update your details and submit a new application for review.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/applications"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:brightness-110 active:scale-95"
            >
              Apply for Membership Again
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10 active:scale-95"
            >
              <Home size={15} />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Logged in, not yet applied / regular student 'user'
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-[#FDFBF7]">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6">
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-red-600/20 blur-3xl" />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-300">
            CITEMAS Members Only
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">{title}</h2>
          <p className="text-sm text-[#FDFBF7]/70 max-w-lg mx-auto leading-relaxed">
            {message} Apply for membership to unlock full access to member profiles, creative portfolios, and community events.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-900/40 transition hover:brightness-110 active:scale-95"
          >
            <UserPlus size={15} />
            Apply as a Member
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-white/10 active:scale-95"
          >
            <Home size={15} />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
