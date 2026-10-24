'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Eye,
  FileText,
  XCircle,
  Clock3,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-200 border border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-200 border border-red-500/30',
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

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [actioningId, setActioningId] = useState(null);
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
    if (!authLoading && !user) {
      router.push('/login');
      return;
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
      setError('');
      showToast('Application deleted', 'success');
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
        return;
      }

      setApplications((prev) =>
        prev.map((application) =>
          application._id === appId ? { ...application, status: decision } : application
        )
      );
      setExpandedId(null);
      setError('');
      showToast(`Application ${decision}`, decision === 'approved' ? 'success' : 'info');
    } catch {
      setError('Could not update application status');
      showToast('Could not update application status', 'error');
    } finally {
      setActioningId(null);
    }
  }

  if (authLoading || (user && token && loading && isStaff)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0505] text-[#FEF2F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium tracking-wider text-red-200/70">Loading portal applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0505] px-4 py-12 text-[#FEF2F2] sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambient Red Highlights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-rose-950/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-8 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-red-300 mb-1.5">
              Member Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              Applications
            </h1>
          </div>

          {(canApply || isRejected) && (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-900/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {showForm ? 'Cancel Application' : (isRejected ? '+ Re-apply for Membership' : '+ Submit Application')}
            </button>
          )}
        </div>

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
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-900/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
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
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-900/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                + Start Application
              </button>
            </div>
          </div>
        )}

        {/* Staff Review Table */}
        {isStaff && (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[0_30px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-black/60 text-red-200/70 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Applicant</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Specialization</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Portfolio</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-red-200/50 font-medium">Loading applications...</td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-red-200/50 font-medium">No applications found.</td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const applicant = app.applicant || {};
                      const status = app.status || 'pending';
                      const isExpanded = expandedId === app._id;

                      return (
                         <Fragment key={app._id}>
                          <tr className="hover:bg-white/[0.02] transition-colors align-middle">

                            <td className="px-6 py-4">
                              <div className="font-bold text-white">
                                {applicant.firstName || 'Unknown'} {applicant.lastName || ''}
                              </div>
                              <div className="mt-0.5 text-xs text-red-300/80">{applicant.email || 'No email'}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-white/80">
                              {SPECIALIZATION_LABELS[app.specialization] || app.specialization}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {app.portfolioLink ? (
                                <a href={app.portfolioLink} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-4 font-bold">
                                  View link
                                </a>
                              ) : (
                                <span className="text-white/30">No link</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : app._id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/80 hover:border-red-400/50 hover:text-white transition-all"
                                >
                                  <Eye size={13} />
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplicationDecision(app._id, 'approved')}
                                  disabled={actioningId === app._id || status === 'approved'}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-emerald-500 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <CheckCircle2 size={13} />
                                  {actioningId === app._id ? '...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplicationDecision(app._id, 'rejected')}
                                  disabled={actioningId === app._id || status === 'rejected'}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-red-500 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle size={13} />
                                  {actioningId === app._id ? '...' : 'Deny'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app._id)}
                                  disabled={actioningId === app._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                  {actioningId === app._id ? '...' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={`${app._id}-details`} className="bg-black/40">
                              <td colSpan="5" className="px-6 py-6">
                                <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                                  <div className="rounded-2xl border border-white/10 bg-black/60 p-5">
                                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                                      <FileText size={14} />
                                      Motivation Letter
                                    </div>
                                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-red-200/80">
                                      {app.motivationLetter || 'No motivation letter provided.'}
                                    </p>
                                  </div>

                                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/60 p-5">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                                      <Clock3 size={14} />
                                      Applicant Metadata
                                    </div>
                                    <div className="space-y-2 text-xs text-white/80">
                                      <p><span className="text-white/40">Role:</span> {applicant.role || 'user'}</p>
                                      <p><span className="text-white/40">Submitted:</span> {new Date(app.createdAt).toLocaleString()}</p>
                                      <p><span className="text-white/40">Status:</span> <span className="uppercase font-bold">{status}</span></p>
                                      <p><span className="text-white/40">Portfolio:</span> {app.portfolioLink ? 'Provided' : 'Not provided'}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
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
