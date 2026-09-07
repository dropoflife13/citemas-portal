'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const POSITIONS = [
  { value: '', label: '-- No position --' },
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'pro', label: 'P.R.O.' },
  { value: 'events_director', label: 'Events Director' },
  { value: 'creative_director', label: 'Creative Director' },
  { value: 'year_level_representative', label: 'Year Level Representative' },
];

export default function UsersPage() {
  const { user, token, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [activeTab, setActiveTab] = useState('members');

  const canView = user && ['super_admin', 'teacher', 'officer', 'alumni', 'member'].includes(user.role);
  const isTeacher = user?.role === 'teacher';
  const isPresident = user?.role === 'officer' && user?.officerPosition === 'president';
  const canPromoteOfficer = isTeacher || isPresident;
  const canApproveAlumni = ['teacher', 'officer', 'super_admin'].includes(user?.role);

  async function loadUsers() {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setError(data.error);
    } catch {
      setError('Could not connect to the server');
    }
  }

  useEffect(() => {
    if (token && canView) loadUsers();
  }, [token]);

  async function handleUpdate(id, role, extra = {}) {
    setActionMsg('');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error);
        return;
      }
      setActionMsg(`Updated ${data.firstName} ${data.lastName}`);
      loadUsers();
    } catch {
      setActionMsg('Could not connect to the server');
    }
  }

  const members = users.filter((u) => u.role === 'member');
  const officers = users.filter((u) => u.role === 'officer');
  const alumni = users.filter((u) => u.role === 'alumni');

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">Please log in.</p>;
  if (!canView) return <p className="p-6 text-gray-500">You don't have access to this page.</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Directory</h1>

      <div className="flex gap-4 border-b mb-6">
        {['members', 'officers', 'alumni'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 capitalize ${activeTab === tab ? 'border-b-2 border-black font-semibold' : 'text-gray-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {actionMsg && <p className="text-sm mb-4 text-blue-700">{actionMsg}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-3">
        {activeTab === 'members' && (
          <>
            {members.length === 0 && <p className="text-gray-500">No members yet.</p>}
            {members.map((u) => (
              <div key={u._id} className="border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{u.firstName} {u.lastName}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  {u.specialization && <p className="text-sm text-gray-500">{u.specialization}</p>}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {canPromoteOfficer && <PromoteControl userId={u._id} onUpdate={handleUpdate} />}
                  {canApproveAlumni && <AlumniControl userId={u._id} onUpdate={handleUpdate} />}
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'officers' && (
          <>
            {officers.length === 0 && <p className="text-gray-500">No officers yet.</p>}
            {officers.map((u) => (
              <div key={u._id} className="border rounded-lg p-4">
                <p className="font-bold">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
                <p className="text-sm">
                  {POSITIONS.find((p) => p.value === u.officerPosition)?.label || 'No position assigned'}
                </p>
              </div>
            ))}
          </>
        )}

        {activeTab === 'alumni' && (
          <>
            {alumni.length === 0 && <p className="text-gray-500">No alumni yet.</p>}
            {alumni.map((u) => (
              <div key={u._id} className="border rounded-lg p-4">
                <p className="font-bold">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
                {u.graduationYear && <p className="text-sm text-gray-500">Class of {u.graduationYear}</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function PromoteControl({ userId, onUpdate }) {
  const [position, setPosition] = useState('');

  return (
    <div className="flex items-center gap-2">
      <select
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        className="border rounded p-1 text-sm"
      >
        {POSITIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      <button
        onClick={() => onUpdate(userId, 'officer', { officerPosition: position })}
        className="bg-black text-white text-sm px-3 py-1 rounded"
      >
        Promote to Officer
      </button>
    </div>
  );
}

function AlumniControl({ userId, onUpdate }) {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border rounded p-1 text-sm w-20"
      />
      <button
        onClick={() => onUpdate(userId, 'alumni', { graduationYear: Number(year) })}
        className="bg-gray-700 text-white text-sm px-3 py-1 rounded"
      >
        Mark as Alumni
      </button>
    </div>
  );
}