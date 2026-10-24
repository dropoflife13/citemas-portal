'use client';

/**
 * LivePing — Small accent dot with radiating pulse for active telemetry / live states
 */
export default function LivePing({
  color = 'bg-[#DC2626]',
  pingColor = 'bg-[#DC2626]',
  label = '',
  className = '',
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
      </span>
      {label && (
        <span className="text-[10px] font-space font-bold uppercase tracking-[0.2em] text-white/80">
          {label}
        </span>
      )}
    </span>
  );
}

