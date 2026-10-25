'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import AccessDenied from '@/components/AccessDenied';
import { Search, Users, Mail, BookOpen, Trash2, AlertTriangle, X } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';
import ModalPortal from '@/components/ModalPortal';
import CitemasLoader from '@/components/CitemasLoader';

export default function UsersDirectoryPage() {
  const { user: authUser, token, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
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

  useBodyScrollLock(Boolean(memberToDelete));

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
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('citemas_token');
      if (!storedToken) {
        router.replace('/login');
        return;
      }
    }

    if (!authLoading) {
      if (!authUser || !token) {
        router.replace('/login');
        return;
      }
      setCheckingAuth(false);
    }
  }, [authLoading, authUser, token, router]);

  useEffect(() => {
    if (!authLoading && authUser && token) {
      if (canView) {
        fetchUsers(true);
      } else {
        const timer = setTimeout(() => setLoading(false), 350);
        return () => clearTimeout(timer);
      }
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
    const nextRole = draft.role || member.role;
    if (!nextRole) {
      showToast?.('Could not determine a role to save.', 'error');
      return;
    }
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
    } else if (roleFilter === 'adviser') {
      matchesRole = role === 'adviser' || role === 'teacher' || u.accountType === 'adviser';
    } else if (roleFilter === 'member') {
      matchesRole = role === 'member';
    }

    return matchesSearch && matchesDept && matchesRole;
  });

  const uniqueDepartments = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  if (checkingAuth || authLoading || !authUser || !token || (loading && !isRefreshing)) {
    return <CitemasLoader label="Loading member directory..." />;
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
    <div className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--foreground)] sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-black/10 dark:border-white/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-red-600 dark:text-red-300">
              <Users size={12} />
              Community Network
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Member Directory</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Connect with fellow student artists, editors, faculty advisers, and multimedia creators across campus.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-600 dark:text-white/50 bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-xl">
              Showing: <span className="text-red-500 font-bold">{filteredUsers.length}</span> of {users.length} Members
            </div>
          </div>
        </div>

        {/* Role Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[var(--card-bg)] backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl w-fit">
          {[
            { id: 'all', label: 'All Members' },
            { id: 'officer', label: 'Officers' },
            { id: 'member', label: 'Regular Members' },
            { id: 'adviser', label: 'Faculty & Advisers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                roleFilter === tab.id
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-900/40 border border-white/20'
                  : 'text-slate-600 hover:text-slate-900 dark:text-red-200/60 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Department Toolbar */}
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)] pl-11 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 backdrop-blur-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)] px-4 py-3.5 text-sm text-slate-900 dark:text-white backdrop-blur-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept} className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Users Asymmetrical Editorial Grid */}
        {filteredUsers.length === 0 ? (
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/80 dark:bg-[#090a0b]/80 p-16 text-center backdrop-blur-2xl">
            <Users size={36} className="mx-auto mb-3 text-red-500/50" />
            <p className="font-display text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">No members found</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Member Spotlight (First Officer or Admin if available) */}
            {filteredUsers.length > 0 && (
              (() => {
                const spotlight = filteredUsers.find((m) => m.role === 'officer' || m.role === 'super_admin' || m.isOfficer || m.role === 'adviser') || filteredUsers[0];
                return (
                  <div className="w-full rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/90 dark:bg-[#090a0b]/90 p-6 sm:p-8 backdrop-blur-2xl hover:border-red-500/40 transition-all duration-300 group">
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500 uppercase pb-4 border-b border-black/10 dark:border-white/10">
                      <span>COUNCIL // MEMBER SPOTLIGHT</span>
                      <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
                        ACTIVE ORG
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center pt-6">
                      <div className="md:col-span-4 flex justify-center md:justify-start">
                        <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-2xl overflow-hidden border border-black/15 dark:border-white/20 shadow-xl group-hover:scale-102 transition-transform duration-500">
                          <img
                            src={spotlight.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'}
                            alt={`${spotlight.firstName} ${spotlight.lastName}`}
                            className="h-full w-full object-cover filter contrast-105"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-8 space-y-3 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                          <span className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-300">
                            {spotlight.role === 'super_admin' ? 'SUPER ADMIN' : spotlight.role === 'adviser' ? 'FACULTY ADVISER' : spotlight.officerPosition ? spotlight.officerPosition.replace(/_/g, ' ') : spotlight.role}
                          </span>
                          {spotlight.yearLevel && (
                            <span className="rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-0.5 text-[10px] font-mono uppercase text-slate-700 dark:text-slate-300">
                              {spotlight.yearLevel} Yr
                            </span>
                          )}
                          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300">
                            // {spotlight.specialization ? spotlight.specialization.replace(/_/g, ' ') : 'General Media'}
                          </span>
                        </div>

                        <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                          {spotlight.firstName} {spotlight.lastName}
                        </h2>

                        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                          <div>{spotlight.department || 'PHINMA University of Iloilo'}</div>
                          <div className="text-slate-500 dark:text-slate-500">{spotlight.email}</div>
                        </div>

                        {spotlight.bio && (
                          <p className="font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic max-w-xl leading-relaxed pt-1">
                            &ldquo;{spotlight.bio}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Asymmetrical 2-Column Editorial Grid for Roster */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {filteredUsers.map((member) => (
                <div
                  key={member._id || member.email}
                  className="group relative rounded-3xl border border-black/10 dark:border-white/10 bg-[var(--card-bg)]/85 dark:bg-[#090a0b]/85 hover:border-red-500/40 p-6 sm:p-7 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-5">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-black/10 dark:border-white/15 bg-black/5 dark:bg-black/60 shadow-lg">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            member.role === 'super_admin' || member.role === 'admin' 
                              ? 'border-red-500/50 bg-red-500/20 text-red-600 dark:text-red-300' 
                              : member.role === 'officer' || member.isOfficer 
                              ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : member.role === 'adviser' || member.role === 'teacher'
                              ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                              : member.role === 'alumni'
                              ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {member.role === 'super_admin' ? 'Admin' : member.role === 'adviser' ? 'Adviser' : member.role === 'teacher' ? 'Faculty' : member.role === 'officer' || member.isOfficer ? 'Officer' : member.role === 'alumni' ? 'Alumni' : 'Member'}
                          </span>
                          {member.yearLevel && (
                            <span className="rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[9px] font-mono text-slate-700 dark:text-white/70">
                              {member.yearLevel} Yr
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-300 transition-colors truncate">
                          {member.firstName} {member.lastName}
                        </h3>

                        <p className="text-xs font-mono text-red-500 dark:text-red-400/90 uppercase tracking-wider truncate">
                          {member.specialization ? member.specialization.replace(/_/g, ' ') : 'General Creator'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-black/10 dark:border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <BookOpen size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{member.department || 'PHINMA University of Iloilo'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={12} className="text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>

                    {member.bio && (
                      <p className="text-xs font-light leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 italic border-t border-black/5 dark:border-white/5 pt-2">
                        &ldquo;{member.bio}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2">
                    {canDeleteMembers && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member)}
                        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-300 transition hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-200 cursor-pointer"
                      >
                        <Trash2 size={12} className="mr-1.5 inline" />
                        Delete Member
                      </button>
                    )}

                    {canManageMembers && (
                      <div className="mt-3 border-t border-black/10 dark:border-white/10 pt-3 space-y-2">
                        <label className="block text-[9px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Update Role Assignment
                        </label>

                        <div className="flex gap-2">
                          <select
                            value={roleDrafts[member._id]?.role || member.role || ''}
                            onChange={(e) => handleRoleDraftChange(member._id, 'role', e.target.value)}
                            className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#120505] px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
                          >
                            <option value="" disabled className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Select role</option>
                            <option value="member" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Member</option>
                            <option value="alumni" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Alumni</option>
                            <option value="officer" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Officer</option>
                            <option value="adviser" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Faculty Adviser</option>
                            <option value="teacher" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Teacher</option>
                            <option value="super_admin" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Admin</option>
                          </select>

                          {(roleDrafts[member._id]?.role || member.role) === 'officer' && (
                            <select
                              value={roleDrafts[member._id]?.officerPosition || member.officerPosition || 'president'}
                              onChange={(e) => handleRoleDraftChange(member._id, 'officerPosition', e.target.value)}
                              className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#120505] px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-red-500 focus:outline-none"
                            >
                              <option value="president" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">President</option>
                              <option value="vice_president" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Vice President</option>
                              <option value="secretary" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Secretary</option>
                              <option value="treasurer" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Treasurer</option>
                              <option value="pro" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">PRO</option>
                              <option value="pio" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">PIO</option>
                              <option value="events_director" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Events Director</option>
                              <option value="creative_director" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Creative Director</option>
                              <option value="year_level_representative" className="bg-white text-slate-900 dark:bg-[#120505] dark:text-white">Year Level Representative</option>
                            </select>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRoleUpdate(member)}
                          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:opacity-90 cursor-pointer shadow-md"
                        >
                          Save Role
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Member Confirmation Modal */}
        <ModalPortal isOpen={Boolean(memberToDelete)} onClose={() => setMemberToDelete(null)}>
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
                  {memberToDelete?.firstName} {memberToDelete?.lastName} ({memberToDelete?.email})
                  {memberToDelete?.officerPosition && ` — ${memberToDelete.officerPosition.replace(/_/g, ' ').toUpperCase()}`}
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
        </ModalPortal>

      </div>
    </div>
  );
}