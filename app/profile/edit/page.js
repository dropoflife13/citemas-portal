// app/profile/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EditProfilePage() {
  const { user: authUser, token, loading: authLoading, login } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    accountType: 'student',
    identityId: '',
    yearLevel: '',
    department: '',
    specialization: '',
    phone: '',
    bio: '',
    avatar: '',
  });

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser && token) {
      fetchEditableProfile();
    }
  }, [authUser, authLoading, token, router]);

  const fetchEditableProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          accountType: data.user.accountType || 'student',
          identityId: data.user.accountType === 'teacher' || data.user.accountType === 'adviser' ? data.user.staffId || '' : data.user.studentId || '',
          yearLevel: data.user.yearLevel || '',
          department: data.user.department || '',
          specialization: data.user.specialization || '',
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          avatar: data.user.avatar || '',
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load profile data.' });
      }
    } catch (err) {
      console.error('Fetch edit profile error:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        const updatedUser = data.user || { ...authUser, ...formData };
        login(token, { ...(authUser || {}), ...updatedUser, id: updatedUser._id || updatedUser.id || authUser?.id });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => {
          router.push('/profile');
        }, 1200);
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
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium tracking-wider text-[#FDFBF7]/70">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-12 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Header / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF7]/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Profile
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
            Account Configuration
          </span>
        </div>

        {/* Main Form Container */}
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:p-10">
          <div className="mb-8 border-b border-white/10 pb-5">
            <h1 className="text-3xl font-black tracking-tight text-[#FDFBF7]">Edit Profile Details</h1>
            <p className="mt-1 text-sm text-[#FDFBF7]/60">
              Customize your student profile information visible across the CITEMAS directory.
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium ${
                message.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  {formData.accountType === 'student' ? 'Student ID' : 'Staff ID'}
                </label>
                <input
                  type="text"
                  value={formData.identityId}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-sm text-white/60"
                />
                <p className="mt-2 text-[10px] leading-relaxed text-white/40">Your institution-issued ID is protected. Contact an administrator if it needs correction.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  Year Level
                </label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#1a0d0d] px-4 py-3.5 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                >
                  <option value="">Select Year Level</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  Department / Program
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. College of Technology Education"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                  Specialization
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#1a0d0d] px-4 py-3.5 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                >
                  <option value="">Select Specialization</option>
                  <option value="traditional_arts">Traditional Arts</option>
                  <option value="digital_arts">Digital Arts</option>
                  <option value="voice_acting">Voice Acting</option>
                  <option value="video_editing">Video Editing</option>
                  <option value="photography">Photography</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 900 000 0000"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                Avatar Image URL
              </label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60 mb-2">
                Bio / Overview
              </label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell the community about your creative passion, software stack, or artistic background..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
              <Link
                href="/profile"
                className="px-6 py-3.5 text-xs font-black uppercase tracking-[0.18em] rounded-2xl border border-white/10 hover:bg-white/[0.05] transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF7] shadow-[0_10px_25px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
