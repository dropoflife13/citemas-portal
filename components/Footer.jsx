'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer" className="mt-auto border-t border-white/10 bg-[#070305] text-slate-100 relative z-10 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12 pt-16 pb-10 space-y-12">
        {/* Top: Massive Typographic Statement */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>EST. 2014 // PHINMA UNIVERSITY OF ILOILO</span>
          </div>

          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-black uppercase tracking-tighter text-white leading-[0.88]">
            KEEP PUSHING{' '}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-white lowercase tracking-normal">
              forward.
            </span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-xl font-light leading-relaxed">
            The premier creative and multimedia arts studio at PHINMA University of Iloilo. Uniting digital artists, animators, sculptors, and traditional creators.
          </p>
        </div>

        {/* Middle: Editorial Grid with Crisp 1px Borders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-t border-b border-white/10">
          {/* Col 1: Studio Hub */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
              01 // STUDIO
            </span>
            <div className="flex flex-col space-y-2 text-xs font-mono uppercase tracking-wider">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                Overview
              </Link>
              <Link href="/events" className="text-slate-300 hover:text-white transition-colors">
                Events &amp; Exhibits
              </Link>
              <Link href="/portfolio" className="text-slate-300 hover:text-white transition-colors">
                Portfolio Showcase
              </Link>
              <Link href="/users" className="text-slate-300 hover:text-white transition-colors">
                Member Directory
              </Link>
            </div>
          </div>

          {/* Col 2: Creative Tracks */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
              02 // DISCIPLINES
            </span>
            <div className="flex flex-col space-y-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span className="hover:text-red-400 transition-colors cursor-default">Digital Arts</span>
              <span className="hover:text-red-400 transition-colors cursor-default">3D Animation</span>
              <span className="hover:text-red-400 transition-colors cursor-default">Videography</span>
              <span className="hover:text-red-400 transition-colors cursor-default">Photography</span>
            </div>
          </div>

          {/* Col 3: Community */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
              03 // ORG
            </span>
            <div className="flex flex-col space-y-2 text-xs font-mono uppercase tracking-wider">
              <Link href="/applications" className="text-slate-300 hover:text-white transition-colors">
                Apply for Org
              </Link>
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                Member Sign In
              </Link>
              <Link href="/register" className="text-slate-300 hover:text-white transition-colors">
                New Registration
              </Link>
            </div>
          </div>

          {/* Col 4: Location & Status */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">
              04 // LOCATION
            </span>
            <div className="space-y-1.5 text-xs font-mono text-slate-400">
              <p className="text-white">PHINMA University of Iloilo</p>
              <p>College of Information Tech.</p>
              <p className="text-red-400 pt-1">STATUS: ORG ACTIVE</p>
            </div>
          </div>
        </div>

        {/* Bottom: Technical Labels in a Single Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 pt-2">
          <span>&copy; {new Date().getFullYear()} CITEMAS STUDIO // ALL RIGHTS RESERVED</span>
          <span>INFO@CITEMAS.ORG • 10&deg;42&apos;N 122&deg;34&apos;E</span>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GITHUB
            </a>
            <span>•</span>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              INSTAGRAM
            </a>
            <span>•</span>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              LINKEDIN
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
