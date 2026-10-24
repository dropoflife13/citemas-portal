'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';

export default function ScrollSpine() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  const [percentage, setPercentage] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setPercentage(Math.min(100, Math.max(0, Math.round(latest * 100))));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Track active scroll events to trigger text pop-up
  useEffect(() => {
    let timer = null;
    const handleScroll = () => {
      setIsScrolling(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsScrolling(false);
      }, 700);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Position the floating label along the 60vh track from 0% to 100%
  const labelTop = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  return (
    <aside
      aria-label="Scroll Progress Spine"
      className="fixed right-8 top-0 h-screen w-4 z-[100] hidden md:flex flex-col items-center justify-center pointer-events-none select-none"
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

        {/* Active Scrolling Pop-Up Label (Fades in when scrolling, fades out when stopped) */}
        <AnimatePresence>
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="absolute right-6 -translate-y-1/2 whitespace-nowrap bg-[#090a0b]/90 border border-white/10 px-2 py-1 rounded shadow-lg pointer-events-none flex items-center gap-1.5 backdrop-blur-md"
              style={{ top: labelTop }}
            >
              <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[9px] text-white/50 tracking-widest uppercase">
                {percentage}% // SCROLLING
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Floating Percentage Label attached to the bottom of the fill line */}
        <motion.div
          className="font-mono text-[10px] text-red-500 tracking-widest absolute -right-8 -translate-y-1/2 whitespace-nowrap pointer-events-none font-bold"
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
