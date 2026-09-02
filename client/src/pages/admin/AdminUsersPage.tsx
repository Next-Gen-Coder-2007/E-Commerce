import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  getAdminUsersApi,
  updateUserRoleApi,
  toggleUserBanApi,
  AdminUser,
} from '../../services/adminService';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    getAdminUsersApi({ search: search.trim() || undefined, role: roleFilter || undefined })
      .then((data) => setUsers(data.users || []))
      .catch((err) => console.warn('Users fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: 'user' | 'company' | 'admin') => {
    setActionLoading(userId);
    try {
      await updateUserRoleApi(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId);
    try {
      await toggleUserBanApi(userId, !isBanned);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBanned: !isBanned } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle ban status');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">User Accounts & Roles</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage buyer permissions, elevate company/admin privileges, and moderate accounts.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-zinc-200 text-xs text-zinc-900 rounded-xl pl-9 pr-3.5 py-2 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 shadow-xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-zinc-200 text-xs text-zinc-900 rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-900 shadow-xs cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">Customers (user)</option>
            <option value="company">Merchants (company)</option>
            <option value="admin">Administrators (admin)</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Registered</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-zinc-50/60 transition">
                  <td className="p-4">
                    <div className="font-bold text-zinc-900">{u.name}</div>
                    <div className="text-[11px] text-zinc-500">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      disabled={actionLoading === u._id}
                      onChange={(e) => handleRoleChange(u._id, e.target.value as any)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold border border-zinc-200 bg-white text-zinc-800 transition cursor-pointer shadow-2xs"
                    >
                      <option value="user">User</option>
                      <option value="company">Company</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {u.isBanned ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-zinc-500 text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleBanToggle(u._id, !!u.isBanned)}
                      disabled={actionLoading === u._id}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        u.isBanned
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {u.isBanned ? 'Unban Account' : 'Ban Account'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    No accounts matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
