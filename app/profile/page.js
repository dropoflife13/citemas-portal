'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user: authUser, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser && token) {
      fetchProfile();
    }
  }, [authUser, authLoading, token, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setProfile(data.user);
        setPhone(data.user.phone || '');
        setBio(data.user.bio || '');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load profile.' });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setMessage({ type: 'error', text: 'An error occurred while loading profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, bio }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({ type: 'error', text: 'An error occurred while saving changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-[#FDFBF7]/70">Loading profile data...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-red-300">Unable to display profile information.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-10 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-300">Member Profile</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#FDFBF7]">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="mt-2 text-sm text-[#FDFBF7]/70">{profile.email}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-200">
              Role: {profile.role}
            </span>
            {profile.officerPosition && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200 capitalize">
                {profile.officerPosition.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {message.text && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <h2 className="border-b border-white/10 pb-3 text-lg font-black uppercase tracking-[0.18em] text-[#FDFBF7]">
            Official Information
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['Student ID', profile.studentId || 'N/A'],
              ['Year Level', profile.yearLevel || 'N/A'],
              ['Department', profile.department || 'N/A'],
              ['Specialization', profile.specialization ? profile.specialization.replace('_', ' ') : 'N/A'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#1a0d0d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/50">{label}</p>
                <p className="mt-2 text-sm font-medium text-[#FDFBF7]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <h2 className="border-b border-white/10 pb-3 text-lg font-black uppercase tracking-[0.18em] text-[#FDFBF7]">
            Personal Details
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="phone" className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +63 912 345 6789"
                className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500"
              />
            </div>

            <div>
              <label htmlFor="bio" className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                Bio / About Me
              </label>
              <textarea
                id="bio"
                rows={5}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short summary about yourself..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/35 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}