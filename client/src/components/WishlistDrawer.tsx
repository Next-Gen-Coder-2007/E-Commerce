import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Heart, X, Trash2, ArrowRight } from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    wishlistCount,
    priceDropCount,
    isWishlistOpen,
    closeWishlist,
    removeFromWishlist,
    moveToCartAndNotify,
  } = useWishlist();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity"
        onClick={closeWishlist}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-zinc-200 text-zinc-900 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200/80 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-900">
                <Heart className="w-4 h-4 fill-neutral-900" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                  My Wishlist
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-950 text-white font-bold">
                    {wishlistCount}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">Saved items & real-time price tracker</p>
              </div>
            </div>
            <button
              onClick={closeWishlist}
              className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition cursor-pointer"
              aria-label="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Drops Banner */}
          {priceDropCount > 0 && (
            <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-2.5 flex items-center justify-between text-neutral-800 text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <span>
                  <strong>{priceDropCount} item{priceDropCount > 1 ? 's' : ''}</strong> on price drop sale!
                </span>
              </div>
              <span className="bg-neutral-950 text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Price Alert
              </span>
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">Your wishlist is empty</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Explore products and tap the heart icon to track price drops and save for later.
                </p>
                <button
                  onClick={() => {
                    closeWishlist();
                    navigate('/');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Discover Products
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isDropped = item.isPriceDropped;
                return (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 transition flex space-x-3.5 relative group shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="w-18 h-18 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => {
                              closeWishlist();
                              navigate(`/product/${item.productId}`);
                            }}
                            className="text-xs font-bold text-zinc-900 truncate cursor-pointer hover:text-indigo-600 transition"
                          >
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeFromWishlist(item.productId)}
                            className="text-zinc-400 hover:text-rose-600 transition p-1 cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.companyName || 'Direct Supplier'}</p>
                      </div>

                      {/* Pricing & Price Drop Tag */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-sm font-mono font-black text-zinc-950">
                            ${Number(item.currentPrice || item.priceAtAdd || 0).toFixed(2)}
                          </span>
                          {isDropped && (
                            <>
                              <span className="text-[10px] font-mono text-zinc-400 line-through">
                                ${Number(item.priceAtAdd).toFixed(2)}
                              </span>
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                -{item.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        {/* Move to Cart */}
                        <button
                          onClick={() => moveToCartAndNotify(item.productId)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                        >
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-zinc-200/80 bg-zinc-50/50 space-y-2">
              <button
                onClick={() => {
                  closeWishlist();
                  navigate('/wishlist');
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>View Full Wishlist & Share Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={closeWishlist}
                className="w-full py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold transition cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
