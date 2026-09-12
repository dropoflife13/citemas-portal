// components/background.js
'use client';

export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070202]">
      {/* Deep Rich Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.32),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.38),transparent_40%),linear-gradient(180deg,#120505_0%,#090202_45%,#050101_100%)]" />

      {/* Floating Organic Glowing Orbs with Smooth Drift Animation */}
      <div className="absolute left-[-10%] top-[-10%] h-[550px] w-[550px] rounded-full bg-red-600/25 blur-[160px] animate-[floatOrb_8s_ease-in-out_infinite]" />
      <div className="absolute right-[-15%] top-[15%] h-[680px] w-[680px] rounded-full bg-amber-500/12 blur-[190px] animate-[floatOrb_12s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-[-15%] left-[15%] h-[520px] w-[520px] rounded-full bg-red-950/40 blur-[170px] animate-[floatOrb_10s_ease-in-out_infinite_2s]" />

      {/* High-Tech Blueprint Grid with Soft Mask Fade */}
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Dynamic Diagonal Light Sweep */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(245,158,11,0.08)_40%,rgba(220,38,38,0.08)_55%,transparent_100%)] animate-pulse [animation-duration:6s]" />

      {/* Cinematic Vignette & Deep Shadow Edges */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#1a0505]/90 via-[#0a0202]/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(5,1,1,0.45)_65%,rgba(3,0,0,0.92)_100%)]" />

      {/* Custom Keyframes for Ambient Floating */}
      <style jsx>{`
        @keyframes floatOrb {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(35px, -45px) scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}