'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

type OfficerRecord = {
  _id: string;
  firstName?: string;
  lastName?: string;
  officerPosition?: string | null;
  displayPosition?: string;
  avatar?: string | null;
};

// Generate inline SVG data URI avatar with initials (avoids third-party external tracking & service dependency)
function getInitialsAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = (parts[0]?.[0] || 'C') + (parts[parts.length - 1]?.[0] || 'M');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#7f1d1d"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#fdfbf7" font-family="sans-serif" font-size="200" font-weight="bold">${initials.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = Boolean(user);
  const [activeIdx, setActiveIdx] = useState(0);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [officersError, setOfficersError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  const formatPosition = (position: string | null | undefined, displayPos?: string) => {
    if (displayPos) return displayPos;
    if (!position) return 'Officer';
    if (position.toLowerCase() === 'pro') return 'PRO';
    if (position.toLowerCase() === 'pio') return 'PIO';
    return position
      .split('_')
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const stats = [
    { label: 'Active Members', value: '50+', detail: 'Creative and tech-driven community' },
    { label: 'Events Hosted', value: '10+', detail: 'Workshops, showcases, and campus programs' },
    { label: 'Projects Completed', value: '50+', detail: 'Brand, website, and multimedia builds' },
    { label: 'Years Active', value: '5+', detail: 'A growing creative legacy in the school' },
  ];

  // Fetch officers with AbortController and explicit error handling
  useEffect(() => {
    const controller = new AbortController();
    setOfficersLoading(true);
    setOfficersError(null);

    fetch('/api/officers', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load roster (Status: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setOfficers(Array.isArray(data.officers) ? data.officers : []);
        setOfficersLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Officers fetch error:', err);
        setOfficersError(err.message || 'Unable to connect to officer roster');
        setOfficers([]);
        setOfficersLoading(false);
      });

    return () => controller.abort();
  }, []);

  const featuredOfficers = officers
    .filter((person) => person && person.officerPosition)
    .map((person) => {
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'CITEMAS Officer';
      return {
        id: person._id,
        name,
        role: formatPosition(person.officerPosition, person.displayPosition),
        image: person.avatar || getInitialsAvatar(name),
        fallbackImage: getInitialsAvatar(name),
      };
    });

  // Clamp activeIdx whenever array length changes to avoid out-of-bounds state
  useEffect(() => {
    setActiveIdx((currentIndex) =>
      featuredOfficers.length === 0 ? 0 : Math.min(currentIndex, featuredOfficers.length - 1)
    );
  }, [featuredOfficers.length]);

  // Accessibility & reduced motion check + auto-rotate carousel timer
  useEffect(() => {
    if (!featuredOfficers.length || isPaused) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      if (document.hidden) return; // Pause when browser tab is inactive
      setActiveIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [featuredOfficers.length, isPaused]);

  const current = featuredOfficers[activeIdx] || null;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FDFBF7]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#070305] text-slate-100 selection:bg-red-500 selection:text-white overflow-hidden relative">
      {/* Immersive Background Glows & Studio Lighting */}
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-red-600/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] pointer-events-none" />

      <div className="relative z-10 flex-1">
        {/* Hero Section with Student Welcome & Account Creation Prompt */}
        <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-8 backdrop-blur-md shadow-inner animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
            <span>Welcome, CITE & Multimedia Arts Studio </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight text-white">
            Shape the Future of <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
              Digital Creation Together
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Your central creative hub for student collaboration, tech-driven design projects, portfolios, and organization events.
          </p>

          {/* Dynamic Action Buttons for Students */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold transition-all duration-300 shadow-lg shadow-red-600/30 flex items-center justify-center space-x-3 group cursor-pointer"
              >
                <span>Open Your Dashboard</span>
                <span className="transform transition-transform group-hover:translate-x-1">&rarr;</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold transition-all duration-300 shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Create Student Account</span>
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] text-slate-200 hover:text-white font-semibold transition-all duration-300 shadow-sm hover:border-white/20 cursor-pointer"
                >
                  Already have an account? Sign In
                </button>
              </>
            )}
          </div>
        </section>

        {/* Featured Officers Showcase Carousel */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Leadership Team</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white">Executive Leadership</h2>
            <p className="text-slate-400 text-xs mt-1">Meet the current officers leading the CITEMAS community.</p>
          </div>

          {officersLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-red-500" />
              <span className="text-xs">Loading leadership roster...</span>
            </div>
          ) : officersError ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center text-slate-300">
              <p className="text-xs text-red-400 font-medium">{officersError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
              >
                Retry Loading Roster
              </button>
            </div>
          ) : current ? (
            <div
              ref={carouselRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="relative rounded-3xl bg-white/[0.02] border border-white/10 p-6 md:p-10 backdrop-blur-xl overflow-hidden shadow-2xl group/carousel"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
                  <img
                    src={current.image}
                    alt={current.name}
                    onError={(e) => {
                      // Gracefully fallback to SVG initials on image error
                      (e.target as HTMLImageElement).src = current.fallbackImage;
                    }}
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070305] via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 rounded-lg bg-red-600/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
                      {current.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Featured Officer</span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">{current.name}</h3>
                    <p className="text-slate-400 mt-3 text-sm font-light leading-relaxed">
                      Leading strategic development, fostering creative exploration, and empowering student creators across campus.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Navigation Buttons for Manual Control */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setActiveIdx((prev) => (prev === 0 ? featuredOfficers.length - 1 : prev - 1))
                        }
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        aria-label="Previous officer"
                      >
                        &#8592;
                      </button>
                      <button
                        onClick={() => setActiveIdx((prev) => (prev + 1) % featuredOfficers.length)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        aria-label="Next officer"
                      >
                        &#8594;
                      </button>
                    </div>

                    {/* Indicator Dots */}
                    <div className="flex items-center space-x-2">
                      {featuredOfficers.map((person, idx) => (
                        <button
                          key={person.id || idx}
                          onClick={() => setActiveIdx(idx)}
                          aria-current={activeIdx === idx ? 'true' : undefined}
                          className={`h-2 transition-all rounded-full cursor-pointer ${
                            activeIdx === idx
                              ? 'w-8 bg-red-500 shadow-sm shadow-red-500'
                              : 'w-2 bg-white/10 hover:bg-white/20'
                          }`}
                          aria-label={`Go to slide ${idx + 1}: ${person.name}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-slate-300">
              The leadership roster is being updated. Check back soon for the current officers.
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className="max-w-5xl mx-auto px-6 py-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center backdrop-blur-md">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent mb-1">{stat.value}</div>
                <div className="text-white font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-slate-500 text-[11px] font-light">{stat.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}