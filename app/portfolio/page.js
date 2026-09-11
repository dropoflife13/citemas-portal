'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

const CITEMAS_RED = '#DC2626';
const CITEMAS_DARK_RED = '#7F1D1D';
const CITEMAS_CREAM = '#FDFBF7';
const CITEMAS_GOLD = '#F59E0B';
const MUTED = 'rgba(253,251,247,0.7)';
const FAINT = 'rgba(253,251,247,0.45)';

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function PortfolioPage() {
  const { user, token, loading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    specialization: 'digital_arts',
    mediaUrl: '',
    level: 'beginner',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const canView = user && ['super_admin', 'teacher', 'officer', 'alumni', 'member'].includes(user.role);
  const canCreate = user && ['super_admin', 'teacher', 'officer', 'member'].includes(user.role);
  const isStaff = user && ['super_admin', 'teacher', 'officer'].includes(user.role);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEntries(data);
      } else {
        setError(data.error || 'Failed to load entries');
      }
    } catch {
      setError('Could not connect to the server');
    }
  }, [token]);

  useEffect(() => {
    if (token && canView) loadEntries();
  }, [token, canView, loadEntries]);

  async function handleFileUpload(selectedFile) {
    if (!selectedFile) return null;

    const formData = new FormData();
    formData.append('file', selectedFile);

    const res = await fetch('/api/portfolio/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setUploading(true);

    try {
      let finalMediaUrl = form.mediaUrl;

      if (file) {
        finalMediaUrl = await handleFileUpload(file);
      }

      if (!finalMediaUrl) {
        setFormError('Please provide either a media URL or upload a file.');
        setUploading(false);
        return;
      }

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, mediaUrl: finalMediaUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Submission failed');
        return;
      }

      setForm({ title: '', description: '', specialization: 'digital_arts', mediaUrl: '', level: 'beginner' });
      setFile(null);
      setIsModalOpen(false);
      loadEntries();
    } catch (err) {
      setFormError(err.message || 'Could not connect to the server');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this portfolio piece?')) return;

    try {
      const res = await fetch(`/api/portfolio?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        loadEntries();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Could not connect to the server');
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">Loading portfolio...</div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">Please log in.</div>;
  }

  if (!canView) {
    return <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">Your role does not have access to the portfolio gallery.</div>;
  }

  const currentUserId = user.id || user._id;
  const myEntries = entries.filter((e) => (e.owner?._id || e.owner?.id || e.owner) === currentUserId);
  const displayedEntries = activeTab === 'my_posts' ? myEntries : entries;
  const featureEntry = entries[0] || null;

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-8 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),transparent_25%),linear-gradient(135deg,#1a0d0d_0%,#110808_50%,#0d0909_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-10 h-44 w-44 rounded-full bg-red-600/15 blur-3xl" />
            <div className="absolute right-8 top-8 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-red-900/20 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-red-200">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                CITEMAS Portfolio
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-black leading-none tracking-[-0.06em] text-[#FDFBF7] sm:text-5xl lg:text-6xl">
                  Creative work that feels <span className="text-red-400">alive</span>.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-[#FDFBF7]/75">
                  Showcase your craft, highlight your process, and give new members a stronger sense of the talent inside CITEMAS.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {canCreate && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-full bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95"
                  >
                    Submit Work
                  </button>
                )}
                <button
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight * 0.3, behavior: 'smooth' })}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF7] transition-colors hover:border-red-500/40 hover:text-red-200"
                >
                  Browse Gallery
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['40+', 'Student Works'],
                  ['5', 'Creative Tracks'],
                  ['Live', 'Showcase Feed'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                    <div className="text-2xl font-black text-[#F5C76A]">{value}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[30px] border border-white/10 bg-[#180d0d]/80 p-4 shadow-[0_25px_70px_rgba(0,0,0,0.55)]">
                <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  <span>Featured</span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">Live</span>
                </div>

                {featureEntry?.mediaUrl ? (
                  <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0707]">
                    {featureEntry.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img src={featureEntry.mediaUrl} alt={featureEntry.title} className="h-72 w-full object-cover" />
                    ) : (
                      <div className="flex h-72 items-center justify-center bg-gradient-to-br from-red-900/30 to-[#0b0707] text-sm text-[#FDFBF7]/75">
                        View external media
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-[22px] border border-dashed border-white/15 bg-[#150d0d] text-sm text-[#FDFBF7]/60">
                    No featured work yet
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black text-[#FDFBF7]">{featureEntry?.title || 'Portfolio Spotlight'}</h2>
                    <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-200">
                      {featureEntry?.level || 'new'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#FDFBF7]/65">
                    {featureEntry?.description || 'Fresh creative projects from CITEMAS members appear here.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All Works', count: entries.length },
              { id: 'my_posts', label: 'My Submissions', count: myEntries.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  activeTab === tab.id ? 'bg-gradient-to-r from-red-600 to-red-800 text-[#FDFBF7]' : 'border border-white/10 bg-[#1a0d0d] text-[#FDFBF7]/70'
                }`}
              >
                {tab.label} <span className="ml-1 text-[#FDFBF7]/75">({tab.count})</span>
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {displayedEntries.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {displayedEntries.map((entry) => (
              <article
                key={entry._id}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_25px_60px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="overflow-hidden border-b border-white/10 bg-[#120b0b]">
                  {entry.mediaUrl ? (
                    entry.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img src={entry.mediaUrl} alt={entry.title} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-56 items-center justify-center bg-gradient-to-br from-red-900/40 to-[#120b0b] text-sm text-[#FDFBF7]/80">
                        External media preview
                      </div>
                    )
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#1a0d0d] to-[#0d0909] text-sm text-[#FDFBF7]/60">
                      No media
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#FDFBF7]/50">{entry.specialization || 'Creative Work'}</p>
                      <h3 className="mt-2 text-xl font-black text-[#FDFBF7]">{entry.title}</h3>
                    </div>
                    <span className="rounded-full border border-red-500/25 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-200">
                      {entry.level}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-sm leading-relaxed text-[#FDFBF7]/70">{entry.description}</p>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                    <span className="max-w-[60%] truncate text-[#FDFBF7]/50">
                      by {entry.owner?.firstName || 'Member'} {entry.owner?.lastName || ''}
                    </span>

                    <div className="flex items-center gap-2">
                      {entry.mediaUrl && (
                        <a
                          href={entry.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-white/10 bg-[#1a0d0d] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#FDFBF7]"
                        >
                          View
                        </a>
                      )}

                      {isStaff && (
                        <button
                          onClick={() => handleDelete(entry._id)}
                          className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-sm text-[#FDFBF7]/70">
            No portfolio pieces found for this view.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-[#170c0c] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)]">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">New Submission</p>
                <h2 className="mt-2 text-2xl font-black text-[#FDFBF7]">Add to the gallery</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full border border-white/10 bg-[#1a0d0d] px-3 py-1.5 text-[#FDFBF7]/70">
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/35 focus:border-red-500"
                  placeholder="Project title"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/35 focus:border-red-500"
                  placeholder="Tell people what this work is about"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Specialization</label>
                  <select
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none focus:border-red-500"
                  >
                    <option value="digital_arts">Digital Arts</option>
                    <option value="traditional_arts">Traditional Arts</option>
                    <option value="voice_acting">Voice Acting</option>
                    <option value="video_editing">Video Editing</option>
                    <option value="photography">Photography</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Level</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none focus:border-red-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">Media File</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] file:mr-3 file:rounded-full file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.2em] file:text-[#FDFBF7]"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">External URL</label>
                <input
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none placeholder:text-[#FDFBF7]/35 focus:border-red-500"
                  disabled={!!file}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-white/10 bg-[#1a0d0d] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/70">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="rounded-full bg-gradient-to-r from-red-600 to-red-800 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7] disabled:opacity-60">
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}