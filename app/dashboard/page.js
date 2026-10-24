'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import AchievementCard from '@/components/AchievementCard';
import { Award } from 'lucide-react';
import { SPECIALIZATIONS } from '@/lib/specializations';
import SpecializationCard from '@/components/SpecializationCard';
import EventsSpatialShowcase from '@/components/EventsSpatialShowcase';

// Apple-style Dark Tile Panel
function SpatialGlassPanel({ children, className = '', depth = 'mid' }) {
  return (
    <div
      className={`relative rounded-3xl p-6 transition-all duration-300 ease-out bg-[#1a1a1c] border border-white/[0.06] hover:border-white/[0.12] ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Apple-style Pill Button (Vivid Crimson #DC2626)
function SpatialButton({ href, children, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center justify-center px-7 py-3 text-xs font-semibold uppercase tracking-wider rounded-full transition-all duration-200 active:scale-95 ${
        isPrimary
          ? 'bg-[#DC2626] hover:bg-[#b91c1c] text-white shadow-sm'
          : 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/90 hover:text-white'
      }`}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

// Dynamic Stats Showcase — Apple Tiles
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
          className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#1a1a1c] p-6 transition-all duration-300 hover:border-white/[0.14] hover:-translate-y-0.5"
        >
          <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f5f5f7]">
            {stat.value}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { user, token } = useAuth();
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#111111] text-[#f5f5f7] selection:bg-[#DC2626] selection:text-white font-sans">
      {/* Subtle, faint red radial glow in the top left to match the landing page */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.12)_0%,transparent_70%)] blur-[120px]" />

      {/* HERO SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
              CITEMAS Member Portal
            </span>

            <div className="space-y-4">
              <h1 className="max-w-2xl font-serif text-5xl font-normal leading-[1.05] tracking-[-0.03em] text-[#f5f5f7] sm:text-6xl md:text-7xl">
                Your creative <span className="italic text-[#DC2626]">home base</span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-[#86868b]">
                Discover student work, track events, and keep the CITEMAS community connected through a premium creative platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <SpatialButton href="/portfolio" variant="primary">View Portfolio</SpatialButton>
              <SpatialButton href="/events" variant="secondary">Explore Events</SpatialButton>
            </div>
          </div>

          <EventsSpatialShowcase token={token} isHero={true} />
        </div>
      </section>

      {/* DASHBOARD STATS */}
      <section className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-12 sm:px-8 relative z-10">
        <DashboardStats
          members={dashboardStats.members}
          events={dashboardStats.events}
          portfolios={dashboardStats.portfolios}
        />
      </section>

      {/* STORY BEHIND CITEMAS */}
      <section id="about" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">History</p>
            <h2 className="font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-5xl">The story behind CITEMAS.</h2>
            <p className="text-base leading-relaxed text-[#86868b]">
              <span className="font-semibold text-[#f5f5f7]">CITEMAS</span> stands for <span className="text-[#f5f5f7]">College of Information Technology Education — Multimedia Arts Studio</span>.
            </p>
            <p className="text-sm leading-relaxed text-[#86868b]">
              This organization was built after Ilonggo Animation called <span className="text-[#f5f5f7]">“PIKYAW”</span> in 2014, founded by our CITE Program Head, <span className="text-[#f5f5f7]">Dr. Arnold M. Fuentes</span>, and CITE Dean <span className="text-[#f5f5f7]">Seth dA. Nono</span>.
            </p>
            <p className="text-sm leading-relaxed text-[#86868b]">
              In our organization, we support and guide the students of <span className="text-[#f5f5f7]">PHINMA University of Iloilo</span> to showcase, enhance, and improve their skills in Multimedia Arts.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['2014', 'Founded from the creative roots of PIKYAW'],
              ['CITE', 'Built for student growth in tech and media'],
              ['Multimedia', 'Art, design, and digital storytelling together'],
              ['Community', 'A platform for students to showcase and sharpen their craft'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/[0.06] bg-[#1a1a1c] p-6 transition-colors hover:border-white/[0.12]">
                <div className="text-2xl font-bold tracking-tight text-[#f5f5f7]">{title}</div>
                <div className="mt-2 text-sm leading-relaxed text-[#86868b]">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <SpatialGlassPanel key={p.title} depth="mid" className="space-y-4 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] text-2xl">
                {p.icon}
              </div>
              <h3 className="font-serif text-lg font-normal tracking-wide text-[#f5f5f7]">{p.title}</h3>
              <p className="text-xs leading-relaxed text-[#86868b]">{p.desc}</p>
            </SpatialGlassPanel>
          ))}
        </div>
      </section>

      {/* FEATURED PORTFOLIO SECTION */}
      <section className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">Portfolio showcase</p>
            <h2 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">Featured member work</h2>
          </div>
          <SpatialButton href="/portfolio" variant="secondary">Open gallery</SpatialButton>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {portfolioSpotlights.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[#86868b] py-12">
              No featured projects yet. Submit your first portfolio piece!
            </p>
          ) : (
            portfolioSpotlights.map((item) => (
              <div key={item.title} className="rounded-3xl bg-[#000000] border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-white/[0.14]">
                <div className="h-56 overflow-hidden border-b border-white/[0.06]">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
                  )}
                </div>

                <div className="space-y-3 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868b]">{item.category}</span>
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300">Featured</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl font-normal tracking-[-0.02em] text-[#f5f5f7]">{item.title}</h3>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">By {item.creator}</p>
                  </div>

                  <p className="text-xs leading-relaxed text-[#86868b]">{item.summary}</p>

                  <Link href="/portfolio" className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-red-400 transition-colors hover:text-red-300">
                    View project &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* RECENT ACHIEVEMENTS SECTION */}
      <section id="achievements" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              <Award size={12} />
              Community Accolades
            </span>
            <h2 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">
              Recent Achievements
            </h2>
            <p className="mt-2 text-sm text-[#86868b] max-w-xl">
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
              <div key={i} className="h-64 rounded-3xl border border-white/[0.06] bg-[#1a1a1c] p-6 animate-pulse" />
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
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-[#1a1a1c] p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Award size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f5f5f7]">You have not posted any achievements yet.</h3>
              <p className="text-xs text-[#86868b] max-w-md mx-auto">
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
      <section id="specializations" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">
            What we do
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">
            Specializations
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#86868b]">
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

      {/* EXECUTIVE OFFICERS SECTION */}
      <section id="officers" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">Leadership</p>
            <h2 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">Executive officers</h2>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#86868b] transition-all hover:border-white/20 hover:text-white"
          >
            View all officers
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {current ? (
            <>
              <div
                className="relative w-full h-[460px] rounded-[28px] p-7 transition-all duration-700 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0 bg-[#000000] border border-white/[0.08]"
                style={{
                  boxShadow: `
                    0 30px 70px -10px rgba(0, 0, 0, 0.9),
                    0 0 50px rgba(220, 38, 38, 0.15),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)
                  `,
                }}
              >
                <div className="relative z-20 flex items-center justify-between shrink-0 h-9">
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-white/10 bg-white/[0.04] backdrop-blur-2xl"
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
                            ? 'w-6 bg-[#DC2626] shadow-[0_0_10px_#DC2626]'
                            : 'w-2 bg-white/20 hover:bg-white/40'
                        }`}
                        aria-label={`Go to officer ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto">
                  <div
                    className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-[28px] overflow-hidden bg-[#000000] border border-white/15 shadow-2xl transition-transform duration-700 ease-out hover:scale-105"
                    style={{
                      boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(220, 38, 38, 0.25), inset 0 1px 1px rgba(255,255,255,0.2)',
                    }}
                  >
                    <img src={current.image} alt={current.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="mt-4 max-w-xs flex flex-col justify-center transition-all duration-500">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-red-400 uppercase">● CURRENTLY ACTIVE</p>
                    <h3 className="font-serif text-2xl font-normal text-[#f5f5f7] tracking-[-0.02em] mt-1">
                      {current.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#86868b] font-medium tracking-wide">
                      PHINMA University of Iloilo
                    </p>
                  </div>
                </div>

                <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/[0.06] shrink-0 h-11">
                  <div
                    className="px-3.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#86868b] border border-white/[0.08] bg-white/[0.03]"
                  >
                    ✨ CITEMAS Board Member
                  </div>
                  <span className="text-[10px] font-semibold text-[#86868b] tracking-widest uppercase">
                    0{activeIdx + 1} / 0{featuredOfficers.length}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-white/[0.06] bg-[#1a1a1c] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">Board details</p>
                  <div className="mt-4 space-y-2.5">
                    {supportOfficers.length ? supportOfficers.map((officer) => (
                      <div 
                        key={`${officer.role}-${officer.name}`} 
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-200 ${
                          current.role.toLowerCase() === officer.role.toLowerCase() 
                            ? 'border-red-500/40 bg-red-500/10 shadow-[0_0_15px_rgba(220,38,38,0.15)]' 
                            : 'border-white/[0.06] bg-black/30 hover:border-white/[0.12]'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">{officer.role}</span>
                        <span className="text-right text-sm font-semibold text-[#f5f5f7]">{officer.name}</span>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm text-[#86868b]">
                        Officer assignments are still being updated.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/[0.06] bg-[#1a1a1c] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">Year representatives</p>
                  <div className="mt-4 space-y-2.5">
                    {yearReps.length ? yearReps.map((rep) => (
                      <div 
                        key={`${rep.role}-${rep.name}`} 
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-200 ${
                          current && rep.name.includes(current.name) 
                            ? 'border-red-500/40 bg-red-500/10 shadow-[0_0_15px_rgba(220,38,38,0.15)]' 
                            : 'border-white/[0.06] bg-black/30 hover:border-white/[0.12]'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">{rep.role}</span>
                        <span className="text-right text-sm font-semibold text-[#f5f5f7]">{rep.name}</span>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm text-[#86868b]">
                        No year representatives assigned yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-white/[0.08] bg-[#1a1a1c] p-12 text-center text-[#86868b]">
              The officer lineup has not been assigned yet. Update the current officers in the system to populate this section.
            </div>
          )}
        </div>
      </section>

      {/* LIVE EVENTS SECTION */}
      <section id="events" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DC2626]">Upcoming</p>
          <h2 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">Live events and activities</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {upcomingEvents.length === 0 ? (
            <p className="col-span-full text-center text-sm text-[#86868b] py-12">
              No upcoming events scheduled. Check back soon!
            </p>
          ) : (
            upcomingEvents.map((e) => (
              <div key={e.title} className="rounded-3xl bg-[#000000] border border-white/[0.06] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/[0.14]">
                <div className="overflow-hidden border-b border-white/[0.06]">
                  {e.image && (
                    <img src={e.image} alt={e.title} className="h-52 w-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
                  )}
                </div>
                <div className="space-y-4 p-6">
                  <h3 className="font-serif text-xl font-normal tracking-[-0.02em] text-[#f5f5f7]">{e.title}</h3>
                  <div className="space-y-1.5 text-xs text-[#86868b]">
                    <p>📅 {new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p>📍 {e.location}</p>
                  </div>
                  <SpatialButton href="/events" variant="secondary">View details</SpatialButton>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
