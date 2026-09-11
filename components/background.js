// components/background.js
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#120707]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.5),transparent_24%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.55),transparent_28%),linear-gradient(180deg,#140707_0%,#0d0404_42%,#090202_100%)]" />

      <div className="absolute left-[-12%] top-[-8%] h-[620px] w-[620px] rounded-full bg-red-700/25 blur-[150px] animate-pulse" />
      <div className="absolute right-[-12%] top-[18%] h-[720px] w-[720px] rounded-full bg-amber-500/18 blur-[170px] animate-pulse [animation-duration:4s]" />
      <div className="absolute bottom-[-8%] left-[16%] h-[560px] w-[560px] rounded-full bg-red-950/40 blur-[160px] animate-pulse [animation-duration:6s]" />
      <div className="absolute bottom-[10%] right-[8%] h-[460px] w-[460px] rounded-full bg-yellow-500/12 blur-[150px] animate-pulse [animation-duration:5s]" />

      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(245,158,11,0.1)_38%,rgba(220,38,38,0.08)_52%,transparent_100%)]" />

      <div className="absolute left-16 top-16 h-40 w-40 rounded-full border border-red-300/15 bg-red-500/5 blur-sm animate-[spin_32s_linear_infinite]" />
      <div className="absolute right-24 top-1/3 h-64 w-64 rounded-full border border-amber-200/15 bg-amber-400/5 blur-sm animate-[spin_42s_linear_infinite_reverse]" />
      <div className="absolute bottom-16 right-20 h-44 w-44 rounded-full border border-red-200/10 bg-red-300/5 blur-sm animate-[spin_28s_linear_infinite]" />

      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#1a0909] via-[#0a0404]/40 to-transparent" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,4,4,0.2)_45%,rgba(10,4,4,0.82)_100%)]" />
    </div>
  );
}