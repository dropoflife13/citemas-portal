import Link from 'next/link';

const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253,251,247,0.65)';
const FAINT = 'rgba(253,251,247,0.35)';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0b0505] py-12 text-xs" style={{ color: MUTED }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black" style={{ background: 'linear-gradient(135deg, #d92929 0%, #7a1111 100%)', color: CITEMAS_CREAM }}>
              C
            </div>
            <span className="text-sm font-black tracking-[-0.04em]" style={{ color: CITEMAS_CREAM, fontFamily: 'Fraunces, Georgia, serif' }}>
              CITEMAS
            </span>
          </div>
          <p className="leading-relaxed text-[rgba(248,242,236,0.42)]">
            College of Technology Education - Multimedia Arts Studio at PHINMA University of Iloilo.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: CITEMAS_CREAM }}>
            Quick Links
          </p>
          <div className="flex flex-col space-y-2">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <Link href="/events" className="transition-colors hover:text-white">Events</Link>
            <Link href="/users" className="transition-colors hover:text-white">Members</Link>
            <Link href="/portfolio" className="transition-colors hover:text-white">Portfolio</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: CITEMAS_CREAM }}>
            Resources
          </p>
          <div className="flex flex-col space-y-2">
            <a href="#" className="transition-colors hover:text-white">Tutorials</a>
            <a href="#" className="transition-colors hover:text-white">Gallery</a>
            <a href="#" className="transition-colors hover:text-white">FAQs</a>
          </div>
        </div>

        <div className="space-y-2">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: CITEMAS_CREAM }}>
            Contact
          </p>
          <p className="text-[rgba(248,242,236,0.5)]">📍 PHINMA University of Iloilo</p>
          <p className="text-[rgba(248,242,236,0.5)]">✉️ info@citemas.org</p>
        </div>
      </div>
    </footer>
  );
}