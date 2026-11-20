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
      alert(err.message || 'Failed to update user access state');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            IDENTITY MANAGEMENT
          </span>
          <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
            Users & Role Governance
          </h2>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Audit registered identities, assign role permissions, and enforce access restrictions.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name..."
            className="px-3.5 py-2 border-2 border-[#1E1E1E] bg-white text-xs font-mono text-[#1E1E1E] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white text-xs font-mono font-bold uppercase hover:bg-[#DB4A2B] transition cursor-pointer"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="border-2 border-[#1E1E1E] bg-white shadow-[6px_6px_0px_#1E1E1E] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#D9D6D0] text-[10px] font-bold uppercase tracking-wider text-[#1E1E1E] border-b-2 border-[#1E1E1E]">
              <tr>
                <th className="p-4">Identity / Name</th>
                <th className="p-4">Contact Vector</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Access Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-[#E4E2DD]/40 transition-colors">
                  <td className="p-4 font-bold text-[#1E1E1E]">
                    <div className="font-clash font-bold uppercase">{u.name}</div>
                    <div className="text-[10px] text-[#444444]">ID: {u._id.slice(-8)}</div>
                  </td>
                  <td className="p-4 text-[#1E1E1E]">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      disabled={actionLoading === u._id}
                      onChange={(e) =>
                        handleRoleChange(u._id, e.target.value as 'user' | 'company' | 'admin')
                      }
                      className="border border-[#1E1E1E] bg-white px-2 py-1 text-xs font-mono font-bold uppercase focus:outline-none cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="company">Merchant (Company)</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                        u.isBanned
                          ? 'border-[#DB4A2B] bg-[#DB4A2B]/10 text-[#DB4A2B]'
                          : 'border-[#1E1E1E] bg-[#1E1E1E] text-white'
                      }`}
                    >
                      {u.isBanned ? 'RESTRICTED' : 'AUTHORIZED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled={actionLoading === u._id}
                      onClick={() => handleBanToggle(u._id, !!u.isBanned)}
                      className={`px-3 py-1 border border-[#1E1E1E] text-xs font-mono font-bold uppercase transition cursor-pointer ${
                        u.isBanned
                          ? 'bg-white hover:bg-[#1E1E1E] hover:text-white text-[#1E1E1E]'
                          : 'bg-[#DB4A2B] text-white hover:bg-[#1E1E1E]'
                      }`}
                    >
                      {u.isBanned ? 'Lift Suspension' : 'Suspend Access'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#444444] font-mono">
                    NO IDENTITIES MATCH THE CURRENT CRITERIA.
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
