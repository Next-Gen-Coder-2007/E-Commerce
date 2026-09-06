import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { wishlistService, WishlistItem, WishlistResponse } from '../services/wishlistService';
import { Heart, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const WishlistPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken?: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const {
    wishlist: myWishlist,
    removeFromWishlist,
    moveToCartAndNotify,
    refreshWishlist,
  } = useWishlist();

  const isSharedView = Boolean(shareToken);
  const [sharedWishlist, setSharedWishlist] = useState<WishlistResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  useEffect(() => {
    if (isSharedView && shareToken) {
      wishlistService
        .getSharedWishlist(shareToken)
        .then((res) => {
          setSharedWishlist(res);
        })
        .catch((err) => {
          console.warn('Failed to load shared wishlist:', err);
        });
    }
  }, [isSharedView, shareToken]);

  const activeWishlist = isSharedView ? sharedWishlist : myWishlist;
  const items: WishlistItem[] = activeWishlist?.items || [];

  const categories: string[] = ['all', ...Array.from(new Set(items.map((i: WishlistItem) => i.category || 'general')))];

  const filteredItems: WishlistItem[] =
    selectedCategory === 'all'
      ? items
      : items.filter((i: WishlistItem) => (i.category || 'general').toLowerCase() === selectedCategory.toLowerCase());

  const priceDropItems = items.filter((i: WishlistItem) => i.isPriceDropped);

  const handleToggleShare = async () => {
    if (!myWishlist) return;
    try {
      setIsPublicLoading(true);
      await wishlistService.togglePublicShare(!myWishlist.isPublic);
      await refreshWishlist();
    } catch (err) {
      console.error('Failed to update share settings:', err);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!myWishlist?.shareToken) return;
    const url = `${window.location.origin}/wishlist/shared/${myWishlist.shareToken}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleMoveAllToCart = () => {
    items.forEach((item: WishlistItem) => {
      addToCart({
        productId: item.productId,
        title: item.title,
        price: item.currentPrice || item.priceAtAdd,
        image: item.image || '',
        quantity: 1,
        category: item.category || 'general',
        stock: 99,
      });
    });
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <Heart className="w-3.5 h-3.5 text-zinc-700" />
              <span>{isSharedView ? 'Shared Gift Registry' : 'Saved Items'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {isSharedView ? 'Public Wishlist Registry' : 'My Wishlist'}
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-xl">
              {isSharedView
                ? 'Browse items curated by a fellow shopper and add them directly to your cart.'
                : 'Track items for later, check real-time stock availability, and receive price drop alerts.'}
            </p>
          </div>

          {/* Sharing & Move All Actions */}
          {!isSharedView && myWishlist && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleShare}
                disabled={isPublicLoading}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  myWishlist.isPublic
                    ? 'bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span>{myWishlist.isPublic ? 'Public Registry (Active)' : 'Private Registry'}</span>
              </button>

              {myWishlist.isPublic && myWishlist.shareToken && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isCopied ? 'Link Copied' : 'Copy Share Link'}</span>
                </button>
              )}

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleMoveAllToCart}
                  className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Move All to Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="pt-5 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Total Saved</span>
            <p className="text-xl font-bold text-zinc-950 mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Price Drops</span>
            <p className="text-xl font-bold text-zinc-950 mt-0.5">{priceDropItems.length} on sale</p>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Estimated Value</span>
            <p className="text-xl font-bold font-mono text-zinc-950 mt-0.5">
              ${items.reduce((sum: number, i: WishlistItem) => sum + (i.currentPrice || i.priceAtAdd || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat: string) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-zinc-950 text-white'
                  : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-900">No items found in this section</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Browse the catalog to add items to your wishlist and receive price drop alerts.
            </p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition inline-block"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item: WishlistItem) => {
            const isDropped = item.isPriceDropped;
            return (
              <div
                key={item.productId}
                className="rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-300 transition overflow-hidden flex flex-col group relative shadow-2xs"
              >
                {/* Price drop badge */}
                {isDropped && (
                  <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-900 text-white font-mono font-semibold text-[10px] uppercase px-2 py-0.5 rounded-md">
                    <span>SAVE {item.discountPct}%</span>
                  </div>
                )}

                {/* Remove Button */}
                {!isSharedView && (
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-white/90 backdrop-blur-xs border border-zinc-200 text-zinc-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Image */}
                <div
                  onClick={() => navigate(`/product/${item.productId}`)}
                  className="aspect-square bg-zinc-100 overflow-hidden cursor-pointer flex items-center justify-center relative"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {item.category || 'General'}
                    </span>
                    <h3
                      onClick={() => navigate(`/product/${item.productId}`)}
                      className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition cursor-pointer mt-0.5 line-clamp-2"
                    >
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{item.companyName || 'Verified Merchant'}</p>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-2 border-t border-zinc-100">
                    <div className="flex items-baseline gap-1.5 mb-2.5">
                      <span className="text-sm font-mono font-bold text-zinc-950">
                        ${Number(item.currentPrice || item.priceAtAdd || 0).toFixed(2)}
                      </span>
                      {isDropped && (
                        <span className="text-xs font-mono text-zinc-400 line-through">
                          ${Number(item.priceAtAdd).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => moveToCartAndNotify(item.productId)}
                      className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
