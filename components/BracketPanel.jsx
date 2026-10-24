'use client';

/**
 * BracketPanel — Inspired by Kimi Antonelli / GRIDO1 Racing Systems
 * Draws four precise 10x10 L-shaped corner strokes at the four corners of the container.
 */
export default function BracketPanel({
  children,
  className = '',
  cornerColor = 'text-white/40',
  cornerSize = 10,
  bg = 'bg-[#111111]',
  border = 'border-white/[0.08]',
}) {
  return (
    <div
      className={`relative p-6 sm:p-7 transition-all duration-300 border ${border} ${bg} ${className}`}
    >
      {/* Top-Left Corner */}
      <svg
        className={`absolute -top-[1px] -left-[1px] pointer-events-none ${cornerColor}`}
        width={cornerSize}
        height={cornerSize}
        viewBox="0 0 10.5 10.5"
        fill="none"
      >
        <path d="M10 0.5H0.5V10" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Top-Right Corner */}
      <svg
        className={`absolute -top-[1px] -right-[1px] pointer-events-none ${cornerColor}`}
        width={cornerSize}
        height={cornerSize}
        viewBox="0 0 10.5 10.5"
        fill="none"
      >
        <path d="M0 0.5H9.5V10" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Bottom-Left Corner */}
      <svg
        className={`absolute -bottom-[1px] -left-[1px] pointer-events-none ${cornerColor}`}
        width={cornerSize}
        height={cornerSize}
        viewBox="0 0 10.5 10.5"
        fill="none"
      >
        <path d="M10 9.5H0.5V0" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Bottom-Right Corner */}
      <svg
        className={`absolute -bottom-[1px] -right-[1px] pointer-events-none ${cornerColor}`}
        width={cornerSize}
        height={cornerSize}
        viewBox="0 0 10.5 10.5"
        fill="none"
      >
        <path d="M0 9.5H9.5V0" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

