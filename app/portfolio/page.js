'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import AccessDenied from '@/components/AccessDenied';
import AchievementCard from '@/components/AchievementCard';
import AchievementModal from '@/components/AchievementModal';
import {
  Award,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  Sparkles,
  Image as ImageIcon,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';

const SPECIALIZATION_LABELS = {
  all: 'All Disciplines',
  digital_arts: 'Digital Arts',
  traditional_arts: 'Traditional Arts',
  voice_acting: 'Voice Acting',
  animation: 'Animation',
  videography: 'Videography',
  photography: 'Photography',
};

const LEVEL_COLORS = {
  beginner: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  intermediate: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  advanced: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  expert: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

export default function PortfolioPage() {
  const { user, token, loading } = useAuth();
  const { showToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my_posts', 'achievements'
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  useBodyScrollLock(isModalOpen);
  useBodyScrollLock(Boolean(selectedEntry));
  useBodyScrollLock(Boolean(deletingId));

  const [form, setForm] = useState({
    title: '',
    description: '',
    specialization: 'digital_arts',
    mediaUrl: '',
    level: 'beginner',
  });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const canView = user && ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member'].includes(user.role);
  const canCreate = user && ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni'].includes(user.role);
  const isStaff = user && ['super_admin', 'teacher', 'adviser', 'officer'].includes(user.role);
  const currentUserId = user?.id || user?._id;

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

  const loadAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/achievements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.achievements)) {
        setAchievements(data.achievements);
      }
    } catch {
      console.error('Failed to load achievements');
    }
  }, [token]);

  useEffect(() => {
    if (token && canView) {
      loadEntries();
      loadAchievements();
    }
  }, [token, canView, loadEntries, loadAchievements]);

  // Handle local file preview
  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

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
        setFormError('Please provide either an image/media URL or upload a file.');
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
      setPreviewUrl(null);
      setIsModalOpen(false);
      loadEntries();
      showToast('Portfolio piece added to gallery!', 'success');
    } catch (err) {
      setFormError(err.message || 'Could not connect to the server');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        setDeletingId(null);
        if (selectedEntry?._id === id) setSelectedEntry(null);
        showToast('Portfolio piece deleted successfully', 'info');
      } else {
        showToast(data.error || 'Failed to delete piece', 'error');
      }
    } catch {
      showToast('Could not connect to the server', 'error');
    }
  }

  async function handleModerate(id, status, feedback = '') {
    try {
      setActioningId(id);
      const res = await fetch('/api/portfolio', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, feedback }),
      });

      const data = await res.json();
      if (res.ok) {
        setEntries((prev) => prev.map((e) => (e._id === id ? { ...e, status, feedback } : e)));
        if (selectedEntry?._id === id) setSelectedEntry({ ...selectedEntry, status, feedback });
        showToast(`Piece marked as ${status}`, 'success');
      } else {
        showToast(data.error || 'Moderation action failed', 'error');
      }
    } catch {
      showToast('Could not connect to the server', 'error');
    } finally {
      setActioningId(null);
    }
  }

  async function handleDeleteAchievement(id) {
    try {
      const res = await fetch(`/api/achievements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAchievements((prev) => prev.filter((a) => a._id !== id));
        showToast('Achievement deleted successfully', 'info');
      } else {
        showToast(data.error || 'Failed to delete achievement', 'error');
      }
    } catch {
      showToast('Could not connect to the server', 'error');
    }
  }

  function handleAchievementCreated(newAchievement) {
    setAchievements((prev) => [newAchievement, ...prev]);
    showToast('Achievement posted successfully!', 'success');
  }

  const myEntries = useMemo(
    () => entries.filter((e) => (e.owner?._id || e.owner?.id || e.owner) === currentUserId),
    [entries, currentUserId]
  );

  const displayedEntries = useMemo(() => {
    const base = activeTab === 'my_posts' ? myEntries : entries;
    return base.filter((entry) => {
      const matchesSpec = specializationFilter === 'all' || entry.specialization === specializationFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesSpec;

      const title = (entry.title || '').toLowerCase();
      const desc = (entry.description || '').toLowerCase();
      const ownerName = `${entry.owner?.firstName || ''} ${entry.owner?.lastName || ''}`.toLowerCase();
      const spec = (entry.specialization || '').toLowerCase();

      return matchesSpec && (title.includes(q) || desc.includes(q) || ownerName.includes(q) || spec.includes(q));
    });
  }, [activeTab, myEntries, entries, specializationFilter, searchQuery]);

  const featureEntry = entries[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070305] text-[#FEF2F2]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-medium tracking-wider text-red-200/70">Loading creative portfolio...</p>
        </div>
      </div>
    );
  }

  if (!user || !canView) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-12">
        <AccessDenied
          title="Portfolio Showcase Restricted"
          resourceName="student portfolios"
          message="This section is available to approved CITEMAS members."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070305] px-4 py-10 text-slate-100 sm:px-6 lg:px-8 selection:bg-red-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-orange-950/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl space-y-8 relative z-10">
        
        {/* Hero Spotlight Section */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                CITEMAS Creative Guild Gallery
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                  Where craft becomes <br />
                  <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                    extraordinary.
                  </span>
                </h1>
                <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-400 font-light">
                  Showcase your creative works, discover peer portfolios across 6 multimedia tracks, and build an enduring creative presence.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {canCreate && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Submit Artwork</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAchievementModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-amber-300 transition-all hover:bg-amber-500/20 active:scale-95 cursor-pointer"
                    >
                      <Award size={15} />
                      <span>Post Achievement</span>
                    </button>
                  </>
                )}
              </div>

              {/* Counters */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5">
                  <div className="text-2xl font-black text-amber-400">{entries.length}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Student Works</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5">
                  <div className="text-2xl font-black text-red-400">{achievements.length}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Achievements</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5">
                  <div className="text-2xl font-black text-rose-400">6</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Tracks</div>
                </div>
              </div>
            </div>

            {/* Spotlight Card */}
            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-black/50 p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles size={12} />
                    Spotlight
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">Live</span>
                </div>

                {featureEntry?.mediaUrl ? (
                  <div
                    onClick={() => setSelectedEntry(featureEntry)}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 cursor-pointer group relative"
                  >
                    {featureEntry.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img
                        src={featureEntry.mediaUrl}
                        alt={featureEntry.title}
                        className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-gradient-to-br from-red-950/60 to-black text-sm text-slate-300">
                        View Media Showcase
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-xs text-white font-bold flex items-center gap-1.5">
                        <Eye size={14} /> Click to expand
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 text-xs text-slate-500">
                    No featured work yet
                  </div>
                )}

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-black text-white truncate">{featureEntry?.title || 'Guild Showcase'}</h2>
                    {featureEntry?.level && (
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${LEVEL_COLORS[featureEntry.level] || 'text-slate-400 border-white/10'}`}>
                        {featureEntry.level}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">
                    {featureEntry?.description || 'Fresh creative submissions from guild members will be highlighted here.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation & Search Toolbar */}
        <section className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-4 shadow-xl backdrop-blur-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Guild Works', count: entries.length },
                { id: 'my_posts', label: 'My Submissions', count: myEntries.length },
                { id: 'achievements', label: 'Achievements', count: achievements.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-950/60'
                      : 'border border-white/10 bg-black/30 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Specialization Filter Dropdown */}
            {activeTab !== 'achievements' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-black/40 text-xs">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={specializationFilter}
                    onChange={(e) => setSpecializationFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    {Object.entries(SPECIALIZATION_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-[#120505] text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Search bar */}
          {activeTab !== 'achievements' && (
            <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl">
              <Search size={16} className="text-slate-500 ml-2 shrink-0" />
              <input
                type="text"
                placeholder="Search works by title, artist, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pl-3 pr-4 text-xs text-white placeholder:text-slate-500 outline-none"
              />
              {(searchQuery || specializationFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSpecializationFilter('all');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        {/* Content Views */}
        {activeTab === 'achievements' ? (
          achievements.length > 0 ? (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((ach) => (
                <AchievementCard
                  key={ach._id}
                  achievement={ach}
                  currentUserId={currentUserId}
                  isStaff={isStaff}
                  onDelete={handleDeleteAchievement}
                />
              ))}
            </section>
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                <Award size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">No achievements posted yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Showcase awards, certifications, contest wins, and honors across the guild.
                </p>
              </div>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsAchievementModalOpen(true)}
                  className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-950/50 hover:brightness-110 transition cursor-pointer"
                >
                  Post An Achievement
                </button>
              )}
            </div>
          )
        ) : displayedEntries.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayedEntries.map((entry) => {
              const isOwner = (entry.owner?._id || entry.owner?.id || entry.owner) === currentUserId;
              const canDeleteThis = isStaff || isOwner;

              return (
                <article
                  key={entry._id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-xl transition-all duration-300 hover:border-white/20 flex flex-col justify-between"
                >
                  <div>
                    {/* Media Card Preview */}
                    <div
                      onClick={() => setSelectedEntry(entry)}
                      className="overflow-hidden border-b border-white/10 bg-black/60 relative cursor-pointer group"
                    >
                      {entry.mediaUrl ? (
                        entry.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img
                            src={entry.mediaUrl}
                            alt={entry.title}
                            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-56 items-center justify-center bg-gradient-to-br from-red-950/50 to-black text-xs text-slate-300">
                            External Media File
                          </div>
                        )
                      ) : (
                        <div className="flex h-56 items-center justify-center bg-black/40 text-xs text-slate-500">
                          No media preview
                        </div>
                      )}

                      {/* Specialization tag */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/75 text-amber-300 backdrop-blur-md border border-white/15">
                        {SPECIALIZATION_LABELS[entry.specialization] || entry.specialization}
                      </div>

                      {/* Status indicator if pending */}
                      {entry.status === 'pending' && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 backdrop-blur-md border border-amber-500/40">
                          Under Review
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-black text-white line-clamp-1 group-hover:text-red-300 transition-colors">
                          {entry.title}
                        </h3>
                        {entry.level && (
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${LEVEL_COLORS[entry.level] || 'text-slate-400'}`}>
                            {entry.level}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {entry.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                      <span className="truncate text-slate-500 text-[11px]">
                        by {entry.owner?.firstName || entry.applicant?.name || 'Member'} {entry.owner?.lastName || ''}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(entry)}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        >
                          View
                        </button>

                        {canDeleteThis && (
                          <button
                            type="button"
                            onClick={() => setDeletingId(entry._id)}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                            title="Delete artwork"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-16 text-center space-y-3">
            <ImageIcon size={36} className="mx-auto text-slate-600" />
            <p className="text-sm font-bold text-slate-300">
              {searchQuery || specializationFilter !== 'all'
                ? 'No portfolio pieces match your filter criteria.'
                : 'No portfolio pieces in this collection yet.'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {canCreate
                ? 'Submit your creative work to appear in the community gallery.'
                : 'Approved student works will appear here.'}
            </p>
          </div>
        )}
      </div>

      {/* DETAIL / LIGHTBOX MODAL */}
      <ModalPortal isOpen={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)}>
        <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-gradient-to-b from-[#160609] to-[#070305] p-6 sm:p-8 space-y-6 text-slate-100 shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {SPECIALIZATION_LABELS[selectedEntry?.specialization] || selectedEntry?.specialization}
              </div>
              <h2 className="text-2xl font-black text-white mt-0.5">{selectedEntry?.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                by {selectedEntry?.owner?.firstName || selectedEntry?.applicant?.name || 'Artist'}{' '}
                {selectedEntry?.owner?.lastName || ''}{' '}
                {selectedEntry?.owner?.studentId ? `• ${selectedEntry.owner.studentId}` : ''}
              </p>
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Media Full Display */}
          {selectedEntry?.mediaUrl && (
            <div className="rounded-2xl overflow-hidden bg-black/70 border border-white/10 max-h-[450px] flex items-center justify-center">
              {selectedEntry.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img
                  src={selectedEntry.mediaUrl}
                  alt={selectedEntry.title}
                  className="max-h-[450px] w-full object-contain"
                />
              ) : selectedEntry.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                <video src={selectedEntry.mediaUrl} controls className="max-h-[450px] w-full" />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-slate-300">External media content</p>
                  <a
                    href={selectedEntry.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    <span>Open External Resource</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Description & Metadata */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Description</h4>
            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
              {selectedEntry?.description}
            </p>
          </div>

          {/* Staff Moderation Bar */}
          {isStaff && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Moderation Status</span>
                Status: <span className="font-bold text-white uppercase">{selectedEntry?.status || 'approved'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModerate(selectedEntry._id, 'approved')}
                  disabled={actioningId === selectedEntry?._id || selectedEntry?.status === 'approved'}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-500 transition disabled:opacity-40 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleModerate(selectedEntry._id, 'rejected')}
                  disabled={actioningId === selectedEntry?._id || selectedEntry?.status === 'rejected'}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-[10px] font-black uppercase tracking-wider text-white hover:bg-red-500 transition disabled:opacity-40 cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            {selectedEntry?.mediaUrl && (
              <a
                href={selectedEntry.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold underline"
              >
                <span>View Full Resolution</span>
                <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={() => setSelectedEntry(null)}
              className="ml-auto px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* DELETE CONFIRMATION MODAL */}
      <ModalPortal isOpen={Boolean(deletingId)} onClose={() => setDeletingId(null)}>
        <div className="relative w-full max-w-sm rounded-3xl p-6 space-y-4 text-slate-100 border border-red-500/30 bg-gradient-to-b from-[#1c080b] to-[#070305] shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Delete Portfolio Piece</h3>
              <p className="text-xs text-slate-400">Are you sure you want to remove this piece from the guild gallery?</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deletingId)}
              className="px-4 py-2 rounded-xl bg-red-600 text-xs font-black uppercase tracking-wider text-white hover:bg-red-500 transition cursor-pointer shadow-lg shadow-red-950/50"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* SUBMISSION MODAL */}
      <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-gradient-to-b from-[#18060a] to-[#070305] p-8 space-y-5 shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Member Portfolio</p>
              <h2 className="text-xl font-black text-white mt-0.5">Submit Artwork / Project</h2>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-slate-400 hover:text-white font-bold text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          {formError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">Project Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                placeholder="Give your project a title..."
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                placeholder="Describe your creative process, tools used, or inspiration..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">Specialization</label>
                <select
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="digital_arts">Digital Arts</option>
                  <option value="traditional_arts">Traditional Arts</option>
                  <option value="voice_acting">Voice Acting</option>
                  <option value="animation">Animation</option>
                  <option value="videography">Videography</option>
                  <option value="photography">Photography</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">Skill Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-3 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">
                Upload Image or Video File (Max 10MB)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-[10px] file:font-black file:uppercase file:text-white hover:file:bg-red-500 bg-black/40 border border-white/10 rounded-2xl px-3 py-2 cursor-pointer"
              />

              {previewUrl && (
                <div className="mt-3 relative rounded-xl overflow-hidden h-28 border border-white/20 bg-black/50 flex items-center justify-center">
                  <img src={previewUrl} alt="Upload preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-1 right-1 bg-black/80 text-red-400 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-300">
                Or External URL (YouTube, Vimeo, Behance, Artstation)
              </label>
              <input
                value={form.mediaUrl}
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                disabled={Boolean(file)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl border border-white/15 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 disabled:opacity-60 cursor-pointer"
              >
                {uploading ? 'Uploading...' : 'Publish to Gallery'}
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* Post Achievement Modal */}
      <AchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
        onSuccess={handleAchievementCreated}
      />
    </div>
  );
}
