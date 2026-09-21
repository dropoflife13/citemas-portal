'use client';

import { useState } from 'react';
import { X, Award, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';

export default function AchievementModal({ isOpen, onClose, onSuccess }) {
  useBodyScrollLock(isOpen);

  const { token } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().getFullYear().toString(),
    category: 'Award',
    issuer: 'CITEMAS',
    credentialUrl: '',
    image: '',
    visibility: 'public',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/portfolio/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload certificate image');
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Please provide an achievement title.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please provide a brief description.');
      return;
    }
    if (!form.date.trim()) {
      setError('Please provide a date or year.');
      return;
    }

    try {
      setSubmitting(true);
      let finalImageUrl = form.image;

      if (selectedFile) {
        finalImageUrl = await handleFileUpload(selectedFile);
      }

      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          image: finalImageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to post achievement');
      }

      onSuccess(data.achievement);
      onClose();
    } catch (err) {
      console.error('Post achievement error:', err);
      setError(err.message || 'Unable to post achievement right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-xl rounded-[32px] border border-white/10 bg-[#120707] p-6 md:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Post Achievement</h2>
              <p className="text-xs text-white/60">Highlight your awards, certificates, or project recognitions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
              Achievement Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Best Multimedia Project, Hackathon Champion, Adobe Certified"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1c0d0d] px-3.5 py-3 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="Award">Award</option>
                <option value="Certificate">Certificate</option>
                <option value="Recognition">Recognition</option>
                <option value="Competition">Competition</option>
                <option value="Project">Project</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
                Date / Year <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2025, March 2026"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
                Issuing Organization
              </label>
              <input
                type="text"
                placeholder="e.g. CITEMAS, PHINMA UI, Adobe"
                value={form.issuer}
                onChange={(e) => handleChange('issuer', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
                Visibility
              </label>
              <select
                value={form.visibility}
                onChange={(e) => handleChange('visibility', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1c0d0d] px-3.5 py-2.5 text-xs text-white focus:border-red-500 focus:outline-none"
              >
                <option value="public">Public (Visible on Portfolio & Dashboard)</option>
                <option value="private">Private (Visible only to you and staff)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Briefly describe what this achievement recognizes, your contribution, or significance..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
              Credential URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.credentialUrl}
              onChange={(e) => handleChange('credentialUrl', e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-white/70">
              Certificate / Badge Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-2 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-1 file:text-xs file:font-bold file:text-white hover:file:bg-red-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 hover:brightness-110 transition disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Achievement'}
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
}
