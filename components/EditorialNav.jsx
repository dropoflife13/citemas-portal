'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'hero', number: '01', label: 'Hero' },
  { id: 'specializations', number: '02', label: 'Specializations' },
  { id: 'telemetry', number: '03', label: 'Telemetry' },
  { id: 'leadership', number: '04', label: 'Leadership' },
];

export default function EditorialNav() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-35% 0px -35% 0px',
        threshold: [0, 0.2],
      }
    );

    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    const handleScroll = () => {
      if (window.scrollY < 80) {
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id, index) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: (index / (SECTIONS.length - 1)) * scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      aria-label="Editorial Index"
      className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-8 pointer-events-none select-none"
    >
      {SECTIONS.map((section, index) => {
        const isActive = activeSection === section.id;

        return (
          <motion.button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id, index)}
            animate={{ x: isActive ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className={`group relative flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] cursor-pointer pointer-events-auto transition-colors duration-200 text-left focus:outline-none ${
              isActive ? 'text-white' : 'text-white/20 hover:text-white/60'
            }`}
          >
            {/* Glowing Red Vertical Indicator Line when active */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="editorialActiveIndicator"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.18 }}
                  className="w-1 h-4 bg-red-600 shadow-[0_0_12px_#dc2626] rounded-full inline-block shrink-0"
                />
              )}
            </AnimatePresence>

            {/* Small Section Number */}
            <span
              className={`transition-colors duration-200 ${
                isActive ? 'text-red-500 font-bold' : 'text-white/20 group-hover:text-white/40'
              }`}
            >
              {section.number} //
            </span>

            {/* Section Name */}
            <span
              className={`transition-colors duration-200 ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {section.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

