'use client';

import Link from 'next/link';

/**
 * EditorialButton — Pill-shaped button with directional arrow (→)
 * Inspired by Kimi Antonelli / GRIDO1 Racing Systems
 */
export default function EditorialButton({
  href,
  onClick,
  children,
  variant = 'outline', // 'outline' | 'primary' | 'ghost'
  className = '',
}) {
  const baseClasses =
    'group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full text-xs font-space font-semibold uppercase tracking-widest transition-all duration-200 active:scale-95 cursor-pointer';

  const variants = {
    outline:
      'border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/90 hover:text-white',
    primary:
      'bg-[#DC2626] hover:bg-[#b91c1c] text-white border border-red-500/30 shadow-lg shadow-red-900/30',
    ghost:
      'border border-transparent hover:border-white/10 hover:bg-white/[0.04] text-white/70 hover:text-white',
  };

  const content = (
    <>
      <span>{children}</span>
      <span className="transition-transform duration-200 group-hover:translate-x-1">
        &rarr;
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${variants[variant]} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {content}
    </button>
  );
}

