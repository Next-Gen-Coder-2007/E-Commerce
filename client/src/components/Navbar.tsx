import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import SearchAutocomplete from './SearchAutocomplete';
import {
  ShoppingBag,
  LogOut,
  Sparkles,
  Building2,
  Package,
  MapPin,
  Heart,
  Shield,
  Bell,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { wishlistCount, toggleWishlistDrawer, priceDropCount } = useWishlist();
  const { unreadCount, toggleNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-zinc-950 leading-none">
                  NovaCommerce
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-tight">
                  Marketplace
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-zinc-600">
              <Link to="/categories" className="hover:text-zinc-950 transition">
                Categories
              </Link>
              <Link
                to="/deals"
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Deals</span>
              </Link>
            </nav>
          </div>

          {/* Instant Faceted Autocomplete Search */}
          <div className="flex-1 max-w-xl hidden md:flex items-center">
            <SearchAutocomplete />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {loading ? (
              <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-xl" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.role === 'company' ? (
                  <Link
                    to="/business"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-zinc-950 hover:bg-zinc-800 transition-colors shadow-xs"
                    title="Go to Seller & Merchant Dashboard"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Merchant Hub</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 transition-colors shadow-2xs"
                      title="Manage Account & Addresses"
                    >
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Addresses</span>
                    </Link>

                    <Link
                      to="/orders"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 transition-colors shadow-2xs"
                      title="My Orders & Shipments"
                    >
                      <Package className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Orders</span>
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border bg-zinc-50 text-zinc-900 border-zinc-300 hover:bg-zinc-100 transition-colors shadow-2xs"
                    title="Platform Administration Portal"
                  >
                    <Shield className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to={user.role === 'company' ? '/business' : user.role === 'admin' ? '/admin' : '/profile'}
                  className="flex items-center gap-2 p-1 sm:pr-3 sm:pl-1 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:bg-zinc-100/80 transition-colors"
                  title={user.role === 'company' ? 'Merchant Dashboard' : user.role === 'admin' ? 'Admin Portal' : 'Account Settings'}
                >
                  <div className={`w-7 h-7 rounded-lg ${user.role === 'company' ? 'bg-amber-600' : user.role === 'admin' ? 'bg-zinc-950' : 'bg-zinc-950'} text-white flex items-center justify-center font-extrabold text-xs shrink-0 select-none shadow-xs`}>
                    {user.role === 'company' ? <Building2 className="w-3.5 h-3.5" /> : user.role === 'admin' ? 'A' : (user.name ? user.name.trim().charAt(0).toUpperCase() : 'U')}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[110px]">
                      {user.companyName || user.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      {user.role === 'company' ? 'Merchant' : user.role}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/business"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border-zinc-200/80 transition-colors"
                  title="Merchant & Seller Portal"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Merchant Portal</span>
                </Link>

                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs transition-transform active:scale-[0.98]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}

            {/* AI Shopping Concierge Launcher */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                window.dispatchEvent(new CustomEvent('open-ai-assistant'));
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border border-zinc-200/80 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              title="Open AI Shopping Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span className="hidden md:inline">AI Assistant</span>
            </button>

            {/* Wishlist Button */}
            {user?.role !== 'company' && (
              <button
                type="button"
                onClick={toggleWishlistDrawer}
                className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all relative cursor-pointer group"
                title="My Wishlist & Price Tracker"
              >
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform text-zinc-700 group-hover:text-zinc-950" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-950 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
                {priceDropCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-zinc-900 ring-2 ring-white animate-pulse" />
                )}
              </button>
            )}

            {/* Notification Center Button */}
            <button
              type="button"
              onClick={toggleNotifications}
              className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all relative cursor-pointer group"
              title="Notification Center"
            >
              <Bell className="w-5 h-5 group-hover:scale-105 transition-transform text-zinc-700 group-hover:text-zinc-950" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-950 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all relative cursor-pointer group"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform text-zinc-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-950 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3 pt-1">
          <SearchAutocomplete />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
