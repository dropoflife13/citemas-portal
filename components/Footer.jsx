import Link from 'next/link';

const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253,251,247,0.7)';

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t border-white/[0.08] bg-gradient-to-t from-[#070305]/95 via-[#0c0407]/80 to-transparent backdrop-blur-2xl py-14 text-xs relative z-20 shadow-[0_-20px_50px_rgba(220,38,38,0.06)]"
      style={{ color: MUTED }}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <img
                src="/logo.png"
                alt="CITEMAS Logo"
                className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(217,41,41,0.5)]"
              />
            </div>
            <span
              className="text-sm font-black tracking-[-0.04em]"
              style={{ color: CITEMAS_CREAM, fontFamily: 'Fraunces, Georgia, serif' }}
            >
              CITEMAS
            </span>
          </div>
          <p className="leading-relaxed text-slate-400">
            College of Information Technology Education — Creative Guild & Multimedia Arts Studio at PHINMA University of Iloilo.
          </p>
        </div>

        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white">
            Quick Links
          </p>
          <div className="flex flex-col space-y-2.5">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link href="/events" className="text-slate-400 hover:text-white transition-colors">Events & Exhibits</Link>
            <Link href="/users" className="text-slate-400 hover:text-white transition-colors">Members Directory</Link>
            <Link href="/portfolio" className="text-slate-400 hover:text-white transition-colors">Student Portfolios</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white">
            Guild Disciplines
          </p>
          <div className="flex flex-col space-y-2.5 text-slate-400">
            <span className="hover:text-red-400 transition-colors cursor-default">Digital Arts & 3D</span>
            <span className="hover:text-red-400 transition-colors cursor-default">Traditional Illustration</span>
            <span className="hover:text-red-400 transition-colors cursor-default">Videography & Sound</span>
            <span className="hover:text-red-400 transition-colors cursor-default">Photography & Design</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white">
            Campus Studio
          </p>
          <p className="text-slate-400">📍 PHINMA University of Iloilo</p>
          <p className="text-slate-400">✉️ info@citemas.org</p>
          <div className="pt-2 text-[11px] text-slate-500">
            © {new Date().getFullYear()} CITEMAS. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
