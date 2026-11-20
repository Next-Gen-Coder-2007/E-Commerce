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
    { to: '/admin', label: 'Platform Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users & Roles', icon: Users },
    { to: '/admin/merchants', label: 'Merchant Approvals', icon: Store },
    { to: '/admin/products', label: 'Product Moderation', icon: Package },
    { to: '/admin/orders', label: 'Orders & Fulfillment', icon: ShoppingCart },
    { to: '/admin/system', label: 'System Architecture', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] flex flex-col md:flex-row">
      {/* Swiss Brutalist Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r-2 border-[#1E1E1E] shrink-0 flex flex-col justify-between">
        <div>
          {/* Top Brand */}
          <div className="p-5 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#D9D6D0]">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_#DB4A2B]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-clash font-bold text-sm text-[#1E1E1E] tracking-tight uppercase">GOVERNANCE CONSOLE</h1>
                <p className="text-[10px] font-mono text-[#DB4A2B] font-bold uppercase">Root Administration</p>
              </div>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 border-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? 'border-[#1E1E1E] bg-[#1E1E1E] text-[#E4E2DD] shadow-[3px_3px_0px_#DB4A2B]'
                        : 'border-transparent text-[#444444] hover:border-[#1E1E1E] hover:bg-[#E4E2DD] hover:text-[#1E1E1E]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Info & Storefront Link */}
        <div className="p-4 border-t-2 border-[#1E1E1E] space-y-3 bg-[#D9D6D0]">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-[2px_2px_0px_#1E1E1E]"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#DB4A2B]" />
              <span>Public Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1E1E1E]" />
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 border border-[#1E1E1E] bg-[#1E1E1E] text-white flex items-center justify-center font-clash font-bold text-xs shrink-0 uppercase">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-clash font-bold text-[#1E1E1E] truncate uppercase">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-[9px] font-mono font-bold text-[#DB4A2B] uppercase">
                  SUPER ADMIN
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 border border-[#1E1E1E] bg-white hover:bg-[#DB4A2B] hover:text-white transition cursor-pointer"
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
