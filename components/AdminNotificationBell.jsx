'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

const STORAGE_KEY = 'citemas_lastActivitySeen';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getActionIcon(action = '') {
  if (action.startsWith('application.')) return '📄';
  if (action.startsWith('user.')) return '👤';
  if (action.startsWith('event.')) return '📅';
  if (action.startsWith('achievement.')) return '🏆';
  if (action.startsWith('portfolio.')) return '🎨';
  if (action.startsWith('officer.')) return '⭐';
  return '⚡';
}

function formatActionLabel(action = '') {
  return action
    .replace('.', ' ')
    .replace('_', ' ')
    .toUpperCase();
}

export default function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [container, setContainer] = useState(null);

  useBodyScrollLock(isOpen);

  // Setup SSR-safe portal container
  useEffect(() => {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    setContainer(modalRoot);
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('citemas_token') : null;
      const res = await fetch('/api/activity?limit=20', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error('Failed to load activity');
      }

      const data = await res.json();
      const logs = data.logs || [];
      setActivities(logs);

      const lastSeenStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const lastSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;

      const unread = logs.filter(
        (log) => new Date(log.createdAt).getTime() > lastSeenTime
      ).length;

      setUnreadCount(unread);
      setError('');
    } catch (err) {
      console.error('Notification fetch error:', err);
      setError('Unable to fetch recent activity');
    }
  }, []);

  // Poll activity every 60 seconds
  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (activities.length === 0) {
      setLoading(true);
      fetchActivities().finally(() => setLoading(false));
    }
  };

  const handleMarkAllRead = () => {
    const now = new Date().toISOString();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, now);
    }
    setUnreadCount(0);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Bell Trigger Button in Navbar */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center"
        title="Admin Activity Notifications"
        aria-label="Admin Activity Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#110808] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Side Drawer Portal */}
      {container && isOpen &&
        createPortal(
          <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity"
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed top-0 right-0 h-full w-[380px] max-w-[92vw] z-[95] bg-[#110808] border-l border-white/10 shadow-2xl flex flex-col text-white font-sans overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                    <span>⚡</span> Admin Activity Feed
                  </h3>
                  <p className="text-[11px] text-white/50 font-medium">Real-time system audit logs</p>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-red-400 hover:text-red-300 font-bold hover:underline px-2 py-1 rounded bg-red-500/10 border border-red-500/20"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Close"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Activity List Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && (
                  <div className="py-12 text-center text-white/50 text-xs font-semibold animate-pulse">
                    Loading activity logs...
                  </div>
                )}

                {error && !loading && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center font-medium">
                    {error}
                  </div>
                )}

                {!loading && !error && activities.length === 0 && (
                  <div className="py-12 text-center text-white/40 text-xs">
                    No recent activities recorded.
                  </div>
                )}

                {!loading &&
                  activities.map((item) => {
                    const lastSeenStr = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
                    const lastSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
                    const isUnread = new Date(item.createdAt).getTime() > lastSeenTime;

                    return (
                      <div
                        key={item._id}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isUnread
                            ? 'bg-red-950/20 border-red-500/30 text-white'
                            : 'bg-white/[0.03] border-white/5 text-white/80'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base leading-none select-none mt-0.5">
                            {getActionIcon(item.action)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-white tracking-wide truncate">
                                {item.actorName || 'System'}
                              </span>
                              <span className="text-[10px] text-white/40 whitespace-nowrap">
                                {formatRelativeTime(item.createdAt)}
                              </span>
                            </div>

                            <p className="text-white/70 text-[11px] leading-relaxed break-words">
                              <span className="font-semibold text-red-400">
                                {formatActionLabel(item.action)}
                              </span>
                              {item.targetName && (
                                <span>
                                  {' '}on <strong className="text-white">{item.targetName}</strong>
                                </span>
                              )}
                            </p>

                            {item.metadata && Object.keys(item.metadata).length > 0 && (
                              <div className="mt-1.5 text-[10px] text-white/40 bg-black/30 p-1.5 rounded border border-white/5 font-mono truncate">
                                {item.metadata.newRole
                                  ? `Role: ${item.metadata.previousRole || 'none'} ➔ ${item.metadata.newRole}`
                                  : JSON.stringify(item.metadata)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
                <Link
                  href="/admin/activity"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
                >
                  View Full Activity Logs ➔
                </Link>
              </div>
            </div>
          </div>,
          container
        )}
    </>
  );
}

