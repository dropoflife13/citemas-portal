'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-200 border border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-200 border border-red-500/30',
};

const SPECIALIZATION_LABELS = {
  traditional_arts: 'Traditional Arts',
  digital_arts: 'Digital Arts',
  voice_acting: 'Voice Acting',
  video_editing: 'Video Editing',
  photography: 'Photography',
};

export default function ApplicationsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    specialization: 'digital_arts',
    motivationLetter: '',
    portfolioLink: '',
  });
  const [formError, setFormError] = useState('');

  const isStaff = ['super_admin', 'teacher', 'officer'].includes(user?.role);
  const isApplicant = user?.role === 'applicant';
  const canApply = user && !isStaff && !isApplicant;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && token && isStaff) {
      loadApplications();
    } else if (user && token) {
      setLoading(false);
    }
  }, [authLoading, user, token, isStaff, router]);

  async function loadApplications() {
    try {
      setLoading(true);
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

  if (authLoading || (user && token && loading && isStaff)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-[#FDFBF7]/70">Loading portal applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-8 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Member Portal</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">Applications</h1>
            </div>

            {canApply && (
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                {showForm ? 'Cancel' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        {canApply && showForm && (
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <h2 className="text-xl font-black uppercase tracking-[0.18em] text-[#FDFBF7]">New Application</h2>
            {formError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Specialization</label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none focus:border-red-500"
                >
                  {Object.entries(SPECIALIZATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Motivation Letter</label>
                <textarea
                  value={form.motivationLetter}
                  onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
                  required
                  rows={6}
                  placeholder="Tell us why you want to join CITEMAS..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/35 focus:border-red-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Portfolio Link</label>
                <input
                  type="url"
                  value={form.portfolioLink}
                  onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                  placeholder="https://your-portfolio.com"
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/35 focus:border-red-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {isApplicant && !canApply && (
          <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-5 text-amber-100">
            <p className="text-sm font-semibold">Application Submitted</p>
            <p className="mt-2 text-sm text-amber-100/80">Your application is under review. The officers will review it shortly.</p>
          </div>
        )}

        {isStaff && (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#1a0d0d] text-[#FDFBF7]/70">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Applicant</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Specialization</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Portfolio</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-10 text-center text-[#FDFBF7]/60">Loading applications...</td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-10 text-center text-[#FDFBF7]/60">No applications yet.</td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const applicant = app.applicant || {};
                      const status = app.status || 'pending';

                      return (
                        <tr key={app._id} className="border-t border-white/10 align-top">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#FDFBF7]">
                              {applicant.firstName || 'Unknown'} {applicant.lastName || ''}
                            </div>
                            <div className="mt-1 text-sm text-[#FDFBF7]/60">{applicant.email || 'No email'}</div>
                          </td>
                          <td className="px-5 py-4 text-sm text-[#FDFBF7]/80">
                            {SPECIALIZATION_LABELS[app.specialization] || app.specialization}
                          </td>
                          <td className="px-5 py-4 text-sm text-[#FDFBF7]/80">
                            {app.portfolioLink ? (
                              <a href={app.portfolioLink} target="_blank" rel="noreferrer" className="text-red-300 underline underline-offset-4 hover:text-red-200">
                                View link
                              </a>
                            ) : (
                              <span className="text-[#FDFBF7]/45">No link</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
