// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CITEMAS_RED = '#DC2626';
const CITEMAS_DARK_RED = '#7F1D1D';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253, 251, 247, 0.75)';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('citemas_token');
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      router.replace('/dashboard');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading || isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#110808] text-[#FDFBF7]">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[-10%] top-[-8%] h-[500px] w-[500px] rounded-full bg-red-600/20 blur-[140px]" />
        <div className="absolute right-[-8%] top-[25%] h-[550px] w-[550px] rounded-full bg-red-900/25 blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <span
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-300"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
            >
              College of Technology Education
            </span>

            <div className="space-y-5">
              <h1 className="text-5xl font-black tracking-tight text-[#FDFBF7] sm:text-6xl lg:text-7xl">
                Welcome to <span style={{ color: CITEMAS_RED }}>CITEMAS</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#FDFBF7]/80 sm:text-lg" style={{ color: MUTED }}>
                Multimedia Arts Studio for student creators, designers, and creatives at PHINMA University of Iloilo.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${CITEMAS_RED} 0%, ${CITEMAS_DARK_RED} 100%)` }}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                Register
              </Link>
            </div>

            <div className="grid max-w-xl gap-4 pt-4 sm:grid-cols-3">
              {[
                ['🎨', 'Portfolio'],
                ['📅', 'Events'],
                ['👥', 'Members'],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-xl"
                >
                  <div className="mb-2 text-2xl">{icon}</div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FDFBF7]/80">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/15 bg-white/[0.04] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300">Portal Overview</p>
                <h2 className="mt-2 text-2xl font-black text-[#FDFBF7]">Student Community</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Active
              </div>
            </div>

            <div className="space-y-4">
              {[
                ['Creative Development', 'Workshops, projects, and portfolio growth.'],
                ['Events & Engagement', 'Student showcases, exhibits, and community programs.'],
                ['Member Directory', 'Connect with officers, alumni, and fellow creatives.'],
              ].map(([title, text], idx) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-sm font-black text-red-300">
                      {idx + 1}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#FDFBF7]">{title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[#FDFBF7]/70">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}