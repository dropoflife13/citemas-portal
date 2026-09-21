// app/events/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import EventCarousel from '@/components/EventCarousel';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';

// CITEMAS Aesthetic Colors & Theme helpers
const CITEMAS_RED = '#DC2626';
const CITEMAS_DARK_RED = '#7F1D1D';
const CITEMAS_CREAM = '#FDFBF7';
const CITEMAS_GOLD = '#F59E0B';
const MUTED = 'rgba(253,251,247,0.75)';

// Floating Spatial Glass Panel Component (Enhanced Depth & Glow)
function SpatialGlassPanel({ children, className = '', depth = 'mid' }) {
  const depthStyles = {
    back: 'translate-z-0 shadow-xl',
    mid: 'hover:-translate-y-1.5 hover:shadow-[0_30px_70px_-15px_rgba(220,38,38,0.15)]',
    front: 'hover:-translate-y-2.5 hover:shadow-[0_40px_80px_-15px_rgba(220,38,38,0.25)]',
  };

  return (
    <div
      className={`relative rounded-[32px] p-7 transition-all duration-500 ease-out transform-gpu ${depthStyles[depth]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 100%)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        boxShadow: `
          0 25px 60px rgba(0, 0, 0, 0.6),
          0 0 50px rgba(220, 38, 38, 0.12),
          inset 0 1px 2px rgba(255, 255, 255, 0.4),
          inset 0 0 20px rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full opacity-25 blur-3xl transition-all duration-700 group-hover:opacity-40"
        style={{ background: CITEMAS_RED }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Spatial Glass Button Component
function SpatialButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  let bgGradient = isPrimary
    ? `linear-gradient(135deg, ${CITEMAS_RED} 0%, ${CITEMAS_DARK_RED} 100%)`
    : isDanger
    ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.4) 0%, rgba(127, 29, 29, 0.6) 100%)'
    : 'rgba(255, 255, 255, 0.08)';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center px-6 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
      } ${className}`}
      style={{
        background: bgGradient,
        color: CITEMAS_CREAM,
        backdropFilter: 'blur(16px)',
        border: isPrimary ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: isPrimary
          ? '0 15px 35px -5px rgba(220, 38, 38, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
      }}
    >
      <span className="relative z-10 drop-shadow-sm">{children}</span>
    </button>
  );
}

export default function EventsPage() {
  const { user, token, loading } = useAuth();
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState('');

  // Active Tab State: 'upcoming' | 'previous'
  const [activeTab, setActiveTab] = useState('upcoming');

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

  useBodyScrollLock(isCreateModalOpen);
  useBodyScrollLock(Boolean(editingEvent));

  const canManageRoles = ['officer', 'teacher', 'adviser', 'super_admin'];
  const canCreate = user && canManageRoles.includes(user.role);

  async function loadEvents() {
    try {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Failed to load events');
        return;
      }
      setEvents(data);
    } catch (err) {
      setFetchError('Could not connect to the server');
    }
  }

  useEffect(() => {
    if (token) loadEvents();
  }, [token]);

  // Cloudinary Upload Widget Helper for Creation
  async function handleCloudinaryUploadCreate(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingCreate(true);
    const uploadedUrls = [];

    for (const file of files) {
      const dataObj = new FormData();
      dataObj.append('file', file);
      dataObj.append('upload_preset', 'citemas_preset');

      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dvh7zcfwv/image/upload', {
          method: 'POST',
          body: dataObj,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((prev) => ({
        ...prev,
        image: prev.image || uploadedUrls[0],
        images: [...prev.images, ...uploadedUrls],
      }));
    }
    setUploadingCreate(false);
  }

  // Cloudinary Upload Widget Helper for Editing
  async function handleCloudinaryUploadEdit(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingEdit(true);
    const uploadedUrls = [];

    for (const file of files) {
      const dataObj = new FormData();
      dataObj.append('file', file);
      dataObj.append('upload_preset', 'citemas_preset');

      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dvh7zcfwv/image/upload', {
          method: 'POST',
          body: dataObj,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (uploadedUrls.length > 0) {
      setEditForm((prev) => ({
        ...prev,
        image: prev.image || uploadedUrls[0],
        images: [...prev.images, ...uploadedUrls],
      }));
    }
    setUploadingEdit(false);
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
          isPast: new Date(form.date) < new Date(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create event');
        return;
      }
      setForm({ title: '', description: '', date: '', location: '', capacity: '', image: '', images: [], highlights: '' });
      setIsCreateModalOpen(false);
      loadEvents();
    } catch (err) {
      setFormError('Could not connect to the server');
    }
  }

  async function handleDelete(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete event');
        return;
      }
      loadEvents();
    } catch (err) {
      alert('Could not connect to the server');
    }
  }

  function startEdit(event) {
    setEditingEvent(event);
    setEditError('');
    const formattedDate = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';

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
        return;
      }
      setEditingEvent(null);
      loadEvents();
    } catch (err) {
      setEditError('Could not connect to the server');
    }
  }

  async function handleRsvp(eventId, isRegistered) {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: isRegistered ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'RSVP action failed');
        return;
      }
      loadEvents();
    } catch (err) {
      alert('Could not connect to the server');
    }
  }

  if (loading) return <div className="p-12 text-center text-slate-300">Loading spatial modules...</div>;
  if (!user) return <div className="p-12 text-center text-slate-300">Please log in to view events.</div>;

  const now = new Date();
  const upcomingEvents = events.filter((ev) => new Date(ev.date) >= now);
  const previousEvents = events.filter((ev) => new Date(ev.date) < now);
  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : previousEvents;

  return (
    <div className="relative mx-auto max-w-7xl px-6 py-12 text-slate-100 space-y-10">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-2">
          <span
            className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 inline-block backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.05)', color: CITEMAS_GOLD }}
          >
            Directory Hub
          </span>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: CITEMAS_CREAM }}>
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-red-600 bg-clip-text text-transparent drop-shadow-sm">CITEMAS</span> Events & Archives
          </h1>
          <p className="text-sm font-medium" style={{ color: MUTED }}>
            Explore immersive media workshops, digital exhibits, past event history, and technical showcases.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tab Navigation Switches */}
          <div
            className="flex p-1 rounded-full border border-white/15 backdrop-blur-xl"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/40'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'previous'
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/40'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Past Event History ({previousEvents.length})
            </button>
          </div>

          {/* Add Event Button for Authorized Staff */}
          {canCreate && (
            <SpatialButton onClick={() => setIsCreateModalOpen(true)} variant="primary">
              + Post Event / History
            </SpatialButton>
          )}
        </div>
      </div>

      {fetchError && <p className="text-red-400 font-semibold">{fetchError}</p>}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedEvents.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <SpatialGlassPanel depth="back" className="max-w-md mx-auto py-10">
              <p className="text-3xl mb-2">📂</p>
              <p className="font-extrabold text-lg text-slate-200">No {activeTab} events available</p>
              <p className="text-xs text-slate-400 mt-1">Check back later or explore other archives.</p>
            </SpatialGlassPanel>
          </div>
        )}

        {displayedEvents.map((event) => {
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

          return (
            <SpatialGlassPanel key={event._id} depth="front" className="flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                {/* Event Image / Multi-image Carousel */}
                {activeTab === 'previous' || allImages.length > 1 ? (
                  <EventCarousel images={allImages} title={event.title} />
                ) : (
                  <div className="h-48 w-full rounded-2xl overflow-hidden bg-black/50 border border-white/15 relative shadow-inner">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950/80 to-black text-4xl">
                        🏛️
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/70 text-amber-300 backdrop-blur-md border border-white/20 shadow-md">
                      {activeTab === 'upcoming' ? 'Scheduled' : 'Past Archive'}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-black text-lg tracking-tight line-clamp-1" style={{ color: CITEMAS_CREAM }}>
                    {event.title}
                  </h3>
                  {canManageEvent && (
                    <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
                      <button onClick={() => startEdit(event)} className="text-amber-400 hover:text-amber-300 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(event._id)} className="text-red-400 hover:text-red-300 transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs space-y-1 font-medium" style={{ color: MUTED }}>
                  <p>📅 {new Date(event.date).toLocaleString()}</p>
                  <p>📍 {event.location}</p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{event.description}</p>

                {event.highlights && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-amber-200/90 leading-relaxed font-light">
                    <span className="font-bold text-amber-400 uppercase text-[10px] block mb-0.5">Highlights</span>
                    {event.highlights}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer with RSVP / Attendee details */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  Seats: {event.attendeeCount} {event.capacity ? `/ ${event.capacity}` : '(Open)'}
                </span>

                {activeTab === 'upcoming' && (
                  <button
                    onClick={() => handleRsvp(event._id, isRegistered)}
                    disabled={!isRegistered && isFull}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isRegistered
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                        : isFull
                        ? 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/10'
                        : 'bg-emerald-600/80 text-white border border-emerald-400/30 hover:bg-emerald-600 shadow-lg'
                    }`}
                  >
                    {isRegistered ? 'Cancel RSVP' : isFull ? 'Full Slot' : 'RSVP Now'}
                  </button>
                )}
              </div>
            </SpatialGlassPanel>
          );
        })}
      </div>

      {/* CREATE EVENT / HISTORY MODAL */}
      <ModalPortal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div
          className="relative w-full max-w-lg rounded-[36px] p-8 space-y-6 text-slate-100 border border-white/25 shadow-[0_0_100px_rgba(220,38,38,0.3)] overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{
            background: 'radial-gradient(circle at 50% 10%, rgba(127, 29, 29, 0.45) 0%, rgba(10, 4, 4, 0.95) 90%)',
            backdropFilter: 'blur(40px) saturate(200%)',
          }}
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-amber-300">Create Event / Archive</h2>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="text-slate-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>
          </div>

          {formError && <p className="text-red-400 text-xs font-semibold">{formError}</p>}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Title</label>
              <input
                placeholder="Event Name"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
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
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Capacity (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Location</label>
              <input
                placeholder="Venue or Link"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Highlights (Optional for Past History)</label>
              <textarea
                placeholder="Key takeaways, winning teams, summary..."
                value={form.highlights}
                onChange={(e) => setForm({ ...form, highlights: e.target.value })}
                rows="2"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
            </div>

            {/* Multi-Image Cloudinary Uploader */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Images (Multiple for Carousel)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleCloudinaryUploadCreate}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-red-600 file:text-white hover:file:bg-red-700 bg-black/50 border border-white/15 rounded-xl px-3 py-2"
              />
              {uploadingCreate && <p className="text-amber-400 text-[10px] mt-1">Uploading image(s)...</p>}
              
              {form.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden h-16 border border-white/20">
                      <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-black/80 text-red-400 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <SpatialButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </SpatialButton>
              <SpatialButton type="submit" variant="primary">
                Publish Event
              </SpatialButton>
            </div>
          </form>
        </div>
      </ModalPortal>

      {/* EDIT EVENT MODAL */}
      <ModalPortal isOpen={Boolean(editingEvent)} onClose={() => setEditingEvent(null)}>
        <div
          className="relative w-full max-w-lg rounded-[36px] p-8 space-y-6 text-slate-100 border border-white/25 shadow-[0_0_100px_rgba(245,158,11,0.25)] overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{
            background: 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.35) 0%, rgba(10, 4, 4, 0.95) 90%)',
            backdropFilter: 'blur(40px) saturate(200%)',
          }}
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-amber-300">Edit Event Module</h2>
            <button
              onClick={() => setEditingEvent(null)}
              className="text-slate-400 hover:text-white font-bold text-lg"
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
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                required
                rows="3"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 shadow-inner"
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
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Location</label>
              <input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                required
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Highlights</label>
              <textarea
                value={editForm.highlights}
                onChange={(e) => setEditForm({ ...editForm, highlights: e.target.value })}
                rows="2"
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>

            {/* Multi-Image Uploader for Edit */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">Event Banner / Carousel Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleCloudinaryUploadEdit}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-amber-600 file:text-white hover:file:bg-amber-700 bg-black/50 border border-white/15 rounded-xl px-3 py-2"
              />
              {uploadingEdit && <p className="text-amber-400 text-[10px] mt-1">Uploading image(s)...</p>}
              
              {editForm.images.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {editForm.images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden h-16 border border-white/20">
                      <img src={url} alt={`Uploaded ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-black/80 text-red-400 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <SpatialButton type="button" variant="secondary" onClick={() => setEditingEvent(null)}>
                Cancel
              </SpatialButton>
              <SpatialButton type="submit" variant="primary">
                Save Changes
              </SpatialButton>
            </div>
          </form>
        </div>
      </ModalPortal>
    </div>
  );
}
