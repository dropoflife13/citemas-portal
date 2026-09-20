'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

// CITEMAS Palette
const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const MUTED = 'rgba(253,251,247,0.85)';

export default function Navbar() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const logout = auth?.logout ?? (() => {});
  const loading = auth?.loading ?? false;
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

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

        {/* Navigation Links */}
        <div className="flex items-center gap-6 md:gap-8 font-bold ml-auto" style={{ color: MUTED }}>
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
      </div>
    </nav>
  );
}