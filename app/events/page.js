'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import EventCarousel from '@/components/EventCarousel';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';
import AccessDenied from '@/components/AccessDenied';
import CitemasLoader from '@/components/CitemasLoader';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle,
  Copy,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';

const CITEMAS_RED = '#DC2626';
const CITEMAS_CREAM = '#FDFBF7';
const CITEMAS_GOLD = '#F59E0B';
const MUTED = 'rgba(253,251,247,0.75)';

export default function EventsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Strict Auth Guard: verify token and redirect immediately if unauthenticated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citemas_token');
      if (!storedToken) {
        router.replace('/login');
        return;
      }
    }

    if (!loading) {
      if (!user || !token) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    }
  }, [loading, user, token, router]);
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Active Tab State: 'upcoming' | 'previous'
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Creation Form
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: '',
    images: [],
    highlights: '',
  });
  const [formError, setFormError] = useState('');
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [createMode, setCreateMode] = useState('upcoming');

  // Edit modal state
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    image: '',
    images: [],
    highlights: '',
  });
  const [editError, setEditError] = useState('');
  const [uploadingEdit, setUploadingEdit] = useState(false);

  // Attendees modal state
  const [viewingAttendeesEvent, setViewingAttendeesEvent] = useState(null);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [copiedEmails, setCopiedEmails] = useState(false);

  // Delete confirmation
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [actioningRsvpId, setActioningRsvpId] = useState(null);

  useBodyScrollLock(isCreateModalOpen);
  useBodyScrollLock(Boolean(editingEvent));
  useBodyScrollLock(Boolean(viewingAttendeesEvent));
  useBodyScrollLock(Boolean(deletingEventId));

  const canManageRoles = ['officer', 'teacher', 'adviser', 'super_admin'];
  const canCreate = user && canManageRoles.includes(user.role);

  async function loadEvents() {
    try {
      setEventsLoading(true);
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Failed to load events');
        return;
      }
      setEvents(Array.isArray(data) ? data : []);
      setFetchError('');
    } catch {
      setFetchError('Could not connect to the server');
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadEvents();
  }, [token]);

  useEffect(() => {
    setForm({ title: '', description: '', date: '', location: '', capacity: '', image: '', images: [], highlights: '' });
  }, [isCreateModalOpen, createMode]);

  // Authenticated Image Upload Helper
  async function uploadImageFiles(files, setUploadingState, updateFormCallback) {
    if (!files.length) return;
    setUploadingState(true);
    const uploadedUrls = [];

    for (const file of files) {
      const dataObj = new FormData();
      dataObj.append('file', file);

      try {
        const res = await fetch('/api/portfolio/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: dataObj,
        });
        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        } else {
          // Fallback if unsigned preset exists
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'yapvq22n';
          const fallbackData = new FormData();
          fallbackData.append('file', file);
          fallbackData.append('upload_preset', 'citemas_preset');
          const fbRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: fallbackData,
          });
          const fbJson = await fbRes.json();
          if (fbJson.secure_url) uploadedUrls.push(fbJson.secure_url);
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    if (uploadedUrls.length > 0) {
      updateFormCallback(uploadedUrls);
      showToast(`${uploadedUrls.length} image(s) uploaded successfully`, 'success');
    } else {
      showToast('Image upload failed. Please try a smaller image (max 10MB).', 'error');
    }
    setUploadingState(false);
  }

  function handleImageUploadCreate(e) {
    const files = Array.from(e.target.files || []);
    uploadImageFiles(files, setUploadingCreate, (urls) => {
      setForm((prev) => ({
        ...prev,
        image: prev.image || urls[0],
        images: [...prev.images, ...urls],
      }));
    });
  }

  function handleImageUploadEdit(e) {
    const files = Array.from(e.target.files || []);
    uploadImageFiles(files, setUploadingEdit, (urls) => {
      setEditForm((prev) => ({
        ...prev,
        image: prev.image || urls[0],
        images: [...prev.images, ...urls],
      }));
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          capacity: form.capacity ? Number(form.capacity) : null,
          isPast: createMode === 'past',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create event');
        showToast(data.error || 'Failed to create event', 'error');
        return;
      }
      setForm({ title: '', description: '', date: '', location: '', capacity: '', image: '', images: [], highlights: '' });
      setIsCreateModalOpen(false);
      showToast(createMode === 'past' ? 'Event archive created' : 'Event published successfully', 'success');
      loadEvents();
    } catch {
      setFormError('Could not connect to the server');
      showToast('Could not connect to the server', 'error');
    }
  }

  async function handleDelete(eventId) {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete event', 'error');
        return;
      }
      setDeletingEventId(null);
      showToast('Event removed successfully', 'success');
      loadEvents();
    } catch {
      showToast('Could not connect to the server', 'error');
    }
  }

  function startEdit(event) {
    setEditingEvent(event);
    setEditError('');
    const isPastEvent = event.isPast || (event.date && new Date(event.date) < new Date());
    const formattedDate = event.date
      ? (isPastEvent
          ? new Date(event.date).toISOString().slice(0, 10)
          : new Date(event.date).toISOString().slice(0, 16))
      : '';

    setEditForm({
      title: event.title || '',
      description: event.description || '',
      date: formattedDate,
      location: event.location || '',
      capacity: event.capacity !== null && event.capacity !== undefined ? event.capacity : '',
      image: event.image || '',
      images: Array.isArray(event.images) ? event.images : [],
      highlights: event.highlights || '',
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setEditError('');

    try {
      const res = await fetch(`/api/events/${editingEvent._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          capacity: editForm.capacity !== '' ? Number(editForm.capacity) : null,
          isPast: new Date(editForm.date) < new Date(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Failed to update event');
        showToast(data.error || 'Failed to update event', 'error');
        return;
      }
      setEditingEvent(null);
      showToast('Event updated successfully', 'success');
      loadEvents();
    } catch {
      setEditError('Could not connect to the server');
      showToast('Could not connect to the server', 'error');
    }
  }

  async function handleRsvp(eventId, isRegistered) {
    try {
      setActioningRsvpId(eventId);
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: isRegistered ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'RSVP action failed', 'error');
        return;
      }
      showToast(isRegistered ? 'RSVP cancelled' : 'Registered for event!', 'success');
      loadEvents();
    } catch {
      showToast('Could not connect to the server', 'error');
    } finally {
      setActioningRsvpId(null);
    }
  }

  function handleCopyAttendeeEmails(attendees) {
    const emails = attendees
      .map((att) => (typeof att.user === 'object' ? att.user?.email : ''))
      .filter(Boolean)
      .join(', ');

    if (!emails) {
      showToast('No attendee emails to copy', 'info');
      return;
    }

    navigator.clipboard.writeText(emails);
    setCopiedEmails(true);
    showToast(`${attendees.length} attendee emails copied to clipboard`, 'success');
    setTimeout(() => setCopiedEmails(false), 2000);
  }

  if (checkingAuth || loading || eventsLoading || !user || !token) {
    return <CitemasLoader label="Loading events directory..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-12">
        <AccessDenied
          title="Events Access Restricted"
          resourceName="community events"
          message="This section is available to CITEMAS members."
        />
      </div>
    );
  }

  const now = new Date();
  const upcomingEvents = events.filter((ev) => new Date(ev.date) >= now);
  const previousEvents = events.filter((ev) => new Date(ev.date) < now);

  const displayedEvents = (activeTab === 'upcoming' ? upcomingEvents : previousEvents).filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(q) ||
      ev.location?.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-slate-100 space-y-8 font-sans selection:bg-red-500 selection:text-white">
      {/* Header Container */}
      <div className="relative z-10 rounded-3xl border border-white/10 bg-[#090a0b]/80 p-8 shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            DIRECTORY // EXHIBITS
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            <span className="text-red-500">CITEMAS</span> Events &amp; Exhibits.
          </h1>
          <p className="text-xs sm:text-sm font-light max-w-2xl leading-relaxed text-slate-400">
            Explore multimedia workshops, tech showcases, gallery exhibits, and past event history across the creative campus community.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Navigation Switches */}
          <div className="flex p-1 rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-950/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'previous'
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-950/60 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past Archives ({previousEvents.length})
            </button>
          </div>

          {/* Add Event Button for Authorized Staff */}
          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-orange-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/60 border border-white/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus size={15} />
              <span>Post Event / Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl">
        <Search size={16} className="text-slate-500 ml-2 shrink-0" />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'upcoming' ? 'upcoming events' : 'past archives'} by title, venue, or keyword...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-300">
          {fetchError}
        </div>
      )}

      {/* Events Full-Bleed Cinematic Rows */}
      <div className="relative z-10 space-y-4">
        {displayedEvents.length === 0 && (
          <div className="py-20 text-center">
            <div className="max-w-md mx-auto p-12 rounded-3xl border border-white/10 bg-[#090a0b]/80 backdrop-blur-2xl">
              <Calendar size={36} className="mx-auto mb-3 text-red-500/60" />
              <p className="font-display text-2xl font-black uppercase tracking-tight text-white">
                {searchQuery ? 'No matching events found' : `No ${activeTab} events available`}
              </p>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {searchQuery
                  ? 'Try modifying your search keywords.'
                  : 'Check back later or switch tabs to view past event archives.'}
              </p>
            </div>
          </div>
        )}

        {displayedEvents.map((event, idx) => {
          const isRegistered = event.attendees?.some(
            (att) => (att.user?._id || att.user || att) === user.id
          );
          const isFull = event.capacity !== null && event.capacity !== undefined && event.attendeeCount >= event.capacity;
          const canManageEvent =
            canManageRoles.includes(user.role) ||
            (event.createdBy?._id || event.createdBy) === user.id;

          const allImages = Array.isArray(event.images) && event.images.length > 0
            ? event.images
            : event.image ? [event.image] : [];

          // Capacity calculation
          const capacityRatio = event.capacity ? Math.min(100, Math.round((event.attendeeCount / event.capacity) * 100)) : 0;
          const isNearlyFull = event.capacity && capacityRatio >= 80 && !isFull;

          const eventDateObj = new Date(event.date);
          const dateStr = !isNaN(eventDateObj.getTime())
            ? eventDateObj.toISOString().slice(0, 10).replace(/-/g, '.')
            : 'TBD';
          const timeStr = !isNaN(eventDateObj.getTime())
            ? eventDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={event._id}
              className="rounded-3xl border border-white/10 bg-[#090a0b]/90 hover:border-red-500/40 p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left Column: Date & Time in Technical Mono + Index */}
                <div className="lg:col-span-3 space-y-3 border-b lg:border-b-0 lg:border-r border-white/10 pb-4 lg:pb-0 lg:pr-6">
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-slate-500">
                    <span>EVENT // {String(idx + 1).padStart(2, '0')}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300">
                      {activeTab === 'upcoming' ? 'SCHEDULED' : 'ARCHIVED'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-white group-hover:text-red-400 transition-colors">
                      {dateStr}
                    </div>
                    {timeStr && (
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <Clock size={12} className="text-red-400 shrink-0" />
                        <span>{timeStr}</span>
                      </div>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                      <MapPin size={12} className="text-amber-400 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {/* Thumbnail / Carousel trigger */}
                  <div className="relative h-24 w-full rounded-2xl overflow-hidden border border-white/10 bg-black/60 mt-2">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950/40 to-black text-xl">
                        🎨
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column: Massive Title + Description + Highlights + Capacity */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white group-hover:text-red-300 transition-colors">
                      {event.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed font-light line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  {event.highlights && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-amber-200/90 leading-relaxed font-light">
                      <span className="font-bold text-amber-400 uppercase text-[9px] font-mono block mb-0.5">
                        HIGHLIGHTS
                      </span>
                      {event.highlights}
                    </div>
                  )}

                  {/* Capacity Bar */}
                  {event.capacity ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">RESERVED SEATS</span>
                        <span className={isFull ? 'text-red-400 font-bold' : isNearlyFull ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {event.attendeeCount} / {event.capacity} ({capacityRatio}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isFull
                              ? 'bg-red-500'
                              : isNearlyFull
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityRatio}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-mono">
                      CONFIRMED: <span className="text-white font-bold">{event.attendeeCount}</span> • OPEN CAPACITY
                    </div>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6">
                  {/* RSVP Button */}
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={() => handleRsvp(event._id, isRegistered)}
                      disabled={actioningRsvpId === event._id || (!isRegistered && isFull)}
                      className={`w-full sm:w-auto lg:w-full px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                        isRegistered
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                          : isFull
                          ? 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/10'
                          : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:brightness-110 shadow-lg shadow-red-950/60'
                      }`}
                    >
                      {actioningRsvpId === event._id
                        ? '...'
                        : isRegistered
                        ? 'Cancel RSVP'
                        : isFull
                        ? 'At Capacity'
                        : 'RSVP Now →'}
                    </button>
                  )}

                  {/* Guest List Button */}
                  {canManageEvent && (
                    <button
                      onClick={() => setViewingAttendeesEvent(event)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-[11px] font-mono uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer w-full"
                    >
                      <Users size={13} />
                      <span>Guest List ({event.attendeeCount})</span>
                    </button>
                  )}

                  {/* Edit / Delete Buttons */}
                  {canManageEvent && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(event)}
                        title="Edit event"
                        className="p-2.5 rounded-full border border-white/15 bg-white/[0.03] text-amber-400 hover:text-amber-300 hover:bg-white/10 transition cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingEventId(event._id)}
                        title="Delete event"
                        className="p-2.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ATTENDEE ROSTER MODAL (For Officers & Creators) */}
      <ModalPortal isOpen={Boolean(viewingAttendeesEvent)} onClose={() => setViewingAttendeesEvent(null)}>
        <div className="relative w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 text-slate-100 border border-white/20 bg-gradient-to-b from-[#140609] to-[#070305] shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">Guest Roster</div>
              <h2 className="text-xl font-black text-white mt-0.5">{viewingAttendeesEvent?.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {viewingAttendeesEvent?.attendees?.length || 0} registered attendees{' '}
                {viewingAttendeesEvent?.capacity ? `/ ${viewingAttendeesEvent.capacity} capacity limit` : ''}
              </p>
            </div>
            <button
              onClick={() => setViewingAttendeesEvent(null)}
              className="text-slate-400 hover:text-white p-1 text-base cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Copy / Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter attendees by name or email..."
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-red-500"
              />
            </div>
            <button
              onClick={() => handleCopyAttendeeEmails(viewingAttendeesEvent?.attendees || [])}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            >
              {copiedEmails ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedEmails ? 'Emails Copied' : 'Copy All Emails'}</span>
            </button>
          </div>

          {/* Attendee Table */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-black/30">
            {(() => {
              const attendees = (viewingAttendeesEvent?.attendees || []).filter((att) => {
                if (!attendeeSearch.trim()) return true;
                const userObj = typeof att.user === 'object' ? att.user : null;
                const name = `${userObj?.firstName || ''} ${userObj?.lastName || ''}`.toLowerCase();
                const email = (userObj?.email || '').toLowerCase();
                const q = attendeeSearch.toLowerCase();
                return name.includes(q) || email.includes(q);
              });

              if (attendees.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No attendees registered for this event yet.
                  </div>
                );
              }

              return (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Attendee</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">RSVP Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendees.map((att, idx) => {
                      const userObj = typeof att.user === 'object' ? att.user : null;
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-white">
                              {userObj ? `${userObj.firstName} ${userObj.lastName}` : 'Registered Member'}
                            </div>
                            <div className="text-[11px] text-slate-400">{userObj?.email || 'Confidential'}</div>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-300">
                            {userObj?.studentId || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-slate-500">
                            {att.registeredAt ? new Date(att.registeredAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewingAttendeesEvent(null)}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/[0.05] text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* DELETE CONFIRMATION MODAL */}
      <ModalPortal isOpen={Boolean(deletingEventId)} onClose={() => setDeletingEventId(null)}>
        <div className="relative w-full max-w-sm rounded-3xl p-6 space-y-4 text-slate-100 border border-red-500/30 bg-gradient-to-b from-[#1c080b] to-[#070305] shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/20 text-red-400">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Confirm Removal</h3>
              <p className="text-xs text-slate-400">This will permanently delete this event and its RSVP roster.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeletingEventId(null)}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deletingEventId)}
              className="px-4 py-2 rounded-xl bg-red-600 text-xs font-black uppercase tracking-wider text-white hover:bg-red-500 transition cursor-pointer shadow-lg shadow-red-950/50"
            >
              Delete Event
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* CREATE EVENT / HISTORY MODAL */}
      <ModalPortal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="relative w-full max-w-lg rounded-3xl p-8 space-y-6 text-slate-100 border border-white/20 bg-gradient-to-b from-[#18060a] to-[#070305] shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-amber-300">Create Event / Archive</h2>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setCreateMode('upcoming');
                setForm((prev) => ({ ...prev, date: '' }));
              }}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                createMode === 'upcoming'
                  ? 'bg-red-600/30 border border-red-500/50 text-red-300'
                  : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Upcoming Event
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateMode('past');
                setForm((prev) => ({ ...prev, date: '' }));
              }}
              className={`flex-1 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                createMode === 'past'
                  ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                  : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Past Event Archive
            </button>
          </div>

          {formError && <p className="text-red-400 text-xs font-semibold">{formError}</p>}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                {createMode === 'upcoming' ? 'EVENT TITLE' : 'EVENT NAME'}
              </label>
              <input
                placeholder="Event Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Description</label>
              <textarea
                placeholder="Provide event details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows="3"
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                  {createMode === 'upcoming' ? 'DATE & TIME' : 'EVENT DATE'}
                </label>
                <input
                  type={createMode === 'upcoming' ? 'datetime-local' : 'date'}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-red-500 shadow-inner"
                />
              </div>
              {createMode === 'upcoming' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">CAPACITY (OPTIONAL)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                {createMode === 'upcoming' ? 'VENUE OR LINK' : 'WHERE IT HAPPENED'}
              </label>
              <input
                placeholder="e.g. CITE Lab 3 or Virtual Meet"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                {createMode === 'upcoming' ? 'EVENT HIGHLIGHTS (OPTIONAL)' : 'HIGHLIGHTS / SUMMARY (key moments, winners)'}
              </label>
              <textarea
                placeholder={createMode === 'upcoming' ? 'Key takeaways, agenda, speakers...' : 'Summary of what happened...'}
                value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                rows="2"
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            {/* Multi-Image Uploader */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                {createMode === 'past' ? 'GALLERY IMAGES (multi-image carousel)' : 'EVENT HERO IMAGE'}
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUploadCreate}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-red-600 file:text-white hover:file:bg-red-700 bg-black/50 border border-white/15 rounded-2xl px-3 py-2 cursor-pointer"
              />
              {uploadingCreate && <p className="text-amber-400 text-[10px] mt-1 animate-pulse">Uploading image(s)...</p>}

              {form.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden h-16 border border-white/20">
                      <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-black/80 text-red-400 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-3 rounded-2xl border border-white/15 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-950/50 hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                {createMode === 'upcoming' ? 'Publish Event' : 'Archive Event'}
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* EDIT EVENT MODAL */}
      <ModalPortal isOpen={Boolean(editingEvent)} onClose={() => setEditingEvent(null)}>
        <div className="relative w-full max-w-lg rounded-3xl p-8 space-y-6 text-slate-100 border border-white/20 bg-gradient-to-b from-[#180a04] to-[#070305] shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-amber-300">Edit Event Module</h2>
            <button
              onClick={() => setEditingEvent(null)}
              className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {editError && <p className="text-red-400 text-xs font-semibold">{editError}</p>}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Title</label>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                required
                rows="3"
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                  {editingEvent?.isPast || (editingEvent?.date && new Date(editingEvent.date) < new Date()) ? 'Event Date' : 'Date & Time'}
                </label>
                <input
                  type={editingEvent?.isPast || (editingEvent?.date && new Date(editingEvent.date) < new Date()) ? 'date' : 'datetime-local'}
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-2xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Location</label>
              <input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Highlights</label>
              <textarea
                value={editForm.highlights}
                onChange={(e) => setEditForm({ ...editForm, highlights: e.target.value })}
                rows="2"
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            {/* Multi-Image Uploader for Edit */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Banner / Carousel Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUploadEdit}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-amber-600 file:text-white hover:file:bg-amber-700 bg-black/50 border border-white/15 rounded-2xl px-3 py-2 cursor-pointer"
              />
              {uploadingEdit && <p className="text-amber-400 text-[10px] mt-1 animate-pulse">Uploading image(s)...</p>}

              {editForm.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {editForm.images.map((url, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden h-16 border border-white/20">
                      <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-black/80 text-red-400 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-5 py-3 rounded-2xl border border-white/15 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-950/50 hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </ModalPortal>
    </div>
  );
}
