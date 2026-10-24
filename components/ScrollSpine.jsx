'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export default function ScrollSpine() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setPercentage(Math.min(100, Math.max(0, Math.round(latest * 100))));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Position the floating label along the 60vh track from 0% to 100%
  const labelTop = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  return (
    <aside
      aria-label="Scroll Progress Spine"
      className="fixed right-8 top-0 h-screen w-4 z-50 hidden md:flex flex-col items-center justify-center pointer-events-none select-none"
    >
      {/* Top Technical Anchor */}
      <span className="font-mono text-[9px] text-white/30 tracking-widest mb-3 select-none">
        00
      </span>

      {/* The Track Container (60vh) */}
      <div className="relative w-[1px] h-[60vh] bg-white/10 flex justify-center">
        {/* The Glowing Red Fill Line */}
        <motion.div
          className="w-[2px] bg-[#dc2626] shadow-[0_0_12px_#dc2626] absolute top-0 origin-top"
          style={{
            height: '100%',
            scaleY: smoothProgress,
          }}
        />

        {/* Small Leading Glow Node on the Fill */}
        <motion.div
          className="absolute -left-[2px] w-[5px] h-[5px] rounded-full bg-[#dc2626] shadow-[0_0_8px_#dc2626] -translate-y-1/2 pointer-events-none"
          style={{ top: labelTop }}
        />

        {/* The Floating Percentage Label attached to the bottom of the fill line */}
        <motion.div
          className="font-mono text-[10px] text-red-500 tracking-widest absolute -right-8 -translate-y-1/2 whitespace-nowrap pointer-events-none"
          style={{ top: labelTop }}
        >
          {percentage}%
        </motion.div>
      </div>

      {/* Bottom Technical Anchor */}
      <span className="font-mono text-[9px] text-white/30 tracking-widest mt-3 select-none">
        100
      </span>
    </aside>
  );
}

