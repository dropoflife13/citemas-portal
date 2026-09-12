'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, Edit3, User, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

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
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setProfile(data.user);
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to load profile.',
        });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setMessage({
        type: 'error',
        text: 'An error occurred while loading profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadTrigger = (type) => {
    if (type === 'avatar') {
      avatarInputRef.current?.click();
    } else {
      coverInputRef.current?.click();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium tracking-wider text-[#FDFBF7]/70">
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#110808] text-[#FDFBF7]">
        <p className="text-red-400">Unable to display profile information.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110808] px-4 py-12 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div
            className="group relative h-52 cursor-pointer overflow-hidden border-b border-white/10 md:h-64"
            onClick={() => handleImageUploadTrigger('cover')}
          >
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
              alt="Profile cover"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.55),transparent_35%),linear-gradient(180deg,transparent_30%,rgba(17,8,8,0.9)_100%)]" />

            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                <Camera size={14} />
                Change Cover Photo
              </span>
            </div>

            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={() => alert('Cover photo upload handler can be wired here!')}
            />
          </div>

          <div className="px-6 pb-8 md:px-10">
            <div className="relative -mt-20 flex flex-col gap-6 md:-mt-24 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-end">
                <div
                  className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-[5px] border-[#110808] bg-[#1a0d0d] shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-transform hover:scale-105 md:h-36 md:w-36"
                  onClick={() => handleImageUploadTrigger('avatar')}
                >
                  <img
                    src={
                      profile.avatar ||
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'
                    }
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-75"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera size={24} className="mb-1 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      Edit Photo
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={() => alert('Avatar upload handler can be wired here!')}
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                      {profile.role === 'super_admin' ? 'Admin' : 'Member'}
                    </span>

                    {profile.officerPosition && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200 capitalize">
                        {profile.officerPosition.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-black tracking-tight text-[#FDFBF7] md:text-4xl">
                    {profile.firstName} {profile.lastName}
                  </h1>

                  <p className="flex items-center gap-2 text-sm font-medium text-[#FDFBF7]/60">
                    <span>{profile.email}</span>
                    <span>•</span>
                    <span className="text-red-400">
                      {profile.department || 'General Department'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF7] shadow-[0_10px_25px_rgba(220,38,38,0.4)] transition-shadow hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(220,38,38,0.6)] active:scale-95"
                >
                  <Edit3 size={15} />
                  Edit Details
                </Link>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FDFBF7]/40">
                  {profile.accountType === 'student' || !profile.accountType ? 'Student ID' : 'Staff ID'}
                </p>
                <p className="mt-1 text-sm font-bold text-[#FDFBF7]">
                  {profile.accountType === 'student' || !profile.accountType ? profile.studentId || 'Not set' : profile.staffId || 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FDFBF7]/40">
                  Year Level
                </p>
                <p className="mt-1 text-sm font-bold text-[#FDFBF7]">
                  {profile.yearLevel ? `${profile.yearLevel} Year` : 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FDFBF7]/40">
                  Specialization
                </p>
                <p className="mt-1 truncate text-sm font-bold text-red-300">
                  {profile.specialization ? profile.specialization.replace(/_/g, ' ') : 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FDFBF7]/40">
                  Phone
                </p>
                <p className="mt-1 truncate text-sm font-bold text-[#FDFBF7]">
                  {profile.phone || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-200'
            }`}
          >
            <CheckCircle2 size={18} />
            {message.text}
          </div>
        )}

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-red-400">
              <User size={16} />
              Bio & Overview
            </h2>
          </div>

          <p className="whitespace-pre-wrap text-base font-light leading-relaxed text-[#FDFBF7]/90">
            {profile.bio || 'No bio added yet. Click "Edit Details" to tell people more about yourself!'}
          </p>
        </div>

      </div>
    </div>
  );
}
