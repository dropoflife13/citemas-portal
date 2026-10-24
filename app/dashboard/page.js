'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import AchievementCard from '@/components/AchievementCard';
import { Award, Sparkles } from 'lucide-react';
import { SPECIALIZATIONS } from '@/lib/specializations';
import SpecializationCard from '@/components/SpecializationCard';
import EventsSpatialShowcase from '@/components/EventsSpatialShowcase';
import EditorialStatCard from '@/components/EditorialStatCard';
import BracketPanel from '@/components/BracketPanel';
import LivePing from '@/components/LivePing';
import EditorialButton from '@/components/EditorialButton';

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [officerRows, setOfficerRows] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({ members: 0, events: 0, portfolios: 0 });
  const [liveEvents, setLiveEvents] = useState([]);
  const [livePortfolios, setLivePortfolios] = useState([]);

  // Strict Auth Guard: verify token and redirect immediately if unauthenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citemas_token');
      if (!storedToken) {
        router.replace('/login');
        return;
      }
    }
    if (!authLoading) {
      if (!user || !token) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    }
  }, [authLoading, user, token, router]);

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
      code: 'DEV_01',
    },
    {
      title: 'Community Building',
      desc: 'Connect with a vibrant network of like-minded creators, student designers, and multimedia enthusiasts.',
      icon: '👥',
      code: 'NET_02',
    },
    {
      title: 'Career Opportunities',
      desc: 'Build industry-ready portfolios, access mentorship, and present work to future creative partners.',
      icon: '💼',
      code: 'OPS_03',
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

  if (checkingAuth || authLoading || !user || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FEF2F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Verifying Org Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090a0b] text-[#f5f5f7] selection:bg-[#DC2626] selection:text-white font-space bg-grid-faint">
      {/* Subtle, faint red radial glow in the top left */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-[radial-gradient(circle,rgba(220,38,38,0.12)_0%,transparent_70%)] blur-[120px]" />

      {/* 12-COLUMN HERO & INSTRUMENT PANEL GRID */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 md:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Welcome Back Column (Spans 8 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-8 bg-[#111111]/90 p-8 sm:p-10 border border-white/[0.08] plate-corner relative overflow-hidden">
            {/* Top Bar with Live Ping */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <LivePing label="CITEMAS ORG // ONLINE" color="bg-[#DC2626]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                PORTAL_V2 // ACADEMIC 2026
              </span>
            </div>

            <div className="space-y-4 my-auto py-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.24em] text-[#02d2e3] block">
                PHINMA UI CREATIVE ORG
              </span>
              <h1 className="font-display font-bold uppercase text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-[-0.04em] text-white">
                YOUR CREATIVE <span className="text-[#DC2626]">HOME BASE</span>.
              </h1>
              <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-[#86868b] font-space font-normal">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Discover student work, track sprint exhibits, and keep the PHINMA Multimedia Arts community connected through an editorial creative platform.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <EditorialButton href="/portfolio" variant="primary">
                  View Portfolios
                </EditorialButton>
                <EditorialButton href="/events" variant="outline">
                  Exhibits & Sprints
                </EditorialButton>
              </div>

              <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 hidden sm:block">
                STUDIO STATUS: [ACTIVE]
              </div>
            </div>
          </div>

          {/* Instrument Panel Stats (Spans 4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
            <EditorialStatCard
              value={dashboardStats.members}
              label="ACTIVE MEMBERS"
              code="SYS_01"
            />
            <EditorialStatCard
              value={dashboardStats.events}
              label="UPCOMING EXHIBITS"
              code="EVT_02"
            />
            <EditorialStatCard
              value={dashboardStats.portfolios}
              label="PORTFOLIO PIECES"
              code="ART_03"
            />
            <EditorialStatCard
              value="12+"
              label="YEARS OF ORG CRAFT"
              code="EST_2014"
            />
          </div>
        </div>
      </section>

      {/* FULL-WIDTH ARCHIVES SHOWCASE (Spans 12 cols, zero dead space) */}
      <section className="mx-auto max-w-7xl px-6 py-6 sm:px-8 relative z-10">
        <EventsSpatialShowcase token={token} isHero={false} />
      </section>

      {/* STORY BEHIND CITEMAS (12-Column Grid) */}
      <section id="about" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#DC2626]" />
              <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#DC2626]">
                ORIGIN & HERITAGE
              </p>
            </div>
            <h2 className="font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
              THE STORY BEHIND CITEMAS.
            </h2>
            <p className="text-base leading-relaxed text-[#86868b]">
              <span className="font-bold text-white uppercase tracking-wider">CITEMAS</span> stands for <span className="text-white font-medium">College of Information Technology Education — Multimedia Arts Studio</span>.
            </p>
            <p className="text-sm leading-relaxed text-[#86868b]">
              This organization was built after Ilonggo Animation called <span className="text-white font-semibold">“PIKYAW”</span> in 2014, founded by our CITE Program Head, <span className="text-white font-semibold">Dr. Arnold M. Fuentes</span>, and CITE Dean <span className="text-white font-semibold">Seth dA. Nono</span>.
            </p>
            <p className="text-sm leading-relaxed text-[#86868b]">
              In our organization, we support and guide the students of <span className="text-white font-semibold">PHINMA University of Iloilo</span> to showcase, enhance, and improve their skills in Multimedia Arts.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {[
              ['2014', 'Founded from the creative roots of PIKYAW', '01'],
              ['CITE', 'Built for student growth in tech and media', '02'],
              ['STUDIO', 'Digital storytelling and traditional arts', '03'],
              ['ORG', 'A campus platform to sharpen creative craft', '04'],
            ].map(([title, text, num]) => (
              <BracketPanel
                key={title}
                cornerColor="text-white/20"
                bg="bg-[#111111]"
                border="border-white/[0.08]"
                className="plate-corner p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[#02d2e3]">
                  <span>TAG_{num}</span>
                  <span>//</span>
                </div>
                <div className="my-3">
                  <div className="text-3xl font-display font-bold text-white tracking-tight">{title}</div>
                  <div className="mt-1 text-xs text-[#86868b] leading-relaxed">{text}</div>
                </div>
              </BracketPanel>
            ))}
          </div>
        </div>

        {/* Studio Pillars */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <BracketPanel
              key={p.title}
              cornerColor="text-white/20 hover:text-[#DC2626]"
              bg="bg-[#111111]/80 hover:bg-[#151515]"
              border="border-white/[0.08]"
              className="space-y-4 p-7 plate-corner"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[10px] font-mono text-white/30">{p.code}</span>
              </div>
              <h3 className="font-display font-bold uppercase text-xl tracking-tight text-white">{p.title}</h3>
              <p className="text-xs leading-relaxed text-[#86868b]">{p.desc}</p>
            </BracketPanel>
          ))}
        </div>
      </section>

      {/* FEATURED PORTFOLIO SHOWCASE (12-Column Grid, Full Bleed Editorial Cards) */}
      <section className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#02d2e3]" />
              <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#02d2e3]">
                CURATED EXHIBITS
              </p>
            </div>
            <h2 className="mt-3 font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
              FEATURED MEMBER WORK.
            </h2>
          </div>
          <EditorialButton href="/portfolio" variant="outline">
            Open Gallery
          </EditorialButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolioSpotlights.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/10 bg-[#111111]/50 p-12 text-center plate-corner space-y-4">
              <p className="text-sm font-space text-[#86868b]">
                No featured projects yet in the gallery. Submit your first piece to enter the curated showcase!
              </p>
              <EditorialButton href="/portfolio" variant="primary">
                Submit Portfolio Piece
              </EditorialButton>
            </div>
          ) : (
            portfolioSpotlights.map((item) => (
              <div
                key={item.title}
                className="group relative bg-[#111111] border border-white/[0.08] hover:border-white/20 plate-corner overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-64 overflow-hidden border-b border-white/[0.08]">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#18181b] flex items-center justify-center text-white/20 font-mono text-xs">
                      [NO_PREVIEW]
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-widest bg-black/70 backdrop-blur-md text-[#02d2e3] border border-white/10">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-display font-bold uppercase text-2xl text-white tracking-tight group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-[#86868b]">
                      BY {item.creator}
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed text-[#86868b] line-clamp-2">
                    {item.summary}
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/portfolio"
                      className="inline-flex items-center gap-2 text-xs font-space font-bold uppercase tracking-wider text-red-400 group-hover:text-red-300 transition-colors"
                    >
                      <span>Inspect Artwork</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* RECENT ACHIEVEMENTS (12-Column Grid) */}
      <section id="achievements" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-amber-400" />
              <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-amber-300">
                HONORS & MERIT
              </p>
            </div>
            <h2 className="mt-3 font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
              RECENT ACHIEVEMENTS.
            </h2>
            <p className="mt-2 text-sm text-[#86868b] max-w-xl">
              Celebrating awards, competition wins, and recognized creative milestones achieved by CITEMAS members.
            </p>
          </div>
          <EditorialButton href="/portfolio" variant="outline">
            View All Honors
          </EditorialButton>
        </div>

        {achievementsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 plate-corner border border-white/[0.06] bg-[#111111] p-6 animate-pulse" />
            ))}
          </div>
        ) : achievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="plate-corner border border-dashed border-white/10 bg-[#111111]/60 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Award size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold uppercase text-2xl text-white">NO RECENT HONORS LOGGED YET</h3>
              <p className="text-xs text-[#86868b] max-w-md mx-auto">
                Showcase your accomplishments by adding your first achievement in the portfolio section.
              </p>
            </div>
            <EditorialButton href="/portfolio" variant="primary">
              Post First Achievement
            </EditorialButton>
          </div>
        )}
      </section>

      {/* SPECIALIZATIONS */}
      <section id="specializations" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-12 text-center space-y-2">
          <p className="text-[11px] font-space font-bold uppercase tracking-[0.28em] text-[#DC2626]">
            STUDIO DISCIPLINES
          </p>
          <h2 className="font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
            SPECIALIZATIONS.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#86868b]">
            Six core tracks we train, mentor, and build with. Every member picks a path and grows with it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALIZATIONS.map((spec) => (
            <SpecializationCard key={spec.key} spec={spec} />
          ))}
        </div>
      </section>

      {/* EXECUTIVE OFFICERS (12-Column Grid) */}
      <section id="officers" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#DC2626]" />
              <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#DC2626]">
                LEADERSHIP COHORT
              </p>
            </div>
            <h2 className="mt-3 font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
              EXECUTIVE COUNCIL.
            </h2>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 py-2 text-[10px] font-space font-bold uppercase tracking-widest text-[#86868b] transition-all hover:border-white/40 hover:text-white"
          >
            <span>Roster Directory</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {current ? (
            <>
              {/* Featured Officer Stage (Spans 7 cols) */}
              <div className="lg:col-span-7 bg-[#111111] border border-white/[0.08] plate-corner p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />
                <div className="absolute top-0 right-0 h-40 w-40 bg-[radial-gradient(circle,rgba(220,38,38,0.2),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between pb-6 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 border border-amber-400/20 bg-amber-400/5">
                    <span>👑</span>
                    <span>{current.role}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {featuredOfficers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveIdx(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeIdx === idx
                            ? 'w-6 bg-[#DC2626]'
                            : 'w-2 bg-white/20 hover:bg-white/40'
                        }`}
                        aria-label={`Officer ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative z-10 my-8 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-[28px] overflow-hidden bg-black border border-white/20">
                    <img src={current.image} alt={current.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-[10px] font-mono tracking-[0.2em] text-[#02d2e3] uppercase">
                      ● ACTIVE EXECUTIVE SEAT
                    </p>
                    <h3 className="font-display font-bold uppercase text-3xl sm:text-4xl text-white tracking-tight">
                      {current.name}
                    </h3>
                    <p className="text-xs font-space text-[#86868b] font-medium">
                      PHINMA University of Iloilo — Multimedia Arts Studio
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/[0.08] text-[10px] font-mono uppercase text-[#86868b]">
                  <span>✨ CITEMAS BOARD</span>
                  <span>
                    0{activeIdx + 1} / 0{featuredOfficers.length}
                  </span>
                </div>
              </div>

              {/* Council List (Spans 5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <BracketPanel
                  cornerColor="text-white/20"
                  bg="bg-[#111111]"
                  border="border-white/[0.08]"
                  className="plate-corner p-6"
                >
                  <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#DC2626]">
                    BOARD ASSIGNMENTS
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {supportOfficers.length ? (
                      supportOfficers.map((officer) => (
                        <div
                          key={`${officer.role}-${officer.name}`}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            current.role.toLowerCase() === officer.role.toLowerCase()
                              ? 'border-red-500/40 bg-red-500/10'
                              : 'border-white/[0.06] bg-black/40 hover:border-white/15'
                          }`}
                        >
                          <span className="text-[10px] font-mono uppercase text-amber-300">{officer.role}</span>
                          <span className="text-right text-xs font-space font-bold text-white">{officer.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#86868b]">Roster assignments updating.</div>
                    )}
                  </div>
                </BracketPanel>

                <BracketPanel
                  cornerColor="text-white/20"
                  bg="bg-[#111111]"
                  border="border-white/[0.08]"
                  className="plate-corner p-6"
                >
                  <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#02d2e3]">
                    YEAR REPRESENTATIVES
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {yearReps.length ? (
                      yearReps.map((rep) => (
                        <div
                          key={`${rep.role}-${rep.name}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-black/40"
                        >
                          <span className="text-[10px] font-mono uppercase text-amber-300">{rep.role}</span>
                          <span className="text-right text-xs font-space font-bold text-white">{rep.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#86868b]">Representatives updating.</div>
                    )}
                  </div>
                </BracketPanel>
              </div>
            </>
          ) : (
            <div className="col-span-full plate-corner border border-dashed border-white/10 bg-[#111111] p-12 text-center text-[#86868b]">
              Officer roster updating.
            </div>
          )}
        </div>
      </section>

      {/* UPCOMING EVENTS ROW (12-Column Grid) */}
      <section id="events" className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8 relative z-10">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#DC2626]" />
              <p className="text-[11px] font-space font-bold uppercase tracking-[0.24em] text-[#DC2626]">
                LIVE CALENDAR
              </p>
            </div>
            <h2 className="mt-3 font-display font-bold uppercase text-[clamp(2rem,5vw,4rem)] leading-none text-white">
              UPCOMING EVENTS.
            </h2>
          </div>
          <EditorialButton href="/events" variant="outline">
            Full Schedule
          </EditorialButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.length === 0 ? (
            <div className="col-span-full border border-dashed border-white/10 bg-[#111111]/50 p-12 text-center plate-corner space-y-2">
              <p className="font-display font-bold uppercase text-2xl text-white">NO LIVE SPRINT ANNOUNCED</p>
              <p className="text-xs text-[#86868b]">Check back soon as new campus exhibitions are announced.</p>
            </div>
          ) : (
            upcomingEvents.map((e) => (
              <div
                key={e.title}
                className="group bg-[#111111] border border-white/[0.08] hover:border-white/20 plate-corner overflow-hidden flex flex-col justify-between transition-all duration-300"
              >
                <div className="overflow-hidden border-b border-white/[0.08] h-52 relative">
                  {e.image && (
                    <img
                      src={e.image}
                      alt={e.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="space-y-4 p-6">
                  <h3 className="font-display font-bold uppercase text-2xl text-white group-hover:text-red-400 transition-colors">
                    {e.title}
                  </h3>
                  <div className="space-y-1 text-xs font-mono text-[#86868b]">
                    <p>📅 {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p>📍 {e.location}</p>
                  </div>
                  <EditorialButton href="/events" variant="outline" className="w-full">
                    View Details
                  </EditorialButton>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
