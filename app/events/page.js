'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function EventsPage() {
  const { user, token, loading } = useAuth();
  const [events, setEvents] = useState([]);
  const [fetchError, setFetchError] = useState('');

  // Form state, only used if user can create events
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '' });
  const [formError, setFormError] = useState('');

  const canCreate = user && ['officer', 'teacher', 'super_admin'].includes(user.role);

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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create event');
        return;
      }
      setForm({ title: '', description: '', date: '', location: '' });
      loadEvents(); // refresh the list
    } catch (err) {
      setFormError('Could not connect to the server');
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">Please log in to view events.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      {canCreate && (
        <form onSubmit={handleCreate} className="border rounded-lg p-4 mb-6 space-y-3">
          <h2 className="font-semibold">Create New Event</h2>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <input
            placeholder="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <textarea
            placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <input
            type="datetime-local" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <input
            placeholder="Location" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required className="w-full border rounded p-2"
          />
          <button type="submit" className="bg-black text-white rounded px-4 py-2">
            Create Event
          </button>
        </form>
      )}

      {fetchError && <p className="text-red-600">{fetchError}</p>}

      <div className="space-y-3">
        {events.length === 0 && <p className="text-gray-500">No events yet.</p>}
        {events.map((event) => (
          <div key={event._id} className="border rounded-lg p-4">
            <h3 className="font-bold">{event.title}</h3>
            <p className="text-sm text-gray-600">{new Date(event.date).toLocaleString()} — {event.location}</p>
            <p className="mt-1">{event.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}