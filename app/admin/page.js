'use client';

import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';

const ADMIN_ROLES = new Set(['super_admin', 'teacher', 'adviser', 'officer']);

const canAccessAdmin = (user) => {
  if (!user) return false;
  if (ADMIN_ROLES.has(user.role)) return true;
  return user.role === 'officer' && user.officerPosition === 'president';
};

const ACTION_META = {
  'auth.login': { label: 'logged in', color: 'text-emerald-300', icon: LogIn },
  'auth.logout': { label: 'logged out', color: 'text-rose-300', icon: LogOut },
  'auth.signup': { label: 'signed up', color: 'text-emerald-300', icon: User },
  'profile.avatar_changed': { label: 'changed avatar', color: 'text-amber-300', icon: Image },
  'profile.cover_changed': { label: 'changed cover photo', color: 'text-amber-300', icon: Image },
  'profile.updated': { label: 'updated profile', color: 'text-amber-300', icon: User },
  'user.role_updated': { label: 'changed a role', color: 'text-red-300', icon: Shield },
  'project.created': { label: 'created a project', color: 'text-sky-300', icon: FileText },
  'project.updated': { label: 'updated a project', color: 'text-sky-300', icon: FileText },
  'project.deleted': { label: 'deleted a project', color: 'text-rose-300', icon: FileText },
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

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && !canAccessAdmin(user)) {
      router.push('/dashboard');
      return;
    }

    if (user && token) {
      loadAdminData();
    }
  }, [authLoading, user, token, router]);

  async function loadAdminData() {
    try {
      setLoading(true);
      setError('');

      const [usersRes, applicationsRes, activityRes] = await Promise.all([
        fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/applications', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/activity?limit=20', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const applicationsData = await applicationsRes.json();
      const activityData = await activityRes.json();

      if (!usersRes.ok || !applicationsRes.ok) {
        throw new Error(
          usersData.message || applicationsData.error || 'Unable to load admin data.'
        );
      }

      setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setActivityLogs(Array.isArray(activityData.logs) ? activityData.logs : []);
    } catch (err) {
      console.error('Admin load error:', err);
      setError(err.message || 'An unexpected error occurred while loading the admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const members = users.filter((u) => u.role === 'member').length;
    const officers = users.filter((u) => u.role === 'officer').length;
    const faculty = users.filter((u) => u.role === 'teacher').length;
    const pendingApplications = applications.filter((app) => app.status === 'pending').length;
    const approvedApplications = applications.filter((app) => app.status === 'approved').length;

    return { totalUsers, members, officers, faculty, pendingApplications, approvedApplications };
  }, [users, applications]);

  const recentApplicants = [...applications]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-[#FDFBF7]/70">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#110808] px-6 text-[#FDFBF7]">
        <p className="text-red-300">{error}</p>
        <button
          onClick={loadAdminData}
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
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Protected Area</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">Admin Control Center</h1>
            </div>

            <div className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-200">
              {user?.role === 'super_admin' ? 'System Admin' : user?.role || 'Staff'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Members', value: stats.totalUsers, accent: 'from-red-600/30 to-red-800/10' },
            { label: 'Active Members', value: stats.members, accent: 'from-amber-500/20 to-amber-800/10' },
            { label: 'Officers', value: stats.officers, accent: 'from-red-500/20 to-red-900/10' },
            { label: 'Pending Apps', value: stats.pendingApplications, accent: 'from-amber-400/20 to-red-800/10' },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${item.accent} p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45)]`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">{item.label}</p>
              <p className="mt-4 text-3xl font-black text-[#FDFBF7]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#FDFBF7]">Recent Applications</h2>
              <span className="rounded-full border border-white/10 bg-[#1a0d0d] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#FDFBF7]/60">
                {stats.approvedApplications} approved
              </span>
            </div>

            <div className="space-y-3">
              {recentApplicants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#1a0d0d] p-5 text-sm text-[#FDFBF7]/60">
                  No applications have been submitted yet.
                </div>
              ) : (
                recentApplicants.map((app) => {
                  const applicant = app.applicant || {};
                  const status = app.status || 'pending';

                  return (
                    <div key={app._id} className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#FDFBF7]">
                            {applicant.firstName || 'Unknown'} {applicant.lastName || ''}
                          </p>
                          <p className="mt-1 text-xs text-[#FDFBF7]/60">{applicant.email || 'No email provided'}</p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                            status === 'approved'
                              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                              : status === 'rejected'
                                ? 'border border-red-500/30 bg-red-500/10 text-red-200'
                                : 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#FDFBF7]">Staff Snapshot</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/55">Faculty</p>
                <p className="mt-2 text-2xl font-black text-[#F59E0B]">{stats.faculty}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/55">Officer Team</p>
                <p className="mt-2 text-2xl font-black text-[#F59E0B]">{stats.officers}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/55">Current User</p>
                <p className="mt-2 text-base font-black text-[#FDFBF7]">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                <p className="mt-2 text-xs text-[#FDFBF7]/60">{user?.email || 'No email available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ───── ACTIVITY LOG ───── */}
        {user?.role === 'super_admin' && (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">
                    Admin only
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#FDFBF7]">
                    Recent Activity
                  </h2>
                </div>
              </div>

              <button
                onClick={loadAdminData}
                className="rounded-full border border-white/10 bg-[#1a0d0d] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#FDFBF7]/60 transition-colors hover:border-red-400/40 hover:text-red-200"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#1a0d0d] p-5 text-sm text-[#FDFBF7]/60">
                  No activity recorded yet.
                </div>
              ) : (
                activityLogs.map((log) => {
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
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#1a0d0d] px-5 py-4 transition-colors hover:border-white/20"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] ${meta.color}`}
                      >
                        <Icon size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-bold text-[#FDFBF7]">
                            {log.actorName}
                          </span>{' '}
                          <span className={`${meta.color} font-medium`}>
                            {meta.label}
                          </span>
                          {log.targetName && log.targetName !== log.actorName && (
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
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}