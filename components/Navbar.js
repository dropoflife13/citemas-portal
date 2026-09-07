'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (loading) return null; // avoid flashing wrong state while checking localStorage

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="font-bold text-lg">CITEMAS</Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/events" className="hover:underline">Events</Link>
            <Link href="/users" className="hover:underline">Members</Link>
            <Link href="/applications" className="hover:underline">Applications</Link>
            <Link href="/portfolio" className="hover:underline">Portfolio</Link>
            <span className="text-sm text-gray-600">
              {user.firstName} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="bg-black text-white px-3 py-1 rounded text-sm"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Log In</Link>
            <Link href="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}