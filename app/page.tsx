'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  // ─────────────────────────────────────────
  // ALL HOOKS FIRST — no exceptions
  // ─────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();

  // Data arrays
  const featuredOfficers = [
    {
      name: 'Vea de los Santos',
      role: 'President',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Evonie Sabug',
      role: 'Vice President',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Miki Matsui',
      role: 'Secretary',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Achilles Fernandez',
      role: 'Treasurer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const stats = [
    { label: 'Active Members', value: '50+', detail: 'Creative and tech-driven community' },
    { label: 'Events Hosted', value: '10+', detail: 'Workshops, showcases, and campus programs' },
    { label: 'Projects Completed', value: '50+', detail: 'Brand, website, and multimedia builds' },
    { label: 'Years Active', value: '5+', detail: 'A growing creative legacy in the school' },
  ];

  // Auth check effect
  useEffect(() => {
    const token = localStorage.getItem('citemas_token');
    setIsLoggedIn(!!token);
    setLoading(false);
  }, []);

  // Officer carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % featuredOfficers.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [featuredOfficers.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FDFBF7]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  const current = featuredOfficers[activeIdx];

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
            <span>Welcome, CITE & Multimedia Arts Students</span>
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
            <p className="text-slate-400 text-xs mt-1">Meet the driving force behind our community initiatives.</p>
          </div>

          <div className="relative rounded-3xl bg-white/[0.02] border border-white/10 p-6 md:p-10 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative h-72 md:h-88 rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
                <img
                  src={current.image}
                  alt={current.name}
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

                {/* Indicators */}
                <div className="flex items-center space-x-2 pt-2">
                  {featuredOfficers.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`h-2 transition-all rounded-full cursor-pointer ${
                        activeIdx === idx ? 'w-8 bg-red-500 shadow-sm shadow-red-500' : 'w-2 bg-white/10 hover:bg-white/20'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
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