'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import AdminNotificationBell from './AdminNotificationBell';

// CITEMAS Palette
const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253,251,247,0.85)';

export default function Navbar() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const isStaff = user && ['super_admin', 'teacher', 'officer'].includes(user.role);
  const logout = auth?.logout ?? (() => {});
  const loading = auth?.loading ?? false;
  const router = useRouter();

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

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#110808]/80 backdrop-blur-md text-sm font-extrabold uppercase tracking-wider">
      <div className="w-full flex items-center justify-between pl-8 pr-12 md:pl-12 md:pr-16 py-5">
        {/* Logo Brand */}
        <Link
          href="/"
          className="flex items-center gap-3.5 group transition-transform duration-150 active:scale-95"
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg shadow-[0_8px_24px_rgba(217,41,41,0.45)] transition-all duration-200 group-hover:scale-105 group-hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #d92929 0%, #7a1111 100%)', color: CITEMAS_CREAM }}
          >
            C
          </div>
          <div>
            <span
              className="font-black tracking-[-0.06em] text-xl block leading-none transition-colors duration-200 group-hover:text-red-400"
              style={{ color: CITEMAS_CREAM, fontFamily: 'Fraunces, Georgia, serif' }}
            >
              CITEMAS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Screens ≥ 1024px) */}
        <div className="hidden lg:flex items-center gap-6 md:gap-8 font-bold ml-auto" style={{ color: MUTED }}>
          {loading ? (
            <div className="flex items-center gap-5 animate-pulse">
              <div className="h-4 w-16 rounded-md bg-white/10" />
              <div className="h-4 w-16 rounded-md bg-white/10" />
              <div className="h-4 w-16 rounded-md bg-white/10" />
              <div className="h-8 w-24 rounded-xl bg-white/10" />
            </div>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Dashboard
              </Link>
              <Link
                href="/events"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Events
              </Link>
              <Link
                href="/users"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Members
              </Link>
              <Link
                href="/applications"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Applications
              </Link>
              <Link
                href="/portfolio"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Portfolio
              </Link>

              {/* Admin link — only visible to super_admin */}
              {user.role === 'super_admin' && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-[11px] font-black rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 transition-all duration-150 hover:border-red-400 hover:bg-red-500/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                >
                  Admin
                </Link>
              )}

              {/* Admin notification bell — staff only */}
              {isStaff && <AdminNotificationBell />}

              {/* User Profile Badge */}
              <Link
                href="/profile"
                className="px-4 py-2 ml-2 rounded-xl border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20 hover:scale-105 transition-all duration-150 active:scale-95 flex items-center gap-2 text-xs font-bold"
              >
                <span>👤</span>
                <span>{user.firstName}</span>
                {user.role && (
                  <span className="text-[10px] opacity-70 uppercase font-black">
                    ({user.role})
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-600/20 text-red-400 hover:text-red-300 hover:scale-105 transition-all duration-150 active:scale-95"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/events"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Events
              </Link>
              <Link
                href="/users"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Members
              </Link>
              <Link
                href="/portfolio"
                className="transition-all duration-150 hover:text-white hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
              >
                Portfolio
              </Link>

              <div className="flex items-center gap-4 ml-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold transition-all duration-150 rounded-xl hover:text-white hover:scale-105 active:scale-95"
                  style={{ color: CITEMAS_CREAM }}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-150 hover:scale-105 hover:brightness-110 shadow-md active:scale-95"
                  style={{ background: CITEMAS_RED, color: CITEMAS_CREAM }}
                >
                  Register
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button (Screens < 1024px) */}
        <div className="flex lg:hidden items-center ml-auto">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center"
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-6 h-6"
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
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg font-black text-sm shadow-[0_4px_12px_rgba(217,41,41,0.4)]"
                    style={{ background: 'linear-gradient(135deg, #d92929 0%, #7a1111 100%)', color: CITEMAS_CREAM }}
                  >
                    C
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
                          {user.role.replace('_', ' ')}
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
                      className="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all active:scale-95 text-center"
                    >
                      Log Out
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