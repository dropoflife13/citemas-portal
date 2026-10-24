'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import { usePathname } from 'next/navigation';

// Friendly uppercase labels for known IDs across the site
const SECTION_LABELS = {
  hero: 'HERO',
  specializations: 'SPECIALIZATIONS',
  telemetry: 'TELEMETRY',
  leadership: 'LEADERSHIP',
  about: 'ABOUT',
  achievements: 'ACHIEVEMENTS',
  officers: 'OFFICERS',
  events: 'EVENTS',
  portfolio: 'PORTFOLIO',
  users: 'MEMBERS',
  footer: 'FOOTER',
};

export default function ScrollSpine() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  const [percentage, setPercentage] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activeSection, setActiveSection] = useState('HERO');

  // Smooth scroll percentage tracker
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setPercentage(Math.min(100, Math.max(0, Math.round(latest * 100))));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Section Tracking: IntersectionObserver + Real-time viewport bounds
  useEffect(() => {
    const updateSectionFromScroll = () => {
      // 1. Landing page sticky stack (h-[400vh] container with 4 cards)
      const stack = document.querySelector('[class*="h-[400vh]"]');
      if (stack) {
        const rect = stack.getBoundingClientRect();
        const totalScrollable = rect.height - window.innerHeight;
        if (totalScrollable > 0) {
          const scrolled = -rect.top;
          if (scrolled >= totalScrollable - 50) {
            setActiveSection('FOOTER');
            return;
          }
          if (scrolled >= 0) {
            const progress = Math.max(0, Math.min(3, (scrolled / totalScrollable) * 3));
            const idx = Math.min(3, Math.floor(progress));
            const landingSections = ['HERO', 'SPECIALIZATIONS', 'TELEMETRY', 'LEADERSHIP'];
            setActiveSection(landingSections[idx] || 'HERO');
            return;
          }
        }
      }

      // 2. Document elements with an ID (sections, footer)
      const sections = Array.from(document.querySelectorAll('section[id], footer[id]'));
      if (sections.length > 0) {
        const viewportMid = window.innerHeight * 0.45;
        for (let i = sections.length - 1; i >= 0; i--) {
          const rect = sections[i].getBoundingClientRect();
          if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
            const rawId = sections[i].id.toLowerCase();
            setActiveSection(SECTION_LABELS[rawId] || sections[i].id.replace(/[-_]/g, ' ').toUpperCase());
            return;
          }
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
          setActiveSection('FOOTER');
          return;
        }
        if (sections[0]) {
          const rawId = sections[0].id.toLowerCase();
          setActiveSection(SECTION_LABELS[rawId] || sections[0].id.replace(/[-_]/g, ' ').toUpperCase());
          return;
        }
      }

      // 3. Fallback for page top
      if (window.scrollY < 120) {
        setActiveSection('HERO');
      }
    };

    // IntersectionObserver observing all sections and footer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rawId = entry.target.id?.toLowerCase();
            if (rawId) {
              setActiveSection(SECTION_LABELS[rawId] || entry.target.id.replace(/[-_]/g, ' ').toUpperCase());
            }
          }
        });
      },
      { rootMargin: '-20% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const elements = document.querySelectorAll('section[id], footer[id]');
    elements.forEach((el) => observer.observe(el));

    // Initial check
    updateSectionFromScroll();

    // Scroll listener for active pop-up and section updating
    let timer = null;
    const handleScroll = () => {
      setIsScrolling(true);
      updateSectionFromScroll();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsScrolling(false);
      }, 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      window.removeEventListener('scroll', handleScroll);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

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

        {/* Active Scrolling Pop-Up Label (Fades in when scrolling, displays [percentage]% // [CURRENT_SECTION_NAME]) */}
        <AnimatePresence>
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="absolute right-6 -translate-y-1/2 whitespace-nowrap bg-[#090a0b]/90 border border-white/10 px-2.5 py-1 rounded shadow-lg pointer-events-none flex items-center gap-1.5 backdrop-blur-md"
              style={{ top: labelTop }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-[9px] tracking-widest uppercase flex items-center gap-1.5">
                <span className="text-white/60">{percentage}%</span>
                <span className="text-white/30">//</span>
                <span className="text-red-500 font-bold">{activeSection}</span>
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
