import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';

export default function ProfileEditModal({
  isOpen,
  onClose,
  form,
  updateField,
  saving,
  onSubmit,
}) {
  useBodyScrollLock(isOpen);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="relative z-[10000] flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[32px] border border-white/15 bg-[#140909] shadow-[0_35px_100px_rgba(0,0,0,0.8)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-6 md:p-8">
          <h2
            id="edit-profile-title"
            className="text-xl font-black uppercase tracking-[0.18em] text-[#FDFBF7]"
          >
            Edit Personal Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile modal"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#FDFBF7]/70 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/70"
          >
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6 md:px-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="studentId" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Student ID
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={form.studentId}
                  onChange={(e) => updateField('studentId', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                />
              </div>

              <div>
                <label htmlFor="yearLevel" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Year Level
                </label>
                <select
                  id="yearLevel"
                  value={form.yearLevel}
                  onChange={(e) => updateField('yearLevel', e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                >
                  <option value="">Select Year Level</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="department" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Department
                </label>
                <select
                  id="department"
                  value={form.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                >
                  <option value="">Select Department</option>
                  {[
                    'BS Information Technology',
                    'BS Computer Science',
                    'BS Business Administration',
                    'BS Accountancy',
                    'BS Hospitality Management',
                    'BS Tourism Management',
                    'Bachelor of Elementary Education',
                    'Bachelor of Secondary Education',
                    'Bachelor of Science in Nursing',
                    'College of Arts & Sciences (CAS)',
                    'College of Accountancy',
                    'College of Allied Health Sciences (CAHS)',
                    'College of Criminal Justice Education (CCJE)',
                    'College of Education (CoEd)',
                    'College of Engineering',
                    'College of Information Technology Education (CITE)',
                    'College of Management (COM)',
                    'College of Maritime Education (COME)',
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="specialization" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Specialization
                </label>
                <select
                  id="specialization"
                  value={form.specialization}
                  onChange={(e) => updateField('specialization', e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors focus:border-red-500"
                >
                  <option value="">Select Specialization</option>
                  <option value="traditional_arts">Traditional Arts</option>
                  <option value="digital_arts">Digital Arts</option>
                  <option value="voice_acting">Voice Acting</option>
                  <option value="video_editing">Video Editing</option>
                  <option value="photography">Photography</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="phone" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="e.g., +63 912 345 6789"
                  className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/30 focus:border-red-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bio" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                  Bio / About Me
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Share a short summary about yourself..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#1a0d0d] px-4 py-3 text-sm text-[#FDFBF7] outline-none transition-colors placeholder:text-[#FDFBF7]/30 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#FDFBF7]/70 transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-red-500/70"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#FDFBF7] transition-shadow hover:shadow-[0_10px_20px_rgba(220,38,38,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
