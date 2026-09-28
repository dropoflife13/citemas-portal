'use client';

export default function SpecializationCard({ spec }) {
  const { Icon, label, description, tags, accent } = spec;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border
                 border-white/10 bg-white/[0.02] p-6
                 transition-all duration-300
                 hover:-translate-y-1 hover:border-white/20"
      style={{
        boxShadow: `0 0 0 1px ${accent}00, 0 20px 40px -15px ${accent}40`,
      }}
    >
      {/* Accent glow behind card on hover */}
      <div
        className="pointer-events-none absolute -top-16 -right-16
                   h-40 w-40 rounded-full opacity-0 blur-3xl
                   transition-opacity duration-500
                   group-hover:opacity-30"
        style={{ background: accent }}
      />

      <div className="relative z-10">
        <div
          className="flex h-12 w-12 items-center justify-center
                     rounded-xl border border-white/10
                     bg-white/[0.03]"
          style={{ color: accent }}
        >
          <Icon size={24} strokeWidth={1.75} />
        </div>

        <h3 className="mt-5 text-lg font-black text-white">
          {label}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10
                         bg-white/[0.03] px-2.5 py-1
                         text-[9px] font-black uppercase
                         tracking-[0.15em] text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
