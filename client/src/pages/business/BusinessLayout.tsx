import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BusinessLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/business/login');
  };

  const navItems = [
    { to: '/business', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/business/products', label: 'Products & Inventory', icon: Package },
    { to: '/business/orders', label: 'Store Orders', icon: ShoppingCart },
    { to: '/business/storefront', label: 'Storefront Customizer', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col md:flex-row">
      {/* Clean White Merchant Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200/80 shrink-0 flex flex-col justify-between">
        <div>
          {/* Top Brand */}
          <div className="p-5 border-b border-zinc-200/80 flex items-center justify-between">
            <Link to="/business" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-zinc-950 tracking-tight">Merchant Hub</h1>
                <p className="text-[10px] text-amber-600 font-semibold">Seller Center</p>
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
            to={`/store/${user?._id || ''}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 text-xs font-medium border border-zinc-200/80 transition shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.companyName?.charAt(0) || user?.name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 truncate">{user?.companyName || user?.name}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Verified Merchant</div>
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

export default BusinessLayout;
