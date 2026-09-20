// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
type OfficerRecord = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  officerPosition?: string | null;
  avatar?: string | null;
  bio?: string | null;
};

type FeaturedOfficer = {
  id: string;
  name: string;
  role: string;
  image: string | null;
  bio: string;
};

/* ──────────────────────────────────────────────
   Constants (outside the component)
   ────────────────────────────────────────────── */
const POSITION_DESCRIPTIONS: Record<string, string> = {
  president:
    'Provides overall leadership and guides the organization toward its goals and activities.',
  vice_president:
    'Supports organizational leadership and coordinates projects, activities, and members.',
  secretary:
    'Manages organizational records, documentation, communications, and official correspondence.',
  treasurer:
    'Oversees financial records, budgeting, and responsible management of organization funds.',
  pro: 'Handles public relations, announcements, and communication between CITEMAS and its community.',
  pio: 'Supports information dissemination, publicity, and communication of CITEMAS activities.',
  events_director:
    'Coordinates events and programs that encourage collaboration, creativity, and student participation.',
  creative_director:
    'Leads creative direction and supports the organization’s visual and multimedia initiatives.',
  year_level_representative:
    'Represents the concerns and interests of students within their respective year level.',
};

const STATS = [
  { label: 'Active Members', value: '50+', detail: 'Creative and tech-driven community' },
  { label: 'Events Hosted', value: '10+', detail: 'Workshops, showcases, and campus programs' },
  { label: 'Projects Completed', value: '50+', detail: 'Brand, website, and multimedia builds' },
  { label: 'Years Active', value: '5+', detail: 'A growing creative legacy in the school' },
];

const CAROUSEL_INTERVAL_MS = 6000;

/* ──────────────────────────────────────────────
   Helpers (outside the component)
   ────────────────────────────────────────────── */
function formatPosition(position: string | null | undefined): string {
  if (!position) return 'Officer';
  const normalized = position.trim().toLowerCase();
  if (normalized === 'pro') return 'PRO';
  if (normalized === 'pio') return 'PIO';
  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getPositionDescription(
  position: string | null | undefined,
  apiBio?: string | null,
): string {
  const trimmedBio = apiBio?.trim();
  if (trimmedBio) return trimmedBio;
  const normalized = position?.trim().toLowerCase() || '';
  return (
    POSITION_DESCRIPTIONS[normalized] ||
    'Contributes to the leadership and development of the CITEMAS community.'
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CO';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ──────────────────────────────────────────────
   Initials avatar (no external requests)
   ────────────────────────────────────────────── */
function InitialsAvatar({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const initials = useMemo(() => getInitials(name), [name]);
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-red-700 to-red-900 text-[#F8F2EC] font-black select-none ${className}`}
      aria-hidden="true"
    >
      <span className="text-5xl md:text-6xl tracking-tight">{initials}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Home component
   ────────────────────────────────────────────── */
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isLoggedIn = Boolean(user);

  const [activeIdx, setActiveIdx] = useState(0);
  const [officers, setOfficers] = useState<FeaturedOfficer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officersError, setOfficersError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  /* ── Fetch officers (with abort + real error state) ── */
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setOfficersLoading(true);
      setOfficersError(false);

      try {
        const res = await fetch('/api/officers', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Officers request failed: ${res.status}`);
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Officers API did not return JSON');
        }

        const data: unknown = await res.json();

        const raw =
          data && typeof data === 'object' && Array.isArray((data as any).officers)
            ? ((data as { officers: unknown[] }).officers as OfficerRecord[])
            : [];

        const normalized: FeaturedOfficer[] = raw
          .filter((person) => Boolean(person) && typeof person === 'object')
          .filter((person) => Boolean(person.officerPosition))
          .map((person, index) => {
            const name =
              `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
              'CITEMAS Officer';
            return {
              id: person._id || `${name}-${index}`,
              name,
              role: formatPosition(person.officerPosition),
              image: person.avatar?.trim() || null,
              bio: getPositionDescription(person.officerPosition, person.bio),
            };
          });

        if (!controller.signal.aborted) {
          setOfficers(normalized);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setOfficers([]);
          setOfficersError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setOfficersLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, []);

  /* ── Clamp activeIdx when the officer list changes length ── */
  useEffect(() => {
    setActiveIdx((current) => {
      if (officers.length === 0) return 0;
      return Math.min(current, officers.length - 1);
    });
  }, [officers.length]);

  /* ── Auto-advance carousel (pauseable, respects tab visibility) ── */
  useEffect(() => {
    if (officers.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setActiveIdx((current) => (current + 1) % officers.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [officers.length, isPaused]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (officers.length === 0) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIdx((c) => (c - 1 + officers.length) % officers.length);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIdx((c) => (c + 1) % officers.length);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [officers.length]);

  const current = officers[activeIdx] || null;

  const goNext = useCallback(() => {
    if (officers.length === 0) return;
    setActiveIdx((c) => (c + 1) % officers.length);
  }, [officers.length]);

  const goPrev = useCallback(() => {
    if (officers.length === 0) return;
    setActiveIdx((c) => (c - 1 + officers.length) % officers.length);
  }, [officers.length]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FDFBF7]">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-[15%] top-[-10%] h-[600px] w-[600px] rounded-full bg-red-600/[0.12] blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[5%] h-[600px] w-[600px] rounded-full bg-orange-600/[0.10] blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]" />

      <main className="relative z-10 flex-1">
        {/* ───────── HERO ───────── */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
          <div className="mb-8 inline-flex items-center space-x-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 shadow-inner backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span>Welcome, CITE &amp; Multimedia Arts Studio</span>
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
            Shape the Future of <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              Digital Creation Together
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-slate-400 md:text-xl">
            Your central creative hub for student collaboration, tech-driven
            design projects, portfolios, and organization events.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="group flex w-full cursor-pointer items-center justify-center space-x-3 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:from-red-500 hover:to-orange-500 sm:w-auto"
              >
                <span>Open Your Dashboard</span>
                <span className="transform transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-red-600/30 transition-all duration-300 hover:from-red-500 hover:to-orange-500 sm:w-auto"
                >
                  Create Student Account
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full cursor-pointer rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-4 font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white sm:w-auto"
                >
                  Already have an account? Sign In
                </button>
              </>
            )}
          </div>
        </section>

        {/* ───────── LEADERSHIP ───────── */}
        <section
          className="mx-auto max-w-5xl px-6 py-12"
          aria-labelledby="leadership-heading"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsPaused(false);
            }
          }}
        >
          <div className="mb-10 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
              Leadership Team
            </span>
            <h2
              id="leadership-heading"
              className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl"
            >
              Executive Leadership
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Meet the current officers leading the CITEMAS community.
            </p>
          </div>

          {officersLoading ? (
            <div
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl md:p-10"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="h-72 animate-pulse rounded-2xl bg-white/[0.05] md:h-80" />
                <div className="space-y-5">
                  <div className="h-3 w-32 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-9 w-3/4 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-16 w-full animate-pulse rounded bg-white/[0.05]" />
                </div>
              </div>
            </div>
          ) : officersError ? (
            <div
              className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-10 text-center"
              role="alert"
            >
              <h3 className="text-lg font-bold text-white">
                Unable to load the leadership team
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                We could not retrieve the current officer roster.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
              >
                Try Again
              </button>
            </div>
          ) : current ? (
            <div
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl md:p-10"
              aria-roledescription="carousel"
              aria-label="CITEMAS executive leadership"
            >
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                {/* Portrait */}
                <div className="group relative h-72 overflow-hidden rounded-2xl border border-white/10 shadow-2xl md:h-80">
                  {current.image ? (
                    <img
                      src={current.image}
                      alt={`${current.name}, ${current.role}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // Hide the broken image and show initials instead
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('[data-initials]')) {
                          const el = document.createElement('div');
                          el.setAttribute('data-initials', 'true');
                          el.className =
                            'flex h-full w-full items-center justify-center bg-gradient-to-br from-red-700 to-red-900 text-[#F8F2EC] font-black text-5xl md:text-6xl select-none';
                          el.textContent = getInitials(current.name);
                          parent.insertBefore(el, parent.firstChild);
                        }
                      }}
                    />
                  ) : (
                    <InitialsAvatar name={current.name} className="h-full w-full" />
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070305] via-transparent to-transparent opacity-80" />

                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="rounded-lg bg-red-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                      {current.role}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center space-y-6">
                  <div key={current.id} aria-live="polite" aria-atomic="true">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                      Featured Officer
                    </span>
                    <h3 className="mt-1 text-3xl font-extrabold text-white">
                      {current.name}
                    </h3>
                    <p className="mt-3 text-sm font-light leading-relaxed text-slate-400">
                      {current.bio}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Previous officer"
                    >
                      &larr;
                    </button>

                    <div className="flex flex-1 items-center justify-center gap-2">
                      {officers.map((officer, idx) => (
                        <button
                          key={officer.id}
                          type="button"
                          onClick={() => setActiveIdx(idx)}
                          className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#070305] ${
                            activeIdx === idx
                              ? 'w-8 bg-red-500 shadow-sm shadow-red-500'
                              : 'w-2 bg-white/10 hover:bg-white/20'
                          }`}
                          aria-label={`Show ${officer.name}, ${officer.role}`}
                          aria-current={activeIdx === idx ? 'true' : undefined}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={goNext}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Next officer"
                    >
                      &rarr;
                    </button>
                  </div>

                  <div className="text-center text-[11px] text-slate-500">
                    {activeIdx + 1} of {officers.length}
                    {isPaused ? ' · Paused' : ''}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-slate-300">
              <h3 className="font-semibold text-white">
                No officers are currently listed
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                The leadership roster is being updated. Check back soon.
              </p>
            </div>
          )}
        </section>

        {/* ───────── STATS ───────── */}
        <section className="mx-auto mb-20 max-w-5xl px-6 py-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center backdrop-blur-md"
              >
                <div className="mb-1 bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-3xl font-black text-transparent md:text-4xl">
                  {stat.value}
                </div>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white">
                  {stat.label}
                </div>
                <div className="text-[11px] font-light text-slate-500">
                  {stat.detail}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}