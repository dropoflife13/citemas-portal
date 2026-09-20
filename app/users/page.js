'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import AccessDenied from '@/components/AccessDenied';
import { Search, Users, Mail, BookOpen, Trash2, AlertTriangle, X } from 'lucide-react';

export default function UsersDirectoryPage() {
  const { user: authUser, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'officer', 'member', 'admin'
  const [error, setError] = useState('');
  const [roleDrafts, setRoleDrafts] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageMembers = authUser && ['super_admin', 'teacher', 'adviser', 'officer'].includes(authUser.role);
  const canDeleteMembers = authUser?.role === 'super_admin';
  const canView = authUser && ['super_admin', 'teacher', 'adviser', 'officer', 'alumni', 'member'].includes(authUser.role);

  const fetchUsers = async (showLoader = true) => {
    try {
      setLoading(showLoader);
      setIsRefreshing(!showLoader);

      const res = await fetch('/api/users', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || data || []);
      } else {
        setError(data.message || 'Failed to fetch directory members.');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('An unexpected error occurred while loading members.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && authUser && token && canView) {
      fetchUsers(false);
    }
  }, [authLoading, authUser?.id, authUser?.role, token, canView]);

  const handleRoleDraftChange = (memberId, field, value) => {
    setRoleDrafts((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [field]: value,
      },
    }));
  };

  const handleDeleteMember = (member) => {
    if (!canDeleteMembers || !member?._id) return;
    setMemberToDelete(member);
  };

  const confirmDeleteMember = async () => {
    if (!canDeleteMembers || !memberToDelete?._id) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${memberToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Delete failed.');
      }

      setError('');
      showToast(`${memberToDelete.firstName} ${memberToDelete.lastName} was deleted`, 'success');
      setMemberToDelete(null);
      await fetchUsers(false);
    } catch (err) {
      console.error('Delete member error:', err);
      setError(err.message || 'Unable to delete this member.');
      showToast(err.message || 'Unable to delete this member.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleUpdate = async (member) => {
    if (!canManageMembers || !member?._id) return;

    const draft = roleDrafts[member._id] || {};
    const nextRole = draft.role || member.role || 'member';
    const nextPosition = draft.officerPosition || member.officerPosition || null;

    try {
      const res = await fetch(`/api/users/${member._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: nextRole,
          officerPosition: nextRole === 'officer' ? nextPosition : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Role update failed.');
      }

      setError('');
      await fetchUsers(false);
      showToast(`${member.firstName} ${member.lastName} is now ${nextRole.replace(/_/g, ' ')}`, 'success');
    } catch (err) {
      console.error('Role update error:', err);
      setError(err.message || 'Unable to update the member role right now.');
      showToast(err.message || 'Unable to update the member role right now.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const department = (u.department || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = fullName.includes(query) || email.includes(query) || department.includes(query);
    const matchesDept = departmentFilter ? u.department === departmentFilter : true;
    
    let matchesRole = true;
    if (roleFilter === 'officer') {
      matchesRole = role === 'officer' || u.isOfficer === true;
    } else if (roleFilter === 'admin') {
      matchesRole = role === 'super_admin' || role === 'admin';
    } else if (roleFilter === 'member') {
      matchesRole = role !== 'officer' && role !== 'super_admin' && role !== 'admin' && !u.isOfficer;
    }

    return matchesSearch && matchesDept && matchesRole;
  });

  const uniqueDepartments = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  if (authLoading || (canView && loading && !isRefreshing)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent text-[#FDFBF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium tracking-wider text-[#FDFBF7]/70">Loading member directory...</p>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-transparent px-4 py-12">
        <AccessDenied
          title="Member Directory Restricted"
          resourceName="the member directory"
          message="This section is available to approved CITEMAS members."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-12 text-[#FDFBF7] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-red-300">
              <Users size={12} />
              Community Network
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#FDFBF7]">Member Directory</h1>
            <p className="text-sm text-[#FDFBF7]/70">
              Connect with fellow student artists, editors, and multimedia creators across campus.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-white/50 bg-white/[0.04] border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-xl">
              Showing: <span className="text-red-400 font-bold">{filteredUsers.length}</span> of {users.length} Members
            </div>
          </div>
        </div>

        {/* Role Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'officer', label: 'Officers' },
            { id: 'member', label: 'Regular Members' },
    
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                roleFilter === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/40 border border-white/20'
                  : 'text-red-200/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Department Toolbar */}
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/30 backdrop-blur-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#120505] px-4 py-3.5 text-sm text-white backdrop-blur-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
            <Users size={32} className="mx-auto mb-3 text-white/30" />
            <p className="text-lg font-bold text-[#FDFBF7]">No members found</p>
            <p className="text-xs text-white/50 mt-1">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((member) => (
              <div
                key={member._id || member.email}
                className="group relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 hover:border-red-500/40 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-[#1a0d0d] shadow-lg">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                        member.role === 'super_admin' || member.role === 'admin' 
                          ? 'border-red-500/50 bg-red-500/20 text-red-300' 
                          : member.role === 'officer' || member.isOfficer 
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-red-500/30 bg-red-500/10 text-red-300'
                      }`}>
                        {member.role === 'super_admin' ? 'Admin' : member.role === 'officer' || member.isOfficer ? 'Officer' : 'Member'}
                      </span>
                      {member.yearLevel && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/70">
                          {member.yearLevel} Yr
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h3 className="text-lg font-black tracking-tight text-[#FDFBF7] group-hover:text-red-300 transition-colors">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-xs font-medium text-red-300/90 truncate">
                      {member.specialization ? member.specialization.replace(/_/g, ' ') : 'General Creator'}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4 text-xs text-white/70">
                    <div className="flex items-center gap-2 truncate">
                      <BookOpen size={13} className="text-white/40 shrink-0" />
                      <span className="truncate">{member.department || 'PHINMA University of Iloilo'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-white/40 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                {canDeleteMembers && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member)}
                      className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                    >
                      <Trash2 size={12} className="mr-1.5 inline" />
                      Delete Member
                    </button>
                  </div>
                )}

                {canManageMembers && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#FDFBF7]/60">
                        Update role
                      </label>

                      <select
                        value={roleDrafts[member._id]?.role || member.role || 'member'}
                        onChange={(e) => handleRoleDraftChange(member._id, 'role', e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="alumni">Alumni</option>
                        <option value="officer">Officer</option>
                        <option value="teacher">Teacher</option>
                        <option value="super_admin">Admin</option>
                      </select>

                      {(roleDrafts[member._id]?.role || member.role) === 'officer' && (
                        <select
                          value={roleDrafts[member._id]?.officerPosition || member.officerPosition || 'president'}
                          onChange={(e) => handleRoleDraftChange(member._id, 'officerPosition', e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#1a0d0d] px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
                        >
                          <option value="president">President</option>
                          <option value="vice_president">Vice President</option>
                          <option value="secretary">Secretary</option>
                          <option value="treasurer">Treasurer</option>
                          <option value="pro">PRO</option>
                          <option value="pio">PIO</option>
                          <option value="events_director">Events Director</option>
                          <option value="creative_director">Creative Director</option>
                          <option value="year_level_representative">Year Level Representative</option>
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRoleUpdate(member)}
                        className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
                      >
                        Save Role
                      </button>
                    </div>
                  </div>
                )}

                {member.bio && (
                  <p className="mt-4 text-xs font-light leading-relaxed text-white/60 line-clamp-2 border-t border-white/5 pt-3">
                    &ldquo;{member.bio}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Member Confirmation Modal */}
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-md rounded-[28px] border border-red-500/30 bg-[#140808] p-6 shadow-2xl space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/20 text-red-400">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#FDFBF7]">Confirm Deletion</h3>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Are you sure you want to delete this member? This action cannot be undone.
                  </p>
                  <p className="text-xs font-bold text-red-300 mt-2">
                    {memberToDelete.firstName} {memberToDelete.lastName} ({memberToDelete.email})
                    {memberToDelete.officerPosition && ` — ${memberToDelete.officerPosition.replace(/_/g, ' ').toUpperCase()}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setMemberToDelete(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteMember}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-900/40 hover:brightness-110 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Member'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}