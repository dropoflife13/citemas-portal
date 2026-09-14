'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  Activity,
  User,
  Image,
  LogIn,
  LogOut,
  FileText,
  Shield,
  RefreshCw,
} from 'lucide-react';

const ACTION_META = {
  'auth.login': { label: 'Logged in', color: 'text-emerald-300', icon: LogIn },
  'auth.logout': { label: 'Logged out', color: 'text-rose-300', icon: LogOut },
  'auth.signup': { label: 'Signed up', color: 'text-emerald-300', icon: User },
  'profile.avatar_changed': { label: 'Changed avatar', color: 'text-amber-300', icon: Image },
  'profile.cover_changed': { label: 'Changed cover photo', color: 'text-amber-300', icon: Image },
  'profile.updated': { label: 'Updated profile', color: 'text-amber-300', icon: User },
  'user.role_updated': { label: 'Changed role', color: 'text-red-300', icon: Shield },
  'user.created': { label: 'Created user', color: 'text-emerald-300', icon: User },
  'user.deleted': { label: 'Deleted user', color: 'text-red-300', icon: Shield },
  'project.created': { label: 'Created project', color: 'text-sky-300', icon: FileText },
  'project.updated': { label: 'Updated project', color: 'text-sky-300', icon: FileText },
  'project.deleted': { label: 'Deleted project', color: 'text-rose-300', icon: FileText },
};

function timeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

export default function AdminActivityPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const isAdmin = user && ['super_admin', 'adviser'].includes(user.role);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/dashboard'); return; }

    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/activity'
        : `/api/activity?action=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'auth', label: 'Auth' },
    { id: 'profile', label: 'Profile' },
    { id: 'user', label: 'Users' },
    { id: 'project', label: 'Projects' },
  ];

  if (authLoading || (loading && logs.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-12 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
                Admin only
              </p>
              <h1 className="font-serif text-3xl font-light">Activity log</h1>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#FDFBF7]/80 transition-colors hover:border-red-400/40 hover:text-red-200"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                filter === f.id
                  ? 'border-red-500/50 bg-red-500/15 text-red-200'
                  : 'border-white/10 text-[#FDFBF7]/60 hover:border-white/25 hover:text-[#FDFBF7]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {logs.length === 0 && !loading && (
            <p className="py-12 text-center text-sm text-[#FDFBF7]/50">
              No activity recorded yet.
            </p>
          )}

          {logs.map((log) => {
            const meta = ACTION_META[log.action] || {
              label: log.action,
              color: 'text-[#FDFBF7]/80',
              icon: Activity,
            };
            const Icon = meta.icon;
            const when = timeAgo(log.createdAt);

            return (
              <div
                key={log._id}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/20"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] ${meta.color}`}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold text-[#FDFBF7]">
                      {log.actorName}
                    </span>{' '}
                    <span className={`${meta.color} font-medium`}>
                      {meta.label.toLowerCase()}
                    </span>
                    {log.targetName && (
                      <>
                        {' '}
                        <span className="text-[#FDFBF7]/60">·</span>{' '}
                        <span className="text-[#FDFBF7]/80">
                          {log.targetName}
                        </span>
                      </>
                    )}
                  </p>

                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-[#FDFBF7]/40">
                    {log.actorRole} · {when}
                    {log.ip && log.ip !== 'unknown' && ` · ${log.ip}`}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-[#FDFBF7]/40">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}