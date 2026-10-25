'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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

  // Mouse Parallax for 3D Centerpiece & Floating Assets
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // 3D Model Loading State with Smooth Scene Transition
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    // Safety fallback: ensure model is revealed even if iframe onload event is delayed
    const timer = setTimeout(() => setIsModelLoaded(true), 3500);
    return () => clearTimeout(timer);
  }, []);

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

  const scrollToCard = (index: number) => {
    const container = stackContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top;
    const totalScrollable = rect.height - window.innerHeight;
    const targetScroll = scrollTop + (index / 3) * totalScrollable;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <div className="relative bg-[var(--background)] text-[var(--foreground)] overflow-x-clip -mt-16 transition-colors duration-300">
      {/* ── CSS Animations for Starfield, Marquee & 3D Centerpiece ── */}
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

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          display: inline-flex;
          animation: marquee 25s linear infinite;
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

      {/* ── Global Dynamic Background: Starry Hero transitioning into Technical Grid ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Starfield Layer (Prominent at hero in dark mode, smoothly fades as user scrolls into stack) */}
        <div
          className="absolute inset-0 transition-opacity duration-300 hidden dark:block"
          style={{ opacity: Math.max(0, 1 - cardProgress[0] * 1.5) }}
        >
          <div className="absolute inset-0 starfield-layer-1 opacity-70" />
          <div className="absolute inset-0 starfield-layer-2 opacity-45" />
        </div>

        {/* Technical Blueprint Grid (Always subtly visible in light mode; fades in past hero in dark mode) */}
        <div
          className="absolute inset-0 transition-opacity duration-300 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"
          style={{ opacity: Math.max(0.35, Math.min(1, cardProgress[0] * 1.5)) }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          STICKY STACK WRAPPER (400vh total height for 4 cards)
          ═══════════════════════════════════════════════════ */}
      <div ref={stackContainerRef} className="relative z-10 h-[400vh]">
        
        {/* ── CARD 1: CITEMAS STUDIO & HERO (ART CRAFT STYLE) ── */}
        <section
          id="hero"
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="sticky top-0 min-h-screen h-screen w-full flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-24 pt-16 pb-14 overflow-hidden relative"
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
              className="absolute right-[5%] lg:right-[15%] top-1/2 -translate-y-1/2 w-[420px] sm:w-[560px] lg:w-[720px] h-[420px] sm:h-[560px] lg:h-[720px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.45) 0%, rgba(139, 0, 0, 0.22) 40%, rgba(7, 3, 5, 0) 70%)',
                filter: 'blur(90px)',
                animation: 'pulseGlow 8s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* Sweeping Neon Curved SVG Paths (Orbital Rings in Cyan, Purple, Green) (z-5) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[5] overflow-visible"
            viewBox="0 0 1440 900"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="orbitCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#02d2e3" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="orbitPurple" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="55%" stopColor="#ec4899" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="orbitGreen" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur1" />
                <feGaussianBlur stdDeviation="2" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Neon Cyan Orbital Arc */}
            <path
              d="M-120,680 C180,820 620,720 880,440 C1140,160 1380,220 1620,80"
              stroke="url(#orbitCyan)"
              strokeWidth="2.5"
              filter="url(#neonGlow)"
            />

            {/* Neon Purple Dashed Arc */}
            <path
              d="M120,-80 C320,180 520,440 840,480 C1180,520 1420,380 1620,600"
              stroke="url(#orbitPurple)"
              strokeWidth="2"
              strokeDasharray="10 8"
              filter="url(#neonGlow)"
            />

            {/* Neon Green Lower Arc */}
            <path
              d="M240,920 C420,620 720,540 1080,600 C1320,640 1480,780 1680,880"
              stroke="url(#orbitGreen)"
              strokeWidth="1.8"
              filter="url(#neonGlow)"
            />
          </svg>

          {/* Floating Assets Arranged Strictly on Right Side (z-10, Clean Images without Text Labels) */}
          <div className="absolute inset-0 pointer-events-none z-10 hidden sm:block overflow-hidden">
            {/* Floating Asset A: Top Right Orbit */}
            <div
              className="absolute right-[4%] lg:right-[8%] top-[12%] rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-300 pointer-events-auto cursor-pointer"
              style={{
                transform: `translate3d(${mouseOffset.x * 24}px, ${mouseOffset.y * 18}px, 0) rotate(6deg)`,
              }}
            >
              <div className="p-1 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-2xl">
                <div className="w-36 lg:w-44 h-24 lg:h-28 rounded-xl overflow-hidden">
                  <img src="/orgpic.jpg" alt="Org Sprint" className="w-full h-full object-cover filter contrast-110" />
                </div>
              </div>
            </div>

            {/* Floating Asset B: Lower Right Orbit */}
            <div
              className="absolute right-[2%] lg:right-[5%] bottom-[20%] -rotate-12 hover:rotate-0 hover:scale-110 transition-all duration-300 pointer-events-auto cursor-pointer"
              style={{
                transform: `translate3d(${mouseOffset.x * -18}px, ${mouseOffset.y * -14}px, 0) rotate(-12deg)`,
              }}
            >
              <div className="p-1 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-2xl">
                <div className="w-40 lg:w-48 h-28 lg:h-32 rounded-xl overflow-hidden">
                  <img src="/orgpic2.jpg" alt="Exhibition Gallery" className="w-full h-full object-cover filter contrast-110" />
                </div>
              </div>
            </div>

            {/* Floating Asset C: Upper-Right Accent Orbit (Strictly right of center) */}
            <div
              className="absolute right-[22%] lg:right-[26%] top-[8%] rotate-3 hover:rotate-0 hover:scale-110 transition-all duration-300 pointer-events-auto cursor-pointer hidden md:block"
              style={{
                transform: `translate3d(${mouseOffset.x * 12}px, ${mouseOffset.y * 22}px, 0) rotate(3deg)`,
              }}
            >
              <div className="p-1 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-md shadow-2xl">
                <div className="w-32 lg:w-36 h-20 lg:h-24 rounded-xl overflow-hidden">
                  <img src="/orgpic3.jpg" alt="Media Studio" className="w-full h-full object-cover filter contrast-110" />
                </div>
              </div>
            </div>
          </div>

          {/* 3D Official CITEMAS Logo Centerpiece (z-10) with Suspense & Sleek Loading State */}
          <div
            className="absolute right-[-10%] sm:right-[-5%] top-0 h-full w-full sm:w-[75vw] md:w-[65vw] lg:w-[60vw] min-w-[500px] md:min-w-[620px] lg:min-w-[700px] flex items-center justify-center pointer-events-auto z-10"
            style={{
              transform: `translate3d(${mouseOffset.x * 16}px, ${mouseOffset.y * 12}px, 0)`,
              transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-red-500/40 animate-ping absolute" />
                    <div className="w-12 h-12 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#dc2626]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono text-[10px] tracking-[0.25em] text-red-500 font-extrabold uppercase drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                      LOADING STUDIO...
                    </span>
                  </div>
                </div>
              }
            >
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Sleek Custom Loading Indicator (Transitions Out Smoothly) */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-700 ease-out z-20 pointer-events-none ${
                    isModelLoaded ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-red-500/40 animate-ping absolute" />
                    <div className="w-12 h-12 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#dc2626]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono text-[10px] tracking-[0.25em] text-red-500 font-extrabold uppercase drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                      LOADING STUDIO...
                    </span>
                  </div>
                </div>

                {/* 3D Model with Smooth Scene Fade-In */}
                <div
                  className={`w-full h-full flex items-center justify-center animate-float-model transition-opacity duration-700 ease-out ${
                    isModelLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <iframe
                    src="/citemas-logo-3d.html?embed"
                    title="CITEMAS 3D Logo"
                    className="w-full h-full border-0 pointer-events-auto"
                    style={{ background: 'transparent' }}
                    allow="autoplay"
                    onLoad={() => setIsModelLoaded(true)}
                  />
                </div>
              </div>
            </Suspense>
          </div>

          {/* Hero Typography & CTAs (z-20) - Shifted Upwards with Clean Spacing */}
          <div className="relative z-20 mt-1 mb-auto w-full max-w-2xl lg:max-w-3xl space-y-4 pointer-events-auto">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-mono tracking-widest text-slate-700 dark:text-slate-300 uppercase">
                PHINMA University of Iloilo • EST. 2014
              </span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black uppercase tracking-tighter leading-[0.88] text-slate-900 dark:text-white drop-shadow-2xl">
                CITEMAS
                <br />
                PUSHING BOUNDARIES OF{' '}
                <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white lowercase tracking-normal">
                  creative media
                </span>
                .
              </h1>
            </div>

            {/* Action Buttons: Positioned directly below headline */}
            <div className="flex flex-row flex-wrap items-center gap-4 mt-6 sm:mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-xl shadow-red-600/30"
              >
                <span>Enter Studio Dashboard</span>
                <ArrowRight size={18} />
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 border border-black/20 bg-black/5 hover:bg-black/10 text-slate-900 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white px-6 py-4 rounded-full font-semibold uppercase tracking-widest transition-colors cursor-pointer text-xs"
                >
                  Join the Org
                </Link>
              )}
            </div>
          </div>

          {/* ── FULL-WIDTH HORIZONTAL MARQUEE TICKER (Edge-to-edge across base of Hero) ── */}
          <div
            className="absolute bottom-0 left-0 w-full z-30 border-t border-black/10 dark:border-white/10 bg-[var(--card-bg)]/95 dark:bg-[#090a0b]/95 backdrop-blur-md py-3 sm:py-3.5 overflow-hidden transition-colors duration-300"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="flex whitespace-nowrap min-w-full animate-marquee font-mono text-[11px] sm:text-[12px] font-bold tracking-[0.28em] uppercase text-slate-800 dark:text-white/80">
              <span className="mx-6 flex items-center gap-4">
                DIGITAL ARTS <span className="text-red-500">•</span> 3D ANIMATION <span className="text-orange-400">•</span> VIDEOGRAPHY <span className="text-red-500">•</span> PHOTOGRAPHY <span className="text-orange-400">•</span> VOICE ACTING <span className="text-red-500">•</span> TRADITIONAL ARTS <span className="text-red-500">•</span> CREATIVE CODING <span className="text-orange-400">•</span> SOUND DESIGN <span className="text-red-500">•</span>
              </span>
              <span className="mx-6 flex items-center gap-4">
                DIGITAL ARTS <span className="text-red-500">•</span> 3D ANIMATION <span className="text-orange-400">•</span> VIDEOGRAPHY <span className="text-red-500">•</span> PHOTOGRAPHY <span className="text-orange-400">•</span> VOICE ACTING <span className="text-red-500">•</span> TRADITIONAL ARTS <span className="text-red-500">•</span> CREATIVE CODING <span className="text-orange-400">•</span> SOUND DESIGN <span className="text-red-500">•</span>
              </span>
            </div>
          </div>
        </section>

        {/* ── SECTION CUT: HERO TO TRACKS ── */}
        <div className="w-full border-t border-black/10 dark:border-white/10 relative z-20" />

        {/* ── CARD 2: CRAFT & DISCIPLINES (EDITORIAL ROSTER) ── */}
        <section id="specializations" className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden border-t border-black/10 dark:border-white/10">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-all duration-75 border border-black/10 dark:border-white/[0.08] backdrop-blur-2xl bg-[var(--card-bg)]/95 dark:bg-[#090a0b]/95 shadow-xl dark:shadow-none"
            style={{
              transform: `scale(${1 - cardProgress[1] * 0.08})`,
              filter: `brightness(${1 - cardProgress[1] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              <span>ORG // 02 [SPECIALIZATIONS]</span>
              <span>SIX CREATIVE TRACKS</span>
            </div>

            {/* Section Intro */}
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                Disciplines of Excellence
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[-0.03em] leading-none text-slate-900 dark:text-white">
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
                  className="border-b border-black/10 dark:border-white/10 py-5 sm:py-6 flex items-baseline justify-between group cursor-pointer transition-all duration-300 hover:border-red-500/60 hover:pl-3"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-lg sm:text-xl font-bold text-red-500/80 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                      {track.num}
                    </span>
                    <span className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {track.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider hidden sm:inline group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    {track.subtitle}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-black/10 dark:border-white/[0.06]">
              <span>DISCIPLINES SYNCHRONIZED</span>
              <span>PHINMA CITE ORG</span>
            </div>
          </div>
        </section>

        {/* ── SECTION CUT: TRACKS TO TELEMETRY ── */}
        <div className="w-full border-t border-black/10 dark:border-white/10 relative z-20" />

        {/* ── CARD 3: MOLTEN ENERGY & INSTRUMENTS ── */}
        <section id="telemetry" className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden border-t border-black/10 dark:border-white/10">
          <div
            className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden transition-all duration-75 border border-black/10 dark:border-white/[0.08] backdrop-blur-2xl bg-[var(--card-bg)]/95 dark:bg-[#090a0b]/95 shadow-xl dark:shadow-none"
            style={{
              transform: `scale(${1 - cardProgress[2] * 0.08})`,
              filter: `brightness(${1 - cardProgress[2] * 0.45})`,
            }}
          >
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              <span>ORG // 03 [TELEMETRY]</span>
              <span>CAMPUS IMPACT METRICS</span>
            </div>

            {/* Content Header */}
            <div className="max-w-2xl space-y-3 pt-2">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                Impact &amp; Production
              </span>
              <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.9] text-slate-900 dark:text-white">
                Molten Energy.
              </h2>
              <p className="font-sans text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                Dynamic student exhibitions, hands-on production sprints, and cross-departmental creative summits shaping the creative identity of PHINMA University of Iloilo.
              </p>
            </div>

            {/* Architectural Full-Bleed Telemetry Panel (No Generic Boxy Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-black/10 dark:border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-black/10 dark:divide-white/10 py-6 my-auto">
              {[
                { value: '50+', label: 'Active Creators', desc: 'Tech & digital visionaries', code: 'CH // 01', status: 'ACTIVE' },
                { value: '10+', label: 'Org Exhibits', desc: 'Showcases and sprints', code: 'CH // 02', status: 'SYNCHRONIZED' },
                { value: '50+', label: 'Projects Built', desc: 'Brand and digital media', code: 'CH // 03', status: 'DEPLOYED' },
                { value: '05+', label: 'Years Legacy', desc: 'Continuous student innovation', code: 'CH // 04', status: 'ESTABLISHED' },
              ].map((stat, i) => (
                <div key={i} className="px-6 py-6 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors relative">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest pb-3">
                    <span>{stat.code}</span>
                    <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                      {stat.status}
                    </span>
                  </div>
                  <div className="font-display text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white group-hover:scale-105 transition-transform duration-300 origin-left">
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-2">
                    {stat.label}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
                    {stat.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-black/10 dark:border-white/[0.06]">
              <span>TELEMETRY VERIFIED</span>
              <span>METRICS REALTIME</span>
            </div>
          </div>
        </section>

        {/* ── SECTION CUT: TELEMETRY TO LEADERSHIP ── */}
        <div className="w-full border-t border-black/10 dark:border-white/10 relative z-20" />

        {/* ── CARD 4: EXECUTIVE LEADERSHIP & HUB (50/50 EDITORIAL SPLIT) ── */}
        <section id="leadership" className="sticky top-0 h-screen w-full flex items-center justify-center p-6 md:p-12 overflow-hidden border-t border-black/10 dark:border-white/10">
          <div className="w-full max-w-7xl h-[86vh] rounded-3xl p-8 md:p-14 relative flex flex-col justify-between overflow-hidden border border-black/10 dark:border-white/[0.08] backdrop-blur-2xl bg-[var(--card-bg)] dark:bg-[#090a0b] shadow-xl dark:shadow-none">
            {/* Header Telemetry */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              <span>ORG // 04 [LEADERSHIP]</span>
              <span>EXECUTIVE COUNCIL</span>
            </div>

            {/* Leadership Showcase */}
            <div className="my-auto space-y-6">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-red-500">
                  Executive Roster
                </span>
                <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[-0.03em] leading-none text-slate-900 dark:text-white">
                  Leadership.
                </h2>
              </div>

              {/* Dynamic Officer Spotlight: 50/50 True Editorial Split (No Boxy Sub-Card) */}
              {officersLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 mx-auto mb-2" />
                  Loading Council Directory...
                </div>
              ) : currentOfficer ? (
                <div
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-2"
                >
                  {/* Left: 5 Cols - Tall Stylish Portrait */}
                  <div className="lg:col-span-5 flex justify-center lg:justify-start">
                    <div className="relative h-72 sm:h-80 md:h-[380px] w-60 sm:w-72 md:w-full max-w-sm rounded-3xl overflow-hidden border border-black/15 dark:border-white/20 shadow-2xl group">
                      <img
                        src={currentOfficer.image}
                        alt={currentOfficer.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = currentOfficer.fallbackImage;
                        }}
                        className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-300">
                          ID: {currentOfficer.id ? String(currentOfficer.id).slice(-6).toUpperCase() : 'LEAD-01'}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      </div>
                    </div>
                  </div>

                  {/* Right: 7 Cols - Massive Bold Typography & Details */}
                  <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <span className="px-3.5 py-1.5 rounded-full bg-red-600/10 dark:bg-red-600/20 border border-red-500/40 text-red-600 dark:text-red-300 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        {currentOfficer.role}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                        // {currentOfficer.yearLevel}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-[0.9]">
                        {currentOfficer.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
                        {currentOfficer.department}
                      </p>
                    </div>

                    <p className="font-sans text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-light">
                      {currentOfficer.bio}
                    </p>

                    {/* Navigation Controls: Clean Non-Clipping Prev/Next & Counter */}
                    <div className="flex items-center justify-center lg:justify-start gap-4 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setActiveOfficerIdx((prev) =>
                              prev === 0 ? featuredOfficers.length - 1 : prev - 1
                            )
                          }
                          className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20 hover:border-red-500/60 hover:bg-red-600/10 text-slate-900 dark:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95"
                          aria-label="Previous officer"
                        >
                          &larr;
                        </button>
                        <button
                          onClick={() =>
                            setActiveOfficerIdx((prev) => (prev + 1) % featuredOfficers.length)
                          }
                          className="h-10 w-10 rounded-full border border-black/20 dark:border-white/20 hover:border-red-500/60 hover:bg-red-600/10 text-slate-900 dark:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95"
                          aria-label="Next officer"
                        >
                          &rarr;
                        </button>
                      </div>

                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-widest">
                        <span className="text-slate-900 dark:text-white font-bold">
                          {String(activeOfficerIdx + 1).padStart(2, '0')}
                        </span>{' '}
                        /{' '}
                        <span>{String(featuredOfficers.length).padStart(2, '0')}</span>
                      </div>
                    </div>

                    {/* Council Avatars Tray */}
                    {featuredOfficers.length > 1 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-center lg:justify-start gap-2.5 overflow-x-auto py-1">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-1 shrink-0">
                            COUNCIL:
                          </span>
                          {featuredOfficers.map((person, idx) => (
                            <button
                              key={person.id}
                              onClick={() => setActiveOfficerIdx(idx)}
                              className={`relative h-11 w-11 rounded-xl overflow-hidden border transition-all cursor-pointer shrink-0 ${
                                activeOfficerIdx === idx
                                  ? 'border-red-500 scale-110 shadow-[0_0_16px_rgba(239,68,68,0.6)]'
                                  : 'border-black/20 dark:border-white/20 opacity-50 hover:opacity-100 hover:scale-105'
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
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick Navigation CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/10 dark:border-white/[0.06]">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/portfolio"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  View Org Portfolios &rarr;
                </Link>
                <Link
                  href="/events"
                  className="px-6 py-3 rounded-full border border-black/20 bg-black/5 text-slate-800 hover:bg-black/10 dark:border-white/20 dark:bg-white/5 dark:text-slate-200 font-semibold text-xs uppercase tracking-widest dark:hover:bg-white/10 transition-all cursor-pointer"
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

        {/* ── SECTION CUT: STACK TO FOOTER ── */}
        <div className="w-full border-t border-black/10 dark:border-white/10 relative z-20" />
        <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3 pointer-events-auto">
          <div className="text-[9px] font-mono tracking-widest text-slate-500 uppercase rotate-90 mb-4 origin-center">
            RULER // 04
          </div>

          {[
            { idx: 0, tick: '00', label: 'STUDIO' },
            { idx: 1, tick: '01', label: 'CRAFT' },
            { idx: 2, tick: '02', label: 'TELEMETRY' },
            { idx: 3, tick: '03', label: 'LEADERSHIP' },
          ].map((item) => {
            const isActive = activeCardIndex === item.idx;
            return (
              <button
                key={item.idx}
                onClick={() => scrollToCard(item.idx)}
                className="group relative flex items-center justify-center cursor-pointer transition-all duration-300 py-1"
                title={item.label}
              >
                <span
                  className={`font-mono text-[10px] tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'text-red-500 font-black scale-125'
                      : 'text-slate-500 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  {item.tick}
                </span>
                <span
                  className={`ml-2 h-[2px] transition-all duration-300 ${
                    isActive
                      ? 'w-5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      : 'w-2 bg-black/20 dark:bg-white/20 group-hover:w-3 group-hover:bg-black/40 dark:group-hover:bg-white/40'
                  }`}
                />
                {/* Tooltip on hover */}
                <span className="absolute right-full mr-3 hidden group-hover:block px-2.5 py-1 rounded bg-white dark:bg-[#090a0b] border border-black/20 dark:border-white/20 text-[9px] font-mono tracking-widest uppercase text-slate-900 dark:text-white whitespace-nowrap shadow-xl z-50">
                  {item.tick} // {item.label}
                </span>
              </button>
            );
          })}

          <div className="h-8 w-[1px] bg-gradient-to-b from-black/20 dark:from-white/20 via-red-500/40 to-transparent mt-2" />
          <div className="text-[9px] font-mono text-red-500/80 font-bold">
            {String(Math.round((activeCardIndex / 3) * 100)).padStart(2, '0')}%
          </div>
        </div>

      </div>
    </div>
  );
}
