'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
        setError(data.message || 'Failed to load directory.');
      }
    } catch {
      setUsers([]);
      setError('An error occurred while loading directory.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchUsers();
    }
  }, [user, authLoading, token, router, fetchUsers]);

  const safeUsers = Array.isArray(users) ? users : [];
  const officers = safeUsers.filter((u) => u.role === 'officer');
  const members = safeUsers.filter((u) => u.role === 'member');
  const alumni = safeUsers.filter((u) => u.role === 'alumni');
  const teachers = safeUsers.filter((u) => u.role === 'teacher');

  const tabs = [
    { id: 'all', label: 'All', count: safeUsers.length },
    { id: 'officer', label: 'Officers', count: officers.length },
    { id: 'member', label: 'Members', count: members.length },
    { id: 'alumni', label: 'Alumni', count: alumni.length },
    { id: 'teacher', label: 'Faculty', count: teachers.length },
  ];

  const displayedUsers = safeUsers.filter((u) => {
    if (activeTab === 'all') return true;
    return u.role === activeTab;
  });

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-[#FDFBF7]/70">Loading directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#110808] px-6 text-[#FDFBF7]">
        <p className="text-red-300">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-8 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Community</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">CITEMAS Directory</h1>
          <p className="mt-2 text-sm text-[#FDFBF7]/70">Browse and connect with members, officers, alumni, and faculty.</p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-600 to-red-800 text-[#FDFBF7]'
                    : 'border border-white/10 bg-[#1a0d0d] text-[#FDFBF7]/70 hover:border-red-500/30'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[9px] ${activeTab === tab.id ? 'bg-black/20 text-[#FDFBF7]' : 'bg-white/[0.06] text-[#FDFBF7]/60'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {displayedUsers.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedUsers.map((person) => (
              <UserCard key={person._id || person.id} person={person} />
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-[#FDFBF7]/70">
            No records found for this category.
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ person }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'officer':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
      case 'alumni':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
      case 'teacher':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
      default:
        return 'border-white/10 bg-white/[0.04] text-[#FDFBF7]/80';
    }
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#FDFBF7]">
            {person.firstName} {person.lastName}
          </h3>
          <p className="mt-1 text-xs text-[#FDFBF7]/60">{person.email}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${getRoleBadge(person.role)} ${person.officerPosition ? 'capitalize' : ''}`}>
          {person.officerPosition ? person.officerPosition.replace(/_/g, ' ') : person.role}
        </span>
      </div>

      {(person.department || person.yearLevel || person.specialization) && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-[#FDFBF7]/70">
          {person.department && (
            <p>
              <span className="text-[#FDFBF7]/40">Department:</span> {person.department}
            </p>
          )}
          {person.yearLevel && (
            <p>
              <span className="text-[#FDFBF7]/40">Year:</span> {person.yearLevel}
            </p>
          )}
          {person.specialization && (
            <p>
              <span className="text-[#FDFBF7]/40">Specialization:</span> {person.specialization}
            </p>
          )}
        </div>
      )}
    </div>
  );
}