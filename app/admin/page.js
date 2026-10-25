'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import CitemasLoader from '@/components/CitemasLoader';
import {
  Activity,
  User,
  Image,
  LogIn,
  LogOut,
  FileText,
  Shield,
  GraduationCap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
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
  const { showToast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [actioningStaffId, setActioningStaffId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citemas_token');
      if (!storedToken) {
        router.replace('/login');
        return;
      }
    }

    if (!authLoading) {
      if (!user || !token) {
        router.replace('/login');
        return;
      }
      if (!canAccessAdmin(user)) {
        router.replace('/dashboard');
        return;
      }
      setCheckingAuth(false);
    }

    if (user && token && canAccessAdmin(user)) {
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

  const pendingStaffUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.accountType === 'adviser' || u.staffApprovalStatus === 'pending') &&
        u.role !== 'adviser' &&
        u.role !== 'teacher' &&
        u.role !== 'super_admin'
    );
  }, [users]);

  async function handleApproveStaff(staffUserId, assignRole = 'adviser') {
    if (!staffUserId) return;
    try {
      setActioningStaffId(staffUserId);
      const res = await fetch(`/api/users/${staffUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: assignRole,
          decision: 'approved',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to approve staff account.');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === staffUserId
            ? { ...u, role: assignRole, staffApprovalStatus: 'approved' }
            : u
        )
      );
      showToast('Faculty Adviser account approved and activated!', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to approve account.', 'error');
    } finally {
      setActioningStaffId(null);
    }
  }

  async function handleRejectStaff(staffUserId) {
    if (!staffUserId) return;
    try {
      setActioningStaffId(staffUserId);
      const res = await fetch(`/api/users/${staffUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: 'rejected',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to reject account.');
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === staffUserId
            ? { ...u, staffApprovalStatus: 'rejected', role: 'user' }
            : u
        )
      );
      showToast('Staff registration request declined.', 'info');
    } catch (err) {
      showToast(err.message || 'Unable to reject account.', 'error');
    } finally {
      setActioningStaffId(null);
    }
  }

  const recentApplicants = [...applications]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  if (checkingAuth || authLoading || loading || !user || !token) {
    return <CitemasLoader label="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-[var(--background)] px-6 text-[var(--foreground)]">
        <p className="text-red-500 font-mono text-sm">{error}</p>
        <button
          onClick={loadAdminData}
          className="mt-4 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Banner */}
        <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur-2xl transition-colors duration-300">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-red-600 dark:text-red-400">
                CONTROL CENTER // EXECUTIVE ACCESS
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Admin Control Center
              </h1>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                Manage organization access, approve faculty advisers, and oversee creative operations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAdminData}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Sync</span>
              </button>

              <div className="rounded-full border border-red-500/40 bg-red-500/15 px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
                {user?.role === 'super_admin' ? 'Super Administrator' : user?.role || 'Staff'}
              </div>
            </div>
          </div>
        </div>

        {/* ───── PENDING FACULTY & ADVISER APPROVALS (HIGH PRIORITY) ───── */}
        <div className="rounded-[28px] border-2 border-amber-500/50 dark:border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-[var(--card-bg)] to-transparent p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                    Staff Identity Verification
                  </span>
                  {pendingStaffUsers.length > 0 && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Pending Faculty &amp; Adviser Approvals
                </h2>
              </div>
            </div>

            <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {pendingStaffUsers.length} Pending Verification{pendingStaffUsers.length === 1 ? '' : 's'}
            </span>
          </div>

          {pendingStaffUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/10 bg-black/[0.02] dark:bg-black/20 p-6 text-center">
              <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                All Faculty &amp; Adviser Registrations Are Up to Date
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                When an adviser registers with a Staff ID, their verification card will appear here for one-click approval.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingStaffUsers.map((staff) => (
                <div
                  key={staff._id}
                  className="rounded-2xl border border-amber-500/30 bg-[var(--card-bg)] dark:bg-[#120707] p-5 shadow-lg space-y-3.5 transition-all hover:border-amber-500/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-1">
                        Adviser Registration
                      </span>
                      <h3 className="font-display text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5">{staff.email}</p>
                    </div>

                    {staff.staffId && (
                      <span className="rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-red-600 dark:text-red-300 shrink-0">
                        ID: {staff.staffId}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400 pt-2 border-t border-black/10 dark:border-white/10 space-y-1">
                    <p><span className="text-slate-400 dark:text-slate-500">Department:</span> {staff.department || 'Not specified'}</p>
                    <p><span className="text-slate-400 dark:text-slate-500">Registered:</span> {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'Recently'}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => handleApproveStaff(staff._id, 'adviser')}
                      disabled={actioningStaffId === staff._id}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 px-3 text-[11px] font-mono font-black uppercase tracking-wider text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>{actioningStaffId === staff._id ? 'Approving...' : 'Approve as Adviser'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRejectStaff(staff._id)}
                      disabled={actioningStaffId === staff._id}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 px-3 text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-300 hover:bg-red-500/20 active:scale-95 disabled:opacity-50 transition cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ───── METRIC STATS TILES ───── */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Accounts', value: stats.totalUsers, accent: 'from-red-600/20 to-red-800/5' },
            { label: 'Active Members', value: stats.members, accent: 'from-amber-500/20 to-amber-800/5' },
            { label: 'Officer Council', value: stats.officers, accent: 'from-red-500/20 to-red-900/5' },
            { label: 'Pending Apps', value: stats.pendingApplications, accent: 'from-amber-400/20 to-red-800/5' },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-[28px] border border-black/10 dark:border-white/10 bg-gradient-to-br ${item.accent} bg-[var(--card-bg)]/80 p-5 shadow-lg`}
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">{item.label}</p>
              <p className="mt-3 font-display text-4xl font-black text-slate-900 dark:text-white leading-none">{item.value}</p>
            </div>
          ))}
        </div>

        {/* ───── RECENT APPLICATIONS & SNAPSHOT ───── */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <h2 className="font-display text-lg font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white">
                Recent Student Applications
              </h2>
              <span className="rounded-full border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-[#1a0d0d] px-3 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                {stats.approvedApplications} approved
              </span>
            </div>

            <div className="space-y-3">
              {recentApplicants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-5 text-sm text-slate-500 dark:text-slate-400 text-center font-mono text-xs">
                  No applications have been submitted yet.
                </div>
              ) : (
                recentApplicants.map((app) => {
                  const applicant = app.applicant || {};
                  const status = app.status || 'pending';

                  return (
                    <div key={app._id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {applicant.firstName || 'Unknown'} {applicant.lastName || ''}
                          </p>
                          <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">{applicant.email || 'No email provided'}</p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.18em] ${
                            status === 'approved'
                              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                              : status === 'rejected'
                                ? 'border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200'
                                : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200'
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

          <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur-2xl">
            <h2 className="font-display text-lg font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white border-b border-black/10 dark:border-white/10 pb-4">
              Staff &amp; Executive Snapshot
            </h2>

            <div className="mt-5 space-y-4 font-mono">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Faculty &amp; Advisers</p>
                <p className="mt-2 text-2xl font-black text-amber-600 dark:text-[#F59E0B]">
                  {users.filter((u) => u.role === 'adviser' || u.role === 'teacher').length}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Officer Council</p>
                <p className="mt-2 text-2xl font-black text-red-600 dark:text-red-400">{stats.officers}</p>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Session Operator</p>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user?.email || 'No email available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ───── ACTIVITY LOG ───── */}
        {user?.role === 'super_admin' && (
          <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-white/[0.04] p-6 shadow-xl backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-red-600 dark:text-red-400">
                    System Audit
                  </p>
                  <h2 className="font-display text-lg font-black uppercase tracking-[0.18em] text-slate-900 dark:text-white">
                    Recent Activity
                  </h2>
                </div>
              </div>

              <button
                onClick={loadAdminData}
                className="rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-[#1a0d0d] px-3.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-white/60 transition-colors hover:border-red-400/40 hover:text-red-500 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] p-5 text-sm text-slate-500 dark:text-slate-400 font-mono text-xs">
                  No activity recorded yet.
                </div>
              ) : (
                activityLogs.map((log) => {
                  const meta = ACTION_META[log.action] || {
                    label: log.action,
                    color: 'text-slate-700 dark:text-[#FDFBF7]/80',
                    icon: Activity,
                  };
                  const Icon = meta.icon;
                  const when = timeAgo(log.createdAt);

                  return (
                    <div
                      key={log._id}
                      className="flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-[#1a0d0d] px-5 py-4 transition-colors hover:border-red-500/30"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] ${meta.color}`}
                      >
                        <Icon size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-bold text-slate-900 dark:text-[#FDFBF7]">
                            {log.actorName}
                          </span>{' '}
                          <span className={`${meta.color} font-medium`}>
                            {meta.label}
                          </span>
                          {log.targetName && log.targetName !== log.actorName && (
                            <>
                              {' '}
                              <span className="text-slate-400 dark:text-[#FDFBF7]/60">·</span>{' '}
                              <span className="text-slate-700 dark:text-[#FDFBF7]/80">
                                {log.targetName}
                              </span>
                            </>
                          )}
                        </p>

                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#FDFBF7]/40">
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