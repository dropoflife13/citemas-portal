import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-[var(--background)] px-6 py-16 text-[var(--foreground)] bg-grid-faint">
      <div className="w-full max-w-xl border border-[var(--line)] bg-[var(--card-bg)] p-8 sm:p-12 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-red-600 dark:text-red-400">
          SIGNAL LOST // 404
        </p>
        <h1 className="font-display mt-3 text-7xl sm:text-8xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
          404
        </h1>
        <p className="mt-4 font-sans text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          The CITEMAS Portal route you requested could not be found or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Return Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-black/15 dark:border-white/15 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
