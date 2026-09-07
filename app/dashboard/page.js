'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If not logged in (and we're done checking), send them to login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return null; // will redirect via useEffect above

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Welcome, {user.firstName} 👋</h1>
      <p className="text-gray-600 mb-6">You're logged in as: <strong>{user.role}</strong></p>

      {/* Role-based content example */}
      {user.role === 'super_admin' && (
        <p className="text-purple-600">You have full system access.</p>
      )}
      {(user.role === 'officer' || user.role === 'teacher') && (
        <p className="text-blue-600">You can approve applications and manage events.</p>
      )}
      {user.role === 'member' && (
        <p className="text-green-600">You can register for events and build your portfolio.</p>
      )}
      {user.role === 'user' && (
        <p className="text-gray-600">You haven't applied for membership yet.</p>
      )}
    </div>
  );
}