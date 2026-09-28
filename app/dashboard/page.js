// app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import AchievementCard from '@/components/AchievementCard';
import { Award } from 'lucide-react';
import { SPECIALIZATIONS } from '@/lib/specializations';
import SpecializationCard from '@/components/SpecializationCard';
import EventsSpatialShowcase from '@/components/EventsSpatialShowcase';

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

// Dynamic Stats Showcase — fetches real counts from live APIs
function DashboardStats({ members, events, portfolios }) {
  const statItems = [
    { value: members, label: 'Active Members' },
    { value: events, label: 'Upcoming Events' },
    { value: portfolios, label: 'Portfolio Pieces' },
    { value: '12+', label: 'Years Active' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-[24px] border border-white/20 p-6 transition-all duration-300 hover:border-white/30 hover:-translate-y-1"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.15)',
          }}
        >
          <div className="text-4xl font-black text-[#F8F2EC] group-hover:text-red-400 transition-colors">
            {stat.value}
          </div>
          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);
  const [officerRows, setOfficerRows] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({ members: 0, events: 0, portfolios: 0 });
  const [liveEvents, setLiveEvents] = useState([]);
  const [livePortfolios, setLivePortfolios] = useState([]);

  const formatPosition = (position) => {
    if (!position) return 'Officer';
    if (position.toLowerCase() === 'pro') return 'PRO';
    if (position.toLowerCase() === 'pio') return 'PIO';
    return position
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const loadAchievements = () => {
      setAchievementsLoading(true);
      fetch('/api/achievements?recent=true&limit=6', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : { achievements: [] }))
        .then((data) => setAchievements(Array.isArray(data.achievements) ? data.achievements : []))
        .catch(() => setAchievements([]))
        .finally(() => setAchievementsLoading(false));
    };

    loadAchievements();
  }, [token]);

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

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/users', { headers })
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const count = data.users?.filter((u) => u.role === 'member' || u.role === 'alumni').length || 0;
        setDashboardStats((prev) => ({ ...prev, members: count }));
      })
      .catch(() => setDashboardStats((prev) => ({ ...prev, members: 0 })));

    fetch('/api/events', { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const eventsList = Array.isArray(data) ? data : [];
        setLiveEvents(eventsList);
        const upcoming = eventsList.filter((e) => new Date(e.date) > new Date()).length;
        setDashboardStats((prev) => ({ ...prev, events: upcoming }));
      })
      .catch(() => {
        setLiveEvents([]);
        setDashboardStats((prev) => ({ ...prev, events: 0 }));
      });

    fetch('/api/portfolio', { headers })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const portfoliosList = Array.isArray(data) ? data : [];
        setLivePortfolios(portfoliosList);
        setDashboardStats((prev) => ({ ...prev, portfolios: portfoliosList.length }));
      })
      .catch(() => {
        setLivePortfolios([]);
        setDashboardStats((prev) => ({ ...prev, portfolios: 0 }));
      });
  }, [token]);

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

  const upcomingEvents = liveEvents
    .filter((e) => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const portfolioSpotlights = livePortfolios.slice(0, 3).map((entry) => ({
    title: entry.title || 'Untitled',
    creator: entry.owner
      ? `${entry.owner.firstName || ''} ${entry.owner.lastName || ''}`.trim() || 'Anonymous'
      : 'Anonymous',
    category: SPECIALIZATIONS.find((s) => s.key === entry.specialization)?.label ||
      entry.specialization?.replace(/_/g, ' ') ||
      'Uncategorized',
    image: entry.mediaUrl || '',
    summary: entry.description || '',
  }));

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
              <h1 className="max-w-2xl text-5xl font-black leading-none tracking-[-0.06em] text-[#F8F2EC] sm:text-6xl">
                Your creative <span className="inline-block bg-gradient-to-r from-red-400 via-red-500 to-amber-300 bg-clip-text text-transparent">home base</span>
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

          <EventsSpatialShowcase token={token} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-12 sm:px-8">
        <DashboardStats
          members={dashboardStats.members}
          events={dashboardStats.events}
          portfolios={dashboardStats.portfolios}
        />
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
          {portfolioSpotlights.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[rgba(248,242,236,0.5)] py-12">
              No featured projects yet. Submit your first portfolio piece!
            </p>
          ) : (
            portfolioSpotlights.map((item) => (
              <SpatialGlassPanel key={item.title} depth="front" className="overflow-hidden p-0">
                <div className="h-56 overflow-hidden border-b border-white/10">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
                  )}
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
            ))
          )}
        </div>
      </section>

      {/* RECENT ACHIEVEMENTS SECTION */}
      <section id="achievements" className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
              <Award size={12} />
              Community Accolades
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">
              Recent Achievements
            </h2>
            <p className="mt-2 text-sm text-[rgba(248,242,236,0.7)] max-w-xl">
              Celebrating awards, competition wins, and recognized creative milestones achieved by CITEMAS members.
            </p>
          </div>
          <SpatialButton href="/portfolio" variant="secondary">
            View All Achievements
          </SpatialButton>
        </div>

        {achievementsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 animate-pulse" />
            ))}
          </div>
        ) : achievements.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement._id}
                achievement={achievement}
                currentUserId={user?.id || user?._id}
                isStaff={['super_admin', 'teacher', 'adviser', 'officer'].includes(user?.role)}
                onDelete={() => {
                  setAchievements((prev) => prev.filter((a) => a._id !== achievement._id));
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
              <Award size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">You have not posted any achievements yet.</h3>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                Showcase your accomplishments by adding your first achievement in the portfolio section.
              </p>
            </div>
            <div>
              <SpatialButton href="/portfolio" variant="primary">
                Post First Achievement
              </SpatialButton>
            </div>
          </div>
        )}
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
            Six core tracks we train, mentor, and build with. Every member picks
            a path and grows with it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALIZATIONS.map((spec) => (
            <SpecializationCard key={spec.key} spec={spec} />
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
                className="relative w-full h-[460px] rounded-2xl p-7 transition-all duration-1000 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0 border border-white/20"
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
          {upcomingEvents.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[rgba(248,242,236,0.5)] py-12">
              No upcoming events scheduled. Check back soon!
            </p>
          ) : (
            upcomingEvents.map((e) => (
              <SpatialGlassPanel key={e.title} depth="front" className="flex flex-col justify-between space-y-5 p-0">
                <div className="overflow-hidden border-b border-white/10">
                  {e.image && (
                    <img src={e.image} alt={e.title} className="h-52 w-full object-cover" />
                  )}
                </div>
                <div className="space-y-4 px-5 pb-5">
                  <h3 className="text-xl font-black text-[#F8F2EC]">{e.title}</h3>
                  <div className="space-y-2 text-sm text-[rgba(248,242,236,0.72)]">
                    <p>📅 {new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p>📍 {e.location}</p>
                  </div>
                  <SpatialButton href="/events" variant="secondary">View details</SpatialButton>
                </div>
              </SpatialGlassPanel>
            ))
          )}
        </div>
      </section>
    </div>
  );
}