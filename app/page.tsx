'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

type OfficerRecord = {
  _id: string;
  firstName?: string;
  lastName?: string;
  officerPosition?: string | null;
  displayPosition?: string;
  avatar?: string | null;
  department?: string;
  yearLevel?: string;
  bio?: string;
};

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
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);
  const router = useRouter();

  const stackContainerRef = useRef<HTMLDivElement | null>(null);

  // Mouse Parallax for 3D Centerpiece
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setMouseOffset({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Officers State
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [activeOfficerIdx, setActiveOfficerIdx] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Stack Card Transform Progress [card0, card1, card2, card3]
  const [cardProgress, setCardProgress] = useState<number[]>([0, 0, 0, 0]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Fetch Officers
  useEffect(() => {
    const controller = new AbortController();
    setOfficersLoading(true);

    fetch('/api/officers', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setOfficers(Array.isArray(data.officers) ? data.officers : []);
        setOfficersLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setOfficers([]);
        setOfficersLoading(false);
      });

    return () => controller.abort();
  }, []);

  const formatPosition = (position: string | null | undefined, displayPos?: string) => {
    if (displayPos) return displayPos;
    if (!position) return 'Officer';
    if (position.toLowerCase() === 'pro') return 'PRO';
    if (position.toLowerCase() === 'pio') return 'PIO';
    return position
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

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
        department: person.department || 'College of Information Technology Education (CITE)',
        yearLevel: person.yearLevel || 'Student Executive',
        bio: person.bio || 'Leading strategic creative development and empowering student creators across campus.',
      };
    });

  // Auto-rotate leadership carousel
  useEffect(() => {
    if (!featuredOfficers.length || isCarouselPaused) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [featuredOfficers.length, isCarouselPaused]);

  const currentOfficer = featuredOfficers[activeOfficerIdx] || null;

  // --- Scroll Tracking for Sticky Stack ---
  useEffect(() => {
    const onScroll = () => {
      const container = stackContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      // Overall progress through the 4 cards (0.0 to 3.0)
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(3, (scrolled / totalScrollable) * 3));

      // Calculate receding progress for each individual card
      const p0 = Math.max(0, Math.min(1, progress - 0));
      const p1 = Math.max(0, Math.min(1, progress - 1));
      const p2 = Math.max(0, Math.min(1, progress - 2));
      const p3 = 0; // Final card doesn't recede

      setCardProgress([p0, p1, p2, p3]);
      setActiveCardIndex(Math.min(3, Math.floor(progress)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative bg-[#070305] text-[#FDFBF7] overflow-x-hidden">
      {/* ── CSS Animations for Starfield & 3D Centerpiece ── */}
      <style jsx global>{`
        @keyframes driftStars {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-26px) scale(1.02);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes driftStarsSlow {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-14px) scale(1.01);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.45;
            transform: translate(0, 0) scale(1);
          }
          50% {
            opacity: 0.78;
            transform: translate(0, 0) scale(1.18);
          }
        }

        @keyframes floatModel {
          0%, 100% {
            transform: translateY(-10px) rotate(0deg);
          }
          50% {
            transform: translateY(10px) rotate(1.8deg);
          }
        }

        .starfield-layer-1 {
          background-image:
            radial-gradient(1.5px 1.5px at 30px 40px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 80px 130px, rgba(255,255,255,0.7), rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 150px 70px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 230px 190px, #ffb3b8, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 310px 340px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 400px 150px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 490px 290px, #ffdcdc, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 580px 90px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 680px 250px, rgba(255,255,255,0.6), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 780px 390px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 890px 180px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 550px 550px;
          animation: driftStars 16s ease-in-out infinite alternate;
        }

        .starfield-layer-2 {
          background-image:
            radial-gradient(1px 1px at 50px 95px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 140px 240px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 250px 105px, rgba(255,255,255,0.7), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 380px 350px, #ffcfd2, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 510px 180px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 630px 430px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 760px 120px, rgba(255,255,255,0.6), rgba(0,0,0,0)),
            radial-gradient(2px 2px at 870px 300px, #ffffff, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 700px 700px;
          animation: driftStarsSlow 24s ease-in-out infinite alternate-reverse;
        }

        .animate-float-model {
          animation: floatModel 6s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>

      {/* Global Cinematic Starry Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 starfield-layer-1 opacity-70" />
        <div className="absolute inset-0 starfield-layer-2 opacity-45" />
      </div>

      {/* Progress Story Indicators */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-1 transition-all duration-300 rounded-full ${
              activeCardIndex === idx
                ? 'h-8 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                : 'h-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          STICKY STACK WRAPPER (400vh total height for 4 cards)
          ═══════════════════════════════════════════════════ */}
      <div ref={stackContainerRef} className="relative z-10 h-[400vh]">
        
        {/* ── CARD 1: CITEMAS STUDIO & VISION (BLEED EDGE-TO-EDGE) ── */}
        <section
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="sticky top-0 h-screen w-full flex items-center px-6 sm:px-12 md:px-16 lg:px-24 overflow-hidden"
          style={{
            transform: `scale(${1 - cardProgress[0] * 0.08})`,
            filter: `brightness(${1 - cardProgress[0] * 0.45})`,
            transition: 'transform 0.1s ease-out, filter 0.1s ease-out',
          }}
        >
          {/* Ambient Starfield & Glowing Blob Behind 3D Model (z-0) */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Cinematic Ruby-Crimson Glowing Blob Behind Model */}
            <div
              className="absolute right-[5%] lg:right-[12%] top-1/2 -translate-y-1/2 w-[380px] sm:w-[520px] lg:w-[680px] h-[380px] sm:h-[520px] lg:h-[680px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.45) 0%, rgba(139, 0, 0, 0.22) 40%, rgba(7, 3, 5, 0) 70%)',
                filter: 'blur(80px)',
                animation: 'pulseGlow 8s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* 3D Official CITEMAS Logo Centerpiece (z-10) */}
          <div
            className="absolute right-[-10%] sm:right-[-5%] top-0 h-full w-full sm:w-[75vw] md:w-[65vw] lg:w-[60vw] min-w-[500px] md:min-w-[620px] lg:min-w-[700px] flex items-center justify-center pointer-events-auto z-10"
            style={{
              transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 12}px, 0)`,
              transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center animate-float-model">
              <iframe
                src="/citemas-logo-3d.html?embed"
                title="CITEMAS 3D Logo"
                className="w-full h-full border-0 pointer-events-auto"
                style={{ background: 'transparent' }}
                allow="autoplay"
              />
            </div>
          </div>

          {/* Hero Typography & CTAs (z-20) */}
          <div className="relative z-20 w-full max-w-2xl lg:max-w-3xl space-y-8 pointer-events-auto">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-mono tracking-widest text-slate-300 uppercase">
                PHINMA University of Iloilo
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-[-0.04em] leading-[0.88] text-white drop-shadow-2xl">
                CITEMAS<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-white">
                  STUDIO.
                </span>
              </h1>
              <p className="font-sans text-base sm:text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed font-light">
                Where vision meets execution. The premier creative and multimedia guild uniting digital visionaries, 3D sculptors, and traditional artisans.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-xl shadow-red-600/35 transition-all cursor-pointer"
                >
                  Enter Studio Dashboard &rarr;
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-xl shadow-red-600/35 transition-all cursor-pointer"
                  >
                    Join Guild
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 rounded-full border border-white/20 bg-white/5 text-white font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Member Sign In
                  </Link>
                </>
              )}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pl-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span>10°42&apos;N 122°34&apos;E</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CARD 2: CRAFT & DISCIPLINES (EDITORIAL ROSTER) ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-transform duration-75 border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b]/95"
            style={{
              transform: `scale(${1 - cardProgress[1] * 0.08})`,
              filter: `brightness(${1 - cardProgress[1] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 02 [SPECIALIZATIONS]</span>
              <span>SIX CREATIVE TRACKS</span>
            </div>

            {/* Section Intro */}
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                Disciplines of Excellence
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[-0.03em] leading-none text-white">
                Craft &amp; Discipline.
              </h2>
            </div>

            {/* Huge Full-Width Editorial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 my-auto">
              {[
                { num: '01', name: 'Digital Arts', subtitle: 'Concept Art, UI/UX & Vector Design' },
                { num: '02', name: '3D Animation', subtitle: 'Modeling, Rigging & Spatial CGI' },
                { num: '03', name: 'Videography', subtitle: 'Cinematography, Directing & Editing' },
                { num: '04', name: 'Photography', subtitle: 'Studio Lighting, Portraiture & Color' },
                { num: '05', name: 'Voice Acting', subtitle: 'Audio Drama, Dubbing & Sound Design' },
                { num: '06', name: 'Traditional Arts', subtitle: 'Illustration, Painting & Sculpture' },
              ].map((track) => (
                <div
                  key={track.num}
                  className="border-b border-white/10 py-5 sm:py-6 flex items-baseline justify-between group cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:pl-3"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-lg sm:text-xl font-bold text-red-500/80 group-hover:text-red-400 transition-colors">
                      {track.num}
                    </span>
                    <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
                      {track.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider hidden sm:inline group-hover:text-slate-200 transition-colors">
                    {track.subtitle}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-white/[0.06]">
              <span>DISCIPLINES SYNCHRONIZED</span>
              <span>PHINMA CITE GUILD</span>
            </div>
          </div>
        </section>

        {/* ── CARD 3: MOLTEN ENERGY & INSTRUMENTS ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-transform duration-75 border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b]/95"
            style={{
              transform: `scale(${1 - cardProgress[2] * 0.08})`,
              filter: `brightness(${1 - cardProgress[2] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 03 [TELEMETRY]</span>
              <span>CAMPUS IMPACT METRICS</span>
            </div>

            {/* Grid Content */}
            <div className="my-auto space-y-8">
              <div className="max-w-2xl space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Impact &amp; Production
                </span>
                <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.9] text-white">
                  Molten Energy.
                </h2>
                <p className="font-sans text-sm md:text-base text-slate-300 leading-relaxed font-light">
                  Dynamic student exhibitions, hands-on production sprints, and cross-departmental creative summits shaping the creative identity of PHINMA University of Iloilo.
                </p>
              </div>

              {/* Instrument Panel Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: '50+', label: 'Active Creators', desc: 'Tech & digital visionaries' },
                  { value: '10+', label: 'Guild Exhibits', desc: 'Showcases and sprints' },
                  { value: '50+', label: 'Projects Built', desc: 'Brand and digital media' },
                  { value: '05+', label: 'Years Legacy', desc: 'Continuous student innovation' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-red-500/40 transition-all space-y-2 relative"
                  >
                    <div className="font-display text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                      {stat.value}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white">
                      {stat.label}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {stat.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-white/[0.06]">
              <span>TELEMETRY VERIFIED</span>
              <span>METRICS REALTIME</span>
            </div>
          </div>
        </section>

        {/* ── CARD 4: EXECUTIVE LEADERSHIP & HUB ── */}
        <section className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden border border-white/[0.08] backdrop-blur-2xl bg-[#090a0b]">
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              <span>GUILD // 04 [LEADERSHIP]</span>
              <span>EXECUTIVE COUNCIL</span>
            </div>

            {/* Leadership Showcase */}
            <div className="my-auto space-y-8">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Executive Roster
                </span>
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[-0.03em] leading-none text-white">
                  Leadership.
                </h2>
              </div>

              {/* Dynamic Officer Spotlight: Full-Bleed Floating Layout (No Boxy Card) */}
              {officersLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 mx-auto mb-2" />
                  Loading Council Directory...
                </div>
              ) : currentOfficer ? (
                <div
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 py-2"
                >
                  {/* Officer Portrait: Clean edge border */}
                  <div className="relative h-64 w-52 sm:h-72 sm:w-60 md:h-80 md:w-64 rounded-2xl overflow-hidden shrink-0 border border-white/20">
                    <img
                      src={currentOfficer.image}
                      alt={currentOfficer.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = currentOfficer.fallbackImage;
                      }}
                      className="w-full h-full object-cover filter contrast-105"
                    />
                  </div>

                  {/* Floating Details */}
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-[11px] font-bold uppercase tracking-wider">
                        {currentOfficer.role}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {currentOfficer.yearLevel}
                      </span>
                    </div>

                    {/* Massive 48px+ Oswald Font for Officer Name */}
                    <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight">
                      {currentOfficer.name}
                    </h3>

                    <p className="font-sans text-sm sm:text-base text-slate-300 line-clamp-3 max-w-2xl leading-relaxed font-light">
                      {currentOfficer.bio}
                    </p>

                    {/* Nav Arrows */}
                    <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                      <button
                        onClick={() =>
                          setActiveOfficerIdx((prev) =>
                            prev === 0 ? featuredOfficers.length - 1 : prev - 1
                          )
                        }
                        className="p-3 rounded-full border border-white/20 hover:border-red-500/60 hover:bg-white/5 text-slate-200 transition cursor-pointer"
                        aria-label="Previous officer"
                      >
                        &larr;
                      </button>
                      <button
                        onClick={() =>
                          setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length)
                        }
                        className="p-3 rounded-full border border-white/20 hover:border-red-500/60 hover:bg-white/5 text-slate-200 transition cursor-pointer"
                        aria-label="Next officer"
                      >
                        &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Council Avatars Tray */}
              {featuredOfficers.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-2">
                    COUNCIL:
                  </span>
                  {featuredOfficers.map((person, idx) => (
                    <button
                      key={person.id}
                      onClick={() => setActiveOfficerIdx(idx)}
                      className={`relative h-11 w-11 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                        activeOfficerIdx === idx
                          ? 'border-red-500 scale-105 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                      title={person.name}
                    >
                      <img
                        src={person.image}
                        alt={person.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = person.fallbackImage;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Navigation CTAs (No "END OF STACK" text) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/portfolio"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  View Guild Portfolios &rarr;
                </Link>
                <Link
                  href="/events"
                  className="px-6 py-3 rounded-full border border-white/20 bg-white/5 text-slate-200 font-semibold text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                >
                  Upcoming Events
                </Link>
              </div>
              <div className="text-xs font-mono text-slate-500">
                STUDENT EXECUTIVE COUNCIL
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
