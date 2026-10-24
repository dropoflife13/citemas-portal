'use client';

import { useEffect, useState, Fragment, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Eye,
  FileText,
  XCircle,
  Clock3,
  Trash2,
  Search,
  Filter,
  UserCheck,
  ExternalLink,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
  approved: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  rejected: 'bg-rose-500/10 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
};

const SPECIALIZATION_LABELS = {
  traditional_arts: 'Traditional Arts',
  digital_arts: 'Digital Arts',
  voice_acting: 'Voice Acting',
  animation: 'Animation',
  videography: 'Videography',
  photography: 'Photography',
};

export default function ApplicationsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDenyId, setConfirmDenyId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  const [form, setForm] = useState({
    specialization: 'digital_arts',
    motivationLetter: '',
    portfolioLink: '',
  });
  const [formError, setFormError] = useState('');
  const [appStatusData, setAppStatusData] = useState({
    status: null,
    hasApplication: false,
    application: null,
  });

  const isStaff = ['super_admin', 'teacher', 'adviser', 'officer'].includes(user?.role);
  const isMember = user?.role === 'member' || appStatusData.status === 'approved';
  const isApplicant = user?.role === 'applicant' || appStatusData.status === 'pending';
  const isRejected = appStatusData.status === 'rejected';
  const canApply = Boolean(user && !isStaff && !isApplicant && !isMember);

  async function loadApplications() {
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setApplications([]);
        setError(data.error || 'Failed to load applications');
        return;
      }

      setApplications(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setApplications([]);
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  }

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
      setCheckingAuth(false);
    }

    if (user && token && isStaff) {
      loadApplications();
    } else if (user && token) {
      fetch('/api/applications/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setAppStatusData({
              status: data.status,
              hasApplication: data.hasApplication,
              application: data.application,
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [authLoading, user, token, isStaff, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Could not submit application');
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem('citemas_user') || '{}');
      localStorage.setItem('citemas_user', JSON.stringify({ ...storedUser, role: 'applicant' }));
      window.location.reload();
    } catch {
      setFormError('Could not connect to the server');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteApplication(appId) {
    if (!appId) return;

    try {
      setActioningId(appId);
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to delete application');
        showToast(data.error || 'Unable to delete application', 'error');
        return;
      }

      setApplications((prev) => prev.filter((app) => app._id !== appId));
      setExpandedId(null);
      setConfirmDeleteId(null);
      setError('');
      showToast('Application record deleted', 'success');
    } catch {
      setError('Could not delete application');
      showToast('Could not delete application', 'error');
    } finally {
      setActioningId(null);
    }
  }

  async function handleApplicationDecision(appId, decision) {
    if (!appId || !decision) return;

    try {
      setActioningId(appId);
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to update application status');
        showToast(data.error || 'Unable to update application status', 'error');
        return;
      }

      setApplications((prev) =>
        prev.map((application) =>
          application._id === appId ? { ...application, ...data, status: decision } : application
        )
      );
      setExpandedId(null);
      setConfirmDenyId(null);
      setError('');
      showToast(`Application ${decision}`, decision === 'approved' ? 'success' : 'info');
    } catch {
      setError('Could not update application status');
      showToast('Could not update application status', 'error');
    } finally {
      setActioningId(null);
    }
  }

  // Summary counts
  const totalCount = applications.length;
  const pendingCount = useMemo(() => applications.filter((a) => a.status === 'pending').length, [applications]);
  const approvedCount = useMemo(() => applications.filter((a) => a.status === 'approved').length, [applications]);
  const rejectedCount = useMemo(() => applications.filter((a) => a.status === 'rejected').length, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const applicant = app.applicant || {};
      const fullName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.toLowerCase();
      const email = (applicant.email || '').toLowerCase();
      const studentId = (applicant.studentId || '').toLowerCase();
      const q = searchQuery.trim().toLowerCase();

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || studentId.includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesSpec = specializationFilter === 'all' || app.specialization === specializationFilter;

      return matchesSearch && matchesStatus && matchesSpec;
    });
  }, [applications, searchQuery, statusFilter, specializationFilter]);

  if (checkingAuth || authLoading || !user || !token || (loading && isStaff)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FEF2F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium tracking-wider text-red-200/70">Loading portal applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070305] px-4 py-12 text-[#FEF2F2] sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-orange-950/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-8 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-red-300 mb-1.5">
              {isStaff ? 'Executive Review Queue' : 'Member Portal'}
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              Membership Applications
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isStaff
                ? 'Review, verify credentials, and approve student applications for official guild membership.'
                : 'Manage your creative guild membership application and track verification status.'}
            </p>
          </div>

          {(canApply || isRejected) && (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/60 border border-white/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {showForm ? 'Cancel Application' : (isRejected ? '+ Re-apply for Membership' : '+ Submit Application')}
            </button>
          )}
        </div>

        {/* Executive Summary Cards for Officers / Admins */}
        {isStaff && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`text-left rounded-3xl p-5 border transition-all duration-200 cursor-pointer ${
                statusFilter === 'all'
                  ? 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-950/50'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Callset</div>
              <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">All received submissions</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`text-left rounded-3xl p-5 border transition-all duration-200 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'border-amber-500/60 bg-amber-500/15 shadow-lg shadow-amber-950/50'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Pending Review</span>
                {pendingCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div className="text-2xl font-black text-amber-200 mt-1">{pendingCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Awaiting officer action</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`text-left rounded-3xl p-5 border transition-all duration-200 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-950/50'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Approved</div>
              <div className="text-2xl font-black text-emerald-200 mt-1">{approvedCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Official guild members</div>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`text-left rounded-3xl p-5 border transition-all duration-200 cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'border-rose-500/60 bg-rose-500/15 shadow-lg shadow-rose-950/50'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">Denied</div>
              <div className="text-2xl font-black text-rose-200 mt-1">{rejectedCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">Under revision / declined</div>
            </button>
          </div>
        )}

        {/* Application Form */}
        {(canApply || isRejected) && showForm && (
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-fadeIn">
            <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white mb-6">New Guild Application</h2>
            
            {formError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-red-200/70">Specialization</label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-red-500 transition-colors"
                >
                  {Object.entries(SPECIALIZATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value} className="bg-[#120505] text-white">{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-red-200/70">Motivation Letter</label>
                <textarea
                  value={form.motivationLetter}
                  onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
                  required
                  rows={5}
                  placeholder="Tell us why you want to join CITEMAS..."
                  className="w-full resize-none rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-red-200/70">Portfolio Link</label>
                <input
                  type="url"
                  value={form.portfolioLink}
                  onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                  placeholder="https://your-portfolio.com"
                  className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-900/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}

        {/* Approved Member Status Card */}
        {isMember && !isStaff && (
          <div className="rounded-[28px] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.02] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                  Membership Active & Verified
                </span>
                <h2 className="text-2xl font-black text-white">Official CITEMAS Member</h2>
              </div>
            </div>
            <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
              Congratulations! Your membership application has been approved. You have full access to the member directory, student creative portfolios, community events, and studio exhibitions.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/users"
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:brightness-110 active:scale-95"
              >
                Browse Member Directory
              </Link>
              <Link
                href="/portfolio"
                className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-white/10 transition active:scale-95"
              >
                View Student Portfolios
              </Link>
              <Link
                href="/profile"
                className="rounded-xl border border-transparent px-4 py-3 text-xs font-semibold text-white/60 hover:text-white transition"
              >
                My Profile
              </Link>
            </div>
          </div>
        )}

        {/* Applicant Under Review Card */}
        {isApplicant && !isStaff && (
          <div className="rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-white/[0.02] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-amber-100 flex items-start gap-4 animate-fadeIn">
            <Clock3 size={28} className="text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
                Application Under Review
              </span>
              <h2 className="text-xl font-bold text-white">Application Submitted Successfully</h2>
              <p className="text-xs text-amber-100/80 leading-relaxed max-w-xl">
                Your guild application {appStatusData.application?.specialization ? `for ${SPECIALIZATION_LABELS[appStatusData.application.specialization] || appStatusData.application.specialization}` : ''} has been received and is currently under review by our executive officers and advisers. Once reviewed, your role will update automatically.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Application Card */}
        {isRejected && !showForm && !isStaff && (
          <div className="rounded-[28px] border border-red-500/30 bg-gradient-to-br from-red-500/[0.08] to-white/[0.02] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-red-100 flex items-start gap-4 animate-fadeIn">
            <XCircle size={28} className="text-red-300 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-red-500/40 bg-red-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-200">
                Application Update
              </span>
              <h2 className="text-xl font-bold text-white">Previous Application Not Approved</h2>
              <p className="text-xs text-red-100/80 leading-relaxed max-w-xl">
                Your previous membership application was not approved. You are welcome to revise your portfolio link and motivation letter and submit a new application for review.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:brightness-110 active:scale-95"
                >
                  Re-apply for Membership
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Onboarding Card (Not Applied Yet) */}
        {canApply && !showForm && !isStaff && (
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-center space-y-5 max-w-2xl mx-auto py-12 animate-fadeIn">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <FileText size={28} />
            </div>
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                Student Account
              </span>
              <h2 className="text-2xl font-black text-white">Apply for CITEMAS Guild Membership</h2>
              <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
                You are currently registered with a Student account. Choose your creative specialization, submit your motivation statement and portfolio link, and apply to become an official CITEMAS member.
              </p>
            </div>
            <div>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/60 border border-white/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                + Start Application
              </button>
            </div>
          </div>
        )}

        {/* Staff Review Table & Filters */}
        {isStaff && (
          <div className="space-y-4">
            {/* Interactive Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#120505] text-white">All Specializations</option>
                    {Object.entries(SPECIALIZATION_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-[#120505] text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchQuery || statusFilter !== 'all' || specializationFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSpecializationFilter('all');
                    }}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Sleek Editorial Vertical List (No HTML Table) */}
            <div className="border-t border-white/10 divide-y divide-white/10">
              {loading ? (
                <div className="py-16 text-center text-red-200/50 font-mono text-xs">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500 mx-auto mb-2" />
                  LOADING APPLICATION REPOSITORY...
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="py-20 text-center">
                  <UserCheck size={36} className="mx-auto text-slate-600 mb-3" />
                  <div className="font-display text-2xl font-black uppercase text-slate-300">
                    {applications.length === 0
                      ? 'No applications submitted yet'
                      : 'No applications match filter'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">
                    {applications.length === 0
                      ? 'When students apply for guild membership, their submissions will appear here.'
                      : 'Try resetting filters or modifying your search keyword.'}
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const applicant = app.applicant || {};
                  const applicantId = applicant._id || app.applicant;
                  const isSelf = String(applicantId) === String(user?.id);
                  const status = app.status || 'pending';
                  const isExpanded = expandedId === app._id;
                  const isDeleting = confirmDeleteId === app._id;
                  const isDenying = confirmDenyId === app._id;

                  return (
                    <div key={app._id} className="py-6 transition-all duration-300 hover:bg-white/[0.01]">
                      {/* Main Application Row */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left: Applicant Name (Massive 3xl-5xl font) + Academic Sub-info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white hover:text-red-400 transition-colors">
                              {applicant.firstName || 'Unknown'} {applicant.lastName || ''}
                            </h3>
                            {isSelf && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase font-mono font-bold">
                                You
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
                            <span className="text-red-400 font-bold uppercase tracking-wider">
                              {SPECIALIZATION_LABELS[app.specialization] || app.specialization}
                            </span>
                            <span>•</span>
                            <span>{applicant.email || 'No email'}</span>
                            {applicant.studentId && (
                              <>
                                <span>•</span>
                                <span>ID: {applicant.studentId}</span>
                              </>
                            )}
                            {applicant.yearLevel && (
                              <>
                                <span>•</span>
                                <span>{applicant.yearLevel} Year</span>
                              </>
                            )}
                            {applicant.department && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px]">{applicant.department}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: Glowing Status Pill + Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          {app.portfolioLink && (
                            <a
                              href={app.portfolioLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-xs font-mono text-slate-300 hover:text-white hover:border-white/20 transition-all"
                            >
                              <span>Portfolio</span>
                              <ExternalLink size={11} />
                            </a>
                          )}

                          {/* Glowing Status Pill */}
                          <span className={`inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                            {status}
                          </span>

                          {/* Details Toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : app._id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{isExpanded ? 'Close' : 'Inspect'}</span>
                          </button>

                          {/* Accept Button */}
                          <button
                            type="button"
                            onClick={() => handleApplicationDecision(app._id, 'approved')}
                            disabled={actioningId === app._id || status === 'approved' || isSelf}
                            title={isSelf ? 'Self-approval is prohibited' : 'Accept application'}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/50 transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            <CheckCircle2 size={12} />
                            <span>{actioningId === app._id ? '...' : 'Accept'}</span>
                          </button>

                          {/* Deny Button with inline confirm */}
                          {isDenying ? (
                            <div className="inline-flex items-center gap-1 animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => handleApplicationDecision(app._id, 'rejected')}
                                disabled={actioningId === app._id}
                                className="rounded-full bg-red-700 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white hover:bg-red-600 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDenyId(null)}
                                className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-medium text-slate-400 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDenyId(app._id);
                                setConfirmDeleteId(null);
                              }}
                              disabled={actioningId === app._id || status === 'rejected' || isSelf}
                              title={isSelf ? 'Self-review is prohibited' : 'Deny application'}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-600/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-red-500 transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            >
                              <XCircle size={12} />
                              <span>Deny</span>
                            </button>
                          )}

                          {/* Delete Button with inline confirm */}
                          {isDeleting ? (
                            <div className="inline-flex items-center gap-1 animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => handleDeleteApplication(app._id)}
                                disabled={actioningId === app._id}
                                className="rounded-full bg-rose-700 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white hover:bg-rose-600 cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] font-medium text-slate-400 hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteId(app._id);
                                setConfirmDenyId(null);
                              }}
                              disabled={actioningId === app._id}
                              title="Delete application record"
                              className="p-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-200 transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="mt-4 rounded-3xl border border-white/10 bg-[#090a0b]/90 p-6 backdrop-blur-2xl grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-red-400">
                              <FileText size={14} />
                              MOTIVATION STATEMENT
                            </div>
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300 font-light">
                              {app.motivationLetter || 'No motivation letter provided.'}
                            </p>
                            {app.portfolioLink && (
                              <div className="pt-3 border-t border-white/10 text-xs font-mono">
                                <span className="text-slate-500">Destination: </span>
                                <a
                                  href={app.portfolioLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-red-400 hover:text-red-300 underline inline-flex items-center gap-1"
                                >
                                  {app.portfolioLink}
                                  <ExternalLink size={11} />
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 text-xs font-mono text-slate-400">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60 mb-2">
                              <GraduationCap size={14} />
                              AUDIT TELEMETRY
                            </div>
                            <p><span className="text-slate-500">Submitted:</span> {new Date(app.createdAt).toLocaleString()}</p>
                            <p><span className="text-slate-500">Role:</span> {applicant.role || 'user'}</p>
                            {app.reviewedBy && (
                              <div className="pt-2 text-emerald-400">
                                Reviewed by {app.reviewedBy.firstName || 'Officer'} ({app.reviewedBy.role || 'officer'})
                              </div>
                            )}
                            {isSelf && (
                              <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-300 flex items-center gap-1.5">
                                <ShieldAlert size={14} className="shrink-0" />
                                <span>SEC-05: Self-approval disabled.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
