'use client';

import { useState } from 'react';
import { Award, ExternalLink, Trash2, Shield, Calendar, Building, Globe, Lock } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';

export default function AchievementCard({
  achievement,
  currentUserId,
  isStaff,
  onDelete,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useBodyScrollLock(showConfirm);

  const isOwner = currentUserId && String(achievement.user?._id || achievement.user) === String(currentUserId);
  const canDelete = isOwner || isStaff;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(achievement._id);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Award':
        return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
      case 'Certificate':
        return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300';
      case 'Recognition':
        return 'border-sky-500/40 bg-sky-500/15 text-sky-300';
      case 'Competition':
        return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
      case 'Project':
        return 'border-purple-500/40 bg-purple-500/15 text-purple-300';
      default:
        return 'border-white/20 bg-white/10 text-white/80';
    }
  };

  return (
    <div className="group relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-red-500/40 hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Top bar: Category + Visibility + Actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getCategoryColor(achievement.category)}`}>
            <Award size={12} />
            {achievement.category}
          </span>

          <div className="flex items-center gap-2">
            {achievement.visibility === 'private' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
                <Lock size={10} /> Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
                <Globe size={10} /> Public
              </span>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="rounded-lg p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Delete achievement"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Certificate / Image preview if available */}
        {achievement.image && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40 aspect-video max-h-48">
            <img
              src={achievement.image}
              alt={achievement.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        {/* Title & Issuer */}
        <div className="space-y-1 mb-3">
          <h3 className="text-lg font-black tracking-tight text-[#FDFBF7] group-hover:text-red-300 transition-colors">
            {achievement.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Building size={12} className="text-amber-400" />
              {achievement.issuer || 'CITEMAS'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={12} className="text-white/40" />
              {achievement.date}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs font-light leading-relaxed text-white/70 line-clamp-3 mb-4">
          {achievement.description}
        </p>
      </div>

      {/* Footer: User / Owner details & Credential Link */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
        {achievement.user && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-full overflow-hidden border border-white/20 bg-black shrink-0">
              <img
                src={achievement.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(achievement.user.firstName || 'User')}&background=7f1d1d&color=f8f2ec&size=64`}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <span className="truncate text-[11px] font-bold text-white/80">
              {achievement.user.firstName} {achievement.user.lastName}
            </span>
          </div>
        )}

        {achievement.credentialUrl && (
          <a
            href={achievement.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition shrink-0 ml-auto"
          >
            Credential
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Confirmation Modal */}
      <ModalPortal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="relative w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#160a0a] p-6 shadow-2xl space-y-4 text-left">
          <div className="space-y-2">
            <h4 className="text-base font-black text-white">Delete Achievement</h4>
            <p className="text-xs text-white/70">
              Are you sure you want to delete <strong className="text-white">&ldquo;{achievement.title}&rdquo;</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setShowConfirm(false)}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
