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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [container, setContainer] = useState(null);

  useBodyScrollLock(isDrawerOpen);

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

  return (
    <nav
      id="site-nav"
      className="sticky top-0 left-0 z-50 w-full border-b border-white/10 bg-[#090a0b]/95 backdrop-blur-sm"
    >
      <div className="flex h-12 items-stretch justify-between">
        {/* Left — Brand Logo & Main Links */}
        <div className="flex min-w-0 items-stretch">
          <Link
            href="/"
            className="flex items-center border-r border-white/10 px-4 hover:opacity-80 sm:px-5 transition-opacity"
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <img
                src="/logo.png"
                alt="CITEMAS"
                className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(220,38,38,0.5)]"
              />
            </div>
            <span
              className="ml-2.5 hidden sm:inline text-xs font-black tracking-tight text-white"
              style={{ fontFamily: 'Fraunces, Georgia, serif' }}
            >
              CITEMAS
            </span>
          </Link>

          {/* Primary Navigation Links (Screens ≥ 1024px) */}
          <div className="hidden min-w-0 items-stretch lg:flex">
            <ul className="flex h-full items-stretch">
              {loading ? (
                <li className="flex items-center px-4 gap-3">
                  <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-12 rounded bg-white/10 animate-pulse" />
                </li>
              ) : (
                centerLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href} className="flex items-stretch">
                      <Link
                        href={link.href}
                        className="group flex h-full items-center px-2 font-mono text-[11px] uppercase tracking-wider whitespace-nowrap"
                      >
                        <span
                          className={`flex items-center px-2 py-0.5 transition-colors ${
                            isActive
                              ? 'bg-white text-black font-bold'
                              : 'text-white/60 group-hover:text-white group-hover:bg-white/10'
                          }`}
                        >
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>

        {/* Right — Technical Actions & ArtCraft Block CTA */}
        <div className="flex shrink-0 items-stretch">
          <div className="hidden items-stretch md:flex">
            {loading ? (
              <div className="flex items-center px-4">
                <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Admin Link — super_admin only */}
                {user.role === 'super_admin' && (
                  <Link
                    href="/admin"
                    className="flex h-full items-center px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-red-400 border-l border-white/10 hover:bg-red-500/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {/* Staff Notification Bell */}
                {isStaff && (
                  <div className="flex w-12 items-center justify-center border-l border-white/10 text-white/70 hover:bg-white/5 transition-colors">
                    <AdminNotificationBell />
                  </div>
                )}

                {/* User Profile Badge */}
                <Link
                  href="/profile"
                  className="flex h-full items-center gap-2 px-3.5 font-mono text-[11px] uppercase tracking-wider text-white/80 border-l border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <span className="text-xs">👤</span>
                  <span className="font-bold">{user.firstName}</span>
                  {user.role && (
                    <span className="text-[9px] text-white/40">
                      ({user.role === 'user' ? 'student' : user.role.replace('_', ' ')})
                    </span>
                  )}
                </Link>

                {/* Logout Button with Tooltip */}
                <div className="group relative flex items-stretch">
                  <button
                    onClick={handleLogout}
                    aria-label="Log Out"
                    className="flex w-12 h-full items-center justify-center border-l border-white/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white text-black text-[9px] font-mono font-bold px-1.5 py-0.5 shadow-lg whitespace-nowrap z-50">
                    LOG OUT
                  </span>
                </div>

                {/* High-Contrast Full-Height CTA */}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.12em] text-[11px] h-full border-l border-white/10 bg-white text-black hover:bg-white/90 px-5 transition-opacity whitespace-nowrap"
                >
                  Studio Hub
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex h-full items-center px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-white/70 border-l border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.12em] text-[11px] h-full border-l border-white/10 bg-white text-black hover:bg-white/90 px-5 transition-opacity whitespace-nowrap"
                >
                  Launch App
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button (Screens < 1024px) */}
          <div className="flex items-stretch lg:hidden">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex w-12 items-center justify-center border-l border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Open main menu"
              aria-expanded={isDrawerOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16" />
                <path d="M4 12h16" />
                <path d="M4 19h16" />
              </svg>
            </button>
          </div>
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
