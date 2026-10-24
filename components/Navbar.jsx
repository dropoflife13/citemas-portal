'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import AdminNotificationBell from './AdminNotificationBell';
import { LogOut } from 'lucide-react';

// CITEMAS Palette
const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';

export default function Navbar() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const isStaff = user && ['super_admin', 'teacher', 'officer'].includes(user.role);
  const logout = auth?.logout ?? (() => {});
  const loading = auth?.loading ?? false;
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useBodyScrollLock(isDrawerOpen);

  // Track scroll so the landing-page header can fade from invisible to glass
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Setup SSR-safe portal container
  useEffect(() => {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    setContainer(modalRoot);
  }, []);

  // Escape key handler for drawer
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const drawerLinkClass =
    'flex items-center py-2.5 px-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/[0.06] transition-all';

  // Landing page: invisible at the top, glass once scrolled. Other pages: solid dark bar.
  const navSurface = isHome
    ? scrolled
      ? 'bg-[#070305]/60 backdrop-blur-2xl border-white/[0.05]'
      : 'bg-transparent border-transparent'
    : 'bg-[#070305] border-white/[0.05]';

  const centerLinks = user
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/events', label: 'Events' },
        { href: '/users', label: 'Members' },
        { href: '/applications', label: 'Applications' },
        { href: '/portfolio', label: 'Portfolio' },
      ]
    : [
        { href: '/events', label: 'Events' },
        { href: '/users', label: 'Members' },
        { href: '/portfolio', label: 'Portfolio' },
      ];

  const centerLinkClass = 'text-white/70 transition-colors duration-200 hover:text-white';

  return (
    <nav
      className={`sticky top-0 z-50 border-b text-[12px] font-semibold uppercase tracking-widest transition-[background-color,border-color,backdrop-filter] duration-500 ${navSurface}`}
    >
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-8 px-8 py-4 md:px-12">
        {/* Left — Logo Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3.5 transition-transform duration-150 active:scale-95"
        >
          <div className="relative flex h-10 w-10 items-center justify-center transition-all duration-200 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="CITEMAS Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_4px_12px_rgba(217,41,41,0.5)]"
            />
          </div>
          <span
            className="block text-xl font-black leading-none tracking-[-0.06em] transition-colors duration-200 group-hover:text-red-400"
            style={{ color: CITEMAS_CREAM, fontFamily: 'Fraunces, Georgia, serif' }}
          >
            CITEMAS
          </span>
        </Link>

        {/* Center — Primary navigation links (Screens ≥ 1024px) */}
        <div className="hidden items-center justify-center gap-8 lg:flex xl:gap-10">
          {loading ? (
            <div className="flex animate-pulse items-center gap-8">
              <div className="h-3 w-16 rounded-full bg-white/10" />
              <div className="h-3 w-16 rounded-full bg-white/10" />
              <div className="h-3 w-16 rounded-full bg-white/10" />
            </div>
          ) : (
            centerLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-all duration-200 hover:scale-105 inline-block ${
                    isActive
                      ? 'text-red-500 font-bold after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-red-500 after:rounded-full'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })
          )}
        </div>

        {/* Right — Auth / profile actions (Screens ≥ 1024px) */}
        <div className="hidden items-center justify-end gap-3 lg:flex">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <>
              {/* Admin link — only visible to super_admin */}
              {user.role === 'super_admin' && (
                <Link
                  href="/admin"
                  className="rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1.5 text-[11px] font-black text-red-200 transition-all duration-150 hover:border-red-400 hover:bg-red-500/20 active:scale-95"
                >
                  Admin
                </Link>
              )}

              {/* Admin notification bell — staff only */}
              {isStaff && <AdminNotificationBell />}

              {/* User Profile Badge */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold text-white transition-all duration-150 hover:border-white/20 hover:bg-white/[0.08] active:scale-95"
              >
                <span>👤</span>
                <span>{user.firstName}</span>
                {user.role && (
                  <span className="text-[10px] font-black uppercase opacity-70">
                    ({user.role === 'user' ? 'student' : user.role.replace('_', ' ')})
                  </span>
                )}
              </Link>

              {/* Logout Button with Vercel-style Tooltip */}
              <div className="group relative flex items-center">
                <button
                  onClick={handleLogout}
                  aria-label="Log Out"
                  className="flex items-center justify-center rounded-full border border-white/10 p-2.5 text-red-400 transition-all duration-150 hover:border-red-500/50 hover:bg-red-600/20 hover:text-red-300 active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <span className="absolute top-full right-0 mt-2 hidden group-hover:block bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                  Log Out
                </span>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-[11px] font-semibold transition-colors duration-200 hover:text-white"
                style={{ color: CITEMAS_CREAM }}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-full px-5 py-2.5 text-[11px] font-bold transition-all duration-150 hover:brightness-110 active:scale-95"
                style={{ background: CITEMAS_RED, color: CITEMAS_CREAM }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button (Screens < 1024px) */}
        <div className="col-start-3 flex items-center justify-self-end lg:hidden">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center rounded-xl p-2 text-white/80 transition-all duration-150 hover:bg-white/[0.08] hover:text-white active:scale-95"
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Drawer Portal */}
      {container && isDrawerOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDrawer();
            }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity"
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 right-0 h-full w-[300px] max-w-[85vw] z-[85] bg-[#110808] border-l border-white/10 shadow-2xl flex flex-col p-6 text-white font-sans overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="CITEMAS Logo"
                      className="h-full w-full object-contain filter drop-shadow-[0_4px_10px_rgba(217,41,41,0.5)]"
                    />
                  </div>
                  <span className="font-black text-lg tracking-tight" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                    CITEMAS
                  </span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close navigation menu"
                >
                  ✕
                </button>
              </div>

              {/* Authenticated User Content */}
              {user ? (
                <>
                  {/* User Profile Pill at the top */}
                  <Link
                    href="/profile"
                    onClick={closeDrawer}
                    className="flex items-center gap-3 p-3.5 mb-5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all text-white"
                  >
                    <span className="text-xl">👤</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">
                        {user.firstName} {user.lastName || ''}
                      </span>
                      {user.role && (
                        <span className="text-[10px] text-red-400 uppercase font-black tracking-wider">
                          {user.role === 'user' ? 'Student' : user.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Navigation Links in requested vertical order */}
                  <nav className="flex flex-col gap-1">
                    <Link href="/dashboard" onClick={closeDrawer} className={drawerLinkClass}>
                      Dashboard
                    </Link>
                    <Link href="/events" onClick={closeDrawer} className={drawerLinkClass}>
                      Events
                    </Link>
                    <Link href="/users" onClick={closeDrawer} className={drawerLinkClass}>
                      Members
                    </Link>
                    <Link href="/applications" onClick={closeDrawer} className={drawerLinkClass}>
                      Applications
                    </Link>
                    <Link href="/portfolio" onClick={closeDrawer} className={drawerLinkClass}>
                      Portfolio
                    </Link>

                    {/* Admin link (staff only) */}
                    {user.role === 'super_admin' && (
                      <Link href="/admin" onClick={closeDrawer} className={drawerLinkClass}>
                        Admin
                      </Link>
                    )}

                    {/* Notification Bell trigger (staff only) */}
                    {isStaff && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.04] text-white/80 transition-colors">
                        <span className="text-sm font-bold uppercase tracking-wider">Notifications</span>
                        <AdminNotificationBell />
                      </div>
                    )}
                  </nav>

                  {/* Log Out button at bottom */}
                  <div className="mt-auto pt-6 border-t border-white/10">
                    <button
                      onClick={() => {
                        closeDrawer();
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all active:scale-95 text-center"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Unauthenticated Mobile Links */
                <>
                  <nav className="flex flex-col gap-1">
                    <Link href="/events" onClick={closeDrawer} className={drawerLinkClass}>
                      Events
                    </Link>
                    <Link href="/users" onClick={closeDrawer} className={drawerLinkClass}>
                      Members
                    </Link>
                    <Link href="/portfolio" onClick={closeDrawer} className={drawerLinkClass}>
                      Portfolio
                    </Link>
                  </nav>

                  <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
                    <Link
                      href="/login"
                      onClick={closeDrawer}
                      className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider transition-all rounded-xl border border-white/10 hover:bg-white/[0.08]"
                      style={{ color: CITEMAS_CREAM }}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeDrawer}
                      className="w-full py-2.5 text-center text-xs font-extrabold uppercase tracking-wider transition-all rounded-xl hover:brightness-110 shadow-md"
                      style={{ background: CITEMAS_RED, color: CITEMAS_CREAM }}
                    >
                      Register
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>,
          container
        )}
    </nav>
  );
}
