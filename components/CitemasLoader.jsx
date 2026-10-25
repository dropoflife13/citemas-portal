'use client';

export default function CitemasLoader({
  label = 'Loading CITEMAS Studio...',
  fullScreen = true,
  size = 'md',
}) {
  const isSmall = size === 'sm';

  const content = (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      <div className={`relative flex items-center justify-center ${isSmall ? 'h-14 w-14' : 'h-20 w-20'}`}>
        {/* Ambient Pulsing Crimson Halo */}
        <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl animate-pulse" />

        {/* Outer Rotating Orbital Ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-red-500/15 border-t-red-600 border-r-orange-500/70 animate-spin ${
            isSmall ? 'border-[2px]' : 'border-[2.5px]'
          }`}
        />

        {/* Secondary Subtle Counter-Ring */}
        <div className="absolute inset-1.5 rounded-full border border-white/10 dark:border-white/10" />

        {/* Official CITEMAS Logo Mark */}
        <img
          src="/logo.png"
          alt="CITEMAS"
          className={`${
            isSmall ? 'h-7 w-7' : 'h-10 w-10'
          } object-contain drop-shadow-[0_0_14px_rgba(220,38,38,0.65)] animate-pulse`}
        />
      </div>

      {label && (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600 dark:text-red-200/80">
            {label}
          </p>
        </div>
      )}
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {content}
    </div>
  );
}

