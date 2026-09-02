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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">
              <span>{isSharedView ? 'Shared Gift Registry' : 'Saved Items Hub'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              {isSharedView ? 'Public Wishlist Registry' : 'My Wishlist & Saved Items'}
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-xl">
              {isSharedView
                ? 'Browse items curated by a fellow shopper and add directly to your cart.'
                : 'Track live warehouse availability and get instant alerts when item prices drop.'}
            </p>
          </div>

          {/* Sharing & Move All Actions */}
          {!isSharedView && myWishlist && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleToggleShare}
                disabled={isPublicLoading}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center space-x-2 cursor-pointer ${
                  myWishlist.isPublic
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span>{myWishlist.isPublic ? 'Public Registry (Active)' : 'Private Registry'}</span>
              </button>

              {myWishlist.isPublic && myWishlist.shareToken && (
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold transition flex items-center space-x-2 cursor-pointer shadow-2xs"
                >
                  <span>{isCopied ? 'Link Copied' : 'Copy Share Link'}</span>
                </button>
              )}

              {items.length > 0 && (
                <button
                  onClick={handleMoveAllToCart}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Move All to Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="pt-6 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Saved</span>
            <p className="text-2xl font-black text-zinc-950 mt-1">{items.length} Items</p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60">
            <span className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">Price Drops</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{priceDropItems.length} On Sale</p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 col-span-2 sm:col-span-1">
            <span className="text-xs text-indigo-600 uppercase tracking-wider font-semibold">Estimated Value</span>
            <p className="text-2xl font-black text-zinc-950 mt-1">
              ${items.reduce((sum: number, i: WishlistItem) => sum + (i.currentPrice || i.priceAtAdd || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-zinc-950 text-white shadow-xs'
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
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">No items found in this section</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Browse the catalog to add items to your wishlist and receive price drop alerts.
            </p>
          </div>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition inline-block shadow-xs"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item: WishlistItem) => {
            const isDropped = item.isPriceDropped;
            return (
              <div
                key={item.productId}
                className="rounded-3xl bg-white border border-zinc-200/80 hover:border-zinc-300 transition overflow-hidden flex flex-col group relative shadow-xs hover:shadow-xl"
              >
                {/* Price drop badge */}
                {isDropped && (
                  <div className="absolute top-3 left-3 z-10 bg-rose-600 text-white font-mono font-bold text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md">
                    <span>SAVE {item.discountPct}%</span>
                  </div>
                )}

                {/* Remove Button */}
                {!isSharedView && (
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-zinc-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Image */}
                <div
                  onClick={() => navigate(`/product/${item.productId}`)}
                  className="h-56 bg-zinc-100 overflow-hidden cursor-pointer flex items-center justify-center relative"
                >
                  <img
                    src={item.image || 'https://via.placeholder.com/300'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {item.category || 'General'}
                    </span>
                    <h3
                      onClick={() => navigate(`/product/${item.productId}`)}
                      className="text-sm font-bold text-zinc-900 hover:text-indigo-600 transition cursor-pointer mt-1 line-clamp-2"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">{item.companyName || 'Verified Merchant'}</p>
                  </div>

                  {/* Price & Actions */}
                  <div>
                    <div className="flex items-baseline space-x-2 mb-3">
                      <span className="text-lg font-mono font-black text-zinc-950">
                        ${Number(item.currentPrice || item.priceAtAdd || 0).toFixed(2)}
                      </span>
                      {isDropped && (
                        <span className="text-xs font-mono text-zinc-400 line-through">
                          ${Number(item.priceAtAdd).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => moveToCartAndNotify(item.productId)}
                      className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <span>Move to Cart</span>
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
