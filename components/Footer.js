import Link from 'next/link';

const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253,251,247,0.65)';
const FAINT = 'rgba(253,251,247,0.35)';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0c0505] text-xs py-12 mt-auto" style={{ color: MUTED }}>
      <div className="mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{ background: CITEMAS_RED, color: CITEMAS_CREAM }}
            >
              C
            </div>
            <span className="font-bold text-sm" style={{ color: CITEMAS_CREAM }}>
              CITEMAS
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: FAINT }}>
            College of Technology Education - Multimedia Arts Studio at PHINMA University of Iloilo.
          </p>
        </div>

        <div>
          <p className="font-semibold mb-3 text-sm" style={{ color: CITEMAS_CREAM }}>
            Quick Links
          </p>
          <div className="space-y-2 flex flex-col">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            <Link href="/members" className="hover:text-white transition-colors">Members</Link>
            <Link href="/portfolio" className="hover:text-white transition-colors">Portfolio</Link>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-3 text-sm" style={{ color: CITEMAS_CREAM }}>
            Resources
          </p>
          <div className="space-y-2 flex flex-col">
            <a href="#" className="hover:text-white transition-colors">Tutorials</a>
            <a href="#" className="hover:text-white transition-colors">Gallery</a>
            <a href="#" className="hover:text-white transition-colors">FAQs</a>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-semibold mb-3 text-sm" style={{ color: CITEMAS_CREAM }}>
            Contact Info
          </p>
          <p>📍 PHINMA University of Iloilo, Philippines</p>
          <p>✉️ info@citemas.org</p>
        </div>
      </div>
    </footer>
  );
}