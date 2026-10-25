'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import CitemasLoader from '@/components/CitemasLoader';

const DEPARTMENTS = [
  'College of Arts & Sciences (CAS)',
  'College of Accountancy',
  'College of Allied Health Sciences (CAHS)',
  'College of Criminal Justice Education (CCJE)',
  'College of Education (CoEd)',
  'College of Engineering',
  'College of Information Technology Education (CITE)',
  'College of Management (COM)',
  'College of Maritime Education (COME)',
];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          identityId:
            data.user.accountType === 'teacher' || data.user.accountType === 'adviser'
              ? data.user.staffId || ''
              : data.user.studentId || '',
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
        login(token, {
          ...(authUser || {}),
          ...updatedUser,
          id: updatedUser._id || updatedUser.id || authUser?.id,
        });
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
    return <CitemasLoader label="Loading profile editor..." />;
  }

  const inputClass =
    'w-full rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-red-500/80 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-sans';
  const selectClass =
    'w-full cursor-pointer rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-red-500/80 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-sans';
  const labelClass =
    'block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-1.5';

  const departmentOptions =
    formData.department && !DEPARTMENTS.includes(formData.department)
      ? [formData.department, ...DEPARTMENTS]
      : DEPARTMENTS;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--background)] px-4 py-10 text-[var(--foreground)] sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300 bg-grid-faint">
      {/* Ambient Studio Glows */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[450px] w-[450px] rounded-full bg-red-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[450px] w-[450px] rounded-full bg-orange-600/10 blur-[150px]" />

      <div className="mx-auto max-w-3xl space-y-6 relative z-10">
        {/* Header / Back Link */}
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest px-1">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO DOSSIER</span>
          </Link>
          <span className="flex items-center gap-2 text-red-500 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            CONFIG // 02 [EDIT PROFILE]
          </span>
        </div>

        {/* Main Form Container */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-2xl transition-colors duration-300">
          <div className="mb-7 border-b border-black/10 dark:border-white/10 pb-5">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500">
              CREATOR SETTINGS
            </div>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Edit Profile{' '}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-slate-900 dark:from-red-500 dark:via-orange-400 dark:to-white lowercase">
                details.
              </span>
            </h1>
            <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              Customize your profile information visible across the CITEMAS studio directory.
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-xs font-mono ${
                message.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {formData.accountType === 'student' ? 'Student ID' : 'Staff ID'}
                </label>
                <input
                  type="text"
                  value={formData.identityId}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-4 py-3 font-mono text-sm text-slate-500 dark:text-slate-400"
                />
                <p className="mt-1.5 text-[10px] font-mono leading-relaxed text-slate-500">
                  Institution-issued ID is locked. Contact an admin if it needs correction.
                </p>
              </div>

              <div>
                <label className={labelClass}>Year Level</label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Select Year Level
                  </option>
                  <option value="1st" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    1st Year
                  </option>
                  <option value="2nd" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    2nd Year
                  </option>
                  <option value="3rd" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    3rd Year
                  </option>
                  <option value="4th" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    4th Year
                  </option>
                  <option value="Graduate" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Graduate
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Department / College</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Select Department
                  </option>
                  {departmentOptions.map((dept) => (
                    <option
                      key={dept}
                      value={dept}
                      className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white"
                    >
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Creative Specialization</label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Select Specialization
                  </option>
                  <option value="traditional_arts" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Traditional Arts
                  </option>
                  <option value="digital_arts" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Digital Arts
                  </option>
                  <option value="voice_acting" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Voice Acting
                  </option>
                  <option value="animation" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Animation
                  </option>
                  <option value="videography" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Videography
                  </option>
                  <option value="photography" className="bg-white text-slate-900 dark:bg-[#0a0a0a] dark:text-white">
                    Photography
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+63 900 000 0000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Bio &amp; Creative Overview</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell the community about your creative passion, software stack, or artistic background..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-black/10 dark:border-white/10">
              <Link
                href="/profile"
                className="px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest rounded-full border border-black/15 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
