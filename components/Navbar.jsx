'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import AdminNotificationBell from './AdminNotificationBell';
import { LogOut, ArrowRight, Sun, Moon } from 'lucide-react';

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Theme Initializer (syncs .dark and .light classes on <html>)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('citemas-theme');
      if (savedTheme === 'light') {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        setTheme('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      if (nextTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('citemas-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('citemas-theme', 'dark');
      }
    } catch {}
  };

  useBodyScrollLock(isDrawerOpen);

  // Glassmorphism scroll listener: blur after 50px
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    'flex items-center py-2.5 px-3 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all';

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
      className={`fixed top-0 left-0 w-full z-50 h-16 max-h-16 py-2 px-6 sm:px-8 text-[12px] font-semibold uppercase tracking-widest flex items-center transition-all duration-300 backdrop-blur-md border-b bg-white/60 border-black/10 text-slate-900 dark:bg-black/60 dark:border-white/10 dark:text-white ${
        isScrolled ? 'shadow-lg' : ''
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4">
        {/* Left — Brand Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 transition-transform duration-150 active:scale-95"
        >
          <div className="relative flex h-8 w-8 items-center justify-center transition-all duration-200 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="CITEMAS"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]"
            />
          </div>
          <span
            className="text-base sm:text-lg font-black tracking-[-0.04em] text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-red-500 dark:group-hover:text-red-400"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            CITEMAS
          </span>
        </Link>

        {/* Center — Primary Navigation Links (Screens ≥ 1024px) */}
        <div className="hidden items-center justify-center gap-6 lg:flex xl:gap-8">
          {loading ? (
            <div className="flex animate-pulse items-center gap-6">
              <div className="h-3 w-14 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-3 w-14 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-3 w-14 rounded-full bg-black/10 dark:bg-white/10" />
            </div>
          ) : (
            centerLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative py-1 text-[11px] font-mono tracking-wider transition-all duration-150 hover:text-slate-900 dark:hover:text-white ${
                    isActive
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-white/60'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {link.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Right — Actions & Unique Themed CTA Button */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            ) : user ? (
              <>
                {/* Admin Link — super_admin only */}
                {user.role === 'super_admin' && (
                  <Link
                    href="/admin"
                    className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-300 hover:border-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                  >
                    Admin
                  </Link>
                )}

                {/* Staff Notification Bell */}
                {isStaff && <AdminNotificationBell />}

                {/* User Profile Badge */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-mono text-slate-900 dark:text-white/90 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-all active:scale-95"
                >
                  <span className="text-xs">👤</span>
                  <span className="font-bold">{user.firstName}</span>
                  {user.role && (
                    <span className="text-[9px] uppercase text-slate-500 dark:text-white/50">
                      ({user.role === 'user' ? 'student' : user.role.replace('_', ' ')})
                    </span>
                  )}
                </Link>

                {/* Dark / Light Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 p-2 text-slate-700 dark:text-white/70 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </button>

                {/* Logout Button with Tooltip */}
                <div className="group relative flex items-center">
                  <button
                    onClick={handleLogout}
                    aria-label="Log Out"
                    className="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 p-2 text-red-600 dark:text-red-400 hover:border-red-500/50 hover:bg-red-600/20 hover:text-red-500 dark:hover:text-red-300 transition-all active:scale-95 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute top-full right-0 mt-2 hidden group-hover:block bg-white text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50">
                    LOG OUT
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Dark / Light Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 p-2 text-slate-700 dark:text-white/70 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </button>

                {/* Log In Link */}
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Log In
                </Link>

                {/* Unique Themed Sign Up CTA Button (Replacing LAUNCH APP) */}
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(234,88,12,0.55)] active:scale-95 border border-red-500/40"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_0%,transparent_70%)] transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-1.5 font-mono text-[11px] font-extrabold tracking-wider">
                    <span>Sign Up</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle & Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="flex items-center justify-center rounded-full border border-black/10 dark:border-white/10 p-2 text-slate-700 dark:text-white/70 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-all active:scale-95 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-300" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-blue-600" />
              )}
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 p-2 text-slate-800 dark:text-white/80 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
              className="fixed top-0 right-0 h-full w-[300px] max-w-[85vw] z-[85] bg-[var(--background)] dark:bg-[#110808] border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col p-6 text-slate-900 dark:text-white font-sans overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-4">
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
                  className="p-1.5 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
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
                    className="flex items-center gap-3 p-3.5 mb-5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-all text-slate-900 dark:text-white"
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

                    {/* Theme Toggle in Mobile Drawer */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.04] text-white/80 transition-colors">
                      <span className="text-sm font-bold uppercase tracking-wider">Theme</span>
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-mono"
                      >
                        {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-blue-300" />}
                        <span className="capitalize">{theme}</span>
                      </button>
                    </div>
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

                    {/* Theme Toggle in Mobile Drawer */}
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.04] text-white/80 transition-colors">
                      <span className="text-sm font-bold uppercase tracking-wider">Theme</span>
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-mono"
                      >
                        {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-blue-300" />}
                        <span className="capitalize">{theme}</span>
                      </button>
                    </div>
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
                      className="w-full py-2.5 text-center text-xs font-extrabold uppercase tracking-widest text-white transition-all rounded-xl shadow-lg bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:brightness-110 active:scale-95"
                    >
                      Sign Up
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
