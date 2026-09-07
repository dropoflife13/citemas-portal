'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function PortfolioPage() {
  const { user, token, loading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', specialization: 'digital_arts', mediaUrl: '', level: 'beginner',
  });
  const [formError, setFormError] = useState('');

  const canView = user && ['super_admin', 'teacher', 'officer', 'alumni', 'member'].includes(user.role);
  const canCreate = user && ['super_admin', 'teacher', 'officer', 'member'].includes(user.role);

  async function loadEntries() {
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setEntries(data);
      else setError(data.error);
    } catch {
      setError('Could not connect to the server');
    }
  }

  useEffect(() => {
    if (token && canView) loadEntries();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
        return;
      }
      setForm({ title: '', description: '', specialization: 'digital_arts', mediaUrl: '', level: 'beginner' });
      loadEntries();
    } catch {
      setFormError('Could not connect to the server');
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">Please log in.</p>;
  if (!canView) return <p className="p-6 text-gray-500">Your role doesn't have access to the portfolio gallery.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Portfolio Gallery</h1>

      {canCreate && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold">Add Portfolio Piece</h2>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <input
            placeholder="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <textarea
            placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <select
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="digital_arts">Digital Arts</option>
            <option value="traditional_arts">Traditional Arts</option>
            <option value="voice_acting">Voice Acting</option>
            <option value="video_editing">Video Editing</option>
            <option value="photography">Photography</option>
          </select>
          <input
            placeholder="Media link (image/video URL)" value={form.mediaUrl}
            onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="w-full border rounded p-2"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <button type="submit" className="bg-black text-white rounded px-4 py-2">
            Submit
          </button>
        </form>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-3">
        {entries.length === 0 && <p className="text-gray-500">No portfolio entries yet.</p>}
        {entries.map((entry) => (
          <div key={entry._id} className="border rounded-lg p-4">
            <h3 className="font-bold">{entry.title}</h3>
            <p className="text-sm text-gray-600">
              By {entry.owner?.firstName} {entry.owner?.lastName} — {entry.specialization} ({entry.level})
            </p>
            <p className="mt-1">{entry.description}</p>
            <a href={entry.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm underline">
              View Media
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}