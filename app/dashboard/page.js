// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// CITEMAS Aesthetic Colors
const CITEMAS_RED = '#DC2626';
const CITEMAS_DARK_RED = '#7F1D1D';
const CITEMAS_CREAM = '#FDFBF7';
const CITEMAS_GOLD = '#F59E0B';
const MUTED = 'rgba(253,251,247,0.75)';

// Floating Spatial Glass Panel
function SpatialGlassPanel({ children, className = '', depth = 'mid' }) {
  const depthStyles = {
    back: 'translate-z-0 shadow-xl',
    mid: 'hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl',
    front: 'hover:-translate-y-3 hover:scale-[1.02] hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.7)]',
  };

  return (
    <div
      className={`relative rounded-[32px] p-7 transition-all duration-500 ease-out transform-gpu ${depthStyles[depth]} ${className}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: `
          0 20px 50px rgba(0, 0, 0, 0.5),
          0 0 40px rgba(220, 38, 38, 0.1),
          inset 0 1px 1px rgba(255, 255, 255, 0.3)
        `,
      }}
    >
      {/* Ambient Spatial Lighting Highlight */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full opacity-30 blur-2xl"
        style={{ background: CITEMAS_RED }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Spatial Glass Pill Button
function SpatialButton({ href, children, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center justify-center px-8 py-4 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        background: isPrimary
          ? `linear-gradient(135deg, ${CITEMAS_RED} 0%, ${CITEMAS_DARK_RED} 100%)`
          : 'rgba(255, 255, 255, 0.08)',
        color: CITEMAS_CREAM,
        backdropFilter: 'blur(16px)',
        border: isPrimary
          ? '1px solid rgba(255, 255, 255, 0.3)'
          : '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: isPrimary
          ? `
            0 12px 30px -5px rgba(220, 38, 38, 0.5),
            inset 0 1px 1px rgba(255, 255, 255, 0.4)
          `
          : `
            0 10px 25px -5px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.2)
          `,
      }}
    >
      <span className="relative z-10 drop-shadow-sm">{children}</span>
    </Link>
  );
}

// Dynamic Animated Showcase Frame (Interactive Carousel)
function InteractiveSpatialShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      badge: 'PREVIOUS EVENT',
      title: 'Digital Art & Web Expo',
      description: 'Archived showcase of student UI concepts, web builds, and digital artwork.',
      icon: '🎨',
      stats: [
        { label: 'ATTENDEES', value: '120+' },
        { label: 'PROJECTS', value: '35+' },
      ],
      tag: 'COMPLETED MAR 2026',
      statusTag: 'PAST HIGHLIGHT',
      gradient: 'radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.45) 0%, rgba(127, 29, 29, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
      glowColor: '#DC2626',
    },
    {
      badge: 'EXECUTIVE BOARD',
      title: 'Student Leadership 2025',
      description: 'Past term officers who led technical masterclasses and peer mentorship at PHINMA UI.',
      icon: '👑',
      stats: [
        { label: 'OFFICERS', value: '12' },
        { label: 'DIVISIONS', value: '4' },
      ],
      tag: 'LEADERSHIP ARCHIVE',
      statusTag: 'OFFICER HIGHLIGHT',
      gradient: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.4) 0%, rgba(180, 83, 9, 0.2) 50%, rgba(10, 4, 4, 0.98) 90%)',
      glowColor: '#F59E0B',
    },
    {
      badge: 'PAST WORKSHOP',
      title: 'Animation & Motion Guild',
      description: 'Previous intensive training session covering 2D/3D motion graphics and VFX fundamentals.',
      icon: '🎬',
      stats: [
        { label: 'SESSIONS', value: '8' },
        { label: 'STUDENTS', value: '65+' },
      ],
      tag: 'HELD FEB 2026',
      statusTag: 'WORKSHOP RECAP',
      gradient: 'radial-gradient(circle at 50% 20%, rgba(153, 27, 27, 0.5) 0%, rgba(88, 28, 28, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
      glowColor: '#991B1B',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[activeSlide];

  return (
    <div
      className="relative w-full h-[460px] rounded-[36px] p-7 transition-all duration-1000 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0"
      style={{
        background: current.gradient,
        backdropFilter: 'blur(36px) saturate(200%)',
        WebkitBackdropFilter: 'blur(36px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: `
          0 30px 70px -10px rgba(0, 0, 0, 0.8),
          0 0 60px ${current.glowColor}25,
          inset 0 1px 2px 0 rgba(255, 255, 255, 0.4)
        `,
      }}
    >
      {/* Ambient Fluid Background Light Orb */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-40 blur-[80px] transition-all duration-1000"
        style={{ background: current.glowColor }}
      />

      {/* Top Floating Glass Badges */}
      <div className="relative z-20 flex items-center justify-between shrink-0 h-9">
        <div
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 border border-white/20 backdrop-blur-2xl"
          style={{ background: 'rgba(0, 0, 0, 0.45)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
        >
          <span>🏛️</span>
          <span>{current.statusTag}</span>
        </div>

        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-red-200 border border-white/20 backdrop-blur-2xl"
          style={{ background: 'rgba(0, 0, 0, 0.45)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>{current.badge}</span>
        </div>
      </div>

      {/* Center Animated Icon Orb & Fixed Height Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl transition-transform duration-700 ease-out hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(220,38,38,0.25) 100%)',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: `
              0 15px 35px rgba(0,0,0,0.6),
              inset 0 2px 4px rgba(255,255,255,0.5),
              0 0 35px ${current.glowColor}40
            `,
          }}
        >
          <span className="drop-shadow-lg">{current.icon}</span>
        </div>

        {/* Text Container with fixed height to prevent vertical expansion */}
        <div className="mt-4 h-24 max-w-xs flex flex-col justify-center transition-all duration-500">
          <h3 className="text-2xl font-black text-[#FDFBF7] tracking-tight drop-shadow-md line-clamp-1">
            {current.title}
          </h3>
          <p className="mt-1 text-xs text-[#FDFBF7]/80 font-medium leading-relaxed line-clamp-2">
            {current.description}
          </p>
        </div>

        {/* Dynamic Stats Row with fixed height */}
        <div className="mt-2 h-12 flex items-center justify-center gap-8 border-t border-white/10 pt-2 w-full max-w-xs shrink-0">
          {current.stats.map((st) => (
            <div key={st.label} className="text-center">
              <p className="text-base font-black text-[#F59E0B] drop-shadow-sm leading-none">{st.value}</p>
              <p className="text-[9px] font-extrabold tracking-widest text-[#FDFBF7]/60 uppercase mt-1">{st.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10 shrink-0 h-10">
        <div
          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#FDFBF7]/80 border border-white/15"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          📁 {current.tag}
        </div>

        {/* Interactive Pagination Indicators */}
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${
                activeSlide === idx
                  ? 'w-6 bg-[#DC2626] shadow-[0_0_12px_#DC2626]'
                  : 'w-2 bg-white/25 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const pillars = [
    {
      title: 'Creative Development',
      desc: 'Enhance artistic and technical skill sets through hands-on workshops, training, and real-world project builds.',
      icon: '🎨',
    },
    {
      title: 'Community Building',
      desc: 'Connect with a vibrant network of like-minded creators, student designers, and multimedia enthusiasts.',
      icon: '👥',
    },
    {
      title: 'Career Opportunities',
      desc: 'Build industry-ready portfolios, access mentorship, and present work to future creative partners.',
      icon: '💼',
    },
  ];

  const officers = [
    {
      name: 'John Doe',
      role: 'President',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Jane Smith',
      role: 'Vice President',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Alex Rivera',
      role: 'Creative Lead',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Michael Tan',
      role: 'Events Coordinator',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const events = [
    {
      title: 'Web Design Workshop',
      date: 'March 15, 2026',
      location: 'Computer Lab, Building A',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Digital Art Exhibition',
      date: 'April 5, 2026',
      location: 'University Gallery',
      image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Animation Masterclass',
      date: 'May 12, 2026',
      location: 'Multimedia Room',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const stats = [
    { label: 'Active Members', value: '50+' },
    { label: 'Events Hosted', value: '10+' },
    { label: 'Projects Completed', value: '50+' },
    { label: 'Years Active', value: '5+' },
  ];

  const portfolioSpotlights = [
    {
      title: 'Digital Storytelling',
      creator: 'Mica Reyes',
      category: 'Visual Design',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
      summary: 'A layered motion-led identity system designed for a student-led creative campaign and social media rollout.',
    },
    {
      title: 'Motion Reel',
      creator: 'Jhon Carlo',
      category: 'Animation',
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
      summary: 'A cinematic sequence blending typography, motion graphics, and visual storytelling for a multimedia concept pitch.',
    },
    {
      title: 'Editorial Collection',
      creator: 'Ari Belle',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
      summary: 'An editorial compilation showing culture, portraiture, and visual moodboards built for brand presentation.',
    },
  ];

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <span
              className="px-5 py-2 text-xs font-black uppercase tracking-widest rounded-full border border-white/20 inline-block backdrop-blur-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: CITEMAS_GOLD,
                boxShadow: '0 8px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3)',
              }}
            >
              CITEMAS Member Portal
            </span>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight drop-shadow-2xl" style={{ color: CITEMAS_CREAM }}>
              Your creative <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">home base</span>
            </h1>
            <p className="text-base leading-relaxed max-w-xl font-medium" style={{ color: MUTED }}>
              Discover the work of student creatives, stay updated on events, and keep your portfolio connected to the heartbeat of the CITEMAS community.
            </p>
            <div className="flex flex-wrap gap-5 pt-2">
              <SpatialButton href="/portfolio" variant="primary">
                View Portfolio
              </SpatialButton>
              <SpatialButton href="/events" variant="secondary">
                Explore Events
              </SpatialButton>
            </div>
          </div>

          {/* Spatial Interactive Frame Showcase */}
          <InteractiveSpatialShowcase />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative mx-auto max-w-7xl px-8 py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl space-y-5 mb-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider" style={{ color: CITEMAS_CREAM }}>
            About CITEMAS
          </h2>
          <p className="text-sm leading-relaxed tracking-wide" style={{ color: MUTED }}>
            CITEMAS stands for <span className="font-black uppercase text-[#F59E0B]">COLLEGE OF INFORMATION TECHNOLOGY EDUCATION - MULTIMEDIA ARTS STUDIO</span>.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            This organization was built after Ilonggo Animation called <span className="font-black text-[#FDFBF7]">“PIKYAW”</span> in 2014, founded by our CITE Program Head, <span className="font-black text-[#FDFBF7]">Dr. Arnold M. Fuentes</span>, and CITE Dean <span className="font-black text-[#FDFBF7]">Seth dA. Nono</span>.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            In our organization, we support and guide the students of <span className="font-black text-[#FDFBF7]">PHINMA UNIVERSITY OF ILOILO</span> to showcase, enhance, and improve their skills in Multimedia Arts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((p) => (
            <SpatialGlassPanel key={p.title} depth="mid" className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 10px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                {p.icon}
              </div>
              <h3 className="font-extrabold text-base uppercase tracking-wide" style={{ color: CITEMAS_CREAM }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{p.desc}</p>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      {/* Portfolio Spotlight Section */}
      <section className="relative mx-auto max-w-7xl px-8 py-20 border-t border-white/10">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F59E0B]">Portfolio Showcase</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider" style={{ color: CITEMAS_CREAM }}>
              Featured member work
            </h2>
          </div>
          <SpatialButton href="/portfolio" variant="secondary">
            Open Gallery
          </SpatialButton>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {portfolioSpotlights.map((item) => (
            <SpatialGlassPanel key={item.title} depth="front" className="overflow-hidden p-0">
              <div className="h-56 overflow-hidden border-b border-white/10">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#F59E0B]">{item.category}</span>
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-200">Featured</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black leading-tight text-[#FDFBF7]">{item.title}</h3>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FDFBF7]/60">By {item.creator}</p>
                </div>

                <p className="text-sm leading-relaxed text-[#FDFBF7]/75">{item.summary}</p>

                <Link href="/portfolio" className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-red-200 transition-colors hover:text-red-100">
                  View project →
                </Link>
              </div>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      {/* Officers Showcase Section */}
      <section id="officers" className="relative mx-auto max-w-7xl px-8 py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider" style={{ color: CITEMAS_CREAM }}>
            Executive Officers
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Meet the team leading and empowering student creators across the university.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {officers.map((officer) => (
            <SpatialGlassPanel key={officer.name} depth="mid" className="text-center group">
              <div className="h-52 w-full rounded-2xl overflow-hidden mb-4 bg-black/40 border border-white/10">
                <img
                  src={officer.image}
                  alt={officer.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-extrabold text-base uppercase tracking-wide" style={{ color: CITEMAS_CREAM }}>{officer.name}</h3>
              <p className="text-xs font-black uppercase tracking-widest mt-1.5" style={{ color: CITEMAS_GOLD }}>
                {officer.role}
              </p>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="relative mx-auto max-w-7xl px-8 py-20 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider" style={{ color: CITEMAS_CREAM }}>
            Upcoming Events
          </h2>
          <p className="text-sm" style={{ color: MUTED }}>
            Join our workshops and exhibitions to expand your multimedia skill sets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((e) => (
            <SpatialGlassPanel key={e.title} depth="front" className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="h-48 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                  <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-extrabold text-base uppercase tracking-wide" style={{ color: CITEMAS_CREAM }}>{e.title}</h3>
                <div className="text-sm space-y-1.5 font-medium" style={{ color: MUTED }}>
                  <p>📅 {e.date}</p>
                  <p>📍 {e.location}</p>
                </div>
              </div>
              <SpatialButton href="/events" variant="secondary">
                View Details
              </SpatialButton>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      {/* Spatial Stats Counter Grid */}
      <section className="relative border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.link || stats.map((s) => (
            <SpatialGlassPanel key={s.label} depth="back" className="p-6">
              <p className="text-4xl font-black" style={{ color: CITEMAS_GOLD }}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest mt-2" style={{ color: MUTED }}>{s.label}</p>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>
    </div>
  );
}