import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { Heart, X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';

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
    <div className="fixed inset-0 z-50 overflow-hidden font-satoshi select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1E1E1E]/75 backdrop-blur-xs transition-opacity"
        onClick={closeWishlist}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-md bg-[#E4E2DD] border-l-2 border-[#1E1E1E] text-[#1E1E1E] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b-2 border-[#1E1E1E] flex items-center justify-between bg-[#FFFFFF]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1E1E1E] text-[#FF89A9] flex items-center justify-center">
                <Heart className="w-4 h-4 fill-[#FF89A9]" />
              </div>
              <div>
                <h2 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E] flex items-center gap-2">
                  SAVED ARCHIVE
                  <span className="text-[10px] px-2 py-0.5 bg-[#1E1E1E] text-[#E4E2DD] font-mono font-bold">
                    {wishlistCount}
                  </span>
                </h2>
                <p className="text-[10px] text-[#444444] uppercase tracking-wider font-mono">
                  CURATED SELECTION & PRICE RADAR
                </p>
              </div>
            </div>
            <button
              onClick={closeWishlist}
              className="p-2 text-[#1E1E1E] hover:text-[#DB4A2B] hover:bg-[#E4E2DD] transition cursor-pointer"
              aria-label="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Drops Banner */}
          {priceDropCount > 0 && (
            <div className="bg-[#DB4A2B] text-[#FFFFFF] px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <span>{priceDropCount} ITEM{priceDropCount > 1 ? 'S' : ''} ON PRICE DROP MARKDOWN</span>
              </div>
              <span className="bg-[#FFFFFF] text-[#DB4A2B] px-2 py-0.5 text-[9px] font-bold">
                RADAR ALERT
              </span>
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#FFFFFF] border-2 border-[#1E1E1E] flex items-center justify-center mx-auto text-[#1E1E1E]">
                  <Heart className="w-8 h-8 text-[#FF89A9]" />
                </div>
                <h3 className="font-clash text-base font-bold uppercase tracking-tight text-[#1E1E1E]">
                  ARCHIVE IS EMPTY
                </h3>
                <p className="text-xs text-[#444444] max-w-xs mx-auto leading-relaxed">
                  Save seasonal silhouettes, designer drops, and receive automatic price reduction alerts.
                </p>
                <BrutalistButton
                  onClick={() => {
                    closeWishlist();
                    navigate('/');
                  }}
                  variant="primary"
                  size="md"
                >
                  EXPLORE ARCHIVE
                </BrutalistButton>
              </div>
            ) : (
              items.map((item) => {
                const isDropped = item.isPriceDropped;
                return (
                  <div
                    key={item.productId}
                    className="p-3.5 bg-[#FFFFFF] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] transition flex space-x-3.5 relative group"
                  >
                    {/* Thumbnail: 3:4 aspect */}
                    <div className="w-16 h-20 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
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
                            className="font-clash text-xs font-bold uppercase tracking-tight text-[#1E1E1E] truncate cursor-pointer hover:text-[#DB4A2B] transition"
                          >
                            {item.title}
                          </h4>
                          <button
                            onClick={() => removeFromWishlist(item.productId)}
                            className="text-[#444444] hover:text-[#DB4A2B] transition p-1 cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] font-mono text-[#444444] uppercase mt-0.5">
                          {item.companyName || 'VERIFIED ORIGIN'}
                        </p>
                      </div>

                      {/* Pricing & Price Drop Tag */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-baseline space-x-1.5 font-mono">
                          <span className="text-sm font-bold text-[#1E1E1E]">
                            ${Number(item.currentPrice || item.priceAtAdd || 0).toFixed(2)}
                          </span>
                          {isDropped && (
                            <>
                              <span className="text-[10px] text-[#444444] line-through">
                                ${Number(item.priceAtAdd).toFixed(2)}
                              </span>
                              <span className="text-[9px] font-bold text-[#FFFFFF] bg-[#DB4A2B] px-1 py-0.5">
                                -{item.discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        {/* Move to Cart */}
                        <button
                          onClick={() => moveToCartAndNotify(item.productId)}
                          className="px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>TO BAG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer Link to full Wishlist Page */}
          {items.length > 0 && (
            <div className="p-4 bg-[#FFFFFF] border-t-2 border-[#1E1E1E]">
              <button
                type="button"
                onClick={() => {
                  closeWishlist();
                  navigate('/wishlist');
                }}
                className="w-full py-3 text-center border-2 border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>VIEW COMPLETE REGISTRY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistDrawer;
