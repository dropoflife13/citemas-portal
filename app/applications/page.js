'use client';

import { useEffect, useState, Fragment, useMemo, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import CitemasLoader from '@/components/CitemasLoader';

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
    portfolioImages: [],
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const portfolioFileInputRef = useRef(null);
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

  async function handlePortfolioImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !token) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!validFiles.length) {
      setFormError('Please select valid image files (JPG, PNG, WEBP, GIF).');
      return;
    }

    setUploadingImages(true);
    setFormError('');

    try {
      const uploadedUrls = [];
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/portfolio/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload image');
        }
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({
          ...prev,
          portfolioImages: [...new Set([...(prev.portfolioImages || []), ...uploadedUrls])],
        }));
        showToast(
          `Uploaded ${uploadedUrls.length} portfolio image${uploadedUrls.length > 1 ? 's' : ''} (will also be added to your profile)`,
          'success'
        );
      }
    } catch (err) {
      setFormError(err.message || 'Image upload failed');
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = '';
    }
  }

  function handleRemovePortfolioImage(urlToRemove) {
    setForm((prev) => ({
      ...prev,
      portfolioImages: (prev.portfolioImages || []).filter((url) => url !== urlToRemove),
    }));
  }

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

  if (checkingAuth || authLoading || !user || !token || loading) {
    return <CitemasLoader label="Loading portal applications..." />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-10 text-[var(--foreground)] sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-red-500 selection:text-white transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-orange-950/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        
        {/* Clean Studio Page Header (No Redundant Box or Duplicate CTA) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-red-600 dark:text-red-300 mb-2">
              {isStaff ? 'Executive Review Queue' : 'Member Portal // Applications'}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Membership{' '}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white">
                Applications
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {isStaff
                ? 'Review, verify credentials, and approve student applications for official org membership.'
                : 'Submit your creative specialization, motivation letter, and portfolio works to join CITEMAS.'}
            </p>
          </div>
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
              <div className="text-[11px] text-slate-500 mt-1">Official org members</div>
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

        {/* Application Form (Shown directly when student can apply, or when re-applying after rejection) */}
        {(canApply || (isRejected && showForm)) && !isStaff && (
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 p-8 shadow-2xl backdrop-blur-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-red-500 font-bold">
                  FORM // 01
                </span>
                <h2 className="text-xl font-black uppercase tracking-[0.14em] text-slate-900 dark:text-white mt-0.5">
                  New Org Application
                </h2>
              </div>
              {isRejected && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
            
            {formError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {formError}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-red-200/70">Specialization</label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/40 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none focus:border-red-500 transition-colors"
                >
                  {Object.entries(SPECIALIZATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value} className="bg-white dark:bg-[#120505] text-slate-900 dark:text-white">{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-red-200/70">Motivation Letter</label>
                <textarea
                  value={form.motivationLetter}
                  onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
                  required
                  rows={5}
                  placeholder="Tell us why you want to join CITEMAS..."
                  className="w-full resize-none rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/40 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-red-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-red-200/70">
                  Portfolio Link <span className="text-slate-400 dark:text-white/40 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={form.portfolioLink}
                  onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                  placeholder="https://your-portfolio.com"
                  className="w-full rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-black/40 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-red-500 transition-colors"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-red-200/70">
                      Upload Portfolio Images <span className="text-emerald-600 dark:text-emerald-400 font-mono">// Auto-Inserted into Your Profile</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5">
                      Upload artwork, photography, or design samples. These images will also be added directly to your CITEMAS Profile showcase.
                    </p>
                  </div>

                  {form.portfolioImages?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => portfolioFileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-200 hover:bg-red-500/25 hover:border-red-500 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Upload size={14} className="text-red-400" />
                      <span>{uploadingImages ? 'Uploading...' : '+ Add More Images'}</span>
                    </button>
                  )}

                  <input
                    ref={portfolioFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePortfolioImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Dropzone / Empty state when no images uploaded yet */}
                {(!form.portfolioImages || form.portfolioImages.length === 0) ? (
                  <div
                    onClick={() => !uploadingImages && portfolioFileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/[0.02] dark:bg-black/30 px-6 py-8 text-center transition-all hover:border-red-500/50 hover:bg-red-500/[0.04] cursor-pointer"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 group-hover:scale-105 transition-transform">
                      <ImageIcon size={20} />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-white/80">
                      {uploadingImages ? 'Uploading your artwork to studio storage...' : 'Click to upload portfolio images from your device'}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                      Supports JPG, PNG, WEBP, GIF • Multiple images allowed • Automatically added to your Profile
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {form.portfolioImages.map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className="group relative aspect-square overflow-hidden rounded-2xl border border-black/15 dark:border-white/15 bg-black/50 shadow-lg"
                      >
                        <img
                          src={imgUrl}
                          alt={`Portfolio upload ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-90" />

                        <span className="absolute bottom-2 left-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-200 backdrop-blur-md">
                          Profile Ready
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemovePortfolioImage(imgUrl)}
                          title="Remove image"
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-black/10 dark:border-white/10">
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-900/40 border border-white/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : uploadingImages ? 'Uploading Images...' : 'Submit Application'}
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
            <div className="space-y-3 flex-1">
              <span className="inline-block rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
                Application Under Review
              </span>
              <h2 className="text-xl font-bold text-white">Application Submitted Successfully</h2>
              <p className="text-xs text-amber-100/80 leading-relaxed max-w-xl">
                Your org application {appStatusData.application?.specialization ? `for ${SPECIALIZATION_LABELS[appStatusData.application.specialization] || appStatusData.application.specialization}` : ''} has been received and is currently under review by our executive officers and advisers. Any portfolio images you uploaded have also been added to your Profile.
              </p>

              {Array.isArray(appStatusData.application?.portfolioImages) && appStatusData.application.portfolioImages.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300/90">
                    Submitted Portfolio Works ({appStatusData.application.portfolioImages.length} — Inserted in Profile)
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {appStatusData.application.portfolioImages.map((imgUrl, idx) => (
                      <a
                        key={`${imgUrl}-${idx}`}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-16 w-16 overflow-hidden rounded-xl border border-white/15 bg-black/40 hover:border-amber-400 transition"
                      >
                        <img src={imgUrl} alt={`Submitted work ${idx + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
                >
                  View in My Profile
                </Link>
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
                <div className="py-16 flex justify-center">
                  <CitemasLoader label="Loading application repository..." fullScreen={false} size="sm" />
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
                      ? 'When students apply for org membership, their submissions will appear here.'
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
                            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition-colors">
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
                          {Array.isArray(app.portfolioImages) && app.portfolioImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : app._id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-mono text-red-200 hover:bg-red-500/20 transition-all cursor-pointer"
                            >
                              <ImageIcon size={12} className="text-red-400" />
                              <span>{app.portfolioImages.length} {app.portfolioImages.length === 1 ? 'Image' : 'Images'}</span>
                            </button>
                          )}

                          {app.portfolioLink && (
                            <a
                              href={app.portfolioLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 transition-all"
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
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{isExpanded ? 'Close' : 'Inspect'}</span>
                          </button>

                          {/* Decision Action Buttons (Hidden when already approved to prevent accidental revocation or user error) */}
                          {status !== 'approved' && (
                            <>
                              {/* Accept Button */}
                              <button
                                type="button"
                                onClick={() => handleApplicationDecision(app._id, 'approved')}
                                disabled={actioningId === app._id || isSelf}
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
                                    className="rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-[9px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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
                            </>
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
                        <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 p-6 backdrop-blur-2xl grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
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

                            {Array.isArray(app.portfolioImages) && app.portfolioImages.length > 0 && (
                              <div className="pt-4 border-t border-white/10 space-y-2.5">
                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-red-400">
                                  <ImageIcon size={13} />
                                  <span>UPLOADED PORTFOLIO IMAGES ({app.portfolioImages.length})</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {app.portfolioImages.map((imgUrl, idx) => (
                                    <a
                                      key={`${imgUrl}-${idx}`}
                                      href={imgUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/50 hover:border-red-500/60 transition-all"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`Applicant portfolio ${idx + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink size={16} className="text-white" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
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
