'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Camera, Edit3, User, CheckCircle2 } from 'lucide-react';

const ROLE_BADGES = {
  super_admin: { label: 'Super Admin', style: 'border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-300' },
  officer: { label: 'Officer', style: 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  teacher: { label: 'Teacher', style: 'border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300' },
  adviser: { label: 'Adviser', style: 'border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300' },
  member: { label: 'Org Member', style: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  alumni: { label: 'Alumni', style: 'border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300' },
  applicant: { label: 'Applicant', style: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200' },
  user: { label: 'Student', style: 'border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300' },
};

function getInitialsAvatar(firstName = '', lastName = '') {
  const f = (firstName.trim()[0] || 'C').toUpperCase();
  const l = (lastName.trim()[0] || 'M').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dc2626"/>
        <stop offset="100%" stop-color="#7f1d1d"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" fill="#fdfbf7" font-family="Oswald, sans-serif" font-size="200" font-weight="bold">${f}${l}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function ProfilePage() {
  const { user: authUser, token, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleImageUpload = async (type, event) => {
    const file = event?.target?.files?.[0];
    if (!file || !token) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose a valid image file.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/portfolio/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Image upload failed.');
      }

      const field = type === 'avatar' ? 'avatar' : 'coverPhoto';
      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: uploadData.url }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.message || patchData.error || 'Profile image update failed.');
      }

      setProfile((prev) => ({ ...prev, [field]: uploadData.url }));
      updateUser({ [field]: uploadData.url });
      setMessage({
        type: 'success',
        text: type === 'avatar' ? 'Profile photo updated successfully.' : 'Cover photo updated successfully.',
      });
    } catch (error) {
      console.error('Image upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Image upload failed.' });
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
      return;
    }

    if (authUser && token) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, token]);

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Loading creator dossier...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        <p className="font-mono text-xs uppercase tracking-widest text-red-500">Unable to display profile information.</p>
      </div>
    );
  }

  const avatarSrc = profile.avatar || getInitialsAvatar(profile.firstName, profile.lastName);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-10 text-[var(--foreground)] sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 bg-grid-faint">
      {/* Ambient Studio Glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[450px] w-[450px] rounded-full bg-red-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[450px] w-[450px] rounded-full bg-orange-600/10 blur-[150px]" />

      <div className="mx-auto max-w-5xl space-y-6 relative z-10">
        {/* Top Technical Telemetry Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            PROFILE // 01 [CREATOR DOSSIER]
          </span>
          <span>CITEMAS STUDIO DIRECTORY</span>
        </div>

        {/* Main Editorial Dossier Card */}
        <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 shadow-2xl backdrop-blur-2xl transition-colors duration-300">
          {/* Cover Banner */}
          <div
            className="group relative h-52 cursor-pointer overflow-hidden border-b border-black/10 dark:border-white/10 md:h-64 bg-[#070305]"
            onClick={() => handleImageUploadTrigger('cover')}
          >
            {profile.coverPhoto ? (
              <img
                src={profile.coverPhoto}
                alt="Profile cover"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.45),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(249,115,22,0.3),transparent_50%),linear-gradient(135deg,#090a0b_0%,#1a0505_50%,#070305_100%)]">
                <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/80 backdrop-blur-md group-hover:border-red-500/50 group-hover:text-white transition-colors">
                <Camera size={12} className="text-red-400" />
                {saving ? 'Uploading...' : 'Change Cover'}
              </span>
            </div>

            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={(event) => handleImageUpload('cover', event)}
            />
          </div>

          {/* Identity & Telemetry Section */}
          <div className="px-6 pb-8 md:px-10">
            <div className="relative -mt-16 flex flex-col gap-6 md:-mt-20 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col items-start gap-5 md:flex-row md:items-end">
                {/* Avatar */}
                <div
                  className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-3xl border-4 border-[var(--card-bg)] dark:border-[#090a0b] bg-[#070305] shadow-2xl transition-transform hover:scale-105 md:h-36 md:w-36 shrink-0"
                  onClick={() => handleImageUploadTrigger('avatar')}
                >
                  <img
                    src={avatarSrc}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    onError={(e) => {
                      e.currentTarget.src = getInitialsAvatar(profile.firstName, profile.lastName);
                    }}
                    className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-75"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera size={22} className="mb-1 text-red-400" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                      Edit Photo
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => handleImageUpload('avatar', event)}
                  />
                </div>

                {/* Name, Role Badges & Department */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const badge = ROLE_BADGES[profile.role] || {
                        label: profile.role || 'Student',
                        style: 'border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300',
                      };
                      return (
                        <span className={`rounded-full border px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest ${badge.style}`}>
                          {badge.label}
                        </span>
                      );
                    })()}

                    {profile.officerPosition && (
                      <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-300">
                        {profile.officerPosition.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  <h1 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-none">
                    {profile.firstName}{' '}
                    <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white">
                      {profile.lastName}
                    </span>
                  </h1>

                  <p className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>{profile.email}</span>
                    <span className="text-red-500">•</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">
                      {profile.department || 'General Department'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action CTA */}
              <div className="flex items-center gap-3">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/25 transition-all hover:brightness-110 active:scale-95"
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </Link>
              </div>
            </div>

            {/* 4-Column Architectural Telemetry Strip */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-b border-black/10 dark:border-white/10 divide-y sm:divide-y-0 sm:divide-x divide-black/10 dark:divide-white/10">
              <div className="py-4 sm:px-5 first:sm:pl-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  01 // {profile.accountType === 'student' || !profile.accountType ? 'STUDENT ID' : 'STAFF ID'}
                </p>
                <p className="mt-1.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {profile.accountType === 'student' || !profile.accountType ? profile.studentId || 'Not set' : profile.staffId || 'Not set'}
                </p>
              </div>

              <div className="py-4 sm:px-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  02 // YEAR LEVEL
                </p>
                <p className="mt-1.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {profile.yearLevel ? `${profile.yearLevel} Year` : 'Not set'}
                </p>
              </div>

              <div className="py-4 sm:px-5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  03 // CREATIVE TRACK
                </p>
                <p className="mt-1.5 truncate font-mono text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {profile.specialization ? profile.specialization.replace(/_/g, ' ') : 'Not set'}
                </p>
              </div>

              <div className="py-4 sm:px-5 last:sm:pr-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  04 // CONTACT
                </p>
                <p className="mt-1.5 truncate font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {profile.phone || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-xs font-mono ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{message.text}</span>
          </div>
        )}

        {/* Bio & Creative Overview Panel */}
        <div className="space-y-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 p-6 shadow-xl backdrop-blur-2xl md:p-8 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
            <h2 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-red-500">
              <User size={15} />
              <span>05 // BIO &amp; CREATIVE OVERVIEW</span>
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              PUBLIC STATEMENT
            </span>
          </div>

          <p className="whitespace-pre-wrap font-sans text-sm sm:text-base font-light leading-relaxed text-slate-700 dark:text-slate-300">
            {profile.bio || 'No bio added yet. Click "Edit Details" to share your creative discipline, tools, and artistic background.'}
          </p>
        </div>
      </div>
    </div>
  );
}