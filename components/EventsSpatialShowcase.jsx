'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, History, Users, Image as ImageIcon, MapPin } from 'lucide-react';

const gradients = [
  'radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.45) 0%, rgba(127, 29, 29, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
  'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.4) 0%, rgba(180, 83, 9, 0.2) 50%, rgba(10, 4, 4, 0.98) 90%)',
  'radial-gradient(circle at 50% 20%, rgba(153, 27, 27, 0.5) 0%, rgba(88, 28, 28, 0.25) 50%, rgba(10, 4, 4, 0.98) 90%)',
];

const glowColors = ['#DC2626', '#F59E0B', '#991B1B'];

export default function EventsSpatialShowcase({ token }) {
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
    return (
      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Archives</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Past Events</h2>
        </div>
        <div
          className="mx-auto h-[460px] w-full max-w-3xl animate-pulse rounded-[28px] border border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          }}
        />
      </section>
    );
  }

  if (pastEvents.length === 0) {
    return (
      <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Archives</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Past Events</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[rgba(248,242,236,0.72)]">
            A look back at what CITEMAS has done.
          </p>
        </div>
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-[rgba(248,242,236,0.6)]">
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

  return (
    <section className="mx-auto max-w-7xl border-t border-white/10 px-6 py-20 sm:px-8">
      <div className="mb-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Archives</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#F8F2EC] sm:text-4xl">Past Events</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[rgba(248,242,236,0.72)]">
          A look back at what CITEMAS has done.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto max-w-3xl"
        aria-label="Past events showcase"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') prev();
          if (e.key === 'ArrowRight') next();
        }}
      >
        <div
          className="relative w-full h-[460px] rounded-2xl p-7 transition-all duration-1000 ease-out transform-gpu overflow-hidden flex flex-col justify-between shrink-0"
          style={{
            background: currentGradient,
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: `
              0 30px 70px -10px rgba(0, 0, 0, 0.8),
              0 0 60px ${currentGlow}25,
              inset 0 1px 2px 0 rgba(255, 255, 255, 0.4)
            `,
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full opacity-40 blur-[80px] transition-all duration-1000"
            style={{ background: currentGlow }}
          />

          <div className="relative z-20 flex items-center justify-between shrink-0 h-9">
            <div
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300 border border-white/20 backdrop-blur-2xl"
              style={{ background: 'rgba(0, 0, 0, 0.45)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
            >
              <History size={12} />
              <span>PAST EVENT</span>
            </div>

            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-red-200 border border-white/20 backdrop-blur-2xl"
              style={{ background: 'rgba(0, 0, 0, 0.45)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }}
            >
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>{eventYear}</span>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center my-auto">
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full overflow-hidden text-2xl transition-transform duration-700 ease-out hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(220,38,38,0.25) 100%)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: `
                  0 15px 35px rgba(0,0,0,0.6),
                  inset 0 2px 4px rgba(255,255,255,0.5),
                  0 0 35px ${currentGlow}40
                `,
              }}
            >
              {img ? (
                <img src={img} alt={current.title} className="h-full w-full object-cover" />
              ) : (
                <Calendar size={32} strokeWidth={1.5} className="text-red-400/60" />
              )}
            </div>

            <div className="mt-4 h-24 max-w-xs flex flex-col justify-center transition-all duration-500">
              <h3 className="text-2xl font-black text-[#FDFBF7] tracking-tight drop-shadow-md line-clamp-1">
                {current.title}
              </h3>
              <p className="mt-1 text-xs text-[#FDFBF7]/80 font-medium leading-relaxed line-clamp-2">
                {current.description}
              </p>
            </div>

            {slides.length > 0 && (
              <div className="mt-2 h-12 flex items-center justify-center gap-8 border-t border-white/10 pt-2 w-full max-w-xs shrink-0">
                {slides.map((st) => {
                  const Icon = st.icon;
                  return (
                    <div key={st.label} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Icon size={14} className="text-red-400/70" />
                        <p className="text-base font-black text-[#F59E0B] drop-shadow-sm leading-none">{st.value}</p>
                      </div>
                      <p className="text-[9px] font-extrabold tracking-widest text-[#FDFBF7]/60 uppercase mt-1">{st.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10 shrink-0 h-10">
            <div
              className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-[#FDFBF7]/80 border border-white/15"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <Calendar size={10} className="inline mr-1" />
              HELD {formattedDate} • {current.location}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-300 tracking-widest uppercase">
                0{activeIdx + 1} / 0{pastEvents.length}
              </span>
              {pastEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    activeIdx === idx
                      ? 'w-6 bg-[#DC2626] shadow-[0_0_12px_#DC2626]'
                      : 'w-2 bg-white/25 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.05] p-2 text-[#F8F2EC] hover:bg-white/[0.1] hover:text-red-400 transition-all"
            aria-label="Previous event"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.05] p-2 text-[#F8F2EC] hover:bg-white/[0.1] hover:text-red-400 transition-all"
            aria-label="Next event"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
