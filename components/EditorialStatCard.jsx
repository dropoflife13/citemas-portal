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
      cornerColor="text-white/30 group-hover:text-red-500 transition-colors"
      bg="bg-[#111111]/80 hover:bg-[#161616]"
      border="border-white/[0.08] hover:border-white/[0.16]"
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between text-[10px] font-space font-semibold uppercase tracking-widest text-[#86868b]">
          <span>{label}</span>
          {code && <span className="text-white/30 font-mono">{code}</span>}
        </div>

        <div className="text-4xl sm:text-5xl font-display font-bold tracking-[-0.08em] text-white leading-none group-hover:text-red-400 transition-colors">
          {value}
        </div>
      </div>
    </BracketPanel>
  );
}

