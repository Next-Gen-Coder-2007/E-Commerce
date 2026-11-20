import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  X,
  Search,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { wishlistCount, toggleWishlistDrawer, priceDropCount } = useWishlist();
  const { unreadCount, toggleNotifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? 'bg-[#E4E2DD]/95 backdrop-blur-md border-b-2 border-[#1E1E1E] shadow-sm'
            : 'bg-[#E4E2DD] border-b border-[#1E1E1E]/20'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="h-18 flex items-center justify-between gap-4">
            {/* Left: Brand Identity in Clash Display */}
            <div className="flex items-center gap-8 shrink-0">
              <Link
                to="/"
                className="group flex items-baseline gap-2.5 select-none"
              >
                <span className="font-clash text-xl sm:text-2xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] group-hover:text-[#DB4A2B] transition-colors duration-200">
                  NOVA COMMERCE
                </span>
                <span className="hidden sm:inline-block font-satoshi text-[10px] font-bold uppercase tracking-widest text-[#DB4A2B] border-l border-[#1E1E1E]/30 pl-2">
                  STORE
                </span>
              </Link>

              {/* Desktop Minimal Navigation Links */}
              <nav className="hidden lg:flex items-center gap-7 font-satoshi text-xs font-bold uppercase tracking-widest text-[#444444]">
                <Link
                  to="/categories"
                  className={`hover:text-[#DB4A2B] transition-colors duration-200 pb-0.5 border-b-2 ${
                    location.pathname === '/categories' ? 'border-[#DB4A2B] text-[#1E1E1E]' : 'border-transparent'
                  }`}
                >
                  DEPARTMENTS
                </Link>
                <Link
                  to="/deals"
                  className={`hover:text-[#DB4A2B] transition-colors duration-200 pb-0.5 border-b-2 flex items-center gap-1.5 ${
                    location.pathname === '/deals' ? 'border-[#DB4A2B] text-[#1E1E1E]' : 'border-transparent'
                  }`}
                >
                  <span className="w-1.5 h-1.5 bg-[#DB4A2B] animate-pulse" />
                  <span>PROMOTIONS</span>
                </Link>
                <Link
                  to="/store/verified"
                  className="hover:text-[#DB4A2B] transition-colors duration-200 border-b-2 border-transparent"
                >
                  MERCHANT STORES
                </Link>
              </nav>
            </div>

            {/* Center: Brutalist Search Autocomplete */}
            <div className="flex-1 max-w-md hidden md:flex items-center justify-center">
              <SearchAutocomplete />
            </div>

            {/* Right: Actions, Wishlist, Cart, Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 text-[#1E1E1E] hover:text-[#DB4A2B] cursor-pointer"
                aria-label="Toggle Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* AI Assistant Button */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                  window.dispatchEvent(new CustomEvent('open-ai-assistant'));
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#1E1E1E] border border-[#1E1E1E]/30 bg-[#FFFFFF] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] transition-all duration-200 cursor-pointer"
                title="Open AI Shopping Concierge"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DB4A2B]" />
                <span className="hidden xl:inline">AI CONCIERGE</span>
              </button>

              {/* Authentication / User State */}
              {loading ? (
                <div className="h-8 w-20 bg-[#D9D6D0] animate-pulse rounded-none" />
              ) : user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {user.role === 'company' ? (
                    <Link
                      to="/business"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#E4E2DD] bg-[#1E1E1E] hover:bg-[#DB4A2B] transition-colors"
                      title="Merchant Dashboard"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">MERCHANT HUB</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E1E1E] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] bg-[#FFFFFF] transition-colors"
                        title="Addresses & Profile"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#DB4A2B]" />
                        <span className="hidden lg:inline">ADDRESSES</span>
                      </Link>

                      <Link
                        to="/orders"
                        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E1E1E] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] bg-[#FFFFFF] transition-colors"
                        title="Orders & Shipments"
                      >
                        <Package className="w-3.5 h-3.5 text-[#1E1E1E]" />
                        <span className="hidden lg:inline">ORDERS</span>
                      </Link>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E1E1E] border-2 border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] transition-colors"
                      title="Administration Portal"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#DB4A2B]" />
                      <span className="hidden sm:inline">ADMIN</span>
                    </Link>
                  )}

                  {/* User Profile Pill */}
                  <Link
                    to={user.role === 'company' ? '/business' : user.role === 'admin' ? '/admin' : '/profile'}
                    className="flex items-center gap-2 px-2.5 py-1.5 border border-[#1E1E1E]/30 bg-[#FFFFFF] hover:border-[#1E1E1E] transition-colors"
                    title="Account Settings"
                  >
                    <div className="w-5 h-5 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center font-bold text-[10px]">
                      {user.role === 'company' ? 'M' : user.role === 'admin' ? 'A' : (user.name ? user.name.trim().charAt(0).toUpperCase() : 'U')}
                    </div>
                    <span className="hidden sm:inline font-satoshi text-xs font-bold uppercase tracking-wider text-[#1E1E1E] truncate max-w-[90px]">
                      {user.companyName || user.name?.split(' ')[0]}
                    </span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 text-[#444444] hover:text-[#DB4A2B] transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/business"
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#444444] hover:text-[#1E1E1E] transition-colors"
                  >
                    <span>MERCHANT</span>
                  </Link>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors"
                  >
                    SIGN IN
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-[#E4E2DD] bg-[#1E1E1E] hover:bg-[#DB4A2B] transition-colors duration-200"
                  >
                    JOIN
                  </Link>
                </div>
              )}

              {/* Wishlist Button */}
              {user?.role !== 'company' && (
                <button
                  type="button"
                  onClick={toggleWishlistDrawer}
                  className="relative p-2.5 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#FFFFFF] border border-transparent hover:border-[#1E1E1E]/20 transition-all cursor-pointer"
                  title="Wishlist & Price Tracker"
                >
                  <Heart className="w-4.5 h-4.5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#1E1E1E] text-[#E4E2DD] font-mono text-[9px] font-bold flex items-center justify-center border border-[#FFFFFF]">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                  {priceDropCount > 0 && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#DB4A2B] animate-ping" />
                  )}
                </button>
              )}

              {/* Notifications Button */}
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative p-2.5 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#FFFFFF] border border-transparent hover:border-[#1E1E1E]/20 transition-all cursor-pointer"
                title="Notification Alerts"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#DB4A2B] text-[#E4E2DD] font-mono text-[9px] font-bold flex items-center justify-center border border-[#FFFFFF]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Shopping Bag Button */}
              <button
                type="button"
                onClick={openCart}
                className="relative p-2.5 text-[#E4E2DD] bg-[#1E1E1E] hover:bg-[#DB4A2B] transition-colors cursor-pointer"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#DB4A2B] text-[#E4E2DD] font-mono text-[10px] font-bold flex items-center justify-center border border-[#FFFFFF]">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#1E1E1E] hover:text-[#DB4A2B] cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Expandable Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden py-3 border-t border-[#1E1E1E]/15">
              <SearchAutocomplete />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Editorial Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#E4E2DD] pt-20 px-6 pb-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-6">
            <div className="pb-4 border-b border-[#1E1E1E]/20">
              <span className="font-clash text-2xl font-bold uppercase tracking-tight text-[#1E1E1E]">
                CATALOG DIRECTORY
              </span>
            </div>

            <nav className="flex flex-col space-y-4 font-satoshi text-base font-bold uppercase tracking-widest text-[#1E1E1E]">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
              >
                <span>HOMEPAGE / EDITORIAL</span>
                <span className="font-mono text-xs text-[#444444]">01</span>
              </Link>
              <Link
                to="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
              >
                <span>ALL 24 DEPARTMENTS</span>
                <span className="font-mono text-xs text-[#444444]">02</span>
              </Link>
              <Link
                to="/deals"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#DB4A2B] animate-pulse" />
                  <span>MARKETPLACE PROMOTIONS</span>
                </span>
                <span className="font-mono text-xs text-[#444444]">03</span>
              </Link>
              <Link
                to="/business"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
              >
                <span>MERCHANT & SELLER PORTAL</span>
                <span className="font-mono text-xs text-[#444444]">04</span>
              </Link>
              {user && (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
                  >
                    <span>MY ORDERS & SHIPMENTS</span>
                    <span className="font-mono text-xs text-[#444444]">05</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-[#DB4A2B] transition-colors py-1 flex items-center justify-between border-b border-[#1E1E1E]/10"
                  >
                    <span>ACCOUNT SETTINGS</span>
                    <span className="font-mono text-xs text-[#444444]">06</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="pt-8 border-t border-[#1E1E1E]/20 space-y-4">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                window.dispatchEvent(new CustomEvent('open-ai-assistant'));
              }}
              className="w-full py-3.5 bg-[#FFFFFF] border-2 border-[#1E1E1E] text-[#1E1E1E] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#DB4A2B]" />
              <span>LAUNCH AI SHOPPING CONCIERGE</span>
            </button>

            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest text-[#1E1E1E]"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center bg-[#1E1E1E] text-[#E4E2DD] text-xs font-bold uppercase tracking-widest"
                >
                  REGISTER
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-3 text-center border border-[#DB4A2B] text-[#DB4A2B] text-xs font-bold uppercase tracking-widest"
              >
                SIGN OUT
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
