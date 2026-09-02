import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Activity,
  Shield,
  LogOut,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Overview & KPIs', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users & Roles', icon: Users },
    { to: '/admin/merchants', label: 'Merchant Approvals', icon: Store },
    { to: '/admin/products', label: 'Catalog Moderation', icon: Package },
    { to: '/admin/orders', label: 'Orders & Refunds', icon: ShoppingCart },
    { to: '/admin/system', label: 'Microservices Health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col md:flex-row">
      {/* Clean White Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200/80 shrink-0 flex flex-col justify-between">
        <div>
          {/* Top Brand */}
          <div className="p-5 border-b border-zinc-200/80 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-zinc-950 tracking-tight">Admin Console</h1>
                <p className="text-[10px] text-zinc-400 font-medium">Platform Governance</p>
              </div>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Info & Storefront Link */}
        <div className="p-4 border-t border-zinc-200/80 space-y-3 bg-zinc-50/50">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 text-xs font-medium border border-zinc-200/80 transition"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Customer Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Super Admin</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
