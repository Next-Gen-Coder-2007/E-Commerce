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
  ShieldCheck,
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
    { to: '/business', label: 'Overview Console', icon: LayoutDashboard, end: true },
    { to: '/business/products', label: 'Products & Inventory', icon: Package },
    { to: '/business/orders', label: 'Store Orders', icon: ShoppingCart },
    { to: '/business/storefront', label: 'Storefront Settings', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#1E1E1E] flex flex-col md:flex-row">
      {/* Swiss Brutalist Merchant Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r-2 border-[#1E1E1E] shrink-0 flex flex-col justify-between">
        <div>
          {/* Top Brand */}
          <div className="p-5 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#D9D6D0]">
            <Link to="/business" className="flex items-center gap-3">
              <div className="w-9 h-9 border-2 border-[#1E1E1E] bg-[#1E1E1E] text-white flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_#DB4A2B]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-clash font-bold text-sm text-[#1E1E1E] tracking-tight uppercase">MERCHANT HUB</h1>
                <p className="text-[10px] font-mono text-[#DB4A2B] font-bold uppercase">Seller Operations</p>
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
            to={`/store/${user?._id || ''}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-[2px_2px_0px_#1E1E1E]"
          >
            <span className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-[#DB4A2B]" />
              <span>Public Store</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-[#1E1E1E]" />
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 border border-[#1E1E1E] bg-[#1E1E1E] text-white flex items-center justify-center font-clash font-bold text-xs shrink-0 uppercase">
                {user?.companyName?.charAt(0) || user?.name?.charAt(0) || 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-clash font-bold text-[#1E1E1E] truncate uppercase">
                  {user?.companyName || user?.name}
                </div>
                <div className="text-[9px] font-mono font-bold text-[#DB4A2B] uppercase">
                  VERIFIED MERCHANT
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

export default BusinessLayout;
