'use client';

import { usePathname } from 'next/navigation';

export default function Background() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  // Landing page manages its own Starry-to-Grid scroll transition
  if (isLandingPage) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#090a0b]">
      {/* Subtle Ambient Red Glow at top-left */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-red-600/10 blur-[150px] pointer-events-none" />

      {/* 64px Faint Technical Blueprint Grid (App Pages) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Subtle Vignette Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(9,10,11,0.65)_100%)]" />
    </div>
  );
}
