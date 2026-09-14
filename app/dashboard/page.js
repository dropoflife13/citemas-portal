// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// CITEMAS Aesthetic Colors
const CITEMAS_RED = '#DC2626';
const CITEMAS_DARK_RED = '#7F1D1D';
const CITEMAS_CREAM = '#FDFBF7';

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
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-40 blur-[80px] transition-all duration-1000"
        style={{ background: current.glowColor }}
      />

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

        <div className="mt-4 h-24 max-w-xs flex flex-col justify-center transition-all duration-500">
          <h3 className="text-2xl font-black text-[#FDFBF7] tracking-tight drop-shadow-md line-clamp-1">
            {current.title}
          </h3>
          <p className="mt-1 text-xs text-[#FDFBF7]/80 font-medium leading-relaxed line-clamp-2">
            {current.description}
          </p>
        </div>

        <div className="mt-2 h-12 flex items-center justify-center gap-8 border-t border-white/10 pt-2 w-full max-w-xs shrink-0">
          {current.stats.map((st) => (
            <div key={st.label} className="text-center">
              <p className="text-base font-black text-[#F59E0B] drop-shadow-sm leading-none">{st.value}</p>
              <p className="text-[9px] font-extrabold tracking-widest text-[#FDFBF7]/60 uppercase mt-1">{st.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10 shrink-0 h-10">
        <div
          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#FDFBF7]/80 border border-white/15"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          📁 {current.tag}
        </div>

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
  const [activeIdx, setActiveIdx] = useState(0);
  const [officerRows, setOfficerRows] = useState([]);

  const formatPosition = (position) => {
    if (!position) return 'Officer';
    return position
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const loadOfficers = () => {
      fetch('/api/officers')
        .then((res) => (res.ok ? res.json() : { officers: [] }))
        .then((data) => setOfficerRows(Array.isArray(data.officers) ? data.officers : []))
        .catch(() => setOfficerRows([]));
    };

    loadOfficers();

    // Re-fetch when the page regains focus (e.g. after updating roles in /users)
    const onFocus = () => loadOfficers();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const featuredOfficers = officerRows
    .filter((person) => person && person.officerPosition)
    .map((person) => ({
      name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'CITEMAS Officer',
      role: formatPosition(person.officerPosition),
      image:
        person.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(`${person.firstName || ''} ${person.lastName || ''}`.trim() || 'CITEMAS Officer')}&background=7f1d1d&color=f8f2ec&size=512`,
    }));

  const supportOfficers = officerRows
    .filter((person) => person && person.officerPosition && person.officerPosition !== 'president')
    .slice(0, 6)
    .map((person) => ({
      name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'CITEMAS Officer',
      role: formatPosition(person.officerPosition),
    }));

  const yearReps = officerRows
    .filter((person) => person && person.officerPosition === 'year_level_representative')
    .map((person) => ({
      name: `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Year Representative',
      role: 'Year Representative',
    }));

  useEffect(() => {
    if (!featuredOfficers.length) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featuredOfficers.length]);

  const current = featuredOfficers[activeIdx] || null;

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
    { label: 'Active Members', value: '50+', detail: 'Creative and tech-driven community' },
    { label: 'Events Hosted', value: '10+', detail: 'Workshops, showcases, and campus programs' },
    { label: 'Projects Completed', value: '50+', detail: 'Brand, website, and multimedia builds' },
    { label: 'Years Active', value: '5+', detail: 'A growing creative legacy in the school' },
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
      summary: 'A cinematic sequence blending typography, motion graphics, and visual storytelling into one sharp narrative arc.',
    },
    {
      title: 'Editorial Collection',
      creator: 'Ari Belle',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
      summary: 'An editorial compilation showing culture, portraiture, and visual moodboards built for polished brand storytelling.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#F8F2EC]">
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-red-200 shadow-[0_12px_30px_rgba(217,41,41,0.12)]">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              CITEMAS Member Portal
            </span>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-black leading-none tracking-[-0.06em] text-[#F8F2EC] sm:text-6xl">
                Your creative <span className="bg-gradient-to-r from-red-400 via-red-500 to-amber-300 bg-clip-text text-transparent">home base</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[rgba(248,242,236,0.75)]">
                Discover student work, track events, and keep the CITEMAS community connected through a premium creative platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <SpatialButton href="/portfolio" variant="primary">View Portfolio</SpatialButton>
              <SpatialButton href="/events" variant="secondary">Explore Events</SpatialButton>
            </div>
          </div>

          <InteractiveSpatialShowcase />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">History</p>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-[#F8F2EC] sm:text-5xl">The story behind CITEMAS.</h2>
            <p className="text-base leading-relaxed text-[rgba(248,242,236,0.8)]">
              <span className="font-black uppercase tracking-[0.08em] text-amber-300">CITEMAS</span> stands for <span className="font-black text-[#F8F2EC]">COLLEGE OF INFORMATION TECHNOLOGY EDUCATION - MULTIMEDIA ARTS STUDIO</span>.
            </p>
            <p className="text-sm leading-relaxed text-[rgba(248,242,236,0.72)]">
              This organization was built after Ilonggo Animation called <span className="font-black text-[#F8F2EC]">“PIKYAW”</span> in 2014, founded by our CITE Program Head, <span className="font-black text-[#F8F2EC]">Dr. Arnold M. Fuentes</span>, and CITE Dean <span className="font-black text-[#F8F2EC]">Seth dA. Nono</span>.
            </p>
            <p className="text-sm leading-relaxed text-[rgba(248,242,236,0.72)]">
              In our organization, we support and guide the students of <span className="font-black text-[#F8F2EC]">PHINMA UNIVERSITY OF ILOILO</span> to showcase, enhance, and improve their skills in Multimedia Arts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['2014', 'Founded from the creative roots of PIKYAW'],
              ['CITE', 'Built for student growth in tech and media'],
              ['Multimedia', 'Art, design, and digital storytelling together'],
              ['Community', 'A platform for students to showcase and sharpen their craft'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(217,41,41,0.12),transparent_30%),rgba(20,12,12,0.85)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
                <div className="text-2xl font-black tracking-[-0.06em] text-[#F8F2EC]">{title}</div>
                <div className="mt-3 text-sm leading-relaxed text-[rgba(248,242,236,0.7)]">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <SpatialGlassPanel key={p.title} depth="mid" className="space-y-5 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]">
                {p.icon}
              </div>
              <h3 className="text-base font-black uppercase tracking-[0.18em] text-[#F8F2EC]">{p.title}</h3>
              <p className="text-sm leading-relaxed text-[rgba(248,242,236,0.7)]">{p.desc}</p>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">Portfolio showcase</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Featured member work</h2>
          </div>
          <SpatialButton href="/portfolio" variant="secondary">Open gallery</SpatialButton>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {portfolioSpotlights.map((item) => (
            <SpatialGlassPanel key={item.title} depth="front" className="overflow-hidden p-0">
              <div className="h-56 overflow-hidden border-b border-white/10">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-300">{item.category}</span>
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-200">Featured</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black leading-tight text-[#F8F2EC]">{item.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(248,242,236,0.58)]">By {item.creator}</p>
                </div>

                <p className="text-sm leading-relaxed text-[rgba(248,242,236,0.7)]">{item.summary}</p>

                <Link href="/portfolio" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-red-200 transition-colors hover:text-red-100">
                  View project →
                </Link>
              </div>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>
      {/* SPECIALIZATIONS SECTION */}
      <section id="specializations" className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
            What we do
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">
            Specializations
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[rgba(248,242,236,0.72)]">
            Four core tracks we train, mentor, and build with. Every member picks
            a path and grows with it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'Web Development',
              desc: 'Frontend, backend, and full-stack builds — from landing pages to member portals.',
              icon: '💻',
              tags: ['React', 'Next.js', 'Node'],
              color: '#DC2626',
            },
            {
              title: 'UI / UX Design',
              desc: 'Interface design, design systems, prototyping, and interaction craft.',
              icon: '🎨',
              tags: ['Figma', 'Prototyping', 'Design Systems'],
              color: '#F59E0B',
            },
            {
              title: 'Animation & Motion',
              desc: '2D/3D animation, motion graphics, VFX, and short-form video.',
              icon: '🎬',
              tags: ['After Effects', 'Blender', 'Premiere'],
              color: '#991B1B',
            },
            {
              title: 'Digital Media',
              desc: 'Photography, editorial design, branding, and social-first creative.',
              icon: '📸',
              tags: ['Photoshop', 'Lightroom', 'Branding'],
              color: '#7F1D1D',
            },
          ].map((spec) => (
            <div
              key={spec.title}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 p-6 transition-all duration-500 hover:-translate-y-2 hover:border-white/25"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15)',
              }}
            >
              {/* Glow behind card on hover */}
              <div
                className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                style={{ background: spec.color }}
              />

              <div className="relative z-10">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${spec.color}40 0%, ${spec.color}15 100%)`,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                  }}
                >
                  {spec.icon}
                </div>

                <h3 className="mt-5 text-lg font-black leading-tight text-[#F8F2EC]">
                  {spec.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-[rgba(248,242,236,0.7)]">
                  {spec.desc}
                </p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {spec.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-[rgba(248,242,236,0.7)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="officers" className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Leadership</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Executive officers</h2>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#F8F2EC]/80 transition-colors hover:border-red-400/40 hover:text-red-200"
          >
            View all officers
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {current ? (
            <>
              <div
                className="relative w-full h-[460px] rounded-[36px] p-7 transition-all duration-1000 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0 border border-white/20"
                style={{
                  background: 'radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.45) 0%, rgba(127, 29, 29, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
                  backdropFilter: 'blur(36px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(36px) saturate(200%)',
                  boxShadow: `
                    0 30px 70px -10px rgba(0, 0, 0, 0.8),
                    0 0 50px rgba(220, 38, 38, 0.2),
                    inset 0 1px 2px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <div className="relative z-20 flex items-center justify-between shrink-0 h-9">
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 border border-white/25 backdrop-blur-2xl"
                    style={{ background: 'rgba(0, 0, 0, 0.5)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
                  >
                    <span>👑</span>
                    <span>{current.role}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {featuredOfficers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIdx(idx)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          activeIdx === idx
                            ? 'w-6 bg-red-500 shadow-[0_0_12px_#DC2626]'
                            : 'w-2 bg-white/30 hover:bg-white/60'
                        }`}
                        aria-label={`Go to officer ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto">
                  <div
                    className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full overflow-hidden transition-transform duration-700 ease-out hover:scale-105"
                    style={{
                      border: '3px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.6)',
                    }}
                  >
                    <img src={current.image} alt={current.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="mt-4 max-w-xs flex flex-col justify-center transition-all duration-500">
                    <p className="text-[10px] font-black tracking-[0.25em] text-red-400 uppercase">● CURRENTLY ACTIVE</p>
                    <h3 className="text-2xl font-black text-[#FDFBF7] tracking-tight drop-shadow-md mt-1">
                      {current.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#FDFBF7]/75 font-medium tracking-wide">
                      PHINMA University of Iloilo
                    </p>
                  </div>
                </div>

                <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/10 shrink-0 h-11">
                  <div
                    className="px-3.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#FDFBF7]/90 border border-white/15"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    ✨ CITEMAS Board Member
                  </div>
                  <span className="text-[10px] font-black text-amber-300 tracking-widest uppercase">
                    0{activeIdx + 1} / 0{featuredOfficers.length}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-300">Board details</p>
                  <div className="mt-4 space-y-3">
                    {supportOfficers.length ? supportOfficers.map((officer) => (
                      <div 
                        key={`${officer.role}-${officer.name}`} 
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300 ${
                          current.role.toLowerCase() === officer.role.toLowerCase() 
                            ? 'border-red-500/50 bg-red-500/15 shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                            : 'border-white/10 bg-black/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">{officer.role}</span>
                        <span className="text-right text-sm font-black text-[#F8F2EC]">{officer.name}</span>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[rgba(248,242,236,0.7)]">
                        Officer assignments are still being updated.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-300">Year representatives</p>
                  <div className="mt-4 space-y-3">
                    {yearReps.length ? yearReps.map((rep) => (
                      <div 
                        key={`${rep.role}-${rep.name}`} 
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300 ${
                          current && rep.name.includes(current.name) 
                            ? 'border-red-500/50 bg-red-500/15 shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                            : 'border-white/10 bg-black/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">{rep.role}</span>
                        <span className="text-right text-sm font-black text-[#F8F2EC]">{rep.name}</span>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-[rgba(248,242,236,0.7)]">
                        No year representatives assigned yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-full rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-slate-300">
              The officer lineup has not been assigned yet. Update the current officers in the system to populate this section.
            </div>
          )}
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Upcoming</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Live events and activities</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {events.map((e) => (
            <SpatialGlassPanel key={e.title} depth="front" className="flex flex-col justify-between space-y-5 p-0">
              <div className="overflow-hidden border-b border-white/10">
                <img src={e.image} alt={e.title} className="h-52 w-full object-cover" />
              </div>
              <div className="space-y-4 px-5 pb-5">
                <h3 className="text-xl font-black text-[#F8F2EC]">{e.title}</h3>
                <div className="space-y-2 text-sm text-[rgba(248,242,236,0.72)]">
                  <p>📅 {e.date}</p>
                  <p>📍 {e.location}</p>
                </div>
                <SpatialButton href="/events" variant="secondary">View details</SpatialButton>
              </div>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 py-16">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 sm:grid-cols-2 md:grid-cols-4 sm:px-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <div className="mb-3 h-px w-10 bg-gradient-to-r from-red-400 to-transparent" />
              <div className="text-3xl font-black tracking-[-0.06em] text-[#F8F2EC]">{stat.value}</div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-[rgba(248,242,236,0.6)]">{stat.label}</div>
              <p className="mt-3 text-sm leading-relaxed text-[rgba(248,242,236,0.68)]">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}