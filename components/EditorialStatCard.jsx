'use client';

import BracketPanel from './BracketPanel';

/**
 * EditorialStatCard — The "Instrument Panel" Stat from Kimi Reference
 * Massive Oswald figure with tracking -0.08em and precise L-bracket corners
 */
export default function EditorialStatCard({
  value,
  label,
  code = '',
  className = '',
}) {
  return (
    <BracketPanel
      className={`group overflow-hidden ${className}`}
      cornerColor="text-black/30 dark:text-white/30 group-hover:text-red-500 transition-colors"
      bg="bg-[var(--card-bg)]/80 dark:bg-[#111111]/80 hover:bg-black/[0.04] dark:hover:bg-[#161616]"
      border="border-black/10 dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/[0.16]"
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between text-[10px] font-space font-semibold uppercase tracking-widest text-slate-500 dark:text-[#86868b]">
          <span>{label}</span>
          {code && <span className="text-slate-400 dark:text-white/30 font-mono">{code}</span>}
        </div>

        <div className="text-4xl sm:text-5xl font-display font-bold tracking-[-0.08em] text-slate-900 dark:text-white leading-none group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
          {value}
        </div>
      </div>
    </BracketPanel>
  );
}

