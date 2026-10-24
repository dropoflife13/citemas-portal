'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, History, Users, Image as ImageIcon, MapPin } from 'lucide-react';

const gradients = [
  'radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.45) 0%, rgba(127, 29, 29, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
  'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.4) 0%, rgba(180, 83, 9, 0.2) 50%, rgba(10, 4, 4, 0.98) 90%)',
  'radial-gradient(circle at 50% 20%, rgba(153, 27, 27, 0.5) 0%, rgba(88, 28, 28, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
];

const glowColors = ['#DC2626', '#F59E0B', '#991B1B'];

export default function EventsSpatialShowcase({ token, isHero = true }) {
  const [pastEvents, setPastEvents] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch('/api/events', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const eventsList = Array.isArray(data) ? data : [];
        const past = eventsList
          .filter((e) => e.isPast || new Date(e.date) < new Date())
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        setPastEvents(past);
        setActiveIdx(0);
      })
      .catch(() => setPastEvents([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!pastEvents.length || loading) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActiveIdx((prev) => (prev + 1) % pastEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [pastEvents.length, loading]);

  const current = pastEvents[activeIdx];
  const gradientIdx = (activeIdx % gradients.length);
  const currentGradient = gradients[gradientIdx];
  const currentGlow = glowColors[gradientIdx];

  if (loading) {
    if (isHero) {
      return (
        <div
          className="mx-auto h-[460px] w-full max-w-xl animate-pulse rounded-[28px] border border-white/[0.08] bg-[#000000]"
        />
      );
    }
    return (
      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Archives</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Past Events</h2>
        </div>
        <div
          className="mx-auto h-[460px] w-full max-w-3xl animate-pulse rounded-[28px] border border-white/[0.08] bg-[#000000]"
        />
      </section>
    );
  }

  if (pastEvents.length === 0) {
    if (isHero) {
      return (
        <div className="rounded-[28px] border border-white/[0.08] bg-[#000000] p-12 text-center text-[#86868b] text-sm">
          No event history yet. Past events will appear here once archived.
        </div>
      );
    }
    return (
      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Archives</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Past Events</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#86868b]">
            A look back at what CITEMAS has done.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/[0.08] bg-[#000000] p-12 text-center text-[#86868b]">
          No event history yet. Past events will appear here once they are archived.
        </div>
      </section>
    );
  }

  const img = current.image || (current.images && current.images[0]) || '';
  const evtDate = new Date(current.date);
  const formattedDate = evtDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const formattedFullDate = evtDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const eventYear = evtDate.getFullYear();
  const slides = [
    { value: current.attendeeCount, label: 'ATTENDEES', icon: Users },
    { value: img ? current.images?.length || 1 : 0, label: 'PHOTOS', icon: ImageIcon },
    { value: current.capacity, label: 'CAPACITY', icon: MapPin },
  ].filter((s) => s.value && s.value > 0);

  const prev = () => setActiveIdx((p) => (p === 0 ? pastEvents.length - 1 : p - 1));
  const next = () => setActiveIdx((p) => (p + 1) % pastEvents.length);

  const stageCard = (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-3xl"
      aria-label="Past events showcase"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
    >
      <div
        className="relative w-full h-[460px] rounded-[28px] p-7 transition-all duration-700 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0 bg-[#000000] border border-white/[0.08]"
        style={{
          boxShadow: `
            0 30px 70px -10px rgba(0, 0, 0, 0.9),
            0 0 50px ${currentGlow}20,
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)
          `,
        }}
      >
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-30 blur-[80px] transition-all duration-1000"
          style={{ background: currentGlow }}
        />

        <div className="relative z-20 flex items-center justify-between shrink-0 h-9">
          <div
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-white/10 bg-white/[0.04] backdrop-blur-2xl"
          >
            <History size={12} />
            <span>PAST EVENT</span>
          </div>

          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80 border border-white/10 bg-white/[0.04] backdrop-blur-2xl"
          >
            <div className="h-2 w-2 rounded-full bg-[#DC2626]" />
            <span>{eventYear}</span>
          </div>
        </div>

        {/* Central Stage: Pure Black Background & 28px Rounded Corners */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto">
          <div
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-[28px] overflow-hidden bg-[#000000] border border-white/15 shadow-2xl transition-transform duration-700 ease-out hover:scale-105"
            style={{
              boxShadow: `0 20px 40px rgba(0,0,0,0.8), 0 0 30px ${currentGlow}30, inset 0 1px 1px rgba(255,255,255,0.2)`,
            }}
          >
            {img ? (
              <img src={img} alt={current.title} className="h-full w-full object-cover" />
            ) : (
              <Calendar size={36} strokeWidth={1.5} className="text-red-500/80" />
            )}
          </div>

          <div className="mt-4 h-24 max-w-xs flex flex-col justify-center transition-all duration-500">
            <h3 className="text-2xl font-bold font-serif tracking-[-0.02em] text-[#f5f5f7] drop-shadow-md line-clamp-1">
              {current.title}
            </h3>
            <p className="mt-1.5 text-xs text-[#86868b] font-normal leading-relaxed line-clamp-2">
              {current.description}
            </p>
          </div>

          {slides.length > 0 && (
            <div className="mt-2 h-12 flex items-center justify-center gap-8 border-t border-white/[0.06] pt-2 w-full max-w-xs shrink-0">
              {slides.map((st) => {
                const Icon = st.icon;
                return (
                  <div key={st.label} className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Icon size={14} className="text-red-400/80" />
                      <p className="text-base font-bold text-[#f5f5f7] leading-none">{st.value}</p>
                    </div>
                    <p className="text-[9px] font-semibold tracking-widest text-[#86868b] uppercase mt-1">{st.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/[0.06] shrink-0 h-10">
          <div
            className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#86868b] border border-white/[0.08] bg-white/[0.03]"
          >
            <Calendar size={10} className="inline mr-1 text-red-400" />
            HELD {formattedDate} • {current.location}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[#86868b] tracking-widest uppercase">
              0{activeIdx + 1} / 0{pastEvents.length}
            </span>
            {pastEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeIdx === idx
                    ? 'w-6 bg-[#DC2626] shadow-[0_0_10px_#DC2626]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/80 hover:bg-white/[0.12] hover:text-white transition-all cursor-pointer"
          aria-label="Previous event"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/80 hover:bg-white/[0.12] hover:text-white transition-all cursor-pointer"
          aria-label="Next event"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  if (isHero) {
    return stageCard;
  }

  return (
    <section className="mx-auto max-w-7xl border-t border-white/[0.06] px-6 py-20 sm:px-8">
      <div className="mb-12 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#DC2626]">Archives</p>
        <h2 className="mt-3 text-3xl font-serif tracking-[-0.03em] text-[#f5f5f7] sm:text-4xl">Past Events</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#86868b]">
          A look back at what CITEMAS has done.
        </p>
      </div>
      {stageCard}
    </section>
  );
}
